import { supabase } from '../lib/supabase';

import type { Result } from './types';

export type DashboardData = {
  condoInfo: { trade_name: string; invite_code: string | null } | null;
  stats: { participants: number; unitsPresent: number; activePolls: number };
  featuredTopic: { title: string } | null;
  chartData: { name: string; value: number; color: string }[];
  recentUsers: { id?: string; full_name: string | null; block_number: string | null; unit_number: string | null; created_at: string }[];
};

export async function getDashboardData(condoId: string): Promise<Result<DashboardData>> {
  try {
    const [condoR, participantsR, activePollsR, topicsR, recentUsersR] = await Promise.all([
      supabase.from('condos').select('trade_name, invite_code').eq('id', condoId).single(),
      supabase.from('profiles').select('*', { count: 'exact', head: true }).eq('role', 'RESIDENT').eq('condo_id', condoId),
      supabase.from('topics').select('*', { count: 'exact', head: true }).eq('status', 'OPEN').eq('condo_id', condoId),
      supabase.from('topics').select('id, title').eq('condo_id', condoId).order('created_at', { ascending: false }).limit(1),
      supabase.from('profiles').select('full_name, block_number, unit_number, created_at').eq('role', 'RESIDENT').eq('condo_id', condoId).order('created_at', { ascending: false }).limit(5)
    ]);

    let featuredTopic = null;
    let chartData: DashboardData['chartData'] = [];

    if (topicsR.data && topicsR.data.length > 0) {
      featuredTopic = topicsR.data[0];
      const { data: votes } = await supabase.from('votes').select('choice').eq('topic_id', featuredTopic.id);
      
      let sim = 0, nao = 0, abs = 0;
      votes?.forEach(v => {
        if (v.choice === 'SIM') sim++;
        else if (v.choice === 'NÃO') nao++;
        else if (v.choice === 'ABSTENÇÃO') abs++;
      });
      
      chartData = [
        { name: 'SIM', value: sim, color: '#22c55e' },
        { name: 'NÃO', value: nao, color: '#ef4444' },
        { name: 'ABSTENÇÃO', value: abs, color: '#64748b' },
      ];
    }

    return {
      data: {
        condoInfo: condoR.data || null,
        stats: {
          participants: participantsR.count || 0,
          unitsPresent: participantsR.count || 0,
          activePolls: activePollsR.count || 0
        },
        featuredTopic,
        chartData,
        recentUsers: recentUsersR.data || []
      },
      error: null
    };

  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : 'Erro ao carregar dashboard';
    const errorCode = ((err as Record<string, unknown>)?.code as string) || 'UNKNOWN';
    return { data: null, error: { code: errorCode, message: errorMsg } };
  }
}
