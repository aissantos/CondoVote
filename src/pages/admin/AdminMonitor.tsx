import { useState } from 'react';
import { Search, Filter, Download, StopCircle, RefreshCw } from 'lucide-react';

export default function AdminMonitor() {
  const participants = [
    { id: 1, name: 'Carlos Oliveira', unit: 'Apto 102 - Bloco A', checkInTime: '14:05', voted: true, option: 'SIM' },
    { id: 2, name: 'Mariana Silva', unit: 'Apto 204 - Bloco B', checkInTime: '14:10', voted: false, option: '-' },
    { id: 3, name: 'João Pedro', unit: 'Apto 301 - Bloco A', checkInTime: '14:12', voted: true, option: 'NÃO' },
    { id: 4, name: 'Ana Souza', unit: 'Apto 105 - Bloco C', checkInTime: '14:15', voted: true, option: 'ABSTENÇÃO' },
    { id: 5, name: 'Roberto Carlos', unit: 'Apto 402 - Bloco B', checkInTime: '14:20', voted: false, option: '-' },
  ];

  return (
    <div className="space-y-8 max-w-6xl mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold text-slate-900 dark:text-white">Monitor de Votação</h2>
          <p className="text-slate-500 dark:text-slate-400 mt-1">Acompanhe a pauta ativa em tempo real</p>
        </div>
        <div className="flex gap-3">
          <button className="flex items-center gap-2 px-4 py-2 bg-red-500/10 hover:bg-red-500/20 text-red-600 dark:text-red-400 rounded-lg text-sm font-bold transition-colors">
            <StopCircle size={18} />
            Encerrar Votação
          </button>
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
                placeholder="Buscar por nome ou unidade..."
                className="pl-10 pr-4 py-2 w-64 rounded-xl border-slate-300 dark:border-slate-700 bg-white dark:bg-[#192633] text-sm text-slate-900 dark:text-white focus:border-primary focus:ring-primary"
              />
            </div>
            <button className="flex items-center gap-2 px-3 py-2 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-lg text-sm font-medium transition-colors">
              <Filter size={16} />
              Filtros
            </button>
          </div>
          <div className="flex items-center gap-2 text-sm text-slate-500 dark:text-slate-400">
            <RefreshCw size={14} className="animate-spin" />
            Atualizando ao vivo...
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
              {participants.map((p) => (
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
              ))}
            </tbody>
          </table>
        </div>
        
        <div className="p-4 border-t border-slate-200 dark:border-border-dark flex items-center justify-between text-sm text-slate-500 dark:text-slate-400 bg-slate-50 dark:bg-[#1c2e3e]">
          <span>Mostrando 5 de 142 participantes</span>
          <div className="flex gap-2">
            <button className="px-3 py-1 border border-slate-300 dark:border-slate-600 rounded hover:bg-slate-200 dark:hover:bg-slate-700 disabled:opacity-50">Anterior</button>
            <button className="px-3 py-1 border border-slate-300 dark:border-slate-600 rounded hover:bg-slate-200 dark:hover:bg-slate-700">Próxima</button>
          </div>
        </div>
      </div>
    </div>
  );
}
