import { supabase } from '../lib/supabase';

import type { Result } from './types';

export type DashboardData = {
  condoInfo: { trade_name: string; invite_code: string | null } | null;
  activeAssembly: {
    id: string;
    title: string;
    assembly_date: string;
    format: string | null;
  } | null;
  quorum: {
    totalResidents: number;
    present: number;
    titulares: number;
    inquilinos: number;
    proxies: number;
    missing: number;
  };
  topics: {
    id: string;
    title: string;
    status: string;
    votes: { sim: number; nao: number; abstencao: number; total: number };
  }[];
  recentUsers: { id?: string; full_name: string | null; block_number: string | null; unit_number: string | null; created_at: string }[];
  pastAssemblies: {
    id: string;
    title: string;
    assembly_date: string;
    format: string | null;
    status: string;
  }[];
};

export async function getDashboardData(condoId: string): Promise<Result<DashboardData>> {
  try {
    const defaultData: DashboardData = {
      condoInfo: null,
      activeAssembly: null,
      quorum: { totalResidents: 0, present: 0, titulares: 0, inquilinos: 0, proxies: 0, missing: 0 },
      topics: [],
      recentUsers: [],
      pastAssemblies: []
    };

    const [{ data: condoR }, { data: recentUsersR }, { count: totalResidentsR }, { data: pastAssembliesR }] = await Promise.all([
      supabase.from('condos').select('trade_name, invite_code').eq('id', condoId).single(),
      supabase.from('profiles').select('full_name, block_number, unit_number, created_at').eq('role', 'RESIDENT').eq('condo_id', condoId).order('created_at', { ascending: false }).limit(5),
      supabase.from('profiles').select('id', { count: 'exact', head: true }).eq('role', 'RESIDENT').eq('condo_id', condoId),
      supabase.from('assemblies').select('id, title, assembly_date, format, status').eq('condo_id', condoId).neq('status', 'OPEN').order('assembly_date', { ascending: false }).limit(5)
    ]);
    
    defaultData.condoInfo = condoR || null;
    defaultData.recentUsers = recentUsersR || [];
    defaultData.pastAssemblies = pastAssembliesR || [];
    
    const totalResidents = totalResidentsR || 0;
    defaultData.quorum.totalResidents = totalResidents;
    defaultData.quorum.missing = totalResidents; 

    // Busca a assembleia ativa (OPEN) do condomínio
    const { data: activeAssembly } = await supabase
      .from('assemblies')
      .select('id, title, assembly_date, format')
      .eq('condo_id', condoId)
      .eq('status', 'OPEN')
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    if (!activeAssembly) {
      return { data: defaultData, error: null };
    }

    defaultData.activeAssembly = activeAssembly;

    // Busca os check-ins da assembleia ativa juntando com a tabela profiles para obter o tipo de residente
    const { data: checkins } = await supabase
      .from('checkins')
      .select(`
        proxy_document_url,
        profiles!checkins_user_id_fkey ( resident_type )
      `)
      .eq('assembly_id', activeAssembly.id);

    let titulares = 0;
    let inquilinos = 0;
    let proxies = 0;

    checkins?.forEach(c => {
      // Se houver documento de procuração, conta como procuração, independentemente do tipo da pessoa que fez o upload
      if (c.proxy_document_url) {
        proxies++;
      } else {
        const prof = Array.isArray(c.profiles) ? c.profiles[0] : c.profiles;
        if (prof?.resident_type === 'TITULAR') titulares++;
        else if (prof?.resident_type === 'INQUILINO') inquilinos++;
      }
    });

    const present = (checkins?.length || 0);
    defaultData.quorum = {
      totalResidents,
      present,
      titulares,
      inquilinos,
      proxies,
      missing: Math.max(0, totalResidents - present)
    };

    // Busca todas as pautas vinculadas a esta assembleia usando nossa View pré-agregada
    const { data: topicsSummary } = await supabase
      .from('topic_vote_summary')
      .select('*')
      .eq('assembly_id', activeAssembly.id)
      .order('created_at', { ascending: true });

    if (topicsSummary) {
      defaultData.topics = topicsSummary.map(t => ({
        id: t.topic_id || '',
        title: t.title || 'Pauta',
        status: t.status || 'DRAFT',
        votes: {
          sim: t.votes_sim || 0,
          nao: t.votes_nao || 0,
          abstencao: t.votes_abstencao || 0,
          total: t.total_votes || 0
        }
      }));
    }

    return { data: defaultData, error: null };

  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : 'Erro ao carregar dashboard';
    const errorCode = ((err as Record<string, unknown>)?.code as string) || 'UNKNOWN';
    return { data: null, error: { code: errorCode, message: errorMsg } };
  }
}
