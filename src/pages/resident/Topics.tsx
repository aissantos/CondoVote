import { useNavigate } from 'react-router-dom';
import { ArrowLeft, CheckCircle2, Clock } from 'lucide-react';
import BottomNav from '../../components/BottomNav';

export default function Topics() {
  const navigate = useNavigate();
  const topics = [
    { id: 1, category: 'Obras', title: 'Reforma do Playground', time: '02:05:42', status: 'pending', color: 'text-red-500' },
    { id: 2, category: 'Financeiro', title: 'Aprovação de Contas 2023', status: 'voted', color: 'text-primary' },
    { id: 3, category: 'Segurança', title: 'Instalação de Câmeras', time: 'Restam 5 dias', status: 'pending', color: 'text-orange-500' },
    { id: 4, category: 'Lazer', title: 'Regra do Salão de Festas', time: '12 horas', status: 'pending', color: 'text-purple-500' },
    { id: 5, category: 'Obras', title: 'Pintura da Fachada', time: '7 dias', status: 'pending', color: 'text-red-500' },
    { id: 6, category: 'Lazer', title: 'Novos Equipamentos Academia', time: '15 dias', status: 'pending', color: 'text-purple-500' },
  ];

  return (
    <div className="flex-1 flex flex-col min-h-screen bg-background-light dark:bg-background-dark max-w-md mx-auto shadow-2xl relative overflow-hidden">
      <div className="flex items-center justify-between px-4 py-3 bg-white dark:bg-[#192633] border-b border-slate-200 dark:border-slate-800 sticky top-0 z-10">
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
          <button className="flex h-8 shrink-0 items-center justify-center gap-x-2 rounded-full bg-slate-200 dark:bg-[#233648] px-4">
            <p className="text-slate-600 dark:text-slate-300 text-xs font-medium leading-normal">Não Votadas</p>
          </button>
          <button className="flex h-8 shrink-0 items-center justify-center gap-x-2 rounded-full bg-slate-200 dark:bg-[#233648] px-4">
            <p className="text-slate-600 dark:text-slate-300 text-xs font-medium leading-normal">Votadas</p>
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-3 pb-24">
        <div className="grid grid-cols-2 gap-3">
          {topics.map((topic) => (
            <div
              key={topic.id}
              onClick={() => topic.status === 'pending' && navigate('/voting')}
              className="flex flex-col rounded-lg bg-white dark:bg-[#192633] p-3 shadow-sm border border-slate-200 dark:border-slate-800 relative cursor-pointer active:scale-95 transition-transform"
            >
              <div className="mb-1">
                <span className={`text-[10px] font-bold uppercase tracking-wider ${topic.color}`}>
                  {topic.category}
                </span>
              </div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-white leading-tight mb-auto">
                {topic.title}
              </h3>
              <div className="mt-3 flex items-center justify-between">
                {topic.status === 'voted' ? (
                  <div className="flex items-center gap-1 text-green-500">
                    <CheckCircle2 size={14} className="fill-current text-white" />
                    <span className="text-[10px] font-bold uppercase">Votado</span>
                  </div>
                ) : (
                  <>
                    <div className="flex items-center gap-1 text-slate-500 dark:text-slate-400">
                      <Clock size={14} />
                      <span className="text-[10px] font-medium">{topic.time}</span>
                    </div>
                    <span className="text-[10px] font-bold text-primary">Votar</span>
                  </>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
      <BottomNav />
    </div>
  );
}
