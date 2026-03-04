import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor, act } from '@testing-library/react';
import { AuthProvider, useAuth } from './AuthContext';
import { supabase } from '../lib/supabase';
import * as monitoringModule from '../lib/monitoring';
import React from 'react';

// Mock do módulo supabase
vi.mock('../lib/supabase', () => ({
  supabase: {
    auth: {
      getSession: vi.fn(),
      onAuthStateChange: vi.fn(),
      signOut: vi.fn(),
    },
    from: vi.fn(),
  },
}));

// Mock do módulo de monitoring para espiar clearUser
vi.mock('../lib/monitoring', () => ({
  initMonitoring: vi.fn(),
  identifyUser: vi.fn(),
  clearUser: vi.fn(),
  captureError: vi.fn(),
}));

describe('AuthContext', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    
    // Default setup for onAuthStateChange to prevent crashing
    (supabase.auth.onAuthStateChange as ReturnType<typeof vi.fn>).mockReturnValue({
      data: { subscription: { unsubscribe: vi.fn() } }
    });
  });

  const wrapper = ({ children }: { children: React.ReactNode }) => (
    <AuthProvider>{children}</AuthProvider>
  );

  it('deve inicializar com estado de loading true e user null', async () => {
    // Simulando atraso no getSession
    let resolveSession: (value: unknown) => void;
    const sessionPromise = new Promise((resolve) => {
      resolveSession = resolve;
    });
    
    (supabase.auth.getSession as ReturnType<typeof vi.fn>).mockReturnValue(sessionPromise);

    const { result } = renderHook(() => useAuth(), { wrapper });

    expect(result.current.loading).toBe(true);
    expect(result.current.user).toBeNull();
    
    // Resolvemos depois para limpar
    resolveSession!({ data: { session: null } });
  });

  it('deve autocompletar dados do perfil quando houver uma sessão de ADMIN', async () => {
    const mockUser = { id: 'user-123' };
    const mockSession = { user: mockUser };
    const mockProfile = { role: 'ADMIN', full_name: 'Thor Odinson', unit_number: '123' };

    // Mock session resolved
    (supabase.auth.getSession as ReturnType<typeof vi.fn>).mockResolvedValue({
      data: { session: mockSession },
    });

    // Mock from('profiles').select().eq().single()
    const mockSingle = vi.fn().mockResolvedValue({ data: mockProfile, error: null });
    const mockEq = vi.fn().mockReturnValue({ single: mockSingle });
    const mockSelect = vi.fn().mockReturnValue({ eq: mockEq });
    (supabase.from as ReturnType<typeof vi.fn>).mockReturnValue({ select: mockSelect });

    const { result } = renderHook(() => useAuth(), { wrapper });

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
      expect(result.current.role).toBe('ADMIN');
      expect(result.current.profile?.full_name).toBe('Thor Odinson');
    });
  });

  it('deve limpar os estados após um signOut', async () => {
    (supabase.auth.getSession as ReturnType<typeof vi.fn>).mockResolvedValue({
      data: { session: null },
    });
    (supabase.auth.signOut as ReturnType<typeof vi.fn>).mockResolvedValue({ error: null });
    
    const { result } = renderHook(() => useAuth(), { wrapper });
    
    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    await act(async () => {
      await result.current.signOut();
    });

    expect(supabase.auth.signOut).toHaveBeenCalledTimes(1);
    expect(result.current.role).toBeNull();
    expect(result.current.profile).toBeNull();
  });

  it('clearUser do Sentry é chamado no signOut', async () => {
    const clearUserSpy = vi.spyOn(monitoringModule, 'clearUser');

    (supabase.auth.getSession as ReturnType<typeof vi.fn>).mockResolvedValue({
      data: { session: null },
    });
    (supabase.auth.signOut as ReturnType<typeof vi.fn>).mockResolvedValue({ error: null });

    const { result } = renderHook(() => useAuth(), { wrapper });

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    await act(async () => {
      await result.current.signOut();
    });

    expect(clearUserSpy).toHaveBeenCalledTimes(1);
  });
});

