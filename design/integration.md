## 内置 Integration
- `globalhandlers` (browser)
- `breadcrumbs` (browser)
- `dedupe` (browser)
- `linkederrors` (browser)
- `trycatch` (browser)
- `useragent` (browser)
- `functiontostring` (core)
- `inboundfilters` (core)


### globalhandlers（browser）
主要处理 `error`、`unhandledrejection` 事件

- 通过 `addInstrumentationHandler -> instrumentError` 绑定 `error` 事件监听
- 处理 `error` 事件，构建其 event 对象，

