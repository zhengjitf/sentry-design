import { SentryEvent, EventType } from './event';
import { Session } from './session';
import { Status } from './status';

export interface Response {
  status: Status;
  event?: SentryEvent | Session;
  type?: EventType;
  reason?: string;
}
