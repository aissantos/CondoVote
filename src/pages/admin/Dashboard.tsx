import { Routes, Route, Link, useLocation, useNavigate } from 'react-router-dom';
import { LayoutDashboard, ListTodo, Activity, LogOut, Users, Building, CheckCircle, PieChart } from 'lucide-react';
import AdminOverview from './AdminOverview';
import AdminTopics from './AdminTopics';
import AdminMonitor from './AdminMonitor';

export default function AdminDashboard() {
  const location = useLocation();
  const navigate = useNavigate();

  const navItems = [
    { path: '/admin', icon: LayoutDashboard, label: 'Dashboard' },
    { path: '/admin/topics', icon: ListTodo, label: 'Pautas' },
    { path: '/admin/monitor', icon: Activity, label: 'Monitor' },
  ];

  return (
    <div className="flex h-screen bg-background-light dark:bg-background-dark">
      {/* Sidebar */}
      <aside className="w-64 bg-white dark:bg-surface-dark border-r border-slate-200 dark:border-border-dark flex flex-col">
        <div className="p-6 border-b border-slate-200 dark:border-border-dark">
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">CondoVote</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400">Painel do Síndico</p>
        </div>

        <nav className="flex-1 p-4 space-y-2">
          {navItems.map((item) => {
            const isActive = location.pathname === item.path;
            const Icon = item.icon;
            return (
              <Link
                key={item.path}
                to={item.path}
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
            className="flex items-center gap-3 px-4 py-3 w-full text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors"
          >
            <LogOut size={20} />
            Sair
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto p-8">
        <Routes>
          <Route path="/" element={<AdminOverview />} />
          <Route path="/topics" element={<AdminTopics />} />
          <Route path="/monitor" element={<AdminMonitor />} />
        </Routes>
      </main>
    </div>
  );
}
