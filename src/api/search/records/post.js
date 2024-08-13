/**
 * Search for Turbonomic Action Records that exist in ServiceNow.
 *
 * @param request The details including URI path parameters, query parameters, headers, and the request body.
 * @param response Configure the response including setting the HTTP status code, response body, and any response headers.
 */
(function process(/*RESTAPIRequest*/ request, /*RESTAPIResponse*/ response) {
    gs.info('Processing Search Turbonomic Action Records API call...');
    var requestProcessor = new x_turbo_turbonomic.TurbonomicRequestProcessor();
    return requestProcessor.searchActionRecords(request.body.data);
})(request, response);
