import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Building2, Save, Loader2, Ticket } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';

export default function CompleteProfile() {
  const navigate = useNavigate();
  const { user, profile, refreshProfile } = useAuth();
  
  const [formData, setFormData] = useState({
    nome: profile?.full_name || '',
    unidade: profile?.unit_number || '',
    bloco: profile?.block_number || '',
    inviteCode: '',
    residentType: 'MORADOR' // DEFAULT
  });
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    
    setLoading(true);
    setError(null);
    
    try {
      if (!formData.inviteCode || formData.inviteCode.trim().length !== 6) {
        throw new Error('Você precisa de um Código de Convite válido (6 dígitos) para ingressar em um condomínio.');
      }

      // Valida Convite anonimamente contra RPC de bypass de RLS
      const { data: condoId, error: rpcError } = await supabase.rpc('get_condo_by_invite', { 
        code: formData.inviteCode.trim().toUpperCase() 
      });

      if (rpcError || !condoId) {
        throw new Error('Código de convite inválido ou expirado. Peça um novo convite ao seu síndico.');
      }

      // Atualiza a tabela profiles do supabase
      const { error: updateError } = await supabase
        .from('profiles')
        .update({
          full_name: formData.nome,
          unit_number: formData.unidade,
          block_number: formData.bloco,
          condo_id: condoId,
          resident_type: formData.residentType // Atualizando o tipo
        })
        .eq('id', user.id);

      if (updateError) throw updateError;
      
      // Força um recarregamento completo dos dados do perfil no React Context
      if (refreshProfile) {
        await refreshProfile(user.id);
      } else {
        await supabase.auth.refreshSession();
        // Fallback atraso para garantir sync de estado
        await new Promise(resolve => setTimeout(resolve, 500));
      }
      
      navigate('/resident/home', { replace: true });
    } catch (err) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError('Falha ao atualizar perfil.');
      }
    } finally {
      setLoading(false);
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
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Complete seu Perfil</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Precisamos de mais algumas informações para identificar sua unidade no condomínio.
          </p>
        </div>

        {error && (
          <div className="bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 p-3 rounded-lg text-sm text-center">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Nome Completo</label>
            <input 
              name="nome" 
              type="text" 
              required 
              value={formData.nome}
              onChange={handleChange}
              className="w-full px-4 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-transparent text-slate-900 dark:text-white focus:ring-2 focus:ring-primary outline-none" 
              placeholder="João da Silva" 
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Unidade</label>
              <input 
                name="unidade" 
                type="text" 
                required
                value={formData.unidade}
                onChange={handleChange}
                className="w-full px-4 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-transparent text-slate-900 dark:text-white focus:ring-2 focus:ring-primary outline-none" 
                placeholder="Ex: 102" 
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Bloco/Rua</label>
              <input 
                name="bloco" 
                type="text" 
                required
                value={formData.bloco}
                onChange={handleChange}
                className="w-full px-4 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-transparent text-slate-900 dark:text-white focus:ring-2 focus:ring-primary outline-none" 
                placeholder="Ex: B" 
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Tipo de Vínculo</label>
            <select 
              name="residentType" 
              value={formData.residentType}
              onChange={(e: any) => handleChange(e)}
              className="w-full px-4 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-surface-dark text-slate-900 dark:text-white focus:ring-2 focus:ring-primary outline-none appearance-none"
            >
              <option value="TITULAR">Proprietário Titular</option>
              <option value="MORADOR">Morador Convencional</option>
              <option value="INQUILINO">Inquilino</option>
            </select>
          </div>

          <div className="pt-2">
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Código de Convite</label>
            <div className="relative">
              <Ticket className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 size-5" />
              <input 
                name="inviteCode" 
                type="text" 
                required 
                maxLength={6}
                value={formData.inviteCode}
                onChange={handleChange}
                className="w-full pl-10 pr-4 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-transparent text-slate-900 dark:text-white focus:ring-2 focus:ring-primary outline-none font-mono uppercase tracking-widest placeholder:tracking-normal" 
                placeholder="Ex: XYZ123" 
              />
            </div>
            <p className="text-xs text-slate-500 mt-2">Peça o código ao seu síndico para se vincular ao condomínio.</p>
          </div>

          <button 
            type="submit" 
            disabled={loading} 
            className="w-full flex items-center justify-center gap-2 bg-primary hover:bg-primary-hover text-white py-2.5 rounded-lg font-medium transition-colors mt-6 disabled:opacity-50"
          >
            {loading ? <Loader2 className="animate-spin" size={18} /> : <Save size={18} />}
            {loading ? 'Salvando...' : 'Salvar Perfil'}
          </button>
        </form>
      </div>
    </div>
  );
}
