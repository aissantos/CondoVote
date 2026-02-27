import React, { useState, useEffect } from 'react';
import { ShieldCheck, ShieldAlert, UserPlus, Search, Building, Loader2, Key } from 'lucide-react';
import { supabase } from '../../lib/supabase';

type Profile = {
  id: string;
  full_name: string | null;
  role: 'ADMIN' | 'RESIDENT' | 'SUPERADMIN';
  created_at: string;
};

export default function SuperManagers() {
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  useEffect(() => {
    fetchProfiles();
  }, []);

  const fetchProfiles = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('profiles')
      .select('id, full_name, role, created_at')
      .neq('role', 'SUPERADMIN') // Do not show other roots
      .order('created_at', { ascending: false });

    if (!error && data) {
      setProfiles(data as Profile[]);
    }
    setLoading(false);
  };

  const handleToggleRole = async (userId: string, currentRole: string) => {
    const newRole = currentRole === 'ADMIN' ? 'RESIDENT' : 'ADMIN';
    const confirmMessage = currentRole === 'ADMIN' 
      ? 'Deseja REBAIXAR este Síndico para Morador?' 
      : 'Deseja PROMOVER este Morador a Síndico (Privilégio total no Condomínio)?';

    if (!confirm(confirmMessage)) return;

    const { error } = await supabase
      .from('profiles')
      .update({ role: newRole })
      .eq('id', userId);

    if (!error) {
      fetchProfiles();
    } else {
      alert('Erro ao atualizar permissão: ' + error.message);
    }
  };

  const filtered = profiles.filter(p => 
    (p.full_name?.toLowerCase().includes(search.toLowerCase()) || '') ||
    (p.id.includes(search))
  );

  return (
    <div className="space-y-8 max-w-7xl mx-auto">
      <div>
        <h2 className="text-3xl font-bold text-white flex items-center gap-3">
          <Key className="text-yellow-500" />
          Gerenciadores de Instâncias
        </h2>
        <p className="text-slate-400 mt-1">Conceda ou revogue privilégios de Síndico aos líderes nativos.</p>
      </div>

      <div className="bg-slate-800 border border-slate-700 rounded-2xl shadow-xl overflow-hidden">
        <div className="p-6 border-b border-slate-700 bg-slate-800/50 flex flex-col sm:flex-row gap-4 justify-between items-center">
          <div className="relative w-full max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 size-5" />
            <input 
              type="text"
              placeholder="Buscar usuário por nome ou ID..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-slate-900 border border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-500 text-white placeholder-slate-500"
            />
          </div>
          <button className="flex items-center gap-2 px-4 py-2 bg-red-600 hover:bg-red-500 text-white rounded-xl text-sm font-bold transition-colors">
            <UserPlus size={18} />
            Novo Registro Manual
          </button>
        </div>

        {loading ? (
          <div className="p-12 flex justify-center text-red-500">
            <Loader2 className="animate-spin size-8" />
          </div>
        ) : (
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-700 bg-slate-900/50">
                <th className="p-4 text-xs font-bold text-slate-400 uppercase tracking-wider">Usuário Alvo</th>
                <th className="p-4 text-xs font-bold text-slate-400 uppercase tracking-wider">Acesso / Role</th>
                <th className="p-4 text-xs font-bold text-slate-400 uppercase tracking-wider">Data de Ingresso</th>
                <th className="p-4 text-xs font-bold text-slate-400 uppercase tracking-wider text-right">Governança</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-700/50">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={4} className="p-8 text-center text-slate-500">
                    Nenhum perfil encontrado no banco de dados.
                  </td>
                </tr>
              ) : (
                filtered.map((user) => (
                  <tr key={user.id} className="hover:bg-slate-700/20 transition-colors group">
                    <td className="p-4 flex items-center gap-3">
                      <div className={`size-10 rounded-full flex items-center justify-center font-bold shrink-0 ${user.role === 'ADMIN' ? 'bg-yellow-500/10 text-yellow-500 border border-yellow-500/20' : 'bg-slate-700 text-slate-300'}`}>
                        {user.full_name?.charAt(0) || 'U'}
                      </div>
                      <div>
                        <p className="text-sm font-bold text-white">{user.full_name || 'Desconhecido'}</p>
                        <p className="text-xs text-slate-500 font-mono">{user.id}</p>
                      </div>
                    </td>
                    <td className="p-4">
                      {user.role === 'ADMIN' ? (
                        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-yellow-500/10 text-yellow-500 border border-yellow-500/20">
                          <ShieldCheck size={14} />
                          Admin do Condomínio
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-slate-700/50 text-slate-400">
                          Residente Padrão
                        </span>
                      )}
                    </td>
                    <td className="p-4 text-sm text-slate-400 font-mono">
                      {new Date(user.created_at).toLocaleDateString()}
                    </td>
                    <td className="p-4 text-right">
                      {user.role === 'RESIDENT' ? (
                        <button 
                          onClick={() => handleToggleRole(user.id, user.role)}
                          className="px-3 py-1.5 bg-yellow-500/10 hover:bg-yellow-500/20 text-yellow-500 rounded-lg text-xs font-bold transition-colors opacity-0 group-hover:opacity-100"
                        >
                          Promover p/ Admin
                        </button>
                      ) : (
                        <button 
                          onClick={() => handleToggleRole(user.id, user.role)}
                          className="px-3 py-1.5 bg-red-500/10 hover:bg-red-500/20 text-red-500 rounded-lg text-xs font-bold transition-colors opacity-0 group-hover:opacity-100 flex items-center gap-1 ml-auto"
                        >
                          <ShieldAlert size={14} />
                          Revogar
                        </button>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
