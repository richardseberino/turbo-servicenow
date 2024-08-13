/**
 * Search for Turbonomic Action Approvals that exist in ServiceNow.
 *
 * @param request The details including URI path parameters, query parameters, headers, and the request body.
 * @param response Configure the response including setting the HTTP status code, response body, and any response headers.
 */
(function process(/*RESTAPIRequest*/ request, /*RESTAPIResponse*/ response) {
    gs.info('Processing Search Turbonomic Action Approvals API call...');
    if (request.body != null && request.body.data != null) {
        var bodyData = request.body.data;
        var queryParams = request.queryParams;

        var addAllApprovalsInTransition = false;
        if (queryParams && queryParams.addAllApprovalsInTransition && queryParams.addAllApprovalsInTransition == 'true') {
            addAllApprovalsInTransition = true;
        }

        var requestProcessor = new x_turbo_turbonomic.TurbonomicRequestProcessor();

        /**
         * The body data is specified in the following format:
         *
         *    {
         *        "oids": ["A1000", "A1001", ...., "A1999"]
         *    }
         */
        return requestProcessor.searchActionApprovals(bodyData, addAllApprovalsInTransition);
    } else {
        gs.debug('Invalid request body/data for Search Turbonomic Action Approvals API call: ' + request.body);
        return {
            succeeded : [],
            failed : []
        };
    }
})(request, response);
