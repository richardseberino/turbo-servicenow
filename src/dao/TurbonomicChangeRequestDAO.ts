class TurbonomicChangeRequestDAO {

    private _log: x_turbo_turbonomic.Logger;
    private _mockData: MockData;
    private _actionDAO: TurbonomicActionDAO;

    /*Initialize with mock data to start with. Similar to initializing the Database.*/
    constructor() {
        this._log = new x_turbo_turbonomic.Logger();
        this._mockData = new MockData();
        this._actionDAO = new TurbonomicActionDAO();
    }

    getChangeRequestBySysId(sysId: string) {
        // Invoke mock implementation
        return this._mockData.getChangeRequestByChangeRequestId(sysId);
    }

    /**
     * Cancels the change requests sent in as input if they aren't already in the Closed state.
     *
     * @param changeRequestIds the list of change request IDs.
     */
    cancelChangeRequests (changeRequestIds) {
        // Go through the change requests based on their input IDs and cancel them
        for (var cntr = 0; cntr < changeRequestIds.length; cntr++) {
            var changeRequestId = changeRequestIds[cntr];
            var changeRequestRecord = this.getChangeRequestBySysId(changeRequestId);
            var changeRequestState = changeRequestRecord.getState();

            if (changeRequestState !== TurbonomicChangeRequestState.CLOSED) {
                this._actionDAO.insertIntoImportSet(TurbonomicTableNames.CHANGE_REQUEST_IMPORT_SET,
                    {
                        u_update_sys_id: changeRequestId,
                        u_state: TurbonomicChangeRequestState.CANCELLED,
                        u_work_notes: "The change request was cancelled since the action is no longer present.",
                        u_close_code: TurbonomicChangeRequestState.CLOSE_CODE_UNSUCCESSFUL ,
                        u_close_notes: "Closed as unsuccessful because Turbonomic action is no longer present."
                    },
                    "Canceling change request with ID = " + changeRequestId + " current state = " + changeRequestState);

            } else {
            	this._log.debug("Skipped cancelling change request with ID = " + changeRequestId +
                        " current state = " + changeRequestState);
            }
        }
    }

}
