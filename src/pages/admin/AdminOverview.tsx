import React, { useState } from 'react';
import { Users, Building, CheckCircle, PieChart, TrendingUp, Loader2 } from 'lucide-react';
import { PieChart as RechartsPieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';
import { captureError } from '../../lib/monitoring';
import { jsPDF } from 'jspdf';
import html2canvas from 'html2canvas';
import { useAuth } from '../../contexts/AuthContext';
import { Copy, Check, Ticket } from 'lucide-react';
import { useToast } from '../../hooks/useToast';
import { useAssemblyDashboard } from '../../hooks/useAssemblyDashboard';

export default function AdminOverview() {
  const { profile } = useAuth();
  const toast = useToast();
  
  const { data, loading } = useAssemblyDashboard(profile?.condo_id);
  const { condoInfo, stats: statsData, featuredTopic, chartData, recentUsers } = data;
  
  const [copiedCode, setCopiedCode] = useState<string | null>(null);




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
      captureError(error, { component: 'AdminOverview', action: 'exportPDF' });
      toast.error('Houve um erro ao gerar o relatório.');
    }
  };

  const handleCopyCode = (code: string | null) => {
    if(!code) return;
    navigator.clipboard.writeText(code);
    setCopiedCode(code);
    setTimeout(() => setCopiedCode(null), 2000);
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

      {condoInfo?.invite_code && (
        <div className="bg-linear-to-r from-primary to-primary-hover p-1 rounded-2xl shadow-lg">
          <div className="bg-white dark:bg-surface-dark rounded-xl p-6 flex flex-col sm:flex-row items-center justify-between gap-6 border border-primary/20">
            <div className="flex items-center gap-4">
              <div className="size-14 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                <Ticket className="text-primary size-7" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-slate-900 dark:text-white">Código do seu Condomínio</h3>
                <p className="text-sm text-slate-500 dark:text-slate-400">Compartilhe isso no grupo de WhatsApp para que os moradores possam se cadastrar no {condoInfo.trade_name}.</p>
              </div>
            </div>
            
            <div className="flex items-center gap-3">
              <span className="px-6 py-3 bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-white rounded-xl text-3xl font-mono font-bold tracking-widest border border-slate-200 dark:border-slate-700">
                {condoInfo.invite_code}
              </span>
              <button
                onClick={() => handleCopyCode(condoInfo.invite_code)}
                className="p-3 bg-primary text-white hover:bg-primary-hover rounded-xl shadow-md transition-colors"
                title="Copiar código de convite"
              >
                {copiedCode === condoInfo.invite_code ? <Check size={24} /> : <Copy size={24} />}
              </button>
            </div>
          </div>
        </div>
      )}

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
