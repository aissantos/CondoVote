import React, { useState, useEffect } from 'react';
import { Plus, Edit2, Trash2, Clock, CheckCircle2, Loader2, Lock, ArrowRight, FileText, Image, FileWarning, Video } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { useToast } from '../../hooks/useToast';

type Assembly = {
  id: string;
  title: string;
  description: string;
  assembly_date: string;
  assembly_type: 'AGO' | 'AGE';
  status: 'DRAFT' | 'OPEN' | 'CLOSED';
  format?: 'PRESENCIAL' | 'REMOTO' | 'HIBRIDO';
  first_call_time?: string;
  second_call_time?: string;
  cover_url?: string;
  notice_url?: string;
  created_at: string;
};

export default function AdminAssemblies() {
  const { user, profile } = useAuth();
  const navigate = useNavigate();
  const toast = useToast();
  const [assemblies, setAssemblies] = useState<Assembly[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  
  // Form state
  const [formData, setFormData] = useState({ 
    title: '', 
    description: '', 
    assembly_date: new Date().toISOString().split('T')[0],
    assembly_type: 'AGO' as 'AGO' | 'AGE',
    format: 'HIBRIDO' as 'PRESENCIAL' | 'REMOTO' | 'HIBRIDO',
    first_call_time: '',
    second_call_time: '',
    coverFile: null as File | null,
    noticeFile: null as File | null
  });
  const [editingId, setEditingId] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchAssemblies();
  }, []);

  const fetchAssemblies = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('assemblies')
      .select('*')
      .eq('condo_id', profile?.condo_id)
      .order('assembly_date', { ascending: false });
      
    if (!error && data) {
      setAssemblies(data);
    }
    setLoading(false);
  };

  const handleOpenNew = () => {
    setEditingId(null);
    setFormData({ 
      title: '', 
      description: '', 
      assembly_date: new Date().toISOString().split('T')[0],
      assembly_type: 'AGO',
      format: 'HIBRIDO',
      first_call_time: '',
      second_call_time: '',
      coverFile: null,
      noticeFile: null
    });
    setIsModalOpen(true);
  };

  const openEditModal = (assembly: Assembly) => {
    setEditingId(assembly.id);
    setFormData({ 
      title: assembly.title, 
      description: assembly.description || '',
      assembly_date: assembly.assembly_date,
      assembly_type: assembly.assembly_type,
      format: assembly.format || 'HIBRIDO',
      first_call_time: assembly.first_call_time || '',
      second_call_time: assembly.second_call_time || '',
      coverFile: null,
      noticeFile: null
    });
    setIsModalOpen(true);
  };

  const generateFileName = (originalName: string) => {
    const timestamp = new Date().getTime();
    const cleanName = originalName.replace(/[^a-zA-Z0-9.-]/g, '_');
    return `${profile?.condo_id}/${timestamp}_${cleanName}`;
  };

  const handleSave = async (status: 'DRAFT' | 'OPEN') => {
    if (!formData.assembly_date) {
      toast.warning('Data é obrigatória');
      return;
    }
    setSubmitting(true);
    
    try {
        let cover_url = undefined;
        let notice_url = undefined;

        // 1. Upload Cover Image se houver
        if (formData.coverFile) {
            const fileName = generateFileName(formData.coverFile.name);
            const { error: coverUploadError } = await supabase.storage
              .from('assembly_covers')
              .upload(fileName, formData.coverFile);

            if (!coverUploadError) {
               const { data } = supabase.storage.from('assembly_covers').getPublicUrl(fileName);
               cover_url = data.publicUrl;
            } else {
               console.error("Erro no upload da capa:", coverUploadError);
            }
        }

        // 2. Upload Notice PDF se houver
        if (formData.noticeFile) {
            const fileName = generateFileName(formData.noticeFile.name);
            const { error: noticeUploadError } = await supabase.storage
              .from('assembly_documents')
              .upload(fileName, formData.noticeFile);

            if (!noticeUploadError) {
               const { data } = supabase.storage.from('assembly_documents').getPublicUrl(fileName);
               notice_url = data.publicUrl;
            } else {
               console.error("Erro no upload do edital:", noticeUploadError);
            }
        }

        const fallbackTitle = `${formData.assembly_type} - ${new Date(formData.assembly_date + 'T12:00:00').toLocaleDateString()}`;

        if (editingId) {
          // Payload mínimo garantido — colunas opcionais adicionadas só se preenchidas
          const updatePayload: Record<string, unknown> = {
            title: fallbackTitle,
            description: formData.description,
            assembly_date: formData.assembly_date,
            assembly_type: formData.assembly_type,
            status,
          };
          if (formData.format) updatePayload.format = formData.format;
          if (formData.first_call_time) updatePayload.first_call_time = formData.first_call_time;
          if (formData.second_call_time) updatePayload.second_call_time = formData.second_call_time;
          if (cover_url) updatePayload.cover_url = cover_url;
          if (notice_url) updatePayload.notice_url = notice_url;

          const { error } = await supabase.from('assemblies').update(updatePayload).eq('id', editingId);
          if (error) throw error;
        } else {
          // Payload mínimo garantido — colunas opcionais adicionadas só se preenchidas
          const insertPayload: Record<string, unknown> = {
            title: fallbackTitle,
            description: formData.description,
            assembly_date: formData.assembly_date,
            assembly_type: formData.assembly_type,
            status,
            created_by: user?.id,
            condo_id: profile?.condo_id,
          };
          if (formData.format) insertPayload.format = formData.format;
          if (formData.first_call_time) insertPayload.first_call_time = formData.first_call_time;
          if (formData.second_call_time) insertPayload.second_call_time = formData.second_call_time;
          if (cover_url) insertPayload.cover_url = cover_url;
          if (notice_url) insertPayload.notice_url = notice_url;

          const { error } = await supabase.from('assemblies').insert([insertPayload]);
          if (error) throw error;
        }

        setIsModalOpen(false);
        setEditingId(null);
        fetchAssemblies();
    } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : 'Erro desconhecido';
        toast.error('Erro ao salvar assembleia: ' + msg);
    } finally {
        setSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Deseja realmente excluir esta assembleia e todas as suas pautas?')) return;
    const { error } = await supabase.from('assemblies').delete().eq('id', id);
    if (!error) fetchAssemblies();
  };

  const handleClose = async (id: string) => {
    if (!confirm('Deseja realmente encerrar esta assembleia?')) return;
    const { error } = await supabase.from('assemblies').update({ status: 'CLOSED' }).eq('id', id);
    if (!error) fetchAssemblies();
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
          <h2 className="text-3xl font-bold text-slate-900 dark:text-white">Assembleias</h2>
          <p className="text-slate-500 dark:text-slate-400 mt-1">Gerencie as reuniões e sessões de voto</p>
        </div>
        <button
          onClick={handleOpenNew}
          className="flex items-center gap-2 px-4 py-2 bg-primary hover:bg-primary-hover text-white rounded-lg text-sm font-bold transition-colors shadow-lg shadow-primary/20"
        >
          <Plus size={18} />
          Nova Assembleia
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
                  <th className="p-4 text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Assembleia</th>
                  <th className="p-4 text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Tipo</th>
                  <th className="p-4 text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Data</th>
                  <th className="p-4 text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Status</th>
                  <th className="p-4 text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider text-right">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 dark:divide-border-dark">
                {assemblies.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="p-8 text-center text-slate-500 dark:text-slate-400">
                      Nenhuma assembleia cadastrada.
                    </td>
                  </tr>
                ) : (
                  assemblies.map((assembly) => (
                    <tr key={assembly.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                      <td className="p-4 text-sm font-bold text-slate-900 dark:text-white max-w-xs">{assembly.title}</td>
                      <td className="p-4 text-sm font-medium text-slate-600 dark:text-slate-300">{assembly.assembly_type}</td>
                      <td className="p-4 text-sm text-slate-600 dark:text-slate-300 font-mono">
                        {new Date(assembly.assembly_date + 'T12:00:00').toLocaleDateString()}
                      </td>
                      <td className="p-4">
                        <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold ${getStatusStyle(assembly.status)}`}>
                          {assembly.status === 'OPEN' && <Clock size={12} />}
                          {assembly.status === 'CLOSED' && <CheckCircle2 size={12} />}
                          {getStatusLabel(assembly.status)}
                        </span>
                      </td>
                      <td className="p-4 flex items-center justify-end gap-2">
                        <button 
                          onClick={() => navigate(`/admin/documents?assembly_id=${assembly.id}&title=${encodeURIComponent(assembly.title)}`)} 
                          className="flex items-center gap-1 px-3 py-1.5 bg-indigo-50 hover:bg-indigo-100 dark:bg-indigo-500/10 dark:hover:bg-indigo-500/20 text-indigo-700 dark:text-indigo-400 rounded-lg text-xs font-bold transition-colors"
                        >
                          <FileText size={14} /> Docs
                        </button>
                        <button 
                          onClick={() => navigate(`/admin/topics?assembly_id=${assembly.id}&title=${encodeURIComponent(assembly.title)}`)} 
                          className="flex items-center gap-1 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-lg text-xs font-bold transition-colors"
                        >
                          Pautas <ArrowRight size={14} />
                        </button>
                        {assembly.status === 'OPEN' && (
                          <button onClick={() => handleClose(assembly.id)} title="Encerrar" className="p-2 text-slate-400 hover:text-orange-500 transition-colors rounded-lg hover:bg-orange-500/10">
                            <Lock size={16} />
                          </button>
                        )}
                        <button onClick={() => openEditModal(assembly)} title="Editar" className="p-2 text-slate-400 hover:text-primary transition-colors rounded-lg hover:bg-primary/10">
                          <Edit2 size={16} />
                        </button>
                        <button onClick={() => handleDelete(assembly.id)} title="Excluir" className="p-2 text-slate-400 hover:text-red-500 transition-colors rounded-lg hover:bg-red-500/10">
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
                {assemblies.length === 0 ? (
                  <div className="p-8 text-center text-slate-500 dark:text-slate-400">
                    Nenhuma assembleia cadastrada.
                  </div>
                ) : (
                  assemblies.map((assembly) => (
                    <div key={assembly.id} className="p-4 flex flex-col gap-3 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                      <div className="flex justify-between items-start gap-3">
                        <div className="flex-1">
                          <span className="text-[10px] uppercase font-bold text-slate-500 tracking-wider mb-1 block">{assembly.assembly_type}</span>
                          <h4 className="text-sm font-bold text-slate-900 dark:text-white leading-snug">
                            {assembly.title}
                          </h4>
                        </div>
                        <div className="flex items-center shrink-0 gap-1">
                          {assembly.status === 'OPEN' && (
                            <button onClick={() => handleClose(assembly.id)} className="p-2 text-slate-400 hover:text-orange-500 rounded-lg bg-orange-50 dark:bg-orange-500/10 hover:bg-orange-100">
                              <Lock size={16} />
                            </button>
                          )}
                          <button onClick={() => openEditModal(assembly)} className="p-2 text-slate-400 hover:text-primary rounded-lg bg-primary/5 hover:bg-primary/10">
                            <Edit2 size={16} />
                          </button>
                          <button onClick={() => handleDelete(assembly.id)} className="p-2 text-slate-400 hover:text-red-500 rounded-lg bg-red-50 dark:bg-red-500/10 hover:bg-red-100">
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </div>
                      
                      <div className="flex gap-2 justify-between items-center w-full">
                         <div className="flex gap-2 items-center">
                            <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold ${getStatusStyle(assembly.status)}`}>
                              {getStatusLabel(assembly.status)}
                            </span>
                            <span className="text-xs text-slate-500 dark:text-slate-400 font-mono">
                              {new Date(assembly.assembly_date + 'T12:00:00').toLocaleDateString()}
                            </span>
                         </div>
                         <button 
                            onClick={() => navigate(`/admin/documents?assembly_id=${assembly.id}&title=${encodeURIComponent(assembly.title)}`)} 
                            className="flex items-center gap-1.5 px-3 py-1.5 bg-indigo-50 hover:bg-indigo-100 dark:bg-indigo-500/10 dark:hover:bg-indigo-500/20 text-indigo-700 dark:text-indigo-400 rounded-lg text-xs font-bold shadow-sm"
                          >
                            <FileText size={14} /> Docs
                          </button>
                          <button 
                            onClick={() => navigate(`/admin/topics?assembly_id=${assembly.id}&title=${encodeURIComponent(assembly.title)}`)} 
                            className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-lg text-xs font-bold shadow-sm"
                          >
                            Pautas <ArrowRight size={14} />
                          </button>
                      </div>
                    </div>
                  ))
                )}
            </div>
          </>
        )}
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-surface-dark rounded-2xl w-full max-w-lg shadow-xl border border-slate-200 dark:border-border-dark overflow-hidden">
            <div className="p-6 border-b border-slate-200 dark:border-border-dark flex justify-between items-center">
              <h3 className="text-xl font-bold text-slate-900 dark:text-white">{editingId ? 'Editar Assembleia' : 'Nova Assembleia'}</h3>
              <button disabled={submitting} onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200">
                &times;
              </button>
            </div>
            <div className="p-6 space-y-5 overflow-y-auto max-h-[70vh]">
              {/* Informações Básicas */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Tipo da Reunião</label>
                  <select
                    value={formData.assembly_type}
                    onChange={(e) => setFormData({...formData, assembly_type: e.target.value as 'AGO' | 'AGE'})}
                    className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:border-primary focus:ring-primary h-11 px-3 outline-none appearance-none font-medium"
                  >
                    <option value="AGO">AGO (Ordinária)</option>
                    <option value="AGE">AGE (Extraordinária)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Data da Assembleia</label>
                  <input 
                    type="date" 
                    value={formData.assembly_date}
                    onChange={(e) => setFormData({...formData, assembly_date: e.target.value})}
                    className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:border-primary focus:ring-primary h-11 px-3 outline-none" 
                  />
                </div>
              </div>

              {/* Informações de Local e Formato */}
              <div className="bg-slate-50 dark:bg-slate-800/50 p-4 rounded-xl border border-slate-100 dark:border-slate-700 space-y-4">
                 <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Formato</label>
                    <div className="grid grid-cols-3 gap-2">
                       {['PRESENCIAL', 'REMOTO', 'HIBRIDO'].map((fmt) => (
                           <button
                             key={fmt}
                             onClick={() => setFormData({...formData, format: fmt as any})}
                             className={`py-2 text-xs font-bold rounded-lg border transition-all ${formData.format === fmt ? 'bg-indigo-50 border-indigo-200 text-indigo-700 dark:bg-indigo-500/20 dark:border-indigo-500/30 dark:text-indigo-300' : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50 dark:bg-slate-800 dark:border-slate-700 dark:text-slate-400'}`}
                           >
                             {fmt}
                           </button>
                       ))}
                    </div>
                 </div>

                 <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">1ª Convocação <span className="text-slate-400 font-normal text-xs">(hh:mm)</span></label>
                      <input 
                        type="time" 
                        value={formData.first_call_time}
                        onChange={(e) => setFormData({...formData, first_call_time: e.target.value})}
                        className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:border-primary focus:ring-primary h-10 px-3 outline-none" 
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">2ª Convocação <span className="text-slate-400 font-normal text-xs">(Opcional)</span></label>
                      <input 
                        type="time" 
                        value={formData.second_call_time}
                        onChange={(e) => setFormData({...formData, second_call_time: e.target.value})}
                        className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:border-primary focus:ring-primary h-10 px-3 outline-none" 
                      />
                    </div>
                 </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Descrição / Finalidade</label>
                <textarea 
                  value={formData.description}
                  onChange={(e) => setFormData({...formData, description: e.target.value})}
                  className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:border-primary focus:ring-primary p-3 outline-none" 
                  rows={2} 
                  placeholder="Resumo das pautas que serão deliberadas..."
                ></textarea>
              </div>

              {/* Arquivos */}
              {!editingId && (
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-1 flex items-center gap-1.5"><Image size={14}/> Imagem de Capa <span className="text-[10px] text-slate-400 font-normal">(PNG/JPG)</span></label>
                    <div className="relative border border-dashed border-slate-300 dark:border-slate-700 rounded-xl p-3 flex flex-col items-center justify-center bg-slate-50 dark:bg-slate-800 group hover:border-indigo-400 transition-colors">
                      <input 
                          type="file" 
                          accept="image/*"
                          onChange={(e) => setFormData({...formData, coverFile: e.target.files?.[0] || null})}
                          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" 
                        />
                        {formData.coverFile ? (
                          <span className="text-xs font-bold text-indigo-600 dark:text-indigo-400 truncate w-full text-center px-2">{formData.coverFile.name}</span>
                        ) : (
                          <span className="text-xs text-slate-500 group-hover:text-indigo-500 font-medium">Anexar Imagem</span>
                        )}
                    </div>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-1 flex items-center gap-1.5"><FileWarning size={14}/> Edital PDF <span className="text-[10px] text-slate-400 font-normal">(Max 5MB)</span></label>
                    <div className="relative border border-dashed border-slate-300 dark:border-slate-700 rounded-xl p-3 flex flex-col items-center justify-center bg-slate-50 dark:bg-slate-800 group hover:border-indigo-400 transition-colors">
                      <input 
                          type="file" 
                          accept=".pdf"
                          onChange={(e) => setFormData({...formData, noticeFile: e.target.files?.[0] || null})}
                          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" 
                        />
                        {formData.noticeFile ? (
                          <span className="text-xs font-bold text-indigo-600 dark:text-indigo-400 truncate w-full text-center px-2">{formData.noticeFile.name}</span>
                        ) : (
                          <span className="text-xs text-slate-500 group-hover:text-indigo-500 font-medium">Anexar PDF</span>
                        )}
                    </div>
                  </div>
                </div>
              )}
            </div>
            <div className="p-6 border-t border-slate-200 dark:border-border-dark flex justify-end gap-3 bg-slate-50 dark:bg-[#1c2e3e]">
              <button disabled={submitting} onClick={() => setIsModalOpen(false)} className="px-4 py-2 text-sm font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-lg transition-colors">
                Cancelar
              </button>
              <button disabled={submitting} onClick={() => handleSave('DRAFT')} className="px-4 py-2 text-sm font-bold text-primary bg-primary/10 hover:bg-primary/20 rounded-lg transition-colors">
                {submitting ? 'Salvando...' : 'Salvar Rascunho'}
              </button>
              <button disabled={submitting} onClick={() => handleSave('OPEN')} className="px-4 py-2 text-sm font-bold text-white bg-primary hover:bg-primary-hover rounded-lg transition-colors shadow-md shadow-primary/20">
                {submitting ? 'Salvando...' : 'Publicar'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
