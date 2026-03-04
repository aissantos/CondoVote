import { useState } from 'react';
import { Routes, Route, Link, useLocation, useNavigate, NavLink, Outlet } from 'react-router-dom';
import { LayoutDashboard, ListTodo, Activity, LogOut, Menu, X, Users, ChevronDown, HeartPulse } from 'lucide-react';
import AdminOverview from './AdminOverview';
import AdminTopics from './AdminTopics';
import AdminAssemblies from './AdminAssemblies';
import AdminDocuments from './AdminDocuments';
import AdminMonitor from './AdminMonitor';
import AdminUsers from './AdminUsers';
import AdminHealth from './AdminHealth';

export default function AdminDashboard() {
  const location = useLocation();
  const navigate = useNavigate();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const [isAssembliesOpen, setIsAssembliesOpen] = useState(false);


  const assemblySubItems = [
    { path: '/admin/assemblies', label: 'Gerenciar Sessões' },
    { path: '/admin/topics', label: 'Pautas' },
    { path: '/admin/documents', label: 'Documentos e Atas' }
  ];

  const secondaryNavItems = [
    { path: '/admin/monitor', icon: Activity, label: 'Monitor de Presença' },
    { path: '/admin/users', icon: Users, label: 'Moradores Base' },
    { path: '/admin/health', icon: HeartPulse, label: 'System Health' },
  ];


  return (
    <div className="flex h-screen bg-background-light dark:bg-background-dark overflow-hidden relative">
      {/* Mobile Top Bar */}
      <div className="md:hidden flex items-center justify-between p-4 bg-white dark:bg-surface-dark border-b border-slate-200 dark:border-border-dark w-full absolute top-0 z-20">
        <div className="flex flex-col">
          <h1 className="text-xl font-bold text-slate-900 dark:text-white leading-tight">CondoVote</h1>
          <span className="text-xs text-slate-500 dark:text-slate-400">Painel do Síndico</span>
        </div>
        <button 
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)} 
          className="p-2 -mr-2 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
        >
          {isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
      </div>

      {/* Sidebar Overlay */}
      {isMobileMenuOpen && (
        <div 
          className="fixed inset-0 bg-black/50 backdrop-blur-sm z-30 md:hidden transition-opacity" 
          onClick={() => setIsMobileMenuOpen(false)}
        ></div>
      )}

      {/* Sidebar */}
      <aside className={`fixed inset-y-0 left-0 z-40 w-64 bg-white dark:bg-surface-dark border-r border-slate-200 dark:border-border-dark flex flex-col transform transition-transform duration-300 ease-in-out md:relative md:translate-x-0 ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <div className="p-6 border-b border-slate-200 dark:border-border-dark hidden md:block">
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">CondoVote</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400">Painel do Síndico</p>
        </div>

        <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
            {/* Home Dashboard Link */}
            <NavLink
              to="/admin"
              end
              className={({ isActive }) =>
                `flex items-center gap-3 px-4 py-3 rounded-xl transition-all font-medium ${
                  isActive
                    ? 'bg-primary text-white shadow-lg shadow-primary/25 font-bold'
                    : 'text-slate-500 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-slate-200 hover:text-slate-900'
                }`
              }
              onClick={() => setIsMobileMenuOpen(false)}
            >
              <LayoutDashboard size={20} />
              <span>Dashboard</span>
            </NavLink>

            {/* Hub de Assembleias Acordeão */}
            <div className="flex flex-col mb-1 mt-1">
              <button
                onClick={() => setIsAssembliesOpen(!isAssembliesOpen)}
                className="flex items-center justify-between px-4 py-3 rounded-xl transition-all font-medium text-slate-500 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-slate-200 hover:text-slate-900"
              >
                  <div className="flex items-center gap-3">
                     <ListTodo size={20} />
                     <span>Assembleias</span>
                  </div>
                  <ChevronDown size={16} className={`transition-transform duration-200 ${isAssembliesOpen ? 'rotate-180' : ''}`} />
              </button>
              
              <div className={`flex flex-col ml-11 overflow-hidden transition-all duration-300 ${isAssembliesOpen ? 'max-h-48 opacity-100 mt-1' : 'max-h-0 opacity-0'}`}>
                 <div className="border-l border-slate-200 dark:border-slate-800 flex flex-col gap-1 py-1">
                    {assemblySubItems.map((item) => (
                      <NavLink
                        key={item.path}
                        to={item.path}
                        end
                        className={({ isActive }) =>
                          `px-4 py-2 text-sm rounded-r-lg transition-all border-l-2 -ml-px ${
                            isActive
                              ? 'text-primary font-bold border-primary bg-primary/5 dark:bg-primary/10'
                              : 'text-slate-500 hover:text-slate-900 border-transparent hover:border-slate-300 dark:text-slate-400 dark:hover:text-white dark:hover:border-slate-600'
                          }`
                        }
                        onClick={() => setIsMobileMenuOpen(false)}
                      >
                        {item.label}
                      </NavLink>
                    ))}
                 </div>
              </div>
            </div>

            {/* Secundários */}
            {secondaryNavItems.map((item) => (
              <NavLink
                key={item.path}
                to={item.path}
                end
                className={({ isActive }) =>
                  `flex items-center gap-3 px-4 py-3 rounded-xl transition-all font-medium ${
                    isActive
                      ? 'bg-primary text-white shadow-lg shadow-primary/25 font-bold'
                      : 'text-slate-500 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-slate-200 hover:text-slate-900'
                  }`
                }
                onClick={() => setIsMobileMenuOpen(false)}
              >
                <item.icon size={20} />
                <span>{item.label}</span>
              </NavLink>
            ))}
        </nav>

        <div className="p-4 border-t border-slate-200 dark:border-border-dark">
          <button
            onClick={() => navigate('/')}
            className="flex items-center justify-center gap-3 px-4 py-3 w-full font-medium text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-500/10 rounded-xl transition-colors"
          >
            <LogOut size={20} />
            Sair
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto p-4 md:p-8 pt-24 md:pt-8 w-full scroll-smooth">
        <Routes>
          <Route path="/" element={<AdminOverview />} />
          <Route path="/assemblies" element={<AdminAssemblies />} />
          <Route path="/documents" element={<AdminDocuments />} />
          <Route path="/topics" element={<AdminTopics />} />
          <Route path="/monitor" element={<AdminMonitor />} />
          <Route path="/users" element={<AdminUsers />} />
          <Route path="/health" element={<AdminHealth />} />
        </Routes>
      </main>
    </div>
  );
}
