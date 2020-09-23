/* eslint-disable max-lines */

/**
 * All interfaces and types sourced from TypeScript 3.7.5's lib.dom.d.ts. Provided here in order to allow dom types to
 * be used in packages like @sentry/tracing, which are themselves used in both @sentry/node and @sentry/browser (and
 * their derivatives), such that @sentry/node users don't face errors.
 */

/** -------------------- */
//  Exported interfaces  //
/** -------------------- */

/**
 * The location (URL) of the object it is linked to. Changes done on it are reflected on the object it relates to.
 * Both the Document and Window interface have such a linked Location, accessible via Document.location and
 * Window.location respectively.
 */
export interface Location {
  /**
   * Returns a DOMStringList object listing the origins of the ancestor browsing contexts, from the parent browsing
   * context to the top-level browsing context.
   */
  readonly ancestorOrigins: DOMStringList;
  /**
   * Returns the Location object's URL's fragment (includes leading "#" if non-empty).
   *
   * Can be set, to navigate to the same URL with a changed fragment (ignores leading "#").
   */
  hash: string;
  /**
   * Returns the Location object's URL's host and port (if different from the default port for the scheme).
   *
   * Can be set, to navigate to the same URL with a changed host and port.
   */
  host: string;
  /**
   * Returns the Location object's URL's host.
   *
   * Can be set, to navigate to the same URL with a changed host.
   */
  hostname: string;
  /**
   * Returns the Location object's URL.
   *
   * Can be set, to navigate to the given URL.
   */
  href: string;

  /**
   * Returns the Location object's URL's origin.
   */
  readonly origin: string;
  /**
   * Returns the Location object's URL's path.
   *
   * Can be set, to navigate to the same URL with a changed path.
   */
  pathname: string;
  /**
   * Returns the Location object's URL's port.
   *
   * Can be set, to navigate to the same URL with a changed port.
   */
  port: string;
  /**
   * Returns the Location object's URL's scheme.
   *
   * Can be set, to navigate to the same URL with a changed scheme.
   */
  protocol: string;
  /**
   * Returns the Location object's URL's query (includes leading "?" if non-empty).
   *
   * Can be set, to navigate to the same URL with a changed query (ignores leading "?").
   */
  search: string;
  /**
   * Navigates to the given URL.
   */
  assign(url: string): void;
  /**
   * Reloads the current page.
   */
  reload(): void;
  /**
   * @deprecated
   */
  reload(forcedReload: boolean): void; // eslint-disable-line @typescript-eslint/unified-signatures
  /**
   * Removes the current page from the session history and navigates to the given URL.
   */
  replace(url: string): void;
  /**
   * Synonym for href
   */
  toString(): string;
}

/**
 * This Fetch API interface represents the response to a request.
 */
export interface Response extends Body {
  readonly headers: Headers;
  readonly ok: boolean;
  readonly redirected: boolean;
  readonly status: number;
  readonly statusText: string;
  readonly trailer: Promise<Headers>;
  readonly type: ResponseType;
  readonly url: string;
  clone(): Response;
  error(): Response;
  redirect(url: string, status?: number): Response;
}

/** ------------------------------------------ */
//  Helper types and interfaces, not exported  //
/** ------------------------------------------ */

type EventListenerOrEventListenerObject = EventListener | EventListenerObject;
type FormDataEntryValue = File | string;
type ReadableStreamReadResult<T> = ReadableStreamReadValueResult<T> | ReadableStreamReadDoneResult<T>;
type ResponseType = 'basic' | 'cors' | 'default' | 'error' | 'opaque' | 'opaqueredirect';

/**
 * A signal object that allows you to communicate with a DOM request (such as a Fetch) and abort it if required via an
 * AbortController object.
 */
interface AbortSignal extends EventTarget {
  /**
   * Returns true if this AbortSignal's AbortController has signaled to abort, and false otherwise.
   */
  readonly aborted: boolean;
  onabort: ((this: AbortSignal, ev: Event) => any) | null;
  addEventListener<K extends keyof AbortSignalEventMap>(
    type: K,
    listener: (this: AbortSignal, ev: AbortSignalEventMap[K]) => any,
    options?: boolean | AddEventListenerOptions,
  ): void;
  addEventListener(
    type: string,
    listener: EventListenerOrEventListenerObject,
    options?: boolean | AddEventListenerOptions,
  ): void;
  removeEventListener<K extends keyof AbortSignalEventMap>(
    type: K,
    listener: (this: AbortSignal, ev: AbortSignalEventMap[K]) => any,
    options?: boolean | EventListenerOptions,
  ): void;
  removeEventListener(
    type: string,
    listener: EventListenerOrEventListenerObject,
    options?: boolean | EventListenerOptions,
  ): void;
}

interface AbortSignalEventMap {
  abort: Event;
}

interface AddEventListenerOptions extends EventListenerOptions {
  once?: boolean;
  passive?: boolean;
}

/**
 * A file-like object of immutable, raw data. Blobs represent data that isn't necessarily in a JavaScript-native
 * format. The File interface is based on Blob, inheriting blob functionality and expanding it to support files on the
 * user's system.
 */
interface Blob {
  readonly size: number;
  readonly type: string;
  arrayBuffer(): Promise<ArrayBuffer>;
  slice(start?: number, end?: number, contentType?: string): Blob;
  stream(): ReadableStream;
  text(): Promise<string>;
}

/**
 * All of the properties Request and Response have in common, to serve as a base for both.
 */
interface Body {
  readonly body: ReadableStream<Uint8Array> | null;
  readonly bodyUsed: boolean;
  arrayBuffer(): Promise<ArrayBuffer>;
  blob(): Promise<Blob>;
  formData(): Promise<FormData>;
  json(): Promise<any>;
  text(): Promise<string>;
}

/**
 * A type returned by some APIs which contains a list of DOMString (strings).
 */
interface DOMStringList {
  [index: number]: string;
  /**
   * Returns the number of strings in strings.
   */
  readonly length: number;
  /**
   * Returns true if strings contains string, and false otherwise.
   */
  contains(string: string): boolean;
  /**
   * Returns the string with index index from strings.
   */
  item(index: number): string | null;
}

/**
 * An event which takes place in the DOM.
 */
interface Event {
  /**
   * Returns true or false depending on how event was initialized. True if event goes through its target's ancestors in reverse tree order, and false otherwise.
   */
  readonly bubbles: boolean;
  cancelBubble: boolean;
  /**
   * Returns true or false depending on how event was initialized. Its return value does not always carry meaning, but true can indicate that part of the operation during which event was dispatched, can be canceled by invoking the preventDefault() method.
   */
  readonly cancelable: boolean;
  /**
   * Returns true or false depending on how event was initialized. True if event invokes listeners past a ShadowRoot node that is the root of its target, and false otherwise.
   */
  readonly composed: boolean;
  /**
   * Returns the object whose event listener's callback is currently being invoked.
   */
  readonly currentTarget: EventTarget | null;
  /**
   * Returns true if preventDefault() was invoked successfully to indicate cancelation, and false otherwise.
   */
  readonly defaultPrevented: boolean;
  /**
   * Returns the event's phase, which is one of NONE, CAPTURING_PHASE, AT_TARGET, and BUBBLING_PHASE.
   */
  readonly eventPhase: number;
  /**
   * Returns true if event was dispatched by the user agent, and false otherwise.
   */
  readonly isTrusted: boolean;
  returnValue: boolean;
  /** @deprecated */
  readonly srcElement: EventTarget | null;
  /**
   * Returns the object to which event is dispatched (its target).
   */
  readonly target: EventTarget | null;
  /**
   * Returns the event's timestamp as the number of milliseconds measured relative to the time origin.
   */
  readonly timeStamp: number;
  /**
   * Returns the type of event, e.g. "click", "hashchange", or "submit".
   */
  readonly type: string;
  /**
   * Returns the invocation target objects of event's path (objects on which listeners will be invoked), except for any nodes in shadow trees of which the shadow root's mode is "closed" that are not reachable from event's currentTarget.
   */
  readonly AT_TARGET: number;
  readonly BUBBLING_PHASE: number;
  readonly CAPTURING_PHASE: number;
  readonly NONE: number;
  composedPath(): EventTarget[];
  initEvent(type: string, bubbles?: boolean, cancelable?: boolean): void;
  /**
   * If invoked when the cancelable attribute value is true, and while executing a listener for the event with passive set to false, signals to the operation that caused event to be dispatched that it needs to be canceled.
   */
  preventDefault(): void;
  /**
   * Invoking this method prevents event from reaching any registered event listeners after the current one finishes running and, when dispatched in a tree, also prevents event from reaching any other objects.
   */
  stopImmediatePropagation(): void;
  /**
   * When dispatched in a tree, invoking this method prevents event from reaching any objects other than the current object.
   */
  stopPropagation(): void;
}

interface EventListener {
  (evt: Event): void;
}

interface EventListenerObject {
  handleEvent(evt: Event): void;
}

interface EventListenerOptions {
  capture?: boolean;
}

/**
 * EventTarget is a DOM interface implemented by objects that can receive events and may have listeners for them.
 */
interface EventTarget {
  /**
   * Appends an event listener for events whose type attribute value is type. The callback argument sets the callback
   * that will be invoked when the event is dispatched.
   *
   * The options argument sets listener-specific options. For compatibility this can be a boolean, in which case the
   * method behaves exactly as if the value was specified as options's capture.
   *
   * When set to true, options's capture prevents callback from being invoked when the event's eventPhase attribute
   * value is BUBBLING_PHASE. When false (or not present), callback will not be invoked when event's eventPhase
   * attribute value is CAPTURING_PHASE. Either way, callback will be invoked if event's eventPhase attribute value is
   * AT_TARGET.
   *
   * When set to true, options's passive indicates that the callback will not cancel the event by invoking
   * preventDefault(). This is used to enable performance optimizations described in § 2.8 Observing event listeners.
   *
   * When set to true, options's once indicates that the callback will only be invoked once after which the event
   * listener will be removed.
   *
   * The event listener is appended to target's event listener list and is not appended if it has the same type,
   * callback, and capture.
   */
  addEventListener(
    type: string,
    listener: EventListenerOrEventListenerObject | null,
    options?: boolean | AddEventListenerOptions,
  ): void;
  /**
   * Dispatches a synthetic event event to target and returns true if either event's cancelable attribute value is false
   * or its preventDefault() method was not invoked, and false otherwise.
   */
  dispatchEvent(event: Event): boolean;
  /**
   * Removes the event listener in target's event listener list with the same type, callback, and options.
   */
  removeEventListener(
    type: string,
    callback: EventListenerOrEventListenerObject | null,
    options?: EventListenerOptions | boolean,
  ): void;
}

/**
 * Provides information about files and allows JavaScript in a web page to access their content.
 */
interface File extends Blob {
  readonly lastModified: number;
  readonly name: string;
}

/**
 * Provides a way to easily construct a set of key/value pairs representing form fields and their values, which can
 * then be easily sent using the XMLHttpRequest.send() method. It uses the same format a form would use if the encoding
 * type were set to "multipart/form-data".
 */
interface FormData {
  append(name: string, value: string | Blob, fileName?: string): void;
  delete(name: string): void;
  get(name: string): FormDataEntryValue | null;
  getAll(name: string): FormDataEntryValue[];
  has(name: string): boolean;
  set(name: string, value: string | Blob, fileName?: string): void;
  forEach(callbackfn: (value: FormDataEntryValue, key: string, parent: FormData) => void, thisArg?: any): void;
}

/**
 * This Fetch API interface allows you to perform various actions on HTTP request and response headers. These actions
 * include retrieving, setting, adding to, and removing. A Headers object has an associated header list, which is
 * initially empty and consists of zero or more name and value pairs. You can add to this using methods like append()
 * (see Examples.) In all methods of this interface, header names are matched by case-insensitive byte sequence.
 */
interface Headers {
  append(name: string, value: string): void;
  delete(name: string): void;
  get(name: string): string | null;
  has(name: string): boolean;
  set(name: string, value: string): void;
  forEach(callbackfn: (value: string, key: string, parent: Headers) => void, thisArg?: any): void;
}

interface PipeOptions {
  preventAbort?: boolean;
  preventCancel?: boolean;
  preventClose?: boolean;
  signal?: AbortSignal;
}

/**
 * This Streams API interface represents a readable stream of byte data. The Fetch API offers a concrete instance of a
 * ReadableStream through the body property of a Response object.
 */
interface ReadableStream<R = any> {
  readonly locked: boolean;
  cancel(reason?: any): Promise<void>;
  getReader(options: { mode: 'byob' }): ReadableStreamBYOBReader;
  getReader(): ReadableStreamDefaultReader<R>;
  pipeThrough<T>(
    { writable, readable }: { writable: WritableStream<R>; readable: ReadableStream<T> },
    options?: PipeOptions,
  ): ReadableStream<T>;
  pipeTo(dest: WritableStream<R>, options?: PipeOptions): Promise<void>;
  tee(): [ReadableStream<R>, ReadableStream<R>];
}

interface ReadableStreamBYOBReader {
  readonly closed: Promise<void>;
  cancel(reason?: any): Promise<void>;
  read<T extends ArrayBufferView>(view: T): Promise<ReadableStreamReadResult<T>>;
  releaseLock(): void;
}

interface ReadableStreamDefaultReader<R = any> {
  readonly closed: Promise<void>;
  cancel(reason?: any): Promise<void>;
  read(): Promise<ReadableStreamReadResult<R>>;
  releaseLock(): void;
}

interface ReadableStreamReadDoneResult<T> {
  done: true;
  value?: T;
}

interface ReadableStreamReadValueResult<T> {
  done: false;
  value: T;
}

/**
 * This Streams API interface provides a standard abstraction for writing streaming data to a destination, known as a
 * sink. This object comes with built-in backpressure and queuing.
 */
interface WritableStream<W = any> {
  readonly locked: boolean;
  abort(reason?: any): Promise<void>;
  getWriter(): WritableStreamDefaultWriter<W>;
}

/**
 * This Streams API interface is the object returned by WritableStream.getWriter() and once created locks the < writer
 * to the WritableStream ensuring that no other streams can write to the underlying sink.
 */
interface WritableStreamDefaultWriter<W = any> {
  readonly closed: Promise<void>;
  readonly desiredSize: number | null;
  readonly ready: Promise<void>;
  abort(reason?: any): Promise<void>;
  close(): Promise<void>;
  releaseLock(): void;
  write(chunk: W): Promise<void>;
}
