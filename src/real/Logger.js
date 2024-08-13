/**
 * This is a Logger class, which is being mocked for the purposes of unit testing.
 * We should be able to replace this with gs.info in the ServiceNow app.
**/
var Logger = /** @class */ (function () {
    function Logger() {
    }

    Logger.prototype.info = function (output) {
        gs.info(output);
    };
    Logger.prototype.warn = function (output) {
        gs.warn(output);
    };
    Logger.prototype.error = function (output) {
        gs.error(output);
    };
    Logger.prototype.debug = function (output) {
        gs.debug(output);
    };
    return Logger;
}());
