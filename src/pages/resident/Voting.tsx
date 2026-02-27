import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, ThumbsUp, ThumbsDown, MinusCircle, BadgeInfo, Timer } from 'lucide-react';
import BottomNav from '../../components/BottomNav';

export default function Voting() {
  const navigate = useNavigate();
  const [selected, setSelected] = useState<string | null>(null);

  const handleVote = (option: string) => {
    setSelected(option);
    setTimeout(() => navigate('/success'), 600);
  };

  return (
    <div className="flex-1 flex flex-col min-h-screen bg-background-light dark:bg-background-dark max-w-md mx-auto shadow-2xl relative overflow-hidden">
      <div className="flex items-center bg-background-light dark:bg-background-dark p-4 pb-2 justify-between border-b border-slate-200 dark:border-slate-800 sticky top-0 z-10">
        <button
          onClick={() => navigate('/topics')}
          className="text-slate-900 dark:text-white flex size-12 shrink-0 items-center justify-center rounded-full hover:bg-slate-200 dark:hover:bg-slate-800 transition-colors"
        >
          <ArrowLeft size={24} />
        </button>
        <h2 className="text-slate-900 dark:text-white text-lg font-bold leading-tight tracking-[-0.015em] flex-1 text-center pr-12">
          Votação da Pauta
        </h2>
      </div>

      <main className="flex-1 flex flex-col px-4 pt-6 pb-24">
        <div className="mb-8 text-center">
          <div className="inline-flex items-center justify-center px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-bold uppercase tracking-wider mb-4">
            Pauta #04
          </div>
          <h1 className="text-slate-900 dark:text-white text-3xl font-extrabold leading-tight mb-3">
            Aprovação da reforma do playground?
          </h1>
          <p className="text-slate-500 dark:text-slate-400 text-base font-normal leading-relaxed max-w-sm mx-auto">
            Escolha apenas uma opção. Voto é definitivo e não poderá ser alterado após a confirmação.
          </p>
        </div>

        <div className="flex flex-col gap-4 w-full max-w-md mx-auto mb-8">
          <button
            onClick={() => handleVote('SIM')}
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
            onClick={() => handleVote('NÃO')}
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
            onClick={() => handleVote('ABSTENÇÃO')}
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
              <span className="text-sm font-bold text-slate-900 dark:text-white">Bloco A - Unidade 102</span>
            </div>
          </div>
          <div className="flex flex-col items-center justify-center gap-2 py-4">
            <span className="text-xs text-slate-500 dark:text-slate-400 font-medium uppercase tracking-wider">
              Tempo restante
            </span>
            <div className="flex items-center gap-2 text-slate-900 dark:text-white font-mono text-2xl font-bold bg-slate-200 dark:bg-slate-800 px-4 py-2 rounded-lg border border-slate-300 dark:border-slate-700">
              <Timer className="text-primary animate-pulse" size={24} />
              04:59
            </div>
          </div>
        </div>
      </main>
      <BottomNav />
    </div>
  );
}
