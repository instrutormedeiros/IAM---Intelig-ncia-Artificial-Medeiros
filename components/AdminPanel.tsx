
import React, { useState } from 'react';
import { StudyContext } from '../types';
import { ADMIN_PASSWORD_MOCK } from '../constants';
import { Upload, Trash2, FileText, CheckCircle, AlertCircle, Eye, EyeOff, Loader2, KeyRound, AlertTriangle } from 'lucide-react';

interface AdminPanelProps {
  context: StudyContext | null;
  onUpdate: (context: StudyContext) => void;
  onClear: () => void;
  isLoggedIn: boolean;
  onLoginSuccess: () => void;
}

const AdminPanel: React.FC<AdminPanelProps> = ({ context, onUpdate, onClear, isLoggedIn, onLoginSuccess }) => {
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [manualText, setManualText] = useState('');

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (password === ADMIN_PASSWORD_MOCK) {
      onLoginSuccess();
      setError('');
    } else {
      setError('Senha incorreta. Acesso negado.');
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsProcessing(true);
    
    try {
      if (file.type === 'application/pdf') {
        const reader = new FileReader();
        reader.onload = async () => {
          try {
            const typedArray = new Uint8Array(reader.result as ArrayBuffer);
            // @ts-ignore
            const pdf = await window.pdfjsLib.getDocument(typedArray).promise;
            let fullText = '';
            for (let i = 1; i <= pdf.numPages; i++) {
              const page = await pdf.getPage(i);
              const textContent = await page.getTextContent();
              // @ts-ignore
              fullText += textContent.items.map((item: any) => item.str).join(' ') + '\n';
            }
            
            if (fullText.trim().length === 0) {
              throw new Error("O PDF parece estar vazio ou é uma imagem (OCR não suportado).");
            }

            onUpdate({
              content: fullText,
              fileName: file.name,
              updatedAt: new Date()
            });
          } catch (err: any) {
            alert("Erro ao ler PDF: " + err.message);
          } finally {
            setIsProcessing(false);
          }
        };
        reader.readAsArrayBuffer(file);
      } else if (file.type === 'text/plain') {
        const reader = new FileReader();
        reader.onload = (re) => {
          onUpdate({
            content: re.target?.result as string,
            fileName: file.name,
            updatedAt: new Date()
          });
          setIsProcessing(false);
        };
        reader.readAsText(file);
      } else {
        alert("Por favor, envie um arquivo PDF ou TXT.");
        setIsProcessing(false);
      }
    } catch (err) {
      console.error("Erro no processamento:", err);
      setIsProcessing(false);
    }
  };

  const handleManualSave = () => {
    if (!manualText.trim()) return;
    onUpdate({
      content: manualText,
      fileName: 'Conteúdo Inserido Manualmente',
      updatedAt: new Date()
    });
    setManualText('');
  };

  if (!isLoggedIn) {
    return (
      <div className="max-w-md mx-auto bg-white p-10 rounded-[2.5rem] shadow-2xl shadow-slate-200 border border-slate-100 mt-12 animate-in zoom-in-95 duration-500">
        <div className="w-16 h-16 bg-indigo-600 rounded-2xl flex items-center justify-center text-white mx-auto mb-6 shadow-lg shadow-indigo-200">
          <KeyRound size={32} />
        </div>
        <h2 className="text-2xl font-black text-slate-800 mb-2 text-center">Área do Administrador</h2>
        <p className="text-center text-slate-500 mb-8 text-sm font-medium">Insira suas credenciais para gerenciar o conhecimento do IAM.</p>
        
        <form onSubmit={handleLogin} className="space-y-6">
          <div className="space-y-2">
            <label className="text-xs font-bold text-slate-400 uppercase tracking-widest ml-1">Senha de Acesso</label>
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full px-5 py-4 bg-slate-50 border-2 border-slate-100 rounded-2xl focus:ring-0 focus:border-indigo-500 focus:bg-white outline-none transition-all font-mono"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-4 top-4.5 text-slate-400 hover:text-indigo-600 transition-colors"
              >
                {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
              </button>
            </div>
          </div>
          {error && (
            <div className="flex items-center gap-2 text-red-500 text-xs font-bold bg-red-50 p-3 rounded-xl border border-red-100">
              <AlertCircle size={14} /> {error}
            </div>
          )}
          <button
            type="submit"
            className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-black py-4 rounded-2xl transition-all shadow-xl shadow-indigo-100 active:scale-95"
          >
            Acessar Painel
          </button>
        </form>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-6 duration-700">
      <div className="bg-gradient-to-br from-indigo-600 to-indigo-800 p-8 rounded-3xl shadow-xl shadow-indigo-100 flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div className="text-white">
          <h2 className="text-2xl font-black mb-2">Curadoria de Conhecimento</h2>
          <p className="text-indigo-100 text-sm font-medium opacity-90 max-w-md">Gerencie os documentos que servirão como única fonte de verdade para o professor IAM.</p>
        </div>
        {context && (
          <button
            onClick={onClear}
            className="flex items-center gap-2 px-6 py-3 bg-white/10 hover:bg-white/20 text-white border border-white/20 rounded-2xl transition-all text-sm font-bold backdrop-blur-sm"
          >
            <Trash2 size={18} />
            Limpar Todo Conteúdo
          </button>
        )}
      </div>

      <div className="grid md:grid-cols-2 gap-8">
        <div className="bg-white p-8 rounded-3xl border border-slate-200 shadow-sm flex flex-col group hover:shadow-md transition-all">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
              <Upload size={22} />
            </div>
            <h3 className="text-lg font-black text-slate-800">Upload de Arquivo</h3>
          </div>
          <div className="flex-1 flex flex-col items-center justify-center border-2 border-dashed border-slate-200 rounded-2xl p-10 hover:border-indigo-400 hover:bg-indigo-50/30 transition-all cursor-pointer relative overflow-hidden">
            <input
              type="file"
              onChange={handleFileUpload}
              accept=".pdf,.txt"
              className="absolute inset-0 opacity-0 cursor-pointer z-10"
              disabled={isProcessing}
            />
            {isProcessing ? (
              <div className="text-center z-20">
                <Loader2 size={48} className="text-indigo-600 animate-spin mx-auto mb-4" />
                <p className="text-slate-800 font-bold">Processando Documento...</p>
                <p className="text-slate-500 text-xs mt-1">Extraindo inteligência do PDF</p>
              </div>
            ) : (
              <div className="text-center z-20 transition-transform duration-300 group-hover:scale-110">
                <div className="relative inline-block mb-4">
                  <FileText size={64} className="text-slate-200 group-hover:text-indigo-200 transition-colors" />
                  <div className="absolute -bottom-1 -right-1 bg-white p-1 rounded-lg border border-slate-100 shadow-sm">
                    <Upload size={16} className="text-indigo-500" />
                  </div>
                </div>
                <p className="text-slate-800 font-bold">Arraste ou clique aqui</p>
                <p className="text-slate-400 text-xs mt-1 font-medium">Suporta PDF (Texto) e TXT</p>
              </div>
            )}
          </div>
        </div>

        <div className="bg-white p-8 rounded-3xl border border-slate-200 shadow-sm flex flex-col group hover:shadow-md transition-all">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <FileText size={22} />
            </div>
            <h3 className="text-lg font-black text-slate-800">Texto Estruturado</h3>
          </div>
          <textarea
            value={manualText}
            onChange={(e) => setManualText(e.target.value)}
            placeholder="Cole o roteiro, leis ou definições específicas aqui..."
            className="flex-1 w-full bg-slate-50 border-2 border-slate-100 rounded-2xl p-5 text-slate-700 font-medium outline-none focus:bg-white focus:border-emerald-500 transition-all resize-none mb-6 min-h-[180px]"
          />
          <button
            onClick={handleManualSave}
            disabled={!manualText.trim()}
            className="w-full bg-emerald-600 hover:bg-emerald-700 disabled:bg-slate-200 disabled:text-slate-400 text-white font-black py-4 rounded-2xl transition-all shadow-lg shadow-emerald-100 active:scale-95"
          >
            Alimentar Professor IAM
          </button>
        </div>
      </div>

      <div className="bg-white p-8 rounded-3xl border border-slate-200 shadow-sm">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between mb-8 gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <CheckCircle size={22} />
            </div>
            <div>
              <h3 className="text-lg font-black text-slate-800">Contexto de Estudo Atual</h3>
              {context && <p className="text-xs font-bold text-emerald-600 uppercase tracking-widest">{context.fileName}</p>}
            </div>
          </div>
          {context && (
            <div className="px-4 py-2 bg-slate-50 border border-slate-100 rounded-xl">
               <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-0.5">Sincronizado em</span>
               <span className="text-xs font-bold text-slate-700">{context.updatedAt.toLocaleString('pt-BR')}</span>
            </div>
          )}
        </div>
        
        {context ? (
          <div className="relative group">
            <div className="absolute inset-0 bg-gradient-to-b from-transparent to-white/50 pointer-events-none rounded-2xl"></div>
            <div className="bg-slate-50 p-6 rounded-2xl border border-slate-100 max-h-80 overflow-y-auto custom-scrollbar">
              <p className="text-sm text-slate-600 leading-relaxed font-medium whitespace-pre-wrap">{context.content}</p>
            </div>
            <div className="mt-4 flex justify-end">
               <p className="text-[10px] font-bold text-slate-300 uppercase tracking-[0.2em]">Total de caracteres: {context.content.length.toLocaleString()}</p>
            </div>
          </div>
        ) : (
          <div className="bg-slate-50 border-2 border-dashed border-slate-200 p-12 rounded-2xl flex flex-col items-center text-center">
            <AlertTriangle size={48} className="text-amber-400 mb-4" />
            <p className="text-slate-800 font-bold text-lg">Sem Conhecimento Definido</p>
            <p className="text-slate-500 text-sm max-w-xs mt-1 font-medium">O IAM está em silêncio até que você forneça o material didático para ele processar.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminPanel;
