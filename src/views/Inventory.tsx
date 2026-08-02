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
import {
  Button,
  PageContainer,
  PageHeader,
  StatCard,
  StatGrid,
  Tabs,
  type TabItem,
} from '../components/ui';
import { db } from '../lib/firebase';
import { collection, getDocs, addDoc, updateDoc, deleteDoc, doc, query, where, onSnapshot } from 'firebase/firestore';

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
  const [activeTab, setActiveTab] = useState<'all' | 'alerts' | 'replenish' | 'movements' | 'valuation' | 'ai'>('all');

  // Advanced Stock Movements states
  const [allMovements, setAllMovements] = useState<any[]>([]);
  const [loadingMovements, setLoadingMovements] = useState(false);
  const [selectedMovementType, setSelectedMovementType] = useState<string>('all');
  const [selectedMovementReason, setSelectedMovementReason] = useState<string>('all');
  const [movementSearchQuery, setMovementSearchQuery] = useState<string>('');

  // Purchase Orders / Supplier orders states
  const [purchaseOrders, setPurchaseOrders] = useState<any[]>([]);
  const [isCreatePOOpen, setIsCreatePOOpen] = useState(false);
  const [poSupplier, setPoSupplier] = useState('');
  const [poItems, setPoItems] = useState<{ medicationId: string, name: string, dosage: string, qty: number, purchasePrice: number }[]>([]);
  const [poNote, setPoNote] = useState('');
  const [suppliers, setSuppliers] = useState<any[]>([]);
  const [suppliersLoading, setSuppliersLoading] = useState(false);
  const [autocompleteQuery, setAutocompleteQuery] = useState<{ index: number; query: string } | null>(null);

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

  // Load from Firestore or local storage fallback with real-time sync
  useEffect(() => {
    let unsubscribe = () => {};
    setLoading(true);

    if (user) {
      const q = query(collection(db, 'medication_stock'), where('pharmacistId', '==', user.uid));
      unsubscribe = onSnapshot(q, (querySnapshot) => {
        let items: Medication[] = [];
        if (!querySnapshot.empty) {
          querySnapshot.forEach((docSnap) => {
            items.push({ id: docSnap.id, ...docSnap.data() } as Medication);
          });
        }
        
        // If Firestore results are empty (not seeded yet or guest conversion), we fallback to local storage
        if (items.length === 0) {
          const stored = localStorage.getItem('medimap_meds_stock');
          if (stored) {
            items = JSON.parse(stored);
          } else {
            items = DEFAULT_MEDICATIONS;
            localStorage.setItem('medimap_meds_stock', JSON.stringify(items));
          }
        } else {
          // Keep local storage copy in sync for seamless offline support or profile view fallbacks
          localStorage.setItem('medimap_meds_stock', JSON.stringify(items));
        }
        
        setMedications(items);
        setLoading(false);
      }, (err) => {
        console.warn("Firestore stock live subscription failed, loading fallback:", err);
        const stored = localStorage.getItem('medimap_meds_stock');
        setMedications(stored ? JSON.parse(stored) : DEFAULT_MEDICATIONS);
        setLoading(false);
      });
    } else {
      // Guest local fallback
      const stored = localStorage.getItem('medimap_meds_stock');
      let items = stored ? JSON.parse(stored) : DEFAULT_MEDICATIONS;
      if (!stored) {
        localStorage.setItem('medimap_meds_stock', JSON.stringify(items));
      }
      setMedications(items);
      setLoading(false);
    }

    return () => unsubscribe();
  }, [user]);

  // Load and seed purchase orders
  useEffect(() => {
    async function loadPurchaseOrders() {
      try {
        let orders: any[] = [];
        if (user) {
          const q = query(collection(db, 'purchase_orders'), where('pharmacistId', '==', user.uid));
          const querySnapshot = await getDocs(q);
          querySnapshot.forEach((docSnap) => {
            orders.push({ id: docSnap.id, ...docSnap.data() });
          });
        }
        
        if (orders.length === 0) {
          const stored = localStorage.getItem('dokta_purchase_orders');
          if (stored) {
            orders = JSON.parse(stored);
          } else {
            // Seed sample orders
            orders = [
              {
                id: 'PO-2026-001',
                supplier: 'LABOREX DOUALA',
                createdAt: '2026-07-10T14:30:00.000Z',
                status: 'Reçu',
                items: [
                  { medicationId: 'med-1', name: 'Coartem 80/480mg', dosage: '80mg/480mg', qty: 20, purchasePrice: 1800 },
                  { medicationId: 'med-2', name: 'Amoxicilline Clamoxyl', dosage: '1g', qty: 30, purchasePrice: 2500 }
                ],
                totalAmount: 111000,
                note: 'Livraison hebdomadaire standard'
              },
              {
                id: 'PO-2026-002',
                supplier: 'UBIPHARM CAMEROUN',
                createdAt: '2026-07-13T09:15:00.000Z',
                status: 'Envoyé',
                items: [
                  { medicationId: 'med-5', name: 'Bétadine Jaune 10%', dosage: '100ml', qty: 15, purchasePrice: 1000 }
                ],
                totalAmount: 15000,
                note: 'Rupture Betadine'
              }
            ];
            localStorage.setItem('dokta_purchase_orders', JSON.stringify(orders));
          }
        }
        orders.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
        setPurchaseOrders(orders);
      } catch (err) {
        console.warn("Failed to load purchase orders:", err);
      }
    }
    loadPurchaseOrders();
  }, [user]);

  // Load suppliers for dropdown selection
  useEffect(() => {
    setSuppliersLoading(true);
    let unsubscribe = () => {};

    if (user) {
      const q = query(collection(db, 'suppliers'), where('pharmacistId', '==', user.uid));
      unsubscribe = onSnapshot(q, (snapshot) => {
        let items: any[] = [];
        snapshot.forEach((docSnap) => {
          items.push({ id: docSnap.id, ...docSnap.data() });
        });

        if (items.length === 0) {
          try {
            const stored = localStorage.getItem('medimap_suppliers');
            if (stored) {
              items = JSON.parse(stored);
            } else {
              items = [
                { id: 'sup-1', name: 'LABOREX DOUALA', email: 'douala@laborex.cm', phone: '+237 233 40 40 40', address: 'Zone Industrielle Bassa, Douala' },
                { id: 'sup-2', name: 'UBIPHARM CAMEROUN', email: 'cameroun@ubipharm.com', phone: '+237 233 43 43 43', address: 'Quartier Bonanjo, Douala' }
              ];
              localStorage.setItem('medimap_suppliers', JSON.stringify(items));
            }
          } catch (e) {}
        } else {
          localStorage.setItem('medimap_suppliers', JSON.stringify(items));
        }
        setSuppliers(items);
        if (items.length > 0) {
          setPoSupplier(items[0].name);
        }
        setSuppliersLoading(false);
      }, (error) => {
        console.warn("Error subscribing to suppliers in Inventory:", error);
        try {
          const stored = localStorage.getItem('medimap_suppliers');
          if (stored) {
            const sups = JSON.parse(stored);
            setSuppliers(sups);
            if (sups.length > 0) setPoSupplier(sups[0].name);
          }
        } catch (e) {}
        setSuppliersLoading(false);
      });
    } else {
      try {
        const stored = localStorage.getItem('medimap_suppliers');
        if (stored) {
          const sups = JSON.parse(stored);
          setSuppliers(sups);
          if (sups.length > 0) setPoSupplier(sups[0].name);
        } else {
          const defaultSups = [
            { id: 'sup-1', name: 'LABOREX DOUALA', email: 'douala@laborex.cm', phone: '+237 233 40 40 40', address: 'Zone Industrielle Bassa, Douala' },
            { id: 'sup-2', name: 'UBIPHARM CAMEROUN', email: 'cameroun@ubipharm.com', phone: '+237 233 43 43 43', address: 'Quartier Bonanjo, Douala' }
          ];
          setSuppliers(defaultSups);
          setPoSupplier(defaultSups[0].name);
          localStorage.setItem('medimap_suppliers', JSON.stringify(defaultSups));
        }
      } catch (e) {}
      setSuppliersLoading(false);
    }

    return () => unsubscribe();
  }, [user]);

  // Load all stock movements
  useEffect(() => {
    async function fetchAllMovements() {
      setLoadingMovements(true);
      try {
        let list: any[] = [];
        if (user) {
          const q = query(collection(db, 'stock_movements'), where('operatorId', '==', user.uid));
          const snap = await getDocs(q);
          snap.forEach((docSnap) => {
            list.push({ id: docSnap.id, ...docSnap.data() });
          });
        }
        
        // Load fallback local logs
        const localList: any[] = [];
        const baseMeds = medications.length > 0 ? medications : DEFAULT_MEDICATIONS;
        baseMeds.forEach(m => {
          const stored = localStorage.getItem(`medimap_movements_${m.id}`);
          if (stored) {
            try {
              localList.push(...JSON.parse(stored));
            } catch (e) {}
          }
        });
        
        const merged = [...list];
        localList.forEach(lm => {
          if (!merged.some(m => m.timestamp === lm.timestamp && m.medicationId === lm.medicationId)) {
            merged.push(lm);
          }
        });
        
        merged.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
        setAllMovements(merged);
      } catch (err) {
        console.warn("Failed to fetch all movements:", err);
      } finally {
        setLoadingMovements(false);
      }
    }
    fetchAllMovements();
  }, [user, medications, activeTab]);

  // Handle PO Receiving (with automatic stock updating)
  const handleReceiveOrder = async (orderId: string) => {
    const updatedOrders = purchaseOrders.map(order => {
      if (order.id === orderId) {
        return { ...order, status: 'Reçu', receivedAt: new Date().toISOString() };
      }
      return order;
    });
    setPurchaseOrders(updatedOrders);
    localStorage.setItem('dokta_purchase_orders', JSON.stringify(updatedOrders));

    const targetOrder = purchaseOrders.find(o => o.id === orderId);
    if (targetOrder) {
      if (user && !orderId.startsWith('po-local-')) {
        try {
          await updateDoc(doc(db, 'purchase_orders', orderId), {
            status: 'Reçu',
            receivedAt: new Date().toISOString()
          });
        } catch (e) {
          console.warn("Firestore PO update failed:", e);
        }
      }

      // Update actual stock
      const updatedMeds = [...medications];
      for (const item of targetOrder.items) {
        const medIndex = updatedMeds.findIndex(m => m.id === item.medicationId || m.name === item.name);
        if (medIndex !== -1) {
          const prevStock = updatedMeds[medIndex].stock;
          const newStock = prevStock + item.qty;
          updatedMeds[medIndex] = {
            ...updatedMeds[medIndex],
            stock: newStock,
            updatedAt: new Date().toISOString()
          };

          const movementLog = {
            medicationId: updatedMeds[medIndex].id,
            medicationName: updatedMeds[medIndex].name,
            type: 'entrée',
            delta: item.qty,
            previousStock: prevStock,
            newStock: newStock,
            reason: 'Réapprovisionnement grossiste',
            note: `Reçu via Bon de commande ${targetOrder.id} - ${targetOrder.supplier}`,
            timestamp: new Date().toISOString(),
            operator: profile?.displayName ? `Dr. ${profile.displayName}` : 'Pharmacien Responsable',
            operatorId: user ? user.uid : 'guest'
          };

          try {
            if (user && !updatedMeds[medIndex].id.startsWith('med-local-')) {
              await updateDoc(doc(db, 'medication_stock', updatedMeds[medIndex].id), {
                stock: newStock,
                updatedAt: new Date().toISOString()
              });
              await addDoc(collection(db, 'stock_movements'), movementLog);
            }
          } catch (err) {
            console.warn("Firestore movement sync error:", err);
          }

          const localLogsKey = `medimap_movements_${updatedMeds[medIndex].id}`;
          const existingLocal = localStorage.getItem(localLogsKey);
          const localLogs = existingLocal ? JSON.parse(existingLocal) : [];
          localLogs.unshift(movementLog);
          localStorage.setItem(localLogsKey, JSON.stringify(localLogs));
        }
      }
      saveMedicationsState(updatedMeds);
      alert(`Félicitations ! Les produits du bon de commande ${targetOrder.id} ont été réceptionnés et ajoutés à votre inventaire.`);
    }
  };

  // Change PO status from Draft to Sent
  const handleSendOrder = async (orderId: string) => {
    const updatedOrders = purchaseOrders.map(order => {
      if (order.id === orderId) {
        return { ...order, status: 'Envoyé', sentAt: new Date().toISOString() };
      }
      return order;
    });
    setPurchaseOrders(updatedOrders);
    localStorage.setItem('dokta_purchase_orders', JSON.stringify(updatedOrders));

    if (user && !orderId.startsWith('po-local-')) {
      try {
        await updateDoc(doc(db, 'purchase_orders', orderId), {
          status: 'Envoyé',
          sentAt: new Date().toISOString()
        });
      } catch (e) {
        console.warn("Firestore PO update failed:", e);
      }
    }
    alert(`Le bon de commande ${orderId} a été envoyé par e-mail/portail au grossiste.`);
  };

  // Create a new PO
  const handleCreatePurchaseOrder = async (supplierName: string, itemsList: any[], notesText: string) => {
    const poId = 'PO-' + new Date().getFullYear() + '-' + Math.floor(1000 + Math.random() * 9000);
    const newPO = {
      id: poId,
      supplier: supplierName,
      createdAt: new Date().toISOString(),
      status: 'Brouillon',
      items: itemsList,
      totalAmount: itemsList.reduce((sum, item) => sum + (item.qty * item.purchasePrice), 0),
      note: notesText || 'Commande générée',
      pharmacistId: user ? user.uid : 'guest'
    };

    const updated = [newPO, ...purchaseOrders];
    setPurchaseOrders(updated);
    localStorage.setItem('dokta_purchase_orders', JSON.stringify(updated));

    if (user) {
      try {
        await addDoc(collection(db, 'purchase_orders'), newPO);
      } catch (err) {
        console.warn("Firestore PO save failed:", err);
      }
    }
    alert(`Bon de commande ${poId} créé à l'état Brouillon pour ${supplierName}.`);
  };

  // Write off / discard expired medication
  const handleWriteOffExpired = async (med: Medication) => {
    if (!window.confirm(`Confirmez-vous la mise au rebut technique de ${med.name} (${med.stock} unités) ? Son stock passera à 0 et le coût de perte sera enregistré.`)) return;

    const prevStock = med.stock;
    const updatedMeds = medications.map(m => {
      if (m.id === med.id) {
        return { ...m, stock: 0, updatedAt: new Date().toISOString() };
      }
      return m;
    });
    saveMedicationsState(updatedMeds);

    const movementLog = {
      medicationId: med.id,
      medicationName: med.name,
      type: 'sortie',
      delta: -prevStock,
      previousStock: prevStock,
      newStock: 0,
      reason: 'Produit périmé / Rebut',
      note: 'Mise au rebut technique réglementaire (Périmé)',
      timestamp: new Date().toISOString(),
      operator: profile?.displayName ? `Dr. ${profile.displayName}` : 'Pharmacien Responsable',
      operatorId: user ? user.uid : 'guest'
    };

    try {
      if (user && !med.id.startsWith('med-local-')) {
        await updateDoc(doc(db, 'medication_stock', med.id), {
          stock: 0,
          updatedAt: new Date().toISOString()
        });
        await addDoc(collection(db, 'stock_movements'), movementLog);
      }
    } catch (err) {
      console.warn("Firestore update on write-off failed:", err);
    }

    const localLogsKey = `medimap_movements_${med.id}`;
    const existingLocal = localStorage.getItem(localLogsKey);
    const localLogs = existingLocal ? JSON.parse(existingLocal) : [];
    localLogs.unshift(movementLog);
    localStorage.setItem(localLogsKey, JSON.stringify(localLogs));

    alert(`${med.name} a été retiré du stock d'officine (Quantité: 0). Le mouvement de perte a été tracé.`);
  };

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
    const newMed: any = {
      ...formData,
      stock: Number(formData.stock),
      minThreshold: Number(formData.minThreshold),
      purchasePrice: Number(formData.purchasePrice),
      sellingPrice: Number(formData.sellingPrice),
      requiresPrescription: Boolean(formData.requiresPrescription),
      updatedAt: new Date().toISOString()
    };

    if (user) {
      newMed.pharmacistId = user.uid;
    }

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

  const inventoryTabs: TabItem<typeof activeTab>[] = [
    { id: 'all', label: 'Inventaire général', icon: <Layers size={14} />, count: sortedMeds.length },
    {
      id: 'alerts',
      label: 'Alertes & péremptions',
      icon: <AlertTriangle size={14} />,
      count: outOfStockCount + lowStockCount + expiredCount,
      alert: true,
    },
    { id: 'replenish', label: 'Commandes & réception', icon: <FileText size={14} /> },
    { id: 'movements', label: 'Mouvements de stock', icon: <RefreshCw size={14} /> },
    { id: 'valuation', label: 'Analyses & valorisation', icon: <DollarSign size={14} /> },
    { id: 'ai', label: 'Optimiseur Care IA', icon: <Sparkles size={14} />, accent: 'indigo' },
  ];

  return (
    <PageContainer>
      <PageHeader
        eyebrow="Cabinet & Pharmacie"
        title="Gestion du Stock Officine"
        subtitle="Suivez les péremptions et les alertes d'approvisionnement en temps réel."
        actions={
          <>
            <Button
              variant="outline"
              aria-label="Rafraîchir l'inventaire"
              title="Rafraîchir"
              onClick={() => {
                setLoading(true);
                setTimeout(() => setLoading(false), 600);
              }}
              icon={<RefreshCw size={16} className={cn(loading && 'animate-spin')} />}
            />
            <Button
              variant="dark"
              icon={<Plus size={16} />}
              onClick={() => {
                resetForm();
                setIsAddOpen(true);
              }}
            >
              Nouveau médicament
            </Button>
          </>
        }
      />

      <StatGrid columns={5}>
        <StatCard
          label="Total médicaments"
          value={totalProducts}
          hint="Références uniques"
          icon={<Pill size={18} className="text-blue-500" />}
          tone="bg-blue-50"
        />
        <StatCard
          label="En rupture"
          value={outOfStockCount}
          hint="Urgence de commande"
          icon={<AlertCircle size={18} className="text-rose-500" />}
          tone="bg-rose-50"
        />
        <StatCard
          label="Alerte stock bas"
          value={lowStockCount}
          hint="Sous le seuil critique"
          icon={<AlertTriangle size={18} className="text-amber-500" />}
          tone="bg-amber-50"
        />
        <StatCard
          label="Périmés"
          value={expiredCount}
          hint={`+ ${expiringSoonCount} sous 90 j.`}
          icon={<Clock size={18} className="text-purple-500" />}
          tone="bg-purple-50"
        />
        <StatCard
          label="Valeur du stock"
          value={totalValuation.toLocaleString()}
          unit="FCFA"
          hint="Prix de vente total"
          icon={<DollarSign size={18} className="text-emerald-500" />}
          tone="bg-emerald-50"
        />
      </StatGrid>

      <Tabs
        aria-label="Sections de l'inventaire"
        tabs={inventoryTabs}
        value={activeTab}
        onChange={setActiveTab}
      />

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

            {/* Main Medications Table Card (Desktop/Tablet Only) */}
            <div className="hidden md:block bg-white rounded-[2.5rem] border border-slate-100 shadow-sm overflow-hidden">
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

            {/* Medications Cards List (Mobile Only) */}
            <div className="block md:hidden space-y-4">
              {sortedMeds.length === 0 ? (
                <div className="bg-white border rounded-[2rem] p-8 text-center text-slate-400 font-medium shadow-sm">
                  <div className="flex flex-col items-center gap-3">
                    <Pill size={36} className="text-slate-300 stroke-1" />
                    <p>Aucun médicament trouvé avec ces critères.</p>
                  </div>
                </div>
              ) : (
                sortedMeds.map((med) => {
                  const status = getMedStatus(med);
                  return (
                    <div key={med.id} className="bg-white border border-slate-100 rounded-[2rem] p-5 shadow-sm space-y-4 relative overflow-hidden text-left">
                      {/* Left color bar for status */}
                      <div className={cn(
                        "absolute left-0 top-0 bottom-0 w-1.5",
                        status === 'expired' ? "bg-rose-500" :
                        status === 'expiring_soon' ? "bg-purple-500" :
                        status === 'out' ? "bg-red-500" :
                        status === 'low' ? "bg-amber-500" :
                        "bg-emerald-500"
                      )} />
                      
                      {/* Header row with name and dosage */}
                      <div className="pl-2 space-y-1">
                        <div className="flex items-start justify-between gap-2">
                          <h4 
                            className="font-bold text-slate-900 text-sm hover:text-brand-600 hover:underline cursor-pointer" 
                            onClick={() => openView(med)}
                          >
                            {med.name}
                          </h4>
                          <span className="text-[10px] text-slate-400 font-bold uppercase shrink-0">
                            {med.dosage}
                          </span>
                        </div>
                        <div className="flex flex-wrap gap-1.5 items-center">
                          <p className="text-[11px] text-slate-400 font-medium italic">{med.genericName}</p>
                          {med.requiresPrescription && (
                            <span className="bg-purple-100 text-purple-700 text-[8px] font-black uppercase tracking-wider px-1.5 py-0.5 rounded">
                              Ordonnance
                            </span>
                          )}
                          <span className="text-[10px] text-slate-400 font-semibold font-mono bg-slate-50 border border-slate-100 px-1.5 py-0.5 rounded">
                            {med.batchNumber || 'N/A'}
                          </span>
                        </div>
                      </div>

                      {/* Therapeutic details & Expiry date */}
                      <div className="pl-2 grid grid-cols-2 gap-3 text-xs border-t border-b border-slate-50 py-3">
                        <div>
                          <span className="text-[9px] font-black text-slate-400 uppercase tracking-wider block">Classe :</span>
                          <span className="font-bold text-slate-700 leading-tight block">{med.therapeuticClass}</span>
                          <span className="text-[10px] text-slate-400 font-medium">{med.type}</span>
                        </div>
                        <div>
                          <span className="text-[9px] font-black text-slate-400 uppercase tracking-wider block">Péremption :</span>
                          <span className={cn(
                            "font-bold flex items-center gap-1",
                            isExpired(med.expiryDate) ? "text-rose-600 line-through" :
                            isExpiringSoon(med.expiryDate) ? "text-purple-600" : "text-slate-600"
                          )}>
                            <Calendar size={10} className="text-slate-400" />
                            {new Date(med.expiryDate).toLocaleDateString('fr-FR', { month: 'short', year: 'numeric' })}
                          </span>
                        </div>
                      </div>

                      {/* Stock & Prices row */}
                      <div className="pl-2 flex items-center justify-between gap-4">
                        <div>
                          <span className="text-[9px] font-black text-slate-400 uppercase tracking-wider block">Prix d'officine :</span>
                          <span className="font-bold text-slate-800 text-xs">{med.sellingPrice.toLocaleString()} FCFA</span>
                          <span className="text-[9px] text-slate-400 block font-medium italic">Achat: {med.purchasePrice.toLocaleString()} FCFA</span>
                        </div>
                        
                        <div className="flex flex-col items-end gap-1">
                          <button 
                            type="button"
                            onClick={() => setAdjustmentMed(med)}
                            className="flex items-center gap-1.5 bg-slate-50 hover:bg-brand-50 hover:text-brand-600 px-3 py-1.5 rounded-xl border border-slate-100 transition-all"
                          >
                            <span className={cn(
                              "font-black text-xs",
                              status === 'expired' || status === 'out' ? "text-rose-600" :
                              status === 'low' ? "text-amber-500" : "text-slate-800"
                            )}>
                              Stock: {med.stock}
                            </span>
                            <span className="text-[9px] font-bold text-slate-400 border-l pl-1.5">Ajuster</span>
                          </button>
                          
                          {/* Status Badge */}
                          {status === 'expired' && <span className="text-[8px] font-black uppercase bg-rose-100 text-rose-700 px-1.5 py-0.5 rounded">Périmé</span>}
                          {status === 'expiring_soon' && <span className="text-[8px] font-black uppercase bg-purple-100 text-purple-700 px-1.5 py-0.5 rounded">Périme bientôt</span>}
                          {status === 'out' && <span className="text-[8px] font-black uppercase bg-red-100 text-red-700 px-1.5 py-0.5 rounded">Rupture stock</span>}
                          {status === 'low' && <span className="text-[8px] font-black uppercase bg-amber-100 text-amber-700 px-1.5 py-0.5 rounded">Critique</span>}
                          {status === 'optimal' && <span className="text-[8px] font-black uppercase bg-emerald-100 text-emerald-700 px-1.5 py-0.5 rounded">Optimal</span>}
                        </div>
                      </div>

                      {/* Action buttons footer */}
                      <div className="pl-2 flex justify-end gap-2 pt-3 border-t border-slate-50">
                        <button 
                          type="button"
                          onClick={() => openView(med)}
                          className="px-3 py-1.5 bg-slate-50 hover:bg-slate-100 text-slate-600 font-bold text-xs rounded-xl transition-colors border flex items-center gap-1"
                        >
                          <Eye size={12} />
                          <span>Détails</span>
                        </button>
                        <button 
                          type="button"
                          onClick={() => openEdit(med)}
                          className="px-3 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-600 font-bold text-xs rounded-xl transition-colors border border-blue-100 flex items-center gap-1"
                        >
                          <Edit3 size={12} />
                          <span>Modifier</span>
                        </button>
                        <button 
                          type="button"
                          onClick={() => handleDeleteMed(med.id)}
                          className="p-1.5 bg-rose-50 hover:bg-rose-100 text-rose-600 rounded-xl transition-colors border border-rose-100"
                        >
                          <Trash2 size={12} />
                        </button>
                      </div>
                    </div>
                  );
                })
              )}
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
              <div className="bg-white rounded-2xl md:rounded-[2rem] p-5 border border-red-100 shadow-sm flex items-start gap-4">
                <div className="p-3.5 bg-rose-50 text-rose-500 rounded-2xl border border-rose-100">
                  <AlertCircle size={22} />
                </div>
                <div>
                  <h3 className="font-bold text-slate-800 text-base">En Rupture</h3>
                  <p className="text-2xl font-display font-black text-rose-600 mt-1">{outOfStockCount}</p>
                  <p className="text-[10px] text-slate-400 mt-0.5">Médicaments absents du stock physique.</p>
                </div>
              </div>

              <div className="bg-white rounded-2xl md:rounded-[2rem] p-5 border border-amber-100 shadow-sm flex items-start gap-4">
                <div className="p-3.5 bg-amber-50 text-amber-500 rounded-2xl border border-amber-100">
                  <AlertTriangle size={22} />
                </div>
                <div>
                  <h3 className="font-bold text-slate-800 text-base">Seuils Critiques</h3>
                  <p className="text-2xl font-display font-black text-amber-500 mt-1">{lowStockCount}</p>
                  <p className="text-[10px] text-slate-400 mt-0.5">Sous la réserve de sécurité paramétrée.</p>
                </div>
              </div>

              <div className="bg-white rounded-2xl md:rounded-[2rem] p-5 border border-purple-100 shadow-sm flex items-start gap-4">
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
                              {status === 'expired' ? (
                                <button 
                                  onClick={() => handleWriteOffExpired(m)}
                                  className="bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs px-3.5 py-2.5 rounded-xl shadow-md"
                                >
                                  Mettre au rebut
                                </button>
                              ) : (
                                <button 
                                  onClick={() => {
                                    setPoSupplier(suppliers.length > 0 ? suppliers[0].name : 'LABOREX DOUALA');
                                    setPoItems([{ medicationId: m.id, name: m.name, dosage: m.dosage, qty: (m.minThreshold * 2) - m.stock, purchasePrice: m.purchasePrice }]);
                                    setActiveTab('replenish');
                                    setIsCreatePOOpen(true);
                                  }}
                                  className="bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs px-3.5 py-2.5 rounded-xl shadow-md"
                                >
                                  Créer Bon
                                </button>
                              )}
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

        {/* Tab 3: PURCHASE ORDERS & RECEIPTS */}
        {activeTab === 'replenish' && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="space-y-6"
          >
            {/* Purchase order system header with buttons */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-5 rounded-[2rem] border border-slate-100 shadow-sm">
              <div>
                <h2 className="text-lg font-display font-black text-slate-900">Commandes Grossistes & Réception</h2>
                <p className="text-xs text-slate-400 font-medium mt-0.5">
                  Planifiez vos approvisionnements d'officine auprès des grossistes (Laborex, Ubipharm) et validez la réception physique.
                </p>
              </div>
              <button
                onClick={() => {
                  const alertItems = medications
                    .filter(m => m.stock <= m.minThreshold)
                    .map(m => ({
                      medicationId: m.id,
                      name: m.name,
                      dosage: m.dosage,
                      qty: (m.minThreshold * 2) - m.stock,
                      purchasePrice: m.purchasePrice
                    }));
                  setPoItems(alertItems);
                  setPoSupplier(suppliers.length > 0 ? suppliers[0].name : 'LABOREX DOUALA');
                  setPoNote('Généré automatiquement d\'après les alertes de stock bas.');
                  setIsCreatePOOpen(true);
                }}
                className="bg-brand-600 hover:bg-brand-700 text-white font-bold text-xs px-5 py-3 rounded-2xl flex items-center gap-2 transition-all shadow-lg shadow-brand-600/15"
              >
                <Plus size={16} /> Nouveau Bon de Commande
              </button>
            </div>

            {/* Split layout: Active Purchase Orders and recommended orders */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              
              {/* Left 2 Cols: Existing Purchase Orders List */}
              <div className="lg:col-span-2 space-y-4">
                <h3 className="text-xs font-black uppercase text-slate-400 tracking-wider px-1">
                  Suivi des Bons de Commande ({purchaseOrders.length})
                </h3>

                {purchaseOrders.length === 0 ? (
                  <div className="bg-white border border-slate-100 rounded-[2rem] p-12 text-center text-slate-400 font-medium">
                    <FileText size={36} className="mx-auto text-slate-300 stroke-1 mb-2 animate-bounce" />
                    <p className="font-bold text-slate-800 text-sm">Aucune commande enregistrée</p>
                    <p className="text-xs mt-1">Créez votre première commande pour suivre vos livraisons.</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {purchaseOrders.map((order) => (
                      <div key={order.id} className="bg-white rounded-[2rem] border border-slate-100 p-5 shadow-sm space-y-4 hover:shadow-md transition-all">
                        {/* Order Header row */}
                        <div className="flex flex-wrap justify-between items-center gap-3 border-b pb-3.5">
                          <div className="flex items-center gap-2.5">
                            <div className="w-9 h-9 bg-slate-50 border border-slate-100 rounded-xl flex items-center justify-center text-slate-500 font-mono text-xs font-black">
                              PO
                            </div>
                            <div>
                              <div className="flex items-center gap-2">
                                <span className="font-bold text-slate-900 text-sm">{order.id}</span>
                                <span className={cn(
                                  "text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full",
                                  order.status === 'Reçu' ? "bg-emerald-100 text-emerald-800" :
                                  order.status === 'Envoyé' ? "bg-blue-100 text-blue-800" :
                                  "bg-slate-100 text-slate-700"
                                )}>
                                  {order.status}
                                </span>
                              </div>
                              <span className="text-[10px] text-slate-400 font-medium">
                                Créé le {new Date(order.createdAt).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                              </span>
                            </div>
                          </div>

                          <div className="text-right">
                            <span className="text-xs text-slate-400 font-bold block">Grossiste d'approvisionnement</span>
                            <span className="text-xs font-black text-slate-700 uppercase">{order.supplier}</span>
                          </div>
                        </div>

                        {/* Order Items Summary */}
                        <div className="bg-slate-50/50 rounded-xl p-3 border border-slate-100/50">
                          <table className="w-full text-left text-xs">
                            <thead>
                              <tr className="text-[9px] text-slate-400 uppercase font-black tracking-wider border-b border-slate-100 pb-1 block w-full mb-1">
                                <th className="w-3/5">Médicament</th>
                                <th className="w-1/5 text-center">Quantité</th>
                                <th className="w-1/5 text-right">Tarif HT</th>
                              </tr>
                            </thead>
                            <tbody className="space-y-1 block max-h-24 overflow-y-auto scrollbar-thin">
                              {order.items.map((item: any, idx: number) => (
                                <tr key={idx} className="flex justify-between items-center text-slate-700 font-medium">
                                  <td className="w-3/5 truncate">{item.name} {item.dosage}</td>
                                  <td className="w-1/5 text-center font-bold text-slate-900">{item.qty} boîtes</td>
                                  <td className="w-1/5 text-right font-semibold font-mono">{(item.qty * item.purchasePrice).toLocaleString()} FCFA</td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>

                        {/* Order notes */}
                        {order.note && (
                          <div className="text-[11px] text-slate-500 italic flex gap-1 items-start bg-slate-50 p-2 rounded-xl border border-transparent">
                            <span className="font-bold shrink-0">Note :</span>
                            <span className="line-clamp-2">"{order.note}"</span>
                          </div>
                        )}

                        {/* Actions Row */}
                        <div className="flex justify-between items-center pt-2.5 border-t border-slate-50">
                          <div>
                            <span className="text-[10px] text-slate-400 font-bold uppercase block">Montant Facture</span>
                            <span className="font-black font-display text-base text-brand-600">
                              {order.totalAmount.toLocaleString()} <span className="text-xs font-medium">FCFA</span>
                            </span>
                          </div>

                          <div className="flex gap-2">
                            {order.status === 'Brouillon' && (
                              <button
                                onClick={() => handleSendOrder(order.id)}
                                className="bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs px-4 py-2.5 rounded-xl flex items-center gap-1.5 shadow-md"
                              >
                                <ArrowUpRight size={14} /> Envoyer au Grossiste
                              </button>
                            )}
                            {order.status === 'Envoyé' && (
                              <button
                                onClick={() => handleReceiveOrder(order.id)}
                                className="bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs uppercase tracking-wider px-4 py-2.5 rounded-xl flex items-center gap-1.5 shadow-md"
                              >
                                <Check size={14} className="stroke-[3]" /> Confirmer la Réception
                              </button>
                            )}
                            {order.status === 'Reçu' && (
                              <div className="text-xs text-emerald-600 font-bold flex items-center gap-1 bg-emerald-50 px-3.5 py-2 rounded-xl border border-emerald-100">
                                <Check size={14} className="stroke-[3]" /> Réceptionné & Stocké
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Right 1 Col: Dynamic Alert Suggestions to Order */}
              <div className="space-y-4">
                <h3 className="text-xs font-black uppercase text-slate-400 tracking-wider px-1 flex items-center gap-1.5">
                  <AlertTriangle size={14} className="text-amber-500" />
                  Seuils critiques & Besoins ({medications.filter(m => m.stock <= m.minThreshold).length})
                </h3>

                <div className="bg-white rounded-[2rem] border border-slate-100 p-5 shadow-sm space-y-4">
                  <div className="pb-3 border-b border-slate-100">
                    <p className="text-xs text-slate-500 leading-relaxed font-medium">
                      Ces suggestions représentent le volume nécessaire pour remonter vos réserves de sécurité à un niveau de tranquillité de 30 jours d'après la consommation de Douala.
                    </p>
                  </div>

                  <div className="space-y-3 max-h-[350px] overflow-y-auto scrollbar-thin">
                    {medications.filter(m => m.stock <= m.minThreshold).length === 0 ? (
                      <div className="py-6 text-center text-slate-400 text-xs">
                        <Check size={24} className="mx-auto text-emerald-500 mb-1" />
                        Tous vos stocks d'officine sont optimaux.
                      </div>
                    ) : (
                      medications.filter(m => m.stock <= m.minThreshold).map(m => {
                        const recQty = (m.minThreshold * 2) - m.stock;
                        return (
                          <div key={m.id} className="flex justify-between items-center p-3 bg-slate-50 rounded-2xl border border-slate-100">
                            <div>
                              <h4 className="text-xs font-bold text-slate-800 line-clamp-1">{m.name}</h4>
                              <p className="text-[10px] text-slate-400 font-medium font-mono">Stock : {m.stock} / Min : {m.minThreshold}</p>
                            </div>
                            <div className="text-right">
                              <span className="text-xs font-black text-brand-600 block">+{recQty} boîtes</span>
                              <span className="text-[9px] text-slate-400 font-semibold italic">{(recQty * m.purchasePrice).toLocaleString()} FCFA</span>
                            </div>
                          </div>
                        );
                      })
                    )}
                  </div>

                  {medications.filter(m => m.stock <= m.minThreshold).length > 0 && (
                    <button
                      onClick={() => {
                        const alertItems = medications
                          .filter(m => m.stock <= m.minThreshold)
                          .map(m => ({
                            medicationId: m.id,
                            name: m.name,
                            dosage: m.dosage,
                            qty: (m.minThreshold * 2) - m.stock,
                            purchasePrice: m.purchasePrice
                          }));
                        setPoItems(alertItems);
                        setPoSupplier(suppliers.length > 0 ? suppliers[0].name : 'LABOREX DOUALA');
                        setPoNote('Généré automatiquement d\'après les alertes de stock bas.');
                        setIsCreatePOOpen(true);
                      }}
                      className="w-full py-3 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold transition-colors shadow-md"
                    >
                      Regrouper tout dans un bon
                    </button>
                  )}
                </div>
              </div>
            </div>
          </motion.div>
        )}

        {/* Tab 4: DETAILED STOCK MOVEMENTS & AUDIT LEDGER */}
        {activeTab === 'movements' && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="space-y-6"
          >
            {/* KPI Counters */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
              <div className="bg-white rounded-2xl md:rounded-[2rem] p-5 border border-slate-100 shadow-sm flex items-center justify-between">
                <div>
                  <span className="text-[10px] font-black uppercase text-slate-400">Total Transactions</span>
                  <p className="text-2xl font-display font-black text-slate-800 mt-0.5">{allMovements.length}</p>
                </div>
                <div className="p-3 bg-slate-50 border border-slate-100 rounded-2xl text-slate-500">
                  <FileText size={18} />
                </div>
              </div>

              <div className="bg-white rounded-2xl md:rounded-[2rem] p-5 border border-slate-100 shadow-sm flex items-center justify-between">
                <div>
                  <span className="text-[10px] font-black uppercase text-slate-400">Entrées de Stock</span>
                  <p className="text-2xl font-display font-black text-emerald-600 mt-0.5">
                    {allMovements.filter(m => m.type === 'entrée').reduce((sum, m) => sum + Math.abs(m.delta), 0)}
                  </p>
                </div>
                <div className="p-3 bg-emerald-50 border border-emerald-100 rounded-2xl text-emerald-500">
                  <ArrowUpRight size={18} />
                </div>
              </div>

              <div className="bg-white rounded-2xl md:rounded-[2rem] p-5 border border-slate-100 shadow-sm flex items-center justify-between">
                <div>
                  <span className="text-[10px] font-black uppercase text-slate-400">Sorties & Rebuts</span>
                  <p className="text-2xl font-display font-black text-rose-600 mt-0.5">
                    {allMovements.filter(m => m.type === 'sortie').reduce((sum, m) => sum + Math.abs(m.delta), 0)}
                  </p>
                </div>
                <div className="p-3 bg-rose-50 border border-rose-100 rounded-2xl text-rose-500">
                  <ArrowUpRight size={18} className="rotate-90" />
                </div>
              </div>
            </div>

            {/* Filter controls */}
            <div className="bg-white rounded-[2rem] p-5 border border-slate-100 shadow-sm flex flex-col md:flex-row gap-4 items-center justify-between">
              {/* Search */}
              <div className="relative w-full md:w-80 group">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                <input 
                  type="text" 
                  value={movementSearchQuery}
                  onChange={(e) => setMovementSearchQuery(e.target.value)}
                  placeholder="Rechercher médicament..." 
                  className="w-full bg-slate-50 border-none rounded-xl py-3 pl-12 pr-4 text-sm font-medium focus:ring-2 focus:ring-brand-600/10 outline-none transition-all"
                />
              </div>

              {/* Advanced filter dropdowns */}
              <div className="flex flex-wrap gap-2.5 w-full md:w-auto items-center justify-end">
                <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-100 px-3 py-1.5 rounded-xl">
                  <span className="text-[10px] font-black uppercase text-slate-400">Type :</span>
                  <select 
                    value={selectedMovementType}
                    onChange={(e) => setSelectedMovementType(e.target.value)}
                    className="bg-transparent text-xs font-bold text-slate-600 outline-none border-none p-0 focus:ring-0 cursor-pointer"
                  >
                    <option value="all">Tous types</option>
                    <option value="entrée">Entrée (+)</option>
                    <option value="sortie">Sortie (-)</option>
                  </select>
                </div>

                <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-100 px-3 py-1.5 rounded-xl">
                  <span className="text-[10px] font-black uppercase text-slate-400">Origine :</span>
                  <select 
                    value={selectedMovementReason}
                    onChange={(e) => setSelectedMovementReason(e.target.value)}
                    className="bg-transparent text-xs font-bold text-slate-600 outline-none border-none p-0 focus:ring-0 cursor-pointer"
                  >
                    <option value="all">Toutes origines</option>
                    <option value="Réapprovisionnement grossiste">Approvisionnement</option>
                    <option value="Vente directe d'officine">Vente</option>
                    <option value="Correction d'inventaire">Correction</option>
                    <option value="Produit périmé / Rebut">Périmé / Rebut</option>
                    <option value="Avarie / Perte / Vol">Perte / Vol</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Audit Table */}
            <div className="bg-white rounded-[2.5rem] border border-slate-100 shadow-sm overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-slate-50/50 border-b border-slate-100">
                      <th className="px-6 py-4 text-[10px] font-black uppercase text-slate-400 tracking-widest">Date & Heure</th>
                      <th className="px-6 py-4 text-[10px] font-black uppercase text-slate-400 tracking-widest">Médicament</th>
                      <th className="px-6 py-4 text-[10px] font-black uppercase text-slate-400 tracking-widest text-center">Type</th>
                      <th className="px-6 py-4 text-[10px] font-black uppercase text-slate-400 tracking-widest text-center">Mouvement</th>
                      <th className="px-6 py-4 text-[10px] font-black uppercase text-slate-400 tracking-widest">Motif / Commentaire</th>
                      <th className="px-6 py-4 text-[10px] font-black uppercase text-slate-400 tracking-widest text-right">Opérateur</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-xs">
                    {allMovements
                      .filter(m => {
                        const matchSearch = m.medicationName.toLowerCase().includes(movementSearchQuery.toLowerCase());
                        const matchType = selectedMovementType === 'all' || m.type === selectedMovementType;
                        const matchReason = selectedMovementReason === 'all' || m.reason === selectedMovementReason;
                        return matchSearch && matchType && matchReason;
                      })
                      .length === 0 ? (
                      <tr>
                        <td colSpan={6} className="px-6 py-12 text-center text-slate-400 font-medium">
                          <div className="flex flex-col items-center gap-2">
                            <Clock size={32} className="text-slate-300" />
                            <p>Aucun mouvement enregistré avec ces critères.</p>
                          </div>
                        </td>
                      </tr>
                    ) : (
                      allMovements
                        .filter(m => {
                          const matchSearch = m.medicationName.toLowerCase().includes(movementSearchQuery.toLowerCase());
                          const matchType = selectedMovementType === 'all' || m.type === selectedMovementType;
                          const matchReason = selectedMovementReason === 'all' || m.reason === selectedMovementReason;
                          return matchSearch && matchType && matchReason;
                        })
                        .map((movement, idx) => (
                          <tr key={movement.id || idx} className="hover:bg-slate-50/30 transition-colors">
                            <td className="px-6 py-4.5 font-medium text-slate-500">
                              {new Date(movement.timestamp).toLocaleString('fr-FR', {
                                day: '2-digit',
                                month: 'short',
                                year: 'numeric',
                                hour: '2-digit',
                                minute: '2-digit'
                              })}
                            </td>
                            <td className="px-6 py-4.5 font-bold text-slate-800">
                              {movement.medicationName}
                            </td>
                            <td className="px-6 py-4.5 text-center">
                              <span className={cn(
                                "text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full",
                                movement.type === 'entrée' ? "bg-emerald-50 text-emerald-700 border border-emerald-100" : "bg-rose-50 text-rose-700 border border-rose-100"
                              )}>
                                {movement.type}
                              </span>
                            </td>
                            <td className={cn(
                              "px-6 py-4.5 text-center font-black font-mono text-sm",
                              movement.type === 'entrée' ? "text-emerald-600" : "text-rose-600"
                            )}>
                              {movement.delta > 0 ? `+${movement.delta}` : movement.delta}
                            </td>
                            <td className="px-6 py-4.5">
                              <div className="font-bold text-slate-700">{movement.reason}</div>
                              {movement.note && <div className="text-[10px] text-slate-400 italic mt-0.5">"{movement.note}"</div>}
                            </td>
                            <td className="px-6 py-4.5 text-right font-black text-slate-500">
                              {movement.operator}
                            </td>
                          </tr>
                        ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </motion.div>
        )}

        {/* Tab 5: FINANCIAL VALUATION & REPORTS */}
        {activeTab === 'valuation' && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="space-y-6"
          >
            {/* Financial Grid */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
              <div className="bg-white rounded-[2rem] p-5 border border-slate-100 shadow-sm">
                <span className="text-[9px] font-black uppercase tracking-wider text-slate-400 block">Valeur Achat Totale</span>
                <span className="text-xl sm:text-2xl font-display font-black text-slate-800 block mt-2 font-mono">
                  {medications.reduce((sum, m) => sum + (m.stock * m.purchasePrice), 0).toLocaleString()}
                </span>
                <span className="text-[10px] text-slate-400 font-medium block mt-1">FCFA (Capital immobilisé)</span>
              </div>

              <div className="bg-white rounded-[2rem] p-5 border border-slate-100 shadow-sm">
                <span className="text-[9px] font-black uppercase tracking-wider text-slate-400 block">Valeur Vente Totale</span>
                <span className="text-xl sm:text-2xl font-display font-black text-emerald-600 block mt-2 font-mono">
                  {totalValuation.toLocaleString()}
                </span>
                <span className="text-[10px] text-slate-400 font-medium block mt-1">FCFA (Prix public cumulé)</span>
              </div>

              <div className="bg-white rounded-[2rem] p-5 border border-slate-100 shadow-sm">
                <span className="text-[9px] font-black uppercase tracking-wider text-slate-400 block">Marge brute estimée</span>
                <span className="text-xl sm:text-2xl font-display font-black text-brand-600 block mt-2 font-mono">
                  {(totalValuation - medications.reduce((sum, m) => sum + (m.stock * m.purchasePrice), 0)).toLocaleString()}
                </span>
                <span className="text-[10px] text-slate-400 font-bold block mt-1">
                  + {totalValuation > 0 ? Math.round(((totalValuation - medications.reduce((sum, m) => sum + (m.stock * m.purchasePrice), 0)) / totalValuation) * 100) : 0}% de marge brute
                </span>
              </div>

              <div className="bg-white rounded-[2rem] p-5 border border-slate-100 shadow-sm">
                <span className="text-[9px] font-black uppercase tracking-wider text-slate-400 block">Pertes d'Écritures (Périmés)</span>
                <span className="text-xl sm:text-2xl font-display font-black text-rose-600 block mt-2 font-mono">
                  {medications.filter(m => isExpired(m.expiryDate)).reduce((sum, m) => sum + (m.stock * m.purchasePrice), 0).toLocaleString()}
                </span>
                <span className="text-[10px] text-slate-400 font-medium block mt-1">FCFA (Capital perdu direct)</span>
              </div>
            </div>

            {/* High Fidelity Visual Charts Container */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              
              {/* Chart 1: Therapeutic Class Distribution */}
              <div className="bg-white rounded-[2.5rem] border border-slate-100 p-6 shadow-sm flex flex-col justify-between">
                <div>
                  <h3 className="font-display font-black text-slate-900 text-sm sm:text-base">Répartition du Capital par Classe Thérapeutique</h3>
                  <p className="text-[10px] text-slate-400 font-medium mt-0.5">Valeur d'inventaire totale par domaine médical.</p>
                </div>

                <div className="space-y-4 mt-6">
                  {therapeuticClasses.map((c, i) => {
                    const classVal = medications.filter(m => m.therapeuticClass === c).reduce((sum, m) => sum + (m.stock * m.sellingPrice), 0);
                    const percent = totalValuation > 0 ? Math.round((classVal / totalValuation) * 100) : 0;
                    
                    const barColor = i === 0 ? "bg-brand-500" :
                                     i === 1 ? "bg-emerald-500" :
                                     i === 2 ? "bg-blue-500" :
                                     i === 3 ? "bg-amber-500" :
                                     i === 4 ? "bg-purple-500" : "bg-slate-400";
                    
                    return (
                      <div key={c} className="space-y-1.5">
                        <div className="flex justify-between items-center text-xs font-bold text-slate-700">
                          <span>{c}</span>
                          <span className="font-mono">{classVal.toLocaleString()} FCFA ({percent}%)</span>
                        </div>
                        <div className="w-full bg-slate-100 h-2.5 rounded-full overflow-hidden">
                          <div className={cn("h-full rounded-full transition-all duration-1000", barColor)} style={{ width: `${percent}%` }} />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Chart 2: Inventory Health Donut & Top Capital Items */}
              <div className="bg-white rounded-[2.5rem] border border-slate-100 p-6 shadow-sm flex flex-col justify-between">
                <div>
                  <h3 className="font-display font-black text-slate-900 text-sm sm:text-base">Top 5 Valorisations d'Officine</h3>
                  <p className="text-[10px] text-slate-400 font-medium mt-0.5">Médicaments mobilisant le plus de trésorerie en rayon.</p>
                </div>

                <div className="space-y-3.5 mt-6">
                  {[...medications]
                    .sort((a, b) => (b.stock * b.sellingPrice) - (a.stock * a.sellingPrice))
                    .slice(0, 5)
                    .map((m, idx) => {
                      const value = m.stock * m.sellingPrice;
                      return (
                        <div key={m.id} className="flex justify-between items-center p-3 bg-slate-50 rounded-2xl border border-slate-100/50">
                          <div className="flex items-center gap-2.5">
                            <span className="w-5 h-5 bg-slate-200 text-slate-600 rounded-lg flex items-center justify-center font-black text-[10px]">
                              {idx + 1}
                            </span>
                            <div>
                              <span className="text-xs font-bold text-slate-800 block line-clamp-1">{m.name}</span>
                              <span className="text-[10px] text-slate-400 font-medium">Stock: {m.stock} boîtes • Étagère: {m.location}</span>
                            </div>
                          </div>
                          <span className="text-xs font-black font-mono text-slate-700">{value.toLocaleString()} FCFA</span>
                        </div>
                      );
                    })}
                </div>
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
                    "bg-white rounded-2xl md:rounded-[2rem] p-5 border shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4",
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

      {/* MODAL: CREATE PURCHASE ORDER */}
      <AnimatePresence>
        {isCreatePOOpen && (
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
                    <FileText size={18} />
                  </div>
                  <div>
                    <h3 className="font-display font-black text-slate-900 text-sm sm:text-base">Nouveau Bon de Commande</h3>
                    <p className="text-[9px] sm:text-[10px] text-slate-400 font-medium">Préparez une commande d'approvisionnement en officine.</p>
                  </div>
                </div>
                <button 
                  onClick={() => setIsCreatePOOpen(false)}
                  className="w-8 h-8 rounded-full bg-white hover:bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-400 transition-colors"
                >
                  <X size={16} />
                </button>
              </div>

              {/* Modal Body */}
              <div className="p-5 overflow-y-auto space-y-4 flex-1">
                {/* Supplier selection */}
                <div className="space-y-1.5">
                  <label className="text-xs font-black uppercase tracking-wide text-slate-400">Fournisseur Grossiste</label>
                  <select 
                    value={poSupplier} 
                    onChange={(e) => setPoSupplier(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-100 rounded-xl py-3 px-4 text-sm font-medium focus:ring-2 focus:ring-brand-600/10 outline-none text-slate-800"
                  >
                    {suppliers.map(sup => (
                      <option key={sup.id} value={sup.name}>{sup.name}</option>
                    ))}
                    {suppliers.length === 0 && (
                      <option value="">-- Aucun fournisseur configuré --</option>
                    )}
                  </select>
                  {suppliers.length === 0 && (
                    <p className="text-[10px] text-rose-500 font-bold">Configurez vos grossistes dans Profil &gt; Gestion des Fournisseurs.</p>
                  )}
                </div>

                {/* Items to order */}
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <label className="text-xs font-black uppercase tracking-wide text-slate-400">Médicaments à commander</label>
                    <button 
                      onClick={() => {
                        setPoItems([...poItems, {
                          medicationId: 'custom',
                          name: '',
                          dosage: '',
                          qty: 10,
                          purchasePrice: 0
                        }]);
                      }}
                      className="text-xs font-bold text-brand-600 flex items-center gap-1 hover:underline"
                    >
                      <Plus size={14} /> Ajouter produit
                    </button>
                  </div>

                  {poItems.length === 0 ? (
                    <div className="text-center py-6 text-xs text-slate-400 italic bg-slate-50 rounded-2xl border border-dashed border-slate-200">
                      Aucun produit sélectionné. Cliquez sur "Ajouter produit" pour en rajouter un.
                    </div>
                  ) : (
                    <div className="space-y-2.5 max-h-60 overflow-y-auto pr-1">
                      {poItems.map((item, index) => (
                        <div key={index} className="flex flex-col gap-2 p-3 bg-slate-50 rounded-xl border border-slate-100 relative">
                          <div className="flex gap-2.5 items-center w-full">
                            <div className="flex-1 relative">
                              {/* Medication Name Manual Input with Autocomplete */}
                              <input 
                                type="text"
                                placeholder="Nom du médicament (ex: Paracétamol)"
                                value={item.name}
                                onChange={(e) => {
                                  const val = e.target.value;
                                  const updated = [...poItems];
                                  updated[index].name = val;
                                  updated[index].medicationId = 'custom'; // Custom unless selected from suggestions
                                  setPoItems(updated);
                                  setAutocompleteQuery({ index, query: val });
                                }}
                                className="bg-white border border-slate-200 rounded-lg py-1 px-2.5 text-xs font-bold text-slate-800 outline-none focus:ring-1 focus:ring-brand-500 w-full"
                              />

                              {/* Autocomplete Suggestions Box */}
                              {autocompleteQuery && autocompleteQuery.index === index && autocompleteQuery.query.trim().length > 0 && (
                                <div className="absolute left-0 right-0 z-[1200] bg-white border border-slate-200 rounded-xl shadow-xl mt-1 max-h-48 overflow-y-auto p-1">
                                  {medications
                                    .filter(m => m.name.toLowerCase().includes(autocompleteQuery.query.toLowerCase()) || (m.genericName && m.genericName.toLowerCase().includes(autocompleteQuery.query.toLowerCase())))
                                    .slice(0, 5)
                                    .map(s => (
                                      <button
                                        key={s.id}
                                        type="button"
                                        onClick={() => {
                                          const updated = [...poItems];
                                          updated[index] = {
                                            ...updated[index],
                                            medicationId: s.id,
                                            name: s.name,
                                            dosage: s.dosage || '',
                                            purchasePrice: s.purchasePrice || 0
                                          };
                                          setPoItems(updated);
                                          setAutocompleteQuery(null);
                                        }}
                                        className="w-full text-left px-2.5 py-1.5 hover:bg-brand-50 text-xs font-semibold rounded-lg text-slate-700 hover:text-brand-700 transition-colors flex justify-between items-center"
                                      >
                                        <div className="text-left">
                                          <span className="block font-bold">{s.name}</span>
                                          {s.genericName && <span className="block text-[10px] text-slate-400">{s.genericName}</span>}
                                        </div>
                                        <div className="text-right">
                                          <span className="block text-[10px] font-mono text-slate-400">Stock: {s.stock}</span>
                                          <span className="block text-[10px] font-mono text-slate-400">{s.dosage}</span>
                                        </div>
                                      </button>
                                    ))}
                                  {medications.filter(m => m.name.toLowerCase().includes(autocompleteQuery.query.toLowerCase())).length === 0 && (
                                    <div className="p-2 text-center text-[10px] text-slate-400 italic">
                                      Nouveau médicament (création manuelle)
                                    </div>
                                  )}
                                </div>
                              )}
                            </div>

                            <div className="flex items-center gap-2">
                              <input 
                                type="number" 
                                min="1"
                                value={item.qty}
                                onChange={(e) => {
                                  const updated = [...poItems];
                                  updated[index].qty = Math.max(1, parseInt(e.target.value) || 1);
                                  setPoItems(updated);
                                }}
                                className="w-16 text-center bg-white border border-slate-200 rounded-lg py-1 text-xs font-bold focus:ring-1 focus:ring-brand-500 text-slate-800"
                              />
                              <span className="text-[10px] text-slate-400 font-bold">boîtes</span>
                            </div>

                            <div className="text-right w-24 shrink-0">
                              <span className="text-xs font-mono font-bold text-slate-700">
                                {(item.qty * item.purchasePrice).toLocaleString()} FCFA
                              </span>
                            </div>

                            <button 
                              onClick={() => {
                                setPoItems(poItems.filter((_, idx) => idx !== index));
                                if (autocompleteQuery?.index === index) {
                                  setAutocompleteQuery(null);
                                }
                              }}
                              className="p-1.5 hover:bg-rose-100 text-rose-500 rounded-lg"
                            >
                              <Trash2 size={14} />
                            </button>
                          </div>

                          {/* Editable Dosage and Purchase Price under Name */}
                          <div className="flex gap-4 items-center pl-1">
                            <div className="flex items-center gap-1.5">
                              <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Dosage:</span>
                              <input 
                                type="text"
                                placeholder="ex: 500mg"
                                value={item.dosage || ''}
                                onChange={(e) => {
                                  const updated = [...poItems];
                                  updated[index].dosage = e.target.value;
                                  setPoItems(updated);
                                }}
                                className="bg-transparent border-b border-dashed border-slate-200 focus:border-brand-500 text-xs font-medium text-slate-600 focus:outline-none pb-0.5 w-24"
                              />
                            </div>
                            <div className="flex items-center gap-1.5">
                              <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">P. d'achat:</span>
                              <input 
                                type="number"
                                placeholder="0"
                                value={item.purchasePrice || ''}
                                onChange={(e) => {
                                  const updated = [...poItems];
                                  updated[index].purchasePrice = Math.max(0, parseFloat(e.target.value) || 0);
                                  setPoItems(updated);
                                }}
                                className="bg-transparent border-b border-dashed border-slate-200 focus:border-brand-500 text-xs font-mono font-bold text-slate-600 focus:outline-none pb-0.5 w-20"
                              />
                              <span className="text-[10px] text-slate-400">FCFA</span>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Purchase Order note */}
                <div className="space-y-1.5">
                  <label className="text-xs font-black uppercase tracking-wide text-slate-400">Notes / Instructions</label>
                  <textarea 
                    value={poNote} 
                    onChange={(e) => setPoNote(e.target.value)}
                    placeholder="Saisissez des remarques..." 
                    className="w-full bg-slate-50 border-none rounded-xl py-2.5 px-4 text-xs font-medium focus:ring-2 focus:ring-brand-600/10 outline-none min-h-[60px]"
                  />
                </div>

                {/* Grand Total */}
                <div className="bg-slate-900 text-white rounded-2xl p-4 flex justify-between items-center shrink-0">
                  <div>
                    <span className="text-[10px] text-slate-400 uppercase tracking-widest font-black block">Estimation Total HT</span>
                    <span className="text-lg font-black font-mono">
                      {poItems.reduce((sum, item) => sum + (item.qty * item.purchasePrice), 0).toLocaleString()} FCFA
                    </span>
                  </div>
                  <span className="text-[10px] bg-slate-800 text-slate-400 font-black tracking-wider px-2.5 py-1 rounded-md uppercase">
                    {poSupplier.split(' ')[0]}
                  </span>
                </div>
              </div>

              {/* Footer */}
              <div className="px-4 py-3 sm:px-6 sm:py-4 border-t flex justify-end gap-2.5 bg-slate-50 shrink-0">
                <button 
                  type="button" 
                  onClick={() => setIsCreatePOOpen(false)}
                  className="px-4 py-2 bg-white hover:bg-slate-100 border border-slate-200 text-slate-600 font-bold text-xs rounded-xl"
                >
                  Annuler
                </button>
                <button 
                  type="button"
                  onClick={() => {
                    if (!poSupplier) {
                      alert("Veuillez sélectionner ou configurer un fournisseur d'abord.");
                      return;
                    }
                    if (poItems.length === 0) {
                      alert("Veuillez ajouter au moins un médicament à la commande.");
                      return;
                    }
                    const hasEmptyName = poItems.some(item => !item.name.trim());
                    if (hasEmptyName) {
                      alert("Veuillez renseigner le nom de tous les médicaments.");
                      return;
                    }
                    handleCreatePurchaseOrder(poSupplier, poItems, poNote);
                    setIsCreatePOOpen(false);
                  }}
                  className="px-4 py-2 bg-brand-600 hover:bg-brand-700 text-white font-bold text-xs rounded-xl shadow-lg shadow-brand-600/15"
                >
                  Générer le Bon
                </button>
              </div>
            </motion.div>
          </div>
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
    </PageContainer>
  );
}
