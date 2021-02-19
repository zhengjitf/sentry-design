import { Event, Session } from '@sentry/types';

import { ResponseStatus } from './responseStatus';

export type TransportRequest<T> = {
  body: T;
  type: EventType;
};

export type TransportResponse = {
  status: ResponseStatus;
  reason?: string;
};

export type TransportMakerResponse = {
  body?: string;
  headers?: Record<string, string | null>;
  reason?: string;
  statusCode: number;
};

export type TransportRequestMaker<T> = (request: TransportRequest<T>) => PromiseLike<TransportMakerResponse>;

export enum EventType {
  Error = 'error',
  Session = 'session',
  Transaction = 'transaction',
}

/**
 * Apply SdkInfo (name, version, packages, integrations) to the corresponding event key.
 * Merge with existing data if any.
 **/
// TODO: Restore this functionality
// function enhanceEventWithSdkInfo(event: Event, sdkInfo?: SdkInfo): Event {
//   if (!sdkInfo) {
//     return event;
//   }

//   event.sdk = event.sdk || {
//     name: sdkInfo.name,
//     version: sdkInfo.version,
//   };
//   event.sdk.name = event.sdk.name || sdkInfo.name;
//   event.sdk.version = event.sdk.version || sdkInfo.version;
//   event.sdk.integrations = [...(event.sdk.integrations || []), ...(sdkInfo.integrations || [])];
//   event.sdk.packages = [...(event.sdk.packages || []), ...(sdkInfo.packages || [])];
//   return event;
// }

export function sessionToTransportRequest(session: Session): TransportRequest<string> {
  const envelopeHeaders = JSON.stringify({
    sent_at: new Date().toISOString(),
  });
  const itemHeaders = JSON.stringify({
    type: 'session',
  });

  return {
    body: `${envelopeHeaders}\n${itemHeaders}\n${JSON.stringify(session)}`,
    type: EventType.Session,
  };
}
export function eventToTransportRequest(event: Event): TransportRequest<string> {
  const req = {
    body: JSON.stringify(event),
    type: event.type === 'transaction' ? EventType.Transaction : EventType.Error,
  };

  // https://develop.sentry.dev/sdk/envelopes/
  const envelopeHeaders = JSON.stringify({
    event_id: event.event_id,
    sent_at: new Date().toISOString(),
  });
  const itemHeaders = JSON.stringify({
    type: event.type || 'event',

    // TODO: Right now, sampleRate may or may not be defined (it won't be in the cases of inheritance and
    // explicitly-set sampling decisions). Are we good with that?
    // TODO: Attach sample rates
    // sample_rates: [{ id: samplingMethod, rate: sampleRate }],

    // The content-type is assumed to be 'application/json' and not part of
    // the current spec for transaction items, so we don't bloat the request
    // body with it.
    //
    // content_type: 'application/json',
    //
    // The length is optional. It must be the number of bytes in req.Body
    // encoded as UTF-8. Since the server can figure this out and would
    // otherwise refuse events that report the length incorrectly, we decided
    // not to send the length to avoid problems related to reporting the wrong
    // size and to reduce request body size.
    //
    // length: new TextEncoder().encode(req.body).length,
  });
  // The trailing newline is optional. We intentionally don't send it to avoid
  // sending unnecessary bytes.
  //
  // const envelope = `${envelopeHeaders}\n${itemHeaders}\n${req.body}\n`;
  const envelope = `${envelopeHeaders}\n${itemHeaders}\n${req.body}`;
  req.body = envelope;

  return req;
}
