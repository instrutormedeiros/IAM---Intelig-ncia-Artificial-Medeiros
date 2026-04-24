
import React, { useState, useEffect } from 'react';
import { UserRole, StudyContext } from './types';
import AdminPanel from './components/AdminPanel';
import StudentChat from './components/StudentChat';
import { BookOpen, ShieldCheck, GraduationCap, Info, Sparkles } from 'lucide-react';

const App: React.FC = () => {
  const [role, setRole] = useState<UserRole>(UserRole.STUDENT);
  const [isAdminLoggedIn, setIsAdminLoggedIn] = useState(false);
  const [studyContext, setStudyContext] = useState<StudyContext | null>(null);
  
  const isEmbed = new URLSearchParams(window.location.search).get('embed') === 'true';

  useEffect(() => {
    const saved = localStorage.getItem('iam_study_context');
    if (saved) {
      setStudyContext(JSON.parse(saved));
    }
  }, []);

  const handleUpdateContext = (newContext: StudyContext) => {
    setStudyContext(newContext);
    localStorage.setItem('iam_study_context', JSON.stringify(newContext));
  };

  const clearContext = () => {
    setStudyContext(null);
    localStorage.removeItem('iam_study_context');
  };

  return (
    <div className={`min-h-screen flex flex-col ${isEmbed ? 'bg-transparent' : 'bg-slate-50'}`}>
      {!isEmbed && (
        <header className="bg-white/80 backdrop-blur-md border-b border-slate-200 sticky top-0 z-50">
          <div className="max-w-5xl mx-auto px-6 h-16 flex items-center justify-between">
            <div className="flex items-center gap-3 group cursor-pointer">
              <div className="relative">
                <div className="absolute inset-0 bg-emerald-500 blur-lg opacity-20 group-hover:opacity-40 transition-opacity"></div>
                <div className="relative bg-gradient-to-br from-emerald-500 to-emerald-700 p-2 rounded-xl text-white shadow-lg shadow-emerald-200 transition-transform duration-300">
                  <GraduationCap size={22} />
                </div>
              </div>
              <div>
                <div className="flex items-center">
                  <h1 className="text-2xl font-black text-slate-900 tracking-tighter flex items-center">
                    I<span className="text-emerald-500 animate-pulse">.</span>AM
                  </h1>
                </div>
                <p className="text-[7px] text-slate-400 font-black uppercase tracking-[0.2em] -mt-1 ml-0.5">INTELIGÊNCIA ARTIFICIAL MEDEIROS</p>
              </div>
            </div>

            <nav className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl">
              <button
                onClick={() => setRole(UserRole.STUDENT)}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${
                  role === UserRole.STUDENT 
                    ? 'bg-white text-emerald-600 shadow-sm' 
                    : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                <BookOpen size={14} />
                Estudar
              </button>
              <button
                onClick={() => setRole(UserRole.ADMIN)}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${
                  role === UserRole.ADMIN 
                    ? 'bg-white text-indigo-600 shadow-sm' 
                    : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              <ShieldCheck size={14} />
              Gestão
            </button>
          </nav>
        </div>
      </header>
      )}

      <main className={`flex-1 w-full mx-auto ${isEmbed ? 'max-w-full p-0' : 'max-w-5xl px-6 py-6'}`}>
        {role === UserRole.ADMIN ? (
          <AdminPanel 
            context={studyContext} 
            onUpdate={handleUpdateContext} 
            onClear={clearContext}
            isLoggedIn={isAdminLoggedIn}
            onLoginSuccess={() => setIsAdminLoggedIn(true)}
          />
        ) : (
          <StudentChat studyContext={studyContext?.content || ""} />
        )}
      </main>

      {!isEmbed && (
        <footer className="bg-white border-t border-slate-200 py-6">
          <div className="max-w-5xl mx-auto px-6 flex flex-col items-center gap-5">
            <div className="flex flex-col items-center gap-2.5">
              <div className="flex items-center gap-4 text-[10px] font-black text-slate-900 tracking-[0.2em]">
                <span className="opacity-50">I.AM</span>
                <span className="text-emerald-500 font-black">•</span>
                <span className="opacity-50 italic">I AM</span>
                <span className="text-slate-300">/</span>
                <span className="text-emerald-600 text-[11px] underline underline-offset-4 decoration-emerald-200">EU SOU • EU ESTOU</span>
              </div>
              <div className="flex flex-wrap justify-center gap-4 text-[9px] font-bold uppercase tracking-widest text-slate-400 italic">
                <span>Eu estou aprendendo</span>
                <span className="w-1 h-1 bg-slate-200 rounded-full"></span>
                <span>Eu sou capaz</span>
                <span className="w-1 h-1 bg-slate-200 rounded-full"></span>
                <span>Eu estou fazendo o meu melhor</span>
              </div>
            </div>

            <div className="w-full flex flex-col md:flex-row justify-between items-center pt-5 border-t border-slate-50 gap-4 text-[9px] font-bold text-slate-300 uppercase tracking-widest">
              <div className="flex items-center gap-2">
                <div className="w-1 h-1 bg-emerald-400 rounded-full opacity-50"></div>
                <span>© {new Date().getFullYear()} I.AM Inteligência Educacional</span>
              </div>
              
              <div className="flex items-center gap-2 text-slate-400">
                <Sparkles size={10} className="text-emerald-400" />
                <span>Criado e desenvolvido por Medeiros</span>
              </div>

              <div className="flex items-center gap-4">
                 <span className="hover:text-emerald-500 transition-colors cursor-help">Privacidade</span>
                 <div className="flex items-center gap-1.5 opacity-60">
                   <Info size={10} />
                   <span>Fontes Curadas</span>
                 </div>
              </div>
            </div>
          </div>
        </footer>
      )}
    </div>
  );
};

export default App;
