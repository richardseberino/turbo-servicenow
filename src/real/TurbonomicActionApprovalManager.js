var TurbonomicActionApprovalManager =  (function () {

    TurbonomicActionApprovalManager.prototype.type = 'TurbonomicActionApprovalManager';

    function TurbonomicActionApprovalManager() {
        this._turbonomicActionItemState = new TurbonomicActionItemState();
        this._actionApprovalState = new TurbonomicActionApprovalState();
        this._changeRequestStates = new TurbonomicChangeRequestState();
        this._changeRequestDAO = new TurbonomicChangeRequestDAO();
        this._actionDAO = new TurbonomicActionDAO();
        this._tableNames = new TurbonomicTableNames();
    }

    /**
     * Update an existing Action Approval entry, based on the input values.
     *
     * @param actionItem The input Turbonomic action item.
     * @param actionApproval The Action Approval entry that will be updated.
     * @param sourceEntityId The ID of the source Turbonomic entity, for the action approval that will be updated.
     * @param destinationEntityId The ID of the destination Turbonomic entity, for the action approval that will be updated.
     * @param targetEntityId The ID of the target Turbonomic entity, for the action approval that will be updated.
     * @param failed The input array with the details about the failed approval updates.
     * @param succeeded The input array with the details about the successful approval updates.
     */
    TurbonomicActionApprovalManager.prototype.updateActionApprovalEntry = function(actionItem, actionApproval, sourceEntityId, destinationEntityId, targetEntityId, actionDto, failed, succeeded) {
        var actionItemState = actionItem.state.toUpperCase();

        switch (actionItemState) {
            case this._turbonomicActionItemState.PENDING_ACCEPT :
                this.updateActionApprovalForPendingAcceptCase(actionItem, actionApproval, sourceEntityId, destinationEntityId, targetEntityId, actionDto, failed, succeeded);
                break;
            case this._turbonomicActionItemState.ACCEPTED :
                this.updateActionApprovalForAcceptedCase(actionItem, actionApproval, targetEntityId, failed, succeeded);
                break;
            case this._turbonomicActionItemState.CLEARED :
                this.updateActionApprovalForClearedCase(actionItem, actionApproval, targetEntityId, failed, succeeded);
                break;
            case this._turbonomicActionItemState.REJECTED :
                this.updateActionApprovalForRejectedCase(actionItem, actionApproval, targetEntityId, failed, succeeded);
                break;
            case this._turbonomicActionItemState.IN_PROGRESS :
                this.updateActionApprovalForInProgressCase(actionItem, actionApproval, targetEntityId, failed, succeeded);
                break;
            case this._turbonomicActionItemState.SUCCEEDED :
                this.updateActionApprovalForSucceededCase(actionItem, actionApproval, targetEntityId, failed, succeeded);
                break;
            case this._turbonomicActionItemState.FAILED :
                this.updateActionApprovalForFailedCase(actionItem, actionApproval, targetEntityId, failed, succeeded);
                break;
            case this._turbonomicActionItemState.QUEUED :
                this.updateActionApprovalForQueuedCase(actionItem, actionApproval, targetEntityId, failed, succeeded);
                break;
            case this._turbonomicActionItemState.DISABLED :
            case this._turbonomicActionItemState.RECOMMENDED :
                this.updateActionApprovalForDisabledCase(actionItem, actionApproval, targetEntityId, failed);
                break;
            default :
                gs.warn('TurbonomicActionApprovalManager.updateActionApprovalEntry() - ' +
                        'Unsupported action item state: ' + actionItem.state);
                failed.push({'oid' : actionItem.oid,
                             'errorMsg' : 'Unsupported action state: ' + actionItem.state + ' while processing action ' + actionItem.oid
                });
        }
    };

    /**
     * Update an existing Action Approval entry, for a Turbonomic action on PENDING_ACCEPT state.
     *
     * @param actionItem The input Turbonomic action item.
     * @param actionApproval The Action Approval entry that will be updated.
     * @param sourceEntityId The ID of the source Turbonomic entity, for the action approval that will be updated.
     * @param destinationEntityId The ID of the destination Turbonomic entity, for the action approval that will be updated.
     * @param targetEntityId The ID of the target Turbonomic entity, for the action approval that will be updated.
     * @param failed The input array with the details about the failed approval updates.
     * @param succeeded The input array with the details about the successful approval updates.
     */
    TurbonomicActionApprovalManager.prototype.updateActionApprovalForPendingAcceptCase = function(actionItem, actionApproval, sourceEntityId, destinationEntityId, targetEntityId, actionDto, failed, succeeded) {
        var actionUtils = new x_turbo_turbonomic.TurbonomicActionUtils();
        var actionApprovalState = this._actionDAO.getActionStateById(actionApproval.getStateId()).toUpperCase();
        var changeRequest = new x_turbo_turbonomic.TurbonomicChangeRequest();
        var counter = actionApproval.getCount() + 1;

        switch (actionApprovalState) {
            case this._actionApprovalState.PENDING_APPROVAL :
                gs.debug('TurbonomicActionApprovalManager.updateActionApprovalForPendingAcceptCase() - ' +
                         'Increasing the counter for pending action approval with OID: ' + actionItem.oid);

                changeRequest = this._actionDAO.getChangeRequestById(actionApproval.getChangeRequestId());
                if (this._actionDAO.updateLastModifiedActionApprovalField(actionItem.oid, 'u_count', counter)) {
                    succeeded.push({'oid' : actionItem.oid,
                                    'changeRequestId' : actionApproval.getChangeRequestId(),
                                    'changeRequestNumber' : changeRequest.getNumber(),
                                    'state' : this._actionApprovalState.PENDING_APPROVAL
                    });

                    gs.debug('TurbonomicActionApprovalManager.updateActionApprovalForPendingAcceptCase() - ' +
                             'Successfully updated the action approval counter value; counter = ' + counter);
				} else {
                    failed.push({'oid' : actionItem.oid,
                                 'errorMsg' : 'Cannot update the counter for action approval with OID: ' + actionItem.oid
                    });
                }

                break;
            case this._actionApprovalState.WAITING_FOR_CR_SCHEDULE :
                this.updateActionApprovalWaitingForChangeRequestSchedule(actionItem, actionApproval,
                        'TurbonomicActionApprovalManager.updateActionApprovalForPendingAcceptCase() - ', failed, succeeded);
                break;
            case this._actionApprovalState.APPROVED :
                gs.debug('TurbonomicActionApprovalManager.updateActionApprovalForPendingAcceptCase() - ' +
                         'Increasing the counter for action approval on APPROVED state; Action OID = ' + actionItem.oid);

                if (this._actionDAO.updateLastModifiedActionApprovalField(actionItem.oid, 'u_count', counter)) {
                    gs.debug('TurbonomicActionApprovalManager.updateActionApprovalForPendingAcceptCase() - ' +
                             'Successfully updated the action approval counter value; counter = ' + counter);
				} else {
                    gs.warn('TurbonomicActionApprovalManager.updateActionApprovalForPendingAcceptCase() - ' +
                            'Failed to update the action approval counter value; counter = ' + counter);
                }

                changeRequest = this._actionDAO.getChangeRequestById(actionApproval.getChangeRequestId());
                succeeded.push({'oid' : actionItem.oid,
                                'changeRequestId' : actionApproval.getChangeRequestId(),
                                'changeRequestNumber' : changeRequest.getNumber(),
                                'state' : this._actionApprovalState.APPROVED
                });

                gs.info('TurbonomicActionApprovalManager.updateActionApprovalForPendingAcceptCase() - ' +
                        'The change request has been approved for the Turbonomic action with OID: ' + actionItem.oid);

                break;
            case this._actionApprovalState.REJECTED :
                gs.info('TurbonomicActionApprovalManager.updateActionApprovalForPendingAcceptCase() - ' +
                        'The change request has been rejected for the Turbonomic action with OID: ' + actionItem.oid);

                if (this._actionDAO.allowApprovalsForRejectedRequests()) {
                    // Add new action approval and matching change request
                    changeRequest = this.addActionApproval(actionItem, sourceEntityId, destinationEntityId, targetEntityId, actionDto);

                    succeeded.push({'oid' : actionItem.oid,
                                    'changeRequestId' : changeRequest.getId(),
                                    'changeRequestNumber' : changeRequest.getNumber(),
                                    'state' : this._actionApprovalState.PENDING_APPROVAL
                    });
                } else {
                    gs.info('TurbonomicActionApprovalManager.updateActionApprovalForPendingAcceptCase() - ' +
                            'New action approvals are not allowed for the rejected action with OID: ' + actionItem.oid);

                    changeRequest = this._actionDAO.getChangeRequestById(actionApproval.getChangeRequestId());
                    succeeded.push({'oid' : actionItem.oid,
                                    'changeRequestId' : actionApproval.getChangeRequestId(),
                                    'changeRequestNumber' : changeRequest.getNumber(),
                                    'state' : this._actionApprovalState.REJECTED
                    });
                }
                break;
            case this._actionApprovalState.WAITING_FOR_EXEC :
            case this._actionApprovalState.IN_PROGRESS :
                gs.debug('TurbonomicActionApprovalManager.updateActionApprovalForPendingAcceptCase() - ' +
                         'The state of the approved action with OID: ' + actionItem.oid + ' is: ' + actionApprovalState);

                succeeded.push({'oid' : actionItem.oid,
                                'changeRequestId' : changeRequest.getId(),
                                'changeRequestNumber' : changeRequest.getNumber(),
                                'state' : actionApprovalState
                });
                break;
            case this._actionApprovalState.FAILED :
                if (actionUtils.isActionExecutionRecoveryTimeOn(actionItem.oid)) {
                    gs.debug('TurbonomicActionApprovalManager.updateActionApprovalForPendingAcceptCase() - ' +
                             'Skip adding new Action Approval and CR for previously failed Turbonomic action with OID: ' + actionItem.oid);
                } else {
                    gs.info('TurbonomicActionApprovalManager.updateActionApprovalForPendingAcceptCase() - ' +
                            'Adding new action approval for Turbonomic action on PENDING_ACCEPT state. Current Action Approval is FAILED');

                    // Add new action approval and matching change request
                    changeRequest = this.addActionApproval(actionItem, sourceEntityId, destinationEntityId, targetEntityId, actionDto);

                    succeeded.push({'oid' : actionItem.oid,
                                    'changeRequestId' : changeRequest.getId(),
                                    'changeRequestNumber' : changeRequest.getNumber(),
                                    'state' : this._actionApprovalState.PENDING_APPROVAL
                    });
                }
                break;
            case this._actionApprovalState.MISSED :
            case this._actionApprovalState.SUCCEEDED :
                gs.info('TurbonomicActionApprovalManager.updateActionApprovalForPendingAcceptCase() - ' +
                        'Adding new action approval for Turbonomic action on PENDING_ACCEPT state. Current Action Approval state = ' + actionApprovalState);

                // Add new action approval and matching change request
                changeRequest = this.addActionApproval(actionItem, sourceEntityId, destinationEntityId, targetEntityId, actionDto);

                succeeded.push({'oid' : actionItem.oid,
                                'changeRequestId' : changeRequest.getId(),
                                'changeRequestNumber' : changeRequest.getNumber(),
                                'state' : this._actionApprovalState.PENDING_APPROVAL
                });
                break;
            default :
                gs.warn('TurbonomicActionApprovalManager.updateActionApprovalForPendingAcceptCase() - ' +
                        'Unsupported action approval state: ' + actionApprovalState);
        }
    };

    /**
     * Add a new Action Approval entry, for a corresponding Turbonomic action.
     *
     * @param actionItem The input Turbonomic action item.
     * @param sourceEntityId The ID of the source Turbonomic entity, for the action approval that will be created.
     * @param destinationEntityId The ID of the destination Turbonomic entity, for the action approval that will be created.
     * @param targetEntityId The ID of the target Turbonomic entity, for the action approval that will be created.
     *
     * @return The TurbonomicChangeRequest with details about the change request, generated for the newly created Action Approval entry.
     */
    TurbonomicActionApprovalManager.prototype.addActionApproval = function(actionItem, sourceEntityId, destinationEntityId, targetEntityId, actionDto) {
        var configItemId = '';

        // Use the target entity to find the ServiceNow configuration item
        var targetEntity = this._actionDAO.getTurbonomicEntityById(targetEntityId);
        if (targetEntity) {
            var entityMatcher = new x_turbo_turbonomic.TurbonomicEntityMatcher();
            var configItem = entityMatcher.findConfigurationItem(targetEntity);

            if (configItem != null) {
                gs.debug('TurbonomicActionApprovalManager.addActionApproval() - The matching configuration item GUID is: ' + configItem.sys_id);
                configItemId = configItem.sys_id;
            }
        }

        // Create the corresponding change request for the action approval
        var changeRequest = this._actionDAO.createChangeRequest(actionItem.oid, configItemId, actionItem.description, actionItem.description);

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
                                 this._actionDAO.getActionStateId(this._actionApprovalState.PENDING_APPROVAL),
                                 this._actionDAO.getActionTypeId(actionItem.type),
                                 actionItem.timestampMsec,
                                 actionDto
                                );
        return changeRequest;
    };

    /**
     * Update an existing Action Approval entry, for a Turbonomic action on ACCEPTED state.
     *
     * @param actionItem The input Turbonomic action item.
     * @param actionApproval The Action Approval entry that will be updated.
     * @param targetEntityId The ID of the target Turbonomic entity, for the action approval that will be updated.
     * @param failed The input array with the details about the failed approval updates.
     * @param succeeded The input array with the details about the successful approval updates.
     */
    TurbonomicActionApprovalManager.prototype.updateActionApprovalForAcceptedCase = function(actionItem, actionApproval, targetEntityId, failed, succeeded) {
        var actionUtils = new x_turbo_turbonomic.TurbonomicActionUtils();
        var actionApprovalState = this._actionDAO.getActionStateById(actionApproval.getStateId()).toUpperCase();
        var changeRequest = new x_turbo_turbonomic.TurbonomicChangeRequest();
        var counter = actionApproval.getCount() + 1;

        switch (actionApprovalState) {
            case this._actionApprovalState.APPROVED :
                gs.debug('TurbonomicActionApprovalManager.updateActionApprovalForAcceptedCase() - ' +
                        'The Action Approval state is APPROVED, for the accepted Turbonomic action with OID: ' + actionItem.oid);

                if (this._actionDAO.updateLastModifiedActionApprovalField(actionItem.oid, 'u_count', counter)) {
                    gs.debug('TurbonomicActionApprovalManager.updateActionApprovalForAcceptedCase() - ' +
                             'Successfully updated the action approval counter value; counter = ' + counter);
				} else {
                    gs.warn('TurbonomicActionApprovalManager.updateActionApprovalForAcceptedCase() - ' +
                            'Failed to update the action approval counter value; counter = ' + counter);
                }

                var stateId = this._actionDAO.getActionStateId(this._actionApprovalState.WAITING_FOR_EXEC);
                if (this._actionDAO.updateLastModifiedActionApprovalField(actionItem.oid, 'u_state', stateId)) {

                    changeRequest = this._actionDAO.getChangeRequestById(actionApproval.getChangeRequestId());
                    succeeded.push({'oid' : actionItem.oid,
                                    'changeRequestId' : actionApproval.getChangeRequestId(),
                                    'changeRequestNumber' : changeRequest.getNumber(),
                                    'state' : this._actionApprovalState.WAITING_FOR_EXEC
                    });

                    gs.debug('TurbonomicActionApprovalManager.updateActionApprovalForAcceptedCase() - ' +
                            'Successfully set the action approval state to WAITING_FOR_EXEC, for the accepted Turbonomic action with OID: ' + actionItem.oid);
                } else {
                    failed.push({'oid' : actionItem.oid,
                                 'errorMsg' : 'Cannot set the state to WAITING_FOR_EXEC for action approval with OID: ' + actionItem.oid
                    });
                }

                this.updateActionExecutionDescription(actionItem);

                break;
            case this._actionApprovalState.WAITING_FOR_CR_SCHEDULE :
                this.updateActionApprovalWaitingForChangeRequestSchedule(actionItem, actionApproval,
                        'TurbonomicActionApprovalManager.updateActionApprovalForAcceptedCase() - ', failed, succeeded);
                break;
            case this._actionApprovalState.PENDING_APPROVAL :
            case this._actionApprovalState.REJECTED :
            case this._actionApprovalState.IN_PROGRESS :
            case this._actionApprovalState.FAILED :
            case this._actionApprovalState.SUCCEEDED :
            case this._actionApprovalState.MISSED :
                gs.info('TurbonomicActionApprovalManager.updateActionApprovalForAcceptedCase() - ' +
                        'Cannot update the Action Approval entry for Turbonomic action on ACCEPTED state. Action Approval state = ' + actionApprovalState);

                var details = 'Unexpected state transition detected. Action Execution Description = '
                        + actionItem.executionDescription + '; Turbonomic Action state = '
                        + actionItem.state + '; Action Approval state = ' + actionApprovalState;

                // Add audit record to mention the invalid Turbonomic action state
                this._actionDAO.createOrUpdateActionRecord(actionItem.oid, details, '', targetEntityId,
                        this._actionDAO.valueOrEmptyStr(actionItem.actionLifeCycleEvent));

                failed.push({'oid' : actionItem.oid,
                             'errorMsg' : 'Cannot update Action Approval entry for Turbonomic action with state: ' + actionItem.state
                });
                break;
            case this._actionApprovalState.WAITING_FOR_EXEC :
                gs.info('TurbonomicActionApprovalManager.updateActionApprovalForAcceptedCase() - ' +
                        'The Action Approval state is already set to WAITING_FOR_EXEC, for the accepted Turbonomic action with OID: ' + actionItem.oid);

                if (this._actionDAO.updateLastModifiedActionApprovalField(actionItem.oid, 'u_count', counter)) {
                    gs.debug('TurbonomicActionApprovalManager.updateActionApprovalForAcceptedCase() - ' +
                             'Successfully updated the action approval counter value; counter = ' + counter);
				} else {
                    gs.warn('TurbonomicActionApprovalManager.updateActionApprovalForAcceptedCase() - ' +
                            'Failed to update the action approval counter value; counter = ' + counter);
                }

                changeRequest = this._actionDAO.getChangeRequestById(actionApproval.getChangeRequestId());
                succeeded.push({'oid' : actionItem.oid,
                                'changeRequestId' : actionApproval.getChangeRequestId(),
                                'changeRequestNumber' : changeRequest.getNumber(),
                                'state' : this._actionApprovalState.WAITING_FOR_EXEC
                });
                break;
            default :
                gs.warn('TurbonomicActionApprovalManager.updateActionApprovalForAcceptedCase() - ' +
                        'Unsupported action approval state: ' + actionApprovalState);
        }
    };

     /**
     * Update an existing Action Approval entry, for a Turbonomic action on CLEARED state.
     *
     * @param actionItem The input Turbonomic action item.
     * @param actionApproval The Action Approval entry that will be updated.
     * @param targetEntityId The ID of the target Turbonomic entity, for the action approval that will be updated.
     * @param failed The input array with the details about the failed approval updates.
     * @param succeeded The input array with the details about the successful approval updates.
     */
    TurbonomicActionApprovalManager.prototype.updateActionApprovalForClearedCase = function(actionItem, actionApproval, targetEntityId, failed, succeeded) {
        var actionApprovalState = this._actionDAO.getActionStateById(actionApproval.getStateId()).toUpperCase();

        //All cleared actions in Turbonomic are being ignored
        succeeded.push({'oid' : actionItem.oid,
                                'changeRequestId' : actionApproval.getChangeRequestId(),
                                'state' : actionApprovalState
        });
    };

    /**
     * Update an existing Action Approval entry, for a Turbonomic action on REJECTED state.
     *
     * @param actionItem The input Turbonomic action item.
     * @param actionApproval The Action Approval entry that will be updated.
     * @param targetEntityId The ID of the target Turbonomic entity, for the action approval that will be updated.
     * @param failed The input array with the details about the failed approval updates.
     * @param succeeded The input array with the details about the successful approval updates.
     */
    TurbonomicActionApprovalManager.prototype.updateActionApprovalForRejectedCase = function(actionItem, actionApproval, targetEntityId, failed, succeeded) {
        var actionApprovalState = this._actionDAO.getActionStateById(actionApproval.getStateId()).toUpperCase();
        var changeRequest = new x_turbo_turbonomic.TurbonomicChangeRequest();
        var details = '';

        switch (actionApprovalState) {
            case this._actionApprovalState.REJECTED :
                gs.info('TurbonomicActionApprovalManager.updateActionApprovalForRejectedCase() - ' +
                        'The Action Approval state is already set to REJECTED, for the rejected/cleared Turbonomic action with OID: ' + actionItem.oid);

                changeRequest = this._actionDAO.getChangeRequestById(actionApproval.getChangeRequestId());
                succeeded.push({'oid' : actionItem.oid,
                                'changeRequestId' : actionApproval.getChangeRequestId(),
                                'changeRequestNumber' : changeRequest.getNumber(),
                                'state' : this._actionApprovalState.REJECTED
                });
                break;
            case this._actionApprovalState.APPROVED :
            case this._actionApprovalState.WAITING_FOR_EXEC :
            case this._actionApprovalState.IN_PROGRESS :
                gs.info('TurbonomicActionApprovalManager.updateActionApprovalForRejectedCase() - ' +
                        'The Action Approval state is APPROVED, WAITING_FOR_EXEC or IN_PROGRESS, for the rejected Turbonomic action with OID: ' + actionItem.oid);

                details = 'Action failed to get executed with message: '
                        + actionItem.executionDescription;

                // Add work note to the change request
                var changeRequestInfo = this.addWorkNote('TurbonomicActionApprovalManager.updateActionApprovalForRejectedCase()' ,
                        actionApproval, details);


                var stateId = this._actionDAO.getActionStateId(this._actionApprovalState.FAILED);
                if (changeRequestInfo != null
                        && this._actionDAO.updateLastModifiedActionApprovalField(
                                actionItem.oid, 'u_state', stateId)) {
                    succeeded.push({'oid' : actionItem.oid,
                                    'changeRequestId' : changeRequestInfo.changeRequestId,
                                    'changeRequestNumber' : changeRequestInfo.changeRequestNumber,
                                    'state' : this._actionApprovalState.FAILED
                    });

                    gs.info('TurbonomicActionApprovalManager.updateActionApprovalForRejectedCase() - ' +
                            'Successfully set the action approval state to FAILED, for the rejected Turbonomic action with OID: ' + actionItem.oid);
                } else {
                    failed.push({'oid' : actionItem.oid,
                                 'errorMsg' : 'Cannot set the state to FAILED for action approval with OID: ' + actionItem.oid
                    });
                }

                // Update the approval with the last action execution description
                this.updateActionExecutionDescription(actionItem);

                break;

            case this._actionApprovalState.PENDING_APPROVAL :
            case this._actionApprovalState.WAITING_FOR_CR_SCHEDULE :
            case this._actionApprovalState.FAILED :
            case this._actionApprovalState.SUCCEEDED :
            case this._actionApprovalState.MISSED :
                gs.info('TurbonomicActionApprovalManager.updateActionApprovalForRejectedCase() - ' +
                        'Cannot update the Action Approval entry for Turbonomic action on REJECTED or CLEARED state. Action Approval state = ' + actionApprovalState);

                details = 'Unexpected state transition detected. Action Execution Description = '
                        + actionItem.executionDescription + '; Turbonomic Action state = '
                        + actionItem.state + '; Action Approval state = ' + actionApprovalState;

                // Add audit record to mention the invalid Turbonomic action state
                this._actionDAO.createOrUpdateActionRecord(actionItem.oid, details, '', targetEntityId,
                        this._actionDAO.valueOrEmptyStr(actionItem.actionLifeCycleEvent));

                failed.push({'oid' : actionItem.oid,
                             'errorMsg' : 'Cannot update Action Approval entry for Turbonomic action with state: ' + actionItem.state
                });
                break;
            default :
                gs.info('TurbonomicActionApprovalManager.updateActionApprovalForRejectedCase() - ' +
                        'Unsupported action approval state: ' + actionApprovalState);
        }
    };

    /**
     * Update an existing Action Approval entry, for a Turbonomic action on IN_PROGRESS state.
     *
     * @param actionItem The input Turbonomic action item.
     * @param actionApproval The Action Approval entry that will be updated.
     * @param targetEntityId The ID of the target Turbonomic entity, for the action approval that will be updated.
     * @param failed The input array with the details about the failed approval updates.
     * @param succeeded The input array with the details about the successful approval updates.
     */
    TurbonomicActionApprovalManager.prototype.updateActionApprovalForInProgressCase = function(actionItem, actionApproval, targetEntityId, failed, succeeded) {
        var actionApprovalState = this._actionDAO.getActionStateById(actionApproval.getStateId()).toUpperCase();
        var counter = actionApproval.getCount() + 1;

        switch (actionApprovalState) {
            case this._actionApprovalState.IN_PROGRESS :
                gs.info('TurbonomicActionApprovalManager.updateActionApprovalForInProgressCase() - ' +
                        'The Action Approval state is already set to IN_PROGRESS, for the in progress Turbonomic action with OID: ' + actionItem.oid);

                var changeRequestInfo = this.addWorkNoteToChangeRequest(
                    'TurbonomicActionApprovalManager.updateActionApprovalForInProgressCase()',
                    actionItem,
                    actionApproval);
                if (!changeRequestInfo) {
                    break;
                }

                succeeded.push({'oid' : actionItem.oid,
                                'changeRequestId' : changeRequestInfo.changeRequestId,
                                'changeRequestNumber' : changeRequestInfo.changeRequestNumber,
                                'state' : this._actionApprovalState.IN_PROGRESS
                });
                break;
            case this._actionApprovalState.APPROVED :
            case this._actionApprovalState.WAITING_FOR_EXEC :
                gs.info('TurbonomicActionApprovalManager.updateActionApprovalForInProgressCase() - ' +
                        'The Action Approval state is ' + actionApprovalState + ', for the in progress Turbonomic action with OID: ' + actionItem.oid);

                var changeRequestInfo = this.moveChangeRequest(
                    'TurbonomicActionApprovalManager.updateActionApprovalForInProgressCase()',
                    actionItem,
                    actionApproval,
                    this._changeRequestStates.IMPLEMENT
                );
                if (!changeRequestInfo) {
                    break;
                }

                var stateId = this._actionDAO.getActionStateId(this._actionApprovalState.IN_PROGRESS);
                if (this._actionDAO.updateLastModifiedActionApprovalField(actionItem.oid, 'u_state', stateId)) {
                    succeeded.push({'oid' : actionItem.oid,
                                    'changeRequestId' : changeRequestInfo.changeRequestId,
                                    'changeRequestNumber' : changeRequestInfo.changeRequestNumber,
                                    'state' : this._actionApprovalState.IN_PROGRESS
                    });

                    gs.info('TurbonomicActionApprovalManager.updateActionApprovalForInProgressCase() - ' +
                            'Successfully set the action approval state to IN_PROGRESS, for the in progress Turbonomic action with OID: ' + actionItem.oid);
                } else {
                    failed.push({'oid' : actionItem.oid,
                                 'errorMsg' : 'Cannot set the state to IN_PROGRESS for action approval with OID: ' + actionItem.oid
                    });
                }

                this.updateActionExecutionDescription(actionItem);

                break;
            case this._actionApprovalState.PENDING_APPROVAL :
            case this._actionApprovalState.WAITING_FOR_CR_SCHEDULE :
            case this._actionApprovalState.REJECTED :
            case this._actionApprovalState.MISSED :
            case this._actionApprovalState.FAILED :
            case this._actionApprovalState.SUCCEEDED :
                gs.info('TurbonomicActionApprovalManager.updateActionApprovalForInProgressCase() - ' +
                        'Cannot update the Action Approval entry for Turbonomic action on IN_PROGRESS state. Action Approval state = ' + actionApprovalState);

                var details = 'Unexpected state transition detected. Action Execution Description = '
                        + actionItem.executionDescription + '; Turbonomic Action state = '
                        + actionItem.state + '; Action Approval state = ' + actionApprovalState;

                // Add audit record to mention the invalid Turbonomic action state
                this._actionDAO.createOrUpdateActionRecord(actionItem.oid, details, '', targetEntityId,
                        this._actionDAO.valueOrEmptyStr(actionItem.actionLifeCycleEvent));

                failed.push({'oid' : actionItem.oid,
                             'errorMsg' : 'Cannot update Action Approval entry for Turbonomic action with state: ' + actionItem.state
                });
                break;
            default :
                gs.warn('TurbonomicActionApprovalManager.updateActionApprovalForInProgressCase() - ' +
                        'Unsupported action approval state: ' + actionApprovalState);
        }
    };

    /**
     * Update an existing Action Approval entry, for a Turbonomic action on SUCCEEDED state.
     *
     * @param actionItem The input Turbonomic action item.
     * @param actionApproval The Action Approval entry that will be updated.
     * @param targetEntityId The ID of the target Turbonomic entity, for the action approval that will be updated.
     * @param failed The input array with the details about the failed approval updates.
     * @param succeeded The input array with the details about the successful approval updates.
     */
    TurbonomicActionApprovalManager.prototype.updateActionApprovalForSucceededCase = function(actionItem, actionApproval, targetEntityId, failed, succeeded) {
        var actionApprovalState = this._actionDAO.getActionStateById(actionApproval.getStateId()).toUpperCase();

        switch (actionApprovalState) {
            case this._actionApprovalState.SUCCEEDED :
                gs.info('TurbonomicActionApprovalManager.updateActionApprovalForSucceededCase() - ' +
                        'The Action Approval state is SUCCEEDED, for the succeeded Turbonomic action with OID: ' + actionItem.oid);

                var changeRequest = this._actionDAO.getChangeRequestById(actionApproval.getChangeRequestId());
                succeeded.push({'oid' : actionItem.oid,
                                'changeRequestId' : actionApproval.getChangeRequestId(),
                                'changeRequestNumber' : changeRequest.getNumber(),
                                'state' : this._actionApprovalState.SUCCEEDED
                });
                break;
            case this._actionApprovalState.APPROVED :
            case this._actionApprovalState.WAITING_FOR_EXEC :
            case this._actionApprovalState.IN_PROGRESS :
                gs.info('TurbonomicActionApprovalManager.updateActionApprovalForSucceededCase() - ' +
                        'The Action Approval state is APPROVED, WAITING_FOR_EXEC or IN_PROGRESS, for the succeeded Turbonomic action with OID: ' + actionItem.oid);

                var details = 'Action successfully executed with message: '
                        + actionItem.executionDescription;

                // Add work note to the change request
                var changeRequestInfo = this.addWorkNote('TurbonomicActionApprovalManager.updateActionApprovalForRejectedCase()' ,
                        actionApproval, details);

                var changeRequestInfo = this.moveChangeRequest(
                    'TurbonomicActionApprovalManager.updateActionApprovalForSucceededCase()',
                    actionItem,
                    actionApproval,
                    this._changeRequestStates.CLOSE_CODE_SUCCESSFUL
                );
                if (!changeRequestInfo) {
                    break;
                }

                var stateId = this._actionDAO.getActionStateId(this._actionApprovalState.SUCCEEDED);
                if (this._actionDAO.updateLastModifiedActionApprovalField(actionItem.oid, 'u_state', stateId)) {
                    succeeded.push({'oid' : actionItem.oid,
                                    'changeRequestId' : changeRequestInfo.changeRequestId,
                                    'changeRequestNumber' : changeRequestInfo.changeRequestNumber,
                                    'state' : this._actionApprovalState.SUCCEEDED
                    });

                    gs.info('TurbonomicActionApprovalManager.updateActionApprovalForSucceededCase() - ' +
                            'Successfully set the action approval state to SUCCEEDED, for the succeeded Turbonomic action with OID: ' + actionItem.oid);
                } else {
                    failed.push({'oid' : actionItem.oid,
                                 'errorMsg' : 'Cannot set the state to SUCCEEDED for action approval with OID: ' + actionItem.oid
                    });
                }

                this.updateActionExecutionDescription(actionItem);

                break;
            case this._actionApprovalState.PENDING_APPROVAL :
            case this._actionApprovalState.WAITING_FOR_CR_SCHEDULE :
            case this._actionApprovalState.REJECTED :
            case this._actionApprovalState.FAILED :
            case this._actionApprovalState.MISSED :
                gs.info('TurbonomicActionApprovalManager.updateActionApprovalForSucceededCase() - ' +
                        'Cannot update the Action Approval entry for Turbonomic action on SUCCEEDED state. Action Approval state = ' + actionApprovalState);

                var details = 'Unexpected state transition detected. Action Execution Description = '
                        + actionItem.executionDescription + '; Turbonomic Action state = '
                        + actionItem.state + '; Action Approval state = ' + actionApprovalState;

                // Add audit record to mention the invalid Turbonomic action state
                this._actionDAO.createOrUpdateActionRecord(actionItem.oid, details, '', targetEntityId,
                        this._actionDAO.valueOrEmptyStr(actionItem.actionLifeCycleEvent));

                failed.push({'oid' : actionItem.oid,
                             'errorMsg' : 'Cannot update Action Approval entry for Turbonomic action with state: ' + actionItem.state
                });
                break;
            default :
                gs.warn('TurbonomicActionApprovalManager.updateActionApprovalForSucceededCase() - ' +
                        'Unsupported action approval state: ' + actionApprovalState);
        }
    };

    /**
     * Update an existing Action Approval entry, for a Turbonomic action on FAILED state.
     *
     * @param actionItem The input Turbonomic action item.
     * @param actionApproval The Action Approval entry that will be updated.
     * @param targetEntityId The ID of the target Turbonomic entity, for the action approval that will be updated.
     * @param failed The input array with the details about the failed approval updates.
     * @param succeeded The input array with the details about the successful approval updates.
     */
    TurbonomicActionApprovalManager.prototype.updateActionApprovalForFailedCase = function(actionItem, actionApproval, targetEntityId, failed, succeeded) {
        var actionApprovalState = this._actionDAO.getActionStateById(actionApproval.getStateId()).toUpperCase();

        switch (actionApprovalState) {
            case this._actionApprovalState.FAILED :
                gs.info('TurbonomicActionApprovalManager.updateActionApprovalForFailedCase() - ' +
                        'The Action Approval state is FAILED, for the failed Turbonomic action with OID: ' + actionItem.oid);

                var changeRequest = this._actionDAO.getChangeRequestById(actionApproval.getChangeRequestId());
                succeeded.push({'oid' : actionItem.oid,
                                'changeRequestId' : actionApproval.getChangeRequestId(),
                                'changeRequestNumber' : changeRequest.getNumber(),
                                'state' : this._actionApprovalState.FAILED
                });
                break;
            case this._actionApprovalState.APPROVED :
            case this._actionApprovalState.WAITING_FOR_EXEC :
            case this._actionApprovalState.IN_PROGRESS :
                gs.info('TurbonomicActionApprovalManager.updateActionApprovalForFailedCase() - ' +
                        'The Action Approval state is APPROVED, WAITING_FOR_EXEC or IN_PROGRESS, for the failed Turbonomic action with OID: ' + actionItem.oid);

				var details = 'Action failed to get executed with message: '
                        + actionItem.executionDescription;

				// Add work note to the change request
                var changeRequestInfo = this.addWorkNote('TurbonomicActionApprovalManager.updateActionApprovalForFailedCase()' ,
                        actionApproval, details);

                var changeRequestInfo = this.moveChangeRequest(
                    'TurbonomicActionApprovalManager.updateActionApprovalForFailedCase()',
                    actionItem,
                    actionApproval,
                    this._changeRequestStates.CLOSE_CODE_UNSUCCESSFUL
                );
                if (!changeRequestInfo) {
                    break;
                }

                var stateId = this._actionDAO.getActionStateId(this._actionApprovalState.FAILED);
                if (this._actionDAO.updateLastModifiedActionApprovalField(actionItem.oid, 'u_state', stateId)) {
                    succeeded.push({'oid' : actionItem.oid,
                                    'changeRequestId' : changeRequestInfo.changeRequestId,
                                    'changeRequestNumber' : changeRequestInfo.changeRequestNumber,
                                    'state' : this._actionApprovalState.FAILED
                    });

                    gs.info('TurbonomicActionApprovalManager.updateActionApprovalForFailedCase() - ' +
                            'Successfully set the action approval state to FAILED, for the failed Turbonomic action with OID: ' + actionItem.oid);
                } else {
                    failed.push({'oid' : actionItem.oid,
                                 'errorMsg' : 'Cannot set the state to FAILED for action approval with OID: ' + actionItem.oid
                    });
                }

                this.updateActionExecutionDescription(actionItem);

                break;
            case this._actionApprovalState.PENDING_APPROVAL :
            case this._actionApprovalState.WAITING_FOR_CR_SCHEDULE :
            case this._actionApprovalState.REJECTED :
            case this._actionApprovalState.SUCCEEDED :
            case this._actionApprovalState.MISSED :
                gs.info('TurbonomicActionApprovalManager.updateActionApprovalForFailedCase() - ' +
                        'Cannot update the Action Approval entry for Turbonomic action on FAILED state. Action Approval state = ' + actionApprovalState);

                var details = 'Unexpected state transition detected. Action Execution Description = '
                        + actionItem.executionDescription + '; Turbonomic Action state = '
                        + actionItem.state + '; Action Approval state = ' + actionApprovalState;

                // Add audit record to mention the invalid Turbonomic action state
                this._actionDAO.createOrUpdateActionRecord(actionItem.oid, details, '', targetEntityId,
                        this._actionDAO.valueOrEmptyStr(actionItem.actionLifeCycleEvent));

                failed.push({'oid' : actionItem.oid,
                             'errorMsg' : 'Cannot update Action Approval entry for Turbonomic action with state: ' + actionItem.state
                });
                break;
            default :
                gs.warn('TurbonomicActionApprovalManager.updateActionApprovalForFailedCase() - ' +
                        'Unsupported action approval state: ' + actionApprovalState);
        }
    };

    /**
     * Update an existing Action Approval entry, for a Turbonomic action on QUEUED state.
     *
     * @param actionItem The input Turbonomic action item.
     * @param actionApproval The Action Approval entry that will be updated.
     * @param targetEntityId The ID of the target Turbonomic entity, for the action approval that will be updated.
     * @param failed The input array with the details about the failed approval updates.
     * @param succeeded The input array with the details about the successful approval updates.
     */
    TurbonomicActionApprovalManager.prototype.updateActionApprovalForQueuedCase = function(actionItem, actionApproval, targetEntityId, failed, succeeded) {
        var actionApprovalState = this._actionDAO.getActionStateById(actionApproval.getStateId()).toUpperCase();
        var counter = actionApproval.getCount() + 1;

        switch (actionApprovalState) {
            case this._actionApprovalState.WAITING_FOR_EXEC :
                gs.info('TurbonomicActionApprovalManager.updateActionApprovalForQueuedCase() - ' +
                        'The Action Approval state is already set to WAITING_FOR_EXEC, for the queued Turbonomic action with OID: ' + actionItem.oid);

                if (this._actionDAO.updateLastModifiedActionApprovalField(actionItem.oid, 'u_count', counter)) {
                    gs.debug('TurbonomicActionApprovalManager.updateActionApprovalForQueuedCase() - ' +
                            'Successfully updated the action approval counter value; counter = ' + counter);
				} else {
                    gs.warn('TurbonomicActionApprovalManager.updateActionApprovalForQueuedCase() - ' +
                            'Failed to update the action approval counter value; counter = ' + counter);
                }

                var changeRequestInfo = this.moveChangeRequest(
                    'TurbonomicActionApprovalManager.updateActionApprovalForQueuedCase()',
                    actionItem,
                    actionApproval,
                    this._changeRequestStates.IMPLEMENT
                );
                if (!changeRequestInfo) {
                    break;
                }

                succeeded.push({'oid' : actionItem.oid,
                                'changeRequestId' : changeRequestInfo.changeRequestId,
                                'changeRequestNumber' : changeRequestInfo.changeRequestNumber,
                                'state' : this._actionApprovalState.WAITING_FOR_EXEC
                });
                break;
            case this._actionApprovalState.APPROVED :
                gs.info('TurbonomicActionApprovalManager.updateActionApprovalForQueuedCase() - ' +
                        'The Action Approval state is APPROVED, for the queued Turbonomic action with OID: ' + actionItem.oid);

                if (this._actionDAO.updateLastModifiedActionApprovalField(actionItem.oid, 'u_count', counter)) {
                    gs.debug('TurbonomicActionApprovalManager.updateActionApprovalForQueuedCase() - ' +
                            'Successfully updated the action approval counter value; counter = ' + counter);
				} else {
                    gs.warn('TurbonomicActionApprovalManager.updateActionApprovalForQueuedCase() - ' +
                            'Failed to update the action approval counter value; counter = ' + counter);
                }

                var changeRequestInfo = this.moveChangeRequest(
                    'TurbonomicActionApprovalManager.updateActionApprovalForQueuedCase()',
                    actionItem,
                    actionApproval,
                    this._changeRequestStates.IMPLEMENT
                );
                if (!changeRequestInfo) {
                    break;
                }

                var stateId = this._actionDAO.getActionStateId(this._actionApprovalState.WAITING_FOR_EXEC);
                if (this._actionDAO.updateLastModifiedActionApprovalField(actionItem.oid, 'u_state', stateId)) {
                    succeeded.push({'oid' : actionItem.oid,
                                    'changeRequestId' : changeRequestInfo.changeRequestId,
                                    'changeRequestNumber' : changeRequestInfo.changeRequestNumber,
                                    'state' : this._actionApprovalState.WAITING_FOR_EXEC
                    });

                    gs.info('TurbonomicActionApprovalManager.updateActionApprovalForQueuedCase() - ' +
                            'Successfully set the action approval state to WAITING_FOR_EXEC, for the queued Turbonomic action with OID: ' + actionItem.oid);
                } else {
                    failed.push({'oid' : actionItem.oid,
                                 'errorMsg' : 'Cannot set the state to WAITING_FOR_EXEC for action approval with OID: ' + actionItem.oid
                    });
                }

                this.updateActionExecutionDescription(actionItem);

                break;
            case this._actionApprovalState.PENDING_APPROVAL :
            case this._actionApprovalState.WAITING_FOR_CR_SCHEDULE :
            case this._actionApprovalState.REJECTED :
            case this._actionApprovalState.IN_PROGRESS :
            case this._actionApprovalState.MISSED :
            case this._actionApprovalState.FAILED :
            case this._actionApprovalState.SUCCEEDED :
                gs.info('TurbonomicActionApprovalManager.updateActionApprovalForQueuedCase() - ' +
                        'Cannot update the Action Approval entry for Turbonomic action on QUEUED state. Action Approval state = ' + actionApprovalState);

                var details = 'Unexpected state transition detected. Action Execution Description = '
                        + actionItem.executionDescription + '; Turbonomic Action state = '
                        + actionItem.state + '; Action Approval state = ' + actionApprovalState;

                // Add audit record to mention the invalid Turbonomic action state
                this._actionDAO.createOrUpdateActionRecord(actionItem.oid, details, '', targetEntityId,
                        this._actionDAO.valueOrEmptyStr(actionItem.actionLifeCycleEvent));

                failed.push({'oid' : actionItem.oid,
                             'errorMsg' : 'Cannot update Action Approval entry for Turbonomic action with state: ' + actionItem.state
                });
                break;
            default :
                gs.warn('TurbonomicActionApprovalManager.updateActionApprovalForQueuedCase() - ' +
                        'Unsupported action approval state: ' + actionApprovalState);
        }
    };

    /**
     * Update an existing Action Approval entry, for a Turbonomic action on DISABLED or RECOMMENDED state.
     *
     * @param actionItem The input Turbonomic action item.
     * @param actionApproval The Action Approval entry that will be updated.
     * @param targetEntityId The ID of the target Turbonomic entity, for the action approval that will be updated.
     * @param failed The input array with the details about the failed approval updates.
     * @param succeeded The input array with the details about the successful approval updates.
     */
    TurbonomicActionApprovalManager.prototype.updateActionApprovalForDisabledCase = function(actionItem, actionApproval, targetEntityId, failed) {
        var actionApprovalState = this._actionDAO.getActionStateById(actionApproval.getStateId()).toUpperCase();

        switch (actionApprovalState) {
            case this._actionApprovalState.PENDING_APPROVAL :
            case this._actionApprovalState.WAITING_FOR_CR_SCHEDULE :
            case this._actionApprovalState.APPROVED :
            case this._actionApprovalState.REJECTED :
            case this._actionApprovalState.WAITING_FOR_EXEC :
            case this._actionApprovalState.IN_PROGRESS :
            case this._actionApprovalState.FAILED :
            case this._actionApprovalState.SUCCEEDED :
            case this._actionApprovalState.MISSED :
                gs.info('TurbonomicActionApprovalManager.updateActionApprovalForDisabledCase() - ' +
                        'Cannot update the Action Approval entry for Turbonomic action on DISABLED or RECOMMENDED state. Action Approval state = ' + actionApprovalState);

                var details = 'Unexpected state transition detected. Action Execution Description = '
                        + actionItem.description + '; Turbonomic Action state = '
                        + actionItem.state + '; Action Approval state = ' + actionApprovalState;

                // Add audit record to mention the invalid Turbonomic action state
                this._actionDAO.createOrUpdateActionRecord(actionItem.oid, details, '', targetEntityId,
                        this._actionDAO.valueOrEmptyStr(actionItem.actionLifeCycleEvent));

                failed.push({'oid' : actionItem.oid,
                             'errorMsg' : 'Cannot update Action Approval entry for Turbonomic action with state: ' + actionItem.state
                });
                break;
            default :
                gs.warn('TurbonomicActionApprovalManager.updateActionApprovalForDisabledCase() - ' +
                        'Unsupported action approval state: ' + actionApprovalState);
        }
    };

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
    TurbonomicActionApprovalManager.prototype.addWorkNoteToChangeRequest = function(
            logPrefix,
            actionItem,
            actionApproval) {
        return this.moveChangeRequest(
            logPrefix,
            actionItem,
            actionApproval,
            null); // indicates that there is no state change. work note is still added
    };

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
     * @return the change request that was changed.
     *         returns empty change request if change requests are disabled.
     *         returns undefined if there was an error.
     */
    TurbonomicActionApprovalManager.prototype.moveChangeRequest = function(
            logPrefix,
            actionItem,
            actionApproval,
            newCRState) {
        var changeRequestId;
        var changeRequestNumber;

        if (this._actionDAO.isChangeRequestDisabled()) {
            var emptyChangeRequest = this._actionDAO.makeEmptyChangeRequest();
            changeRequestId = emptyChangeRequest.getId();
            changeRequestNumber = emptyChangeRequest.getNumber();
        } else {
            // update change request
            var changeRequestRecord = this._changeRequestDAO.getChangeRequestBySysId(actionApproval.getChangeRequestId());
            changeRequestId = actionApproval.getChangeRequestId();
            if (changeRequestRecord == null) {
                var errorMsg = logPrefix + " - could not find change request for approval: "
                    + actionApproval.oid + " action from Turbonomic: " + JSON.stringify(actionItem);
                gs.info(errorMsg);
                failed.push({'oid' : actionItem.oid, 'errorMsg' : errorMsg });
                return;
            }

            this.addWorkNoteToChangeRequestRecord(changeRequestId, actionItem);
            switch (newCRState) {
                case this._changeRequestStates.IMPLEMENT :
                    this.moveChangeRequestToImplement(changeRequestId, changeRequestRecord.state.toString());
                break;
                case this._changeRequestStates.CLOSE_CODE_SUCCESSFUL :
                case this._changeRequestStates.CLOSE_CODE_UNSUCCESSFUL :
                    this.moveChangeRequestToClosed(changeRequestId, actionItem, newCRState);
                break;
            }

            changeRequestNumber = changeRequestRecord.number.toString();
        }

        return {changeRequestId: changeRequestId, changeRequestNumber: changeRequestNumber};
    };

    /**
     * Adds a worknote usind details from the actionItem into the provided changeRequestRecord.
     *
     * @param changeRequestId The sys_id of the change request to add work notes to.
     * @param actionItem The action item to extract details from to put into the change request.
     */
    TurbonomicActionApprovalManager.prototype.addWorkNoteToChangeRequestRecord = function(changeRequestId, actionItem) {
        var progress = actionItem.progress;
        var workNote = actionItem.executionDescription;
        if (workNote != null && progress != null && progress > 0) {
            this._actionDAO.insertIntoImportSet(this._tableNames.CHANGE_REQUEST_IMPORT_SET,
                {
                    u_update_sys_id: changeRequestId, // use the sysId to update
                    u_work_notes: "Action execution progress is " + progress + "%. " + workNote
                },
                'TurbonomicActionApprovalManager.addWorkNoteToChangeRequestRecord() - Successfully added worknote to change_request: ' + changeRequestId);
        }
    };

    /**
     * Adds a worknote usind details from the actionItem into the provided changeRequestRecord.
     *
     * @param logPrefix The prefix prepended to log messages
     * @param actionApproval The action approval we are adding worknote to.
     * @param workNote the string that will be added to wroknote.
     * @returns an object that has changeRequestId and changeRequestNumber for the change request
     * record associated to that approval.
     */
    TurbonomicActionApprovalManager.prototype.addWorkNote = function(logPrefix, actionApproval, workNote) {
        var changeRequestRecord = this._changeRequestDAO.getChangeRequestBySysId(actionApproval.getChangeRequestId());
        var changeRequestId;
        var changeRequestNumber;
        if (changeRequestRecord == null) {
            var errorMsg = logPrefix + " - could not find change request for approval: "
                + actionApproval.oid + " in order to add work note: " + workNote;
            gs.info(errorMsg);
            return;
        }

        changeRequestId = actionApproval.getChangeRequestId();
        changeRequestNumber = changeRequestRecord.number.toString();

        this._actionDAO.insertIntoImportSet(this._tableNames.CHANGE_REQUEST_IMPORT_SET,
            {
                u_update_sys_id: changeRequestId, // use the sysId to update
                u_work_notes: workNote
            },
            'TurbonomicActionApprovalManager.addWorkNote() - Successfully added worknote to change_request: ' + changeRequestId);

        return {changeRequestId: changeRequestId, changeRequestNumber: changeRequestNumber};
    };

    /**
     * Puts a change request into the implement state.
     *
     * @param changeRequestId The sys_id of the change request to put into the implement state.
     * @param stateStr The current state of the change request.
     */
    TurbonomicActionApprovalManager.prototype.moveChangeRequestToImplement = function(changeRequestId, stateStr) {
        if (stateStr === this._changeRequestStates.SCHEDULED) {
            this._actionDAO.insertIntoImportSet(this._tableNames.CHANGE_REQUEST_IMPORT_SET,
                {
                    u_update_sys_id: changeRequestId, // use the sysId to update
                    u_state: this._changeRequestStates.IMPLEMENT
                },
                'TurbonomicActionApprovalManager.moveChangeRequestToImplement() - Successfully moved change request to implement: ' + changeRequestId);
        }
    };

    /**
     * Closes the provided change request with details from the actionItem and closure code provided
     * by success.
     *
     * @param changeRequestId The sys_id of the change request to close.
     * @param actionItem The actionItem to extract action execution details from.
     * @param success The close code to close the change request with.
     */
    TurbonomicActionApprovalManager.prototype.moveChangeRequestToClosed = function(changeRequestId, actionItem, success) {
        var changeRequestRecord = this._changeRequestDAO.getChangeRequestBySysId(changeRequestId);
        var stateStr = changeRequestRecord.state.toString();
        this.moveChangeRequestToImplement(changeRequestId, stateStr);

        // since updates go through import set, changes to change_request will not reach our current
        // glide record reference. need to get a more recent view of change_request
        changeRequestRecord = this._changeRequestDAO.getChangeRequestBySysId(changeRequestId);
        stateStr = changeRequestRecord.state.toString();
        if (stateStr === this._changeRequestStates.IMPLEMENT) {
            this._actionDAO.insertIntoImportSet(this._tableNames.CHANGE_REQUEST_IMPORT_SET,
                {
                    u_update_sys_id: changeRequestId, // use the sysId to update
                    u_state: this._changeRequestStates.REVIEW
                },
                'TurbonomicActionApprovalManager.moveChangeRequestToClosed() - Successfully moved changed request to review: ' + changeRequestId);
        }

        // since updates go through import set, changes to change_request will not reach our current
        // glide record reference. need to get a more recent view of change_request
        changeRequestRecord = this._changeRequestDAO.getChangeRequestBySysId(changeRequestId);
        stateStr = changeRequestRecord.state.toString();
        if (stateStr === this._changeRequestStates.REVIEW) {
            this._actionDAO.insertIntoImportSet(this._tableNames.CHANGE_REQUEST_IMPORT_SET,
                {
                    u_update_sys_id: changeRequestId, // use the sysId to update
                    u_state: this._changeRequestStates.CLOSE,
                    u_close_code: success,
                    u_close_notes: actionItem.description
                },
                'TurbonomicActionApprovalManager.moveChangeRequestToClosed() - Successfully closed changed request: ' + changeRequestId);
        }
    };

    /**
    * Update action's execution description.
    * @param actionItem The actionItem to extract action execution details from.
    */
    TurbonomicActionApprovalManager.prototype.updateActionExecutionDescription = function(actionItem) {
        var executionDescription = actionItem.executionDescription;
        this._actionDAO.updateLastModifiedActionApprovalField(actionItem.oid, 'u_most_recent__on_description', executionDescription);
    };

    /**
     * Mark the action approvals as missed, as necessary. Afterwards, cancel their corresponding change requests too.
     */
    TurbonomicActionApprovalManager.prototype.markMissedActionApprovals = function() {
        var changeRequestIds = this._actionDAO.markMissedActionApprovals();
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
    TurbonomicActionApprovalManager.prototype.updateActionApprovalWaitingForChangeRequestSchedule = function(actionItem, actionApproval, logPrefix, failed, succeeded) {
        var actionUtils = new x_turbo_turbonomic.TurbonomicActionUtils();
        var actionApprovalState = this._actionDAO.getActionStateById(actionApproval.getStateId()).toUpperCase();
        var counter = actionApproval.getCount() + 1;

        if (this._actionDAO.updateLastModifiedActionApprovalField(actionItem.oid, 'u_count', counter)) {
            gs.debug(logPrefix + 'Successfully updated the counter for action approval waiting for CR schedule; ' +
                     'Action OID = ' + actionItem.oid);
        } else {
            gs.warn(logPrefix + 'Cannot update the counter for action approval waiting for CR schedule; ' +
                    'Action OID = ' + actionItem.oid);
            failed.push({'oid' : actionItem.oid,
                         'errorMsg' : 'Cannot update the counter for action approval with OID: ' + actionItem.oid
            });
            return;
        }

        let changeRequest = this._actionDAO.getChangeRequestById(actionApproval.getChangeRequestId());
        if (this._actionDAO.isChangeRequestDisabled()) {
            gs.debug(logPrefix + 'Change request and matching action approval state changes are handled by custom business rule(s)');
            succeeded.push({'oid' : actionItem.oid,
                            'changeRequestId' : actionApproval.getChangeRequestId(),
                            'changeRequestNumber' : changeRequest.getNumber(),
                            'state' : this._actionApprovalState.PENDING_APPROVAL
            });

            return;
        }

        gs.debug(logPrefix + 'The action approval state is WAITING_FOR_CR_SCHEDULE. Checking if the CR schedule is ON.');

        var changeRequestRecord = new GlideRecordSecure(this._tableNames.CHANGE_REQUEST);
        changeRequestRecord.addQuery('sys_id', actionApproval.getChangeRequestId());
        changeRequestRecord.query();

        if (!changeRequestRecord.next()) {
            gs.warn(logPrefix + 'Cannot find the matching CR for action approval waiting for CR schedule; ' +
                    'Change Request ID = ' + actionApproval.getChangeRequestId());
            failed.push({'oid' : actionItem.oid,
                         'errorMsg' : 'Cannot find the change request record with ID: ' + actionApproval.getChangeRequestId()
            });
            return;
		}

        var approvalSysId = actionApproval.getSysId();
        var actionStateId = '';
        var changeRequestState = changeRequestRecord.state + '';

        gs.debug(logPrefix + 'Change Request State = ' + actionUtils.printRequestState(changeRequestState) +
                 ', matching action approval state = ' + actionApprovalState + '; CR number = ' + changeRequest.getNumber());

        switch (changeRequestState) {
            case this._changeRequestStates.SCHEDULED:
            case this._changeRequestStates.IMPLEMENT:
                if (changeRequestRecord.start_date.nil() || actionUtils.isChangeRequestScheduleOn(changeRequestRecord)) {
                    gs.debug(logPrefix + 'The CR schedule is ON or is not configured.');
                    actionStateId = this._actionDAO.getActionStateId(this._actionApprovalState.APPROVED);
                    this._actionDAO.insertIntoImportSet(this._tableNames.ACTION_APPROVAL_IMPORT_SET,
                        {
                            u_update_sys_id: approvalSysId, // use the sysId to update
                            u_state: actionStateId
                        },
                        logPrefix + 'Successfully APPROVED the matching action approval entry for change request: ' +
                            changeRequest.getNumber());

                    succeeded.push({'oid' : actionItem.oid,
                                    'changeRequestId' : actionApproval.getChangeRequestId(),
                                    'changeRequestNumber' : changeRequest.getNumber(),
                                    'state' : this._actionApprovalState.APPROVED
                    });
                } else {
                    var actionItemState = actionItem.state.toUpperCase();
                    if (actionItemState.equals(this._turbonomicActionItemState.PENDING_ACCEPT)) {
                        gs.debug(logPrefix + 'The CR schedule is not ON.');
                        succeeded.push({'oid' : actionItem.oid,
                                        'changeRequestId' : actionApproval.getChangeRequestId(),
                                        'changeRequestNumber' : changeRequest.getNumber(),
                                        'state' : this._actionApprovalState.PENDING_APPROVAL
                        });
                    } else if (actionItemState.equals(this._turbonomicActionItemState.ACCEPTED)) {
                        gs.debug(logPrefix + 'The CR schedule is not ON for an already approved Turbonomic action.');
                        succeeded.push({'oid' : actionItem.oid,
                                        'changeRequestId' : actionApproval.getChangeRequestId(),
                                        'changeRequestNumber' : changeRequest.getNumber(),
                                        'state' : this._actionApprovalState.APPROVED
                        });
					} else {
                        gs.warn(logPrefix + 'The CR schedule is not ON for a Turbonomic action with state: ' + actionItemState);
                        succeeded.push({'oid' : actionItem.oid,
                                        'changeRequestId' : actionApproval.getChangeRequestId(),
                                        'changeRequestNumber' : changeRequest.getNumber(),
                                        'state' : this._actionApprovalState.PENDING_APPROVAL
                        });
                    }
                }

                break;
            case this._changeRequestStates.CANCELLED:
                gs.debug(logPrefix + 'The CR has been canceled.');
                actionStateId = this._actionDAO.getActionStateId(this._actionApprovalState.REJECTED);
                this._actionDAO.insertIntoImportSet(this._tableNames.ACTION_APPROVAL_IMPORT_SET,
                    {
                        u_update_sys_id: approvalSysId, // use the sysId to update
                        u_state: actionStateId
                    },
                    logPrefix + 'Successfully REJECTED the matching action approval entry for change request: ' +
                        changeRequest.getNumber());

                succeeded.push({'oid' : actionItem.oid,
                                'changeRequestId' : actionApproval.getChangeRequestId(),
                                'changeRequestNumber' : changeRequest.getNumber(),
                                'state' : this._actionApprovalState.REJECTED
                });

                break;
            default:
                gs.debug(logPrefix + 'CR state = ' + changeRequestState);
                succeeded.push({'oid' : actionItem.oid,
                                'changeRequestId' : actionApproval.getChangeRequestId(),
                                'changeRequestNumber' : changeRequest.getNumber(),
                                'state' : this._actionApprovalState.PENDING_APPROVAL
                });
        }
    };

    return TurbonomicActionApprovalManager;
}());
