import React, { useState, useEffect } from 'react';
import { Plus, Edit2, Trash2, Clock, CheckCircle2, Loader2, Lock, ArrowRight, FileText } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';

type Assembly = {
  id: string;
  title: string;
  description: string;
  assembly_date: string;
  assembly_type: 'AGO' | 'AGE';
  status: 'OPEN' | 'CLOSED' | 'DRAFT';
  created_at: string;
};

export default function AdminAssemblies() {
  const { user, profile } = useAuth();
  const navigate = useNavigate();
  const [assemblies, setAssemblies] = useState<Assembly[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  
  // Form state
  const [formData, setFormData] = useState({ 
    title: '', 
    description: '',
    assembly_date: new Date().toISOString().split('T')[0],
    assembly_type: 'AGO' as 'AGO' | 'AGE'
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
      assembly_type: 'AGO'
    });
    setIsModalOpen(true);
  };

  const openEditModal = (assembly: Assembly) => {
    setEditingId(assembly.id);
    setFormData({ 
      title: assembly.title, 
      description: assembly.description || '',
      assembly_date: assembly.assembly_date,
      assembly_type: assembly.assembly_type
    });
    setIsModalOpen(true);
  };

  const handleSave = async (status: 'DRAFT' | 'OPEN') => {
    if (!formData.title) return alert('Título é obrigatório');
    if (!formData.assembly_date) return alert('Data é obrigatória');
    setSubmitting(true);
    
    if (editingId) {
      const { error } = await supabase.from('assemblies').update({
        title: formData.title,
        description: formData.description,
        assembly_date: formData.assembly_date,
        assembly_type: formData.assembly_type,
        status
      }).eq('id', editingId);

      setSubmitting(false);
      if (!error) {
        setIsModalOpen(false);
        setEditingId(null);
        fetchAssemblies();
      } else {
        alert('Erro ao atualizar assembleia: ' + error.message);
      }
    } else {
      const { error } = await supabase.from('assemblies').insert([
        {
          title: formData.title,
          description: formData.description,
          assembly_date: formData.assembly_date,
          assembly_type: formData.assembly_type,
          status,
          created_by: user?.id,
          condo_id: profile?.condo_id
        }
      ]);

      setSubmitting(false);
      if (!error) {
        setIsModalOpen(false);
        fetchAssemblies();
      } else {
        alert('Erro ao criar assembleia: ' + error.message);
      }
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
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Título da Assembleia</label>
                <input 
                  type="text" 
                  value={formData.title}
                  onChange={(e) => setFormData({...formData, title: e.target.value})}
                  className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:border-primary focus:ring-primary h-10 px-3 outline-none" 
                  placeholder="Ex: Assembleia Geral Ordinária 2026" 
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Tipo</label>
                  <select
                    value={formData.assembly_type}
                    onChange={(e) => setFormData({...formData, assembly_type: e.target.value as 'AGO' | 'AGE'})}
                    className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:border-primary focus:ring-primary h-10 px-3 outline-none appearance-none"
                  >
                    <option value="AGO">AGO (Ordinária)</option>
                    <option value="AGE">AGE (Extraordinária)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Data</label>
                  <input 
                    type="date" 
                    value={formData.assembly_date}
                    onChange={(e) => setFormData({...formData, assembly_date: e.target.value})}
                    className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:border-primary focus:ring-primary h-10 px-3 outline-none" 
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Descrição / Finalidade</label>
                <textarea 
                  value={formData.description}
                  onChange={(e) => setFormData({...formData, description: e.target.value})}
                  className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:border-primary focus:ring-primary p-3 outline-none" 
                  rows={2} 
                  placeholder="Breve resumo..."
                ></textarea>
              </div>
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
