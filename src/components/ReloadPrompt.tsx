import React from 'react';
import { useRegisterSW } from 'virtual:pwa-register/react';
import { RefreshCw, X } from 'lucide-react';

export default function ReloadPrompt() {
  const {
    offlineReady: [offlineReady, setOfflineReady],
    needRefresh: [needRefresh, setNeedRefresh],
    updateServiceWorker,
  } = useRegisterSW({
    onRegisteredSW(swUrl, r) {
      console.warn('SW Registered: ' + r)
    },
    onRegisterError(error) {
      console.error('SW registration error', error)
    },
  });

  const close = () => {
    setOfflineReady(false);
    setNeedRefresh(false);
  };

  if (!needRefresh) return null;

  return (
    <div className="fixed bottom-4 right-4 z-50 p-4 rounded-xl shadow-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 animate-in slide-in-from-bottom-5">
      <div className="flex items-start justify-between gap-4">
        
        <div className="flex items-center gap-3">
          <div className="p-2 bg-blue-100 dark:bg-blue-900/30 text-blue-600 rounded-lg">
            <RefreshCw className="animate-spin" size={20} />
          </div>
          
          <div>
            <h4 className="font-bold text-slate-800 dark:text-white text-sm">
              Nova Atualização
            </h4>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              Novos recursos disponíveis. Atualize a tela para aplicar.
            </p>
          </div>
        </div>

        <button 
          onClick={close} 
          className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-white transition-colors"
        >
          <X size={16} />
        </button>

      </div>

      {needRefresh && (
        <button
          onClick={() => updateServiceWorker(true)}
          className="w-full mt-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-bold rounded-lg transition-colors"
        >
          Atualizar Agora
        </button>
      )}
    </div>
  );
}
