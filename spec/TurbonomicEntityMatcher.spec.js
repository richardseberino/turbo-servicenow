describe('Test ServiceNow Entity Matching operations', function () {
	let turbonomicActionDAO = new TurbonomicActionDAO();
	let mockData = turbonomicActionDAO.mockData;
	let actionRecord = mockData.getActionRecord();
	let turbonomicEntity = mockData.getTurbonomicEntity();
	let turbonomicInstance = mockData.getTurbonomicInstance();
	let turbonomicEntityMatcherDAO = new TurbonomicEntityMatcherDAO(turbonomicActionDAO);
	let turbonomicEntityMatcher = new TurbonomicEntityMatcher(turbonomicEntityMatcherDAO);
	let cmdb = turbonomicEntityMatcherDAO.getCmdb();
	let _log = new x_turbo_turbonomic.Logger();

	it('Test matching with a wrong Target Type', function () {
		let cmdbRecord = turbonomicEntityMatcher.findConfigurationItem(turbonomicEntity);
		// The target type should be incorrectly setup in the MockData
		expect(cmdbRecord).toEqual(null);
    });

    it('Test non-matching with a V-Center Target but unsupported entity type', function () {
    	turbonomicEntity.targetType = Helper.VCENTER;
    	// The target type should be set to an invalid type in the MockData
    	turbonomicEntity.type = TurbonomicEntityMatcher.HOST;
		let cmdbRecord = turbonomicEntityMatcher.findConfigurationItem(turbonomicEntity);
    	// The PM cannot be identified
		expect(cmdbRecord).toEqual(null);
    });

    it('Test matching with a V-Center Target with no entries in the CMDB table', function () {
    	turbonomicEntity.targetType = Helper.VCENTER;
    	// The target type should now be correctly setup in the MockData
    	turbonomicEntity.type = TurbonomicEntityMatcher.VIRTUAL_MACHINE;
    	let cmdbRecord = turbonomicEntityMatcher.findConfigurationItem(turbonomicEntity);
    	// The VM cannot be identified since there are no entries in the CMDB table
		expect(cmdbRecord).toEqual(null);
    });

    it('Test matching with a V-Center Target with only VM Instance in the CMDB table', function () {
    	turbonomicEntity.targetType = Helper.VCENTER;
    	// The target type should now be correctly setup in the MockData
    	turbonomicEntity.type = TurbonomicEntityMatcher.VIRTUAL_MACHINE;
    	let vcenter_vm = new CmdbRecord(MockData.ENTITY_UUID, MockData.ENTITY_IP, Helper.CMDB_CI_VMWARE_INSTANCE,
    		MockData.VCENTER_REF,'');
    	cmdb.addRecord(vcenter_vm);
    	let cmdbRecord = turbonomicEntityMatcher.findConfigurationItem(turbonomicEntity);
    	// The VM cannot be identified since there are no entries in the CMDB table
		expect(cmdbRecord).toEqual(null);
    });

    it('Test matching with a V-Center Target with both VM Instance and VCenter in CMDB table', function () {
    	turbonomicEntity.setTargetType(Helper.VCENTER);
    	// The target type should now be correctly setup in the MockData
    	turbonomicEntity.setEntityType(TurbonomicEntityMatcher.VIRTUAL_MACHINE);
    	// Create a CMDB Record for the VM INSTANCE
    	let vcenter_vm = new CmdbRecord(MockData.ENTITY_UUID, MockData.ENTITY_IP, Helper.CMDB_CI_VMWARE_INSTANCE,
    		null, null);
    	cmdb.addRecord(vcenter_vm);
    	// Create a CMDB Record for the VCenter Instance
    	let vcenter_dc = new CmdbRecord(MockData.VCENTER_REF, MockData.INSTANCE_IP, Helper.CMDB_CI_VCENTER,
    		'','');
    	cmdb.addRecord(vcenter_dc);
		let cmdbRecord = turbonomicEntityMatcher.findConfigurationItem(turbonomicEntity);
		// The VM should be now be correctly identified
		expect(cmdbRecord).toEqual(vcenter_vm);
    });

    it('Test non-matching with a Hyper-V Target but unsupported entity type', function () {
    	turbonomicEntity.setTargetType(Helper.HYPER_V);
    	// The target type should be set to an invalid type in the MockData
    	turbonomicEntity.setEntityType(TurbonomicEntityMatcher.STORAGE);
		let cmdbRecord = turbonomicEntityMatcher.findConfigurationItem(turbonomicEntity);
    	// The PM cannot be identified
		expect(cmdbRecord).toEqual(null);
    });

    it('Test matching with a Hyper-V Target with no entries in the CMDB table', function () {
    	turbonomicEntity.targetType = Helper.HYPER_V;
    	// The target type should now be correctly setup in the MockData
    	turbonomicEntity.type = TurbonomicEntityMatcher.VIRTUAL_MACHINE;
    	let cmdbRecord = turbonomicEntityMatcher.findConfigurationItem(turbonomicEntity);
    	// The VM cannot be identified since there are no entries in the CMDB table
		expect(cmdbRecord).toEqual(null);
    });

    it('Test matching with a Hyper-V Target with only VM Instance in the CMDB table', function () {
    	turbonomicEntity.targetType = Helper.HYPER_V;
    	// The target type should now be correctly setup in the MockData
    	turbonomicEntity.type = TurbonomicEntityMatcher.VIRTUAL_MACHINE;
    	let hyperv_vm = new CmdbRecord(MockData.ENTITY_UUID, MockData.ENTITY_IP, Helper.CMDB_CI_HYPER_V_INSTANCE,
    		'', MockData.SERVER);
    	cmdb.addRecord(hyperv_vm);
    	let cmdbRecord = turbonomicEntityMatcher.findConfigurationItem(turbonomicEntity);
    	// The VM cannot be identified since there are no entries in the CMDB table
		expect(cmdbRecord).toEqual(null);
    });

    it('Test matching with a Hyper-V Target with both VM Instance and Hyper-V in CMDB table', function () {
    	turbonomicEntity.setTargetType(Helper.HYPER_V);
    	// The target type should now be correctly setup in the MockData
    	turbonomicEntity.setEntityType(TurbonomicEntityMatcher.VIRTUAL_MACHINE);
    	let hyperv_vm = new CmdbRecord(MockData.ENTITY_UUID, MockData.ENTITY_IP, Helper.CMDB_CI_HYPER_V_INSTANCE,
    		null, MockData.CMDB_RECORD_SERVER);
    	cmdb.addRecord(hyperv_vm);
    	// Create a CMDB Record for the Hyper-V Instance
    	let hyperv_dc = new CmdbRecord(MockData.SERVER, MockData.INSTANCE_IP, Helper.CMDB_CI_VIRTUALIZATION_SERVER,
    		'','');
    	cmdb.addRecord(hyperv_dc);
		let cmdbRecord = turbonomicEntityMatcher.findConfigurationItem(turbonomicEntity);
		// The VM should be now be correctly identified
		expect(cmdbRecord).toEqual(hyperv_vm);
    });

    it('Test matching with a AWS Target with data not in CMDB table', function () {
    	turbonomicEntity.targetType = Helper.AWS;
    	// The target type should now be correctly setup in the MockData
    	turbonomicEntity.setEntityType('');
    	let aws_vm = new CmdbRecord('DUMMY_AWS_UUID', MockData.ENTITY_IP, Helper.CMDB_CI_VM_INSTANCE,
    		null, null);
    	cmdb.addRecord(aws_vm);
    	let cmdbRecord = turbonomicEntityMatcher.findConfigurationItem(turbonomicEntity);
		// The VM should be now be correctly identified
		expect(cmdbRecord).toEqual(null);
    });

    it('Test matching with a AWS Target with data in CMDB table', function () {
    	turbonomicEntity.targetType = Helper.AWS;
    	// The target type should now be correctly setup in the MockData
    	turbonomicEntity.setEntityType(TurbonomicEntityMatcher.VIRTUAL_MACHINE);;
    	let aws_vm = new CmdbRecord(turbonomicEntity.getUuid(), MockData.ENTITY_IP, Helper.CMDB_CI_VM_INSTANCE,
    		null, null);
    	cmdb.addRecord(aws_vm);
    	let cmdbRecord = turbonomicEntityMatcher.findConfigurationItem(turbonomicEntity);
 
		// The VM should be now be correctly identified
		expect(cmdbRecord).toEqual(aws_vm);
    });

    it('Test matching with a Azure Target with data in CMDB table', function () {
    	turbonomicEntity.setTargetType(Helper.AZURE);
    	// The target type should now be correctly setup in the MockData
    	turbonomicEntity.setEntityType(TurbonomicEntityMatcher.VIRTUAL_MACHINE);
    	let azure_vm = new CmdbRecord(turbonomicEntity.getUuid(), MockData.ENTITY_IP, Helper.CMDB_CI_VM_INSTANCE,
    		null, null);
    	cmdb.addRecord(azure_vm);
    	let cmdbRecord = turbonomicEntityMatcher.findConfigurationItem(turbonomicEntity);

    	// The VM should be now be correctly identified
		expect(cmdbRecord).toEqual(azure_vm);
    });

});