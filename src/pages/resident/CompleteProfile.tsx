import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Building2, Save, Loader2, Ticket } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';
import { FormField } from '../../components/ui/FormField';

// Classe base de input reutilizada nos campos deste formulário
const inputCls =
  'w-full px-4 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-transparent text-slate-900 dark:text-white focus:ring-2 focus:ring-primary outline-none';

export default function CompleteProfile() {
  const navigate = useNavigate();
  const { user, profile, refreshProfile } = useAuth();
  
  const [formData, setFormData] = useState({
    nome: profile?.full_name || '',
    unidade: profile?.unit_number || '',
    bloco: profile?.block_number || '',
    inviteCode: '',
    residentType: 'MORADOR',
    cpf: '',
  });
  
  const [lgpdAccepted, setLgpdAccepted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Helper para formatar CPF enquanto digita
  const handleCpfChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let value = e.target.value.replace(/\D/g, '');
    if (value.length > 11) value = value.slice(0, 11);
    if (value.length > 9) value = value.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4');
    else if (value.length > 6) value = value.replace(/(\d{3})(\d{3})(\d{1,3})/, '$1.$2.$3');
    else if (value.length > 3) value = value.replace(/(\d{3})(\d{1,3})/, '$1.$2');
    setFormData({ ...formData, cpf: value });
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) =>
    setFormData({ ...formData, [e.target.name]: e.target.value });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setLoading(true);
    setError(null);
    
    try {
      if (!lgpdAccepted) {
        throw new Error('Você deve aceitar os Termos e Serviços e a Política de Privacidade (LGPD) para prosseguir.');
      }
      
      const cleanCpf = formData.cpf.replace(/\D/g, '');
      if (cleanCpf.length !== 11) {
        throw new Error('Preencha um CPF válido com 11 dígitos.');
      }

      if (!formData.inviteCode || formData.inviteCode.trim().length !== 6) {
        throw new Error('Você precisa de um Código de Convite válido (6 dígitos) para ingressar em um condomínio.');
      }

      const { data: condoId, error: rpcError } = await supabase.rpc('get_condo_by_invite', { 
        code: formData.inviteCode.trim().toUpperCase() 
      });

      if (rpcError || !condoId) {
        throw new Error('Código de convite inválido ou expirado. Peça um novo convite ao seu síndico.');
      }

      const { error: updateError } = await supabase
        .from('profiles')
        .update({
          full_name: formData.nome,
          unit_number: formData.unidade,
          block_number: formData.bloco,
          condo_id: condoId,
          resident_type: formData.residentType,
          cpf: cleanCpf,
        })
        .eq('id', user.id);

      if (updateError) throw updateError;
      
      if (refreshProfile) {
        await refreshProfile();
      } else {
        await supabase.auth.refreshSession();
        await new Promise(resolve => setTimeout(resolve, 500));
      }
      
      navigate('/resident/home', { replace: true });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Falha ao atualizar perfil.');
    } finally {
      setLoading(false);
    }
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
          <div role="alert" className="bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 p-3 rounded-lg text-sm text-center">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <FormField label="Nome Completo" required>
            {(a11y) => (
              <input
                {...a11y}
                name="nome"
                type="text"
                value={formData.nome}
                onChange={handleChange}
                placeholder="João da Silva"
                className={inputCls}
              />
            )}
          </FormField>

          <div className="grid grid-cols-2 gap-4">
            <FormField label="Unidade" required>
              {(a11y) => (
                <input
                  {...a11y}
                  name="unidade"
                  type="text"
                  value={formData.unidade}
                  onChange={handleChange}
                  placeholder="Ex: 102"
                  className={inputCls}
                />
              )}
            </FormField>
            <FormField label="Bloco/Rua" required>
              {(a11y) => (
                <input
                  {...a11y}
                  name="bloco"
                  type="text"
                  value={formData.bloco}
                  onChange={handleChange}
                  placeholder="Ex: B"
                  className={inputCls}
                />
              )}
            </FormField>
          </div>

          <FormField label="CPF" required hint="Somente números — será formatado automaticamente">
            {(a11y) => (
              <input
                {...a11y}
                name="cpf"
                type="text"
                value={formData.cpf}
                onChange={handleCpfChange}
                placeholder="000.000.000-00"
                maxLength={14}
                className={inputCls}
              />
            )}
          </FormField>

          <FormField label="Tipo de Vínculo" required>
            {(a11y) => (
              <select
                {...a11y}
                value={formData.residentType}
                onChange={(e: React.ChangeEvent<HTMLSelectElement>) =>
                  setFormData({ ...formData, residentType: e.target.value })
                }
                className={`${inputCls} appearance-none bg-white dark:bg-surface-dark`}
              >
                <option value="TITULAR">Proprietário Titular</option>
                <option value="MORADOR">Morador Convencional</option>
                <option value="INQUILINO">Inquilino</option>
              </select>
            )}
          </FormField>

          <div className="pt-2">
            <FormField
              label="Código de Convite"
              required
              hint="Peça o código ao seu síndico para se vincular ao condomínio."
            >
              {(a11y) => (
                <div className="relative">
                  <Ticket className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 size-5" aria-hidden="true" />
                  <input
                    {...a11y}
                    name="inviteCode"
                    type="text"
                    maxLength={6}
                    value={formData.inviteCode}
                    onChange={handleChange}
                    placeholder="Ex: XYZ123"
                    className={`${inputCls} pl-10 font-mono uppercase tracking-widest placeholder:tracking-normal`}
                  />
                </div>
              )}
            </FormField>
          </div>

          <div className="mt-6 p-4 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-xl">
            <div className="prose prose-sm dark:prose-invert max-w-none text-[11px] leading-relaxed mb-4 text-slate-500 dark:text-slate-400">
              <p className="font-semibold text-slate-700 dark:text-slate-300 mb-1">Atualização Legal (LGPD)</p>
              <p>
                Ao salvar este perfil, você garante ser <strong>legitimamente vinculado</strong> à unidade e código inserido acima.
                Autoriza o uso do seu número de CPF preenchido para validação cruzada legal nas auditorias e listas de presença deste condomínio. 
              </p>
            </div>
            <label className="flex gap-3 items-start cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-800 p-2 rounded-lg transition-colors">
              <input 
                type="checkbox" 
                required
                checked={lgpdAccepted}
                onChange={(e) => setLgpdAccepted(e.target.checked)}
                className="mt-1 w-4 h-4 text-primary bg-slate-100 border-slate-300 rounded focus:ring-primary dark:focus:ring-primary dark:ring-offset-slate-800 dark:bg-slate-700 dark:border-slate-600" 
              />
              <span className="text-sm font-medium text-slate-700 dark:text-slate-300">
                Confirmo veracidade do meu CPF e concordo com os Termos LGPD da plataforma.
              </span>
            </label>
          </div>

          <button 
            type="submit" 
            disabled={loading} 
            className="w-full flex items-center justify-center gap-2 bg-primary hover:bg-primary-hover text-white py-2.5 rounded-lg font-medium transition-colors mt-6 disabled:opacity-50"
          >
            {loading ? <Loader2 className="animate-spin" size={18} aria-hidden="true" /> : <Save size={18} aria-hidden="true" />}
            {loading ? 'Salvando...' : 'Salvar Perfil'}
          </button>
        </form>
      </div>
    </div>
  );
}
