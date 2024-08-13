/**
* This is a class which helps create and maintain the mock data for Action Records,
* Turbonomic Entity as well as Turnonomic Instance. Essentially providing CRUD
* operations.
**/
class MockData {

	public static readonly RECORD_OID: string = '1234';
	public static readonly ENTITY_UUID: string = '133232';
	public static readonly INSTANCE_UUID: string = '513334';
	public static readonly INSTANCE_IP: string = '10.22.1.23';
	public static readonly ENTITY_GUID: string = '32FA';
	public static readonly ENTITY_IP: string = '10.49.56.76';
	public static readonly VCENTER_REF: string = 'DC17';
	public static readonly SERVER: string = 'HP-390';
	public static readonly CMDB_RECORD_SERVER: CmdbRecordServer = new CmdbRecordServer('HP-390')
	private _turbonomicEntity: TurbonomicEntity;
	private _actionRecord: TurbonomicActionRecord;
	private _turbonomicInstance: TurbonomicInstance;
    private _actionRecords: TurbonomicActionRecord[] = new Array();
    private _turbonomicEntities: TurbonomicEntity[] = new Array();
	private _turbonomicInstances: TurbonomicInstance[] = new Array();
	private _approvalRecord: TurbonomicActionApproval;
	private _approvalRecords: TurbonomicActionApproval[] = new Array();
	private _changeRequest: TurbonomicChangeRequest;
	private _changeRequests: TurbonomicChangeRequest[] = new Array();

	constructor() { 
		this._turbonomicEntity = new TurbonomicEntity();
		this._turbonomicEntity.setUuid(MockData.ENTITY_GUID);
		this._turbonomicEntity.setEntityName('TestEntity');
		this._turbonomicEntity.setEntityType('VirtualMachine');
		this._turbonomicEntity.setTargetName('TestTarget');
		this._turbonomicEntity.setTargetType('TestTargetType');
		this._turbonomicEntity.setTurbonomicInstanceId(MockData.INSTANCE_UUID);
		this._turbonomicEntity.setUuid(MockData.ENTITY_UUID);
		this._turbonomicEntity.setTargetIP(MockData.ENTITY_IP);

		this._turbonomicInstance = new TurbonomicInstance();
		this._turbonomicInstance.setGuid(MockData.INSTANCE_UUID);
		this._turbonomicInstance.setHostOrIp(MockData.INSTANCE_IP);
		this._turbonomicInstance.setStatus('Online');
		this._turbonomicInstance.setVersion('6.4.0');
		this._turbonomicInstance.setLastAccessTime('April 2, 2019');
		this._turbonomicInstance.setMacAddress('6c-40-08-92-7f-4c');
        this._actionRecord = new TurbonomicActionRecord();
        this._actionRecord.setActionOID(MockData.RECORD_OID);
        this._actionRecord.setDetails('Resize Vmem from 2 GB to 4 GB');
        this._actionRecord.setAcceptedBy('admin');
        this._actionRecord.setCount(1);
        this._actionRecord.setTurbonomicEntityId(MockData.ENTITY_UUID);
        this._actionRecord.setLifecycleStage("On Generation");

        this._approvalRecord = new TurbonomicActionApproval();
        this._changeRequest = new TurbonomicChangeRequest();
        this._changeRequest.setState(TurbonomicChangeRequestState.ASSESS.toString());
        this._changeRequest.setId("1");
        this._changeRequest.setNumber("CR-1");
        this._changeRequests.push(this._changeRequest);
        this._approvalRecords.push(this._approvalRecord);
        this._actionRecords.push(this._actionRecord);
        this._turbonomicEntities.push(this._turbonomicEntity);
        this._turbonomicInstances.push(this._turbonomicInstance);
	}

	public getActionRecord(): TurbonomicActionRecord{
		return this._actionRecord;
	}

	public getActionRecords(): TurbonomicActionRecord[]{
		return this._actionRecords;
	}

	public updateActionApproval(actionApproval: TurbonomicActionApproval) {
		// add mock implementation
	}

	public getApprovalRecord(): TurbonomicActionApproval {
		return this._approvalRecord;
	}

	public getApprovalRecords(): TurbonomicActionApproval[] {
		return this._approvalRecords;
	}

	public  getChangeRequestByChangeRequestId(changeRequestId: string): TurbonomicChangeRequest {
		let changeRequest: TurbonomicChangeRequest;
		for (let i = 0; i < this._changeRequests.length ; i++) {
			if (this._changeRequests[i].getId() === changeRequestId) {
				changeRequest = (this._changeRequests[i]);
			}
		}
		return changeRequest;
	}

	public updateLastModifiedActionApprovalField(actionOid, approvalRecordField, newFieldValue) {
		for (let i = 0; i < this._approvalRecords.length ; i++) {
			if (this._approvalRecords[i].getActionOID() === actionOid) {
				this._approvalRecords[i][approvalRecordField] = newFieldValue;
				return true;
			}
		}
		// if record with this oid was not found
		return false;
	}

	public getActionApprovalByChangeRequestId(changeRequestId): TurbonomicActionApproval {
		// add mock implementation
		return new TurbonomicActionApproval();
	}

	public insertNewApprovalRecord(approvalRecord: TurbonomicActionApproval) {
		this._approvalRecords.push(approvalRecord);
	}

	/**
	* Expects a fully formed Action Record and inserts into the array
	**/
	public insertNewActionRecord(actionRecord: TurbonomicActionRecord) {
		this._actionRecords.push(actionRecord);
	}

	public getActionRecordsforOid(actionOid: string, lifecycleStage: string): TurbonomicActionRecord[]{
		let tempActionRecords = [];
		for( var i = 0; i < this._actionRecords.length ; i++) {
		   if (this._actionRecords[i].getActionOID() === actionOid && this._actionRecord.getLifecycleStage() === lifecycleStage) {
               tempActionRecords.push(this._actionRecords[i]);
		   }
		}
		return tempActionRecords;
	}

	public getApprovalRecordsForOid(actionOid: string): TurbonomicActionApproval[] {
		let tempApprovalRecords = [];
		for (let i = 0; i < this._approvalRecords.length ; i++) {
			if (this._approvalRecords[i].getActionOID() === actionOid) {
				tempApprovalRecords.push(this._approvalRecords[i]);
			}
		}
		return tempApprovalRecords;
	}

	public getTurbonomicEntity(): TurbonomicEntity{
		return this._turbonomicEntity;
	}

	public getTurbonomicEntities(): TurbonomicEntity[]{
		return this._turbonomicEntities;
	}

	/**
	* Expects a fully formed Turbonomic Entity and inserts into the array
	**/
	public insertNewTurbonomicEntityRecord(turbonomicEntity: TurbonomicEntity) {
		this._turbonomicEntities.push(turbonomicEntity);
	}

	public getTurbonomicEntitiesforOid(turbonomicEntityId: string): TurbonomicActionRecord[]{
		let tempTurbonomicEntities = [];
		for(var i = 0; i < this._actionRecords.length ; i++) {
		   if (this._turbonomicEntities[i].getUuid() === turbonomicEntityId) {
               tempTurbonomicEntities.push(this._turbonomicEntities[i]);
		   }
		}
		return tempTurbonomicEntities;
	}

	public getTurbonomicInstance(): TurbonomicInstance{
		return this._turbonomicInstance;
	}

	public getTurbonomicInstances(): TurbonomicInstance[]{
		return this._turbonomicInstances;
	}

	/**
	* Expects a fully formed Turbonomic Instance and inserts into the array
	**/
	public insertNewTurbonomicInstanceRecord(turbonomicInstance: TurbonomicInstance) {
		this._turbonomicInstances.push(turbonomicInstance);
	}

	public getTurbonomicInstancesforOid(turbonomicInstanceId: string): TurbonomicActionRecord[]{
		let tempTurbonomicInstances = [];
		for( var i = 0; i < this._turbonomicInstances.length ; i++) {
		   if (this._turbonomicInstances[i].getGuid() === turbonomicInstanceId) {
               tempTurbonomicInstances.push(this._turbonomicInstances[i]);
		   }
		}
		return tempTurbonomicInstances;
	}
}
