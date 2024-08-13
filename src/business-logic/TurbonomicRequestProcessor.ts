class TurbonomicRequestProcessor {

    public type: string;
    private _log: x_turbo_turbonomic.Logger;
    private _approvalMgr: TurbonomicActionApprovalManager;
    private _turbonomicGlide: TurbonomicGlide;
    private _actionDAO: TurbonomicActionDAO;

    constructor() {
        this._log = new x_turbo_turbonomic.Logger();
        this.type = 'TurbonomicRequestProcessor';
        this._approvalMgr = new TurbonomicActionApprovalManager();
        this._turbonomicGlide = new TurbonomicGlide();
        this._actionDAO = new TurbonomicActionDAO();
    }

    /**
     * Add new entries in Turbonomic Action Record table, based on the input body.
     *
     * @param body The input body as an array of Turbonomic action items.
     *
     * @return The result of this operation as arrays of succeeded/failed action records.
     */
    createActionRecords (body) {
        let succeeded = [];
        let failed = [];
        let dao: TurbonomicActionDAO = new TurbonomicActionDAO();
        let alreadyAuditedActions = [];
        let turbonomicInstance = body.turbonomicInstance;
        body = body.actionRecords;

        let turbonomicHost: string = '';
        let turbonomicVersion: string= '';
        let turbonomicStatus: string = '';
        let turbonomicMacAddress: string = '';
        if (turbonomicInstance) {
            turbonomicHost = turbonomicInstance.hostOrIp;
            turbonomicVersion = turbonomicInstance.version;
            turbonomicStatus = turbonomicInstance.status;
            turbonomicMacAddress = turbonomicInstance.macAddress;
        } else {
            this._log.warn("TurbonomicRequestProcessor.createActionRecords() - Failed to associate this action record with specific turbonomic instance due to missing information about it.");
        }

        for (let i = 0; i < body.length; i++) {
            let actionItem = body[i];
            if (!actionItem.actionOid || !actionItem.details) {
                this._log.error('TurbonomicRequestProcessor.createActionRecords() - Invalid action item: ' +
                    'OID = ' + actionItem.actionOid + ' ; ' +
                    'Details = ' + actionItem.details
                );
                failed.push({
                    'oid' : actionItem.actionOid,
                    'errorMsg' : 'Invalid action item: OID = ' + actionItem.actionOid + ' ; Details = ' + actionItem.details
                });
                continue;
            }

            let actionLifecycleStage: string = dao.valueOrEmptyStr(actionItem.actionLifeCycleEvent);
            let auditedActionKey: string = actionItem.actionOid + '_' + actionLifecycleStage;
            if (alreadyAuditedActions.indexOf(auditedActionKey) > -1) {
                this._log.debug('TurbonomicRequestProcessor.createActionRecords() - Already added a record for the action item with: ' +
                    'OID = ' + actionItem.actionOid + ', ' +
                    'lifecycle stage = ' + actionLifecycleStage);
                continue;
            }

            try {
                let turbonomicEntityId: string = '';
                let targetEntity = actionItem.targetEntity;
                let actionUtils: TurbonomicActionUtils = new TurbonomicActionUtils();

                // Check if mandatory targetEntity is present in the payload, for the current action item
                if (targetEntity) {
                    this._log.debug('TurbonomicRequestProcessor.createActionRecords() - The Turbonomic Entity UUID is: ' + targetEntity.uuid);

                    if (!targetEntity.name || !targetEntity.type || !targetEntity.targetName || !targetEntity.targetType) {
                        this._log.warn('TurbonomicRequestProcessor.createActionRecords() - Invalid target entity for action: ' +
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
                    this._log.warn('TurbonomicRequestProcessor.createActionRecords() - Missing entity data for action item with OID: '+ actionItem.actionOid);
                }

                dao.createOrUpdateActionRecord(
                  actionItem.actionOid,
                  actionItem.details,
                  actionItem.acceptedBy,
                  turbonomicEntityId,
                  actionLifecycleStage
                );

                succeeded.push({
                  oid: actionItem.actionOid
                });
                alreadyAuditedActions.push(auditedActionKey);

                let waitTime = dao.getSettingValue('action_processing_wait_time');
                if (waitTime != '') {
                    actionUtils.wait(waitTime);
                } else {
                    actionUtils.wait(50);
                }
            } catch (ex) {
                this._log.error('TurbonomicRequestProcessor.createActionRecords() - Cannot add Action Record for item with OID: '
                    + actionItem.actionOid + '. The error is: ' + ex);
                failed.push({
                    'oid' : actionItem.actionOid,
                    'errorMsg' : 'Cannot record action with OID: ' + actionItem.actionOid + ' ; Reason is: ' + ex});
            }
        }

        return {
            succeeded : succeeded,
            failed : failed
        };
    }

    /**
     * Search for the action records, based on the input body.
     *
     * @param body The input body as an array of Turbonomic action states.
     *
     * @return The result of this operation as an array of action records.
     */
    searchActionRecords(body) {
        // Note: This is optional implementation for now
        return {
            succeeded : [],
            failed : []
        };
    }

    /**
     * Add new entries in Turbonomic Action Approvals table and create matching change requests for them.
     *
     * @param body The input body as an array of Turbonomic action items.
     *
     * @return The result of this operation as arrays of succeeded/failed action approvals.
     */
    createActionApprovals (body) {
        let succeeded = [];
        let failed = [];
        let actionOIDs = [];
        let dao: TurbonomicActionDAO = new TurbonomicActionDAO();
        let turbonomicInstance = body.turbonomicInstance;
        body = body.actionApprovals;

        let turbonomicHost: string = '';
        let turbonomicVersion: string = '';
        let turbonomicStatus: string = '';
        let turbonomicMacAddress: string = '';
        if (turbonomicInstance) {
            turbonomicHost = turbonomicInstance.hostOrIp;
            turbonomicVersion = turbonomicInstance.version;
            turbonomicStatus = turbonomicInstance.status;
            turbonomicMacAddress = turbonomicInstance.macAddress;
        } else {
            this._log.warn("TurbonomicRequestProcessor.createActionApprovals() - Failed to associate this action record with specific turbonomic instance due to missing information about it.");
        }

        for (let i = 0; i < body.length; i++) {
            let actionItem = body[i];
            if (!this.isValidActionItemData(actionItem, "createActionApprovals()", failed)) {
                continue;
            }

            actionOIDs.push(actionItem.oid);

            try {
                let sourceEntityId: string = '';
                let destinationEntityId: string = '';
                let targetEntityId: string = '';
                let sourceEntity = actionItem.sourceEntity;
                let destinationEntity = actionItem.destinationEntity;
                let targetEntity = actionItem.targetEntity;
                let actionDto: string = actionItem.actionDto;
                let changeRequest: TurbonomicChangeRequest = new TurbonomicChangeRequest();
                let actionUtils: TurbonomicActionUtils = new TurbonomicActionUtils();

                // Check if mandatory targetEntity is present in the payload, for the current action item
                if (targetEntity) {
                    this._log.debug('TurbonomicRequestProcessor.createActionApprovals() - The target entity UUID is: ' + targetEntity.uuid);

                    if (!targetEntity.name || !targetEntity.type || !targetEntity.targetName || !targetEntity.targetType) {
                        this._log.error('TurbonomicRequestProcessor.createActionApprovals() - Invalid target entity for action: ' +
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
                    this._log.warn('TurbonomicRequestProcessor.createActionApprovals() - Missing target entity for action item with OID: '+ actionItem.oid);
                }

                // Check if sourceEntity is present in the payload, for the current action item
                if (sourceEntity) {
                    this._log.debug('TurbonomicRequestProcessor.createActionApprovals() - The source entity UUID is: ' + sourceEntity.uuid);
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
                        this._log.warn('TurbonomicRequestProcessor.createActionApprovals() - Invalid source entity for action: ' +
                            'OID = ' + actionItem.oid + ' ; ' +
                            'Source Entity Name = ' + sourceEntity.name + ' ; ' +
                            'Source Entity Type = ' + sourceEntity.type + ' ; ' +
                            'Target Name = ' + sourceEntity.targetName + ' ; ' +
                            'Target Type = ' + sourceEntity.targetType
                        );
                    }
                } else {
                    this._log.warn('TurbonomicRequestProcessor.createActionApprovals() - Missing source entity for action item with OID: '+ actionItem.oid);
                }

                // Check if destinationEntity is present in the payload, for the current action item
                if (destinationEntity) {
                    this._log.debug('TurbonomicRequestProcessor.createActionApprovals() - The destination entity UUID is: ' + destinationEntity.uuid);

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
                        this._log.warn('TurbonomicRequestProcessor.createActionApprovals() - Invalid destination entity for action: ' +
                            'OID = ' + actionItem.oid + ' ; ' +
                            'Destination Entity Name = ' + destinationEntity.name + ' ; ' +
                            'Destination Entity Type = ' + destinationEntity.type + ' ; ' +
                            'Target Name = ' + destinationEntity.targetName + ' ; ' +
                            'Target Type = ' + destinationEntity.targetType
                        );
                    }
                } else {
                    this._log.warn('TurbonomicRequestProcessor.createActionApprovals() - Missing destination entity data for action item with OID: '+ actionItem.oid);
                }

                if (!actionDto) {
                    this._log.warn('TurbonomicRequestProcessor.createActionApprovals() - Missing actionDTO data for action item with OID: '+ actionItem.oid);
                }
                let actionApproval: TurbonomicActionApproval = dao.getLastModifiedActionApproval(actionItem.oid);
                if (actionApproval) {
                    actionItem.executionDescription = 'Waiting for approval.';
                    this._approvalMgr.updateActionApprovalEntry(actionItem, actionApproval, sourceEntityId, destinationEntityId, targetEntityId, actionDto, failed, succeeded);
                    this._log.debug('TurbonomicRequestProcessor.createActionApprovals() - Successfully updated Action Approval for action item with OID: ' + actionItem.oid);
                } else {
                    changeRequest = this.createNewActionApprovalEntry(actionItem, sourceEntityId, destinationEntityId, targetEntityId, actionDto);
                    if (changeRequest.getId()) {
                        this._log.debug('TurbonomicRequestProcessor.createActionApprovals() - ' +
                            'Successfully created Action Approval and change request with ID: ' + changeRequest.getId());

                        succeeded.push({'oid' : actionItem.oid,
                            'changeRequestId' : changeRequest.getId(),
                            'changeRequestNumber' : changeRequest.getNumber(),
                            'state' : TurbonomicActionApprovalState.PENDING_APPROVAL
                        });
                    } else {
                        if (!this._actionDAO.isChangeRequestDisabled()) {
                            failed.push({'oid' : actionItem.oid,
                                'errorMsg' : 'Cannot create Action Approval for action item with invalid state: ' + actionItem.state
                            });
                        }
                    }
                }

                let waitTime = dao.getSettingValue('action_processing_wait_time');
                if (waitTime != '') {
                    actionUtils.wait(waitTime);
                } else {
                    actionUtils.wait(50);
                }
            } catch (ex) {
                this._log.error('TurbonomicRequestProcessor.createActionApprovals() - Cannot create Action Approval for item with OID: '
                    + actionItem.oid + '. The error is: ' + ex);
                failed.push({
                    'oid' : actionItem.oid,
                    'errorMsg' : 'Cannot create Action Approval with OID: ' + actionItem.oid + ' ; Reason is: ' + ex
                });
            }
        }

        //this._approvalMgr.markMissedActionApprovals(actionOIDs);

        return {
            succeeded : succeeded,
            failed : failed
        };
    }

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
    createNewActionApprovalEntry (actionItem, sourceEntityId: string, destinationEntityId: string, targetEntityId: string, actionDto: string): TurbonomicChangeRequest {
        let result: TurbonomicChangeRequest = new TurbonomicChangeRequest();
        let dao: TurbonomicActionDAO = new TurbonomicActionDAO();
        let actionItemState: string = actionItem.state.toUpperCase();

        switch (actionItemState) {
            case TurbonomicActionItemState.PENDING_ACCEPT :
                // Add new action approval and its matching change request
                result = this._approvalMgr.addActionApproval(actionItem, sourceEntityId, destinationEntityId, targetEntityId, actionDto);
                break;
            case TurbonomicActionItemState.ACCEPTED :
            case TurbonomicActionItemState.REJECTED :
            case TurbonomicActionItemState.IN_PROGRESS :
            case TurbonomicActionItemState.SUCCEEDED :
            case TurbonomicActionItemState.FAILED :
            case TurbonomicActionItemState.QUEUED :
                let details: string = actionItem.description + '; Action State = ' + actionItem.state;

                // Add audit record to mention the invalid Turbonomic action state
                dao.createOrUpdateActionRecord(actionItem.oid, details, '', targetEntityId, dao.valueOrEmptyStr(actionItem.actionLifeCycleEvent));

                this._log.debug('TurbonomicRequestProcessor.createNewActionApprovalEntry() - ' +
                    'Cannot create Action Approval entry for Turbonomic action with state: ' + actionItem.state);
                break;
            case TurbonomicActionItemState.CLEARED :
            case TurbonomicActionItemState.DISABLED :
            case TurbonomicActionItemState.RECOMMENDED :
                this._log.debug('TurbonomicRequestProcessor.createNewActionApprovalEntry() - ' +
                    'Action Approval entries are not required for Turbonomic action with state: ' + actionItem.state);
                break;
            default :
                this._log.warn('TurbonomicRequestProcessor.createNewActionApprovalEntry() - ' +
                    'Unsupported action item state: ' + actionItemState);
        }

        return result;
    }

    /**
     * Update the Turbonomic Action Approvals based on the input body request.
     *
     * @param body The input body as an array of Turbonomic action items.
     *
     * @return The result of this operation as arrays of succeeded/failed action approval updates.
     */
    updateActionApprovals (body) {
        let succeeded = [];
        let failed = [];
        let dao: TurbonomicActionDAO = new TurbonomicActionDAO();
        body = body.actionApprovalUpdates;

        for (let i = 0; i < body.length; i++) {
            let actionItem = body[i];
            if (!this.isValidActionItemData(actionItem, "updateActionApprovals()", failed)) {
                continue;
            }

            try {
                let actionApproval: TurbonomicActionApproval = dao.getLastModifiedActionApproval(actionItem.oid);
                let sourceEntityId: string = actionApproval.getSourceEntityId();
                let destinationEntityId: string = actionApproval.getDestinationEntityId();
                let targetEntityId: string = actionApproval.getTargetEntityId();
                let actionDto: string = actionApproval.getActionDTO();
                if (actionApproval) {
                    actionItem.executionDescription = actionItem.description();
                    actionItem.description = actionApproval.getDescription();
                    actionItem.category = actionApproval.getCategory();
                    actionItem.commodityName = actionApproval.getCommodityName();
                    actionItem.risk = actionApproval.getRisk();
                    actionItem.from = actionApproval.getFrom();
                    actionItem.to = actionApproval.getTo();
                    actionItem.savings = actionApproval.getSavings();
                    actionItem.changedBy = actionApproval.getChangedBy();
                    this._approvalMgr.updateActionApprovalEntry(actionItem, actionApproval, sourceEntityId, destinationEntityId, targetEntityId, actionDto, failed, succeeded);
                    this._log.debug('TurbonomicRequestProcessor.updateActionApprovals() - ' +
                        'Successfully updated Action Approval for action item with OID: ' + actionItem.oid);
                } else {
                    failed.push({'oid' : actionItem.oid,
                        'errorMsg' : 'Missing Action Approval for action item with OID: ' + actionItem.oid
                    });
                }
            } catch (ex) {
                this._log.error('TurbonomicRequestProcessor.updateActionApprovals() - Cannot update Action Approval for action item with OID: '
                    + actionItem.oid + '. The error is: ' + ex);
                failed.push({
                    'oid' : actionItem.oid,
                    'errorMsg' : 'Cannot update Action Approval with OID: ' + actionItem.oid + ' ; Reason is: ' + ex
                });
            }
        }

        return {
            succeeded : succeeded,
            failed : failed
        };
    }

    /**
     * Search for the action approvals, based on the input body.
     *
     * @param body The input body as an array of Turbonomic action states.
     * @param addAllApprovalsInTransition Boolean flag set to true if all approvals whose states are in transition
     *        will be added to the API result, false otherwise.
     *
     * @return The result of this operation as an array of action approvals.
     */
    searchActionApprovals (body, addAllApprovalsInTransition: boolean) {
        let succeeded = [];
        let failed = [];
        let dao: TurbonomicActionDAO = new TurbonomicActionDAO();

        let actionOIDs = body.oids;
        if (actionOIDs && actionOIDs.length > 0) {
            let uniqueActionOIDs = [];
            for (let i = 0; i < actionOIDs.length; i++) {
                if (uniqueActionOIDs.indexOf(actionOIDs[i]) > -1) {
                    continue;
                }
                uniqueActionOIDs.push(actionOIDs[i]);
            }

            this._log.debug('TurbonomicRequestProcessor.searchActionApprovals() - The size of unique action OIDs array is ' + uniqueActionOIDs.length);

            if (uniqueActionOIDs.length <= 50) {
                this._log.debug('TurbonomicRequestProcessor.searchActionApprovals() - The unique input action OIDs are: ' + uniqueActionOIDs.join());
            }

            if (uniqueActionOIDs.length > 0 || addAllApprovalsInTransition) {
                succeeded = JSON.parse(JSON.stringify(dao.getActionApprovals(uniqueActionOIDs, addAllApprovalsInTransition)));
            }
        } else {
            failed.push({
                'errorMsg' : 'The list of action OIDs and addAllApprovalsInTransition parameter is not set to true is missing.' + addAllApprovalsInTransition
            });
        }

        return {
            succeeded : succeeded,
            failed : failed
        };
    }

    /**
     * Check that actionItem contains all the required information.
     *
     * @param actionItem The input action item with the Turbonomic action details.
     * @param methodName The name of method from which this method was called.
     * @param failed The part of API response which contains information about errors.
     *
     * @return true if there are all required value otherwise false.
     */
    isValidActionItemData (actionItem, methodName: string, failed): boolean {
        if (!actionItem.oid) {
            this._log.error('TurbonomicRequestProcessor.'+ methodName +' - Invalid action item due to missing OID.' +
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
            this._log.error('TurbonomicRequestProcessor.' + methodName + ' - Invalid action item due to missing description.' +
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
            this._log.error('TurbonomicRequestProcessor.'+ methodName + ' - Invalid action due to missing state. ' +
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
    }

    /**
     * Get or create a new Turbonomic Entity entry based on the input values.
     *
     * @param uuid The uuid of the Turbonomic entity.
     * @param name The name of the Turbonomic entity.
     * @param type The type of the Turbonomic entity.
     * @param targetName The target name of the Turbonomic entity.
     * @param targetType The target type of the Turbonomic entity.
     * @param targetIp The target IP of the Turbonomic entity.
     * @param instanceHostOrIp The host or IP address of Turbonomic Instance.
     * @param instanceVersion The version of Turbonomic Instance.
     * @param instanceStatus The status (online/offline) of Turbonomic Instance.
     * @param instanceMacAddress The MAC address of Turbonomic Instance.
     *
     * @return The GUID of the Turbonomic entity or null if the entity cannot be created.
     */
    getOrCreateTurbonomicEntity (uuid: string, name: string, type: string, targetName: string, targetType: string, targetIp: string,
    		instanceHostOrIp: string, instanceVersion: string, instanceStatus: string, instanceMacAddress: string): string {
        let result: string = null;
        let dao: TurbonomicActionDAO = new TurbonomicActionDAO();

        // Create or get and update Turbonomic Instance
        let turbonomicInstance: string = this.createOrUpdateTurbonomicInstance(dao.valueOrEmptyStr(instanceHostOrIp),
            dao.valueOrEmptyStr(instanceStatus),
            dao.valueOrEmptyStr(instanceVersion),
            dao.valueOrEmptyStr(instanceMacAddress));

        // Search for the Turbonomic Entity, before creating a new one
        let turbonomicEntity: TurbonomicEntity = dao.getTurbonomicEntity(name, type, targetName, targetType);
        if (turbonomicEntity == null) {
            turbonomicEntity = new TurbonomicEntity();
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

            let entityMatcher: TurbonomicEntityMatcher = new TurbonomicEntityMatcher();
            let configItem = entityMatcher.findConfigurationItem(turbonomicEntity);

            if (configItem != null) {
                this._log.debug('TurbonomicRequestProcessor.getOrCreateTurbonomicEntity() - The matching configuration item GUID is: ' + configItem.sys_id);
                turbonomicEntity.setConfigItemId(configItem.sys_id);
            }

            result = dao.createTurbonomicEntityFromInput(turbonomicEntity);
            this._log.debug('TurbonomicRequestProcessor.getOrCreateTurbonomicEntity() - Successfully created new Turbonomic Entity with GUID: '+ result);

        } else {
            // update/create reference to Turbonomic Instance
            dao.updateTurbonomicEntity(turbonomicEntity.getGuid(), turbonomicInstance);
            if(!turbonomicEntity.getConfigItemId()) {
                let entityMatcher: TurbonomicEntityMatcher = new TurbonomicEntityMatcher();
                let configItem = entityMatcher.findConfigurationItem(turbonomicEntity);
                if (configItem != null) {
                    dao.updateTurbonomicEntityConfigItem(turbonomicEntity, configItem.sys_id);
                } else {
                    this._log.debug('TurbonomicRequestProcessor.getOrCreateTurbonomicEntity() - Unable to find configuration item for TurbonomicEntity: ' + turbonomicEntity.getUuid());
                }
            }
            result = turbonomicEntity.getGuid();
        }

        return result;
    }

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
    createOrUpdateTurbonomicInstance (hostOrIp: string, status: string, version: string, macAddress: string): string {
        let dao: TurbonomicActionDAO = new TurbonomicActionDAO();
        let turbonomicInstanceId: string = null;

        this._log.debug('TurbonomicRequestProcessor.createOrUpdateTurbonomicInstance() - Searching for instance with host/IP:' + hostOrIp);
        // host/ip is mandatory for instance
        if (hostOrIp) {
            // Search for the Turbonomic Instance, before creating a new one
            let turbonomicInstance: TurbonomicInstance = dao.getTurbonomicInstance(hostOrIp);
            if (turbonomicInstance != null) {
                dao.updateTurbonomicInstance(hostOrIp, status, version, macAddress);
                turbonomicInstanceId = turbonomicInstance.getGuid();
            } else {
                // Create new Turbonomic Instance
                turbonomicInstanceId = dao.createTurbonomicInstance(hostOrIp, status, version, this._turbonomicGlide.newDateTime().toString(), macAddress);
            }
        } else {
            this._log.warn("TurbonomicRequestProcessor.createOrUpdateTurbonomicInstance() - Invalid turbonomic instance due to missing host/Ip value.");
        }
        return turbonomicInstanceId;
    }
}
