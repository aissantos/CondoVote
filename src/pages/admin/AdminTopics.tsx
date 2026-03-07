import React, { useState, useEffect } from 'react';
import { Plus, Edit2, Trash2, Clock, CheckCircle2, Loader2, Lock, ArrowLeft, Paperclip, Play, Eye } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { useToast } from '../../hooks/useToast';
import Modal from '../../components/Modal';
import ConfirmDialog from '../../components/ConfirmDialog';

type Topic = {
  id: string;
  title: string;
  description: string;
  status: 'OPEN' | 'CLOSED' | 'DRAFT' | 'PUBLISHED';
  assembly_id: string;
  attachment_url?: string;
  created_at: string;
};

export default function AdminTopics() {
  const { user, profile } = useAuth();
  const navigate = useNavigate();
  const toast = useToast();
  const [searchParams] = useSearchParams();
  const assemblyId = searchParams.get('assembly_id');
  const assemblyTitle = searchParams.get('title');

  const [topics, setTopics] = useState<Topic[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  
  // Form state
  const [formData, setFormData] = useState({ 
    title: '', 
    description: '',
    attachmentFile: null as File | null
  });
  const [editingId, setEditingId] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  // Confirm Dialog state
  const [pendingAction, setPendingAction] = useState<{ id: string; type: 'delete' | 'close' | 'open' | 'publish' } | null>(null);

  useEffect(() => {
    if (assemblyId) {
      fetchTopics();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
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
      setTopics(data as Topic[]);
    }
    setLoading(false);
  };

  const handleOpenNewTopic = () => {
    setEditingId(null);
    setFormData({ title: '', description: '', attachmentFile: null });
    setIsModalOpen(true);
  };

  const openEditModal = (topic: Topic) => {
    setEditingId(topic.id);
    setFormData({ title: topic.title, description: topic.description, attachmentFile: null });
    setIsModalOpen(true);
  };

  const generateFileName = (originalName: string) => {
    const timestamp = new Date().getTime();
    const cleanName = originalName.replace(/[^a-zA-Z0-9.-]/g, '_');
    return `${profile?.condo_id}/${timestamp}_${cleanName}`;
  };

  const handleSaveTopic = async () => {
    if (!formData.title) {
      toast.warning('Título é obrigatório');
      return;
    }
    setSubmitting(true);
    
    try {
        let attachment_url = undefined;

        if (formData.attachmentFile) {
            const fileName = generateFileName(formData.attachmentFile.name);
            const { error: uploadError } = await supabase.storage
              .from('topic_attachments')
              .upload(fileName, formData.attachmentFile);

            if (!uploadError) {
               const { data } = supabase.storage.from('topic_attachments').getPublicUrl(fileName);
               attachment_url = data.publicUrl;
            } else {
               console.error("Erro no upload do anexo:", uploadError);
            }
        }

        if (editingId) {
          type TopicUpdatePayload = {
            title: string;
            description: string;
            attachment_url?: string;
          };
          const payload: TopicUpdatePayload = {
            title: formData.title,
            description: formData.description
          };
          if (attachment_url) payload.attachment_url = attachment_url;

          const { error } = await supabase.from('topics').update(payload).eq('id', editingId);
          if (error) throw error;
        } else {
          const { error } = await supabase.from('topics').insert([
            {
              title: formData.title,
              description: formData.description,
              status: 'DRAFT',
              created_by: user?.id,
              condo_id: profile?.condo_id,
              assembly_id: assemblyId,
              attachment_url
            }
          ]);
          if (error) throw error;
        }

        setIsModalOpen(false);
        setEditingId(null);
        fetchTopics();
        toast.success(editingId ? 'Pauta atualizada com sucesso!' : 'Pauta criada como rascunho com sucesso!');
    } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : 'Erro desconhecido';
        toast.error('Erro ao salvar pauta: ' + msg);
    } finally {
        setSubmitting(false);
    }
  };

  const handleDelete = (id: string) => setPendingAction({ id, type: 'delete' });
  const handleCloseTopic = (id: string) => setPendingAction({ id, type: 'close' });
  const handleOpenTopicAction = (id: string) => setPendingAction({ id, type: 'open' });
  const handlePublishTopicAction = (id: string) => setPendingAction({ id, type: 'publish' });

  const confirmAction = async () => {
    if (!pendingAction) return;
    const { id, type } = pendingAction;
    if (type === 'delete') {
      const { error } = await supabase.from('topics').delete().eq('id', id);
      if (!error) fetchTopics();
    } else if (type === 'close') {
      const { error } = await supabase.from('topics').update({ status: 'CLOSED' }).eq('id', id);
      if (!error) fetchTopics();
    } else if (type === 'publish') {
      const { error } = await supabase.from('topics').update({ status: 'PUBLISHED' }).eq('id', id);
      if (!error) {
        fetchTopics();
        toast.success('Pauta publicada! Agora ela está visível para os moradores.');
      }
    } else if (type === 'open') {
      const { error } = await supabase.from('topics').update({ status: 'OPEN' }).eq('id', id);
      if (!error) {
        fetchTopics();
        toast.success('Votação iniciada com sucesso!');
      }
    }
    setPendingAction(null);
  };

  // Funções de auxílio visual
  const getStatusLabel = (status: string) => {
    if (status === 'OPEN') return 'Em Votação';
    if (status === 'CLOSED') return 'Encerrada';
    if (status === 'PUBLISHED') return 'Publicada (Aguardando)';
    return 'Rascunho';
  };

  const getStatusStyle = (status: string) => {
    if (status === 'OPEN') return 'bg-green-100 text-green-700 dark:bg-green-500/10 dark:text-green-400';
    if (status === 'CLOSED') return 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-400';
    if (status === 'PUBLISHED') return 'bg-blue-100 text-blue-700 dark:bg-blue-500/10 dark:text-blue-400';
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

      {loading ? (
        <div className="bg-white dark:bg-surface-dark rounded-2xl border border-slate-200 dark:border-border-dark shadow-sm overflow-hidden p-12 flex justify-center text-primary">
          <Loader2 className="animate-spin size-8" />
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6" role="list" aria-label="Lista de pautas">
          {topics.length === 0 ? (
            <div className="col-span-full p-12 text-center bg-white dark:bg-surface-dark rounded-2xl border border-slate-200 dark:border-border-dark text-slate-500 dark:text-slate-400">
              Nenhuma pauta cadastrada.
            </div>
          ) : (
            topics.map((topic) => (
              <div key={topic.id} className="bg-white dark:bg-surface-dark rounded-2xl border border-slate-200 dark:border-border-dark shadow-sm p-6 flex flex-col hover:shadow-md transition-shadow group relative">
                <div className="flex justify-between items-start mb-3 gap-3">
                  <h4 className="text-lg font-bold text-slate-900 dark:text-white leading-snug break-words line-clamp-2 flex-1">
                    {topic.title}
                  </h4>
                  {topic.attachment_url && (
                    <div className="shrink-0 p-1.5 bg-indigo-50 dark:bg-indigo-500/10 text-indigo-500 dark:text-indigo-400 rounded-lg" title="Possui anexo">
                      <Paperclip size={16} />
                    </div>
                  )}
                </div>
                
                <p className="text-sm text-slate-500 dark:text-slate-400 line-clamp-2 mb-4 flex-1">
                   {topic.description || <span className="italic opacity-60">Sem descrição adicional</span>}
                </p>

                <div className="flex flex-wrap items-center justify-between gap-2 mt-auto pt-4 border-t border-slate-100 dark:border-slate-800">
                  <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold ${getStatusStyle(topic.status)}`}>
                    {topic.status === 'OPEN' && <Play size={12} />}
                    {topic.status === 'PUBLISHED' && <Eye size={12} />}
                    {topic.status === 'CLOSED' && <CheckCircle2 size={12} />}
                    {topic.status === 'DRAFT' && <Clock size={12} />}
                    {getStatusLabel(topic.status)}
                  </span>
                  <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    {topic.status === 'DRAFT' && (
                      <button
                        onClick={() => handlePublishTopicAction(topic.id)}
                        aria-label={`Publicar pauta: ${topic.title}`}
                        className="p-2 text-slate-400 hover:text-blue-500 transition-colors rounded-lg hover:bg-blue-50 dark:hover:bg-blue-500/10"
                        title="Tornar visível para os moradores"
                      >
                        <Eye size={16} aria-hidden="true" />
                      </button>
                    )}
                    {topic.status === 'PUBLISHED' && (
                      <button
                        onClick={() => handleOpenTopicAction(topic.id)}
                        aria-label={`Iniciar votação: ${topic.title}`}
                        className="p-2 text-slate-400 hover:text-green-500 transition-colors rounded-lg hover:bg-green-50 dark:hover:bg-green-500/10"
                        title="Iniciar contagem de votos agora"
                      >
                        <Play size={16} aria-hidden="true" />
                      </button>
                    )}
                    {topic.status === 'OPEN' && (
                      <button
                        onClick={() => handleCloseTopic(topic.id)}
                        aria-label={`Encerrar votação: ${topic.title}`}
                        className="p-2 text-slate-400 hover:text-orange-500 transition-colors rounded-lg hover:bg-orange-50 dark:hover:bg-orange-500/10"
                      >
                        <Lock size={16} aria-hidden="true" />
                      </button>
                    )}
                    <button
                      onClick={() => openEditModal(topic)}
                      aria-label={`Editar pauta: ${topic.title}`}
                      className="p-2 text-slate-400 hover:text-primary transition-colors rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800"
                    >
                      <Edit2 size={16} aria-hidden="true" />
                    </button>
                    <button
                      onClick={() => handleDelete(topic.id)}
                      aria-label={`Excluir pauta: ${topic.title}`}
                      className="p-2 text-slate-400 hover:text-red-500 transition-colors rounded-lg hover:bg-red-50 dark:hover:bg-red-500/10"
                    >
                      <Trash2 size={16} aria-hidden="true" />
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      <Modal
        open={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingId ? 'Editar Pauta' : 'Configurar Nova Pauta'}
        maxWidth="max-w-lg"
        disabled={submitting}
      >
        <div className="p-6 space-y-4">
          <div>
            <label htmlFor="topic-title" className="block text-sm font-medium text-slate-300 mb-1">Título da Pauta</label>
            <input
              id="topic-title"
              type="text"
              value={formData.title}
              onChange={(e) => setFormData({...formData, title: e.target.value})}
              className="w-full rounded-xl border border-slate-600 bg-slate-900/50 text-white focus:border-primary focus:ring-primary h-10 px-3 outline-none"
              placeholder="Ex: Aprovação de Orçamento"
              aria-required="true"
            />
          </div>
          <div>
            <label htmlFor="topic-desc" className="block text-sm font-medium text-slate-300 mb-1">Descrição</label>
            <textarea
              id="topic-desc"
              value={formData.description}
              onChange={(e) => setFormData({...formData, description: e.target.value})}
              className="w-full rounded-xl border border-slate-600 bg-slate-900/50 text-white focus:border-primary focus:ring-primary p-3 outline-none"
              rows={3}
              placeholder="Detalhes da votação..."
            />
          </div>
          {!editingId && (
            <div>
              <label htmlFor="topic-file" className="block text-sm font-medium text-slate-300 mb-1">Anexo Visual/Documento (Opcional)</label>
              <div className="relative border border-dashed border-slate-600 rounded-xl p-4 flex flex-col items-center justify-center bg-slate-900/30 group hover:border-indigo-400 transition-colors">
                <input
                  id="topic-file"
                  type="file"
                  accept="image/*,.pdf"
                  onChange={(e) => setFormData({...formData, attachmentFile: e.target.files?.[0] || null})}
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                  aria-label="Selecionar anexo para a pauta"
                />
                {formData.attachmentFile ? (
                  <span className="text-sm font-bold text-indigo-400 truncate w-full text-center px-2">{formData.attachmentFile.name}</span>
                ) : (
                  <span className="text-sm text-slate-400 group-hover:text-indigo-400 font-medium">Toque para anexar PDF ou Imagem</span>
                )}
              </div>
            </div>
          )}
        </div>
        <div className="p-6 border-t border-slate-700 flex justify-end gap-3 bg-slate-900/80">
          <button disabled={submitting} onClick={() => setIsModalOpen(false)} className="px-4 py-2 text-sm font-medium text-slate-300 hover:bg-slate-700 rounded-lg transition-colors">
            Cancelar
          </button>
          <button disabled={submitting} onClick={() => handleSaveTopic()} className="px-4 py-2 text-sm font-bold text-white bg-primary hover:bg-primary-hover rounded-lg transition-colors shadow-md shadow-primary/20">
            {submitting ? 'Salvando...' : 'Salvar Pauta'}
          </button>
        </div>
      </Modal>

      <ConfirmDialog
        open={!!pendingAction}
        onClose={() => setPendingAction(null)}
        onConfirm={confirmAction}
        title={pendingAction?.type === 'delete' ? 'Excluir Pauta' : pendingAction?.type === 'open' ? 'Iniciar Votação' : pendingAction?.type === 'publish' ? 'Publicar Pauta' : 'Encerrar Votação'}
        message={
          pendingAction?.type === 'delete'
            ? 'Deseja realmente excluir esta pauta? Esta ação não pode ser desfeita.'
            : pendingAction?.type === 'publish'
            ? 'Deseja publicar esta pauta? Os moradores poderão visualizá-la, mas a votação permanecerá bloqueada até que você a inicie.'
            : pendingAction?.type === 'open'
            ? 'Deseja iniciar a votação desta pauta? Os moradores poderão registrar seus votos a partir de agora.'
            : 'Deseja realmente encerrar a votação desta pauta? Ninguém mais poderá votar.'
        }
        confirmLabel={pendingAction?.type === 'delete' ? 'Excluir' : pendingAction?.type === 'open' ? 'Iniciar Votação' : pendingAction?.type === 'publish' ? 'Publicar' : 'Encerrar'}
      />
    </div>
  );
}
