import React, { useState, useEffect } from 'react';
import { Download, X } from 'lucide-react';

// Define the BeforeInstallPromptEvent interface since it's not standard
interface BeforeInstallPromptEvent extends Event {
  readonly platforms: Array<string>;
  readonly userChoice: Promise<{
    outcome: 'accepted' | 'dismissed';
    platform: string;
  }>;
  prompt(): Promise<void>;
}

export default function InstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    // Intercepta o evento nativo
    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      setIsVisible(true);
    };

    window.addEventListener('beforeinstallprompt', handler);

    // Se já foi instalado, não mostramos
    window.addEventListener('appinstalled', () => {
      setIsVisible(false);
      setDeferredPrompt(null);
    });

    return () => {
      window.removeEventListener('beforeinstallprompt', handler);
    };
  }, []);

  const handleInstallClick = async () => {
    if (!deferredPrompt) return;

    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    
    if (outcome === 'accepted') {
      setIsVisible(false);
    }
    setDeferredPrompt(null);
  };

  const closePrompt = () => {
    setIsVisible(false);
  };

  if (!isVisible) return null;

  return (
    <div className="fixed bottom-4 left-4 right-4 z-50 p-4 rounded-xl shadow-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 animate-in slide-in-from-bottom-5 md:max-w-sm md:left-auto">
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-blue-100 dark:bg-blue-900/30 text-blue-600 rounded-lg">
            <Download size={20} />
          </div>
          <div>
            <h4 className="font-bold text-slate-800 dark:text-white text-sm">
              Instalar App
            </h4>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              Adicione o CondoVote à tela inicial para um acesso mais rápido.
            </p>
          </div>
        </div>
        <button 
          onClick={closePrompt} 
          className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-white transition-colors"
        >
          <X size={16} />
        </button>
      </div>

      <button
        onClick={handleInstallClick}
        className="w-full mt-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-bold rounded-lg transition-colors shadow-md"
      >
        Instalar Agora
      </button>
    </div>
  );
}
