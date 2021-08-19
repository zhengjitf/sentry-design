import * as Sentry from '@sentry/browser'
Sentry.init({
  ignoreErrors: ['Cancel'],
  release: '2332',
  // FILL_ME
  dsn: 'https://f56bc34efb624ed1a48e42f7c630bd7c@sentry.io/1810614',
})

const cachedOnError = window.onerror
let errorHandlers = [cachedOnError]

window.onerror = function (...args) {
  for (const handler of errorHandlers) {
    handler.apply(this, args)
  }
}

Object.defineProperty(window, 'onerror', {
  // get() {
  //   return function (...args) {
  //     debugger
  //     for (const handler of errorHandlers) {
  //       handler.apply(this, args)
  //     }
  //   }
  // },
  set(handler) {
    errorHandlers = [cachedOnError, handler]
  }
})

window.onerror = (e) => {
  console.log('override onerror', e)
}

function a() {
  b()
}
function b() {
  c()
}
function c() {
  throw Error('error at c')
}

a()
