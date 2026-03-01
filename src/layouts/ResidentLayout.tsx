import React from 'react';
import { Outlet, NavLink } from 'react-router-dom';
import { Home, Users, FileText, User } from 'lucide-react';

export default function ResidentLayout() {
  return (
    <div className="relative flex h-screen w-full flex-col overflow-hidden max-w-[430px] mx-auto bg-background-light dark:bg-background-dark shadow-2xl">
      {/* Área Principal de Conteúdo renderizada via React Router Outlet */}
      <main className="flex-1 overflow-y-auto pb-28">
        <Outlet />
      </main>

      {/* Bottom Navigation Navbar */}
      <nav className="absolute z-10 bottom-0 left-0 right-0 bg-white/80 dark:bg-surface-dark/80 backdrop-blur-xl px-8 pb-8 pt-4 border-t border-slate-100 dark:border-border-dark">
        <div className="flex items-center justify-between">
          <NavLink
            to="/resident/home"
            className={({ isActive }) =>
              `flex flex-col items-center gap-1.5 transition-colors ${
                isActive
                  ? 'text-primary dark:text-primary-hover'
                  : 'text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-300'
              }`
            }
          >
            <Home className="size-6" strokeWidth={2.5} />
            <span className="text-[9px] font-bold uppercase tracking-widest">Início</span>
          </NavLink>

          <NavLink
            to="/resident/assembly"
            className={({ isActive }) =>
              `flex flex-col items-center gap-1.5 transition-colors ${
                isActive
                  ? 'text-primary dark:text-primary-hover'
                  : 'text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-300'
              }`
            }
          >
            <Users className="size-6" strokeWidth={2.5} />
            <span className="text-[9px] font-bold uppercase tracking-widest">Assembleia</span>
          </NavLink>

          <NavLink
            to="/resident/documents"
            className={({ isActive }) =>
              `flex flex-col items-center gap-1.5 transition-colors ${
                isActive
                  ? 'text-primary dark:text-primary-hover'
                  : 'text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-300'
              }`
            }
          >
            <FileText className="size-6" strokeWidth={2.5} />
            <span className="text-[9px] font-bold uppercase tracking-widest">Documentos</span>
          </NavLink>

          <NavLink
            to="/resident/profile"
            className={({ isActive }) =>
              `flex flex-col items-center gap-1.5 transition-colors ${
                isActive
                  ? 'text-primary dark:text-primary-hover'
                  : 'text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-300'
              }`
            }
          >
            <User className="size-6" strokeWidth={2.5} />
            <span className="text-[9px] font-bold uppercase tracking-widest">Perfil</span>
          </NavLink>
        </div>
      </nav>
    </div>
  );
}
