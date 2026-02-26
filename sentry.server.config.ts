import * as Sentry from "@sentry/nextjs";

Sentry.init({
  dsn: process.env.SENTRY_DSN,
  
  // Performance Monitoring
  tracesSampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 1.0,
  
  // Environment
  environment: process.env.NODE_ENV,
  
  // Release tracking
  release: process.env.NEXT_PUBLIC_APP_VERSION || '1.0.0',
  
  // Only enable in production
  enabled: process.env.NODE_ENV === 'production',
  
  // Server-specific settings
  integrations: [
    Sentry.prismaIntegration(),
  ],
  
  // Ignore certain errors
  ignoreErrors: [
    'ECONNRESET',
    'ETIMEDOUT',
  ],
  
  beforeSend(event) {
    // Add server context
    event.tags = {
      ...event.tags,
      server: 'nextjs',
    };
    return event;
  },
});
