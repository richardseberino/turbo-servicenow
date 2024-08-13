class TurbonomicActionApprovalManager {

    public type: string;
    private _log: x_turbo_turbonomic.Logger;
	private _turbonomicGlide: TurbonomicGlide;
    private _changeRequestDAO: TurbonomicChangeRequestDAO;
    private _actionDAO: TurbonomicActionDAO;

    constructor () {
        this.type = 'TurbonomicActionApprovalManager';
        this._log = new x_turbo_turbonomic.Logger();
        this._turbonomicGlide = new TurbonomicGlide();
        this._changeRequestDAO = new TurbonomicChangeRequestDAO();
        this._actionDAO = new TurbonomicActionDAO();
    }

    /**
     * Update an existing Action Approval entry, based on the input values.
     *
     * @param actionItem The input Turbonomic action item.
     * @param actionApproval The Action Approval entry that will be updated.
     * @param sourceEntityId The ID of the source Turbonomic entity, for the action approval that will be updated.
     * @param destinationEntityId The ID of the destination Turbonomic entity, for the action approval that will be updated.
     * @param targetEntityId The ID of the target Turbonomic entity, for the action approval that will be updated.
     * @param actionDto Contains all the information about the action including ids, entities
     *        involved and commodities.
     * @param failed The input array with the details about the failed approval updates.
     * @param succeeded The input array with the details about the successful approval updates.
     */
    updateActionApprovalEntry (actionItem, actionApproval: TurbonomicActionApproval, sourceEntityId: string, destinationEntityId: string, targetEntityId: string, actionDto: string, failed, succeeded): void {
        let actionItemState: string = actionItem.state.toUpperCase();

        switch (actionItemState) {
            case TurbonomicActionItemState.PENDING_ACCEPT :
                this.updateActionApprovalForPendingAcceptCase(actionItem, actionApproval, sourceEntityId, destinationEntityId, targetEntityId, actionDto, failed, succeeded);
                break;
            case TurbonomicActionItemState.ACCEPTED :
                this.updateActionApprovalForAcceptedCase(actionItem, actionApproval, targetEntityId, failed, succeeded);
                break;
            case TurbonomicActionItemState.CLEARED :
                this.updateActionApprovalForClearedCase(actionItem, actionApproval, targetEntityId, failed, succeeded);
                break;
            case TurbonomicActionItemState.REJECTED :
                this.updateActionApprovalForRejectedCase(actionItem, actionApproval, targetEntityId, failed, succeeded);
                break;
            case TurbonomicActionItemState.IN_PROGRESS :
                this.updateActionApprovalForInProgressCase(actionItem, actionApproval, targetEntityId, failed, succeeded);
                break;
            case TurbonomicActionItemState.SUCCEEDED :
                this.updateActionApprovalForSucceededCase(actionItem, actionApproval, targetEntityId, failed, succeeded);
                break;
            case TurbonomicActionItemState.FAILED :
                this.updateActionApprovalForFailedCase(actionItem, actionApproval, targetEntityId, failed, succeeded);
                break;
            case TurbonomicActionItemState.QUEUED :
                this.updateActionApprovalForQueuedCase(actionItem, actionApproval, targetEntityId, failed, succeeded);
                break;
            case TurbonomicActionItemState.DISABLED :
            case TurbonomicActionItemState.RECOMMENDED :
                this.updateActionApprovalForDisabledCase(actionItem, actionApproval, targetEntityId, failed);
                break;
            default :
                this._log.warn('TurbonomicActionApprovalManager.updateActionApprovalEntry() - ' +
                    'Unsupported action item state: ' + actionItem.state);
                failed.push({'oid' : actionItem.oid,
                    'errorMsg' : 'Unsupported action state: ' + actionItem.state + ' while processing action ' + actionItem.oid
                });
        }
    }

    /**
     * Update an existing Action Approval entry, for a Turbonomic action on PENDING_ACCEPT state.
     *
     * @param actionItem The input Turbonomic action item.
     * @param actionApproval The Action Approval entry that will be updated.
     * @param sourceEntityId The ID of the source Turbonomic entity, for the action approval that will be updated.
     * @param destinationEntityId The ID of the destination Turbonomic entity, for the action approval that will be updated.
     * @param targetEntityId The ID of the target Turbonomic entity, for the action approval that will be updated.
     * @param actionDto Contains all the information about the action including ids, entities
     *        involved and commodities.
     * @param failed The input array with the details about the failed approval updates.
     * @param succeeded The input array with the details about the successful approval updates.
     */
    updateActionApprovalForPendingAcceptCase (actionItem, actionApproval: TurbonomicActionApproval, sourceEntityId: string, destinationEntityId: string, targetEntityId: string, actionDto: string, failed, succeeded): void {
        let this._actionDAO: TurbonomicActionDAO = new TurbonomicActionDAO();
        let actionApprovalState: string = this._actionDAO.getActionStateById(actionApproval.getStateId()).toUpperCase();
        let actionUtils: TurbonomicActionUtils = new TurbonomicActionUtils();
        let changeRequest: TurbonomicChangeRequest = new TurbonomicChangeRequest();
        let counter: number = actionApproval.getCount() + 1;

        switch (actionApprovalState) {
            case TurbonomicActionApprovalState.PENDING_APPROVAL :
                this._log.debug('TurbonomicActionApprovalManager.updateActionApprovalForPendingAcceptCase() - ' +
                    'Increasing the counter for pending action approval with OID: ' + actionItem.oid);

                changeRequest = this._actionDAO.getChangeRequestById(actionApproval.getChangeRequestId());
                if (this._actionDAO.updateLastModifiedActionApprovalField(actionItem.oid, 'u_count', counter)) {
                    succeeded.push({'oid' : actionItem.oid,
                        'changeRequestId' : actionApproval.getChangeRequestId(),
                        'changeRequestNumber' : changeRequest.getNumber(),
                        'state' : TurbonomicActionApprovalState.PENDING_APPROVAL
                    });

                    this._log.debug('TurbonomicActionApprovalManager.updateActionApprovalForPendingAcceptCase() - ' +
                        'Successfully updated the action approval counter value; counter = ' + counter);
                } else {
                    failed.push({'oid' : actionItem.oid,
                        'errorMsg' : 'Cannot update the counter for action approval with OID: ' + actionItem.oid
                    });
                }

                break;
            case this._actionApprovalState.WAITING_FOR_CR_SCHEDULE :
                this.updateActionApprovalWaitingForChangeRequestSchedule (actionItem, actionApproval,
                    'TurbonomicActionApprovalManager.updateActionApprovalForPendingAcceptCase() - ', failed, succeeded);
                break;
            case TurbonomicActionApprovalState.APPROVED :
                this._log.debug('TurbonomicActionApprovalManager.updateActionApprovalForPendingAcceptCase() - ' +
                    'Increasing the counter for action approval on APPROVED state; Action OID = ' + actionItem.oid);

                if (this._actionDAO.updateLastModifiedActionApprovalField(actionItem.oid, 'u_count', counter)) {
                    this._log.debug('TurbonomicActionApprovalManager.updateActionApprovalForPendingAcceptCase() - ' +
                        'Successfully updated the action approval counter value; counter = ' + counter);
                } else {
                    this._log.debug('TurbonomicActionApprovalManager.updateActionApprovalForPendingAcceptCase() - ' +
                        'Failed to update the action approval counter value; counter = ' + counter);
                }

                changeRequest = this._actionDAO.getChangeRequestById(actionApproval.getChangeRequestId());
                succeeded.push({'oid' : actionItem.oid,
                    'changeRequestId' : actionApproval.getChangeRequestId(),
                    'changeRequestNumber' : changeRequest.getNumber(),
                    'state' : TurbonomicActionApprovalState.APPROVED
                });

                this._log.debug('TurbonomicActionApprovalManager.updateActionApprovalForPendingAcceptCase() - ' +
                    'The change request has been approved for the Turbonomic action with OID: ' + actionItem.oid);

                break;
            case TurbonomicActionApprovalState.REJECTED :
                this._log.debug('TurbonomicActionApprovalManager.updateActionApprovalForPendingAcceptCase() - ' +
                    'The change request has been rejected for the Turbonomic action with OID: ' + actionItem.oid);

                if (this._actionDAO.allowApprovalsForRejectedRequests()) {
                    // Add new action approval and matching change request
                    changeRequest = this.addActionApproval(actionItem, sourceEntityId, destinationEntityId, targetEntityId, actionDto);

                    succeeded.push({'oid' : actionItem.oid,
                        'changeRequestId' : changeRequest.getId(),
                        'changeRequestNumber' : changeRequest.getNumber(),
                        'state' : TurbonomicActionApprovalState.PENDING_APPROVAL
                    });
                } else {
                    this._log.debug('TurbonomicActionApprovalManager.updateActionApprovalForPendingAcceptCase() - ' +
                        'New action approvals are not allowed for the rejected action with OID: ' + actionItem.oid);

                    changeRequest = this._actionDAO.getChangeRequestById(actionApproval.getChangeRequestId());
                    succeeded.push({'oid' : actionItem.oid,
                        'changeRequestId' : actionApproval.getChangeRequestId(),
                        'changeRequestNumber' : changeRequest.getNumber(),
                        'state' : TurbonomicActionApprovalState.REJECTED
                    });
                }
                break;
            case TurbonomicActionApprovalState.WAITING_FOR_EXEC :
            case TurbonomicActionApprovalState.IN_PROGRESS :
                this._log.debug('TurbonomicActionApprovalManager.updateActionApprovalForPendingAcceptCase() - ' +
                    'Will no update the Action Approval entry for Turbonomic action on PENDING_ACCEPT state. Action Approval state = ' + actionApprovalState);

                succeeded.push({'oid' : actionItem.oid,
                    'changeRequestId' : changeRequest.getId(),
                    'changeRequestNumber' : changeRequest.getNumber(),
                    'state' : actionApprovalState
                });
                break;
            case TurbonomicActionApprovalState.FAILED :
                if (actionUtils.isActionExecutionRecoveryTimeOn(actionItem.oid)) {
                	this._log.debug('TurbonomicActionApprovalManager.updateActionApprovalForPendingAcceptCase() - ' +
                            'Skip adding new Action Approval and CR for previously failed Turbonomic action with OID: ' + actionItem.oid);
                } else {
                	this._log.debug('TurbonomicActionApprovalManager.updateActionApprovalForPendingAcceptCase() - ' +
                            'Adding new action approval for Turbonomic action on PENDING_ACCEPT state. Current Action Approval is FAILED');

                    // Add new action approval and matching change request
                    changeRequest = this.addActionApproval(actionItem, sourceEntityId, destinationEntityId, targetEntityId, actionDto);

                    succeeded.push({'oid' : actionItem.oid,
                                    'changeRequestId' : changeRequest.getId(),
                                    'changeRequestNumber' : changeRequest.getNumber(),
                                    'state' : TurbonomicActionApprovalState.PENDING_APPROVAL
                    });
                }
                break;
            case TurbonomicActionApprovalState.MISSED :
            case TurbonomicActionApprovalState.SUCCEEDED :
                this._log.debug('TurbonomicActionApprovalManager.updateActionApprovalForPendingAcceptCase() - ' +
                    'Adding new action approval for Turbonomic action on PENDING_ACCEPT state. Current Action Approval state = ' + actionApprovalState);

                // Add new action approval and matching change request
                changeRequest = this.addActionApproval(actionItem, sourceEntityId, destinationEntityId, targetEntityId, actionDto);

                succeeded.push({'oid' : actionItem.oid,
                    'changeRequestId' : changeRequest.getId(),
                    'changeRequestNumber' : changeRequest.getNumber(),
                    'state' : TurbonomicActionApprovalState.PENDING_APPROVAL
                });
                break;
            default :
                this._log.warn('TurbonomicActionApprovalManager.updateActionApprovalForPendingAcceptCase() - ' +
                    'Unsupported action approval state: ' + actionApprovalState);
        }
    }

    /**
     * Add a new Action Approval entry, for a corresponding Turbonomic action.
     *
     * @param actionItem The input Turbonomic action item.
     * @param sourceEntityId The ID of the source Turbonomic entity, for the action approval that will be created.
     * @param destinationEntityId The ID of the destination Turbonomic entity, for the action approval that will be created.
     * @param targetEntityId The ID of the target Turbonomic entity, for the action approval that will be created.
     * @param actionDto Contains all the information about the action including ids, entities
     *        involved and commodities.
     *
     * @return The TurbonomicChangeRequest with details about the change request, generated for the newly created Action Approval entry.
     */
    addActionApproval (actionItem, sourceEntityId: string, destinationEntityId: string, targetEntityId: string, actionDto: string): TurbonomicChangeRequest {
        let configItemId: string = '';

        // Use the target entity to find the ServiceNow configuration item
        let targetEntity: TurbonomicEntity = this._actionDAO.getTurbonomicEntityById(targetEntityId);
        if (targetEntity) {
            let entityMatcher: TurbonomicEntityMatcher = new TurbonomicEntityMatcher();
            let configItem = entityMatcher.findConfigurationItem(targetEntity);

            if (configItem != null) {
                this._log.debug('TurbonomicActionApprovalManager.addActionApproval() - The matching configuration item GUID is: ' + configItem.sys_id);
                configItemId = configItem.sys_id;
            }
        }

        // Create the corresponding change request for the action approval
        let changeRequest: TurbonomicChangeRequest = this._actionDAO.createChangeRequest(actionItem.oid, configItemId, actionItem.description, actionItem.description);

        // Create a new action approval entry
        this._actionDAO.createActionApproval(actionItem.oid,
            actionItem.name,
            actionItem.description,
            actionItem.category,
            actionItem.commodityName,
            actionItem.from,
            actionItem.to,
            actionItem.risk,
            actionItem.savings,
            1,
            actionItem.changedBy,
            sourceEntityId,
            targetEntityId,
            destinationEntityId,
            changeRequest.getId(),
            this._actionDAO.getActionStateId(TurbonomicActionApprovalState.PENDING_APPROVAL),
            this._actionDAO.getActionTypeId(actionItem.type),
            actionItem.timestampMsec,
            actionDto
        );
        return changeRequest;
    }

    /**
     * Update an existing Action Approval entry, for a Turbonomic action on ACCEPTED state.
     *
     * @param actionItem The input Turbonomic action item.
     * @param actionApproval The Action Approval entry that will be updated.
     * @param targetEntityId The ID of the target Turbonomic entity, for the action approval that will be updated.
     * @param failed The input array with the details about the failed approval updates.
     * @param succeeded The input array with the details about the successful approval updates.
     */
    updateActionApprovalForAcceptedCase (actionItem, actionApproval: TurbonomicActionApproval, targetEntityId: string, failed, succeeded): void {
        let actionUtils: TurbonomicActionUtils = new TurbonomicActionUtils();
        let actionApprovalState: string = this._actionDAO.getActionStateById(actionApproval.getStateId()).toUpperCase();
        let changeRequest: TurbonomicChangeRequest = new TurbonomicChangeRequest();
        let counter: number = actionApproval.getCount() + 1;

        switch (actionApprovalState) {
            case TurbonomicActionApprovalState.APPROVED :
                this._log.debug('TurbonomicActionApprovalManager.updateActionApprovalForAcceptedCase() - ' +
                    'The Action Approval state is APPROVED, for the accepted Turbonomic action with OID: ' + actionItem.oid);

                if (this._actionDAO.updateLastModifiedActionApprovalField(actionItem.oid, 'u_count', counter)) {
                    this._log.debug('TurbonomicActionApprovalManager.updateActionApprovalForAcceptedCase() - ' +
                        'Successfully updated the action approval counter value; counter = ' + counter);
                } else {
                    this._log.debug('TurbonomicActionApprovalManager.updateActionApprovalForAcceptedCase() - ' +
                        'Failed to update the action approval counter value; counter = ' + counter);
                }

                let stateId: string = this._actionDAO.getActionStateId(TurbonomicActionApprovalState.WAITING_FOR_EXEC);
                if (this._actionDAO.updateLastModifiedActionApprovalField(actionItem.oid, 'u_state', stateId)) {

                    changeRequest = this._actionDAO.getChangeRequestById(actionApproval.getChangeRequestId());
                    succeeded.push({'oid' : actionItem.oid,
                        'changeRequestId' : actionApproval.getChangeRequestId(),
                        'changeRequestNumber' : changeRequest.getNumber(),
                        'state' : TurbonomicActionApprovalState.WAITING_FOR_EXEC
                    });

                    this._log.debug('TurbonomicActionApprovalManager.updateActionApprovalForAcceptedCase() - ' +
                        'Successfully set the action approval state to WAITING_FOR_EXEC, for the accepted Turbonomic action with OID: ' + actionItem.oid);
                } else {
                    failed.push({'oid' : actionItem.oid,
                        'errorMsg' : 'Cannot set the state to WAITING_FOR_EXEC for action approval with OID: ' + actionItem.oid
                    });
                }

                this.updateActionExecutionDescription(actionItem);

                break;
             case this._actionApprovalState.WAITING_FOR_CR_SCHEDULE :
                this.updateActionApprovalWaitingForChangeRequestSchedule (actionItem, actionApproval,
                    'TurbonomicActionApprovalManager.updateActionApprovalForAccepted() - ', failed, succeeded);
                break;
            case TurbonomicActionApprovalState.PENDING_APPROVAL :
            case TurbonomicActionApprovalState.REJECTED :
            case TurbonomicActionApprovalState.IN_PROGRESS :
            case TurbonomicActionApprovalState.FAILED :
            case TurbonomicActionApprovalState.SUCCEEDED :
            case TurbonomicActionApprovalState.MISSED :
                this._log.debug('TurbonomicActionApprovalManager.updateActionApprovalForAcceptedCase() - ' +
                    'Cannot update the Action Approval entry for Turbonomic action on ACCEPTED state. Action Approval state = ' + actionApprovalState);

                let details: string = "Unexpected state transition detected. Action Execution Description = " + actionItem.executionDescription + '; Turbonomic Action state = ' + actionItem.state + '; Action Approval state = ' + actionApprovalState;

                // Add audit record to mention the invalid Turbonomic action state
                this._actionDAO.createOrUpdateActionRecord(actionItem.oid, details, '', targetEntityId, this._actionDAO.valueOrEmptyStr(actionItem.actionLifeCycleEvent));

                failed.push({'oid' : actionItem.oid,
                    'errorMsg' : 'Cannot update Action Approval entry for Turbonomic action with state: ' + actionItem.state
                });
                break;
            case TurbonomicActionApprovalState.WAITING_FOR_EXEC :
                this._log.debug('TurbonomicActionApprovalManager.updateActionApprovalForAcceptedCase() - ' +
                    'The Action Approval state is already set to WAITING_FOR_EXEC, for the accepted Turbonomic action with OID: ' + actionItem.oid);

                if (this._actionDAO.updateLastModifiedActionApprovalField(actionItem.oid, 'u_count', counter)) {
                    this._log.debug('TurbonomicActionApprovalManager.updateActionApprovalForAcceptedCase() - ' +
                        'Successfully updated the action approval counter value; counter = ' + counter);
                } else {
                    this._log.debug('TurbonomicActionApprovalManager.updateActionApprovalForAcceptedCase() - ' +
                        'Failed to update the action approval counter value; counter = ' + counter);
                }

                changeRequest = this._actionDAO.getChangeRequestById(actionApproval.getChangeRequestId());
                succeeded.push({'oid' : actionItem.oid,
                    'changeRequestId' : actionApproval.getChangeRequestId(),
                    'changeRequestNumber' : changeRequest.getNumber(),
                    'state' : TurbonomicActionApprovalState.WAITING_FOR_EXEC
                });
                break;
            default :
                this._log.warn('TurbonomicActionApprovalManager.updateActionApprovalForAcceptedCase() - ' +
                    'Unsupported action approval state: ' + actionApprovalState);
        }
    }

    /**
     * Update an existing Action Approval entry, for a Turbonomic action on CLEARED state.
     *
     * @param actionItem The input Turbonomic action item.
     * @param actionApproval The Action Approval entry that will be updated.
     * @param targetEntityId The ID of the target Turbonomic entity, for the action approval that will be updated.
     * @param failed The input array with the details about the failed approval updates.
     * @param succeeded The input array with the details about the successful approval updates.
     */
    updateActionApprovalForClearedCase (actionItem, actionApproval: TurbonomicActionApproval, targetEntityId: string, failed, succeeded): void {
        let actionApprovalState = this._actionDAO
            .getActionStateById(actionApproval.getStateId())
            .toUpperCase();
        //All cleared actions in Turbonomic are being ignored
        succeeded.push({
            oid: actionItem.oid,
            changeRequestId: actionApproval.getChangeRequestId(),
            state: actionApprovalState
        });
    }

    /**
     * Update an existing Action Approval entry, for a Turbonomic action on REJECTED state.
     *
     * @param actionItem The input Turbonomic action item.
     * @param actionApproval The Action Approval entry that will be updated.
     * @param targetEntityId The ID of the target Turbonomic entity, for the action approval that will be updated.
     * @param failed The input array with the details about the failed approval updates.
     * @param succeeded The input array with the details about the successful approval updates.
     */
    updateActionApprovalForRejectedCase (actionItem, actionApproval: TurbonomicActionApproval, targetEntityId: string, failed, succeeded): void {
        let actionApprovalState: string = this._actionDAO.getActionStateById(actionApproval.getStateId()).toUpperCase();
        let changeRequest: TurbonomicChangeRequest = new TurbonomicChangeRequest();

        switch (actionApprovalState) {
            case TurbonomicActionApprovalState.REJECTED :
                this._log.debug('TurbonomicActionApprovalManager.updateActionApprovalForRejectedCase() - ' +
                    'The Action Approval state is already set to REJECTED, for the rejected/cleared Turbonomic action with OID: ' + actionItem.oid);

                changeRequest = this._actionDAO.getChangeRequestById(actionApproval.getChangeRequestId());
                succeeded.push({'oid' : actionItem.oid,
                    'changeRequestId' : actionApproval.getChangeRequestId(),
                    'changeRequestNumber' : changeRequest.getNumber(),
                    'state' : TurbonomicActionApprovalState.REJECTED
                });
                break;
            case TurbonomicActionApprovalState.APPROVED :
            case TurbonomicActionApprovalState.WAITING_FOR_EXEC :
            case TurbonomicActionApprovalState.IN_PROGRESS :
                this._log.debug(
                  "TurbonomicActionApprovalManager.updateActionApprovalForRejectedCase() - " +
                    "The Action Approval state is APPROVED, WAITING_FOR_EXEC or IN_PROGRESS, for the rejected Turbonomic action with OID: " +
                    actionItem.oid
                );
                var details =
                  "Action failed to get executed with message: " +
                  actionItem.executionDescription;
                // Add work note to the change request
                let changeRequestInfo = this.addWorkNote(
                  "TurbonomicActionApprovalManager.updateActionApprovalForRejectedCase()",
                  actionApproval,
                  details
                );
                let stateId = this._actionDAO.getActionStateId(TurbonomicActionApprovalState.FAILED);
                if (
                    changeRequestInfo != null &&
                    this._actionDAO.updateLastModifiedActionApprovalField(
                      actionItem.oid,
                      "u_state",
                      stateId
                    )
                ) {
                    succeeded.push({
                      oid: actionItem.oid,
                      changeRequestId: changeRequestInfo.changeRequestId,
                      changeRequestNumber: changeRequestInfo.changeRequestNumber,
                      state: TurbonomicActionApprovalState.FAILED
                    });
                    this._log.debug(
                        "TurbonomicActionApprovalManager.updateActionApprovalForRejectedCase() - " +
                          "Successfully set the action approval state to FAILED, for the rejected Turbonomic action with OID: " +
                          actionItem.oid
                    );
                } else {
                    failed.push({
                      oid: actionItem.oid,
                      errorMsg:
                        "Cannot set the state to FAILED for action approval with OID: " +
                        actionItem.oid
                    });
                }
                // Update the approval with the last action execution description
                this.updateActionExecutionDescription(actionItem);
                break;
            case TurbonomicActionApprovalState.PENDING_APPROVAL :
            case TurbonomicActionApprovalState.WAITING_FOR_CR_SCHEDULE :
            case TurbonomicActionApprovalState.FAILED :
            case TurbonomicActionApprovalState.SUCCEEDED :
            case TurbonomicActionApprovalState.MISSED :
                this._log.debug('TurbonomicActionApprovalManager.updateActionApprovalForRejectedCase() - ' +
                    'Cannot update the Action Approval entry for Turbonomic action on REJECTED or CLEARED state. Action Approval state = ' + actionApprovalState);

                var details: string = "Unexpected state transition detected. Action Execution Description = " + actionItem.executionDescription + '; Turbonomic Action state = ' + actionItem.state + '; Action Approval state = ' + actionApprovalState;

                // Add audit record to mention the invalid Turbonomic action state
                this._actionDAO.createOrUpdateActionRecord(actionItem.oid, details, '', targetEntityId, this._actionDAO.valueOrEmptyStr(actionItem.actionLifeCycleEvent));

                failed.push({'oid' : actionItem.oid,
                    'errorMsg' : 'Cannot update Action Approval entry for Turbonomic action with state: ' + actionItem.state
                });
                break;
            default :
                this._log.warn('TurbonomicActionApprovalManager.updateActionApprovalForRejectedCase() - ' +
                    'Unsupported action approval state: ' + actionApprovalState);
        }
    }

    /**
     * Update an existing Action Approval entry, for a Turbonomic action on IN_PROGRESS state.
     *
     * @param actionItem The input Turbonomic action item.
     * @param actionApproval The Action Approval entry that will be updated.
     * @param targetEntityId The ID of the target Turbonomic entity, for the action approval that will be updated.
     * @param failed The input array with the details about the failed approval updates.
     * @param succeeded The input array with the details about the successful approval updates.
     */
    updateActionApprovalForInProgressCase (actionItem, actionApproval: TurbonomicActionApproval, targetEntityId: string, failed, succeeded): void {
        let actionApprovalState: string = this._actionDAO.getActionStateById(actionApproval.getStateId()).toUpperCase();
        let counter: number = actionApproval.getCount() + 1;

        switch (actionApprovalState) {
            case TurbonomicActionApprovalState.IN_PROGRESS :
                this._log.debug('TurbonomicActionApprovalManager.updateActionApprovalForInProgressCase() - ' +
                    'The Action Approval state is already set to IN_PROGRESS, for the in progress Turbonomic action with OID: ' + actionItem.oid);

                if (this._actionDAO.updateLastModifiedActionApprovalField(actionItem.oid, 'u_count', counter)) {
                    this._log.debug('TurbonomicActionApprovalManager.updateActionApprovalForInProgressCase() - ' +
                        'Successfully updated the action approval counter value; counter = ' + counter);
                } else {
                    this._log.debug('TurbonomicActionApprovalManager.updateActionApprovalForInProgressCase() - ' +
                        'Failed to update the action approval counter value; counter = ' + counter);
                }

                var changeRequestInfo = this.addWorkNoteToChangeRequest(
                    'TurbonomicActionApprovalManager.updateActionApprovalForInProgressCase()',
                    actionItem,
                    actionApproval,
                    failed
                );
                if (!changeRequestInfo) {
                    break;
                }

                succeeded.push({'oid' : actionItem.oid,
                    'changeRequestId' : changeRequestInfo.changeRequestId,
                    'changeRequestNumber' : changeRequestInfo.changeRequestNumber,
                    'state' : TurbonomicActionApprovalState.IN_PROGRESS
                });
                break;
            case TurbonomicActionApprovalState.APPROVED :
            case TurbonomicActionApprovalState.WAITING_FOR_EXEC :
                this._log.debug('TurbonomicActionApprovalManager.updateActionApprovalForInProgressCase() - ' +
                    'The Action Approval state is ' + actionApprovalState + ', for the in progress Turbonomic action with OID: ' + actionItem.oid);

                var changeRequestInfo = this.moveChangeRequest(
                    'TurbonomicActionApprovalManager.updateActionApprovalForInProgressCase()',
                    actionItem,
                    actionApproval,
                    TurbonomicChangeRequestState.IMPLEMENT,
                    failed
                );
                if (!changeRequestInfo) {
                    break;
                }

                let stateId: string = this._actionDAO.getActionStateId(TurbonomicActionApprovalState.IN_PROGRESS);
                if (this._actionDAO.updateLastModifiedActionApprovalField(actionItem.oid, 'u_state', stateId)) {
                    succeeded.push({'oid' : actionItem.oid,
                        'changeRequestId' : changeRequestInfo.changeRequestId,
                        'changeRequestNumber' : changeRequestInfo.changeRequestNumber,
                        'state' : TurbonomicActionApprovalState.IN_PROGRESS
                    });

                    this._log.debug('TurbonomicActionApprovalManager.updateActionApprovalForInProgressCase() - ' +
                        'Successfully set the action approval state to IN_PROGRESS, for the in progress Turbonomic action with OID: ' + actionItem.oid);
                } else {
                    failed.push({'oid' : actionItem.oid,
                        'errorMsg' : 'Cannot set the state to IN_PROGRESS for action approval with OID: ' + actionItem.oid
                    });
                }

                this.updateActionExecutionDescription(actionItem);

                break;
            case TurbonomicActionApprovalState.PENDING_APPROVAL :
            case TurbonomicActionApprovalState.WAITING_FOR_CR_SCHEDULE :
            case TurbonomicActionApprovalState.REJECTED :
            case TurbonomicActionApprovalState.MISSED :
            case TurbonomicActionApprovalState.FAILED :
            case TurbonomicActionApprovalState.SUCCEEDED :
                this._log.debug('TurbonomicActionApprovalManager.updateActionApprovalForInProgressCase() - ' +
                    'Cannot update the Action Approval entry for Turbonomic action on IN_PROGRESS state. Action Approval state = ' + actionApprovalState);

                let details: string = "Unexpected state transition detected. Action Execution Description = " + actionItem.executionDescription + '; Turbonomic Action state = ' + actionItem.state + '; Action Approval state = ' + actionApprovalState;

                // Add audit record to mention the invalid Turbonomic action state
                this._actionDAO.createOrUpdateActionRecord(actionItem.oid, details, '', targetEntityId, this._actionDAO.valueOrEmptyStr(actionItem.actionLifeCycleEvent));

                failed.push({'oid' : actionItem.oid,
                    'errorMsg' : 'Cannot update Action Approval entry for Turbonomic action with state: ' + actionItem.state
                });
                break;
            default :
                this._log.warn('TurbonomicActionApprovalManager.updateActionApprovalForInProgressCase() - ' +
                    'Unsupported action approval state: ' + actionApprovalState);
        }
    }

    /**
     * Update an existing Action Approval entry, for a Turbonomic action on SUCCEEDED state.
     *
     * @param actionItem The input Turbonomic action item.
     * @param actionApproval The Action Approval entry that will be updated.
     * @param targetEntityId The ID of the target Turbonomic entity, for the action approval that will be updated.
     * @param failed The input array with the details about the failed approval updates.
     * @param succeeded The input array with the details about the successful approval updates.
     */
    updateActionApprovalForSucceededCase (actionItem, actionApproval: TurbonomicActionApproval, targetEntityId: string, failed, succeeded): void {
        let actionApprovalState: string = this._actionDAO.getActionStateById(actionApproval.getStateId()).toUpperCase();

        switch (actionApprovalState) {
            case TurbonomicActionApprovalState.SUCCEEDED :
                this._log.debug('TurbonomicActionApprovalManager.updateActionApprovalForSucceededCase() - ' +
                    'The Action Approval state is SUCCEEDED, for the succeeded Turbonomic action with OID: ' + actionItem.oid);

                let changeRequest: TurbonomicChangeRequest = this._actionDAO.getChangeRequestById(actionApproval.getChangeRequestId());
                succeeded.push({'oid' : actionItem.oid,
                    'changeRequestId' : actionApproval.getChangeRequestId(),
                    'changeRequestNumber' : changeRequest.getNumber(),
                    'state' : TurbonomicActionApprovalState.SUCCEEDED
                });
                break;
            case TurbonomicActionApprovalState.APPROVED :
            case TurbonomicActionApprovalState.WAITING_FOR_EXEC :
            case TurbonomicActionApprovalState.IN_PROGRESS :
                this._log.debug('TurbonomicActionApprovalManager.updateActionApprovalForSucceededCase() - ' +
                    'The Action Approval state is APPROVED, WAITING_FOR_EXEC or IN_PROGRESS, for the succeeded Turbonomic action with OID: ' + actionItem.oid);
                var details =
                  "Action successfully executed with message: " +
                  actionItem.executionDescription;
                let changeRequestInfo = this.moveChangeRequest(
                    'TurbonomicActionApprovalManager.updateActionApprovalForSucceededCase()',
                    actionItem,
                    actionApproval,
                    TurbonomicChangeRequestState.CLOSE_CODE_SUCCESSFUL,
                    failed
                );
                if (!changeRequestInfo) {
                    break;
                }

                let stateId: string = this._actionDAO.getActionStateId(TurbonomicActionApprovalState.SUCCEEDED);
                if (this._actionDAO.updateLastModifiedActionApprovalField(actionItem.oid, 'u_state', stateId)) {
                    succeeded.push({'oid' : actionItem.oid,
                        'changeRequestId' : changeRequestInfo.changeRequestId,
                        'changeRequestNumber' : changeRequestInfo.changeRequestNumber,
                        'state' : TurbonomicActionApprovalState.SUCCEEDED
                    });

                    this._log.debug('TurbonomicActionApprovalManager.updateActionApprovalForSucceededCase() - ' +
                        'Successfully set the action approval state to SUCCEEDED, for the succeeded Turbonomic action with OID: ' + actionItem.oid);
                } else {
                    failed.push({'oid' : actionItem.oid,
                        'errorMsg' : 'Cannot set the state to SUCCEEDED for action approval with OID: ' + actionItem.oid
                    });
                }

                this.updateActionExecutionDescription(actionItem);

                break;
            case TurbonomicActionApprovalState.PENDING_APPROVAL :
            case TurbonomicActionApprovalState.WAITING_FOR_CR_SCHEDULE :
            case TurbonomicActionApprovalState.REJECTED :
            case TurbonomicActionApprovalState.FAILED :
            case TurbonomicActionApprovalState.MISSED :
                this._log.debug('TurbonomicActionApprovalManager.updateActionApprovalForSucceededCase() - ' +
                    'Cannot update the Action Approval entry for Turbonomic action on SUCCEEDED state. Action Approval state = ' + actionApprovalState);

                var details: string = "Unexpected state transition detected. Action Execution Description = " + actionItem.executionDescription + '; Turbonomic Action state = ' + actionItem.state + '; Action Approval state = ' + actionApprovalState;

                // Add audit record to mention the invalid Turbonomic action state
                this._actionDAO.createOrUpdateActionRecord(actionItem.oid, details, '', targetEntityId, this._actionDAO.valueOrEmptyStr(actionItem.actionLifeCycleEvent));

                failed.push({'oid' : actionItem.oid,
                    'errorMsg' : 'Cannot update Action Approval entry for Turbonomic action with state: ' + actionItem.state
                });
                break;
            default :
                this._log.warn('TurbonomicActionApprovalManager.updateActionApprovalForSucceededCase() - ' +
                    'Unsupported action approval state: ' + actionApprovalState);
        }
    }

    /**
     * Update an existing Action Approval entry, for a Turbonomic action on FAILED state.
     *
     * @param actionItem The input Turbonomic action item.
     * @param actionApproval The Action Approval entry that will be updated.
     * @param targetEntityId The ID of the target Turbonomic entity, for the action approval that will be updated.
     * @param failed The input array with the details about the failed approval updates.
     * @param succeeded The input array with the details about the successful approval updates.
     */
    updateActionApprovalForFailedCase (actionItem, actionApproval: TurbonomicActionApproval, targetEntityId: string, failed, succeeded): void {
        let actionApprovalState: string = this._actionDAO.getActionStateById(actionApproval.getStateId()).toUpperCase();

        switch (actionApprovalState) {
            case TurbonomicActionApprovalState.FAILED :
                this._log.debug('TurbonomicActionApprovalManager.updateActionApprovalForFailedCase() - ' +
                    'The Action Approval state is FAILED, for the failed Turbonomic action with OID: ' + actionItem.oid);

                let changeRequest: TurbonomicChangeRequest = this._actionDAO.getChangeRequestById(actionApproval.getChangeRequestId());
                succeeded.push({'oid' : actionItem.oid,
                    'changeRequestId' : actionApproval.getChangeRequestId(),
                    'changeRequestNumber' : changeRequest.getNumber(),
                    'state' : TurbonomicActionApprovalState.FAILED
                });
                break;
            case TurbonomicActionApprovalState.APPROVED :
            case TurbonomicActionApprovalState.WAITING_FOR_EXEC :
            case TurbonomicActionApprovalState.IN_PROGRESS :
                this._log.debug('TurbonomicActionApprovalManager.updateActionApprovalForFailedCase() - ' +
                    'The Action Approval state is APPROVED, WAITING_FOR_EXEC or IN_PROGRESS, for the failed Turbonomic action with OID: ' + actionItem.oid);
                var details =
                  "Action failed to get executed with message: " +
                  actionItem.executionDescription;
                let changeRequestInfo = this.moveChangeRequest(
                    'TurbonomicActionApprovalManager.updateActionApprovalForFailedCase()',
                    actionItem,
                    actionApproval,
                    TurbonomicChangeRequestState.CLOSE_CODE_UNSUCCESSFUL,
                    failed
                );
                if (!changeRequestInfo) {
                    break;
                }

                let stateId: string = this._actionDAO.getActionStateId(TurbonomicActionApprovalState.FAILED);
                if (this._actionDAO.updateLastModifiedActionApprovalField(actionItem.oid, 'u_state', stateId)) {
                    succeeded.push({'oid' : actionItem.oid,
                        'changeRequestId' : changeRequestInfo.changeRequestId,
                        'changeRequestNumber' : changeRequestInfo.changeRequestNumber,
                        'state' : TurbonomicActionApprovalState.FAILED
                    });

                    this._log.debug('TurbonomicActionApprovalManager.updateActionApprovalForFailedCase() - ' +
                        'Successfully set the action approval state to FAILED, for the failed Turbonomic action with OID: ' + actionItem.oid);
                } else {
                    failed.push({'oid' : actionItem.oid,
                        'errorMsg' : 'Cannot set the state to FAILED for action approval with OID: ' + actionItem.oid
                    });
                }

                this.updateActionExecutionDescription(actionItem);

                break;
            case TurbonomicActionApprovalState.PENDING_APPROVAL :
            case TurbonomicActionApprovalState.WAITING_FOR_CR_SCHEDULE :
            case TurbonomicActionApprovalState.REJECTED :
            case TurbonomicActionApprovalState.SUCCEEDED :
            case TurbonomicActionApprovalState.MISSED :
                this._log.debug('TurbonomicActionApprovalManager.updateActionApprovalForFailedCase() - ' +
                    'Cannot update the Action Approval entry for Turbonomic action on FAILED state. Action Approval state = ' + actionApprovalState);

                var details: string = "Unexpected state transition detected. Action Execution Description = " + actionItem.executionDescription + '; Turbonomic Action state = ' + actionItem.state + '; Action Approval state = ' + actionApprovalState;

                // Add audit record to mention the invalid Turbonomic action state
                this._actionDAO.createOrUpdateActionRecord(actionItem.oid, details, '', targetEntityId, this._actionDAO.valueOrEmptyStr(actionItem.actionLifeCycleEvent));

                failed.push({'oid' : actionItem.oid,
                    'errorMsg' : 'Cannot update Action Approval entry for Turbonomic action with state: ' + actionItem.state
                });
                break;
            default :
                this._log.warn('TurbonomicActionApprovalManager.updateActionApprovalForFailedCase() - ' +
                    'Unsupported action approval state: ' + actionApprovalState);
        }
    }

    /**
     * Update an existing Action Approval entry, for a Turbonomic action on QUEUED state.
     *
     * @param actionItem The input Turbonomic action item.
     * @param actionApproval The Action Approval entry that will be updated.
     * @param targetEntityId The ID of the target Turbonomic entity, for the action approval that will be updated.
     * @param failed The input array with the details about the failed approval updates.
     * @param succeeded The input array with the details about the successful approval updates.
     */
    updateActionApprovalForQueuedCase (actionItem, actionApproval: TurbonomicActionApproval, targetEntityId: string, failed, succeeded): void {
        let actionApprovalState: string = this._actionDAO.getActionStateById(actionApproval.getStateId()).toUpperCase();
        let counter: number = actionApproval.getCount() + 1;

        switch (actionApprovalState) {
            case TurbonomicActionApprovalState.WAITING_FOR_EXEC :
                this._log.debug('TurbonomicActionApprovalManager.updateActionApprovalForQueuedCase() - ' +
                    'The Action Approval state is already set to WAITING_FOR_EXEC, for the queued Turbonomic action with OID: ' + actionItem.oid);

                if (this._actionDAO.updateLastModifiedActionApprovalField(actionItem.oid, 'u_count', counter)) {
                    this._log.debug('TurbonomicActionApprovalManager.updateActionApprovalForQueuedCase() - ' +
                        'Successfully updated the action approval counter value; counter = ' + counter);
                } else {
                    this._log.debug('TurbonomicActionApprovalManager.updateActionApprovalForQueuedCase() - ' +
                        'Failed to update the action approval counter value; counter = ' + counter);
                }

                var changeRequestInfo = this.moveChangeRequest(
                    'TurbonomicActionApprovalManager.updateActionApprovalForQueuedCase()',
                    actionItem,
                    actionApproval,
                    TurbonomicChangeRequestState.IMPLEMENT, failed
                );
                if (!changeRequestInfo) {
                    break;
                }

                succeeded.push({'oid' : actionItem.oid,
                    'changeRequestId' : changeRequestInfo.changeRequestId,
                    'changeRequestNumber' : changeRequestInfo.changeRequestNumber,
                    'state' : TurbonomicActionApprovalState.WAITING_FOR_EXEC
                });
                break;
            case TurbonomicActionApprovalState.APPROVED :
                this._log.debug('TurbonomicActionApprovalManager.updateActionApprovalForQueuedCase() - ' +
                    'The Action Approval state is APPROVED, for the queued Turbonomic action with OID: ' + actionItem.oid);

                if (this._actionDAO.updateLastModifiedActionApprovalField(actionItem.oid, 'u_count', counter)) {
                    this._log.debug('TurbonomicActionApprovalManager.updateActionApprovalForQueuedCase() - ' +
                        'Successfully updated the action approval counter value; counter = ' + counter);
                } else {
                    this._log.debug('TurbonomicActionApprovalManager.updateActionApprovalForQueuedCase() - ' +
                        'Failed to update the action approval counter value; counter = ' + counter);
                }

                var changeRequestInfo = this.moveChangeRequest(
                    'TurbonomicActionApprovalManager.updateActionApprovalForQueuedCase()',
                    actionItem,
                    actionApproval,
                    TurbonomicChangeRequestState.IMPLEMENT, failed
                );
                if (!changeRequestInfo) {
                    break;
                }

                let stateId: string = this._actionDAO.getActionStateId(TurbonomicActionApprovalState.WAITING_FOR_EXEC);
                if (this._actionDAO.updateLastModifiedActionApprovalField(actionItem.oid, 'u_state', stateId)) {
                    succeeded.push({'oid' : actionItem.oid,
                        'changeRequestId' : changeRequestInfo.changeRequestId,
                        'changeRequestNumber' : changeRequestInfo.changeRequestNumber,
                        'state' : TurbonomicActionApprovalState.WAITING_FOR_EXEC
                    });

                    this._log.debug('TurbonomicActionApprovalManager.updateActionApprovalForQueuedCase() - ' +
                        'Successfully set the action approval state to WAITING_FOR_EXEC, for the queued Turbonomic action with OID: ' + actionItem.oid);
                } else {
                    failed.push({'oid' : actionItem.oid,
                        'errorMsg' : 'Cannot set the state to WAITING_FOR_EXEC for action approval with OID: ' + actionItem.oid
                    });
                }

                this.updateActionExecutionDescription(actionItem);

                break;
            case TurbonomicActionApprovalState.PENDING_APPROVAL :
            case TurbonomicActionApprovalState.WAITING_FOR_CR_SCHEDULE :
            case TurbonomicActionApprovalState.REJECTED :
            case TurbonomicActionApprovalState.IN_PROGRESS :
            case TurbonomicActionApprovalState.MISSED :
            case TurbonomicActionApprovalState.FAILED :
            case TurbonomicActionApprovalState.SUCCEEDED :
                this._log.debug('TurbonomicActionApprovalManager.updateActionApprovalForQueuedCase() - ' +
                    'Cannot update the Action Approval entry for Turbonomic action on QUEUED state. Action Approval state = ' + actionApprovalState);

                let details: string = "Unexpected state transition detected. Action Execution Description = " + actionItem.executionDescription + '; Turbonomic Action state = ' + actionItem.state + '; Action Approval state = ' + actionApprovalState;

                // Add audit record to mention the invalid Turbonomic action state
                this._actionDAO.createOrUpdateActionRecord(actionItem.oid, details, '', targetEntityId, this._actionDAO.valueOrEmptyStr(actionItem.actionLifeCycleEvent));

                failed.push({'oid' : actionItem.oid,
                    'errorMsg' : 'Cannot update Action Approval entry for Turbonomic action with state: ' + actionItem.state
                });
                break;
            default :
                this._log.warn('TurbonomicActionApprovalManager.updateActionApprovalForQueuedCase() - ' +
                    'Unsupported action approval state: ' + actionApprovalState);
        }
    }

    /**
     * Update an existing Action Approval entry, for a Turbonomic action on DISABLED or RECOMMENDED state.
     *
     * @param actionItem The input Turbonomic action item.
     * @param actionApproval The Action Approval entry that will be updated.
     * @param targetEntityId The ID of the target Turbonomic entity, for the action approval that will be updated.
     * @param failed The input array with the details about the failed approval updates.
     * @param succeeded The input array with the details about the successful approval updates.
     */
    updateActionApprovalForDisabledCase (actionItem, actionApproval: TurbonomicActionApproval, targetEntityId: string, failed): void {
        let actionApprovalState: string = this._actionDAO.getActionStateById(actionApproval.getStateId()).toUpperCase();

        switch (actionApprovalState) {
            case TurbonomicActionApprovalState.PENDING_APPROVAL :
            case TurbonomicActionApprovalState.WAITING_FOR_CR_SCHEDULE :
            case TurbonomicActionApprovalState.APPROVED :
            case TurbonomicActionApprovalState.REJECTED :
            case TurbonomicActionApprovalState.WAITING_FOR_EXEC :
            case TurbonomicActionApprovalState.IN_PROGRESS :
            case TurbonomicActionApprovalState.FAILED :
            case TurbonomicActionApprovalState.SUCCEEDED :
            case TurbonomicActionApprovalState.MISSED :
                this._log.debug('TurbonomicActionApprovalManager.updateActionApprovalForDisabledCase() - ' +
                    'Cannot update the Action Approval entry for Turbonomic action on DISABLED or RECOMMENDED state. Action Approval state = ' + actionApprovalState);

                let details: string = "Unexpected state transition detected. Action Execution Description = " + actionItem.description + '; Turbonomic Action state = ' + actionItem.state + '; Action Approval state = ' + actionApprovalState;

                // Add audit record to mention the invalid Turbonomic action state
               this._actionDAO.createOrUpdateActionRecord(actionItem.oid, details, '', targetEntityId, this._actionDAO.valueOrEmptyStr(actionItem.actionLifeCycleEvent));

                failed.push({'oid' : actionItem.oid,
                    'errorMsg' : 'Cannot update Action Approval entry for Turbonomic action with state: ' + actionItem.state
                });
                break;
            default :
                this._log.warn('TurbonomicActionApprovalManager.updateActionApprovalForDisabledCase() - ' +
                    'Unsupported action approval state: ' + actionApprovalState);
        }
    }

    /**
     * Adds a work note using the information from action, to change request linked to the action
     * approval. If change requests is disabled in settings, we do not add a work note to the change
     * request.
     *
     * @param logPrefix The prefix used for logging when something bad happens, or debugging.
     * @param actionItem The action item to get the details that are placed into the work note of
     *                   the change request.
     * @param actionApproval The action approval that has a change request that we add a work note
     *                       to.
     * @return the change request that was changed.
     *         returns empty change request if change requests are disabled.
     *         returns undefined if there was an error.
     */
    addWorkNoteToChangeRequest (logPrefix: string, actionItem, actionApproval: TurbonomicActionApproval, failed) {
        return this.moveChangeRequest(
            logPrefix,
            actionItem,
            actionApproval,
            null,
            failed); // indicates that there is no state change. work note is still added
    }

    /**
     * Adds a work note to the change request and also moves the change request into the state given by newCRState.
     * If change requests is disabled in settings, the change request is not modified.
     *
     * @param logPrefix The prefix used for logging when something bad happens, or debugging.
     * @param actionItem The action item to get the details that are placed into the work note of
     *                   the change request.
     * @param actionApproval The action approval that has a change request that we add a work note
     *                       to and update the change request's state to newCRState.
     * @param newCRState The state to move the change request state to.
     *                   null means do not change the state.
     * @param failed The input array with the details about the failed approval updates.
     * @return the change request that was changed.
     *         returns empty change request if change requests are disabled.
     *         returns undefined if there was an error.
     */
    moveChangeRequest (logPrefix: string, actionItem, actionApproval: TurbonomicActionApproval, newCRState: string, failed) {
        let changeRequestId;
        let changeRequestNumber;

        if (this._actionDAO.isChangeRequestDisabled()) {
            let emptyChangeRequest = this._actionDAO.makeEmptyChangeRequest();
            changeRequestId = emptyChangeRequest.getId();
            changeRequestNumber = emptyChangeRequest.getNumber();
        } else {
            // update change request
            let changeRequestRecord = this._changeRequestDAO.getChangeRequestBySysId(actionApproval.getChangeRequestId());
            changeRequestId = actionApproval.getChangeRequestId();
            if (changeRequestRecord == null) {
                let errorMsg = logPrefix + " - could not find change request for approval: "
                    + actionApproval.getActionOID() + " action from Turbonomic: " + JSON.stringify(actionItem);
                this._log.info(errorMsg);
                failed.push({'oid' : actionItem.oid, 'errorMsg' : errorMsg });
                return;
            }

            this.addWorkNoteToChangeRequestRecord(changeRequestId, actionItem);
            switch (newCRState) {
                case TurbonomicChangeRequestState.IMPLEMENT :
                    this.moveChangeRequestToImplement(changeRequestId, changeRequestRecord.getState());
                    break;
                case TurbonomicChangeRequestState.CLOSE_CODE_SUCCESSFUL :
                case TurbonomicChangeRequestState.CLOSE_CODE_UNSUCCESSFUL :
                    this.moveChangeRequestToClosed(changeRequestId, actionItem, newCRState);
                    break;
            }

            changeRequestNumber = changeRequestRecord.getNumber();
        }

        return {changeRequestId: changeRequestId, changeRequestNumber: changeRequestNumber};
    }

    /**
     * Adds a worknote using details from the actionItem into the provided changeRequestRecord.
     *
     * @param changeRequestId The sys_id of the change request to add work notes to.
     * @param actionItem The action item to extract details from to put into the change request.
     */
    addWorkNoteToChangeRequestRecord (changeRequestId, actionItem): void {
        let progress: number = actionItem.progress;
        let workNote: string = actionItem.executionDescription;
        if (workNote != null && progress != null && progress > 0) {
            this._actionDAO.insertIntoImportSet(
                TurbonomicTableNames.CHANGE_REQUEST_IMPORT_SET,
                {
                  u_update_sys_id: changeRequestId, // use the sysId to update
                  u_work_notes:
                    "Action execution progress is " + progress + "%. " + workNote
                },
                "TurbonomicActionApprovalManager.addWorkNoteToChangeRequestRecord() - Successfully added worknote to change_request: " +
                changeRequestId
            );
        }
    }

    /**
     * Adds a worknote usind details from the actionItem into the provided changeRequestRecord.
     *
     * @param logPrefix The prefix prepended to log messages
     * @param actionApproval The action approval we are adding worknote to.
     * @param workNote the string that will be added to wroknote.
     * @returns an object that has changeRequestId and changeRequestNumber for the change request
     * record associated to that approval.
     */
    addWorkNote (logPrefix, actionApproval, workNote) {
      var changeRequestRecord = this._changeRequestDAO.getChangeRequestBySysId(
        actionApproval.getChangeRequestId()
      );
      var changeRequestId;
      var changeRequestNumber;
      if (changeRequestRecord == null) {
        var errorMsg =
          logPrefix +
          " - could not find change request for approval: " +
          actionApproval.oid +
          " in order to add work note: " +
          workNote;
        this._log.info(errorMsg);
        return;
      }
      changeRequestId = actionApproval.getChangeRequestId();
      changeRequestNumber = changeRequestRecord.getNumber();
      this._actionDAO.insertIntoImportSet(
        TurbonomicTableNames.CHANGE_REQUEST_IMPORT_SET,
        {
          u_update_sys_id: changeRequestId, // use the sysId to update
          u_work_notes: workNote
        },
        "TurbonomicActionApprovalManager.addWorkNote() - Successfully added worknote to change_request: " +
          changeRequestId
      );
      return {
        changeRequestId: changeRequestId,
        changeRequestNumber: changeRequestNumber
      };
    };
    
    /**
     * Puts a change request into the implement state.
     *
     * @param changeRequestId The sys_id of the change request to put into the implement state.
     * @param stateStr The current state of the change request.
     */
    moveChangeRequestToImplement (changeRequestId, stateStr): void {
        if (stateStr === TurbonomicChangeRequestState.SCHEDULED) {
            this._actionDAO.insertIntoImportSet(
                TurbonomicTableNames.CHANGE_REQUEST_IMPORT_SET,
                {
                  u_update_sys_id: changeRequestId, // use the sysId to update
                  u_state: TurbonomicChangeRequestState.IMPLEMENT
                },
                "TurbonomicActionApprovalManager.moveChangeRequestToImplement() - Successfully moved change request to implement: " +
                  changeRequestId
            );
        }
    }

    /**
     * Closes the provided change request with details from the actionItem and closure code provided
     * by success.
     *
     * @param changeRequestId The sys_id of the change request to close.
     * @param actionItem The actionItem to extract action execution details from.
     * @param success The close code to close the change request with.
     */
    moveChangeRequestToClosed (changeRequestId, actionItem, success): void {
        var changeRequestRecord = this._changeRequestDAO.getChangeRequestBySysId(
          changeRequestId
        );
        var stateStr = changeRequestRecord.getState();
        this.moveChangeRequestToImplement(changeRequestId, stateStr);
        // since updates go through import set, changes to change_request will not reach our current
        // glide record reference. need to get a more recent view of change_request
        changeRequestRecord = this._changeRequestDAO.getChangeRequestBySysId(
          changeRequestId
        );
        stateStr = changeRequestRecord.getState();
        if (stateStr === TurbonomicChangeRequestState.IMPLEMENT) {
          this._actionDAO.insertIntoImportSet(
            TurbonomicTableNames.CHANGE_REQUEST_IMPORT_SET,
            {
              u_update_sys_id: changeRequestId, // use the sysId to update
              u_state: TurbonomicChangeRequestState.REVIEW
            },
            "TurbonomicActionApprovalManager.moveChangeRequestToClosed() - Successfully moved changed request to review: " +
              changeRequestId
          );
        }
        // since updates go through import set, changes to change_request will not reach our current
        // glide record reference. need to get a more recent view of change_request
        changeRequestRecord = this._changeRequestDAO.getChangeRequestBySysId(
          changeRequestId
        );
        stateStr = changeRequestRecord.getState();
        if (stateStr === TurbonomicChangeRequestState.REVIEW) {
          this._actionDAO.insertIntoImportSet(
            TurbonomicTableNames.CHANGE_REQUEST_IMPORT_SET,
            {
              u_update_sys_id: changeRequestId, // use the sysId to update
              u_state: TurbonomicChangeRequestState.CLOSED,
              u_close_code: success,
              u_close_notes: actionItem.description
            },
            "TurbonomicActionApprovalManager.moveChangeRequestToClosed() - Successfully closed changed request: " +
              changeRequestId
          );
        }
    }

    /**
     * Update action's execution description.
     * @param actionItem The actionItem to extract action execution details from.
     */
    updateActionExecutionDescription (actionItem): void {
        let executionDescription: string = actionItem.executionDescription;
        this._actionDAO.updateLastModifiedActionApprovalField(actionItem.oid, 'u_most_recent__on_description', executionDescription);
    }

    /**
     * Mark the action approvals as missed, if their OIDs are not in the input array.
     */
    markMissedActionApprovals () {
        let changeRequestIds = this._actionDAO.markMissedActionApprovals();
        this._changeRequestDAO.cancelChangeRequests(changeRequestIds);
    };

    /**
     * Update an existing Action Approval entry based on the CR schedule. The valid Turbonomic action state are PENDING_ACCEPT or ACCEPTED.
     *
     * @param actionItem The input Turbonomic action item.
     * @param actionApproval The Action Approval entry that will be updated.
     * @param logPrefix The input log prefix string.
     * @param failed The input array with the details about the failed approval updates.
     * @param succeeded The input array with the details about the successful approval updates.
     */
    updateActionApprovalWaitingForChangeRequestSchedule (actionItem, actionApproval, logPrefix, failed, succeeded) {
        let actionUtils: TurbonomicActionUtils = new TurbonomicActionUtils();
        let actionApprovalState: string = this._actionDAO.getActionStateById(actionApproval.getStateId()).toUpperCase();
        let changeRequest: TurbonomicChangeRequest = new TurbonomicChangeRequest();
        let counter: number = actionApproval.getCount() + 1;

        if (this._actionDAO.updateLastModifiedActionApprovalField(actionItem.oid, 'u_count', counter)) {
            this._log.debug(logPrefix + 'Successfully updated the counter for action approval waiting for CR schedule; ' +
                     'Action OID = ' + actionItem.oid);
        } else {
            this._log.warn(logPrefix + 'Cannot update the counter for action approval waiting for CR schedule; ' +
                    'Action OID = ' + actionItem.oid);
            failed.push({'oid' : actionItem.oid,
                         'errorMsg' : 'Cannot update the counter for action approval with OID: ' + actionItem.oid
            });
            return;
        }

        changeRequest = this._actionDAO.getChangeRequestById(actionApproval.getChangeRequestId());
        if (this._actionDAO.isChangeRequestDisabled()) {
            this._log.debug(logPrefix + 'Change request and matching action approval state changes are handled by custom business rule(s)');
            succeeded.push({'oid' : actionItem.oid,
                            'changeRequestId' : actionApproval.getChangeRequestId(),
                            'changeRequestNumber' : changeRequest.getNumber(),
                            'state' : TurbonomicActionApprovalState.PENDING_APPROVAL
            });

            return;
        }

        this._log.debug(logPrefix + 'The action approval state is WAITING_FOR_CR_SCHEDULE. Checking if the CR schedule is ON.');

        var changeRequestRecord = this._turbonomicGlide.accessTable(TurbonomicTableNames.CHANGE_REQUEST);
        changeRequestRecord.addQuery('sys_id', actionApproval.getChangeRequestId());
        changeRequestRecord.query();

        if (!changeRequestRecord.next()) {
            this._log.warn(logPrefix + 'Cannot find the matching CR for action approval waiting for CR schedule; ' +
                    'Change Request ID = ' + actionApproval.getChangeRequestId());
            failed.push({'oid' : actionItem.oid,
                         'errorMsg' : 'Cannot find the change request record with ID: ' + actionApproval.getChangeRequestId()
            });
            return;
		}

        let approvalSysId = actionApproval.getSysId();
        var actionStateId = '';
        let changeRequestState = changeRequestRecord.state + '';

        this._log.debug(logPrefix + 'Change Request State = ' + actionUtils.printRequestState(changeRequestState) +
                 ', matching action approval state = ' + actionApprovalState + '; CR number = ' + changeRequest.getNumber());

        switch (changeRequestState) {
            case TurbonomicChangeRequestState.SCHEDULED:
            case TurbonomicChangeRequestState.IMPLEMENT:
                if (changeRequestRecord.start_date == null || actionUtils.isChangeRequestScheduleOn(changeRequestRecord)) {
                    this._log.debug(logPrefix + 'The CR schedule is ON or is not configured.');
                    actionStateId = this._actionDAO.getActionStateId(TurbonomicActionApprovalState.APPROVED);
                    this._actionDAO.insertIntoImportSet(TurbonomicTableNames.ACTION_APPROVAL_IMPORT_SET,
                        {
                            u_update_sys_id: approvalSysId, // use the sysId to update
                            u_state: actionStateId
                        },
                        logPrefix + 'Successfully APPROVED the matching action approval entry for change request: ' +
                            changeRequest.getNumber());

                    succeeded.push({'oid' : actionItem.oid,
                                    'changeRequestId' : actionApproval.getChangeRequestId(),
                                    'changeRequestNumber' : changeRequest.getNumber(),
                                    'state' : TurbonomicActionApprovalState.APPROVED
                    });
                } else {
                    var actionItemState = actionItem.state.toUpperCase();
                    if (actionItemState.equals(TurbonomicActionItemState.PENDING_ACCEPT)) {
                        this._log.debug(logPrefix + 'The CR schedule is not ON.');
                        succeeded.push({'oid' : actionItem.oid,
                                        'changeRequestId' : actionApproval.getChangeRequestId(),
                                        'changeRequestNumber' : changeRequest.getNumber(),
                                        'state' : TurbonomicActionApprovalState.PENDING_APPROVAL
                        });
                    } else if (actionItemState.equals(TurbonomicActionItemState.ACCEPTED)) {
                        this._log.debug(logPrefix + 'The CR schedule is not ON for an already approved Turbonomic action.');
                        succeeded.push({'oid' : actionItem.oid,
                                        'changeRequestId' : actionApproval.getChangeRequestId(),
                                        'changeRequestNumber' : changeRequest.getNumber(),
                                        'state' : TurbonomicActionApprovalState.APPROVED
                        });
					} else {
                        this._log.warn(logPrefix + 'The CR schedule is not ON for a Turbonomic action with state: ' + actionItemState);
                        succeeded.push({'oid' : actionItem.oid,
                                        'changeRequestId' : actionApproval.getChangeRequestId(),
                                        'changeRequestNumber' : changeRequest.getNumber(),
                                        'state' : TurbonomicActionApprovalState.PENDING_APPROVAL
                        });
                    }
                }

                break;
            case TurbonomicChangeRequestState.CANCELLED:
                this._log.debug(logPrefix + 'The CR has been canceled.');
                actionStateId = this._actionDAO.getActionStateId(TurbonomicActionApprovalState.REJECTED);
                this._actionDAO.insertIntoImportSet(TurbonomicTableNames.ACTION_APPROVAL_IMPORT_SET,
                    {
                        u_update_sys_id: approvalSysId, // use the sysId to update
                        u_state: actionStateId
                    },
                    logPrefix + 'Successfully REJECTED the matching action approval entry for change request: ' +
                        changeRequest.getNumber());

                succeeded.push({'oid' : actionItem.oid,
                                'changeRequestId' : actionApproval.getChangeRequestId(),
                                'changeRequestNumber' : changeRequest.getNumber(),
                                'state' : TurbonomicActionApprovalState.REJECTED
                });

                break;
            default:
                this._log.debug(logPrefix + 'CR state = ' + changeRequestState);
                succeeded.push({'oid' : actionItem.oid,
                                'changeRequestId' : actionApproval.getChangeRequestId(),
                                'changeRequestNumber' : changeRequest.getNumber(),
                                'state' : TurbonomicActionApprovalState.PENDING_APPROVAL
                });
        }
    };

}
