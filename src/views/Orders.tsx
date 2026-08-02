import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Zap, 
  Clock, 
  User, 
  Package, 
  ChevronRight, 
  Loader2, 
  Search, 
  Filter, 
  CheckCircle2, 
  XCircle, 
  Truck, 
  Check, 
  AlertTriangle,
  FileText,
  CreditCard,
  X,
  TrendingUp,
  Printer,
  Download,
  BarChart3,
  MapPin,
  Sparkles,
  Plus,
  HelpCircle,
  Trash2
} from 'lucide-react';
import { useOrders, Order, OrderStatus } from '../components/OrderContext';
import { cn } from '../lib/utils';
import { useAuth } from '../components/AuthContext';
import {
  Button,
  LoadingState,
  PageContainer,
  PageHeader,
  StatCard,
  StatGrid,
  Tabs,
  type TabItem,
} from '../components/ui';
import { collection, query, where, getDocs, doc, updateDoc, increment, addDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../lib/firebase';

interface MedicationStock {
  id: string;
  name: string;
  stock: number;
  sellingPrice: number;
  requiresPrescription: boolean;
}

export function Orders() {
  const { orders, updateOrderStatus, loading } = useOrders();
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<'active' | 'history' | 'analytics'>('active');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [isReceiptOpen, setIsReceiptOpen] = useState(false);
  const [seeding, setSeeding] = useState(false);
  const [medications, setMedications] = useState<MedicationStock[]>([]);
  const [orderComment, setOrderComment] = useState<string>('');
  const [savedComments, setSavedComments] = useState<Record<string, string>>({});

  // Walk-in order creator states
  const [isNewWalkInOpen, setIsNewWalkInOpen] = useState(false);
  const [walkInPatient, setWalkInPatient] = useState('Patient de passage');
  const [walkInCart, setWalkInCart] = useState<{ medicationId: string; count: number }[]>([]);
  const [selectedMedId, setSelectedMedId] = useState('');
  const [selectedMedCount, setSelectedMedCount] = useState(1);
  const [walkInPaymentMethod, setWalkInPaymentMethod] = useState('Espèces');
  const [submittingWalkIn, setSubmittingWalkIn] = useState(false);

  // Status lists
  const activeStatuses: OrderStatus[] = ['pending_validation', 'validated', 'preparing', 'out_for_delivery', 'en_cours'];
  const historyStatuses: OrderStatus[] = ['delivered', 'rejected', 'livre', 'annule'];

  // Load medications stock to display real-time availability in the sidebar
  const loadMedStock = async () => {
    try {
      let items: MedicationStock[] = [];
      if (user) {
        const q = query(collection(db, 'medication_stock'), where('pharmacistId', '==', user.uid));
        const querySnapshot = await getDocs(q);
        querySnapshot.forEach((docSnap) => {
          const data = docSnap.data();
          items.push({
            id: docSnap.id,
            name: data.name || '',
            stock: Number(data.stock) || 0,
            sellingPrice: Number(data.sellingPrice) || 0,
            requiresPrescription: Boolean(data.requiresPrescription) || false
          });
        });
      }
      if (items.length === 0) {
        const stored = localStorage.getItem('medimap_meds_stock');
        if (stored) {
          const parsed = JSON.parse(stored);
          items = parsed.map((m: any) => ({
            id: m.id,
            name: m.name,
            stock: m.stock,
            sellingPrice: m.sellingPrice,
            requiresPrescription: m.requiresPrescription
          }));
        }
      }
      setMedications(items);
    } catch (err) {
      console.warn("Failed to load medication stocks for orders cross-reference:", err);
      const stored = localStorage.getItem('medimap_meds_stock');
      if (stored) {
        setMedications(JSON.parse(stored));
      }
    }
  };

  useEffect(() => {
    loadMedStock();
  }, [user, orders]);

  // Cart Management for Walk-In Order
  const handleAddToWalkInCart = () => {
    if (!selectedMedId) return;
    const med = medications.find(m => m.id === selectedMedId);
    if (!med) return;

    if (selectedMedCount <= 0) {
      alert("La quantité doit être supérieure à 0.");
      return;
    }

    if (selectedMedCount > med.stock) {
      alert(`Stock insuffisant. Il ne reste que ${med.stock} unités de ${med.name}.`);
      return;
    }

    // Check if already in cart
    const existingIndex = walkInCart.findIndex(item => item.medicationId === selectedMedId);
    if (existingIndex > -1) {
      const newCount = walkInCart[existingIndex].count + selectedMedCount;
      if (newCount > med.stock) {
        alert(`Impossible d'ajouter cette quantité. Le total dépasserait le stock disponible (${med.stock} unités).`);
        return;
      }
      const updatedCart = [...walkInCart];
      updatedCart[existingIndex].count = newCount;
      setWalkInCart(updatedCart);
    } else {
      setWalkInCart([...walkInCart, { medicationId: selectedMedId, count: selectedMedCount }]);
    }

    // Reset selected
    setSelectedMedId('');
    setSelectedMedCount(1);
  };

  const handleRemoveFromWalkInCart = (medId: string) => {
    setWalkInCart(walkInCart.filter(item => item.medicationId !== medId));
  };

  const handleCreateWalkInOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      alert("Veuillez vous connecter pour créer une facture.");
      return;
    }
    if (walkInCart.length === 0) {
      alert("Veuillez ajouter au moins un médicament à la facture.");
      return;
    }

    setSubmittingWalkIn(true);
    try {
      const itemsToOrder = walkInCart.map(cartItem => {
        const med = medications.find(m => m.id === cartItem.medicationId)!;
        return {
          id: med.id,
          name: med.name,
          price: med.sellingPrice,
          count: cartItem.count
        };
      });

      const total = itemsToOrder.reduce((sum, item) => sum + (item.price * item.count), 0);

      // Create a completed order
      const orderData = {
        patientId: walkInPatient || 'Patient de passage',
        pharmacistId: user.uid,
        items: itemsToOrder,
        total,
        status: 'delivered' as OrderStatus, // Immediately delivered/completed since they are on-site!
        mode: 'pickup' as const, // on-site
        paymentMethod: walkInPaymentMethod,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      };

      // 1. Add order to firestore
      const docRef = await addDoc(collection(db, 'orders'), orderData);

      // 2. Decrement Firestore stocks
      for (const cartItem of walkInCart) {
        if (!cartItem.medicationId.startsWith('med-local-')) {
          const medRef = doc(db, 'medication_stock', cartItem.medicationId);
          try {
            await updateDoc(medRef, {
              stock: increment(-cartItem.count)
            });
          } catch (e) {
            console.warn("Failed to update firestore stock for:", cartItem.medicationId, e);
          }
        }
      }

      // 3. Decrement localStorage stock fallback if needed
      try {
        const stored = localStorage.getItem('medimap_meds_stock');
        if (stored) {
          const localMeds = JSON.parse(stored);
          const updatedMeds = localMeds.map((m: any) => {
            const cartItem = walkInCart.find(c => c.medicationId === m.id);
            if (cartItem) {
              return { ...m, stock: Math.max(0, m.stock - cartItem.count) };
            }
            return m;
          });
          localStorage.setItem('medimap_meds_stock', JSON.stringify(updatedMeds));
        }
      } catch (localErr) {
        console.warn("Failed to deduct local storage stock for walk-in order:", localErr);
      }

      // Refresh stock values locally
      await loadMedStock();

      // Setup temp order for immediate receipt rendering
      const tempOrder: Order = {
        id: docRef.id,
        patientId: walkInPatient || 'Patient de passage',
        items: itemsToOrder,
        total,
        status: 'delivered' as OrderStatus,
        mode: 'pickup' as const,
        paymentMethod: walkInPaymentMethod,
        date: new Date().toLocaleDateString('fr-FR', {
          day: 'numeric',
          month: 'long',
          year: 'numeric',
          hour: '2-digit',
          minute: '2-digit'
        }),
        createdAt: null,
        updatedAt: null
      };

      // Close modal and clean up
      setIsNewWalkInOpen(false);
      setWalkInCart([]);
      setWalkInPatient('Patient de passage');
      setWalkInPaymentMethod('Espèces');
      setSelectedMedId('');
      setSelectedMedCount(1);

      // Immediately select the created walk-in sale to preview and print ticket!
      setSelectedOrder(tempOrder);
      setIsReceiptOpen(true);

    } catch (err) {
      console.error("Failed to create walk-in order:", err);
      alert("Une erreur est survenue lors de la création de la facture.");
    } finally {
      setSubmittingWalkIn(false);
    }
  };

  // Load saved comments from local storage
  useEffect(() => {
    try {
      const stored = localStorage.getItem('dokta_order_comments');
      if (stored) {
        setSavedComments(JSON.parse(stored));
      }
    } catch (e) {
      console.warn("Failed to read order comments:", e);
    }
  }, []);

  // Update selectedOrder comment state
  useEffect(() => {
    if (selectedOrder) {
      setOrderComment(savedComments[selectedOrder.id] || '');
    }
  }, [selectedOrder, savedComments]);

  const handleSaveComment = () => {
    if (!selectedOrder) return;
    const newComments = { ...savedComments, [selectedOrder.id]: orderComment };
    setSavedComments(newComments);
    localStorage.setItem('dokta_order_comments', JSON.stringify(newComments));
    alert("Note enregistrée avec succès pour cette commande.");
  };

  // Helper to get status details
  const getStatusDetails = (status: OrderStatus) => {
    switch (status) {
      case 'pending_validation':
        return { label: 'À Valider', bg: 'bg-amber-50 text-amber-700 border-amber-200', icon: Clock };
      case 'validated':
        return { label: 'Validée', bg: 'bg-indigo-50 text-indigo-700 border-indigo-200', icon: Check };
      case 'preparing':
        return { label: 'En Préparation', bg: 'bg-blue-50 text-blue-700 border-blue-200', icon: Package };
      case 'out_for_delivery':
        return { label: 'En Livraison', bg: 'bg-purple-50 text-purple-700 border-purple-200', icon: Truck };
      case 'delivered':
      case 'livre':
        return { label: 'Livrée', bg: 'bg-emerald-50 text-emerald-700 border-emerald-200', icon: CheckCircle2 };
      case 'rejected':
      case 'annule':
        return { label: 'Refusée', bg: 'bg-rose-50 text-rose-700 border-rose-200', icon: XCircle };
      default:
        return { label: 'En Cours', bg: 'bg-slate-50 text-slate-700 border-slate-200', icon: Clock };
    }
  };

  // Status transitions
  const handleUpdateStatus = async (orderId: string, nextStatus: OrderStatus) => {
    setUpdatingId(orderId);
    try {
      const order = orders.find(o => o.id === orderId);
      await updateOrderStatus(orderId, nextStatus);
      
      // If order is rejected or cancelled, return items back to stock!
      if ((nextStatus === 'rejected' || nextStatus === 'annule') && order) {
        for (const item of order.items) {
          if (item.id && !item.id.startsWith('med-local-')) {
            const medRef = doc(db, 'medication_stock', item.id);
            try {
              await updateDoc(medRef, {
                stock: increment(item.count)
              });
            } catch (e) {
              console.warn("Failed to restore firestore stock for item:", item.id, e);
            }
          }
        }
        
        // Also update local storage fallback if needed
        try {
          const stored = localStorage.getItem('medimap_meds_stock');
          if (stored) {
            const localMeds = JSON.parse(stored);
            const updatedMeds = localMeds.map((m: any) => {
              const orderedItem = order.items.find(i => i.id === m.id);
              if (orderedItem) {
                return { ...m, stock: m.stock + orderedItem.count };
              }
              return m;
            });
            localStorage.setItem('medimap_meds_stock', JSON.stringify(updatedMeds));
          }
        } catch (localErr) {
          console.warn("Failed to restore localStorage stock:", localErr);
        }
      }

      // Update selectedOrder view state if open
      if (selectedOrder && selectedOrder.id === orderId) {
        setSelectedOrder(prev => prev ? { ...prev, status: nextStatus } : null);
      }
    } catch (err) {
      console.error("Failed to transition status:", err);
    } finally {
      setUpdatingId(null);
    }
  };

  // Seed demo orders for testing the dashboard and invoice printing
  const handleSeedDemoOrders = async () => {
    if (!user) {
      alert("Veuillez vous connecter pour générer des commandes de test.");
      return;
    }
    
    setSeeding(true);
    try {
      const demoOrders = [
        {
          patientId: 'patient-demo-1',
          pharmacistId: user.uid,
          items: [
            { id: 'med-1', name: 'Doliprane 1000mg', price: 1500, count: 2 },
            { id: 'med-2', name: 'Amoxicilline 500mg', price: 3500, count: 1 }
          ],
          total: 6500,
          status: 'pending_validation' as OrderStatus,
          mode: 'pickup' as const,
          paymentMethod: 'cash',
        },
        {
          patientId: 'patient-demo-2',
          pharmacistId: user.uid,
          items: [
            { id: 'med-3', name: 'Spasfon Lyoc', price: 2200, count: 1 },
            { id: 'med-4', name: 'Gaviscon Suspension', price: 1800, count: 3 }
          ],
          total: 7600,
          status: 'preparing' as OrderStatus,
          mode: 'delivery' as const,
          paymentMethod: 'Orange Money',
        },
        {
          patientId: 'patient-demo-3',
          pharmacistId: user.uid,
          items: [
            { id: 'med-1', name: 'Doliprane 1000mg', price: 1500, count: 4 },
            { id: 'med-5', name: 'Maxilase Sirop', price: 2900, count: 2 }
          ],
          total: 11800,
          status: 'delivered' as OrderStatus,
          mode: 'delivery' as const,
          paymentMethod: 'MTN MoMo',
        },
        {
          patientId: 'patient-demo-4',
          pharmacistId: user.uid,
          items: [
            { id: 'med-6', name: 'Nurofen 400mg', price: 3100, count: 1 }
          ],
          total: 3100,
          status: 'rejected' as OrderStatus,
          mode: 'pickup' as const,
          paymentMethod: 'cash',
        }
      ];

      for (const order of demoOrders) {
        await addDoc(collection(db, 'orders'), {
          ...order,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        });
      }
      alert("Commandes d'entraînement ajoutées avec succès !");
    } catch (err) {
      console.error("Failed to seed demo orders:", err);
      alert("Une erreur est survenue lors de la génération des données de simulation.");
    } finally {
      setSeeding(false);
    }
  };

  // Filter orders
  const filteredOrders = orders.filter(order => {
    if (activeTab === 'analytics') return false;

    const matchesTab = activeTab === 'active' 
      ? activeStatuses.includes(order.status)
      : historyStatuses.includes(order.status);

    const matchesSearch = 
      order.id.toLowerCase().includes(searchQuery.toLowerCase()) || 
      (order.paymentMethod && order.paymentMethod.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (order.mode && order.mode.toLowerCase().includes(searchQuery.toLowerCase())) ||
      order.items.some(item => item.name.toLowerCase().includes(searchQuery.toLowerCase()));

    return matchesTab && matchesSearch;
  });

  // Calculate high-fidelity metrics
  const deliveredOrders = orders.filter(o => o.status === 'delivered' || o.status === 'livre');
  const activeOrdersCount = orders.filter(o => activeStatuses.includes(o.status)).length;
  
  const totalRevenue = deliveredOrders.reduce((sum, o) => sum + o.total, 0);
  const averageBasketValue = deliveredOrders.length > 0 ? Math.round(totalRevenue / deliveredOrders.length) : 0;
  
  const totalCompletedAndRejected = orders.filter(o => historyStatuses.includes(o.status)).length;
  const acceptedOrdersCount = orders.filter(o => o.status === 'delivered' || o.status === 'livre' || o.status === 'validated' || o.status === 'preparing' || o.status === 'out_for_delivery').length;
  const serviceLevel = orders.length > 0 ? Math.round((acceptedOrdersCount / orders.length) * 100) : 100;

  // Calculate analytics data
  const deliveryCount = orders.filter(o => o.mode === 'delivery').length;
  const pickupCount = orders.filter(o => o.mode === 'pickup' || !o.mode).length;
  const totalModes = deliveryCount + pickupCount || 1;

  // Payment methods breakdown
  const paymentOM = orders.filter(o => o.paymentMethod?.toLowerCase().includes('orange') || o.paymentMethod?.toLowerCase() === 'om').length;
  const paymentMomo = orders.filter(o => o.paymentMethod?.toLowerCase().includes('mtn') || o.paymentMethod?.toLowerCase() === 'momo').length;
  const paymentCash = orders.filter(o => o.paymentMethod?.toLowerCase() === 'cash' || o.paymentMethod?.toLowerCase().includes('livraison')).length;
  const totalPayments = paymentOM + paymentMomo + paymentCash || 1;

  // Top products calculations
  const productFrequency: Record<string, { count: number; totalSales: number }> = {};
  orders.forEach(order => {
    order.items.forEach(item => {
      if (!productFrequency[item.name]) {
        productFrequency[item.name] = { count: 0, totalSales: 0 };
      }
      productFrequency[item.name].count += item.count;
      productFrequency[item.name].totalSales += item.count * item.price;
    });
  });

  const topProducts = Object.entries(productFrequency)
    .map(([name, data]) => ({ name, ...data }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 5);

  const maxProductCount = topProducts.length > 0 ? Math.max(...topProducts.map(p => p.count)) : 1;

  if (loading) {
    return <LoadingState label="Chargement du flux des commandes…" />;
  }

  const orderTabs: TabItem<'active' | 'history' | 'analytics'>[] = [
    {
      id: 'active',
      label: 'En cours',
      icon: <Clock size={14} />,
      count: orders.filter(o => activeStatuses.includes(o.status)).length,
    },
    {
      id: 'history',
      label: 'Archivées',
      icon: <CheckCircle2 size={14} />,
      count: orders.filter(o => historyStatuses.includes(o.status)).length,
    },
    { id: 'analytics', label: 'Insights IA', icon: <BarChart3 size={14} /> },
  ];

  return (
    <PageContainer>
      <PageHeader
        eyebrow="Officine"
        title="Suivi des Commandes"
        subtitle="Validation, préparation et livraison en flux continu."
        actions={
          <Button icon={<Plus size={14} />} onClick={() => setIsNewWalkInOpen(true)}>
            Vente comptoir
          </Button>
        }
      />

      <StatGrid columns={4}>
        <StatCard
          label="Revenu réalisé"
          value={totalRevenue.toLocaleString()}
          unit="FCFA"
          icon={<TrendingUp className="text-brand-600" size={18} />}
          tone="bg-brand-50"
          hint={`${deliveredOrders.length} commande(s) livrée(s)`}
        />
        <StatCard
          label="File d'attente"
          value={activeOrdersCount}
          unit="en cours"
          icon={<Clock className={cn('text-amber-600', activeOrdersCount > 0 && 'animate-pulse')} size={18} />}
          tone="bg-amber-50"
          hint={`${orders.filter(o => o.status === 'pending_validation').length} à valider`}
        />
        <StatCard
          label="Panier moyen"
          value={averageBasketValue.toLocaleString()}
          unit="FCFA"
          icon={<FileText className="text-indigo-600" size={18} />}
          tone="bg-indigo-50"
          hint="Basé sur les ventes de l'officine"
        />
        <StatCard
          label="Taux de service"
          value={`${serviceLevel}%`}
          icon={<CheckCircle2 className="text-emerald-600" size={18} />}
          tone="bg-emerald-50"
          hint="Acceptation et traitement réussi"
        />
      </StatGrid>

      {/* Main Container Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 md:gap-8 items-start">
        {/* Left Column: List with Filters or Analytics */}
        <div className="lg:col-span-7 space-y-6">
          <div className="bg-white rounded-[2rem] md:rounded-[2.5rem] border border-slate-100 shadow-sm p-4 flex flex-col sm:flex-row gap-3 sm:items-center justify-between">
            <Tabs
              aria-label="Vues des commandes"
              variant="segmented"
              tabs={orderTabs}
              value={activeTab}
              onChange={(id) => {
                setActiveTab(id);
                setSelectedOrder(null);
              }}
              className="w-full sm:w-auto shrink-0"
            />

            {/* Search (only if not on analytics) */}
            {activeTab !== 'analytics' && (
              <div className="relative w-full sm:max-w-xs">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                <input
                  type="text"
                  aria-label="Rechercher une commande"
                  placeholder="Patient, produit, mode..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl md:rounded-2xl pl-11 pr-4 py-2.5 text-xs font-bold focus:ring-2 focus:ring-brand-600/10 focus:border-brand-600 outline-none transition-all"
                />
              </div>
            )}
          </div>

          <AnimatePresence mode="wait">
            {activeTab === 'analytics' ? (
              /* High-fidelity Analytics Subview */
              <motion.div 
                key="analytics"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="bg-white rounded-[2.5rem] border border-slate-100 shadow-sm p-8 space-y-8"
              >
                <div className="flex items-center gap-2 pb-4 border-b">
                  <div className="w-8 h-8 bg-brand-50 border border-brand-100 text-brand-600 rounded-xl flex items-center justify-center">
                    <Sparkles size={16} />
                  </div>
                  <div>
                    <h3 className="text-md font-display font-black text-slate-900 uppercase tracking-tight">Analyses de Demande & Insights IA</h3>
                    <p className="text-xs text-slate-400">Rapports d'activité de l'officine optimisés par l'algorithme intelligent Dokta.</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Top Products */}
                  <div className="space-y-4">
                    <h4 className="text-[11px] font-black uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
                      <Package size={14} /> Médicaments les Plus Demandés
                    </h4>
                    <div className="space-y-3">
                      {topProducts.length === 0 ? (
                        <p className="text-xs text-slate-400 italic">Aucune donnée disponible pour le moment.</p>
                      ) : (
                        topProducts.map((p, idx) => {
                          const percentage = Math.round((p.count / maxProductCount) * 100);
                          return (
                            <div key={idx} className="space-y-1">
                              <div className="flex justify-between text-xs">
                                <span className="font-bold text-slate-800">{p.name}</span>
                                <span className="font-mono font-black text-brand-600">{p.count} ord.</span>
                              </div>
                              <div className="w-full bg-slate-100 h-2.5 rounded-full overflow-hidden">
                                <motion.div 
                                  initial={{ width: 0 }}
                                  animate={{ width: `${percentage}%` }}
                                  transition={{ duration: 0.8 }}
                                  className={cn(
                                    "h-full rounded-full",
                                    idx === 0 ? "bg-brand-600" :
                                    idx === 1 ? "bg-indigo-500" :
                                    idx === 2 ? "bg-blue-500" : "bg-slate-400"
                                  )}
                                />
                              </div>
                            </div>
                          );
                        })
                      )}
                    </div>
                  </div>

                  {/* Operational Distribution Ratio */}
                  <div className="space-y-6">
                    {/* Delivery VS Pickup */}
                    <div className="space-y-3">
                      <h4 className="text-[11px] font-black uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
                        <MapPin size={14} /> Canaux de Distribution
                      </h4>
                      <div className="space-y-2">
                        <div className="flex justify-between text-xs font-bold text-slate-700">
                          <span className="flex items-center gap-1">🚗 Livraison ({deliveryCount})</span>
                          <span className="flex items-center gap-1">🏪 Retrait comptoir ({pickupCount})</span>
                        </div>
                        <div className="w-full bg-slate-100 h-3 rounded-full overflow-hidden flex">
                          <motion.div 
                            initial={{ width: 0 }}
                            animate={{ width: `${Math.round((deliveryCount / totalModes) * 100)}%` }}
                            className="bg-purple-500 h-full"
                          />
                          <motion.div 
                            initial={{ width: 0 }}
                            animate={{ width: `${Math.round((pickupCount / totalModes) * 100)}%` }}
                            className="bg-brand-500 h-full"
                          />
                        </div>
                        <div className="flex justify-between text-[10px] text-slate-400 font-bold uppercase tracking-wider">
                          <span>{Math.round((deliveryCount / totalModes) * 100)}% Livraison</span>
                          <span>{Math.round((pickupCount / totalModes) * 100)}% Retrait</span>
                        </div>
                      </div>
                    </div>

                    {/* Payments Distribution */}
                    <div className="space-y-3">
                      <h4 className="text-[11px] font-black uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
                        <CreditCard size={14} /> Méthodes de Paiement Utilisées
                      </h4>
                      <div className="space-y-2 text-xs font-bold text-slate-700">
                        <div className="flex justify-between">
                          <span>Orange Money</span>
                          <span className="font-mono text-slate-500">{paymentOM}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>MTN MoMo</span>
                          <span className="font-mono text-slate-500">{paymentMomo}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Espèces à la livraison</span>
                          <span className="font-mono text-slate-500">{paymentCash}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* AI Recommendation Alert */}
                <div className="bg-brand-50/50 border border-brand-100 rounded-2xl md:rounded-[2rem] p-5 text-left space-y-3 mt-4">
                  <div className="flex items-start gap-3">
                    <span className="text-xl shrink-0 mt-0.5">💡</span>
                    <div>
                      <p className="font-display font-black text-brand-950 text-sm">Recommandation Intelligente Dokta IA</p>
                      <div className="text-xs leading-relaxed text-brand-900 mt-1 space-y-2">
                        {medications.filter(m => m.stock === 0).length > 0 ? (
                          <p>
                            ⚠️ <b>Rupture de stock critique détectée :</b> Les médicaments suivants sont en rupture de stock totale : {" "}
                            <span className="font-bold text-rose-700">
                              {medications.filter(m => m.stock === 0).map(m => m.name).join(', ')}
                            </span>. 
                            Les ventes comptoir ou livraisons ne pourront plus être honorées pour ces articles. Veuillez lancer un réapprovisionnement d'urgence.
                          </p>
                        ) : null}
                        {medications.filter(m => m.stock > 0 && m.stock <= 5).length > 0 ? (
                          <p>
                            ⚠️ <b>Alerte stock faible :</b> Les articles {" "}
                            <span className="font-bold text-amber-700">
                              {medications.filter(m => m.stock > 0 && m.stock <= 5).map(m => `${m.name} (${m.stock} restants)`).join(', ')}
                            </span> {" "}
                            approchent de leur seuil d'alerte critique. Renouvelez le stock pour éviter d'impacter le chiffre d'affaires.
                          </p>
                        ) : null}
                        {medications.filter(m => m.stock === 0).length === 0 && medications.filter(m => m.stock > 0 && m.stock <= 5).length === 0 ? (
                          <p>
                            ✅ <b>Disponibilité optimale :</b> Tous vos médicaments essentiels disposent d'un niveau de stockage adéquat. La couverture de stock estimée est de plus de 10 jours d'activité sans risque de rupture.
                          </p>
                        ) : null}
                        <p className="text-[11px] text-slate-500 italic pt-1 border-t border-brand-100/50">
                          * Ces recommandations sont synchronisées en temps réel avec votre inventaire d'officine Dokta.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>
            ) : (
              /* Orders List Subview */
              <motion.div 
                key="list"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="bg-white rounded-[2.5rem] border border-slate-100 shadow-sm overflow-hidden divide-y divide-slate-100"
              >
                {filteredOrders.length === 0 ? (
                  <div className="p-16 text-center space-y-4">
                    <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto text-slate-300 border border-slate-100">
                      <Package size={28} />
                    </div>
                    <div>
                      <p className="text-slate-900 font-black text-sm">Aucune commande trouvée</p>
                      <p className="text-slate-400 text-xs font-medium mt-1">Les commandes de vos patients apparaîtront ici.</p>
                    </div>
                  </div>
                ) : (
                  filteredOrders.map((order) => {
                    const statusInfo = getStatusDetails(order.status);
                    
                    return (
                      <motion.div 
                        key={order.id}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        onClick={() => setSelectedOrder(order)}
                        className={cn(
                          "p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-slate-50/70 transition-all cursor-pointer group",
                          selectedOrder?.id === order.id ? "bg-brand-50/30 border-l-4 border-l-brand-600 pl-5" : ""
                        )}
                      >
                        <div className="flex items-start gap-4">
                          <div className={cn(
                            "w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 border",
                            order.status === 'pending_validation' ? "bg-amber-50 border-amber-100 text-amber-500 animate-pulse" :
                            order.status === 'delivered' || order.status === 'livre' ? "bg-emerald-50 border-emerald-100 text-emerald-500" :
                            "bg-blue-50 border-blue-100 text-blue-500"
                          )}>
                            <Package size={20} />
                          </div>
                          <div className="min-w-0">
                            <div className="flex flex-wrap items-center gap-2">
                              <h4 className="font-bold text-slate-900 text-sm">Commande #{order.id.substring(0, 8).toUpperCase()}</h4>
                              <span className={cn("px-2.5 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider border", statusInfo.bg)}>
                                {statusInfo.label}
                              </span>
                              {order.mode === 'delivery' ? (
                                <span className="bg-purple-50 text-purple-600 border border-purple-100 px-2 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider">
                                  🚗 Livraison
                                </span>
                              ) : (
                                <span className="bg-brand-50 text-brand-600 border border-brand-100 px-2 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider">
                                  🏪 Retrait
                                </span>
                              )}
                            </div>
                            
                            <p className="text-xs text-slate-500 mt-1 truncate max-w-sm font-medium">
                              {order.items.map(item => `${item.count}x ${item.name}`).join(', ')}
                            </p>

                            <div className="flex items-center gap-4 mt-2 text-[10px] text-slate-400 font-bold uppercase tracking-wider font-mono">
                              <span className="flex items-center gap-1"><User size={12} /> Patient: {order.patientId.substring(0, 8).toUpperCase()}</span>
                              <span className="flex items-center gap-1"><Clock size={12} /> {order.date || 'Récemment'}</span>
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center justify-between sm:justify-end gap-6 border-t sm:border-none pt-4 sm:pt-0">
                          <div className="text-left sm:text-right">
                            <p className="font-black text-slate-900 text-sm">{order.total.toLocaleString()} FCFA</p>
                            <p className="text-[9px] text-slate-400 font-black uppercase tracking-wider">{order.paymentMethod || 'Paiement à la livraison'}</p>
                          </div>
                          <ChevronRight className={cn(
                            "text-slate-300 transition-all",
                            selectedOrder?.id === order.id ? "text-brand-600 translate-x-1" : "group-hover:text-brand-600 group-hover:translate-x-0.5"
                          )} size={18} />
                        </div>
                      </motion.div>
                    );
                  })
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Right Column: Order Detail, Timeline & Live Stock Cross-Reference (Desktop Only) */}
        <div className="hidden lg:block lg:col-span-5">
          <AnimatePresence mode="wait">
            {selectedOrder ? (
              <motion.div 
                key={selectedOrder.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="bg-white rounded-[2.5rem] border border-slate-100 shadow-lg p-6 space-y-6 sticky top-6 text-left"
              >
                {/* Detail Header */}
                <div className="flex justify-between items-start pb-4 border-b">
                  <div>
                    <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Fiche de Commande</span>
                    <h3 className="font-display font-black text-slate-900 text-lg mt-0.5">#{selectedOrder.id.substring(0, 12).toUpperCase()}</h3>
                    <p className="text-[10px] text-slate-400 font-bold mt-0.5">Créée le {selectedOrder.date || 'Date récente'}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    {/* Receipt print icon */}
                    <button 
                      onClick={() => setIsReceiptOpen(true)}
                      title="Imprimer le ticket"
                      className="w-8 h-8 rounded-full hover:bg-slate-50 border flex items-center justify-center text-slate-500 hover:text-brand-600 transition-colors"
                    >
                      <Printer size={15} />
                    </button>
                    <button 
                      onClick={() => setSelectedOrder(null)}
                      className="w-8 h-8 rounded-full hover:bg-slate-100 border flex items-center justify-center text-slate-400 hover:text-slate-800 transition-colors"
                    >
                      <X size={16} />
                    </button>
                  </div>
                </div>

                {/* Patient Information & Delivery Address */}
                <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 space-y-2">
                  <h4 className="text-[10px] font-black uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                    <User size={12} /> Informations Patient
                  </h4>
                  <div className="text-xs space-y-1">
                    <p className="font-bold text-slate-800">ID Patient: <span className="font-mono font-black text-slate-600">{selectedOrder.patientId.toUpperCase()}</span></p>
                    <p className="text-slate-500 font-medium">Mode de Récupération: <span className="font-bold text-brand-600 uppercase">{selectedOrder.mode === 'pickup' ? 'Retrait sur place' : 'Livraison à domicile'}</span></p>
                    {selectedOrder.mode === 'delivery' && (
                      <p className="text-slate-500 font-medium flex items-center gap-1 pt-1">
                        <MapPin size={12} className="text-purple-500" />
                        <span>Douala, Cameroun (Adresse enregistrée)</span>
                      </p>
                    )}
                  </div>
                </div>

                {/* Real-time Stock Allocation & Ordered Items */}
                <div className="space-y-3">
                  <h4 className="text-[10px] font-black uppercase tracking-wider text-slate-400 flex items-center gap-1.5 justify-between">
                    <span className="flex items-center gap-1.5"><Package size={12} /> Produits & Allocation Stock</span>
                    <span className="text-[9px] text-brand-600 font-bold">Vérifié</span>
                  </h4>
                  <div className="divide-y divide-slate-100 max-h-56 overflow-y-auto pr-1">
                    {selectedOrder.items.map((item, idx) => {
                      // Find real-time stock
                      const matchedMed = medications.find(med => med.name.toLowerCase() === item.name.toLowerCase() || med.id === item.id);
                      const currentStock = matchedMed ? matchedMed.stock : 0;
                      const hasStock = currentStock >= item.count;
                      const isLow = currentStock > 0 && currentStock < item.count + 2;

                      return (
                        <div key={idx} className="py-3 flex flex-col gap-1">
                          <div className="flex items-center justify-between gap-4">
                            <div className="flex items-center gap-2.5">
                              <div className="w-9 h-9 bg-slate-50 border rounded-xl flex items-center justify-center shrink-0">
                                <Package className="text-slate-400" size={15} />
                              </div>
                              <div>
                                <p className="text-xs font-bold text-slate-900">{item.name}</p>
                                <p className="text-[10px] text-slate-400 font-bold">{item.price.toLocaleString()} FCFA / u</p>
                              </div>
                            </div>
                            <div className="text-right">
                              <p className="text-xs font-black text-slate-900">x{item.count}</p>
                              <p className="text-[11px] font-bold text-brand-600">{(item.price * item.count).toLocaleString()} FCFA</p>
                            </div>
                          </div>
                          
                          {/* Stock allocation badge */}
                          <div className="pl-11 flex items-center gap-1.5">
                            {matchedMed ? (
                              hasStock ? (
                                <span className={cn(
                                  "px-2 py-0.5 rounded-lg text-[9px] font-bold flex items-center gap-1",
                                  isLow ? "bg-amber-50 text-amber-700 border border-amber-100" : "bg-emerald-50 text-emerald-700 border border-emerald-100"
                                )}>
                                  <span className={cn("w-1.5 h-1.5 rounded-full", isLow ? "bg-amber-500" : "bg-emerald-500")} />
                                  Allocation validée ({currentStock} en stock)
                                </span>
                              ) : (
                                <span className="bg-rose-50 text-rose-700 border border-rose-100 px-2 py-0.5 rounded-lg text-[9px] font-bold flex items-center gap-1 animate-pulse">
                                  <AlertTriangle size={10} className="text-rose-500" />
                                  Rupture ! ({currentStock} en stock, demandé: {item.count})
                                </span>
                              )
                            ) : (
                              <span className="bg-slate-50 text-slate-500 border border-slate-100 px-2 py-0.5 rounded-lg text-[9px] font-bold flex items-center gap-1">
                                <span className="w-1.5 h-1.5 rounded-full bg-slate-400" />
                                Non référencé (Stock non vérifié)
                              </span>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Progress Timeline Stepper */}
                <div className="space-y-3 pt-2">
                  <h4 className="text-[10px] font-black uppercase tracking-wider text-slate-400">Suivi d'Avancement de la Commande</h4>
                  <div className="flex justify-between items-center relative py-2">
                    {/* Progress bar line */}
                    <div className="absolute left-0 right-0 top-1/2 -translate-y-1/2 h-0.5 bg-slate-100 z-0" />
                    
                    {/* Dynamic colored progress bar */}
                    <div 
                      className="absolute left-0 top-1/2 -translate-y-1/2 h-0.5 bg-brand-500 z-0 transition-all duration-500"
                      style={{ 
                        width: 
                          selectedOrder.status === 'pending_validation' ? '10%' :
                          selectedOrder.status === 'validated' ? '35%' :
                          selectedOrder.status === 'preparing' ? '60%' :
                          selectedOrder.status === 'out_for_delivery' ? '85%' :
                          selectedOrder.status === 'delivered' || selectedOrder.status === 'livre' ? '100%' : '0%'
                      }}
                    />

                    {/* Node 1: Soumission */}
                    <div className="flex flex-col items-center gap-1 z-10">
                      <div className="w-6 h-6 rounded-full bg-brand-600 text-white flex items-center justify-center text-[10px] font-bold shadow-md">
                        ✓
                      </div>
                      <span className="text-[9px] text-slate-500 font-bold">Soumise</span>
                    </div>

                    {/* Node 2: Préparation */}
                    <div className="flex flex-col items-center gap-1 z-10">
                      <div className={cn(
                        "w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold border transition-all duration-300",
                        ['preparing', 'out_for_delivery', 'delivered', 'livre'].includes(selectedOrder.status)
                          ? "bg-brand-600 border-brand-600 text-white shadow-md"
                          : "bg-white border-slate-200 text-slate-400"
                      )}>
                        2
                      </div>
                      <span className="text-[9px] text-slate-500 font-bold">Préparation</span>
                    </div>

                    {/* Node 3: Expédition */}
                    <div className="flex flex-col items-center gap-1 z-10">
                      <div className={cn(
                        "w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold border transition-all duration-300",
                        ['out_for_delivery', 'delivered', 'livre'].includes(selectedOrder.status)
                          ? "bg-brand-600 border-brand-600 text-white shadow-md"
                          : "bg-white border-slate-200 text-slate-400"
                      )}>
                        3
                      </div>
                      <span className="text-[9px] text-slate-500 font-bold">Expédiée</span>
                    </div>

                    {/* Node 4: Remise */}
                    <div className="flex flex-col items-center gap-1 z-10">
                      <div className={cn(
                        "w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold border transition-all duration-300",
                        ['delivered', 'livre'].includes(selectedOrder.status)
                          ? "bg-emerald-600 border-emerald-600 text-white shadow-md"
                          : "bg-white border-slate-200 text-slate-400"
                      )}>
                        ✓
                      </div>
                      <span className="text-[9px] text-slate-500 font-bold">Remise</span>
                    </div>
                  </div>
                </div>

                {/* Internal Pharmacy Comments / Notes */}
                <div className="pt-2 space-y-2 border-t">
                  <h4 className="text-[10px] font-black uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                    <FileText size={12} /> Notes d'Officine Internes
                  </h4>
                  <div className="flex gap-2">
                    <input 
                      type="text" 
                      placeholder="Ex: Patient demande retrait avant 12h..."
                      value={orderComment}
                      onChange={(e) => setOrderComment(e.target.value)}
                      className="flex-1 bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-semibold focus:outline-none focus:ring-1 focus:ring-brand-500"
                    />
                    <button 
                      onClick={handleSaveComment}
                      className="px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl transition-colors"
                    >
                      Sauver
                    </button>
                  </div>
                </div>

                {/* Total and Payment */}
                <div className="pt-4 border-t space-y-2">
                  <div className="flex justify-between items-center text-xs">
                    <span className="font-bold text-slate-400">Moyen de règlement :</span>
                    <span className="font-black text-slate-700 uppercase tracking-wide flex items-center gap-1">
                      <CreditCard size={12} />
                      {selectedOrder.paymentMethod || 'Espèces'}
                    </span>
                  </div>
                  <div className="flex justify-between items-end bg-slate-50 p-4 rounded-2xl border">
                    <span className="text-[10px] font-black uppercase text-slate-400 tracking-wider">Montant total</span>
                    <span className="text-xl font-display font-black text-slate-900">{selectedOrder.total.toLocaleString()} FCFA</span>
                  </div>
                </div>

                {/* Action Controls */}
                <div className="pt-2">
                  {updatingId === selectedOrder.id ? (
                    <div className="flex items-center justify-center py-4 text-slate-500 gap-2 font-bold text-xs uppercase tracking-widest">
                      <Loader2 className="animate-spin text-brand-600" size={18} />
                      Mise à jour en cours...
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {selectedOrder.status === 'pending_validation' && (
                        <div className="grid grid-cols-2 gap-3">
                          <button 
                            onClick={() => handleUpdateStatus(selectedOrder.id, 'rejected')}
                            className="w-full py-3.5 border border-rose-200 bg-rose-50 hover:bg-rose-100 text-rose-700 rounded-xl text-xs font-black uppercase tracking-wider transition-all"
                          >
                            Refuser
                          </button>
                          <button 
                            onClick={() => handleUpdateStatus(selectedOrder.id, 'preparing')}
                            className="w-full py-3.5 bg-brand-600 hover:bg-brand-700 text-white rounded-xl text-xs font-black uppercase tracking-wider transition-all shadow-md shadow-brand-600/10"
                          >
                            Valider & Préparer
                          </button>
                        </div>
                      )}

                      {selectedOrder.status === 'preparing' && (
                        <button 
                          onClick={() => handleUpdateStatus(selectedOrder.id, 'out_for_delivery')}
                          className="w-full py-4 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-black uppercase tracking-wider transition-all shadow-md"
                        >
                          Expédier / Prêt pour retrait
                        </button>
                      )}

                      {selectedOrder.status === 'out_for_delivery' && (
                        <button 
                          onClick={() => handleUpdateStatus(selectedOrder.id, 'delivered')}
                          className="w-full py-4 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-black uppercase tracking-wider transition-all shadow-md"
                        >
                          Marquer comme Livré
                        </button>
                      )}

                      {historyStatuses.includes(selectedOrder.status) && (
                        <div className="p-4 bg-slate-50 rounded-2xl border border-dashed flex items-center justify-center text-slate-400 gap-2">
                          <CheckCircle2 size={16} />
                          <span className="text-xs font-bold uppercase tracking-widest">Commande Archivée</span>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </motion.div>
            ) : (
              <div className="bg-slate-50 rounded-[2.5rem] border border-slate-200 border-dashed p-12 text-center text-slate-400 sticky top-6">
                <FileText className="mx-auto text-slate-300 mb-4" size={40} />
                <h4 className="font-bold text-slate-700 text-sm">Aucune commande sélectionnée</h4>
                <p className="text-xs text-slate-400 max-w-xs mx-auto mt-1 font-medium">Sélectionnez une commande dans la liste pour voir sa fiche détaillée, vérifier les stocks et imprimer la facture.</p>
              </div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* High-Fidelity Print Invoice / Ticket Modal */}
      <AnimatePresence>
        {isReceiptOpen && selectedOrder && (
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[9999] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-[2rem] shadow-2xl border max-w-md w-full overflow-hidden flex flex-col relative print:fixed print:inset-0 print:m-0 print:rounded-none print:shadow-none"
            >
              {/* Close Button */}
              <button 
                onClick={() => setIsReceiptOpen(false)}
                className="absolute top-4 right-4 p-2 rounded-full hover:bg-slate-100 text-slate-400 hover:text-slate-700 transition-colors print:hidden"
              >
                <X size={18} />
              </button>

              {/* Receipt Area to Print */}
              <div id="dokta-printable-receipt" className="p-8 space-y-6 flex-1 text-left">
                {/* Brand Header */}
                <div className="text-center space-y-2 pb-4 border-b border-dashed">
                  <div className="w-12 h-12 bg-brand-600 rounded-2xl flex items-center justify-center mx-auto text-white font-black text-xl shadow-md">
                    D
                  </div>
                  <div>
                    <h3 className="font-display font-black text-slate-900 text-lg">PHARMACIE DE L'OFFICINE DOKTA</h3>
                    <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Douala, Cameroun | Tel: +237 600 000 000</p>
                    <p className="text-[10px] text-slate-500 font-semibold font-mono">Date: {selectedOrder.date || new Date().toLocaleString()}</p>
                  </div>
                </div>

                {/* Ticket Identification info */}
                <div className="text-xs space-y-1.5 bg-slate-50 p-4 rounded-2xl">
                  <div className="flex justify-between">
                    <span className="font-bold text-slate-400 uppercase tracking-wider text-[9px]">Numéro de Ticket:</span>
                    <span className="font-mono font-black text-slate-800">#{selectedOrder.id.substring(0, 14).toUpperCase()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="font-bold text-slate-400 uppercase tracking-wider text-[9px]">ID Client:</span>
                    <span className="font-mono font-black text-slate-800">{selectedOrder.patientId.toUpperCase()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="font-bold text-slate-400 uppercase tracking-wider text-[9px]">Mode de Retrait:</span>
                    <span className="font-bold text-brand-600 uppercase tracking-wider text-[9px]">
                      {selectedOrder.mode === 'pickup' ? 'Retrait Officine' : 'Livraison Domicile'}
                    </span>
                  </div>
                </div>

                {/* Receipt Table */}
                <div className="space-y-3">
                  <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Désignation des Articles</p>
                  <div className="space-y-2 divide-y divide-slate-100">
                    {selectedOrder.items.map((item, idx) => (
                      <div key={idx} className="pt-2 flex justify-between text-xs items-start">
                        <div className="space-y-0.5">
                          <p className="font-bold text-slate-800">{item.name}</p>
                          <p className="text-[10px] text-slate-400 font-bold">{item.price.toLocaleString()} FCFA x {item.count}</p>
                        </div>
                        <span className="font-mono font-black text-slate-900">{(item.price * item.count).toLocaleString()} FCFA</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Financial breakdown */}
                <div className="space-y-1.5 pt-4 border-t border-dashed text-xs">
                  <div className="flex justify-between text-slate-500 font-medium">
                    <span>Sous-Total</span>
                    <span className="font-mono font-bold text-slate-800">{selectedOrder.total.toLocaleString()} FCFA</span>
                  </div>
                  <div className="flex justify-between text-slate-500 font-medium">
                    <span>TVA (Exonéré Art. Médicament)</span>
                    <span className="font-mono font-bold text-slate-800">0 FCFA</span>
                  </div>
                  <div className="flex justify-between text-base font-black text-slate-950 pt-2 border-t">
                    <span>NET À PAYER</span>
                    <span className="font-mono">{selectedOrder.total.toLocaleString()} FCFA</span>
                  </div>
                </div>

                {/* Footer notes & Barcode / QR Code placeholder */}
                <div className="text-center pt-6 space-y-4 border-t border-dashed">
                  {/* Styled HTML Barcode */}
                  <div className="flex flex-col items-center justify-center gap-1 bg-white py-2 px-4 rounded-xl border border-slate-100">
                    <div className="flex items-center h-8 gap-[1.5px] opacity-80">
                      <div className="w-[1.5px] h-full bg-slate-950" />
                      <div className="w-[1.5px] h-full bg-slate-950" />
                      <div className="w-[3px] h-full bg-slate-950" />
                      <div className="w-[1px] h-full bg-slate-950" />
                      <div className="w-[2px] h-full bg-slate-950" />
                      <div className="w-[1px] h-full bg-slate-950" />
                      <div className="w-[4px] h-full bg-slate-950" />
                      <div className="w-[1.5px] h-full bg-slate-950" />
                      <div className="w-[2px] h-full bg-slate-950" />
                      <div className="w-[1.5px] h-full bg-slate-950" />
                      <div className="w-[1.5px] h-full bg-slate-950" />
                      <div className="w-[3px] h-full bg-slate-950" />
                      <div className="w-[1px] h-full bg-slate-950" />
                      <div className="w-[2px] h-full bg-slate-950" />
                      <div className="w-[4px] h-full bg-slate-950" />
                      <div className="w-[1px] h-full bg-slate-950" />
                      <div className="w-[2px] h-full bg-slate-950" />
                      <div className="w-[1.5px] h-full bg-slate-950" />
                    </div>
                    <span className="text-[9px] font-mono tracking-[4px] text-slate-500 font-bold uppercase">{selectedOrder.id.substring(0, 8).toUpperCase()}</span>
                  </div>

                  <p className="text-[9px] text-slate-400 font-black tracking-wide leading-relaxed uppercase">
                    Merci pour votre confiance.<br />
                    Dokta - Votre santé, notre priorité absolue.
                  </p>
                </div>
              </div>

              {/* Action Toolbar */}
              <div className="p-6 bg-slate-50 border-t flex gap-3 print:hidden">
                <button 
                  onClick={() => setIsReceiptOpen(false)}
                  className="flex-1 py-3.5 border rounded-xl text-xs font-black uppercase tracking-wider text-slate-500 hover:text-slate-800 transition-colors"
                >
                  Fermer
                </button>
                <button 
                  onClick={() => {
                    window.print();
                  }}
                  className="flex-1 py-3.5 bg-brand-600 hover:bg-brand-700 text-white font-black text-xs uppercase tracking-wider rounded-xl transition-all shadow-md flex items-center justify-center gap-2"
                >
                  <Printer size={14} />
                  Imprimer
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Mobile-only Order Detail Modal Overlay */}
      <AnimatePresence>
        {selectedOrder && (
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[9995] flex items-end sm:items-center justify-center p-0 sm:p-4 lg:hidden">
            <motion.div 
              initial={{ opacity: 0, y: "100%" }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: "100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 250 }}
              className="bg-white rounded-t-[2rem] sm:rounded-[2.5rem] shadow-2xl border w-full max-w-lg overflow-hidden flex flex-col max-h-[85vh] text-left"
            >
              {/* Drag indicator bar */}
              <div className="w-12 h-1 bg-slate-200 rounded-full mx-auto my-3 shrink-0 sm:hidden" />
              
              <div className="p-6 space-y-6 overflow-y-auto flex-1">
                {/* Detail Header */}
                <div className="flex justify-between items-start pb-4 border-b">
                  <div>
                    <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Fiche de Commande</span>
                    <h3 className="font-display font-black text-slate-900 text-lg mt-0.5">#{selectedOrder.id.substring(0, 12).toUpperCase()}</h3>
                    <p className="text-[10px] text-slate-400 font-bold mt-0.5">Créée le {selectedOrder.date || 'Date récente'}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    {/* Receipt print icon */}
                    <button 
                      onClick={() => setIsReceiptOpen(true)}
                      title="Imprimer le ticket"
                      className="w-8 h-8 rounded-full hover:bg-slate-50 border flex items-center justify-center text-slate-500 hover:text-brand-600 transition-colors"
                    >
                      <Printer size={15} />
                    </button>
                    <button 
                      onClick={() => setSelectedOrder(null)}
                      className="w-8 h-8 rounded-full hover:bg-slate-100 border flex items-center justify-center text-slate-400 hover:text-slate-800 transition-colors"
                    >
                      <X size={16} />
                    </button>
                  </div>
                </div>

                {/* Patient Information & Delivery Address */}
                <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 space-y-2">
                  <h4 className="text-[10px] font-black uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                    <User size={12} /> Informations Patient
                  </h4>
                  <div className="text-xs space-y-1">
                    <p className="font-bold text-slate-800">ID Patient: <span className="font-mono font-black text-slate-600">{selectedOrder.patientId.toUpperCase()}</span></p>
                    <p className="text-slate-500 font-medium">Mode de Récupération: <span className="font-bold text-brand-600 uppercase">{selectedOrder.mode === 'pickup' ? 'Retrait sur place' : 'Livraison à domicile'}</span></p>
                    {selectedOrder.mode === 'delivery' && (
                      <p className="text-slate-500 font-medium flex items-center gap-1 pt-1">
                        <MapPin size={12} className="text-purple-500" />
                        <span>Douala, Cameroun (Adresse enregistrée)</span>
                      </p>
                    )}
                  </div>
                </div>

                {/* Real-time Stock Allocation & Ordered Items */}
                <div className="space-y-3">
                  <h4 className="text-[10px] font-black uppercase tracking-wider text-slate-400 flex items-center gap-1.5 justify-between">
                    <span className="flex items-center gap-1.5"><Package size={12} /> Produits & Allocation Stock</span>
                    <span className="text-[9px] text-brand-600 font-bold">Vérifié</span>
                  </h4>
                  <div className="divide-y divide-slate-100 max-h-56 overflow-y-auto pr-1">
                    {selectedOrder.items.map((item, idx) => {
                      const matchedMed = medications.find(med => med.name.toLowerCase() === item.name.toLowerCase() || med.id === item.id);
                      const currentStock = matchedMed ? matchedMed.stock : 0;
                      const hasStock = currentStock >= item.count;
                      const isLow = currentStock > 0 && currentStock < item.count + 2;

                      return (
                        <div key={idx} className="py-3 flex flex-col gap-1">
                          <div className="flex items-center justify-between gap-4">
                            <div className="flex items-center gap-2.5">
                              <div className="w-9 h-9 bg-slate-50 border rounded-xl flex items-center justify-center shrink-0">
                                <Package className="text-slate-400" size={15} />
                              </div>
                              <div>
                                <p className="text-xs font-bold text-slate-900">{item.name}</p>
                                <p className="text-[10px] text-slate-400 font-bold">{item.price.toLocaleString()} FCFA / u</p>
                              </div>
                            </div>
                            <div className="text-right">
                              <p className="text-xs font-black text-slate-900">x{item.count}</p>
                              <p className="text-[11px] font-bold text-brand-600">{(item.price * item.count).toLocaleString()} FCFA</p>
                            </div>
                          </div>
                          
                          <div className="pl-11 flex items-center gap-1.5">
                            {matchedMed ? (
                              hasStock ? (
                                <span className={cn(
                                  "px-2 py-0.5 rounded-lg text-[9px] font-bold flex items-center gap-1",
                                  isLow ? "bg-amber-50 text-amber-700 border border-amber-100" : "bg-emerald-50 text-emerald-700 border border-emerald-100"
                                )}>
                                  <span className={cn("w-1.5 h-1.5 rounded-full", isLow ? "bg-amber-500" : "bg-emerald-500")} />
                                  Allocation validée ({currentStock} en stock)
                                </span>
                              ) : (
                                <span className="bg-rose-50 text-rose-700 border border-rose-100 px-2 py-0.5 rounded-lg text-[9px] font-bold flex items-center gap-1 animate-pulse">
                                  <AlertTriangle size={10} className="text-rose-500" />
                                  Rupture ! ({currentStock} en stock, demandé: {item.count})
                                </span>
                              )
                            ) : (
                              <span className="bg-slate-50 text-slate-500 border border-slate-100 px-2 py-0.5 rounded-lg text-[9px] font-bold flex items-center gap-1">
                                <span className="w-1.5 h-1.5 rounded-full bg-slate-400" />
                                Non référencé (Stock non vérifié)
                              </span>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Progress Timeline Stepper */}
                <div className="space-y-3 pt-2">
                  <h4 className="text-[10px] font-black uppercase tracking-wider text-slate-400">Suivi d'Avancement de la Commande</h4>
                  <div className="flex justify-between items-center relative py-2">
                    <div className="absolute left-0 right-0 top-1/2 -translate-y-1/2 h-0.5 bg-slate-100 z-0" />
                    <div 
                      className="absolute left-0 top-1/2 -translate-y-1/2 h-0.5 bg-brand-500 z-0 transition-all duration-500"
                      style={{ 
                        width: 
                          selectedOrder.status === 'pending_validation' ? '10%' :
                          selectedOrder.status === 'validated' ? '35%' :
                          selectedOrder.status === 'preparing' ? '60%' :
                          selectedOrder.status === 'out_for_delivery' ? '85%' :
                          selectedOrder.status === 'delivered' || selectedOrder.status === 'livre' ? '100%' : '0%'
                      }}
                    />

                    <div className="flex flex-col items-center gap-1 z-10">
                      <div className="w-6 h-6 rounded-full bg-brand-600 text-white flex items-center justify-center text-[10px] font-bold shadow-md">✓</div>
                      <span className="text-[9px] text-slate-500 font-bold">Soumise</span>
                    </div>

                    <div className="flex flex-col items-center gap-1 z-10">
                      <div className={cn(
                        "w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold border transition-all duration-300",
                        ['preparing', 'out_for_delivery', 'delivered', 'livre'].includes(selectedOrder.status)
                          ? "bg-brand-600 border-brand-600 text-white shadow-md"
                          : "bg-white border-slate-200 text-slate-400"
                      )}>2</div>
                      <span className="text-[9px] text-slate-500 font-bold">Préparation</span>
                    </div>

                    <div className="flex flex-col items-center gap-1 z-10">
                      <div className={cn(
                        "w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold border transition-all duration-300",
                        ['out_for_delivery', 'delivered', 'livre'].includes(selectedOrder.status)
                          ? "bg-brand-600 border-brand-600 text-white shadow-md"
                          : "bg-white border-slate-200 text-slate-400"
                      )}>3</div>
                      <span className="text-[9px] text-slate-500 font-bold">Expédiée</span>
                    </div>

                    <div className="flex flex-col items-center gap-1 z-10">
                      <div className={cn(
                        "w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold border transition-all duration-300",
                        ['delivered', 'livre'].includes(selectedOrder.status)
                          ? "bg-emerald-600 border-emerald-600 text-white shadow-md"
                          : "bg-white border-slate-200 text-slate-400"
                      )}>✓</div>
                      <span className="text-[9px] text-slate-500 font-bold">Remise</span>
                    </div>
                  </div>
                </div>

                {/* Internal Comments */}
                <div className="pt-2 space-y-2 border-t">
                  <h4 className="text-[10px] font-black uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                    <FileText size={12} /> Notes d'Officine Internes
                  </h4>
                  <div className="flex gap-2">
                    <input 
                      type="text" 
                      placeholder="Ex: Retrait avant 12h..."
                      value={orderComment}
                      onChange={(e) => setOrderComment(e.target.value)}
                      className="flex-1 bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-semibold focus:outline-none focus:ring-1 focus:ring-brand-500"
                    />
                    <button 
                      onClick={handleSaveComment}
                      className="px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl transition-colors"
                    >
                      Sauver
                    </button>
                  </div>
                </div>

                {/* Total and Payment */}
                <div className="pt-4 border-t space-y-2">
                  <div className="flex justify-between items-center text-xs">
                    <span className="font-bold text-slate-400">Règlement :</span>
                    <span className="font-black text-slate-700 uppercase tracking-wide flex items-center gap-1">
                      <CreditCard size={12} />
                      {selectedOrder.paymentMethod || 'Espèces'}
                    </span>
                  </div>
                  <div className="flex justify-between items-end bg-slate-50 p-4 rounded-2xl border">
                    <span className="text-[10px] font-black uppercase text-slate-400 tracking-wider">Montant total</span>
                    <span className="text-xl font-display font-black text-slate-900">{selectedOrder.total.toLocaleString()} FCFA</span>
                  </div>
                </div>

                {/* Action Controls */}
                <div className="pt-2">
                  {updatingId === selectedOrder.id ? (
                    <div className="flex items-center justify-center py-4 text-slate-500 gap-2 font-bold text-xs uppercase tracking-widest">
                      <Loader2 className="animate-spin text-brand-600" size={18} />
                      Mise à jour...
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {selectedOrder.status === 'pending_validation' && (
                        <div className="grid grid-cols-2 gap-3">
                          <button 
                            onClick={() => handleUpdateStatus(selectedOrder.id, 'rejected')}
                            className="w-full py-3.5 border border-rose-200 bg-rose-50 hover:bg-rose-100 text-rose-700 rounded-xl text-xs font-black uppercase tracking-wider transition-all"
                          >
                            Refuser
                          </button>
                          <button 
                            onClick={() => handleUpdateStatus(selectedOrder.id, 'preparing')}
                            className="w-full py-3.5 bg-brand-600 hover:bg-brand-700 text-white rounded-xl text-xs font-black uppercase tracking-wider transition-all shadow-md"
                          >
                            Valider
                          </button>
                        </div>
                      )}

                      {selectedOrder.status === 'preparing' && (
                        <button 
                          onClick={() => handleUpdateStatus(selectedOrder.id, 'out_for_delivery')}
                          className="w-full py-4 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-black uppercase tracking-wider transition-all shadow-md"
                        >
                          Expédier / Prêt pour retrait
                        </button>
                      )}

                      {selectedOrder.status === 'out_for_delivery' && (
                        <button 
                          onClick={() => handleUpdateStatus(selectedOrder.id, 'delivered')}
                          className="w-full py-4 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-black uppercase tracking-wider transition-all shadow-md"
                        >
                          Marquer comme Livré
                        </button>
                      )}

                      {historyStatuses.includes(selectedOrder.status) && (
                        <div className="p-4 bg-slate-50 rounded-2xl border border-dashed flex items-center justify-center text-slate-400 gap-2">
                          <CheckCircle2 size={16} />
                          <span className="text-xs font-bold uppercase tracking-widest">Commande Archivée</span>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Point of Sale (POS) New Walk-In Billing Modal */}
      <AnimatePresence>
        {isNewWalkInOpen && (
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[9999] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-[2rem] shadow-2xl border max-w-2xl w-full overflow-hidden flex flex-col relative max-h-[90vh]"
            >
              {/* Close Button */}
              <button 
                onClick={() => {
                  setIsNewWalkInOpen(false);
                  setWalkInCart([]);
                }}
                className="absolute top-6 right-6 p-2 rounded-full hover:bg-slate-100 text-slate-400 hover:text-slate-700 transition-colors"
              >
                <X size={20} />
              </button>

              <div className="p-8 space-y-6 overflow-y-auto flex-1">
                {/* Header */}
                <div className="text-left space-y-2">
                  <div className="w-12 h-12 bg-indigo-50 text-indigo-600 rounded-2xl flex items-center justify-center border border-indigo-100">
                    <CreditCard size={24} />
                  </div>
                  <div>
                    <h3 className="font-display font-black text-slate-900 text-xl">Nouvelle Vente Directe (Comptoir)</h3>
                    <p className="text-xs text-slate-500 font-medium">Facturez le patient sur place et décrémentez le stock d'officine instantanément.</p>
                  </div>
                </div>

                <form onSubmit={handleCreateWalkInOrder} className="space-y-6 text-left">
                  {/* Patient Name */}
                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase tracking-wider text-slate-400">Nom du Patient / Client</label>
                    <input 
                      type="text"
                      required
                      value={walkInPatient}
                      onChange={(e) => setWalkInPatient(e.target.value)}
                      placeholder="Ex: Patient de passage, Jean Dupont..."
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 transition-all"
                    />
                  </div>

                  {/* Add Medication Row */}
                  <div className="space-y-2 bg-slate-50 p-5 rounded-2xl border">
                    <label className="text-[10px] font-black uppercase tracking-wider text-indigo-600">Ajouter un produit au ticket</label>
                    <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 items-end pt-1">
                      {/* Product select */}
                      <div className="sm:col-span-6 space-y-1">
                        <span className="text-[10px] font-bold text-slate-400">Médicament</span>
                        <select
                          value={selectedMedId}
                          onChange={(e) => {
                            setSelectedMedId(e.target.value);
                            setSelectedMedCount(1);
                          }}
                          className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2.5 text-xs font-semibold focus:outline-none"
                        >
                          <option value="">-- Choisir un médicament --</option>
                          {medications.map((m) => (
                            <option key={m.id} value={m.id} disabled={m.stock <= 0}>
                              {m.name} ({m.stock} en stock) — {m.sellingPrice.toLocaleString()} FCFA {m.stock <= 0 ? '[RUPTURE]' : ''}
                            </option>
                          ))}
                        </select>
                      </div>

                      {/* Quantity input */}
                      <div className="sm:col-span-3 space-y-1">
                        <span className="text-[10px] font-bold text-slate-400">Quantité</span>
                        <input
                          type="number"
                          min="1"
                          max={selectedMedId ? medications.find(m => m.id === selectedMedId)?.stock || 1 : 1}
                          value={selectedMedCount}
                          onChange={(e) => setSelectedMedCount(Math.max(1, parseInt(e.target.value) || 1))}
                          className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2.5 text-xs font-semibold focus:outline-none"
                        />
                      </div>

                      {/* Add button */}
                      <div className="sm:col-span-3">
                        <button
                          type="button"
                          onClick={handleAddToWalkInCart}
                          className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold text-xs uppercase tracking-wider rounded-xl transition-all shadow-md active:scale-95 flex items-center justify-center gap-1"
                        >
                          <Plus size={14} /> Ajouter
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Cart List */}
                  <div className="space-y-3">
                    <h4 className="text-[10px] font-black uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                      <Package size={12} /> Articles de la Facture
                    </h4>
                    
                    {walkInCart.length === 0 ? (
                      <div className="border border-dashed rounded-2xl p-8 text-center text-slate-400 bg-slate-50/50">
                        <Package className="mx-auto text-slate-300 mb-2" size={28} />
                        <p className="text-xs font-bold">Aucun article ajouté à cette vente</p>
                        <p className="text-[10px] text-slate-400 mt-1 font-medium">Sélectionnez un médicament et spécifiez la quantité ci-dessus.</p>
                      </div>
                    ) : (
                      <div className="border rounded-2xl overflow-hidden divide-y divide-slate-100 bg-white">
                        {walkInCart.map((cartItem) => {
                          const med = medications.find(m => m.id === cartItem.medicationId);
                          if (!med) return null;
                          return (
                            <div key={cartItem.medicationId} className="p-4 flex items-center justify-between gap-4">
                              <div className="flex items-center gap-2.5">
                                <div className="w-8 h-8 bg-slate-50 rounded-lg flex items-center justify-center border text-slate-400">
                                  <Package size={14} />
                                </div>
                                <div>
                                  <p className="text-xs font-bold text-slate-900">{med.name}</p>
                                  <p className="text-[10px] text-slate-400 font-bold">{med.sellingPrice.toLocaleString()} FCFA / u</p>
                                </div>
                              </div>
                              <div className="flex items-center gap-4">
                                <div className="text-right">
                                  <p className="text-xs font-black text-slate-900">x{cartItem.count}</p>
                                  <p className="text-[11px] font-bold text-brand-600">{(med.sellingPrice * cartItem.count).toLocaleString()} FCFA</p>
                                </div>
                                <button
                                  type="button"
                                  onClick={() => handleRemoveFromWalkInCart(cartItem.medicationId)}
                                  className="p-1.5 rounded-lg hover:bg-rose-50 text-slate-400 hover:text-rose-600 transition-colors"
                                >
                                  <Trash2 size={14} />
                                </button>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>

                  {/* Payment Method & Total Price */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                    <div className="space-y-2">
                      <label className="text-[10px] font-black uppercase tracking-wider text-slate-400">Mode de Règlement</label>
                      <select
                        value={walkInPaymentMethod}
                        onChange={(e) => setWalkInPaymentMethod(e.target.value)}
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-xs font-bold focus:outline-none"
                      >
                        <option value="Espèces">Espèces (Cash)</option>
                        <option value="Orange Money">Orange Money (OM)</option>
                        <option value="MTN MoMo">MTN MoMo</option>
                      </select>
                    </div>

                    <div className="space-y-2">
                      <label className="text-[10px] font-black uppercase tracking-wider text-slate-400">Total Net à Payer</label>
                      <div className="bg-emerald-50 text-emerald-800 border border-emerald-100 rounded-xl px-4 py-2.5 font-display font-black text-lg flex items-center justify-between">
                        <span>Montant</span>
                        <span>
                          {walkInCart.reduce((sum, item) => {
                            const med = medications.find(m => m.id === item.medicationId);
                            return sum + (med ? med.sellingPrice * item.count : 0);
                          }, 0).toLocaleString()} FCFA
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Submit / Action buttons */}
                  <div className="flex gap-3 pt-4 border-t border-slate-100">
                    <button
                      type="button"
                      disabled={submittingWalkIn}
                      onClick={() => {
                        setIsNewWalkInOpen(false);
                        setWalkInCart([]);
                      }}
                      className="flex-1 py-3.5 border rounded-xl text-xs font-black uppercase tracking-wider text-slate-500 hover:text-slate-800 transition-colors"
                    >
                      Annuler
                    </button>
                    <button
                      type="submit"
                      disabled={submittingWalkIn || walkInCart.length === 0}
                      className="flex-1 py-3.5 bg-brand-600 hover:bg-brand-700 text-white font-black text-xs uppercase tracking-wider rounded-xl transition-all shadow-md flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {submittingWalkIn ? (
                        <>
                          <Loader2 className="animate-spin" size={14} />
                          Enregistrement...
                        </>
                      ) : (
                        <>
                          <Check size={14} />
                          Valider la Vente & Imprimer
                        </>
                      )}
                    </button>
                  </div>
                </form>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </PageContainer>
  );
}
