import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';
import { ShieldAlert, Loader2 } from 'lucide-react';

export default function SuperLogin() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { role } = useAuth();

  // If already logged in as superadmin, redirect to super dashboard
  if (role === 'SUPERADMIN') {
    navigate('/super', { replace: true });
    return null;
  }

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) return setError('Preencha os dados.');
    setError('');
    setLoading(true);

    try {
      const { data, error: signInError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (signInError) throw signInError;

      // Verify role
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', data.user.id)
        .single();

      if (profileError || profileData?.role !== 'SUPERADMIN') {
        await supabase.auth.signOut();
        throw new Error('Acesso negado. Credenciais root inválidas.');
      }

      navigate('/super', { replace: true });
    } catch (err) {
      if (err instanceof Error) {
        setError(err.message || 'Erro ao realizar login.');
      } else {
        setError('Erro ao realizar login.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-slate-800 border border-slate-700 rounded-3xl p-8 shadow-2xl">
        <div className="flex flex-col items-center mb-8">
          <div className="size-16 rounded-2xl bg-slate-900 shadow-inner flex items-center justify-center mb-4 border border-slate-700">
            <ShieldAlert size={32} className="text-red-500" />
          </div>
          <h1 className="text-2xl font-bold text-white tracking-tight">System Root</h1>
          <p className="text-slate-400 text-sm mt-1">Console de Administração Global</p>
        </div>

        {error && (
          <div className="mb-6 p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-500 text-sm font-medium text-center">
            {error}
          </div>
        )}

        <form onSubmit={handleLogin} className="space-y-5">
          <div>
            <label className="block text-sm font-semibold text-slate-300 mb-2">E-mail de Serviço</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full bg-slate-900/50 border border-slate-700 rounded-xl px-4 py-3 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500 transition-all font-mono text-sm"
              placeholder="root@condovote.com"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-semibold text-slate-300 mb-2">Chave de Acesso</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full bg-slate-900/50 border border-slate-700 rounded-xl px-4 py-3 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500 transition-all font-mono text-sm tracking-widest"
              placeholder="••••••••"
              required
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-red-600 hover:bg-red-500 text-white font-bold py-3 px-4 rounded-xl transition-colors mt-6 flex items-center justify-center"
          >
            {loading ? <Loader2 className="animate-spin size-5" /> : 'Acessar Console'}
          </button>
        </form>

        <p className="text-center text-xs text-slate-500 mt-8 pt-6 border-t border-slate-700/50">
          Feito por Versix Solutions.
        </p>
      </div>
    </div>
  );
}
