import React, { useState, useEffect } from 'react';
import { Upload, Trash2, Loader2, Lock, ArrowLeft, FileText, File as FileIcon, Download, AlertCircle } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { useToast } from '../../hooks/useToast';
import ConfirmDialog from '../../components/ConfirmDialog';
import { uploadAssemblyDocument, getSignedDocumentUrl } from '../../lib/storage';
import type { Database } from '../../lib/database.types';

type InsertDocumentPayload = Database['public']['Tables']['assembly_documents']['Insert'];

type AssemblyDocument = {
  id: string;
  title: string;
  file_url: string;
  document_type: 'EDITAL' | 'ATA' | 'BALANCETE' | 'OUTROS';
  created_at: string;
};

export default function AdminDocuments() {
  const { user, profile } = useAuth();
  const navigate = useNavigate();
  const toast = useToast();
  const [searchParams] = useSearchParams();
  const assemblyId = searchParams.get('assembly_id');
  const assemblyTitle = searchParams.get('title');

  const [documents, setDocuments] = useState<AssemblyDocument[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [fileError, setFileError] = useState<string | null>(null);

  // Confirm Dialog state
  const [pendingDoc, setPendingDoc] = useState<AssemblyDocument | null>(null);

  // Form state
  const [formData, setFormData] = useState({ 
    title: '', 
    document_type: 'EDITAL' as 'EDITAL' | 'ATA' | 'BALANCETE' | 'OUTROS',
    file: null as File | null
  });

  useEffect(() => {
    if (assemblyId) {
      fetchDocuments();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [assemblyId]);

  const fetchDocuments = async () => {
    if (!assemblyId) return;
    setLoading(true);
    const { data, error } = await supabase
      .from('assembly_documents')
      .select('*')
      .eq('assembly_id', assemblyId)
      .order('created_at', { ascending: false });
      
    if (!error && data) {
      setDocuments(data as AssemblyDocument[]);
    }
    setLoading(false);
  };

  const handleOpenNewDocument = () => {
    setFormData({ 
      title: '', 
      document_type: 'EDITAL',
      file: null
    });
    setUploadProgress(0);
    setFileError(null);
    setIsModalOpen(true);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    setFileError(null);
    
    if (file) {
      if (file.size > 5 * 1024 * 1024) { // 5MB limit
        setFileError('O arquivo deve ter no máximo 5MB.');
        return;
      }
      if (file.type !== 'application/pdf') {
        setFileError('Apenas arquivos PDF são permitidos.');
        return;
      }
      setFormData({ ...formData, file, title: formData.title || file.name.replace('.pdf', '') });
    }
  };

  const _generateFileName = (originalName: string) => {
    const timestamp = new Date().getTime();
    const cleanName = originalName.replace(/[^a-zA-Z0-9.-]/g, '_');
    return `${profile?.condo_id}/${assemblyId}/${timestamp}_${cleanName}`;
  };

  const handleUploadAndSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title) { toast.warning('O título do documento é obrigatório.'); return; }
    if (!formData.file) { toast.warning('O arquivo PDF é obrigatório.'); return; }
    if (!assemblyId) { toast.error('Erro de contexto (Assembly ID ausente)'); return; }

    setSubmitting(true);
    setUploadProgress(10);

    try {
      // 1. Upload file → retorna o filePath relativo (para URL assinada futura)
      const filePath = await uploadAssemblyDocument(
        formData.file,
        profile?.condo_id ?? 'unknown',
        assemblyId
      );

      if (!filePath) throw new Error('Falha no upload do arquivo.');
      setUploadProgress(60);

      // 2. Salvar registro no banco com o filePath (não URL pública)
      const docPayload: InsertDocumentPayload = {
        title: formData.title,
        document_type: formData.document_type as InsertDocumentPayload['document_type'],
        file_url: filePath,          // Armazena path, não URL pública
        created_by: user?.id,
        condo_id: profile?.condo_id,
        assembly_id: assemblyId
      };

      const { error: dbError } = await supabase.from('assembly_documents').insert([docPayload]);

      if (dbError) throw dbError;
      setUploadProgress(100);

      setIsModalOpen(false);
      fetchDocuments();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Erro desconhecido';
      toast.error('Erro durante o envio do documento: ' + msg);
    } finally {
      setSubmitting(false);
      setUploadProgress(0);
    }
  };

  const handleDelete = (doc: AssemblyDocument) => setPendingDoc(doc);

  const confirmDelete = async () => {
    if (!pendingDoc) return;
    const doc = pendingDoc;
    setPendingDoc(null);
    
    try {
      const { error: dbError } = await supabase.from('assembly_documents').delete().eq('id', doc.id);
      if (dbError) throw dbError;

      try {
        const pathParts = doc.file_url.split('/assembly_documents/');
        if (pathParts.length > 1) {
           const storagePath = pathParts[1];
           await supabase.storage.from('assembly_documents').remove([storagePath]);
        }
      } catch (storageErr) {
        console.warn("Documento removido do BD, mas falha ao remover arquivo do Storage", storageErr);
      }

      fetchDocuments();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Erro desconhecido';
      toast.error('Erro ao excluir documento: ' + msg);
    }
  };

  const getDocTypeColor = (type: string) => {
    switch(type) {
      case 'EDITAL': return 'bg-blue-100 text-blue-700 dark:bg-blue-500/10 dark:text-blue-400 border-blue-200 dark:border-blue-500/20';
      case 'ATA': return 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400 border-emerald-200 dark:border-emerald-500/20';
      case 'BALANCETE': return 'bg-amber-100 text-amber-700 dark:bg-amber-500/10 dark:text-amber-400 border-amber-200 dark:border-amber-500/20';
      default: return 'bg-slate-100 text-slate-700 dark:bg-slate-500/10 dark:text-slate-400 border-slate-200 dark:border-slate-500/20';
    }
  };

  if (!assemblyId) {
    return (
      <div className="flex flex-col items-center justify-center p-12 text-center h-[60vh]">
         <div className="bg-orange-100 text-orange-600 dark:bg-orange-500/10 dark:text-orange-400 p-4 rounded-full mb-4">
            <Lock size={32} />
         </div>
         <h3 className="text-xl font-bold mb-2 text-slate-900 dark:text-white">Nenhuma Assembleia Selecionada</h3>
         <p className="text-slate-500 dark:text-slate-400 mb-6">Você precisa acessar uma Assembleia específica para realizar o envio de documentos (Atas, Editais).</p>
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
          <h2 className="text-3xl font-bold text-slate-900 dark:text-white break-all">Documentos <span className="text-indigo-600 dark:text-indigo-400 font-medium text-xl ml-2 text-wrap">({assemblyTitle || 'Assembleia Atual'})</span></h2>
          <p className="text-slate-500 dark:text-slate-400 mt-1">Gerencie arquivos, atas e relatórios atrelados a esta reunião</p>
        </div>
        <button
          onClick={handleOpenNewDocument}
          className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-sm font-bold transition-colors shadow-lg shadow-indigo-600/20 shrink-0"
        >
          <Upload size={18} />
          <span className="hidden sm:inline">Enviar Arquivo</span>
        </button>
      </div>

      <div className="bg-white dark:bg-surface-dark rounded-2xl border border-slate-200 dark:border-border-dark shadow-sm overflow-hidden p-6">
        {loading ? (
          <div className="p-12 flex justify-center text-primary">
            <Loader2 className="animate-spin size-8" />
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {documents.length === 0 ? (
              <div className="col-span-full py-12 text-center">
                 <div className="bg-slate-50 dark:bg-slate-800/50 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-4 border border-slate-100 dark:border-slate-700">
                   <FileIcon className="size-10 text-slate-300 dark:text-slate-600" />
                 </div>
                 <h4 className="text-slate-900 dark:text-white font-bold mb-1">Nenhum Documento Localizado</h4>
                 <p className="text-slate-500 dark:text-slate-400 text-sm max-w-sm mx-auto">Envie editais, lista de presenças ou atas para compilar os registros desta assembleia.</p>
              </div>
            ) : (
              documents.map((doc) => (
                <div key={doc.id} className="group relative flex flex-col bg-slate-50 dark:bg-slate-800/30 border border-slate-200 dark:border-border-dark rounded-xl p-4 hover:border-indigo-400 dark:hover:border-indigo-500/50 transition-all">
                  <div className="flex justify-between items-start mb-3">
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border uppercase tracking-wider ${getDocTypeColor(doc.document_type)}`}>
                      {doc.document_type}
                    </span>
                    <button 
                      onClick={() => handleDelete(doc)} 
                      className="p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 rounded-lg transition-colors opacity-0 group-hover:opacity-100"
                      title="Excluir Documento"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                  
                  <div className="flex gap-3 mb-4">
                     <div className="w-10 h-10 shrink-0 bg-red-100 dark:bg-red-500/10 text-red-600 dark:text-red-400 flex items-center justify-center rounded-lg">
                        <FileText size={20} />
                     </div>
                     <div className="flex-1 min-w-0 flex flex-col justify-center">
                        <h4 className="text-sm font-bold text-slate-900 dark:text-white truncate" title={doc.title}>{doc.title}</h4>
                        <span className="text-xs text-slate-500 dark:text-slate-400">
                          Enviado em {new Date(doc.created_at).toLocaleDateString()}
                        </span>
                     </div>
                  </div>

                  <button
                    type="button"
                    onClick={async () => {
                      const url = await getSignedDocumentUrl(doc.file_url);
                      if (url) {
                        window.open(url, '_blank', 'noopener noreferrer');
                      } else {
                        toast.error('Não foi possível acessar o documento. Tente novamente.');
                      }
                    }}
                    className="mt-auto flex items-center justify-center gap-2 w-full py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-lg text-sm font-bold transition-colors"
                  >
                    <Download size={16} /> Visualizar PDF
                  </button>

                </div>
              ))
            )}
          </div>
        )}
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-surface-dark rounded-2xl w-full max-w-md shadow-xl border border-slate-200 dark:border-border-dark overflow-hidden">
            <div className="p-6 border-b border-slate-200 dark:border-border-dark flex justify-between items-center bg-slate-50 dark:bg-slate-800/50">
              <h3 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Upload size={20} className="text-indigo-600 dark:text-indigo-400" /> 
                Anexar Documento
              </h3>
              <button disabled={submitting} onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200">
                &times;
              </button>
            </div>
            <form onSubmit={handleUploadAndSave}>
              <div className="p-6 space-y-4">
                
                {/* File Upload Zone */}
                <div>
                   <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Arquivo PDF</label>
                   <div className="relative border-2 border-dashed border-slate-300 dark:border-slate-700 hover:border-indigo-400 dark:hover:border-indigo-500 rounded-xl p-6 flex flex-col items-center justify-center bg-slate-50 dark:bg-slate-800/30 transition-colors text-center">
                     <input 
                        type="file" 
                        accept=".pdf,application/pdf"
                        onChange={handleFileChange}
                        disabled={submitting}
                        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer disabled:cursor-not-allowed" 
                      />
                      <FileIcon className="size-8 text-slate-400 mb-2" />
                      {formData.file ? (
                        <div className="text-sm font-bold text-indigo-600 dark:text-indigo-400 truncate w-full px-4">{formData.file.name}</div>
                      ) : (
                        <>
                          <div className="text-sm font-bold text-indigo-600 dark:text-indigo-400">Clique para buscar seu PDF</div>
                          <div className="text-xs text-slate-500 mt-1">Límite máximo 5MB. Somente .pdf</div>
                        </>
                      )}
                   </div>
                   {fileError && <p className="text-red-500 text-xs mt-1.5 flex items-center gap-1"><AlertCircle size={12}/> {fileError}</p>}
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Classificação do Documento</label>
                  <select
                    value={formData.document_type}
                    disabled={submitting}
                    onChange={(e) => setFormData({...formData, document_type: e.target.value as 'EDITAL' | 'ATA' | 'BALANCETE' | 'OUTROS'})}
                    className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:border-indigo-500 focus:ring-indigo-500 h-10 px-3 outline-none appearance-none"
                  >
                    <option value="EDITAL">Edital de Convocação</option>
                    <option value="ATA">Ata da Assembleia</option>
                    <option value="BALANCETE">Relatório / Balancete</option>
                    <option value="OUTROS">Outros Documentos</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Título do Arquivo <span className="text-slate-400 font-normal">(Visível p/ Moradores)</span></label>
                  <input 
                    type="text" 
                    disabled={submitting}
                    value={formData.title}
                    onChange={(e) => setFormData({...formData, title: e.target.value})}
                    className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:border-indigo-500 focus:ring-indigo-500 h-10 px-3 outline-none" 
                    placeholder="Ex: Edital Assinado 2026..." 
                  />
                </div>
                
                {/* Upload Progress Bar */}
                {submitting && (
                  <div className="w-full bg-slate-200 dark:bg-slate-700 rounded-full h-2 mb-2 overflow-hidden">
                    <div className="bg-indigo-600 h-2 rounded-full transition-all duration-300" style={{ width: `${uploadProgress}%` }}></div>
                  </div>
                )}
                
              </div>
              
              <div className="p-6 border-t border-slate-200 dark:border-border-dark flex justify-end gap-3 bg-white dark:bg-surface-dark">
                <button type="button" disabled={submitting} onClick={() => setIsModalOpen(false)} className="px-4 py-2 text-sm font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors">
                  Cancelar
                </button>
                <button type="submit" disabled={submitting || !formData.file || !!fileError} className="px-5 py-2 text-sm font-bold text-white bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-400 dark:disabled:bg-indigo-800 disabled:cursor-not-allowed rounded-lg transition-colors shadow-md shadow-indigo-600/20 flex items-center gap-2">
                  {submitting ? <><Loader2 className="animate-spin" size={16}/> Processando...</> : 'Enviar e Salvar'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <ConfirmDialog
        open={!!pendingDoc}
        onClose={() => setPendingDoc(null)}
        onConfirm={confirmDelete}
        title="Excluir Documento"
        message={`Deseja realmente excluir o documento "${pendingDoc?.title}"? O arquivo será deletado permanentemente e não poderá ser recuperado.`}
        confirmLabel="Excluir Permanentemente"
      />
    </div>
  );
}
