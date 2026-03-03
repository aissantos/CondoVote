// src/pages/resident/Voting.test.tsx
// NOTA: O componente Voting.tsx tem early returns condicionais antes de useCallback,
// o que é uma violação de Rules of Hooks que causa "Rendered more hooks" em alguns cenários.
// Os testes abaixo testam diretamente os fluxos de negócio via mocks globais (vi.mock no topo).

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';

// --- Mocks globais (devem ser declarados antes de qualquer import do módulo alvo) ---

const mockNavigate = vi.fn();

vi.mock('react-router-dom', async (importOriginal) => {
  const actual = await importOriginal<typeof import('react-router-dom')>();
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

vi.mock('../../lib/supabase', () => ({
  supabase: {
    from: vi.fn(),
    auth: { getUser: vi.fn() },
  },
}));

vi.mock('../../contexts/AuthContext', () => ({
  useAuth: () => ({ user: { id: 'user-123' }, profile: { condo_id: 'condo-abc' } }),
}));

vi.mock('../../hooks/useToast', () => ({
  useToast: () => ({
    success: vi.fn(),
    error: vi.fn(),
    warning: vi.fn(),
  }),
}));

// --- Importar após os mocks ---
import Voting from './Voting';
import { supabase } from '../../lib/supabase';

// --- Helpers ---

const mockTopic = {
  id: 'topic-abc',
  title: 'Aprovação do orçamento 2026',
  description: 'Votação sobre o orçamento anual.',
};

const renderVoting = (topic = mockTopic) =>
  render(
    <MemoryRouter initialEntries={[{ pathname: '/voting', state: { topic } }]}>
      <Voting />
    </MemoryRouter>
  );

type MockChain = {
  select: ReturnType<typeof vi.fn>;
  eq: ReturnType<typeof vi.fn>;
  maybeSingle: ReturnType<typeof vi.fn>;
  single: ReturnType<typeof vi.fn>;
  insert: ReturnType<typeof vi.fn>;
};

const mockSupabaseChain = (voteExists: boolean, insertError: unknown = null): MockChain => {
  const chain: MockChain = {
    select: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
    maybeSingle: vi.fn().mockResolvedValue({
      data: voteExists ? { id: 'vote-existing', choice: 'SIM' } : null,
      error: null,
    }),
    single: vi.fn().mockResolvedValue({ data: { full_name: 'Teste', unit_number: '101', block_number: 'A' }, error: null }),
    insert: vi.fn().mockResolvedValue({ error: insertError }),
  };
  (supabase.from as ReturnType<typeof vi.fn>).mockReturnValue(chain);
  return chain;
};

// --- Testes ---

describe('Voting', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('redireciona para /success imediatamente se usuário já votou', async () => {
    mockSupabaseChain(true);
    renderVoting();

    await waitFor(() => {
      expect(mockNavigate).toHaveBeenCalledWith('/success', { replace: true });
    });
  });

  it('exibe opções de voto ao carregar sem voto prévio', async () => {
    mockSupabaseChain(false);
    renderVoting();

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /votar sim/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /votar não/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /votar abstenção/i })).toBeInTheDocument();
    });
  });

  it('insere voto SIM com topic_id correta', async () => {
    const user = userEvent.setup();
    const chain = mockSupabaseChain(false);
    renderVoting();

    await waitFor(() => screen.getByRole('button', { name: /votar sim/i }));
    await user.click(screen.getByRole('button', { name: /votar sim/i }));

    await waitFor(() => {
      expect(chain.insert).toHaveBeenCalledWith(
        expect.arrayContaining([
          expect.objectContaining({ choice: 'SIM', topic_id: 'topic-abc' }),
        ])
      );
    });
  });

  it('botões de voto possuem aria-label e aria-pressed', async () => {
    mockSupabaseChain(false);
    renderVoting();

    await waitFor(() => screen.getByRole('button', { name: /votar sim/i }));

    const simButton = screen.getByRole('button', { name: /votar sim/i });
    expect(simButton).toHaveAttribute('aria-label');
    expect(simButton).toHaveAttribute('aria-pressed');
  });

  it('exibe tela de "Nenhuma pauta selecionada" quando state.topic é undefined', () => {
    render(
      <MemoryRouter initialEntries={[{ pathname: '/voting', state: {} }]}>
        <Voting />
      </MemoryRouter>
    );
    expect(screen.getByText(/nenhuma pauta selecionada/i)).toBeInTheDocument();
  });
});
