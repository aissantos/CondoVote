import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { ArrowLeft, ThumbsUp, ThumbsDown, MinusCircle, BadgeInfo, Timer, Loader2, Paperclip } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';
import { useToast } from '../../hooks/useToast';

type VoteChoice = 'SIM' | 'NÃO' | 'ABSTENÇÃO';

export default function Voting() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();
  const toast = useToast();
  
  // Topic passado via navegação do componente Topics.tsx
  const topic = location.state?.topic;

  const [selected, setSelected] = useState<VoteChoice | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [alreadyVoted, setAlreadyVoted] = useState(false);
  const [checkingVote, setCheckingVote] = useState(true);
  const [profile, setProfile] = useState<{unit_number?: string, block_number?: string, full_name?: string} | null>(null);

  // Carrega perfil e verifica voto existente em paralelo
  useEffect(() => {
    if (!user || !topic) return;

    const loadData = async () => {
      const [profileResult, voteResult] = await Promise.all([
        supabase
          .from('profiles')
          .select('unit_number, block_number, full_name')
          .eq('id', user.id)
          .single(),
        supabase
          .from('votes')
          .select('id, choice')
          .eq('topic_id', topic.id)
          .eq('user_id', user.id)
          .maybeSingle(), // maybeSingle() não lança erro quando não encontra
      ]);

      if (profileResult.data) setProfile(profileResult.data);

      // Se já votou, redirecionar imediatamente para a tela de sucesso
      if (voteResult.data) {
        navigate('/success', { replace: true });
        return;
      }

      setCheckingVote(false);
    };

    loadData();
  }, [user, topic, navigate]);

  // Se o usuário acessar a rota diretamente na URL
  if (!topic) {
    return (
      <div className="flex-1 flex flex-col min-h-screen bg-background-light dark:bg-background-dark items-center justify-center p-6 text-center">
        <p className="text-slate-500 mb-4">Nenhuma pauta selecionada para votação.</p>
        <button onClick={() => navigate('/resident/assembly')} className="text-primary font-bold hover:underline" aria-label="Voltar para lista de pautas">
          Voltar para Pautas
        </button>
      </div>
    );
  }

  // Estado de loading inicial (verificando voto existente)
  if (checkingVote && topic) {
    return (
      <div className="flex-1 flex flex-col min-h-screen items-center justify-center bg-background-light dark:bg-background-dark">
        <Loader2 className="animate-spin text-primary size-8" aria-label="Verificando participação..." />
      </div>
    );
  }

  const handleVote = useCallback(async (option: VoteChoice) => {
    if (!user?.id || submitting || alreadyVoted) return;

    setSelected(option);
    setSubmitting(true);

    const { error } = await supabase.from('votes').insert([
      { topic_id: topic.id, user_id: user.id, choice: option }
    ]);

    setSubmitting(false);

    if (error) {
      // Tratamento específico para violação de unique constraint (voto duplo)
      if (error.code === '23505') {
        setAlreadyVoted(true);
        navigate('/success', { replace: true });
        return;
      }
      toast.error('Erro ao registrar voto: ' + error.message);
      console.error('[Voting] Erro ao inserir voto:', error);
      setSelected(null);
    } else {
      setAlreadyVoted(true);
      setTimeout(() => navigate('/success', { replace: true }), 600);
    }
  }, [user, topic, submitting, alreadyVoted, navigate]);

  return (
    <div className="flex-1 flex flex-col min-h-screen bg-background-light dark:bg-background-dark max-w-md mx-auto shadow-2xl relative overflow-hidden">
      <div className="flex items-center bg-background-light dark:bg-background-dark p-4 pb-2 justify-between border-b border-slate-200 dark:border-slate-800 sticky top-0 z-10">
        <button
          onClick={() => navigate('/resident/assembly')}
          aria-label="Voltar para lista de pautas"
          className="text-slate-900 dark:text-white flex size-12 shrink-0 items-center justify-center rounded-full hover:bg-slate-200 dark:hover:bg-slate-800 transition-colors"
        >
          <ArrowLeft size={24} aria-hidden="true" />
        </button>
        <h2 className="text-slate-900 dark:text-white text-lg font-bold leading-tight tracking-[-0.015em] flex-1 text-center pr-12">
          Votação da Pauta
        </h2>
      </div>

      <main className="flex-1 flex flex-col px-4 pt-6 pb-24">
        <div className="mb-8 text-center flex flex-col items-center">
          <div className="inline-flex items-center justify-center px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-bold uppercase tracking-wider mb-4">
            Em Andamento
          </div>
          <h1 className="text-slate-900 dark:text-white text-3xl font-extrabold leading-tight mb-5 w-full">
            {topic.title}
          </h1>

          {(topic.description || topic.attachment_url) && (
            <div className="text-left bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl p-5 w-full shadow-sm mb-6 relative overflow-hidden">
               {/* Decorador Lateral */}
               <div className="absolute left-0 top-0 bottom-0 w-1 bg-primary"></div>
               {topic.description && (
                  <p className="text-slate-700 dark:text-slate-300 text-base font-medium leading-relaxed whitespace-pre-wrap break-words">
                     {topic.description}
                  </p>
               )}
               {topic.attachment_url && (
                  <div className={`w-full mt-4 ${topic.description ? 'pt-4 border-t border-slate-100 dark:border-slate-700' : ''}`}>
                     <a 
                        href={topic.attachment_url} 
                        target="_blank" 
                        rel="noopener noreferrer" 
                        className="flex items-center justify-center gap-2 p-3.5 bg-indigo-50 hover:bg-indigo-100 dark:bg-indigo-500/10 dark:hover:bg-indigo-500/20 text-indigo-600 dark:text-indigo-400 font-bold rounded-xl transition-all shadow-sm active:scale-[0.98]"
                     >
                        <Paperclip size={18} />
                        Visualizar Anexo da Pauta
                     </a>
                  </div>
               )}
            </div>
          )}

          <p className="text-slate-500 dark:text-slate-400 text-sm font-normal leading-relaxed w-full">
            Escolha apenas uma opção. Seu voto é definitivo e não poderá ser alterado.
          </p>
        </div>

        <div className="flex flex-col gap-4 w-full max-w-md mx-auto mb-8 relative">
          {submitting && (
            <div className="absolute inset-0 bg-background-light/50 dark:bg-background-dark/50 backdrop-blur-[1px] z-10 flex items-center justify-center rounded-2xl">
              <Loader2 className="animate-spin text-primary size-8" />
            </div>
          )}
          
          <button
            disabled={submitting}
            onClick={() => handleVote('SIM')}
            aria-label={`Votar SIM na pauta: ${topic.title}`}
            aria-pressed={selected === 'SIM'}
            className={`group relative flex items-center w-full p-4 rounded-xl bg-background-light dark:bg-slate-800 border-2 transition-all shadow-sm active:scale-[0.98] ${
              selected === 'SIM'
                ? 'border-vote-yes'
                : 'border-slate-200 dark:border-slate-700 hover:border-vote-yes'
            }`}
          >
            <div
              className={`flex size-12 shrink-0 items-center justify-center rounded-full mr-4 transition-colors ${
                selected === 'SIM'
                  ? 'bg-vote-yes text-white'
                  : 'bg-vote-yes/10 text-vote-yes group-hover:bg-vote-yes group-hover:text-white'
              }`}
            >
              <ThumbsUp size={28} />
            </div>
            <div className="flex flex-col items-start flex-1">
              <span
                className={`text-lg font-bold transition-colors ${
                  selected === 'SIM' ? 'text-vote-yes' : 'text-slate-900 dark:text-white group-hover:text-vote-yes'
                }`}
              >
                SIM
              </span>
              <span className="text-xs text-slate-500 dark:text-slate-400">Aprovar a pauta</span>
            </div>
            <div
              className={`size-6 rounded-full border-2 flex items-center justify-center ${
                selected === 'SIM' ? 'border-vote-yes' : 'border-slate-300 dark:border-slate-600 group-hover:border-vote-yes'
              }`}
            >
              <div
                className={`size-3 rounded-full bg-vote-yes transition-opacity ${
                  selected === 'SIM' ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'
                }`}
              ></div>
            </div>
          </button>

          <button
            disabled={submitting}
            onClick={() => handleVote('NÃO')}
            aria-label={`Votar NÃO na pauta: ${topic.title}`}
            aria-pressed={selected === 'NÃO'}
            className={`group relative flex items-center w-full p-4 rounded-xl bg-background-light dark:bg-slate-800 border-2 transition-all shadow-sm active:scale-[0.98] ${
              selected === 'NÃO'
                ? 'border-vote-no'
                : 'border-slate-200 dark:border-slate-700 hover:border-vote-no'
            }`}
          >
            <div
              className={`flex size-12 shrink-0 items-center justify-center rounded-full mr-4 transition-colors ${
                selected === 'NÃO'
                  ? 'bg-vote-no text-white'
                  : 'bg-vote-no/10 text-vote-no group-hover:bg-vote-no group-hover:text-white'
              }`}
            >
              <ThumbsDown size={28} />
            </div>
            <div className="flex flex-col items-start flex-1">
              <span
                className={`text-lg font-bold transition-colors ${
                  selected === 'NÃO' ? 'text-vote-no' : 'text-slate-900 dark:text-white group-hover:text-vote-no'
                }`}
              >
                NÃO
              </span>
              <span className="text-xs text-slate-500 dark:text-slate-400">Rejeitar a pauta</span>
            </div>
            <div
              className={`size-6 rounded-full border-2 flex items-center justify-center ${
                selected === 'NÃO' ? 'border-vote-no' : 'border-slate-300 dark:border-slate-600 group-hover:border-vote-no'
              }`}
            >
              <div
                className={`size-3 rounded-full bg-vote-no transition-opacity ${
                  selected === 'NÃO' ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'
                }`}
              ></div>
            </div>
          </button>

          <button
            disabled={submitting}
            onClick={() => handleVote('ABSTENÇÃO')}
            aria-label={`Votar ABSTENÇÃO na pauta: ${topic.title}`}
            aria-pressed={selected === 'ABSTENÇÃO'}
            className={`group relative flex items-center w-full p-4 rounded-xl bg-background-light dark:bg-slate-800 border-2 transition-all shadow-sm active:scale-[0.98] ${
              selected === 'ABSTENÇÃO'
                ? 'border-vote-abs'
                : 'border-slate-200 dark:border-slate-700 hover:border-vote-abs'
            }`}
          >
            <div
              className={`flex size-12 shrink-0 items-center justify-center rounded-full mr-4 transition-colors ${
                selected === 'ABSTENÇÃO'
                  ? 'bg-vote-abs text-white'
                  : 'bg-vote-abs/10 text-vote-abs group-hover:bg-vote-abs group-hover:text-white'
              }`}
            >
              <MinusCircle size={28} />
            </div>
            <div className="flex flex-col items-start flex-1">
              <span
                className={`text-lg font-bold transition-colors ${
                  selected === 'ABSTENÇÃO' ? 'text-vote-abs' : 'text-slate-900 dark:text-white group-hover:text-vote-abs'
                }`}
              >
                ABSTENÇÃO
              </span>
              <span className="text-xs text-slate-500 dark:text-slate-400">Não opinar</span>
            </div>
            <div
              className={`size-6 rounded-full border-2 flex items-center justify-center ${
                selected === 'ABSTENÇÃO' ? 'border-vote-abs' : 'border-slate-300 dark:border-slate-600 group-hover:border-vote-abs'
              }`}
            >
              <div
                className={`size-3 rounded-full bg-vote-abs transition-opacity ${
                  selected === 'ABSTENÇÃO' ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'
                }`}
              ></div>
            </div>
          </button>
        </div>

        <div className="mt-auto flex flex-col gap-4">
          <div className="bg-primary/5 border border-primary/20 rounded-lg p-4 flex items-center gap-3">
            <div className="bg-primary/20 p-2 rounded-full text-primary">
              <BadgeInfo size={20} />
            </div>
            <div className="flex flex-col">
              <span className="text-xs font-semibold text-primary uppercase tracking-wide">
                Você está votando como
              </span>
              <span className="text-sm font-bold text-slate-900 dark:text-white">
                {profile?.full_name || 'Usuário'}
                {(profile?.unit_number || profile?.block_number) && ` - Bloco ${profile?.block_number} Unidade ${profile?.unit_number}`}
              </span>
            </div>
          </div>
          <div className="flex flex-col items-center justify-center gap-2 py-4">
            <span className="text-xs text-slate-500 dark:text-slate-400 font-medium uppercase tracking-wider">
              Segurança
            </span>
            <div className="flex items-center gap-2 text-slate-900 dark:text-white font-mono text-sm font-bold bg-slate-200 dark:bg-slate-800 px-4 py-2 rounded-lg border border-slate-300 dark:border-slate-700">
              Voto Registrado e Auditável
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
