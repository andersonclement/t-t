import React from 'react';
import { motion } from 'motion/react';
import { 
  Activity, 
  Clock, 
  MapPin, 
  Search, 
  TrendingUp, 
  Calendar,
  ChevronRight,
  ShieldCheck,
  Stethoscope,
  PhoneCall
} from 'lucide-react';
import { useAuth } from '../components/AuthContext';
import { AIAssistant } from '../components/AIAssistant';
import { cn } from '../lib/utils';

export function Dashboard() {
  const { profile } = useAuth();

  const stats = [
    { label: "Pression", value: "12/8", icon: <Activity className="text-red-500" />, delta: "Normal" },
    { label: "Sommeil", value: "7h 20m", icon: <Clock className="text-blue-500" />, delta: "+10%" },
    { label: "Activité", value: "5420 pas", icon: <TrendingUp className="text-brand-600" />, delta: "60%" },
  ];

  const quickActions = [
    { label: "Pharmacie de garde", sub: "Trouver la plus proche", icon: <MapPin className="text-brand-600" />, color: "bg-emerald-50", to: "/map" },
    { label: "Rendez-vous", sub: "Hôpital ou Laboratoire", icon: <Calendar className="text-clinical-600" />, color: "bg-blue-50", to: "/map" },
    { label: "Télé-conseil", sub: "Parler à un pharmacien", icon: <Stethoscope className="text-purple-600" />, color: "bg-purple-50", to: "/pharmacy" },
  ];

  return (
    <div className="space-y-6 md:space-y-8">
      {/* Header */}
      <header className="flex flex-col gap-4 md:gap-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl md:text-3xl font-display font-bold text-slate-900 tracking-tight">
              Bonjour, <span className="text-brand-600">{profile?.displayName?.split(' ')[0] || 'Invité'}</span> 👋
            </h1>
            <p className="text-sm md:text-base text-slate-500 font-medium">Votre écosystème de santé numérique est prêt.</p>
          </div>
          
          <div className="flex items-center gap-2 md:gap-3">
            <button 
              onClick={() => window.location.href = 'tel:124'}
              className="bg-red-600 hover:bg-red-700 text-white px-4 md:px-6 py-2.5 md:py-3 rounded-xl md:rounded-2xl font-bold flex items-center gap-2 md:gap-3 shadow-lg shadow-red-200 transition-all active:scale-95 text-xs md:text-sm"
            >
              <PhoneCall size={18} className="md:w-5 md:h-5" />
              <span className="hidden sm:inline">Urgence</span> 124
            </button>
            <div className="relative group max-w-[140px] sm:max-w-xs transition-all w-full">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-brand-600 transition-colors" size={16} />
              <input 
                type="text" 
                placeholder="Chercher..." 
                className="w-full bg-white border border-slate-200 rounded-xl md:rounded-2xl py-2 md:py-3 pl-9 pr-3 text-sm focus:outline-none focus:ring-2 focus:ring-brand-600/20 focus:border-brand-600 shadow-sm transition-all"
              />
            </div>
          </div>
        </div>
      </header>

      {/* Hero Card */}
      <div className="grid grid-cols-1 gap-6">
        <motion.div 
          whileHover={{ y: -5 }}
          className="glass-card rounded-[2rem] md:rounded-[3rem] p-6 md:p-12 relative overflow-hidden shadow-2xl shadow-slate-200/50"
        >
          <div className="relative z-10 max-w-2xl text-center md:text-left">
            <div className="inline-flex items-center gap-2 bg-brand-600/10 text-brand-700 px-3 md:px-4 py-1.5 md:py-2 rounded-full text-[10px] md:text-xs font-bold uppercase tracking-wider mb-4 md:mb-6">
              <ShieldCheck size={14} className="md:w-4 md:h-4" />
              Santé connectée & Sécurisée
            </div>
            <h2 className="text-3xl md:text-5xl font-display font-bold text-slate-900 leading-tight mb-4 md:mb-6">
              Prise en charge médicale <br className="hidden md:block" />
              <span className="text-brand-600">immédiate & augmentée.</span>
            </h2>
            <p className="text-slate-600 text-base md:text-lg mb-6 md:mb-10 leading-relaxed mx-auto md:mx-0">
              Commandez vos médicaments en un clic, analysez vos ordonnances par IA et localisez instantanément les services de santé à proximité au Cameroun.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 md:gap-4 justify-center md:justify-start">
              <button className="bg-slate-900 text-white px-6 md:px-10 py-3.5 md:py-4 rounded-xl md:rounded-2xl font-bold hover:shadow-xl transition-all hover:scale-105 active:scale-95 text-sm md:text-base">
                Explorer les services
              </button>
              <button className="bg-white border border-slate-200 text-slate-900 px-6 md:px-10 py-3.5 md:py-4 rounded-xl md:rounded-2xl font-bold hover:bg-slate-50 transition-all text-sm md:text-base">
                Dossier Médical
              </button>
            </div>
          </div>
          <div className="absolute right-0 top-0 bottom-0 w-1/2 bg-gradient-to-l from-brand-600/5 to-transparent hidden lg:block" />
        </motion.div>
      </div>

      {/* Stats Section */}
      <section className="grid grid-cols-2 lg:grid-cols-3 gap-3 md:gap-6">
        {stats.map((stat, i) => (
          <motion.div 
            key={i}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: i * 0.1 }}
            className={cn(
              "bg-white rounded-xl md:rounded-2xl p-4 md:p-6 border border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between shadow-sm gap-2",
              i === stats.length - 1 && "col-span-2 sm:col-span-1"
            )}
          >
            <div className="flex items-center gap-3 md:gap-4">
              <div className="p-2 md:p-3 rounded-lg md:rounded-xl bg-slate-50 shrink-0">{stat.icon}</div>
              <div>
                <p className="text-[10px] md:text-sm text-slate-500 font-medium">{stat.label}</p>
                <p className="text-base md:text-xl font-bold font-display">{stat.value}</p>
              </div>
            </div>
            <span className={cn(
              "text-[9px] md:text-xs font-bold px-2 py-0.5 md:py-1 rounded-lg w-fit",
              stat.delta.startsWith('+') ? "bg-emerald-100 text-emerald-700" : "bg-blue-100 text-blue-700"
            )}>
              {stat.delta}
            </span>
          </motion.div>
        ))}
      </section>

      {/* Quick Actions Grid */}
      <section className="space-y-4">
        <h3 className="text-lg md:text-xl font-display font-bold text-slate-900 px-1 italic">Solutions Rapides</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 md:gap-6">
          {quickActions.map((action, i) => (
            <motion.div 
              key={i}
              whileHover={{ scale: 1.02 }}
              className={cn("p-5 md:p-6 rounded-2xl md:rounded-3xl border border-slate-100 shadow-sm cursor-pointer group transition-all", action.color)}
            >
              <div className="flex items-center gap-4 mb-3 md:mb-4">
                <div className="p-2.5 md:p-3 rounded-xl md:rounded-2xl bg-white shadow-sm group-hover:shadow-md transition-shadow shrink-0">
                  {React.cloneElement(action.icon as React.ReactElement, { size: 20 } as any)}
                </div>
                <div>
                  <h4 className="font-bold text-slate-900 text-sm md:text-base">{action.label}</h4>
                  <p className="text-[10px] md:text-xs text-slate-500">{action.sub}</p>
                </div>
              </div>
              <div className="flex justify-end">
                <div className="bg-white/50 p-1.5 md:p-2 rounded-full group-hover:bg-white group-hover:translate-x-2 transition-all">
                  <ChevronRight size={14} className="md:w-4 md:h-4" />
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </section>

      {/* AI Assistant FAB is handled by AIAssistant sibling component */}
      <AIAssistant />
    </div>
  );
}
