var TurbonomicChangeRequestDAO =  (function () {

    TurbonomicChangeRequestDAO.prototype.type = 'TurbonomicChangeRequestDAO';

    function TurbonomicChangeRequestDAO() {
        this._changeRequestStates = new TurbonomicChangeRequestState();
        this._actionDAO = new TurbonomicActionDAO();
        this._tableNames = new TurbonomicTableNames();
    }

    TurbonomicChangeRequestDAO.prototype.getChangeRequestBySysId = function(sysId) {
        var changeRequest = new GlideRecordSecure('change_request');
        changeRequest.addQuery('sys_id', sysId);
        changeRequest.query();
        if (changeRequest.next()) {
            return changeRequest;
        }

        return null;
    };

    /**
     * Cancels the the change requests sent in as input if they are not already in Closed state.
     *
     * @param changeRequestIds the list of change request IDs.
     */
    TurbonomicChangeRequestDAO.prototype.cancelChangeRequests = function(changeRequestIds) {
        // Go through the change request IDs marked as missed and cancel their change request
        for (var cntr = 0; cntr < changeRequestIds.length; cntr++) {
            var changeRequestId = changeRequestIds[cntr];
            var changeRequestRecord = this.getChangeRequestBySysId(changeRequestId);
            var changeRequestState = changeRequestRecord.state.toString();

            if (changeRequestState !== this._changeRequestStates.CLOSE) {
                this._actionDAO.insertIntoImportSet(this._tableNames.CHANGE_REQUEST_IMPORT_SET,
                    {
                        u_update_sys_id: changeRequestId, // use the sysId to update
                        u_state: this._changeRequestStates.CANCELLED,
                        u_work_notes: "The change request was cancelled since the action is no longer present.",
                        u_close_code: this._changeRequestStates.CLOSE_CODE_UNSUCCESSFUL ,
                        u_close_notes: "Closed as unsuccessful because Turbonomic action is no longer present."
                    },
                    'TurbonomicChangeRequestDAO.cancelChangeRequests() - ' +
                        'Cancelling change request with ID = ' + changeRequestId +
                        ' current state = ' + changeRequestRecord.state);

            } else {
                gs.debug('TurbonomicChangeRequestDAO.cancelChangeRequests() - ' +
                        'Skipped cancelling change request with ID = ' + changeRequestId +
                        ' current state = ' + changeRequestRecord.state);
            }
        }
    };

    return TurbonomicChangeRequestDAO;

}());
