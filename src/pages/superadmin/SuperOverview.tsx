import React, { useState, useEffect } from 'react';
import { Server, Activity, Users, Database, Cpu, WifiHigh, CheckCircle2 } from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { supabase } from '../../lib/supabase';

// Componente visual do gráfico baseado em interações (Votos) nos últimos dias
const NetworkChart = () => {
  const [data, setData] = useState<{ time: string; reqs: number }[]>([]);

  useEffect(() => {
    fetchVotingActivity();
  }, []);

  const fetchVotingActivity = async () => {
    // Busca votos para simular tráfego
    const { data: votes } = await supabase
      .from('votes')
      .select('created_at')
      .order('created_at', { ascending: false })
      .limit(100);

    if (!votes || votes.length === 0) {
      setData([{ time: 'Agora', reqs: 0 }]);
      return;
    }

    // Agrupa (simples) para gerar algumas barras
    const grouped = new Map<string, number>();
    votes.forEach(v => {
      const d = new Date(v.created_at);
      const label = `${d.getHours()}h`; // agrupado por hora
      grouped.set(label, (grouped.get(label) || 0) + 1);
    });

    const chartData = Array.from(grouped.entries())
      .map(([time, reqs]) => ({ time, reqs }))
      .reverse(); // cronológico
      
    setData(chartData.length > 0 ? chartData : [{ time: 'Agora', reqs: 0 }]);
  };



  return (
    <div className="h-64 w-full mt-4">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
          <defs>
            <linearGradient id="colorReqs" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#ef4444" stopOpacity={0.3}/>
              <stop offset="95%" stopColor="#ef4444" stopOpacity={0}/>
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="#334155" vertical={false} />
          <XAxis dataKey="time" hide />
          <YAxis stroke="#64748b" tick={{ fill: '#64748b', fontSize: 12 }} />
          <Tooltip 
            contentStyle={{ backgroundColor: '#1e293b', borderColor: '#334155', color: '#fff' }}
            itemStyle={{ color: '#ef4444' }}
            labelStyle={{ display: 'none' }}
          />
          <Area type="monotone" dataKey="reqs" stroke="#ef4444" strokeWidth={2} fillOpacity={1} fill="url(#colorReqs)" isAnimationActive={false} />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
};

export default function SuperOverview() {
  const [uptime] = useState('99.99%');
  const [activeNodes] = useState(1);
  const [totalCondos, setTotalCondos] = useState(0);
  const [totalResidents, setTotalResidents] = useState(0);

  useEffect(() => {
    fetchMetrics();
    
    // Setup simple listener
    const changesSub = supabase.channel('super-metrics-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'condos' }, fetchMetrics)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'profiles' }, fetchMetrics)
      .subscribe();

    return () => {
      supabase.removeChannel(changesSub);
    };
  }, []);

  const fetchMetrics = async () => {
    const { count: condoCount } = await supabase.from('condos').select('*', { count: 'exact', head: true });
    const { count: resCount } = await supabase.from('profiles').select('*', { count: 'exact', head: true }).eq('role', 'RESIDENT');
    
    setTotalCondos(condoCount || 0);
    setTotalResidents(resCount || 0);
  };
  
  return (
    <div className="space-y-8 max-w-7xl mx-auto">
      <div>
        <h2 className="text-3xl font-bold text-white flex items-center gap-3">
          Status da Plataforma
          <span className="flex h-3 w-3 relative">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-3 w-3 bg-green-500"></span>
          </span>
        </h2>
        <p className="text-slate-400 mt-1">Métricas globais de infraestrutura e tráfego analítico.</p>
      </div>

      {/* Grid de Hardware e Node Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-slate-800 border border-slate-700 p-6 rounded-2xl shadow-lg relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
            <Server size={64} className="text-blue-500" />
          </div>
          <div className="flex items-center gap-4 mb-4">
            <div className="p-3 bg-blue-500/10 rounded-xl text-blue-500">
              <Server size={24} />
            </div>
            <div>
              <p className="text-sm font-medium text-slate-400">Nós Ativos</p>
              <h3 className="text-2xl font-bold text-white">{activeNodes} <span className="text-sm font-mono text-slate-500">/ 1</span></h3>
            </div>
          </div>
          <div className="mt-4 flex items-center justify-between text-xs font-mono text-slate-500">
            <span>Região: sa-east-1</span>
            <span className="text-blue-400">Healthy</span>
          </div>
        </div>

        <div className="bg-slate-800 border border-slate-700 p-6 rounded-2xl shadow-lg relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
            <Activity size={64} className="text-green-500" />
          </div>
          <div className="flex items-center gap-4 mb-4">
            <div className="p-3 bg-green-500/10 rounded-xl text-green-500">
              <Activity size={24} />
            </div>
            <div>
              <p className="text-sm font-medium text-slate-400">Uptime System</p>
              <h3 className="text-2xl font-bold text-white">{uptime}</h3>
            </div>
          </div>
          <div className="mt-4 flex items-center justify-between text-xs font-mono text-slate-500">
            <span>Última queda: Nunca</span>
            <span className="text-green-400 flex items-center gap-1"><CheckCircle2 size={12}/> SLA OK</span>
          </div>
        </div>

        <div className="bg-slate-800 border border-slate-700 p-6 rounded-2xl shadow-lg relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
            <Database size={64} className="text-purple-500" />
          </div>
          <div className="flex items-center gap-4 mb-4">
            <div className="p-3 bg-purple-500/10 rounded-xl text-purple-500">
              <Database size={24} />
            </div>
            <div>
              <p className="text-sm font-medium text-slate-400">Database I/O</p>
              <h3 className="text-2xl font-bold text-white">4.2 <span className="text-sm font-mono text-slate-500">MB/s</span></h3>
            </div>
          </div>
          <div className="mt-4 flex items-center justify-between text-xs font-mono text-slate-500">
            <span>Pool: Supabase T2</span>
            <span className="text-amber-400">Load: 14%</span>
          </div>
        </div>

        <div className="bg-slate-800 border border-slate-700 p-6 rounded-2xl shadow-lg relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
            <Cpu size={64} className="text-orange-500" />
          </div>
          <div className="flex items-center gap-4 mb-4">
            <div className="p-3 bg-orange-500/10 rounded-xl text-orange-500">
              <Cpu size={24} />
            </div>
            <div>
              <p className="text-sm font-medium text-slate-400">Uso de CPU</p>
              <h3 className="text-2xl font-bold text-white">18.5%</h3>
            </div>
          </div>
          <div className="mt-4 w-full bg-slate-700 rounded-full h-1.5 dark:bg-slate-700">
            <div className="bg-orange-500 h-1.5 rounded-full" style={{ width: '18.5%' }}></div>
          </div>
        </div>
      </div>

      {/* Gráficos Chart */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="bg-slate-800 border border-slate-700 p-6 rounded-2xl shadow-lg lg:col-span-2 flex flex-col">
          <div className="flex justify-between items-start">
            <div>
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                <WifiHigh className="text-red-500" size={20} />
                Atividade de Votações (Ao Vivo)
              </h3>
              <p className="text-sm text-slate-400 mt-1">Histograma de picos de votos registrados</p>
            </div>
            <span className="px-3 py-1 bg-red-500/10 text-red-500 border border-red-500/20 text-xs font-bold rounded-lg animate-pulse">
              LIVE
            </span>
          </div>
          <div className="flex-1 min-h-[250px]">
            <NetworkChart />
          </div>
        </div>

        <div className="bg-slate-800 border border-slate-700 p-6 rounded-2xl shadow-lg flex flex-col">
          <h3 className="text-lg font-bold text-white flex items-center gap-2 mb-6">
            <Users className="text-indigo-500" size={20} />
            Clusters de Clientes
          </h3>
          
          <div className="space-y-6 flex-1">
            <div className="flex flex-col gap-2">
              <div className="flex justify-between text-sm">
                <span className="text-slate-300 font-medium">Condomínios (Instâncias)</span>
                <span className="text-indigo-400 font-bold">{totalCondos} Registrados</span>
              </div>
              <div className="w-full bg-slate-700 rounded-full h-2">
                <div className="bg-indigo-500 h-2 rounded-full" style={{ width: '10%' }}></div>
              </div>
            </div>

            <div className="flex flex-col gap-2">
              <div className="flex justify-between text-sm">
                <span className="text-slate-300 font-medium">Moradores (Global)</span>
                <span className="text-sky-400 font-bold">{totalResidents} Utilizadores</span>
              </div>
              <div className="w-full bg-slate-700 rounded-full h-2">
                <div className="bg-sky-500 h-2 rounded-full" style={{ width: '5%' }}></div>
              </div>
            </div>

            <div className="mt-auto pt-6 border-t border-slate-700">
              <div className="bg-slate-900/50 p-4 rounded-xl border border-slate-700/50">
                <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Supabase Auth Quota</h4>
                <div className="flex justify-between items-center">
                  <span className="text-white font-mono text-sm">{totalResidents + totalCondos} / 50.000 (MAU)</span>
                  <span className="text-green-500 text-xs">Abaixo do Limite</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
