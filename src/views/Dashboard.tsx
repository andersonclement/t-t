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
  PhoneCall,
  Zap,
  Thermometer,
  Droplets,
  HeartPulse,
  Bone,
  Truck,
  ThumbsUp,
  MessageSquare,
  ArrowRight,
  Pill,
  Sparkles
} from 'lucide-react';
import { useAuth } from '../components/AuthContext';
import { cn } from '../lib/utils';

function PharmacistStatCard({ label, value, unit, icon, color }: { label: string; value: string; unit?: string; icon: React.ReactNode; color: string }) {
  return (
    <div className={cn("p-6 rounded-[2rem] border border-slate-100 shadow-sm flex flex-col gap-4 bg-white")}>
      <div className={cn("w-12 h-12 rounded-xl flex items-center justify-center", color)}>
        {icon}
      </div>
      <div>
        <p className="text-xs font-bold text-slate-500 uppercase tracking-widest">{label}</p>
        <div className="flex items-baseline gap-1 mt-1">
          <span className="text-3xl font-display font-black text-slate-900">{value}</span>
          {unit && <span className="text-xs font-bold text-slate-400">{unit}</span>}
        </div>
      </div>
    </div>
  );
}

import { useOrders } from '../components/OrderContext';

export function Dashboard() {
  const { profile } = useAuth();
  const { orders } = useOrders();
  const isPharmacist = profile?.role === 'pharmacist';

  if (isPharmacist) {
    const pendingOrders = orders.filter(o => o.status === 'pending_validation').length;
    const todaySales = orders
      .filter(o => {
        if (!o.createdAt) return false;
        // Simple filter for today
        const today = new Date().toDateString();
        const orderDate = (o.createdAt as any).toDate ? (o.createdAt as any).toDate().toDateString() : new Date().toDateString();
        return today === orderDate;
      })
      .reduce((sum, o) => sum + o.total, 0);

    return (
      <div className="space-y-8 pb-16">
        <header className="flex flex-col md:flex-row md:items-center justify-between gap-6 p-8 bg-white rounded-[2.5rem] border border-slate-100 shadow-sm relative overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-50 blur-3xl rounded-full -translate-y-1/2 translate-x-1/2 -z-10" />
          <div className="space-y-2">
            <h1 className="text-2xl md:text-3xl font-display font-bold text-slate-900">
              Espace <span className="text-emerald-600">Pharmacien</span>
            </h1>
            <p className="text-slate-500 font-medium italic">Bienvenue, Dr. {profile?.displayName || 'Pharmacien'}</p>
          </div>
          <div className="flex items-center gap-3">
             <div className="bg-emerald-100 text-emerald-700 px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-widest flex items-center gap-2">
                <ShieldCheck size={16} /> Certifié Dokta
             </div>
          </div>
        </header>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <PharmacistStatCard label="Commandes en attente" value={pendingOrders.toString()} icon={<Clock className="text-amber-500" />} color="bg-amber-50" />
          <PharmacistStatCard label="Ordonnances à valider" value="5" icon={<ShieldCheck className="text-blue-500" />} color="bg-blue-50" />
          <PharmacistStatCard label="Ventes aujourd'hui" value={todaySales.toLocaleString()} unit="FCFA" icon={<TrendingUp className="text-emerald-500" />} color="bg-emerald-50" />
        </div>

        <section className="bg-white rounded-[2.5rem] p-8 border border-slate-100 shadow-sm space-y-6">
          <div className="flex items-center justify-between">
            <h3 className="text-xl font-display font-bold text-slate-900">Commandes Récentes</h3>
            <button className="text-sm font-bold text-brand-600 hover:underline" onClick={() => window.location.href='/orders'}>Voir tout</button>
          </div>
          <div className="space-y-4">
            {orders.slice(0, 3).map((order) => (
              <div key={order.id} className="flex items-center justify-between p-4 rounded-2xl bg-slate-50 border border-slate-100 group hover:border-brand-200 transition-colors">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-xl bg-white border border-slate-100 flex items-center justify-center text-slate-400 group-hover:text-brand-600 transition-colors">
                    <Zap size={20} />
                  </div>
                  <div>
                    <p className="font-bold text-slate-900 text-sm">Commande #{order.id.substring(0, 8)}</p>
                    <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mt-0.5">Patient: {order.patientId.substring(0, 6)}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-black text-slate-900 text-sm">{order.total.toLocaleString()} FCFA</p>
                  <p className={cn(
                    "text-[10px] font-bold uppercase tracking-widest mt-0.5",
                    order.status === 'delivered' ? "text-emerald-600" : "text-amber-600"
                  )}>{order.status}</p>
                </div>
              </div>
            ))}
            {orders.length === 0 && (
              <p className="text-center text-slate-400 italic py-4">Aucune commande récente.</p>
            )}
          </div>
        </section>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
           <div className="bg-slate-900 rounded-[2.5rem] p-8 text-white space-y-6 relative overflow-hidden">
              <div className="relative z-10 space-y-4">
                <h3 className="text-xl font-display font-bold">Gestion des Stocks</h3>
                <p className="text-slate-400 text-sm leading-relaxed">
                  Mettez à jour vos inventaires pour apparaître dans les résultats de recherche Dokta.
                </p>
                <button className="bg-emerald-600 text-white px-6 py-3 rounded-xl font-bold text-sm hover:bg-emerald-500 transition-all">
                  Ouvrir l'inventaire
                </button>
              </div>
              <Pill className="absolute -bottom-10 -right-10 w-40 h-40 text-white/5" />
           </div>

           <div className="bg-brand-50 rounded-[2.5rem] p-8 border border-brand-100 space-y-6">
              <h3 className="text-xl font-display font-bold text-slate-900 flex items-center gap-2">
                <Sparkles size={20} className="text-brand-600" />
                Conseils IA Business
              </h3>
              <p className="text-slate-600 text-sm italic leading-relaxed">
                "La demande en Artéméther est en hausse de 20% dans votre secteur ce mois-ci. Assurez-vous d'avoir assez de stock."
              </p>
              <div className="flex items-center gap-2 text-[10px] font-bold text-brand-600 uppercase tracking-widest">
                <Activity size={14} /> Prédiction DiagAI
              </div>
           </div>
        </div>
      </div>
    );
  }

  const stats = [
    { label: "Pression", value: "12/8", icon: <Activity className="text-rose-500" />, delta: "Normal", color: "from-rose-50 to-white" },
    { label: "Sommeil", value: "7h 20m", icon: <Clock className="text-cyan-500" />, delta: "+10%", color: "from-cyan-50 to-white" },
    { label: "Activité", value: "5,420", unit: "pas", icon: <TrendingUp className="text-amber-500" />, delta: "60%", color: "from-amber-50 to-white" },
  ];

  const quickActions = [
    { label: "Pharmacies", sub: "Disponibilité & Garde", icon: <MapPin className="text-emerald-600" />, color: "bg-emerald-50/50", to: "/map" },
    { label: "Rendez-vous", sub: "Établissements Proches", icon: <Calendar className="text-blue-600" />, color: "bg-blue-50/50", to: "/directory" },
    { label: "Assistant Santé", sub: "Conseils par IA", icon: <Zap className="text-violet-600" />, color: "bg-violet-50/50", to: "/ai-sante" },
    { label: "Analyses", sub: "Interpréter Ordonnance", icon: <ShieldCheck className="text-indigo-600" />, color: "bg-indigo-50/50", to: "/ai-sante" },
  ];

  const healthCategories = [
    { label: "Douleur & Fièvre", icon: <Thermometer />, color: "bg-red-50 text-red-600" },
    { label: "Digestion", icon: <Droplets />, color: "bg-blue-50 text-blue-600" },
    { label: "Respiration", icon: <Activity />, color: "bg-emerald-50 text-emerald-600" },
    { label: "Cœur & Tension", icon: <HeartPulse />, color: "bg-rose-50 text-rose-600" },
    { label: "Os & Muscles", icon: <Bone />, color: "bg-amber-50 text-amber-600" },
    { label: "Peau & Soins", icon: <ShieldCheck />, color: "bg-purple-50 text-purple-600" },
  ];

  const commitments = [
    { label: "Conseils Pharmaciens", icon: <ShieldCheck size={16} /> },
    { label: "Paiement Sécurisé", icon: <ShieldCheck size={16} /> },
    { label: "Support 24/7 au Cameroun", icon: <MessageSquare size={16} /> },
  ];

  return (
    <div className="space-y-10 pb-16">
      {/* Search Hero Section */}
      <section className="-mx-4 md:-mx-8 px-4 md:px-8 pt-4 md:pt-8 pb-12 bg-gradient-to-b from-brand-50/40 to-white relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-brand-200/20 blur-3xl rounded-full -translate-y-1/2 translate-x-1/2" />
        
        <div className="max-w-4xl mx-auto text-center space-y-8 relative z-10">
          <header className="flex items-center justify-between gap-4 mb-8">
            <div className="text-left">
              <h1 className="text-xl md:text-3xl font-display font-bold text-slate-900 tracking-tight">
                Bonjour, <span className="text-brand-600">{profile?.displayName?.split(' ')[0] || 'Invité'}</span> 👋
              </h1>
              <p className="text-xs md:text-sm text-slate-500 font-medium italic">Votre partenaire santé au quotidien.</p>
            </div>
            <button 
              onClick={() => window.location.href = 'tel:124'}
              className="group flex items-center gap-2 px-4 py-2 bg-rose-600 text-white rounded-xl font-bold text-xs shadow-lg shadow-rose-200 transition-all active:scale-95"
            >
              <PhoneCall size={14} className="group-hover:animate-bounce" />
              <span>Urgence 124</span>
            </button>
          </header>

          <div className="space-y-6">
            <h2 className="text-3xl md:text-5xl font-display font-bold text-slate-900 leading-[1.1]">
              Votre santé, <br className="hidden sm:block" />
              <span className="text-brand-600">simplifiée & connectée.</span>
            </h2>
            
            <div className="relative group max-w-2xl mx-auto drop-shadow-2xl">
              <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-brand-600 transition-colors" size={20} />
              <input 
                type="text" 
                placeholder="Chercher une pharmacie, un médicament, un conseil..." 
                className="w-full bg-white border-2 border-slate-100 rounded-2xl py-4.5 pl-14 pr-6 text-sm md:text-lg focus:outline-none focus:ring-4 focus:ring-brand-600/5 focus:border-brand-600 transition-all placeholder:text-slate-400 font-medium"
              />
              <button className="absolute right-3 top-1/2 -translate-y-1/2 bg-slate-900 text-white px-4 py-2 rounded-xl text-xs font-bold hover:bg-slate-800 transition-colors hidden sm:block">
                Rechercher
              </button>
            </div>
          </div>

          <div className="flex flex-wrap justify-center gap-4 md:gap-8 pt-4">
            {commitments.map((item, i) => (
              <div key={i} className="flex items-center gap-2 text-slate-500 font-bold text-[10px] md:text-xs tracking-tight">
                <div className="w-5 h-5 rounded-full bg-brand-100 flex items-center justify-center text-brand-600">
                  {React.cloneElement(item.icon as React.ReactElement, { size: 10 } as any)}
                </div>
                {item.label}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Emergency pharmacies banner */}
      <section>
        <div className="bg-brand-900 rounded-3xl p-6 md:p-8 flex flex-col md:flex-row items-center justify-between gap-6 relative overflow-hidden shadow-xl shadow-brand-900/20">
          <div className="flex flex-col gap-1 relative z-10 text-center md:text-left">
            <div className="inline-flex items-center gap-2 bg-brand-600/20 text-brand-400 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest mb-2 w-fit mx-auto md:mx-0">
              <Clock size={12} /> Pharmacie de Garde
            </div>
            <h3 className="text-xl md:text-2xl font-display font-bold text-white">Besoin de médicaments en urgence ?</h3>
            <p className="text-brand-200/80 text-sm font-medium">Trouvez les pharmacies ouvertes cette nuit près de chez vous.</p>
          </div>
          <motion.button 
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => window.location.href = '/map'}
            className="bg-white text-brand-900 px-8 py-3 rounded-2xl font-bold text-sm shadow-xl active:scale-95 transition-all whitespace-nowrap relative z-10"
          >
            Voir la carte
          </motion.button>
          <div className="absolute right-0 bottom-0 top-0 w-1/3 bg-gradient-to-l from-brand-600/20 to-transparent hidden md:block" />
        </div>
      </section>

      {/* Categories Grid */}
      <section className="space-y-6">
        <div className="flex items-center justify-between px-1">
          <h3 className="text-lg md:text-xl font-display font-bold text-slate-900 flex items-center gap-2">
            <div className="w-1.5 h-6 bg-brand-600 rounded-full" />
            Par besoin de santé
          </h3>
          <button className="text-xs font-bold text-brand-600 hover:underline">Voir tous les rayons</button>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4 md:gap-6">
          {healthCategories.map((cat, i) => (
            <motion.div 
              key={i}
              whileHover={{ y: -5, boxShadow: "0 20px 25px -5px rgb(0 0 0 / 0.1)" }}
              className="flex flex-col items-center gap-4 group cursor-pointer bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm transition-all"
            >
              <div className={cn(
                "w-16 h-16 rounded-3xl flex items-center justify-center transition-all group-hover:scale-110 group-active:scale-95 ring-4 ring-transparent group-hover:ring-brand-50",
                cat.color
              )}>
                {React.cloneElement(cat.icon as React.ReactElement, { size: 28 } as any)}
              </div>
              <span className="text-[11px] md:text-xs font-black text-slate-900 uppercase tracking-wide text-center leading-tight">
                {cat.label}
              </span>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Stats and Highlights */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Health Monitoring */}
        <section className="space-y-6">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-display font-bold text-slate-900 flex items-center gap-2">
              <Activity size={20} className="text-brand-600" />
              Vos constantes
            </h3>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {stats.slice(0, 2).map((stat, i) => (
              <motion.div 
                key={i}
                className={cn(
                  "relative overflow-hidden bg-white rounded-3xl p-6 border border-slate-100 shadow-sm",
                  `bg-gradient-to-br ${stat.color}`
                )}
              >
                <div className="flex flex-col gap-4">
                  <div className="flex items-center justify-between">
                    <div className="p-2.5 rounded-2xl bg-white shadow-sm">{stat.icon}</div>
                    <span className={cn(
                      "text-[10px] font-bold px-2 py-1 rounded-full uppercase tracking-wider",
                      stat.delta.startsWith('+') ? "bg-emerald-100 text-emerald-700" : "bg-blue-100 text-blue-700"
                    )}>
                      {stat.delta}
                    </span>
                  </div>
                  <div>
                    <p className="text-sm text-slate-600 font-bold mb-1">{stat.label}</p>
                    <span className="text-3xl font-display font-black text-slate-900">{stat.value}</span>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </section>

        {/* AI Decryption card */}
        <motion.div 
          whileHover={{ y: -5 }}
          className="bg-indigo-900 rounded-[2rem] p-6 md:p-8 relative overflow-hidden shadow-2xl shadow-indigo-200/50 flex flex-col justify-center"
        >
          <div className="absolute top-0 right-0 w-48 h-48 bg-brand-400/20 blur-[80px] rounded-full" />
          <div className="relative z-10 space-y-4">
            <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-md text-white px-3 py-1.5 rounded-full text-[10px] font-bold uppercase tracking-wider">
              <Zap size={14} className="text-brand-400" /> Assistant IA
            </div>
            <h2 className="text-2xl md:text-3xl font-display font-bold text-white leading-tight">
              Analysez vos <span className="text-brand-400 underline decoration-brand-400/30 underline-offset-4">ordonnances</span>
            </h2>
            <p className="text-indigo-100/70 text-sm leading-relaxed max-w-md">
              Plus besoin de deviner. Notre IA explique les médicaments prescrits et leurs posologies en termes simples.
            </p>
            <button 
              onClick={() => window.location.href = '/ai-sante'}
              className="bg-brand-600 text-white px-6 py-3 rounded-xl font-bold text-sm shadow-xl shadow-brand-900/40 hover:bg-brand-500 transition-all w-fit"
            >
              Démarrer l'analyse
            </button>
          </div>
        </motion.div>
      </div>
      
      {/* Services Recommendation */}
      <section className="space-y-6 pt-4">
        <h3 className="text-lg md:text-xl font-display font-bold text-slate-900 px-1 italic">Services & Conseils</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
          {quickActions.map((action, i) => (
            <motion.div 
              key={i}
              whileHover={{ y: -5 }}
              onClick={() => window.location.href = action.to}
              className="group cursor-pointer bg-white rounded-[2rem] border border-slate-100 p-6 flex flex-col gap-4 shadow-sm hover:shadow-xl transition-all"
            >
              <div className={cn("p-4 rounded-2xl w-fit transition-transform group-hover:scale-110", action.color)}>
                {React.cloneElement(action.icon as React.ReactElement, { size: 24 } as any)}
              </div>
              <div>
                <h4 className="font-bold text-slate-900 group-hover:text-brand-600 transition-colors uppercase tracking-tight text-xs">{action.label}</h4>
                <p className="text-slate-500 text-[10px] md:text-xs font-medium leading-relaxed">{action.sub}</p>
              </div>
              <div className="mt-auto pt-6 flex items-center justify-between text-brand-600 font-bold text-[10px] uppercase tracking-widest">
                <span>En savoir plus</span>
                <ArrowRight size={14} className="group-hover:translate-x-2 transition-transform" />
              </div>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Newsletter Placeholder */}
      <section className="bg-slate-100/50 rounded-[2.5rem] p-8 md:p-12 text-center space-y-6 border border-slate-100">
        <div className="max-w-xl mx-auto space-y-4">
          <h3 className="text-xl md:text-2xl font-display font-bold text-slate-900">Restez informé sur votre santé</h3>
          <p className="text-slate-500 text-sm md:text-base">Recevez des conseils de santé personnalisés et les alertes épidémiques au Cameroun.</p>
          <div className="flex flex-col sm:flex-row gap-3 pt-4">
            <input 
              type="email" 
              placeholder="votre-email@exemple.com" 
              className="flex-1 bg-white border border-slate-200 rounded-2xl px-6 py-4 text-sm focus:ring-4 focus:ring-brand-600/5 focus:border-brand-600 outline-none transition-all"
            />
            <button className="bg-slate-900 text-white px-8 py-4 rounded-2xl font-bold text-sm hover:bg-slate-800 transition-all whitespace-nowrap">
              S'abonner
            </button>
          </div>
        </div>
      </section>
    </div>
  );
}
