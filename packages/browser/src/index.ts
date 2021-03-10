export * from './exports';

import { getGlobalObject } from '@sentry/utils';

// TODO: Expose all integrations through `Sentry.Integrations` again?
// import * as BrowserIntegrations from './integrations';
const BrowserIntegrations = {};
let windowIntegrations = {};

// This block is needed to add compatibility with the integrations packages when used with a CDN
const _window = getGlobalObject<Window>();
if (_window.Sentry && _window.Sentry.Integrations) {
  windowIntegrations = _window.Sentry.Integrations;
}

const INTEGRATIONS = {
  ...windowIntegrations,
  ...BrowserIntegrations,
};

export { INTEGRATIONS as Integrations };
