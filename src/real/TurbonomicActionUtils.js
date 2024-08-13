var TurbonomicActionUtils = (function () {
    var type = 'TurbonomicActionUtils';

    // The Change Request States based on the new model
    var STATE_NEW = '-5';
    var STATE_ASSESS = '-4';
    var STATE_AUTHORIZE = '-3';
    var STATE_SCHEDULED = '-2';
    var STATE_IMPLEMENT = '-1';
    var STATE_REVIEW = '0';
    var STATE_CLOSED = '3';
    var STATE_CANCELLED = '4';

    var PROXY_VM_PREFIX = 'ProxyVM-For-';
    var PROXY_DB_PREFIX = 'ProxyDB-For-';

    function TurbonomicActionUtils() {
        this._actionApprovalState = new x_turbo_turbonomic.TurbonomicActionApprovalState();
        this._changeRequestStates = new TurbonomicChangeRequestState();
        this._tableNames = new TurbonomicTableNames();
    }

    /**
     * Update the state of the matching Action Approval record for the input change request, based on the CR state changes.
     *
     * @param changeRequest The input change request.
     */
    TurbonomicActionUtils.prototype.updateApprovalBasedOnRequestStateChange = function(changeRequest) {
        var dao = new x_turbo_turbonomic.TurbonomicActionDAO();

        if (dao.isChangeRequestDisabled()) {
            gs.debug('TurbonomicActionUtils.updateApprovalBasedOnRequestStateChange() - Change request and matching action approval state changes are handled by custom business rule(s)');
            return;
        }

        var actionApproval = new GlideRecordSecure('x_turbo_turbonomic_turbonomic_action_approval');
        actionApproval.addQuery('change_request_id', changeRequest.sys_id);
        actionApproval.query();

        if (actionApproval.next()) {
            var approvalSysId = actionApproval.getValue('sys_id');
            var actionStateId = '';
            var changeRequestState = changeRequest.state + '';
            var actionApprovalState = dao.getActionStateById(actionApproval.state_id);

            var approvedRequestState = dao.getSettingValue('approved_cr_state');
            if (approvedRequestState == '') {
                approvedRequestState = this._changeRequestStates.SCHEDULED;
            }

            var canceledRequestState = dao.getSettingValue('canceled_cr_state');
            if (canceledRequestState == '') {
                canceledRequestState = this._changeRequestStates.CANCELLED;
            }

            gs.debug('TurbonomicActionUtils.updateApprovalBasedOnRequestStateChange() - Change Request State = ' + this.printRequestState(changeRequestState) +
                     ', matching action approval state = ' + actionApprovalState + '; CR number = ' + changeRequest.number);

            switch (changeRequestState) {
                case approvedRequestState:
                    if (actionApprovalState == this._actionApprovalState.PENDING_APPROVAL || actionApprovalState == this._actionApprovalState.WAITING_FOR_CR_SCHEDULE) {
                        if (changeRequest.start_date.nil() || this.isChangeRequestScheduleOn(changeRequest)) {
                            actionStateId = dao.getActionStateId(this._actionApprovalState.APPROVED);
                        } else {
                            actionStateId = dao.getActionStateId(this._actionApprovalState.WAITING_FOR_CR_SCHEDULE);
                        }

                        dao.insertIntoImportSet(this._tableNames.ACTION_APPROVAL_IMPORT_SET,
                            {
                                u_update_sys_id: approvalSysId, // use the sysId to update
                                u_state: actionStateId
                            },
                            'TurbonomicActionUtils.updateApprovalBasedOnRequestStateChange() - Successfully APPROVED the matching action approval entry for change request: ' + changeRequest.number);
                    } else {
                        gs.debug('TurbonomicActionUtils.updateApprovalBasedOnRequestStateChange() - For ' + changeRequest.number + ' request, the matching action approval record state is: ' + actionApprovalState);
                    }
                    break;
                case canceledRequestState:
                    if (actionApprovalState == this._actionApprovalState.PENDING_APPROVAL || actionApprovalState == this._actionApprovalState.WAITING_FOR_CR_SCHEDULE) {
                        actionStateId = dao.getActionStateId('REJECTED');
                        dao.insertIntoImportSet(this._tableNames.ACTION_APPROVAL_IMPORT_SET,
                            {
                                u_update_sys_id: approvalSysId, // use the sysId to update
                                u_state: actionStateId
                            },
                            'TurbonomicActionUtils.updateApprovalBasedOnRequestStateChange() - Successfully REJECTED the matching action approval entry for change request: ' + changeRequest.number);
                    } else {
                        gs.debug('TurbonomicActionUtils.updateApprovalBasedOnRequestStateChange() - For ' + changeRequest.number + ' request, the matching action approval record state is: ' + actionApprovalState);
                    }
                    break;
                default:
                    gs.debug('TurbonomicActionUtils.updateApprovalBasedOnRequestStateChange() -  CR state = ' + changeRequestState);
            }
        } else {
            gs.debug('TurbonomicActionUtils.updateApprovalBasedOnRequestStateChange() - No action approval found for change request: ' + changeRequest.number);
        }
    };

    /**
     * Update the state of the matching Action Approval record for the input change request, based on the CR schedule changes.
     *
     * @param changeRequest The input change request.
     */
    TurbonomicActionUtils.prototype.updateApprovalBasedOnRequestSchedule = function(changeRequest) {
        var dao = new x_turbo_turbonomic.TurbonomicActionDAO();
        var changeRequestCurrentState = changeRequest.state + '';

//        gs.debug('TurbonomicActionUtils.updateApprovalBasedOnRequestSchedule() - Current CR state = ' + this.printRequestState(changeRequestCurrentState));

        if (dao.isChangeRequestDisabled()) {
            gs.debug('TurbonomicActionUtils.updateApprovalBasedOnRequestSchedule() - Change request schedule and matching action approval state changes' +
                     'are handled by custom business rule(s)');
            return;
        }

        var approvedRequestState = dao.getSettingValue('approved_cr_state');
        if (approvedRequestState == '') {
            approvedRequestState = this._changeRequestStates.SCHEDULED;
        }

        gs.debug('TurbonomicActionUtils.updateApprovalBasedOnRequestSchedule() - Turbonomic Approved CR State = ' + this.printRequestState(approvedRequestState));

        if ((changeRequestCurrentState !== approvedRequestState) && (changeRequestCurrentState !== this._changeRequestStates.IMPLEMENT)) {
            gs.debug('TurbonomicActionUtils.updateApprovalBasedOnRequestSchedule() - Change request ' + changeRequest.number +
                     ' has not been approved yet: Current CR state is not SCHEDULED or IMPLEMENT');
            return;
        } else {
            gs.debug('TurbonomicActionUtils.updateApprovalBasedOnRequestSchedule() - Change request ' + changeRequest.number +
                     ' has been approved or set to IMPLEMENT state');
        }

        if (changeRequest.start_date.nil()) {
            gs.debug('TurbonomicActionUtils.updateApprovalBasedOnRequestSchedule() - Planned start date is missing or invalid for change request: ' +
                     changeRequest.number);
            this.approveActionWaitingForChangeRequestSchedule(changeRequest.sys_id);
            return;
        }

        if (this.isChangeRequestScheduleOn(changeRequest)) {
            gs.debug('TurbonomicActionUtils.updateApprovalBasedOnRequestSchedule() - Schedule is ON for change request: + ' + changeRequest.number);
            this.approveActionWaitingForChangeRequestSchedule(changeRequest.sys_id);
        } else {
            gs.debug('TurbonomicActionUtils.updateApprovalBasedOnRequestSchedule() - Schedule is OFF for change request: + ' + changeRequest.number);
            var actionApproval = new GlideRecordSecure('x_turbo_turbonomic_turbonomic_action_approval');
            actionApproval.addQuery('change_request_id', changeRequest.sys_id);
            actionApproval.query();

            if (actionApproval.next()) {
                gs.debug('TurbonomicActionUtils.updateApprovalBasedOnRequestSchedule() - Matching Action Approval found for change request: ' +
                          changeRequest.number);
                var actionApprovalState = dao.getActionStateById(actionApproval.state_id);
                var actionStateId = dao.getActionStateId(this._actionApprovalState.WAITING_FOR_CR_SCHEDULE);
                var approvalSysId = actionApproval.getValue('sys_id');

                if (actionApprovalState == this._actionApprovalState.PENDING_APPROVAL) {
                    dao.insertIntoImportSet('x_turbo_turbonomic_ws_action_approval',
                        {
                            u_update_sys_id: approvalSysId,
                            u_state: actionStateId
                        },
                        'Set to WAITING_FOR_CR_SCHEDULE state the matching Turbonomic action for change request: ' + changeRequest.number
                    );
                    gs.debug('TurbonomicActionUtils.updateApprovalBasedOnRequestSchedule() - Successfully set the state to WAITING_FOR_CR_SCHEDULE' +
                             'for the matching approval of change request: ' + changeRequest.number);
                }
            }
        }
    };

    /**
     * Set the state of the matching action approval, for the change request with the input ID, to APPROVED. This operation is applied only
     * if the current action approval state is PENDING_APPROVAL or WAITING_FOR_CR_SCHEDULE.
     *
     * @param id The change request sys id.
     */
    TurbonomicActionUtils.prototype.approveActionWaitingForChangeRequestSchedule = function(id) {
        var actionApproval = new GlideRecordSecure('x_turbo_turbonomic_turbonomic_action_approval');
        actionApproval.addQuery('change_request_id', id);
        actionApproval.query();

        if (actionApproval.next()) {
            var dao = new x_turbo_turbonomic.TurbonomicActionDAO();
            var actionApprovalState = dao.getActionStateById(actionApproval.state_id);
            var actionStateId = dao.getActionStateId(this._actionApprovalState.APPROVED);
            var approvalSysId = actionApproval.getValue('sys_id');

            gs.debug('TurbonomicActionUtils.approveActionWaitingForChangeRequestSchedule - Current action approval state is: ' + actionApprovalState);
            if (actionApprovalState == this._actionApprovalState.PENDING_APPROVAL ||
                actionApprovalState == this._actionApprovalState.WAITING_FOR_CR_SCHEDULE) {
                dao.insertIntoImportSet(this._tableNames.ACTION_APPROVAL_IMPORT_SET,
                    {
                        u_update_sys_id: approvalSysId, // use the sysId to update
                        u_state: actionStateId
                    },
                    'Successfully APPROVED the matching action approval entry for change request with ID: ' + id
                );
				gs.debug('TurbonomicActionUtils.approveActionWaitingForChangeRequestSchedule - Successfully set the action approval state to APPROVED');
            }
		}
    };

    /**
     * Helper function that returns true if the current system time is within the [start_date, end_date] range of the input change request,
	 * false otherwise.
     *
     * @param changeRequest The input change request record.
     *
     * @return true If the change request schedule is on, false otherwise.
     */
    TurbonomicActionUtils.prototype.isChangeRequestScheduleOn = function(changeRequest) {
        var dao = new x_turbo_turbonomic.TurbonomicActionDAO();

        if (changeRequest.start_date) {
            var startDate = new GlideDateTime(changeRequest.start_date).getNumericValue();
            var currentTime = new GlideDateTime().getNumericValue();

            if (changeRequest.end_date) {
                var endDate = new GlideDateTime(changeRequest.end_date).getNumericValue();

                if (startDate <= currentTime && currentTime <= endDate) {
                    gs.debug('TurbonomicActionUtils.isChangeRequestScheduleOn - Schedule is ON for change request: ' + changeRequest.number);
                    return true;
                }
                gs.debug('TurbonomicActionUtils.isChangeRequestScheduleOn - Schedule is OFF for change request: ' + changeRequest.number);
            } else {
                if (startDate <= currentTime) {
                    gs.debug('TurbonomicActionUtils.isChangeRequestScheduleOn - End date is not set but schedule is ON for change request: ' + changeRequest.number);
                    return true;
                }
                gs.debug('TurbonomicActionUtils.isChangeRequestScheduleOn - End date is not set and Schedule is OFF for change request: ' + changeRequest.number);
            }
        }

        gs.debug('TurbonomicActionUtils.isChangeRequestScheduleOn - Schedule is OFF for change request: ' + changeRequest.number);								
        return false;
    };

    /**
     * Helper function that returns true if the action retention time is still on, false otherwise.
     *
     * @param lasUpdateTime The last update time value for an action record or approval.
     *
     * @return true If the retention time is still on, false otherwise.
     */
    TurbonomicActionUtils.prototype.isActionRetentionTimeOn = function(lastUpdateActionTime) {
        var dao = new x_turbo_turbonomic.TurbonomicActionDAO();

        var lastUpdateTimestamp = new GlideDateTime(lastUpdateActionTime).getNumericValue();
        var currentTimestamp = new GlideDateTime().getNumericValue();

        var deltaTime = currentTimestamp - lastUpdateTimestamp;

        var retentionTimeMsec = 24 * 60 * 60 * 1000;
        var actionRetentionTime = dao.getSettingValue('action_retention_time');
        if (actionRetentionTime) {
            retentionTimeMsec = parseInt(actionRetentionTime) * 1000;
        }

        if (deltaTime < retentionTimeMsec) {
            return true;
        }

        return false;
    };

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
    TurbonomicActionUtils.prototype.isActionExecutionRecoveryTimeOn = function(actionOid) {
        var dao = new x_turbo_turbonomic.TurbonomicActionDAO();

        var actionApproval = new GlideRecordSecure('x_turbo_turbonomic_turbonomic_action_approval');
        actionApproval.addQuery('oid', actionOid);
        actionApproval.addQuery('state_id', dao.getActionStateId('FAILED'));
        actionApproval.orderByDesc('sys_updated_on');
        actionApproval.query();

        if (actionApproval.next()) {
            var lastUpdateDateTime = new GlideDateTime(actionApproval.getValue('sys_updated_on'));
            var lastUpdateTimestamp = lastUpdateDateTime.getNumericValue();

            var currentTimestamp = new GlideDateTime().getNumericValue();

            var deltaTime = currentTimestamp - lastUpdateTimestamp;
            var recoveryTimeMsec = 24 * 60 * 60 * 1000;

            var actionExecutionRecoveryTime = dao.getSettingValue('action_execution_recovery_time');
            if (actionExecutionRecoveryTime) {
                var recoveryTimeAsInt = parseInt(actionExecutionRecoveryTime) * 1000;
                if (recoveryTimeAsInt > 0) {
                    recoveryTimeMsec = recoveryTimeAsInt;
                }
            }

            if (deltaTime < recoveryTimeMsec) {
                gs.debug("Action Execution Recovery Time is ON for action with OID: " + actionOid);
                return true;
            }
        }

        gs.debug("Action Execution Recovery Time is no longer ON for action with OID: " + actionOid);
        return false;
    };

    /**
     * Print the change request state as a string value.
     *
     * @param state The input change request state based on the new model values (e.g. '-1', '0').
     *
     * @return The change request state as a string (e.g. 'IMPLEMENT', 'REVIEW').
     */
    TurbonomicActionUtils.prototype.printRequestState = function(state) {
        switch (state) {
            case STATE_NEW:
                return 'NEW';
            case STATE_ASSESS:
                return 'ASSESS';
            case STATE_AUTHORIZE:
                return 'AUTHORIZE';
            case STATE_SCHEDULED :
                return 'SCHEDULED';
            case STATE_IMPLEMENT:
                return 'IMPLEMENT';
            case STATE_REVIEW:
                return 'REVIEW';
            case STATE_CLOSED:
                return 'CLOSED';
            case STATE_CANCELLED :
                return 'CANCELLED';
            default :
                gs.warn('TurbonomicActionUtils.printRequestState() - Unknown change request state: ' + state);
                return state;
        }
    };

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
    TurbonomicActionUtils.prototype.getFromAndToValues = function(from, to, description) {
        var fromValue = this.valueOrEmptyStr(from);
        var toValue = this.valueOrEmptyStr(to);
        if (fromValue.length == 0 || toValue.length == 0) {
            var fromAndToValuesFromInput = this.getFromAndToValuesFromInput(description);
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
    };

    /**
     * Return the "from" and "to" values from the input value, otherwise empty strings.
     *
     * @param value The input string value (e.g. Increase VMEM from 1GB to 2GB for virtual machine VM1).
     *
     * @return The from and to values if present in the input string, otherwise empty strings.
     */
    TurbonomicActionUtils.prototype.getFromAndToValuesFromInput = function(value) {
        var from = '';
        var to = '';
        if (value) {
            var tokens = value.split(' ');

            for (var i = 0; i < tokens.length; i++) {
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
    };

    /**
     * Return the input value if valid, otherwise an empty string (if value is null or undefined).
     *
     * @param value The input value.
     *
     * @return The input value if valid, otherwise an empty string (if value is null or undefined).
     */
    TurbonomicActionUtils.prototype.valueOrEmptyStr = function(value) {
        if (value) {
            return value;
        }

        return '';
    };

    /**
     * Helper function that removes the VM or DB proxy prefix from the input string, if found.
     *
     * @param The input string value.
     *
     * @return The string value with the proxy VM or DB prefix removed, or the unchanged input
     *         value if prefix is not found.
     */
    TurbonomicActionUtils.prototype.trimProxyPrefix = function(value) {
        if (value) {
            if (value.indexOf(PROXY_VM_PREFIX) == 0) {
                return value.substring(PROXY_VM_PREFIX.length);
            } else if (value.indexOf(PROXY_DB_PREFIX) == 0) {
                return value.substring(PROXY_DB_PREFIX.length);
            }
        }

        return value;
    };

    /**
     * We cannot use the sleep() function in a scoped application. This function simulates the behavior of
     * sleep(timeInMsec) function.
     *
     * @param timeInMsec The input time in milliseconds. If a value lower than 1 is provided, we fallback to 1 millisecond.
     *        Also, if the input value is over 60000, we will wait one minute only.
     */
    TurbonomicActionUtils.prototype.wait = function(timeInMsec) {
        var time = parseInt(timeInMsec);
        if (time < 1) {
            time = 1;
        }

        if (time > 60000) {
            time = 60000;
        }

        var t1 = new GlideDateTime().getNumericValue();
        var t2 = new GlideDateTime().getNumericValue();
        var duration = t2 - t1;

        while (duration < time) {
            t2 = new GlideDateTime().getNumericValue();
            duration = t2 - t1;
        }
    };

    return TurbonomicActionUtils;
}());
