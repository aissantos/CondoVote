import React, { useState, useEffect } from 'react';
import { Users, Search, Filter, Mail, Building, AlertTriangle, ShieldCheck, UserX, Loader2 } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';

type Profile = {
  id: string;
  full_name: string | null;
  unit_number: string | null;
  block_number: string | null;
  role: 'RESIDENT' | 'ADMIN';
  created_at: string;
};

export default function AdminUsers() {
  const { profile } = useAuth();
  const [users, setUsers] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<'ALL' | 'INCOMPLETE'>('ALL');

  useEffect(() => {
    if (profile?.condo_id) {
      fetchUsers();
    }
  }, [profile?.condo_id]);

  const fetchUsers = async () => {
    if (!profile?.condo_id) return;
    setLoading(true);
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('role', 'RESIDENT')
      .eq('condo_id', profile.condo_id)
      .order('created_at', { ascending: false });

    if (!error && data) {
      setUsers(data as Profile[]);
    }
    setLoading(false);
  };

  const filteredUsers = users.filter((user) => {
    const matchesSearch = 
      (user.full_name?.toLowerCase().includes(search.toLowerCase()) || '') ||
      (user.unit_number?.toLowerCase().includes(search.toLowerCase()) || '') ||
      (user.block_number?.toLowerCase().includes(search.toLowerCase()) || '');

    const isIncomplete = !user.unit_number || !user.block_number;
    const matchesFilter = filter === 'ALL' || (filter === 'INCOMPLETE' && isIncomplete);

    return matchesSearch && matchesFilter;
  });

  return (
    <div className="space-y-8 max-w-6xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-bold text-slate-900 dark:text-white">Moradores</h2>
          <p className="text-slate-500 dark:text-slate-400 mt-1">Gerencie os residentes cadastrados</p>
        </div>
      </div>

      <div className="bg-white dark:bg-surface-dark rounded-2xl border border-slate-200 dark:border-border-dark shadow-sm overflow-hidden">
        <div className="p-4 border-b border-slate-200 dark:border-border-dark flex flex-col sm:flex-row gap-4 justify-between bg-slate-50/50 dark:bg-surface-dark/50">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 size-5" />
            <input 
              type="text"
              placeholder="Buscar por nome, unidade ou bloco..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/50 text-slate-900 dark:text-white"
            />
          </div>
          <div className="flex gap-2">
            <button 
              onClick={() => setFilter('ALL')}
              className={`px-4 py-2 rounded-xl text-sm font-medium transition-colors ${filter === 'ALL' ? 'bg-primary text-white shadow-sm' : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700'}`}
            >
              Todos
            </button>
            <button 
              onClick={() => setFilter('INCOMPLETE')}
              className={`px-4 py-2 rounded-xl text-sm font-medium transition-colors flex items-center gap-2 ${filter === 'INCOMPLETE' ? 'bg-orange-500 text-white shadow-sm' : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700'}`}
            >
              <AlertTriangle size={16} className={filter === 'INCOMPLETE' ? 'text-white' : 'text-orange-500'} />
              Incompletos
            </button>
          </div>
        </div>

        {loading ? (
          <div className="p-12 flex justify-center text-primary">
            <Loader2 className="animate-spin size-8" />
          </div>
        ) : (
          <>
            {/* Desktop Table View */}
            <table className="hidden md:table w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-200 dark:border-border-dark bg-slate-50 dark:bg-surface-dark/50">
                  <th className="p-4 text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Morador</th>
                  <th className="p-4 text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Unidade / Bloco</th>
                  <th className="p-4 text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Status Perfil</th>
                  <th className="p-4 text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Cadastrado em</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 dark:divide-border-dark">
                {filteredUsers.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="p-8 text-center text-slate-500 dark:text-slate-400">
                      Nenhum morador encontrado.
                    </td>
                  </tr>
                ) : (
                  filteredUsers.map((user) => (
                    <tr key={user.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                      <td className="p-4 flex items-center gap-3">
                        <div className="size-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold shrink-0">
                          {user.full_name?.charAt(0) || 'U'}
                        </div>
                        <div>
                          <p className="text-sm font-bold text-slate-900 dark:text-white">{user.full_name || 'Usuário Sem Nome'}</p>
                          <p className="text-xs text-slate-500 dark:text-slate-400 font-mono text-[10px]">{user.id.substring(0,8)}...</p>
                        </div>
                      </td>
                      <td className="p-4">
                        <div className="flex items-center gap-2 text-sm text-slate-700 dark:text-slate-300">
                          <Building size={16} className="text-slate-400" />
                          <span>
                            {user.block_number ? `Bloco ${user.block_number}` : '?'} - Und {user.unit_number || '?'}
                          </span>
                        </div>
                      </td>
                      <td className="p-4">
                        {(!user.unit_number || !user.block_number) ? (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-orange-100 text-orange-700 dark:bg-orange-500/10 dark:text-orange-400">
                            <AlertTriangle size={14} />
                            Faltam Dados
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-green-100 text-green-700 dark:bg-green-500/10 dark:text-green-400">
                            <ShieldCheck size={14} />
                            Completo
                          </span>
                        )}
                      </td>
                      <td className="p-4 text-sm text-slate-600 dark:text-slate-300 font-mono">
                        {new Date(user.created_at).toLocaleDateString()}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>

            {/* Mobile Cards View */}
            <div className="md:hidden flex flex-col divide-y divide-slate-200 dark:divide-border-dark">
              {filteredUsers.length === 0 ? (
                <div className="p-8 text-center text-slate-500 dark:text-slate-400">
                  Nenhum morador encontrado.
                </div>
              ) : (
                filteredUsers.map((user) => (
                  <div key={user.id} className="p-4 flex flex-col gap-3 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                    <div className="flex items-center gap-3">
                      <div className="size-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold shrink-0">
                        {user.full_name?.charAt(0) || 'U'}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-bold text-slate-900 dark:text-white truncate">{user.full_name || 'Usuário Sem Nome'}</p>
                        <div className="flex items-center gap-1 text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                          <Building size={12} />
                          <span>
                            {user.block_number ? `Blc ${user.block_number}` : '?'} - Und {user.unit_number || '?'}
                          </span>
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex items-center justify-between pt-2 border-t border-slate-100 dark:border-slate-800/50 mt-1">
                      {(!user.unit_number || !user.block_number) ? (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-orange-100 text-orange-700 dark:bg-orange-500/10 dark:text-orange-400">
                          <AlertTriangle size={14} /> Faltam Dados
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-green-100 text-green-700 dark:bg-green-500/10 dark:text-green-400">
                          <ShieldCheck size={14} /> Completo
                        </span>
                      )}
                      <span className="text-xs text-slate-400 font-mono">
                        {new Date(user.created_at).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
