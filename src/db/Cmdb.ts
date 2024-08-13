/*
* These is mocking the CMDB database in the ServiceNow DB. Comprises of multiple
* records of type  CmdbRecord. Also provides additional DB operations like
* getting the next record and maintaining a cursor count.
*/
class Cmdb {

    private _cmdbRecords: CmdbRecord[] = new Array();
	private _count: number;
	private _length: number;

    constructor() {
    	this._count = 0;
    	this._length = 0;
    }

    get cmdbRecords(): CmdbRecord[] {
        return this._cmdbRecords;
    }

    set cmdbRecords(cmdbRecords: CmdbRecord[]) {
        this._cmdbRecords = cmdbRecords;
        this._length = cmdbRecords.length;
    }

    /*
     * Allow adding a record to the DB
     *
     * @param cmdbRecord The record being inserted in the DB.
     */
    addRecord(cmdbRecord: CmdbRecord) {
    	if (Helper.VALID_TYPES.indexOf(cmdbRecord.type) >= 0) {
			this._cmdbRecords.push(cmdbRecord);
			this._length++;
		}
    }

    get length() {
    	return this._length;
    }

    /*
     * Find the next record depending on the position of the cursor.
     *
     * @return cmdbRecord The record being returned.
     */
    public next(): CmdbRecord {
    	return this._cmdbRecords[this._count++];
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
     * Reset the cusror counter to begin cusror traversal again
     */
    public reset() {
    	this._count = 0;
    }
}