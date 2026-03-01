import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Verified, Vote, History, ChevronRight, Info, Bell } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { supabase } from '../../lib/supabase';

type Topic = {
  id: string;
  title: string;
  description: string;
  status: 'OPEN' | 'CLOSED' | 'DRAFT';
};

export default function ResidentHome() {
  const navigate = useNavigate();
  const { user, profile } = useAuth();
  
  const [activeTopics, setActiveTopics] = useState<Topic[]>([]);
  const [propertyName, setPropertyName] = useState<string>("Carregando...");
  const [isCheckedIn, setIsCheckedIn] = useState<boolean>(false);
  const [quorumPercent, setQuorumPercent] = useState<number>(0);
  const quorumGoal = 51;

  useEffect(() => {
    if (!profile?.condo_id) return;

    const fetchDashboardData = async () => {
      // Puxar nome do condomínio
      const { data: condoData } = await supabase
        .from('condos')
        .select('trade_name')
        .eq('id', profile.condo_id)
        .single();
        
      if (condoData) setPropertyName(condoData.trade_name);
      
      // Puxar meu status de check-in de hoje
      const todayStart = new Date();
      todayStart.setHours(0,0,0,0);
      
      const { count: checkinCount } = await supabase
        .from('checkins')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user?.id)
        .gte('created_at', todayStart.toISOString());
        
      setIsCheckedIn(!!checkinCount && checkinCount > 0);
      
      // Contar Total de Moradores do Condomínio para calcular quórum
      const { count: totalResidents } = await supabase
        .from('profiles')
        .select('*', { count: 'exact', head: true })
        .eq('condo_id', profile.condo_id);
      
      // Contar Total de Check-ins (Todos os aptos) hoje
      const { count: totalCheckins } = await supabase
        .from('checkins')
        .select('*', { count: 'exact', head: true })
        .eq('condo_id', profile.condo_id)
        .gte('created_at', todayStart.toISOString());
        
      if (totalResidents && totalCheckins !== null) {
        setQuorumPercent(Math.round((totalCheckins / totalResidents) * 100));
      }

      // Puxar pautas ativas
      const { data: topicsData } = await supabase
        .from('topics')
        .select('*')
        .eq('condo_id', profile.condo_id)
        .eq('status', 'OPEN')
        .order('created_at', { ascending: false });

      if (topicsData) setActiveTopics(topicsData);
    };

    fetchDashboardData();
  }, [profile?.condo_id]);

  const handleAssemblyClick = () => {
    if (isCheckedIn) {
      navigate('/resident/assembly');
    } else {
      navigate('/check-in');
    }
  };

  return (
    <div className="flex flex-col h-full bg-background-light dark:bg-background-dark">
      {/* Header */}
      <header className="flex items-center justify-between px-6 pt-10 pb-6">
        <div className="flex flex-col">
          <h1 className="text-xl font-bold tracking-tight text-slate-800 dark:text-slate-100">
            {propertyName}
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">Assembleia Ordinária</p>
        </div>
        <button className="flex h-10 w-10 items-center justify-center rounded-full bg-white dark:bg-slate-800 text-slate-500 shadow-sm">
          <Bell className="size-5" />
        </button>
      </header>

      <div className="px-6 mb-8">
        {/* Card Principal: Check-in & Quórum */}
        <div className="bg-white dark:bg-surface-dark rounded-[2rem] p-8 shadow-sm border border-slate-100/50 dark:border-border-dark">
          <div className="mb-8">
            {isCheckedIn ? (
              <div className="flex items-center gap-2 mb-2">
                <Verified className="text-accent dark:text-blue-400 size-5" />
                <p className="text-[10px] font-bold uppercase tracking-[0.1em] text-slate-500 dark:text-slate-400">
                  Check-in Realizado
                </p>
              </div>
            ) : null}
            <h2 className="text-2xl font-semibold text-slate-800 dark:text-slate-100 mb-1">
              Bloco {profile?.block_number} - Unidade {profile?.unit_number}
            </h2>
            <p className="text-sm text-slate-500 dark:text-slate-400">Presente na sessão atual</p>
          </div>

          <div className="pt-6 border-t border-slate-50 dark:border-slate-800">
            <div className="flex items-center justify-between mb-4">
              <div>
                <p className="text-[10px] font-bold uppercase tracking-[0.1em] text-slate-500 dark:text-slate-400 mb-1">
                  Resumo da Assembleia
                </p>
                <div className="flex items-baseline gap-1">
                  <span className="text-3xl font-bold text-slate-800 dark:text-white">{quorumPercent}%</span>
                  <span className="text-xs text-slate-500 dark:text-slate-400">das unidades</span>
                </div>
              </div>
              <div className="text-right">
                <p className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase">Meta</p>
                <p className="text-sm font-semibold text-slate-800 dark:text-white">{quorumGoal}%</p>
              </div>
            </div>

            <div className="h-1.5 w-full rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
              <div 
                className="h-full rounded-full bg-accent dark:bg-blue-400 transition-all duration-1000" 
                style={{ width: `${Math.min(quorumPercent, 100)}%` }}
              ></div>
            </div>
            
            <div className="mt-4 flex items-start gap-2">
              <Info className="size-3 text-slate-400 mt-0.5 shrink-0" />
              <p className="text-[11px] leading-relaxed text-slate-500 dark:text-slate-400">
                Aguardando mais unidades para atingir o quórum de deliberação.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Botões de Ação Pronta */}
      <section className="px-6 mb-10">
        <div className="flex items-center gap-3">
          <button 
            onClick={handleAssemblyClick}
            className="flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-white dark:bg-surface-dark border border-slate-100 dark:border-border-dark shadow-sm transition-transform active:scale-95"
          >
            <div className="relative">
              <Vote className="size-5 text-slate-500 dark:text-slate-400" />
              {activeTopics.length > 0 && (
                <span className="absolute -top-1 -right-1 flex h-3 w-3 items-center justify-center rounded-full bg-accent dark:bg-blue-500 text-[8px] font-bold text-white">
                  {activeTopics.length}
                </span>
              )}
            </div>
            <span className="text-xs font-semibold text-slate-800 dark:text-slate-200">Votações Ativas</span>
          </button>
          
          <button 
            onClick={() => navigate('/resident/documents')}
            className="flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-white dark:bg-surface-dark border border-slate-100 dark:border-border-dark shadow-sm transition-transform active:scale-95"
          >
            <History className="size-5 text-slate-500 dark:text-slate-400" />
            <span className="text-xs font-semibold text-slate-800 dark:text-slate-200">Meu Histórico</span>
          </button>
        </div>
      </section>

      {/* Próximas Pautas */}
      <section className="px-6 pb-6">
        <div className="mb-6 flex items-baseline justify-between">
          <h3 className="text-sm font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider">
            Próximas Pautas
          </h3>
          <button className="text-[10px] font-bold text-accent dark:text-blue-400 uppercase tracking-widest border-b border-accent dark:border-blue-400 pb-0.5">
            Ver Edital
          </button>
        </div>

        <div className="space-y-6">
          {activeTopics.length > 0 ? (
            activeTopics.map((topic, index) => (
              <div key={topic.id} className="group relative flex flex-col cursor-pointer" onClick={handleAssemblyClick}>
                <div className="flex items-start justify-between gap-4 mb-2">
                  <div className="flex-1">
                    <span className="block text-[10px] font-bold text-accent dark:text-blue-400 uppercase mb-1">
                      Pauta 0{index + 1}
                    </span>
                    <h4 className="text-lg font-medium text-slate-800 dark:text-slate-100 leading-snug">
                      {topic.title}
                    </h4>
                  </div>
                  <ChevronRight className="size-5 text-slate-300 dark:text-slate-600 mt-5" />
                </div>
                <p className="text-sm text-slate-500 dark:text-slate-400 line-clamp-1">
                  {topic.description}
                </p>
                <div className="mt-6 h-[1px] w-full bg-slate-200/60 dark:bg-slate-800"></div>
              </div>
            ))
          ) : (
            <div className="text-center py-8">
              <p className="text-sm text-slate-500">Nenhuma pauta cadastrada para esta assembleia.</p>
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
