export { getCarrier, getCurrentClient, getCurrentScope } from './carrier';
export { captureException, captureMessage, captureEvent, close, flush, lastEventId } from './client';
export {
  addBreadcrumb,
  configureScope,
  getSpan,
  getTransaction,
  setContext,
  setExtra,
  setExtras,
  setSpan,
  setTag,
  setTags,
  setUser,
  withScope,
} from './scope';
