/**
* This is a mock EntityMatcher DAO class that can only interact with MockData to request
* for data instead of an actual database. The operations work in the same way
* as if we were requesting data directly from ServiceNow.
**/
var TurbonomicEntityMatcherDAO = /** @class */ (function () {
    /*Initialize with mock data to start with. Similar to initializing the Database.*/
    function TurbonomicEntityMatcherDAO(turbonomicActionDAO) {
        this._cmdb = new Cmdb();
        this._turbonomicActionDAO = turbonomicActionDAO;
    }
    Object.defineProperty(TurbonomicEntityMatcherDAO.prototype, "cmdb", {
        get: function () {
            return this._cmdb;
        },
        enumerable: true,
        configurable: true
    });
    TurbonomicEntityMatcherDAO.prototype.getRecords = function (type, uuid) {
        var cmdbRecords = new Cmdb();
        var oid;
        for (var i = 0; i < this._cmdb.length; i++) {
            if (this._cmdb.cmdbRecords[i].type === type &&
                this._cmdb.cmdbRecords[i].uuid === uuid) {
                cmdbRecords.addRecord(this._cmdb.cmdbRecords[i]);
            }
        }
        return cmdbRecords;
    };
    TurbonomicEntityMatcherDAO.prototype.getTurbonomicInstance = function (instanceId) {
        return this._turbonomicActionDAO.getTurbonomicInstanceFromInstanceId(instanceId);
    };
    return TurbonomicEntityMatcherDAO;
}());
