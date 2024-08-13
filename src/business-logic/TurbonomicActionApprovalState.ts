/**
 * These are the states that track the progress of an action approval in ServiceNow.
 */
enum TurbonomicActionApprovalState {
    PENDING_APPROVAL = 'PENDING_APPROVAL',
    APPROVED = 'APPROVED',
    REJECTED = 'REJECTED',
    WAITING_FOR_EXEC = 'WAITING_FOR_EXEC',
    IN_PROGRESS = 'IN_PROGRESS',
    SUCCEEDED = 'SUCCEEDED',
    FAILED = 'FAILED',
    MISSED = 'MISSED',
    WAITING_FOR_CR_SCHEDULE = 'WAITING_FOR_CR_SCHEDULE'
}