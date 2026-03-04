import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, CheckCircle2, Clock, Loader2 } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';

type Topic = {
  id: string;
  title: string;
  description: string;
  status: 'OPEN' | 'CLOSED' | 'DRAFT';
  created_at: string;
  // Computed property after checking votes table
  user_voted?: boolean;
};

export default function Topics() {
  const navigate = useNavigate();
  const { user, profile } = useAuth();
  const [topics, setTopics] = useState<Topic[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'ALL' | 'UNVOTED'>('ALL');

  useEffect(() => {
    fetchTopics();
  }, [user]);

  const fetchTopics = async () => {
    if (!user) return;
    setLoading(true);
    
    // 1. Fetch available topics
    const { data: topicsData, error: topicsError } = await supabase
      .from('topics')
      .select('*')
      .neq('status', 'DRAFT')
      .eq('condo_id', profile?.condo_id)
      .order('created_at', { ascending: false });

    if (topicsError || !topicsData) {
      setLoading(false);
      return;
    }

    // 2. Fetch user votes to check which ones they already voted on
    const { data: votesData, error: votesError } = await supabase
      .from('votes')
      .select('topic_id')
      .eq('user_id', user.id);
      
    const votedTopicIds = new Set(votesData?.map(v => v.topic_id) || []);

    const enrichedTopics = topicsData.map(topic => ({
      ...topic,
      user_voted: votedTopicIds.has(topic.id)
    }));

    setTopics(enrichedTopics);
    setLoading(false);
  };

  const filteredTopics = topics.filter(topic => {
    if (filter === 'UNVOTED') {
      return !topic.user_voted;
    }
    return true;
  });

  return (
    <div className="flex-1 flex flex-col min-h-screen bg-background-light dark:bg-background-dark max-w-md mx-auto relative overflow-hidden transition-colors">
      {/* Header Fixo Escuro/Claro */}
      <div className="flex items-center justify-between px-4 py-4 bg-white/80 dark:bg-background-dark/80 backdrop-blur-md border-b border-slate-200 dark:border-surface-border sticky top-0 z-10 transition-colors">
        <button
          onClick={() => navigate('/resident/home')}
          className="flex items-center justify-center p-2 -ml-2 rounded-full hover:bg-slate-100 dark:hover:bg-surface-dark text-slate-800 dark:text-white transition-colors"
        >
          <ArrowLeft size={24} />
        </button>
        <h2 className="text-lg font-bold leading-tight flex-1 text-center pr-8 text-slate-900 dark:text-white">
          Pautas em Votação
        </h2>
        <div className="w-8"></div>
      </div>

      {/* Filtros Toggle */}
      <div className="px-4 py-4 overflow-x-auto no-scrollbar bg-background-light dark:bg-background-dark border-b border-slate-200 dark:border-surface-border/50 transition-colors">
        <div className="flex gap-3">
          <button 
            onClick={() => setFilter('ALL')}
            className={`flex h-9 shrink-0 items-center justify-center rounded-full px-5 transition-colors ${
              filter === 'ALL' 
                ? 'bg-primary text-white shadow-md shadow-primary/20' 
                : 'bg-white dark:bg-surface-dark text-slate-500 dark:text-slate-400 hover:text-slate-900 hover:dark:text-white border border-slate-200 dark:border-surface-border'
            }`}
          >
            <p className="text-sm font-bold leading-normal tracking-wide">Todas</p>
          </button>
          <button 
             onClick={() => setFilter('UNVOTED')}
             className={`flex h-9 shrink-0 items-center justify-center rounded-full px-5 transition-colors ${
              filter === 'UNVOTED' 
                ? 'bg-primary text-white shadow-md shadow-primary/20' 
                : 'bg-white dark:bg-surface-dark text-slate-500 dark:text-slate-400 hover:text-slate-900 hover:dark:text-white border border-slate-200 dark:border-surface-border'
            }`}
          >
            <p className="text-sm font-medium leading-normal tracking-wide">Não Votadas</p>
          </button>
        </div>
      </div>

      {/* Listagem de Pautas */}
      <div className="flex-1 overflow-y-auto px-4 pb-12 pt-4">
        {loading ? (
          <div className="flex items-center justify-center pt-10">
            <Loader2 className="animate-spin text-primary size-8" />
          </div>
        ) : filteredTopics.length === 0 ? (
           <p className="text-center text-sm text-surface-border font-medium mt-10">Nenhuma pauta disponível no momento.</p>
        ) : (
          <div className="flex flex-col gap-3 pb-8">
            {filteredTopics.map((topic, index) => (
              <div
                key={topic.id}
                data-testid={`vote-topic-${index}`}
                onClick={() => {
                  if (topic.status === 'OPEN' && !topic.user_voted) {
                    navigate(`/voting`, { state: { topic } });
                  }
                }}
                className={`flex flex-col rounded-xl p-4 shadow-sm relative transition-all group ${
                  (topic.status === 'OPEN' && !topic.user_voted) 
                    ? 'bg-white dark:bg-surface-dark border-slate-200 dark:border-surface-border border cursor-pointer hover:border-primary/50 active:scale-[0.98]' 
                    : 'bg-slate-50 dark:bg-background-dark border-slate-200 dark:border-surface-border/50 border opacity-60 cursor-not-allowed'
                }`}
              >
                <div className="mb-2">
                  <span className={`text-[10px] font-bold uppercase tracking-widest ${
                    topic.status === 'OPEN' && !topic.user_voted ? 'text-green-400' 
                    : topic.user_voted ? 'text-slate-400'
                    : 'text-slate-500'
                  }`}>
                    {topic.status === 'OPEN' ? 'Ativa' : 'Encerrada'}
                  </span>
                </div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white leading-tight mb-2">
                  {topic.title}
                </h3>
                <p className="text-slate-500 dark:text-text-secondary text-base font-medium line-clamp-1 mb-4 opacity-70">
                   {topic.description}
                </p>
                <div className="mt-auto flex items-center justify-between pt-3 border-t border-slate-200 dark:border-surface-border/50">
                  {topic.user_voted ? (
                    <div className="flex items-center gap-1.5 text-primary">
                      <CheckCircle2 size={16} />
                      <span className="text-[11px] font-bold uppercase tracking-wider">Voto Computado</span>
                    </div>
                  ) : topic.status === 'OPEN' ? (
                    <>
                      <div className="flex items-center gap-1.5 text-slate-500 dark:text-text-secondary">
                        <Clock size={16} />
                        <span className="text-[11px] font-medium tracking-wider">Livre para votar</span>
                      </div>
                      <span className="text-[11px] font-bold text-slate-800 dark:text-white group-hover:text-primary transition-colors bg-black/5 dark:bg-white/5 px-3 py-1 rounded-full uppercase tracking-wider">
                        Votar
                      </span>
                    </>
                  ) : (
                    <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Fechada</span>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
