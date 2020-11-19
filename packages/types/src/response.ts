import { Event, EventType } from './event';
import { Session } from './session';
import { Status } from './status';

/** JSDoc */
export interface SentryResponseData {
  status: Status;
  event?: Event | Session;
  type?: EventType;
  reason?: string;
}
