class TurbonomicActionApprovalTable {

    private _approvalRecords: TurbonomicActionApprovalRecord[] = new Array();
    private _count: number;
    private _length: number;

    constructor() {
        this._count = 0;
        this._length = 0;
    }

    get approvalRecords(): TurbonomicActionApprovalRecord[] {
        return this._approvalRecords;
    }

    set approvalRecords(approvalRecords: TurbonomicActionApprovalRecord[]) {
        this._approvalRecords = approvalRecords;
    }

    /*
     * Allow adding a record to the DB
     *
     * @param cmdbRecord The record being inserted in the DB.
     */
    addRecord(cmdbRecord: TurbonomicActionApprovalRecord) {
        this._approvalRecords.push(cmdbRecord);
    }

    get length() {
        return this._length;
    }

    /*
     * Find the next record depending on the position of the cursor.
     *
     * @return cmdbRecord The record being returned.
     */
    public next(): TurbonomicActionApprovalRecord {
        return this._approvalRecords[this._count++];
    }

    /*
     * Verify whether there is a next record, which the cursor can step into.
     *
     * @param boolean true if there is a next record, which the cursor can step into.
     */
    public hasNext(): boolean {
        return this._count < this._length;
    }

    /*
     * Reset the cursor counter to begin cursor traversal again
     */
    public reset() {
        this._count = 0;
    }
}