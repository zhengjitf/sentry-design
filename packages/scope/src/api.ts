import {
  Breadcrumb,
  CaptureContext,
  Context,
  Event,
  EventHint,
  EventProcessor,
  Extra,
  Extras,
  Primitive,
  ScopeLike,
  SessionContext,
  Severity,
  Span,
  Transaction,
  User,
} from '@sentry/types';

import { getCurrentScope } from './carrier';
import { Session } from './session';

// TODO: Use `ReturnType<ClientLike['captureException']>` instead?

// TODO: Clone should actually return _a clone_, not be a static method
// export function clone(scope?: ScopeLike): ScopeLike {
//   return getCurrentScope().clone(scope)
// }

// TODO: Used in Electron and RN
// export function addScopeListener(callback: (scope: ScopeLike) => void): void {
//   return getCurrentScope().addScopeListener(callback)
// }

export function addEventProcessor(callback: EventProcessor): ScopeLike {
  return getCurrentScope().addEventProcessor(callback);
}

export function setUser(user: User | null): ScopeLike {
  return getCurrentScope().setUser(user);
}

export function getUser(): User | undefined {
  return getCurrentScope().getUser();
}

export function setTags(tags: { [key: string]: Primitive }): ScopeLike {
  return getCurrentScope().setTags(tags);
}

export function setTag(key: string, value: Primitive): ScopeLike {
  return getCurrentScope().setTag(key, value);
}

export function setExtras(extras: Extras): ScopeLike {
  return getCurrentScope().setExtras(extras);
}

export function setExtra(key: string, value: Extra): ScopeLike {
  return getCurrentScope().setExtra(key, value);
}

export function setFingerprint(fingerprint: string[]): ScopeLike {
  return getCurrentScope().setFingerprint(fingerprint);
}

export function setLevel(level: Severity): ScopeLike {
  return getCurrentScope().setLevel(level);
}

export function setTransactionName(name?: string): ScopeLike {
  return getCurrentScope().setTransactionName(name);
}

// export function setTransaction(name?: string): ScopeLike {
//   return getCurrentScope().setTransaction(name)
// }

export function setContext(key: string, value: Context | null): ScopeLike {
  return getCurrentScope().setContext(key, value);
}

export function setSpan(span?: Span): ScopeLike {
  return getCurrentScope().setSpan(span);
}

export function getSpan(): Span | undefined {
  return getCurrentScope().getSpan();
}

export function getTransaction(): Transaction | undefined {
  return getCurrentScope().getTransaction();
}

export function setSession(session?: Session): ScopeLike {
  return getCurrentScope().setSession(session);
}

export function getSession(): SessionContext | undefined {
  return getCurrentScope().getSession();
}

export function update(captureContext?: CaptureContext): ScopeLike {
  return getCurrentScope().update(captureContext);
}

export function clear(): ScopeLike {
  return getCurrentScope().clear();
}

export function addBreadcrumb(breadcrumb: Breadcrumb): ScopeLike {
  return getCurrentScope().addBreadcrumb(breadcrumb);
}

export function clearBreadcrumbs(): ScopeLike {
  return getCurrentScope().clearBreadcrumbs();
}

export function applyToEvent(event: Event, hint?: EventHint): PromiseLike<Event | null> {
  return getCurrentScope().applyToEvent(event, hint);
}
