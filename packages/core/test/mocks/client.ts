import { SentryEvent, EventHint, Options, Severity } from '@sentry/types';

import { initAndBind } from '../../src/sdk';
import { BaseClient } from '../../src/baseclient';

export interface TestOptions extends Options {
  test?: boolean;
  mockInstallFailure?: boolean;
  enableSend?: boolean;
}

export class TestClient extends BaseClient<TestOptions> {
  public static instance?: TestClient;

  public constructor(options: TestOptions) {
    super(options);
    TestClient.instance = this;
  }

  protected _eventFromException(_exception: unknown, _hint?: EventHint): PromiseLike<SentryEvent> {
    return Promise.resolve({});
  }

  protected _eventFromMessage(
    _message: string,
    _level: Severity = Severity.Info,
    _hint?: EventHint,
  ): PromiseLike<SentryEvent> {
    return Promise.resolve({});
  }
}

export function init(options: TestOptions): void {
  initAndBind(TestClient, options);
}
