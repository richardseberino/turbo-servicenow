/*
 * This is the class describing a TurbonomicInstance.
 * These classes are just the same as the ones we defined in ServiceNow to
 * assist with the DAO operations.
**/
class TurbonomicInstance {

    public type: string;
    private guid: string;
    private hostOrIp: string;
    private status: string;
    private version: string;
    private lastAccessTime: string;
    private macAddress: string;

    constructor() {
        this.type = 'TurbonomicInstance';
        this.guid = '';
        this.hostOrIp = '';
        this.status = '';
        this.version = '';
        this.lastAccessTime = '';
        this.macAddress = '';
    }

    public getGuid(): string {
        return this.guid;
    }

    public setGuid(guid: string) {
        this.guid = guid;
    }

    public getHostOrIp(): string {
        return this.hostOrIp;
    }

    public setHostOrIp(hostOrIp: string) {
        this.hostOrIp = hostOrIp;
    }

    public getStatus(): string {
        return this.status;
    }

    public setStatus(status: string) {
        this.status = status;
    }

    public getVersion(): string {
        return this.version;
    }

    public setVersion(version: string) {
        this.version = version;
    }

    public getLastAccessTime(): string {
        return this.lastAccessTime;
    }

    public setLastAccessTime(lastAccessTime: string) {
        this.lastAccessTime = lastAccessTime;
    }

    public getMacAddress(): string {
        return this.macAddress;
    }

    public setMacAddress(macAddress: string) {
        this.macAddress = macAddress;
    }

}
