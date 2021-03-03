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
  Session,
  SessionContext,
  Severity,
  Span,
  Transaction,
  User,
} from '@sentry/types';

import { getCurrentScope } from './carrier';

// TODO: Use `ReturnType<ClientLike['captureException']>` instead?

// TODO: Used in Electron and RN
// export function addScopeListener(callback: (scope: ScopeLike) => void): void {
//   return getCurrentScope().addScopeListener(callback)
// }

export function clone(): ScopeLike | undefined {
  return getCurrentScope()?.clone();
}

// TODO: Should we return void?
export function addEventProcessor(callback: EventProcessor): ScopeLike | undefined {
  return getCurrentScope()?.addEventProcessor(callback);
}

export function setUser(user: User | null): ScopeLike | undefined {
  return getCurrentScope()?.setUser(user);
}

export function getUser(): User | undefined {
  return getCurrentScope()?.getUser();
}

export function setTags(tags: { [key: string]: Primitive }): ScopeLike | undefined {
  return getCurrentScope()?.setTags(tags);
}

export function setTag(key: string, value: Primitive): ScopeLike | undefined {
  return getCurrentScope()?.setTag(key, value);
}

export function setExtras(extras: Extras): ScopeLike | undefined {
  return getCurrentScope()?.setExtras(extras);
}

export function setExtra(key: string, value: Extra): ScopeLike | undefined {
  return getCurrentScope()?.setExtra(key, value);
}

export function setFingerprint(fingerprint: string[]): ScopeLike | undefined {
  return getCurrentScope()?.setFingerprint(fingerprint);
}

export function setLevel(level: Severity): ScopeLike | undefined {
  return getCurrentScope()?.setLevel(level);
}

export function setTransactionName(name?: string): ScopeLike | undefined {
  return getCurrentScope()?.setTransactionName(name);
}

export function setContext(key: string, value: Context | null): ScopeLike | undefined {
  return getCurrentScope()?.setContext(key, value);
}

export function setSpan(span?: Span): ScopeLike | undefined {
  return getCurrentScope()?.setSpan(span);
}

export function getSpan(): Span | undefined {
  return getCurrentScope()?.getSpan();
}

export function getTransaction(): Transaction | undefined {
  return getCurrentScope()?.getTransaction();
}

export function setSession(session?: Session): ScopeLike | undefined {
  return getCurrentScope()?.setSession(session);
}

export function getSession(): SessionContext | undefined {
  return getCurrentScope()?.getSession();
}

export function update(captureContext?: CaptureContext): ScopeLike | undefined {
  return getCurrentScope()?.update(captureContext);
}

export function clear(): ScopeLike | undefined {
  return getCurrentScope()?.clear();
}

export function addBreadcrumb(breadcrumb: Breadcrumb): ScopeLike | undefined {
  return getCurrentScope()?.addBreadcrumb(breadcrumb);
}

export function clearBreadcrumbs(): ScopeLike | undefined {
  return getCurrentScope()?.clearBreadcrumbs();
}

export function applyToEvent(event: Event, hint?: EventHint): PromiseLike<Event | null> {
  return getCurrentScope()?.applyToEvent(event, hint) || Promise.resolve(event);
}
