import React, { useState, useEffect } from 'react';
import { Users, Building, CheckCircle, PieChart, TrendingUp, Loader2 } from 'lucide-react';
import { PieChart as RechartsPieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';
import { supabase } from '../../lib/supabase';
import { jsPDF } from 'jspdf';
import html2canvas from 'html2canvas';

export default function AdminOverview() {
  const [loading, setLoading] = useState(true);
  const [statsData, setStatsData] = useState({
    participants: 0,
    unitsPresent: 0,
    activePolls: 0,
  });

  const [chartData, setChartData] = useState<{name: string, value: number, color: string}[]>([]);
  const [featuredTopic, setFeaturedTopic] = useState<{title: string} | null>(null);
  const [recentUsers, setRecentUsers] = useState<{ id: string, full_name: string | null }[]>([]);

  useEffect(() => {
    fetchDashboardData();
    
    // Set up realtime subscriptions (funcional se ativado no painel do Supabase)
    const profilesSub = supabase.channel('profiles-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'profiles' }, fetchDashboardData)
      .subscribe();
      
    const topicsSub = supabase.channel('topics-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'topics' }, fetchDashboardData)
      .subscribe();
      
    const votesSub = supabase.channel('votes-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'votes' }, fetchDashboardData)
      .subscribe();

    return () => {
      supabase.removeChannel(profilesSub);
      supabase.removeChannel(topicsSub);
      supabase.removeChannel(votesSub);
    };
  }, []);

  const fetchDashboardData = async () => {
    try {
      // Fetch stats
      const { count: participantsCount } = await supabase.from('profiles').select('*', { count: 'exact', head: true }).eq('role', 'RESIDENT');
      const { count: activePollsCount } = await supabase.from('topics').select('*', { count: 'exact', head: true }).eq('status', 'OPEN');
      
      setStatsData({
        participants: participantsCount || 0,
        unitsPresent: participantsCount || 0, // Simplificado
        activePolls: activePollsCount || 0,
      });

      // Fetch featured topic
      const { data: topics } = await supabase.from('topics').select('id, title').order('created_at', { ascending: false }).limit(1);
      
      if (topics && topics.length > 0) {
        setFeaturedTopic(topics[0]);
        // Fetch votes for this topic
        const { data: votes } = await supabase.from('votes').select('choice').eq('topic_id', topics[0].id);
        
        let sim = 0, nao = 0, abs = 0;
        votes?.forEach(v => {
          if (v.choice === 'SIM') sim++;
          else if (v.choice === 'NÃO') nao++;
          else if (v.choice === 'ABSTENÇÃO') abs++;
        });
        
        setChartData([
          { name: 'SIM', value: sim, color: '#22c55e' },
          { name: 'NÃO', value: nao, color: '#ef4444' },
          { name: 'ABSTENÇÃO', value: abs, color: '#64748b' },
        ]);
      } else {
        setFeaturedTopic(null);
        setChartData([]);
      }

      // Fetch recent "check-ins" (usuários recém criados como proxy)
      const { data: recent } = await supabase
        .from('profiles')
        .select('full_name, block_number, unit_number, created_at')
        .eq('role', 'RESIDENT')
        .order('created_at', { ascending: false })
        .limit(5);
      
      if (recent) setRecentUsers(recent);
    } catch (e) {
      console.error("Erro ao carregar dados", e);
    } finally {
      setLoading(false);
    }
  };

  const getFormatTimeAgo = (dateStr: string) => {
    const diff = new Date().getTime() - new Date(dateStr).getTime();
    const minutes = Math.floor(diff / 60000);
    if (minutes < 1) return 'Agora mesmo';
    if (minutes < 60) return `Há ${minutes} min`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `Há ${hours} h`;
    return `Há ${Math.floor(hours/24)} dias`;
  };

  const handleExportPDF = async () => {
    const element = document.getElementById('dashboard-report');
    if (!element) return;
    
    try {
      const canvas = await html2canvas(element, { scale: 2, useCORS: true });
      const imgData = canvas.toDataURL('image/png');
      
      const pdf = new jsPDF('p', 'mm', 'a4');
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = (canvas.height * pdfWidth) / canvas.width;
      
      pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
      pdf.save('relatorio-assembleia.pdf');
    } catch (error) {
      console.error('Erro ao gerar PDF:', error);
      alert('Houve um erro ao gerar o relatório.');
    }
  };

  const stats = [
    { label: 'Participantes', value: statsData.participants.toString(), icon: Users, color: 'text-blue-500', bg: 'bg-blue-500/10' },
    { label: 'Unidades Presentes', value: statsData.unitsPresent.toString(), icon: Building, color: 'text-indigo-500', bg: 'bg-indigo-500/10' },
    { label: 'Quórum Atual', value: '65%', icon: CheckCircle, color: 'text-green-500', bg: 'bg-green-500/10' }, // Fixo por enquanto
    { label: 'Votações Ativas', value: statsData.activePolls.toString(), icon: PieChart, color: 'text-orange-500', bg: 'bg-orange-500/10' },
  ];

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Loader2 className="animate-spin text-primary size-10" />
      </div>
    );
  }

  return (
    <div className="space-y-8 max-w-6xl mx-auto" id="dashboard-report">
      <div className="flex items-center justify-between" data-html2canvas-ignore="true">
        <div>
          <h2 className="text-3xl font-bold text-slate-900 dark:text-white">Visão Geral</h2>
          <p className="text-slate-500 dark:text-slate-400 mt-1">Assembleia Geral Extraordinária - Em Tempo Real</p>
        </div>
        <button onClick={handleExportPDF} className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-surface-dark border border-slate-200 dark:border-border-dark rounded-lg text-sm font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors">
          <TrendingUp size={16} />
          Exportar Relatório
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat) => {
          const Icon = stat.icon;
          return (
            <div key={stat.label} className="bg-white dark:bg-surface-dark p-6 rounded-2xl border border-slate-200 dark:border-border-dark shadow-sm flex items-center gap-4">
              <div className={`size-14 rounded-full flex items-center justify-center ${stat.bg} ${stat.color}`}>
                <Icon size={28} />
              </div>
              <div>
                <p className="text-sm font-medium text-slate-500 dark:text-slate-400">{stat.label}</p>
                <p className="text-3xl font-bold text-slate-900 dark:text-white">{stat.value}</p>
              </div>
            </div>
          );
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white dark:bg-surface-dark p-6 rounded-2xl border border-slate-200 dark:border-border-dark shadow-sm flex flex-col">
          <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-6">
            Pauta em Destaque: {featuredTopic ? featuredTopic.title : 'Nenhuma pauta'}
          </h3>
          <div className="h-64 flex-1">
            {chartData.length > 0 && chartData.some(c => c.value > 0) ? (
              <ResponsiveContainer width="100%" height="100%">
                <RechartsPieChart>
                  <Pie
                    data={chartData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={80}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {chartData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#192633', borderColor: '#233648', color: '#fff' }}
                    itemStyle={{ color: '#fff' }}
                  />
                  <Legend />
                </RechartsPieChart>
              </ResponsiveContainer>
            ) : (
                <div className="h-full flex items-center justify-center text-slate-500">
                    Nenhum voto registrado ainda.
                </div>
            )}
          </div>
        </div>

        <div className="bg-white dark:bg-surface-dark p-6 rounded-2xl border border-slate-200 dark:border-border-dark shadow-sm">
          <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-4">Últimos Participantes</h3>
          <div className="space-y-4">
            {recentUsers.length > 0 ? recentUsers.map((u, i) => (
              <div key={i} className="flex items-center justify-between p-3 bg-slate-50 dark:bg-background-dark rounded-xl border border-slate-100 dark:border-border-dark">
                <div className="flex items-center gap-3">
                  <div className="size-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold">
                    {u.full_name?.charAt(0) || 'U'}
                  </div>
                  <div>
                    <p className="text-sm font-bold text-slate-900 dark:text-white">{u.full_name || 'Usuário Sem Nome'}</p>
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      Bloco {u.block_number || '?'} - Und {u.unit_number || '?'}
                    </p>
                  </div>
                </div>
                <span className="text-xs font-medium text-slate-500 dark:text-slate-400">
                  {getFormatTimeAgo(u.created_at)}
                </span>
              </div>
            )) : (
              <p className="text-sm text-slate-500">Nenhum participante ainda.</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
