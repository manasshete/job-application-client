import * as Sentry from "@sentry/nextjs";

Sentry.init({
  dsn: "https://078a69d8bdf1c8b2f289cd718364ce52@o4510866101501952.ingest.de.sentry.io/4511611397996624",
  tracesSampleRate: process.env.NODE_ENV === "production" ? 0.1 : 1,
  environment: process.env.NODE_ENV || "development",
});
