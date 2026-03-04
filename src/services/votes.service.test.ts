import { describe, it, expect, vi, beforeEach } from 'vitest';
import { getExistingVote, castVote } from './votes.service';
import { supabase } from '../lib/supabase';

vi.mock('../lib/supabase', () => {
  const chain = {
    from: vi.fn().mockReturnThis(),
    select: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
    maybeSingle: vi.fn(),
    insert: vi.fn().mockReturnThis(),
    single: vi.fn()
  };
  return { supabase: chain };
});

describe('Votes Service', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('getExistingVote', () => {
    it('retorna os dados do voto quando não houver erro', async () => {
      const mockData = { id: 'vote-1', choice: 'SIM' };
      // @ts-ignore
      supabase.maybeSingle.mockResolvedValueOnce({ data: mockData, error: null });

      const result = await getExistingVote('topic-1', 'user-1');

      expect(supabase.from).toHaveBeenCalledWith('votes');
      expect((supabase as unknown as Record<string, ReturnType<typeof vi.fn>>).eq).toHaveBeenCalledWith('topic_id', 'topic-1');
      expect((supabase as unknown as Record<string, ReturnType<typeof vi.fn>>).eq).toHaveBeenCalledWith('user_id', 'user-1');
      expect(result.data).toEqual(mockData);
      expect(result.error).toBeNull();
    });

    it('retorna erro formatado quando falha', async () => {
      // @ts-ignore
      supabase.maybeSingle.mockResolvedValueOnce({ data: null, error: { code: '111', message: 'DB Error' } });

      const result = await getExistingVote('t1', 'u1');
      expect(result.error).toEqual({ code: '111', message: 'DB Error' });
    });
  });

  describe('castVote', () => {
    it('registra o voto com sucesso', async () => {
      const mockResult = { id: 'vote-new', topic_id: 't2', choice: 'NÃO' };
      // @ts-ignore
      supabase.single.mockResolvedValueOnce({ data: mockResult, error: null });

      const result = await castVote({ topic_id: 't2', user_id: 'u2', choice: 'NÃO' });

      expect((supabase as unknown as Record<string, ReturnType<typeof vi.fn>>).insert).toHaveBeenCalledWith({ topic_id: 't2', user_id: 'u2', choice: 'NÃO' });
      expect(result.data).toEqual(mockResult);
      expect(result.error).toBeNull();
    });

    it('trata graciosamente o erro UNIQUE 23505 (idempotencia)', async () => {
      // O insert falha com 23505
      // @ts-ignore
      supabase.single.mockResolvedValueOnce({
        data: null,
        error: { code: '23505', message: 'duplicate key' }
      });

      // E logo depois o fallback busca o voto existente
      const existingVote = { id: 'vote-old', choice: 'SIM' };
      // @ts-ignore
      supabase.maybeSingle.mockResolvedValueOnce({
        data: existingVote,
        error: null
      });

      const result = await castVote({ topic_id: 't3', user_id: 'u3', choice: 'SIM' });

      expect(result.data).toEqual(existingVote);
      expect(result.error).toBeNull();
    });

    it('repassa erro se inserção falhar por outro motivo', async () => {
      // @ts-ignore
      supabase.single.mockResolvedValueOnce({
        data: null,
        error: { code: '400', message: 'Bad request' }
      });

      const payload = { topic_id: 't4', user_id: 'u4', choice: 'ABSTENÇÃO' };
      const result = await castVote(payload);

      expect(result.error?.code).toBe('400');
      expect(result.error?.context).toEqual(payload);
    });
  });
});
