var TurbonomicActionDAO = (function () {

    var type = 'TurbonomicActionDAO';

    function TurbonomicActionDAO(actionApprovalState, turbonomicGlide) {
        if (actionApprovalState) {
            this._actionApprovalState = actionApprovalState;
        } else {
            this._actionApprovalState = new x_turbo_turbonomic.TurbonomicActionApprovalState();
        }
        if (turbonomicGlide) {
            this._turbonomicGlide = turbonomicGlide;
        } else {
            this._turbonomicGlide = new TurbonomicGlide();
        }
        this._tableNames = new TurbonomicTableNames();
    }

    /**
     * Get the last updated Turbonomic action record entry, for the input OID and lifecycle stage.
     *
     * @param oid The input OID value.
     * @param lifecycleStage The input lifecycle stage value.
     *
     * @return The last updated Turbonomic action record GUID for the input OID, or null if not found.
     */
    TurbonomicActionDAO.prototype.getLastModifiedActionRecord = function(oid, lifecycleStage) {
        var actionRecord = new GlideRecordSecure('x_turbo_turbonomic_turbonomic_action_record');
        actionRecord.addQuery('action_oid', oid);
        actionRecord.addQuery('lifecycle_stage', lifecycleStage);
        actionRecord.orderByDesc('sys_updated_on');
        actionRecord.query();

        if (actionRecord.next()) {
            var result = new x_turbo_turbonomic.TurbonomicActionRecord();
            result.setActionOID(oid);
            result.setDetails(actionRecord.getValue('details'));
            result.setAcceptedBy(actionRecord.getValue(('accepted_by')));
            result.setCount(parseInt(actionRecord.getValue('count')));
            result.setLastUpdateTime(actionRecord.getValue('sys_updated_on'));
            result.setTurbonomicEntityId(actionRecord.getValue('turbonomic_entity_id'));
            result.setLifecycleStage(lifecycleStage);

            gs.debug('TurbonomicActionDAO.getLastModifiedActionRecord() - Found valid action record with OID: ' + oid);
            return result;
        }

        gs.warn('TurbonomicActionDAO.getLastModifiedActionRecord() - Cannot find any action record with OID: ' + oid);
        return null;
    };

    /**
     * Create a new entry in the Turbonomic Action Record table, based on the input values.
     *
     * @param oid The input action OID.
     * @param details The action details.
     * @param acceptedBy The user who accepted the action (if any).
     * @param count The action record counter.
     * @param turbonomicEntityId The ID of the Turbonomic entity for which the action was triggerred.
     * @param lifecycleStage The action lifecycle stage (e.g. "On Generation", "After Execution").
     *
     * @return result The GUID of the newly created Turbonomic Action record.
     */
    TurbonomicActionDAO.prototype.createActionRecord = function(oid, details, acceptedBy, turbonomicEntityId, lifecycleStage) {
        return this.insertIntoImportSet(this._tableNames.ACTION_RECORD_IMPORT_SET,
            {
                u_action_oid: oid,
                u_details: details,
                u_accepted_by: this.valueOrEmptyStr(acceptedBy),
                u_count: 1,
                u_turbonomic_entity: turbonomicEntityId,
                u_lifecycle_stage: this.valueOrEmptyStr(lifecycleStage)
            },
            'TurbonomicActionDAO.createActionRecord() - Successfully created new action record with OID: ' + oid);
    };

    /**
     * Update the last modified Turbonomic action record with the input OID and lifecycle stage.
     *
     * @param oid The input action OID.
     * @param details The action details.
     * @param acceptedBy The user who accepted the action (if any).
     * @param count The action record counter.
     * @param turbonomicEntityId The ID of the Turbonomic entity for which the action was triggerred.
     * @param lifecycleStage The action lifecycle stage (e.g. "On Generation", "After Execution").
     * @param actionDto The action DTO represented in JSON holding all the information about the
     *          action that Turbonomic has.
     */
    TurbonomicActionDAO.prototype.updateLastModifiedActionRecord = function(oid, details, acceptedBy, count, turbonomicEntityId, lifecycleStage, actionDto) {
        var actionRecord = new GlideRecordSecure('x_turbo_turbonomic_turbonomic_action_record');
        actionRecord.addQuery('action_oid', oid);
        actionRecord.addQuery('lifecycle_stage', lifecycleStage);
        actionRecord.orderByDesc('sys_updated_on');
        actionRecord.query();

        if (actionRecord.next()) {
            var actionRecordSysId = actionRecord.getValue('sys_id');
            this.insertIntoImportSet(this._tableNames.ACTION_RECORD_IMPORT_SET,
                {
                    u_update_sys_id: actionRecordSysId,
                    u_details: details,
                    u_accepted_by: this.valueOrEmptyStr(acceptedBy),
                    u_count: count,
                    u_turbonomic_entity: turbonomicEntityId,
                    u_lifecycle_stage: this.valueOrEmptyStr(lifecycleStage)
                    // actionRecord.setValue('action_dto', actionDto); TODO: action record does not
                    // have action_dto. why do we set it?
                },
                'TurbonomicActionDAO.updateLastModifiedActionRecord() - ' +
                    'Successfully updated the action record with OID: ' + oid);
            return true;
        } else {
            gs.warn('TurbonomicActionDAO.updateLastModifiedActionRecord() - ' +
                    'Cannot find the action record with OID: ' + oid);
            return false;
        }
	};

    /**
     * Create a new entry in the Turbonomic Action Record table or update an existing one,
     * based on the input values.
     *
     * @param oid The input action OID.
     * @param details The action details.
     * @param acceptedBy The user who accepted the action (if any).
     * @param turbonomicEntityId The ID of the Turbonomic entity for which the action was triggerred.
     * @param lifecycleStage The action lifecycle stage (e.g. "On Generation", "After Execution").
     *
     * @return result The GUID of the newly created Turbonomic Action record.
     */
    TurbonomicActionDAO.prototype.createOrUpdateActionRecord = function(oid, details, acceptedBy, turbonomicEntityId, lifecycleStage) {
        var actionRecord = this.getLastModifiedActionRecord(oid, lifecycleStage);
        if (actionRecord) {
            var actionUtils = new x_turbo_turbonomic.TurbonomicActionUtils();
            if (actionUtils.isActionRetentionTimeOn(actionRecord.getLastUpdateTime())) {
                // If the retention time has not passed, just update the existing action record
                this.updateLastModifiedActionRecord(oid, details, acceptedBy,
                    actionRecord.getCount() + 1, turbonomicEntityId, lifecycleStage);
                gs.debug('TurbonomicRequestProcessor.createOrUpdateActionRecord() - Retention time is on. Updated the Action Record with: ' +
                        'OID = ' + oid + ', ' + 'lifecycle stage = ' + lifecycleStage);
            } else {
                this.createActionRecord(oid, details, acceptedBy, turbonomicEntityId,
                    lifecycleStage);
                gs.debug('TurbonomicRequestProcessor.createOrUpdateActionRecord() - Retention time has passed. Added new Action Record with: ' +
                        'OID = ' + oid + ', ' + 'lifecycle stage = ' + lifecycleStage);
            }
        } else {
            this.createActionRecord(oid, details, acceptedBy, turbonomicEntityId, lifecycleStage);
            gs.debug('TurbonomicRequestProcessor.createOrUpdateActionRecord() - Successfully created new Action Record with: ' +
                'OID = ' + oid + ', ' + 'lifecycle stage = ' + lifecycleStage);
        }
    };

    /**
     * Get the Turbonomic entity based on its name, type and its target name and type.
     *
     * @param entityName The Turbonomic entity name.
     * @param entityType The Turbonomic entity type.
     * @param targetName The name of the Turbonomic target that discovered the entity.
     * @param targetType The type of the Turbonomic target that discovered the entity.
     *
     * @return The TurbonomicEntity instance or null, if not found.
     */
    TurbonomicActionDAO.prototype.getTurbonomicEntity = function(entityName, entityType, targetName, targetType) {
        var turbonomicEntityRecord = new GlideRecordSecure('x_turbo_turbonomic_x_turbonomic_entity');
        turbonomicEntityRecord.addQuery('name', entityName);
        turbonomicEntityRecord.addQuery('type', entityType);
        turbonomicEntityRecord.addQuery('target_name', targetName);
        turbonomicEntityRecord.addQuery('target_type', targetType);
        turbonomicEntityRecord.query();

        if (turbonomicEntityRecord.next()) {
            var result = new x_turbo_turbonomic.TurbonomicEntity();
            result.setGuid(turbonomicEntityRecord.getValue('sys_id'));
            result.setUuid(turbonomicEntityRecord.getValue('uuid'));
            result.setEntityName(entityName);
            result.setEntityType(entityType);
            result.setTargetName(targetName);
            result.setTargetType(targetType);
            result.setTargetIP(turbonomicEntityRecord.getValue('target_ip'));
            result.setConfigItemId(turbonomicEntityRecord.getValue('sn_entity_id'));
            result.setTurbonomicInstanceId(turbonomicEntityRecord.getValue('turbonomic_instance_id'));

            gs.debug('TurbonomicActionDAO.getTurbonomicEntity() - Found Turbonomic entity with name: ' + entityName);
            return result;
        }

        gs.warn('TurbonomicActionDAO.getTurbonomicEntity() - Cannot find the Turbonomic entity named: ' + entityName);
        return null;
    };

    /**
     * Get the Turbonomic entity based on its GUID.
     *
     * @param id The Turbonomic entity GUID.
     *
     * @return The TurbonomicEntity instance or null, if not found.
     */
    TurbonomicActionDAO.prototype.getTurbonomicEntityById = function(id) {
        var turbonomicEntityRecord = new GlideRecordSecure('x_turbo_turbonomic_x_turbonomic_entity');
        turbonomicEntityRecord.addQuery('sys_id', id);
        turbonomicEntityRecord.query();

        if (turbonomicEntityRecord.next()) {
            var result = new x_turbo_turbonomic.TurbonomicEntity();
            result.setGuid(id);
            result.setUuid(turbonomicEntityRecord.getValue('uuid'));
            result.setEntityName(turbonomicEntityRecord.getValue('name'));
            result.setEntityType(turbonomicEntityRecord.getValue('type'));
            result.setTargetName(turbonomicEntityRecord.getValue('target_name'));
            result.setTargetType(turbonomicEntityRecord.getValue('target_type'));
            result.setTargetIP(turbonomicEntityRecord.getValue('target_ip'));
            result.setConfigItemId(turbonomicEntityRecord.getValue('sn_entity_id'));
            result.setTurbonomicInstanceId(turbonomicEntityRecord.getValue('turbonomic_instance_id'));

            gs.debug('TurbonomicActionDAO.getTurbonomicEntityById() - Found Turbonomic entity with GUID: ' + id);
            return result;
        }

        gs.warn('TurbonomicActionDAO.getTurbonomicEntityById() - Cannot find the Turbonomic entity with GUID: ' + id);
        return null;
    };

    /**
     * Create a new record in the Turbonomic Entity table, based on the input value.
     *
     * @param turbonomicEntity The input Turbonomic entity.
     *
     * @return result The GUID of the newly created Turbonomic Entity record.
     */
    TurbonomicActionDAO.prototype.createTurbonomicEntityFromInput = function(turbonomicEntity) {
        if (turbonomicEntity) {
            return this.createTurbonomicEntity(
                                turbonomicEntity.getUuid(),
                                turbonomicEntity.getEntityName(),
                                turbonomicEntity.getEntityType(),
                                turbonomicEntity.getTargetName(),
                                turbonomicEntity.getTargetType(),
                                turbonomicEntity.getTargetIP(),
                                turbonomicEntity.getConfigItemId(),
                                turbonomicEntity.getTurbonomicInstanceId()
                   );
        } else {
            gs.warn('TurbonomicActionDAO.createTurbonomicEntityFromInput() - ' +
                    'Invalid input TurbonomicEntity has been provided');
            return false;
        }
    };

    /**
     * Update a new record in the Turbonomic Entity table, with the provided config item sys id..
     *
     * @param turbonomicEntity The input Turbonomic entity.
     * @param configItemSysId The configItemSysId
     *
     * @return true if update succeeds, false otherwise.
     */
    TurbonomicActionDAO.prototype.updateTurbonomicEntityConfigItem = function(turbonomicEntity, configItemSysId) {
        if (!turbonomicEntity)  {
            gs.warn('TurbonomicActionDAO.updateTurbonomicEntityConfigItem() - ' +
                    'Invalid input TurbonomicEntity has been provided');
            return false;
        }
        if (!configItemSysId)  {
            gs.warn('TurbonomicActionDAO.updateTurbonomicEntityConfigItem() - ' +
                    'Invalid input TurbonomicEntity has been provided');
            return false;
        }

        var entitySysId = turbonomicEntity.getGuid();
        var turbonomicEntityRecord = new GlideRecordSecure('x_turbo_turbonomic_x_turbonomic_entity');
        turbonomicEntityRecord.addQuery('sys_id', entitySysId);
        turbonomicEntityRecord.query();

        if (!turbonomicEntityRecord.next()) {
            return false;
        }

        this.insertIntoImportSet(this._tableNames.ENTITY_IMPORT_SET,
            {
                u_update_sys_id: entitySysId, // use the sysId to update
                u_related_ci: configItemSysId
            },
            'TurbonomicActionDAO.updateTurbonomicEntityConfigItem() - Successfully updated CI for Turbonomic entity record with UUID: ' + entitySysId);

        return true;
    };

    /**
     * Create a new record in the Turbonomic Entity table, based on the input values.
     *
     * @param uuid The UUID of the Turbonomic entity.
     * @param name The Turbonomic entity name.
     * @param type The Turbonomic entity type.
     * @param targetName The name of the Turbonomic target that discovered the entity.
     * @param targetType The type of the Turbonomic target that discovered the entity.
     * @param targetIP The IP address of the Turbonomic target that discovered the entity.
     * @param configItemId The GUID of the matching configuration item in ServiceNow.
     * @param turbonomicInstanceID The GUID of the Turbonomic instance in ServiceNow.
     *
     * @return result The GUID of the newly created Turbonomic Entity record.
     */
    TurbonomicActionDAO.prototype.createTurbonomicEntity = function(uuid, name, type, targetName, targetType, targetIP, configItemId, turbonomicInstanceId) {
        return this.insertIntoImportSet(this._tableNames.ENTITY_IMPORT_SET,
            {
                u_uuid: uuid,
                u_name: name,
                u_type: type,
                u_target_name: targetName,
                u_target_type: targetType,
                u_target_ip: this.valueOrEmptyStr(targetIP),
                u_related_ci: configItemId,
                u_turbonomic_instance: turbonomicInstanceId
            },
            'TurbonomicActionDAO.createTurbonomicEntity() - Successfully created new Turbonomic entity record with UUID: ' + uuid);
    };

    /**
     * Update Turbonomic Entity.
     *
     * @param turbonomicEntityId The ID of the Turbonomic entity for which the action was triggered.
     * @param turbonomicInstanceId The ID of the Turbonomic instance which discovered this entity and where action was generated.
     * @return true if update succeeds, false otherwise.
     */
    TurbonomicActionDAO.prototype.updateTurbonomicEntity = function(turbonomicEntityId, turbonomicInstanceId) {
        gs.debug('TurbonomicActionDAO.prototype.updateTurbonomicEntity - Updating Turbonomic Entity with turbonomicEntityId =' + turbonomicEntityId);
        var turbonomicEntityRecord = new GlideRecordSecure('x_turbo_turbonomic_x_turbonomic_entity');
        turbonomicEntityRecord.addQuery('sys_id', turbonomicEntityId);
        turbonomicEntityRecord.query();

        if (turbonomicEntityRecord.next()) {
            turbonomicEntityRecord.setValue('turbonomic_instance_id', this.valueOrEmptyStr(turbonomicInstanceId));

            this.insertIntoImportSet(this._tableNames.ENTITY_IMPORT_SET,
                {
                    u_update_sys_id: turbonomicEntityId, // use the sysId to update
                    u_turbonomic_instance: turbonomicInstanceId
                },
                'TurbonomicActionDAO.updateTurbonomicEntity() - ' +
                    'Successfully updated the Turbonomic Entity with turbonomicEntityId = ' + turbonomicEntityId);

            return true;
        } else {
            gs.warn('TurbonomicActionDAO.updateTurbonomicEntity() - ' +
                    'Cannot find the Turbonomic Entity with turbonomicEntityId = ' + turbonomicEntityId);
            return false;
        }
    };

    /**
     * Get the Turbonomic instance with the input host name or IP address.
     *
     * @param hostOrIp The input host name or IP address.
     *
     * @return The TurbonomicInstance object if found, null otherwise.
     */
    TurbonomicActionDAO.prototype.getTurbonomicInstance = function(hostOrIp) {
        var turbonomicInstanceRecord = new GlideRecordSecure('x_turbo_turbonomic_turbonomic_instance');
        turbonomicInstanceRecord.addQuery('host_or_ip', hostOrIp);
        turbonomicInstanceRecord.query();

        if (turbonomicInstanceRecord.next()) {
            var result = new x_turbo_turbonomic.TurbonomicInstance();
            result.setGuid(turbonomicInstanceRecord.getValue('sys_id'));
            result.setHostOrIp(hostOrIp);
            result.setStatus(turbonomicInstanceRecord.getValue('status'));
            result.setVersion(turbonomicInstanceRecord.getValue(('version')));
            result.setLastAccessTime(turbonomicInstanceRecord.getValue('last_access_time'));
            result.setMacAddress(turbonomicInstanceRecord.getValue(('mac_address')));

            gs.debug('TurbonomicActionDAO.getTurbonomicInstance() - Found valid Turbonomic Instance record with host/IP: ' + hostOrIp);
            return result;
        }

        gs.warn('TurbonomicActionDAO.getTurbonomicInstance() - Cannot find any Turbonomic instance record for host/IP: ' + hostOrIp);
        return null;
    };

    /**
     * Create a new Turbonomic Instance record, based on the input values.
     *
     * @param hostOrIp The host name or IP address of the Turbonomic instance.
     * @param status The status of the Turbonomic instance.
     * @param version The version of the Turbonomic instance.
     * @param lastAccessTime The last time ServiceNow was accessed from the Turbonomic instance.
     * @param macAddress The MAC address of the Turbonomic instance.
     *
     * @return result The GUID of the newly created Turbonomic Instance record.
     */
    TurbonomicActionDAO.prototype.createTurbonomicInstanceFromInput = function(turbonomicInstance) {
        if (turbonomicInstance) {
            return this.createTurbonomicInstance(
                                turbonomicInstance.getHostOrIp(),
                                turbonomicInstance.getStatus(),
                                turbonomicInstance.getVersion(),
                                turbonomicInstance.getLastAccessTime(),
                                turbonomicInstance.getMacAddress()
                   );
        } else {
            gs.warn('TurbonomicActionDAO.createTurbonomicInstanceFromInput() - ' +
                    'Invalid input TurbonomicInstance has been provided');
            return false;
        }
    };

    /**
     * Create a new Turbonomic Instance record, based on the input values.
     *
     * @param hostOrIp The host name or IP address of the Turbonomic instance.
     * @param status The status of the Turbonomic instance.
     * @param version The version of the Turbonomic instance.
     * @param lastAccessTime LocalDateTimeString: The last time ServiceNow was accessed from the Turbonomic instance.
     * @param macAddress The MAC address of the Turbonomic instance.
     *
     * @return result The GUID of the newly created Turbonomic Instance record.
     */
    TurbonomicActionDAO.prototype.createTurbonomicInstance = function(hostOrIp, status, version, lastAccessTime, macAddress) {
        return this.insertIntoImportSet(this._tableNames.INSTANCE_IMPORT_SET,
            {
                u_host_or_ip: hostOrIp,
                u_status: this.valueOrEmptyStr(status),
                u_version: this.valueOrEmptyStr(version),
                u_last_access_time: this.valueOrEmptyStr(lastAccessTime),
                u_mac_address: this.valueOrEmptyStr(macAddress)
            },
            'TurbonomicActionDAO.createTurbonomicInstance() - Successfully created new Turbonomic instance record for host/IP: ' + hostOrIp);
    };

    /**
     * Update Turbonomic Instance record.
     *
     * @param hostOrIp The host/ip of the instance.
     * @param status The status of the instance (ONLINE/OFFLINE).
     * @param version The version of the instance.
     * @param macAddress The MAC address of the instance.
     */
    TurbonomicActionDAO.prototype.updateTurbonomicInstance = function(hostOrIp, status, version, macAddress) {
        gs.debug('TurbonomicActionDAO.updateTurbonomicInstance() - Updating Turbonomic instance: host = ' + hostOrIp + '; version = ' + version+ '; status = ' + status +
               '; MAC Address = ' + macAddress);
        var turbonomicInstanceRecord = new GlideRecordSecure('x_turbo_turbonomic_turbonomic_instance');
        turbonomicInstanceRecord.addQuery('host_or_ip', hostOrIp);
        turbonomicInstanceRecord.query();

        if (turbonomicInstanceRecord.next()) {
            var instanceSysId = turbonomicInstanceRecord.getValue('sys_id');

            this.insertIntoImportSet(this._tableNames.INSTANCE_IMPORT_SET,
                {
                    u_update_sys_id: instanceSysId,
                    u_status: this.valueOrEmptyStr(status),
                    u_version: this.valueOrEmptyStr(version),
                    u_last_access_time: new GlideDateTime().getDisplayValue(),
                    u_mac_address: this.valueOrEmptyStr(macAddress)
                },
                'TurbonomicActionDAO.updateTurbonomicInstance() - ' +
                    'Successfully updated the Turbonomic Instance record with host/Ip: ' + hostOrIp);

            return true;
        } else {
            gs.warn('TurbonomicActionDAO.updateTurbonomicInstance() - ' +
                    'Cannot find the Turbonomic Instance record with host/Ip: ' + hostOrIp);
            return false;
        }
    };

    /**
     * Get the last updated Turbonomic action approval instance, for the input OID.
     *
     * @param oid The input OID value.
     *
     * @return The last updated TurbonomicActionApproval instance or null, if not found.
     */
    TurbonomicActionDAO.prototype.getLastModifiedActionApproval = function(oid) {
        var actionApprovalRecord = new GlideRecordSecure('x_turbo_turbonomic_turbonomic_action_approval');
        actionApprovalRecord.addQuery('oid', oid);
        actionApprovalRecord.orderByDesc('sys_updated_on');
        actionApprovalRecord.query();

        if (actionApprovalRecord.next()) {
            gs.debug('TurbonomicActionDAO.getLastModifiedActionApproval() - Found action approval record with OID: ' + oid);
            var result = new x_turbo_turbonomic.TurbonomicActionApproval();
            result.setActionOID(oid);
            result.setName(actionApprovalRecord.getValue('name'));
            result.setDescription(actionApprovalRecord.getValue('description'));
            result.setCategory(actionApprovalRecord.getValue('category'));
            result.setCommodityName(actionApprovalRecord.getValue('commodity_name'));
            result.setFrom(actionApprovalRecord.getValue('from'));
            result.setTo(actionApprovalRecord.getValue('to'));
            result.setRisk(actionApprovalRecord.getValue('risk'));
            result.setSavings(actionApprovalRecord.getValue('savings'));
            result.setCount(parseInt(actionApprovalRecord.getValue('count')));
            result.setChangedBy(actionApprovalRecord.getValue('sys_updated_by'));
            result.setSourceEntityId(actionApprovalRecord.getValue('source_entity_id'));
            result.setTargetEntityId(actionApprovalRecord.getValue('target_entity_id'));
            result.setDestinationEntityId(actionApprovalRecord.getValue('destination_entity_id'));
            result.setChangeRequestId(actionApprovalRecord.getValue('change_request_id'));
            result.setStateId(actionApprovalRecord.getValue('state_id'));
            result.setTypeId(actionApprovalRecord.getValue('type_id'));
            result.setTimestamp(actionApprovalRecord.getValue('turbonomic_timestamp'));
            result.setActionDTO(actionApprovalRecord.getValue('action_dto'));
            result.setSysId(actionApprovalRecord.getValue('sys_id'));

            return result;
        }

        gs.warn('TurbonomicActionDAO.getLastModifiedActionApproval() - Cannot find any action approval record for OID: ' + oid);
        return null;
    };

    /**
     * Get the list of {action approval OID, state} pairs, based on the input OIDs.
     *
     * @param actionOIDs The array of action OIDs.
     * @param addAllApprovalsInTransition boolean flag set to true if all the approvals whose states are in transition
     *        will be appended to the API result, false otherwise.
     *
     * @return The array of {action approval OID, state} pairs for the input action OIDs, which is empty if none found.
     */
    TurbonomicActionDAO.prototype.getActionApprovals = function(actionOIDs, addAllApprovalsInTransition) {
        var changeRequest = new x_turbo_turbonomic.TurbonomicChangeRequest();
        var actionApproval = new GlideRecordSecure('x_turbo_turbonomic_turbonomic_action_approval');
        actionApproval.addQuery('oid', 'IN', actionOIDs.join());
        actionApproval.orderByDesc('sys_updated_on');
        actionApproval.query();

        var approverOrRejector = '';
        var alreadyProcessedApprovals = {};
        var result = [];
        while (actionApproval.next()) {
            var actionApprovalOid = actionApproval.getValue('oid');
            if (alreadyProcessedApprovals[actionApprovalOid]) {
                gs.debug("TurbonomicActionDAO.getActionApprovals() -  Already added action approval with OID: " + actionApprovalOid);
                continue;
            }

            var changeRequestId = actionApproval.getValue('change_request_id');

            approverOrRejector = '';
            var actionApprovalState = this.getActionStateById(actionApproval.state_id).toUpperCase();
            if (actionApprovalState == 'APPROVED' || actionApprovalState == 'REJECTED') {
                var sysApproval = new GlideRecordSecure('sysapproval_approver');
                sysApproval.addQuery('sysapproval', changeRequestId);
                sysApproval.addQuery('state', 'CONTAINS', actionApprovalState);
                sysApproval.orderByDesc('sys_updated_on');
                sysApproval.query();

                if (sysApproval.next()) {
                    var sysUser = new GlideRecordSecure('sys_user');
                    sysUser.addQuery('sys_id', sysApproval.approver);
                    sysUser.query();

                    if (sysUser.next()) {
                        approverOrRejector = sysUser.getValue('name');   
                    }
                }
            }

            // TODO: Remove this if block when our SDK probe supports WAITING_FOR_CR_SCHEDULE state
            if (actionApprovalState == this._actionApprovalState.WAITING_FOR_CR_SCHEDULE) {
                actionApprovalState = this._actionApprovalState.PENDING_APPROVAL;
            }
			
            changeRequest = this.getChangeRequestById(changeRequestId);
            result.push(
                {
                    'oid' : actionApprovalOid,
                    'state' : actionApprovalState,
                    'changeRequestId' : changeRequestId,
                    'changeRequestNumber' : changeRequest.getNumber(),
                    'approverOrRejector' : approverOrRejector
                }
            );

            alreadyProcessedApprovals[actionApprovalOid] = true;
        }

        if (addAllApprovalsInTransition) {
           var actionStateIds = [];
            actionStateIds.push(this.getActionStateId(this._actionApprovalState.APPROVED));
            actionStateIds.push(this.getActionStateId(this._actionApprovalState.WAITING_FOR_EXEC));
            actionStateIds.push(this.getActionStateId(this._actionApprovalState.WAITING_FOR_CR_SCHEDULE));
            actionStateIds.push(this.getActionStateId(this._actionApprovalState.IN_PROGRESS));

            // Append all APPROVED, IN_PROGRESS, WAITING_FOR_EXEC and WAITING_FOR_CR_SCHEDULE action approvals,
            // that are not already in the result, too.
            var approvalsInTransitionState = new GlideRecordSecure('x_turbo_turbonomic_turbonomic_action_approval');
            approvalsInTransitionState.addQuery('oid', 'NOT IN', actionOIDs.join());
            approvalsInTransitionState.addQuery('state_id', 'IN', actionStateIds.join());
            approvalsInTransitionState.orderByDesc('sys_updated_on');
            approvalsInTransitionState.query();

            alreadyProcessedApprovals = {};
            while (approvalsInTransitionState.next()) {
                var approvalInTransitionOid = approvalsInTransitionState.getValue('oid');
                if (alreadyProcessedApprovals[approvalInTransitionOid]) {
                    gs.debug("TurbonomicActionDAO.getActionApprovals() -  Already processed action approval in transition with OID: " + approvalInTransitionOid);
                    continue;
                }

                var crId = approvalsInTransitionState.getValue('change_request_id');

                approverOrRejector = '';
                var approvalInTransitionState = this.getActionStateById(approvalsInTransitionState.state_id).toUpperCase();
                if (approvalInTransitionState == 'APPROVED') {
                    var systemApproval = new GlideRecordSecure('sysapproval_approver');
                    systemApproval.addQuery('sysapproval', crId);
                    systemApproval.addQuery('state', 'CONTAINS', approvalInTransitionState);
                    systemApproval.orderByDesc('sys_updated_on');
                    systemApproval.query();

                    if (systemApproval.next()) {
                        var systemUser = new GlideRecordSecure('sys_user');
                        systemUser.addQuery('sys_id', systemApproval.approver);
                        systemUser.query();

                        if (systemUser.next()) {
                            approverOrRejector = systemUser.getValue('name');   
                        }
                    }
                }

                // TODO: Remove this if block when our SDK probe supports WAITING_FOR_CR_SCHEDULE state
                if (approvalInTransitionState == this._actionApprovalState.WAITING_FOR_CR_SCHEDULE) {
                    approvalInTransitionState = this._actionApprovalState.PENDING_APPROVAL;
                }

                changeRequest = this.getChangeRequestById(crId);
                result.push(
                    {
                        'oid' : approvalInTransitionOid,
                        'state' : approvalInTransitionState,
                        'changeRequestId' : crId,
                        'changeRequestNumber' : changeRequest.getNumber(),
                        'approverOrRejector' : approverOrRejector
                    }
                );

                alreadyProcessedApprovals[approvalInTransitionOid] = true;
            }
        } else {
            gs.debug('TurbonomicActionDAO.getActionApprovals() -  The action approvals in transition are not required.');
        }

        if (result.length == 0) {
            gs.warn('TurbonomicActionDAO.getActionApprovals() - ' +
                    'Cannot find any action approvals for the input Turbonomic action OIDs');
        } else {
            gs.debug('TurbonomicActionDAO.getActionApprovals() - ' +
                    'Found action approvals for the input Turbonomic action OIDs; result size = ' + result.length);
        }

        return result;
    };

    /**
     * Create a new entry in the Turbonomic Action Approval table, based on the input values.
     *
     * @param actionOID The OID of the Turbonomic action.
     * @param name The Turbonomic action name.
     * @param description The Turbonomic action description.
     * @param category The Turbonomic action name.
     * @param commodityName The commodity name of the Turbonomic action.
     * @param from The from value of the Turbonomic action.
     * @param to The to value of the Turbonomic action.
     * @param risk The risk of not taking the Turbonomic action.
     * @param savings The savings of the Turbonomic action.
     * @param count The Turbonomic action counter.
     * @param changedBy The user who modified the Turbonomic action.
     * @param sourceEntityId The ID of the source entity for the Turbonomic action.
     * @param targetEntityId The ID of the target entity for the Turbonomic action.
     * @param destinationEntityId The ID of the destination entity for the Turbonomic action.
     * @param changeRequestId The ID of the change request created for the Turbonomic action.
     * @param stateId The ID of the Turbonomic action state.
     * @param typeId The ID of the Turbonomic action type.
     * @param timestampMsec The Turbonomic action timestamp, in milliseconds.
     * @param actionDto action DTO from Turbonomic in JSON format.
     *
     * @return result The GUID of the newly created Turbonomic Action Approval record.
     */
    TurbonomicActionDAO.prototype.createActionApproval = function(actionOID, name, description,
            category, commodityName, from, to, risk, savings, count, changedBy, sourceEntityId,
            targetEntityId, destinationEntityId, changeRequestId, stateId, typeId, timestampMsec, actionDto) {
        var actionUtils = new x_turbo_turbonomic.TurbonomicActionUtils();
        var actionApproval = new GlideRecordSecure('x_turbo_turbonomic_turbonomic_action_approval');
        var fromAndToValues = actionUtils.getFromAndToValues(from, to, description);
        // Need to put timestampMsec from epoch into the GlideDateTime so that we can handle
        // timezone conversions.
        var timestampAsDT = new GlideDateTime();
        timestampAsDT.setValue(timestampMsec);
        // Need to convert to local time string because transform map assumes the datetime string is
        // in the format YYYY-MM-DD HH:mm:SS in the local timezone. It will always perform the
        // conversion from Local time zone to UTC. If we just left it as glideDateTime.toString(),
        // that would send it as a UTC datetime string. The transform map would incorrectly assume
        // it's local time (PST in dev instance) and move it 7 hours into the future.
        var timestampAsLocalDTString = timestampAsDT.getDisplayValue();
        return this.insertIntoImportSet(this._tableNames.ACTION_APPROVAL_IMPORT_SET,
            {
                u_oid: actionOID,
                u_name: this.valueOrEmptyStr(name),
                u_description: description,
                u_category: this.valueOrEmptyStr(category),
                u_metric: this.valueOrEmptyStr(commodityName),
                u_from: fromAndToValues.from,
                u_to: fromAndToValues.to,
                u_risk: this.valueOrEmptyStr(risk),
                u_savings: savings,
                u_count: count,
                u_updated_by: this.valueOrEmptyStr(changedBy),
                u_source_entity: sourceEntityId,
                u_target_entity: targetEntityId,
                u_destination_entity: destinationEntityId,
                u_change_request: changeRequestId,
                u_state: stateId,
                u_type: typeId,
                u_turbonomic_timestamp: this.valueOrEmptyStr(timestampAsLocalDTString),
                u_action_dto: actionDto
            },
            'TurbonomicActionDAO.createActionApproval() - Successfully created new Turbonomic action approval record with OID: ' + actionOID);
    };

    /**
     * Update the value of the input field, for a particular action approval entry.
     *
     * @param oid The input action approval OID.
     * @param field The field that will be updated.
     * @param value The new value of the input field.
     */
    TurbonomicActionDAO.prototype.updateLastModifiedActionApprovalField = function(oid, field, value) {
        if (!oid || !field || !value) {
            gs.warn('TurbonomicActionDAO.updateLastModifiedActionApprovalField() - ' +
                    'Invalid inputs: oid = ' + oid + ', field = ' + field + ', value = ' + value);
            return false;
        }

        gs.debug('TurbonomicActionDAO.updateLastModifiedActionApprovalField() - ' +
                    'The inputs are: oid = ' + oid + ', field = ' + field + ', value = ' + value);
        var validFields = [
            'u_name',
            'u_description',
            'u_category',
            'u_metric',
            'u_from',
            'u_to',
            'u_risk',
            'u_savings',
            'u_count',
            // 'changed_by', TODO: THIS COLUMN DOES NOT EXIST
            'u_source_entity',
            'u_target_entity',
            'u_destination_entity',
            'u_change_request',
            'u_state',
            'u_type',
            'u_turbonomic_timestamp',
            'u_most_recent__on_description'
        ];
        if (validFields.indexOf(field) <= -1) {
            gs.warn('TurbonomicActionDAO.updateLastModifiedActionApprovalField() - ' +
                    'Invalid input field: field = ' + field);
            return false;
        }

        // Find the action approval, and get the sysId from it.
        var actionApproval = new GlideRecordSecure('x_turbo_turbonomic_turbonomic_action_approval');
        actionApproval.addQuery('oid', oid);
        actionApproval.orderByDesc('sys_updated_on');
        actionApproval.query();
        if (actionApproval.next()) {
            var sysId = actionApproval.getValue('sys_id');

            // use the sysId to update
            var valuesToSet = {
                    u_update_sys_id: sysId
            };
            valuesToSet[field] = value;
            this.insertIntoImportSet(this._tableNames.ACTION_APPROVAL_IMPORT_SET,
                valuesToSet,
                'TurbonomicActionDAO.updateLastModifiedActionApprovalField() - ' +
                    'Successfully updated the action approval entry with OID: ' + oid);

            return true;
        } else {
            gs.warn('TurbonomicActionDAO.updateLastModifiedActionApprovalField() - ' +
                    'Cannot find any action approval entry with OID: ' + oid);
            return false;
        }
    };

    /**
     * Create a new change request for an action approval entry.
     *
     * @param oid The input action approval OID.
     * @param configItemId The ID of the configuration item associated to the action approval.
     * @param shortDescription The short description of the action approval entry.
     * @param description The description of the action approval entry.
     *
     * @return The TurbonomicChangeRequest instance with the details of the newly created request.
     */
    TurbonomicActionDAO.prototype.createChangeRequest = function(oid, configItemId, shortDescription, description) {
        if (this.isChangeRequestDisabled()) {
            return this.makeEmptyChangeRequest();
        }

        var requestType = this.getSettingValue('matching_cr_type');
        var fieldsToSet = {
            u_configuration_item: configItemId,
            u_short_description: shortDescription,
            u_description: description,
            u_type: requestType,
        };
        if (this.mustPopulateUserAndGroupForChangeRequest()) {
            fieldsToSet['u_assigned_to'] = this.getSettingValue('assigned_user');
            fieldsToSet['u_assignment_group'] = this.getSettingValue('assigned_group');
        }
        var changeRequestId = this.insertIntoImportSet(this._tableNames.CHANGE_REQUEST_IMPORT_SET,
            fieldsToSet,
            'TurbonomicActionDAO.createChangeRequest() - Successfully created new change request for action item with OID: ' + oid);

        var result = this.getChangeRequestById(changeRequestId.toString());
        gs.debug('TurbonomicActionDAO.createChangeRequest() - Successfully created new change request for action item with OID: ' + oid +
                 '; CR Number = ' + result.getNumber() + '; CR Type = ' + requestType + ', CR State = ' + result.getState());
        return result;
    };

    /**
     * Get the Turbonomic Change Request instance, based on the input id.
     *
     * @param id The input change request GUID.
     *
     * @return The TurbonomicChangeRequest instance if the request is found, or an empty instance otherwise.
     */
    TurbonomicActionDAO.prototype.getChangeRequestById = function(id) {
        var result = new x_turbo_turbonomic.TurbonomicChangeRequest();
        var changeRequestRecord = new GlideRecordSecure(this._tableNames.CHANGE_REQUEST);
        changeRequestRecord.addQuery('sys_id', id);
        changeRequestRecord.query();

        if (changeRequestRecord.next()) {
            result.setId(id);
            result.setNumber(changeRequestRecord.getValue('number'));
            result.setState(changeRequestRecord.getValue('state'));
        } else {
            gs.debug('TurbonomicActionDAO.getChangeRequestById() - Cannot find any change request for GUID: ' + id);
        }

        return result;
    };

    TurbonomicActionDAO.prototype.makeEmptyChangeRequest = function() {
        var changeRequest = new TurbonomicChangeRequest();
        changeRequest.setId(''); // no change request was created, so there is no id
        changeRequest.setNumber('');
        changeRequest.setState('');
        return changeRequest;
    };

    /**
     * Mark the pending or approved action approvals as missed, if they were not changed during the retention time.
     *
     * @returns a list of change request IDs for approvals marked as missed
     */
    TurbonomicActionDAO.prototype.markMissedActionApprovals = function() {
        var changeRequestIds = [];
        var actionStateId = this.getActionStateId('MISSED');
        if (actionStateId) {
            var actionStates = [];
            actionStates.push(this.getActionStateId('PENDING_APPROVAL'));
            actionStates.push(this.getActionStateId('WAITING_FOR_CR_SCHEDULE'));
            actionStates.push(this.getActionStateId('APPROVED'));
            actionStates.push(this.getActionStateId('WAITING_FOR_EXEC'));

            var actionRetentionTime = this.getSettingValue('action_retention_time');
            var retentionDateTime = new GlideDateTime();
            retentionDateTime.subtract(parseInt(actionRetentionTime)*1000);

            var actionApproval = new GlideRecordSecure('x_turbo_turbonomic_turbonomic_action_approval');
            actionApproval.addQuery('state_id', 'IN', actionStates.join());
            actionApproval.addQuery('sys_updated_on', '<', retentionDateTime);
            actionApproval.query();

            while (actionApproval.next()) {
                gs.debug('Marking as MISSED the action approval with OID: ' + actionApproval.getValue('oid'));
                var approvalSysId = actionApproval.getValue('sys_id');
                this.insertIntoImportSet(this._tableNames.ACTION_APPROVAL_IMPORT_SET,
                    {
                        u_update_sys_id: approvalSysId, // use the sysId to update
                        u_state: actionStateId
                    },
                    'TurbonomicActionDAO.markMissedActionApprovals() - Successfully set the state to MISSED for action approval with OID: ' + actionApproval.oid);
                changeRequestIds.push(actionApproval.getValue('change_request_id'));
            }
        } else {
            gs.warn('The MISSED action state Id cannot be found');
        }

        return changeRequestIds;
    };

    /**
     * Get the action state GUID, based on the input name.
     *
     * @param name The input action name.
     *
     * @return The GUID of the Turbonomic Action State record if found, empty string otherwise.
     */
    TurbonomicActionDAO.prototype.getActionStateId = function(name) {
        var actionStateRecord = new GlideRecordSecure('x_turbo_turbonomic_turbonomic_action_state');
        actionStateRecord.addQuery('name', name);
        actionStateRecord.query();

        if (actionStateRecord.next()) {
            return actionStateRecord.sys_id;
        }

        gs.warn('TurbonomicActionDAO.getActionStateId() - Cannot find any action state record for name: ' + name);
        return '';
    };

    /**
     * Get the action state name, based on the input id.
     *
     * @param id The input action GUID.
     *
     * @return The name of the Turbonomic Action State record if found, empty string otherwise.
     */
    TurbonomicActionDAO.prototype.getActionStateById = function(id) {
        var actionStateRecord = new GlideRecordSecure('x_turbo_turbonomic_turbonomic_action_state');
        actionStateRecord.addQuery('sys_id', id);
        actionStateRecord.query();

        if (actionStateRecord.next()) {
            return actionStateRecord.getValue('name');
        }

        gs.warn('TurbonomicActionDAO.getActionStateById() - Cannot find any action state record for GUID: ' + id);
        return '';
    };

    /**
     * Get the action type GUID, based on the input name.
     *
     * @param name The input action type.
     *
     * @return The GUID of the Turbonomic Action Type record if found, empty string otherwise.
     */
    TurbonomicActionDAO.prototype.getActionTypeId = function(name) {
        var actionTypeRecord = new GlideRecordSecure('x_turbo_turbonomic_turbonomic_action_type');
        actionTypeRecord.addQuery('name', name);
        actionTypeRecord.query();

        if (actionTypeRecord.next()) {
            return actionTypeRecord.sys_id;
        }

        gs.warn('TurbonomicActionDAO.getActionTypeId() - Cannot find any action type record for name: ' + name);
        return '';
    };

    /**
     * Return true if new action approvals are allowed for previously rejected change requests, false otherwise.
     *
     * @return true if new action approvals are allowed for previously rejected change requests, false otherwise.
     */
    TurbonomicActionDAO.prototype.allowApprovalsForRejectedRequests = function() {
        var settingsRecord = new GlideRecordSecure('x_turbo_turbonomic_turbonomic_settings');
        settingsRecord.query();

        if (settingsRecord.next()) {
            gs.debug('TurbonomicActionDAO.allowApprovalsForRejectedRequests() - Allow Previously Rejected Actions flag = ' +
                    settingsRecord.allow_previously_rejected_actions);
            return settingsRecord.allow_previously_rejected_actions;
        }

        return true;
    };

    /**
     * Return true if the user and group will be set for the change requests based on the settings values.
     *
     * @return true if the user/group are set for the CRs based on the settings values, false otherwise.
     */
    TurbonomicActionDAO.prototype.mustPopulateUserAndGroupForChangeRequest = function() {
        var settingsRecord = new GlideRecordSecure('x_turbo_turbonomic_turbonomic_settings');
        settingsRecord.query();

        if (settingsRecord.next()) {
            gs.debug('TurbonomicActionDAO.mustPopulateUserAndGroupForChangeRequest() - Populate CR Assignee = ' +
                    settingsRecord.populate_assignee);
            return settingsRecord.populate_assignee;
        }

        return false;
    };

    TurbonomicActionDAO.prototype.isChangeRequestDisabled = function() {
        var strIsChangeRequestDisabled = this.getSettingValue('disable_change_request');
        // Unfortunately, getSettingValue (GlideRecordSecure.getValue(field)) returns a STRING!!!
        // We need to convert this to a boolean otherwise, when used in if statements we will get
        // unexpected behavior like:
        // if('0') {
        //     // This code is expected to not run, but it actually runs based on the javascript
        //     // specification.
        // }
        return Boolean(Number(strIsChangeRequestDisabled));
    };

    /**
     * Get the current setting value for the input field.
     * WARNING: This method does not work well for booleans.
     *
     * @param field The input field name.
     *
     * @return The current setting value for the input field, or an empty string if the field is invalid.
     */
    TurbonomicActionDAO.prototype.getSettingValue = function(field) {
        var validFields = ['action_time_to_live', 'allow_previously_rejected_actions', 'matching_cr_type',
                           'assigned_group', 'assigned_user', 'populate_assignee', 'action_retention_time',
                           'disable_change_request', 'azure_vm_table_name', 'azure_vm_table_column',
                           'aws_vm_table_name', 'aws_vm_table_column', 'hyper_v_vm_table_name',
                           'hyper_v_vm_table_column', 'vcenter_vm_table_name', 'vcenter_vm_table_column',
                           'action_execution_recovery_time', 'approved_cr_state', 'canceled_cr_state',
                           'action_processing_wait_time'
                          ];

        if (validFields.indexOf(field) <= -1) {
            return '';
        }

        var settingsRecord = this._turbonomicGlide.accessTable('x_turbo_turbonomic_turbonomic_settings');
        settingsRecord.query();

        if (settingsRecord.next()) {
            return settingsRecord.getValue(field);
        }

        gs.warn('TurbonomicActionDAO.getSettingValue() - Cannot find any Turbonomic action settings');
        return '';
    };

    /**
     * Return the input value if valid, otherwise an empty string (if value is null or undefined).
     *
     * @param value The input value.
     *
     * @return The input value if valid, otherwise an empty string (if value is null or undefined).
     */
    TurbonomicActionDAO.prototype.valueOrEmptyStr = function(value) {
        if (value) {
            return value;
        }

        return '';
    };

    /**
     * Inserts new row using the import set.
     *
     * @param importSetName The name of the import set to insert into
     * @param keyValueMap A map specifying the columns to set, and the value of those columns.
     * @param debugLoggingSuccess Debug logging to print on successfully inserting into the import
     *                            set.
     *
     * @return The input value if valid, otherwise an empty string (if value is null or undefined).
     */
    TurbonomicActionDAO.prototype.insertIntoImportSet = function(importSetName, keyValueMap, debugLoggingSuccess) {
        var result = null;
        var importSetRow = new GlideRecordSecure(importSetName);

        Object.keys(keyValueMap).forEach(function(key) {
            var value = keyValueMap[key];
            importSetRow.setValue(key, value);
        });
        var importSetId = importSetRow.insert();

        // Get the sys_id of the action record that the import set and tranform maps created.
        var importSetResult = new GlideRecordSecure(importSetName);

        if (importSetResult.get(importSetId)) {
            result = importSetResult.sys_target_sys_id;
            gs.debug(debugLoggingSuccess);
        }

        return result;
    };

    return TurbonomicActionDAO;
}());
