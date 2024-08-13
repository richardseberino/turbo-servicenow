class TurbonomicActionApprovalRecord {

    private _stateId: string;

    set stateId(value: string) {
        this._stateId = value;
    }

    get stateId(): string {
        return this._stateId;
    }

    constructor() {
    }
}