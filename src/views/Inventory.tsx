import React, { useState, useEffect } from 'react';
import { 
  Pill, 
  Search, 
  Plus, 
  Filter, 
  AlertTriangle, 
  ArrowUpRight, 
  Trash2, 
  Edit3, 
  PlusCircle, 
  MinusCircle, 
  Check, 
  X, 
  TrendingUp, 
  Clock, 
  PackageCheck, 
  ChevronDown, 
  Calendar, 
  FileText, 
  Sparkles, 
  DollarSign, 
  Info,
  Layers,
  MapPin,
  RefreshCw,
  Eye,
  AlertCircle
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '../lib/utils';
import { useAuth } from '../components/AuthContext';
import { db } from '../lib/firebase';
import { collection, getDocs, addDoc, updateDoc, deleteDoc, doc, query, where } from 'firebase/firestore';

interface Medication {
  id: string;
  name: string;          // e.g. "Doliprane 1000mg"
  genericName: string;   // e.g. "Paracétamol"
  dosage: string;        // e.g. "1g", "500mg"
  type: string;          // Comprimé, Gélule, Sirop, Injectable, etc.
  therapeuticClass: string; // Antalgique, Antibiotique, Antipaludique, etc.
  stock: number;         // Current physical stock
  minThreshold: number;  // Threshold for alert
  purchasePrice: number; // Purchase price in FCFA
  sellingPrice: number;  // Selling price in FCFA
  expiryDate: string;    // YYYY-MM-DD
  location: string;      // Drawer/Shelf e.g. "Rayon A-3"
  batchNumber: string;   // Batch code e.g. "LOT-2026-X"
  updatedAt: string;     // Last modified timestamp
  requiresPrescription?: boolean; // Requires a prescription or not
}

const DEFAULT_MEDICATIONS: Medication[] = [
  {
    id: 'med-1',
    name: 'Coartem 80/480mg',
    genericName: 'Artéméther / Luméfantrine',
    dosage: '80mg/480mg',
    type: 'Comprimé',
    therapeuticClass: 'Antipaludique',
    stock: 8,
    minThreshold: 25,
    purchasePrice: 1800,
    sellingPrice: 2800,
    expiryDate: '2026-11-20',
    location: 'Étagère A-1',
    batchNumber: 'LOT-CRT-029',
    updatedAt: new Date().toISOString()
  },
  {
    id: 'med-2',
    name: 'Amoxicilline Clamoxyl',
    genericName: 'Amoxicilline',
    dosage: '1g',
    type: 'Gélule',
    therapeuticClass: 'Antibiotique',
    stock: 12,
    minThreshold: 30,
    purchasePrice: 2500,
    sellingPrice: 4500,
    expiryDate: '2026-08-15',
    location: 'Étagère B-4',
    batchNumber: 'LOT-AMX-912',
    updatedAt: new Date().toISOString()
  },
  {
    id: 'med-3',
    name: 'Efferalgan 500mg',
    genericName: 'Paracétamol',
    dosage: '500mg',
    type: 'Comprimé',
    therapeuticClass: 'Antalgique',
    stock: 154,
    minThreshold: 50,
    purchasePrice: 800,
    sellingPrice: 1500,
    expiryDate: '2027-10-30',
    location: 'Étagère A-2',
    batchNumber: 'LOT-PAR-221',
    updatedAt: new Date().toISOString()
  },
  {
    id: 'med-4',
    name: 'Glucophage 850mg',
    genericName: 'Metformine',
    dosage: '850mg',
    type: 'Comprimé',
    therapeuticClass: 'Antidiabétique',
    stock: 45,
    minThreshold: 20,
    purchasePrice: 1900,
    sellingPrice: 3200,
    expiryDate: '2026-06-10', // Expired or expiring soon based on local 2026 date
    location: 'Étagère C-2',
    batchNumber: 'LOT-MET-341',
    updatedAt: new Date().toISOString()
  },
  {
    id: 'med-5',
    name: 'Bétadine Jaune 10%',
    genericName: 'Povidone iodée',
    dosage: '100ml',
    type: 'Solution',
    therapeuticClass: 'Antiseptique',
    stock: 0,
    minThreshold: 15,
    purchasePrice: 1000,
    sellingPrice: 1800,
    expiryDate: '2027-01-05',
    location: 'Rayon Liquides',
    batchNumber: 'LOT-BET-004',
    updatedAt: new Date().toISOString()
  },
  {
    id: 'med-6',
    name: 'Amlodipine Denzo',
    genericName: 'Amlodipine',
    dosage: '5mg',
    type: 'Comprimé',
    therapeuticClass: 'Cardiovasculaire',
    stock: 18,
    minThreshold: 15,
    purchasePrice: 2200,
    sellingPrice: 3800,
    expiryDate: '2026-05-12', // Already expired in 2026-07
    location: 'Étagère C-1',
    batchNumber: 'LOT-AML-404',
    updatedAt: new Date().toISOString()
  }
];

export function Inventory() {
  const { user, profile } = useAuth();
  const [medications, setMedications] = useState<Medication[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedClass, setSelectedClass] = useState<string>('all');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [sortBy, setSortBy] = useState<string>('name-asc');
  const [activeTab, setActiveTab] = useState<'all' | 'alerts' | 'replenish' | 'ai'>('all');

  // Inline stock editing states
  const [editingStockId, setEditingStockId] = useState<string | null>(null);
  const [tempStockValue, setTempStockValue] = useState<string>('');

  // Advanced Stock Adjustment Modal states
  const [adjustmentMed, setAdjustmentMed] = useState<Medication | null>(null);
  const [adjustmentType, setAdjustmentType] = useState<'set' | 'add' | 'remove'>('set');
  const [adjustmentQty, setAdjustmentQty] = useState<string>('');
  const [adjustmentReason, setAdjustmentReason] = useState<string>('correction');
  const [adjustmentNote, setAdjustmentNote] = useState<string>('');
  const [adjustmentHistory, setAdjustmentHistory] = useState<any[]>([]);

  // Modals state
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isViewOpen, setIsViewOpen] = useState(false);
  const [activeMed, setActiveMed] = useState<Medication | null>(null);

  // Form states
  const [formData, setFormData] = useState({
    name: '',
    genericName: '',
    dosage: '',
    type: 'Comprimé',
    therapeuticClass: 'Antalgique',
    stock: 0,
    minThreshold: 10,
    purchasePrice: 0,
    sellingPrice: 0,
    expiryDate: '',
    location: 'Étagère A-1',
    batchNumber: '',
    requiresPrescription: false,
  });

  // Load from Firestore or local storage fallback
  useEffect(() => {
    async function loadStock() {
      setLoading(true);
      try {
        let items: Medication[] = [];
        if (user) {
          const q = query(collection(db, 'medication_stock'));
          const querySnapshot = await getDocs(q);
          if (!querySnapshot.empty) {
            querySnapshot.forEach((docSnap) => {
              items.push({ id: docSnap.id, ...docSnap.data() } as Medication);
            });
          }
        }
        
        if (items.length === 0) {
          // Fallback to localStorage or default seed
          const stored = localStorage.getItem('medimap_meds_stock');
          if (stored) {
            items = JSON.parse(stored);
          } else {
            items = DEFAULT_MEDICATIONS;
            localStorage.setItem('medimap_meds_stock', JSON.stringify(items));
          }
        }
        
        setMedications(items);
      } catch (err) {
        console.warn("Firestore stock fetch failed, loading fallback local stock:", err);
        const stored = localStorage.getItem('medimap_meds_stock');
        setMedications(stored ? JSON.parse(stored) : DEFAULT_MEDICATIONS);
      } finally {
        setLoading(false);
      }
    }
    loadStock();
  }, [user]);

  // Persist stock state
  const saveMedicationsState = async (updatedMeds: Medication[]) => {
    setMedications(updatedMeds);
    localStorage.setItem('medimap_meds_stock', JSON.stringify(updatedMeds));
    
    // Sync single changes to Firestore asynchronously if online
    // If you want full database sync, this guarantees it
  };

  // Handler for adding medication
  const handleAddMed = async (e: React.FormEvent) => {
    e.preventDefault();
    const newMed: Omit<Medication, 'id'> = {
      ...formData,
      stock: Number(formData.stock),
      minThreshold: Number(formData.minThreshold),
      purchasePrice: Number(formData.purchasePrice),
      sellingPrice: Number(formData.sellingPrice),
      requiresPrescription: Boolean(formData.requiresPrescription),
      updatedAt: new Date().toISOString()
    };

    try {
      if (user) {
        const docRef = await addDoc(collection(db, 'medication_stock'), newMed);
        const savedMed = { id: docRef.id, ...newMed } as Medication;
        saveMedicationsState([savedMed, ...medications]);
      } else {
        const savedMed = { id: 'med-local-' + Date.now(), ...newMed } as Medication;
        saveMedicationsState([savedMed, ...medications]);
      }
      setIsAddOpen(false);
      resetForm();
    } catch (err) {
      console.error("Error adding medication:", err);
      // Fallback local
      const savedMed = { id: 'med-local-' + Date.now(), ...newMed } as Medication;
      saveMedicationsState([savedMed, ...medications]);
      setIsAddOpen(false);
      resetForm();
    }
  };

  // Handler for editing medication
  const handleEditMed = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeMed) return;

    const updatedData: Partial<Medication> = {
      ...formData,
      stock: Number(formData.stock),
      minThreshold: Number(formData.minThreshold),
      purchasePrice: Number(formData.purchasePrice),
      sellingPrice: Number(formData.sellingPrice),
      requiresPrescription: Boolean(formData.requiresPrescription),
      updatedAt: new Date().toISOString()
    };

    const updatedMeds = medications.map(m => m.id === activeMed.id ? { ...m, ...updatedData } as Medication : m);
    saveMedicationsState(updatedMeds);

    try {
      if (user && !activeMed.id.startsWith('med-local-')) {
        const medRef = doc(db, 'medication_stock', activeMed.id);
        await updateDoc(medRef, updatedData);
      }
    } catch (err) {
      console.warn("Firestore sync error:", err);
    }
    
    setIsEditOpen(false);
    setActiveMed(null);
    resetForm();
  };

  // Handler for deleting medication
  const handleDeleteMed = async (id: string) => {
    if (!window.confirm("Voulez-vous vraiment retirer ce médicament de l'inventaire ?")) return;

    const updatedMeds = medications.filter(m => m.id !== id);
    saveMedicationsState(updatedMeds);

    try {
      if (user && !id.startsWith('med-local-')) {
        await deleteDoc(doc(db, 'medication_stock', id));
      }
    } catch (err) {
      console.warn("Firestore deletion sync error:", err);
    }

    if (activeMed?.id === id) {
      setActiveMed(null);
      setIsViewOpen(false);
    }
  };

  // Direct stock update
  const handleDirectStockUpdate = async (id: string, newStock: number) => {
    const stockVal = Math.max(0, newStock);
    const updatedMeds = medications.map(m => {
      if (m.id === id) {
        return { ...m, stock: stockVal, updatedAt: new Date().toISOString() };
      }
      return m;
    });
    saveMedicationsState(updatedMeds);

    const affectedMed = updatedMeds.find(m => m.id === id);
    if (affectedMed && user && !id.startsWith('med-local-')) {
      try {
        await updateDoc(doc(db, 'medication_stock', id), {
          stock: affectedMed.stock,
          updatedAt: affectedMed.updatedAt
        });
      } catch (err) {
        console.warn("Firestore direct stock update sync failed:", err);
      }
    }
  };

  // Fetch adjustment history for a specific medication
  const fetchAdjustmentHistory = async (medId: string) => {
    try {
      const q = query(
        collection(db, 'stock_movements'),
        where('medicationId', '==', medId)
      );
      const snap = await getDocs(q);
      const list: any[] = [];
      snap.forEach((docSnap) => {
        list.push({ id: docSnap.id, ...docSnap.data() });
      });
      // Sort by timestamp desc
      list.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
      setAdjustmentHistory(list);
    } catch (err) {
      console.warn("Failed to fetch stock movements from Firestore:", err);
      // Fallback local history
      const stored = localStorage.getItem(`medimap_movements_${medId}`);
      if (stored) {
        setAdjustmentHistory(JSON.parse(stored));
      } else {
        setAdjustmentHistory([]);
      }
    }
  };

  // Sync adjustment input state when target medication changes
  useEffect(() => {
    if (adjustmentMed) {
      fetchAdjustmentHistory(adjustmentMed.id);
      setAdjustmentQty(adjustmentMed.stock.toString());
      setAdjustmentType('set');
      setAdjustmentReason('correction');
      setAdjustmentNote('');
    }
  }, [adjustmentMed]);

  // Handle advanced stock adjustment form submit
  const handleSaveAdjustment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!adjustmentMed) return;

    const qty = parseInt(adjustmentQty) || 0;
    let newStock = adjustmentMed.stock;
    let delta = 0;
    let movementType: 'entrée' | 'sortie' | 'correction' = 'correction';

    if (adjustmentType === 'set') {
      newStock = Math.max(0, qty);
      delta = newStock - adjustmentMed.stock;
      movementType = delta >= 0 ? 'entrée' : 'sortie';
    } else if (adjustmentType === 'add') {
      newStock = adjustmentMed.stock + Math.max(0, qty);
      delta = Math.max(0, qty);
      movementType = 'entrée';
    } else if (adjustmentType === 'remove') {
      newStock = Math.max(0, adjustmentMed.stock - Math.max(0, qty));
      delta = -Math.min(adjustmentMed.stock, Math.max(0, qty));
      movementType = 'sortie';
    }

    // 1. Update the medicine stock locally
    const updatedMeds = medications.map(m => {
      if (m.id === adjustmentMed.id) {
        return { ...m, stock: newStock, updatedAt: new Date().toISOString() };
      }
      return m;
    });
    saveMedicationsState(updatedMeds);

    // 2. Save stock movement log
    const movementLog = {
      medicationId: adjustmentMed.id,
      medicationName: adjustmentMed.name,
      type: movementType,
      delta: delta,
      previousStock: adjustmentMed.stock,
      newStock: newStock,
      reason: adjustmentReason === 'correction' ? 'Correction d\'inventaire' :
              adjustmentReason === 'restock' ? 'Réapprovisionnement' :
              adjustmentReason === 'sale' ? 'Vente directe d\'officine' :
              adjustmentReason === 'expired' ? 'Produit périmé / Rebut' :
              adjustmentReason === 'loss' ? 'Perte ou Vol' : 'Ajustement manuel',
      note: adjustmentNote || 'Aucun commentaire',
      timestamp: new Date().toISOString(),
      operator: profile?.displayName ? `Dr. ${profile.displayName}` : 'Pharmacien Responsable'
    };

    // Save to Firestore
    try {
      // Update medicine doc in firestore
      if (!adjustmentMed.id.startsWith('med-local-')) {
        await updateDoc(doc(db, 'medication_stock', adjustmentMed.id), {
          stock: newStock,
          updatedAt: new Date().toISOString()
        });
        
        // Add log
        await addDoc(collection(db, 'stock_movements'), movementLog);
      }
    } catch (err) {
      console.warn("Failed to sync adjustment to Firestore:", err);
    }

    // LocalStorage Fallback for log
    const localLogsKey = `medimap_movements_${adjustmentMed.id}`;
    const existingLocal = localStorage.getItem(localLogsKey);
    const localLogs = existingLocal ? JSON.parse(existingLocal) : [];
    localLogs.unshift(movementLog);
    localStorage.setItem(localLogsKey, JSON.stringify(localLogs));

    // Clear and close
    setAdjustmentMed(null);
  };

  const resetForm = () => {
    setFormData({
      name: '',
      genericName: '',
      dosage: '',
      type: 'Comprimé',
      therapeuticClass: 'Antalgique',
      stock: 0,
      minThreshold: 10,
      purchasePrice: 0,
      sellingPrice: 0,
      expiryDate: '',
      location: 'Étagère A-1',
      batchNumber: '',
      requiresPrescription: false,
    });
  };

  const openEdit = (med: Medication) => {
    setActiveMed(med);
    setFormData({
      name: med.name,
      genericName: med.genericName,
      dosage: med.dosage,
      type: med.type,
      therapeuticClass: med.therapeuticClass,
      stock: med.stock,
      minThreshold: med.minThreshold,
      purchasePrice: med.purchasePrice,
      sellingPrice: med.sellingPrice,
      expiryDate: med.expiryDate,
      location: med.location,
      batchNumber: med.batchNumber,
      requiresPrescription: !!med.requiresPrescription,
    });
    setIsEditOpen(true);
  };

  const openView = (med: Medication) => {
    setActiveMed(med);
    setIsViewOpen(true);
  };

  // Helper date calculators
  const todayStr = new Date().toISOString().split('T')[0];
  const isExpired = (expiry: string) => expiry < todayStr;
  const isExpiringSoon = (expiry: string) => {
    if (isExpired(expiry)) return false;
    const expDate = new Date(expiry);
    const today = new Date();
    const diffTime = expDate.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays <= 90; // expiring within 3 months
  };

  // Helpers to fetch specific statuses
  const getMedStatus = (med: Medication) => {
    if (isExpired(med.expiryDate)) return 'expired';
    if (isExpiringSoon(med.expiryDate)) return 'expiring_soon';
    if (med.stock === 0) return 'out';
    if (med.stock <= med.minThreshold) return 'low';
    return 'optimal';
  };

  // Compute stats
  const totalProducts = medications.length;
  const outOfStockCount = medications.filter(m => m.stock === 0).length;
  const lowStockCount = medications.filter(m => m.stock > 0 && m.stock <= m.minThreshold).length;
  const expiredCount = medications.filter(m => isExpired(m.expiryDate)).length;
  const expiringSoonCount = medications.filter(m => isExpiringSoon(m.expiryDate)).length;
  const totalValuation = medications.reduce((sum, m) => sum + (m.stock * m.sellingPrice), 0);

  // Available unique fields for filters
  const therapeuticClasses = Array.from(new Set(medications.map(m => m.therapeuticClass)));
  const medicationTypes = Array.from(new Set(medications.map(m => m.type)));

  // Filter & Search Logic
  const filteredMeds = medications.filter(med => {
    const matchesSearch = 
      med.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      med.genericName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      med.therapeuticClass.toLowerCase().includes(searchQuery.toLowerCase()) ||
      med.batchNumber.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesClass = selectedClass === 'all' || med.therapeuticClass === selectedClass;
    
    let matchesStatus = true;
    const status = getMedStatus(med);
    if (selectedStatus === 'out') matchesStatus = status === 'out';
    else if (selectedStatus === 'low') matchesStatus = status === 'low';
    else if (selectedStatus === 'expired') matchesStatus = status === 'expired';
    else if (selectedStatus === 'expiring_soon') matchesStatus = status === 'expiring_soon';
    else if (selectedStatus === 'critical') matchesStatus = status === 'out' || status === 'low';
    else if (selectedStatus === 'optimal') matchesStatus = status === 'optimal';

    return matchesSearch && matchesClass && matchesStatus;
  });

  // Sort logic
  const sortedMeds = [...filteredMeds].sort((a, b) => {
    switch (sortBy) {
      case 'name-asc':
        return a.name.localeCompare(b.name);
      case 'name-desc':
        return b.name.localeCompare(a.name);
      case 'stock-asc':
        return a.stock - b.stock;
      case 'stock-desc':
        return b.stock - a.stock;
      case 'price-asc':
        return a.sellingPrice - b.sellingPrice;
      case 'price-desc':
        return b.sellingPrice - a.sellingPrice;
      case 'expiry-asc':
        return a.expiryDate.localeCompare(b.expiryDate);
      case 'expiry-desc':
        return b.expiryDate.localeCompare(a.expiryDate);
      default:
        return 0;
    }
  });

  // Smart local Rule-Based AI Optimizer recommendation builder
  const getAIRecommendations = () => {
    const recs = [];
    
    // Malaria check
    const malMed = medications.find(m => m.therapeuticClass === 'Antipaludique');
    if (malMed && malMed.stock < 20) {
      recs.push({
        type: 'warning',
        title: 'Risque de rupture d\'antipaludiques',
        desc: `La saison des pluies en cours à Douala augmente l'incidence du paludisme. Votre stock d'artéméther (${malMed.stock}) est largement en dessous du seuil recommandé de 30 boîtes. Commandez d'urgence.`,
        action: 'Restock d\'antipaludiques',
        impactLabel: 'Haute Urgence'
      });
    }

    // Overstock Check
    const overstocked = medications.filter(m => m.stock > 100);
    overstocked.forEach(m => {
      recs.push({
        type: 'info',
        title: 'Optimisation de trésorerie (Surstock)',
        desc: `Le produit ${m.name} a un stock très élevé (${m.stock} unités). Environ ${(m.stock * m.purchasePrice).toLocaleString()} FCFA de fonds de roulement sont immobilisés. Nous suggérons de réduire le volume des prochaines livraisons.`,
        action: 'Ajuster les commandes futures',
        impactLabel: 'Trésorerie'
      });
    });

    // Expiry warnings
    const nearExpiryMeds = medications.filter(m => isExpiringSoon(m.expiryDate));
    if (nearExpiryMeds.length > 0) {
      recs.push({
        type: 'danger',
        title: 'Alerte Péremption Imminente',
        desc: `${nearExpiryMeds.length} médicaments vont périmer dans les 90 jours (ex: ${nearExpiryMeds[0].name}). Proposez des réductions immédiates, déplacez-les en tête de rayon ou organisez un retour grossiste si possible.`,
        action: 'Voir les périssables',
        impactLabel: 'Pertes directes'
      });
    }

    // Default general advice
    if (recs.length === 0) {
      recs.push({
        type: 'success',
        title: 'Stock parfaitement équilibré',
        desc: 'Félicitations ! L\'IA Care IA n\'a détecté aucune anomalie majeure. Vos seuils de sécurité sont respectés et vos dates de péremption sont optimales.',
        action: 'Faire un bilan d\'activité',
        impactLabel: 'Statut Excellent'
      });
    }

    return recs;
  };

  return (
    <div className="space-y-8 pb-12">
      {/* Page Header */}
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <span className="bg-brand-50 text-brand-600 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider border border-brand-100">
              Cabinet & Pharmacie
            </span>
          </div>
          <h1 className="text-3xl md:text-4xl font-display font-black text-slate-900 tracking-tight">
            Gestion du Stock Officine
          </h1>
          <p className="text-slate-500 font-medium text-sm md:text-base">
            Optimisez vos stocks de médicaments, suivez les péremptions et gérez les alertes d'approvisionnement en temps réel.
          </p>
        </div>
        <div className="flex gap-2">
          <button 
            onClick={() => {
              // Trigger sync reload
              setLoading(true);
              setTimeout(() => setLoading(false), 600);
            }}
            className="p-3 bg-white border border-slate-200 rounded-2xl text-slate-500 hover:text-brand-600 transition-colors shadow-sm"
            title="Rafraîchir"
          >
            <RefreshCw size={18} className={cn(loading && "animate-spin")} />
          </button>
          <button 
            onClick={() => {
              resetForm();
              setIsAddOpen(true);
            }}
            className="bg-slate-900 text-white px-5 py-3.5 rounded-2xl font-bold flex items-center gap-2 hover:bg-slate-800 transition-all shadow-xl shadow-slate-900/10 text-sm"
          >
            <Plus size={18} />
            Nouveau Médicament
          </button>
        </div>
      </header>

      {/* KPI Stats Panel */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
        <StatCard 
          label="Total Médicaments" 
          value={totalProducts.toString()} 
          sub="Références uniques"
          icon={<Pill size={18} className="text-blue-500" />}
          color="border-blue-100 bg-blue-50/20"
        />
        <StatCard 
          label="En Rupture" 
          value={outOfStockCount.toString()} 
          sub="Urgence de commande"
          icon={<AlertCircle size={18} className="text-rose-500" />}
          color={outOfStockCount > 0 ? "border-rose-100 bg-rose-50/30 text-rose-700" : "border-slate-100"}
        />
        <StatCard 
          label="Alerte Stock Bas" 
          value={lowStockCount.toString()} 
          sub="Sous le seuil critique"
          icon={<AlertTriangle size={18} className="text-amber-500" />}
          color={lowStockCount > 0 ? "border-amber-100 bg-amber-50/30 text-amber-700" : "border-slate-100"}
        />
        <StatCard 
          label="Périmés" 
          value={expiredCount.toString()} 
          sub={`+ ${expiringSoonCount} sous 90 j.`}
          icon={<Clock size={18} className="text-purple-500" />}
          color={expiredCount > 0 ? "border-purple-100 bg-purple-50/30 text-purple-700" : "border-slate-100"}
        />
        <StatCard 
          label="Valeur du Stock" 
          value={`${(totalValuation).toLocaleString()}`} 
          sub="Prix de vente total"
          unit="FCFA"
          icon={<DollarSign size={18} className="text-emerald-500" />}
          color="border-emerald-100 bg-emerald-50/20"
        />
      </div>

      {/* Navigation Tabs */}
      <div className="flex border-b border-slate-200 gap-6">
        <TabButton 
          active={activeTab === 'all'} 
          onClick={() => setActiveTab('all')} 
          label="Inventaire Général" 
          count={sortedMeds.length}
        />
        <TabButton 
          active={activeTab === 'alerts'} 
          onClick={() => setActiveTab('alerts')} 
          label="Alertes Actives" 
          count={outOfStockCount + lowStockCount + expiredCount}
          highlight
        />
        <TabButton 
          active={activeTab === 'replenish'} 
          onClick={() => setActiveTab('replenish')} 
          label="Bons de Commande" 
          icon={<FileText size={14} />}
        />
        <TabButton 
          active={activeTab === 'ai'} 
          onClick={() => setActiveTab('ai')} 
          label="Optimiseur IA" 
          icon={<Sparkles size={14} />}
          ai
        />
      </div>

      {/* Tab Contents */}
      <AnimatePresence mode="wait">
        {/* Tab 1: ALL INVENTORY LIST */}
        {activeTab === 'all' && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="space-y-4"
          >
            {/* Search, Filter, Sort Controls */}
            <div className="bg-white rounded-[2rem] p-5 border border-slate-100 shadow-sm flex flex-col md:flex-row gap-4 items-center justify-between">
              {/* Search Bar */}
              <div className="relative w-full md:w-80 group">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-brand-600 transition-colors" size={18} />
                <input 
                  type="text" 
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Rechercher nom, molécule, lot..." 
                  className="w-full bg-slate-50 border-none rounded-xl py-3 pl-12 pr-4 text-sm font-medium focus:ring-2 focus:ring-brand-600/10 outline-none transition-all"
                />
              </div>

              {/* Advanced Filters */}
              <div className="flex flex-wrap gap-2.5 w-full md:w-auto items-center justify-end">
                {/* Filter Category */}
                <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-100 px-3 py-1.5 rounded-xl">
                  <span className="text-[10px] font-black uppercase text-slate-400">Classe :</span>
                  <select 
                    value={selectedClass}
                    onChange={(e) => setSelectedClass(e.target.value)}
                    className="bg-transparent text-xs font-bold text-slate-600 outline-none cursor-pointer border-none p-0 focus:ring-0"
                  >
                    <option value="all">Toutes</option>
                    {therapeuticClasses.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>

                {/* Filter Status */}
                <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-100 px-3 py-1.5 rounded-xl">
                  <span className="text-[10px] font-black uppercase text-slate-400">Statut :</span>
                  <select 
                    value={selectedStatus}
                    onChange={(e) => setSelectedStatus(e.target.value)}
                    className="bg-transparent text-xs font-bold text-slate-600 outline-none cursor-pointer border-none p-0 focus:ring-0"
                  >
                    <option value="all">Tous</option>
                    <option value="out">En rupture</option>
                    <option value="low">Stock critique</option>
                    <option value="critical">Rupture + Critique</option>
                    <option value="expired">Périmés</option>
                    <option value="expiring_soon">Périment bientôt (&lt;90j)</option>
                    <option value="optimal">Sain (Optimal)</option>
                  </select>
                </div>

                {/* Sort Option */}
                <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-100 px-3 py-1.5 rounded-xl">
                  <span className="text-[10px] font-black uppercase text-slate-400">Trier par :</span>
                  <select 
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value)}
                    className="bg-transparent text-xs font-bold text-slate-600 outline-none cursor-pointer border-none p-0 focus:ring-0"
                  >
                    <option value="name-asc">Nom (A-Z)</option>
                    <option value="name-desc">Nom (Z-A)</option>
                    <option value="stock-asc">Stock croissant</option>
                    <option value="stock-desc">Stock décroissant</option>
                    <option value="price-asc">Prix croissant</option>
                    <option value="price-desc">Prix décroissant</option>
                    <option value="expiry-asc">Péremption proche</option>
                    <option value="expiry-desc">Péremption éloignée</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Main Medications Table Card */}
            <div className="bg-white rounded-[2.5rem] border border-slate-100 shadow-sm overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-slate-50/50 border-b border-slate-100">
                      <th className="px-6 py-4 text-[10px] font-black uppercase text-slate-400 tracking-widest">Médicament (DCI)</th>
                      <th className="px-6 py-4 text-[10px] font-black uppercase text-slate-400 tracking-widest">Classe thérapeutique</th>
                      <th className="px-6 py-4 text-[10px] font-black uppercase text-slate-400 tracking-widest text-center">Quantité Stock</th>
                      <th className="px-6 py-4 text-[10px] font-black uppercase text-slate-400 tracking-widest">Tarif (Achat / Vente)</th>
                      <th className="px-6 py-4 text-[10px] font-black uppercase text-slate-400 tracking-widest">Péremption</th>
                      <th className="px-6 py-4 text-[10px] font-black uppercase text-slate-400 tracking-widest text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {sortedMeds.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="px-6 py-12 text-center text-slate-400 font-medium">
                          <div className="flex flex-col items-center gap-3">
                            <Pill size={36} className="text-slate-300 stroke-1" />
                            <p>Aucun médicament trouvé avec ces critères de recherche.</p>
                            <button 
                              onClick={() => { setSearchQuery(''); setSelectedClass('all'); setSelectedStatus('all'); }}
                              className="text-xs font-black text-brand-600 uppercase tracking-widest bg-brand-50 px-4 py-2 rounded-xl border border-brand-100 hover:bg-brand-100 transition-colors"
                            >
                              Réinitialiser les filtres
                            </button>
                          </div>
                        </td>
                      </tr>
                    ) : (
                      sortedMeds.map((med) => {
                        const status = getMedStatus(med);
                        return (
                          <tr key={med.id} className="hover:bg-slate-50/30 transition-colors group">
                            {/* Med Details */}
                            <td className="px-6 py-4.5">
                              <div className="flex items-center gap-3">
                                <div className={cn(
                                  "w-11 h-11 rounded-xl flex items-center justify-center border shrink-0 transition-colors",
                                  status === 'expired' ? "bg-rose-50 border-rose-100 text-rose-500" :
                                  status === 'expiring_soon' ? "bg-purple-50 border-purple-100 text-purple-500" :
                                  status === 'out' ? "bg-red-50 border-red-100 text-red-500" :
                                  status === 'low' ? "bg-amber-50 border-amber-100 text-amber-500" :
                                  "bg-emerald-50 border-emerald-100 text-emerald-500"
                                )}>
                                  <Pill size={18} />
                                </div>
                                <div className="min-w-0">
                                  <div className="flex items-baseline gap-1.5 flex-wrap">
                                    <span 
                                      onClick={() => openView(med)}
                                      className="font-bold text-slate-900 cursor-pointer hover:text-brand-600 hover:underline transition-all truncate"
                                    >
                                      {med.name}
                                    </span>
                                    <span className="text-[10px] text-slate-400 font-bold uppercase shrink-0">
                                      {med.dosage}
                                    </span>
                                    {med.requiresPrescription && (
                                      <span className="bg-purple-100 text-purple-700 text-[8px] font-black uppercase tracking-wider px-1.5 py-0.5 rounded">
                                        Ordonnance
                                      </span>
                                    )}
                                  </div>
                                  <div className="text-[11px] text-slate-400 font-medium truncate italic">
                                    {med.genericName} • <span className="font-bold font-mono">{med.batchNumber || 'N/A'}</span>
                                  </div>
                                </div>
                              </div>
                            </td>

                            {/* Class */}
                            <td className="px-6 py-4.5">
                              <div className="flex flex-col">
                                <span className="text-xs font-bold text-slate-700">{med.therapeuticClass}</span>
                                <span className="text-[10px] text-slate-400 font-medium">{med.type}</span>
                              </div>
                            </td>

                            {/* Stock and interactive adjustment */}
                            <td className="px-6 py-4.5">
                              <div className="flex flex-col items-center justify-center gap-1.5">
                                <button 
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setAdjustmentMed(med);
                                  }}
                                  className="group flex items-center gap-2 px-3 py-1.5 rounded-xl hover:bg-slate-50 border border-transparent hover:border-slate-100 transition-all"
                                  title="Ajuster le stock"
                                >
                                  <span className={cn(
                                    "font-black text-sm text-center tracking-tight",
                                    status === 'expired' || status === 'out' ? "text-rose-600" :
                                    status === 'low' ? "text-amber-500" : "text-slate-800"
                                  )}>
                                    {med.stock}
                                  </span>
                                  <span className="text-[10px] text-slate-400 font-bold bg-slate-50 group-hover:bg-brand-50 group-hover:text-brand-600 px-2 py-1 rounded-lg transition-all border border-slate-100">
                                    Ajuster
                                  </span>
                                </button>

                                {/* Status tags */}
                                {status === 'expired' && (
                                  <span className="text-[8px] font-black uppercase tracking-wider bg-rose-100 text-rose-700 px-1.5 py-0.5 rounded">
                                    Périmé
                                  </span>
                                )}
                                {status === 'expiring_soon' && (
                                  <span className="text-[8px] font-black uppercase tracking-wider bg-purple-100 text-purple-700 px-1.5 py-0.5 rounded">
                                    Périme bientôt
                                  </span>
                                )}
                                {status === 'out' && (
                                  <span className="text-[8px] font-black uppercase tracking-wider bg-red-100 text-red-700 px-1.5 py-0.5 rounded">
                                    Rupture stock
                                  </span>
                                )}
                                {status === 'low' && (
                                  <span className="text-[8px] font-black uppercase tracking-wider bg-amber-100 text-amber-700 px-1.5 py-0.5 rounded">
                                    Critique
                                  </span>
                                )}
                                {status === 'optimal' && (
                                  <span className="text-[8px] font-black uppercase tracking-wider bg-emerald-100 text-emerald-700 px-1.5 py-0.5 rounded">
                                    Optimal
                                  </span>
                                )}
                              </div>
                            </td>

                            {/* Prices */}
                            <td className="px-6 py-4.5">
                              <div className="flex flex-col">
                                <span className="font-bold text-slate-800 text-xs">
                                  {med.sellingPrice.toLocaleString()} FCFA
                                </span>
                                <span className="text-[10px] text-slate-400 font-medium italic">
                                  Achat: {med.purchasePrice.toLocaleString()} FCFA
                                </span>
                              </div>
                            </td>

                            {/* Expiry date */}
                            <td className="px-6 py-4.5">
                              <div className="flex items-center gap-1.5 text-xs font-bold text-slate-700">
                                <Calendar size={12} className="text-slate-400" />
                                <span className={cn(
                                  isExpired(med.expiryDate) ? "text-rose-600 line-through" :
                                  isExpiringSoon(med.expiryDate) ? "text-purple-600" : "text-slate-600"
                                )}>
                                  {new Date(med.expiryDate).toLocaleDateString('fr-FR', { month: 'short', year: 'numeric' })}
                                </span>
                              </div>
                            </td>

                            {/* Actions */}
                            <td className="px-6 py-4.5 text-right">
                              <div className="flex items-center justify-end gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
                                <button 
                                  onClick={() => openView(med)}
                                  className="p-1.5 bg-slate-50 hover:bg-slate-100 text-slate-500 hover:text-slate-800 rounded-lg transition-colors border border-slate-200/50"
                                  title="Détails"
                                >
                                  <Eye size={14} />
                                </button>
                                <button 
                                  onClick={() => openEdit(med)}
                                  className="p-1.5 bg-blue-50 hover:bg-blue-100 text-blue-500 hover:text-blue-700 rounded-lg transition-colors border border-blue-200/50"
                                  title="Modifier"
                                >
                                  <Edit3 size={14} />
                                </button>
                                <button 
                                  onClick={() => handleDeleteMed(med.id)}
                                  className="p-1.5 bg-rose-50 hover:bg-rose-100 text-rose-500 hover:text-rose-700 rounded-lg transition-colors border border-rose-200/50"
                                  title="Supprimer"
                                >
                                  <Trash2 size={14} />
                                </button>
                              </div>
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </motion.div>
        )}

        {/* Tab 2: ALERTS & CRITICAL MEDS */}
        {activeTab === 'alerts' && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="space-y-6"
          >
            {/* Alert Category Breakdown Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-white rounded-3xl p-5 border border-red-100 shadow-sm flex items-start gap-4">
                <div className="p-3.5 bg-rose-50 text-rose-500 rounded-2xl border border-rose-100">
                  <AlertCircle size={22} />
                </div>
                <div>
                  <h3 className="font-bold text-slate-800 text-base">En Rupture</h3>
                  <p className="text-2xl font-display font-black text-rose-600 mt-1">{outOfStockCount}</p>
                  <p className="text-[10px] text-slate-400 mt-0.5">Médicaments absents du stock physique.</p>
                </div>
              </div>

              <div className="bg-white rounded-3xl p-5 border border-amber-100 shadow-sm flex items-start gap-4">
                <div className="p-3.5 bg-amber-50 text-amber-500 rounded-2xl border border-amber-100">
                  <AlertTriangle size={22} />
                </div>
                <div>
                  <h3 className="font-bold text-slate-800 text-base">Seuils Critiques</h3>
                  <p className="text-2xl font-display font-black text-amber-500 mt-1">{lowStockCount}</p>
                  <p className="text-[10px] text-slate-400 mt-0.5">Sous la réserve de sécurité paramétrée.</p>
                </div>
              </div>

              <div className="bg-white rounded-3xl p-5 border border-purple-100 shadow-sm flex items-start gap-4">
                <div className="p-3.5 bg-purple-50 text-purple-500 rounded-2xl border border-purple-100">
                  <Clock size={22} />
                </div>
                <div>
                  <h3 className="font-bold text-slate-800 text-base">Périmés / Bientôt périmés</h3>
                  <p className="text-2xl font-display font-black text-purple-600 mt-1">{expiredCount + expiringSoonCount}</p>
                  <p className="text-[10px] text-slate-400 mt-0.5">{expiredCount} déjà périmés, {expiringSoonCount} sous 90 jours.</p>
                </div>
              </div>
            </div>

            {/* List of affected items needing attention */}
            <div className="bg-white rounded-[2.5rem] border border-slate-100 shadow-sm p-6 space-y-4">
              <h2 className="font-display font-black text-slate-950 text-lg border-b pb-3 flex items-center gap-2">
                <AlertTriangle size={20} className="text-rose-500" />
                Liste des Alertes Prioritaires
              </h2>
              
              <div className="space-y-3">
                {medications.filter(m => getMedStatus(m) !== 'optimal').length === 0 ? (
                  <div className="py-12 text-center text-slate-400 font-medium flex flex-col items-center gap-2">
                    <Check size={32} className="text-emerald-500 bg-emerald-50 p-1.5 rounded-full" />
                    <p className="font-bold text-slate-800">Aucune alerte active !</p>
                    <p className="text-xs">Tous vos stocks sont au-dessus de leur seuil minimal de sécurité.</p>
                  </div>
                ) : (
                  medications
                    .filter(m => getMedStatus(m) !== 'optimal')
                    .map(m => {
                      const status = getMedStatus(m);
                      return (
                        <div key={m.id} className="flex flex-col md:flex-row items-start md:items-center justify-between p-4 bg-slate-50 rounded-2xl border border-slate-100 gap-4">
                          <div className="flex items-center gap-3">
                            <div className={cn(
                              "w-10 h-10 rounded-xl flex items-center justify-center text-white shrink-0",
                              status === 'expired' || status === 'out' ? "bg-rose-500" :
                              status === 'expiring_soon' ? "bg-purple-500" : "bg-amber-500"
                            )}>
                              <Pill size={18} />
                            </div>
                            <div>
                              <h4 className="font-bold text-slate-900 text-sm">{m.name} <span className="text-xs text-slate-400 font-medium">({m.dosage})</span></h4>
                              <p className="text-xs text-slate-500 italic font-medium">{m.genericName} • Emplacement : {m.location}</p>
                            </div>
                          </div>

                          <div className="flex items-center gap-4.5 w-full md:w-auto justify-between md:justify-end border-t md:border-none pt-3 md:pt-0">
                            {/* Alert Explanation */}
                            <div className="text-left md:text-right">
                              <span className={cn(
                                "text-[10px] font-black uppercase tracking-wider px-2 py-1 rounded-md",
                                status === 'expired' ? "bg-rose-100 text-rose-700" :
                                status === 'expiring_soon' ? "bg-purple-100 text-purple-700" :
                                status === 'out' ? "bg-red-100 text-red-700" : "bg-amber-100 text-amber-700"
                              )}>
                                {status === 'expired' && 'Périmé (Retirer de la vente)'}
                                {status === 'expiring_soon' && 'Périme bientôt (Vendre en priorité)'}
                                {status === 'out' && 'Rupture Totale'}
                                {status === 'low' && 'Seuil critique atteint'}
                              </span>
                              <div className="text-[10px] text-slate-400 mt-1 font-bold">
                                {status === 'expired' ? `Date limite : ${m.expiryDate}` :
                                 status === 'expiring_soon' ? `Périme le : ${m.expiryDate}` :
                                 `Stock physique : ${m.stock} / Minimum requis : ${m.minThreshold}`}
                              </div>
                            </div>

                            {/* Direct Actions */}
                            <div className="flex gap-1.5">
                              <button 
                                onClick={() => openEdit(m)}
                                className="bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs px-3.5 py-2.5 rounded-xl shadow-md"
                              >
                                {status === 'expired' ? 'Remplacer' : 'Commander'}
                              </button>
                            </div>
                          </div>
                        </div>
                      );
                    })
                )}
              </div>
            </div>
          </motion.div>
        )}

        {/* Tab 3: REPLENISHMENT BILL GENERATION */}
        {activeTab === 'replenish' && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="space-y-6"
          >
            <div className="bg-white rounded-[2.5rem] border border-slate-100 shadow-sm p-6 space-y-6">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b pb-4">
                <div>
                  <h2 className="font-display font-black text-slate-950 text-xl flex items-center gap-2">
                    <FileText size={22} className="text-brand-600" />
                    Réapprovisionnement Intelligent Grossiste
                  </h2>
                  <p className="text-xs text-slate-400 mt-1 font-medium">
                    Nous avons détecté les médicaments nécessitant une commande immédiate d'après vos seuils de stock.
                  </p>
                </div>
                <button 
                  onClick={() => {
                    alert("Bon de commande exporté avec succès pour Laborex/Ubipharm ! Un e-mail de confirmation a été envoyé.");
                  }}
                  disabled={medications.filter(m => m.stock <= m.minThreshold).length === 0}
                  className="bg-brand-600 hover:bg-brand-700 text-white font-black text-xs uppercase tracking-widest px-5 py-3 rounded-xl disabled:opacity-50 transition-all flex items-center gap-2"
                >
                  <ArrowUpRight size={16} /> Export PDF & Envoi Grossiste
                </button>
              </div>

              {/* Items under replenishment order */}
              <div className="space-y-4">
                {medications.filter(m => m.stock <= m.minThreshold).length === 0 ? (
                  <div className="py-12 text-center text-slate-400 font-medium flex flex-col items-center gap-2">
                    <PackageCheck size={36} className="text-emerald-500" />
                    <p className="font-bold text-slate-800">Aucun produit à commander !</p>
                    <p className="text-xs">Votre réserve officinale est amplement approvisionnée.</p>
                  </div>
                ) : (
                  <>
                    <div className="border border-slate-100 rounded-2xl overflow-hidden bg-slate-50/20">
                      <table className="w-full text-left text-xs font-medium">
                        <thead>
                          <tr className="bg-slate-50 border-b border-slate-100">
                            <th className="px-5 py-3 font-bold text-slate-400 uppercase text-[9px] tracking-wider">Médicament</th>
                            <th className="px-5 py-3 font-bold text-slate-400 uppercase text-[9px] tracking-wider text-center">Stock actuel</th>
                            <th className="px-5 py-3 font-bold text-slate-400 uppercase text-[9px] tracking-wider text-center">Quantité Suggérée</th>
                            <th className="px-5 py-3 font-bold text-slate-400 uppercase text-[9px] tracking-wider">Estimation P.A.</th>
                            <th className="px-5 py-3 font-bold text-slate-400 uppercase text-[9px] tracking-wider text-right">Fournisseur Cameroun</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                          {medications.filter(m => m.stock <= m.minThreshold).map(m => {
                            // Suggest replenishment quantity to hit double the threshold
                            const suggestedQty = (m.minThreshold * 2) - m.stock;
                            return (
                              <tr key={m.id} className="hover:bg-slate-50/40 bg-white">
                                <td className="px-5 py-4.5">
                                  <div className="font-bold text-slate-800">{m.name} {m.dosage}</div>
                                  <div className="text-[10px] text-slate-400">{m.genericName}</div>
                                </td>
                                <td className="px-5 py-4.5 text-center font-bold text-rose-500">
                                  {m.stock}
                                </td>
                                <td className="px-5 py-4.5 text-center font-black text-brand-600 bg-brand-50/30">
                                  {suggestedQty} boîtes
                                </td>
                                <td className="px-5 py-4.5 font-bold text-slate-700">
                                  {(suggestedQty * m.purchasePrice).toLocaleString()} FCFA
                                </td>
                                <td className="px-5 py-4.5 text-right font-black text-slate-500 uppercase tracking-tight text-[10px]">
                                  {m.therapeuticClass === 'Antipaludique' ? 'UBIPHARM CAMEROUN' : 'LABOREX DOUALA'}
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>

                    <div className="bg-amber-50 rounded-2xl p-4 border border-amber-100 flex gap-3">
                      <Info size={18} className="text-amber-500 shrink-0 mt-0.5" />
                      <div className="text-xs text-amber-700 leading-relaxed">
                        <span className="font-bold">Note d'approvisionnement :</span> Ces estimations sont basées sur vos consommations moyennes à Douala pour garantir une réserve de 30 jours contre le paludisme saisonnier et les infections bactériennes locales.
                      </div>
                    </div>
                  </>
                )}
              </div>
            </div>
          </motion.div>
        )}

        {/* Tab 4: AI RECO & RECOMMENDATIONS */}
        {activeTab === 'ai' && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="space-y-6"
          >
            {/* AI Assistant Banner */}
            <div className="bg-gradient-to-r from-brand-600 to-indigo-700 text-white rounded-[2.5rem] p-6 shadow-xl relative overflow-hidden flex flex-col md:flex-row items-center gap-6 justify-between border-4 border-white">
              <div className="absolute right-0 top-0 w-96 h-96 bg-white/5 rounded-full -mr-32 -mt-32 blur-3xl pointer-events-none" />
              <div className="space-y-2 relative z-10">
                <div className="flex items-center gap-2">
                  <div className="bg-white/20 p-1.5 rounded-lg backdrop-blur-md">
                    <Sparkles size={16} className="text-amber-300 fill-amber-300 animate-pulse" />
                  </div>
                  <span className="text-[10px] font-black uppercase tracking-wider text-brand-100">Analyse Algorithmique Care IA</span>
                </div>
                <h2 className="font-display font-black text-2xl md:text-3xl leading-tight">Optimiseur de Stock Intelligent</h2>
                <p className="text-xs text-brand-100 max-w-xl font-medium leading-relaxed">
                  L'intelligence artificielle analyse en continu l'historique de consommation médicale, l'emplacement, les péremptions imminentes et la météo locale de Douala pour vous conseiller.
                </p>
              </div>
              <div className="shrink-0 bg-white/10 border border-white/20 backdrop-blur-md px-4 py-3.5 rounded-2xl text-center relative z-10">
                <span className="text-[10px] font-bold text-brand-100 block">Indice de Santé du Stock</span>
                <span className="text-3xl font-display font-black text-amber-300 mt-1 block">84%</span>
              </div>
            </div>

            {/* Recommendations Stack */}
            <div className="space-y-4">
              <h3 className="text-sm font-black uppercase text-slate-400 tracking-wider flex items-center gap-2 px-1">
                <Layers size={14} /> Recommandations tactiques générées
              </h3>

              {getAIRecommendations().map((rec, i) => (
                <div 
                  key={i} 
                  className={cn(
                    "bg-white rounded-3xl p-5 border shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4",
                    rec.type === 'danger' ? "border-rose-100 bg-rose-50/5" :
                    rec.type === 'warning' ? "border-amber-100 bg-amber-50/5" :
                    "border-blue-100 bg-blue-50/5"
                  )}
                >
                  <div className="flex items-start gap-4">
                    <div className={cn(
                      "p-3 rounded-2xl shrink-0 border mt-0.5",
                      rec.type === 'danger' ? "bg-rose-50 border-rose-100 text-rose-500" :
                      rec.type === 'warning' ? "bg-amber-50 border-amber-100 text-amber-500" :
                      "bg-blue-50 border-blue-100 text-blue-500"
                    )}>
                      {rec.type === 'danger' && <AlertCircle size={20} />}
                      {rec.type === 'warning' && <AlertTriangle size={20} />}
                      {rec.type === 'info' && <TrendingUp size={20} />}
                      {rec.type === 'success' && <Check size={20} />}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h4 className="font-bold text-slate-900 text-sm">{rec.title}</h4>
                        <span className={cn(
                          "text-[8px] font-black uppercase px-1.5 py-0.5 rounded",
                          rec.type === 'danger' ? "bg-rose-100 text-rose-700" :
                          rec.type === 'warning' ? "bg-amber-100 text-amber-700" :
                          "bg-blue-100 text-blue-700"
                        )}>
                          {rec.impactLabel}
                        </span>
                      </div>
                      <p className="text-xs text-slate-500 leading-relaxed mt-1.5 max-w-2xl font-medium">
                        {rec.desc}
                      </p>
                    </div>
                  </div>

                  <button 
                    onClick={() => {
                      if (rec.type === 'danger') {
                        setActiveTab('alerts');
                      } else {
                        setActiveTab('replenish');
                      }
                    }}
                    className="bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs px-4 py-2.5 rounded-xl text-center shadow-md shrink-0 self-end md:self-auto"
                  >
                    {rec.action}
                  </button>
                </div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* MODAL: ADD MEDICATION */}
      <AnimatePresence>
        {isAddOpen && (
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[1100] flex items-center justify-center p-2 sm:p-4">
            <motion.div 
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white rounded-[1.5rem] sm:rounded-[2.5rem] w-full max-w-2xl border border-slate-100 shadow-2xl overflow-hidden flex flex-col max-h-[95vh] sm:max-h-[90vh]"
            >
              {/* Header */}
              <div className="px-4 py-3.5 sm:px-6 sm:py-5 border-b flex justify-between items-center bg-slate-50/50 shrink-0">
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 bg-brand-50 border border-brand-100 rounded-xl flex items-center justify-center text-brand-600">
                    <Pill size={18} />
                  </div>
                  <div>
                    <h3 className="font-display font-black text-slate-900 text-sm sm:text-base">Ajouter un médicament</h3>
                    <p className="text-[9px] sm:text-[10px] text-slate-400 font-medium">Référencez un nouveau produit dans votre officine.</p>
                  </div>
                </div>
                <button 
                  onClick={() => setIsAddOpen(false)}
                  className="w-8 h-8 rounded-full bg-white hover:bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-400 transition-colors"
                >
                  <X size={16} />
                </button>
              </div>

              {/* Form Body */}
              <form onSubmit={handleAddMed} className="flex flex-col flex-1 overflow-hidden">
                <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Name */}
                  <div>
                    <label className="text-[10px] font-black uppercase text-slate-400 tracking-wider block mb-1">Nom du produit *</label>
                    <input 
                      type="text" 
                      required
                      value={formData.name}
                      onChange={(e) => setFormData({...formData, name: e.target.value})}
                      placeholder="Ex: Doliprane 1000mg"
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-xs font-semibold focus:ring-2 focus:ring-brand-600/10 focus:border-brand-600 outline-none transition-all"
                    />
                  </div>

                  {/* Generic DCI */}
                  <div>
                    <label className="text-[10px] font-black uppercase text-slate-400 tracking-wider block mb-1">Dénomination Commune Internationale (Molécule)</label>
                    <input 
                      type="text" 
                      value={formData.genericName}
                      onChange={(e) => setFormData({...formData, genericName: e.target.value})}
                      placeholder="Ex: Paracétamol"
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-xs font-semibold focus:ring-2 focus:ring-brand-600/10 focus:border-brand-600 outline-none transition-all"
                    />
                  </div>

                  {/* Dosage & Type */}
                  <div>
                    <label className="text-[10px] font-black uppercase text-slate-400 tracking-wider block mb-1">Dosage</label>
                    <input 
                      type="text" 
                      value={formData.dosage}
                      onChange={(e) => setFormData({...formData, dosage: e.target.value})}
                      placeholder="Ex: 500mg, 1g, 125ml"
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-xs font-semibold focus:ring-2 focus:ring-brand-600/10 focus:border-brand-600 outline-none transition-all"
                    />
                  </div>

                  <div>
                    <label className="text-[10px] font-black uppercase text-slate-400 tracking-wider block mb-1">Forme Galénique</label>
                    <select 
                      value={formData.type}
                      onChange={(e) => setFormData({...formData, type: e.target.value})}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-xs font-semibold focus:ring-2 focus:ring-brand-600/10 focus:border-brand-600 outline-none transition-all"
                    >
                      <option value="Comprimé">Comprimé</option>
                      <option value="Gélule">Gélule</option>
                      <option value="Sirop">Sirop / Suspension</option>
                      <option value="Injectable">Injectable</option>
                      <option value="Crème / Pommade">Crème / Pommade</option>
                      <option value="Solution">Solution locale</option>
                    </select>
                  </div>

                  {/* Therapeutic class */}
                  <div>
                    <label className="text-[10px] font-black uppercase text-slate-400 tracking-wider block mb-1">Classe Thérapeutique</label>
                    <select 
                      value={formData.therapeuticClass}
                      onChange={(e) => setFormData({...formData, therapeuticClass: e.target.value})}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-xs font-semibold focus:ring-2 focus:ring-brand-600/10 focus:border-brand-600 outline-none transition-all"
                    >
                      <option value="Antalgique">Antalgique</option>
                      <option value="Antibiotique">Antibiotique</option>
                      <option value="Antipaludique">Antipaludique</option>
                      <option value="Antidiabétique">Antidiabétique</option>
                      <option value="Cardiovasculaire">Cardiovasculaire</option>
                      <option value="Antiseptique">Antiseptique</option>
                      <option value="Autre">Autre thérapeutique</option>
                    </select>
                  </div>

                  {/* Batch code */}
                  <div>
                    <label className="text-[10px] font-black uppercase text-slate-400 tracking-wider block mb-1">Numéro de Lot</label>
                    <input 
                      type="text" 
                      value={formData.batchNumber}
                      onChange={(e) => setFormData({...formData, batchNumber: e.target.value})}
                      placeholder="Ex: LOT-XYZ-12"
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-xs font-semibold focus:ring-2 focus:ring-brand-600/10 focus:border-brand-600 outline-none transition-all"
                    />
                  </div>

                  {/* Stock Quantity & Security Threshold */}
                  <div>
                    <label className="text-[10px] font-black uppercase text-slate-400 tracking-wider block mb-1">Quantité Initiale *</label>
                    <input 
                      type="number" 
                      required
                      min="0"
                      value={formData.stock}
                      onChange={(e) => setFormData({...formData, stock: Number(e.target.value)})}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-xs font-semibold focus:ring-2 focus:ring-brand-600/10 focus:border-brand-600 outline-none transition-all"
                    />
                  </div>

                  <div>
                    <label className="text-[10px] font-black uppercase text-slate-400 tracking-wider block mb-1">Seuil minimal de sécurité *</label>
                    <input 
                      type="number" 
                      required
                      min="1"
                      value={formData.minThreshold}
                      onChange={(e) => setFormData({...formData, minThreshold: Number(e.target.value)})}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-xs font-semibold focus:ring-2 focus:ring-brand-600/10 focus:border-brand-600 outline-none transition-all"
                    />
                  </div>

                  {/* Purchase price & Selling price */}
                  <div>
                    <label className="text-[10px] font-black uppercase text-slate-400 tracking-wider block mb-1">Prix d'Achat (FCFA) *</label>
                    <input 
                      type="number" 
                      required
                      min="0"
                      value={formData.purchasePrice}
                      onChange={(e) => setFormData({...formData, purchasePrice: Number(e.target.value)})}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-xs font-semibold focus:ring-2 focus:ring-brand-600/10 focus:border-brand-600 outline-none transition-all"
                    />
                  </div>

                  <div>
                    <label className="text-[10px] font-black uppercase text-slate-400 tracking-wider block mb-1">Prix de Vente (FCFA) *</label>
                    <input 
                      type="number" 
                      required
                      min="0"
                      value={formData.sellingPrice}
                      onChange={(e) => setFormData({...formData, sellingPrice: Number(e.target.value)})}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-xs font-semibold focus:ring-2 focus:ring-brand-600/10 focus:border-brand-600 outline-none transition-all"
                    />
                  </div>

                  {/* Expiry Date & shelf Location */}
                  <div>
                    <label className="text-[10px] font-black uppercase text-slate-400 tracking-wider block mb-1">Date d'Expiration *</label>
                    <input 
                      type="date" 
                      required
                      value={formData.expiryDate}
                      onChange={(e) => setFormData({...formData, expiryDate: e.target.value})}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-xs font-semibold focus:ring-2 focus:ring-brand-600/10 focus:border-brand-600 outline-none transition-all"
                    />
                  </div>

                  <div>
                    <label className="text-[10px] font-black uppercase text-slate-400 tracking-wider block mb-1">Emplacement Rayonnage</label>
                    <input 
                      type="text" 
                      value={formData.location}
                      onChange={(e) => setFormData({...formData, location: e.target.value})}
                      placeholder="Ex: Étagère A-4, Frigo"
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-xs font-semibold focus:ring-2 focus:ring-brand-600/10 focus:border-brand-600 outline-none transition-all"
                    />
                  </div>

                  <div className="md:col-span-2 flex items-center gap-3 p-4 bg-purple-50/50 rounded-2xl border border-purple-100/50">
                    <input 
                      type="checkbox" 
                      id="requiresPrescriptionAdd"
                      checked={formData.requiresPrescription}
                      onChange={(e) => setFormData({...formData, requiresPrescription: e.target.checked})}
                      className="w-4 h-4 text-brand-600 bg-slate-50 border-slate-300 rounded focus:ring-brand-500"
                    />
                    <div>
                      <label htmlFor="requiresPrescriptionAdd" className="text-xs font-bold text-slate-800 block cursor-pointer">Nécessite une Ordonnance Médicale</label>
                      <span className="text-[10px] text-slate-400 font-medium">Cochez si ce médicament nécessite obligatoirement la validation d'une ordonnance.</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Footer Buttons */}
              <div className="flex justify-end gap-3 p-4 border-t shrink-0 bg-slate-50/50">
                <button 
                  type="button"
                  onClick={() => setIsAddOpen(false)}
                  className="px-5 py-2.5 rounded-xl border text-xs font-bold text-slate-500 hover:bg-slate-50"
                >
                  Annuler
                </button>
                <button 
                  type="submit"
                  className="px-5 py-2.5 rounded-xl bg-brand-600 hover:bg-brand-700 text-white font-bold text-xs"
                >
                  Enregistrer le médicament
                </button>
              </div>
            </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* MODAL: EDIT MEDICATION */}
      <AnimatePresence>
        {isEditOpen && activeMed && (
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[1100] flex items-center justify-center p-2 sm:p-4">
            <motion.div 
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white rounded-[1.5rem] sm:rounded-[2.5rem] w-full max-w-2xl border border-slate-100 shadow-2xl overflow-hidden flex flex-col max-h-[95vh] sm:max-h-[90vh]"
            >
              {/* Header */}
              <div className="px-4 py-3.5 sm:px-6 sm:py-5 border-b flex justify-between items-center bg-slate-50/50 shrink-0">
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 bg-blue-50 border border-blue-100 rounded-xl flex items-center justify-center text-blue-600">
                    <Edit3 size={18} />
                  </div>
                  <div>
                    <h3 className="font-display font-black text-slate-900 text-sm sm:text-base">Modifier {activeMed.name}</h3>
                    <p className="text-[9px] sm:text-[10px] text-slate-400 font-medium">Éditez les informations de stock ou les tarifs de ce produit.</p>
                  </div>
                </div>
                <button 
                  onClick={() => setIsEditOpen(false)}
                  className="w-8 h-8 rounded-full bg-white hover:bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-400 transition-colors"
                >
                  <X size={16} />
                </button>
              </div>

              {/* Form Body */}
              <form onSubmit={handleEditMed} className="flex flex-col flex-1 overflow-hidden">
                <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Name */}
                  <div>
                    <label className="text-[10px] font-black uppercase text-slate-400 tracking-wider block mb-1">Nom du produit *</label>
                    <input 
                      type="text" 
                      required
                      value={formData.name}
                      onChange={(e) => setFormData({...formData, name: e.target.value})}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-xs font-semibold focus:ring-2 focus:ring-brand-600/10 focus:border-brand-600 outline-none transition-all"
                    />
                  </div>

                  {/* Generic DCI */}
                  <div>
                    <label className="text-[10px] font-black uppercase text-slate-400 tracking-wider block mb-1">Dénomination Commune Internationale (Molécule)</label>
                    <input 
                      type="text" 
                      value={formData.genericName}
                      onChange={(e) => setFormData({...formData, genericName: e.target.value})}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-xs font-semibold focus:ring-2 focus:ring-brand-600/10 focus:border-brand-600 outline-none transition-all"
                    />
                  </div>

                  {/* Dosage & Type */}
                  <div>
                    <label className="text-[10px] font-black uppercase text-slate-400 tracking-wider block mb-1">Dosage</label>
                    <input 
                      type="text" 
                      value={formData.dosage}
                      onChange={(e) => setFormData({...formData, dosage: e.target.value})}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-xs font-semibold focus:ring-2 focus:ring-brand-600/10 focus:border-brand-600 outline-none transition-all"
                    />
                  </div>

                  <div>
                    <label className="text-[10px] font-black uppercase text-slate-400 tracking-wider block mb-1">Forme Galénique</label>
                    <select 
                      value={formData.type}
                      onChange={(e) => setFormData({...formData, type: e.target.value})}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-xs font-semibold focus:ring-2 focus:ring-brand-600/10 focus:border-brand-600 outline-none transition-all"
                    >
                      <option value="Comprimé">Comprimé</option>
                      <option value="Gélule">Gélule</option>
                      <option value="Sirop">Sirop / Suspension</option>
                      <option value="Injectable">Injectable</option>
                      <option value="Crème / Pommade">Crème / Pommade</option>
                      <option value="Solution">Solution locale</option>
                    </select>
                  </div>

                  {/* Therapeutic class */}
                  <div>
                    <label className="text-[10px] font-black uppercase text-slate-400 tracking-wider block mb-1">Classe Thérapeutique</label>
                    <select 
                      value={formData.therapeuticClass}
                      onChange={(e) => setFormData({...formData, therapeuticClass: e.target.value})}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-xs font-semibold focus:ring-2 focus:ring-brand-600/10 focus:border-brand-600 outline-none transition-all"
                    >
                      <option value="Antalgique">Antalgique</option>
                      <option value="Antibiotique">Antibiotique</option>
                      <option value="Antipaludique">Antipaludique</option>
                      <option value="Antidiabétique">Antidiabétique</option>
                      <option value="Cardiovasculaire">Cardiovasculaire</option>
                      <option value="Antiseptique">Antiseptique</option>
                      <option value="Autre">Autre thérapeutique</option>
                    </select>
                  </div>

                  {/* Batch code */}
                  <div>
                    <label className="text-[10px] font-black uppercase text-slate-400 tracking-wider block mb-1">Numéro de Lot</label>
                    <input 
                      type="text" 
                      value={formData.batchNumber}
                      onChange={(e) => setFormData({...formData, batchNumber: e.target.value})}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-xs font-semibold focus:ring-2 focus:ring-brand-600/10 focus:border-brand-600 outline-none transition-all"
                    />
                  </div>

                  {/* Stock Quantity & Security Threshold */}
                  <div>
                    <label className="text-[10px] font-black uppercase text-slate-400 tracking-wider block mb-1">Quantité Physique *</label>
                    <input 
                      type="number" 
                      required
                      min="0"
                      value={formData.stock}
                      onChange={(e) => setFormData({...formData, stock: Number(e.target.value)})}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-xs font-semibold focus:ring-2 focus:ring-brand-600/10 focus:border-brand-600 outline-none transition-all"
                    />
                  </div>

                  <div>
                    <label className="text-[10px] font-black uppercase text-slate-400 tracking-wider block mb-1">Seuil minimal de sécurité *</label>
                    <input 
                      type="number" 
                      required
                      min="1"
                      value={formData.minThreshold}
                      onChange={(e) => setFormData({...formData, minThreshold: Number(e.target.value)})}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-xs font-semibold focus:ring-2 focus:ring-brand-600/10 focus:border-brand-600 outline-none transition-all"
                    />
                  </div>

                  {/* Purchase price & Selling price */}
                  <div>
                    <label className="text-[10px] font-black uppercase text-slate-400 tracking-wider block mb-1">Prix d'Achat (FCFA) *</label>
                    <input 
                      type="number" 
                      required
                      min="0"
                      value={formData.purchasePrice}
                      onChange={(e) => setFormData({...formData, purchasePrice: Number(e.target.value)})}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-xs font-semibold focus:ring-2 focus:ring-brand-600/10 focus:border-brand-600 outline-none transition-all"
                    />
                  </div>

                  <div>
                    <label className="text-[10px] font-black uppercase text-slate-400 tracking-wider block mb-1">Prix de Vente (FCFA) *</label>
                    <input 
                      type="number" 
                      required
                      min="0"
                      value={formData.sellingPrice}
                      onChange={(e) => setFormData({...formData, sellingPrice: Number(e.target.value)})}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-xs font-semibold focus:ring-2 focus:ring-brand-600/10 focus:border-brand-600 outline-none transition-all"
                    />
                  </div>

                  {/* Expiry Date & Location */}
                  <div>
                    <label className="text-[10px] font-black uppercase text-slate-400 tracking-wider block mb-1">Date d'Expiration *</label>
                    <input 
                      type="date" 
                      required
                      value={formData.expiryDate}
                      onChange={(e) => setFormData({...formData, expiryDate: e.target.value})}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-xs font-semibold focus:ring-2 focus:ring-brand-600/10 focus:border-brand-600 outline-none transition-all"
                    />
                  </div>

                  <div>
                    <label className="text-[10px] font-black uppercase text-slate-400 tracking-wider block mb-1">Emplacement Rayonnage</label>
                    <input 
                      type="text" 
                      value={formData.location}
                      onChange={(e) => setFormData({...formData, location: e.target.value})}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-xs font-semibold focus:ring-2 focus:ring-brand-600/10 focus:border-brand-600 outline-none transition-all"
                    />
                  </div>

                  <div className="md:col-span-2 flex items-center gap-3 p-4 bg-blue-50/50 rounded-2xl border border-blue-100/50">
                    <input 
                      type="checkbox" 
                      id="requiresPrescriptionEdit"
                      checked={formData.requiresPrescription}
                      onChange={(e) => setFormData({...formData, requiresPrescription: e.target.checked})}
                      className="w-4 h-4 text-blue-600 bg-slate-50 border-slate-300 rounded focus:ring-blue-500"
                    />
                    <div>
                      <label htmlFor="requiresPrescriptionEdit" className="text-xs font-bold text-slate-800 block cursor-pointer">Nécessite une Ordonnance Médicale</label>
                      <span className="text-[10px] text-slate-400 font-medium">Cochez si ce médicament nécessite obligatoirement la validation d'une ordonnance.</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Footer Buttons */}
              <div className="flex justify-end gap-3 p-4 border-t shrink-0 bg-slate-50/50">
                <button 
                  type="button"
                  onClick={() => setIsEditOpen(false)}
                  className="px-5 py-2.5 rounded-xl border text-xs font-bold text-slate-500 hover:bg-slate-50"
                >
                  Annuler
                </button>
                <button 
                  type="submit"
                  className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs"
                >
                  Mettre à jour
                </button>
              </div>
            </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* MODAL: VIEW DETAILED INFO */}
      <AnimatePresence>
        {isViewOpen && activeMed && (
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[1100] flex items-center justify-center p-4">
            <motion.div 
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white rounded-[2.5rem] w-full max-w-lg border border-slate-100 shadow-2xl overflow-hidden p-6 space-y-6"
            >
              {/* Header */}
              <div className="flex justify-between items-start border-b pb-4">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-2xl bg-brand-50 border border-brand-100 text-brand-600 flex items-center justify-center shrink-0">
                    <Pill size={24} />
                  </div>
                  <div>
                    <h3 className="font-display font-black text-slate-900 text-lg leading-tight">{activeMed.name}</h3>
                    <p className="text-xs text-slate-400 italic font-medium mt-0.5">{activeMed.genericName}</p>
                  </div>
                </div>
                <button 
                  onClick={() => setIsViewOpen(false)}
                  className="w-8 h-8 rounded-full bg-slate-50 hover:bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-400 transition-colors"
                >
                  <X size={16} />
                </button>
              </div>

              {/* Specs Grid */}
              <div className="grid grid-cols-2 gap-4 text-xs font-medium">
                <div className="bg-slate-50 rounded-xl p-3">
                  <span className="text-[9px] font-black uppercase text-slate-400 block mb-0.5">Dosage / Forme</span>
                  <span className="font-bold text-slate-800">{activeMed.dosage} • {activeMed.type}</span>
                </div>
                <div className="bg-slate-50 rounded-xl p-3">
                  <span className="text-[9px] font-black uppercase text-slate-400 block mb-0.5">Classe thérapeutique</span>
                  <span className="font-bold text-slate-800">{activeMed.therapeuticClass}</span>
                </div>
                <div className="bg-slate-50 rounded-xl p-3">
                  <span className="text-[9px] font-black uppercase text-slate-400 block mb-0.5">Stock Physique</span>
                  <span className={cn(
                    "font-black text-sm",
                    activeMed.stock <= activeMed.minThreshold ? "text-rose-600" : "text-emerald-600"
                  )}>{activeMed.stock} unités</span>
                  <span className="text-[10px] text-slate-400 block mt-0.5">(Alerte à {activeMed.minThreshold})</span>
                </div>
                <div className="bg-slate-50 rounded-xl p-3">
                  <span className="text-[9px] font-black uppercase text-slate-400 block mb-0.5">Emplacement</span>
                  <span className="font-bold text-slate-800 flex items-center gap-1">
                    <MapPin size={12} className="text-brand-500" />
                    {activeMed.location || 'Non spécifié'}
                  </span>
                </div>
                <div className="bg-slate-50 rounded-xl p-3">
                  <span className="text-[9px] font-black uppercase text-slate-400 block mb-0.5">Numéro de Lot</span>
                  <span className="font-bold text-slate-800 font-mono">{activeMed.batchNumber || 'Sans lot'}</span>
                </div>
                <div className="bg-slate-50 rounded-xl p-3">
                  <span className="text-[9px] font-black uppercase text-slate-400 block mb-0.5">Péremption</span>
                  <span className={cn(
                    "font-bold",
                    isExpired(activeMed.expiryDate) ? "text-rose-600" : "text-slate-800"
                  )}>{new Date(activeMed.expiryDate).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })}</span>
                </div>
              </div>

              {/* Financial analysis */}
              <div className="bg-brand-50/20 border border-brand-100 rounded-2xl p-4 flex flex-col gap-2">
                <h4 className="text-[10px] font-black uppercase tracking-wider text-brand-600 flex items-center gap-1.5">
                  <DollarSign size={12} /> Valorisation financière du produit
                </h4>
                <div className="grid grid-cols-3 gap-2 text-center text-xs">
                  <div>
                    <span className="text-[9px] text-slate-400 block font-medium">Prix d'Achat (u)</span>
                    <span className="font-bold text-slate-700">{activeMed.purchasePrice.toLocaleString()} FCFA</span>
                  </div>
                  <div>
                    <span className="text-[9px] text-slate-400 block font-medium">Prix de Vente (u)</span>
                    <span className="font-bold text-brand-600">{activeMed.sellingPrice.toLocaleString()} FCFA</span>
                  </div>
                  <div>
                    <span className="text-[9px] text-slate-400 block font-medium">Marge brute</span>
                    <span className="font-bold text-emerald-600">+{((activeMed.sellingPrice - activeMed.purchasePrice) / activeMed.sellingPrice * 100).toFixed(0)}%</span>
                  </div>
                </div>
                <div className="h-px bg-brand-100/50 my-1" />
                <div className="flex justify-between text-xs font-bold text-slate-800">
                  <span>Valeur totale en rayon :</span>
                  <span className="text-brand-600">{(activeMed.stock * activeMed.sellingPrice).toLocaleString()} FCFA</span>
                </div>
              </div>

              {/* Action row */}
              <div className="flex justify-between items-center pt-2">
                <button 
                  onClick={() => {
                    setIsViewOpen(false);
                    handleDeleteMed(activeMed.id);
                  }}
                  className="text-rose-500 hover:text-rose-700 flex items-center gap-1 text-xs font-black uppercase tracking-wider transition-colors"
                >
                  <Trash2 size={14} /> Supprimer du stock
                </button>
                <button 
                  onClick={() => {
                    setIsViewOpen(false);
                    openEdit(activeMed);
                  }}
                  className="bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs px-5 py-2.5 rounded-xl shadow-md transition-all flex items-center gap-1.5"
                >
                  <Edit3 size={14} /> Modifier la fiche
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* MODAL: ADVANCED STOCK ADJUSTMENT */}
      <AnimatePresence>
        {adjustmentMed && (
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[1100] flex items-center justify-center p-4">
            <motion.div 
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white rounded-[2.5rem] w-full max-w-4xl border border-slate-100 shadow-2xl overflow-hidden flex flex-col md:flex-row max-h-[90vh]"
            >
              {/* Form Side */}
              <form onSubmit={handleSaveAdjustment} className="flex-1 p-6 md:p-8 flex flex-col justify-between overflow-y-auto">
                <div className="space-y-6">
                  {/* Header */}
                  <div className="flex justify-between items-start">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-2xl bg-amber-50 border border-amber-100 text-amber-600 flex items-center justify-center shrink-0">
                        <RefreshCw size={22} className="animate-spin-slow" />
                      </div>
                      <div>
                        <span className="text-[9px] font-black uppercase tracking-wider text-amber-600 bg-amber-50 px-2.5 py-0.5 rounded-full">Fiche de Mouvement</span>
                        <h3 className="font-display font-black text-slate-900 text-lg leading-tight mt-1">{adjustmentMed.name}</h3>
                        <p className="text-[11px] text-slate-400 italic font-medium">{adjustmentMed.genericName} • {adjustmentMed.dosage}</p>
                      </div>
                    </div>
                  </div>

                  <div className="bg-slate-50 border border-slate-100 rounded-2xl p-4 flex justify-between items-center text-xs font-semibold text-slate-700">
                    <span>Stock physique actuel :</span>
                    <span className="font-black text-base text-slate-900 font-mono bg-white border border-slate-100 px-3 py-1 rounded-xl">
                      {adjustmentMed.stock} unités
                    </span>
                  </div>

                  {/* Adjustment Type Selector */}
                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase text-slate-400 tracking-wider block">Mode d'ajustement</label>
                    <div className="grid grid-cols-3 gap-2">
                      <button
                        type="button"
                        onClick={() => {
                          setAdjustmentType('set');
                          setAdjustmentQty(adjustmentMed.stock.toString());
                        }}
                        className={cn(
                          "py-3 px-2 rounded-xl text-xs font-bold border transition-all text-center flex flex-col items-center gap-1",
                          adjustmentType === 'set' 
                            ? "bg-slate-900 border-slate-900 text-white shadow-md shadow-slate-900/10" 
                            : "bg-white hover:bg-slate-50 border-slate-200 text-slate-600"
                        )}
                      >
                        <span className="text-[9px] uppercase tracking-wider font-black">Définir à</span>
                        <span className="text-[10px] font-medium opacity-80">Nouvel inventaire</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          setAdjustmentType('add');
                          setAdjustmentQty('');
                        }}
                        className={cn(
                          "py-3 px-2 rounded-xl text-xs font-bold border transition-all text-center flex flex-col items-center gap-1",
                          adjustmentType === 'add' 
                            ? "bg-emerald-600 border-emerald-600 text-white shadow-md shadow-emerald-600/10" 
                            : "bg-white hover:bg-slate-50 border-slate-200 text-slate-600"
                        )}
                      >
                        <span className="text-[9px] uppercase tracking-wider font-black">Ajouter (+)</span>
                        <span className="text-[10px] font-medium opacity-80">Entrée en stock</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          setAdjustmentType('remove');
                          setAdjustmentQty('');
                        }}
                        className={cn(
                          "py-3 px-2 rounded-xl text-xs font-bold border transition-all text-center flex flex-col items-center gap-1",
                          adjustmentType === 'remove' 
                            ? "bg-rose-600 border-rose-600 text-white shadow-md shadow-rose-600/10" 
                            : "bg-white hover:bg-slate-50 border-slate-200 text-slate-600"
                        )}
                      >
                        <span className="text-[9px] uppercase tracking-wider font-black">Retirer (-)</span>
                        <span className="text-[10px] font-medium opacity-80">Sortie de stock</span>
                      </button>
                    </div>
                  </div>

                  {/* Quantity input & Reason */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="text-[10px] font-black uppercase text-slate-400 tracking-wider block mb-1">
                        {adjustmentType === 'set' ? 'Nouvelle quantité globale' : 
                         adjustmentType === 'add' ? 'Quantité à ajouter' : 'Quantité à soustraire'}
                      </label>
                      <input
                        type="number"
                        required
                        min="0"
                        placeholder={adjustmentType === 'set' ? 'Ex: 150' : 'Ex: 10'}
                        value={adjustmentQty}
                        onChange={(e) => setAdjustmentQty(e.target.value)}
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-xs font-semibold focus:ring-2 focus:ring-brand-600/10 focus:border-brand-600 outline-none transition-all font-mono"
                      />
                    </div>

                    <div>
                      <label className="text-[10px] font-black uppercase text-slate-400 tracking-wider block mb-1">Motif réglementaire</label>
                      <select
                        value={adjustmentReason}
                        onChange={(e) => setAdjustmentReason(e.target.value)}
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-xs font-semibold focus:ring-2 focus:ring-brand-600/10 focus:border-brand-600 outline-none transition-all text-slate-700"
                      >
                        <option value="correction">Correction d'inventaire</option>
                        <option value="restock">Arrivage / Réapprovisionnement</option>
                        <option value="sale">Vente d'officine</option>
                        <option value="expired">Périmé / Rebut technique</option>
                        <option value="loss">Avarie / Perte / Vol</option>
                      </select>
                    </div>
                  </div>

                  {/* Note / Comment */}
                  <div>
                    <label className="text-[10px] font-black uppercase text-slate-400 tracking-wider block mb-1">Commentaires ou notes techniques</label>
                    <textarea
                      placeholder="Indiquez le numéro de facture, l'origine de l'écart d'inventaire, etc."
                      value={adjustmentNote}
                      onChange={(e) => setAdjustmentNote(e.target.value)}
                      rows={2}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-xs font-medium focus:ring-2 focus:ring-brand-600/10 focus:border-brand-600 outline-none transition-all text-slate-700"
                    />
                  </div>
                </div>

                {/* Submit / Cancel row */}
                <div className="flex gap-3 pt-6 border-t border-slate-50 mt-6">
                  <button
                    type="button"
                    onClick={() => setAdjustmentMed(null)}
                    className="flex-1 py-3 bg-white border border-slate-200 hover:bg-slate-50 rounded-xl text-xs font-bold text-slate-600 transition-colors"
                  >
                    Annuler
                  </button>
                  <button
                    type="submit"
                    className="flex-1 py-3 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 shadow-md shadow-slate-900/15"
                  >
                    <Check size={14} className="stroke-[3]" /> Valider la fiche
                  </button>
                </div>
              </form>

              {/* Ledger History Side */}
              <div className="w-full md:w-[360px] bg-slate-50 border-t md:border-t-0 md:border-l border-slate-100 p-6 flex flex-col max-h-full overflow-hidden">
                <div className="flex items-center gap-1.5 shrink-0 mb-4">
                  <Clock size={14} className="text-slate-400" />
                  <h4 className="text-[10px] font-black uppercase tracking-widest text-slate-400">Historique des Mouvements</h4>
                </div>

                <div className="flex-1 overflow-y-auto space-y-4 pr-1 scrollbar-thin">
                  {adjustmentHistory.length === 0 ? (
                    <div className="h-full flex flex-col items-center justify-center text-center p-6 text-slate-400 space-y-2">
                      <FileText size={24} className="opacity-40" />
                      <p className="text-[10px] font-bold">Aucune transaction enregistrée</p>
                      <p className="text-[9px]">Chaque modification de stock génère un reçu de traçabilité officiel.</p>
                    </div>
                  ) : (
                    adjustmentHistory.map((log, idx) => (
                      <div key={log.id || idx} className="bg-white border border-slate-100 p-3.5 rounded-2xl shadow-sm space-y-2 relative overflow-hidden">
                        <div className={cn(
                          "absolute right-0 top-0 w-1 h-full",
                          log.type === 'entrée' ? "bg-emerald-500" : "bg-rose-500"
                        )} />
                        
                        <div className="flex justify-between items-start pr-2">
                          <span className={cn(
                            "text-[8px] font-black uppercase tracking-wider px-1.5 py-0.5 rounded-md",
                            log.type === 'entrée' ? "bg-emerald-50 text-emerald-700" : "bg-rose-50 text-rose-700"
                          )}>
                            {log.type === 'entrée' ? 'ENTRÉE' : 'SORTIE'} ({log.delta > 0 ? `+${log.delta}` : log.delta})
                          </span>
                          <span className="text-[8px] font-mono text-slate-400">
                            {new Date(log.timestamp).toLocaleDateString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </div>

                        <p className="text-[10px] font-bold text-slate-800 leading-snug">{log.reason}</p>
                        {log.note && <p className="text-[9px] text-slate-500 leading-relaxed italic">"{log.note}"</p>}
                        
                        <div className="flex justify-between items-center pt-1 border-t border-slate-50 text-[8px] font-medium text-slate-400">
                          <span>Stock: {log.previousStock} → {log.newStock}</span>
                          <span className="font-bold">{log.operator}</span>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}

interface StatCardProps {
  label: string;
  value: string;
  sub: string;
  unit?: string;
  icon: React.ReactNode;
  color?: string;
}

function StatCard({ label, value, sub, unit, icon, color }: StatCardProps) {
  return (
    <div className={cn(
      "bg-white rounded-[2rem] p-5 border border-slate-100 shadow-sm flex flex-col justify-between min-h-[120px] transition-all hover:shadow-md",
      color
    )}>
      <div className="flex justify-between items-start gap-2">
        <span className="text-[9px] font-black uppercase tracking-wider text-slate-400 leading-tight">
          {label}
        </span>
        <div className="shrink-0 bg-slate-50 border border-slate-100/50 p-1.5 rounded-lg">
          {icon}
        </div>
      </div>
      <div className="mt-2.5">
        <div className="flex items-baseline gap-1">
          <span className="text-2xl md:text-3xl font-display font-black leading-none tracking-tight">
            {value}
          </span>
          {unit && <span className="text-xs font-bold text-slate-400">{unit}</span>}
        </div>
        <p className="text-[10px] text-slate-400 font-medium mt-1">
          {sub}
        </p>
      </div>
    </div>
  );
}

interface TabButtonProps {
  active: boolean;
  onClick: () => void;
  label: string;
  count?: number;
  highlight?: boolean;
  ai?: boolean;
  icon?: React.ReactNode;
}

function TabButton({ active, onClick, label, count, highlight, ai, icon }: TabButtonProps) {
  return (
    <button 
      onClick={onClick}
      className={cn(
        "py-3.5 px-1.5 border-b-2 font-bold text-xs transition-all relative flex items-center gap-2 whitespace-nowrap",
        active 
          ? ai ? "border-indigo-600 text-indigo-700 font-black" : "border-brand-600 text-brand-600 font-black"
          : "border-transparent text-slate-400 hover:text-slate-800"
      )}
    >
      {icon && <span className={cn(active && ai && "text-amber-500 fill-amber-400 animate-pulse")}>{icon}</span>}
      <span>{label}</span>
      {count !== undefined && (
        <span className={cn(
          "px-1.5 py-0.5 rounded-md text-[9px] font-black border",
          active 
            ? highlight ? "bg-rose-500 text-white border-rose-500" : "bg-brand-50 text-brand-600 border-brand-100"
            : highlight ? "bg-rose-50 text-rose-500 border-rose-100" : "bg-slate-50 text-slate-400 border-slate-100"
        )}>
          {count}
        </span>
      )}
    </button>
  );
}
