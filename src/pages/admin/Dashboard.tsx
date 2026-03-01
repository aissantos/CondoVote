import { useState } from 'react';
import { Routes, Route, Link, useLocation, useNavigate } from 'react-router-dom';
import { LayoutDashboard, ListTodo, Activity, LogOut, Menu, X, Users } from 'lucide-react';
import AdminOverview from './AdminOverview';
import AdminTopics from './AdminTopics';
import AdminAssemblies from './AdminAssemblies';
import AdminMonitor from './AdminMonitor';
import AdminUsers from './AdminUsers';

export default function AdminDashboard() {
  const location = useLocation();
  const navigate = useNavigate();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const navItems = [
    { path: '/admin', icon: LayoutDashboard, label: 'Dashboard' },
    { path: '/admin/assemblies', icon: ListTodo, label: 'Assembleias' },
    { path: '/admin/monitor', icon: Activity, label: 'Monitor' },
    { path: '/admin/users', icon: Users, label: 'Moradores' },
  ];

  const handleNavClick = () => {
    setIsMobileMenuOpen(false);
  };

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
          {navItems.map((item) => {
            const isActive = location.pathname === item.path;
            const Icon = item.icon;
            return (
              <Link
                key={item.path}
                to={item.path}
                onClick={handleNavClick}
                className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-colors ${
                  isActive
                    ? 'bg-primary text-white font-medium shadow-md shadow-primary/20'
                    : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
                }`}
              >
                <Icon size={20} />
                {item.label}
              </Link>
            );
          })}
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
          <Route path="/topics" element={<AdminTopics />} />
          <Route path="/monitor" element={<AdminMonitor />} />
          <Route path="/users" element={<AdminUsers />} />
        </Routes>
      </main>
    </div>
  );
}
