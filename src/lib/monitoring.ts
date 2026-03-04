// src/lib/monitoring.ts
// P2.1 — Observabilidade com Sentry
// DSN configurado via variável de ambiente VITE_SENTRY_DSN no Vercel/CI.
// Se não houver DSN configurado, o módulo é uma no-op segura.

import * as Sentry from '@sentry/react';

// DSN: variável de ambiente tem prioridade sobre o fallback hardcoded
const DSN =
  (import.meta.env.VITE_SENTRY_DSN as string | undefined) ||
  'https://a88b7686272bb897d648b178a4457438@o4510449042325504.ingest.us.sentry.io/4510985887875072';

const IS_PROD = import.meta.env.PROD;

/** Inicializa o Sentry. Chamar antes do ReactDOM.render em main.tsx */
export function initMonitoring() {
  if (!DSN) return;

  Sentry.init({
    dsn: DSN,
    environment: IS_PROD ? 'production' : 'development',
    sendDefaultPii: true,
    // Tracing — 100% em produção (ajustar para 0.1 em alto volume de tráfego)
    tracesSampleRate: 1.0,
    tracePropagationTargets: [
      'localhost',
      /^https:\/\/ufaqgarxivrfqylifpvg\.supabase\.co/,
      /^https:\/\/condovote\.vercel\.app/,
    ],
    // Session Replay
    replaysSessionSampleRate: 0.1,
    replaysOnErrorSampleRate: 1.0,
    integrations: [
      Sentry.browserTracingIntegration(),
      Sentry.replayIntegration(),
    ],
    // Logs estruturados enviados para o Sentry
    enableLogs: true,
    // Ignora erros de extensões de browser e erros de rede esperados
    ignoreErrors: [
      'ResizeObserver loop limit exceeded',
      'NetworkError',
      'Failed to fetch',
    ],
    beforeSend(event) {
      if (import.meta.env.DEV) return null;
      return event;
    },
  });
}



/** Registra o usuário autenticado no contexto do Sentry */
export function identifyUser(userId: string, role: string) {
  if (!DSN || !IS_PROD) return;
  Sentry.setUser({ id: userId, role });
}

/** Remove a identificação do usuário no logout */
export function clearUser() {
  if (!DSN || !IS_PROD) return;
  Sentry.setUser(null);
}

/** Captura exceção manualmente com contexto adicional */
export function captureError(error: unknown, context?: Record<string, unknown>) {
  if (IS_PROD && DSN) {
    Sentry.withScope((scope) => {
      if (context) scope.setExtras(context);
      Sentry.captureException(error);
    });
  }
  console.error(error);
}
