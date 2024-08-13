/**
* This is a mock Action DAO class that can only interact with MockData to request
* for data instead of an actual database. The operations work in the same way
* as if we were requesting data directly from ServiceNow.
**/
class TurbonomicActionDAO {

    private _mockData: MockData;

    /*Initialize with mock data to start with. Similar to initializing the Database.*/
    constructor() {
        this._mockData = new MockData();
    }

    get mockData(): MockData {
        return this._mockData;
    }

    /**
    * For all action records with the same OID, get the record that was most
    * recently modified.
    **/
    getLastModifiedActionRecord(oid: string, lifecycleStage:string): TurbonomicActionRecord {
        // Get all the actions for the actionOid
        let allActionRecordsForOid = this._mockData.getActionRecordsforOid(oid, lifecycleStage);
        // The last one is the latest, since these tests are running in memory,
        // and an insert at the end signifies the last modified record.
        return allActionRecordsForOid[allActionRecordsForOid.length-1];
    }

    /**
    * Create a new action record and insert into the mock database.
    **/
    createActionRecord (oid: string, details: string,
        acceptedBy: string, count: number, turbonomicEntityId: string, lifeCycleEvent: string) {
        let tempActionRecord = new TurbonomicActionRecord();
        tempActionRecord.setActionOID(oid);
        tempActionRecord.setDetails(details);
        tempActionRecord.setAcceptedBy(acceptedBy);
        tempActionRecord.setCount(count);
        tempActionRecord.setTurbonomicEntityId(turbonomicEntityId);
        tempActionRecord.setLifecycleStage(lifeCycleEvent);
        this._mockData.insertNewActionRecord(tempActionRecord);
        return tempActionRecord;
    }

    createOrUpdateActionRecord  (oid: string, details: string,
        acceptedBy: string, turbonomicEntityId: string, lifeCycleEvent: string) {
        // TODO
        return null;
    }

    /**
    * Insert another record with the same ID as one which already exists in the database,
    * which will essentially update the last modified action record.
    **/
    updateLastModifiedActionRecord (oid: string, details: string,
        acceptedBy: string, count: number, turbonomicEntityId: string, lifeCycleEvent: string) {
        return this.createActionRecord(oid, details, acceptedBy, count, turbonomicEntityId, lifeCycleEvent);
    }


    /**
    * Tries to first match the turbonomic entities with the entity name and if a match is found,
    * matches the other properties for a thorough match.
    **/
    getTurbonomicEntity (entityName: string, entityType: string, targetName: string,
        targetType: string) {
        let tempTurbonomicEntity = new TurbonomicEntity();
        tempTurbonomicEntity.setUuid(MockData.ENTITY_UUID);
        tempTurbonomicEntity.setEntityName(entityName);
        tempTurbonomicEntity.setEntityType(entityType);
        tempTurbonomicEntity.setTargetName(targetName);
        tempTurbonomicEntity.setTargetType(targetType);
        tempTurbonomicEntity.setTargetIP(MockData.ENTITY_IP);
        tempTurbonomicEntity.setTurbonomicInstanceId(MockData.INSTANCE_UUID);
        let tempTurbonomicEntities = this._mockData.getTurbonomicEntities();
        for(let i = 0; i < tempTurbonomicEntities.length ; i++) {
            // First check with the entity name
           if (tempTurbonomicEntities[i].getEntityName() === entityName) {
               // Final check, use the class's equals method
               if (tempTurbonomicEntities[i].getTargetIP() === tempTurbonomicEntity.getTargetIP()) {
                   return tempTurbonomicEntities[i];
               }
           }
        }
        // Nothing found
        return null;
    }

    /**
    * Create a new Turbonomic Entity record and insert into the mock database.
    **/
    createTurbonomicEntityRecord (guid: string, uuid: string, name: string, type: string, targetName: string,
     targetType: string, targetIP: string, configItemId: string, turbonomicInstanceId: string) {
        let tempTurbonomicEntityRecord = new TurbonomicEntity();
        tempTurbonomicEntityRecord.setUuid(uuid);
        tempTurbonomicEntityRecord.setEntityName(name);
        tempTurbonomicEntityRecord.setEntityType(type);
        tempTurbonomicEntityRecord.setTargetName(targetName);
        tempTurbonomicEntityRecord.setTargetType(targetType);
        tempTurbonomicEntityRecord.setTargetIP(targetIP);
        tempTurbonomicEntityRecord.setConfigItemId(configItemId);
        tempTurbonomicEntityRecord.setTurbonomicInstanceId(turbonomicInstanceId);

        this._mockData.insertNewTurbonomicEntityRecord(tempTurbonomicEntityRecord);
        return tempTurbonomicEntityRecord;
    }

    getTurbonomicInstance (hostOrIp) {
        let tempTurbonomicInstances = this._mockData.getTurbonomicInstances()
        for( var i = 0; i < tempTurbonomicInstances.length ; i++) {
            // First check with the Instance name
           if (tempTurbonomicInstances[i].getHostOrIp() === hostOrIp) {
               return tempTurbonomicInstances[i];
           }
        }
        // Nothing found
        return null;
    }

    public getTurbonomicInstanceFromInstanceId (instanceId) {
        let tempTurbonomicInstances = this._mockData.getTurbonomicInstances()
        for( var i = 0; i < tempTurbonomicInstances.length ; i++) {
            // First check with the Instance name
           if (tempTurbonomicInstances[i].getGuid() === instanceId) {
               return tempTurbonomicInstances[i];
           }
        }
        // Nothing found
        return null;
    }

    createTurbonomicInstanceRecord (uuid: string,
        hostOrIp: string, status: string, version: string, lastAccessTime: string, macAddress: string) {
        let tempTurbonomicInstanceRecord = new TurbonomicInstance();
        tempTurbonomicInstanceRecord.setGuid(uuid);
        tempTurbonomicInstanceRecord.setHostOrIp(hostOrIp);
        tempTurbonomicInstanceRecord.setStatus(status);
        tempTurbonomicInstanceRecord.setVersion(version);
        tempTurbonomicInstanceRecord.setLastAccessTime(lastAccessTime);
        tempTurbonomicInstanceRecord.setMacAddress(macAddress);
        this._mockData.insertNewTurbonomicInstanceRecord(tempTurbonomicInstanceRecord);
        return tempTurbonomicInstanceRecord;
    }

    getChangeRequestById(changeRequestId: string):TurbonomicChangeRequest {
        return this._mockData.getChangeRequestByChangeRequestId(changeRequestId);
    }

    getActionStateById(id:string): string {
        // add mock implementation
        return "string";
    }

    valueOrEmptyStr(value: string): string {
        if (value) {
            return value;
        }

        return '';
    }

    updateLastModifiedActionApprovalField(oid:string, field, value):boolean {
        return this._mockData.updateLastModifiedActionApprovalField(oid,field,value);
    }

    allowApprovalsForRejectedRequests(): boolean {
        // add mock implementation
        return true;
    }

    getTurbonomicEntityById (targetEntityId: string): TurbonomicEntity {
        // add mock implementation
        return new TurbonomicEntity();
    }

    createChangeRequest (oid:string, configItemId: string, shortDescription: string, description: string) {
        // add mock implementation
        return new TurbonomicChangeRequest();
    }

    /**
     * Create new approval record and insert into the mock database.
     */
    createActionApproval (actionOID: string, name: string, description: string,
                          category: string, commodityName: string, from: string, to: string, risk: string, savings: string, count: number, changedBy: string, sourceEntityId: string,
                          targetEntityId: string, destinationEntityId: string, changeRequestId: string, stateId: string, typeId: string, timestamp: number, actionDto: string): TurbonomicActionApproval {
        // add mock implementation
        let tempApprovalRecord = new TurbonomicActionApproval();
        tempApprovalRecord.setActionOID(actionOID);
        tempApprovalRecord.setName(name);
        tempApprovalRecord.setDescription(description);
        tempApprovalRecord.setCategory(category);
        tempApprovalRecord.setCommodityName(commodityName);
        tempApprovalRecord.setFrom(from);
        tempApprovalRecord.setTo(to);
        tempApprovalRecord.setRisk(risk);
        tempApprovalRecord.setSavings(savings);
        tempApprovalRecord.setCount(count);
        tempApprovalRecord.setChangedBy(changedBy);
        tempApprovalRecord.setSourceEntityId(sourceEntityId);
        tempApprovalRecord.setTargetEntityId(targetEntityId);
        tempApprovalRecord.setDestinationEntityId(destinationEntityId);
        tempApprovalRecord.setChangeRequestId(changeRequestId);
        tempApprovalRecord.setStateId(stateId);
        tempApprovalRecord.setTypeId(typeId);
        tempApprovalRecord.setTimestamp(timestamp);
        tempApprovalRecord.setActionDTO(actionDto);
        this._mockData.insertNewApprovalRecord(tempApprovalRecord);
        return tempApprovalRecord;
    }

    getActionStateId (actionApprovalStateId: string): TurbonomicActionItemState {
        // add mock implementation
        return TurbonomicActionItemState.ACCEPTED;

    }

    getActionTypeId (actionType: string): string {
        // add mock implementation
        return "";
    }

    isChangeRequestDisabled() {
        // add mock implementation
        return false;
    }

    makeEmptyChangeRequest():TurbonomicChangeRequest {
        // add mock implementation
        return new TurbonomicChangeRequest();
    }

    getSettingValue(settingName: string): string {
        // add mock implementation
        return "";
    }

    getLastModifiedActionApproval(oid: string): TurbonomicActionApproval {
        // add mock implementation
        return null;
    }

    markMissedActionApprovals() {
        // add mock implementation
    }

    getActionApprovals(uniqueActionOIDs: string[], addAllApprovalsInTransition: boolean) {
        // add mock implementation
        return {
            'oid' : '',
            'state' : ''
        }
    }

    createTurbonomicEntityFromInput(turbonomicEntity: TurbonomicEntity): string {
        // add mock implementation
        return "";
    }

    updateTurbonomicEntity(turbonomicEntityId: string, turbonomicInstanceId: string): boolean {
        // add mock implementation
        return true;
    }

    updateTurbonomicEntityConfigItem(turbonomicEntity: TurbonomicEntity, configItemSysId: string): boolean {
        // add mock implementation
        return true;
    }

    updateTurbonomicInstance(hostOrIp: string, status: string, version: string, macAddress: string): boolean {
        // add mock implementation
        return true;
    }

    createTurbonomicInstance(hostOrIp: string, status: string, version: string, lastAccessTime: string, macAddress: string): string {
        // add mock implementation
        return '';
    }

    getActionApprovalByChangeRequest(changeRequest: TurbonomicChangeRequest): TurbonomicActionApprovalTable {
        // add mock implementation
        return ;
    }

    updateActionApproval(actionApproval, actionStateId) {
        // add mock implementation
    }

    insertIntoImportSet(importSetName, keyValueMap, debugLoggingSuccess) {
        // add mock implementation
        return "";
    }

}
