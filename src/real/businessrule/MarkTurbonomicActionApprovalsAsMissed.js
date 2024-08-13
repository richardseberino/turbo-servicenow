(function executeRule(current, previous /*null when async*/) {
        var startTime = new GlideDateTime().getNumericValue();
        var changeRequestDAO = new TurbonomicChangeRequestDAO();
        var actionDAO = new x_turbo_turbonomic.TurbonomicActionDAO();

        var changeRequestIds = actionDAO.markMissedActionApprovals();
        changeRequestDAO.cancelChangeRequests(changeRequestIds);

        var execTime = new GlideDateTime().getNumericValue() - startTime;
        gs.debug('MarkTurbonomicActionApprovalsAsMissed.executeRule() - Total execution time was: ' + execTime + 'msec');
})(current, previous);