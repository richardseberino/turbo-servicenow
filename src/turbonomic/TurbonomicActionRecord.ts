/**
 * This is the class describing a TurbonomicActionRecord.
 * These classes are just the same as the ones we defined in ServiceNow to
 * assist with the DAO operations.
**/
class TurbonomicActionRecord {
    private actionOID: string;
    private details: string;
    private acceptedBy: string;
    private count: number;
    private lastUpdateTime: string;
    private turbonomicEntityId: string;
    private lifecycleStage: string;

    constructor() {
        this.actionOID = '';
        this.details = '';
        this.acceptedBy = '';
        this.count = 0;
        this.turbonomicEntityId = null;
        this.lifecycleStage = '';
    }

    public getActionOID(): string {
        return this.actionOID;
    }

    public setActionOID(id: string) {
        this.actionOID = id;
    }

    public getDetails(): string {
        return this.details;
    }

    public setDetails(details: string) {
        this.details = details;
    }

    public getAcceptedBy(): string {
        return this.acceptedBy;
    }

    public setAcceptedBy(acceptedBy: string) {
        this.acceptedBy = acceptedBy;
    }

    public getCount() {
        return this.count;
    }

    public setCount(count: number) {
        this.count = count;
    }

    public getLastUpdateTime() {
        return this.lastUpdateTime;
    }

    public setLastUpdateTime(lastUpdateTime: string) {
        this.lastUpdateTime = lastUpdateTime;
    }

    public getTurbonomicEntityId(): string {
        return this.turbonomicEntityId;
    }

    public setTurbonomicEntityId(id: string) {
        this.turbonomicEntityId = id;
    }

    public getLifecycleStage() {
        return this.lifecycleStage;
    }

    public setLifecycleStage(lifeCycleStage: string) {
        this.lifecycleStage = lifeCycleStage;
    }
}
