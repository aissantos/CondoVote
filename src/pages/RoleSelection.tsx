import { useNavigate } from 'react-router-dom';
import { Users, ShieldCheck, Building2 } from 'lucide-react';

export default function RoleSelection() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-6 bg-background-light dark:bg-background-dark">
      <div className="w-full max-w-md space-y-8">
        <div className="text-center">
          <div className="inline-flex items-center justify-center size-20 rounded-full bg-primary/10 mb-6">
            <Building2 className="text-primary size-10" />
          </div>
          <h1 className="text-3xl font-bold text-slate-900 dark:text-white mb-2">CondoVote</h1>
          <p className="text-slate-500 dark:text-slate-400">Sistema de Assembleia Digital</p>
        </div>

        <div className="grid gap-4 mt-12">
          <button
            onClick={() => navigate('/check-in')}
            className="flex items-center p-6 bg-white dark:bg-surface-dark border border-slate-200 dark:border-border-dark rounded-2xl shadow-sm hover:border-primary dark:hover:border-primary transition-all group text-left"
          >
            <div className="size-14 rounded-full bg-primary/10 flex items-center justify-center mr-5 group-hover:bg-primary group-hover:text-white transition-colors text-primary">
              <Users size={28} />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-900 dark:text-white">Sou Morador</h2>
              <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">Fazer check-in e votar nas pautas</p>
            </div>
          </button>

          <button
            onClick={() => navigate('/admin')}
            className="flex items-center p-6 bg-white dark:bg-surface-dark border border-slate-200 dark:border-border-dark rounded-2xl shadow-sm hover:border-primary dark:hover:border-primary transition-all group text-left"
          >
            <div className="size-14 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center mr-5 group-hover:bg-primary group-hover:text-white transition-colors text-slate-600 dark:text-slate-300">
              <ShieldCheck size={28} />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-900 dark:text-white">Sou Síndico</h2>
              <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">Gerenciar assembleia e pautas</p>
            </div>
          </button>
        </div>
      </div>
    </div>
  );
}
