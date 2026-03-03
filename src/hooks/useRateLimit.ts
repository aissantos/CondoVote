// src/hooks/useRateLimit.ts
// Hook de rate limiting client-side para prevenir brute force em formulários de autenticação.
// NOTA: Este hook é uma primeira camada de UX — não substitui rate limiting server-side.
// Configurar também em Supabase Dashboard → Authentication → Rate Limits.

import React from 'react';

/**
 * Hook de rate limiting client-side.
 *
 * @param maxAttempts - Número máximo de tentativas permitidas na janela (padrão: 5)
 * @param windowMs - Janela de tempo em ms (padrão: 60s)
 *
 * @example
 * const { check: checkRateLimit, reset } = useRateLimit(5, 60_000);
 *
 * const handleLogin = async (e) => {
 *   const { allowed, waitSeconds } = checkRateLimit();
 *   if (!allowed) {
 *     toast.error(`Muitas tentativas. Aguarde ${waitSeconds}s.`);
 *     return;
 *   }
 *   // ... lógica de login
 * };
 */
export function useRateLimit(maxAttempts = 5, windowMs = 60_000) {
  const attemptsRef = React.useRef<number[]>([]);

  /**
   * Verifica se a ação é permitida.
   * Registra automaticamente a tentativa se for permitida.
   */
  const check = (): { allowed: boolean; waitSeconds: number } => {
    const now = Date.now();

    // Limpar tentativas fora da janela de tempo
    attemptsRef.current = attemptsRef.current.filter(t => now - t < windowMs);

    if (attemptsRef.current.length >= maxAttempts) {
      const oldest = attemptsRef.current[0];
      const waitMs = windowMs - (now - oldest);
      return { allowed: false, waitSeconds: Math.ceil(waitMs / 1000) };
    }

    attemptsRef.current.push(now);
    return { allowed: true, waitSeconds: 0 };
  };

  /** Reseta o contador (ex: após login bem-sucedido) */
  const reset = () => {
    attemptsRef.current = [];
  };

  return { check, reset };
}
