import { BrowserTracing } from './browser';
import { registerErrorInstrumentation } from './errors';
import * as TracingIntegrations from './integrations';

const Integrations = { ...TracingIntegrations, BrowserTracing };

export { Integrations };
export { Span } from './span';
export { Transaction } from './transaction';
export {
  registerRequestInstrumentation,
  RequestInstrumentationOptions,
  defaultRequestInstrumentationOptions,
} from './browser';
export { SpanStatus } from './spanstatus';
export { IdleTransaction } from './idletransaction';
export { startTransaction, startIdleTransaction } from './start';
export { extractTraceparentData, hasTracingEnabled, stripUrlQueryAndFragment, TRACEPARENT_REGEXP } from './utils';

// If an error happens globally, we should make sure transaction status is set to error.
registerErrorInstrumentation();
