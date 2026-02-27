import React, { useState, useEffect } from 'react';
import { Plus, Edit2, Trash2, Clock, CheckCircle2, Loader2 } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';

type Topic = {
  id: string;
  title: string;
  description: string;
  status: 'OPEN' | 'CLOSED' | 'DRAFT';
  created_at: string;
};

export default function AdminTopics() {
  const { user } = useAuth();
  const [topics, setTopics] = useState<Topic[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  
  // Form state
  const [formData, setFormData] = useState({ title: '', description: '' });
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchTopics();
  }, []);

  const fetchTopics = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('topics')
      .select('*')
      .order('created_at', { ascending: false });
      
    if (!error && data) {
      setTopics(data);
    }
    setLoading(false);
  };

  const handleCreateTopic = async (status: 'DRAFT' | 'OPEN') => {
    if (!formData.title) return alert('Título é obrigatório');
    setSubmitting(true);
    
    const { error } = await supabase.from('topics').insert([
      {
        title: formData.title,
        description: formData.description,
        status,
        created_by: user?.id
      }
    ]);

    setSubmitting(false);
    if (!error) {
      setIsModalOpen(false);
      setFormData({ title: '', description: '' });
      fetchTopics();
    } else {
      alert('Erro ao criar pauta: ' + error.message);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Deseja realmente excluir esta pauta?')) return;
    const { error } = await supabase.from('topics').delete().eq('id', id);
    if (!error) fetchTopics();
  };

  // Funções de auxílio visual
  const getStatusLabel = (status: string) => {
    if (status === 'OPEN') return 'Ativa';
    if (status === 'CLOSED') return 'Encerrada';
    return 'Rascunho';
  };

  const getStatusStyle = (status: string) => {
    if (status === 'OPEN') return 'bg-green-100 text-green-700 dark:bg-green-500/10 dark:text-green-400';
    if (status === 'CLOSED') return 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-400';
    return 'bg-orange-100 text-orange-700 dark:bg-orange-500/10 dark:text-orange-400';
  };

  return (
    <div className="space-y-8 max-w-6xl mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold text-slate-900 dark:text-white">Pautas</h2>
          <p className="text-slate-500 dark:text-slate-400 mt-1">Gerencie as pautas da assembleia</p>
        </div>
        <button
          onClick={() => setIsModalOpen(true)}
          className="flex items-center gap-2 px-4 py-2 bg-primary hover:bg-primary-hover text-white rounded-lg text-sm font-bold transition-colors shadow-lg shadow-primary/20"
        >
          <Plus size={18} />
          Nova Pauta
        </button>
      </div>

      <div className="bg-white dark:bg-surface-dark rounded-2xl border border-slate-200 dark:border-border-dark shadow-sm overflow-hidden">
        {loading ? (
          <div className="p-12 flex justify-center text-primary">
            <Loader2 className="animate-spin size-8" />
          </div>
        ) : (
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-200 dark:border-border-dark bg-slate-50 dark:bg-[#1c2e3e]">
                <th className="p-4 text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Título</th>
                <th className="p-4 text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Status</th>
                <th className="p-4 text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Criada em</th>
                <th className="p-4 text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider text-right">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 dark:divide-border-dark">
              {topics.length === 0 ? (
                <tr>
                  <td colSpan={4} className="p-8 text-center text-slate-500 dark:text-slate-400">
                    Nenhuma pauta cadastrada.
                  </td>
                </tr>
              ) : (
                topics.map((topic) => (
                  <tr key={topic.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                    <td className="p-4 text-sm font-bold text-slate-900 dark:text-white">{topic.title}</td>
                    <td className="p-4">
                      <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold ${getStatusStyle(topic.status)}`}>
                        {topic.status === 'OPEN' && <Clock size={12} />}
                        {topic.status === 'CLOSED' && <CheckCircle2 size={12} />}
                        {getStatusLabel(topic.status)}
                      </span>
                    </td>
                    <td className="p-4 text-sm text-slate-600 dark:text-slate-300 font-mono">
                      {new Date(topic.created_at).toLocaleDateString()}
                    </td>
                    <td className="p-4 flex items-center justify-end gap-2">
                      <button className="p-2 text-slate-400 hover:text-primary transition-colors rounded-lg hover:bg-primary/10">
                        <Edit2 size={16} />
                      </button>
                      <button onClick={() => handleDelete(topic.id)} className="p-2 text-slate-400 hover:text-red-500 transition-colors rounded-lg hover:bg-red-500/10">
                        <Trash2 size={16} />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        )}
      </div>

      {/* Modal Nova Pauta */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-surface-dark rounded-2xl w-full max-w-lg shadow-xl border border-slate-200 dark:border-border-dark overflow-hidden">
            <div className="p-6 border-b border-slate-200 dark:border-border-dark flex justify-between items-center">
              <h3 className="text-xl font-bold text-slate-900 dark:text-white">Configurar Nova Pauta</h3>
              <button disabled={submitting} onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200">
                &times;
              </button>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Título da Pauta</label>
                <input 
                  type="text" 
                  value={formData.title}
                  onChange={(e) => setFormData({...formData, title: e.target.value})}
                  className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:border-primary focus:ring-primary h-10 px-3 outline-none" 
                  placeholder="Ex: Aprovação de Orçamento" 
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Descrição</label>
                <textarea 
                  value={formData.description}
                  onChange={(e) => setFormData({...formData, description: e.target.value})}
                  className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:border-primary focus:ring-primary p-3 outline-none" 
                  rows={3} 
                  placeholder="Detalhes da votação..."
                ></textarea>
              </div>
            </div>
            <div className="p-6 border-t border-slate-200 dark:border-border-dark flex justify-end gap-3 bg-slate-50 dark:bg-[#1c2e3e]">
              <button disabled={submitting} onClick={() => setIsModalOpen(false)} className="px-4 py-2 text-sm font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-lg transition-colors">
                Cancelar
              </button>
              <button disabled={submitting} onClick={() => handleCreateTopic('DRAFT')} className="px-4 py-2 text-sm font-bold text-primary bg-primary/10 hover:bg-primary/20 rounded-lg transition-colors">
                {submitting ? 'Salvando...' : 'Salvar Rascunho'}
              </button>
              <button disabled={submitting} onClick={() => handleCreateTopic('OPEN')} className="px-4 py-2 text-sm font-bold text-white bg-primary hover:bg-primary-hover rounded-lg transition-colors shadow-md shadow-primary/20">
                {submitting ? 'Abindo...' : 'Publicar e Abrir'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
