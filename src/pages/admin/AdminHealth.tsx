import React, { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase';
import { RefreshCw, CheckCircle, AlertTriangle, XCircle } from 'lucide-react';
import { captureError } from '../../lib/monitoring';

type HealthStatus = 'ok' | 'degraded' | 'down' | 'checking';

interface HealthCheck {
  name: string;
  status: HealthStatus;
  latencyMs?: number;
  detail?: string;
}

const statusConfig: Record<HealthStatus, { color: string; Icon: typeof CheckCircle }> = {
  ok:       { color: 'text-green-600 bg-green-50 dark:bg-green-500/10 border-green-200 dark:border-green-500/20', Icon: CheckCircle },
  degraded: { color: 'text-amber-600 bg-amber-50 dark:bg-amber-500/10 border-amber-200 dark:border-amber-500/20', Icon: AlertTriangle },
  down:     { color: 'text-red-600 bg-red-50 dark:bg-red-500/10 border-red-200 dark:border-red-500/20', Icon: XCircle },
  checking: { color: 'text-slate-500 bg-slate-50 dark:bg-slate-500/10 border-slate-200 dark:border-slate-500/20', Icon: RefreshCw },
};

export default function AdminHealth() {
  const [checks, setChecks] = useState<HealthCheck[]>([]);
  const [running, setRunning] = useState(false);
  const [lastRun, setLastRun] = useState<Date | null>(null);

  useEffect(() => { runChecks(); }, []);

  const runChecks = async () => {
    setRunning(true);
    setChecks([
      { name: 'Database (Supabase)', status: 'checking' },
      { name: 'Storage (assembly_documents)', status: 'checking' },
      { name: 'Auth Service', status: 'checking' },
    ]);

    const results: HealthCheck[] = [];

    // Check 1: Database latency
    try {
      const dbStart = Date.now();
      const { error: dbError } = await supabase.from('profiles').select('id').limit(1);
      results.push({
        name: 'Database (Supabase)',
        status: dbError ? 'down' : 'ok',
        latencyMs: Date.now() - dbStart,
        detail: dbError?.message,
      });
    } catch (e) {
      captureError(e, { component: 'AdminHealth', check: 'database' });
      results.push({ name: 'Database (Supabase)', status: 'down', detail: 'Erro inesperado' });
    }

    // Check 2: Storage bucket
    try {
      const { error: storageError } = await supabase.storage.getBucket('assembly_documents');
      results.push({
        name: 'Storage (assembly_documents)',
        status: storageError ? 'degraded' : 'ok',
        detail: storageError?.message,
      });
    } catch (e) {
      captureError(e, { component: 'AdminHealth', check: 'storage' });
      results.push({ name: 'Storage (assembly_documents)', status: 'down', detail: 'Erro inesperado' });
    }

    // Check 3: Auth
    try {
      const authStart = Date.now();
      const { error: authError } = await supabase.auth.getSession();
      results.push({
        name: 'Auth Service',
        status: authError ? 'down' : 'ok',
        latencyMs: Date.now() - authStart,
        detail: authError?.message,
      });
    } catch (e) {
      captureError(e, { component: 'AdminHealth', check: 'auth' });
      results.push({ name: 'Auth Service', status: 'down', detail: 'Erro inesperado' });
    }

    setChecks(results);
    setLastRun(new Date());
    setRunning(false);
  };

  const overallStatus = checks.some(c => c.status === 'down')
    ? 'down'
    : checks.some(c => c.status === 'degraded')
    ? 'degraded'
    : checks.some(c => c.status === 'checking')
    ? 'checking'
    : 'ok';

  return (
    <div className="max-w-2xl mx-auto space-y-6 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">System Health</h1>
          {lastRun && (
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Última verificação: {lastRun.toLocaleTimeString('pt-BR')}
            </p>
          )}
        </div>
        <div className={`px-3 py-1 rounded-full text-xs font-bold uppercase border ${statusConfig[overallStatus].color}`}>
          {overallStatus === 'ok' ? 'Operacional' : overallStatus === 'degraded' ? 'Degradado' : overallStatus === 'down' ? 'Falha' : 'Verificando'}
        </div>
      </div>

      <div className="space-y-3">
        {checks.map((check) => {
          const { color, Icon } = statusConfig[check.status];
          return (
            <div
              key={check.name}
              className="flex items-center justify-between p-4 rounded-xl border bg-white dark:bg-surface-dark border-slate-200 dark:border-slate-700"
            >
              <div className="flex items-center gap-3">
                <Icon size={18} className={color.split(' ')[0]} />
                <div>
                  <p className="font-semibold text-slate-900 dark:text-white text-sm">{check.name}</p>
                  {check.detail && (
                    <p className="text-xs text-slate-500 mt-0.5">{check.detail}</p>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-3">
                {check.latencyMs !== undefined && (
                  <span className="text-xs text-slate-500">{check.latencyMs}ms</span>
                )}
                <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase border ${color}`}>
                  {check.status}
                </span>
              </div>
            </div>
          );
        })}
      </div>

      <button
        onClick={runChecks}
        disabled={running}
        className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl bg-primary text-white font-semibold hover:bg-primary/90 transition-colors disabled:opacity-50"
      >
        <RefreshCw size={16} className={running ? 'animate-spin' : ''} />
        {running ? 'Verificando...' : 'Re-verificar'}
      </button>
    </div>
  );
}
