import React, { useState, useEffect } from 'react';
import { Plus, Edit2, Trash2, Clock, CheckCircle2, Loader2, Lock, ArrowLeft } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';
import { useSearchParams, useNavigate } from 'react-router-dom';

type Topic = {
  id: string;
  title: string;
  description: string;
  status: 'OPEN' | 'CLOSED' | 'DRAFT';
  assembly_id: string;
  created_at: string;
};

export default function AdminTopics() {
  const { user, profile } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const assemblyId = searchParams.get('assembly_id');
  const assemblyTitle = searchParams.get('title');

  const [topics, setTopics] = useState<Topic[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  
  // Form state
  const [formData, setFormData] = useState({ title: '', description: '' });
  const [editingId, setEditingId] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (assemblyId) {
      fetchTopics();
    }
  }, [assemblyId]);

  const fetchTopics = async () => {
    if (!assemblyId) return;
    setLoading(true);
    const { data, error } = await supabase
      .from('topics')
      .select('*')
      .eq('assembly_id', assemblyId)
      .order('created_at', { ascending: false });
      
    if (!error && data) {
      setTopics(data);
    }
    setLoading(false);
  };

  const handleOpenNewTopic = () => {
    setEditingId(null);
    setFormData({ title: '', description: '' });
    setIsModalOpen(true);
  };

  const openEditModal = (topic: Topic) => {
    setEditingId(topic.id);
    setFormData({ title: topic.title, description: topic.description });
    setIsModalOpen(true);
  };

  const handleSaveTopic = async (status: 'DRAFT' | 'OPEN') => {
    if (!formData.title) return alert('Título é obrigatório');
    setSubmitting(true);
    
    if (editingId) {
      const { error } = await supabase.from('topics').update({
        title: formData.title,
        description: formData.description,
        status
      }).eq('id', editingId);

      setSubmitting(false);
      if (!error) {
        setIsModalOpen(false);
        setEditingId(null);
        fetchTopics();
      } else {
        alert('Erro ao atualizar pauta: ' + error.message);
      }
    } else {
      const { error } = await supabase.from('topics').insert([
        {
          title: formData.title,
          description: formData.description,
          status,
          created_by: user?.id,
          condo_id: profile?.condo_id,
          assembly_id: assemblyId
        }
      ]);

      setSubmitting(false);
      if (!error) {
        setIsModalOpen(false);
        fetchTopics();
      } else {
        alert('Erro ao criar pauta: ' + error.message);
      }
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Deseja realmente excluir esta pauta?')) return;
    const { error } = await supabase.from('topics').delete().eq('id', id);
    if (!error) fetchTopics();
  };

  const handleCloseTopic = async (id: string) => {
    if (!confirm('Deseja realmente encerrar a votação desta pauta?')) return;
    const { error } = await supabase.from('topics').update({ status: 'CLOSED' }).eq('id', id);
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

  if (!assemblyId) {
    return (
      <div className="flex flex-col items-center justify-center p-12 text-center h-[60vh]">
         <div className="bg-orange-100 text-orange-600 dark:bg-orange-500/10 dark:text-orange-400 p-4 rounded-full mb-4">
            <Lock size={32} />
         </div>
         <h3 className="text-xl font-bold mb-2 text-slate-900 dark:text-white">Nenhuma Assembleia Selecionada</h3>
         <p className="text-slate-500 dark:text-slate-400 mb-6">Você precisa acessar uma Assembleia específica para visualizar e gerenciar suas pautas.</p>
         <button onClick={() => navigate('/admin/assemblies')} className="px-5 py-2.5 bg-primary hover:bg-primary-hover text-white rounded-xl font-bold flex items-center gap-2 transition-colors">
            <ArrowLeft size={18} /> Voltar para Assembleias
         </button>
      </div>
    );
  }

  return (
    <div className="space-y-8 max-w-6xl mx-auto">
      <div className="flex items-center gap-2 mb-2">
         <button onClick={() => navigate('/admin/assemblies')} className="text-slate-500 hover:text-primary transition-colors flex items-center gap-1.5 text-sm font-semibold">
            <ArrowLeft size={16} /> Assembleias
         </button>
      </div>
      <div className="flex items-center justify-between">
        <div className="flex-1">
          <h2 className="text-3xl font-bold text-slate-900 dark:text-white break-all">Pautas <span className="text-primary font-medium text-xl ml-2">({assemblyTitle || 'Vinculadas'})</span></h2>
          <p className="text-slate-500 dark:text-slate-400 mt-1">Gerencie as pautas da assembleia</p>
        </div>
        <button
          onClick={handleOpenNewTopic}
          className="flex items-center gap-2 px-4 py-2 bg-primary hover:bg-primary-hover text-white rounded-lg text-sm font-bold transition-colors shadow-lg shadow-primary/20 shrink-0"
        >
          <Plus size={18} />
          <span className="hidden sm:inline">Nova Pauta</span>
        </button>
      </div>

      <div className="bg-white dark:bg-surface-dark rounded-2xl border border-slate-200 dark:border-border-dark shadow-sm overflow-hidden">
        {loading ? (
          <div className="p-12 flex justify-center text-primary">
            <Loader2 className="animate-spin size-8" />
          </div>
        ) : (
          <>
            {/* Desktop Table View */}
            <table className="hidden md:table w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-200 dark:border-border-dark bg-slate-50 dark:bg-surface-dark/50">
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
                      <td className="p-4 text-sm font-bold text-slate-900 dark:text-white max-w-xs truncate">{topic.title}</td>
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
                      <td className="p-4 flex items-center justify-end gap-1">
                        {topic.status === 'OPEN' && (
                          <button onClick={() => handleCloseTopic(topic.id)} title="Encerrar Votação" className="p-2 text-slate-400 hover:text-orange-500 transition-colors rounded-lg hover:bg-orange-500/10">
                            <Lock size={16} />
                          </button>
                        )}
                        <button onClick={() => openEditModal(topic)} title="Editar pauta" className="p-2 text-slate-400 hover:text-primary transition-colors rounded-lg hover:bg-primary/10">
                          <Edit2 size={16} />
                        </button>
                        <button onClick={() => handleDelete(topic.id)} title="Excluir pauta" className="p-2 text-slate-400 hover:text-red-500 transition-colors rounded-lg hover:bg-red-500/10">
                          <Trash2 size={16} />
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>

            {/* Mobile Cards View */}
            <div className="md:hidden flex flex-col divide-y divide-slate-200 dark:divide-border-dark">
              {topics.length === 0 ? (
                <div className="p-8 text-center text-slate-500 dark:text-slate-400">
                  Nenhuma pauta cadastrada.
                </div>
              ) : (
                topics.map((topic) => (
                  <div key={topic.id} className="p-4 flex flex-col gap-3 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                    <div className="flex justify-between items-start gap-3">
                      <h4 className="text-sm font-bold text-slate-900 dark:text-white leading-snug flex-1">
                        {topic.title}
                      </h4>
                      <div className="flex items-center shrink-0">
                        {topic.status === 'OPEN' && (
                          <button onClick={() => handleCloseTopic(topic.id)} title="Encerrar Votação" className="p-2 text-slate-400 hover:text-orange-500 transition-colors rounded-lg hover:bg-orange-500/10">
                            <Lock size={16} />
                          </button>
                        )}
                        <button onClick={() => openEditModal(topic)} title="Editar pauta" className="p-2 text-slate-400 hover:text-primary transition-colors rounded-lg hover:bg-primary/10">
                          <Edit2 size={16} />
                        </button>
                        <button onClick={() => handleDelete(topic.id)} title="Excluir pauta" className="p-2 text-slate-400 hover:text-red-500 transition-colors rounded-lg hover:bg-red-500/10">
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </div>
                    <div className="flex flex-wrap items-center justify-between gap-2 mt-1">
                      <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold ${getStatusStyle(topic.status)}`}>
                        {topic.status === 'OPEN' && <Clock size={12} />}
                        {topic.status === 'CLOSED' && <CheckCircle2 size={12} />}
                        {getStatusLabel(topic.status)}
                      </span>
                      <span className="text-xs text-slate-500 dark:text-slate-400 font-mono">
                        {new Date(topic.created_at).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </>
        )}
      </div>

      {/* Modal Nova/Editar Pauta */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-surface-dark rounded-2xl w-full max-w-lg shadow-xl border border-slate-200 dark:border-border-dark overflow-hidden">
            <div className="p-6 border-b border-slate-200 dark:border-border-dark flex justify-between items-center">
              <h3 className="text-xl font-bold text-slate-900 dark:text-white">{editingId ? 'Editar Pauta' : 'Configurar Nova Pauta'}</h3>
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
              <button disabled={submitting} onClick={() => handleSaveTopic('DRAFT')} className="px-4 py-2 text-sm font-bold text-primary bg-primary/10 hover:bg-primary/20 rounded-lg transition-colors">
                {submitting ? 'Salvando...' : 'Salvar Rascunho'}
              </button>
              <button disabled={submitting} onClick={() => handleSaveTopic('OPEN')} className="px-4 py-2 text-sm font-bold text-white bg-primary hover:bg-primary-hover rounded-lg transition-colors shadow-md shadow-primary/20">
                {submitting ? 'Salvando...' : 'Publicar e Abrir'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
