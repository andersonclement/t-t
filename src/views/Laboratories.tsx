import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Microscope, 
  Search, 
  Tablet, 
  Calendar, 
  ChevronRight, 
  FileText, 
  Activity, 
  Clock, 
  ShieldCheck,
  CreditCard,
  Plus,
  ArrowRight,
  MapPin,
  PhoneCall,
  Award,
  Star as StarIcon
} from 'lucide-react';
import { cn } from '../lib/utils';

interface LabService {
  id: string;
  name: string;
  category: 'Biology' | 'Genetics' | 'Imaging' | 'Functional';
  price: number;
  reimbursement: string;
  duration: string;
}

const MOCK_SERVICES: LabService[] = [
  { id: '1', name: 'Bilan Sanguin Complet (Hématologie)', category: 'Biology', price: 45.00, reimbursement: '70% Sécu + Mutuelle', duration: '24h' },
  { id: '2', name: 'Test PCR COVID-19', category: 'Biology', price: 40.00, reimbursement: '100% (si prescription)', duration: '12h' },
  { id: '3', name: 'Échographie Abdominale', category: 'Imaging', price: 75.00, reimbursement: '70% Sécu', duration: 'Immédiat' },
  { id: '4', name: 'Dépistage Diabète (Glycémie)', category: 'Biology', price: 12.50, reimbursement: '60% Sécu', duration: '6h' },
  { id: '5', name: 'Scan IRM Cérébral', category: 'Imaging', price: 180.00, reimbursement: 'Variable', duration: '48h' },
  { id: '6', name: 'Test de Paternité (Génétique)', category: 'Genetics', price: 299.00, reimbursement: 'Non remboursé', duration: '7 jours' },
];

interface Lab {
  id: string;
  name: string;
  address: string;
  distance: string;
  rating: number;
  isOpen: boolean;
  image: string;
  services: LabService[];
}

const MOCK_LABS: Lab[] = [
  {
    id: 'L1',
    name: 'Laboratoire Bio-Paris Centre',
    address: '14 Rue de Rivoli, 75001 Paris',
    distance: '0.8 km',
    rating: 4.8,
    isOpen: true,
    image: 'https://images.unsplash.com/photo-1579154235602-3c58d04f2162?w=400&h=300&fit=crop',
    services: MOCK_SERVICES.map(s => ({ ...s, price: s.price }))
  },
  {
    id: 'L2',
    name: 'Analyses Médicales Montparnasse',
    address: '42 Bvd du Montparnasse, 75014 Paris',
    distance: '2.5 km',
    rating: 4.5,
    isOpen: true,
    image: 'https://images.unsplash.com/photo-1581093588401-fbb62a02f120?w=400&h=300&fit=crop',
    services: MOCK_SERVICES.map(s => ({ ...s, price: s.price * 1.1 })) // Slightly different prices
  },
  {
    id: 'L3',
    name: 'Labo-Quartier Latin',
    address: '5 Rue Soufflot, 75005 Paris',
    distance: '1.4 km',
    rating: 4.2,
    isOpen: false,
    image: 'https://images.unsplash.com/photo-1551601651-261ed0b42fd1?w=400&h=300&fit=crop',
    services: MOCK_SERVICES.map(s => ({ ...s, price: s.price * 0.9 }))
  }
];

export function Laboratories() {
  const [view, setView] = useState<'list' | 'detail' | 'search'>('list');
  const [selectedLab, setSelectedLab] = useState<Lab | null>(null);
  const [analysisSearch, setAnalysisSearch] = useState('');
  
  const comparativeResults = MOCK_LABS.flatMap(lab => 
    lab.services
      .filter(s => s.name.toLowerCase().includes(analysisSearch.toLowerCase()))
      .map(s => ({ lab, service: s }))
  ).sort((a, b) => a.service.price - b.service.price);

  return (
    <div className="space-y-8 pb-12">
      <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-display font-bold text-slate-900 tracking-tight">Laboratoires</h1>
          <nav className="flex items-center gap-2 text-sm text-slate-500 mt-1">
            <button onClick={() => setView('list')} className="hover:text-brand-600 transition-colors">Annuaire</button>
            {selectedLab && (
              <>
                <ChevronRight size={14} />
                <span className="font-bold text-brand-600">{selectedLab.name}</span>
              </>
            )}
          </nav>
        </div>
        <div className="bg-white px-4 py-2 rounded-2xl border border-slate-100 shadow-sm flex items-center gap-3">
          <ShieldCheck className="text-brand-600" size={20} />
          <span className="text-xs font-bold text-slate-700 uppercase tracking-wider">Accréditation ISO 15189</span>
        </div>
      </header>

      {/* Global Comparative Search */}
      <section className="bg-slate-900 rounded-[2.5rem] p-6 shadow-xl text-white">
        <div className="flex flex-col md:flex-row gap-4 items-center">
          <div className="flex-1 relative w-full">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
            <input 
              type="text" 
              placeholder="Rechercher une analyse pour comparer les prix (ex: Bilan sanguin)..." 
              value={analysisSearch}
              onChange={(e) => {
                setAnalysisSearch(e.target.value);
                setView(e.target.value ? 'search' : 'list');
              }}
              className="w-full bg-white/10 border-none rounded-2xl py-4 pl-12 pr-4 text-white placeholder:text-slate-400 outline-none focus:ring-2 focus:ring-brand-600 transition-all"
            />
          </div>
          <div className="flex items-center gap-2 px-4 py-2 bg-brand-600 rounded-xl font-bold text-sm whitespace-nowrap">
             <Plus size={18} />
             Nouveau Bilan
          </div>
        </div>
      </section>

      <AnimatePresence mode="wait">
        {view === 'search' && analysisSearch && (
          <motion.div 
            key="search-view"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="space-y-6"
          >
            <div className="px-2">
              <h3 className="text-xl font-display font-bold">Prix comparatif pour "{analysisSearch}"</h3>
              <p className="text-sm text-slate-500">Classé par prix croissant (le moins cher en premier)</p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {comparativeResults.map((res, i) => (
                <div 
                  key={i} 
                  className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm hover:shadow-lg transition-all group cursor-pointer"
                  onClick={() => {
                    setSelectedLab(res.lab);
                    setView('detail');
                  }}
                >
                  <div className="flex justify-between items-start mb-4">
                    <span className="bg-emerald-50 text-emerald-700 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest leading-none">
                      {res.service.category}
                    </span>
                    <span className="text-2xl font-display font-bold text-brand-600">{res.service.price.toFixed(2)} €</span>
                  </div>
                  <h4 className="font-bold text-slate-800 mb-2 truncate">{res.service.name}</h4>
                  <div className="border-t border-slate-50 pt-4 mt-4 space-y-2">
                    <p className="text-xs text-slate-400 font-bold uppercase">Proposé par :</p>
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-bold text-slate-700">{res.lab.name}</span>
                      <span className="text-xs text-slate-400">{res.lab.distance}</span>
                    </div>
                  </div>
                  <div className="mt-4 flex justify-end">
                    <ArrowRight className="text-slate-300 group-hover:text-brand-600 transition-colors" />
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        )}

        {view === 'list' && (
          <motion.div 
            key="list-view"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8"
          >
            {MOCK_LABS.map((lab) => (
              <motion.div 
                key={lab.id}
                whileHover={{ y: -5 }}
                onClick={() => {
                  setSelectedLab(lab);
                  setView('detail');
                }}
                className="bg-white rounded-3xl overflow-hidden shadow-sm border border-slate-100 cursor-pointer group hover:shadow-xl transition-all"
              >
                <div className="h-48 relative overflow-hidden">
                  <img src={lab.image} alt={lab.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                  <div className="absolute top-4 left-4 bg-white/90 backdrop-blur px-3 py-1 rounded-full text-[10px] font-bold text-slate-800 shadow-sm">
                    {lab.distance}
                  </div>
                </div>
                <div className="p-6 space-y-4">
                  <div>
                    <h3 className="text-xl font-display font-bold text-slate-900 group-hover:text-brand-600 transition-colors">{lab.name}</h3>
                    <p className="text-sm text-slate-400 italic mt-1 line-clamp-1">{lab.address}</p>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className={cn("w-2 h-2 rounded-full", lab.isOpen ? "bg-emerald-500" : "bg-red-400")} />
                      <span className="text-xs font-bold text-slate-500 uppercase tracking-widest">{lab.isOpen ? 'Ouvert' : 'Fermé'}</span>
                    </div>
                    <div className="flex items-center gap-1 text-orange-400">
                      <Star size={14} fill="currentColor" />
                      <span className="text-sm font-bold text-slate-700">{lab.rating}</span>
                    </div>
                  </div>
                  <div className="pt-2 border-t border-slate-50 flex items-center justify-between">
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{lab.services.length} analyses disponibles</p>
                    <ChevronRight size={20} className="text-slate-300" />
                  </div>
                </div>
              </motion.div>
            ))}
          </motion.div>
        )}

        {view === 'detail' && selectedLab && (
          <motion.div 
            key="detail-view"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="grid grid-cols-1 lg:grid-cols-3 gap-8"
          >
            <div className="lg:col-span-2 space-y-8">
              <div className="bg-white rounded-[2.5rem] p-8 border border-slate-100 shadow-sm flex flex-col md:flex-row gap-8">
                 <img src={selectedLab.image} className="w-full md:w-48 h-48 rounded-3xl object-cover" />
                 <div className="flex-1 space-y-4">
                    <div>
                      <h2 className="text-3xl font-display font-bold text-slate-900">{selectedLab.name}</h2>
                      <p className="text-slate-500">{selectedLab.address}</p>
                    </div>
                    <div className="flex flex-wrap gap-4">
                       <div className="flex items-center gap-2 text-sm font-bold text-slate-600 bg-slate-50 px-3 py-2 rounded-xl">
                          <Clock size={16} className="text-brand-600" />
                          08:00 - 18:30
                       </div>
                       <div className="flex items-center gap-2 text-sm font-bold text-slate-600 bg-slate-50 px-3 py-2 rounded-xl">
                          <CreditCard size={16} className="text-brand-600" />
                          Tiers-payant
                       </div>
                    </div>
                 </div>
              </div>

              <div className="space-y-6">
                <h3 className="text-xl font-display font-bold flex items-center gap-2 px-2">
                  <Microscope className="text-brand-600" />
                  Catalogue des analyses - {selectedLab.name}
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {selectedLab.services.map((service, i) => (
                    <motion.div 
                      key={service.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: i * 0.05 }}
                      className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm hover:border-brand-600/30 transition-all flex flex-col"
                    >
                      <div className="flex justify-between items-start mb-4">
                        <span className="bg-blue-50 text-blue-600 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest">{service.category}</span>
                        <span className="text-xl font-display font-bold text-brand-600">{service.price.toFixed(2)} €</span>
                      </div>
                      <h4 className="font-bold text-slate-800 flex-1">{service.name}</h4>
                      <div className="flex items-center justify-between mt-6">
                        <div className="flex items-center gap-2 text-[10px] font-bold text-slate-400">
                           <Clock size={12} />
                           {service.duration}
                        </div>
                        <button className="bg-slate-900 text-white px-4 py-2 rounded-xl text-xs font-bold hover:bg-brand-600 transition-colors">
                          Réserver
                        </button>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </div>
            </div>

            <aside className="lg:col-span-1 space-y-6">
               <div className="bg-white rounded-3xl p-8 border border-slate-100 shadow-sm sticky top-24">
                  <h4 className="text-lg font-display font-bold mb-6">Informations Pratiques</h4>
                  <div className="space-y-6">
                    <div className="flex gap-4">
                       <div className="p-3 bg-brand-50 rounded-2xl text-brand-600"><MapPin size={20} /></div>
                       <div>
                          <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">Localisation</p>
                          <p className="text-sm font-medium text-slate-700">{selectedLab.distance} de vous</p>
                       </div>
                    </div>
                    <div className="flex gap-4">
                       <div className="p-3 bg-clinical-50 rounded-2xl text-clinical-600"><Calendar size={20} /></div>
                       <div>
                          <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">Disponibilité</p>
                          <p className="text-sm font-medium text-slate-700">RDV possible dès demain</p>
                       </div>
                    </div>
                    <button className="w-full bg-brand-600 text-white py-4 rounded-2xl font-bold flex items-center justify-center gap-2 shadow-lg shadow-brand-600/20 hover:scale-[1.02] transition-all">
                       Appeler le labo
                       <PhoneCall size={18} />
                    </button>
                    <button 
                      onClick={() => setView('list')}
                      className="w-full border border-slate-200 text-slate-500 py-3 rounded-2xl font-bold text-sm hover:bg-slate-50 transition-colors"
                    >
                       Retour à la liste
                    </button>
                  </div>
               </div>
            </aside>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Process Section */}
      <section className="bg-white rounded-[3rem] p-8 md:p-16 border border-slate-100 shadow-sm mt-12">
        <h3 className="text-2xl font-display font-bold text-center mb-12 italic">Comment ça marche ?</h3>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          <ProcessStep 
            number="01" 
            title="Recherche" 
            desc="Trouvez l'analyse prescrite ou recommandée." 
          />
          <ProcessStep 
            number="02" 
            title="Réservation" 
            desc="Choisissez votre créneau et chargez l'ordonnance." 
          />
          <ProcessStep 
            number="03" 
            title="Prélèvement" 
            desc="Rendez-vous au labo ou demandez un passage à domicile." 
          />
          <ProcessStep 
            number="04" 
            title="Résultats" 
            desc="Recevez vos résultats chiffrés sous 24h/48h." 
          />
        </div>
      </section>
    </div>
  );
}

function Star({ size, fill, className }: { size?: number; fill?: string; className?: string }) {
  return <StarIcon size={size || 16} className={cn(fill ? "fill-current" : "", className)} />;
}

function ProcessStep({ number, title, desc }: { number: string; title: string; desc: string }) {
  return (
    <div className="relative space-y-4 text-center md:text-left">
      <span className="text-6xl font-display font-black text-slate-50 absolute -top-4 left-0 -z-0 select-none">
        {number}
      </span>
      <div className="relative z-10 pt-4">
        <h4 className="font-bold text-slate-800 flex items-center gap-2 justify-center md:justify-start">
          {title}
        </h4>
        <p className="text-xs text-slate-500 leading-relaxed mt-2">{desc}</p>
      </div>
    </div>
  );
}
