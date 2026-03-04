import { Loader2 } from 'lucide-react';

interface LoadingScreenProps {
  message?: string;
}

export default function LoadingScreen({ message = 'Carregando...' }: LoadingScreenProps) {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-background-light dark:bg-background-dark p-6">
      <Loader2 className="w-10 h-10 animate-spin text-primary mb-4" />
      <p className="text-slate-600 dark:text-slate-400 font-medium text-center">
        {message}
      </p>
    </div>
  );
}
