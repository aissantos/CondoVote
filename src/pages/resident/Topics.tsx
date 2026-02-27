import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, CheckCircle2, Clock, Loader2 } from 'lucide-react';
import BottomNav from '../../components/BottomNav';
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
  const { user } = useAuth();
  const [topics, setTopics] = useState<Topic[]>([]);
  const [loading, setLoading] = useState(true);

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

  return (
    <div className="flex-1 flex flex-col min-h-screen bg-background-light dark:bg-background-dark max-w-md mx-auto shadow-2xl relative overflow-hidden">
      <div className="flex items-center justify-between px-4 py-3 bg-white dark:bg-surface-dark border-b border-slate-200 dark:border-slate-800 sticky top-0 z-10">
        <button
          onClick={() => navigate('/')}
          className="flex items-center justify-center p-2 -ml-2 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-900 dark:text-white transition-colors"
        >
          <ArrowLeft size={24} />
        </button>
        <h2 className="text-lg font-bold leading-tight flex-1 text-center pr-8 text-slate-900 dark:text-white">
          Pautas em Votação
        </h2>
        <div className="w-8"></div>
      </div>

      <div className="px-4 py-4 overflow-x-auto no-scrollbar bg-background-light dark:bg-background-dark">
        <div className="flex gap-2">
          <button className="flex h-8 shrink-0 items-center justify-center gap-x-2 rounded-full bg-primary px-4 shadow-sm">
            <p className="text-white text-xs font-medium leading-normal">Todas</p>
          </button>
          <button className="flex h-8 shrink-0 items-center justify-center gap-x-2 rounded-full bg-slate-200 dark:bg-slate-800 px-4">
            <p className="text-slate-600 dark:text-slate-300 text-xs font-medium leading-normal">Não Votadas</p>
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-3 pb-24">
        {loading ? (
          <div className="flex items-center justify-center pt-10">
            <Loader2 className="animate-spin text-primary size-8" />
          </div>
        ) : topics.length === 0 ? (
           <p className="text-center text-sm text-slate-500 mt-10">Nenhuma pauta disponível no momento.</p>
        ) : (
          <div className="grid grid-cols-2 gap-3">
            {topics.map((topic) => (
              <div
                key={topic.id}
                onClick={() => {
                  if (topic.status === 'OPEN' && !topic.user_voted) {
                    navigate(`/voting`, { state: { topic } });
                  }
                }}
                className={`flex flex-col rounded-lg bg-white dark:bg-surface-dark p-3 shadow-sm border relative transition-transform ${
                  (topic.status === 'OPEN' && !topic.user_voted) 
                    ? 'border-slate-200 dark:border-slate-800 cursor-pointer hover:border-primary active:scale-95' 
                    : 'border-transparent opacity-70 cursor-not-allowed'
                }`}
              >
                <div className="mb-1">
                  <span className={`text-[10px] font-bold uppercase tracking-wider ${topic.status === 'OPEN' ? 'text-primary' : 'text-slate-500'}`}>
                    {topic.status === 'OPEN' ? 'Ativa' : 'Encerrada'}
                  </span>
                </div>
                <h3 className="text-sm font-bold text-slate-900 dark:text-white leading-tight mb-auto mt-1">
                  {topic.title}
                </h3>
                <div className="mt-4 flex items-center justify-between">
                  {topic.user_voted ? (
                    <div className="flex items-center gap-1 text-green-500">
                      <CheckCircle2 size={14} className="fill-current text-white" />
                      <span className="text-[10px] font-bold uppercase">Votado</span>
                    </div>
                  ) : topic.status === 'OPEN' ? (
                    <>
                      <div className="flex items-center gap-1 text-slate-500 dark:text-slate-400">
                        <Clock size={14} />
                        <span className="text-[10px] font-medium">Livre</span>
                      </div>
                      <span className="text-[10px] font-bold text-primary">Votar</span>
                    </>
                  ) : (
                    <span className="text-[10px] font-bold text-slate-500">Encerrado</span>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
      <BottomNav />
    </div>
  );
}
