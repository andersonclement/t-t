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
  X,
  AlertTriangle,
  User,
  Stethoscope,
  Truck,
  Package
} from 'lucide-react';
import { cn } from '../lib/utils';
import { useOrders } from '../components/OrderContext';
import { useAuth } from '../components/AuthContext';
import { Button, Card, PageContainer, PageHeader } from '../components/ui';
import { db } from '../lib/firebase';
import { collection, query, onSnapshot, where } from 'firebase/firestore';
import { useSearchParams, useNavigate } from 'react-router-dom';

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
  pharmacistId?: string;
}

interface Doctor {
  name: string;
  specialty: string;
  days: string;
  languages?: string[];
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
  description?: string;
  author?: string;
  category?: string;
  ingredients?: string[];
  preparation?: string[];
  posologie?: string;
  price?: number;
  isDuty?: boolean;

  // Clinic-specific fields (per spec: Fiche médecin individuel)
  doctors?: Doctor[];
  acceptsCNAM?: boolean;
  acceptedInsurances?: string[];
  appointmentEnabled?: boolean;

  // Natural medicine fields
  contraindications?: string[];
  origin?: string;

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
    origin: 'Médecine traditionnelle camerounaise',
    ingredients: ['Feuilles de Neem séchées', 'Tiges d\'Artémisia Annua', 'Écorce de Cannelle', 'Miel de forêt'],
    preparation: [
      'Faire bouillir 1 litre d\'eau de source.',
      'Ajouter une poignée de feuilles de Neem et 2 tiges d\'Artémisia.',
      'Laisser infuser pendant 10 minutes à couvert.',
      'Filtrer et ajouter une cuillère de miel pour adoucir.'
    ],
    posologie: 'Boire une tasse tiède le matin à jeun pendant 7 jours.',
    contraindications: ['Femmes enceintes', 'Enfants de moins de 6 ans', 'Allergie connue au Neem'],
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
    origin: 'Pharmacopée naturelle d\'Afrique Centrale',
    ingredients: ['Gingembre frais râpé', 'Miel d\'acacia pur', 'Jus de citron jaune', 'Clous de girofle'],
    preparation: [
      'Extraire le jus du gingembre râpé.',
      'Mélanger à parts égales avec le miel.',
      'Ajouter le jus de citron et les clous de girofle écrasés.',
      'Laisser reposer 24h avant la première utilisation.'
    ],
    posologie: 'Une cuillère à soupe 3 fois par jour jusqu\'à apaisement.',
    contraindications: ['Diabétiques (teneur en miel)', 'Allergie au gingembre'],
    price: 3500
  },
  {
    id: 'R3',
    name: 'Décoction d\'Écorce de Quinquina',
    type: 'natural',
    description: 'Tonique antipaludéen ancestral à base d\'écorce amère, utilisé pour combattre les accès de fièvre.',
    author: 'Guérisseur Bamiléké',
    image: 'https://images.unsplash.com/photo-1515694346937-43c3e8337088?w=400&h=300&fit=crop',
    rating: 4.6,
    category: 'Paludisme',
    address: 'Tradipraticien Certifié - Bafoussam',
    origin: 'Pharmacopée Bamiléké',
    ingredients: ['Écorce de Quinquina', 'Feuilles de Papayer', 'Citron vert', 'Eau filtrée'],
    preparation: [
      'Laver et découper l\'écorce de Quinquina en petits morceaux.',
      'Faire bouillir dans 2 litres d\'eau pendant 20 minutes.',
      'Ajouter les feuilles de papayer 5 minutes avant la fin.',
      'Filtrer et presser le jus de citron. Boire tiède.'
    ],
    posologie: 'Un verre matin et soir pendant 5 jours maximum.',
    contraindications: ['Femmes enceintes ou allaitantes', 'Insuffisance rénale', 'Enfants de moins de 12 ans'],
    price: 3000
  },
  {
    id: 'R4',
    name: 'Baume de Karité Médicinal',
    type: 'natural',
    description: 'Soin dermatologique naturel pour irritations cutanées, eczéma léger et cicatrisation.',
    author: 'Coopérative Femmes du Nord',
    image: 'https://images.unsplash.com/photo-1608571423902-eed4a5ad8108?w=400&h=300&fit=crop',
    rating: 4.8,
    category: 'Dermatologie',
    address: 'Coopérative de Maroua',
    origin: 'Savoir-faire des femmes du Nord-Cameroun',
    ingredients: ['Beurre de Karité brut', 'Huile essentielle de Tea Tree', 'Aloe Vera frais', 'Cire d\'abeille'],
    preparation: [
      'Faire fondre le beurre de Karité au bain-marie.',
      'Incorporer le gel d\'Aloe Vera et mélanger vigoureusement.',
      'Ajouter 5 gouttes d\'huile essentielle de Tea Tree.',
      'Verser dans un pot propre et laisser solidifier.'
    ],
    posologie: 'Appliquer sur la zone concernée 2 fois par jour.',
    contraindications: ['Allergie au karité ou au Tea Tree', 'Plaies ouvertes profondes'],
    price: 4500
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
    specialties: ['Pédiatrie', 'Dermatologie', 'Médecine Générale', 'Gynécologie'],
    services: [
      { id: 'c1s1', name: 'Consultation Générale', price: 5000, category: 'Consultation' },
      { id: 'c1s2', name: 'Consultation Pédiatrique', price: 7500, category: 'Consultation' },
      { id: 'c1s3', name: 'Vaccination', price: 5000, category: 'Soin' },
      { id: 'c1s4', name: 'Échographie', price: 20000, category: 'Imagerie' },
      { id: 'c1s5', name: 'Bilan Prénatal', price: 15000, category: 'Consultation' }
    ],
    phone: '+237 233 42 18 90',
    hours: 'Lun-Sam 07:00-20:00',
    acceptsCNAM: true,
    acceptedInsurances: ['CNAM', 'Activa', 'Saar Assurances'],
    appointmentEnabled: true,
    doctors: [
      { name: 'Dr. Nkoulou Marie', specialty: 'Pédiatrie', days: 'Lun, Mer, Ven', languages: ['Français', 'Anglais'] },
      { name: 'Dr. Fotso Jean', specialty: 'Dermatologie', days: 'Mar, Jeu, Sam', languages: ['Français'] },
      { name: 'Dr. Mbarga Alice', specialty: 'Gynécologie', days: 'Lun-Ven', languages: ['Français', 'Anglais', 'Ewondo'] },
    ],
  },
  {
    id: 'C2',
    name: 'Polyclinique du Plateau',
    type: 'clinic',
    address: 'Avenue Charles de Gaulle, Plateau, Yaoundé',
    distance: '1.5 km',
    rating: 4.7,
    isOpen: true,
    isDuty: false,
    image: 'https://images.unsplash.com/photo-1519494026892-80bbd2d6fd0d?w=400&h=300&fit=crop',
    specialties: ['Cardiologie', 'Ophtalmologie', 'ORL', 'Médecine Interne'],
    services: [
      { id: 'c2s1', name: 'Consultation Cardiologie', price: 15000, category: 'Consultation' },
      { id: 'c2s2', name: 'ECG & Holter', price: 25000, category: 'Examen' },
      { id: 'c2s3', name: 'Fond d\'Œil', price: 10000, category: 'Examen' },
      { id: 'c2s4', name: 'Audiogramme', price: 12000, category: 'Examen' }
    ],
    phone: '+237 222 23 45 67',
    hours: 'Lun-Ven 08:00-18:00 / Sam 08:00-13:00',
    acceptsCNAM: true,
    acceptedInsurances: ['CNAM', 'Allianz', 'Activa'],
    appointmentEnabled: true,
    doctors: [
      { name: 'Dr. Tchinda Paul', specialty: 'Cardiologie', days: 'Lun, Mer, Ven', languages: ['Français', 'Anglais'] },
      { name: 'Dr. Essomba Ruth', specialty: 'Ophtalmologie', days: 'Mar, Jeu', languages: ['Français'] },
      { name: 'Dr. Nguemo Samuel', specialty: 'ORL', days: 'Lun-Ven', languages: ['Français', 'Pidgin'] },
    ],
  }
];

export function Directory() {
  const { addOrder } = useOrders();
  const { user, profile } = useAuth();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const [activeCategory, setActiveCategory] = useState<'all' | 'hospital' | 'clinic' | 'laboratory' | 'pharmacy' | 'natural'>('all');
  const [view, setView] = useState<'list' | 'pharmacy-catalog' | 'lab-catalog' | 'clinic-catalog' | 'hospital-catalog' | 'natural-catalog' | 'prescriptions' | 'results' | 'order-confirmation'>('list');
  const [selectedActor, setSelectedActor] = useState<DirectoryActor | null>(null);
  const [search, setSearch] = useState(searchParams.get('search') || '');
  const [onlyDuty, setOnlyDuty] = useState(false);
  const [activeRouteActor, setActiveRouteActor] = useState<DirectoryActor | null>(null);
  const [cartPharmacyId, setCartPharmacyId] = useState<string | null>(null);
  const [cartPharmacyName, setCartPharmacyName] = useState<string>('');
  const [deliveryMode, setDeliveryMode] = useState<'pickup' | 'delivery'>('pickup');
  const [lastOrderId, setLastOrderId] = useState<string>('');
  const [lastOrderTotal, setLastOrderTotal] = useState(0);
  const [checkoutError, setCheckoutError] = useState<string | null>(null);
  
  useEffect(() => {
    const q = searchParams.get('search');
    if (q) {
      setSearch(q);
      setSearchParams({}, { replace: true });
    }
  }, [searchParams, setSearchParams]);

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
          stock: data.stock || 0,
          pharmacistId: data.pharmacistId || ''
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
            meds: [],
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
      const filtered = dbMeds.filter((med: any) => med.pharmacistId === actor.id);
      if (filtered.length > 0) {
        return filtered;
      }
      // If it's a real database actor (from Firestore), but has 0 real meds, return empty
      const isDbActor = dbActors.some(dba => dba.id === actor.id);
      if (isDbActor) {
        return [];
      }
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
    const s = search.toLowerCase();
    const matchesSearch = !s ||
      actor.name.toLowerCase().includes(s) ||
      actor.address.toLowerCase().includes(s) ||
      (actor.type === 'pharmacy' && getActorMeds(actor).some(
        m => m.name.toLowerCase().includes(s) || m.dci.toLowerCase().includes(s)
      ));
    const matchesDuty = !onlyDuty || actor.isDuty === true;
    return matchesCat && matchesSearch && matchesDuty;
  });

  const medicationSearchResults = search.length >= 2 ? (() => {
    const s = search.toLowerCase();
    const results: { med: Medication; pharmacy: DirectoryActor }[] = [];
    for (const actor of allActors) {
      if (actor.type !== 'pharmacy') continue;
      const meds = getActorMeds(actor);
      for (const med of meds) {
        if ((med.name.toLowerCase().includes(s) || med.dci.toLowerCase().includes(s)) && med.available) {
          results.push({ med, pharmacy: actor });
        }
      }
    }
    return results;
  })() : [];

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

  const addToCart = (item: {id: string, name: string, price: number, image?: string, requiresPrescription?: boolean}, pharmacyId?: string, pharmacyName?: string) => {
    if (pharmacyId && cartPharmacyId && cartPharmacyId !== pharmacyId && cart.length > 0) {
      if (!window.confirm(`Votre panier contient des articles de "${cartPharmacyName}". Voulez-vous vider le panier et commander chez "${pharmacyName}" ?`)) {
        return;
      }
      setCart([]);
    }
    if (pharmacyId) {
      setCartPharmacyId(pharmacyId);
      setCartPharmacyName(pharmacyName || '');
    }
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

  const handleCheckout = async (paymentMethod: string) => {
    setCheckoutError(null);
    const total = cart.reduce((sum, item) => sum + item.price * item.count, 0);
    try {
      const orderId = await addOrder({
        items: cart,
        total,
        paymentMethod,
        mode: deliveryMode,
        pharmacistId: cartPharmacyId || selectedActor?.id
      });
      setLastOrderId(orderId);
      setLastOrderTotal(total);
      setCart([]);
      setCartPharmacyId(null);
      setCartPharmacyName('');
      setIsCartOpen(false);
      setView('order-confirmation');
    } catch (err: any) {
      setCheckoutError(err.message || 'Erreur lors de la commande. Veuillez réessayer.');
    }
  };

  return (
    <PageContainer>
      <PageHeader
        eyebrow="Cameroun"
        title="Répertoire Santé"
        subtitle="Pharmacies, hôpitaux, cliniques et laboratoires près de chez vous."
        actions={
          <>
            <Button icon={<Camera size={14} />} onClick={() => setView('prescriptions')}>
              Ordonnance
            </Button>
            <button
              onClick={() => setIsCartOpen(true)}
              aria-label={`Ouvrir le panier (${cart.length} article${cart.length > 1 ? 's' : ''})`}
              className="relative bg-white p-3 rounded-xl md:rounded-2xl border border-slate-200 text-slate-600 hover:bg-slate-50 shadow-sm transition-all active:scale-95"
            >
              <ShoppingCart size={18} />
              {cart.length > 0 && (
                <span className="absolute -top-1 -right-1 bg-red-600 text-white text-[9px] min-w-4.5 h-4.5 px-1 flex items-center justify-center rounded-full font-bold ring-2 ring-white">
                  {cart.length}
                </span>
              )}
            </button>
          </>
        }
      />

      {/* Search & category filters */}
      <Card size="sm" className="space-y-3">
        <div className="relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
          <input
            type="text"
            aria-label="Rechercher un établissement ou un médicament"
            placeholder="Rechercher un médicament, une pharmacie, un hôpital..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-slate-50 border border-slate-200 rounded-xl md:rounded-2xl py-2.5 pl-11 pr-4 text-xs md:text-sm font-medium text-slate-900 placeholder:text-slate-400 outline-none transition-colors focus:border-brand-600 focus:bg-white focus:ring-2 focus:ring-brand-600/10"
          />
        </div>

        <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar pb-1">
          <CategoryTab active={activeCategory === 'all'} onClick={() => setActiveCategory('all')} icon={<Building2 size={12} />} label="Tous" />
          <div className="w-px h-6 bg-slate-200 mx-1 shrink-0" />

          {/* Garde / On-Duty toggle button */}
          <button
            onClick={() => setOnlyDuty(!onlyDuty)}
            aria-pressed={onlyDuty}
            className={cn(
              "flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[11px] font-bold transition-all whitespace-nowrap border shrink-0",
              onlyDuty
                ? "bg-white text-red-600 border-red-500 font-extrabold"
                : "bg-white text-slate-500 border-slate-200 hover:bg-slate-50"
            )}
          >
            <Clock size={12} className={cn(onlyDuty && "animate-pulse")} />
            <span>Garde 24h/24</span>
          </button>

          <div className="w-px h-6 bg-slate-200 mx-1 shrink-0" />
          <CategoryTab active={activeCategory === 'pharmacy'} onClick={() => setActiveCategory('pharmacy')} icon={<Pill size={12} />} label="Pharmacies" />
          <CategoryTab active={activeCategory === 'hospital'} onClick={() => setActiveCategory('hospital')} icon={<Hospital size={12} />} label="Hôpitaux" />
          <CategoryTab active={activeCategory === 'clinic'} onClick={() => setActiveCategory('clinic')} icon={<Building2 size={12} />} label="Cliniques" />
          <CategoryTab active={activeCategory === 'laboratory'} onClick={() => setActiveCategory('laboratory')} icon={<Microscope size={12} />} label="Labs" />
          <CategoryTab active={activeCategory === 'natural'} onClick={() => setActiveCategory('natural')} icon={<Leaf size={12} />} label="Médecine Bio" />
        </div>
      </Card>

      <AnimatePresence mode="wait">
        {view === 'order-confirmation' && (
          <motion.div
            key="order-confirmation"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0 }}
            className="flex flex-col items-center justify-center py-12 space-y-6"
          >
            <div className="w-20 h-20 bg-emerald-100 rounded-full flex items-center justify-center">
              <CheckCircle2 className="text-emerald-600" size={40} />
            </div>
            <div className="text-center space-y-2">
              <h2 className="text-2xl font-display font-bold text-slate-900">Commande confirmée !</h2>
              <p className="text-slate-500 text-sm max-w-md">
                Votre commande <span className="font-bold text-slate-700">#{lastOrderId.slice(0, 8)}</span> de{' '}
                <span className="font-bold text-emerald-600">{lastOrderTotal.toLocaleString()} FCFA</span> a été envoyée au pharmacien.
              </p>
              <p className="text-slate-400 text-xs">
                {deliveryMode === 'delivery' ? 'Livraison à domicile' : 'Retrait en pharmacie'} — Vous serez notifié dès que votre commande est validée.
              </p>
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => setView('list')}
                className="px-6 py-3 bg-white border border-slate-200 text-slate-700 rounded-xl font-bold text-sm hover:bg-slate-50 transition-colors"
              >
                Continuer mes achats
              </button>
              <button
                onClick={() => navigate('/orders')}
                className="px-6 py-3 bg-emerald-600 text-white rounded-xl font-bold text-sm hover:bg-emerald-700 transition-colors flex items-center gap-2"
              >
                Voir mes commandes
                <ArrowRight size={16} />
              </button>
            </div>
          </motion.div>
        )}

        {view === 'list' && (
          <motion.div
            key="list"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="space-y-6"
          >
            {medicationSearchResults.length > 0 && (
              <div className="space-y-3">
                <h3 className="text-sm font-bold text-slate-700 flex items-center gap-2">
                  <Pill size={14} className="text-emerald-600" />
                  Médicaments trouvés dans {new Set(medicationSearchResults.map(r => r.pharmacy.id)).size} pharmacie(s)
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                  {medicationSearchResults.slice(0, 9).map(({ med, pharmacy }) => (
                    <div key={`${med.id}-${pharmacy.id}`} className="bg-white border border-slate-100 rounded-2xl p-4 flex gap-3 items-center shadow-sm hover:shadow-md transition-shadow">
                      <div className="w-12 h-12 bg-slate-50 rounded-xl overflow-hidden shrink-0 border border-slate-100">
                        <img src={med.image} alt={med.name} className="w-full h-full object-cover" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-bold text-slate-900 truncate">{med.name}</p>
                        <p className="text-[10px] text-slate-400">{med.dci} — {pharmacy.name}</p>
                        <div className="flex items-center justify-between mt-1">
                          <span className="text-xs font-bold text-emerald-600">{med.price.toLocaleString()} FCFA</span>
                          <button
                            onClick={() => addToCart(med, pharmacy.id, pharmacy.name)}
                            className="w-7 h-7 bg-emerald-600 text-white rounded-lg flex items-center justify-center hover:bg-emerald-700 transition-colors"
                          >
                            <Plus size={14} />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
                {medicationSearchResults.length > 9 && (
                  <p className="text-xs text-slate-400 text-center">
                    et {medicationSearchResults.length - 9} autres résultats...
                  </p>
                )}
                <div className="h-px bg-slate-200" />
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredActors.map(actor => (
                <ActorCard key={actor.id} actor={actor} onClick={() => handleActorClick(actor)} />
              ))}
            </div>
            {filteredActors.length === 0 && medicationSearchResults.length === 0 && (
              <div className="flex flex-col items-center justify-center py-16 text-slate-400 space-y-3">
                <Search size={32} />
                <p className="font-medium text-sm">Aucun résultat pour "{search}"</p>
              </div>
            )}
          </motion.div>
        )}

        {(view === 'clinic-catalog' || view === 'hospital-catalog' || view === 'lab-catalog') && selectedActor && (
          <motion.div 
            key={`${selectedActor.type}-catalog`}
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            className="space-y-4"
          >
            <button onClick={() => setView('list')} className="text-emerald-600 font-bold flex items-center gap-1 mb-2 hover:translate-x-[-2px] transition-transform text-xs">
              <ChevronRight className="rotate-180" size={16} /> Retour au répertoire
            </button>
            
            <div className="bg-white p-4 rounded-xl border border-slate-200 flex flex-col md:flex-row gap-4 items-center md:items-start relative overflow-hidden">
               <img src={selectedActor.image} className="w-16 h-16 md:w-24 md:h-24 rounded-xl object-cover" />
               <div className="flex-1 space-y-2 text-center md:text-left">
                  <div className="flex flex-wrap gap-1.5 justify-center md:justify-start">
                     <span className="bg-white border border-slate-200 text-slate-500 px-2 py-0.5 rounded-md text-[9px] font-bold uppercase tracking-wider">{selectedActor.type}</span>
                     {selectedActor.isOpen ? (
                       <span className="bg-white border border-emerald-500 text-emerald-700 px-2 py-0.5 rounded-md text-[9px] font-bold uppercase tracking-wider">Ouvert</span>
                     ) : (
                       <span className="bg-white border border-red-500 text-red-700 px-2 py-0.5 rounded-md text-[9px] font-bold uppercase tracking-wider">Fermé</span>
                     )}
                  </div>
                  <h2 className="text-lg md:text-xl font-display font-bold text-slate-900 leading-tight">{selectedActor.name}</h2>
                  <div className="flex flex-col md:flex-row md:items-center gap-1 md:gap-3 text-slate-400 text-[10px] md:text-xs">
                     <p className="flex items-center justify-center md:justify-start gap-1"><MapPin size={12} /> {selectedActor.address}</p>
                     <p className="flex items-center justify-center md:justify-start gap-1 md:border-l md:pl-3"><StarIcon size={12} className="text-orange-400 fill-current" /> {selectedActor.rating}</p>
                  </div>
                  <div className="flex gap-2 flex-wrap justify-center md:justify-start pt-1">
                     <button className="bg-emerald-600 hover:bg-emerald-700 text-white px-3 py-1.5 rounded-lg font-bold flex items-center gap-1.5 text-xs">
                        <PhoneCall size={12} /> Appeler
                     </button>
                     <button 
                       onClick={() => setActiveRouteActor(selectedActor)}
                       className="bg-white border border-slate-200 text-slate-700 px-3 py-1.5 rounded-lg font-bold flex items-center gap-1.5 hover:bg-slate-50 text-xs"
                     >
                        <MapPin size={12} /> Itinéraire
                     </button>
                  </div>
               </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
               <div className="lg:col-span-2 space-y-6">
                  {/* Doctors list (clinic-specific per spec: Fiche médecin individuel) */}
                  {selectedActor.type === 'clinic' && selectedActor.doctors && selectedActor.doctors.length > 0 && (
                    <div className="space-y-3">
                      <h3 className="text-sm font-display font-bold text-slate-900 px-1 flex items-center gap-2">
                        <Stethoscope size={14} className="text-blue-600" /> Équipe Médicale
                      </h3>
                      <div className="space-y-2">
                        {selectedActor.doctors.map((doc, idx) => (
                          <div key={idx} className="bg-white p-4 rounded-xl border border-slate-200 flex items-center justify-between gap-4">
                            <div className="flex items-center gap-3 min-w-0">
                              <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center text-blue-600 shrink-0">
                                <User size={16} />
                              </div>
                              <div className="min-w-0">
                                <p className="text-xs font-bold text-slate-900 truncate">{doc.name}</p>
                                <p className="text-[10px] text-blue-600 font-bold uppercase tracking-wider">{doc.specialty}</p>
                              </div>
                            </div>
                            <div className="text-right shrink-0">
                              <p className="text-[10px] text-slate-400 font-medium">{doc.days}</p>
                              {doc.languages && (
                                <p className="text-[9px] text-slate-400 mt-0.5">{doc.languages.join(' · ')}</p>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Services & Prestations */}
                  <div className="space-y-3">
                    <h3 className="text-sm font-display font-bold text-slate-900 px-1">Services & Prestations</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                       {selectedActor.services?.map(service => (
                         <div key={service.id} className="bg-white p-4 rounded-xl border border-slate-200 group">
                            <p className="text-[9px] font-bold text-emerald-600 uppercase tracking-widest mb-1">{service.category}</p>
                            <h4 className="text-xs font-bold text-slate-900 mb-3">{service.name}</h4>
                            <div className="flex items-center justify-between">
                               <p className="text-sm font-display font-bold text-slate-900">{service.price.toLocaleString()} FCFA</p>
                               <button
                                 onClick={() => addToCart(service, selectedActor?.id, selectedActor?.name)}
                                 className="bg-emerald-600 hover:bg-emerald-700 text-white p-2 rounded-lg transition-colors"
                               >
                                  <Plus size={16} />
                               </button>
                            </div>
                         </div>
                       ))}
                    </div>
                  </div>
               </div>

               <div className="space-y-4">
                  {/* CNAM & Insurance (per spec: Filtre "accepte ma mutuelle") */}
                  {selectedActor.acceptsCNAM && (
                    <div className="bg-blue-50 p-4 rounded-xl border border-blue-100 space-y-3">
                      <div className="flex items-center gap-2 text-blue-700">
                        <ShieldCheck size={16} />
                        <h4 className="text-xs font-bold uppercase tracking-wider">Conventionné CNAM</h4>
                      </div>
                      {selectedActor.acceptedInsurances && (
                        <div className="flex flex-wrap gap-1.5">
                          {selectedActor.acceptedInsurances.map(ins => (
                            <span key={ins} className="bg-white text-blue-700 border border-blue-200 px-2 py-0.5 rounded-md text-[10px] font-bold">
                              {ins}
                            </span>
                          ))}
                        </div>
                      )}
                      <p className="text-[10px] text-blue-600">Prise en charge directe possible selon votre couverture.</p>
                    </div>
                  )}

                  {/* Appointment Booking */}
                  <div className="bg-white text-slate-800 p-5 rounded-xl border border-slate-200 space-y-4">
                     <h3 className="text-sm font-display font-bold text-slate-900">Planifiez votre visite</h3>
                     <p className="text-xs text-slate-400">Gagnez du temps en pré-payant vos actes ou en réservant un créneau.</p>
                     <div className="space-y-3">
                        {selectedActor.hours && (
                          <div className="flex items-center gap-2.5 bg-slate-50 p-3 rounded-lg border border-slate-200">
                            <Clock size={16} className="text-emerald-600 shrink-0" />
                            <div>
                              <p className="text-[9px] font-bold uppercase text-slate-400">Horaires</p>
                              <p className="text-xs font-semibold text-slate-700">{selectedActor.hours}</p>
                            </div>
                          </div>
                        )}
                        <div className="flex items-center gap-2.5 bg-slate-50 p-3 rounded-lg border border-slate-200">
                           <Calendar className="text-emerald-600 shrink-0" size={16} />
                           <div>
                              <p className="text-[9px] font-bold uppercase text-slate-400">Prochain créneau</p>
                              <p className="text-xs font-semibold text-slate-700">Demain, 09:30</p>
                           </div>
                        </div>
                        {selectedActor.appointmentEnabled && (
                          <button className="w-full bg-emerald-600 text-white py-2.5 rounded-lg text-xs font-bold transition-all hover:bg-emerald-700">
                             Prendre Rendez-vous
                          </button>
                        )}
                     </div>
                  </div>

                  {selectedActor.specialties && (
                    <div className="bg-white p-5 rounded-xl border border-slate-200">
                       <h3 className="text-sm font-display font-bold text-slate-900 mb-4">Plateau Technique</h3>
                       <div className="space-y-2">
                          {selectedActor.specialties.map(spec => (
                            <div key={spec} className="flex items-center justify-between p-2.5 bg-white border border-slate-200 rounded-lg text-xs font-medium text-slate-700">
                               {spec}
                               <ShieldCheck size={14} className="text-emerald-600" />
                            </div>
                          ))}
                       </div>
                    </div>
                  )}

                  {/* Contact */}
                  {selectedActor.phone && (
                    <div className="bg-white p-4 rounded-xl border border-slate-200">
                      <div className="flex items-center gap-2.5">
                        <PhoneCall size={14} className="text-slate-400" />
                        <span className="text-xs font-mono font-bold text-slate-700">{selectedActor.phone}</span>
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
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-4"
          >
            <button onClick={() => setView('list')} className="text-emerald-600 font-bold flex items-center gap-1 mb-2 hover:translate-x-[-2px] transition-transform text-xs">
              <ChevronRight className="rotate-180" size={16} /> Retour au répertoire
            </button>
            
            <div className="bg-white rounded-xl border border-slate-200 p-5 flex flex-col md:flex-row gap-5 items-center">
               <img src={selectedActor.image} className="w-16 h-16 md:w-24 md:h-24 rounded-xl object-cover" />
               <div className="flex-1 space-y-2 text-center md:text-left">
                  <div className="inline-flex items-center gap-1 bg-white border border-emerald-500 text-emerald-700 px-2 py-0.5 rounded-md text-[9px] font-bold uppercase tracking-wider">
                     <Leaf size={12} />
                     Patrimoine Naturel
                  </div>
                  <h2 className="text-lg md:text-xl font-display font-bold text-slate-900 leading-tight">{selectedActor.name}</h2>
                  <p className="text-slate-500 text-xs leading-relaxed">{selectedActor.description}</p>
                  <div className="flex items-center justify-center md:justify-start gap-4 pt-1">
                     <div className="flex items-center gap-1.5">
                        <div className="w-6 h-6 rounded-md bg-white border border-slate-200 flex items-center justify-center font-bold text-slate-700 text-xs">
                           {selectedActor.author?.[0]}
                        </div>
                        <div className="text-left text-[10px]">
                           <p className="text-slate-400 uppercase font-bold tracking-wider">Auteur</p>
                           <p className="text-slate-700 font-bold">{selectedActor.author}</p>
                        </div>
                     </div>
                     <div className="h-4 w-px bg-slate-200" />
                     <div className="text-left">
                        <p className="text-slate-400 text-[10px] uppercase font-bold tracking-wider">Catégorie</p>
                        <p className="text-slate-700 font-bold text-xs">{selectedActor.category}</p>
                     </div>
                  </div>
               </div>
            </div>

            <div className="bg-white p-5 rounded-xl border border-slate-200 space-y-6">
               <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                     <div>
                        <h3 className="text-xs font-display font-bold text-slate-900 mb-3 uppercase tracking-wider">Ingrédients requis</h3>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                           {selectedActor.ingredients?.map(ing => (
                             <div key={ing} className="flex items-center gap-2 p-2.5 bg-white rounded-lg text-xs font-medium text-slate-700 border border-slate-200">
                                <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full shrink-0" />
                                {ing}
                             </div>
                           ))}
                        </div>
                     </div>

                     <div>
                        <h3 className="text-xs font-display font-bold text-slate-900 mb-3 uppercase tracking-wider">Méthode de préparation</h3>
                        <div className="space-y-3">
                           {selectedActor.preparation?.map((step, idx) => (
                             <div key={idx} className="flex gap-3">
                                <span className="flex-shrink-0 w-6 h-6 rounded-full bg-white border border-slate-300 text-slate-700 flex items-center justify-center font-bold text-xs">{idx + 1}</span>
                                <p className="text-slate-500 text-xs leading-relaxed pt-0.5">{step}</p>
                             </div>
                           ))}
                        </div>
                     </div>
                  </div>

                  <div className="space-y-4">
                     {/* Origin badge */}
                     {selectedActor.origin && (
                       <div className="bg-amber-50 p-3 rounded-xl border border-amber-100 flex items-start gap-2">
                         <Leaf size={14} className="text-amber-600 shrink-0 mt-0.5" />
                         <div>
                           <p className="text-[9px] font-bold text-amber-600 uppercase tracking-wider">Origine</p>
                           <p className="text-xs font-medium text-amber-800">{selectedActor.origin}</p>
                         </div>
                       </div>
                     )}

                     <div className="bg-white p-4 rounded-xl border border-emerald-500 space-y-4">
                        <div className="flex items-center gap-2 text-emerald-900">
                           <ShieldCheck size={16} className="text-emerald-600" />
                           <h4 className="text-xs font-display font-bold uppercase tracking-wider">Posologie & Conseils</h4>
                        </div>
                        <p className="text-emerald-800 text-xs font-medium bg-white p-3 rounded-lg border border-emerald-100">
                           {selectedActor.posologie}
                        </p>
                        <ul className="space-y-2">
                           {['Respecter les dosages recommandés', 'Conserver à l\'abri de la lumière', 'Consulter un médecin si les symptômes persistent'].map(text => (
                             <li key={text} className="flex items-center gap-2 text-xs text-emerald-700">
                                <div className="w-1 h-1 bg-emerald-400 rounded-full" />
                                {text}
                             </li>
                           ))}
                        </ul>
                     </div>

                     {/* Contraindications */}
                     {selectedActor.contraindications && selectedActor.contraindications.length > 0 && (
                       <div className="bg-red-50 p-4 rounded-xl border border-red-100 space-y-3">
                         <div className="flex items-center gap-2 text-red-700">
                           <AlertTriangle size={14} />
                           <h4 className="text-xs font-bold uppercase tracking-wider">Contre-indications</h4>
                         </div>
                         <ul className="space-y-1.5">
                           {selectedActor.contraindications.map(ci => (
                             <li key={ci} className="flex items-center gap-2 text-xs text-red-600 font-medium">
                               <X size={10} className="shrink-0" /> {ci}
                             </li>
                           ))}
                         </ul>
                       </div>
                     )}

                     <div className="bg-white p-4 rounded-xl border border-slate-200 space-y-4">
                        <div className="flex justify-between items-end">
                           <div>
                              <p className="text-slate-400 text-[9px] font-bold uppercase tracking-wider mb-0.5">Pack complet</p>
                              <p className="text-sm font-display font-bold text-slate-900">{selectedActor.price?.toLocaleString()} FCFA</p>
                           </div>
                           <div className="text-right">
                              <p className="text-emerald-600 text-[9px] font-bold uppercase tracking-wider">Disponibilité</p>
                              <p className="text-slate-700 text-xs font-bold">En stock</p>
                           </div>
                        </div>
                        <button 
                          onClick={() => {
                            addToCart({
                              id: selectedActor.id + '_pack',
                              name: 'Pack: ' + selectedActor.name,
                              price: selectedActor.price || 0,
                            }, selectedActor.id, selectedActor.name);
                            setIsCartOpen(true);
                          }}
                          className="w-full bg-emerald-600 text-white font-bold py-2 rounded-lg text-xs transition-all hover:bg-emerald-700 flex items-center justify-center gap-1.5"
                        >
                           <ShoppingCart size={14} />
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
            initial={{ opacity: 0, x: 15 }}
            animate={{ opacity: 1, x: 0 }}
            className="space-y-4"
          >
            <button onClick={() => setView('list')} className="text-emerald-600 font-bold flex items-center gap-1 mb-2 hover:translate-x-[-2px] transition-transform text-xs">
              <ChevronRight className="rotate-180" size={16} /> Retour au répertoire
            </button>
            <div className="bg-white p-4 rounded-xl border border-slate-200 flex flex-col sm:flex-row justify-between sm:items-center gap-4 shadow-none">
              <div className="flex gap-4 items-center">
                <img src={selectedActor.image} className="w-14 h-14 rounded-lg object-cover" />
                <div>
                  <h2 className="text-base font-display font-bold text-slate-900">{selectedActor.name}</h2>
                  <p className="text-slate-400 text-xs">{selectedActor.address} • <span className="text-emerald-600 font-bold">{selectedActor.distance}</span></p>
                </div>
              </div>
              <button 
                onClick={() => setActiveRouteActor(selectedActor)}
                className="bg-white text-slate-800 border border-slate-200 hover:bg-slate-50 px-3 py-1.5 rounded-lg font-bold text-xs flex items-center justify-center gap-1.5 transition-all self-start sm:self-auto shrink-0"
              >
                <MapPin size={12} /> Itinéraire à pied
              </button>
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Left Side: Medicines Catalog */}
              <div className="lg:col-span-2 space-y-4">
                <div className="flex items-center justify-between px-1">
                  <h3 className="text-sm font-bold font-display text-slate-800">Médicaments Disponibles</h3>
                  <span className="text-xs text-slate-400 font-bold">{getActorMeds(selectedActor).length} références</span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {getActorMeds(selectedActor).map(med => (
                    <div key={med.id} className="bg-white p-4 rounded-xl border border-slate-200 flex flex-col justify-between h-full">
                      <div>
                        <img src={med.image} className="w-full h-24 object-cover rounded-lg mb-3" />
                        <div className="flex justify-between items-start gap-2 mb-1">
                          <h4 className="font-bold text-slate-800 text-xs">{med.name}</h4>
                          {med.requiresPrescription && (
                            <span className="bg-white border border-red-300 text-red-600 text-[8px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded shrink-0">
                              Ordonnance
                            </span>
                          )}
                        </div>
                        <p className="text-[10px] text-slate-400">{med.dci}</p>
                        <span className="text-[9px] text-slate-400 font-bold block mt-1">Stock: {med.stock !== undefined ? `${med.stock} restants` : 'En stock'}</span>
                      </div>
                      <div className="mt-3 flex items-center justify-between">
                        <span className="font-bold text-emerald-600 text-xs">{med.price.toLocaleString()} FCFA</span>
                        <button 
                          disabled={med.stock !== undefined && med.stock <= 0}
                          onClick={() => addToCart(med, selectedActor?.id, selectedActor?.name)}
                          className="w-8 h-8 bg-emerald-600 text-white rounded-lg flex items-center justify-center hover:bg-emerald-700 transition-colors disabled:bg-slate-200 disabled:text-slate-400 disabled:cursor-not-allowed"
                        >
                          <Plus size={16} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Right Side: Fiche Technique / Establishment Info */}
              <div className="space-y-4">
                <div className="bg-white p-5 rounded-xl border border-slate-200 space-y-4">
                  <div>
                    <h3 className="text-xs font-display font-bold text-slate-900 flex items-center gap-1.5 uppercase tracking-wider">
                      <ShieldCheck className="text-emerald-600" size={16} />
                      {profile?.role !== 'patient' ? "Fiche Technique Officielle" : "Informations Pratiques"}
                    </h3>
                    <p className="text-[10px] text-slate-400 mt-0.5">
                      {profile?.role !== 'patient' ? "Données certifiées et vérifiées par la plateforme Care" : "Horaires et coordonnées de l'établissement"}
                    </p>
                  </div>

                  {profile?.role !== 'patient' && (
                    <>
                      {/* Responsable & ID */}
                      <div className="space-y-3 pt-3 border-t border-slate-100">
                        <div>
                          <p className="text-[9px] text-slate-400 font-bold uppercase tracking-wider">Pharmacien Titulaire / Responsable</p>
                          <p className="text-xs font-bold text-slate-800 mt-0.5">Dr. {selectedActor.pharmacistName || 'Pharmacien Agréé'}</p>
                        </div>

                        <div className="grid grid-cols-2 gap-3">
                          <div>
                            <p className="text-[9px] text-slate-400 font-bold uppercase tracking-wider">N° Inscription ONPC</p>
                            <p className="text-[10px] font-mono font-bold text-slate-700 bg-white px-2 py-1 rounded-lg border border-slate-200 mt-1 truncate" title={selectedActor.onpcNumber || 'ONPC-3891-CM'}>
                              {selectedActor.onpcNumber || 'ONPC-3891-CM'}
                            </p>
                          </div>
                          <div>
                            <p className="text-[9px] text-slate-400 font-bold uppercase tracking-wider">Arrêté de Création</p>
                            <p className="text-[10px] font-mono font-bold text-slate-700 bg-white px-2 py-1 rounded-lg border border-slate-200 mt-1 truncate" title={selectedActor.legalLicenseNumber || 'ARR-1024-MINSANTE'}>
                              {selectedActor.legalLicenseNumber || 'ARR-1024-MINSANTE'}
                            </p>
                          </div>
                        </div>

                        <div>
                          <p className="text-[9px] text-slate-400 font-bold uppercase tracking-wider">Équipe Diplômée</p>
                          <p className="text-[10px] font-medium text-slate-600 flex items-center gap-1.5 mt-1">
                            <Users size={12} className="text-slate-400" />
                            {selectedActor.pharmacistsCount || 2} Pharmaciens adjoints diplômés d'État
                          </p>
                        </div>
                      </div>

                      {/* Technical & Storage Checklist */}
                      <div className="space-y-3 pt-3 border-t border-slate-100">
                        <h4 className="text-[9px] text-slate-400 font-bold uppercase tracking-wider">Normes de Conservation & Sécurité</h4>
                        
                        <div className="space-y-1.5">
                          <div className="flex justify-between items-center text-[10px] p-2 bg-white rounded-lg border border-slate-200">
                            <span className="text-slate-600 font-medium">Conservation Chaîne du Froid</span>
                            <span className="text-[9px] font-bold uppercase text-emerald-700 bg-white border border-emerald-500 px-2 py-0.5 rounded-md">
                              {selectedActor.coldChainEquipment === 'medical_fridge' ? 'Réfrigérateur Médical' : 
                               selectedActor.coldChainEquipment === 'electric_fridge' ? 'Réfrigérateur Électrique' : 
                               selectedActor.coldChainEquipment === 'isothermic' ? 'Système Isotherme' : 'Réfrigérateur Médical'}
                            </span>
                          </div>

                          <div className="flex justify-between items-center text-[10px] p-2 bg-white rounded-lg border border-slate-200">
                            <span className="text-slate-600 font-medium">Alimentation de Secours</span>
                            <span className="text-[9px] font-bold uppercase text-emerald-700 bg-white border border-emerald-500 px-2 py-0.5 rounded-md">
                              {selectedActor.backupGenerator === 'automated' ? 'Générateur Automatique' : 
                               selectedActor.backupGenerator === 'manual' ? 'Générateur Manuel' : 
                               selectedActor.backupGenerator === 'none' ? 'Aucun' : 'Générateur Automatique'}
                            </span>
                          </div>

                          <div className="grid grid-cols-2 gap-1.5">
                            <div className="flex items-center justify-between p-2 bg-white rounded-lg border border-slate-200 text-[10px] font-medium text-slate-600">
                              <span>Suivi Température</span>
                              {selectedActor.temperatureMonitor !== false ? <Check size={12} className="text-emerald-500 shrink-0" /> : <X size={12} className="text-red-500 shrink-0" />}
                            </div>
                            <div className="flex items-center justify-between p-2 bg-white rounded-lg border border-slate-200 text-[10px] font-medium text-slate-600">
                              <span>Climatisation</span>
                              {selectedActor.airConditioned !== false ? <Check size={12} className="text-emerald-500 shrink-0" /> : <X size={12} className="text-red-500 shrink-0" />}
                            </div>
                            <div className="flex items-center justify-between p-2 bg-white rounded-lg border border-slate-200 text-[10px] font-medium text-slate-600">
                              <span>Coffre Stupéfiants</span>
                              {selectedActor.narcoticsSafe !== false ? <Check size={12} className="text-emerald-500 shrink-0" /> : <X size={12} className="text-red-500 shrink-0" />}
                            </div>
                            <div className="flex items-center justify-between p-2 bg-white rounded-lg border border-slate-200 text-[10px] font-medium text-slate-600">
                              <span>Tri Déchets Santé</span>
                              {selectedActor.wasteProtocol !== false ? <Check size={12} className="text-emerald-500 shrink-0" /> : <X size={12} className="text-red-500 shrink-0" />}
                            </div>
                          </div>
                        </div>
                      </div>
                    </>
                  )}

                  {/* Contact section */}
                  <div className="space-y-3 pt-3 border-t border-slate-100 text-[11px] text-slate-600">
                    <h4 className="text-[9px] text-slate-400 font-bold uppercase tracking-wider">Coordonnées de l'Officine</h4>
                    <div className="space-y-1.5">
                      <div className="flex items-center gap-2">
                        <Clock size={12} className="text-slate-400 shrink-0" />
                        <span>{selectedActor.hours || 'Non renseigné (24h/24 par défaut)'}</span>
                      </div>
                      {selectedActor.phone && (
                        <div className="flex items-center gap-2">
                          <PhoneCall size={12} className="text-slate-400 shrink-0" />
                          <span className="font-mono font-bold text-slate-800">{selectedActor.phone}</span>
                        </div>
                      )}
                      {selectedActor.email && (
                        <div className="flex items-center gap-2">
                          <Mail size={12} className="text-slate-400 shrink-0" />
                          <span className="truncate text-slate-500">{selectedActor.email}</span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Call and Route quick buttons */}
                  <div className="pt-3 border-t border-slate-100 flex gap-2">
                    {selectedActor.phone && (
                      <button 
                        onClick={() => window.location.href = `tel:${selectedActor.phone}`}
                        className="flex-1 justify-center bg-emerald-600 hover:bg-emerald-700 text-white px-3 py-2 rounded-lg font-bold text-[10px] flex items-center gap-1.5 transition-all active:scale-95 shadow-none"
                      >
                        <PhoneCall size={10} /> Appeler
                      </button>
                    )}
                    <button 
                      onClick={() => setActiveRouteActor(selectedActor)}
                      className="flex-1 justify-center bg-white border border-emerald-600 text-emerald-700 px-3 py-2 rounded-lg font-bold text-[10px] flex items-center gap-1.5 transition-all active:scale-95 hover:bg-emerald-50"
                    >
                      <MapPin size={10} /> Itinéraire
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
          <motion.div key="results" initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
            <div className="bg-white text-slate-800 p-5 rounded-xl border border-emerald-500 relative overflow-hidden">
               <div className="relative z-10 space-y-3">
                  <div className="flex items-center justify-between">
                    <h2 className="text-sm font-display font-bold text-slate-900">Analyse IA Préliminaire (Care IA)</h2>
                    <div className="flex items-center gap-1.5 bg-white text-amber-600 px-2 py-0.5 rounded border border-amber-500 text-[8px] font-bold uppercase tracking-wider">
                       <Clock size={10} />
                       Validation requise
                    </div>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {analyzedMeds.map(m => (
                      <div key={m.name} className="bg-white p-3 rounded-lg border border-slate-200">
                        <p className="text-emerald-600 font-bold text-[9px] uppercase tracking-wider mb-0.5">Médicament Détecté</p>
                        <p className="font-bold text-xs text-slate-800">{m.name}</p>
                        <p className="text-[10px] text-slate-400 italic">{m.dosage}</p>
                      </div>
                    ))}
                  </div>
               </div>
            </div>

            {/* Filters Bar */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 bg-white p-2 rounded-xl border border-slate-200">
               <div className="flex items-center gap-1.5 text-slate-500 px-1">
                  <Filter size={14} />
                  <span className="text-[10px] font-bold uppercase tracking-wider">Trier par :</span>
               </div>
               <div className="flex bg-white border border-slate-200 p-1 rounded-lg gap-1 w-full sm:w-auto">
                  <button 
                    onClick={() => setSortBy('price')}
                    className={cn(
                      "flex-1 sm:flex-none px-3 py-1 rounded text-xs font-bold transition-all flex items-center justify-center gap-1",
                      sortBy === 'price' ? "bg-emerald-600 text-white shadow-none" : "text-slate-500 hover:text-slate-900"
                    )}
                  >
                    Prix
                  </button>
                  <button 
                    onClick={() => setSortBy('distance')}
                    className={cn(
                      "flex-1 sm:flex-none px-3 py-1 rounded text-xs font-bold transition-all flex items-center justify-center gap-1",
                      sortBy === 'distance' ? "bg-emerald-600 text-white shadow-none" : "text-slate-500 hover:text-slate-900"
                    )}
                  >
                    Distance
                  </button>
                  <button 
                    onClick={() => setSortBy('rating')}
                    className={cn(
                      "flex-1 sm:flex-none px-3 py-1 rounded text-xs font-bold transition-all flex items-center justify-center gap-1",
                      sortBy === 'rating' ? "bg-emerald-600 text-white shadow-none" : "text-slate-500 hover:text-slate-900"
                    )}
                  >
                    Note
                  </button>
               </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {getSortedPharmacies().map(pharma => (
                <div key={pharma.id} className="bg-white p-4 rounded-xl border border-slate-200 flex flex-col justify-between group">
                   <div>
                      <div className="flex justify-between items-start mb-3">
                        <div className="relative">
                          <img src={pharma.image} className="w-12 h-12 rounded-lg object-cover" />
                          <div className="absolute -bottom-1 -right-1 bg-emerald-500 text-white p-0.5 rounded border border-white">
                             <CheckCircle2 size={10} />
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-sm font-display font-bold text-slate-900">
                             {analyzedMeds.reduce((sum, med) => {
                               const foundMed = pharma.meds?.find(m => m.name === med.name);
                               return sum + (foundMed?.price || 0);
                             }, 0).toLocaleString()} FCFA
                          </p>
                          <p className="text-[9px] text-slate-400 font-bold uppercase tracking-wider">Total Panier</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <h4 className="font-display font-bold text-xs text-slate-900 group-hover:text-emerald-600 transition-colors">{pharma.name}</h4>
                        {pharma.isDuty && (
                          <span className="bg-white text-red-600 border border-red-500 text-[8px] font-bold uppercase px-1.5 py-0.5 rounded flex items-center gap-0.5 shrink-0">
                            <Clock size={8} /> Garde
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-1 text-[10px] text-slate-400 mt-0.5 mb-3">
                         <MapPin size={10} />
                         {pharma.address} • <span className="text-emerald-600 font-bold">{pharma.distance}</span>
                      </div>
                      <div className="space-y-1 mb-4">
                         {analyzedMeds.map(am => {
                           const foundMed = pharma.meds?.find(m => m.name === am.name);
                           return (
                             <div key={am.name} className="flex justify-between items-center text-[10px] p-1.5 bg-white border border-slate-100 rounded-md">
                               <span className="text-slate-600 tabular-nums">{am.name}</span>
                               <span className="font-bold text-emerald-600">
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
                      medsToOrder.forEach(m => addToCart(m, pharma.id, pharma.name));
                    }}
                    className="w-full bg-emerald-600 text-white py-2 rounded-lg font-bold hover:bg-emerald-700 transition-all flex items-center justify-center gap-1 text-xs"
                   >
                     <ShoppingCart size={14} />
                     Commander tout ({analyzedMeds.length})
                   </button>
                </div>
              ))}
            </div>
            {matchingPharmacies.length === 0 && (
              <div className="text-center py-12 bg-white rounded-xl border border-slate-200 italic text-xs text-slate-400">
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
        onRequirePrescription={() => {
          setView('prescriptions');
          setIsCartOpen(false);
        }}
        deliveryMode={deliveryMode}
        onDeliveryModeChange={setDeliveryMode}
        pharmacyName={cartPharmacyName}
        checkoutError={checkoutError}
      />

      <RouteDrawer
        isOpen={activeRouteActor !== null}
        onClose={() => setActiveRouteActor(null)}
        actor={activeRouteActor}
      />
    </PageContainer>
  );
}

function CategoryTab({ active, onClick, icon, label }: { active: boolean, onClick: () => void, icon: React.ReactNode, label: string }) {
  return (
    <button 
      onClick={onClick}
      className={cn(
        "flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[11px] font-bold transition-all whitespace-nowrap shrink-0 border",
        active ? "bg-emerald-600 text-white border-emerald-600 shadow-sm" : "bg-white text-slate-500 border-slate-200 hover:bg-slate-50"
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
  const colorClass = "text-emerald-600 bg-white border border-slate-100";

  return (
    <motion.div 
      whileHover={{ y: -3 }}
      onClick={onClick}
      className="bg-white rounded-2xl overflow-hidden border border-slate-200 shadow-none cursor-pointer group"
    >
      <div className="h-32 relative">
        <img src={actor.image} alt={actor.name} className="w-full h-full object-cover group-hover:scale-102 transition-transform duration-500" />
        <div className={cn("absolute top-3 left-3 p-1.5 rounded-lg backdrop-blur-sm shadow-sm", colorClass)}>
          <Icon size={14} />
        </div>
        {actor.isDuty && (
          <div className="absolute top-3 right-3 bg-white text-red-600 border border-red-500 px-2 py-0.5 rounded-lg text-[9px] font-bold uppercase tracking-wider shadow-sm flex items-center gap-1">
            <Clock size={10} />
            <span>De Garde</span>
          </div>
        )}
      </div>
      <div className="p-4">
        <div className="flex justify-between items-start mb-1 text-[9px] font-bold text-slate-400 tracking-widest uppercase">
          <span>{actor.type}</span>
          <span>{actor.distance}</span>
        </div>
        <h3 className="text-xs md:text-sm font-display font-bold text-slate-900 line-clamp-1">{actor.name}</h3>
        <p className="text-[10px] text-slate-400 mt-0.5 mb-3 line-clamp-1">{actor.address}</p>
        
        {actor.specialties && (
          <div className="flex flex-wrap gap-1 mb-3">
            {actor.specialties.slice(0, 3).map(s => (
              <span key={s} className="bg-white text-slate-500 border border-slate-100 px-1.5 py-0.5 rounded text-[8px] font-bold uppercase">{s}</span>
            ))}
          </div>
        )}

        <div className="flex items-center justify-between pt-3 border-t border-slate-100">
           <div className="flex items-center gap-1 text-orange-400">
             <StarIcon size={12} fill="currentColor" />
             <span className="text-xs font-bold text-slate-700">{actor.rating}</span>
           </div>
           <button className="text-emerald-600 text-[10px] font-bold flex items-center gap-1">
             Consulter <ChevronRight size={12} />
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
  onCheckout,
  onRequirePrescription,
  deliveryMode,
  onDeliveryModeChange,
  pharmacyName,
  checkoutError
}: {
  isOpen: boolean;
  onClose: () => void;
  cart: any[];
  onUpdateCount: (id: string, delta: number) => void;
  onRemove: (id: string) => void;
  onCheckout: (method: string) => void;
  onRequirePrescription: () => void;
  deliveryMode: 'pickup' | 'delivery';
  onDeliveryModeChange: (mode: 'pickup' | 'delivery') => void;
  pharmacyName: string;
  checkoutError: string | null;
}) {
  const [step, setStep] = useState<'cart' | 'payment'>('cart');
  const [selectedMethod, setSelectedMethod] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  const total = cart.reduce((sum, item) => sum + (item.price * item.count), 0);
  const deliveryFee = deliveryMode === 'delivery' ? 1500 : 0;
  const grandTotal = total + deliveryFee;

  const handleFinish = async () => {
    if (!selectedMethod) return;
    setIsProcessing(true);
    await onCheckout(selectedMethod);
    setIsProcessing(false);
    setStep('cart');
    setSelectedMethod(null);
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
              {checkoutError && (
                <div className="bg-red-50 border border-red-200 p-4 rounded-2xl flex gap-3 text-red-800">
                  <AlertTriangle size={18} className="shrink-0 mt-0.5 text-red-500" />
                  <p className="text-xs font-semibold">{checkoutError}</p>
                </div>
              )}
              {step === 'cart' ? (
                <>
                  {pharmacyName && (
                    <div className="bg-emerald-50 border border-emerald-100 p-3 rounded-xl flex items-center gap-2">
                      <Building2 size={14} className="text-emerald-600 shrink-0" />
                      <span className="text-xs font-bold text-emerald-800 truncate">{pharmacyName}</span>
                    </div>
                  )}

                  <div className="flex gap-2 p-1 bg-slate-100 rounded-xl">
                    <button
                      onClick={() => onDeliveryModeChange('pickup')}
                      className={cn(
                        "flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-xs font-bold transition-all",
                        deliveryMode === 'pickup' ? "bg-white shadow-sm text-slate-900" : "text-slate-500"
                      )}
                    >
                      <Package size={14} />
                      Retrait
                    </button>
                    <button
                      onClick={() => onDeliveryModeChange('delivery')}
                      className={cn(
                        "flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-xs font-bold transition-all",
                        deliveryMode === 'delivery' ? "bg-white shadow-sm text-slate-900" : "text-slate-500"
                      )}
                    >
                      <Truck size={14} />
                      Livraison (+1 500 FCFA)
                    </button>
                  </div>

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
                    <div key={item.id} className="flex gap-4 items-center bg-white p-4 rounded-2xl md:rounded-[2rem] border border-slate-100 shadow-sm animate-in slide-in-from-right-4 duration-300">
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
              <div className="space-y-2">
                <div className="flex justify-between items-center text-sm">
                  <span className="text-slate-500 font-medium">Sous-total</span>
                  <span className="text-slate-700 font-bold">{total.toLocaleString()} FCFA</span>
                </div>
                {deliveryMode === 'delivery' && (
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-slate-500 font-medium">Frais de livraison</span>
                    <span className="text-slate-700 font-bold">1 500 FCFA</span>
                  </div>
                )}
                <div className="flex justify-between items-end pt-2 border-t border-slate-200">
                  <span className="text-slate-500 text-sm font-bold uppercase tracking-widest">Total</span>
                  <span className="text-3xl font-display font-bold text-slate-900">{grandTotal.toLocaleString()} FCFA</span>
                </div>
              </div>
              
              {step === 'cart' ? (
                cart.some(item => item.requiresPrescription) ? (
                  <div className="space-y-3 w-full">
                    <button 
                      onClick={onRequirePrescription}
                      className="w-full bg-purple-600 text-white font-bold py-5 rounded-[2rem] shadow-xl shadow-purple-600/15 hover:scale-[1.02] active:scale-95 transition-all text-lg flex items-center justify-center gap-2"
                    >
                      <Camera size={20} />
                      Soumettre l'Ordonnance requis
                    </button>
                    <p className="text-[11px] text-center text-purple-700 font-semibold">
                      Un ou plusieurs articles nécessitent une ordonnance validée par Care IA.
                    </p>
                  </div>
                ) : (
                  <button 
                    disabled={cart.length === 0}
                    onClick={() => setStep('payment')}
                    className="w-full bg-slate-900 text-white font-bold py-5 rounded-[2rem] shadow-xl shadow-slate-900/10 hover:scale-[1.02] active:scale-95 transition-all text-lg disabled:opacity-50"
                  >
                    Procéder au paiement
                  </button>
                )
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
              <div className="relative bg-slate-100 h-60 rounded-2xl md:rounded-[2rem] overflow-hidden border border-slate-200 shadow-inner flex items-center justify-center">
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
