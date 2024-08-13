class TurbonomicActionApproval {

    public type:string = 'TurbonomicActionApproval';
    private actionOID: string;
    private name: string;
    private description: string;
    private category: string;
    private commodityName: string;
    private from: string;
    private to: string;
    private risk: string;
    private savings: string;
    private count: number;
    private changedBy: string;
    private sourceEntityId: string;
    private targetEntityId: string;
    private destinationEntityId: string;
    private changeRequestId: string;
    private stateId: string;
    private typeId: string;
    private timestamp: number;
    private actionDto: string;
    private sysId: string;

    constructor() {
        this.actionOID = '';
        this.name = '';
        this.description = '';
        this.category = '';
        this.commodityName = '';
        this.from = '';
        this.to = '';
        this.risk = '';
        this.savings = '';
        this.count = 0;
        this.changedBy = '';
        this.sourceEntityId = null;
        this.targetEntityId = null;
        this.destinationEntityId = null;
        this.changeRequestId = null;
        this.stateId = null;
        this.typeId = null;
        this.timestamp = null;
        this.actionDto = null;
        this.sysId = null;
    }

    public getActionOID(): string {
        return this.actionOID;
    }

    public setActionOID(id: string) {
        this.actionOID = id;
    }

    public getName(): string {
        return this.name;
    }

    public setName(name: string) {
        this.name = name;
    }

    public getDescription(): string {
        return this.description;
    }

    public setDescription(description: string) {
        this.description = description;
    }

    public getCategory(): string {
        return this.category;
    }

    public setCategory(category: string) {
        this.category = category;
    }

    public getCommodityName(): string {
        return this.commodityName;
    }

    public setCommodityName(commodityName: string) {
        this.commodityName = commodityName;
    }

    public getFrom(): string {
        return this.from;
    }

    public setFrom(from: string) {
        this.from = from;
    }

    public getTo(): string {
        return this.to;
    }

    public setTo(to: string) {
        this.to = to;
    }

    public getRisk(): string {
        return this.risk;
    }

    public setRisk(risk: string) {
        this.risk = risk;
    }

    public getSavings(): string {
        return this.savings;
    }

    public setSavings(savings: string) {
        this.savings = savings;
    }

    public getCount(): number {
        return this.count;
    }

    public setCount(count: number) {
        this.count = count;
    }

    public getChangedBy(): string {
        return this.changedBy;
    }

    public setChangedBy(changedBy: string) {
        this.changedBy = changedBy;
    }

    public getSourceEntityId(): string {
        return this.sourceEntityId;
    }

    public setSourceEntityId(sourceEntityId: string) {
        this.sourceEntityId = sourceEntityId;
    }

    public getTargetEntityId(): string {
        return this.targetEntityId;
    }

    public setTargetEntityId(targetEntityId: string) {
        this.targetEntityId = targetEntityId;
    }

    public getDestinationEntityId(): string {
        return this.destinationEntityId;
    }

    public setDestinationEntityId(destinationEntityId: string) {
        this.destinationEntityId = destinationEntityId;
    }

    public getChangeRequestId(): string {
        return this.changeRequestId;
    }

    public setChangeRequestId(changeRequestId: string) {
        this.changeRequestId = changeRequestId;
    }

    public getStateId(): string {
        return this.stateId;
    }

    public setStateId(stateId: string) {
        this.stateId = stateId;
    }

    public getTypeId(): string {
        return this.typeId;
    }

    public setTypeId(typeId: string) {
        this.typeId = typeId;
    }

    public getTimestamp(): number {
        return this.timestamp;
    }

    public setTimestamp(timestamp: number) {
        this.timestamp = timestamp;
    }

    public getActionDTO(): string {
        return this.actionDto;
    }

    public setActionDTO(actionDto: string) {
        this.actionDto = actionDto;
    }

    public getSysId(): string {
        return this.sysId;
    }

    public setSysId(id: string) {
        this.sysId = id;
    }

}
