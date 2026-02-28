import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ShieldCheck, LogIn } from 'lucide-react';
import { supabase } from '../../lib/supabase';

export default function AdminLogin() {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    
    const { error, data } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      setError(error.message);
      setLoading(false);
    } else {
      // Checar se é admin mesmo
      const { data: profile } = await supabase.from('profiles').select('role').eq('id', data.user.id).single();
      
      if (profile?.role === 'ADMIN') {
        navigate('/admin');
      } else {
        await supabase.auth.signOut();
        setError('Acesso Negado: Apenas síndicos podem acessar.');
        setLoading(false);
      }
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-6 bg-slate-100 dark:bg-slate-900">
      <div className="w-full max-w-sm space-y-6 bg-white dark:bg-slate-800 p-8 rounded-2xl shadow-xl border border-slate-200 dark:border-slate-700">
        <div className="text-center">
          <div className="inline-flex items-center justify-center size-16 rounded-lg bg-slate-900 dark:bg-slate-700 text-white mb-4">
            <ShieldCheck size={32} />
          </div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Acesso do Síndico</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">Painel Administrativo CondoVote</p>
        </div>

        {error && (
          <div className="bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 p-3 rounded-lg text-sm text-center">
            {error}
          </div>
        )}

        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">E-mail Administrativo</label>
            <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)}
              className="w-full px-4 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-transparent text-slate-900 dark:text-white focus:ring-2 focus:ring-slate-900 dark:focus:ring-slate-500 outline-none" />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Senha</label>
            <input type="password" required value={password} onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-transparent text-slate-900 dark:text-white focus:ring-2 focus:ring-slate-900 dark:focus:ring-slate-500 outline-none" />
          </div>
          <button type="submit" disabled={loading} className="w-full flex items-center justify-center gap-2 bg-slate-900 hover:bg-slate-800 dark:bg-white dark:text-slate-900 dark:hover:bg-slate-200 text-white py-2.5 rounded-lg font-medium transition-colors mt-2">
            {loading ? 'Acessando...' : <><LogIn size={18} /> Entrar no Painel</>}
          </button>
        </form>

        <p className="text-center text-sm">
          <button onClick={() => navigate('/')} className="text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 font-medium">Voltar para visão do Morador</button>
        </p>

        <p className="text-center text-xs text-slate-400 dark:text-slate-500 mt-6 pt-6 border-t border-slate-100 dark:border-slate-700/50">
          Feito por Versix Solutions.
        </p>
      </div>
    </div>
  );
}
