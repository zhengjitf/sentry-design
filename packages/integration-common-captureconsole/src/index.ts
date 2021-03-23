import { ClientLike, Integration, Severity } from '@sentry/types';
import { fill, getGlobalObject, safeJoin } from '@sentry/utils';

type Level = typeof LEVELS[number];
const LEVELS = ['log', 'info', 'warn', 'error', 'debug', 'assert'] as const;

type CaptoreConsoleOptions = {
  levels?: Level[];
};

export class CaptureConsole implements Integration {
  public name = this.constructor.name;

  private _levels: Level[];

  public constructor(options: CaptoreConsoleOptions = {}) {
    this._levels = options.levels ?? ((LEVELS as unknown) as Level[]);
  }

  public install(client: ClientLike): void {
    const global = getGlobalObject();

    if (!('console' in global)) {
      return;
    }

    this._levels.forEach((level: string) => {
      if (!(level in global.console)) {
        return;
      }

      fill(global.console, level, (originalConsoleLevel: () => unknown) => (...args: unknown[]): void => {
        const scope = client.getScope().clone();
        scope.setLevel(Severity.fromString(level));
        scope.setExtra('arguments', args);
        scope.addEventProcessor(event => {
          event.logger = 'console';
          return event;
        });

        let message = safeJoin(args, ' ');
        if (level === 'assert') {
          if (args[0] === false) {
            message = `Assertion failed: ${safeJoin(args.slice(1), ' ') || 'console.assert'}`;
            scope.setExtra('arguments', args.slice(1));
            client.captureMessage(message, { scope });
          }
        } else {
          client.captureMessage(message, { scope });
        }

        // this fails for some browsers. :(
        if (originalConsoleLevel) {
          Function.prototype.apply.call(originalConsoleLevel, global.console, args);
        }
      });
    });
  }
}
