import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import { Building2, ArrowLeft, Loader2, CheckCircle2 } from 'lucide-react';

export default function ForgotPassword() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  
  const handleResetRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;
    
    setLoading(true);
    setError('');
    
    try {
      // O Supabase irá enviar o link baseado no site URl listado nas configurações
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`,
      });
      
      if (error) throw error;
      
      setSuccess(true);
    } catch (err) {
      if (err instanceof Error) setError(err.message || 'Houve um erro ao enviar o e-mail.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-linear-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-white dark:bg-slate-800 rounded-3xl shadow-2xl overflow-hidden p-8 border border-white/20 dark:border-slate-700 relative">
        <Link 
          to="/" 
          className="absolute top-6 left-6 text-slate-400 hover:text-slate-600 dark:hover:text-white transition-colors flex items-center gap-1 text-sm font-medium"
        >
          <ArrowLeft size={16} /> Voltar
        </Link>
        
        <div className="flex flex-col items-center mt-6 mb-8">
          <div className="size-16 bg-blue-600 rounded-2xl flex items-center justify-center mb-6 shadow-lg shadow-blue-500/30 transform transition-transform hover:scale-105">
            <Building2 className="text-white" size={32} />
          </div>
          <h2 className="text-2xl font-bold text-slate-800 dark:text-white">Recuperar Acesso</h2>
          <p className="text-slate-500 dark:text-slate-400 text-center text-sm mt-3 px-2">
            Digite o e-mail associado à sua conta para receber um link de redefinição de senha.
          </p>
        </div>

        {success ? (
          <div className="bg-green-50 dark:bg-green-500/10 border border-green-200 dark:border-green-500/20 rounded-2xl p-6 text-center animate-in fade-in zoom-in duration-300">
            <div className="flex justify-center mb-4 text-green-500">
              <CheckCircle2 size={48} />
            </div>
            <h3 className="text-green-800 dark:text-green-400 font-bold mb-2">E-mail Enviado!</h3>
            <p className="text-green-700 dark:text-green-500/80 text-sm">
              Verifique sua caixa de entrada e pasta de Spam. O link expira em 24h.
            </p>
          </div>
        ) : (
          <form onSubmit={handleResetRequest} className="space-y-6">
            {error && (
              <div className="p-4 bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/20 rounded-xl text-red-600 dark:text-red-400 text-sm font-medium text-center">
                {error}
              </div>
            )}
            
            <div className="space-y-2">
              <label htmlFor="email" className="block text-sm font-semibold text-slate-700 dark:text-slate-300 ml-1">
                E-mail Cadastrado
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full px-5 py-3.5 bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all dark:text-white dark:placeholder-slate-500"
                placeholder="seu.email@exemplo.com"
              />
            </div>
            
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white font-bold py-3.5 px-4 rounded-xl transition-all shadow-lg hover:shadow-xl shadow-blue-500/30 flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? <Loader2 className="animate-spin" size={20} /> : 'Enviar Link Válido'}
            </button>
          </form>
        )}

        <p className="text-center text-xs text-slate-400 dark:text-slate-500 mt-8 pt-6 border-t border-slate-100 dark:border-slate-700/50">
          Feito por Versix Solutions.
        </p>
      </div>
    </div>
  );
}
