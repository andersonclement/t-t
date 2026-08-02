import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { MessageCircle, X, Send, User, Bot, Sparkles } from 'lucide-react';
import { chatWithMedicalCoach } from '../services/aiService';
import { useAuth } from './AuthContext';
import { useOrders } from './OrderContext';
import ReactMarkdown from 'react-markdown';
import { cn } from '../lib/utils';

export function AIAssistant() {
  const { profile } = useAuth();
  const { orders } = useOrders();
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<{ role: 'user' | 'assistant'; text: string }[]>([
    { role: 'assistant', text: 'Bonjour ! Je suis Care IA. Comment puis-je vous aider aujourd\'hui ?' }
  ]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);

  const handleSend = async () => {
    if (!input.trim() || isTyping) return;

    const userMessage = input;
    setInput('');
    setIsTyping(true);

    const history = messages.map(m => ({ role: m.role, content: m.text }));

    // Append the user turn plus an empty assistant turn that the stream fills in.
    setMessages(prev => [...prev, { role: 'user', text: userMessage }, { role: 'assistant', text: '' }]);

    await chatWithMedicalCoach(userMessage, history, {
      patientProfile: profile,
      patientOrders: orders,
      onDelta: (chunk) => {
        setMessages(prev => {
          const next = [...prev];
          next[next.length - 1] = {
            ...next[next.length - 1],
            text: next[next.length - 1].text + chunk,
          };
          return next;
        });
      },
    });

    setIsTyping(false);
  };

  return (
    <>
      <motion.button
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.9 }}
        onClick={() => setIsOpen(true)}
        className="fixed bottom-24 left-6 z-40 bg-clinical-600 text-white p-4 rounded-full shadow-xl flex items-center gap-2 group transition-all"
      >
        <Sparkles size={24} />
      </motion.button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 100, scale: 0.8 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 100, scale: 0.8 }}
            className="fixed inset-0 z-50 flex flex-col bg-white md:inset-auto md:bottom-24 md:left-6 md:w-96 md:h-[600px] md:rounded-2xl md:shadow-2xl overflow-hidden border border-slate-200"
          >
            <div className="bg-clinical-600 p-4 text-white flex justify-between items-center">
              <div className="flex items-center gap-2">
                <Bot className="w-6 h-6" />
                <div>
                  <h3 className="font-display font-bold">Care IA</h3>
                  <p className="text-xs text-blue-100 italic">Conseils et orientation</p>
                </div>
              </div>
              <button onClick={() => setIsOpen(false)} className="hover:bg-white/20 p-1 rounded">
                <X size={24} />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-4 medical-gradient">
              {messages.map((msg, i) => (
                // The placeholder assistant turn stays hidden until its first token.
                msg.text === '' ? null : (
                <div key={i} className={cn("flex", msg.role === 'user' ? "justify-end" : "justify-start")}>
                  <div className={cn(
                    "max-w-[85%] p-3 rounded-2xl shadow-sm border",
                    msg.role === 'user' 
                      ? "bg-clinical-600 text-white border-clinical-700 rounded-tr-none" 
                      : "bg-white text-slate-800 border-slate-100 rounded-tl-none"
                  )}>
                    <div className="markdown-body text-sm prose prose-slate max-w-none">
                      <ReactMarkdown>{msg.text}</ReactMarkdown>
                    </div>
                  </div>
                </div>
                )
              ))}
              {isTyping && messages[messages.length - 1]?.text === '' && (
                <div className="flex justify-start">
                  <div className="bg-white p-3 rounded-2xl border border-slate-100 rounded-tl-none flex gap-1">
                    <span className="w-1.5 h-1.5 bg-slate-300 rounded-full animate-bounce" />
                    <span className="w-1.5 h-1.5 bg-slate-300 rounded-full animate-bounce [animation-delay:0.2s]" />
                    <span className="w-1.5 h-1.5 bg-slate-300 rounded-full animate-bounce [animation-delay:0.4s]" />
                  </div>
                </div>
              )}
            </div>

            <div className="p-4 border-t border-slate-100 bg-slate-50">
              <div className="flex gap-2">
                <input
                  type="text"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                  placeholder="Décrivez vos symptômes..."
                  className="flex-1 bg-white border border-slate-200 rounded-full px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-clinical-600"
                />
                <button
                  onClick={handleSend}
                  disabled={isTyping}
                  className="bg-clinical-600 text-white p-2 rounded-full hover:bg-clinical-700 disabled:opacity-50 transition-colors"
                >
                  <Send size={20} />
                </button>
              </div>
              <p className="text-[10px] text-slate-400 mt-2 text-center">
              ⚠️ L'IA ne remplace pas un avis médical. Consultez un professionnel de santé.
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
