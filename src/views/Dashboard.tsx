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
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../components/AuthContext';
import { cn } from '../lib/utils';
import { db } from '../lib/firebase';
import { collection, query, where, getDocs, onSnapshot } from 'firebase/firestore';
import { Mail, Shield, Users, Check, X } from 'lucide-react';

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
  const navigate = useNavigate();
  const { profile, user } = useAuth();
  const { orders } = useOrders();
  const isPharmacist = profile?.role === 'pharmacist';

  const [pharmacies, setPharmacies] = React.useState<any[]>([]);
  const [selectedPharmaForModal, setSelectedPharmaForModal] = React.useState<any | null>(null);
  const [pendingPrescriptionsCount, setPendingPrescriptionsCount] = React.useState(0);
  const [medications, setMedications] = React.useState<any[]>([]);

  React.useEffect(() => {
    if (!isPharmacist) {
      const q = query(collection(db, 'users'), where('role', '==', 'pharmacist'));
      getDocs(q).then((snapshot) => {
        const list: any[] = [];
        snapshot.forEach((docSnap) => {
          list.push({ id: docSnap.id, ...docSnap.data() });
        });
        setPharmacies(list);
      }).catch((err) => {
        console.warn("Failed to fetch partner pharmacies:", err);
      });
    }
  }, [isPharmacist]);

  React.useEffect(() => {
    if (isPharmacist && user) {
      // Query the prescriptions collection for pending status
      const q = query(collection(db, 'prescriptions'), where('status', '==', 'pending'));
      const unsubscribe = onSnapshot(q, (snapshot) => {
        setPendingPrescriptionsCount(snapshot.size);
      }, (err) => {
        console.warn("Failed to subscribe to prescriptions count:", err);
      });
      return () => unsubscribe();
    }
  }, [isPharmacist, user]);

  React.useEffect(() => {
    if (isPharmacist) {
      let unsubscribe = () => {};
      if (user) {
        const q = query(collection(db, 'medication_stock'), where('pharmacistId', '==', user.uid));
        unsubscribe = onSnapshot(q, (snapshot) => {
          let items: any[] = [];
          snapshot.forEach((docSnap) => {
            items.push({ id: docSnap.id, ...docSnap.data() });
          });
          if (items.length === 0) {
            try {
              const stored = localStorage.getItem('medimap_meds_stock');
              if (stored) {
                items = JSON.parse(stored);
              }
            } catch (e) {}
          }
          setMedications(items);
        }, (err) => {
          console.warn("Failed to subscribe to stock on Dashboard:", err);
          try {
            const stored = localStorage.getItem('medimap_meds_stock');
            if (stored) {
              setMedications(JSON.parse(stored));
            }
          } catch (e) {}
        });
      } else {
        try {
          const stored = localStorage.getItem('medimap_meds_stock');
          if (stored) {
            setMedications(JSON.parse(stored));
          }
        } catch (e) {}
      }
      return () => unsubscribe();
    }
  }, [isPharmacist, user]);

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

    const outOfStockMeds = medications.filter(m => Number(m.stock) === 0);
    const lowStockMeds = medications.filter(m => {
      const min = m.minThreshold !== undefined ? Number(m.minThreshold) : 10;
      return Number(m.stock) > 0 && Number(m.stock) <= min;
    });

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
          <PharmacistStatCard label="Ordonnances à valider" value={pendingPrescriptionsCount.toString()} icon={<ShieldCheck className="text-blue-500" />} color="bg-blue-50" />
          <PharmacistStatCard label="Ventes aujourd'hui" value={todaySales.toLocaleString()} unit="FCFA" icon={<TrendingUp className="text-emerald-500" />} color="bg-emerald-50" />
        </div>

        <section className="bg-white rounded-[2.5rem] p-8 border border-slate-100 shadow-sm space-y-6">
          <div className="flex items-center justify-between">
            <h3 className="text-xl font-display font-bold text-slate-900">Commandes Récentes</h3>
            <button className="text-sm font-bold text-brand-600 hover:underline" onClick={() => navigate('/orders')}>Voir tout</button>
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
              {outOfStockMeds.length > 0 || lowStockMeds.length > 0 ? (
                <p className="text-slate-600 text-sm italic leading-relaxed">
                  "Attention Dr. {profile?.displayName || 'Pharmacien'} ! Nous détectons{" "}
                  {outOfStockMeds.length > 0 ? (
                    <>
                      <span className="font-bold text-red-600">{outOfStockMeds.length} produit(s) en rupture totale</span>
                      {lowStockMeds.length > 0 && " et "}
                    </>
                  ) : null}
                  {lowStockMeds.length > 0 ? (
                    <span className="font-bold text-amber-600">{lowStockMeds.length} produit(s) sous le seuil d'alerte</span>
                  ) : null}
                  . Veuillez réapprovisionner rapidement (notamment <span className="font-semibold text-slate-800">{outOfStockMeds[0]?.name || lowStockMeds[0]?.name}</span>) pour répondre aux besoins de vos patients."
                </p>
              ) : (
                <p className="text-slate-600 text-sm italic leading-relaxed">
                  "Félicitations, Dr. {profile?.displayName || 'Pharmacien'} ! Vos stocks de médicaments sont optimaux. Tous vos produits d'officine disposent d'un volume suffisant."
                </p>
              )}
              <div className="flex items-center gap-2 text-[10px] font-bold text-brand-600 uppercase tracking-widest">
                <Activity size={14} /> Prédiction Care IA
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
            onClick={() => navigate('/map')}
            className="bg-white text-brand-900 px-8 py-3 rounded-2xl font-bold text-sm shadow-xl active:scale-95 transition-all whitespace-nowrap relative z-10"
          >
            Voir la carte
          </motion.button>
          <div className="absolute right-0 bottom-0 top-0 w-1/3 bg-gradient-to-l from-brand-600/20 to-transparent hidden md:block" />
        </div>
      </section>

      {/* Partner Pharmacies Details Section */}
      <section className="space-y-6">
        <div className="flex items-center justify-between px-1">
          <h3 className="text-lg md:text-xl font-display font-bold text-slate-900 flex items-center gap-2">
            <div className="w-1.5 h-6 bg-emerald-600 rounded-full" />
            Nos Pharmacies Partenaires Officielles
          </h3>
          <span className="text-xs text-slate-400 font-bold font-mono">
            {pharmacies.length} En ligne
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {pharmacies.map((pharma, idx) => {
            const pharmaName = pharma.pharmacyName || pharma.displayName || 'Pharmacie du Centre';
            const address = pharma.pharmacyAddress || pharma.address || 'Douala, Cameroun';
            const phone = pharma.pharmacyPhone || pharma.phone || 'Non renseigné';
            const hours = pharma.pharmacyHours || 'Non renseigné (24h/24 par défaut)';
            const email = pharma.pharmacyEmail || pharma.email || 'Non renseigné';

            return (
              <motion.div 
                key={pharma.id || idx}
                whileHover={{ y: -5, boxShadow: "0 20px 25px -5px rgb(0 0 0 / 0.05)" }}
                className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm space-y-4 relative overflow-hidden flex flex-col justify-between"
              >
                <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-50 rounded-bl-full -z-0 opacity-40" />
                
                <div className="space-y-3 relative z-10">
                  <div className="flex items-center gap-2">
                    <span className="bg-emerald-50 text-emerald-700 px-2.5 py-1 rounded-full text-[9px] font-bold uppercase tracking-wider flex items-center gap-1">
                      <ShieldCheck size={10} /> Partenaire Agréé
                    </span>
                    <span className="bg-slate-100 text-slate-600 px-2.5 py-1 rounded-full text-[9px] font-bold uppercase tracking-wider">
                      Cameroun
                    </span>
                  </div>

                  <div>
                    <h4 className="text-lg font-bold text-slate-900 tracking-tight">{pharmaName}</h4>
                    <p className="text-xs text-slate-400 font-medium italic mt-0.5 font-sans">Responsable : Dr. {pharma.displayName || 'Pharmacien'}</p>
                  </div>

                  <div className="space-y-2 pt-2 border-t border-slate-50 text-xs text-slate-600 font-medium">
                    <div className="flex items-start gap-2.5">
                      <MapPin size={14} className="text-emerald-600 shrink-0 mt-0.5" />
                      <span>{address}</span>
                    </div>
                    <div className="flex items-center gap-2.5">
                      <Clock size={14} className="text-emerald-600 shrink-0" />
                      <span>{hours}</span>
                    </div>
                    {phone && phone !== 'Non renseigné' && (
                      <div className="flex items-center gap-2.5">
                        <PhoneCall size={14} className="text-emerald-600 shrink-0" />
                        <span className="font-mono font-bold text-slate-800">{phone}</span>
                      </div>
                    )}
                    {email && email !== 'Non renseigné' && (
                      <div className="flex items-center gap-2.5">
                        <Mail size={14} className="text-emerald-600 shrink-0" />
                        <span className="truncate text-slate-500">{email}</span>
                      </div>
                    )}
                  </div>
                </div>

                {profile?.role !== 'patient' && (
                  <button
                    onClick={() => setSelectedPharmaForModal(pharma)}
                    className="w-full bg-slate-50 border border-slate-100 hover:bg-slate-100 hover:border-slate-200 text-slate-700 py-2.5 rounded-xl font-bold text-[10px] flex items-center justify-center gap-1.5 transition-all mt-4 relative z-10"
                  >
                    <ShieldCheck size={12} className="text-emerald-600" /> Voir la Fiche Technique de l'Officine
                  </button>
                )}

                <div className="pt-4 border-t border-slate-50 relative z-10 flex gap-2">
                  <button 
                    onClick={() => window.location.href = `tel:${phone}`}
                    className="flex-1 justify-center bg-slate-900 text-white px-4 py-2.5 rounded-xl font-bold text-[10px] flex items-center gap-2 transition-all active:scale-95 shadow-sm hover:bg-slate-800"
                  >
                    <PhoneCall size={11} /> Appeler
                  </button>
                  <button 
                    onClick={() => {
                      navigate(`/map?search=${encodeURIComponent(pharmaName)}`);
                    }}
                    className="flex-1 justify-center bg-emerald-50 text-emerald-700 px-4 py-2.5 rounded-xl font-bold text-[10px] flex items-center gap-2 transition-all active:scale-95 hover:bg-emerald-100"
                  >
                    <MapPin size={11} /> Itinéraire
                  </button>
                </div>
              </motion.div>
            );
          })}

          {pharmacies.length === 0 && (
            <div className="col-span-full bg-slate-50/50 p-8 rounded-[2rem] border border-slate-100 text-center space-y-2">
              <p className="text-sm font-medium text-slate-500 italic">Chargement des pharmacies agréées ou aucune pharmacie connectée pour le moment...</p>
              <p className="text-xs text-slate-400 font-sans">Astuce: En tant que pharmacien, remplissez vos informations d'officine dans l'onglet Profil pour apparaître ici en temps réel !</p>
            </div>
          )}
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
              onClick={() => navigate('/ai-sante')}
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
              onClick={() => navigate(action.to)}
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

      {/* Modal - Fiche Technique de l'Officine */}
      {selectedPharmaForModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <motion.div 
            initial={{ opacity: 0, scale: 0.95, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            className="bg-white rounded-[2.5rem] w-full max-w-xl overflow-hidden shadow-2xl border border-slate-100 flex flex-col"
          >
            {/* Header */}
            <div className="bg-slate-900 text-white p-6 relative">
              <button 
                onClick={() => setSelectedPharmaForModal(null)}
                className="absolute top-6 right-6 text-slate-400 hover:text-white bg-white/10 p-2 rounded-full transition-colors flex items-center justify-center"
              >
                <X size={16} />
              </button>
              <div className="flex items-center gap-2">
                <span className="bg-emerald-500 text-white px-2.5 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider flex items-center gap-1">
                  <ShieldCheck size={10} /> Enquête de Conformité Validée
                </span>
              </div>
              <h3 className="text-xl font-display font-bold mt-3 leading-tight">
                {selectedPharmaForModal.pharmacyName || selectedPharmaForModal.displayName || 'Pharmacie Partenaire'}
              </h3>
              <p className="text-slate-400 text-xs font-medium italic mt-1 font-sans">
                Responsable : Dr. {selectedPharmaForModal.displayName || 'Pharmacien'}
              </p>
            </div>

            {/* Body */}
            <div className="p-6 md:p-8 space-y-6 max-h-[70vh] overflow-y-auto">
              {/* Intro / Shield statement */}
              <div className="bg-slate-50 border border-slate-100 rounded-2xl p-4 flex gap-3 items-start">
                <ShieldCheck className="text-emerald-600 shrink-0 mt-0.5" size={20} />
                <div>
                  <h4 className="font-bold text-slate-900 text-xs">Établissement Agréé & Certifié</h4>
                  <p className="text-slate-500 text-[10px] md:text-xs mt-0.5 leading-relaxed">
                    Cet établissement a complété avec succès l'audit physique de conformité technique effectué par Dokta Cameroun. Les stocks et conditions de conservation sont validés.
                  </p>
                </div>
              </div>

              {/* Identification Légale */}
              <div className="space-y-3">
                <h4 className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Identification Légale (MINSANTE)</h4>
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-slate-50/50 p-3 rounded-xl border border-slate-100">
                    <p className="text-[9px] text-slate-400 font-bold uppercase tracking-widest">N° ONPC</p>
                    <p className="text-xs font-mono font-bold text-slate-700 mt-1">
                      {selectedPharmaForModal.technicalForm?.onpcNumber || selectedPharmaForModal.onpcNumber || 'ONPC-3891-CM'}
                    </p>
                  </div>
                  <div className="bg-slate-50/50 p-3 rounded-xl border border-slate-100">
                    <p className="text-[9px] text-slate-400 font-bold uppercase tracking-widest">Arrêté de Création</p>
                    <p className="text-xs font-mono font-bold text-slate-700 mt-1">
                      {selectedPharmaForModal.technicalForm?.legalLicenseNumber || selectedPharmaForModal.legalLicenseNumber || 'ARR-1024-MINSANTE'}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2 text-xs text-slate-600">
                  <Users size={14} className="text-slate-400 shrink-0" />
                  <span>
                    Équipe de garde composée de <strong>{selectedPharmaForModal.technicalForm?.pharmacistsCount || selectedPharmaForModal.pharmacistsCount || 2}</strong> pharmaciens adjoints diplômés.
                  </span>
                </div>
              </div>

              {/* Technical Specifications */}
              <div className="space-y-3 pt-4 border-t border-slate-50">
                <h4 className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Équipement Technique d'Officine</h4>
                
                <div className="space-y-2.5">
                  <div className="flex justify-between items-center text-xs p-3 bg-slate-50/50 rounded-xl border border-slate-100">
                    <span className="text-slate-600 font-medium">Conservation Chaîne du Froid</span>
                    <span className="text-[10px] font-bold uppercase text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-md">
                      {selectedPharmaForModal.technicalForm?.coldChainEquipment === 'medical_fridge' ? 'Réfrigérateur Médical' : 
                       selectedPharmaForModal.technicalForm?.coldChainEquipment === 'electric_fridge' ? 'Réfrigérateur Électrique' : 'Système Isotherme'}
                    </span>
                  </div>

                  <div className="flex justify-between items-center text-xs p-3 bg-slate-50/50 rounded-xl border border-slate-100">
                    <span className="text-slate-600 font-medium">Générateur de Secours / Alimentation</span>
                    <span className="text-[10px] font-bold uppercase text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-md">
                      {selectedPharmaForModal.technicalForm?.backupGenerator === 'automated' ? 'Automatique (Inverseur Direct)' : 
                       selectedPharmaForModal.technicalForm?.backupGenerator === 'manual' ? 'Manuel (Démarrage manuel)' : 'Solaire / Onduleur'}
                    </span>
                  </div>

                  {/* Checklist indicators */}
                  <div className="grid grid-cols-2 gap-3 pt-1">
                    <div className="flex items-center justify-between p-3 bg-slate-50/50 rounded-xl border border-slate-100 text-xs font-medium text-slate-600">
                      <span>Suivi Continu Température</span>
                      {selectedPharmaForModal.technicalForm?.temperatureMonitor !== false ? <Check size={16} className="text-emerald-500 shrink-0" /> : <X size={16} className="text-red-500 shrink-0" />}
                    </div>
                    <div className="flex items-center justify-between p-3 bg-slate-50/50 rounded-xl border border-slate-100 text-xs font-medium text-slate-600">
                      <span>Climatisation d'Officine</span>
                      {selectedPharmaForModal.technicalForm?.airConditioned !== false ? <Check size={16} className="text-emerald-500 shrink-0" /> : <X size={16} className="text-red-500 shrink-0" />}
                    </div>
                    <div className="flex items-center justify-between p-3 bg-slate-50/50 rounded-xl border border-slate-100 text-xs font-medium text-slate-600">
                      <span>Coffre Fort Stupéfiants</span>
                      {selectedPharmaForModal.technicalForm?.narcoticsSafe !== false ? <Check size={16} className="text-emerald-500 shrink-0" /> : <X size={16} className="text-red-500 shrink-0" />}
                    </div>
                    <div className="flex items-center justify-between p-3 bg-slate-50/50 rounded-xl border border-slate-100 text-xs font-medium text-slate-600">
                      <span>Protocole Élimination Déchets</span>
                      {selectedPharmaForModal.technicalForm?.wasteProtocol !== false ? <Check size={16} className="text-emerald-500 shrink-0" /> : <X size={16} className="text-red-500 shrink-0" />}
                    </div>
                  </div>
                </div>
              </div>

              {/* Contacts */}
              <div className="space-y-3 pt-4 border-t border-slate-50">
                <h4 className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Coordonnées</h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs text-slate-600">
                  <div className="flex items-center gap-2">
                    <Clock size={14} className="text-slate-400" />
                    <span>{selectedPharmaForModal.pharmacyHours || '24h/24 par défaut'}</span>
                  </div>
                  {(selectedPharmaForModal.pharmacyPhone || selectedPharmaForModal.phone) && (
                    <div className="flex items-center gap-2">
                      <PhoneCall size={14} className="text-slate-400" />
                      <span className="font-mono font-bold text-slate-800">{selectedPharmaForModal.pharmacyPhone || selectedPharmaForModal.phone}</span>
                    </div>
                  )}
                  {(selectedPharmaForModal.pharmacyEmail || selectedPharmaForModal.email) && (
                    <div className="flex items-center gap-2 col-span-full">
                      <Mail size={14} className="text-slate-400" />
                      <span className="truncate">{selectedPharmaForModal.pharmacyEmail || selectedPharmaForModal.email}</span>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="p-6 bg-slate-50 border-t border-slate-100 flex gap-3">
              <button 
                onClick={() => setSelectedPharmaForModal(null)}
                className="flex-1 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 py-3 rounded-xl font-bold text-xs transition-colors"
              >
                Fermer
              </button>
              {(selectedPharmaForModal.pharmacyPhone || selectedPharmaForModal.phone) && (
                <button 
                  onClick={() => window.location.href = `tel:${selectedPharmaForModal.pharmacyPhone || selectedPharmaForModal.phone}`}
                  className="flex-1 bg-slate-900 text-white hover:bg-slate-800 py-3 rounded-xl font-bold text-xs flex items-center justify-center gap-2 transition-colors"
                >
                  <PhoneCall size={12} /> Contacter l'Officine
                </button>
              )}
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
}
