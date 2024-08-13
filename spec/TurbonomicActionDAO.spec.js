describe('Test ServiceNow DAO operations', function () {
	let turbonomicActionDAO = new TurbonomicActionDAO();
	let mockData = turbonomicActionDAO.mockData;
	let actionRecord = mockData.getActionRecord();
	let turbonomicEntity = mockData.getTurbonomicEntity();
	let turbonomicInstance = mockData.getTurbonomicInstance();
	let actionOid = actionRecord.actionOID;
	let newActionOid = '8674';
	let newEntityUuid = '4356';
	let newInstanceUuid = '6553';
	let newHostName = 'Turbonomic2';

	it('Test getting the last modified mock action record', function () {
        expect(turbonomicActionDAO.getLastModifiedActionRecord(actionOid, "On Generation")).toEqual(actionRecord);
    });

	it('Test finding CR using changeRequestId', function () {
		expect(turbonomicActionDAO.getChangeRequestById("1").number).toEqual("CR-1");
	});

//	it('Test updating field for approval record', function () {
//		let oid = "1";
//		let changeRequest = "CR-1";
//		let stateId = TurbonomicActionItemState.ACCEPTED;
//		let initialDescription = "initial description";
//		let updatedDescription = "updated description";
//
//		turbonomicActionDAO.createActionApproval(oid, "name", initialDescription,
//			"category", "commodityName", "from", "to", "risk", "savings", 1, "changedBy", "sourceEntityId",
//			"targetEntityId", "destinationEntityId", changeRequest, stateId, "typeId", "timestamp", "actionDao");
//		turbonomicActionDAO.updateLastModifiedActionApprovalField(oid, "description", updatedDescription);
//		expect(turbonomicActionDAO.getLastModifiedActionApproval(oid).description).toEqual(updatedDescription);
//	});

	it('Test creating a new action record', function () {
		// create the record
		turbonomicActionDAO.createActionRecord(newActionOid, 'Test Details',
      'mockAdmin', turbonomicEntity.uuid)
      // Test whether the record exists
		expect(turbonomicActionDAO.getLastModifiedActionRecord(newActionOid, "On Generation").actionOID).toEqual(newActionOid);
    });

    it('Test fecthing the newly created action record', function () {
		// create the record
		let tempActionRecord = turbonomicActionDAO.createActionRecord(newActionOid, 'Test Details 2',
      'mockAdmin2', turbonomicEntity.uuid)
      // Test whether the record exists and should be the last modified record.
		expect(turbonomicActionDAO.getLastModifiedActionRecord(newActionOid, "On Generation")).toEqual(tempActionRecord);
    });

//    it('Test fetching an existing Turbonomic entity with various properties', function () {
//		// Fetch the temp entity
//		let tempTurbonomicEntity = turbonomicActionDAO.getTurbonomicEntity(turbonomicEntity.name,
//		turbonomicEntity.type, turbonomicEntity.targetName, turbonomicEntity.targetType)
//      // Test whether the record exists and should be the last modified record.
//		expect(tempTurbonomicEntity).toEqual(turbonomicEntity);
//    });

    it('Test creating a new Turbonomic Instance', function () {
		// create the record
		let tempInstanceRecord = turbonomicActionDAO.createTurbonomicInstanceRecord(newInstanceUuid,
			newHostName,'Online', '6.3.4','April 3, 2019')
      // Test whether the record exists and should be the last modified record.
		expect(mockData.getTurbonomicInstancesforOid(newInstanceUuid)).toEqual(new Array(tempInstanceRecord));
    });

    it('Test fetching an existing turbonomic instance with hostname', function () {
    	// create the record
		let tempInstanceRecord = turbonomicActionDAO.createTurbonomicInstanceRecord(newInstanceUuid,
			newHostName,'Online', '6.3.4','April 3, 2019')
		// Fetch the temp instance
		let tempTurbonomicInstance = turbonomicActionDAO.getTurbonomicInstance(newHostName)
      // Test whether the record exists and should be the last modified record.
		expect(tempTurbonomicInstance.hostOrIp).toEqual(newHostName);
    });
});
