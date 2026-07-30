import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Zap, 
  MessageSquare, 
  Search, 
  Sparkles, 
  ArrowRight, 
  Activity, 
  ShieldCheck, 
  Brain,
  Mic,
  Send,
  User,
  Bot
} from 'lucide-react';
import { chatWithMedicalCoach } from '../services/geminiService';
import { useAuth } from '../components/AuthContext';
import { useOrders } from '../components/OrderContext';
import { cn } from '../lib/utils';

// Diagnostic Tool component
function DiagnosticAssistant() {
  const { profile } = useAuth();
  const { orders } = useOrders();
  const [query, setQuery] = useState('');
  const [messages, setMessages] = useState<{ role: 'user' | 'assistant'; content: string }[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSend = async () => {
    if (!query.trim() || isLoading) return;

    const userMessage = { role: 'user' as const, content: query };
    setMessages(prev => [...prev, userMessage]);
    setQuery('');
    setIsLoading(true);

    try {
      const history = messages.map(m => ({ 
        role: m.role === 'assistant' ? 'model' as const : 'user' as const, 
        parts: [{ text: m.content }] 
      }));

      const response = await chatWithMedicalCoach(userMessage.content, history, profile, orders);
      setMessages(prev => [...prev, { role: 'assistant', content: response || "Désolé, je n'ai pas pu générer de réponse." }]);
    } catch (error) {
      console.error(error);
      setMessages(prev => [...prev, { role: 'assistant', content: "Une erreur est survenue lors de la connexion à l'IA." }]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="bg-white rounded-[1.5rem] md:rounded-[2.5rem] border border-slate-100 shadow-xl overflow-hidden flex flex-col h-[500px] md:h-[600px]">
      <div className="p-4 md:p-6 border-b bg-slate-900 text-white flex items-center justify-between">
         <div className="flex items-center gap-3">
            <div className="w-8 h-8 md:w-10 md:h-10 bg-brand-600 rounded-lg md:rounded-xl flex items-center justify-center">
               <Brain size={18} className="md:w-5 md:h-5" />
            </div>
            <div>
               <h3 className="font-display font-bold text-sm md:text-base">Care IA</h3>
               <p className="text-[9px] md:text-[10px] text-emerald-400 font-bold uppercase tracking-widest">En ligne & Sécurisé</p>
            </div>
         </div>
      </div>

      <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 md:p-6 space-y-4 bg-slate-50/30">
        {messages.length === 0 && (
          <div className="h-full flex flex-col items-center justify-center text-center space-y-4 opacity-50 px-4">
             <Bot size={40} className="text-slate-300 md:w-12 md:h-12" />
             <p className="text-xs md:text-sm font-medium max-w-xs">Posez vos questions sur vos symptômes ou vos médicaments. Je suis là pour vous informer.</p>
          </div>
        )}
        {messages.map((m, i) => (
          <motion.div 
            key={i}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className={cn(
              "flex gap-2 md:gap-3 max-w-[90%] md:max-w-[85%]",
              m.role === 'user' ? "ml-auto flex-row-reverse" : "mr-auto"
            )}
          >
            <div className={cn(
              "w-7 h-7 md:w-8 md:h-8 rounded-lg flex items-center justify-center shrink-0 shadow-sm",
              m.role === 'user' ? "bg-slate-900 text-white" : "bg-brand-600 text-white"
            )}>
              {m.role === 'user' ? <User size={14} className="md:w-4 md:h-4" /> : <Bot size={14} className="md:w-4 md:h-4" />}
            </div>
            <div className={cn(
               "p-3 md:p-4 rounded-xl md:rounded-2xl text-[13px] md:text-sm leading-relaxed",
               m.role === 'user' ? "bg-slate-900 text-white rounded-tr-none" : "bg-white border border-slate-100 shadow-sm rounded-tl-none text-slate-700"
            )}>
               {m.content}
            </div>
          </motion.div>
        ))}
        {isLoading && (
          <div className="flex gap-3 mr-auto">
             <div className="w-8 h-8 rounded-lg bg-brand-600 text-white flex items-center justify-center animate-pulse">
                <Bot size={16} />
             </div>
             <div className="p-4 rounded-2xl bg-white border border-slate-100 shadow-sm flex gap-1">
                <span className="w-1.5 h-1.5 bg-slate-300 rounded-full animate-bounce [animation-delay:-0.3s]" />
                <span className="w-1.5 h-1.5 bg-slate-300 rounded-full animate-bounce [animation-delay:-0.15s]" />
                <span className="w-1.5 h-1.5 bg-slate-300 rounded-full animate-bounce" />
             </div>
          </div>
        )}
      </div>

      <div className="p-4 border-t bg-white">
         <div className="relative flex items-center gap-2">
            <input 
              type="text" 
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSend()}
              placeholder="Décrivez vos symptômes..."
              className="w-full bg-slate-50 border border-slate-200 rounded-2xl py-4 pl-4 pr-12 outline-none focus:ring-4 focus:ring-brand-600/10 transition-all text-sm"
            />
            <button 
              onClick={handleSend}
              disabled={isLoading || !query.trim()}
              className="absolute right-3 w-10 h-10 bg-slate-900 text-white rounded-xl flex items-center justify-center disabled:opacity-50 hover:bg-brand-600 transition-colors"
            >
              <Send size={18} />
            </button>
         </div>
      </div>
    </div>
  );
}

export function AISante() {
  return (
    <div className="space-y-6 md:space-y-8">
      <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-display font-bold text-slate-900 tracking-tight">IA Santé</h1>
          <p className="text-slate-500 text-sm md:text-base font-medium">Votre partenaire intelligent pour une santé connectée.</p>
        </div>
        <div className="flex items-center gap-2 bg-emerald-50 text-emerald-700 px-3 md:px-4 py-1.5 md:py-2 rounded-xl text-[10px] md:text-xs font-bold uppercase tracking-widest border border-emerald-100">
           <ShieldCheck size={14} className="md:w-4 md:h-4" />
           Données Cryptées
        </div>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 md:gap-8">
        <div className="lg:col-span-2 space-y-6 md:space-y-8">
           <DiagnosticAssistant />
        </div>

        <div className="space-y-4 md:space-y-6">
           <div className="bg-white p-6 md:p-8 rounded-[1.5rem] md:rounded-[2.5rem] border border-slate-100 shadow-sm space-y-4 md:space-y-6">
              <h3 className="text-lg md:text-xl font-display font-bold text-slate-900 tracking-tight">Outils Intelligents</h3>
              <div className="space-y-3 md:space-y-4">
                 <ToolButton icon={<Zap size={18} className="text-orange-500" />} title="Vérificateur d'Interactions" description="Vérifiez si vos médicaments sont compatibles." />
                 <ToolButton icon={<Activity size={18} className="text-emerald-500" />} title="Score de Santé AI" description="Calculez votre indice de forme actuel." />
                 <ToolButton icon={<Search size={18} className="text-blue-500" />} title="Dictionnaire Médical AI" description="Définitions claires et vulgarisées." />
              </div>
           </div>

           <div className="bg-slate-900 text-white p-6 md:p-8 rounded-[1.5rem] md:rounded-[2.5rem] shadow-xl space-y-4 md:space-y-6">
              <div className="flex items-center gap-3">
                 <div className="w-8 h-8 md:w-10 md:h-10 bg-white/10 rounded-lg md:rounded-xl flex items-center justify-center"><ShieldCheck size={18} className="text-brand-500" /></div>
                 <h3 className="font-display font-bold text-base md:text-lg">Confidentialité AI</h3>
              </div>
              <p className="text-xs md:text-sm text-slate-400 leading-relaxed">
                 Toutes vos conversations avec Care IA sont anonymisées et sécurisées au Cameroun.
              </p>
              <button className="w-full bg-white/10 hover:bg-white/20 text-white font-bold py-3 md:py-4 rounded-xl md:rounded-2xl transition-all text-[10px] md:text-xs uppercase tracking-widest">
                 Règles de sécurité
              </button>
           </div>
        </div>
      </div>
    </div>
  );
}

function ToolButton({ icon, title, description }: { icon: React.ReactNode, title: string, description: string }) {
  return (
    <button className="w-full flex items-start gap-4 p-4 rounded-2xl border border-slate-50 hover:bg-slate-50 hover:border-slate-100 transition-all text-left group">
       <div className="w-12 h-12 bg-white rounded-xl shadow-sm border border-slate-100 flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform">
          {icon}
       </div>
       <div>
          <h4 className="font-bold text-slate-900 text-sm">{title}</h4>
          <p className="text-xs text-slate-400 mt-1">{description}</p>
       </div>
    </button>
  );
}
