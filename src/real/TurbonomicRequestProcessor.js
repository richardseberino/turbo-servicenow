var TurbonomicRequestProcessor =  (function () {

    TurbonomicRequestProcessor.prototype.type = 'TurbonomicRequestProcessor';

    function TurbonomicRequestProcessor() {
        this._turbonomicActionItemState = new x_turbo_turbonomic.TurbonomicActionItemState();
        this._actionApprovalState = new x_turbo_turbonomic.TurbonomicActionApprovalState();
        this._approvalMgr = new x_turbo_turbonomic.TurbonomicActionApprovalManager();
    }

    /**
     * Add new entries in Turbonomic Action Record table, based on the input body.
     *
     * @param body The input body as an array of Turbonomic action items.
     *
     * @return The result of this operation as arrays of succeeded/failed action records.
     */
    TurbonomicRequestProcessor.prototype.createActionRecords = function(body) {
        var startTime = new GlideDateTime().getNumericValue();
        var succeeded = [];
        var failed = [];
        var dao = new x_turbo_turbonomic.TurbonomicActionDAO();
        var alreadyAuditedActions = [];
        var turbonomicInstance = body.turbonomicInstance;
        body = body.actionRecords;

        var turbonomicHost = '';
        var turbonomicVersion = '';
        var turbonomicStatus = '';
        var turbonomicMacAddress = '';
        if (turbonomicInstance) {
            turbonomicHost = turbonomicInstance.hostOrIp;
            turbonomicVersion = turbonomicInstance.version;
            turbonomicStatus = turbonomicInstance.status;
            turbonomicMacAddress = turbonomicInstance.macAddress;
        } else {
            gs.warn("TurbonomicRequestProcessor.createActionRecords() - Failed to associate this action record with specific turbonomic instance due to missing information about it.");
        }

        for (var i = 0; i < body.length; i++) {
            var actionItem = body[i];
            if (!actionItem.actionOid) {
                gs.error('TurbonomicRequestProcessor.createActionRecords() - Invalid action item due to missing OID: ' +
                        'Details = ' + actionItem.details
                );
                failed.push({
                    'oid' : '',
                    'errorMsg' : 'Invalid action item with missing OID'
                });
                continue;
            }

            if (!actionItem.details) {
                gs.error('TurbonomicRequestProcessor.createActionRecords() - Invalid action item due to missing details: ' +
                        'OID = ' + actionItem.actionOid
                );
                failed.push({
                    'oid' : actionItem.actionOid,
                    'errorMsg' : 'Invalid action item with missing details: OID = ' + actionItem.actionOid
                });
                continue;
            }

            var actionLifecycleStage = dao.valueOrEmptyStr(actionItem.actionLifeCycleEvent);
            var auditedActionKey = actionItem.actionOid + '_' + actionLifecycleStage;
            if (alreadyAuditedActions.indexOf(auditedActionKey) > -1) {
                gs.debug('TurbonomicRequestProcessor.createActionRecords() - Already added a record for the action item with: ' +
                         'OID = ' + actionItem.actionOid + ', ' +
                         'lifecycle stage = ' + actionLifecycleStage);
                continue;
            }

            try {
                var turbonomicEntityId = '';
                var targetEntity = actionItem.targetEntity;
                var actionUtils = new x_turbo_turbonomic.TurbonomicActionUtils();

                // Check if mandatory targetEntity is present in the payload, for the current action item
                if (targetEntity) {
                    gs.debug('TurbonomicRequestProcessor.createActionRecords() - The Turbonomic Entity UUID is: ' + targetEntity.uuid);

                    if (!targetEntity.name || !targetEntity.type || !targetEntity.targetName || !targetEntity.targetType) {
                        gs.warn('TurbonomicRequestProcessor.createActionRecords() - Invalid target entity for action: ' +
                                'OID = ' + actionItem.actionOid + ' ; ' +
                                'Entity Name = ' + targetEntity.name + ' ; ' +
                                'Entity Type = ' + targetEntity.type + ' ; ' +
                                'Target Name = ' + targetEntity.targetName + ' ; ' +
                                'Target Type = ' + targetEntity.targetType
                        );
                    }

                    turbonomicEntityId = this.getOrCreateTurbonomicEntity(
                                targetEntity.uuid,
                                dao.valueOrEmptyStr(actionUtils.trimProxyPrefix(targetEntity.name)),
                                dao.valueOrEmptyStr(targetEntity.type),
                                dao.valueOrEmptyStr(targetEntity.targetName),
                                dao.valueOrEmptyStr(targetEntity.targetType),
                                dao.valueOrEmptyStr(targetEntity.targetIp),
                                dao.valueOrEmptyStr(turbonomicHost),
                                dao.valueOrEmptyStr(turbonomicVersion),
                                dao.valueOrEmptyStr(turbonomicStatus),
                                dao.valueOrEmptyStr(turbonomicMacAddress)
                    );
                } else {
                    gs.warn('TurbonomicRequestProcessor.createActionRecords() - Missing entity data for action item with OID: '+ actionItem.actionOid);
                }
                dao.createOrUpdateActionRecord(actionItem.actionOid, actionItem.details, actionItem.acceptedBy, turbonomicEntityId, actionLifecycleStage);

                succeeded.push({'oid' : actionItem.actionOid});
                alreadyAuditedActions.push(auditedActionKey);

                var waitTime = parseInt(dao.getSettingValue('action_processing_wait_time'));
                if (waitTime) {
                    actionUtils.wait(waitTime);
                } else {
                    actionUtils.wait(50);
                }
            } catch (ex) {
                gs.error('TurbonomicRequestProcessor.createActionRecords() - Cannot add Action Record for item with OID: '
                                    + actionItem.actionOid + '. The error is: ' + ex);
                failed.push({
                    'oid' : actionItem.actionOid,
                    'errorMsg' : 'Cannot record action with OID: ' + actionItem.actionOid + ' ; Reason is: ' + ex});
            }
        }

        var execTime = new GlideDateTime().getNumericValue() - startTime;
        gs.debug('TurbonomicRequestProcessor.createActionRecords() - Total execution time was: ' + execTime + 'msec');

        return {
            succeeded : succeeded,
            failed : failed
        };
    };

    /**
     * Search for the action records, based on the input body.
     *
     * @param body The input body as an array of Turbonomic action states.
     *
     * @return The result of this operation as an array of action records.
     */
    TurbonomicRequestProcessor.prototype.searchActionRecords = function(body) {
        // Note: This is optional implementation for now
        return {
            succeeded : [],
            failed : []
        };
    };

    /**
     * Add new entries in Turbonomic Action Approvals table and create matching change requests for them.
     *
     * @param body The input body as an array of Turbonomic action items.
     *
     * @return The result of this operation as arrays of succeeded/failed action approvals.
     */
    TurbonomicRequestProcessor.prototype.createActionApprovals = function(body) {
        var startTime = new GlideDateTime().getNumericValue();
        var succeeded = [];
        var failed = [];
        var actionOIDs = [];
        var dao = new x_turbo_turbonomic.TurbonomicActionDAO();
        var turbonomicInstance = body.turbonomicInstance;
        body = body.actionApprovals;

        var turbonomicHost = '';
        var turbonomicVersion = '';
        var turbonomicStatus = '';
        var turbonomicMacAddress = '';
        if (turbonomicInstance) {
            turbonomicHost = turbonomicInstance.hostOrIp;
            turbonomicVersion = turbonomicInstance.version;
            turbonomicStatus = turbonomicInstance.status;
            turbonomicMacAddress = turbonomicInstance.macAddress;
        } else {
            gs.warn("TurbonomicRequestProcessor.createActionApprovals() - Failed to associate this action record with specific turbonomic instance due to missing information about it.");
        }

        for (var i = 0; i < body.length; i++) {
            var actionItem = body[i];
            if (!this.isValidActionItemData(actionItem, "createActionApprovals()", failed)) {
                continue;
            }

            actionOIDs.push(actionItem.oid);

            try {
                var sourceEntityId = '';
                var destinationEntityId = '';
                var targetEntityId = '';
                var sourceEntity = actionItem.sourceEntity;
                var destinationEntity = actionItem.destinationEntity;
                var targetEntity = actionItem.targetEntity;
                var actionDto = actionItem.actionDto;
                var changeRequest = new x_turbo_turbonomic.TurbonomicChangeRequest();
                var actionUtils = new x_turbo_turbonomic.TurbonomicActionUtils();

                // Check if mandatory targetEntity is present in the payload, for the current action item
                if (targetEntity) {
                    gs.debug('TurbonomicRequestProcessor.createActionApprovals() - The target entity UUID is: ' + targetEntity.uuid);

                    if (!targetEntity.name || !targetEntity.type || !targetEntity.targetName || !targetEntity.targetType) {
                        gs.error('TurbonomicRequestProcessor.createActionApprovals() - Invalid target entity for action: ' +
                                'OID = ' + actionItem.oid + ' ; ' +
                                'Target Entity Name = ' + targetEntity.name + ' ; ' +
                                'Target Entity Type = ' + targetEntity.type + ' ; ' +
                                'Target Name = ' + targetEntity.targetName + ' ; ' +
                                'Target Type = ' + targetEntity.targetType
                        );
                        failed.push({
                            'oid' : actionItem.oid,
                            'errorMsg' : 'Invalid target entity for action item with OID: ' + actionItem.oid});
                        continue;
                    }

                    targetEntityId = this.getOrCreateTurbonomicEntity(
                                targetEntity.uuid,
                                actionUtils.trimProxyPrefix(targetEntity.name),
                                targetEntity.type,
                                targetEntity.targetName,
                                targetEntity.targetType,
                                targetEntity.targetIp,
                                dao.valueOrEmptyStr(turbonomicHost),
                                dao.valueOrEmptyStr(turbonomicVersion),
                                dao.valueOrEmptyStr(turbonomicStatus),
                                dao.valueOrEmptyStr(turbonomicMacAddress)
                    );
                } else {
                    gs.warn('TurbonomicRequestProcessor.createActionApprovals() - Missing target entity for action item with OID: '+ actionItem.oid);
                }

                // Check if sourceEntity is present in the payload, for the current action item
                if (sourceEntity) {
                    gs.debug('TurbonomicRequestProcessor.createActionApprovals() - The source entity UUID is: ' + sourceEntity.uuid);
                    if (sourceEntity.name && sourceEntity.type && sourceEntity.targetName && sourceEntity.targetType) {
                        sourceEntityId = this.getOrCreateTurbonomicEntity(
                                                sourceEntity.uuid,
                                                actionUtils.trimProxyPrefix(sourceEntity.name),
                                                sourceEntity.type,
                                                sourceEntity.targetName,
                                                sourceEntity.targetType,
                                                sourceEntity.targetIp,
                                                dao.valueOrEmptyStr(turbonomicHost),
                                                dao.valueOrEmptyStr(turbonomicVersion),
                                                dao.valueOrEmptyStr(turbonomicStatus),
                                                dao.valueOrEmptyStr(turbonomicMacAddress)
                        );
                    } else {
                        gs.warn('TurbonomicRequestProcessor.createActionApprovals() - Invalid source entity for action: ' +
                                'OID = ' + actionItem.oid + ' ; ' +
                                'Source Entity Name = ' + sourceEntity.name + ' ; ' +
                                'Source Entity Type = ' + sourceEntity.type + ' ; ' +
                                'Target Name = ' + sourceEntity.targetName + ' ; ' +
                                'Target Type = ' + sourceEntity.targetType
                        );
                    }
                } else {
                    gs.warn('TurbonomicRequestProcessor.createActionApprovals() - Missing source entity for action item with OID: '+ actionItem.oid);
                }

                // Check if destinationEntity is present in the payload, for the current action item
                if (destinationEntity) {
                    gs.debug('TurbonomicRequestProcessor.createActionApprovals() - The destination entity UUID is: ' + destinationEntity.uuid);

                    if (destinationEntity.name && destinationEntity.type && destinationEntity.targetName && destinationEntity.targetType) {
                        destinationEntityId = this.getOrCreateTurbonomicEntity(
                                                    destinationEntity.uuid,
                                                    actionUtils.trimProxyPrefix(destinationEntity.name),
                                                    destinationEntity.type,
                                                    destinationEntity.targetName,
                                                    destinationEntity.targetType,
                                                    destinationEntity.targetIp,
                                                    dao.valueOrEmptyStr(turbonomicHost),
                                                    dao.valueOrEmptyStr(turbonomicVersion),
                                                    dao.valueOrEmptyStr(turbonomicStatus),
                                                    dao.valueOrEmptyStr(turbonomicMacAddress)
                        );
                    } else {
                        gs.warn('TurbonomicRequestProcessor.createActionApprovals() - Invalid destination entity for action: ' +
                                'OID = ' + actionItem.oid + ' ; ' +
                                'Destination Entity Name = ' + destinationEntity.name + ' ; ' +
                                'Destination Entity Type = ' + destinationEntity.type + ' ; ' +
                                'Target Name = ' + destinationEntity.targetName + ' ; ' +
                                'Target Type = ' + destinationEntity.targetType
                        );
                    }
                } else {
                    gs.warn('TurbonomicRequestProcessor.createActionApprovals() - Missing destination entity data for action item with OID: '+ actionItem.oid);
                }

                if (!actionDto) {
                    gs.warn('TurbonomicRequestProcessor.createActionApprovals() - Missing actionDTO data for action item with OID: '+ actionItem.oid);
                }

                var actionApproval = dao.getLastModifiedActionApproval(actionItem.oid);
                if (actionApproval) {
                    actionItem.executionDescription = 'Waiting for approval.';
                    this._approvalMgr.updateActionApprovalEntry(actionItem, actionApproval, sourceEntityId, destinationEntityId, targetEntityId, actionDto, failed, succeeded);
                    gs.debug('TurbonomicRequestProcessor.createActionApprovals() - Successfully updated Action Approval for action item with OID: ' + actionItem.oid);
                } else {
                    changeRequest = this.createNewActionApprovalEntry(actionItem, sourceEntityId, destinationEntityId, targetEntityId, actionDto);
                    if (changeRequest.getId()) {
                        gs.debug('TurbonomicRequestProcessor.createActionApprovals() - ' +
                                'Successfully created Action Approval and change request with ID: ' + changeRequest.getId());

                        succeeded.push({'oid' : actionItem.oid,
                                        'changeRequestId' : changeRequest.getId(),
                                        'changeRequestNumber' : changeRequest.getNumber(),
                                        'state' : this._actionApprovalState.PENDING_APPROVAL
                        });
                    } else {
                        if (dao.isChangeRequestDisabled()) {
                            // Request is successful because the change request creation is done in a custom business rule, not by our application.
                            succeeded.push({'oid' : actionItem.oid,
                                            'changeRequestId' : null,
                                            'changeRequestNumber' : '',
                                            'state' : this._actionApprovalState.PENDING_APPROVAL
                            });
						} else {
                            failed.push({'oid' : actionItem.oid,
                                         'errorMsg' : 'Cannot create Action Approval for action item with state: ' + actionItem.state
                            });
                        }
                    }
                }

                var waitTime = parseInt(dao.getSettingValue('action_processing_wait_time'));
                if (waitTime) {
                    actionUtils.wait(waitTime);
                } else {
                    actionUtils.wait(50);
                }
            } catch (ex) {
                gs.error('TurbonomicRequestProcessor.createActionApprovals() - Cannot create Action Approval for item with OID: '
                                    + actionItem.oid + '. The error is: ' + ex);
                failed.push({
                    'oid' : actionItem.oid,
                    'errorMsg' : 'Cannot create Action Approval with OID: ' + actionItem.oid + ' ; Reason is: ' + ex
                });
            }
        }

        //this._approvalMgr.markMissedActionApprovals();

        var execTime = new GlideDateTime().getNumericValue() - startTime;
        gs.debug('TurbonomicRequestProcessor.createActionApprovals() - Total execution time was: ' + execTime + 'msec');

        return {
            succeeded : succeeded,
            failed : failed
        };
    };

    /**
     * Create a new action approval entry and create the matching change request for it.
     *
     * @param actionItem The input action item with the Turbonomic action details.
     * @param sourceEntityId The unique ID of the Turbonomic source entity, for the action.
     * @param destinationEntityId The unique ID of the Turbonomic destination entity, for the action.
     * @param targetEntityId The unique ID of the Turbonomic target entity, for the action.
     *
     * @return The TurbonomicChangeRequest with the matching change request details for the action approval item, or null if it cannot be created.
     */
    TurbonomicRequestProcessor.prototype.createNewActionApprovalEntry = function(actionItem, sourceEntityId, destinationEntityId, targetEntityId, actionDto) {
        var result = new x_turbo_turbonomic.TurbonomicChangeRequest();
        var dao = new x_turbo_turbonomic.TurbonomicActionDAO();
        var actionItemState = actionItem.state.toUpperCase();

        switch (actionItemState) {
            case this._turbonomicActionItemState.PENDING_ACCEPT :
                // Add new action approval and its matching change request
                result = this._approvalMgr.addActionApproval(actionItem, sourceEntityId, destinationEntityId, targetEntityId, actionDto);
                break;
            case this._turbonomicActionItemState.ACCEPTED :
            case this._turbonomicActionItemState.REJECTED :
            case this._turbonomicActionItemState.IN_PROGRESS :
            case this._turbonomicActionItemState.SUCCEEDED :
            case this._turbonomicActionItemState.FAILED :
            case this._turbonomicActionItemState.QUEUED :
                var details = actionItem.description + '; Action State = ' + actionItem.state;

                // Add audit record to mention the invalid Turbonomic action state
                dao.createOrUpdateActionRecord(actionItem.oid, details, '', targetEntityId, dao.valueOrEmptyStr(actionItem.actionLifeCycleEvent));

                gs.warn('TurbonomicRequestProcessor.createNewActionApprovalEntry() - ' +
                        'Cannot create Action Approval entry for Turbonomic action with state: ' + actionItem.state);
                break;
            case this._turbonomicActionItemState.CLEARED :
            case this._turbonomicActionItemState.DISABLED :
            case this._turbonomicActionItemState.RECOMMENDED :
                gs.debug('TurbonomicRequestProcessor.createNewActionApprovalEntry() - ' +
                        'Action Approval entries are not required for Turbonomic action with state: ' + actionItem.state);
                break;
            default :
                gs.warn('TurbonomicRequestProcessor.createNewActionApprovalEntry() - ' +
                        'Unsupported action item state: ' + actionItemState);
        }

        return result;
    };

    /**
     * Update the Turbonomic Action Approvals based on the input body request.
     *
     * @param body The input body as an array of Turbonomic action items.
     *
     * @return The result of this operation as arrays of succeeded/failed action approval updates.
     */
    TurbonomicRequestProcessor.prototype.updateActionApprovals = function(body) {
        var startTime = new GlideDateTime().getNumericValue();
        var succeeded = [];
        var failed = [];
        var dao = new x_turbo_turbonomic.TurbonomicActionDAO();
        var turbonomicInstance = body.turbonomicInstance;
        body = body.actionApprovalUpdates;

        for (var i = 0; i < body.length; i++) {
            var actionItem = body[i];
            if (!this.isValidActionItemData(actionItem, "updateActionApprovals()", failed)) {
               continue;
            }

            try {
                var actionApproval = dao.getLastModifiedActionApproval(actionItem.oid);
                if (actionApproval) {
                    var sourceEntityId = actionApproval.getSourceEntityId();
                    var destinationEntityId = actionApproval.getDestinationEntityId();
                    var targetEntityId = actionApproval.getTargetEntityId();
                    var actionDto = actionApproval.getActionDTO();
                    actionItem.executionDescription = actionItem.description;
                    actionItem.description = actionApproval.getDescription();
                    actionItem.category = actionApproval.getCategory();
                    actionItem.commodityName = actionApproval.getCommodityName();
                    actionItem.risk = actionApproval.getRisk();
                    actionItem.from = actionApproval.getFrom();
                    actionItem.to = actionApproval.getTo();
                    actionItem.savings = actionApproval.getSavings();
                    actionItem.changedBy = actionApproval.getChangedBy(); 
                    this._approvalMgr.updateActionApprovalEntry(actionItem, actionApproval, sourceEntityId, destinationEntityId, targetEntityId, actionDto, failed, succeeded);
                    gs.debug('TurbonomicRequestProcessor.updateActionApprovals() - ' +
                            'Successfully updated Action Approval for action item with OID: ' + actionItem.oid);
                } else {
                    failed.push({'oid' : actionItem.oid,
                                 'errorMsg' : 'Missing Action Approval for action item with OID: ' + actionItem.oid
                    });
                }
            } catch (ex) {
                gs.error('TurbonomicRequestProcessor.updateActionApprovals() - Cannot update Action Approval for action item with OID: '
                                    + actionItem.oid + '. The error is: ' + ex);
                failed.push({
                    'oid' : actionItem.oid,
                    'errorMsg' : 'Cannot update Action Approval with OID: ' + actionItem.oid + ' ; Reason is: ' + ex
                });
            }
        }

        var execTime = new GlideDateTime().getNumericValue() - startTime;
        gs.debug('TurbonomicRequestProcessor.updateActionApprovals() - Total execution time was: ' + execTime + 'msec');

        return {
            succeeded : succeeded,
            failed : failed
        };
    };

    /**
     * Search for the action approvals, based on the input body.
     *
     * @param body The input body as an array of Turbonomic action states.
     * @param addAllApprovalsInTransition Boolean flag set to true if all approvals whose states are in transition
     *        will be added to the API result, false otherwise.
     *
     * @return The result of this operation as an array of action approvals.
     */
    TurbonomicRequestProcessor.prototype.searchActionApprovals = function(body, addAllApprovalsInTransition) {
        var startTime = new GlideDateTime().getNumericValue();
        var succeeded = [];
        var failed = [];
        var dao = new x_turbo_turbonomic.TurbonomicActionDAO();

        var actionOIDs = body.oids;
        if (actionOIDs && actionOIDs.length > 0) {
            var uniqueActionOIDs = [];
            for (var i = 0; i < actionOIDs.length; i++) {
                if (uniqueActionOIDs.indexOf(actionOIDs[i]) > -1) {
                    continue;
                }
                uniqueActionOIDs.push(actionOIDs[i]);
            }

            gs.debug('TurbonomicRequestProcessor.searchActionApprovals() - The size of unique action OIDs array is ' + uniqueActionOIDs.length);

            if (uniqueActionOIDs.length <= 50) {
                gs.debug('TurbonomicRequestProcessor.searchActionApprovals() - The unique input action OIDs are: ' + uniqueActionOIDs.join());
            }

            if (uniqueActionOIDs.length > 0 || addAllApprovalsInTransition) {
                succeeded = JSON.parse(JSON.stringify(dao.getActionApprovals(uniqueActionOIDs, addAllApprovalsInTransition)));
            }
        } else {
            failed.push({
                'errorMsg' : 'The list of action OIDs and addAllApprovalsInTransition parameter is not set to true is missing.' + addAllApprovalsInTransition
            });
        }

        var execTime = new GlideDateTime().getNumericValue() - startTime;
        gs.debug('TurbonomicRequestProcessor.searchActionApprovals() - Total execution time was: ' + execTime + 'msec');

        return {
            succeeded : succeeded,
            failed : failed
        };
    };

    /**
     * Check that actionItem contains all the required information.
     *
     * @param actionItem The input action item with the Turbonomic action details.
     * @param methodName The name of method from which this method was called.
     * @param failed The part of API response which contains information about errors.
     *
     * @return true if there are all required value otherwise false.
     */
    TurbonomicRequestProcessor.prototype.isValidActionItemData = function(actionItem, methodName, failed) {
        if (!actionItem.oid) {
            gs.error('TurbonomicRequestProcessor.'+ methodName +' - Invalid action item due to missing OID.' +
                    'State = ' + actionItem.state + ' ; ' +
                    'Description = ' + actionItem.description
            );
            failed.push({
                'oid' : 'MISSING',
                'errorMsg' : 'Invalid action item with missing OID: State = ' + actionItem.state
            });
            return false;
        }
        if (!actionItem.description) {
            gs.error('TurbonomicRequestProcessor.' + methodName + ' - Invalid action item due to missing description.' +
                    'OID = ' + actionItem.oid + ' ; ' +
                    'State = ' + actionItem.state
            );
            failed.push({
                'oid' : actionItem.oid,
                'errorMsg' : 'Invalid action item with missing description: OID = ' + actionItem.oid + ' ; State = ' + actionItem.state
            });
            return false;
        }
        if (!actionItem.state) {
            gs.error('TurbonomicRequestProcessor.'+ methodName + ' - Invalid action due to missing state. ' +
                    'OID = ' + actionItem.oid + ' ; ' +
                    'Description = ' + actionItem.description
            );
            failed.push({
                'oid' : actionItem.oid,
                'errorMsg' : 'Invalid action item with missing state: OID = ' + actionItem.oid + ' ;Description = ' + actionItem.description
            });
            return false;
        }

        return true;
    };

    /**
     * Get or create a new Turbonomic Entity entry based on the input values.
     *
     * @param uuid The uuid of the Turbonomic entity.
     * @param name The name of the Turbonomic entity.
     * @param type The type of the Turbonomic entity.
     * @param targetName The target name of the Turbonomic entity.
     * @param targetType The target type of the Turbonomic entity.
     * @param targetIp The target IP of the Turbonomic entity.
     * @param instanceHostOrIp The host or IP address of the Turbonomic instance.
     * @param instanceVersion The version of the Turbonomic instance.
     * @param instanceStatus The status of the Turbonomic instance.
     * @param macAddress The MAC address of the Turbonomic instance.
     *
     * @return The GUID of the Turbonomic entity or null if the entity cannot be created.
     */
    TurbonomicRequestProcessor.prototype.getOrCreateTurbonomicEntity = function(uuid, name, type,
    targetName, targetType, targetIp, instanceHostOrIp, instanceVersion, instanceStatus, macAddress) {
        var dao = new x_turbo_turbonomic.TurbonomicActionDAO();
        var entityMatcher = new x_turbo_turbonomic.TurbonomicEntityMatcher();
        var configItem = null;
        var result = null;

        // Create or get and update Turbonomic Instance
        var turbonomicInstance = this.createOrUpdateTurbonomicInstance(
                                            dao.valueOrEmptyStr(instanceHostOrIp),
                                            dao.valueOrEmptyStr(instanceStatus),
                                            dao.valueOrEmptyStr(instanceVersion),
                                            dao.valueOrEmptyStr(macAddress)
                                 );

        // Search for the Turbonomic Entity, before creating a new one
        var turbonomicEntity = dao.getTurbonomicEntity(name, type, targetName, targetType);
        if (turbonomicEntity == null) {
            turbonomicEntity = new x_turbo_turbonomic.TurbonomicEntity();
            turbonomicEntity.setEntityName(name);
            turbonomicEntity.setEntityType(type);
            turbonomicEntity.setTargetName(targetName);
            turbonomicEntity.setTargetType(targetType);
            turbonomicEntity.setTurbonomicInstanceId(turbonomicInstance);
            if (uuid) {
                turbonomicEntity.setUuid(uuid);
            }
            if (targetIp) {
                turbonomicEntity.setTargetIP(targetIp);
            }

            configItem = entityMatcher.findConfigurationItem(turbonomicEntity);
            if (configItem != null) {
                gs.debug('TurbonomicRequestProcessor.getOrCreateTurbonomicEntity() - The matching configuration item GUID is: ' + configItem.sys_id);
                turbonomicEntity.setConfigItemId(configItem.sys_id);
            }

            result = dao.createTurbonomicEntityFromInput(turbonomicEntity);
            gs.debug('TurbonomicRequestProcessor.getOrCreateTurbonomicEntity() - Successfully created new Turbonomic Entity with GUID: '+ result);
        } else {
            // update/create reference to Turbonomic Instance
            dao.updateTurbonomicEntity(turbonomicEntity.getGuid(), turbonomicInstance);
            if(!turbonomicEntity.getConfigItemId()) {
                configItem = entityMatcher.findConfigurationItem(turbonomicEntity);
                if (configItem != null) {
                    dao.updateTurbonomicEntityConfigItem(turbonomicEntity, configItem.sys_id);
                } else {
                    gs.debug('TurbonomicRequestProcessor.getOrCreateTurbonomicEntity() - Unable to find configuration item for TurbonomicEntity: ' + turbonomicEntity.getGuid());
                }
            }
            result = turbonomicEntity.getGuid();
        }

        return result;
    };

    /**
     * Create or update the Turbonomic Instance based on the input values.
     *
     * @param hostOrIp The host name or IP address of the Turbonomic instance(mandatory value).
     * @param status The status of the Turbonomic instance.
     * @param version The version of the Turbonomic instance.
     * @param macAddress The MAC address of the Turbonomic instance.
     *
     * @return The GUID of the Turbonomic Instance that was created or updated.
     */
    TurbonomicRequestProcessor.prototype.createOrUpdateTurbonomicInstance = function(hostOrIp, status, version, macAddress) {
        var dao = new x_turbo_turbonomic.TurbonomicActionDAO();
        var turbonomicInstanceId = null;

        gs.debug('TurbonomicRequestProcessor.createOrUpdateTurbonomicInstance() - Searching for Turbonomic instance with host/IP:' + hostOrIp);
        // host/ip is mandatory for instance
        if (hostOrIp) {
            // Search for the Turbonomic Instance, before creating a new one
            var turbonomicInstance = dao.getTurbonomicInstance(hostOrIp);
            if (turbonomicInstance != null) {
                dao.updateTurbonomicInstance(hostOrIp, status, version, macAddress);
                turbonomicInstanceId = turbonomicInstance.getGuid();
            } else {
                // Create new Turbonomic Instance
                turbonomicInstanceId = dao.createTurbonomicInstance(hostOrIp, status, version, new GlideDateTime().getDisplayValue(), macAddress);
            }
        } else {
            gs.warn("TurbonomicRequestProcessor.createOrUpdateTurbonomicInstance() - Invalid Turbonomic instance due to missing host/Ip value.");
        }
        return turbonomicInstanceId;
    };

    return TurbonomicRequestProcessor;
}());
