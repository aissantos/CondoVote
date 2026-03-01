import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Check, ShieldCheck, Share2 } from 'lucide-react';
import BottomNav from '../../components/BottomNav';

export default function Success() {
  const navigate = useNavigate();

  return (
    <div className="flex-1 flex flex-col min-h-screen bg-background-light dark:bg-background-dark items-center justify-center">
      <div className="relative flex h-full min-h-screen w-full max-w-md flex-col bg-background-light dark:bg-background-dark overflow-x-hidden">
        <div className="flex items-center bg-surface-dark dark:bg-surface-dark p-4 pb-2 justify-between border-b border-border-dark dark:border-border-dark">
          <button
            onClick={() => navigate('/resident/assembly')}
            className="text-slate-900 dark:text-white flex size-12 shrink-0 items-center justify-center rounded-full hover:bg-white/10 transition-colors"
          >
            <ArrowLeft size={24} />
          </button>
          <h2 className="text-slate-900 dark:text-white text-lg font-bold leading-tight tracking-[-0.015em] flex-1 text-center pr-12">
            Confirmação
          </h2>
        </div>

        <div className="flex-1 overflow-y-auto">
          <div className="flex flex-col px-4 py-8">
            <div className="flex flex-col items-center gap-6">
              <div className="relative flex items-center justify-center">
                <div className="absolute inset-0 rounded-full bg-primary/20 animate-pulse"></div>
                <div className="flex h-24 w-24 items-center justify-center rounded-full bg-primary text-white shadow-lg shadow-primary/40 z-10">
                  <Check size={48} />
                </div>
              </div>
              <div className="flex max-w-[480px] flex-col items-center gap-2">
                <p className="text-slate-900 dark:text-white text-2xl font-bold leading-tight tracking-tight text-center">
                  Voto registrado com sucesso!
                </p>
                <p className="text-slate-600 dark:text-text-secondary text-sm font-normal leading-normal max-w-[300px] text-center">
                  Seu voto foi contabilizado e criptografado no sistema da assembleia.
                </p>
              </div>
            </div>

            <div className="mt-8 rounded-xl bg-white dark:bg-surface-dark border border-slate-200 dark:border-border-dark shadow-sm overflow-hidden">
              <div className="bg-primary/10 dark:bg-[#1c2e3e] px-4 py-3 border-b border-slate-200 dark:border-border-dark flex justify-between items-center">
                <span className="text-xs font-bold uppercase tracking-wider text-primary">Comprovante Digital</span>
                <ShieldCheck className="text-primary" size={20} />
              </div>
              <div className="p-4 grid grid-cols-2 gap-y-0">
                <div className="flex flex-col gap-1 border-b border-surface-border py-3 pr-2">
                  <p className="text-slate-500 dark:text-text-secondary text-xs font-medium uppercase tracking-wide">
                    Protocolo
                  </p>
                  <p className="text-slate-900 dark:text-white text-sm font-mono font-medium">ABC123-XYZ</p>
                </div>
                <div className="flex flex-col gap-1 border-b border-surface-border py-3 pl-2 border-l border-l-surface-border">
                  <p className="text-slate-500 dark:text-text-secondary text-xs font-medium uppercase tracking-wide">
                    Escolha
                  </p>
                  <p className="text-green-600 dark:text-green-400 text-sm font-bold">Aprovar Orçamento</p>
                </div>
                <div className="flex flex-col gap-1 border-b border-surface-border py-3 pr-2">
                  <p className="text-slate-500 dark:text-text-secondary text-xs font-medium uppercase tracking-wide">
                    Unidade
                  </p>
                  <p className="text-slate-900 dark:text-white text-sm font-normal">Apto 402 - Bloco B</p>
                </div>
                <div className="flex flex-col gap-1 border-b border-surface-border py-3 pl-2 border-l border-l-surface-border">
                  <p className="text-slate-500 dark:text-text-secondary text-xs font-medium uppercase tracking-wide">
                    Data/Hora
                  </p>
                  <p className="text-slate-900 dark:text-white text-sm font-normal">23 Out, 14:30</p>
                </div>
                <div className="flex flex-col gap-1 py-3 pr-2 col-span-2">
                  <p className="text-slate-500 dark:text-text-secondary text-xs font-medium uppercase tracking-wide">
                    Evento
                  </p>
                  <p className="text-slate-900 dark:text-white text-sm font-normal truncate">
                    Assembleia Geral Ordinária 2023 - Condomínio Solar
                  </p>
                </div>
              </div>
            </div>

            <div className="mt-8 flex flex-col gap-3">
              <button
                onClick={() => navigate('/resident/assembly')}
                className="flex w-full items-center justify-center gap-2 rounded-lg bg-primary h-12 px-5 text-white text-base font-bold leading-normal tracking-[0.015em] hover:bg-primary/90 transition-colors shadow-lg shadow-primary/20"
              >
                <span className="truncate">Voltar à lista de pautas</span>
              </button>
              <button className="flex w-full items-center justify-center gap-2 rounded-lg bg-white dark:bg-transparent border border-slate-200 dark:border-border-dark h-12 px-5 text-slate-700 dark:text-text-secondary hover:bg-slate-50 dark:hover:bg-white/5 transition-colors text-sm font-medium">
                <Share2 size={20} />
                <span className="truncate">Enviar comprovante</span>
              </button>
            </div>
          </div>
        </div>
        <BottomNav />
      </div>
    </div>
  );
}
