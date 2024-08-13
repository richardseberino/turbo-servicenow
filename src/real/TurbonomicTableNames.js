var TurbonomicTableNames =  (function () {

    TurbonomicTableNames.prototype.type = 'TurbonomicTableNames';

    function TurbonomicTableNames() {
    }

    /**
     * These are the Import Set Tables.
     */
    TurbonomicTableNames.prototype.ACTION_APPROVAL_IMPORT_SET = 'x_turbo_turbonomic_ws_action_approval';
    TurbonomicTableNames.prototype.ACTION_RECORD_IMPORT_SET = 'x_turbo_turbonomic_ws_action_record';
    TurbonomicTableNames.prototype.CHANGE_REQUEST_IMPORT_SET = 'x_turbo_turbonomic_ws_change_request';
    TurbonomicTableNames.prototype.ENTITY_IMPORT_SET = 'x_turbo_turbonomic_ws_entity';
    TurbonomicTableNames.prototype.INSTANCE_IMPORT_SET = 'x_turbo_turbonomic_ws_instance';

    /**
     * These are the ServiceNow Tables we use.
     */
    TurbonomicTableNames.prototype.CHANGE_REQUEST = 'change_request';

    return TurbonomicTableNames;

}());
