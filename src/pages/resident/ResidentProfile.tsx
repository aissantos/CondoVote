import React from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { LogOut, User as UserIcon } from 'lucide-react';

export default function ResidentProfile() {
  const { profile, signOut } = useAuth();

  return (
    <div className="flex flex-col h-full bg-background-light dark:bg-background-dark px-6 pt-10 pb-6">
      <div className="text-center mb-8 mt-4">
        <div className="inline-flex items-center justify-center size-20 rounded-full bg-primary/10 mb-4">
          <UserIcon className="text-primary size-10" />
        </div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-800 dark:text-slate-100">
          {profile?.full_name}
        </h1>
        <p className="text-sm text-slate-500 dark:text-slate-400 font-medium">Morador(a)</p>
      </div>

      <div className="bg-white dark:bg-surface-dark rounded-2xl p-6 shadow-sm border border-slate-100 dark:border-border-dark space-y-4 mb-6">
         <div>
            <p className="text-xs text-slate-500 font-medium">Bloco / Rua</p>
            <p className="text-base font-semibold text-slate-800 dark:text-slate-200">{profile?.block_number}</p>
         </div>
         <div>
            <p className="text-xs text-slate-500 font-medium">Unidade</p>
            <p className="text-base font-semibold text-slate-800 dark:text-slate-200">{profile?.unit_number}</p>
         </div>
      </div>

      <button
        onClick={signOut}
        className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-red-50 text-red-600 dark:bg-red-500/10 dark:text-red-400 font-medium"
      >
        <LogOut className="size-5" />
        Sair do Aplicativo
      </button>
    </div>
  );
}
