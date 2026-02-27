import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Building2, UserPlus } from 'lucide-react';
import { supabase } from '../../lib/supabase';

export default function ResidentRegister() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    nome: '',
    email: '',
    senha: '',
    unidade: '',
    bloco: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    
    // Cadastra o usuário e insere metadata q vai preencher a profile
    const { error } = await supabase.auth.signUp({
      email: formData.email,
      password: formData.senha,
      options: {
        data: {
          full_name: formData.nome,
          role: 'RESIDENT',
        }
      }
    });

    if (error) {
      setError(error.message);
      setLoading(false);
    } else {
      // Idealmente, pediríamos pra confirmar e-mail. Vamos redirecionar por agora.
      navigate('/');
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({...formData, [e.target.name]: e.target.value});
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-6 bg-background-light dark:bg-background-dark">
      <div className="w-full max-w-md space-y-6 bg-white dark:bg-surface-dark p-8 rounded-2xl shadow-sm border border-slate-200 dark:border-border-dark">
        <div className="text-center">
          <div className="inline-flex items-center justify-center size-12 rounded-full bg-primary/10 mb-4">
            <Building2 className="text-primary size-6" />
          </div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Criar Conta</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">Inscreva-se como morador</p>
        </div>

        {error && (
          <div className="bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 p-3 rounded-lg text-sm text-center">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Nome Completo</label>
            <input name="nome" type="text" required onChange={handleChange}
              className="w-full px-4 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-transparent text-slate-900 dark:text-white focus:ring-2 focus:ring-primary outline-none" placeholder="João da Silva" />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">E-mail</label>
            <input name="email" type="email" required onChange={handleChange}
              className="w-full px-4 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-transparent text-slate-900 dark:text-white focus:ring-2 focus:ring-primary outline-none" placeholder="seu@email.com" />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Senha (Mín. 6 caracteres)</label>
            <input name="senha" type="password" required minLength={6} onChange={handleChange}
              className="w-full px-4 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-transparent text-slate-900 dark:text-white focus:ring-2 focus:ring-primary outline-none" placeholder="••••••••" />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Unidade</label>
              <input name="unidade" type="text" onChange={handleChange}
                className="w-full px-4 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-transparent text-slate-900 dark:text-white focus:ring-2 focus:ring-primary outline-none" placeholder="Ex: 102" />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Bloco</label>
              <input name="bloco" type="text" onChange={handleChange}
                className="w-full px-4 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-transparent text-slate-900 dark:text-white focus:ring-2 focus:ring-primary outline-none" placeholder="Ex: B" />
            </div>
          </div>

          <button type="submit" disabled={loading} className="w-full flex items-center justify-center gap-2 bg-primary hover:bg-primary-hover text-white py-2.5 rounded-lg font-medium transition-colors mt-6">
            {loading ? 'Criando Conta...' : <><UserPlus size={18} /> Cadastrar</>}
          </button>
        </form>

        <p className="text-center text-sm text-slate-600 dark:text-slate-400">
          Já possui conta? <button onClick={() => navigate('/')} className="text-primary hover:underline font-medium">Voltar para o Login</button>
        </p>
      </div>
    </div>
  );
}
