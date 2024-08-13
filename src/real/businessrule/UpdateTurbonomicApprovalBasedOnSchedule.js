(function executeRule(current, previous /*null when async*/) {
    gs.debug('UpdateTurbonomicApprovalBasedOnSchedule.executeRule() has started - The current state of the CR is ' + current.state);
    var actionUtils = new x_turbo_turbonomic.TurbonomicActionUtils();
    actionUtils.updateApprovalBasedOnRequestSchedule(current);
    gs.debug('UpdateTurbonomicApprovalBasedOnSchedule.executeRule() has finished');
})(current, previous);