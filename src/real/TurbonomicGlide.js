/**
 * Script so that we can mock glide records in unit tests.
 */
var TurbonomicGlide = (function () {

    TurbonomicGlide.prototype.type = 'TurbonomicGlide';

    function TurbonomicGlide() {
    }

    /**
     * Creates an object for querying and modifying the provided table.
     */
    TurbonomicGlide.prototype.accessTable = function(table) {
        // In unit testing javascript replacing the result from
        // new GlideRecordSecure('cmdb_ci_vm_instance') is difficult.
        // It is much easier if we put it in this script, and pass in
        // this object to production code, and a mock object
        // in unit testing code.
        return new GlideRecordSecure(table);
    };

    return TurbonomicGlide;
}());
