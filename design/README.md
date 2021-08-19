## 原理

- 主要是监听 `error` 事件和 `unhandledrejection` 事件（`integrations/globalhandlers`）
- 以及拦截一些方法的回调函数，如：`setTimeout`、`setInterval`、`requestAnimationFrame` 以及一批 `EventTarget` 对象的 `addEventListener` 等方法（`integrations/trycatch`），主要是因为这些回调函数抛出的错误被 `error` 事件捕获的信息不全，所以内部使用 `try...catch` 包裹以获取完整错误信息

