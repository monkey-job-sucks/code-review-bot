const Sentry = require("@sentry/node");
// or use es6 import statements
// import * as Sentry from '@sentry/node';

const Tracing = require("@sentry/tracing");
// or use es6 import statements
// import * as Tracing from '@sentry/tracing';

Sentry.init({
  dsn: "https://c54fb8a8762b445eb2248a1aae16f909@sentry.jotz.eti.br/4",

  // We recommend adjusting this value in production, or using tracesSampler
  // for finer control
  tracesSampleRate: 1.0,
  debug: true,
});

const transaction = Sentry.startTransaction({
  op: "test",
  name: "My First Test Transaction",
});

setTimeout(() => {
  try {
    foo();
  } catch (e) {
    Sentry.captureException(e);
  } finally {
    transaction.finish();
  }
}, 99);
