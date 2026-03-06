import React, { useState } from 'react';
import { Users, Building, CheckCircle, TrendingUp, Loader2, Copy, Check, Ticket, User, UserMinus, FileSignature, AlertCircle } from 'lucide-react';
import { captureError } from '../../lib/monitoring';
import { jsPDF } from 'jspdf';
import html2canvas from 'html2canvas';
import { useAuth } from '../../contexts/AuthContext';
import { useToast } from '../../hooks/useToast';
import { useAssemblyDashboard } from '../../hooks/useAssemblyDashboard';

export default function AdminOverview() {
  const { profile } = useAuth();
  const toast = useToast();
  
  const { data, loading } = useAssemblyDashboard(profile?.condo_id);
  const { condoInfo, activeAssembly, quorum, topics, recentUsers } = data;
  
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

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Loader2 className="animate-spin text-primary size-10" />
      </div>
    );
  }

  const quorumPct = quorum.totalResidents > 0 
    ? Math.round((quorum.present / quorum.totalResidents) * 100) 
    : 0;

  const stats = [
    { label: 'Unidades Presentes', value: quorum.present.toString(), icon: Building, color: 'text-blue-500', bg: 'bg-blue-500/10' },
    { label: 'Titulares', value: quorum.titulares.toString(), icon: User, color: 'text-indigo-500', bg: 'bg-indigo-500/10' },
    { label: 'Inquilinos', value: quorum.inquilinos.toString(), icon: Users, color: 'text-purple-500', bg: 'bg-purple-500/10' },
    { label: 'Procurações', value: quorum.proxies.toString(), icon: FileSignature, color: 'text-amber-500', bg: 'bg-amber-500/10' },
    { label: 'Faltantes', value: quorum.missing.toString(), icon: UserMinus, color: 'text-red-500', bg: 'bg-red-500/10' },
    { label: 'Quórum Atual', value: `${quorumPct}%`, icon: CheckCircle, color: 'text-emerald-500', bg: 'bg-emerald-500/10' },
  ];

  return (
    <div className="space-y-8 max-w-6xl mx-auto" id="dashboard-report">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4" data-html2canvas-ignore="true">
        <div>
          <h2 className="text-3xl font-bold text-slate-900 dark:text-white">Visão Geral</h2>
          {activeAssembly ? (
            <p className="text-slate-500 dark:text-slate-400 mt-1 flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              {activeAssembly.title} — {new Date(activeAssembly.assembly_date).toLocaleDateString()}
            </p>
          ) : (
            <p className="text-slate-500 dark:text-slate-400 mt-1">Nenhuma assembleia ativa no momento.</p>
          )}
        </div>
        <button onClick={handleExportPDF} disabled={!activeAssembly} className="flex items-center justify-center gap-2 px-4 py-2 bg-white dark:bg-surface-dark border border-slate-200 dark:border-border-dark rounded-lg text-sm font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors">
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

      {activeAssembly ? (
        <>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            {stats.map((stat) => {
              const Icon = stat.icon;
              return (
                <div key={stat.label} className="bg-white dark:bg-surface-dark p-4 rounded-xl border border-slate-200 dark:border-border-dark shadow-sm flex flex-col items-center justify-center text-center gap-3">
                  <div className={`size-12 rounded-full flex items-center justify-center ${stat.bg} ${stat.color}`}>
                    <Icon size={24} />
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-slate-900 dark:text-white leading-none">{stat.value}</p>
                    <p className="text-[11px] font-medium text-slate-500 dark:text-slate-400 mt-1 uppercase tracking-wider">{stat.label}</p>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 space-y-4">
              <h3 className="text-lg font-bold text-slate-900 dark:text-white">Pautas da Assembleia</h3>
              {topics.length === 0 ? (
                <div className="bg-white dark:bg-surface-dark p-8 rounded-2xl border border-slate-200 dark:border-border-dark text-center text-slate-500 flex flex-col items-center justify-center gap-3">
                  <AlertCircle size={32} className="text-slate-400" />
                  <p>Nenhuma pauta cadastrada para esta assembleia.</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {topics.map(t => {
                    const total = t.votes.total;
                    const simPct = total > 0 ? Math.round((t.votes.sim / total) * 100) : 0;
                    const naoPct = total > 0 ? Math.round((t.votes.nao / total) * 100) : 0;
                    const absPct = total > 0 ? Math.round((t.votes.abstencao / total) * 100) : 0;

                    return (
                      <div key={t.id} className="bg-white dark:bg-surface-dark p-5 rounded-xl border border-slate-200 dark:border-border-dark shadow-sm flex flex-col gap-4">
                        <div className="flex items-start justify-between gap-3">
                          <h4 className="font-bold text-sm text-slate-900 dark:text-white line-clamp-2 leading-tight" title={t.title}>
                            {t.title}
                          </h4>
                          <span className={`text-[10px] font-bold px-2 py-1 rounded-lg shrink-0 ${
                            t.status === 'OPEN' ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-400' :
                            t.status === 'CLOSED' ? 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-400' :
                            'bg-amber-100 text-amber-700 dark:bg-amber-500/20 dark:text-amber-400'
                          }`}>
                            {t.status === 'OPEN' ? 'ABERTA' : t.status === 'CLOSED' ? 'ENCERRADA' : 'RASCUNHO'}
                          </span>
                        </div>
                        
                        {total === 0 ? (
                          <div className="mt-auto pt-2">
                             <p className="text-xs text-slate-400 italic">Nenhum voto registrado.</p>
                          </div>
                        ) : (
                          <div className="mt-auto space-y-3">
                            <div className="h-2 w-full flex rounded-full overflow-hidden bg-slate-100 dark:bg-slate-800">
                              <div style={{ width: `${simPct}%` }} className="bg-emerald-500" title={`Sim: ${simPct}%`} />
                              <div style={{ width: `${naoPct}%` }} className="bg-red-500" title={`Não: ${naoPct}%`} />
                              <div style={{ width: `${absPct}%` }} className="bg-slate-400" title={`Abstenção: ${absPct}%`} />
                            </div>
                            <div className="flex justify-between text-xs font-semibold">
                               <span className="text-emerald-600 dark:text-emerald-400 shrink-0">Sim: {t.votes.sim} ({simPct}%)</span>
                               <span className="text-red-600 dark:text-red-400 shrink-0">Não: {t.votes.nao} ({naoPct}%)</span>
                               <span className="text-slate-500 dark:text-slate-400 shrink-0">Abs: {t.votes.abstencao} ({absPct}%)</span>
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            <div className="bg-white dark:bg-surface-dark p-6 rounded-2xl border border-slate-200 dark:border-border-dark shadow-sm flex flex-col h-fit">
              <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-4">Últimos Participantes</h3>
              <div className="space-y-4">
                {recentUsers.length > 0 ? recentUsers.map((u, i) => (
                  <div key={i} className="flex items-center justify-between p-3 bg-slate-50 dark:bg-background-dark rounded-xl border border-slate-100 dark:border-border-dark">
                    <div className="flex items-center gap-3">
                      <div className="size-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold shrink-0">
                        {u.full_name?.charAt(0) || 'U'}
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-bold text-slate-900 dark:text-white truncate">{u.full_name || 'Usuário Sem Nome'}</p>
                        <p className="text-xs text-slate-500 dark:text-slate-400 truncate">
                          Bloco {u.block_number || '?'} - Und {u.unit_number || '?'}
                        </p>
                      </div>
                    </div>
                    <span className="text-[10px] font-medium text-slate-400 shrink-0 text-right ms-2">
                      {getFormatTimeAgo(u.created_at)}
                    </span>
                  </div>
                )) : (
                  <p className="text-sm text-slate-500 text-center py-4">Nenhum participante ainda.</p>
                )}
              </div>
            </div>
          </div>
        </>
      ) : (
        <div className="bg-white dark:bg-surface-dark p-12 rounded-2xl border border-slate-200 dark:border-border-dark shadow-sm text-center">
          <div className="size-20 bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center mx-auto mb-6">
            <TrendingUp size={32} className="text-slate-400" />
          </div>
          <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2">Sem atividade no momento</h3>
          <p className="text-slate-500 dark:text-slate-400 max-w-md mx-auto">
            Assim que você abrir uma assembleia, os indicadores de quórum, check-in e votação aparecerão aqui em tempo real.
          </p>
        </div>
      )}
    </div>
  );
}
