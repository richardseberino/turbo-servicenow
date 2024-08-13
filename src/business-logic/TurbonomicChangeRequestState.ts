/**
 * These are the default states of a change request that come with ServiceNow.
 */
enum TurbonomicChangeRequestState {
    NEW = '-5',
    ASSESS = '-4',
    AUTHORIZE = '-3',
    SCHEDULED = '-2',
    IMPLEMENT = '-1',
    REVIEW = '0',
    CLOSED = '3',
    CANCELLED = '4',
    CLOSE_CODE_SUCCESSFUL = 'successful',
    CLOSE_CODE_UNSUCCESSFUL = 'unsuccessful'
}