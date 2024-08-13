/**
 * Create Turbonomic Action Approvals in ServiceNow.
 *
 * @param request The details including URI path parameters, query parameters, headers, and the request body.
 * @param response Configure the response including setting the HTTP status code, response body, and any response headers.
 */
(function process(/*RESTAPIRequest*/ request, /*RESTAPIResponse*/ response) {
    gs.info('Processing Create Turbonomic Action Approvals API call...');
    if (request.body != null && request.body.data != null) {
        var bodyData = request.body.data;
        var requestProcessor = new x_turbo_turbonomic.TurbonomicRequestProcessor();
        return requestProcessor.createActionApprovals(bodyData);
    } else {
        gs.debug('Invalid request body/data for Create Turbonomic Action Approvals API call: ' + request.body);
        return {
            succeeded : [],
            failed : []
        };
    }
})(request, response);
