import { useState } from 'react';
import { Plus, Edit2, Trash2, Clock, CheckCircle2 } from 'lucide-react';

export default function AdminTopics() {
  const [isModalOpen, setIsModalOpen] = useState(false);

  const topics = [
    { id: 1, title: 'Reforma do Playground', type: 'Maioria Simples', status: 'Ativa', time: '02:05:42' },
    { id: 2, title: 'Aprovação de Contas 2023', type: 'Maioria Simples', status: 'Encerrada', time: '-' },
    { id: 3, title: 'Instalação de Câmeras', type: 'Maioria Qualificada', status: 'Rascunho', time: '-' },
  ];

  return (
    <div className="space-y-8 max-w-6xl mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold text-slate-900 dark:text-white">Pautas</h2>
          <p className="text-slate-500 dark:text-slate-400 mt-1">Gerencie as pautas da assembleia</p>
        </div>
        <button
          onClick={() => setIsModalOpen(true)}
          className="flex items-center gap-2 px-4 py-2 bg-primary hover:bg-blue-600 text-white rounded-lg text-sm font-bold transition-colors shadow-lg shadow-primary/20"
        >
          <Plus size={18} />
          Nova Pauta
        </button>
      </div>

      <div className="bg-white dark:bg-surface-dark rounded-2xl border border-slate-200 dark:border-border-dark shadow-sm overflow-hidden">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b border-slate-200 dark:border-border-dark bg-slate-50 dark:bg-[#1c2e3e]">
              <th className="p-4 text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Título</th>
              <th className="p-4 text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Tipo</th>
              <th className="p-4 text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Status</th>
              <th className="p-4 text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Tempo</th>
              <th className="p-4 text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider text-right">Ações</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200 dark:divide-border-dark">
            {topics.map((topic) => (
              <tr key={topic.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                <td className="p-4 text-sm font-bold text-slate-900 dark:text-white">{topic.title}</td>
                <td className="p-4 text-sm text-slate-600 dark:text-slate-300">{topic.type}</td>
                <td className="p-4">
                  <span
                    className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold ${
                      topic.status === 'Ativa'
                        ? 'bg-green-100 text-green-700 dark:bg-green-500/10 dark:text-green-400'
                        : topic.status === 'Encerrada'
                        ? 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-400'
                        : 'bg-orange-100 text-orange-700 dark:bg-orange-500/10 dark:text-orange-400'
                    }`}
                  >
                    {topic.status === 'Ativa' && <Clock size={12} />}
                    {topic.status === 'Encerrada' && <CheckCircle2 size={12} />}
                    {topic.status}
                  </span>
                </td>
                <td className="p-4 text-sm text-slate-600 dark:text-slate-300 font-mono">{topic.time}</td>
                <td className="p-4 flex items-center justify-end gap-2">
                  <button className="p-2 text-slate-400 hover:text-primary transition-colors rounded-lg hover:bg-primary/10">
                    <Edit2 size={16} />
                  </button>
                  <button className="p-2 text-slate-400 hover:text-red-500 transition-colors rounded-lg hover:bg-red-500/10">
                    <Trash2 size={16} />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Modal Nova Pauta */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-surface-dark rounded-2xl w-full max-w-lg shadow-xl border border-slate-200 dark:border-border-dark overflow-hidden">
            <div className="p-6 border-b border-slate-200 dark:border-border-dark flex justify-between items-center">
              <h3 className="text-xl font-bold text-slate-900 dark:text-white">Configurar Nova Pauta</h3>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200">
                &times;
              </button>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Título da Pauta</label>
                <input type="text" className="w-full rounded-xl border-slate-300 dark:border-slate-700 bg-white dark:bg-[#192633] text-slate-900 dark:text-white focus:border-primary focus:ring-primary h-10 px-3" placeholder="Ex: Aprovação de Orçamento" />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Descrição</label>
                <textarea className="w-full rounded-xl border-slate-300 dark:border-slate-700 bg-white dark:bg-[#192633] text-slate-900 dark:text-white focus:border-primary focus:ring-primary p-3" rows={3} placeholder="Detalhes da votação..."></textarea>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Tipo de Votação</label>
                  <select className="w-full rounded-xl border-slate-300 dark:border-slate-700 bg-white dark:bg-[#192633] text-slate-900 dark:text-white focus:border-primary focus:ring-primary h-10 px-3">
                    <option>Maioria Simples</option>
                    <option>Maioria Qualificada (2/3)</option>
                    <option>Unanimidade</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Tempo (minutos)</label>
                  <input type="number" className="w-full rounded-xl border-slate-300 dark:border-slate-700 bg-white dark:bg-[#192633] text-slate-900 dark:text-white focus:border-primary focus:ring-primary h-10 px-3" defaultValue="5" />
                </div>
              </div>
              <div className="flex items-center gap-3 pt-2">
                <input type="checkbox" id="multiple" className="rounded border-slate-300 text-primary focus:ring-primary bg-transparent" />
                <label htmlFor="multiple" className="text-sm text-slate-700 dark:text-slate-300">Permitir múltiplos check-ins por unidade</label>
              </div>
            </div>
            <div className="p-6 border-t border-slate-200 dark:border-border-dark flex justify-end gap-3 bg-slate-50 dark:bg-[#1c2e3e]">
              <button onClick={() => setIsModalOpen(false)} className="px-4 py-2 text-sm font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-lg transition-colors">
                Cancelar
              </button>
              <button className="px-4 py-2 text-sm font-bold text-primary bg-primary/10 hover:bg-primary/20 rounded-lg transition-colors">
                Salvar Rascunho
              </button>
              <button className="px-4 py-2 text-sm font-bold text-white bg-primary hover:bg-blue-600 rounded-lg transition-colors shadow-md shadow-primary/20">
                Publicar e Abrir
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
