/**
* This is a mock EntityMatcher DAO class that can only interact with MockData to request
* for data instead of an actual database. The operations work in the same way
* as if we were requesting data directly from ServiceNow.
**/
class TurbonomicEntityMatcherDAO {
	private _cmdb: Cmdb;
	private _turbonomicActionDAO: TurbonomicActionDAO;

    /*Initialize with mock data to start with. Similar to initializing the Database.*/
    constructor(turbonomicActionDAO: TurbonomicActionDAO) {
        this._cmdb = new Cmdb();
        this._turbonomicActionDAO = turbonomicActionDAO;
    }

    public getCmdb(): Cmdb {
        return this._cmdb;
    }

    public getRecords(type: String, uuid: String): Cmdb {
    	let cmdbRecords: Cmdb = new Cmdb();
    	let oid: string;
		for( var i = 0; i < this._cmdb.length; i++) {
		   	if (this._cmdb.cmdbRecords[i].type === type &&
		   	this._cmdb.cmdbRecords[i].uuid === uuid) {
               cmdbRecords.addRecord(this._cmdb.cmdbRecords[i]);
		   }
		}
		return cmdbRecords;
    }

    public getTurbonomicInstance (instanceId: String): TurbonomicInstance {
    	return this._turbonomicActionDAO.getTurbonomicInstanceFromInstanceId(instanceId);
    }
}
