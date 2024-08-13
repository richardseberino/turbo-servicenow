/**
 * Class representing information about server in cmdb record.
 */
class CmdbRecordServer {

    public ip_address: string;
    private _hostName: string;

    constructor(hostName: string) {
        this._hostName = hostName;
    }

    get hostName(): string {
        return this._hostName;
    }

    set hostName(hostName: string) {
        this._hostName = hostName;
    }
}