class TurbonomicActionUtils {

    public type: string;
    private _log: x_turbo_turbonomic.Logger;
    private _turbonomicActionDao: TurbonomicActionDAO;
    private _turbonomicGlide: TurbonomicGlide;
    public static readonly PROXY_VM_PREFIX: string = 'ProxyVM-For-';
    public static readonly PROXY_DB_PREFIX: string = 'ProxyDB-For-';


    constructor() {
        this._log = new x_turbo_turbonomic.Logger();
        this.type = 'TurbonomicActionUtils';
        this._turbonomicGlide = new TurbonomicGlide();
    }

    /**
     * Update the state of the input Action Approval record, based on the state changes of its matching request.
     *
     * @param changeRequest The input change request.
     */
    updateApprovalBasedOnRequestStateChange (changeRequest): void {
        var dao = new TurbonomicActionDAO();
        if (dao.isChangeRequestDisabled()) {
            this._log.debug(
              "Change request and matching action approval state changes are handled by custom business rule(s)"
            );
            return;
        }
        var actionApproval = this._turbonomicGlide.accessTable('x_turbo_turbonomic_turbonomic_action_approval');
        actionApproval.addQuery('change_request_id', changeRequest.sys_id);
        actionApproval.query();
        
        if (actionApproval.next()) {
            let approvalSysId = actionApproval.getValue("sys_id");
            let actionStateId: string = '';
            let changeRequestState: string = changeRequest.state + '';
            let actionApprovalState: string = dao.getActionStateById(actionApproval.state_id);

            let approvedRequestState = dao.getSettingValue('approved_cr_state');
            if (approvedRequestState == '') {
                approvedRequestState = TurbonomicChangeRequestState.SCHEDULED;
            }

            let canceledRequestState = dao.getSettingValue('canceled_cr_state');
            if (canceledRequestState == '') {
                canceledRequestState = TurbonomicChangeRequestState.CANCELLED;
            }

            this._log.debug('Change Request State = ' + changeRequestState + ', matching action approval state = ' +
                    actionApprovalState + '; CR number = ' + changeRequest.number);

            switch (changeRequestState) {
                case approvedRequestState:
                    if (actionApprovalState == TurbonomicActionApprovalState.PENDING_APPROVAL ||
                        actionApprovalState == TurbonomicActionApprovalState.WAITING_FOR_CR_SCHEDULE) {
                        if (changeRequest.start_date == null || this.isChangeRequestScheduleOn(changeRequest)) {
                            actionStateId = dao.getActionStateId('APPROVED');
                        } else {
                            actionStateId = dao.getActionStateId('WAITING_FOR_CR_SCHEDULE');
                        }

                        dao.insertIntoImportSet(
                            TurbonomicTableNames.ACTION_APPROVAL_IMPORT_SET,
                            {
                              u_update_sys_id: approvalSysId, // use the sysId to update
                              u_state: actionStateId
                            },
                            "Successfully APPROVED the matching action approval entry for change request: " +
                              changeRequest.number
                        );
                    } else {
                        this._log.debug('For ' + changeRequest.number + ' request, the matching action approval record state is: ' +
                                actionApprovalState);
                    }
                    break;
                case canceledRequestState:
                    if (actionApprovalState == TurbonomicActionApprovalState.PENDING_APPROVAL ||
                        actionApprovalState == TurbonomicActionApprovalState.WAITING_FOR_CR_SCHEDULE) {
                        actionStateId = dao.getActionStateId('REJECTED');
                        dao.insertIntoImportSet(
                            TurbonomicTableNames.ACTION_APPROVAL_IMPORT_SET,
                            {
                              u_update_sys_id: approvalSysId, // use the sysId to update
                              u_state: actionStateId
                            },
                            "Successfully REJECTED the matching action approval entry for change request: " + changeRequest.number
                        );
                    } else {
                        this._log.debug('For ' + changeRequest.number + ' request, the matching action approval record state is: ' +
                                actionApprovalState);
                    }
                    break;
                default:
                    this._log.debug('CR state = ' + changeRequestState);
            }
        } else {
            this._log.debug('No action approval found for change request: ' + changeRequest.number);
        }
    }

    /**
     * Update the state of the matching Action Approval record for the input change request,
     * based on the CR schedule changes.
     *
     * @param changeRequest The input change request.
     */
    updateApprovalBasedOnRequestSchedule (changeRequest): void {
        var dao = new TurbonomicActionDAO();
        let changeRequestCurrentState = changeRequest.state;

        this._log.debug('Current CR state = ' + this.printRequestState(changeRequestCurrentState));

        if (dao.isChangeRequestDisabled()) {
            this._log.debug('Change request schedule and matching action approval state changes' +
                    'are handled by custom business rule(s)');
            return;
        }

        let approvedRequestState = dao.getSettingValue('approved_cr_state');
        if (approvedRequestState == '') {
            approvedRequestState = TurbonomicChangeRequestState.SCHEDULED;
        }

        //this._log.debug('Turbonomic Approved CR State = ' + this.printRequestState(approvedRequestState));

        if ((changeRequestCurrentState !== approvedRequestState) &&
            (changeRequestCurrentState !== TurbonomicChangeRequestState.IMPLEMENT)) {
            this._log.debug('Change request ' + changeRequest.number + 'has not been approved yet:' +
                    'Current CR state is not SCHEDULED or IMPLEMENT');
            return;
        } else {
            this._log.debug('Change request ' + changeRequest.number + ' has been approved or set to IMPLEMENT state');
        }

        if (changeRequest.start_date == null) {
            this._log.debug('Planned start date is missing or invalid for change request: ' + changeRequest.number);
            this.approveActionWaitingForChangeRequestSchedule(changeRequest.sys_id);
            return;
        }

        if (this.isChangeRequestScheduleOn(changeRequest)) {
            this._log.debug('Schedule is ON for change request: + ' + changeRequest.number);
            this.approveActionWaitingForChangeRequestSchedule(changeRequest.sys_id);
        } else {
            this._log.debug('Schedule is OFF for change request: + ' + changeRequest.number);
            var actionApproval = this._turbonomicGlide.accessTable('x_turbo_turbonomic_turbonomic_action_approval');
            actionApproval.addQuery('change_request_id', changeRequest.sys_id);
            actionApproval.query();

            if (actionApproval.next()) {
                this._log.debug('Matching Action Approval found for change request: ' + changeRequest.number);
                let actionApprovalState = dao.getActionStateById(actionApproval.state_id);
                let actionStateId = dao.getActionStateId(TurbonomicActionApprovalState.WAITING_FOR_CR_SCHEDULE);
                let approvalSysId = actionApproval.getValue('sys_id');

                if (actionApprovalState == TurbonomicActionApprovalState.PENDING_APPROVAL) {
                    dao.insertIntoImportSet('x_turbo_turbonomic_ws_action_approval',
                        {
                            u_update_sys_id: approvalSysId,
                            u_state: actionStateId
                        },
                        'Set to WAITING_FOR_CR_SCHEDULE state the matching Turbonomic action for change request: ' +
                         changeRequest.number
                    );
                    this._log.debug('Successfully set the state to WAITING_FOR_CR_SCHEDULE' +
                             'for the matching approval of change request: ' + changeRequest.number);
                }
            }
        }
    }

    /**
     * Set the state of the matching action approval, for the change request with the input ID, to APPROVED. This operation is applied only
     * if the current action approval state is PENDING_APPROVAL or WAITING_FOR_CR_SCHEDULE.
     *
     * @param id The change request system id.
     */
    approveActionWaitingForChangeRequestSchedule = function(id: string) {
        var actionApproval = this._turbonomicGlide.accessTable('x_turbo_turbonomic_turbonomic_action_approval');
        actionApproval.addQuery('change_request_id', id);
        actionApproval.query();

        if (actionApproval.next()) {
        	var dao = new TurbonomicActionDAO();
        	let actionApprovalState: string = dao.getActionStateById(actionApproval.state_id);
            var actionStateId = dao.getActionStateId('APPROVED');
            var approvalSysId = actionApproval.getValue("sys_id");

            this._log.debug('Current action approval state is: ' + actionApprovalState);
            if (actionApprovalState == TurbonomicActionApprovalState.PENDING_APPROVAL ||
                actionApprovalState == TurbonomicActionApprovalState.WAITING_FOR_CR_SCHEDULE) {
                dao.insertIntoImportSet(TurbonomicTableNames.ACTION_APPROVAL_IMPORT_SET,
                    {
                        u_update_sys_id: approvalSysId,
                        u_state: actionStateId
                    },
                    'Successfully APPROVED the matching action approval entry for change request with ID: ' + id
                );
                this._log.debug('Successfully set the action approval state to APPROVED');
            }
		}
    }

    /**
     * Helper function that returns true if the current system time is within the [start_date, end_date] range
     * of the input change request, false otherwise.
     *
     * @param changeRequest The input change request record.
     *
     * @return true If the change request schedule is on, false otherwise.
     */
    isChangeRequestScheduleOn = function(changeRequest) {
    	var dao = new TurbonomicActionDAO();

        if (changeRequest.start_date) {
            var startDate = this._turbonomicGlide.newDateTime(changeRequest.start_date).getNumericValue();
            var currentTime = this._turbonomicGlide.newDateTime().getNumericValue();

            if (changeRequest.end_date) {
                var endDate = this._turbonomicGlide.newDateTime(changeRequest.end_date).getNumericValue();

                if (startDate <= currentTime && currentTime <= endDate) {
                    this._log.debug('Schedule is ON for change request: ' + changeRequest.number);
                    return true;
                }
                this._log.debug('Schedule is OFF for change request: ' + changeRequest.number);
            } else {
                if (startDate <= currentTime) {
                    this._log.debug('End date is not set but schedule is ON for change request: ' + changeRequest.number);
                    return true;
                }
                this._log.debug('End date is not set and Schedule is OFF for change request: ' + changeRequest.number);
            }
        }

        this._log.debug('Schedule is OFF for change request: ' + changeRequest.number);
        return false;
    }

    /**
     * Helper function that returns true if the action retention time is still on, false otherwise.
     *
     * @param lastUpdateActionTime The last update time value for an action record or approval.
     *
     * @return true If the retention time is still on, false otherwise.
     */
    isActionRetentionTimeOn (lastUpdateActionTime: string): boolean {
        let dao: TurbonomicActionDAO = new TurbonomicActionDAO();
        let lastUpdateTimestamp = this._turbonomicGlide.newDateTime(lastUpdateActionTime).getNumericValue();
        let currentTimestamp = this._turbonomicGlide.newDateTime().getNumericValue();

        let deltaTime: number = currentTimestamp - lastUpdateTimestamp;

        let retentionTimeMsec: number = 60 * 60 * 1000;
        let actionRetentionTime: string = dao.getSettingValue('action_retention_time');
        if (actionRetentionTime) {
            retentionTimeMsec = parseInt(actionRetentionTime) * 1000;
        }

        if (deltaTime < retentionTimeMsec) {
            return true;
        }

        return false;
    }

    /**
     * Helper function that returns true if the action execution recovery time is on, false otherwise.
     *
     * @param actionOid The OID of the action approval for which we check the action execution recovery.
     *        Basically, if we find an action approval with the input OID that failed its execution in the
     *        past X hours, where X is defined by the action_execution_recovery_time application setting,
     *        this function returns true, otherwise false.
     *
     * @return true If the action execution recovery time is on for the action with the input OID, false otherwise.
     */
    isActionExecutionRecoveryTimeOn (actionOid: string): boolean {
        let dao: TurbonomicActionDAO = new TurbonomicActionDAO();

        var actionApproval = this._turbonomicGlide.accessTable('x_turbo_turbonomic_turbonomic_action_approval');
        actionApproval.addQuery('oid', actionOid);
        actionApproval.addQuery('state_id', dao.getActionStateId('FAILED'));
        actionApproval.orderByDesc('sys_updated_on');
        actionApproval.query();

        if (actionApproval) {
            var lastUpdateDateTime = this._turbonomicGlide.newDateTime(actionApproval.sys_updated_on);
            var lastUpdateTimestamp = lastUpdateDateTime.getNumericValue();

            var currentTimestamp =this._turbonomicGlide.newDateTime();

            var deltaTime = currentTimestamp - lastUpdateTimestamp;

            var recoveryTimeMsec = 24 * 60 * 60 * 1000;
            var actionExecutionRecoveryTime = dao.getSettingValue('action_execution_recovery_time');
            if (actionExecutionRecoveryTime) {
                recoveryTimeMsec = parseInt(actionExecutionRecoveryTime) * 1000;
            }

            if (deltaTime < recoveryTimeMsec) {
            	this._log.debug("Action Execution Recovery Time is ON for action with OID: " + actionOid);
                return true;
            }            
        }

        this._log.debug("Action Execution Recovery Time is no longer ON for action with OID: " + actionOid);
        return false;
    }

    /**
     * Print the change request state as a string value.
     *
     * @param state The input change request state based on the new model values (e.g. '-1', '0').
     *
     * @return The change request state as a string (e.g. 'IMPLEMENT', 'REVIEW').
     */
    printRequestState (state: TurbonomicChangeRequestState) {
        switch (state) {
            case TurbonomicChangeRequestState.NEW:
                return 'NEW';
            case TurbonomicChangeRequestState.ASSESS:
                return 'ASSESS';
            case TurbonomicChangeRequestState.AUTHORIZE:
                return 'AUTHORIZE';
            case TurbonomicChangeRequestState.SCHEDULED :
                return 'SCHEDULED';
            case TurbonomicChangeRequestState.IMPLEMENT:
                return 'IMPLEMENT';
            case TurbonomicChangeRequestState.REVIEW:
                return 'REVIEW';
            case TurbonomicChangeRequestState.CLOSED:
                return 'CLOSED';
            case TurbonomicChangeRequestState.CANCELLED :
                return 'CANCELLED';
            default :
                this._log.warn('TurbonomicActionUtils.printRequestState() - Unknown change request state: ' + state);
                return state;
        }
    }

    /**
     * Return an object containing the input "from" and "to" values, if they are non-empty strings.
     * Otherwise, we parse the input description string and populate the "from" and "to" values from there.
     *
     * @param from The input from value (e.g. "1GB").
     * @param to The input to value (e.g. "2GB").
     * @param description The input description (e.g. "Increase VMEM from 1GB to 2GB for virtual machine VM1").
     *
     * @return The input from and to values if non-empty strings, otherwise the object containing the from and
     *         to values from the description parameter.
     */
    getFromAndToValues (from: string, to: string, description: string) {
        let fromValue = this.valueOrEmptyStr(from);
        let toValue = this.valueOrEmptyStr(to);
        if (fromValue.length == 0 || toValue.length == 0) {
            let fromAndToValuesFromInput = this.getFromAndToValuesFromInput(description);
            if (fromValue.length == 0) {
                fromValue = fromAndToValuesFromInput.from;
            }
            if (toValue.length == 0) {
                toValue = fromAndToValuesFromInput.to;
            }
        }

        return {
            from : fromValue,
            to : toValue
        };
    }

    /**
     * Return the "from" and "to" values from the input value, otherwise empty strings.
     *
     * @param value The input string value (e.g. Increase VMEM from 1GB to 2GB for virtual machine VM1).
     *
     * @return The from and to values if present in the input string, otherwise empty strings.
     */
    getFromAndToValuesFromInput (value: string) {
        let from = '';
        let to = '';
        if (value) {
            let tokens = value.split(' ');

            for (let i = 0; i < tokens.length; i++) {
                if (tokens[i].toLowerCase() == 'from') {
                    if ((tokens.length > i + 3) && (tokens[i+2].toLowerCase() == 'to')) {
                        if (tokens[i+1]) {
                            from = tokens[i+1];
						}

                        if (tokens[i+3]) {
                            to = tokens[i+3];
                        }
                    }
                }

                if (from.length > 0 && to.length > 0) {
                    break;
                }
            }
        }

        return {
            from : from,
            to : to
        };
    }

    /**
     * Return the input value if valid, otherwise an empty string (if value is null or undefined).
     *
     * @param value The input value.
     *
     * @return The input value if valid, otherwise an empty string (if value is null or undefined).
     */
    valueOrEmptyStr (value) {
        if (value) {
            return value;
        }

        return '';
    }

    /**
     * Helper function that removes the VM or DB proxy prefix from the input string, if found.
     *
     * @param value The input string value.
     *
     * @return The string value with the proxy VM or DB prefix removed, or the unchanged input
     *         value if prefix is not found.
     */
    trimProxyPrefix (value: string): string {
        if (value) {
            if (value.indexOf(TurbonomicActionUtils.PROXY_VM_PREFIX) == 0) {
                return value.substring(TurbonomicActionUtils.PROXY_VM_PREFIX.length);
            } else if (value.indexOf(TurbonomicActionUtils.PROXY_DB_PREFIX) == 0) {
                return value.substring(TurbonomicActionUtils.PROXY_DB_PREFIX.length);
            }
        }

        return value;
    }

    /**
     * We cannot use the sleep() function in a scoped application. This function simulates the behavior of
     * sleep(timeInMsec) function.
     *
     * @param timeInMsec The input time in milliseconds. If a value lower than 1 is provided, we fallback to 1 millisecond.
     *        Also, if the input value is over 60000, we will wait one minute only.
     */
    wait (timeInMsec) {
        var time = parseInt(timeInMsec);
        if (time < 1) {
            time = 1;
        }

        if (time > 60000) {
            time = 60000;
        }

        var t1 = this._turbonomicGlide.newDateTime();
        var t2 = this._turbonomicGlide.newDateTime();;
        var duration = t2 - t1;

        while (duration < time) {
            t2 = this._turbonomicGlide.newDateTime();;
            duration = t2 - t1;
        }
    }

}
