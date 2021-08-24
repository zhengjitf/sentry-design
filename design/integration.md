## 内置 Integration
- `globalhandlers` (browser)
- `trycatch` (browser)
- `breadcrumbs` (browser)
- `dedupe` (browser)
- `linkederrors` (browser)
- `useragent` (browser)
- `functiontostring` (core)
- `inboundfilters` (core)


### globalhandlers（browser）
主要处理全局 `error`、`unhandledrejection` 事件

- 通过 `addInstrumentationHandler -> instrumentError` 绑定 `error` 事件监听
- 处理 `error` 事件，构建其 event 对象

`unhandledrejection` 类似

### trycatch
~~某些异步回调或方法抛出的错误被 `error` 事件捕获后获得的信息不足，需要使用 `try...catch` 对原有的函数进行包裹，已获得更准确的错误对象~~

对以下函数做了处理：
- `setTimeout / setInterval` 的回调函数
- `requestAnimationFrame` 的回调函数
- `XMLHttpRequest` 的 `onload`, `onerror`, `onprogress`, `onreadystatechange` 回调
- 一些 `EventTarget` 对象的 `addEventListener` 和 `removeEventListener` 回调

### breadcrumbs
记录错误产生时的交互路径，主要类型如下：
- `console`
- `dom` (`click` / `typing`)
- `xhr`
- `fetch`
- `history`

步骤：

1. 装载 `integrations/breadcrumbs`，添加以上五种类型对应的处理函数 `handler`，`handler` 内部会调用 `hub.addBreadcrumb()`
2. 拦截五种类型对应的事件或方法（通过 `instrument(type)`），当调用对应的事件或方法时会触发对应类型的 `handlers`（通过 `triggerHandlers(type, payload)`），然后会调用到 `hub.addBreadcrumb()`

### dedupe
重复 `event` 去重，dedupe 装载时（`setupOnce`）会添加一个全局 event 对象处理函数（`addGlobalEventProcessor`），函数内会判断相邻 event 是否相同，可以丢弃

### linkederrors
主要处理 stack 信息？

### useragent
为 `event` 对象添加 `userAgent` 信息

### functiontostring
处理函数序列化，如果是经过 `wrap` 的函数（具体见 `trycatch`），使用原函数（`fn.__sentry_original__`）序列化

### inboundfilters
允许根据错误信息或异常来源 URL 忽略特定的错误，对应配置参数：`ignoreErrors`、`denyUrls`、`allowUrls`
