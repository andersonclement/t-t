import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { db } from '../lib/firebase';
import { collection, query, where, onSnapshot, doc, updateDoc } from 'firebase/firestore';
import {
  Users,
  ShieldCheck,
  Clock,
  AlertTriangle,
  Search,
  FileText,
  Calendar,
  CheckCircle2,
  XCircle,
  Phone,
  Mail,
  Building2,
  Check,
  X,
  Info,
  ChevronRight,
  UserCheck,
  ShoppingCart,
  TrendingUp,
  Package,
  Activity
} from 'lucide-react';
import { cn } from '../lib/utils';

interface TechnicalForm {
  pharmacyName: string;
  onpcNumber: string;
  legalLicenseNumber: string;
  pharmacistsCount: number;
  coldChainEquipment: string;
  temperatureMonitor: boolean;
  backupGenerator: string;
  airConditioned: boolean;
  narcoticsSafe: boolean;
  fireExtinguisher: boolean;
  wasteProtocol: boolean;
}

interface Appointment {
  type: string;
  date: string;
  time: string;
  phoneNumber: string;
  notes?: string;
}

interface PharmacistUser {
  id: string;
  uid: string;
  displayName: string;
  email: string;
  role: 'pharmacist';
  status: 'pending_technical_file' | 'pending_appointment' | 'pending_admin_approval' | 'activated' | 'rejected';
  createdAt?: any;
  updatedAt?: any;
  technicalForm?: TechnicalForm;
  appointment?: Appointment;
  phoneNumber?: string;
}

interface PlatformOrder {
  id: string;
  patientId: string;
  pharmacistId?: string;
  total: number;
  status: string;
  mode: string;
  paymentMethod?: string;
  createdAt: any;
  items: { name: string; count: number; price: number }[];
}

export function AdminDashboard() {
  const [pharmacists, setPharmacists] = useState<PharmacistUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [selectedPharma, setSelectedPharma] = useState<PharmacistUser | null>(null);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [activeSection, setActiveSection] = useState<'pharmacists' | 'orders' | 'overview'>('overview');
  const [platformOrders, setPlatformOrders] = useState<PlatformOrder[]>([]);
  const [patientCount, setPatientCount] = useState(0);
  const [ordersLoading, setOrdersLoading] = useState(true);

  // Fetch all pharmacists from firestore
  useEffect(() => {
    const q = query(collection(db, 'users'), where('role', '==', 'pharmacist'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const list: PharmacistUser[] = [];
      snapshot.forEach((docSnap) => {
        const data = docSnap.data();
        list.push({
          id: docSnap.id,
          uid: data.uid || docSnap.id,
          displayName: data.displayName || 'Pharmacien Sans Nom',
          email: data.email || '',
          role: 'pharmacist',
          status: data.status || 'pending_technical_file',
          createdAt: data.createdAt,
          updatedAt: data.updatedAt,
          technicalForm: data.technicalForm,
          appointment: data.appointment,
          phoneNumber: data.phoneNumber || data.appointment?.phoneNumber || '',
        });
      });
      setPharmacists(list);
      setLoading(false);
    }, (error) => {
      console.error("Error fetching pharmacists:", error);
      setErrorMessage("Impossible de charger les pharmaciens. Vérifiez vos permissions.");
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  useEffect(() => {
    const unsubOrders = onSnapshot(collection(db, 'orders'), (snapshot) => {
      const list: PlatformOrder[] = [];
      snapshot.forEach((docSnap) => {
        const data = docSnap.data();
        list.push({
          id: docSnap.id,
          patientId: data.patientId || '',
          pharmacistId: data.pharmacistId,
          total: data.total || 0,
          status: data.status || 'pending_validation',
          mode: data.mode || 'pickup',
          paymentMethod: data.paymentMethod,
          createdAt: data.createdAt,
          items: data.items || [],
        });
      });
      list.sort((a, b) => (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0));
      setPlatformOrders(list);
      setOrdersLoading(false);
    }, () => setOrdersLoading(false));

    const unsubPatients = onSnapshot(query(collection(db, 'users'), where('role', '==', 'patient')), (snapshot) => {
      setPatientCount(snapshot.size);
    });

    return () => { unsubOrders(); unsubPatients(); };
  }, []);

  // Filter & Search Logic
  const filteredPharma = pharmacists.filter((pharma) => {
    const matchesSearch = 
      pharma.displayName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      pharma.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (pharma.technicalForm?.pharmacyName || '').toLowerCase().includes(searchTerm.toLowerCase());

    if (statusFilter === 'all') return matchesSearch;
    if (statusFilter === 'pending') {
      return matchesSearch && ['pending_technical_file', 'pending_appointment', 'pending_admin_approval'].includes(pharma.status);
    }
    return matchesSearch && pharma.status === statusFilter;
  });

  // Action: Approve Pharmacist
  const handleApprove = async (pharmaId: string) => {
    setActionLoading(pharmaId);
    setSuccessMessage(null);
    setErrorMessage(null);
    try {
      const userRef = doc(db, 'users', pharmaId);
      await updateDoc(userRef, {
        status: 'activated',
        updatedAt: new Date(),
      });
      setSuccessMessage("L'inscription du pharmacien a été validée avec succès ! Il a désormais accès à l'application.");
      if (selectedPharma && selectedPharma.id === pharmaId) {
        setSelectedPharma(prev => prev ? { ...prev, status: 'activated' } : null);
      }
    } catch (error: any) {
      console.error("Error approving pharmacist:", error);
      setErrorMessage("Une erreur est survenue lors de l'approbation.");
    } finally {
      setActionLoading(null);
    }
  };

  // Action: Reject Pharmacist
  const handleReject = async (pharmaId: string) => {
    setActionLoading(pharmaId);
    setSuccessMessage(null);
    setErrorMessage(null);
    try {
      const userRef = doc(db, 'users', pharmaId);
      await updateDoc(userRef, {
        status: 'rejected',
        updatedAt: new Date(),
      });
      setSuccessMessage("L'inscription du pharmacien a été rejetée.");
      if (selectedPharma && selectedPharma.id === pharmaId) {
        setSelectedPharma(prev => prev ? { ...prev, status: 'rejected' } : null);
      }
    } catch (error: any) {
      console.error("Error rejecting pharmacist:", error);
      setErrorMessage("Une erreur est survenue lors du rejet.");
    } finally {
      setActionLoading(null);
    }
  };

  // Stats calculation
  const stats = {
    total: pharmacists.length,
    pending: pharmacists.filter(p => ['pending_technical_file', 'pending_appointment', 'pending_admin_approval'].includes(p.status)).length,
    activated: pharmacists.filter(p => p.status === 'activated').length,
    rejected: pharmacists.filter(p => p.status === 'rejected').length,
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'activated':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-100">
            <CheckCircle2 size={13} className="text-emerald-500" />
            Activé
          </span>
        );
      case 'rejected':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-rose-50 text-rose-700 border border-rose-100">
            <XCircle size={13} className="text-rose-500" />
            Rejeté
          </span>
        );
      case 'pending_admin_approval':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-amber-50 text-amber-700 border border-amber-100 animate-pulse">
            <Clock size={13} className="text-amber-500" />
            Attente Approbation
          </span>
        );
      case 'pending_appointment':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-100">
            <Calendar size={13} className="text-blue-500" />
            Rdv à Planifier
          </span>
        );
      case 'pending_technical_file':
      default:
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-slate-50 text-slate-700 border border-slate-100">
            <FileText size={13} className="text-slate-500" />
            Fiche Incomplète
          </span>
        );
    }
  };

  const orderStats = {
    total: platformOrders.length,
    pending: platformOrders.filter(o => ['pending_validation', 'en_cours'].includes(o.status)).length,
    delivered: platformOrders.filter(o => ['delivered', 'livre'].includes(o.status)).length,
    revenue: platformOrders.filter(o => ['delivered', 'livre'].includes(o.status)).reduce((sum, o) => sum + o.total, 0),
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8" id="admin-dashboard-container">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <UserCheck className="text-brand-600" size={28} />
            Portail d'Administration Médical
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Supervision globale de la plateforme Dokta.
          </p>
        </div>
      </div>

      {/* Section Tabs */}
      <div className="flex gap-2 mb-6 bg-white p-1.5 rounded-xl border border-slate-200 w-fit">
        {[
          { id: 'overview' as const, label: 'Vue d\'ensemble', icon: <Activity size={14} /> },
          { id: 'pharmacists' as const, label: 'Pharmaciens', icon: <ShieldCheck size={14} /> },
          { id: 'orders' as const, label: 'Commandes', icon: <ShoppingCart size={14} /> },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveSection(tab.id)}
            className={cn(
              "flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition-all",
              activeSection === tab.id
                ? "bg-brand-600 text-white shadow-sm"
                : "text-slate-600 hover:bg-slate-50"
            )}
          >
            {tab.icon}
            {tab.label}
          </button>
        ))}
      </div>

      {/* Notifications */}
      <AnimatePresence>
        {successMessage && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="mb-6 p-4 bg-emerald-50 border border-emerald-100 text-emerald-800 rounded-2xl flex items-start gap-3 shadow-sm"
          >
            <CheckCircle2 className="text-emerald-500 shrink-0 mt-0.5" size={18} />
            <div className="text-sm font-medium flex-1">{successMessage}</div>
            <button onClick={() => setSuccessMessage(null)} className="text-emerald-500 hover:text-emerald-700">
              <X size={16} />
            </button>
          </motion.div>
        )}
        {errorMessage && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="mb-6 p-4 bg-rose-50 border border-rose-100 text-rose-800 rounded-2xl flex items-start gap-3 shadow-sm"
          >
            <AlertTriangle className="text-rose-500 shrink-0 mt-0.5" size={18} />
            <div className="text-sm font-medium flex-1">{errorMessage}</div>
            <button onClick={() => setErrorMessage(null)} className="text-rose-500 hover:text-rose-700">
              <X size={16} />
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Overview Section */}
      {activeSection === 'overview' && (
        <div className="space-y-6">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm flex items-center gap-4">
              <div className="p-3 bg-blue-50 rounded-xl text-blue-600"><Users size={22} /></div>
              <div>
                <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Patients</p>
                <p className="text-xl font-bold text-slate-800 mt-0.5">{patientCount}</p>
              </div>
            </div>
            <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm flex items-center gap-4">
              <div className="p-3 bg-emerald-50 rounded-xl text-emerald-600"><ShieldCheck size={22} /></div>
              <div>
                <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Pharmaciens actifs</p>
                <p className="text-xl font-bold text-emerald-600 mt-0.5">{stats.activated}</p>
              </div>
            </div>
            <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm flex items-center gap-4">
              <div className="p-3 bg-brand-50 rounded-xl text-brand-600"><ShoppingCart size={22} /></div>
              <div>
                <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Commandes totales</p>
                <p className="text-xl font-bold text-slate-800 mt-0.5">{orderStats.total}</p>
              </div>
            </div>
            <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm flex items-center gap-4">
              <div className="p-3 bg-amber-50 rounded-xl text-amber-600"><TrendingUp size={22} /></div>
              <div>
                <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Chiffre d'affaires</p>
                <p className="text-xl font-bold text-amber-600 mt-0.5">{orderStats.revenue.toLocaleString()} <span className="text-xs text-slate-400">FCFA</span></p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
              <h3 className="text-sm font-bold text-slate-800 mb-4 flex items-center gap-2">
                <Clock size={16} className="text-amber-500" />
                Commandes en attente ({orderStats.pending})
              </h3>
              {ordersLoading ? (
                <div className="flex justify-center py-8"><div className="w-8 h-8 border-4 border-brand-600 border-t-transparent rounded-full animate-spin" /></div>
              ) : platformOrders.filter(o => ['pending_validation', 'en_cours'].includes(o.status)).length === 0 ? (
                <p className="text-sm text-slate-400 text-center py-8">Aucune commande en attente</p>
              ) : (
                <div className="space-y-3 max-h-80 overflow-y-auto">
                  {platformOrders.filter(o => ['pending_validation', 'en_cours'].includes(o.status)).slice(0, 10).map(order => (
                    <div key={order.id} className="p-3 bg-slate-50 rounded-xl border border-slate-100 flex items-center justify-between">
                      <div>
                        <p className="text-xs font-bold text-slate-700">#{order.id.slice(0, 8)}</p>
                        <p className="text-[10px] text-slate-400">{order.items.length} article(s) — {order.mode === 'delivery' ? 'Livraison' : 'Retrait'}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-xs font-bold text-brand-600">{order.total.toLocaleString()} FCFA</p>
                        <span className="text-[9px] px-2 py-0.5 rounded-full bg-amber-50 text-amber-700 font-bold border border-amber-100">En attente</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
              <h3 className="text-sm font-bold text-slate-800 mb-4 flex items-center gap-2">
                <AlertTriangle size={16} className="text-amber-500" />
                Pharmaciens en attente ({stats.pending})
              </h3>
              {pharmacists.filter(p => ['pending_technical_file', 'pending_appointment', 'pending_admin_approval'].includes(p.status)).length === 0 ? (
                <p className="text-sm text-slate-400 text-center py-8">Aucun pharmacien en attente</p>
              ) : (
                <div className="space-y-3 max-h-80 overflow-y-auto">
                  {pharmacists.filter(p => ['pending_technical_file', 'pending_appointment', 'pending_admin_approval'].includes(p.status)).map(pharma => (
                    <div key={pharma.id} className="p-3 bg-slate-50 rounded-xl border border-slate-100 flex items-center justify-between">
                      <div>
                        <p className="text-xs font-bold text-slate-700">{pharma.technicalForm?.pharmacyName || pharma.displayName}</p>
                        <p className="text-[10px] text-slate-400">{pharma.email}</p>
                      </div>
                      {pharma.status === 'pending_admin_approval' && (
                        <div className="flex gap-1.5">
                          <button onClick={() => handleApprove(pharma.id)} disabled={actionLoading !== null} className="p-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-600 rounded-lg transition-colors border border-emerald-100 disabled:opacity-50"><Check size={12} /></button>
                          <button onClick={() => handleReject(pharma.id)} disabled={actionLoading !== null} className="p-1.5 bg-rose-50 hover:bg-rose-100 text-rose-600 rounded-lg transition-colors border border-rose-100 disabled:opacity-50"><X size={12} /></button>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Orders Section */}
      {activeSection === 'orders' && (
        <div className="space-y-4">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm text-center">
              <p className="text-2xl font-bold text-slate-800">{orderStats.total}</p>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Total</p>
            </div>
            <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm text-center">
              <p className="text-2xl font-bold text-amber-600">{orderStats.pending}</p>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">En attente</p>
            </div>
            <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm text-center">
              <p className="text-2xl font-bold text-emerald-600">{orderStats.delivered}</p>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Livrées</p>
            </div>
            <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm text-center">
              <p className="text-2xl font-bold text-brand-600">{orderStats.revenue.toLocaleString()}</p>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Revenus (FCFA)</p>
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
            {ordersLoading ? (
              <div className="p-12 text-center"><div className="w-10 h-10 border-4 border-brand-600 border-t-transparent rounded-full animate-spin mx-auto" /></div>
            ) : platformOrders.length === 0 ? (
              <div className="p-12 text-center">
                <Package className="text-slate-300 mx-auto mb-3" size={32} />
                <p className="text-base font-semibold text-slate-600">Aucune commande</p>
              </div>
            ) : (
              <div className="divide-y divide-slate-100">
                <div className="grid grid-cols-6 gap-4 px-5 py-3 bg-slate-50 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                  <span>ID</span><span>Articles</span><span>Total</span><span>Mode</span><span>Paiement</span><span>Statut</span>
                </div>
                {platformOrders.slice(0, 50).map(order => (
                  <div key={order.id} className="grid grid-cols-6 gap-4 px-5 py-4 text-xs items-center hover:bg-slate-50/50 transition-colors">
                    <span className="font-mono font-bold text-slate-600 truncate">#{order.id.slice(0, 8)}</span>
                    <span className="text-slate-600">{order.items.length} article(s)</span>
                    <span className="font-bold text-slate-800">{order.total.toLocaleString()} FCFA</span>
                    <span className="text-slate-500">{order.mode === 'delivery' ? 'Livraison' : 'Retrait'}</span>
                    <span className="text-slate-500 capitalize">{order.paymentMethod || '—'}</span>
                    <span className={cn(
                      "px-2 py-1 rounded-full text-[9px] font-bold text-center w-fit",
                      order.status === 'delivered' || order.status === 'livre' ? "bg-emerald-50 text-emerald-700" :
                      order.status === 'rejected' || order.status === 'annule' ? "bg-rose-50 text-rose-700" :
                      "bg-amber-50 text-amber-700"
                    )}>{order.status.replace(/_/g, ' ')}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Pharmacists Section */}
      {activeSection === 'pharmacists' && (<>
      {/* Stats Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm flex items-center gap-4">
          <div className="p-3 bg-slate-50 rounded-xl text-slate-600">
            <Users size={22} />
          </div>
          <div>
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Total Pharmaciens</p>
            <p className="text-xl font-bold text-slate-800 mt-0.5">{stats.total}</p>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm flex items-center gap-4">
          <div className="p-3 bg-amber-50 rounded-xl text-amber-600">
            <Clock size={22} className="animate-pulse" />
          </div>
          <div>
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">En Attente</p>
            <p className="text-xl font-bold text-amber-600 mt-0.5">{stats.pending}</p>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm flex items-center gap-4">
          <div className="p-3 bg-emerald-50 rounded-xl text-emerald-600">
            <ShieldCheck size={22} />
          </div>
          <div>
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Activés / Validés</p>
            <p className="text-xl font-bold text-emerald-600 mt-0.5">{stats.activated}</p>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm flex items-center gap-4">
          <div className="p-3 bg-rose-50 rounded-xl text-rose-600">
            <XCircle size={22} />
          </div>
          <div>
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Inscriptions Rejetées</p>
            <p className="text-xl font-bold text-rose-600 mt-0.5">{stats.rejected}</p>
          </div>
        </div>
      </div>

      {/* Main Content Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
        {/* Left: Search, Filter, List */}
        <div className="lg:col-span-2 space-y-4">
          {/* Controls Bar */}
          <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm space-y-3">
            <div className="relative">
              <Search className="absolute left-3 top-3.5 text-slate-400" size={18} />
              <input
                type="text"
                placeholder="Rechercher par nom, email ou pharmacie..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-100 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 focus:bg-white transition-all text-slate-800"
              />
            </div>

            {/* Filter Tabs */}
            <div className="flex flex-wrap gap-1.5 pt-1">
              {[
                { id: 'all', label: 'Tous' },
                { id: 'pending', label: 'En attente' },
                { id: 'pending_admin_approval', label: 'Approbation' },
                { id: 'activated', label: 'Activés' },
                { id: 'rejected', label: 'Rejetés' },
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setStatusFilter(tab.id)}
                  className={cn(
                    "px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all border",
                    statusFilter === tab.id
                      ? "bg-brand-600 border-brand-600 text-white shadow-sm"
                      : "bg-white border-slate-200 text-slate-600 hover:bg-slate-50"
                  )}
                >
                  {tab.label}
                </button>
              ))}
            </div>
          </div>

          {/* Pharmacists List */}
          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
            {loading ? (
              <div className="p-12 text-center">
                <div className="w-10 h-10 border-4 border-brand-600 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
                <p className="text-sm text-slate-400">Chargement de la base des pharmaciens...</p>
              </div>
            ) : filteredPharma.length === 0 ? (
              <div className="p-12 text-center">
                <Info className="text-slate-300 mx-auto mb-3" size={32} />
                <p className="text-base font-semibold text-slate-600">Aucun pharmacien trouvé</p>
                <p className="text-xs text-slate-400 mt-1">Ajustez votre recherche ou les filtres.</p>
              </div>
            ) : (
              <div className="divide-y divide-slate-100">
                {filteredPharma.map((pharma) => {
                  const isSelected = selectedPharma?.id === pharma.id;
                  return (
                    <div
                      key={pharma.id}
                      onClick={() => setSelectedPharma(pharma)}
                      className={cn(
                        "p-5 flex items-center justify-between gap-4 cursor-pointer transition-colors hover:bg-slate-50/70",
                        isSelected && "bg-brand-50/30 hover:bg-brand-50/40 border-l-4 border-l-brand-600"
                      )}
                    >
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2.5 mb-1.5 flex-wrap">
                          <h3 className="font-bold text-slate-800 text-sm truncate">
                            {pharma.technicalForm?.pharmacyName || pharma.displayName}
                          </h3>
                          {getStatusBadge(pharma.status)}
                        </div>
                        
                        <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-slate-500">
                          <span className="flex items-center gap-1">
                            <Mail size={12} className="text-slate-400" />
                            {pharma.email}
                          </span>
                          {pharma.phoneNumber && (
                            <span className="flex items-center gap-1">
                              <Phone size={12} className="text-slate-400" />
                              {pharma.phoneNumber}
                            </span>
                          )}
                          {pharma.technicalForm?.onpcNumber && (
                            <span className="font-mono text-[10px] bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded">
                              ONPC: {pharma.technicalForm.onpcNumber}
                            </span>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        {/* Quick Action buttons for pending admin approval */}
                        {pharma.status === 'pending_admin_approval' && (
                          <div className="hidden sm:flex items-center gap-1.5" onClick={(e) => e.stopPropagation()}>
                            <button
                              onClick={() => handleApprove(pharma.id)}
                              disabled={actionLoading !== null}
                              className="p-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-600 rounded-lg transition-colors border border-emerald-100 disabled:opacity-50"
                              title="Valider"
                            >
                              <Check size={14} />
                            </button>
                            <button
                              onClick={() => handleReject(pharma.id)}
                              disabled={actionLoading !== null}
                              className="p-1.5 bg-rose-50 hover:bg-rose-100 text-rose-600 rounded-lg transition-colors border border-rose-100 disabled:opacity-50"
                              title="Rejeter"
                            >
                              <X size={14} />
                            </button>
                          </div>
                        )}
                        <ChevronRight className="text-slate-300" size={16} />
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Right: Detailed View & Action Panel */}
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6 space-y-6">
          <h2 className="text-base font-bold text-slate-900 border-b border-slate-100 pb-3 flex items-center gap-2">
            <FileText size={18} className="text-brand-600" />
            Détails de l'Inscription
          </h2>

          {selectedPharma ? (
            <div className="space-y-6">
              {/* Header Profile Info */}
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center text-slate-600 font-bold text-sm uppercase">
                  {selectedPharma.displayName.substring(0, 2)}
                </div>
                <div>
                  <h3 className="font-bold text-slate-800 text-base">{selectedPharma.displayName}</h3>
                  <p className="text-xs text-slate-500">{selectedPharma.email}</p>
                </div>
              </div>

              {/* Progress Flow Status */}
              <div>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2.5">
                  Statut de l'Onboarding
                </p>
                <div className="p-3.5 bg-slate-50 border border-slate-100 rounded-xl flex items-center justify-between gap-3">
                  <div className="text-xs">
                    <span className="font-bold text-slate-700">État actuel : </span>
                    <span className="text-slate-600">
                      {selectedPharma.status === 'pending_technical_file' && 'Fiche technique non soumise'}
                      {selectedPharma.status === 'pending_appointment' && 'Rendez-vous à planifier'}
                      {selectedPharma.status === 'pending_admin_approval' && 'Rendez-vous fait - En attente validation'}
                      {selectedPharma.status === 'activated' && 'Inscription validée (Actif)'}
                      {selectedPharma.status === 'rejected' && 'Inscription rejetée'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Technical File (Fiche Technique) Details */}
              {selectedPharma.technicalForm ? (
                <div className="space-y-3">
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest border-b border-slate-100 pb-1.5 flex items-center gap-1.5">
                    <Building2 size={12} />
                    Fiche Technique Officielle
                  </p>
                  <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-xs">
                    <div>
                      <span className="text-slate-400">Nom Officiel</span>
                      <p className="font-semibold text-slate-700 mt-0.5">{selectedPharma.technicalForm.pharmacyName}</p>
                    </div>
                    <div>
                      <span className="text-slate-400">Ordre des Pharmaciens (ONPC)</span>
                      <p className="font-mono font-semibold text-slate-700 mt-0.5">{selectedPharma.technicalForm.onpcNumber}</p>
                    </div>
                    <div className="col-span-2">
                      <span className="text-slate-400">Licence d'Exploitation</span>
                      <p className="font-mono font-semibold text-slate-700 mt-0.5">{selectedPharma.technicalForm.legalLicenseNumber}</p>
                    </div>
                    <div>
                      <span className="text-slate-400">Pharmaciens Adjoints</span>
                      <p className="font-semibold text-slate-700 mt-0.5">{selectedPharma.technicalForm.pharmacistsCount} diplômés</p>
                    </div>
                    <div>
                      <span className="text-slate-400">Équipement Froid</span>
                      <p className="font-semibold text-slate-700 mt-0.5">
                        {selectedPharma.technicalForm.coldChainEquipment === 'medical_fridge' ? 'Réfrigérateur médicalisé' : 'Réfrigérateur domestique'}
                      </p>
                    </div>
                  </div>

                  {/* Yes/No Checklists */}
                  <div className="grid grid-cols-2 gap-2 mt-2 bg-slate-50/50 p-2.5 rounded-xl border border-slate-100 text-[11px] text-slate-600">
                    <div className="flex items-center gap-1.5">
                      <span className={cn("w-2 h-2 rounded-full", selectedPharma.technicalForm.temperatureMonitor ? "bg-emerald-500" : "bg-slate-300")} />
                      Suivi Température continu
                    </div>
                    <div className="flex items-center gap-1.5">
                      <span className={cn("w-2 h-2 rounded-full", selectedPharma.technicalForm.backupGenerator !== 'none' ? "bg-emerald-500" : "bg-slate-300")} />
                      Générateur électrique
                    </div>
                    <div className="flex items-center gap-1.5">
                      <span className={cn("w-2 h-2 rounded-full", selectedPharma.technicalForm.airConditioned ? "bg-emerald-500" : "bg-slate-300")} />
                      Climatisation intégrale
                    </div>
                    <div className="flex items-center gap-1.5">
                      <span className={cn("w-2 h-2 rounded-full", selectedPharma.technicalForm.narcoticsSafe ? "bg-emerald-500" : "bg-slate-300")} />
                      Coffre fort stupéfiants
                    </div>
                  </div>
                </div>
              ) : (
                <div className="bg-slate-50 p-4 rounded-xl border border-dashed border-slate-200 text-center text-xs text-slate-400">
                  <FileText className="mx-auto mb-1.5 text-slate-300" size={18} />
                  Fiche technique non complétée par le pharmacien.
                </div>
              )}

              {/* Appointment (Rendez-vous) Details */}
              {selectedPharma.appointment ? (
                <div className="space-y-3">
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest border-b border-slate-100 pb-1.5 flex items-center gap-1.5">
                    <Calendar size={12} />
                    Rendez-vous Planifié
                  </p>
                  <div className="p-3 bg-brand-50/40 border border-brand-100/60 rounded-xl space-y-2 text-xs">
                    <div className="flex items-center justify-between text-slate-700">
                      <span className="font-semibold capitalize">Entretien {selectedPharma.appointment.type}</span>
                      <span className="font-bold text-brand-700">{selectedPharma.appointment.date} à {selectedPharma.appointment.time}</span>
                    </div>
                    {selectedPharma.appointment.phoneNumber && (
                      <div className="flex items-center gap-1.5 text-slate-600">
                        <Phone size={11} className="text-slate-400" />
                        <span>Tél: {selectedPharma.appointment.phoneNumber}</span>
                      </div>
                    )}
                    {selectedPharma.appointment.notes && (
                      <div className="text-slate-500 italic border-t border-slate-100 pt-1.5 mt-1.5">
                        Note: "{selectedPharma.appointment.notes}"
                      </div>
                    )}
                  </div>
                </div>
              ) : (
                <div className="bg-slate-50 p-4 rounded-xl border border-dashed border-slate-200 text-center text-xs text-slate-400">
                  <Calendar className="mx-auto mb-1.5 text-slate-300" size={18} />
                  Aucun entretien de validation planifié.
                </div>
              )}

              {/* Decision Actions Panel */}
              <div className="pt-4 border-t border-slate-100 space-y-2.5">
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">
                  Décision administrative
                </p>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    onClick={() => handleReject(selectedPharma.id)}
                    disabled={actionLoading !== null || selectedPharma.status === 'rejected'}
                    className={cn(
                      "py-3.5 px-4 rounded-xl font-bold text-xs flex items-center justify-center gap-2 border transition-all active:scale-95 disabled:opacity-50",
                      selectedPharma.status === 'rejected'
                        ? "bg-slate-100 border-slate-200 text-slate-400 cursor-not-allowed"
                        : "bg-white hover:bg-rose-50 border-rose-200 hover:border-rose-300 text-rose-600"
                    )}
                  >
                    <XCircle size={14} />
                    Rejeter
                  </button>

                  <button
                    onClick={() => handleApprove(selectedPharma.id)}
                    disabled={actionLoading !== null || selectedPharma.status === 'activated'}
                    className={cn(
                      "py-3.5 px-4 rounded-xl font-bold text-xs flex items-center justify-center gap-2 transition-all active:scale-95 disabled:opacity-50 text-white shadow-sm",
                      selectedPharma.status === 'activated'
                        ? "bg-slate-100 border-slate-200 text-slate-400 cursor-not-allowed"
                        : "bg-emerald-600 hover:bg-emerald-500 border border-emerald-600"
                    )}
                  >
                    <CheckCircle2 size={14} />
                    Valider / Activer
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <div className="p-12 text-center border-2 border-dashed border-slate-100 rounded-2xl">
              <Users className="text-slate-300 mx-auto mb-2" size={28} />
              <p className="text-xs font-semibold text-slate-500">Sélectionnez un pharmacien</p>
              <p className="text-[10px] text-slate-400 mt-1">Cliquez sur un profil de la liste pour inspecter sa fiche et valider son statut.</p>
            </div>
          )}
        </div>
      </div>
      </>)}
    </div>
  );
}
