import { Event } from '@sentry/types';

import { BaseClient } from './baseclient';

export class NoopClient extends BaseClient<Record<string, never>> {
  public constructor(options = {}) {
    super(options);
  }

  protected _eventFromException(): PromiseLike<Event> {
    return Promise.resolve({});
  }

  protected _eventFromMessage(): PromiseLike<Event> {
    return Promise.resolve({});
  }
}
