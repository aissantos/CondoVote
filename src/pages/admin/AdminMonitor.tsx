import { useState, useEffect } from 'react';
import { Search, Filter, Download, StopCircle, RefreshCw, Loader2, AlertCircle } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';

type Participant = {
  id: string;
  name: string;
  unit: string;
  checkInTime: string;
  voted: boolean;
  option: string;
};

export default function AdminMonitor() {
  const { profile } = useAuth();
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [activeTopic, setActiveTopic] = useState<{ id: string, title: string } | null>(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  
  const [page, setPage] = useState(1);
  const itemsPerPage = 10;

  useEffect(() => {
    if (profile?.condo_id) {
      fetchMonitorData();

      const changesSub = supabase.channel('monitor-changes')
        .on('postgres_changes', { event: '*', schema: 'public', table: 'votes' }, fetchMonitorData)
        .on('postgres_changes', { event: '*', schema: 'public', table: 'checkins' }, fetchMonitorData)
        .on('postgres_changes', { event: '*', schema: 'public', table: 'topics' }, fetchMonitorData)
        .on('postgres_changes', { event: '*', schema: 'public', table: 'profiles' }, fetchMonitorData)
        .subscribe();

      return () => {
        supabase.removeChannel(changesSub);
      };
    }
  }, [profile?.condo_id]);

  const fetchMonitorData = async () => {
    if (!profile?.condo_id) return;

    try {
      // 1. Get active topic
      const { data: topics } = await supabase
        .from('topics')
        .select('id, title')
        .eq('condo_id', profile.condo_id)
        .eq('status', 'OPEN')
        .order('created_at', { ascending: false })
        .limit(1);

      const topicId = topics && topics.length > 0 ? topics[0].id : null;
      if (topics && topics.length > 0) setActiveTopic(topics[0]);
      else setActiveTopic(null);

      // 2. Get all residents
      const { data: residents } = await supabase
        .from('profiles')
        .select('id, full_name, unit_number, block_number')
        .eq('condo_id', profile.condo_id)
        .eq('role', 'RESIDENT');

      // 3. Get modern checkins
      const { data: checkins } = await supabase
        .from('checkins')
        .select('user_id, created_at')
        .eq('condo_id', profile.condo_id);

      // 4. Get votes for active topic
      let votes: any[] = [];
      if (topicId) {
        const { data: topicVotes } = await supabase
          .from('votes')
          .select('user_id, choice')
          .eq('topic_id', topicId);
        if (topicVotes) votes = topicVotes;
      }

      // 5. Combine data
      if (!residents) return;

      const mergedData = residents.map(resident => {
        const userCheckin = checkins?.find(c => c.user_id === resident.id);
        const userVote = votes.find(v => v.user_id === resident.id);

        let checkInTime = '-';
        if (userCheckin) {
          const date = new Date(userCheckin.created_at);
          checkInTime = date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        }

        return {
          id: resident.id,
          name: resident.full_name || 'Usuário Sem Nome',
          unit: `Blc ${resident.block_number || '?'} - Und ${resident.unit_number || '?'}`,
          checkInTime,
          voted: !!userVote,
          option: userVote ? userVote.choice : '-'
        };
      });

      // Ordenar: Primeiro quem votou, depois check-ins
      mergedData.sort((a, b) => {
        if (a.voted === b.voted) {
            if (a.checkInTime !== '-' && b.checkInTime === '-') return -1;
            if (a.checkInTime === '-' && b.checkInTime !== '-') return 1;
            return 0;
        }
        return a.voted ? -1 : 1;
      });

      setParticipants(mergedData);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const filteredParticipants = participants.filter(p => 
    p.name.toLowerCase().includes(search.toLowerCase()) || 
    p.unit.toLowerCase().includes(search.toLowerCase())
  );

  const totalItems = filteredParticipants.length;
  const totalPages = Math.ceil(totalItems / itemsPerPage) || 1;
  const displayed = filteredParticipants.slice((page-1)*itemsPerPage, page*itemsPerPage);

  const handleStopVoting = async () => {
    if (!activeTopic) return;
    if (!confirm('Deseja realmente ENCERRAR a votação desta pauta?')) return;
    
    // Encerrar a pauta
    const { error } = await supabase
      .from('topics')
      .update({ status: 'CLOSED' })
      .eq('id', activeTopic.id);

    if (error) alert('Erro ao encerrar pauta: ' + error.message);
    else fetchMonitorData();
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Loader2 className="animate-spin text-primary size-10" />
      </div>
    );
  }

  return (
    <div className="space-y-8 max-w-6xl mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold text-slate-900 dark:text-white">Monitor de Votação</h2>
          <p className="text-slate-500 dark:text-slate-400 mt-1">Acompanhe a pauta ativa em tempo real</p>
        </div>
        <div className="flex gap-3">
          {activeTopic && (
            <button onClick={handleStopVoting} className="flex items-center gap-2 px-4 py-2 bg-red-500/10 hover:bg-red-500/20 text-red-600 dark:text-red-400 rounded-lg text-sm font-bold transition-colors">
              <StopCircle size={18} />
              Encerrar Votação
            </button>
          )}
          <button className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-surface-dark border border-slate-200 dark:border-border-dark rounded-lg text-sm font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors">
            <Download size={18} />
            Exportar CSV
          </button>
        </div>
      </div>

      <div className="bg-white dark:bg-surface-dark rounded-2xl border border-slate-200 dark:border-border-dark shadow-sm overflow-hidden flex flex-col">
        <div className="p-4 border-b border-slate-200 dark:border-border-dark flex items-center justify-between bg-slate-50 dark:bg-[#1c2e3e]">
          <div className="flex items-center gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
              <input
                type="text"
                value={search}
                onChange={(e) => { setSearch(e.target.value); setPage(1); }}
                placeholder="Buscar por nome ou unidade..."
                className="pl-10 pr-4 py-2 w-64 rounded-xl border-slate-300 dark:border-slate-700 bg-white dark:bg-surface-dark text-sm text-slate-900 dark:text-white focus:border-primary focus:ring-primary"
              />
            </div>
            <button className="flex items-center gap-2 px-3 py-2 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-lg text-sm font-medium transition-colors">
              <Filter size={16} />
              Filtros
            </button>
          </div>
          <div className="flex items-center gap-2 text-sm text-slate-500 dark:text-slate-400">
            <RefreshCw size={14} className="animate-spin text-primary" />
            <span className={activeTopic ? "text-primary font-medium" : ""}>
              {activeTopic ? `Pauta Ativa: ${activeTopic.title}` : 'Sem Pauta Ativa'}
            </span>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-200 dark:border-border-dark">
                <th className="p-4 text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Nome</th>
                <th className="p-4 text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Unidade</th>
                <th className="p-4 text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Check-in</th>
                <th className="p-4 text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider text-center">Votou?</th>
                <th className="p-4 text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider text-center">Opção</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 dark:divide-border-dark">
              {displayed.length === 0 ? (
                <tr>
                  <td colSpan={5} className="p-8 text-center text-slate-500 dark:text-slate-400">
                    <div className="flex flex-col items-center justify-center gap-2">
                       <AlertCircle size={24} className="text-slate-400" />
                       <p>Nenhum participante encontrado.</p>
                    </div>
                  </td>
                </tr>
              ) : (
                displayed.map((p) => (
                <tr key={p.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                  <td className="p-4 text-sm font-bold text-slate-900 dark:text-white">{p.name}</td>
                  <td className="p-4 text-sm text-slate-600 dark:text-slate-300">{p.unit}</td>
                  <td className="p-4 text-sm font-mono text-slate-500 dark:text-slate-400">{p.checkInTime}</td>
                  <td className="p-4 text-center">
                    <span
                      className={`inline-flex items-center justify-center px-2.5 py-1 rounded-full text-xs font-bold ${
                        p.voted
                          ? 'bg-green-100 text-green-700 dark:bg-green-500/10 dark:text-green-400'
                          : 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-400'
                      }`}
                    >
                      {p.voted ? 'Sim' : 'Não'}
                    </span>
                  </td>
                  <td className="p-4 text-center">
                    <span
                      className={`text-xs font-bold uppercase tracking-wider ${
                        p.option === 'SIM'
                          ? 'text-vote-yes'
                          : p.option === 'NÃO'
                          ? 'text-vote-no'
                          : p.option === 'ABSTENÇÃO'
                          ? 'text-vote-abs'
                          : 'text-slate-400'
                      }`}
                    >
                      {p.option}
                    </span>
                  </td>
                </tr>
              )))}
            </tbody>
          </table>
        </div>
        
        <div className="p-4 border-t border-slate-200 dark:border-border-dark flex items-center justify-between text-sm text-slate-500 dark:text-slate-400 bg-slate-50 dark:bg-[#1c2e3e]">
          <span>Mostrando {displayed.length} de {totalItems} participantes {search ? `(filtrados)` : ''}</span>
          <div className="flex gap-2">
            <button disabled={page === 1} onClick={() => setPage(page - 1)} className="px-3 py-1 border border-slate-300 dark:border-slate-600 rounded hover:bg-slate-200 dark:hover:bg-slate-700 disabled:opacity-50 transition-all">Anterior</button>
            <span className="px-3 py-1">{page} / {totalPages}</span>
            <button disabled={page === totalPages} onClick={() => setPage(page + 1)} className="px-3 py-1 border border-slate-300 dark:border-slate-600 rounded hover:bg-slate-200 dark:hover:bg-slate-700 disabled:opacity-50 transition-all">Próxima</button>
          </div>
        </div>
      </div>
    </div>
  );
}
