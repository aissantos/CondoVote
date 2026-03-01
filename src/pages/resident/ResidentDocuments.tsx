import React, { useState, useEffect } from 'react';
import { FileText, Loader2, Download, Search, AlertCircle, FileBarChart2, FileBadge2, FileWarning } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';

type AssemblyDocument = {
  id: string;
  title: string;
  file_url: string;
  document_type: 'EDITAL' | 'ATA' | 'BALANCETE' | 'OUTROS';
  created_at: string;
  assembly: {
    title: string;
    assembly_date: string;
    format?: string;
  };
};

export default function ResidentDocuments() {
  const { profile } = useAuth();
  const [documents, setDocuments] = useState<AssemblyDocument[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    fetchDocuments();
  }, []);

  const fetchDocuments = async () => {
    setLoading(true);
    
    // We fetch documents and join with assemblies to categorize them by their parent session
    const { data, error } = await supabase
      .from('assembly_documents')
      .select(`
        *,
        assembly:assemblies(title, assembly_date, format)
      `)
      .eq('condo_id', profile?.condo_id)
      .order('created_at', { ascending: false });
      
    if (!error && data) {
      setDocuments(data as any);
    }
    setLoading(false);
  };

  const getDocTypeIcon = (type: string) => {
    switch(type) {
      case 'EDITAL': return <FileWarning size={20} className="text-amber-500" />;
      case 'ATA': return <FileBadge2 size={20} className="text-emerald-500" />;
      case 'BALANCETE': return <FileBarChart2 size={20} className="text-blue-500" />;
      default: return <FileText size={20} className="text-slate-500" />;
    }
  };

  const filteredDocs = documents.filter(doc => 
    doc.title.toLowerCase().includes(searchTerm.toLowerCase()) || 
    doc.assembly.title.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="flex flex-col min-h-screen bg-background-light dark:bg-background-dark font-display antialiased transition-colors">
      
      {/* Dynamic Header */}
      <header className="bg-white/80 dark:bg-surface-dark/80 backdrop-blur-md sticky top-0 z-10 px-6 pt-12 pb-4 shadow-sm border-b border-slate-200 dark:border-surface-border">
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white leading-tight">Documentos</h1>
        <p className="text-sm font-medium text-slate-500 dark:text-text-secondary mt-1">Biblioteca de arquivos e atas.</p>
        
        <div className="mt-4 relative">
          <input 
            type="text" 
            placeholder="Buscar por Documentos ou Reuniões..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-slate-100 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700/50 rounded-xl py-2.5 pl-10 pr-4 text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary/50"
          />
          <Search size={16} className="absolute left-3.5 top-3 text-slate-400" />
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 p-4 pb-12 overflow-y-auto">
        {loading ? (
          <div className="flex flex-col items-center justify-center p-12 text-primary gap-3 mt-10">
            <Loader2 className="animate-spin size-8" />
            <span className="text-sm font-medium">Buscando na biblioteca...</span>
          </div>
        ) : filteredDocs.length === 0 ? (
          <div className="flex flex-col items-center justify-center text-center p-8 mt-10 bg-white dark:bg-surface-dark rounded-2xl border border-slate-100 dark:border-surface-border shadow-sm">
             <div className="w-16 h-16 bg-slate-50 dark:bg-slate-800 rounded-full flex items-center justify-center mb-4 text-slate-300 dark:text-slate-600">
               <AlertCircle size={32} />
             </div>
             <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-2">Nenhum documento</h3>
             <p className="text-sm text-slate-500 dark:text-slate-400">Até o momento, o síndico não enviou nenhuma Ata ou Edital em anexo para o seu condomínio.</p>
          </div>
        ) : (
          <div className="flex flex-col gap-3">
             {filteredDocs.map((doc) => (
                <div key={doc.id} className="bg-white dark:bg-surface-dark border border-slate-200 dark:border-surface-border rounded-xl p-4 flex flex-col shadow-[0_2px_8px_-4px_rgba(0,0,0,0.1)] dark:shadow-none transition-transform active:scale-[0.98]">
                  <div className="flex justify-between items-start mb-1">
                     <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded-full inline-block">
                        Emissão: {new Date(doc.created_at).toLocaleDateString()}
                     </span>
                     <span className="text-[10px] font-bold uppercase tracking-wider opacity-60 dark:text-slate-500">
                        {doc.document_type}
                     </span>
                  </div>

                  <div className="flex items-center gap-3 mt-2 mb-3">
                    <div className="shrink-0 p-2.5 bg-slate-50 dark:bg-slate-800 rounded-xl">
                       {getDocTypeIcon(doc.document_type)}
                    </div>
                    <div className="flex-1 min-w-0 pr-2">
                      <h4 className="text-slate-900 dark:text-white font-bold text-sm leading-tight truncate">{doc.title}</h4>
                      <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 truncate max-w-[200px] flex items-center gap-1">
                        Reunião: {doc.assembly?.title || 'Avulso'} 
                        {doc.assembly?.format && <span className="bg-slate-200 dark:bg-slate-700 px-1.5 py-0.5 rounded text-[9px] font-bold uppercase">{doc.assembly.format}</span>}
                      </p>
                    </div>
                  </div>

                  <a 
                    href={doc.file_url} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="w-full flex items-center justify-center gap-2 py-2.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800/80 dark:hover:bg-slate-700/80 text-primary dark:text-indigo-400 rounded-lg text-sm font-bold transition-colors mt-auto"
                  >
                    <Download size={16} /> Fazer Download
                  </a>
                </div>
             ))}
          </div>
        )}
      </main>

    </div>
  );
}
