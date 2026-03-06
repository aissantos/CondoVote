import React, { useState } from 'react';
import { Copy, Check, ChevronDown, CalendarDays, Loader2, TrendingUp } from 'lucide-react';
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
  const { condoInfo, activeAssembly, quorum, topics, recentUsers, pastAssemblies } = data;
  
  const [copiedCode, setCopiedCode] = useState<string | null>(null);

  const getFormatTimeAgo = (dateStr: string) => {
    const diff = new Date().getTime() - new Date(dateStr).getTime();
    const minutes = Math.floor(diff / 60000);
    if (minutes < 1) return 'Agora';
    if (minutes < 60) return `${minutes} min ago`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours} h ago`;
    return `${Math.floor(hours/24)} days ago`;
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
        <Loader2 className="animate-spin text-blue-500 size-10" />
      </div>
    );
  }

  const total = quorum.totalResidents > 0 ? quorum.totalResidents : 1; // avoid / 0
  const pctPresent = Math.round((quorum.present / total) * 100);
  const pctTitular = Math.round((quorum.titulares / total) * 100);
  const pctInq = Math.round((quorum.inquilinos / total) * 100);
  const pctProxy = Math.round((quorum.proxies / total) * 100);

  return (
    <div id="dashboard-report" className="min-h-full bg-[#111827] text-gray-300 font-sans p-6 space-y-6">
      
      {/* HEADER SECTION IS HANDLED BY LAYOUT, BUT WE CAN ADD OUR OWN INTRO IF WE WANT */}
      <div className="flex items-center justify-between mb-2">
        <div>
          <h1 className="text-white font-bold text-lg md:text-2xl">Dashboard do Síndico</h1>
          <p className="text-gray-500 text-xs md:text-sm uppercase tracking-wide">{condoInfo?.trade_name}</p>
        </div>
        <button onClick={handleExportPDF} className="flex items-center gap-2 bg-[#1f2937] border border-[#2a3042] text-white px-4 py-2 rounded-lg text-sm hover:bg-[#2a3042] transition-colors" data-html2canvas-ignore="true">
          <TrendingUp size={16} /> Relatório
        </button>
      </div>

      {/* Invite Code Banner */}
      {condoInfo?.invite_code && (
        <section className="rounded-xl overflow-hidden bg-gradient-to-r from-[#00d2ff] to-[#3a7bd5] p-6 flex items-center justify-between shadow-lg relative">
          <div className="absolute right-0 top-0 h-full w-1/2 bg-white/10 opacity-20 transform skew-x-12 translate-x-20"></div>
          <div className="relative z-10 w-full flex items-center justify-between">
            <div>
              <p className="text-white/80 text-sm font-medium mb-1">Código de Convite</p>
              <h2 className="text-white text-3xl md:text-4xl font-bold tracking-wider">{condoInfo.invite_code}</h2>
            </div>
            <button 
              onClick={() => handleCopyCode(condoInfo.invite_code)} 
              className="bg-black/20 hover:bg-black/30 text-white rounded-lg p-3 transition backdrop-blur-sm z-10 shrink-0"
            >
              {copiedCode === condoInfo.invite_code ? <Check size={24} /> : <Copy size={24} />}
            </button>
          </div>
        </section>
      )}

      {/* Active Assembly Stats */}
      {activeAssembly ? (
        <section className="rounded-xl p-6 border border-[#2a3042] shadow-sm bg-[#1f2937]">
          <div className="mb-8">
            <h3 className="text-white font-bold text-lg">Assembleia Ativa</h3>
            <p className="text-gray-400 text-sm flex items-center gap-2">
               <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
               {activeAssembly.title} — {new Date(activeAssembly.assembly_date).toLocaleDateString()}
            </p>
          </div>
          
          <div className="flex flex-col xl:flex-row items-center gap-10 justify-around">
            {/* Main Donut */}
            <div className="flex flex-col items-center justify-center">
              <p className="text-xs text-gray-400 uppercase mb-4 text-center tracking-wider">Quórum Atual</p>
              <div 
                className="relative h-40 w-40 rounded-full flex items-center justify-center transition-all duration-700" 
                style={{ background: `conic-gradient(#3b82f6 0% ${pctPresent}%, #374151 ${pctPresent}% 100%)` }}
              >
                <div className="absolute inset-[15px] bg-[#1f2937] rounded-full flex items-center justify-center">
                  <span className="text-4xl font-bold text-white">{pctPresent}%</span>
                </div>
              </div>
            </div>
            
            {/* Secondary Stats Grid */}
            <div className="flex-1 grid grid-cols-2 sm:grid-cols-5 gap-6 text-center w-full max-w-4xl">
              {/* Presentes */}
              <div className="flex flex-col items-center">
                <p className="text-[10px] text-gray-400 uppercase mb-3 text-center h-6 flex items-end justify-center">Unidades Presentes</p>
                <div className="relative h-14 w-14 rounded-full flex items-center justify-center mb-2 transition-all duration-700" style={{ background: `conic-gradient(#10b981 0% ${pctPresent}%, #374151 ${pctPresent}% 100%)` }}>
                  <div className="absolute inset-[4px] bg-[#1f2937] rounded-full flex items-center justify-center text-xs text-white font-bold">{pctPresent}%</div>
                </div>
                <span className="text-white font-bold block text-sm">{quorum.present}/{total}</span>
                <span className="bg-green-500/20 text-green-500 text-[10px] px-2 py-0.5 rounded-full mt-1 font-bold">{pctPresent}%</span>
              </div>
              
              {/* Titulares */}
              <div className="flex flex-col items-center">
                <p className="text-[10px] text-gray-400 uppercase mb-3 text-center h-6 flex items-end justify-center">Titulares</p>
                <div className="relative h-14 w-14 rounded-full flex items-center justify-center mb-2 transition-all duration-700" style={{ background: `conic-gradient(#3b82f6 0% ${pctTitular}%, #374151 ${pctTitular}% 100%)` }}>
                  <div className="absolute inset-[4px] bg-[#1f2937] rounded-full flex items-center justify-center text-xs text-white font-bold">{pctTitular}%</div>
                </div>
                <span className="text-white font-bold block text-sm">{quorum.titulares}/{total}</span>
                <span className="bg-blue-500/20 text-blue-500 text-[10px] px-2 py-0.5 rounded-full mt-1 font-bold">{pctTitular}%</span>
              </div>
              
              {/* Inquilinos */}
              <div className="flex flex-col items-center">
                <p className="text-[10px] text-gray-400 uppercase mb-3 text-center h-6 flex items-end justify-center">Inquilinos</p>
                <div className="relative h-14 w-14 rounded-full flex items-center justify-center mb-2 transition-all duration-700" style={{ background: `conic-gradient(#8b5cf6 0% ${pctInq}%, #374151 ${pctInq}% 100%)` }}>
                  <div className="absolute inset-[4px] bg-[#1f2937] rounded-full flex items-center justify-center text-xs text-white font-bold">{pctInq}%</div>
                </div>
                <span className="text-white font-bold block text-sm">{quorum.inquilinos}/{total}</span>
                <span className="bg-purple-500/20 text-purple-500 text-[10px] px-2 py-0.5 rounded-full mt-1 font-bold">{pctInq}%</span>
              </div>
              
              {/* Procurações */}
              <div className="flex flex-col items-center">
                <p className="text-[10px] text-gray-400 uppercase mb-3 text-center h-6 flex items-end justify-center">Procurações</p>
                <div className="relative h-14 w-14 rounded-full flex items-center justify-center mb-2 transition-all duration-700" style={{ background: `conic-gradient(#9ca3af 0% ${pctProxy}%, #374151 ${pctProxy}% 100%)` }}>
                  <div className="absolute inset-[4px] bg-[#1f2937] rounded-full flex items-center justify-center text-xs text-white font-bold">{pctProxy}%</div>
                </div>
                <span className="text-white font-bold block text-sm">{quorum.proxies}/{total}</span>
                <span className="bg-gray-700/20 text-gray-400 text-[10px] px-2 py-0.5 rounded-full mt-1 font-bold">{pctProxy}%</span>
              </div>
              
              {/* Faltantes */}
              <div className="flex flex-col items-center justify-center pt-8">
                <p className="text-[10px] text-gray-400 uppercase mb-2">Faltantes</p>
                <span className="font-bold text-white text-[3rem] leading-none">{quorum.missing}</span>
              </div>
            </div>
          </div>
        </section>
      ) : (
        <section className="rounded-xl p-12 border border-[#2a3042] shadow-sm bg-[#1f2937] text-center">
          <TrendingUp size={48} className="text-[#374151] mx-auto mb-4" />
          <h3 className="text-xl font-bold text-white mb-2">Sem atividade no momento</h3>
          <p className="text-gray-400 max-w-md mx-auto">
            Assim que você abrir uma assembleia, os indicadores de quórum e votação aparecerão agrupados aqui.
          </p>
        </section>
      )}

      {/* Voting Agenda */}
      {activeAssembly && (
        <section>
          <h3 className="text-gray-400 text-xs font-bold uppercase mb-4 tracking-wider">Pautas em Votação</h3>
          {topics.length === 0 ? (
            <div className="border border-[#2a3042] rounded-xl p-8 shadow-sm flex flex-col items-center justify-center gap-3 bg-[#1f2937] text-gray-500">
               <span className="text-sm">Nenhuma pauta cadastrada para esta assembleia.</span>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
              {topics.map(t => {
                const totalVotes = t.votes.total;
                const simPct = totalVotes > 0 ? Math.round((t.votes.sim / totalVotes) * 100) : 0;
                const naoPct = totalVotes > 0 ? Math.round((t.votes.nao / totalVotes) * 100) : 0;
                const absPct = totalVotes > 0 ? Math.round((t.votes.abstencao / totalVotes) * 100) : 0;

                return (
                  <div key={t.id} className="border border-[#2a3042] rounded-xl p-5 shadow-sm flex flex-col bg-[#1f2937]">
                    <span className="text-[10px] text-gray-500 uppercase font-semibold mb-1">Pautas</span>
                    <h4 className="text-white font-medium mb-4 line-clamp-2 min-h-[3rem]" title={t.title}>{t.title}</h4>
                    <div className="flex justify-center mb-6">
                      <span className={`text-white font-bold px-8 py-1.5 rounded-full text-sm shadow-md ${
                        t.status === 'OPEN' ? 'bg-[#28a745]' : t.status === 'CLOSED' ? 'bg-gray-600' : 'bg-yellow-600'
                      }`}>
                        {t.status === 'OPEN' ? 'ABERTA' : t.status === 'CLOSED' ? 'ENCERRADA' : 'RASCUNHO'}
                      </span>
                    </div>
                    
                    <div className="space-y-4 mb-4 text-sm">
                      <div className="flex items-center gap-3">
                        <span className="w-2 h-2 rounded-full bg-green-500 shrink-0"></span>
                        <span className="w-8 font-bold text-gray-300 shrink-0">SIM:</span>
                        <div className="flex-1 h-1 bg-[#2a3042] rounded-full overflow-hidden">
                          <div className="h-full bg-green-500 transition-all duration-700" style={{ width: `${simPct}%` }}></div>
                        </div>
                        <span className="text-xs text-gray-400 w-12 text-right shrink-0">{t.votes.sim} ({simPct}%)</span>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="w-2 h-2 rounded-full bg-red-500 shrink-0"></span>
                        <span className="w-8 font-bold text-gray-300 shrink-0">NÃO:</span>
                        <div className="flex-1 h-1 bg-[#2a3042] rounded-full overflow-hidden">
                          <div className="h-full bg-red-500 transition-all duration-700" style={{ width: `${naoPct}%` }}></div>
                        </div>
                        <span className="text-xs text-gray-400 w-12 text-right shrink-0">{t.votes.nao} ({naoPct}%)</span>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="w-2 h-2 rounded-full bg-blue-500 shrink-0"></span>
                        <span className="w-8 font-bold text-gray-300 shrink-0">ABS:</span>
                        <div className="flex-1 h-1 bg-[#2a3042] rounded-full overflow-hidden">
                          <div className="h-full bg-blue-500 transition-all duration-700" style={{ width: `${absPct}%` }}></div>
                        </div>
                        <span className="text-xs text-gray-400 w-12 text-right shrink-0">{t.votes.abstencao} ({absPct}%)</span>
                      </div>
                    </div>
                    <div className="mt-auto pt-4 border-t border-[#2a3042] text-center text-xs text-gray-400">
                      Total: {totalVotes} voto{totalVotes !== 1 ? 's' : ''}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </section>
      )}

      {/* Info Split Section (Participants & Timeline) */}
      {activeAssembly && (
        <section className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="border border-[#2a3042] rounded-xl p-5 bg-[#1f2937]">
            <h3 className="text-white text-sm font-bold uppercase mb-4">Últimos Participantes</h3>
            <ul className="space-y-4">
              {recentUsers.length > 0 ? recentUsers.map((u, i) => (
                <li key={i} className="flex items-center">
                  <div className="h-10 w-10 shrink-0 rounded-full bg-blue-500/20 text-blue-400 flex items-center justify-center font-bold mr-3">
                    {u.full_name?.charAt(0) || 'U'}
                  </div>
                  <div className="flex-1 min-w-0">
                    <span className="text-gray-200 text-sm block truncate">{u.full_name || 'Usuário Sem Nome'}</span>
                    <span className="text-xs text-gray-500 block truncate">Bloco {u.block_number || '?'} - Und {u.unit_number || '?'}</span>
                  </div>
                  <span className="text-[10px] text-gray-500 ml-2">{getFormatTimeAgo(u.created_at)}</span>
                </li>
              )) : (
                 <li className="text-gray-500 text-sm py-2 text-center">Nenhum participante ainda.</li>
              )}
            </ul>
          </div>

          <div className="border border-[#2a3042] rounded-xl p-5 bg-[#1f2937]">
            <h3 className="text-white text-sm font-bold uppercase mb-4">Live Updates (Atividade Recente)</h3>
            <div className="relative space-y-6 pl-2 before:absolute before:inset-0 before:ml-[13px] before:-translate-x-px md:before:mx-auto md:before:translate-x-0 before:h-full before:w-0.5 before:bg-gradient-to-b before:from-transparent before:via-slate-300 before:to-transparent">
              {/* Using recent topics as timeline placeholders since we don't have a real activity feed */}
              {topics.length > 0 ? topics.slice(0, 4).map((t, i) => (
                <div key={i} className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group is-active">
                    <div className={`flex items-center justify-center w-3 h-3 rounded-full border-4 border-[#1f2937] shrink-0 md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2 shadow ring-2 ring-dark-800 ${i === 0 ? 'bg-green-500' : 'bg-blue-500'}`}></div>
                    <div className="w-[calc(100%-2rem)] md:w-[calc(50%-1.5rem)] ml-4 md:ml-0 md:group-odd:pr-4 md:group-even:pl-4">
                       <p className="text-gray-300 text-xs leading-relaxed line-clamp-2">{t.title}</p>
                       <span className="text-[10px] text-gray-500">{t.status === 'OPEN' ? 'Votação reaberta/criada' : 'Aguardando encerramento'}</span>
                    </div>
                </div>
              )) : (
                 <div className="text-gray-500 text-sm py-2 text-center relative z-10 w-full">Nenhuma atualização registrada.</div>
              )}
            </div>
          </div>
        </section>
      )}

      {/* Session History Table */}
      <section className="border border-[#2a3042] rounded-xl overflow-hidden mb-6 bg-[#1f2937]">
        <div className="p-4 border-b border-[#2a3042] bg-[#1f2937]">
          <h3 className="text-white text-sm font-bold uppercase">Histórico de Sessões</h3>
        </div>
        <div className="overflow-x-auto bg-[#1f2937]">
          <table className="w-full text-left text-sm text-gray-400">
            <thead className="bg-[#1f2433] text-xs uppercase text-gray-500">
              <tr>
                <th className="px-6 py-3 font-semibold" scope="col">Data <ChevronDown className="inline w-3 h-3 ml-1" /></th>
                <th className="px-6 py-3 font-semibold" scope="col">Assembleia</th>
                <th className="px-6 py-3 font-semibold" scope="col">Status</th>
                <th className="px-6 py-3 font-semibold" scope="col">Formato</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#2a3042]">
              {pastAssemblies.length > 0 ? (
                pastAssemblies.map((a) => (
                  <tr key={a.id} className="hover:bg-[#2a3042]/50 transition">
                    <td className="px-6 py-4 whitespace-nowrap"><CalendarDays className="inline w-4 h-4 mr-2" />{new Date(a.assembly_date).toLocaleDateString()}</td>
                    <td className="px-6 py-4">{a.title}</td>
                    <td className="px-6 py-4">
                      {a.status === 'CLOSED' ? (
                        <span className="bg-gray-600/30 text-gray-300 text-[10px] font-bold px-3 py-1 rounded-full border border-gray-600/50">ENCERRADA</span>
                      ) : (
                        <span className="bg-yellow-500/20 text-yellow-500 text-[10px] font-bold px-3 py-1 rounded-full border border-yellow-500/30">RASCUNHO</span>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      {a.format === 'VIRTUAL' ? 'Online' : a.format === 'PRESENCIAL' ? 'Presencial' : 'Híbrida'}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={4} className="px-6 py-8 text-center text-gray-500">Nenhuma sessão anterior encontrada.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>

    </div>
  );
}
