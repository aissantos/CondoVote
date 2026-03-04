import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Building2, UserPlus, Ticket, Loader2 } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { validateCPF } from '../../lib/validators';
import { useRateLimit } from '../../hooks/useRateLimit';
import { FormField } from '../../components/ui/FormField';
import { recordConsent } from '../../services/consent.service';

// Classe base de input reutilizada nos campos deste formulário
const inputCls =
  'w-full px-4 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-transparent text-slate-900 dark:text-white focus:ring-2 focus:ring-primary outline-none';

export default function ResidentRegister() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    nome: '',
    email: '',
    senha: '',
    unidade: '',
    bloco: '',
    inviteCode: '',
    residentType: 'MORADOR',
    cpf: '',
  });
  const [lgpdAccepted, setLgpdAccepted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { check: checkRateLimit } = useRateLimit(3, 120_000);

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

    const { allowed, waitSeconds } = checkRateLimit();
    if (!allowed) {
      setError(`Muitas tentativas. Aguarde ${waitSeconds}s antes de tentar novamente.`);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      if (!lgpdAccepted) {
        throw new Error('Você deve aceitar os Termos e Serviços e a Política de Privacidade (LGPD) para prosseguir.');
      }
      
      const cleanCpf = formData.cpf.replace(/\D/g, '');
      if (!validateCPF(formData.cpf)) {
        throw new Error('CPF inválido. Verifique os dígitos e tente novamente.');
      }

      if (!formData.inviteCode || formData.inviteCode.trim().length !== 6) {
        throw new Error('Você precisa de um Código de Convite válido (6 dígitos) para se cadastrar num condomínio.');
      }

      const { data: condoId, error: rpcError } = await supabase.rpc('get_condo_by_invite', { 
        code: formData.inviteCode.trim().toUpperCase() 
      });

      if (rpcError || !condoId) {
        throw new Error('Código de convite inválido ou expirado. Peça um novo convite ao seu síndico.');
      }

      const { data, error: signUpError } = await supabase.auth.signUp({
        email: formData.email,
        password: formData.senha,
        options: {
          data: {
            full_name: formData.nome,
            role: 'RESIDENT',
            resident_type: formData.residentType,
            condo_id: condoId,
            cpf: cleanCpf,
          }
        }
      });

      if (signUpError) throw signUpError;
      
      if (data?.user) {
        await recordConsent(data.user.id, 'PRIVACY_POLICY', '2026-03-01');
        await recordConsent(data.user.id, 'TERMS_OF_USE', '2026-03-01');
      }

      navigate('/resident/home');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Falha inesperada ao tentar realizar cadastro.');
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
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Criar Conta</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">Inscreva-se como morador</p>
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
                onChange={handleChange}
                placeholder="João da Silva"
                className={inputCls}
              />
            )}
          </FormField>

          <div className="grid grid-cols-2 gap-4">
            <FormField label="E-mail" required>
              {(a11y) => (
                <input
                  {...a11y}
                  name="email"
                  type="email"
                  onChange={handleChange}
                  placeholder="seu@email.com"
                  className={inputCls}
                />
              )}
            </FormField>
            <FormField label="CPF" required>
              {(a11y) => (
                <input
                  {...a11y}
                  name="cpf"
                  type="text"
                  onChange={handleCpfChange}
                  value={formData.cpf}
                  placeholder="000.000.000-00"
                  maxLength={14}
                  className={inputCls}
                />
              )}
            </FormField>
          </div>

          <FormField label="Senha" required hint="Mínimo 6 caracteres">
            {(a11y) => (
              <input
                {...a11y}
                name="senha"
                type="password"
                minLength={6}
                onChange={handleChange}
                placeholder="••••••••"
                className={inputCls}
              />
            )}
          </FormField>

          <div className="grid grid-cols-2 gap-4">
            <FormField label="Unidade">
              {(a11y) => (
                <input
                  {...a11y}
                  name="unidade"
                  type="text"
                  onChange={handleChange}
                  placeholder="Ex: 102"
                  className={inputCls}
                />
              )}
            </FormField>
            <FormField label="Bloco">
              {(a11y) => (
                <input
                  {...a11y}
                  name="bloco"
                  type="text"
                  onChange={handleChange}
                  placeholder="Ex: B"
                  className={inputCls}
                />
              )}
            </FormField>
          </div>

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
              label="Código de Convite (Condomínio)"
              required
              hint="Peça ao Síndico o código do seu condomínio para se cadastrar."
            >
              {(a11y) => (
                <div className="relative">
                  <Ticket className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 size-5" aria-hidden="true" />
                  <input
                    {...a11y}
                    name="inviteCode"
                    type="text"
                    maxLength={6}
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
              <p className="font-semibold text-slate-700 dark:text-slate-300 mb-1">Consentimento de Uso de Dados e Aceite (LGPD)</p>
              <p>
                Ao registrar-se, você declara ser <strong>morador, proprietário ou inquilino</strong> do condomínio correspondente ao código inserido, com responsabilidade legal sobre o uso da plataforma.
                Reconhece também a aplicação da Lei Geral de Proteção de Dados (LGPD) e <strong>autoriza a coleta e tratamento do CPF, Identidade e Matrícula</strong> com finalidade exclusiva de verificação legal para pleitos e assembleias eletrônicas do condomínio respectivo.
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
                Declaro que li e estou de acordo com os Termos de Serviço e Política de Utilização de Dados (LGPD).
              </span>
            </label>
          </div>

          <button type="submit" disabled={loading} className="w-full flex items-center justify-center gap-2 bg-primary hover:bg-primary-hover text-white py-2.5 rounded-lg font-medium transition-colors mt-6">
            {loading ? <Loader2 className="animate-spin size-5" aria-hidden="true" /> : <UserPlus size={18} aria-hidden="true" />} 
            {loading ? 'Validando e Criando...' : 'Cadastrar e Entrar'}
          </button>
        </form>

        <p className="text-center text-sm text-slate-600 dark:text-slate-400">
          Já tem uma conta?{' '}
          <button onClick={() => navigate('/')} className="text-primary hover:underline font-medium">
            Acesse aqui
          </button>
        </p>

        <p className="text-center text-xs text-slate-400 dark:text-slate-500 mt-8 pt-6 border-t border-slate-100 dark:border-slate-800/50">
          Feito por Versix Solutions.
        </p>
      </div>
    </div>
  );
}
