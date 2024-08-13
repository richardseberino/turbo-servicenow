/*
* These is mocking the records of the CMDB database in the ServiceNow DB.
*/
class CmdbRecord {

    public name: string;
    public _sys_id: string;
    public _uuid: string;
    public _hostOrIp: string;
    public _type: string;
    public _vcenter_ref: CmdbRecordServer;
    public _server: CmdbRecordServer;
    public sys_updated_on: string;
    public state_id: string;

    constructor(uuid: string,
        hostOrIp: string, type: string,
        vcenter_ref: CmdbRecordServer, server: CmdbRecordServer) {
        this._uuid = uuid;
        this._hostOrIp = hostOrIp;
        this._type = type;
        this._vcenter_ref = vcenter_ref;
        this._server = server;
    }

    get uuid(): string {
        return this._uuid;
    }

    set uuid(uuid: string) {
        this._uuid = uuid;
    }

    get hostOrIp(): string {
        return this._hostOrIp;
    }

    set hostOrIp(hostOrIp: string) {
        this._hostOrIp = hostOrIp;
    }

    get type(): string {
        return this._type;
    }

    set type(type: string) {
        this._type = type;
    }

    get vcenter_ref(): CmdbRecordServer {
        return this._vcenter_ref;
    }

    set vcenter_ref(vcenter_ref: CmdbRecordServer) {
        this._vcenter_ref = vcenter_ref;
    }

    get server(): CmdbRecordServer {
        return this._server;
    }

    set server(server: CmdbRecordServer) {
        this._server = server;
    }

    set sys_id(value: string) {
        this._sys_id = value;
    }

    get sys_id(): string {
        return this._sys_id;
    }

    public addQuery(tableColumn: string, query: string) {
    }
    
    public query() {
    	
    }

    public orderByDesc(property: string) {
    	
    }

    /*
     * Find the next record depending on the position of the cursor.
     *
     * @return cmdbRecord The record being returned.
     */
    public next(): CmdbRecord {
    	return this;
    }

    /*
     * Retreive a property when passing a string.
     *
     * @param property The record being requested.
     */
     public getValue(property: string): string {
    	switch (property) {
    		case Helper.IP_ADDRESS:
    		case Helper.HOST_NAME:
    			return this._hostOrIp;
    		default:
    			return null;
    	}
    }

    public equals(obj: CmdbRecord): boolean {
        if (this._type === obj.type &&
        	this._uuid === obj.uuid &&
        this._hostOrIp === obj.hostOrIp) {
        return true;
        } else {
        return false;
        }
    }
}