import { ClientLike, SentryEvent, Integration } from '@sentry/types';
import { getEventDescription, isMatchingPattern } from '@sentry/utils';

// "Script error." is hard coded into browsers for errors that it can't read.
// this is the result of a script being pulled in from an external domain and CORS.
const DEFAULT_IGNORE_ERRORS = [/^Script error\.?$/, /^Javascript error: Script error\.? on line 0$/];

interface InboundFiltersOptions {
  allowUrls: Array<string | RegExp>;
  denyUrls: Array<string | RegExp>;
  ignoreErrors: Array<string | RegExp>;
}

/** Inbound filters configurable by the user */
export class InboundFilters implements Integration {
  public name = this.constructor.name;

  private _client!: ClientLike;

  public constructor(private readonly _options: Partial<InboundFiltersOptions> = {}) {}

  /**
   * @inheritDoc
   */
  public install(client: ClientLike): void {
    this._client = client;
    client.addEventProcessor((event: SentryEvent) => {
      const options = this._mergeOptions(client.options);
      if (this._shouldDropEvent(event, options)) {
        return null;
      }
      return event;
    });
  }

  private _shouldDropEvent(event: SentryEvent, options: Partial<InboundFiltersOptions>): boolean {
    if (this._isIgnoredError(event, options)) {
      this._client.logger.warn(
        `Event dropped due to being matched by \`ignoreErrors\` option.\nEvent: ${getEventDescription(event)}`,
      );
      return true;
    }

    if (this._isDeniedUrl(event, options)) {
      this._client.logger.warn(
        `Event dropped due to being matched by \`denyUrls\` option.\nEvent: ${getEventDescription(
          event,
        )}.\nUrl: ${this._getEventFilterUrl(event)}`,
      );
      return true;
    }

    if (!this._isAllowedUrl(event, options)) {
      this._client.logger.warn(
        `Event dropped due to not being matched by \`allowUrls\` option.\nEvent: ${getEventDescription(
          event,
        )}.\nUrl: ${this._getEventFilterUrl(event)}`,
      );
      return true;
    }

    return false;
  }

  private _isIgnoredError(event: SentryEvent, options: Partial<InboundFiltersOptions>): boolean {
    if (!options.ignoreErrors || !options.ignoreErrors.length) {
      return false;
    }

    const { ignoreErrors } = options;
    return this._getPossibleEventMessages(event).some(message =>
      ignoreErrors.some(pattern => isMatchingPattern(message, pattern)),
    );
  }

  private _isDeniedUrl(event: SentryEvent, options: Partial<InboundFiltersOptions>): boolean {
    if (!options.denyUrls || !options.denyUrls.length) {
      return false;
    }
    const url = this._getEventFilterUrl(event);
    return !url ? false : options.denyUrls.some(pattern => isMatchingPattern(url, pattern));
  }

  private _isAllowedUrl(event: SentryEvent, options: Partial<InboundFiltersOptions>): boolean {
    if (!options.allowUrls || !options.allowUrls.length) {
      return true;
    }
    const url = this._getEventFilterUrl(event);
    return !url ? true : options.allowUrls.some(pattern => isMatchingPattern(url, pattern));
  }

  private _mergeOptions(clientOptions: Partial<InboundFiltersOptions> = {}): Partial<InboundFiltersOptions> {
    return {
      allowUrls: [...(this._options.allowUrls || []), ...(clientOptions.allowUrls || [])],
      denyUrls: [...(this._options.denyUrls || []), ...(clientOptions.denyUrls || [])],
      ignoreErrors: [
        ...(this._options.ignoreErrors || []),
        ...(clientOptions.ignoreErrors || []),
        ...DEFAULT_IGNORE_ERRORS,
      ],
    };
  }

  private _getPossibleEventMessages(event: SentryEvent): string[] {
    if (event.message) {
      return [event.message];
    }
    if (event.exception) {
      try {
        const { type = '', value = '' } = (event.exception.values && event.exception.values[0]) || {};
        return [`${value}`, `${type}: ${value}`];
      } catch (oO) {
        this._client.logger.error(`Cannot extract message for event ${getEventDescription(event)}`);
        return [];
      }
    }
    return [];
  }

  private _getEventFilterUrl(event: SentryEvent): string | null {
    try {
      if (event.stacktrace) {
        const frames = event.stacktrace.frames;
        return (frames && frames[frames.length - 1].filename) || null;
      }
      if (event.exception) {
        const frames =
          event.exception.values && event.exception.values[0].stacktrace && event.exception.values[0].stacktrace.frames;
        return (frames && frames[frames.length - 1].filename) || null;
      }
      return null;
    } catch (oO) {
      this._client.logger.error(`Cannot extract url for event ${getEventDescription(event)}`);
      return null;
    }
  }
}
