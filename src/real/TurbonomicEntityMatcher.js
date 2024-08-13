var TurbonomicEntityMatcher = (function () {

    var type = 'TurbonomicEntityMatcher';

    var VIRTUAL_MACHINE = 'virtual_machine';
    var HOST = 'physical_machine';
    var STORAGE = 'storage';

    /**
     * Creates an object for matching TurbnomicEntity to the cmdb.
     *
     * @param turbonomicGlide allow unit test to mock out glide
     *        records.
     */
    function TurbonomicEntityMatcher(turbonomicGlide) {
        if (!turbonomicGlide) {
            this._turbonomicGlide = new TurbonomicGlide();
        } else {
            this._turbonomicGlide = turbonomicGlide;
        }
    }

    /**
     * Find the ServiceNow configuration item for the input Turbonomic entity.
     *
     * @param turbonomicEntity The input TurbonomicEntity instance.
     *
     * @return The matching ServiceNow configuration item for the input Turbonomic entity if found, null otherwise.
     */
    TurbonomicEntityMatcher.prototype.findConfigurationItem = function(turbonomicEntity) {
        gs.debug('TurbonomicEntityMatcher.findConfigurationItem() - ' +
                'Trying to find a matching CI for the Turbonomic entity: ' +
                'uuid = ' + turbonomicEntity.getUuid() + ', ' +
                'name = ' + turbonomicEntity.getEntityName() + ', ' +
                'type = ' + turbonomicEntity.getEntityType() + ', ' +
                'target name = ' + turbonomicEntity.getTargetName() + ', ' +
                'target type = ' + turbonomicEntity.getTargetType());

        var targetType = turbonomicEntity.getTargetType().toLowerCase();

        switch (targetType) {
            case 'vcenter' :
                return this.findVCenterConfigurationItem(turbonomicEntity);
            case 'hyper-v' :
                return this.findHyperVConfigurationItem(turbonomicEntity);
            case 'vmm' :
                // VMM matches in the same way as HyperV
                return this.findHyperVConfigurationItem(turbonomicEntity);
            case 'aws' :
                 return this.findAwsConfigurationItem(turbonomicEntity);
            case 'azure' :
                 return this.findAzureConfigurationItem(turbonomicEntity);
            default :
                gs.info('TurbonomicEntityMatcher.findConfigurationItem() - ' +
                        'Unsupported target type: ' + targetType);
        }

        gs.warn('TurbonomicEntityMatcher.findConfigurationItem() - ' +
                'Cannot find a matching CI for the Turbonomic entity with ' +
                'name = ' + turbonomicEntity.getEntityName() + ', ' +
                'uuid = ' + turbonomicEntity.getUuid());
        return null;
    };

    /**
     * Find the matching vCenter configuration item for the input Turbonomic entity.
     *
     * @param turbonomicEntity The input TurbonomicEntity instance.
     *
     * @return The matching vCenter configuration item for the input Turbonomic entity if found, null otherwise.
     */
    TurbonomicEntityMatcher.prototype.findVCenterConfigurationItem = function(turbonomicEntity) {
        var entityType = turbonomicEntity.getEntityType().toLowerCase();

        switch (entityType) {
            case VIRTUAL_MACHINE :
                return this.findVCenterVirtualMachine(turbonomicEntity);
            case HOST :
                gs.warn('TurbonomicEntityMatcher.findVCenterConfigurationItem() - ' +
                        'vCenter Host CI matching is not implemented yet');
                break;
            case STORAGE :
                gs.warn('TurbonomicEntityMatcher.findVCenterConfigurationItem() - ' +
                        'vCenter Storage CI matching is not implemented yet');
                break;
            default :
                gs.warn('TurbonomicEntityMatcher.findVCenterConfigurationItem() - ' +
                        'Unsupported vCenter entity type: ' + entityType);
        }

        return null;
    };

    /**
     * Find the matching Hyper-V configuration item for the input Turbonomic entity.
     *
     * @param turbonomicEntity The input TurbonomicEntity instance.
     *
     * @return The matching Hyper-V configuration item for the input Turbonomic entity if found, null otherwise.
     */
    TurbonomicEntityMatcher.prototype.findHyperVConfigurationItem = function(turbonomicEntity) {
        var entityType = turbonomicEntity.getEntityType().toLowerCase();

        switch (entityType) {
            case VIRTUAL_MACHINE :
                return this.findHyperVVirtualMachine(turbonomicEntity);
            default :
                gs.warn('TurbonomicEntityMatcher.findHyperVConfigurationItem() - ' +
                        'Unsupported Hyper-V entity type: ' + entityType);
        }

        return null;
    };

    /**
     * Find the matching AWS configuration item for the input Turbonomic entity.
     *
     * @param turbonomicEntity The input TurbonomicEntity instance.
     *
     * @return The matching AWS configuration item for the input Turbonomic entity if found, null otherwise.
     */
    TurbonomicEntityMatcher.prototype.findAwsConfigurationItem = function(turbonomicEntity) {
        var entityType = turbonomicEntity.getEntityType().toLowerCase();

        switch (entityType) {
            case VIRTUAL_MACHINE :
                return this.findAwsVirtualMachine(turbonomicEntity.getUuid());
            default :
                gs.warn('TurbonomicEntityMatcher.findAwsConfigurationItem() - ' +
                        'Unsupported AWS entity type: ' + entityType);
        }

        return null;
    };

    /**
     * Find the matching Azure configuration item for the input Turbonomic entity.
     *
     * @param turbonomicEntity The input TurbonomicEntity instance.
     *
     * @return The matching Azure configuration item for the input Turbonomic entity if found, null otherwise.
     */
    TurbonomicEntityMatcher.prototype.findAzureConfigurationItem = function(turbonomicEntity) {
        var entityType = turbonomicEntity.getEntityType().toLowerCase();

        switch (entityType) {
            case VIRTUAL_MACHINE :
                return this.findAzureVirtualMachine(turbonomicEntity.getUuid());
            default :
                gs.warn('TurbonomicEntityMatcher.findAzureConfigurationItem() - ' +
                        'Unsupported Azure entity type: ' + entityType);
        }

        return null;
    };

    /**
     * Find the matching vCenter virtual machine in ServiceNow, for the input Turbonomic entity.
     * We expect the uuid of the input TurbonomicEntity to be equal to the virtual machine MOR Id.
     * Also, we expect the targetName of the input TurbonomicEntity to be set to the IP address of
     * the vCenter target.
     *
     * @param turbonomicEntity The input TurbonomicEntity instance.
     *
     * @return The matching vCenter virtual machine for the input Turbonomic entity if found, null otherwise.
     */
    TurbonomicEntityMatcher.prototype.findVCenterVirtualMachine = function(turbonomicEntity) {
        var dao = new x_turbo_turbonomic.TurbonomicActionDAO();

        var virtualMachineTableName = dao.getSettingValue('vcenter_vm_table_name');
        if (virtualMachineTableName == '') {
            gs.warn('TurbonomicEntityMatcher.findVCenterVirtualMachine() - Invalid vCenter VM Table Name setting value');
            virtualMachineTableName = 'cmdb_ci_vmware_instance';
		} else {
			gs.debug('TurbonomicEntityMatcher.findVCenterVirtualMachine() - Found valid vCenter VM Table Name setting: ' + virtualMachineTableName);
		}

        var virtualMachineTableColumn = dao.getSettingValue('vcenter_vm_table_column');
        if (virtualMachineTableColumn == '') {
            gs.warn('TurbonomicEntityMatcher.findVCenterVirtualMachine() - Invalid vCenter VM Table Column setting value');
            virtualMachineTableColumn = 'object_id';
		} else {
			gs.debug('TurbonomicEntityMatcher.findVCenterVirtualMachine() - Found valid vCenter VM Table Column setting: ' + virtualMachineTableColumn);
		}

        // Find the vCenter virtual machine record for the input MOR Id
        var virtualMachineRecord = new GlideRecordSecure(virtualMachineTableName);
        var entityId = turbonomicEntity.getUuid();
        virtualMachineRecord.addQuery(virtualMachineTableColumn, entityId);
        virtualMachineRecord.query();

        if (virtualMachineRecord.next()) {
            gs.debug('TurbonomicEntityMatcher.findVCenterVirtualMachine() - ' +
                    'Found valid vCenter VM in ServiceNow with Id: ' + entityId + '; VM name = ' + virtualMachineRecord.name);

            var vCenterRecord = virtualMachineRecord.vcenter_ref;
            if (vCenterRecord) {
                var vCenterIP = vCenterRecord.ip_address;
                gs.debug('TurbonomicEntityMatcher.findVCenterVirtualMachine(): ServiceNow vCenter IP = ' + vCenterIP);

                if (vCenterIP && vCenterIP.equals(turbonomicEntity.getTargetName())) {
                    gs.debug('TurbonomicEntityMatcher.findVCenterVirtualMachine() - ' +
                            'Found matching vCenter virtual machine in ServiceNow with id: ' + entityId);
                    return virtualMachineRecord;
                } else {
                    gs.debug('TurbonomicEntityMatcher.findVCenterVirtualMachine() - ' +
                            'The vCenter IP in ServiceNow does not match the Turbonomic target name: ' +
                            'vCenter IP in ServiceNow = ' + vCenterIP + ', ' +
                            'Turbonomic target name = ' + turbonomicEntity.getTargetName() + '; VM name = ' + virtualMachineRecord.name);
                    return virtualMachineRecord;
                }
            } else {
                gs.debug('Cannot find the matching vCenter server record for virtual machine: ' + virtualMachineRecord.name);
                return virtualMachineRecord;
            }
        }

        // Perform a heuristic search and match based on the entity and target name values
        var entityName = turbonomicEntity.getEntityName();
        gs.debug('TurbonomicEntityMatcher.findVCenterVirtualMachine() - Performing heuristic CI search for the vCenter VM: ' + entityName);

        virtualMachineRecord = new GlideRecordSecure(virtualMachineTableName);
        virtualMachineRecord.addQuery('name', entityName);
        virtualMachineRecord.query();

        while (virtualMachineRecord.next()) {
            gs.debug('TurbonomicEntityMatcher.findVCenterVirtualMachine() - ' +
                    'Found candidate vCenter VM in ServiceNow named: ' + entityName);

            var vCenterCandidateRecord = virtualMachineRecord.vcenter_ref;
            if (vCenterCandidateRecord) {
                var ipAddress = vCenterCandidateRecord.ip_address;
                gs.debug('TurbonomicEntityMatcher.findVCenterVirtualMachine(): vCenter IP in ServiceNow is: ' + ipAddress);

                if (ipAddress && ipAddress.equals(turbonomicEntity.getTargetName())) {
                    gs.debug('TurbonomicEntityMatcher.findVCenterVirtualMachine() - ' +
                            'Found matching vCenter virtual machine in ServiceNow with name = ' + entityName);
                    return virtualMachineRecord;
                } else {
                    gs.warn('TurbonomicEntityMatcher.findVCenterVirtualMachine() - ' +
                            'The vCenter IP in ServiceNow does not match the Turbonomic target name: ' +
                            'vCenter IP in ServiceNow = ' + ipAddress + ', ' +
                            'Turbonomic target name = ' + turbonomicEntity.getTargetName() + '; VM name = ' + virtualMachineRecord.name);
                }
            }
        }

        gs.warn('TurbonomicEntityMatcher.findVCenterVirtualMachine() - ' +
                'Cannot find vCenter VM in ServiceNow for Turbonomic entity with Id: ' + entityId);
        return null;
    };

    /**
     * Find the matching Hyper-V virtual machine in ServiceNow, for the input Turbonomic entity.
     *
     * @param turbonomicEntity The input TurbonomicEntity instance.
     *
     * @return The matching Hyper-V virtual machine for the input Turbonomic entity if found, null otherwise.
     */
    TurbonomicEntityMatcher.prototype.findHyperVVirtualMachine = function(turbonomicEntity) {
        var dao = new x_turbo_turbonomic.TurbonomicActionDAO();

        var virtualMachineTableName = dao.getSettingValue('hyper_v_vm_table_name');
        if (virtualMachineTableName == '') {
            gs.warn('TurbonomicEntityMatcher.findHyperVVirtualMachine() - Invalid Hyper-V VM Table Name setting value');
            virtualMachineTableName = 'cmdb_ci_hyper_v_instance';
		} else {
			gs.debug('TurbonomicEntityMatcher.findHiperVVirtualMachine() - Found valid Hyper-V VM Table Name setting: ' + virtualMachineTableName);
		}

        var virtualMachineTableColumn = dao.getSettingValue('hyper_v_vm_table_column');
        if (virtualMachineTableColumn == '') {
            gs.warn('TurbonomicEntityMatcher.findHyperVVirtualMachine() - Invalid Hyper-V VM Table Column setting value');
            virtualMachineTableColumn = 'object_id';
		} else {
			gs.debug('TurbonomicEntityMatcher.findHyperVVirtualMachine() - Found valid Hyper-V VM Table Column setting: ' + virtualMachineTableColumn);
		}

        // Find the Hyper-V virtual machine record for the input entity ID
        var virtualMachineRecord = new GlideRecordSecure(virtualMachineTableName);
        var entityId = turbonomicEntity.getUuid();
        virtualMachineRecord.addQuery(virtualMachineTableColumn, entityId);
        virtualMachineRecord.query();

        if (virtualMachineRecord.next()) {
            gs.debug('TurbonomicEntityMatcher.findHyperVVirtualMachine() - ' +
                    'Found valid Hyper-V VM in ServiceNow with Id: ' + entityId + '; VM name = ' + virtualMachineRecord.name);

            var hypervServerRecord = virtualMachineRecord.server;
            if (hypervServerRecord) {
                var hypervServerIP = hypervServerRecord.ip_address;
                gs.debug('TurbonomicEntityMatcher.findHyperVVirtualMachine(): Hyper-V Server IP address in ServiceNow = ' + hypervServerIP);

                if (hypervServerIP && hypervServerIP.equals(turbonomicEntity.getTargetName())) {
                    gs.debug('TurbonomicEntityMatcher.findHyperVVirtualMachine() - ' +
                            'Found matching Hyper-V virtual machine in ServiceNow with id: ' + entityId);
                    return virtualMachineRecord;
                } else {
                    gs.debug('TurbonomicEntityMatcher.findHyperVVirtualMachine() - ' +
                            'The Hyper-V server IP in ServiceNow does not match the Turbonomic target name: ' +
                            'Hyper-V server IP in ServiceNow = ' + hypervServerIP + ', ' +
                            'Turbonomic target name = ' + turbonomicEntity.getTargetName() + '; VM name = ' + virtualMachineRecord.name);
                    return virtualMachineRecord;
                }
            } else {
                gs.debug('Cannot find the matching Hyper-V server record for virtual machine: ' + virtualMachineRecord.name);
                return virtualMachineRecord;
            }
        }

        // Perform a heuristic search and match based on the entity and target name values
        var entityName = turbonomicEntity.getEntityName();
        gs.debug('TurbonomicEntityMatcher.findHyperVVirtualMachine() - Performing heuristic CI search for the Hyper-V VM: ' + entityName);

        virtualMachineRecord = new GlideRecordSecure(virtualMachineTableName);
        virtualMachineRecord.addQuery('name', entityName);
        virtualMachineRecord.query();

        while (virtualMachineRecord.next()) {
            gs.debug('TurbonomicEntityMatcher.findHYperVVirtualMachine() - ' +
                    'Found candidate Hyper-V VM in ServiceNow named: ' + entityName);

            var serverCandidateRecord = virtualMachineRecord.server;
            if (serverCandidateRecord) {
                var ipAddress = serverCandidateRecord.ip_address;
                gs.debug('TurbonomicEntityMatcher.findHyperVVirtualMachine(): Hyper-V Server IP in ServiceNow is: ' + ipAddress);

                if (ipAddress && ipAddress.equals(turbonomicEntity.getTargetName())) {
                    gs.debug('TurbonomicEntityMatcher.findHyperVVirtualMachine() - ' +
                            'Found matching Hyper-V virtual machine in ServiceNow with name = ' + entityName);
                    return virtualMachineRecord;
                } else {
                    gs.warn('TurbonomicEntityMatcher.findHyperVVirtualMachine() - ' +
                            'The Hyper-V server IP in ServiceNow does not match the Turbonomic target name: ' +
                            'Hyper-V server IP in ServiceNow = ' + ipAddress + ', ' +
                            'Turbonomic target name = ' + turbonomicEntity.getTargetName() + '; VM name = ' + virtualMachineRecord.name);
                }
            }
        }

        gs.warn('TurbonomicEntityMatcher.findHyperVVirtualMachine() - ' +
                'Cannot find Hyper-V VM in ServiceNow for Turbonomic entity with Id: ' + entityId);
        return null;
    };

    /**
     * Find the matching AWS virtual machine in ServiceNow, for the input Turbonomic entity.
     * We expect the input id to be provided in the following AWS format: i-016782f3e89014c3a
     *
     * @param turbonomicEntity The input TurbonomicEntity instance.
     *
     * @return The matching AWS virtual machine for the input Turbonomic entity if found, null otherwise.
     */
    TurbonomicEntityMatcher.prototype.findAwsVirtualMachine = function(id) {
        var dao = new x_turbo_turbonomic.TurbonomicActionDAO();

        var virtualMachineTableName = dao.getSettingValue('aws_vm_table_name');
        if (virtualMachineTableName == '') {
            gs.warn('TurbonomicEntityMatcher.findAwsVirtualMachine() - Invalid AWS VM Table Name setting value');
            virtualMachineTableName = 'cmdb_ci_vm_instance';
		} else {
			gs.debug('TurbonomicEntityMatcher.findAwsVirtualMachine() - Found valid AWS VM Table Name setting: ' + virtualMachineTableName);
		}

        var virtualMachineTableColumn = dao.getSettingValue('aws_vm_table_column');
        if (virtualMachineTableColumn == '') {
            gs.warn('TurbonomicEntityMatcher.findAwsVirtualMachine() - Invalid AWS VM Table Column setting value');
            virtualMachineTableColumn = 'object_id';
		} else {
			gs.debug('TurbonomicEntityMatcher.findAwsVirtualMachine() - Found valid AWS VM Table Column setting: ' + virtualMachineTableColumn);
		}

        var result = this.findVirtualMachineInstance(id, virtualMachineTableColumn, virtualMachineTableName);
        if (result != null) {
            gs.debug('TurbonomicEntityMatcher.findAwsVirtualMachine() - ' +
                    'Found valid AWS virtual machine in ServiceNow with id: ' + id);
        }

        return result;
    };

    /**
     * Find the matching Azure virtual machine in ServiceNow, for the input Turbonomic entity.
     * We expect the input id to be provided in the following Azure format:
     *    /subscriptions/758ad253-cbf5-4b18-8863-3eed0825bf07/resourceGroups/turbonomic
     *
     * @param turbonomicEntity The input TurbonomicEntity instance.
     *
     * @return The matching Azure virtual machine for the input Turbonomic entity if found, null otherwise.
     */
    TurbonomicEntityMatcher.prototype.findAzureVirtualMachine = function(id) {
        var dao = new x_turbo_turbonomic.TurbonomicActionDAO();

        var virtualMachineTableName = dao.getSettingValue('azure_vm_table_name');
        if (virtualMachineTableName == '') {
            gs.warn('TurbonomicEntityMatcher.findAzureVirtualMachine() - Invalid Azure VM Table Name setting value');
            virtualMachineTableName = 'cmdb_ci_vm_instance';
		} else {
			gs.debug('TurbonomicEntityMatcher.findAzureVirtualMachine() - Found valid Azure VM Table Name setting: ' + virtualMachineTableName);
		}

        var virtualMachineTableColumn = dao.getSettingValue('azure_vm_table_column');
        if (virtualMachineTableColumn == '') {
            gs.warn('TurbonomicEntityMatcher.findAzureVirtualMachine() - Invalid Azure VM Table Column setting value');
            virtualMachineTableColumn = 'vm_inst_id';
		} else {
			gs.debug('TurbonomicEntityMatcher.findAzureVirtualMachine() - Found valid Azure VM Table Column setting: ' + virtualMachineTableColumn);
		}

        var result = this.findVirtualMachineInstance(id, virtualMachineTableColumn, virtualMachineTableName);
        if (result != null) {
            gs.debug('TurbonomicEntityMatcher.findAzureVirtualMachine() - ' +
                    'Found valid Azure virtual machine in ServiceNow with Id: ' + id);
        }

        return result;
    };

    /**
     * Find a virtual machine instance in the input table and column, based on the input id.
     *
     * @param id The unique virtual machine object id.
     * @param tableColumn The input table column name.
     * @param tableName The input table name used to search for the object id.
     *
     * @return The virtual machine instance for the input object id, or null if no instance found.
     */
    TurbonomicEntityMatcher.prototype.findVirtualMachineInstance = function(id, tableColumn, tableName) {
        var vmObjectRecord = this._turbonomicGlide.accessTable(tableName);
        vmObjectRecord.addQuery(tableColumn, id);
        vmObjectRecord.query();

        if (vmObjectRecord.next()) {
            gs.debug('TurbonomicEntityMatcher.findVirtualMachineInstance() - ' +
                    'Found matching virtual machine instance in ServiceNow for Turbonomic entity with Id: ' + id +
                    '; table name = ' + tableName + ', table column = ' + tableColumn);

            return vmObjectRecord;
        }

        gs.warn('TurbonomicEntityMatcher.findVirtualMachineInstance() - ' +
                'Cannot find virtual machine instance in ServiceNow for Turbonomic entity with Id: ' + id +
                '; table name = ' + tableName + ', table column = ' + tableColumn);
        return null;
    };

    return TurbonomicEntityMatcher;
}());
