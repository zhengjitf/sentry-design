import { Integration } from '@sentry/types';
import { fill, getFunctionName, getGlobalObject } from '@sentry/utils';

import { wrap } from './wrap';

type TimersWrapOptions = {
  setTimeout?: boolean;
  setInterval?: boolean;
  requestAnimationFrame?: boolean;
};

export class TimersWrap implements Integration {
  public name = this.constructor.name;

  private _options: TimersWrapOptions;

  public constructor(options: TimersWrapOptions = {}) {
    this._options = {
      setTimeout: true,
      setInterval: true,
      requestAnimationFrame: true,
      ...options,
    };
  }

  public install(): void {
    const global = getGlobalObject();

    if (this._options.setTimeout) {
      fill(global, 'setTimeout', this._wrapTimerFunction.bind(this));
    }

    if (this._options.setInterval) {
      fill(global, 'setInterval', this._wrapTimerFunction.bind(this));
    }

    if (this._options.requestAnimationFrame) {
      fill(global, 'requestAnimationFrame', this._wrapTimerFunction.bind(this));
    }
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private _wrapTimerFunction(original: any): (callback: () => void) => any {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return function(this: any, ...args: any[]): any {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
      return original.call(
        this,
        wrap(args[0], {
          data: {
            function: getFunctionName(original),
            handler: getFunctionName(args[0]),
          },
          handled: true,
          type: 'instrument',
        }),
        ...args.slice(0),
      );
    };
  }
}
