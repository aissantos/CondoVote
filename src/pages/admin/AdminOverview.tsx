import { useState, useEffect } from 'react';
import { Users, Building, CheckCircle, PieChart, TrendingUp } from 'lucide-react';
import { PieChart as RechartsPieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';
import { io } from 'socket.io-client';

export default function AdminOverview() {
  const [participants, setParticipants] = useState(142);
  const [unitsPresent, setUnitsPresent] = useState(118);

  useEffect(() => {
    const socket = io();

    socket.on('stats:update', (data) => {
      setParticipants(data.participants);
      setUnitsPresent(data.unitsPresent);
    });

    return () => {
      socket.disconnect();
    };
  }, []);

  const stats = [
    { label: 'Participantes', value: participants.toString(), icon: Users, color: 'text-blue-500', bg: 'bg-blue-500/10' },
    { label: 'Unidades Presentes', value: unitsPresent.toString(), icon: Building, color: 'text-indigo-500', bg: 'bg-indigo-500/10' },
    { label: 'Quórum Atual', value: '65%', icon: CheckCircle, color: 'text-green-500', bg: 'bg-green-500/10' },
    { label: 'Votações Ativas', value: '2', icon: PieChart, color: 'text-orange-500', bg: 'bg-orange-500/10' },
  ];

  const data = [
    { name: 'SIM', value: 85, color: '#22c55e' },
    { name: 'NÃO', value: 25, color: '#ef4444' },
    { name: 'ABSTENÇÃO', value: 8, color: '#64748b' },
  ];

  return (
    <div className="space-y-8 max-w-6xl mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold text-slate-900 dark:text-white">Visão Geral</h2>
          <p className="text-slate-500 dark:text-slate-400 mt-1">Assembleia Geral Extraordinária - 23 Outubro</p>
        </div>
        <button className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-surface-dark border border-slate-200 dark:border-border-dark rounded-lg text-sm font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors">
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
        <div className="bg-white dark:bg-surface-dark p-6 rounded-2xl border border-slate-200 dark:border-border-dark shadow-sm">
          <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-6">Pauta em Destaque: Reforma do Playground</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <RechartsPieChart>
                <Pie
                  data={data}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={80}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {data.map((entry, index) => (
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
          </div>
        </div>

        <div className="bg-white dark:bg-surface-dark p-6 rounded-2xl border border-slate-200 dark:border-border-dark shadow-sm">
          <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-4">Últimos Check-ins</h3>
          <div className="space-y-4">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="flex items-center justify-between p-3 bg-slate-50 dark:bg-background-dark rounded-xl border border-slate-100 dark:border-border-dark">
                <div className="flex items-center gap-3">
                  <div className="size-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold">
                    {i}
                  </div>
                  <div>
                    <p className="text-sm font-bold text-slate-900 dark:text-white">Morador {i}</p>
                    <p className="text-xs text-slate-500 dark:text-slate-400">Bloco A - Apto 10{i}</p>
                  </div>
                </div>
                <span className="text-xs font-medium text-slate-500 dark:text-slate-400">Há {i * 2} min</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
