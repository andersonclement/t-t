import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Building2, 
  Hospital, 
  Microscope, 
  Pill, 
  Search, 
  MapPin, 
  Star as StarIcon, 
  Clock, 
  ChevronRight, 
  PhoneCall, 
  Plus, 
  Minus,
  Trash2,
  ShoppingCart, 
  Camera, 
  Upload, 
  FileText,
  ShieldCheck,
  Calendar,
  ArrowRight,
  Leaf,
  ArrowUpDown,
  Filter,
  Navigation,
  Activity,
  CheckCircle2,
  CreditCard as CreditCardIcon,
  Mail,
  Users,
  Check,
  X
} from 'lucide-react';
import { cn } from '../lib/utils';
import { useOrders } from '../components/OrderContext';
import { db } from '../lib/firebase';
import { collection, query, onSnapshot, where } from 'firebase/firestore';

// --- TYPES & MOCK DATA ---

interface Medication {
  id: string;
  name: string;
  dci: string;
  price: number;
  category: string;
  image: string;
  available: boolean;
  requiresPrescription?: boolean;
  stock?: number;
}

interface DirectoryActor {
  id: string;
  name: string;
  type: 'pharmacy' | 'laboratory' | 'hospital' | 'clinic' | 'natural';
  address: string;
  distance: string;
  rating: number;
  isOpen: boolean;
  image: string;
  services?: MedicalService[];
  meds?: Medication[];
  specialties?: string[];
  description?: string; // For recipes/natural products
  author?: string;
  category?: string;
  ingredients?: string[];
  preparation?: string[];
  posologie?: string;
  price?: number; // Price for the ingredient pack
  isDuty?: boolean; // On-duty/Garde field
  
  // Establishment Details
  onpcNumber?: string;
  legalLicenseNumber?: string;
  pharmacistsCount?: number;
  coldChainEquipment?: string;
  temperatureMonitor?: boolean;
  backupGenerator?: string;
  airConditioned?: boolean;
  narcoticsSafe?: boolean;
  fireExtinguisher?: boolean;
  wasteProtocol?: boolean;
  phone?: string;
  email?: string;
  hours?: string;
  pharmacistName?: string;
}

interface MedicalService {
  id: string;
  name: string;
  price: number;
  category: string;
}

const MOCK_MEDS: Medication[] = [
  { id: '1', name: 'Doliprane 1000mg', dci: 'Paracétamol', price: 1500, available: true, image: 'https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=200&h=200&fit=crop', category: 'Douleur & Fièvre' },
  { id: '2', name: 'Spasfon Lyoc', dci: 'Phloroglucinol', price: 3500, available: true, image: 'https://images.unsplash.com/photo-1471864190281-ad5fe9bb0724?w=200&h=200&fit=crop', category: 'Douleur Abdominale' },
  { id: '3', name: 'Gaviscon Pro', dci: 'Alginate de sodium', price: 4200, available: true, image: 'https://images.unsplash.com/photo-1550572017-ed20015a0b79?w=200&h=200&fit=crop', category: 'Estomac' },
];

const MOCK_RECIPES: Partial<DirectoryActor>[] = [
  { 
    id: 'R1', 
    name: 'Infusion de Neem & Artémisia', 
    type: 'natural',
    description: 'Renfort immunitaire traditionnel utilisé pour son action purifiante et protectrice.',
    author: 'Mama Africa',
    image: 'https://images.unsplash.com/photo-1544733422-251e533ca97c?w=400&h=300&fit=crop',
    rating: 4.9,
    category: 'Immunité',
    address: 'Savoir Ancestral - Cameroun',
    ingredients: ['Feuilles de Neem séchées', 'Tiges d\'Artémisia Annua', 'Écorce de Cannelle', 'Miel de forêt'],
    preparation: [
      'Faire bouillir 1 litre d\'eau de source.',
      'Ajouter une poignée de feuilles de Neem et 2 tiges d\'Artémisia.',
      'Laisser infuser pendant 10 minutes à couvert.',
      'Filtrer et ajouter une cuillère de miel pour adoucir.'
    ],
    posologie: 'Boire une tasse tiède le matin à jeun pendant 7 jours.',
    price: 5000
  },
  { 
    id: 'R2', 
    name: 'Sirop de Gingembre et Miel', 
    type: 'natural',
    description: 'Remède naturel puissant contre la toux sèche et les irritations de la gorge.',
    author: 'Chef Herboriste',
    image: 'https://images.unsplash.com/photo-1596464716127-f2a82984de30?w=400&h=300&fit=crop',
    rating: 4.7,
    category: 'Respiratoire',
    address: 'Herboristerie Traditionnelle - Douala',
    ingredients: ['Gingembre frais râpé', 'Miel d\'acacia pur', 'Jus de citron jaune', 'Clous de girofle'],
    preparation: [
      'Extraire le jus du gingembre râpé.',
      'Mélanger à parts égales avec le miel.',
      'Ajouter le jus de citron et les clous de girofle écrasés.',
      'Laisser reposer 24h avant la première utilisation.'
    ],
    posologie: 'Une cuillère à soupe 3 fois par jour jusqu\'à apaisement.',
    price: 3500
  },
];

const MOCK_ACTORS: DirectoryActor[] = [
  // ... existing actors ...
  ...MOCK_RECIPES.map(r => ({
    ...r,
    distance: 'Numérique',
    isOpen: true,
  } as DirectoryActor)),
  // PHARMACIES
  {
    id: 'P1',
    name: 'Pharmacie de la Paix',
    type: 'pharmacy',
    address: 'Avenue de la Liberté, Akwa, Douala',
    distance: '450m',
    rating: 4.8,
    isOpen: true,
    isDuty: true,
    image: 'https://images.unsplash.com/photo-1631549916768-4119b2e55916?w=400&h=300&fit=crop',
    meds: MOCK_MEDS
  },
  {
    id: 'P2',
    name: 'Pharmacie des Nations',
    type: 'pharmacy',
    address: 'Boulevard du 20 Mai, Yaoundé',
    distance: '1.2 km',
    rating: 4.5,
    isOpen: true,
    isDuty: false,
    image: 'https://images.unsplash.com/photo-1586015555751-63bb77f4322a?w=400&h=300&fit=crop',
    meds: MOCK_MEDS.map(m => ({ ...m, price: m.price * 1.1 }))
  },
  // LABORATORIES
  {
    id: 'L1',
    name: 'Laboratoire Central',
    type: 'laboratory',
    address: 'Rue de la Clinique, Bonapriso, Douala',
    distance: '0.8 km',
    rating: 4.8,
    isOpen: true,
    isDuty: false,
    image: 'https://images.unsplash.com/photo-1579154235602-3c58d04f2162?w=400&h=300&fit=crop',
    services: [
      { id: 's1', name: 'Bilan Sanguin Complet', price: 15000, category: 'Analyse' },
      { id: 's2', name: 'Test Paludisme / Typhoïde', price: 5000, category: 'Dépistage' },
      { id: 's3', name: 'Glycémie à jeun', price: 2500, category: 'Analyse' }
    ]
  },
  // HOSPITALS
  {
    id: 'H1',
    name: 'Hôpital Général de Douala',
    type: 'hospital',
    address: 'Quartier Ngodi, Douala',
    distance: '2.4 km',
    rating: 4.6,
    isOpen: true,
    isDuty: true,
    image: 'https://images.unsplash.com/photo-1587350859728-117699f4a742?w=400&h=300&fit=crop',
    specialties: ['Urgences', 'Chirurgie', 'Maternité', 'Cardiologie'],
    services: [
      { id: 'h1s1', name: 'Consultation Spécialisée', price: 10000, category: 'Consultation' },
      { id: 'h1s2', name: 'Échographie', price: 25000, category: 'Imagerie' },
      { id: 'h1s3', name: 'ECG', price: 15000, category: 'Examen' }
    ]
  },
  {
    id: 'H2',
    name: 'Hôpital de Référence Yaoundé',
    type: 'hospital',
    address: 'Messa, Yaoundé',
    distance: '3.1 km',
    rating: 4.4,
    isOpen: true,
    isDuty: true,
    image: 'https://images.unsplash.com/photo-1519494026892-80bbd2d6fd0d?w=400&h=300&fit=crop',
    specialties: ['Urgences', 'Cancérologie', 'Ophtalmologie'],
    services: [
      { id: 'h2s1', name: 'Scanner', price: 65000, category: 'Imagerie' },
      { id: 'h2s2', name: 'Bilan de santé', price: 45000, category: 'Imagerie' }
    ]
  },
  // CLINICS
  {
    id: 'C1',
    name: 'Clinique de l\'Espoir',
    type: 'clinic',
    address: 'Rue de l\'Espérance, Deido, Douala',
    distance: '0.9 km',
    rating: 4.9,
    isOpen: true,
    isDuty: false,
    image: 'https://images.unsplash.com/photo-1629909613654-28e377c37b09?w=400&h=300&fit=crop',
    specialties: ['Esthétique', 'Dermatologie', 'Pédiatrie'],
    services: [
      { id: 'c1s1', name: 'Consultation Pédiatrique', price: 7500, category: 'Consultation' },
      { id: 'c1s2', name: 'Vaccination', price: 5000, category: 'Soin' },
      { id: 'c1s3', name: 'Massage Thérapeutique', price: 15000, category: 'Bien-être' }
    ]
  }
];

export function Directory() {
  const { addOrder } = useOrders();
  const [activeCategory, setActiveCategory] = useState<'all' | 'hospital' | 'clinic' | 'laboratory' | 'pharmacy' | 'natural'>('all');
  const [view, setView] = useState<'list' | 'pharmacy-catalog' | 'lab-catalog' | 'clinic-catalog' | 'hospital-catalog' | 'natural-catalog' | 'prescriptions' | 'results'>('list');
  const [selectedActor, setSelectedActor] = useState<DirectoryActor | null>(null);
  const [search, setSearch] = useState('');
  const [onlyDuty, setOnlyDuty] = useState(false);
  const [activeRouteActor, setActiveRouteActor] = useState<DirectoryActor | null>(null);
  
  // Real-time stock from database
  const [dbMeds, setDbMeds] = useState<Medication[]>([]);

  useEffect(() => {
    const q = query(collection(db, 'medication_stock'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const items: Medication[] = [];
      snapshot.forEach((docSnap) => {
        const data = docSnap.data();
        items.push({
          id: docSnap.id,
          name: data.name,
          dci: data.genericName || '',
          price: data.sellingPrice || 0,
          category: data.therapeuticClass || '',
          image: data.image || 'https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=400&h=300&fit=crop',
          available: (data.stock || 0) > 0,
          requiresPrescription: !!data.requiresPrescription,
          stock: data.stock || 0
        });
      });
      if (items.length > 0) {
        setDbMeds(items);
      } else {
        // Localstorage fallback
        try {
          const stored = localStorage.getItem('medimap_meds_stock');
          if (stored) {
            const localMeds = JSON.parse(stored).map((m: any) => ({
              id: m.id,
              name: m.name,
              dci: m.genericName || '',
              price: m.sellingPrice || 0,
              category: m.therapeuticClass || '',
              image: 'https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=400&h=300&fit=crop',
              available: m.stock > 0,
              requiresPrescription: !!m.requiresPrescription,
              stock: m.stock
            }));
            setDbMeds(localMeds);
          }
        } catch (err) {
          console.warn("Failed to load local storage meds in patient view:", err);
        }
      }
    }, (error) => {
      console.error("Error listening to database meds:", error);
    });
    return () => unsubscribe();
  }, []);

  const [dbActors, setDbActors] = useState<DirectoryActor[]>([]);

  useEffect(() => {
    const unsubscribe = onSnapshot(query(collection(db, 'users'), where('role', '==', 'pharmacist')), (snapshot) => {
      const list: DirectoryActor[] = [];
      snapshot.forEach((docSnap) => {
        const data = docSnap.data();
        list.push({
            id: docSnap.id,
            name: data.pharmacyName || data.displayName || 'Pharmacie du Centre',
            type: 'pharmacy',
            address: data.pharmacyAddress || data.address || 'Douala, Cameroun',
            distance: 'Connecté',
            rating: 5.0,
            isOpen: true,
            isDuty: !!data.isDuty,
            image: data.pharmacyImage || 'https://images.unsplash.com/photo-1631549916768-4119b2e55916?w=400&h=300&fit=crop',
            meds: MOCK_MEDS,
            services: [
              { id: 'ds1', name: 'Dispensation de médicaments', price: 0, category: 'Service' },
              { id: 'ds2', name: 'Conseil thérapeutique', price: 0, category: 'Conseil' }
            ],
            // Establishment details provided at creation/onboarding
            onpcNumber: data.technicalForm?.onpcNumber || data.onpcNumber || '',
            legalLicenseNumber: data.technicalForm?.legalLicenseNumber || data.legalLicenseNumber || '',
            pharmacistsCount: data.technicalForm?.pharmacistsCount || data.pharmacistsCount || 1,
            coldChainEquipment: data.technicalForm?.coldChainEquipment || data.coldChainEquipment || '',
            temperatureMonitor: data.technicalForm?.temperatureMonitor ?? data.temperatureMonitor ?? true,
            backupGenerator: data.technicalForm?.backupGenerator || data.backupGenerator || '',
            airConditioned: data.technicalForm?.airConditioned ?? data.airConditioned ?? true,
            narcoticsSafe: data.technicalForm?.narcoticsSafe ?? data.narcoticsSafe ?? true,
            fireExtinguisher: data.technicalForm?.fireExtinguisher ?? data.fireExtinguisher ?? true,
            wasteProtocol: data.technicalForm?.wasteProtocol ?? data.wasteProtocol ?? true,
            phone: data.pharmacyPhone || data.phone || '',
            email: data.pharmacyEmail || data.email || '',
            hours: data.pharmacyHours || 'Non renseigné (24h/24 par défaut)',
            pharmacistName: data.displayName || 'Pharmacien Agréé',
          });
      });
      setDbActors(list);
    }, (error) => {
      console.error("Error listening to database pharmacists:", error);
    });
    return () => unsubscribe();
  }, []);

  const getActorMeds = (actor: DirectoryActor | null): Medication[] => {
    if (!actor) return [];
    if (actor.type === 'pharmacy' && dbMeds.length > 0) {
      return dbMeds;
    }
    return actor.meds || [];
  };
  
  // Cart for meds and services
  const [cart, setCart] = useState<{id: string, name: string, price: number, image?: string, count: number}[]>([]);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analyzedMeds, setAnalyzedMeds] = useState<{ name: string; dosage: string }[]>([]);
  const [verificationStatus, setVerificationStatus] = useState<{valid: boolean; confidence: number; doctor?: string; date?: string} | null>(null);
  const [matchingPharmacies, setMatchingPharmacies] = useState<DirectoryActor[]>([]);
  const [sortBy, setSortBy] = useState<'price' | 'distance' | 'rating'>('price');

  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);

  const allActors = [...dbActors, ...MOCK_ACTORS];

  const filteredActors = allActors.filter(actor => {
    const matchesCat = activeCategory === 'all' || actor.type === activeCategory;
    const matchesSearch = actor.name.toLowerCase().includes(search.toLowerCase()) || actor.address.toLowerCase().includes(search.toLowerCase());
    const matchesDuty = !onlyDuty || actor.isDuty === true;
    return matchesCat && matchesSearch && matchesDuty;
  });

  const handleUploadOrdonnance = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files?.length) return;
    setIsAnalyzing(true);
    setVerificationStatus(null);
    setTimeout(() => {
      const extracted = [
        { name: 'Doliprane 1000mg', dosage: '1 comprimé 3x/jour' },
        { name: 'Spasfon Lyoc', dosage: 'En cas de crise' }
      ];
      setAnalyzedMeds(extracted);
      setVerificationStatus({ valid: true, confidence: 0.98, doctor: 'Dr. Jean Dupont', date: '20 Avril 2026' });
      const matches = allActors.filter(a => a.type === 'pharmacy').filter(pharma => {
        const meds = getActorMeds(pharma);
        return extracted.every(med => meds.some(m => m.name.toLowerCase().includes(med.name.toLowerCase()) && m.available));
      });
      setMatchingPharmacies(matches);
      setIsAnalyzing(false);
      setView('results');
    }, 3000);
  };

  const getSortedPharmacies = () => {
    return [...matchingPharmacies].sort((a, b) => {
      if (sortBy === 'price') {
        const priceA = analyzedMeds.reduce((sum, med) => {
          const meds = getActorMeds(a);
          const m = meds.find(pm => pm.name.toLowerCase().includes(med.name.toLowerCase()));
          return sum + (m?.price || 0);
        }, 0);
        const priceB = analyzedMeds.reduce((sum, med) => {
          const meds = getActorMeds(b);
          const m = meds.find(pm => pm.name.toLowerCase().includes(med.name.toLowerCase()));
          return sum + (m?.price || 0);
        }, 0);
        return priceA - priceB;
      }
      if (sortBy === 'distance') {
        const distA = parseFloat(a.distance);
        const distB = parseFloat(b.distance);
        return distA - distB;
      }
      return b.rating - a.rating;
    });
  };

  const handleActorClick = (actor: DirectoryActor) => {
    setSelectedActor(actor);
    if (actor.type === 'pharmacy') setView('pharmacy-catalog');
    else if (actor.type === 'laboratory') setView('lab-catalog');
    else if (actor.type === 'hospital') setView('hospital-catalog');
    else if (actor.type === 'clinic') setView('clinic-catalog');
    else if (actor.type === 'natural') setView('natural-catalog');
    else setView('list');
  };

  const addToCart = (item: {id: string, name: string, price: number, image?: string, requiresPrescription?: boolean}) => {
    setCart(prev => {
      const existing = prev.find(i => i.id === item.id);
      if (existing) return prev.map(i => i.id === item.id ? { ...i, count: i.count + 1 } : i);
      return [...prev, { ...item, count: 1 }];
    });
  };

  const removeFromCart = (id: string) => {
    setCart(prev => prev.filter(i => i.id !== id));
  };

  const updateCartCount = (id: string, delta: number) => {
    setCart(prev => prev.map(item => {
      if (item.id === id) {
        const newCount = Math.max(1, item.count + delta);
        return { ...item, count: newCount };
      }
      return item;
    }));
  };

  const handleCheckout = (paymentMethod: string) => {
    const total = cart.reduce((sum, item) => sum + item.price * item.count, 0);
    addOrder({
      items: cart,
      total,
      paymentMethod,
      mode: 'pickup'
    });
    setCart([]);
    setIsCartOpen(false);
  };

  return (
    <div className="space-y-6">
      <header className="space-y-6">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
          <div className="space-y-1">
            <h1 className="text-3xl md:text-4xl font-display font-bold text-slate-900 tracking-tight flex items-center gap-3">
              <div className="w-2 h-10 bg-brand-600 rounded-full" />
              Répertoire Santé
            </h1>
            <p className="text-slate-500 font-medium">Accédez aux meilleurs établissements du Cameroun.</p>
          </div>
          <div className="flex items-center gap-3 w-full md:w-auto">
            <button 
              onClick={() => setView('prescriptions')}
              className="flex-1 md:flex-none bg-slate-900 text-white px-6 py-3.5 rounded-2xl text-sm font-bold flex items-center justify-center gap-2 shadow-xl shadow-slate-900/20 active:scale-95 transition-all"
            >
              <Camera size={18} />
              <span>Ordonnance</span>
            </button>
            <button 
              onClick={() => setIsCartOpen(true)}
              className="relative bg-white p-3.5 rounded-2xl border border-slate-200 text-slate-600 hover:bg-slate-50 shadow-sm transition-all active:scale-90"
            >
              <ShoppingCart size={22} />
              {cart.length > 0 && (
                <span className="absolute -top-1 -right-1 bg-red-600 text-white text-[10px] w-5 h-5 flex items-center justify-center rounded-full font-black ring-4 ring-white">
                  {cart.length}
                </span>
              )}
            </button>
          </div>
        </div>

        {/* Search & Categories Bar combined for cleaner look */}
        <div className="bg-white p-2 rounded-[2rem] border border-slate-100 shadow-xl shadow-slate-200/50 space-y-2">
          <div className="relative">
            <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
            <input 
              type="text" 
              placeholder="Rechercher une pharmacie, un laboratoire, un hôpital..." 
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full bg-slate-50/50 border-none rounded-[1.5rem] py-4 pl-14 pr-4 focus:ring-0 outline-none transition-all font-medium text-slate-900 placeholder:text-slate-400"
            />
          </div>
          
          <div className="flex items-center gap-2 overflow-x-auto no-scrollbar px-2 pb-2">
            <CategoryTab active={activeCategory === 'all'} onClick={() => setActiveCategory('all')} icon={<Building2 size={16} />} label="Tous" />
            <div className="w-px h-10 bg-slate-100 mx-1 shrink-0" />
            
            {/* Garde / On-Duty toggle button */}
            <button 
              onClick={() => setOnlyDuty(!onlyDuty)}
              className={cn(
                "flex items-center gap-2 px-4 py-2.5 rounded-2xl text-xs md:text-sm font-bold transition-all whitespace-nowrap border",
                onlyDuty 
                  ? "bg-red-600 text-white border-transparent shadow-lg shadow-red-600/20" 
                  : "bg-red-50 text-red-600 border-red-100 hover:bg-red-100/50"
              )}
            >
              <Clock size={16} className={cn(onlyDuty && "animate-pulse")} />
              <span>Garde 24h/24</span>
            </button>

            <div className="w-px h-10 bg-slate-100 mx-1 shrink-0" />
            <CategoryTab active={activeCategory === 'pharmacy'} onClick={() => setActiveCategory('pharmacy')} icon={<Pill size={16} />} label="Pharmacies" />
            <CategoryTab active={activeCategory === 'hospital'} onClick={() => setActiveCategory('hospital')} icon={<Hospital size={16} />} label="Hôpitaux" />
            <CategoryTab active={activeCategory === 'clinic'} onClick={() => setActiveCategory('clinic')} icon={<Building2 size={16} />} label="Cliniques" />
            <CategoryTab active={activeCategory === 'laboratory'} onClick={() => setActiveCategory('laboratory')} icon={<Microscope size={16} />} label="Labs" />
            <CategoryTab active={activeCategory === 'natural'} onClick={() => setActiveCategory('natural')} icon={<Leaf size={16} />} label="Médecine Bio" />
          </div>
        </div>
      </header>

      <AnimatePresence mode="wait">
        {view === 'list' && (
          <motion.div 
            key="list"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
          >
            {filteredActors.map(actor => (
              <ActorCard key={actor.id} actor={actor} onClick={() => handleActorClick(actor)} />
            ))}
          </motion.div>
        )}

        {(view === 'clinic-catalog' || view === 'hospital-catalog' || view === 'lab-catalog') && selectedActor && (
          <motion.div 
            key={`${selectedActor.type}-catalog`}
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            className="space-y-6"
          >
            <button onClick={() => setView('list')} className="text-brand-600 font-bold flex items-center gap-2 mb-4 hover:translate-x-[-4px] transition-transform">
              <ChevronRight className="rotate-180" size={20} /> Retour au répertoire
            </button>
            
            <div className="bg-white p-4 md:p-8 rounded-[1.5rem] md:rounded-[2.5rem] border border-slate-100 shadow-sm flex flex-col md:flex-row gap-4 md:gap-8 items-center md:items-start relative overflow-hidden">
               <div className="absolute top-0 right-0 w-24 md:w-32 h-24 md:h-32 bg-brand-50 rounded-bl-full -z-0 opacity-50" />
               <img src={selectedActor.image} className="w-24 h-24 md:w-40 md:h-40 rounded-2xl md:rounded-3xl object-cover shadow-xl relative z-10" />
               <div className="flex-1 space-y-3 md:space-y-4 relative z-10 text-center md:text-left">
                  <div className="flex flex-wrap gap-2 justify-center md:justify-start">
                     <span className="bg-brand-100 text-brand-700 px-2 md:px-3 py-1 rounded-full text-[9px] md:text-[10px] font-bold uppercase tracking-widest">{selectedActor.type}</span>
                     {selectedActor.isOpen ? (
                       <span className="bg-emerald-100 text-emerald-700 px-2 md:px-3 py-1 rounded-full text-[9px] md:text-[10px] font-bold uppercase tracking-widest">Ouvert</span>
                     ) : (
                       <span className="bg-red-100 text-red-700 px-2 md:px-3 py-1 rounded-full text-[9px] md:text-[10px] font-bold uppercase tracking-widest">Fermé</span>
                     )}
                  </div>
                  <h2 className="text-2xl md:text-4xl font-display font-bold text-slate-900 leading-tight">{selectedActor.name}</h2>
                  <div className="flex flex-col md:flex-row md:items-center gap-2 md:gap-4 text-slate-500 text-[10px] md:text-sm">
                     <p className="flex items-center justify-center md:justify-start gap-1"><MapPin size={14} /> {selectedActor.address}</p>
                     <p className="flex items-center justify-center md:justify-start gap-1 md:border-l md:pl-4"><StarIcon size={14} className="text-orange-400 fill-current" /> {selectedActor.rating}</p>
                  </div>
                  <div className="flex gap-2 md:gap-3 flex-wrap justify-center md:justify-start">
                     <button className="flex-1 md:flex-none justify-center bg-slate-900 text-white px-4 md:px-6 py-2.5 md:py-3 rounded-xl md:rounded-2xl font-bold flex items-center gap-2 shadow-lg shadow-slate-900/10 text-xs md:text-sm">
                        <PhoneCall size={16} /> Appeler
                     </button>
                     <button 
                       onClick={() => setActiveRouteActor(selectedActor)}
                       className="flex-1 md:flex-none justify-center bg-white border border-slate-200 text-slate-700 px-4 md:px-6 py-2.5 md:py-3 rounded-xl md:rounded-2xl font-bold flex items-center gap-2 hover:bg-slate-50 text-xs md:text-sm"
                     >
                        <MapPin size={16} /> Itinéraire
                     </button>
                  </div>
               </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
               <div className="lg:col-span-2 space-y-6">
                  <h3 className="text-2xl font-display font-bold text-slate-900 px-2">Services & Prestations</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                     {selectedActor.services?.map(service => (
                       <div key={service.id} className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm hover:shadow-xl transition-all group">
                          <p className="text-[10px] font-bold text-brand-600 uppercase tracking-widest mb-2">{service.category}</p>
                          <h4 className="text-lg font-bold text-slate-900 mb-4">{service.name}</h4>
                          <div className="flex items-center justify-between">
                             <p className="text-2xl font-display font-bold text-slate-900">{service.price.toLocaleString()} FCFA</p>
                             <button 
                               onClick={() => addToCart(service)}
                               className="bg-slate-900 text-white p-3 rounded-2xl shadow-lg shadow-slate-900/20 hover:bg-brand-600 transition-colors"
                             >
                                <Plus size={20} />
                             </button>
                          </div>
                       </div>
                     ))}
                  </div>
               </div>
               
               <div className="space-y-6">
                  <div className="bg-slate-900 text-white p-8 rounded-[2.5rem] shadow-xl space-y-6">
                     <h3 className="text-xl font-display font-bold">Planifiez votre visite</h3>
                     <p className="text-sm text-slate-400">Gagnez du temps en pré-payant vos actes ou en réservant un créneau.</p>
                     <div className="space-y-4">
                        <div className="flex items-center gap-3 bg-white/5 p-4 rounded-2xl border border-white/10">
                           <Calendar className="text-brand-500" />
                           <div>
                              <p className="text-xs font-bold uppercase">Prochain RDV</p>
                              <p className="font-medium">Demain, 09:30</p>
                           </div>
                        </div>
                        <button className="w-full bg-brand-600 text-white py-4 rounded-2xl font-bold shadow-lg shadow-brand-600/20 hover:scale-[1.02] active:scale-95 transition-all">
                           Prendre Rendez-vous
                        </button>
                     </div>
                  </div>

                  {selectedActor.specialties && (
                    <div className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm">
                       <h3 className="text-lg font-display font-bold text-slate-900 mb-6">Plateau Technique</h3>
                       <div className="space-y-3">
                          {selectedActor.specialties.map(spec => (
                            <div key={spec} className="flex items-center justify-between p-3 bg-slate-50 rounded-2xl text-sm font-medium text-slate-700">
                               {spec}
                               <ShieldCheck size={16} className="text-brand-600" />
                            </div>
                          ))}
                       </div>
                    </div>
                  )}
               </div>
            </div>
          </motion.div>
        )}

        {view === 'natural-catalog' && selectedActor && (
          <motion.div 
            key="natural-catalog"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-8"
          >
            <button onClick={() => setView('list')} className="text-brand-600 font-bold flex items-center gap-2 mb-4 hover:translate-x-[-4px] transition-transform">
              <ChevronRight className="rotate-180" size={20} /> Retour au répertoire
            </button>
            
            <div className="bg-slate-900 rounded-[3rem] overflow-hidden relative min-h-[400px] flex items-center p-8 md:p-16">
               <div className="absolute inset-0 z-0">
                  <img src={selectedActor.image} className="w-full h-full object-cover opacity-60 grayscale hover:grayscale-0 transition-all duration-1000" />
                  <div className="absolute inset-0 bg-gradient-to-r from-slate-900 via-slate-900/60 to-transparent" />
               </div>
               <div className="relative z-10 max-w-2xl space-y-6">
                  <div className="inline-flex items-center gap-2 bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 px-4 py-2 rounded-full text-xs font-bold uppercase tracking-widest">
                     <Leaf size={16} />
                     Patrimoine Naturel
                  </div>
                  <h2 className="text-5xl font-display font-bold text-white leading-tight">{selectedActor.name}</h2>
                  <p className="text-slate-300 text-lg leading-relaxed">{selectedActor.description}</p>
                  <div className="flex items-center gap-4 pt-4">
                     <div className="flex items-center gap-2">
                        <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center font-bold text-white">
                           {selectedActor.author?.[0]}
                        </div>
                        <div className="text-xs">
                           <p className="text-slate-400 uppercase font-bold tracking-widest">Auteur</p>
                           <p className="text-white font-bold">{selectedActor.author}</p>
                        </div>
                     </div>
                     <div className="h-8 w-px bg-white/10 mx-4" />
                     <div>
                        <p className="text-slate-400 text-[10px] uppercase font-bold tracking-widest">Catégorie</p>
                        <p className="text-white font-bold text-sm">{selectedActor.category}</p>
                     </div>
                  </div>
               </div>
            </div>

            <div className="bg-white p-10 rounded-[2.5rem] border border-slate-100 shadow-sm space-y-12">
               <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
                  <div className="space-y-8">
                     <div>
                        <h3 className="text-2xl font-display font-bold text-slate-900 mb-4">Ingrédients requis</h3>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                           {selectedActor.ingredients?.map(ing => (
                             <div key={ing} className="flex items-center gap-3 p-3 bg-slate-50 rounded-2xl text-sm font-medium text-slate-700 border border-slate-100">
                                <div className="w-2 h-2 bg-emerald-500 rounded-full" />
                                {ing}
                             </div>
                           ))}
                        </div>
                     </div>

                     <div>
                        <h3 className="text-2xl font-display font-bold text-slate-900 mb-4">Méthode de préparation</h3>
                        <div className="space-y-4">
                           {selectedActor.preparation?.map((step, idx) => (
                             <div key={idx} className="flex gap-4">
                                <span className="flex-shrink-0 w-8 h-8 rounded-full bg-slate-900 text-white flex items-center justify-center font-bold text-xs">{idx + 1}</span>
                                <p className="text-slate-600 text-sm leading-relaxed pt-1">{step}</p>
                             </div>
                           ))}
                        </div>
                     </div>
                  </div>

                  <div className="space-y-8">
                     <div className="bg-emerald-50 p-8 rounded-[2.5rem] border border-emerald-100 space-y-6">
                        <div className="flex items-center gap-3 text-emerald-900">
                           <ShieldCheck size={24} className="text-emerald-500" />
                           <h4 className="text-xl font-display font-bold">Posologie & Conseils</h4>
                        </div>
                        <p className="text-emerald-800 font-medium bg-white/50 p-4 rounded-2xl border border-emerald-200/50">
                           {selectedActor.posologie}
                        </p>
                        <ul className="space-y-3">
                           {['Respecter les dosages recommandés', 'Conserver à l\'abri de la lumière', 'Consulter un médecin si les symptômes persistent'].map(text => (
                             <li key={text} className="flex items-center gap-3 text-sm text-emerald-700">
                                <div className="w-1.5 h-1.5 bg-emerald-400 rounded-full" />
                                {text}
                             </li>
                           ))}
                        </ul>
                     </div>

                     <div className="bg-slate-900 text-white p-8 rounded-[2.5rem] shadow-xl space-y-6">
                        <div className="flex justify-between items-end">
                           <div>
                              <p className="text-slate-400 text-[10px] font-bold uppercase tracking-widest mb-1">Pack complet</p>
                              <p className="text-3xl font-display font-bold">{selectedActor.price?.toLocaleString()} FCFA</p>
                           </div>
                           <div className="text-right">
                              <p className="text-emerald-400 text-[10px] font-bold uppercase tracking-widest">Disponibilité</p>
                              <p className="text-white font-bold">En stock</p>
                           </div>
                        </div>
                        <button 
                          onClick={() => {
                            addToCart({
                              id: selectedActor.id + '_pack',
                              name: 'Pack: ' + selectedActor.name,
                              price: selectedActor.price || 0,
                            });
                            setIsCartOpen(true);
                          }}
                          className="w-full bg-brand-600 text-white font-bold py-5 rounded-2xl shadow-lg shadow-brand-600/20 hover:scale-[1.02] active:scale-95 transition-all flex items-center justify-center gap-3"
                        >
                           <ShoppingCart size={20} />
                           Commander les ingrédients
                        </button>
                     </div>
                  </div>
               </div>
            </div>
          </motion.div>
        )}

        {view === 'pharmacy-catalog' && selectedActor && (
          <motion.div 
            key="pharmacy-catalog"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="space-y-6"
          >
            <button onClick={() => setView('list')} className="text-brand-600 font-bold flex items-center gap-2">
              <ChevronRight className="rotate-180" size={20} /> Retour au répertoire
            </button>
            <div className="bg-white p-6 rounded-[2rem] border border-slate-100 flex flex-col sm:flex-row justify-between sm:items-center gap-4">
              <div className="flex gap-6 items-center">
                <img src={selectedActor.image} className="w-20 h-20 rounded-2xl object-cover" />
                <div>
                  <h2 className="text-2xl font-display font-bold">{selectedActor.name}</h2>
                  <p className="text-slate-500 text-sm">{selectedActor.address} • <span className="text-brand-600 font-bold">{selectedActor.distance}</span></p>
                </div>
              </div>
              <button 
                onClick={() => setActiveRouteActor(selectedActor)}
                className="bg-slate-900 text-white px-5 py-2.5 rounded-xl font-bold text-xs flex items-center justify-center gap-2 hover:bg-brand-600 active:scale-95 transition-all self-start sm:self-auto shrink-0"
              >
                <MapPin size={14} /> Itinéraire à pied
              </button>
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Left Side: Medicines Catalog */}
              <div className="lg:col-span-2 space-y-6">
                <div className="flex items-center justify-between px-1">
                  <h3 className="text-lg font-bold font-display text-slate-800">Médicaments Disponibles</h3>
                  <span className="text-xs text-slate-400 font-bold">{getActorMeds(selectedActor).length} références</span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {getActorMeds(selectedActor).map(med => (
                    <div key={med.id} className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm flex flex-col justify-between h-full hover:shadow-md transition-shadow">
                      <div>
                        <img src={med.image} className="w-full h-32 object-cover rounded-xl mb-4" />
                        <div className="flex justify-between items-start gap-2 mb-2">
                          <h4 className="font-bold text-slate-800 text-sm">{med.name}</h4>
                          {med.requiresPrescription && (
                            <span className="bg-purple-100 text-purple-700 text-[8px] font-black uppercase tracking-wider px-1.5 py-0.5 rounded shrink-0">
                              Ordonnance
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-slate-400">{med.dci}</p>
                        <span className="text-[10px] text-slate-400 font-bold block mt-1.5">Stock: {med.stock !== undefined ? `${med.stock} restants` : 'En stock'}</span>
                      </div>
                      <div className="mt-4 flex items-center justify-between">
                        <span className="font-bold text-brand-600">{med.price.toLocaleString()} FCFA</span>
                        <button 
                          disabled={med.stock !== undefined && med.stock <= 0}
                          onClick={() => addToCart(med)}
                          className="w-10 h-10 bg-slate-900 text-white rounded-xl flex items-center justify-center hover:bg-brand-600 transition-colors disabled:bg-slate-200 disabled:text-slate-400 disabled:cursor-not-allowed"
                        >
                          <Plus size={20} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Right Side: Fiche Technique / Establishment Info */}
              <div className="space-y-6">
                <div className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm space-y-6">
                  <div>
                    <h3 className="text-lg font-display font-bold text-slate-900 flex items-center gap-2">
                      <ShieldCheck className="text-emerald-600" size={20} />
                      Fiche Technique Officielle
                    </h3>
                    <p className="text-xs text-slate-400 mt-1">Données certifiées et vérifiées par la plateforme Care</p>
                  </div>

                  {/* Responsable & ID */}
                  <div className="space-y-4 pt-4 border-t border-slate-50">
                    <div>
                      <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Pharmacien Titulaire / Responsable</p>
                      <p className="text-sm font-bold text-slate-800 mt-0.5">Dr. {selectedActor.pharmacistName || 'Pharmacien Agréé'}</p>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">N° Inscription ONPC</p>
                        <p className="text-xs font-mono font-bold text-slate-700 bg-slate-50 px-2 py-1.5 rounded-lg border border-slate-100 mt-1 truncate" title={selectedActor.onpcNumber || 'ONPC-3891-CM'}>
                          {selectedActor.onpcNumber || 'ONPC-3891-CM'}
                        </p>
                      </div>
                      <div>
                        <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Arrêté de Création</p>
                        <p className="text-xs font-mono font-bold text-slate-700 bg-slate-50 px-2 py-1.5 rounded-lg border border-slate-100 mt-1 truncate" title={selectedActor.legalLicenseNumber || 'ARR-1024-MINSANTE'}>
                          {selectedActor.legalLicenseNumber || 'ARR-1024-MINSANTE'}
                        </p>
                      </div>
                    </div>

                    <div>
                      <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Équipe Diplômée</p>
                      <p className="text-xs font-medium text-slate-600 flex items-center gap-1.5 mt-1">
                        <Users size={14} className="text-slate-400" />
                        {selectedActor.pharmacistsCount || 2} Pharmaciens adjoints diplômés d'État
                      </p>
                    </div>
                  </div>

                  {/* Technical & Storage Checklist */}
                  <div className="space-y-3 pt-4 border-t border-slate-50">
                    <h4 className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Normes de Conservation & Sécurité</h4>
                    
                    <div className="space-y-2">
                      <div className="flex justify-between items-center text-xs p-2.5 bg-slate-50/50 rounded-xl border border-slate-100">
                        <span className="text-slate-600 font-medium">Conservation Chaîne du Froid</span>
                        <span className="text-[10px] font-bold uppercase text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-md">
                          {selectedActor.coldChainEquipment === 'medical_fridge' ? 'Réfrigérateur Médical' : 
                           selectedActor.coldChainEquipment === 'electric_fridge' ? 'Réfrigérateur Électrique' : 
                           selectedActor.coldChainEquipment === 'isothermic' ? 'Système Isotherme' : 'Réfrigérateur Médical'}
                        </span>
                      </div>

                      <div className="flex justify-between items-center text-xs p-2.5 bg-slate-50/50 rounded-xl border border-slate-100">
                        <span className="text-slate-600 font-medium">Alimentation de Secours</span>
                        <span className="text-[10px] font-bold uppercase text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-md">
                          {selectedActor.backupGenerator === 'automated' ? 'Générateur Automatique' : 
                           selectedActor.backupGenerator === 'manual' ? 'Générateur Manuel' : 
                           selectedActor.backupGenerator === 'none' ? 'Aucun' : 'Générateur Automatique'}
                        </span>
                      </div>

                      <div className="grid grid-cols-2 gap-2">
                        <div className="flex items-center justify-between p-2.5 bg-slate-50/50 rounded-xl border border-slate-100 text-[11px] font-medium text-slate-600">
                          <span>Suivi Température</span>
                          {selectedActor.temperatureMonitor !== false ? <Check size={14} className="text-emerald-500 shrink-0" /> : <X size={14} className="text-red-500 shrink-0" />}
                        </div>
                        <div className="flex items-center justify-between p-2.5 bg-slate-50/50 rounded-xl border border-slate-100 text-[11px] font-medium text-slate-600">
                          <span>Climatisation</span>
                          {selectedActor.airConditioned !== false ? <Check size={14} className="text-emerald-500 shrink-0" /> : <X size={14} className="text-red-500 shrink-0" />}
                        </div>
                        <div className="flex items-center justify-between p-2.5 bg-slate-50/50 rounded-xl border border-slate-100 text-[11px] font-medium text-slate-600">
                          <span>Coffre Stupéfiants</span>
                          {selectedActor.narcoticsSafe !== false ? <Check size={14} className="text-emerald-500 shrink-0" /> : <X size={14} className="text-red-500 shrink-0" />}
                        </div>
                        <div className="flex items-center justify-between p-2.5 bg-slate-50/50 rounded-xl border border-slate-100 text-[11px] font-medium text-slate-600">
                          <span>Tri Déchets Santé</span>
                          {selectedActor.wasteProtocol !== false ? <Check size={14} className="text-emerald-500 shrink-0" /> : <X size={14} className="text-red-500 shrink-0" />}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Contact section */}
                  <div className="space-y-3 pt-4 border-t border-slate-50 text-xs text-slate-600">
                    <h4 className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Coordonnées de l'Officine</h4>
                    <div className="space-y-2">
                      <div className="flex items-center gap-2.5">
                        <Clock size={14} className="text-slate-400 shrink-0" />
                        <span>{selectedActor.hours || 'Non renseigné (24h/24 par défaut)'}</span>
                      </div>
                      {selectedActor.phone && (
                        <div className="flex items-center gap-2.5">
                          <PhoneCall size={14} className="text-slate-400 shrink-0" />
                          <span className="font-mono font-bold text-slate-800">{selectedActor.phone}</span>
                        </div>
                      )}
                      {selectedActor.email && (
                        <div className="flex items-center gap-2.5">
                          <Mail size={14} className="text-slate-400 shrink-0" />
                          <span className="truncate text-slate-500">{selectedActor.email}</span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Call and Route quick buttons */}
                  <div className="pt-4 border-t border-slate-50 flex gap-2">
                    {selectedActor.phone && (
                      <button 
                        onClick={() => window.location.href = `tel:${selectedActor.phone}`}
                        className="flex-1 justify-center bg-slate-900 text-white px-4 py-2.5 rounded-xl font-bold text-[10px] flex items-center gap-2 transition-all active:scale-95 shadow-sm hover:bg-slate-800"
                      >
                        <PhoneCall size={11} /> Appeler
                      </button>
                    )}
                    <button 
                      onClick={() => setActiveRouteActor(selectedActor)}
                      className="flex-1 justify-center bg-emerald-50 text-emerald-700 px-4 py-2.5 rounded-xl font-bold text-[10px] flex items-center gap-2 transition-all active:scale-95 hover:bg-emerald-100"
                    >
                      <MapPin size={11} /> Itinéraire
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        )}

        {view === 'prescriptions' && (
          <motion.div 
            key="prescriptions"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="max-w-2xl mx-auto py-12 text-center space-y-8"
          >
            {isAnalyzing ? (
              <div className="space-y-6">
                <div className="relative w-32 h-32 mx-auto">
                   <div className="absolute inset-0 border-4 border-slate-100 rounded-[2rem]" />
                   <motion.div animate={{ top: ['0%', '90%', '0%'] }} transition={{ repeat: Infinity, duration: 2, ease: "linear" }} className="absolute w-full h-1 bg-brand-600 z-10 shadow-[0_0_15px_rgba(16,185,129,0.5)]" />
                   <div className="absolute inset-0 flex items-center justify-center"><FileText size={48} className="text-slate-300" /></div>
                </div>
                <h3 className="text-xl font-display font-bold text-brand-600">Care IA en cours d'analyse...</h3>
              </div>
            ) : (
              <>
                <h2 className="text-3xl font-display font-bold">Analyse d'Ordonnance AI</h2>
                <p className="text-slate-500">Uploadez votre ordonnance pour trouver instantanément le meilleur prix et la disponibilité.</p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <input type="file" ref={fileInputRef} className="hidden" accept=".pdf,image/*" onChange={handleUploadOrdonnance} />
                  <input type="file" ref={cameraInputRef} className="hidden" accept="image/*" capture="environment" onChange={handleUploadOrdonnance} />
                  <button onClick={() => fileInputRef.current?.click()} className="p-10 bg-white border-2 border-dashed border-slate-200 rounded-[2.5rem] flex flex-col items-center gap-4 hover:border-brand-600 transition-all">
                    <Upload size={32} className="text-slate-300" />
                    <span className="font-bold">Importer Fichier/PDF</span>
                  </button>
                  <button onClick={() => cameraInputRef.current?.click()} className="p-10 bg-brand-600 text-white rounded-[2.5rem] flex flex-col items-center gap-4 shadow-xl shadow-brand-600/20">
                    <Camera size={32} />
                    <span className="font-bold">Prise de Vue Directe</span>
                  </button>
                </div>
              </>
            )}
          </motion.div>
        )}

        {view === 'results' && (
          <motion.div key="results" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
            <div className="bg-slate-900 text-white p-8 rounded-[2.5rem] shadow-xl relative overflow-hidden">
               <div className="relative z-10 space-y-4">
                  <div className="flex items-center justify-between">
                    <h2 className="text-2xl font-display font-bold">Résultats de l'analyse Care IA</h2>
                    <div className="flex items-center gap-2 bg-emerald-500/20 text-emerald-400 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest border border-emerald-500/30">
                       <CheckCircle2 size={12} />
                       Authentifié
                    </div>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {analyzedMeds.map(m => (
                      <div key={m.name} className="bg-white/10 p-4 rounded-2xl border border-white/5 backdrop-blur-sm">
                        <p className="text-emerald-400 font-bold text-[10px] uppercase tracking-tighter mb-1">Médicament Détecté</p>
                        <p className="font-bold">{m.name}</p>
                        <p className="text-xs opacity-60 italic">{m.dosage}</p>
                      </div>
                    ))}
                  </div>
               </div>
            </div>

            {/* Filters Bar */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-white p-4 rounded-[2rem] border border-slate-100 shadow-sm">
               <div className="flex items-center gap-2 text-slate-500 px-2">
                  <Filter size={16} />
                  <span className="text-xs font-bold uppercase tracking-widest">Trier par :</span>
               </div>
               <div className="flex bg-slate-50 p-1.5 rounded-2xl gap-1 w-full sm:w-auto">
                  <button 
                    onClick={() => setSortBy('price')}
                    className={cn(
                      "flex-1 sm:flex-none px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2",
                      sortBy === 'price' ? "bg-white text-brand-600 shadow-sm" : "text-slate-500 hover:text-slate-900"
                    )}
                  >
                    Prix
                  </button>
                  <button 
                    onClick={() => setSortBy('distance')}
                    className={cn(
                      "flex-1 sm:flex-none px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2",
                      sortBy === 'distance' ? "bg-white text-brand-600 shadow-sm" : "text-slate-500 hover:text-slate-900"
                    )}
                  >
                    Distance
                  </button>
                  <button 
                    onClick={() => setSortBy('rating')}
                    className={cn(
                      "flex-1 sm:flex-none px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2",
                      sortBy === 'rating' ? "bg-white text-brand-600 shadow-sm" : "text-slate-500 hover:text-slate-900"
                    )}
                  >
                    Note
                  </button>
               </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {getSortedPharmacies().map(pharma => (
                <div key={pharma.id} className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-lg hover:shadow-xl transition-all flex flex-col justify-between group">
                   <div>
                     <div className="flex justify-between items-start mb-4">
                        <div className="relative">
                          <img src={pharma.image} className="w-16 h-16 rounded-2xl object-cover" />
                          <div className="absolute -bottom-1 -right-1 bg-emerald-500 text-white p-1 rounded-lg border-2 border-white">
                             <CheckCircle2 size={12} />
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-xl font-display font-bold text-slate-900">
                             {analyzedMeds.reduce((sum, med) => {
                               const foundMed = pharma.meds?.find(m => m.name === med.name);
                               return sum + (foundMed?.price || 0);
                             }, 0).toLocaleString()} FCFA
                          </p>
                          <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-1">Total Panier</p>
                        </div>
                     </div>
                     <div className="flex items-center gap-2">
                       <h4 className="font-display font-bold text-xl text-slate-900 group-hover:text-brand-600 transition-colors">{pharma.name}</h4>
                       {pharma.isDuty && (
                         <span className="bg-red-100 text-red-700 text-[9px] font-black uppercase px-2 py-0.5 rounded-lg flex items-center gap-0.5 shrink-0 animate-pulse">
                           <Clock size={10} /> Garde
                         </span>
                       )}
                     </div>
                     <div className="flex items-center gap-2 text-xs text-slate-400 mt-1 mb-4">
                        <MapPin size={12} />
                        {pharma.address} • <span className="text-brand-600 font-bold">{pharma.distance}</span>
                     </div>
                     <div className="space-y-1 mb-6">
                        {analyzedMeds.map(am => {
                          const foundMed = pharma.meds?.find(m => m.name === am.name);
                          return (
                            <div key={am.name} className="flex justify-between items-center text-xs p-2 bg-slate-50 rounded-xl">
                              <span className="text-slate-600 tabular-nums">{am.name}</span>
                              <span className="font-bold text-emerald-600 flex items-center gap-1">
                                {foundMed?.price.toLocaleString()} FCFA
                              </span>
                            </div>
                          );
                        })}
                     </div>
                   </div>
                   <button 
                    onClick={() => { 
                      setSelectedActor(pharma); 
                      setView('pharmacy-catalog'); 
                      setIsCartOpen(true);
                      const medsToOrder = pharma.meds?.filter(m => analyzedMeds.some(am => am.name === m.name)) || [];
                      medsToOrder.forEach(m => addToCart(m));
                    }}
                    className="w-full bg-slate-900 text-white py-4 rounded-2xl font-bold shadow-lg shadow-slate-900/10 hover:bg-brand-600 active:scale-95 transition-all flex items-center justify-center gap-2"
                   >
                     <ShoppingCart size={18} />
                     Commander tout ({analyzedMeds.length})
                   </button>
                </div>
              ))}
            </div>
            {matchingPharmacies.length === 0 && (
              <div className="text-center py-20 bg-white rounded-[2.5rem] border border-slate-100 italic text-slate-400">
                Aucune pharmacie ne dispose de tout le stock à proximité.
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      <CartDrawer 
        isOpen={isCartOpen} 
        onClose={() => setIsCartOpen(false)} 
        cart={cart} 
        onUpdateCount={updateCartCount}
        onRemove={removeFromCart}
        onCheckout={handleCheckout}
      />

      <RouteDrawer
        isOpen={activeRouteActor !== null}
        onClose={() => setActiveRouteActor(null)}
        actor={activeRouteActor}
      />
    </div>
  );
}

function CategoryTab({ active, onClick, icon, label }: { active: boolean, onClick: () => void, icon: React.ReactNode, label: string }) {
  return (
    <button 
      onClick={onClick}
      className={cn(
        "flex items-center gap-2 px-4 md:px-5 py-2 md:py-2.5 rounded-xl md:rounded-2xl text-xs md:text-sm font-bold transition-all whitespace-nowrap",
        active ? "bg-slate-900 text-white shadow-lg shadow-slate-900/10" : "bg-white text-slate-500 border border-slate-100 hover:bg-slate-50"
      )}
    >
      {icon}
      {label}
    </button>
  );
}

function ActorCard({ actor, onClick }: { actor: DirectoryActor, onClick: () => void }) {
  const Icon = actor.type === 'hospital' ? Hospital : 
               actor.type === 'pharmacy' ? Pill : 
               actor.type === 'laboratory' ? Microscope :
               actor.type === 'natural' ? Leaf : Building2;
  const colorClass = actor.type === 'hospital' ? "text-blue-600 bg-blue-50" : 
                    actor.type === 'pharmacy' ? "text-emerald-600 bg-emerald-50" : 
                    actor.type === 'laboratory' ? "text-purple-600 bg-purple-50" :
                    actor.type === 'natural' ? "text-emerald-700 bg-emerald-100" : "text-brand-600 bg-brand-50";

  return (
    <motion.div 
      whileHover={{ y: -5 }}
      onClick={onClick}
      className="bg-white rounded-[2rem] overflow-hidden border border-slate-100 shadow-sm cursor-pointer group"
    >
      <div className="h-40 relative">
        <img src={actor.image} alt={actor.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
        <div className={cn("absolute top-4 left-4 p-2 rounded-xl backdrop-blur-sm shadow-lg", colorClass)}>
          <Icon size={20} />
        </div>
        {actor.isDuty && (
          <div className="absolute top-4 right-4 bg-red-600 text-white px-3 py-1 rounded-xl text-[10px] font-black uppercase tracking-wider shadow-lg flex items-center gap-1.5 animate-pulse">
            <Clock size={12} />
            <span>De Garde</span>
          </div>
        )}
      </div>
      <div className="p-6">
        <div className="flex justify-between items-start mb-2 text-xs font-bold text-slate-400 tracking-widest uppercase">
          <span>{actor.type}</span>
          <span>{actor.distance}</span>
        </div>
        <h3 className="text-xl font-display font-bold text-slate-900 line-clamp-1">{actor.name}</h3>
        <p className="text-xs text-slate-400 mt-1 mb-4 line-clamp-1">{actor.address}</p>
        
        {actor.specialties && (
          <div className="flex flex-wrap gap-1 mb-4">
            {actor.specialties.slice(0, 3).map(s => (
              <span key={s} className="bg-slate-50 text-slate-500 px-2 py-0.5 rounded-lg text-[9px] font-bold uppercase">{s}</span>
            ))}
          </div>
        )}

        <div className="flex items-center justify-between pt-4 border-t border-slate-50">
           <div className="flex items-center gap-1 text-orange-400">
             <StarIcon size={14} fill="currentColor" />
             <span className="text-sm font-bold text-slate-700">{actor.rating}</span>
           </div>
           <button className="text-brand-600 text-xs font-bold flex items-center gap-1">
             Consulter <ChevronRight size={14} />
           </button>
        </div>
      </div>
    </motion.div>
  );
}

function CartDrawer({ 
  isOpen, 
  onClose, 
  cart, 
  onUpdateCount, 
  onRemove,
  onCheckout
}: { 
  isOpen: boolean, 
  onClose: () => void, 
  cart: any[],
  onUpdateCount: (id: string, delta: number) => void,
  onRemove: (id: string) => void,
  onCheckout: (method: string) => void
}) {
  const [step, setStep] = useState<'cart' | 'payment'>('cart');
  const [selectedMethod, setSelectedMethod] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  
  const total = cart.reduce((sum, item) => sum + (item.price * item.count), 0);

  const handleFinish = () => {
    if (!selectedMethod) return;
    setIsProcessing(true);
    setTimeout(() => {
      onCheckout(selectedMethod);
      setIsProcessing(false);
      setStep('cart');
      setSelectedMethod(null);
    }, 2000);
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose} className="fixed inset-0 bg-slate-900/30 backdrop-blur-sm z-[100]" />
          <motion.div initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }} className="fixed top-0 right-0 h-full w-full max-w-md bg-white z-[110] shadow-2xl flex flex-col">
            <div className="p-6 border-b flex justify-between items-center bg-slate-50">
              <div className="flex items-center gap-3">
                {step === 'payment' && (
                  <button onClick={() => setStep('cart')} className="p-2 hover:bg-white rounded-xl transition-colors">
                    <ChevronRight className="rotate-180" size={20} />
                  </button>
                )}
                <h3 className="text-xl font-bold font-display">
                  {step === 'cart' ? 'Mon Panier Santé' : 'Mode de Paiement'}
                </h3>
              </div>
              <button 
                onClick={onClose}
                className="w-10 h-10 bg-white shadow-sm border border-slate-200 rounded-xl flex items-center justify-center text-slate-400 hover:text-slate-900 transition-colors"
              >
                <Plus className="rotate-45" size={24} />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-6 space-y-6">
              {step === 'cart' ? (
                <>
                  {cart.some(item => item.requiresPrescription) && (
                    <div className="bg-purple-50/70 border border-purple-100 p-4 rounded-2xl flex gap-3 text-purple-950 animate-pulse">
                      <Camera size={20} className="shrink-0 mt-0.5 text-purple-600" />
                      <div className="text-xs font-semibold leading-relaxed">
                        <span className="font-bold block text-purple-900 mb-0.5">Ordonnance Obligatoire</span> 
                        Certains articles de votre panier nécessitent une ordonnance valide. Préparez-la pour la présentation à la pharmacie.
                      </div>
                    </div>
                  )}

                  {cart.map((item) => (
                    <div key={item.id} className="flex gap-4 items-center bg-white p-4 rounded-3xl border border-slate-100 shadow-sm animate-in slide-in-from-right-4 duration-300">
                      <div className="w-16 h-16 bg-slate-50 rounded-2xl flex items-center justify-center overflow-hidden border border-slate-100 shrink-0">
                        {item.image ? (
                          <img src={item.image} className="w-full h-full object-cover" />
                        ) : (
                          <Hospital className="text-slate-300" size={24} />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1.5 justify-between">
                          <p className="text-sm font-bold text-slate-800 truncate">{item.name}</p>
                          {item.requiresPrescription && (
                            <span className="bg-purple-100 text-purple-700 text-[8px] font-black uppercase tracking-wider px-1.5 py-0.5 rounded shrink-0">
                              Réglementé
                            </span>
                          )}
                        </div>
                        <p className="text-xs font-bold text-brand-600 mt-0.5">{item.price.toLocaleString()} FCFA</p>
                        
                        <div className="flex items-center gap-3 mt-3">
                          <div className="flex items-center bg-slate-50 rounded-xl p-1 border border-slate-100">
                             <button 
                               onClick={() => onUpdateCount(item.id, -1)}
                               className="w-7 h-7 flex items-center justify-center hover:bg-white rounded-lg transition-colors text-slate-400"
                             >
                               <Minus size={14} />
                             </button>
                             <span className="w-8 text-center text-xs font-bold">{item.count}</span>
                             <button 
                               onClick={() => onUpdateCount(item.id, 1)}
                               className="w-7 h-7 flex items-center justify-center hover:bg-white rounded-lg transition-colors text-slate-400"
                             >
                               <Plus size={14} />
                             </button>
                          </div>
                          <button 
                            onClick={() => onRemove(item.id)}
                            className="p-2 text-red-400 hover:bg-red-50 rounded-xl transition-colors"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                  {cart.length === 0 && (
                    <div className="flex flex-col items-center justify-center h-full text-slate-400 space-y-4">
                       <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center">
                          <ShoppingCart size={32} />
                       </div>
                       <p className="italic font-medium">Votre panier est vide</p>
                    </div>
                  )}
                </>
              ) : (
                <div className="space-y-4">
                  <p className="text-sm text-slate-500 mb-6">Sélectionnez votre moyen de paiement préféré pour finaliser la commande.</p>
                  
                  <PaymentOption 
                    id="om"
                    label="Orange Money" 
                    icon={<div className="w-8 h-8 bg-orange-500 rounded-lg" />} 
                    selected={selectedMethod === 'om'} 
                    onClick={() => setSelectedMethod('om')} 
                  />
                  <PaymentOption 
                    id="momo"
                    label="MTN Mobile Money" 
                    icon={<div className="w-8 h-8 bg-yellow-400 rounded-lg" />} 
                    selected={selectedMethod === 'momo'} 
                    onClick={() => setSelectedMethod('momo')} 
                  />
                  <PaymentOption 
                    id="card"
                    label="Carte Bancaire" 
                    icon={<CreditCardIcon className="text-blue-500" />} 
                    selected={selectedMethod === 'card'} 
                    onClick={() => setSelectedMethod('card')} 
                  />
                  <PaymentOption 
                    id="cash"
                    label="Paiement à la livraison" 
                    icon={<div className="w-8 h-8 bg-slate-100 flex items-center justify-center rounded-lg"><div className="w-4 h-4 bg-slate-400 rounded-full" /></div>} 
                    selected={selectedMethod === 'cash'} 
                    onClick={() => setSelectedMethod('cash')} 
                  />
                </div>
              )}
            </div>

            <div className="p-8 border-t bg-slate-50 space-y-6">
              <div className="flex justify-between items-end">
                <span className="text-slate-500 text-sm font-bold uppercase tracking-widest">Total</span>
                <span className="text-3xl font-display font-bold text-slate-900">{total.toLocaleString()} FCFA</span>
              </div>
              
              {step === 'cart' ? (
                <button 
                  disabled={cart.length === 0}
                  onClick={() => setStep('payment')}
                  className="w-full bg-slate-900 text-white font-bold py-5 rounded-[2rem] shadow-xl shadow-slate-900/10 hover:scale-[1.02] active:scale-95 transition-all text-lg disabled:opacity-50"
                >
                  Procéder au paiement
                </button>
              ) : (
                <button 
                  disabled={!selectedMethod || isProcessing}
                  onClick={handleFinish}
                  className="w-full bg-brand-600 text-white font-bold py-5 rounded-[2rem] shadow-xl shadow-brand-600/20 hover:scale-[1.02] active:scale-95 transition-all text-lg disabled:opacity-50 flex items-center justify-center gap-3"
                >
                  {isProcessing ? (
                    <>
                      <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      Traitement...
                    </>
                  ) : (
                    'Confirmer la commande'
                  )}
                </button>
              )}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

function PaymentOption({ id, label, icon, selected, onClick }: { id: string; label: string; icon: React.ReactNode; selected: boolean; onClick: () => void }) {
  return (
    <button 
      onClick={onClick}
      className={cn(
        "w-full flex items-center justify-between p-4 rounded-2xl border-2 transition-all",
        selected ? "border-brand-600 bg-brand-50" : "border-slate-100 hover:border-slate-200"
      )}
    >
      <div className="flex items-center gap-4">
        <div className="w-12 h-12 bg-white rounded-xl shadow-sm border border-slate-100 flex items-center justify-center">
          {icon}
        </div>
        <span className={cn("font-bold", selected ? "text-brand-900" : "text-slate-700")}>{label}</span>
      </div>
      <div className={cn(
        "w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all",
        selected ? "border-brand-600 bg-brand-600" : "border-slate-300"
      )}>
        {selected && <div className="w-2 h-2 bg-white rounded-full" />}
      </div>
    </button>
  );
}

function RouteDrawer({
  isOpen,
  onClose,
  actor
}: {
  isOpen: boolean;
  onClose: () => void;
  actor: DirectoryActor | null;
}) {
  const [navigating, setNavigating] = useState(false);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    let interval: any;
    if (navigating) {
      interval = setInterval(() => {
        setProgress(p => {
          if (p >= 100) {
            setNavigating(false);
            clearInterval(interval);
            return 100;
          }
          return p + 5;
        });
      }, 300);
    } else {
      setProgress(0);
    }
    return () => clearInterval(interval);
  }, [navigating]);

  if (!actor) return null;

  // Derive walking time based on distance (roughly 1.2 min per 100m)
  const distNum = parseFloat(actor.distance) || 0.5;
  const timeMin = Math.max(2, Math.round(distNum * 12));
  const stepsCount = Math.round(distNum * 1300);

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose} className="fixed inset-0 bg-slate-900/30 backdrop-blur-sm z-[100]" />
          <motion.div initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }} className="fixed top-0 right-0 h-full w-full max-w-md bg-white z-[110] shadow-2xl flex flex-col">
            <div className="p-6 border-b flex justify-between items-center bg-slate-50">
              <div>
                <h3 className="text-xl font-bold font-display flex items-center gap-2 text-slate-900">
                  <Navigation className="text-brand-600 rotate-45 animate-pulse" size={20} />
                  Itinéraire Piéton
                </h3>
                <p className="text-xs text-slate-400 mt-1">Calcul d'itinéraire à pied sécurisé</p>
              </div>
              <button 
                onClick={onClose}
                className="w-10 h-10 bg-white shadow-sm border border-slate-200 rounded-xl flex items-center justify-center text-slate-400 hover:text-slate-900 transition-colors"
              >
                <Plus className="rotate-45" size={24} />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-6 space-y-6">
              {/* Destination Card */}
              <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100 flex gap-4 items-center">
                <img src={actor.image} className="w-16 h-16 rounded-xl object-cover shadow-sm" />
                <div className="flex-1">
                  <h4 className="font-bold text-slate-900 text-sm">{actor.name}</h4>
                  <p className="text-xs text-slate-500 mt-0.5 line-clamp-1">{actor.address}</p>
                  <p className="text-[10px] text-brand-600 font-bold mt-1 uppercase tracking-wider">{actor.distance} • ~{timeMin} min de marche</p>
                </div>
              </div>

              {/* Stats Grid */}
              <div className="grid grid-cols-3 gap-3">
                <div className="bg-emerald-50/50 p-3 rounded-xl border border-emerald-100/50 text-center">
                  <Clock className="text-emerald-600 mx-auto mb-1" size={18} />
                  <p className="text-[10px] text-slate-400 font-medium">Durée</p>
                  <p className="text-sm font-bold text-emerald-800">~{timeMin} min</p>
                </div>
                <div className="bg-blue-50/50 p-3 rounded-xl border border-blue-100/50 text-center">
                  <Navigation className="text-blue-600 mx-auto mb-1 rotate-45" size={18} />
                  <p className="text-[10px] text-slate-400 font-medium">Distance</p>
                  <p className="text-sm font-bold text-blue-800">{actor.distance}</p>
                </div>
                <div className="bg-orange-50/50 p-3 rounded-xl border border-orange-100/50 text-center">
                  <Activity className="text-orange-600 mx-auto mb-1" size={18} />
                  <p className="text-[10px] text-slate-400 font-medium">Pas estimé</p>
                  <p className="text-sm font-bold text-orange-800">~{stepsCount}</p>
                </div>
              </div>

              {/* SIMULATED MAP CANVAS */}
              <div className="relative bg-slate-100 h-60 rounded-3xl overflow-hidden border border-slate-200 shadow-inner flex items-center justify-center">
                {/* SVG simulated street pattern */}
                <svg className="absolute inset-0 w-full h-full text-slate-300 opacity-40" xmlns="http://www.w3.org/2000/svg">
                  <defs>
                    <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
                      <path d="M 40 0 L 0 0 0 40" fill="none" stroke="currentColor" strokeWidth="1.5" />
                    </pattern>
                  </defs>
                  <rect width="100%" height="100%" fill="url(#grid)" />
                  {/* Diagonal streets */}
                  <line x1="0" y1="0" x2="100%" y2="100%" stroke="currentColor" strokeWidth="6" strokeDasharray="5" />
                  <line x1="0" y1="100%" x2="100%" y2="0" stroke="currentColor" strokeWidth="4" />
                  <line x1="50%" y1="0" x2="50%" y2="100%" stroke="currentColor" strokeWidth="8" />
                  <line x1="0" y1="50%" x2="100%" y2="50%" stroke="currentColor" strokeWidth="8" />
                </svg>

                {/* Pulsing Start Point (User) */}
                <div className="absolute left-[20%] top-[70%] z-20">
                  <span className="relative flex h-4 w-4">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-4 w-4 bg-blue-600 border-2 border-white shadow"></span>
                  </span>
                  <span className="absolute -top-6 -left-4 bg-slate-900 text-white text-[9px] px-1.5 py-0.5 rounded font-black uppercase whitespace-nowrap shadow">Moi</span>
                </div>

                {/* Animated Route Path */}
                <svg className="absolute inset-0 w-full h-full z-10" xmlns="http://www.w3.org/2000/svg">
                  <path 
                    d="M 80 168 L 200 168 L 200 72 L 300 72" 
                    fill="none" 
                    stroke="#10b981" 
                    strokeWidth="4" 
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeDasharray="8 4"
                  />
                  {/* Dynamic navigation indicator */}
                  {navigating && (
                    <circle 
                      r="6" 
                      fill="#ef4444" 
                      stroke="#ffffff"
                      strokeWidth="2"
                    >
                      <animateMotion 
                        path="M 80 168 L 200 168 L 200 72 L 300 72" 
                        dur="6s" 
                        repeatCount="indefinite" 
                      />
                    </circle>
                  )}
                </svg>

                {/* Pulsing End Point (Actor) */}
                <div className="absolute left-[75%] top-[30%] z-20">
                  <span className="relative flex h-5 w-5">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-5 w-5 bg-red-600 border-2 border-white shadow flex items-center justify-center">
                      <MapPin className="text-white" size={10} />
                    </span>
                  </span>
                  <span className="absolute -top-8 -left-10 bg-red-600 text-white text-[9px] px-2 py-0.5 rounded-lg font-bold shadow whitespace-nowrap max-w-[120px] truncate">{actor.name}</span>
                </div>

                {/* Map compass overlay */}
                <div className="absolute bottom-3 right-3 bg-white/80 backdrop-blur-md p-2 rounded-xl border border-slate-200/50 shadow flex items-center gap-2 text-[10px] font-bold text-slate-600">
                  <div className="w-4 h-4 rounded-full border border-slate-400 flex items-center justify-center text-[8px]">N</div>
                  <span>Douala / Yaoundé</span>
                </div>
              </div>

              {/* Steps list */}
              <div className="space-y-4">
                <h4 className="font-display font-bold text-sm text-slate-900">Directives étape par étape</h4>
                <div className="space-y-4 relative pl-6 before:absolute before:left-2.5 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-100">
                  <div className="relative flex gap-3 text-xs">
                    <div className="absolute -left-5 w-2.5 h-2.5 rounded-full bg-blue-600 border-2 border-white ring-4 ring-blue-50" />
                    <div>
                      <p className="font-bold text-slate-800">Départ de votre position actuelle</p>
                      <p className="text-slate-400 mt-0.5">Dirigez-vous vers le nord</p>
                    </div>
                  </div>
                  <div className="relative flex gap-3 text-xs">
                    <div className="absolute -left-5 w-2.5 h-2.5 rounded-full bg-slate-300 border-2 border-white" />
                    <div>
                      <p className="font-bold text-slate-800">Tourner à droite sur l'Avenue principale (150m)</p>
                      <p className="text-slate-400 mt-0.5">Suivre la zone piétonne sécurisée</p>
                    </div>
                  </div>
                  <div className="relative flex gap-3 text-xs">
                    <div className="absolute -left-5 w-2.5 h-2.5 rounded-full bg-slate-300 border-2 border-white" />
                    <div>
                      <p className="font-bold text-slate-800">Continuer tout droit au carrefour (200m)</p>
                      <p className="text-slate-400 mt-0.5">Passage piéton devant le monument</p>
                    </div>
                  </div>
                  <div className="relative flex gap-3 text-xs">
                    <div className="absolute -left-5 w-2.5 h-2.5 rounded-full bg-red-600 border-2 border-white ring-4 ring-red-50" />
                    <div>
                      <p className="font-bold text-slate-800">Arrivée à {actor.name}</p>
                      <p className="text-slate-400 mt-0.5">L'établissement se trouve à votre gauche</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="p-6 bg-slate-50 border-t border-slate-100">
              <button 
                onClick={() => setNavigating(!navigating)}
                className={cn(
                  "w-full py-4 rounded-2xl font-bold shadow-lg transition-all flex items-center justify-center gap-2",
                  navigating 
                    ? "bg-red-600 hover:bg-red-700 text-white shadow-red-600/20" 
                    : "bg-slate-900 hover:bg-slate-800 text-white shadow-slate-900/10"
                )}
              >
                <Navigation size={18} className={cn("rotate-45", navigating && "animate-spin")} />
                {navigating ? "Arrêter la navigation" : "Démarrer le guidage live"}
              </button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
