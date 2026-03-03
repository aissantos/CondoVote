// src/lib/monitoring.ts
// P2.1 — Observabilidade com Sentry
// DSN configurado via variável de ambiente VITE_SENTRY_DSN no Vercel/CI.
// Se não houver DSN configurado, o módulo é uma no-op segura.

import * as Sentry from '@sentry/react';

// DSN: variável de ambiente tem prioridade sobre o fallback hardcoded
const DSN =
  (import.meta.env.VITE_SENTRY_DSN as string | undefined) ||
  'https://3dc47e375bd81fe0c6b8ce201a6f716a@o4510449042325504.ingest.us.sentry.io/4510982976045056';

const IS_PROD = import.meta.env.PROD;

/** Inicializa o Sentry. Chamar antes do ReactDOM.render em main.tsx */
export function initMonitoring() {
  if (!DSN) return; // Garante que DSN existe

  Sentry.init({
    dsn: DSN,
    environment: IS_PROD ? 'production' : 'development',
    sendDefaultPii: true, // Coleta IP e dados de usuário autenticado
    // Amostragem: 10% de sessões normais, 100% em sessões com erro
    tracesSampleRate: IS_PROD ? 0.1 : 0,
    replaysSessionSampleRate: IS_PROD ? 0.05 : 0,
    replaysOnErrorSampleRate: 1.0,
    integrations: [
      Sentry.browserTracingIntegration(),
      Sentry.replayIntegration({ maskAllText: false, blockAllMedia: false }),
    ],
    // Ignora erros de extensões de browser e erros de rede esperados
    ignoreErrors: [
      'ResizeObserver loop limit exceeded',
      'NetworkError',
      'Failed to fetch',
    ],
    beforeSend(event) {
      // Não capturar em desenvolvimento local (sem build de produção)
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
