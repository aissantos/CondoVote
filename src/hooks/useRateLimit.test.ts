import { renderHook, act } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { useRateLimit } from './useRateLimit';

describe('useRateLimit', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('permite requisições até o limite', () => {
    const { result } = renderHook(() => useRateLimit(3, 1000));

    expect(result.current.check().allowed).toBe(true);
    expect(result.current.check().allowed).toBe(true);
    expect(result.current.check().allowed).toBe(true);
    
    // A quarta tentativa deve falhar
    const failCheck = result.current.check();
    expect(failCheck.allowed).toBe(false);
    expect(failCheck.waitSeconds).toBeGreaterThan(0);
  });

  it('libera após expirar a janela de tempo', () => {
    const { result } = renderHook(() => useRateLimit(2, 5000));

    expect(result.current.check().allowed).toBe(true);
    expect(result.current.check().allowed).toBe(true);
    expect(result.current.check().allowed).toBe(false);

    // Avança o tempo além da janela
    act(() => {
      vi.advanceTimersByTime(5100);
    });

    // Deve permitir novamente
    expect(result.current.check().allowed).toBe(true);
  });

  it('reseta corretamente o limite', () => {
    const { result } = renderHook(() => useRateLimit(1, 10000));

    expect(result.current.check().allowed).toBe(true);
    expect(result.current.check().allowed).toBe(false);

    act(() => {
      result.current.reset();
    });

    expect(result.current.check().allowed).toBe(true);
  });
});
