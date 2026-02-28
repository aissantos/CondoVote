import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import { Lock, Loader2 } from 'lucide-react';

export default function ResetPassword() {
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  // O Supabase lê automaticamente o '#access_token' da URL da Vercel
  useEffect(() => {
    supabase.auth.onAuthStateChange(async (event, session) => {
      // Quando logar por recovery
      if (event === "PASSWORD_RECOVERY") {
        console.log("Fluxo de Reset Autorizado.");
      }
    });
  }, []);

  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password !== confirmPassword) {
      return setError('As senhas digitadas não batem.');
    }
    if (password.length < 6) {
      return setError('A senha deve ter no mínimo 6 caracteres.');
    }

    setLoading(true);
    setError('');

    try {
      const { error } = await supabase.auth.updateUser({ password });
      
      if (error) throw error;
      
      alert('Senha atualizada com sucesso! Você já pode entrar.');
      navigate('/');
    } catch (err) {
      if (err instanceof Error) setError(err.message || 'Não foi possível salvar a nova senha.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-linear-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-white dark:bg-slate-800 rounded-3xl shadow-2xl overflow-hidden p-8 border border-white/20 dark:border-slate-700">
        <div className="flex flex-col items-center mb-8">
          <div className="size-16 bg-blue-600 rounded-2xl flex items-center justify-center mb-6 shadow-lg shadow-blue-500/30">
            <Lock className="text-white" size={32} />
          </div>
          <h2 className="text-2xl font-bold text-slate-800 dark:text-white">Nova Senha</h2>
          <p className="text-slate-500 dark:text-slate-400 text-sm mt-2">
            Crie sua nova senha para proteger seu acesso.
          </p>
        </div>

        <form onSubmit={handleUpdatePassword} className="space-y-5">
          {error && (
            <div className="p-4 bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/20 rounded-xl text-red-600 dark:text-red-400 text-sm font-medium text-center">
              {error}
            </div>
          )}
          
          <div className="space-y-2">
            <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 ml-1">
              Senha Nova
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="w-full px-5 py-3.5 bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all dark:text-white dark:placeholder-slate-500"
              placeholder="••••••••"
            />
          </div>

          <div className="space-y-2">
            <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 ml-1">
              Repita a Senha Nova
            </label>
            <input
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
              className="w-full px-5 py-3.5 bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all dark:text-white dark:placeholder-slate-500"
              placeholder="••••••••"
            />
          </div>
          
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white font-bold py-3.5 px-4 rounded-xl transition-all flex items-center justify-center disabled:opacity-50 mt-8"
          >
            {loading ? <Loader2 className="animate-spin" size={20} /> : 'Salvar Alteração'}
          </button>
        </form>

        <p className="text-center text-xs text-slate-400 dark:text-slate-500 mt-8 pt-6 border-t border-slate-100 dark:border-slate-700/50">
          Feito por Versix Solutions.
        </p>
      </div>
    </div>
  );
}
