class TurbonomicEntityMatcher {
	public type: string;
	private _log: x_turbo_turbonomic.Logger;
	private _turbonomicGlide: TurbonomicGlide;
	public static readonly VIRTUAL_MACHINE: string = 'virtual_machine';
	public static readonly HOST: string = 'host';
	public static readonly STORAGE: string = 'storage';

	constructor () {
        this.type = 'TurbonomicEntityMatcher';
        this._log = new x_turbo_turbonomic.Logger();
        this._turbonomicGlide = new TurbonomicGlide();
    }

    /**
     * Find the ServiceNow configuration item for the input Turbonomic entity.
     *
     * @param turbonomicEntity The input TurbonomicEntity instance.
     *
     * @return The matching ServiceNow configuration item for the input Turbonomic entity if found, null otherwise.
     */
    public findConfigurationItem (turbonomicEntity: TurbonomicEntity) {
        this._log.info('TurbonomicEntityMatcher.findConfigurationItem() - ' +
                'Trying to find a matching CI for the Turbonomic entity: ' +
                'uuid = ' + turbonomicEntity.getUuid() + ', ' +
                'name = ' + turbonomicEntity.getEntityName() + ', ' +
                'type = ' + turbonomicEntity.getEntityType() + ', ' +
                'target name = ' + turbonomicEntity.getTargetName() + ', ' +
                'target type = ' + turbonomicEntity.getTargetType());

        let targetType: string = turbonomicEntity.getTargetType().toLowerCase();

        if (targetType.startsWith('vcenter')) {
            return this.findVCenterConfigurationItem(turbonomicEntity);
        } else if (targetType.startsWith('hyper-v') || targetType.startsWith('vmm')) {
            return this.findHyperVConfigurationItem(turbonomicEntity);
        } else if (targetType.startsWith('aws')) {
            return this.findAwsConfigurationItem(turbonomicEntity);
        } else if (targetType.startsWith('azure')) {
            return this.findAzureConfigurationItem(turbonomicEntity);
        } else {
            this._log.info('TurbonomicEntityMatcher.findConfigurationItem() - ' +
                    'Unsupported target type: ' + targetType);
        }

        this._log.warn('TurbonomicEntityMatcher.findConfigurationItem() - ' +
                'Cannot find a matching CI for the Turbonomic entity with ' +
                'name = ' + turbonomicEntity.getEntityName() + ', ' +
                'uuid = ' + turbonomicEntity.getUuid());
        return null;
    }

    /**
     * Find the matching vCenter configuration item for the input Turbonomic entity.
     *
     * @param turbonomicEntity The input TurbonomicEntity instance.
     *
     * @return The matching vCenter configuration item for the input Turbonomic entity if found, null otherwise.
     */
    findVCenterConfigurationItem (turbonomicEntity: TurbonomicEntity) {
        let entityType: string = turbonomicEntity.getEntityType().toLowerCase();

        switch (entityType) {
            case TurbonomicEntityMatcher.VIRTUAL_MACHINE :
                return this.findVCenterVirtualMachine(turbonomicEntity);
            case TurbonomicEntityMatcher.HOST :
                this._log.warn('TurbonomicEntityMatcher.findVCenterConfigurationItem() - ' +
                        'vCenter Host CI matching is not implemented yet');
                break;
            case TurbonomicEntityMatcher.STORAGE :
                this._log.warn('TurbonomicEntityMatcher.findVCenterConfigurationItem() - ' +
                        'vCenter Storage CI matching is not implemented yet');
                break;
            default :
                this._log.warn('TurbonomicEntityMatcher.findVCenterConfigurationItem() - ' +
                        'Unsupported vCenter entity type: ' + entityType);
        }

        return null;
    }

    /**
     * Find the matching Hyper-V configuration item for the input Turbonomic entity.
     *
     * @param turbonomicEntity The input TurbonomicEntity instance.
     *
     * @return The matching Hyper-V configuration item for the input Turbonomic entity if found, null otherwise.
     */
    findHyperVConfigurationItem (turbonomicEntity: TurbonomicEntity) {
        let entityType: string = turbonomicEntity.getEntityType().toLowerCase();

        switch (entityType) {
            case TurbonomicEntityMatcher.VIRTUAL_MACHINE :
                return this.findHyperVVirtualMachine(turbonomicEntity);
            default :
                this._log.info('TurbonomicEntityMatcher.findHyperVConfigurationItem() - ' +
                        'Unsupported Hyper-V entity type: ' + entityType);
        }

        return null;
    }

    /**
     * Find the matching AWS configuration item for the input Turbonomic entity.
     *
     * @param turbonomicEntity The input TurbonomicEntity instance.
     *
     * @return The matching AWS configuration item for the input Turbonomic entity if found, null otherwise.
     */
    findAwsConfigurationItem (turbonomicEntity: TurbonomicEntity) {
        let entityType: string = turbonomicEntity.getEntityType().toLowerCase();

        switch (entityType) {
            case TurbonomicEntityMatcher.VIRTUAL_MACHINE :
                return this.findAwsVirtualMachine(turbonomicEntity.getUuid());
            default :
                this._log.info('TurbonomicEntityMatcher.findAwsConfigurationItem() - ' +
                        'Unsupported AWS entity type: ' + entityType);
        }

        return null;
    }

    /**
     * Find the matching Azure configuration item for the input Turbonomic entity.
     *
     * @param turbonomicEntity The input TurbonomicEntity instance.
     *
     * @return The matching Azure configuration item for the input Turbonomic entity if found, null otherwise.
     */
    findAzureConfigurationItem (turbonomicEntity: TurbonomicEntity) {
        let entityType: string = turbonomicEntity.getEntityType().toLowerCase();

        switch (entityType) {
            case TurbonomicEntityMatcher.VIRTUAL_MACHINE :
                return this.findAzureVirtualMachine(turbonomicEntity.getUuid());
            default :
                this._log.info('TurbonomicEntityMatcher.findAzureConfigurationItem() - ' +
                        'Unsupported Azure entity type: ' + entityType);
        }

        return null;

    }

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
    findVCenterVirtualMachine (turbonomicEntity: TurbonomicEntity) {
    	let dao: TurbonomicActionDAO = new TurbonomicActionDAO();

        let virtualMachineTableName: string = dao.getSettingValue('vcenter_vm_table_name');
        if (virtualMachineTableName == '') {
            this._log.warn('TurbonomicEntityMatcher.findVCenterVirtualMachine() - Invalid vCenter VM Table Name setting value');
            virtualMachineTableName = 'cmdb_ci_vmware_instance';
	    } else {
		    this._log.debug('TurbonomicEntityMatcher.findVCenterVirtualMachine() - Found valid vCenter VM Table Name setting: ' + virtualMachineTableName);
	    }

        let virtualMachineTableColumn: string = dao.getSettingValue('vcenter_vm_table_column');
        if (virtualMachineTableColumn == '') {
            this._log.warn('TurbonomicEntityMatcher.findVCenterVirtualMachine() - Invalid vCenter VM Table Column setting value');
            virtualMachineTableColumn = 'object_id';
	    } else {
		    this._log.debug('TurbonomicEntityMatcher.findVCenterVirtualMachine() - Found valid vCenter VM Table Column setting: ' + virtualMachineTableColumn);
	    }

        // Find the vCenter virtual machine record for the input MOR Id
        var virtualMachineRecord = this._turbonomicGlide.accessTable(virtualMachineTableName);
        let entityId: string = turbonomicEntity.getUuid();
        virtualMachineRecord.addQuery(virtualMachineTableColumn, entityId);
        virtualMachineRecord.query();

        while (virtualMachineRecord.next()) {
            this._log.info('TurbonomicEntityMatcher.findVCenterVirtualMachine() - ' +
                    'Found valid vCenter VM in ServiceNow with MOR Id: ' + entityId + '; VM name = ' + virtualMachineRecord.name);

            var vCenterRecord = virtualMachineRecord.vcenter_ref;
            if (vCenterRecord) {
                let vCenterIP = vCenterRecord.ip_address;
                this._log.info('TurbonomicEntityMatcher.findVCenterVirtualMachine(): ServiceNow vCenter IP = ' + vCenterIP);

                if (vCenterIP && (vCenterIP == turbonomicEntity.getTargetName())) {
                    this._log.info('TurbonomicEntityMatcher.findVCenterVirtualMachine() - ' +
                            'Found matching vCenter virtual machine in ServiceNow with id: ' + entityId);
                    return virtualMachineRecord;
                } else {
                    this._log.warn('TurbonomicEntityMatcher.findVCenterVirtualMachine() - ' +
                            'The vCenter IP in ServiceNow does not match the Turbonomic target name: ' +
                            'vCenter IP in ServiceNow = ' + vCenterIP + ', ' +
                            'Turbonomic target name = ' + turbonomicEntity.getTargetName() + '; VM name = ' + virtualMachineRecord.name);
                    return virtualMachineRecord;
                }
            } else {
            	this._log.debug('Cannot find the matching vCenter server record for virtual machine: ' + virtualMachineRecord.name);
            	return virtualMachineRecord;
            }
        }

        // Perform a heuristic search and match based on the entity and target name values
        var entityName = turbonomicEntity.getEntityName();
        this._log.debug('TurbonomicEntityMatcher.findVCenterVirtualMachine() - Performing heuristic CI search for the vCenter VM: ' + entityName);

        virtualMachineRecord = this._turbonomicGlide.accessTable(virtualMachineTableName);
        virtualMachineRecord.addQuery('name', entityName);
        virtualMachineRecord.query();

        while (virtualMachineRecord.next()) {
            this._log.debug('TurbonomicEntityMatcher.findVCenterVirtualMachine() - ' +
                    'Found candidate vCenter VM in ServiceNow named: ' + entityName);

            var vCenterCandidateRecord = virtualMachineRecord.vcenter_ref;
            if (vCenterCandidateRecord) {
                let ipAddress = vCenterCandidateRecord.ip_address;
                this._log.debug('TurbonomicEntityMatcher.findVCenterVirtualMachine(): vCenter IP in ServiceNow is: ' + ipAddress);

                if (ipAddress && (ipAddress == turbonomicEntity.getTargetName())) {
                    this._log.info('TurbonomicEntityMatcher.findVCenterVirtualMachine() - ' +
                            'Found matching vCenter virtual machine in ServiceNow with name = ' + entityName);
                    return virtualMachineRecord;
                } else {
                    this._log.warn('TurbonomicEntityMatcher.findVCenterVirtualMachine() - ' +
                            'The vCenter IP in ServiceNow does not match the Turbonomic target name: ' +
                            'vCenter IP in ServiceNow = ' + ipAddress + ', ' +
                            'Turbonomic target name = ' + turbonomicEntity.getTargetName() + '; VM name = ' + virtualMachineRecord.name);
                }
            }
        }

        this._log.info('TurbonomicEntityMatcher.findVCenterVirtualMachine() - ' +
                'Cannot find vCenter VM in ServiceNow for Turbonomic entity with Id: ' + entityId);
        return null;
    }

    /**
     * Find the matching Hyper-V virtual machine in ServiceNow, for the input Turbonomic entity.
     *
     * @param turbonomicEntity The input TurbonomicEntity instance.
     *
     * @return The matching Hyper-V virtual machine for the input Turbonomic entity if found, null otherwise.
     */
    findHyperVVirtualMachine (turbonomicEntity: TurbonomicEntity) {
    	let dao: TurbonomicActionDAO = new TurbonomicActionDAO();

        let virtualMachineTableName: string = dao.getSettingValue('hyper_v_vm_table_name');
        if (virtualMachineTableName == '') {
            this._log.warn('TurbonomicEntityMatcher.findHyperVVirtualMachine() - Invalid Hyper-V VM Table Name setting value');
            virtualMachineTableName = 'cmdb_ci_hyper_v_instance';
        } else {
	        this._log.debug('TurbonomicEntityMatcher.findHyperVVirtualMachine() - Found valid Hyper-V VM Table Name setting: ' + virtualMachineTableName);
        }

        let virtualMachineTableColumn: string = dao.getSettingValue('hyper_v_vm_table_column');
        if (virtualMachineTableColumn == '') {
            this._log.warn('TurbonomicEntityMatcher.findHyperVVirtualMachine() - Invalid Hyper-V VM Table Column setting value');
            virtualMachineTableColumn = 'object_id';
        } else {
	        this._log.debug('TurbonomicEntityMatcher.findHyperVVirtualMachine() - Found valid Hyper-V VM Table Column setting: ' + virtualMachineTableColumn);
        }

        // Find the Hyper-V virtual machine record for the input entity ID
        var virtualMachineRecord = this._turbonomicGlide.accessTable('cmdb_ci_hyper_v_instance');
        var entityId = turbonomicEntity.getUuid();
        virtualMachineRecord.addQuery('object_id', entityId);
        virtualMachineRecord.query();

        while (virtualMachineRecord.next()) {
            this._log.info('TurbonomicEntityMatcher.findHyperVVirtualMachine() - ' +
                    'Found valid Hyper-V VM in ServiceNow with Id: ' + entityId + '; VM name = ' + virtualMachineRecord.name);

            var hypervServerRecord = virtualMachineRecord.server;
            if (hypervServerRecord) {
                var hypervServerIP = hypervServerRecord.ip_address;
                this._log.info('TurbonomicEntityMatcher.findHyperVVirtualMachine(): Hyper-V Server IP address in ServiceNow = ' + hypervServerIP);

                if (hypervServerIP && (hypervServerIP == turbonomicEntity.getTargetName())) {
                    this._log.info('TurbonomicEntityMatcher.findHyperVVirtualMachine() - ' +
                            'Found matching Hyper-V virtual machine in ServiceNow with id: ' + entityId);
                    return virtualMachineRecord;
                } else {
                    this._log.warn('TurbonomicEntityMatcher.findHyperVVirtualMachine() - ' +
                            'The Hyper-V host name in ServiceNow does not match the Turbonomic target name: ' +
                            'ServiceNow Hyper-V Server IP address = ' + hypervServerIP + ', ' +
                            'Turbonomic target name = ' + turbonomicEntity.getTargetName() + '; VM name = ' + virtualMachineRecord.name);
                    return virtualMachineRecord;
                }
            } else {
            	this._log.debug('Cannot find the matching Hyper-V server record for virtual machine: ' + virtualMachineRecord.name);
                return virtualMachineRecord;
            }
        }

        // Perform a heuristic search and match based on the entity and target name values
        var entityName = turbonomicEntity.getEntityName();
        this._log.debug('TurbonomicEntityMatcher.findHyperVVirtualMachine() - Performing heuristic CI search for the Hyper-V VM: ' + entityName);

        virtualMachineRecord = this._turbonomicGlide.accessTable(virtualMachineTableName);
        virtualMachineRecord.addQuery('name', entityName);
        virtualMachineRecord.query();

        while (virtualMachineRecord.next()) {
            this._log.debug('TurbonomicEntityMatcher.findHyperVVirtualMachine() - ' +
                    'Found candidate Hyper-V VM in ServiceNow named: ' + entityName);

            var serverCandidateRecord = virtualMachineRecord.server;
            if (serverCandidateRecord) {
                let ipAddress = serverCandidateRecord.ip_address;
                this._log.debug('TurbonomicEntityMatcher.findHyperVVirtualMachine(): Hyper-V Server IP in ServiceNow is: ' + ipAddress);

                if (ipAddress && (ipAddress == turbonomicEntity.getTargetName())) {
                    this._log.info('TurbonomicEntityMatcher.findHYperVVirtualMachine() - ' +
                            'Found matching Hyper-V virtual machine in ServiceNow with name = ' + entityName);
                    return virtualMachineRecord;
                } else {
                    this._log.warn('TurbonomicEntityMatcher.findHyperVVirtualMachine() - ' +
                            'The Hyper-V server IP in ServiceNow does not match the Turbonomic target name: ' +
                            'Hyper-V server IP in ServiceNow = ' + ipAddress + ', ' +
                            'Turbonomic target name = ' + turbonomicEntity.getTargetName() + '; VM name = ' + virtualMachineRecord.name);
                }
            }
        }

        this._log.info('TurbonomicEntityMatcher.findHyperVVirtualMachine() - ' +
                'Cannot find Hyper-V VM in ServiceNow for Turbonomic entity with Id: ' + entityId);
        return null;
    }

    /**
     * Find the matching AWS virtual machine in ServiceNow, for the input Turbonomic entity.
     * We expect the input id to be provided in the following AWS format: i-016782f3e89014c3a
     *
     * @param turbonomicEntity The input TurbonomicEntity instance.
     *
     * @return The matching AWS virtual machine for the input Turbonomic entity if found, null otherwise.
     */
    findAwsVirtualMachine (id: string) {
        let dao: TurbonomicActionDAO = new TurbonomicActionDAO();

        let virtualMachineTableName: string = dao.getSettingValue('aws_vm_table_name');
        if (virtualMachineTableName == '') {
            this._log.warn('TurbonomicEntityMatcher.findAwsVirtualMachine() - Invalid AWS VM Table Name setting value');
            virtualMachineTableName = 'cmdb_ci_vm_instance';
        } else {
	        this._log.debug('TurbonomicEntityMatcher.findAwsVirtualMachine() - Found valid AWS VM Table Name setting: ' + virtualMachineTableName);
        }

        let virtualMachineTableColumn: string = dao.getSettingValue('aws_vm_table_column');
        if (virtualMachineTableColumn == '') {
            this._log.warn('TurbonomicEntityMatcher.findAwsVirtualMachine() - Invalid AWS VM Table Column setting value');
            virtualMachineTableColumn = 'object_id';
        } else {
	        this._log.debug('TurbonomicEntityMatcher.findAwsVirtualMachine() - Found valid AWS VM Table Column setting: ' + virtualMachineTableColumn);
        }

        var result = this.findVirtualMachineInstance(id, virtualMachineTableColumn, virtualMachineTableName);
        if (result != null) {
            this._log.info('TurbonomicEntityMatcher.findAwsVirtualMachine() - ' +
                    'Found valid AWS virtual machine in ServiceNow with id: ' + id);
        }

        return result;
    }

    /**
     * Find the matching Azure virtual machine in ServiceNow, for the input Turbonomic entity.
     * We expect the input id to be provided in the following Azure format:
     *    /subscriptions/758ad253-cbf5-4b18-8863-3eed0825bf07/resourceGroups/turbonomic
     *
     * @param turbonomicEntity The input TurbonomicEntity instance.
     *
     * @return The matching Azure virtual machine for the input Turbonomic entity if found, null otherwise.
     */
    findAzureVirtualMachine (id: string) {
        let dao: TurbonomicActionDAO = new TurbonomicActionDAO();

        let virtualMachineTableName: string = dao.getSettingValue('azure_vm_table_name');
        if (virtualMachineTableName == '') {
            this._log.warn('TurbonomicEntityMatcher.findAzureVirtualMachine() - Invalid Azure VM Table Name setting value');
            virtualMachineTableName = 'cmdb_ci_vm_instance';
        } else {
            this._log.debug('TurbonomicEntityMatcher.findAzureVirtualMachine() - Found valid Azure VM Table Name setting: ' + virtualMachineTableName);
        }

        let virtualMachineTableColumn: string = dao.getSettingValue('azure_vm_table_column');
        if (virtualMachineTableColumn == '') {
            this._log.warn('TurbonomicEntityMatcher.findAzureVirtualMachine() - Invalid Azure VM Table Column setting value');
            virtualMachineTableColumn = 'vm_inst_id';
        } else {
            this._log.debug('TurbonomicEntityMatcher.findAzureVirtualMachine() - Found valid Azure VM Table Column setting: ' + virtualMachineTableColumn);
        }

        var result = this.findVirtualMachineInstance(id, virtualMachineTableColumn, virtualMachineTableName);
        if (result != null) {
            this._log.info('TurbonomicEntityMatcher.findAzureVirtualMachine() - ' +
                    'Found valid Azure virtual machine in ServiceNow with Id: ' + id);
        }

        return result;
    }

    /**
     * Find a virtual machine instance in cmdb_ci_vm_instance table, based on the input id.
     *
     * @param id The unique virtual machine object id.
     * @param tableColumn The input table column name.
     * @param tableName The input table name used to search for the object id.
     *
     * @return The virtual machine instance for the input object id, or null if no instance found.
     */
    findVirtualMachineInstance (id: string, tableColumn: string, tableName: string) {
        var vmObjectRecord = this._turbonomicGlide.accessTable(tableName);
        vmObjectRecord.addQuery(tableColumn, id);
        vmObjectRecord.query();

        if (vmObjectRecord.next()) {
            this._log.info('TurbonomicEntityMatcher.findVirtualMachineInstance() - ' +
                    'Found matching virtual machine instance in ServiceNow for Turbonomic entity with Id: ' + id +
                    '; table name = ' + tableName + ', table column = ' + tableColumn);

            return vmObjectRecord;
        }

        this._log.warn('TurbonomicEntityMatcher.findVirtualMachineInstance() - ' +
                'Cannot find virtual machine instance in ServiceNow for Turbonomic entity with Id: ' + id +
                '; table name = ' + tableName + ', table column = ' + tableColumn);
        return null;
    }
}
