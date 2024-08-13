class TurbonomicGlide {

    private tableRecords: CmdbRecord[] = new Array();

    constructor() {
        this.tableRecords.push(new CmdbRecord(MockData.ENTITY_UUID, MockData.ENTITY_IP, Helper.CMDB_CI_VM_INSTANCE, null, null));
        this.tableRecords.push(new CmdbRecord(MockData.ENTITY_UUID, MockData.ENTITY_IP, Helper.CMDB_CI_HYPER_V_INSTANCE, null, MockData.CMDB_RECORD_SERVER));
        this.tableRecords.push(new CmdbRecord(MockData.ENTITY_UUID, MockData.ENTITY_IP, Helper.CMDB_CI_VMWARE_INSTANCE, null, null));
    }

    accessTable(tableName: string) {
        switch (tableName) {
            case Helper.CMDB_CI_VM_INSTANCE :
                return this.tableRecords[0];
            case Helper.CMDB_CI_HYPER_V_INSTANCE :
            	return this.tableRecords[1];
            case Helper.CMDB_CI_VMWARE_INSTANCE :
            	return this.tableRecords[2];
            default :
                return null;
        }
    }

    newDateTime(timestamp?):any {
        return null;
    }

}
