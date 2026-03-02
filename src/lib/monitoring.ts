// src/lib/monitoring.ts
// P2.1 — Observabilidade com Sentry
// DSN configurado via variável de ambiente VITE_SENTRY_DSN no Vercel/CI.
// Se não houver DSN configurado, o módulo é uma no-op segura.

import * as Sentry from '@sentry/react';

const DSN = import.meta.env.VITE_SENTRY_DSN as string | undefined;
const IS_PROD = import.meta.env.PROD;

/** Inicializa o Sentry. Chamar antes do ReactDOM.render em main.tsx */
export function initMonitoring() {
  if (!DSN || !IS_PROD) return; // Silencioso em dev ou sem DSN

  Sentry.init({
    dsn: DSN,
    environment: 'production',
    // Amostragem: 10% das sessões, 100% dos erros
    tracesSampleRate: 0.1,
    replaysSessionSampleRate: 0.05,
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
      // Não capturar em desenvolvimento
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
