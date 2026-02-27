import { Link, useLocation } from 'react-router-dom';
import { ListTodo, Vote, FileText, User } from 'lucide-react';

export default function BottomNav() {
  const location = useLocation();
  const activeTab = location.pathname.includes('voting') ? 'voting' : 'topics';

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-white dark:bg-[#192633] border-t border-slate-200 dark:border-slate-800 pb-safe pt-2 px-4 z-20">
      <div className="flex justify-between items-center max-w-md mx-auto h-16">
        <Link
          to="/topics"
          className={`flex flex-1 flex-col items-center justify-center gap-1 transition-colors ${
            activeTab === 'topics' ? 'text-primary' : 'text-slate-400 dark:text-[#92adc9]'
          }`}
        >
          <ListTodo size={24} className={activeTab === 'topics' ? 'fill-current' : ''} />
          <span className="text-[10px] font-medium">Pautas</span>
        </Link>
        <Link
          to="/voting"
          className={`flex flex-1 flex-col items-center justify-center gap-1 transition-colors ${
            activeTab === 'voting' ? 'text-primary' : 'text-slate-400 dark:text-[#92adc9]'
          }`}
        >
          <Vote size={24} className={activeTab === 'voting' ? 'fill-current' : ''} />
          <span className="text-[10px] font-medium">Votação</span>
        </Link>
        <Link
          to="#"
          className="flex flex-1 flex-col items-center justify-center gap-1 text-slate-400 dark:text-[#92adc9] transition-colors"
        >
          <FileText size={24} />
          <span className="text-[10px] font-medium">Documentos</span>
        </Link>
        <Link
          to="#"
          className="flex flex-1 flex-col items-center justify-center gap-1 text-slate-400 dark:text-[#92adc9] transition-colors"
        >
          <User size={24} />
          <span className="text-[10px] font-medium">Perfil</span>
        </Link>
      </div>
    </div>
  );
}
