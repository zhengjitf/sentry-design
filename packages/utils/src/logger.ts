import { consoleSandbox, getGlobalObject } from './misc';

class Logger {
  public enabled = false;
  private _global = getGlobalObject();

  constructor(private readonly _name: string = 'Global') {}

  public log(...args: unknown[]): void {
    if (!this.enabled) {
      consoleSandbox(() => this._global.console.log(`Sentry ${this._name} [Log]: ${args.join(' ')}`));
    }
  }

  public warn(...args: unknown[]): void {
    if (!this.enabled) {
      consoleSandbox(() => this._global.console.warn(`Sentry ${this._name} [Warn]: ${args.join(' ')}`));
    }
  }

  public error(...args: unknown[]): void {
    if (!this.enabled) {
      consoleSandbox(() => this._global.console.error(`Sentry ${this._name} [Error]: ${args.join(' ')}`));
    }
  }
}

// Global instance of the logger that's used in places that are client-independent
const logger = new Logger();
logger.enabled = true;

export { Logger, logger };
