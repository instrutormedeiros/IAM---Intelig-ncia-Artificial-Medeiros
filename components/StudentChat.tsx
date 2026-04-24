
import React, { useState, useRef, useEffect } from 'react';
import { askIAMStream, generateSummary, generateExam } from '../services/geminiService';
import { Message, StudentMode, Question, ExamResult } from '../types';
import MarkdownRenderer from './MarkdownRenderer';
import { Send, Sparkles, BookOpen, FileCheck, MessageSquare, ChevronLeft, Search, BrainCircuit, CheckCircle2, XCircle, Trophy, RotateCcw, ArrowRight, GraduationCap } from 'lucide-react';

interface StudentChatProps {
  studyContext: string;
}

const StudentChat: React.FC<StudentChatProps> = ({ studyContext }) => {
  const [mode, setMode] = useState<StudentMode>('dashboard');
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [topicRequest, setTopicRequest] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [summary, setSummary] = useState<string | null>(null);
  
  const [exam, setExam] = useState<Question[] | null>(null);
  const [currentExamStep, setCurrentExamStep] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [isShowingFeedback, setIsShowingFeedback] = useState(false);
  const [examResult, setExamResult] = useState<ExamResult | null>(null);
  
  const isEmbed = new URLSearchParams(window.location.search).get('embed') === 'true';
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isLoading]);

  const startSummary = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!topicRequest.trim()) return;
    setIsLoading(true);
    const res = await generateSummary(studyContext, topicRequest);
    setSummary(res);
    setIsLoading(false);
  };

  const startExam = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!topicRequest.trim()) return;
    setIsLoading(true);
    const res = await generateExam(studyContext, topicRequest);
    if (res && Array.isArray(res)) {
      setExam(res);
      setExamResult({ score: 0, total: res.length, answers: [] });
      setCurrentExamStep(0);
      setSelectedAnswer(null);
      setIsShowingFeedback(false);
      setMode('exam');
    } else {
      alert("Não consegui gerar questões inéditas sobre esse tópico no momento.");
    }
    setIsLoading(false);
  };

  const handleSend = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!input.trim() || isLoading) return;

    const userMsg: Message = { 
      id: Date.now().toString(), 
      role: 'user', 
      text: input, 
      timestamp: new Date() 
    };
    
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setIsLoading(true);

    const modelMsgId = (Date.now() + 1).toString();
    const modelPlaceholder: Message = { 
      id: modelMsgId, 
      role: 'model', 
      text: '', 
      timestamp: new Date() 
    };
    
    setMessages(prev => [...prev, modelPlaceholder]);

    try {
      const history = messages.map(m => ({ role: m.role, parts: [{ text: m.text }] }));
      const stream = askIAMStream(userMsg.text, studyContext, history);
      
      let fullText = '';
      setIsLoading(false); // Transição do loading central para o typing no chat

      for await (const chunk of stream) {
        fullText += chunk;
        setMessages(prev => prev.map(m => m.id === modelMsgId ? { ...m, text: fullText } : m));
      }
    } catch (error) {
      setMessages(prev => prev.map(m => m.id === modelMsgId ? { ...m, text: "Ocorreu um erro ao processar sua resposta." } : m));
    }
  };

  const handleExamAnswer = (index: number) => {
    if (!exam || isShowingFeedback) return;
    setSelectedAnswer(index);
    setIsShowingFeedback(true);
    const isCorrect = index === exam[currentExamStep].correctAnswer;
    setExamResult(prev => {
      if (!prev) return null;
      return {
        ...prev,
        score: isCorrect ? prev.score + 1 : prev.score,
        answers: [...prev.answers, { questionId: exam[currentExamStep].id, selected: index, isCorrect }]
      };
    });
  };

  const nextQuestion = () => {
    if (!exam) return;
    if (currentExamStep < exam.length - 1) {
      setCurrentExamStep(prev => prev + 1);
      setSelectedAnswer(null);
      setIsShowingFeedback(false);
    } else {
      setMode('exam_result');
    }
  };

  const resetExam = () => {
    setExam(null);
    setExamResult(null);
    setCurrentExamStep(0);
    setTopicRequest('');
    setMode('dashboard');
  };

  const LoadingScreen = () => (
    <div className="flex-1 flex flex-col items-center justify-center space-y-10 p-12 text-center animate-in fade-in duration-700">
      <div className="relative">
        {/* Anéis orbitais */}
        <div className="absolute -inset-8 border-2 border-emerald-500/10 rounded-full animate-[spin_10s_linear_infinite]"></div>
        <div className="absolute -inset-12 border border-emerald-500/5 rounded-full animate-[spin_15s_linear_infinite_reverse]"></div>
        
        {/* Halo de pulso */}
        <div className="absolute inset-0 bg-emerald-400/20 rounded-full blur-3xl animate-pulse"></div>
        
        {/* Logo de carregamento centralizada (Chapéu de Formatura) */}
        <div className="relative w-28 h-28 bg-white rounded-3xl flex items-center justify-center shadow-2xl border border-emerald-100 rotate-12 animate-[bounce_3s_ease-in-out_infinite]">
          <GraduationCap size={56} className="text-emerald-600 -rotate-12" />
        </div>

        {/* Partículas flutuantes */}
        <div className="absolute -top-4 -right-4 w-3 h-3 bg-emerald-400 rounded-full animate-ping"></div>
        <div className="absolute -bottom-6 -left-2 w-2 h-2 bg-teal-300 rounded-full animate-pulse delay-700"></div>
      </div>
      
      <div className="space-y-4 max-w-xs">
        <h3 className="text-2xl font-black text-slate-800 tracking-tight">
          I<span className="text-emerald-500">.</span>AM <span className="text-emerald-500 animate-pulse">processando...</span>
        </h3>
        <p className="text-slate-400 text-xs font-bold uppercase tracking-widest leading-relaxed">
          Sintetizando inteligência para sua evolução.
        </p>
      </div>
    </div>
  );

  if (mode === 'dashboard') {
    return (
      <div className={`max-w-4xl mx-auto space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-500 px-4 ${isEmbed ? 'py-4' : ''}`}>
        <div className="text-center space-y-6 mb-12">
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-slate-900 text-white rounded-full text-[9px] font-black uppercase tracking-[0.2em] shadow-lg">
             <Sparkles size={12} className="text-emerald-400" />
             Seu Mentor Educacional
          </div>
          
          <h2 className="text-6xl font-black text-slate-900 tracking-tighter">
            I<span className="text-emerald-500">.</span>AM
          </h2>

          <div className="phrase-morph-container">
            <p className="phrase-morph-item phrase-pt text-slate-500 text-xl font-medium tracking-tight">
              <span className="text-emerald-600 font-black mr-1">Eu estou</span> 
              aqui para <span className="text-slate-900 font-black">impulsionar seus estudos.</span>
            </p>

            <p className="phrase-morph-item phrase-en text-slate-500 text-xl font-medium tracking-tight">
              <span className="text-emerald-600 font-black mr-1">I am</span> 
              here to <span className="text-slate-900 font-black">boost your studies.</span>
            </p>
          </div>
        </div>

        <div className="grid md:grid-cols-3 gap-6">
          <button onClick={() => setMode('chat')} className="group p-8 bg-white border-2 border-slate-100 rounded-[2.5rem] shadow-sm hover:shadow-2xl hover:border-emerald-500 hover:-translate-y-2 transition-all text-left space-y-5">
            <div className="w-14 h-14 bg-emerald-100 text-emerald-600 rounded-2xl flex items-center justify-center group-hover:bg-emerald-600 group-hover:text-white transition-all shadow-sm">
              <MessageSquare size={28} />
            </div>
            <div>
              <h3 className="text-xl font-black text-slate-800 tracking-tight">Chat com I.AM</h3>
              <p className="text-slate-500 text-xs leading-relaxed font-semibold mt-1">Converse e resolva qualquer ponto do conteúdo agora.</p>
            </div>
          </button>

          <button onClick={() => setMode('summary')} className="group p-8 bg-white border-2 border-slate-100 rounded-[2.5rem] shadow-sm hover:shadow-2xl hover:border-indigo-500 hover:-translate-y-2 transition-all text-left space-y-5">
            <div className="w-14 h-14 bg-indigo-100 text-indigo-600 rounded-2xl flex items-center justify-center group-hover:bg-indigo-600 group-hover:text-white transition-all shadow-sm">
              <BookOpen size={28} />
            </div>
            <div>
              <h3 className="text-xl font-black text-slate-800 tracking-tight">Faça seus resumos</h3>
              <p className="text-slate-500 text-xs leading-relaxed font-semibold mt-1">Transforme textos em explicações simples e diretas.</p>
            </div>
          </button>

          <button onClick={() => setMode('exam')} className="group p-8 bg-white border-2 border-slate-100 rounded-[2.5rem] shadow-sm hover:shadow-2xl hover:border-amber-500 hover:-translate-y-2 transition-all text-left space-y-5">
            <div className="w-14 h-14 bg-amber-100 text-amber-600 rounded-2xl flex items-center justify-center group-hover:bg-amber-600 group-hover:text-white transition-all shadow-sm">
              <FileCheck size={28} />
            </div>
            <div>
              <h3 className="text-xl font-black text-slate-800 tracking-tight">Crie seus simulados</h3>
              <p className="text-slate-500 text-xs leading-relaxed font-semibold mt-1">Valide seu conhecimento com questões sempre inéditas.</p>
            </div>
          </button>
        </div>

        {studyContext && (
          <div className={`bg-gradient-to-br from-emerald-600 via-emerald-500 to-teal-600 rounded-[3rem] text-white flex flex-col md:flex-row items-center justify-between shadow-2xl shadow-emerald-200/50 gap-8 relative overflow-hidden group ${isEmbed ? 'p-8' : 'p-12'}`}>
            <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
              <BrainCircuit size={180} />
            </div>
            <div className="space-y-4 relative z-10 text-center md:text-left">
              <div className="flex items-center gap-2 justify-center md:justify-start">
                <div className="px-3 py-1 bg-white/20 backdrop-blur-md rounded-full text-[9px] font-black uppercase tracking-widest border border-white/10">Inteligência Ativa</div>
              </div>
              <h4 className="text-3xl font-black italic max-w-sm leading-tight tracking-tight">"Aprender é o único superpoder que ninguém te tira."</h4>
            </div>
            <button onClick={() => setMode('chat')} className="bg-white text-emerald-600 px-10 py-5 rounded-2xl font-black shadow-2xl hover:scale-105 active:scale-95 transition-all z-10 whitespace-nowrap text-lg">
              Começar agora
            </button>
          </div>
        )}
      </div>
    );
  }

  // Modos de Resumo e Simulado (simplificados para brevidade, mantendo lógica anterior)
  if (mode === 'exam_result' && examResult) {
    const percentage = Math.round((examResult.score / examResult.total) * 100);
    return (
      <div className="max-w-2xl mx-auto space-y-8 animate-in zoom-in-95 duration-500 py-10 px-4">
        <div className="bg-white p-12 rounded-[3.5rem] shadow-3xl border border-slate-100 text-center space-y-8 relative overflow-hidden">
          <div className="absolute top-0 inset-x-0 h-2 bg-gradient-to-r from-emerald-400 via-indigo-500 to-amber-400"></div>
          <div className="w-24 h-24 bg-emerald-50 text-emerald-600 rounded-3xl flex items-center justify-center mx-auto shadow-inner relative">
            <Trophy size={48} />
            <div className="absolute -top-2 -right-2 bg-amber-400 text-white p-1.5 rounded-lg shadow-lg"><Sparkles size={16} /></div>
          </div>
          <h2 className="text-4xl font-black text-slate-900 tracking-tighter">Sua Pontuação</h2>
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-slate-50 p-6 rounded-3xl border border-slate-100">
              <span className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Nota Final</span>
              <span className="text-4xl font-black text-emerald-600">{examResult.score}<span className="text-slate-300 text-xl">/{examResult.total}</span></span>
            </div>
            <div className="bg-slate-50 p-6 rounded-3xl border border-slate-100">
              <span className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Aproveitamento</span>
              <span className="text-4xl font-black text-indigo-600">{percentage}%</span>
            </div>
          </div>
          <button onClick={startExam} className="w-full py-5 bg-slate-900 text-white font-black rounded-2xl flex items-center justify-center gap-3 hover:bg-black transition-all shadow-xl"><RotateCcw size={20} /> Novo Simulado</button>
          <button onClick={resetExam} className="w-full py-5 bg-white text-slate-400 font-black rounded-2xl border border-slate-100 hover:bg-slate-50 transition-all">Voltar ao Início</button>
        </div>
      </div>
    );
  }

  return (
    <div className={`max-w-4xl mx-auto flex flex-col bg-white border border-slate-100 overflow-hidden relative ${isEmbed ? 'h-screen rounded-none border-none' : 'h-[80vh] rounded-[2.5rem] shadow-2xl'}`}>
      <div className="px-8 py-4 bg-slate-50/50 backdrop-blur-sm border-b border-slate-100 flex items-center justify-between z-20">
        <button onClick={() => { setMode('dashboard'); setSummary(null); setExam(null); setTopicRequest(''); }} className="flex items-center gap-2 text-slate-400 hover:text-slate-900 font-black text-[9px] uppercase tracking-widest transition-all group">
          <ChevronLeft size={16} className="group-hover:-translate-x-1 transition-transform" /> Retornar
        </button>
        <div className="flex items-center gap-2 bg-white px-3 py-1 rounded-full shadow-sm border border-slate-100">
          <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse"></div>
          <span className="text-[8px] font-black uppercase tracking-widest text-slate-500">
            {mode === 'chat' ? 'Modo Mentor' : mode === 'summary' ? 'Modo Síntese' : 'Modo Desafio'}
          </span>
        </div>
      </div>

      {isLoading ? (
        <LoadingScreen />
      ) : mode === 'summary' && !summary ? (
        <div className="flex-1 flex flex-col items-center justify-center p-8 text-center space-y-6 animate-in zoom-in-95 duration-500">
          <div className="w-20 h-20 bg-indigo-50 text-indigo-600 rounded-[1.5rem] flex items-center justify-center shadow-inner"><BookOpen size={40} /></div>
          <h3 className="text-2xl font-black text-slate-900 tracking-tight">O que resumimos?</h3>
          <form onSubmit={startSummary} className="w-full max-w-md relative group">
            <input value={topicRequest} onChange={e => setTopicRequest(e.target.value)} placeholder="Ex: NR-35, Legislação..." className="w-full bg-slate-50 border-2 border-slate-100 rounded-2xl px-6 py-4 text-base font-bold outline-none focus:border-indigo-500 focus:bg-white transition-all pr-16 shadow-sm" />
            <button type="submit" className="absolute right-2.5 top-2.5 bg-indigo-600 text-white p-2.5 rounded-xl hover:scale-105 transition-all"><Search size={20} /></button>
          </form>
        </div>
      ) : mode === 'exam' && !exam ? (
        <div className="flex-1 flex flex-col items-center justify-center p-8 text-center space-y-6 animate-in zoom-in-95 duration-500">
          <div className="w-20 h-20 bg-amber-50 text-amber-600 rounded-[1.5rem] flex items-center justify-center shadow-inner"><FileCheck size={40} /></div>
          <h3 className="text-2xl font-black text-slate-900 tracking-tight">Qual o tema do teste?</h3>
          <form onSubmit={startExam} className="w-full max-w-md relative group">
            <input value={topicRequest} onChange={e => setTopicRequest(e.target.value)} placeholder="Tópico do Simulado..." className="w-full bg-slate-50 border-2 border-slate-100 rounded-2xl px-6 py-4 text-base font-bold outline-none focus:border-amber-500 focus:bg-white transition-all pr-16 shadow-sm" />
            <button type="submit" className="absolute right-2.5 top-2.5 bg-amber-600 text-white p-2.5 rounded-xl hover:scale-105 transition-all"><Search size={20} /></button>
          </form>
        </div>
      ) : mode === 'summary' && summary ? (
        <div className="flex-1 overflow-y-auto p-6 bg-slate-50/30">
          <div className="max-w-2xl mx-auto bg-white p-10 rounded-[2rem] shadow-xl border border-slate-100 animate-in slide-in-from-bottom-10 duration-700">
            <MarkdownRenderer content={summary} />
            <button onClick={() => setSummary(null)} className="mt-8 w-full py-4 bg-slate-900 text-white font-black rounded-xl transition-all shadow-lg hover:bg-slate-800">Novo Resumo</button>
          </div>
        </div>
      ) : mode === 'exam' && exam ? (
        <div className="flex-1 overflow-y-auto p-6 flex flex-col items-center justify-center bg-slate-50/20">
          <div className="max-w-xl w-full space-y-8 animate-in slide-in-from-right-8 duration-500">
             <div className="space-y-4 text-center">
                <span className="text-emerald-600 font-black uppercase tracking-widest text-[9px] bg-emerald-50 px-3 py-1 rounded-full border border-emerald-100">Questão {currentExamStep + 1} de {exam.length}</span>
                <h3 className="text-xl font-black text-slate-900 leading-tight tracking-tight">{exam[currentExamStep].question}</h3>
             </div>
             <div className="space-y-3">
               {exam[currentExamStep].options.map((opt, idx) => (
                 <button key={idx} onClick={() => handleExamAnswer(idx)} disabled={isShowingFeedback} className={`w-full p-5 text-left border-2 rounded-[1.5rem] transition-all font-bold flex items-center gap-4 ${isShowingFeedback ? (idx === exam[currentExamStep].correctAnswer ? 'bg-emerald-50 border-emerald-500 text-emerald-900' : (idx === selectedAnswer ? 'bg-red-50 border-red-500 text-red-900' : 'bg-white opacity-40 border-slate-50')) : 'bg-white border-slate-100 hover:border-emerald-500 hover:bg-emerald-50'}`}>
                   <span className="w-10 h-10 rounded-xl bg-slate-50 flex items-center justify-center font-black">{String.fromCharCode(65 + idx)}</span>
                   <span className="text-sm">{opt}</span>
                 </button>
               ))}
             </div>
             {isShowingFeedback && (
               <div className="space-y-4 animate-in fade-in slide-in-from-top-4 duration-500">
                  <div className="bg-slate-900 p-6 rounded-3xl text-white text-sm leading-relaxed shadow-xl">
                    <span className="block text-[10px] font-black text-emerald-400 uppercase tracking-widest mb-2">Explicação:</span>
                    {exam[currentExamStep].explanation}
                  </div>
                  <button onClick={nextQuestion} className="w-full py-5 bg-emerald-600 text-white font-black rounded-2xl flex items-center justify-center gap-3 hover:bg-emerald-700 transition-all shadow-xl">
                    {currentExamStep < exam.length - 1 ? 'Próxima Questão' : 'Ver Resultados'} <ArrowRight size={20} />
                  </button>
               </div>
             )}
          </div>
        </div>
      ) : (
        /* Modo Chat com Efeito de Digitação */
        <>
          <div ref={scrollRef} className="flex-1 overflow-y-auto p-6 space-y-8 bg-[radial-gradient(#f1f5f9_1px,transparent_1px)] [background-size:20px_20px]">
            {messages.length === 0 && (
              <div className="h-full flex flex-col items-center justify-center text-center p-6 space-y-6">
                <div className="relative w-20 h-20 bg-white text-emerald-600 rounded-[1.5rem] flex items-center justify-center shadow-2xl border border-emerald-50">
                   <GraduationCap size={40} />
                </div>
                <h3 className="text-2xl font-black text-slate-900 tracking-tighter">I<span className="text-emerald-500">.</span>AM Online</h3>
                <p className="text-slate-500 font-medium text-base max-w-sm">Olá! Sou o I.AM, seu mentor pessoal. Podemos focar nos estudos, debater ideias ou até bater um papo para descontrair. O que manda hoje?</p>
              </div>
            )}
            {messages.map(m => (
              <div key={m.id} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'} animate-in fade-in duration-300`}>
                <div className={`max-w-[85%] p-5 rounded-[1.5rem] shadow-lg relative ${m.role === 'user' ? 'bg-gradient-to-br from-emerald-600 to-emerald-700 text-white rounded-tr-none' : 'bg-white text-slate-800 border border-slate-100 rounded-tl-none ring-1 ring-slate-200/50'}`}>
                   {m.text === '' && m.role === 'model' ? (
                     <div className="flex gap-1.5 py-1">
                        <div className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-bounce"></div>
                        <div className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-bounce [animation-delay:0.2s]"></div>
                        <div className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-bounce [animation-delay:0.4s]"></div>
                     </div>
                   ) : (
                     <MarkdownRenderer content={m.text} />
                   )}
                   <div className={`mt-3 flex items-center gap-2 opacity-30 ${m.role === 'user' ? 'text-white' : 'text-slate-400'}`}>
                      <span className="text-[9px] font-black uppercase tracking-widest">{m.role === 'user' ? 'Você' : 'I.AM Mentor'}</span>
                   </div>
                </div>
              </div>
            ))}
          </div>
          <form onSubmit={handleSend} className="p-6 bg-white border-t border-slate-100 flex gap-3 items-center relative z-20">
             <div className="flex-1 relative group">
                <input value={input} onChange={e => setInput(e.target.value)} placeholder="Mande sua dúvida aqui..." className="w-full bg-slate-50 border-2 border-transparent focus:border-emerald-500 focus:bg-white px-6 py-4 rounded-xl outline-none transition-all font-bold text-slate-800 text-sm shadow-inner" disabled={isLoading} />
             </div>
             <button type="submit" disabled={!input.trim() || isLoading} className="bg-slate-900 text-white p-4 rounded-xl shadow-xl hover:bg-black disabled:bg-slate-200 transition-all active:scale-95">
                <Send size={20} />
             </button>
          </form>
        </>
      )}
    </div>
  );
};

export default StudentChat;
