import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor, act } from '@testing-library/react';
import { AuthProvider, useAuth } from './AuthContext';
import { supabase } from '../lib/supabase';
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

describe('AuthContext', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    
    // Default setup for onAuthStateChange to prevent crashing
    (supabase.auth.onAuthStateChange as any).mockReturnValue({
      data: { subscription: { unsubscribe: vi.fn() } }
    });
  });

  const wrapper = ({ children }: { children: React.ReactNode }) => (
    <AuthProvider>{children}</AuthProvider>
  );

  it('deve inicializar com estado de loading true e user null', async () => {
    // Simulando atraso no getSession
    let resolveSession: any;
    const sessionPromise = new Promise((resolve) => {
      resolveSession = resolve;
    });
    
    (supabase.auth.getSession as any).mockReturnValue(sessionPromise);

    const { result } = renderHook(() => useAuth(), { wrapper });

    expect(result.current.loading).toBe(true);
    expect(result.current.user).toBeNull();
    
    // Resolvemos depois para limpar
    resolveSession({ data: { session: null } });
  });

  it('deve autocompletar dados do perfil quando houver uma sessão de ADMIN', async () => {
    const mockUser = { id: 'user-123' };
    const mockSession = { user: mockUser };
    const mockProfile = { role: 'ADMIN', full_name: 'Thor Odinson', unit_number: '123' };

    // Mock session resolved
    (supabase.auth.getSession as any).mockResolvedValue({
      data: { session: mockSession },
    });

    // Mock from('profiles').select().eq().single()
    const mockSingle = vi.fn().mockResolvedValue({ data: mockProfile, error: null });
    const mockEq = vi.fn().mockReturnValue({ single: mockSingle });
    const mockSelect = vi.fn().mockReturnValue({ eq: mockEq });
    (supabase.from as any).mockReturnValue({ select: mockSelect });

    const { result } = renderHook(() => useAuth(), { wrapper });

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
      expect(result.current.role).toBe('ADMIN');
      expect(result.current.profile?.full_name).toBe('Thor Odinson');
    });
  });

  it('deve limpar os estados após um signOut', async () => {
    (supabase.auth.getSession as any).mockResolvedValue({
      data: { session: null },
    });
    (supabase.auth.signOut as any).mockResolvedValue({ error: null });
    
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
});
