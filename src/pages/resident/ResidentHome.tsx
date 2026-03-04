import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronRight, LogIn, Building2, Calendar, Clock, ArrowRight } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { supabase } from '../../lib/supabase';
import ThemeToggle from '../../components/ThemeToggle';

type Assembly = {
  id: string;
  title: string;
  description: string;
  assembly_date: string;
  assembly_type: 'AGO' | 'AGE';
  status: 'OPEN' | 'CLOSED' | 'DRAFT';
  format?: 'PRESENCIAL' | 'REMOTO' | 'HIBRIDO';
  first_call_time?: string;
  second_call_time?: string;
  cover_url?: string;
  created_at: string;
};

export default function ResidentHome() {
  const navigate = useNavigate();
  const { user, profile } = useAuth();
  
  const [activeAssembly, setActiveAssembly] = useState<Assembly | null>(null);
  const [closedAssemblies, setClosedAssemblies] = useState<Assembly[]>([]);
  const [propertyName, setPropertyName] = useState<string>("Carregando...");
  const [propertyLogo, setPropertyLogo] = useState<string | null>(null);
  const [isCheckedIn, setIsCheckedIn] = useState<boolean>(false);
  const [quorumPercent, setQuorumPercent] = useState<number>(0);
  const quorumGoal = 51;

  useEffect(() => {
    if (!profile?.condo_id) return;

    const fetchDashboardData = async () => {
      // Puxar nome do condomínio e logo
      const { data: condoData } = await supabase
        .from('condos')
        .select('trade_name, logo_url')
        .eq('id', profile.condo_id)
        .single();
        
      if (condoData) {
        setPropertyName(condoData.trade_name);
        if (condoData.logo_url) setPropertyLogo(condoData.logo_url);
      }
      
      // Puxar meu status de check-in de hoje
      const todayStart = new Date();
      todayStart.setHours(0,0,0,0);
      
      const { count: checkinCount } = await supabase
        .from('checkins')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user?.id)
        .gte('created_at', todayStart.toISOString());
        
      setIsCheckedIn(!!checkinCount && checkinCount > 0);
      
      // Contar Total de Moradores do Condomínio
      const { count: totalResidents } = await supabase
        .from('profiles')
        .select('*', { count: 'exact', head: true })
        .eq('condo_id', profile.condo_id);
      
      // Contar Total de Check-ins hoje
      const { count: totalCheckins } = await supabase
        .from('checkins')
        .select('*', { count: 'exact', head: true })
        .eq('condo_id', profile.condo_id)
        .gte('created_at', todayStart.toISOString());
        
      if (totalResidents && totalCheckins !== null) {
        setQuorumPercent(Math.round((totalCheckins / totalResidents) * 100));
      }

      // Fetch Active Assembly
      const { data: openAssemblies } = await supabase
        .from('assemblies')
        .select('*')
        .eq('condo_id', profile.condo_id)
        .eq('status', 'OPEN')
        .order('assembly_date', { ascending: false })
        .limit(1);

      if (openAssemblies && openAssemblies.length > 0) {
        setActiveAssembly(openAssemblies[0] as unknown as Assembly);
      }

      // Fetch Closed Assemblies
      const { data: pastAssemblies } = await supabase
        .from('assemblies')
        .select('*')
        .eq('condo_id', profile.condo_id)
        .eq('status', 'CLOSED')
        .order('assembly_date', { ascending: false })
        .limit(3);

      if (pastAssemblies) setClosedAssemblies(pastAssemblies as unknown as Assembly[]);
    };

    fetchDashboardData();
  }, [profile?.condo_id, user?.id]);

  const handleAssemblyClick = () => {
    if (isCheckedIn) {
      navigate('/resident/assembly');
    } else {
      navigate('/check-in');
    }
  };

  const prefetchTopics = useCallback(async () => {
    if (!profile?.condo_id || !activeAssembly) return;
    // Fetch implicitly caches in Supabase/React layer momentarily
    supabase.from('topics').select('*')
      .eq('condo_id', profile.condo_id)
      .neq('status', 'DRAFT')
      .then(() => {}); 
  }, [profile?.condo_id, activeAssembly]);



  return (
    <div className="flex flex-col min-h-screen bg-background-light dark:bg-background-dark font-display antialiased transition-colors">
      <div className="relative flex flex-1 flex-col w-full overflow-x-hidden pb-8">
        
        {/* Header Fixo Transparente */}
        <div className="flex items-center bg-white/80 dark:bg-background-dark/80 backdrop-blur-md p-4 pb-2 justify-between sticky top-0 z-20 border-b border-slate-200 dark:border-surface-border/50 transition-colors">
          {propertyLogo ? (
            <div className="flex size-10 shrink-0 items-center justify-center rounded-full overflow-hidden bg-white/10 border border-slate-200 dark:border-surface-border shadow-sm">
              <img src={propertyLogo} alt="Logo Condomínio" className="w-full h-full object-cover" />
            </div>
          ) : (
            <div className="flex size-10 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary border border-primary/20">
              <Building2 size={20} />
            </div>
          )}
          <h2 className="text-slate-900 dark:text-white text-lg font-bold leading-tight tracking-[-0.015em] flex-1 text-center">
            {propertyName}
          </h2>
          <div className="flex w-12 items-center justify-end">
            <ThemeToggle className="flex items-center justify-center rounded-full size-10 bg-transparent text-slate-800 dark:text-white hover:bg-slate-100 dark:hover:bg-surface-dark transition-colors" />
          </div>
        </div>

        {/* Resumo Perfil */}
        <div className="flex p-4">
          <div className="flex gap-4 items-center">
            <div 
              className="bg-center bg-no-repeat bg-cover rounded-full h-14 w-14 border-2 border-primary shadow-lg flex items-center justify-center bg-slate-200 dark:bg-surface-dark text-slate-700 dark:text-white font-bold text-xl" 
            >
              {profile?.full_name?.charAt(0) || 'U'}
            </div>
            <div className="flex flex-col justify-center">
              <p className="text-slate-900 dark:text-white text-[20px] font-bold leading-tight tracking-[-0.015em]">
                Olá, {profile?.full_name?.split(' ')[0] || 'Usuário'}!
              </p>
              <p className="text-slate-500 dark:text-text-secondary text-sm font-normal leading-normal">
                Apto {profile?.unit_number}, Bloco {profile?.block_number}
              </p>
            </div>
          </div>
        </div>

        {/* Categoria: Assembleia em Andamento (Hero Card) */}
        <div className="px-4 pb-3 flex justify-between items-center mt-2">
          <h3 className="text-slate-900 dark:text-white text-lg font-bold leading-tight tracking-[-0.015em]">Assembleia de Hoje</h3>
          {activeAssembly ? (
            <span className="bg-green-100 dark:bg-green-500/10 text-green-600 dark:text-green-400 text-[10px] font-bold px-2 py-0.5 rounded-full border border-green-200 dark:border-green-500/20 uppercase tracking-wider">
              {activeAssembly.assembly_type} Em andamento
            </span>
          ) : (
             <span className="bg-slate-100 dark:bg-slate-500/10 text-slate-500 dark:text-slate-400 text-[10px] font-bold px-2 py-0.5 rounded-full border border-slate-200 dark:border-slate-500/20 uppercase tracking-wider">
              Sem sessão
            </span>
          )}
        </div>

        <div className="px-4 pb-4">
          {activeAssembly ? (
            <div 
               className="relative bg-primary overflow-hidden rounded-3xl p-6 text-white shadow-xl shadow-primary/20 transition-all hover:scale-[1.02] active:scale-[0.98] cursor-pointer"
               onClick={handleAssemblyClick}
               style={{
                 backgroundImage: activeAssembly.cover_url 
                   ? `linear-gradient(to right, rgba(15, 23, 42, 0.95), rgba(15, 23, 42, 0.7)), url(${activeAssembly.cover_url})` 
                   : 'none',
                 backgroundSize: 'cover',
                 backgroundPosition: 'center',
               }}
            >
              {/* Background Decorations para fallback */}
              {!activeAssembly.cover_url && (
                  <>
                    <div className="absolute top-0 right-0 -mr-8 -mt-8 w-32 h-32 rounded-full bg-white opacity-10 transition-transform duration-500 ease-in-out hover:scale-150 mix-blend-overlay"></div>
                    <div className="absolute bottom-0 left-0 -ml-8 -mb-8 w-24 h-24 rounded-full bg-white opacity-10 transition-transform duration-500 ease-in-out hover:scale-150 mix-blend-overlay"></div>
                  </>
              )}

              <div className="relative z-10">
                <div className="flex justify-between items-start mb-6">
                  <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shadow-lg backdrop-blur-md ${activeAssembly.cover_url ? 'bg-white/20' : 'bg-white/20'}`}>
                    <Calendar size={24} className="text-white drop-shadow-md" />
                  </div>
                  <div className="flex flex-col items-end gap-2">
                     <span className="bg-white/20 backdrop-blur-md text-white text-[10px] font-bold px-3 py-1 rounded-full border border-white/30 uppercase tracking-widest shadow-sm">
                       {activeAssembly.assembly_type}
                     </span>
                     {activeAssembly.format && (
                       <span className="bg-black/30 backdrop-blur-sm text-white text-[10px] font-bold px-2.5 py-0.5 rounded-full border border-white/10 uppercase tracking-wider">
                         {activeAssembly.format}
                       </span>
                     )}
                  </div>
                </div>
                
                <div>
                  <h2 className="text-2xl font-bold mb-1.5 leading-tight drop-shadow-sm">{activeAssembly.title}</h2>
                  <p className="text-indigo-100 text-sm font-medium flex items-center gap-1.5 drop-shadow-sm opacity-90 mb-4">
                    <Clock size={14} className="opacity-80" /> 
                    {new Date(activeAssembly.assembly_date + 'T12:00:00').toLocaleDateString('pt-BR', {day: '2-digit', month: 'short', year: 'numeric'})}
                    {activeAssembly.first_call_time && (
                       <span className="ml-1 opacity-80 text-xs hidden sm:inline-block">
                          • 1ª {activeAssembly.first_call_time.slice(0, 5)} 
                          {activeAssembly.second_call_time && ` / 2ª ${activeAssembly.second_call_time.slice(0, 5)}`}
                       </span>
                    )}
                  </p>
                  
                  {/* Mobile only times */}
                  {activeAssembly.first_call_time && (
                      <div className="sm:hidden flex items-center gap-3 mb-4 text-xs font-semibold text-white/80 bg-black/20 p-2 rounded-lg backdrop-blur-sm border border-white/10 w-fit">
                         <div className="flex items-center gap-1"><Clock size={12}/> 1ª {activeAssembly.first_call_time.slice(0, 5)}</div>
                         {activeAssembly.second_call_time && (
                            <div className="flex items-center gap-1 border-l border-white/20 pl-3"><Clock size={12}/> 2ª {activeAssembly.second_call_time.slice(0, 5)}</div>
                         )}
                      </div>
                  )}
                  
                  <button 
                    onMouseEnter={prefetchTopics}
                    onClick={handleAssemblyClick}
                    className="mt-2 w-full flex items-center justify-center gap-2 bg-white text-primary rounded-xl py-3 font-bold shadow-lg hover:shadow-xl hover:-translate-y-0.5 transition-all text-sm group"
                  >
                    Confirmar Presença
                    <ArrowRight size={16} className="transition-transform group-hover:translate-x-1" />
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-stretch justify-start rounded-2xl overflow-hidden shadow-xl dark:shadow-2xl bg-white dark:bg-surface-dark border border-slate-200 dark:border-surface-border group transition-all">
              <div className="relative w-full aspect-[21/9]">
                <div 
                  className="absolute inset-0 bg-cover bg-center" 
                  style={{backgroundImage: 'url("https://images.unsplash.com/photo-1577414440139-2a4c10a30b6c?auto=format&fit=crop&q=80&w=2000")'}}
                ></div>
                <div className="absolute inset-0 bg-gradient-to-t from-slate-900 dark:from-surface-dark via-slate-900/40 dark:via-surface-dark/40 to-transparent"></div>
                <div className="absolute bottom-3 left-4 right-4">
                  <p className="text-white text-lg font-bold leading-tight tracking-[-0.015em]">
                    Nenhuma Sessão Agendada
                  </p>
                  <p className="text-slate-200 dark:text-text-secondary text-xs font-medium">
                    {new Date().toLocaleDateString('pt-BR', {day: '2-digit', month: 'short', year: 'numeric'})}
                  </p>
                </div>
              </div>

              <div className="flex flex-col gap-5 p-4">
                <div className="flex flex-col gap-1">
                  <p className="text-slate-500 dark:text-text-secondary text-[10px] font-bold uppercase tracking-widest opacity-70">Título da Sessão</p>
                  <p className="text-slate-900 dark:text-white text-base font-medium leading-snug">
                    Aguarde o anúncio de novas assembleias pelo condomínio.
                  </p>
                </div>
                
                <div className="bg-slate-50 dark:bg-background-dark/50 rounded-xl p-4 border border-slate-200 dark:border-surface-border/50">
                  <div className="flex justify-between items-end mb-2.5">
                    <span className="text-slate-600 dark:text-text-secondary text-xs font-medium">Quórum Atual</span>
                    <span className="text-primary text-base font-bold">{quorumPercent}%</span>
                  </div>
                  <div className="w-full bg-slate-200 dark:bg-surface-border rounded-full h-1.5">
                    <div 
                      className="bg-primary h-1.5 rounded-full shadow-[0_0_8px_rgba(19,127,236,0.4)] transition-all duration-1000" 
                      style={{ width: `${Math.min(quorumPercent, 100)}%` }}
                    ></div>
                  </div>
                  <p className="text-[10px] text-slate-500 dark:text-text-secondary/60 mt-2">Mínimo necessário: {quorumGoal}% + 1</p>
                </div>
                
                <div className="pt-2">
                  <button 
                    onMouseEnter={prefetchTopics}
                    onClick={handleAssemblyClick}
                    disabled={!activeAssembly && isCheckedIn}
                    className={`w-full cursor-pointer flex items-center justify-center rounded-xl h-16 text-white text-base font-bold leading-normal transition-all shadow-xl active:scale-[0.98] ${
                      isCheckedIn && activeAssembly 
                        ? 'bg-green-600 hover:bg-green-500 shadow-green-600/20' 
                        : (!activeAssembly && isCheckedIn ? 'bg-slate-200 text-slate-400 dark:bg-surface-border dark:text-slate-500 cursor-not-allowed shadow-none' : 'bg-primary hover:bg-primary/90 shadow-primary/20')
                    }`}
                  >
                    {isCheckedIn ? (
                      activeAssembly ? (
                         <>Entrar na Reunião <ChevronRight size={20} className="ml-1" /></>
                      ) : (
                         "Aguardando Assembleia..."
                      )
                    ) : (
                      <><LogIn size={22} className="mr-3" /> Realizar Check-in</>
                    )}
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Assembleias Anteriores (Histórico Local) */}
        <h3 className="text-slate-900 dark:text-white text-lg font-bold leading-tight tracking-[-0.015em] px-4 pb-3 pt-4">Assembleias Anteriores</h3>
        <div className="flex flex-col gap-3 px-4 pb-10">
          {closedAssemblies.length > 0 ? (
            closedAssemblies.map(assembly => (
              <div key={assembly.id} className="flex items-center gap-4 bg-white dark:bg-surface-dark rounded-xl p-4 border border-slate-200 dark:border-surface-border/60 hover:dark:border-primary/40 hover:border-primary/40 transition-all cursor-pointer shadow-sm dark:shadow-none group">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1.5">
                    <span className="text-green-500 dark:text-green-400 text-[10px] font-bold uppercase tracking-wider">Concluída</span>
                    <span className="text-slate-300 dark:text-text-secondary/40 text-[10px]">•</span>
                    <span className="text-slate-500 dark:text-text-secondary text-xs font-medium">
                      {new Date(assembly.assembly_date + 'T12:00:00').toLocaleDateString('pt-BR', {day: '2-digit', month: 'short', year: 'numeric'})}
                    </span>
                  </div>
                  <h4 className="text-slate-900 dark:text-white text-base font-bold mb-1 truncate">[{assembly.assembly_type}] {assembly.title}</h4>
                  <p className="text-slate-500 dark:text-text-secondary text-xs line-clamp-1 opacity-70">{assembly.description}</p>
                </div>
                <div className="flex flex-col items-center justify-center text-primary group-hover:translate-x-1 transition-transform">
                  <ChevronRight size={24} />
                </div>
              </div>
            ))
          ) : (
            <div className="text-center py-6 text-slate-500 dark:text-text-secondary text-sm border border-slate-300 dark:border-surface-border/50 rounded-xl bg-white dark:bg-surface-dark border-dashed">
              Nenhum histórico de assembleia encontrado.
            </div>
          )}
        </div>
        
      </div>
    </div>
  );
}
