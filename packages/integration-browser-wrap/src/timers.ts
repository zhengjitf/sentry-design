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

  private _setTimeout: boolean;
  private _setInterval: boolean;
  private _requestAnimationFrame: boolean;

  public constructor({ setTimeout, setInterval, requestAnimationFrame }: TimersWrapOptions = {}) {
    this._setTimeout = setTimeout ?? true;
    this._setInterval = setInterval ?? true;
    this._requestAnimationFrame = requestAnimationFrame ?? true;
  }

  public install(): void {
    const global = getGlobalObject();

    if (this._setTimeout) {
      fill(global, 'setTimeout', this._wrapTimerFunction.bind(this));
    }

    if (this._setInterval) {
      fill(global, 'setInterval', this._wrapTimerFunction.bind(this));
    }

    if (this._requestAnimationFrame) {
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
