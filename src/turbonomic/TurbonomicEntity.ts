/**
 * This is the class describing a TurbonomicEntity.
 * These classes are just the same as the ones we defined in ServiceNow to
 * assist with the DAO operations.
**/
class TurbonomicEntity {
    public type: String;
    private guid: string;
    private uuid: string;
    private entityName: string;
    private entityType: string;
    private targetName: string;
    private targetType: string;
    private targetIp: string;
    private configItemId: string;
    private turbonomicInstanceId: string;

    constructor() {
        this.type = 'TurbonomicEntity';
        this.guid = "";
        this.uuid = "";
        this.entityName = "";
        this.entityType = "";
        this.targetName = "";
        this.targetType = "";
        this.targetIp = "";
        this.configItemId = null;
        this.turbonomicInstanceId = null;
    }

    public getGuid(): string {
        return this.guid;
    }

    public setGuid(guid: string) {
        this.guid = guid;
    }

    public getUuid(): string {
        return this.uuid;
    }

    public setUuid(uuid: string) {
        this.uuid = uuid;
    }

    public getEntityName(): string {
        return this.entityName;
    }

    public setEntityName(name: string) {
        this.entityName = name;
    }

    public getEntityType(): string {
        return this.entityType;
    }

    public setEntityType(type: string) {
        this.entityType = type;
    }

    public getTargetName(): string {
        return this.targetName;
    }

    public setTargetName(targetName: string) {
        this.targetName = targetName;
    }

    public getTargetType(): string {
        return this.targetType;
    }

    public setTargetType(targetType: string) {
        this.targetType = targetType;
    }

    public getTargetIP(): string {
        return this.targetIp;
    }

    public setTargetIP(targetIp: string) {
        this.targetIp = targetIp;
    }

    public getConfigItemId(): string {
        return this.configItemId;
    }

    public setConfigItemId(id: string) {
        this.configItemId = id;
    }

    public getTurbonomicInstanceId(): string {
        return this.turbonomicInstanceId;
    }

    public setTurbonomicInstanceId(id: string) {
        this.turbonomicInstanceId = id;
    }
}
