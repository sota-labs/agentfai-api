export enum MessageStatus {
  PROCESSING = 'processing',
  DONE = 'done',
  CANCELLED = 'cancelled',
  DELETED = 'deleted',
  FAILED = 'failed', // message failed send to agent
}

export enum ThreadStatus {
  ACTIVE = 'active',
  HIDDEN = 'hidden',
  DELETED = 'deleted',
}
