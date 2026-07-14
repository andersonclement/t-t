import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Search, 
  ShoppingCart, 
  Plus, 
  Upload, 
  Clock, 
  Info,
  ChevronRight,
  Camera,
  MapPin,
  Star as StarIcon,
  FileText,
  PhoneCall
} from 'lucide-react';
import { cn } from '../lib/utils';
import { collection, query, where, onSnapshot } from 'firebase/firestore';
import { db } from '../lib/firebase';

interface Medication {
  id: string;
  name: string;
  dci: string;
  price: number;
  category: string;
  image: string;
  available: boolean;
}

interface PharmacyEntity {
  id: string;
  name: string;
  address: string;
  distance: string;
  rating: number;
  isOpen: boolean;
  image: string;
  meds: Medication[];
}

const MOCK_MEDS: Medication[] = [
  // Douleur & Fièvre
  { id: '1', name: 'Doliprane 1000mg', dci: 'Paracétamol', price: 2.50, available: true, image: 'https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=200&h=200&fit=crop', category: 'Douleur & Fièvre' },
  { id: '5', name: 'Efferalgan 500mg', dci: 'Paracétamol', price: 1.80, available: true, image: 'https://images.unsplash.com/photo-1550572017-ed20015a0b79?w=200&h=200&fit=crop', category: 'Douleur & Fièvre' },
  { id: '6', name: 'Nurofen 400mg', dci: 'Ibuprofène', price: 4.50, available: true, image: 'https://images.unsplash.com/photo-1471864190281-ad5fe9bb0724?w=200&h=200&fit=crop', category: 'Douleur & Fièvre' },
  
  // Rhume & Grippe
  { id: '4', name: 'Vicks VapoRub', dci: 'Camphre/Lévomenthol', price: 8.50, available: true, image: 'https://images.unsplash.com/photo-1547489432-cf93fa6c71ee?w=200&h=200&fit=crop', category: 'Rhume & Grippe' },
  { id: '7', name: 'Humex Rhume', dci: 'Paracétamol/Pseudoéphédrine', price: 5.90, available: true, image: 'https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=200&h=200&fit=crop', category: 'Rhume & Grippe' },
  { id: '8', name: 'Actifed Rhume', dci: 'Paracétamol/Chlorphénamine', price: 6.30, available: true, image: 'https://images.unsplash.com/photo-1550572017-ed20015a0b79?w=200&h=200&fit=crop', category: 'Rhume & Grippe' },
  
  // Digestion
  { id: '2', name: 'Spasfon Lyoc', dci: 'Phloroglucinol', price: 4.80, available: true, image: 'https://images.unsplash.com/photo-1471864190281-ad5fe9bb0724?w=200&h=200&fit=crop', category: 'Digestion' },
  { id: '3', name: 'Gaviscon Pro', dci: 'Alginate de sodium', price: 6.20, available: true, image: 'https://images.unsplash.com/photo-1550572017-ed20015a0b79?w=200&h=200&fit=crop', category: 'Digestion' },
  { id: '9', name: 'Smecta', dci: 'Diosmectite', price: 5.40, available: true, image: 'https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=200&h=200&fit=crop', category: 'Digestion' },
  
  // Énergie & Vitamines
  { id: '10', name: 'Berocca Energie', dci: 'Magnésium/Vitamines B', price: 12.50, available: true, image: 'https://images.unsplash.com/photo-1512069772995-ec65ed45afd6?w=200&h=200&fit=crop', category: 'Vitamines' },
  { id: '11', name: 'Juvamine Multivitamine', dci: 'Vitamines/Minéraux', price: 9.80, available: true, image: 'https://images.unsplash.com/photo-1547489432-cf93fa6c71ee?w=200&h=200&fit=crop', category: 'Vitamines' },
  { id: '12', name: 'Azinc Vitalité', dci: 'Vitamines', price: 11.20, available: true, image: 'https://images.unsplash.com/photo-1471864190281-ad5fe9bb0724?w=200&h=200&fit=crop', category: 'Vitamines' },

  // Pédiatrie
  { id: '13', name: 'Doliprane Liquide', dci: 'Paracétamol Enfant', price: 3.20, available: true, image: 'https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=200&h=200&fit=crop', category: 'Pédiatrie' },
  { id: '14', name: 'Physiomer Baby', dci: 'Eau de mer', price: 7.50, available: true, image: 'https://images.unsplash.com/photo-1550572017-ed20015a0b79?w=200&h=200&fit=crop', category: 'Pédiatrie' },

  // Beauté
  { id: '15', name: 'Eau Thermale Avène', dci: 'Soin Visage', price: 14.90, available: true, image: 'https://images.unsplash.com/photo-1556228720-195a672e8a03?w=200&h=200&fit=crop', category: 'Beauté' },
  { id: '16', name: 'Baume Lèvres Bio', dci: 'Soin Lèvres', price: 5.50, available: true, image: 'https://images.unsplash.com/photo-1599423300746-b62533397364?w=200&h=200&fit=crop', category: 'Beauté' },
];

const MED_CATEGORIES = ['Tous', 'Douleur & Fièvre', 'Rhume & Grippe', 'Digestion', 'Vitamines', 'Pédiatrie', 'Beauté'];

const MOCK_PHARMACIES: PharmacyEntity[] = [
  {
    id: 'P1',
    name: 'Pharmacie Pasteur',
    address: '12 Rue des Lilas, 75020 Paris',
    distance: '450m',
    rating: 4.8,
    isOpen: true,
    image: 'https://images.unsplash.com/photo-1631549916768-4119b2e55916?w=400&h=300&fit=crop',
    meds: MOCK_MEDS
  },
  {
    id: 'P2',
    name: 'Pharmacie Royale',
    address: '89 Avenue de la Gloire, 75008 Paris',
    distance: '1.2 km',
    rating: 4.5,
    isOpen: true,
    image: 'https://images.unsplash.com/photo-1586015555751-63bb77f4322a?w=400&h=300&fit=crop',
    meds: MOCK_MEDS.map(m => ({ ...m, price: m.price * 1.1 }))
  },
  {
    id: 'P3',
    name: 'Pharmacie de Nuit St-Honoré',
    address: '154 Rue St-Honoré, 75001 Paris',
    distance: '3.1 km',
    rating: 4.9,
    isOpen: true,
    image: 'https://images.unsplash.com/photo-1512069772995-ec65ed45afd6?w=400&h=300&fit=crop',
    meds: MOCK_MEDS
  }
];

import { useOrders } from '../components/OrderContext';

export function Pharmacy() {
  const { addOrder } = useOrders();
  const [view, setView] = useState<'pharmacies' | 'catalog' | 'prescriptions' | 'results'>('pharmacies');
  const [selectedPharmacy, setSelectedPharmacy] = useState<PharmacyEntity | null>(null);
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('Tous');
  const [cart, setCart] = useState<Medication[]>([]);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analyzedMeds, setAnalyzedMeds] = useState<{ name: string; dosage: string }[]>([]);
  const [verificationStatus, setVerificationStatus] = useState<{
    valid: boolean;
    confidence: number;
    doctor?: string;
    date?: string;
  } | null>(null);
  const [matchingPharmacies, setMatchingPharmacies] = useState<PharmacyEntity[]>([]);
  const [showCheckoutSuccess, setShowCheckoutSuccess] = useState(false);

  // Firestore-fetched pharmacies and stock
  const [dbPharmacies, setDbPharmacies] = useState<PharmacyEntity[]>([]);
  const [dbMeds, setDbMeds] = useState<any[]>([]);

  useEffect(() => {
    const unsubPharmacies = onSnapshot(
      query(collection(db, 'users'), where('role', '==', 'pharmacist')),
      (snapshot) => {
        const list: PharmacyEntity[] = [];
        snapshot.forEach((docSnap) => {
          const data = docSnap.data();
          list.push({
            id: docSnap.id,
            name: data.pharmacyName || data.displayName || 'Pharmacie du Centre',
            address: data.pharmacyAddress || data.address || 'Douala, Cameroun',
            distance: 'Connecté',
            rating: 5.0,
            isOpen: true,
            image: data.pharmacyImage || 'https://images.unsplash.com/photo-1512069772995-ec65ed45afd6?w=400&h=300&fit=crop',
            meds: []
          });
        });
        setDbPharmacies(list);
      },
      (err) => console.warn("Failed to subscribe to pharmacies in PharmacyView:", err)
    );

    const unsubMeds = onSnapshot(
      collection(db, 'medication_stock'),
      (snapshot) => {
        const list: any[] = [];
        snapshot.forEach((docSnap) => {
          list.push({ id: docSnap.id, ...docSnap.data() });
        });
        setDbMeds(list);
      },
      (err) => console.warn("Failed to subscribe to medications in PharmacyView:", err)
    );

    return () => {
      unsubPharmacies();
      unsubMeds();
    };
  }, []);

  const allPharmacies = [...dbPharmacies, ...MOCK_PHARMACIES];

  const getSelectedPharmacyMeds = (): Medication[] => {
    if (!selectedPharmacy) return [];
    
    // Check if the selected pharmacy is a database pharmacy
    const isDbPharma = dbPharmacies.some(p => p.id === selectedPharmacy.id);
    if (isDbPharma) {
      return dbMeds
        .filter(m => m.pharmacistId === selectedPharmacy.id)
        .map(m => ({
          id: m.id,
          name: m.name,
          dci: m.genericName || '',
          price: m.sellingPrice || 0,
          category: m.therapeuticClass || '',
          image: m.image || 'https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=400&h=300&fit=crop',
          available: (m.stock || 0) > 0
        }));
    }
    
    return selectedPharmacy.meds || [];
  };

  const filteredMeds = getSelectedPharmacyMeds().filter(m => {
    const matchesSearch = m.name.toLowerCase().includes(search.toLowerCase()) || 
                         m.dci.toLowerCase().includes(search.toLowerCase());
    const matchesCategory = selectedCategory === 'Tous' || m.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);

  const handleUploadOrdonnance = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files?.length) return;
    
    setIsAnalyzing(true);
    setVerificationStatus(null);
    
    // Simulate Advanced Medical AI Analysis (OCR + Verification)
    setTimeout(() => {
      const extracted = [
        { name: 'Doliprane 1000mg', dosage: '1 comprimé 3x/jour' },
        { name: 'Spasfon Lyoc', dosage: 'En cas de crise' }
      ];
      setAnalyzedMeds(extracted);
      
      // AI Authenticity Check simulation
      setVerificationStatus({
        valid: true,
        confidence: 0.98,
        doctor: 'Dr. Jean Dupont (RPPS: 10101010101)',
        date: '20 Avril 2026'
      });
      
      const matches = allPharmacies.filter(pharma => {
        const isDbPharma = dbPharmacies.some(p => p.id === pharma.id);
        const medsOfPharma = isDbPharma
          ? dbMeds
              .filter(m => m.pharmacistId === pharma.id)
              .map(m => ({ name: m.name, available: (m.stock || 0) > 0 }))
          : pharma.meds.map(m => ({ name: m.name, available: m.available }));

        return extracted.every(med => 
          medsOfPharma.some(m => m.name === med.name && m.available)
        );
      });
      
      setMatchingPharmacies(matches);
      setIsAnalyzing(false);
      setView('results');
    }, 4000);
  };

  const handleCheckout = async () => {
    try {
      await addOrder({
        items: cart.map(item => ({
          id: item.id,
          name: item.name,
          price: item.price,
          count: 1,
          image: item.image
        })),
        total: cartTotal,
        mode: 'pickup',
        paymentMethod: 'Mobile Money',
        pharmacistId: selectedPharmacy?.id
      });
      setShowCheckoutSuccess(true);
      setCart([]);
      setIsCartOpen(false);
      setTimeout(() => setShowCheckoutSuccess(false), 5000);
    } catch (err) {
      console.error("Checkout failed:", err);
    }
  };

  const addToCart = (med: Medication) => {
    setCart([...cart, med]);
  };

  const removeFromCart = (idx: number) => {
    const newCart = [...cart];
    newCart.splice(idx, 1);
    setCart(newCart);
  };

  const cartTotal = cart.reduce((sum, item) => sum + item.price, 0);

  return (
    <div className="space-y-6 pb-12">
      <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-display font-bold text-slate-900 tracking-tight">Espace Pharmacie</h1>
          <nav className="flex items-center gap-2 text-sm text-slate-500 mt-1">
            <button 
              onClick={() => { setView('pharmacies'); setSelectedPharmacy(null); }} 
              className={cn("hover:text-brand-600 transition-colors", view === 'pharmacies' && "font-bold text-brand-600")}
            >
              Pharmacies de proximité
            </button>
            {selectedPharmacy && (
              <>
                <ChevronRight size={14} />
                <span className="font-bold text-slate-800">{selectedPharmacy.name}</span>
              </>
            )}
          </nav>
        </div>
        <div className="flex items-center gap-3 w-full md:w-auto">
          <div className="bg-white p-1 rounded-2xl flex border border-slate-100 shadow-sm flex-1 md:flex-none">
            <button 
              onClick={() => { setView(selectedPharmacy ? 'catalog' : 'pharmacies'); }}
              className={cn(
                "flex-1 md:px-4 py-2 rounded-xl text-sm font-bold transition-all text-center",
                view !== 'prescriptions' ? "bg-slate-900 text-white shadow-md shadow-slate-900/10" : "text-slate-500 hover:bg-slate-50"
              )}
            >
              Pharmacie
            </button>
            <button 
              onClick={() => setView('prescriptions')}
              className={cn(
                "flex-1 md:px-4 py-2 rounded-xl text-sm font-bold transition-all text-center",
                view === 'prescriptions' ? "bg-slate-900 text-white shadow-md shadow-slate-900/10" : "text-slate-500 hover:bg-slate-50"
              )}
            >
              Ordonnances
            </button>
          </div>
          <button 
            onClick={() => setIsCartOpen(true)}
            className="relative bg-white p-4 rounded-2xl border border-slate-100 shadow-sm hover:shadow-md transition-all active:scale-95"
          >
            <ShoppingCart size={20} className="text-slate-600" />
            {cart.length > 0 && (
              <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[10px] w-5 h-5 flex items-center justify-center rounded-full font-bold animate-in zoom-in">
                {cart.length}
              </span>
            )}
          </button>
        </div>
      </header>

      {/* Cart Drawer */}
      <AnimatePresence>
        {isCartOpen && (
          <>
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsCartOpen(false)}
              className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-[60]"
            />
            <motion.div 
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              className="fixed top-0 right-0 bottom-0 w-full max-w-md bg-white z-[70] shadow-2xl flex flex-col"
            >
              <div className="p-6 border-b border-slate-100 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <ShoppingCart className="text-brand-600" />
                  <h3 className="text-xl font-display font-bold">Votre Panier</h3>
                </div>
                <button onClick={() => setIsCartOpen(false)} className="p-2 hover:bg-slate-100 rounded-full transition-colors">
                  <Plus className="rotate-45" size={24} />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto p-6 space-y-4">
                {cart.length === 0 ? (
                  <div className="h-full flex flex-col items-center justify-center text-center space-y-4">
                    <div className="p-6 bg-slate-50 rounded-full text-slate-300">
                      <ShoppingCart size={48} />
                    </div>
                    <p className="text-slate-500 font-medium italic">Votre panier est vide</p>
                  </div>
                ) : (
                  cart.map((item, idx) => (
                    <div key={`${item.id}-${idx}`} className="flex gap-4 bg-slate-50 p-4 rounded-2xl border border-slate-100">
                      <img src={item.image} alt={item.name} className="w-16 h-16 rounded-xl object-cover" />
                      <div className="flex-1">
                        <h4 className="font-bold text-sm text-slate-800">{item.name}</h4>
                        <p className="text-[10px] text-slate-400 font-mono">{item.dci}</p>
                        <p className="text-sm font-bold text-brand-600 mt-1">{item.price.toFixed(2)} €</p>
                      </div>
                      <button 
                        onClick={() => removeFromCart(idx)}
                        className="text-red-400 hover:text-red-600 p-1"
                      >
                        <Plus className="rotate-45" size={18} />
                      </button>
                    </div>
                  ))
                )}
              </div>

              {cart.length > 0 && (
                <div className="p-6 border-t border-slate-100 bg-slate-50 space-y-4">
                  <div className="flex justify-between items-center text-lg font-bold">
                    <span>Total Estimé</span>
                    <span className="text-2xl font-display text-brand-600 tracking-tight">{cartTotal.toFixed(2)} €</span>
                  </div>
                  <button 
                    onClick={handleCheckout}
                    className="w-full bg-brand-600 text-white font-bold py-4 rounded-2xl shadow-lg shadow-brand-600/20 hover:scale-[1.02] active:scale-95 transition-all"
                  >
                    Procéder au Paiement
                  </button>
                </div>
              )}
            </motion.div>
          </>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showCheckoutSuccess && (
          <motion.div 
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 50 }}
            className="fixed bottom-10 left-1/2 -translate-x-1/2 z-[100] bg-emerald-600 text-white px-8 py-4 rounded-2xl shadow-2xl flex items-center gap-4"
          >
            <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center">
               <span className="text-xl">✅</span>
            </div>
            <div>
               <p className="font-bold">Commande confirmée !</p>
               <p className="text-xs opacity-80">Votre pharmacien prépare vos articles.</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence mode="wait">
        {view === 'pharmacies' && (
          <motion.div 
            key="pharmacy-grid"
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.98 }}
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8"
          >
            {allPharmacies.map((pharmacy) => (
              <motion.div 
                key={pharmacy.id}
                whileHover={{ y: -5 }}
                onClick={() => { setSelectedPharmacy(pharmacy); setView('catalog'); }}
                className="bg-white rounded-[2rem] overflow-hidden shadow-sm border border-slate-100 cursor-pointer group hover:shadow-xl transition-all"
              >
                <div className="h-44 relative">
                  <img src={pharmacy.image} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                  <div className="absolute top-4 left-4 bg-white/90 backdrop-blur px-3 py-1 rounded-full text-[10px] font-bold text-slate-800 shadow-sm">
                    {pharmacy.distance}
                  </div>
                </div>
                <div className="p-6 space-y-4">
                  <div>
                    <div className="flex justify-between items-start mb-1">
                      <h3 className="text-xl font-display font-bold text-slate-900 group-hover:text-brand-600 transition-colors line-clamp-1">{pharmacy.name}</h3>
                      <div className="flex items-center gap-1 text-orange-400">
                         <StarIcon size={14} fill="currentColor" />
                         <span className="text-sm font-bold text-slate-700">{pharmacy.rating}</span>
                      </div>
                    </div>
                    <p className="text-sm text-slate-400 italic line-clamp-1">{pharmacy.address}</p>
                  </div>
                  <div className="flex items-center justify-between">
                     <div className="flex items-center gap-2">
                        <div className={cn("w-2 h-2 rounded-full", pharmacy.isOpen ? "bg-emerald-500" : "bg-red-400")} />
                        <span className="text-xs font-bold text-slate-500 uppercase tracking-widest">{pharmacy.isOpen ? 'Ouvert' : 'Fermé'}</span>
                     </div>
                     <div className="flex items-center gap-1 text-brand-600 text-sm font-bold">
                        Vérifier le stock
                        <ChevronRight size={16} />
                     </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </motion.div>
        )}

        {view === 'catalog' && selectedPharmacy && (
          <motion.div 
            key="selected-pharmacy-catalog"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="grid grid-cols-1 lg:grid-cols-4 gap-8"
          >
            {/* Sidebar / Info */}
            <aside className="lg:col-span-1 space-y-6">
              <div className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm space-y-6">
                <div className="flex flex-col items-center text-center">
                   <img src={selectedPharmacy.image} className="w-24 h-24 rounded-2xl object-cover mb-4" />
                   <h2 className="font-display font-bold text-lg leading-tight">{selectedPharmacy.name}</h2>
                   <p className="text-xs text-slate-400 mt-1">{selectedPharmacy.address}</p>
                </div>

                <div className="space-y-4 pt-4 border-t border-slate-50">
                  <div className="flex items-center gap-3 text-sm font-medium text-slate-600">
                    <div className="p-2 bg-slate-50 rounded-xl text-brand-600"><PhoneCall size={16} /></div>
                    Appeler l'établissement
                  </div>
                  <div className="flex items-center gap-3 text-sm font-medium text-slate-600">
                    <div className="p-2 bg-slate-50 rounded-xl text-brand-600"><MapPin size={16} /></div>
                    Itinéraire GPS
                  </div>
                </div>

                <div className="pt-4 border-t border-slate-50">
                  <h3 className="text-xs font-bold text-slate-400 mb-4 uppercase tracking-widest hidden lg:block">Rayons</h3>
                  <div className="flex lg:flex-col gap-2 overflow-x-auto lg:overflow-visible pb-2 lg:pb-0 no-scrollbar -mx-2 px-2 lg:mx-0 lg:px-0">
                    {MED_CATEGORIES.map(cat => (
                      <button 
                        key={cat} 
                        onClick={() => setSelectedCategory(cat)}
                        className={cn(
                          "whitespace-nowrap px-4 py-2 rounded-xl text-xs sm:text-sm font-medium transition-all shadow-sm lg:shadow-none border lg:border-none",
                          selectedCategory === cat 
                            ? "bg-brand-600 text-white font-bold lg:bg-brand-50 lg:text-brand-600" 
                            : "bg-white text-slate-500 hover:bg-slate-50 hover:text-brand-600 border-slate-100 lg:bg-transparent"
                        )}
                      >
                        {cat}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </aside>

            {/* Meds Grid */}
            <div className="lg:col-span-3 space-y-6">
              <div className="relative">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                <input 
                  type="text" 
                  placeholder="Rechercher un médicament dans cette pharmacie..." 
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-full bg-white border border-slate-100 rounded-2xl py-4 pl-12 pr-4 focus:ring-4 focus:ring-brand-600/10 focus:border-brand-600 outline-none transition-all font-medium"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6">
                {filteredMeds.map((med) => (
                  <motion.div 
                    key={med.id}
                    layout
                    className="bg-white rounded-3xl p-6 border border-slate-100 shadow-sm hover:shadow-xl transition-all group"
                  >
                    <div className="relative mb-6">
                      <img src={med.image} alt={med.name} className="w-full h-40 object-cover rounded-2xl group-hover:scale-105 transition-transform" />
                      {!med.available && (
                        <div className="absolute inset-0 bg-white/60 backdrop-blur-[2px] rounded-2xl flex items-center justify-center">
                          <span className="bg-slate-900 text-white px-4 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest">Épuisé</span>
                        </div>
                      )}
                    </div>
                    <div className="space-y-1">
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{med.category}</p>
                      <h4 className="text-lg font-display font-bold text-slate-900">{med.name}</h4>
                      <p className="text-xs font-mono text-slate-400 italic mb-4">{med.dci}</p>
                    </div>
                    <div className="flex items-center justify-between mt-6">
                      <span className="text-xl font-display font-bold text-brand-600">{med.price.toFixed(2)} €</span>
                      <button 
                        disabled={!med.available}
                        onClick={() => addToCart(med)}
                        className={cn(
                          "w-12 h-12 rounded-2xl flex items-center justify-center shadow-lg transition-all active:scale-95 disabled:opacity-50 disabled:shadow-none",
                          med.available ? "bg-slate-900 text-white shadow-slate-900/20 hover:bg-brand-600" : "bg-slate-100 text-slate-300"
                        )}
                      >
                        <Plus size={24} />
                      </button>
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>
          </motion.div>
        )}

        {view === 'prescriptions' && (
          <motion.div 
            key="prescriptions-view"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="flex flex-col items-center justify-center max-w-2xl mx-auto py-12 text-center space-y-8"
          >
            {isAnalyzing ? (
              <div className="space-y-6">
                <div className="relative w-32 h-32 mx-auto">
                   <div className="absolute inset-0 border-4 border-slate-100 rounded-[2rem]" />
                   <motion.div 
                    animate={{ top: ['0%', '90%', '0%'] }}
                    transition={{ repeat: Infinity, duration: 2, ease: "linear" }}
                    className="absolute w-full h-1 bg-brand-600 z-10 shadow-[0_0_15px_rgba(16,185,129,0.5)]" 
                   />
                   <div className="absolute inset-0 flex items-center justify-center">
                      <FileText size={48} className="text-slate-300" />
                   </div>
                </div>
                <div className="space-y-2">
                  <h3 className="text-xl font-display font-bold text-brand-600">Analyse de l'ordonnance...</h3>
                  <p className="text-sm text-slate-400">Identification des molécules et vérification des stocks</p>
                </div>
              </div>
            ) : (
              <>
                <div className="w-24 h-24 bg-brand-50 rounded-[2rem] flex items-center justify-center text-brand-600">
                  <Camera size={48} />
                </div>
                <div className="space-y-3">
                  <h2 className="text-3xl font-display font-bold text-slate-900">Préparation d'Ordonnance</h2>
                  <p className="text-slate-500">Envoyez une photo de votre ordonnance. Un pharmacien certifié préparera votre commande pour un retrait prioritaire.</p>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 w-full px-4">
                  <input 
                    type="file" 
                    ref={fileInputRef} 
                    className="hidden" 
                    accept=".pdf,image/*" 
                    onChange={handleUploadOrdonnance}
                  />
                  <input 
                    type="file" 
                    ref={cameraInputRef} 
                    className="hidden" 
                    accept="image/*" 
                    capture="environment" 
                    onChange={handleUploadOrdonnance}
                  />
                  <button 
                    onClick={() => fileInputRef.current?.click()}
                    className="p-8 bg-white border-2 border-dashed border-slate-200 rounded-[2rem] flex flex-col items-center gap-3 hover:border-brand-600 group transition-all"
                  >
                    <Upload size={32} className="text-slate-300 group-hover:text-brand-600 transition-colors" />
                    <span className="font-bold text-slate-700">Charger un document</span>
                  </button>
                  <button 
                    onClick={() => cameraInputRef.current?.click()}
                    className="p-8 bg-brand-600 text-white rounded-[2rem] flex flex-col items-center gap-3 shadow-xl shadow-brand-600/20 hover:bg-brand-700 transition-all"
                  >
                    <Camera size={32} />
                    <span className="font-bold">Utiliser l'appareil</span>
                  </button>
                </div>
              </>
            )}
            
            <div className="w-full bg-slate-100 p-6 rounded-[2rem] text-left">
              <div className="flex items-center gap-2 mb-4">
                 <Clock size={16} className="text-slate-400" />
                 <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">Dernières ordonnances</span>
              </div>
              <div className="space-y-3">
                 {[
                   { date: '22 Fév 2026', pharma: 'Pharma Pasteur', status: 'validée' },
                   { date: '12 Jan 2026', pharma: 'Pharma Royale', status: 'expirée' }
                 ].map((pres, i) => (
                   <div key={i} className="bg-white p-4 rounded-2xl flex items-center justify-between border border-slate-200/50">
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-slate-50 rounded-xl"><FileText size={20} className="text-slate-400" /></div>
                        <div>
                          <p className="font-bold text-slate-800 text-sm">Ordonnance du {pres.date}</p>
                          <p className="text-xs text-slate-400">{pres.pharma}</p>
                        </div>
                      </div>
                      <span className={cn(
                        "text-[10px] font-bold uppercase tracking-widest px-2 py-1 rounded-full",
                        pres.status === 'validée' ? "bg-emerald-50 text-emerald-600" : "bg-slate-100 text-slate-400"
                      )}>{pres.status}</span>
                   </div>
                 ))}
              </div>
            </div>
          </motion.div>
        )}
        {view === 'results' && (
          <motion.div 
            key="results-view"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-8"
          >
            <div className="bg-slate-900 text-white p-8 rounded-[2.5rem] shadow-xl relative overflow-hidden">
               {/* Background AI Grid Decor */}
               <div className="absolute inset-0 opacity-10 pointer-events-none" style={{ backgroundImage: 'radial-gradient(#ffffff 1px, transparent 1px)', backgroundSize: '20px 20px' }} />
               
               <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
                 <div className="space-y-4">
                    <div className="flex items-center gap-3">
                       <div className="w-12 h-12 bg-emerald-500 rounded-2xl flex items-center justify-center shadow-lg shadow-emerald-500/20">
                          <FileText size={24} />
                       </div>
                       <div>
                          <h2 className="text-2xl font-display font-bold">Analyse IA Préliminaire</h2>
                          <p className="text-emerald-400 text-xs font-bold uppercase tracking-widest flex items-center gap-2">
                             <span className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse" />
                             Aide au diagnostic • En attente de validation médicale (Care IA)
                          </p>
                       </div>
                    </div>
                    
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                       {analyzedMeds.map(m => (
                         <div key={m.name} className="bg-white/10 backdrop-blur-md px-4 py-3 rounded-2xl border border-white/10">
                            <p className="text-xs font-bold text-emerald-400 uppercase tracking-tighter">Médicament Détecté</p>
                            <p className="font-bold">{m.name}</p>
                            <p className="text-[10px] opacity-60 italic">{m.dosage}</p>
                         </div>
                       ))}
                    </div>
                 </div>

                 {verificationStatus && (
                   <div className="bg-white/5 border border-white/10 p-6 rounded-3xl backdrop-blur-xl w-full md:w-auto">
                      <div className="flex items-center gap-3 mb-4">
                         <div className="w-10 h-10 bg-brand-600 rounded-xl flex items-center justify-center font-bold">AI</div>
                         <div>
                            <p className="text-[10px] font-bold text-slate-400 uppercase">Score de Confiance</p>
                            <p className="font-display font-bold text-xl">{(verificationStatus.confidence * 100).toFixed(0)}%</p>
                         </div>
                      </div>
                      <div className="space-y-2 text-xs">
                         <p className="flex justify-between gap-8"><span className="opacity-50">Médecin:</span> <span>{verificationStatus.doctor}</span></p>
                         <p className="flex justify-between gap-8"><span className="opacity-50">Date:</span> <span>{verificationStatus.date}</span></p>
                      </div>
                   </div>
                 )}
               </div>
            </div>

            <div className="space-y-6">
              <div className="flex items-center justify-between px-2">
                <h3 className="text-xl font-display font-bold text-slate-900">Pharmacies disposant du stock complet</h3>
                <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">{matchingPharmacies.length} établissements trouvés</span>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {matchingPharmacies.map(pharma => (
                  <div key={pharma.id} className="bg-white rounded-[2rem] p-6 border border-slate-100 shadow-sm hover:shadow-xl transition-all group flex flex-col">
                     <div className="flex justify-between items-start mb-6">
                        <div className="relative">
                          <img src={pharma.image} className="w-20 h-20 rounded-2xl object-cover shadow-md" />
                          <div className="absolute -bottom-2 -right-2 bg-emerald-500 text-white p-1.5 rounded-lg shadow-lg">
                             <Plus size={14} className="rotate-45" />
                          </div>
                        </div>
                        <div className="text-right">
                           <p className="text-2xl font-display font-bold text-slate-900 tracking-tight">
                             {analyzedMeds.reduce((sum, med) => {
                               const foundMed = pharma.meds.find(m => m.name === med.name);
                               return sum + (foundMed ? foundMed.price : 0);
                             }, 0).toFixed(2)} €
                           </p>
                           <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-1">Total Panier</p>
                        </div>
                     </div>
                     
                     <div className="flex-1">
                        <h4 className="font-display font-bold text-xl text-slate-900 mb-1">{pharma.name}</h4>
                        <div className="flex items-center gap-2 text-xs text-slate-400 mb-4">
                           <MapPin size={12} />
                           {pharma.address} • {pharma.distance}
                        </div>
                        
                        <div className="space-y-2 mb-6">
                           {analyzedMeds.map(med => {
                             const foundMed = pharma.meds.find(m => m.name === med.name);
                             return (
                               <div key={med.name} className="flex items-center justify-between p-2 bg-slate-50 rounded-xl text-[11px]">
                                  <span className="font-medium text-slate-700">{med.name}</span>
                                  <span className="font-bold text-emerald-600">Disponible • {foundMed?.price.toFixed(2)}€</span>
                               </div>
                             );
                           })}
                        </div>
                     </div>
                     
                     <button 
                      onClick={() => {
                        const medsToAdd = pharma.meds.filter(m => analyzedMeds.some(am => am.name === m.name));
                        setCart([...cart, ...medsToAdd]);
                        setSelectedPharmacy(pharma);
                        setView('catalog');
                        setIsCartOpen(true);
                      }}
                      className="w-full bg-slate-900 text-white py-4 rounded-2xl font-bold shadow-lg shadow-slate-900/10 hover:bg-brand-600 active:scale-95 transition-all flex items-center justify-center gap-3"
                     >
                       <ShoppingCart size={18} />
                       Commander l'ordonnance
                     </button>
                  </div>
                ))}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

