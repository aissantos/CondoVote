import React, { useState } from 'react';
import { Routes, Route, Link, useLocation, useNavigate } from 'react-router-dom';
import { ShieldAlert, Server, Users, LogOut, Menu, X } from 'lucide-react';
import SuperOverview from './SuperOverview';
import SuperManagers from './SuperManagers';
import SuperCondos from './SuperCondos';

export default function SuperDashboard() {
  const location = useLocation();
  const navigate = useNavigate();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const navItems = [
    { path: '/super', icon: Server, label: 'Monitoramento' },
    { path: '/super/managers', icon: Users, label: 'Síndicos' },
    { path: '/super/condos', icon: Users /* will change icon later if needed */, label: 'Condomínios' },
  ];

  const handleNavClick = () => setIsMobileMenuOpen(false);

  return (
    <div className="flex h-screen bg-slate-900 overflow-hidden relative font-sans">
      {/* Mobile Top Bar */}
      <div className="md:hidden flex items-center justify-between p-4 bg-slate-800 border-b border-slate-700 w-full absolute top-0 z-20 shadow-md">
        <div className="flex items-center gap-2">
          <ShieldAlert size={24} className="text-red-500" />
          <div className="flex flex-col">
            <h1 className="text-xl font-bold text-white leading-tight">Root Node</h1>
          </div>
        </div>
        <button 
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)} 
          className="p-2 -mr-2 text-slate-300 hover:bg-slate-700 rounded-lg transition-colors"
        >
          {isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
      </div>

      {/* Sidebar Overlay */}
      {isMobileMenuOpen && (
        <div 
          className="fixed inset-0 bg-black/70 backdrop-blur-sm z-30 md:hidden transition-opacity" 
          onClick={() => setIsMobileMenuOpen(false)}
        ></div>
      )}

      {/* Sidebar */}
      <aside className={`fixed inset-y-0 left-0 z-40 w-64 bg-slate-800 border-r border-slate-700 flex flex-col transform transition-transform duration-300 ease-in-out md:relative md:translate-x-0 shadow-2xl ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <div className="p-6 border-b border-slate-700 hidden md:flex items-center gap-3">
          <ShieldAlert size={32} className="text-red-500" />
          <div>
            <h1 className="text-2xl font-bold text-white tracking-tight">System Root</h1>
            <p className="text-xs text-slate-400 uppercase tracking-widest font-mono">Terminal</p>
          </div>
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
                className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all font-medium ${
                  isActive
                    ? 'bg-red-600/10 text-red-500 border border-red-500/20 shadow-inner'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-700'
                }`}
              >
                <Icon size={20} />
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div className="p-4 border-t border-slate-700">
          <button
            onClick={() => navigate('/')}
            className="flex items-center justify-center gap-3 px-4 py-3 w-full font-bold text-slate-400 hover:text-white hover:bg-slate-700 rounded-xl transition-colors"
          >
            <LogOut size={20} />
            Desconectar
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto p-4 md:p-8 pt-24 md:pt-8 w-full scroll-smooth bg-slate-900 relative">
        {/* Futuristic background glow */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-4xl h-64 bg-red-600/5 blur-[120px] rounded-full pointer-events-none"></div>
        
        <div className="relative z-10">
          <Routes>
            <Route path="/" element={<SuperOverview />} />
            <Route path="/managers" element={<SuperManagers />} />
            <Route path="/condos" element={<SuperCondos />} />
          </Routes>
        </div>
      </main>
    </div>
  );
}
