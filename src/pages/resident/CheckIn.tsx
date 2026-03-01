import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Building2, User, Building, DoorOpen, CheckCircle2, Loader2 } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { supabase } from '../../lib/supabase';

export default function CheckIn() {
  const navigate = useNavigate();
  const { user, profile } = useAuth();
  const [condoName, setCondoName] = useState('Seu Condomínio');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (profile?.condo_id) {
      supabase.from('condos').select('name').eq('id', profile.condo_id).single()
        .then(({data}) => {
          if (data) setCondoName(data.name);
        });
    }
  }, [profile?.condo_id]);

  const handleCheckIn = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user?.id || !profile?.condo_id) return;
    
    setSubmitting(true);
    const { error } = await supabase.from('checkins').insert([
      { user_id: user.id, condo_id: profile.condo_id }
    ]);
    setSubmitting(false);

    if (error && error.code !== '23505') {
      alert('Falha ao registrar check-in: ' + error.message);
    } else {
      navigate('/resident/assembly', { replace: true });
    }
  };

  return (
    <div className="flex-1 flex flex-col min-h-screen bg-background-light dark:bg-background-dark max-w-md mx-auto shadow-2xl relative overflow-hidden">
      <header className="flex items-center justify-between p-4 sticky top-0 z-10 bg-background-light/95 dark:bg-background-dark/95 backdrop-blur-md border-b border-slate-200 dark:border-slate-800">
        <button
          onClick={() => window.history.back()}
          className="flex items-center justify-center p-2 rounded-full hover:bg-slate-200 dark:hover:bg-slate-800 transition-colors"
        >
          <ArrowLeft className="text-slate-900 dark:text-white" />
        </button>
        <h2 className="text-lg font-bold leading-tight flex-1 text-center pr-10 text-slate-900 dark:text-white">
          Check-in Assembleia
        </h2>
      </header>

      <main className="flex-1 flex flex-col p-4 w-full">
        <div className="pt-4 pb-6 text-center">
          <div className="inline-flex items-center justify-center size-16 rounded-full bg-primary/10 mb-4">
            <Building2 className="text-primary size-8" />
          </div>
          <h1 className="text-2xl font-bold leading-tight mb-2 text-slate-900 dark:text-white">
            Assembleia Geral Extraordinária
          </h1>
          <p className="text-primary font-medium text-lg mb-2">{condoName}</p>
          <p className="text-slate-500 dark:text-slate-400 text-sm leading-relaxed max-w-xs mx-auto">
            Bem-vindo! Realize seu check-in para participar das votações e decisões importantes do dia.
          </p>
        </div>

        <form className="space-y-5" onSubmit={handleCheckIn}>
          <div className="space-y-2">
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300" htmlFor="name">
              Nome Completo
            </label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-slate-400">
                <User size={20} />
              </span>
              <input
                className="form-input block w-full rounded-xl border-slate-300 dark:border-slate-700 bg-white dark:bg-surface-dark text-slate-900 dark:text-white pl-10 focus:border-primary focus:ring-primary h-12 sm:text-sm"
                id="name"
                placeholder="Digite seu nome completo"
                type="text"
                defaultValue={profile?.full_name || ''}
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300" htmlFor="block">
                Bloco / Rua
              </label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-slate-400">
                  <Building size={20} />
                </span>
                <input
                  className="form-input block w-full rounded-xl border-slate-300 dark:border-slate-700 bg-white dark:bg-surface-dark text-slate-900 dark:text-white pl-10 focus:border-primary focus:ring-primary h-12 sm:text-sm"
                  id="block"
                  placeholder="Ex: Bloco A"
                  type="text"
                  defaultValue={profile?.block_number || ''}
                  required
                />
              </div>
            </div>
            <div className="space-y-2">
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300" htmlFor="unit">
                Unidade
              </label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-slate-400">
                  <DoorOpen size={20} />
                </span>
                <input
                  className="form-input block w-full rounded-xl border-slate-300 dark:border-slate-700 bg-white dark:bg-surface-dark text-slate-900 dark:text-white pl-10 focus:border-primary focus:ring-primary h-12 sm:text-sm"
                  id="unit"
                  placeholder="Ex: 102"
                  type="text"
                  defaultValue={profile?.unit_number || ''}
                  required
                />
              </div>
            </div>
          </div>

          <div className="space-y-3 pt-2">
            <p className="text-sm font-medium text-slate-700 dark:text-slate-300">Eu sou:</p>
            <div className="grid grid-cols-1 gap-3">
              {['Proprietário', 'Inquilino', 'Representante Legal'].map((role, idx) => (
                <label
                  key={role}
                  className="relative flex items-center p-3 rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800/50 cursor-pointer transition-all"
                >
                  <input
                    defaultChecked={idx === 0}
                    className="h-4 w-4 text-primary border-slate-300 dark:border-slate-600 focus:ring-primary bg-transparent"
                    name="role"
                    type="radio"
                  />
                  <span className="ml-3 flex-1 flex flex-col">
                    <span className="block text-sm font-medium text-slate-900 dark:text-white">{role}</span>
                    <span className="block text-xs text-slate-500 dark:text-slate-400">
                      {role === 'Proprietário'
                        ? 'Responsável pela unidade'
                        : role === 'Inquilino'
                        ? 'Residente atual'
                        : 'Com procuração'}
                    </span>
                  </span>
                </label>
              ))}
            </div>
          </div>

          <div className="pt-6 pb-2">
            <button
              type="submit"
              disabled={submitting}
              className="w-full flex items-center justify-center bg-primary hover:bg-blue-600 text-white font-bold py-3.5 px-4 rounded-xl shadow-lg shadow-primary/20 transition-all active:scale-[0.98] disabled:opacity-75"
            >
              {submitting ? <Loader2 className="mr-2 animate-spin" size={20} /> : <CheckCircle2 className="mr-2" size={20} />}
              Confirmar presença
            </button>
            <p className="text-xs text-center text-slate-500 dark:text-slate-400 mt-4">
              Ao confirmar, você concorda com os termos da assembleia.
            </p>
          </div>
        </form>
      </main>
      <div className="h-1.5 w-32 bg-slate-300 dark:bg-slate-700 rounded-full mx-auto mb-2 opacity-50"></div>
    </div>
  );
}
