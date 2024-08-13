/**
 * When creating this script file, make sure "Accessible from" is set to "All application scopes"
 * otherwise sometimes when the field map runs, you will see errors like:
 * WARNING *** WARNING *** Evaluator: java.lang.SecurityException: Illegal access to private script include TurbonomicActionUtils in scope x_turbo_turbonomic being called from scope global
 */
var TurbonomicFieldMapUtil =  (function () {

    TurbonomicFieldMapUtil.prototype.type = 'TurbonomicFieldMapUtil';

    function TurbonomicFieldMapUtil() {
    }

    /**
     * Return the sys_id of an existing record if it exists. When using this in a field map,
     * 'Use source script', 'Coalesce', and 'Coalesce empty fields' must be checked. Also,
     * 'Target field' must be set to Sys ID.
     *
     * @param source The source row in the import set that has source.u_update_sys_id indicating
     *               an update. source.u_update_sys_id is not provided when an insert is needed.
     *
     * @return the sys_id of an existing record if it exists, -1 if not found or source.u_update_sys_id
     */
    TurbonomicFieldMapUtil.prototype.findExistingSysIdFromFieldMap = function(searchTable, source) {
        if(source.u_update_sys_id) {
            var existing = new GlideRecordSecure(searchTable);
            if(existing.get(source.u_update_sys_id)) {
                return existing.sys_id; // indicates update
            } else {
                return -1; // indicates insert
            }
        } else {
            return -1; // indicates insert
        }
    };

    return TurbonomicFieldMapUtil;

}());
