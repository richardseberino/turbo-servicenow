/**
 * These are the states tracking progress of an action item in Turbonomic.
 */
enum TurbonomicActionItemState {
    PENDING_ACCEPT = 'PENDING_ACCEPT',
    ACCEPTED = 'ACCEPTED',
    REJECTED = 'REJECTED',
    IN_PROGRESS = 'IN_PROGRESS',
    SUCCEEDED = 'SUCCEEDED',
    FAILED = 'FAILED',
    DISABLED = 'DISABLED',
    RECOMMENDED = 'RECOMMENDED',
    QUEUED = 'QUEUED',
    CLEARED = 'CLEARED'
}