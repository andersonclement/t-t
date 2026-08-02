import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import ReactMarkdown from 'react-markdown';
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
  Bot,
  X,
  AlertTriangle
} from 'lucide-react';
import {
  chatWithMedicalCoach,
  checkDrugInteractions,
  type InteractionReport,
} from '../services/aiService';
import { useAuth } from '../components/AuthContext';
import { useOrders } from '../components/OrderContext';
import { cn } from '../lib/utils';
import {
  Alert,
  Badge,
  type BadgeTone,
  Button,
  CardSection,
  Field,
  Input,
  Modal,
  PageContainer,
  PageHeader,
  SectionHeader,
  SplitLayout,
} from '../components/ui';

// Diagnostic Tool component
function DiagnosticAssistant({
  seedPrompt,
  onSeedConsumed,
}: {
  /** A question pushed in from the tools panel; sent as soon as it arrives. */
  seedPrompt?: string | null;
  onSeedConsumed?: () => void;
}) {
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

  const handleSend = async (prompt?: string) => {
    const content = (prompt ?? query).trim();
    if (!content || isLoading) return;

    const userMessage = { role: 'user' as const, content };
    setMessages(prev => [...prev, userMessage]);
    setQuery('');
    setIsLoading(true);

    try {
      const history = messages.map(m => ({ role: m.role, content: m.content }));

      // Empty assistant turn that the stream fills in token by token.
      setMessages(prev => [...prev, { role: 'assistant', content: '' }]);

      await chatWithMedicalCoach(userMessage.content, history, {
        patientProfile: profile,
        patientOrders: orders,
        onDelta: (chunk) => {
          setMessages(prev => {
            const next = [...prev];
            next[next.length - 1] = {
              ...next[next.length - 1],
              content: next[next.length - 1].content + chunk,
            };
            return next;
          });
        },
      });
    } catch (error) {
      console.error(error);
      setMessages(prev => [...prev, { role: 'assistant', content: "Une erreur est survenue lors de la connexion à l'IA." }]);
    } finally {
      setIsLoading(false);
    }
  };

  // A tool button in the aside panel can hand the assistant a question to ask.
  useEffect(() => {
    if (!seedPrompt || isLoading) return;
    handleSend(seedPrompt);
    onSeedConsumed?.();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [seedPrompt]);

  return (
    <div className="bg-white rounded-[2rem] md:rounded-[2.5rem] border border-slate-100 shadow-sm overflow-hidden flex flex-col h-[500px] md:h-[600px]">
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
          // The placeholder assistant turn stays hidden until its first token.
          m.content === '' ? null : (
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
               <div className="prose prose-sm prose-slate max-w-none prose-p:my-1.5 prose-headings:my-2">
                 <ReactMarkdown>{m.content}</ReactMarkdown>
               </div>
            </div>
          </motion.div>
          )
        ))}
        {isLoading && messages[messages.length - 1]?.content === '' && (
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
              onClick={() => handleSend()}
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
  const [interactionsOpen, setInteractionsOpen] = React.useState(false);
  const [seedPrompt, setSeedPrompt] = React.useState<string | null>(null);

  return (
    <PageContainer>
      <PageHeader
        eyebrow="Care IA"
        title="IA Santé"
        subtitle="Votre partenaire intelligent pour une santé connectée."
        actions={
          <Badge tone="success" icon={<ShieldCheck size={14} />} className="px-3 md:px-4 py-1.5 md:py-2 rounded-xl">
            Données cryptées
          </Badge>
        }
      />

      <SplitLayout
        main={
          <DiagnosticAssistant
            seedPrompt={seedPrompt}
            onSeedConsumed={() => setSeedPrompt(null)}
          />
        }
        aside={
          <>
            <CardSection>
              <SectionHeader title="Outils intelligents" />
              <div className="space-y-3 md:space-y-4">
                <ToolButton
                  icon={<Zap size={18} className="text-orange-500" />}
                  title="Vérificateur d'Interactions"
                  description="Vérifiez si vos médicaments sont compatibles."
                  onClick={() => setInteractionsOpen(true)}
                />
                <ToolButton
                  icon={<Activity size={18} className="text-emerald-500" />}
                  title="Score de Santé AI"
                  description="Calculez votre indice de forme actuel."
                  onClick={() =>
                    setSeedPrompt(
                      "Évalue mon état de santé général à partir de mon profil et de mon historique de commandes. Donne-moi un indice de forme sur 100, les points positifs, les points à surveiller, et trois actions concrètes pour progresser."
                    )
                  }
                />
                <ToolButton
                  icon={<Search size={18} className="text-blue-500" />}
                  title="Dictionnaire Médical AI"
                  description="Définitions claires et vulgarisées."
                  onClick={() =>
                    setSeedPrompt(
                      "Je vais te donner un terme médical et tu me l'expliqueras simplement, sans jargon, avec un exemple concret. Demande-moi quel terme je souhaite comprendre."
                    )
                  }
                />
              </div>
            </CardSection>

            <div className="bg-slate-900 text-white p-6 md:p-8 rounded-[2rem] md:rounded-[2.5rem] shadow-xl space-y-4 md:space-y-6">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 md:w-10 md:h-10 bg-white/10 rounded-lg md:rounded-xl flex items-center justify-center">
                  <ShieldCheck size={18} className="text-brand-500" />
                </div>
                <h3 className="font-display font-bold text-base md:text-lg">Confidentialité AI</h3>
              </div>
              <p className="text-xs md:text-sm text-slate-400 leading-relaxed">
                Toutes vos conversations avec Care IA sont anonymisées et sécurisées au Cameroun.
              </p>
              <button className="w-full bg-white/10 hover:bg-white/20 text-white font-bold py-3 md:py-4 rounded-xl md:rounded-2xl transition-all text-[10px] md:text-xs uppercase tracking-widest">
                Règles de sécurité
              </button>
            </div>
          </>
        }
      />

      <InteractionChecker open={interactionsOpen} onClose={() => setInteractionsOpen(false)} />
    </PageContainer>
  );
}

const severityTone: Record<string, BadgeTone> = {
  faible: 'info',
  moderee: 'warning',
  majeure: 'danger',
};

const severityLabel: Record<string, string> = {
  faible: 'Faible',
  moderee: 'Modérée',
  majeure: 'Majeure',
};

const globalRisk: Record<string, { tone: BadgeTone; label: string }> = {
  aucun: { tone: 'success', label: 'Aucun risque détecté' },
  faible: { tone: 'info', label: 'Risque faible' },
  modere: { tone: 'warning', label: 'Risque modéré' },
  eleve: { tone: 'danger', label: 'Risque élevé' },
};

/**
 * Collects a list of medications and asks Care IA to report documented
 * interactions between them, graded by severity.
 */
function InteractionChecker({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { profile } = useAuth();
  const [drugs, setDrugs] = React.useState<string[]>([]);
  const [draft, setDraft] = React.useState('');
  const [report, setReport] = React.useState<InteractionReport | null>(null);
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const addDrug = () => {
    const name = draft.trim();
    if (!name || drugs.includes(name) || drugs.length >= 10) return;
    setDrugs(prev => [...prev, name]);
    setDraft('');
    setReport(null);
  };

  const run = async () => {
    setLoading(true);
    setError(null);
    setReport(null);
    try {
      setReport(await checkDrugInteractions(drugs, profile));
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erreur lors de l'analyse.");
    } finally {
      setLoading(false);
    }
  };

  const reset = () => {
    setDrugs([]);
    setDraft('');
    setReport(null);
    setError(null);
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      size="lg"
      icon={<Zap size={18} />}
      title="Vérificateur d'interactions"
      description="Ajoutez au moins deux médicaments pour analyser leur compatibilité."
      footer={
        <>
          <Button variant="ghost" onClick={reset} disabled={loading || drugs.length === 0}>
            Réinitialiser
          </Button>
          <Button onClick={run} loading={loading} disabled={drugs.length < 2}>
            Analyser {drugs.length >= 2 ? `(${drugs.length})` : ''}
          </Button>
        </>
      }
    >
      <div className="space-y-4">
        <Field label="Médicament" hint="Nom commercial ou molécule — appuyez sur Entrée pour ajouter.">
          <div className="flex gap-2">
            <Input
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  addDrug();
                }
              }}
              placeholder="Ex : Paracétamol, Amoxicilline…"
            />
            <Button variant="secondary" onClick={addDrug} disabled={!draft.trim()}>
              Ajouter
            </Button>
          </div>
        </Field>

        {drugs.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {drugs.map((drug) => (
              <span
                key={drug}
                className="inline-flex items-center gap-2 pl-3 pr-2 py-1.5 rounded-xl bg-slate-100 text-slate-700 text-xs font-bold"
              >
                {drug}
                <button
                  onClick={() => {
                    setDrugs(prev => prev.filter(d => d !== drug));
                    setReport(null);
                  }}
                  aria-label={`Retirer ${drug}`}
                  className="text-slate-400 hover:text-red-600 transition-colors"
                >
                  <X size={14} />
                </button>
              </span>
            ))}
          </div>
        )}

        {error && <Alert tone="danger" icon={<AlertTriangle size={16} />}>{error}</Alert>}

        {report && (
          <div className="space-y-3 pt-2">
            <div className="flex items-center justify-between gap-3">
              <Badge tone={globalRisk[report.risqueGlobal]?.tone ?? 'neutral'}>
                {globalRisk[report.risqueGlobal]?.label ?? report.risqueGlobal}
              </Badge>
              <span className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">
                {report.interactions.length} interaction(s)
              </span>
            </div>

            <p className="text-xs md:text-sm text-slate-600 font-medium leading-relaxed">{report.resume}</p>

            {report.interactions.map((interaction, i) => (
              <div key={i} className="p-4 rounded-2xl border border-slate-100 bg-slate-50 space-y-2">
                <div className="flex items-start justify-between gap-3">
                  <p className="font-bold text-slate-900 text-xs md:text-sm">
                    {interaction.medicaments.join(' + ')}
                  </p>
                  <Badge tone={severityTone[interaction.severite] ?? 'neutral'}>
                    {severityLabel[interaction.severite] ?? interaction.severite}
                  </Badge>
                </div>
                <p className="text-[11px] md:text-xs text-slate-600 leading-relaxed">{interaction.description}</p>
                <p className="text-[11px] md:text-xs text-slate-900 font-medium leading-relaxed">
                  <span className="font-bold">Conduite à tenir : </span>
                  {interaction.conduite}
                </p>
              </div>
            ))}

            <Alert tone="warning" icon={<AlertTriangle size={16} />}>
              Cette analyse ne remplace pas l'avis d'un pharmacien ou d'un médecin. Vérifiez toujours
              auprès d'un professionnel avant de modifier un traitement.
            </Alert>
          </div>
        )}
      </div>
    </Modal>
  );
}

function ToolButton({ icon, title, description, onClick }: { icon: React.ReactNode, title: string, description: string, onClick?: () => void }) {
  return (
    <button onClick={onClick} className="w-full flex items-start gap-4 p-4 rounded-2xl border border-slate-50 hover:bg-slate-50 hover:border-slate-100 transition-all text-left group">
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
