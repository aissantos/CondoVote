import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { getDashboardData, type DashboardData } from '../services/assemblies.service';
import type { AppError } from '../services/types';

export function useAssemblyDashboard(condoId: string | undefined) {
  const [data, setData] = useState<DashboardData>({
    condoInfo: null,
    activeAssembly: null,
    quorum: { totalResidents: 0, present: 0, titulares: 0, inquilinos: 0, proxies: 0, missing: 0 },
    topics: [],
    recentUsers: [],
    pastAssemblies: []
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<AppError | null>(null);

  useEffect(() => {
    if (!condoId) return;
    let cancelled = false;

    const load = async () => {
      setLoading(true);
      const result = await getDashboardData(condoId);
      if (cancelled) return;
      if (result.error) setError(result.error);
      else setData(result.data);
      setLoading(false);
    };

    load();

    const profilesSub = supabase.channel('profiles-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'profiles' }, load)
      .subscribe();
      
    const topicsSub = supabase.channel('topics-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'topics' }, load)
      .subscribe();
      
    const votesSub = supabase.channel('votes-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'votes' }, load)
      .subscribe();

    const checkinsSub = supabase.channel('checkins-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'checkins' }, load)
      .subscribe();

    const assembliesSub = supabase.channel('assemblies-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'assemblies' }, load)
      .subscribe();

    return () => {
      cancelled = true;
      supabase.removeChannel(profilesSub);
      supabase.removeChannel(topicsSub);
      supabase.removeChannel(votesSub);
      supabase.removeChannel(checkinsSub);
      supabase.removeChannel(assembliesSub);
    };
  }, [condoId]);

  return { data, loading, error };
}
