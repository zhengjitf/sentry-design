/* eslint-disable @typescript-eslint/no-explicit-any */
import { consoleSandbox, getGlobalObject } from './misc';

// TODO: Implement different loggers for different environments
const global = getGlobalObject<Window | NodeJS.Global>();

/** Prefix for logging strings */
const PREFIX = 'Sentry Logger ';

class Logger {
  private _enabled: boolean;

  public constructor() {
    this._enabled = false;
  }

  public disable(): void {
    this._enabled = false;
  }

  public enable(): void {
    this._enabled = true;
  }

  public log(...args: any[]): void {
    if (!this._enabled) {
      return;
    }
    consoleSandbox(() => {
      global.console.log(`${PREFIX}[Log]: ${args.join(' ')}`);
    });
  }

  public warn(...args: any[]): void {
    if (!this._enabled) {
      return;
    }
    consoleSandbox(() => {
      global.console.warn(`${PREFIX}[Warn]: ${args.join(' ')}`);
    });
  }

  public error(...args: any[]): void {
    if (!this._enabled) {
      return;
    }
    consoleSandbox(() => {
      global.console.error(`${PREFIX}[Error]: ${args.join(' ')}`);
    });
  }
}

// Ensure we only have a single logger instance, even if multiple versions of @sentry/utils are being used
global.__SENTRY__ = global.__SENTRY__ || {};
const logger = (global.__SENTRY__.logger as Logger) || (global.__SENTRY__.logger = new Logger());

export { logger };
