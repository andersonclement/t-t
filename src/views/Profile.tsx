import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  User,
  Settings,
  CreditCard,
  Bell,
  LogOut,
  FileText,
  ShoppingBag,
  Heart,
  ChevronRight,
  Shield,
  HelpCircle,
  Mail,
  Calendar,
  Building2,
  X,
  CheckCircle2,
  Activity,
  Bot,
  Phone,
  MapPin,
  Clock,
  Send,
  Lock,
  RefreshCw,
  AlertTriangle,
  FileSpreadsheet,
  Truck,
  Plus,
  Trash2,
  Edit,
  Camera,
  TrendingUp,
  Package,
  UserCheck,
  ExternalLink,
  Copy,
  Check
} from 'lucide-react';
import { useAuth } from '../components/AuthContext';
import { useOrders, Order } from '../components/OrderContext';
import { cn } from '../lib/utils';
import { useNavigate } from 'react-router-dom';
import { collection, query, getDocs, where, onSnapshot, doc, setDoc, updateDoc, deleteDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { format, formatDistanceToNow } from 'date-fns';
import { fr } from 'date-fns/locale';

function getMemberSinceLabel(profile: any): string {
  if (!profile) return '';
  const raw = profile.createdAt;
  if (!raw) return '';
  try {
    let date: Date;
    if (raw.seconds) {
      date = new Date(raw.seconds * 1000);
    } else if (typeof raw === 'string') {
      date = new Date(raw);
    } else {
      return '';
    }
    if (isNaN(date.getTime())) return '';
    return `Membre depuis ${format(date, 'MMM yyyy', { locale: fr })}`;
  } catch {
    return '';
  }
}

function getInitials(name: string | null | undefined): string {
  if (!name) return '?';
  const parts = name.trim().split(/\s+/);
  if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
  return parts[0].substring(0, 2).toUpperCase();
}

function generateDeterministicQR(seed: string): boolean[] {
  let hash = 0;
  for (let i = 0; i < seed.length; i++) {
    const char = seed.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash |= 0;
  }
  const cells: boolean[] = [];
  for (let i = 0; i < 25; i++) {
    hash = ((hash * 1103515245) + 12345) & 0x7fffffff;
    cells.push(hash % 3 !== 0);
  }
  // force corners filled (like real QR finder patterns)
  cells[0] = true; cells[1] = true; cells[4] = true;
  cells[5] = true; cells[20] = true; cells[24] = true;
  return cells;
}

export function Profile() {
  const { user, profile, logout, signInWithGoogle, updateUserProfile, resetPassword } = useAuth();
  const { orders } = useOrders();
  const navigate = useNavigate();
  const [showOrders, setShowOrders] = React.useState(false);
  const [expandedOrderId, setExpandedOrderId] = React.useState<string | null>(null);

  const [activeModal, setActiveModal] = React.useState<
    'medical' | 'insurance' | 'allergies' | 'security' | 'license' | 'pharmacy_info' | 'stock_alerts' | 'support' | 'suppliers' | 'personal_info' | 'faq' | null
  >(null);
  const [saving, setSaving] = React.useState(false);
  const [saveSuccess, setSaveSuccess] = React.useState(false);
  const [errorMessage, setErrorMessage] = React.useState<string | null>(null);
  const [copiedId, setCopiedId] = React.useState(false);

  const [formData, setFormData] = React.useState({
    birthDate: '',
    gender: 'Femme',
    bloodType: 'O+',
    weight: '',
    height: '',
    nationalId: '',
    insuranceName: '',
    insuranceNumber: '',
    allergies: '',
    medicalHistory: '',
    currentTreatments: '',

    licenseNumber: '',
    licenseIssuer: '',
    licenseDate: '',
    pharmacistTitle: '',
    pharmacyName: '',
    pharmacyAddress: '',
    pharmacyPhone: '',
    pharmacyHours: '',
    pharmacyEmail: '',
  });

  // Personal info edit state
  const [personalForm, setPersonalForm] = React.useState({
    displayName: '',
    phoneNumber: '',
    address: '',
  });

  const [medications, setMedications] = React.useState<any[]>([]);
  const [medsLoading, setMedsLoading] = React.useState(false);

  React.useEffect(() => {
    if (profile?.role === 'pharmacist') {
      setMedsLoading(true);
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
            } catch (e) {
              console.warn("Failed to parse local meds stock in Profile live sync:", e);
            }
          }
          setMedications(items);
          setMedsLoading(false);
        }, (error) => {
          console.warn("Error subscribing to stock in Profile:", error);
          try {
            const stored = localStorage.getItem('medimap_meds_stock');
            if (stored) {
              setMedications(JSON.parse(stored));
            }
          } catch (e) {}
          setMedsLoading(false);
        });
      } else {
        try {
          const stored = localStorage.getItem('medimap_meds_stock');
          if (stored) {
            setMedications(JSON.parse(stored));
          }
        } catch (e) {}
        setMedsLoading(false);
      }

      return () => unsubscribe();
    }
  }, [profile, user]);

  const [suppliers, setSuppliers] = React.useState<any[]>([]);
  const [suppliersLoading, setSuppliersLoading] = React.useState(false);
  const [isEditingSupplier, setIsEditingSupplier] = React.useState(false);
  const [editingSupplierId, setEditingSupplierId] = React.useState<string | null>(null);
  const [supplierForm, setSupplierForm] = React.useState({
    name: '',
    email: '',
    phone: '',
    address: ''
  });

  React.useEffect(() => {
    if (profile?.role === 'pharmacist') {
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
            } catch (e) {
              console.warn("Failed to parse local suppliers:", e);
            }
          } else {
            localStorage.setItem('medimap_suppliers', JSON.stringify(items));
          }
          setSuppliers(items);
          setSuppliersLoading(false);
        }, (error) => {
          console.warn("Error subscribing to suppliers in Profile:", error);
          try {
            const stored = localStorage.getItem('medimap_suppliers');
            if (stored) {
              setSuppliers(JSON.parse(stored));
            }
          } catch (e) {}
          setSuppliersLoading(false);
        });
      } else {
        try {
          const stored = localStorage.getItem('medimap_suppliers');
          if (stored) {
            setSuppliers(JSON.parse(stored));
          } else {
            const defaultSups = [
              { id: 'sup-1', name: 'LABOREX DOUALA', email: 'douala@laborex.cm', phone: '+237 233 40 40 40', address: 'Zone Industrielle Bassa, Douala' },
              { id: 'sup-2', name: 'UBIPHARM CAMEROUN', email: 'cameroun@ubipharm.com', phone: '+237 233 43 43 43', address: 'Quartier Bonanjo, Douala' }
            ];
            setSuppliers(defaultSups);
            localStorage.setItem('medimap_suppliers', JSON.stringify(defaultSups));
          }
        } catch (e) {}
        setSuppliersLoading(false);
      }

      return () => unsubscribe();
    }
  }, [profile, user]);

  const handleAddSupplier = async (supData: { name: string; email: string; phone: string; address: string }) => {
    const newId = 'sup-' + Date.now();
    const newSup = {
      id: newId,
      ...supData,
      pharmacistId: user ? user.uid : 'guest'
    };

    if (user) {
      try {
        await setDoc(doc(db, 'suppliers', newId), newSup);
      } catch (err) {
        console.warn("Firestore save supplier failed:", err);
      }
    } else {
      const updated = [...suppliers, newSup];
      setSuppliers(updated);
      localStorage.setItem('medimap_suppliers', JSON.stringify(updated));
    }
  };

  const handleUpdateSupplier = async (id: string, supData: { name: string; email: string; phone: string; address: string }) => {
    if (user) {
      try {
        await updateDoc(doc(db, 'suppliers', id), supData);
      } catch (err) {
        console.warn("Firestore update supplier failed:", err);
      }
    } else {
      const updated = suppliers.map(s => s.id === id ? { ...s, ...supData } : s);
      setSuppliers(updated);
      localStorage.setItem('medimap_suppliers', JSON.stringify(updated));
    }
  };

  const handleDeleteSupplier = async (id: string) => {
    if (!window.confirm("Êtes-vous sûr de vouloir supprimer ce fournisseur ?")) return;

    if (user) {
      try {
        await deleteDoc(doc(db, 'suppliers', id));
      } catch (err) {
        console.warn("Firestore delete supplier failed:", err);
      }
    } else {
      const updated = suppliers.filter(s => s.id !== id);
      setSuppliers(updated);
      localStorage.setItem('medimap_suppliers', JSON.stringify(updated));
    }
  };

  const lowStockMeds = medications.filter(med => {
    const min = med.minThreshold !== undefined ? Number(med.minThreshold) : 15;
    return Number(med.stock) <= min;
  });

  const [ticketData, setTicketData] = React.useState({
    category: "Problème d'inventaire",
    subject: '',
    message: ''
  });
  const [ticketSending, setTicketSending] = React.useState(false);
  const [ticketSuccess, setTicketSuccess] = React.useState(false);

  const handleSendTicket = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!ticketData.subject || !ticketData.message) return;
    setTicketSending(true);
    try {
      await new Promise(resolve => setTimeout(resolve, 1500));
      setTicketSuccess(true);
      setTimeout(() => {
        setTicketSuccess(false);
        setTicketData({ category: "Problème d'inventaire", subject: '', message: '' });
        setActiveModal(null);
      }, 2000);
    } catch (err) {
      console.error(err);
    } finally {
      setTicketSending(false);
    }
  };

  const [twoFactorEnabled, setTwoFactorEnabled] = React.useState(false);
  const handleToggle2FA = async () => {
    const nextVal = !twoFactorEnabled;
    setTwoFactorEnabled(nextVal);
    try {
      await updateUserProfile({ twoFactorEnabled: nextVal });
    } catch (err) {
      console.error(err);
    }
  };

  const [resetSent, setResetSent] = React.useState(false);
  const [resetError, setResetError] = React.useState<string | null>(null);
  const handlePasswordReset = async () => {
    if (!user?.email) return;
    try {
      setResetError(null);
      await resetPassword(user.email);
      setResetSent(true);
      setTimeout(() => setResetSent(false), 5000);
    } catch (err: any) {
      setResetError(err.message || "Erreur de réinitialisation.");
    }
  };

  React.useEffect(() => {
    if (profile) {
      setFormData({
        birthDate: profile.birthDate || '',
        gender: profile.gender || 'Femme',
        bloodType: profile.bloodType || 'O+',
        weight: profile.weight || '',
        height: profile.height || '',
        nationalId: profile.nationalId || '',
        insuranceName: profile.insuranceName || '',
        insuranceNumber: profile.insuranceNumber || '',
        allergies: profile.allergies || '',
        medicalHistory: profile.medicalHistory || '',
        currentTreatments: profile.currentTreatments || '',

        licenseNumber: profile.licenseNumber || 'RP-2026-6743-A',
        licenseIssuer: profile.licenseIssuer || 'Ministère de la Santé Publique',
        licenseDate: profile.licenseDate || '2024-01-15',
        pharmacistTitle: profile.pharmacistTitle || 'Docteur en Pharmacie',
        pharmacyName: profile.pharmacyName || 'Pharmacie du Centre',
        pharmacyAddress: profile.pharmacyAddress || 'Avenue de la Liberté, Douala',
        pharmacyPhone: profile.pharmacyPhone || '+237 699 88 77 66',
        pharmacyHours: profile.pharmacyHours || '24h/24, 7j/7',
        pharmacyEmail: profile.pharmacyEmail || 'contact@pharmacieducentre.cm',
      });
      setPersonalForm({
        displayName: profile.displayName || user?.displayName || '',
        phoneNumber: profile.phoneNumber || '',
        address: profile.address || '',
      });
      setTwoFactorEnabled(profile.twoFactorEnabled || false);
    }
  }, [profile]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setErrorMessage(null);
    setSaveSuccess(false);
    try {
      await updateUserProfile(formData);
      setSaveSuccess(true);
      setTimeout(() => {
        setSaveSuccess(false);
        setActiveModal(null);
      }, 1500);
    } catch (err: any) {
      console.error(err);
      setErrorMessage(err.message || "Erreur lors de l'enregistrement. Veuillez réessayer.");
    } finally {
      setSaving(false);
    }
  };

  const handleSavePersonalInfo = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setErrorMessage(null);
    setSaveSuccess(false);
    try {
      await updateUserProfile(personalForm);
      setSaveSuccess(true);
      setTimeout(() => {
        setSaveSuccess(false);
        setActiveModal(null);
      }, 1500);
    } catch (err: any) {
      console.error(err);
      setErrorMessage(err.message || "Erreur lors de l'enregistrement. Veuillez réessayer.");
    } finally {
      setSaving(false);
    }
  };

  // Profile completion calculation
  const completionChecks = profile?.role === 'pharmacist'
    ? [
        { done: !!profile?.licenseNumber, label: 'Licence professionnelle' },
        { done: !!profile?.pharmacyName, label: "Nom de l'officine" },
        { done: !!profile?.pharmacyPhone, label: 'Téléphone officine' },
        { done: !!profile?.pharmacyAddress, label: 'Adresse officine' },
        { done: !!profile?.pharmacyEmail, label: 'Email professionnel' },
        { done: suppliers.length > 0, label: 'Fournisseurs configurés' },
      ]
    : [
        { done: !!profile?.birthDate, label: 'Date de naissance' },
        { done: !!profile?.gender, label: 'Genre' },
        { done: !!profile?.bloodType, label: 'Groupe sanguin' },
        { done: !!profile?.weight && !!profile?.height, label: 'Poids & taille' },
        { done: !!profile?.insuranceName, label: 'Assurance maladie' },
        { done: !!profile?.allergies || !!profile?.medicalHistory, label: 'Antécédents médicaux' },
      ];
  const completedCount = completionChecks.filter(c => c.done).length;
  const completionPercent = Math.round((completedCount / completionChecks.length) * 100);

  const isMedicalComplete = profile?.birthDate && profile?.gender && profile?.bloodType && profile?.weight && profile?.height;
  const isInsuranceComplete = profile?.insuranceName && profile?.insuranceNumber;
  const isAllergiesFilled = profile?.allergies || profile?.medicalHistory;

  const memberSince = getMemberSinceLabel(profile);

  const qrCells = React.useMemo(
    () => generateDeterministicQR(user?.uid || 'default'),
    [user?.uid]
  );

  const handleCopyId = () => {
    if (user?.uid) {
      navigator.clipboard.writeText(user.uid).catch(() => {});
      setCopiedId(true);
      setTimeout(() => setCopiedId(false), 2000);
    }
  };

  // Count active orders
  const activeOrdersCount = orders.filter(o => o.status === 'en_cours' || o.status === 'pending_validation' || o.status === 'preparing' || o.status === 'validated').length;
  const deliveredOrdersCount = orders.filter(o => o.status === 'delivered' || o.status === 'livre').length;

  if (!user) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center text-center p-6 space-y-6">
        <div className="w-24 h-24 bg-gradient-to-br from-brand-100 to-brand-200 rounded-full flex items-center justify-center text-brand-600">
          <User size={48} />
        </div>
        <div className="space-y-2">
          <h2 className="text-3xl font-display font-bold text-slate-900">Bienvenue sur Dokta</h2>
          <p className="text-slate-500 max-w-sm mx-auto">
            Connectez-vous pour accéder à votre historique médical, vos prescriptions et suivre vos commandes.
          </p>
        </div>
        <button
          onClick={signInWithGoogle}
          className="bg-brand-600 text-white px-8 py-4 rounded-2xl font-bold flex items-center gap-2 hover:bg-brand-700 shadow-xl shadow-brand-600/20 transition-all active:scale-95"
        >
          Se connecter avec Google
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-8 pb-12">
      {/* Profile Header */}
      <section className="bg-white rounded-[2.5rem] p-6 sm:p-8 border border-slate-100 shadow-sm ring-8 ring-slate-50">
        <div className="flex flex-col sm:flex-row items-center gap-6 sm:gap-8">
          <div className="relative group">
            {user.photoURL ? (
              <img
                src={user.photoURL}
                className="w-28 h-28 sm:w-32 sm:h-32 rounded-[2rem] object-cover ring-4 ring-brand-600/10"
                alt={`Photo de ${user.displayName || 'utilisateur'}`}
              />
            ) : (
              <div className="w-28 h-28 sm:w-32 sm:h-32 rounded-[2rem] bg-gradient-to-br from-brand-500 to-brand-700 ring-4 ring-brand-600/10 flex items-center justify-center">
                <span className="text-white text-3xl sm:text-4xl font-display font-bold">
                  {getInitials(user.displayName)}
                </span>
              </div>
            )}
            <button
              onClick={() => setActiveModal('personal_info')}
              className="absolute -bottom-2 -right-2 bg-brand-600 text-white p-2.5 rounded-xl shadow-lg border-4 border-white hover:bg-brand-700 transition-colors"
              title="Modifier le profil"
            >
              <Edit size={14} />
            </button>
          </div>

          <div className="flex-1 text-center sm:text-left space-y-2">
            <div className="inline-flex items-center gap-2 bg-brand-50 text-brand-700 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest">
              <UserCheck size={12} />
              {profile?.role === 'pharmacist' ? 'Pharmacien Certifié' : 'Patient Vérifié'}
            </div>
            <h2 className="text-2xl sm:text-3xl font-display font-bold text-slate-900">
              {user.displayName || 'Utilisateur'}
            </h2>
            <div className="flex flex-wrap justify-center sm:justify-start gap-x-4 gap-y-1">
              <p className="text-slate-400 text-sm flex items-center gap-1 font-medium">
                <Mail size={14} />
                {user.email}
              </p>
              {memberSince && (
                <p className="text-slate-400 text-sm flex items-center gap-1 font-medium">
                  <Calendar size={14} />
                  {memberSince}
                </p>
              )}
              {profile?.phoneNumber && (
                <p className="text-slate-400 text-sm flex items-center gap-1 font-medium">
                  <Phone size={14} />
                  {profile.phoneNumber}
                </p>
              )}
            </div>

            {/* User ID copy */}
            <button
              onClick={handleCopyId}
              className="inline-flex items-center gap-1.5 text-[10px] text-slate-300 hover:text-slate-500 font-mono transition-colors mt-1"
              title="Copier l'identifiant"
            >
              {copiedId ? <Check size={10} className="text-emerald-500" /> : <Copy size={10} />}
              <span className="truncate max-w-[140px]">{user.uid}</span>
            </button>
          </div>

          <button
            onClick={logout}
            className="bg-slate-50 text-slate-400 p-4 rounded-2xl hover:bg-red-50 hover:text-red-500 transition-all shrink-0"
            title="Se déconnecter"
          >
            <LogOut size={24} />
          </button>
        </div>
      </section>

      {/* Profile Completion + Quick Stats */}
      <section className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {/* Completion card */}
        <div className="sm:col-span-2 bg-white rounded-3xl border border-slate-100 shadow-sm p-5 space-y-3">
          <div className="flex items-center justify-between">
            <h4 className="text-sm font-bold text-slate-700">Complétion du profil</h4>
            <span className={cn(
              "text-xs font-bold px-2 py-0.5 rounded-full",
              completionPercent === 100 ? "bg-emerald-50 text-emerald-700" : "bg-amber-50 text-amber-700"
            )}>
              {completionPercent}%
            </span>
          </div>
          <div className="w-full bg-slate-100 rounded-full h-2.5 overflow-hidden">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${completionPercent}%` }}
              transition={{ duration: 0.8, ease: 'easeOut' }}
              className={cn(
                "h-full rounded-full transition-colors",
                completionPercent === 100 ? "bg-emerald-500" : completionPercent >= 60 ? "bg-brand-500" : "bg-amber-500"
              )}
            />
          </div>
          <div className="flex flex-wrap gap-2">
            {completionChecks.map((check, i) => (
              <span key={i} className={cn(
                "text-[10px] font-bold px-2 py-1 rounded-lg border transition-colors",
                check.done
                  ? "bg-emerald-50 text-emerald-600 border-emerald-100"
                  : "bg-slate-50 text-slate-400 border-slate-100"
              )}>
                {check.done ? <CheckCircle2 size={10} className="inline mr-1" /> : null}
                {check.label}
              </span>
            ))}
          </div>
        </div>

        {/* Quick stats */}
        <div className="flex flex-row sm:flex-col gap-3">
          <div className="flex-1 bg-white rounded-2xl border border-slate-100 shadow-sm p-4 flex flex-col items-center justify-center text-center">
            <div className="p-2 bg-purple-50 rounded-xl text-purple-500 mb-1.5">
              <Package size={18} />
            </div>
            <span className="text-xl font-display font-bold text-slate-900">{orders.length}</span>
            <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">
              {profile?.role === 'pharmacist' ? 'Ventes' : 'Commandes'}
            </span>
          </div>
          <div className="flex-1 bg-white rounded-2xl border border-slate-100 shadow-sm p-4 flex flex-col items-center justify-center text-center">
            <div className={cn(
              "p-2 rounded-xl mb-1.5",
              activeOrdersCount > 0 ? "bg-orange-50 text-orange-500" : "bg-emerald-50 text-emerald-500"
            )}>
              <TrendingUp size={18} />
            </div>
            <span className="text-xl font-display font-bold text-slate-900">{activeOrdersCount}</span>
            <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">En cours</span>
          </div>
        </div>
      </section>

      {/* Main Content */}
      {!showOrders ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Main Context Card */}
          <div className="space-y-4">
            <h3 className="text-lg font-display font-bold text-slate-900 px-1 italic">
              {profile?.role === 'pharmacist' ? 'Ma Pharmacie & Boutique' : 'Santé & Administratif'}
            </h3>
            <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden">
              {/* Personal Info link for both roles */}
              <ProfileLink
                icon={<User className="text-brand-500" />}
                label="Informations Personnelles"
                trailing={profile?.phoneNumber ? "Renseignées" : "À compléter"}
                onClick={() => setActiveModal('personal_info')}
              />
              {profile?.role === 'pharmacist' ? (
                <>
                  <ProfileLink
                    icon={<FileText className="text-blue-500" />}
                    label="Licence Professionnelle"
                    trailing="Valide"
                    onClick={() => setActiveModal('license')}
                  />
                  <ProfileLink
                    icon={<Building2 className="text-emerald-500" />}
                    label="Informations Établissement"
                    trailing={profile?.pharmacyName ? "Renseignées" : "À compléter"}
                    onClick={() => setActiveModal('pharmacy_info')}
                  />
                  <ProfileLink
                    icon={<Shield className="text-slate-400" />}
                    label="Paramètres de Sécurité"
                    onClick={() => setActiveModal('security')}
                  />
                  <ProfileLink
                    icon={<Truck className="text-indigo-500" />}
                    label="Gestion des Fournisseurs"
                    trailing={suppliersLoading ? "Chargement..." : `${suppliers.length} fournisseurs`}
                    onClick={() => setActiveModal('suppliers')}
                  />
                </>
              ) : (
                <>
                  <ProfileLink
                    icon={<FileText className="text-blue-500" />}
                    label="Dossier Médical"
                    trailing={isMedicalComplete ? "Complet" : "À renseigner"}
                    onClick={() => setActiveModal('medical')}
                  />
                  <ProfileLink
                    icon={<CreditCard className="text-emerald-500" />}
                    label="Carte Vitale / Mutuelle"
                    trailing={isInsuranceComplete ? "Renseignée" : "À renseigner"}
                    onClick={() => setActiveModal('insurance')}
                  />
                  <ProfileLink
                    icon={<Heart className="text-red-500" />}
                    label="Antécédents & Allergies"
                    trailing={isAllergiesFilled ? "Renseigné" : "À signaler !"}
                    onClick={() => setActiveModal('allergies')}
                  />
                  <ProfileLink
                    icon={<Shield className="text-slate-400" />}
                    label="Sécurité des données"
                    trailing="Actif"
                    onClick={() => setActiveModal('security')}
                  />
                </>
              )}
            </div>
          </div>

          {/* Activity & Settings Card */}
          <div className="space-y-4">
            <h3 className="text-lg font-display font-bold text-slate-900 px-1 italic">
              {profile?.role === 'pharmacist' ? 'Gestion & Activité' : 'Commandes & Activité'}
            </h3>
            <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden">
              {profile?.role === 'pharmacist' ? (
                <>
                  <ProfileLink
                    icon={<ShoppingBag className="text-purple-500" />}
                    label="Dashboard Ventes"
                    onClick={() => navigate('/')}
                  />
                  <ProfileLink
                    icon={<Bell className="text-orange-500" />}
                    label="Alertes de Stock"
                    trailing={medsLoading ? "Chargement..." : `${lowStockMeds.length} alertes`}
                    onClick={() => setActiveModal('stock_alerts')}
                  />
                  <ProfileLink
                    icon={<HelpCircle className="text-slate-400" />}
                    label="Support Professionnel"
                    onClick={() => setActiveModal('support')}
                  />
                </>
              ) : (
                <>
                  <ProfileLink
                    icon={<ShoppingBag className="text-purple-500" />}
                    label="Historique de commandes"
                    trailing={orders.length.toString()}
                    onClick={() => setShowOrders(true)}
                  />
                  <ProfileLink
                    icon={<Bell className="text-orange-500" />}
                    label="Notifications & Rappels"
                    trailing={activeOrdersCount > 0 ? `${activeOrdersCount} en cours` : "À jour"}
                  />
                  <ProfileLink
                    icon={<HelpCircle className="text-slate-400" />}
                    label="Centre d'aide / FAQ"
                    onClick={() => setActiveModal('faq')}
                  />
                </>
              )}
            </div>
          </div>
        </div>
      ) : (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-6"
        >
          <div className="flex items-center justify-between">
            <h3 className="text-2xl font-display font-bold text-slate-900">Historique de commandes</h3>
            <button
              onClick={() => setShowOrders(false)}
              className="text-brand-600 font-bold text-sm hover:underline flex items-center gap-1"
            >
              <ChevronRight size={14} className="rotate-180" />
              Retour au profil
            </button>
          </div>

          {/* Orders summary bar */}
          <div className="flex gap-3">
            <div className="flex-1 bg-white rounded-2xl border border-slate-100 p-3 flex items-center gap-3">
              <div className="p-2 bg-purple-50 rounded-xl text-purple-500">
                <Package size={16} />
              </div>
              <div>
                <p className="text-lg font-bold text-slate-900">{orders.length}</p>
                <p className="text-[10px] text-slate-400 font-bold uppercase">Total</p>
              </div>
            </div>
            <div className="flex-1 bg-white rounded-2xl border border-slate-100 p-3 flex items-center gap-3">
              <div className="p-2 bg-orange-50 rounded-xl text-orange-500">
                <Clock size={16} />
              </div>
              <div>
                <p className="text-lg font-bold text-slate-900">{activeOrdersCount}</p>
                <p className="text-[10px] text-slate-400 font-bold uppercase">En cours</p>
              </div>
            </div>
            <div className="flex-1 bg-white rounded-2xl border border-slate-100 p-3 flex items-center gap-3">
              <div className="p-2 bg-emerald-50 rounded-xl text-emerald-500">
                <CheckCircle2 size={16} />
              </div>
              <div>
                <p className="text-lg font-bold text-slate-900">{deliveredOrdersCount}</p>
                <p className="text-[10px] text-slate-400 font-bold uppercase">Livrées</p>
              </div>
            </div>
          </div>

          <div className="space-y-4">
            {orders.length > 0 ? (
              orders.map((order) => (
                <div
                  key={order.id}
                  onClick={() => setExpandedOrderId(expandedOrderId === order.id ? null : order.id)}
                  className={cn(
                    "bg-white rounded-[2rem] border transition-all cursor-pointer overflow-hidden",
                    expandedOrderId === order.id ? "ring-2 ring-brand-600 border-transparent shadow-xl" : "border-slate-100 shadow-sm hover:shadow-md"
                  )}
                >
                  <div className="p-6 space-y-4">
                    <div className="flex justify-between items-start">
                      <div>
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{order.id}</p>
                        <p className="text-sm font-bold text-slate-900">{order.date}</p>
                      </div>
                      <div className="flex flex-col items-end gap-2">
                        <OrderStatusBadge status={order.status} />
                        <ChevronRight
                          size={16}
                          className={cn("text-slate-300 transition-transform", expandedOrderId === order.id && "rotate-90")}
                        />
                      </div>
                    </div>

                    {!expandedOrderId || expandedOrderId !== order.id ? (
                      <div className="flex gap-2 overflow-x-auto pb-2 no-scrollbar">
                        {order.items.map((item, idx) => (
                          <div key={idx} className="flex-shrink-0 w-12 h-12 bg-slate-50 rounded-xl border border-slate-100 flex items-center justify-center overflow-hidden">
                            {item.image ? (
                              <img src={item.image} className="w-full h-full object-cover" alt={item.name} />
                            ) : (
                              <ShoppingBag size={20} className="text-slate-300" />
                            )}
                          </div>
                        ))}
                      </div>
                    ) : null}

                    {expandedOrderId === order.id && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        className="space-y-4 pt-4 border-t border-slate-50"
                      >
                        <div className="space-y-3">
                          {order.items.map((item, idx) => (
                            <div key={idx} className="flex items-center justify-between group">
                              <div className="flex items-center gap-3">
                                <div className="w-10 h-10 bg-slate-50 rounded-lg flex items-center justify-center border border-slate-100 overflow-hidden">
                                  {item.image ? (
                                    <img src={item.image} className="w-full h-full object-cover" alt={item.name} />
                                  ) : (
                                    <ShoppingBag size={14} className="text-slate-300" />
                                  )}
                                </div>
                                <div>
                                  <p className="text-sm font-bold text-slate-800">{item.name}</p>
                                  <p className="text-[10px] text-slate-400 font-medium">Prix unitaire: {item.price.toLocaleString()} FCFA</p>
                                </div>
                              </div>
                              <div className="text-right">
                                <p className="text-xs font-bold text-slate-900">{item.count} x</p>
                                <p className="text-xs font-bold text-brand-600">{(item.price * item.count).toLocaleString()} FCFA</p>
                              </div>
                            </div>
                          ))}
                        </div>
                      </motion.div>
                    )}

                    <div className="flex justify-between items-center pt-4 border-t border-slate-50">
                      <div>
                        <p className="text-[10px] text-slate-400 font-bold uppercase">Paiement</p>
                        <p className="text-xs font-bold text-slate-700">{order.paymentMethod?.toUpperCase()}</p>
                      </div>
                      <p className="text-xl font-display font-bold text-brand-600">{order.total.toLocaleString()} FCFA</p>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="bg-white p-12 rounded-[2rem] border border-slate-100 text-center space-y-4">
                <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto">
                  <ShoppingBag size={32} className="text-slate-200" />
                </div>
                <div className="space-y-1">
                  <p className="font-bold text-slate-600">Aucune commande</p>
                  <p className="text-sm text-slate-400">Vos commandes apparaîtront ici.</p>
                </div>
                <button
                  onClick={() => { setShowOrders(false); navigate('/'); }}
                  className="text-brand-600 font-bold text-sm hover:underline"
                >
                  Parcourir les produits
                </button>
              </div>
            )}
          </div>
        </motion.div>
      )}

      {/* Health Pass Concept Card */}
      <motion.div
        whileHover={{ scale: 1.01 }}
        className="bg-gradient-to-br from-clinical-600 to-indigo-700 rounded-[2.5rem] p-8 text-white relative overflow-hidden shadow-xl"
      >
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <h4 className="text-2xl font-display font-bold">Pass Dokta</h4>
            <p className="text-blue-100 text-sm max-w-sm">
              Présentez ce code en pharmacie ou à l'hôpital pour un accès instantané à votre profil partagé.
            </p>
          </div>
          <div className="bg-white p-4 rounded-3xl w-48 h-48 mx-auto md:mx-0 shadow-lg flex items-center justify-center">
            <div className="w-full h-full bg-slate-50 rounded-2xl flex items-center justify-center">
               <div className="grid grid-cols-5 gap-1 p-3">
                 {qrCells.map((filled, i) => (
                   <div key={i} className={cn("w-3.5 h-3.5 rounded-sm", filled ? "bg-slate-800" : "bg-slate-100")} />
                 ))}
               </div>
            </div>
          </div>
        </div>
        <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/2" />
        <div className="absolute bottom-0 left-0 w-40 h-40 bg-white/5 rounded-full translate-y-1/2 -translate-x-1/2" />
      </motion.div>

      {/* Modal overlays */}
      <AnimatePresence>
        {activeModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setActiveModal(null)}
              className="absolute inset-0 bg-slate-950/40 backdrop-blur-sm"
            />

            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="bg-white w-full max-w-lg rounded-[2.5rem] border border-slate-100 shadow-2xl overflow-hidden relative z-10 flex flex-col max-h-[90vh]"
            >
              {/* Header */}
              <div className="p-6 border-b border-slate-50 flex justify-between items-center bg-slate-50/50 shrink-0">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 bg-brand-50 rounded-2xl text-brand-600">
                    {activeModal === 'personal_info' && <User size={20} />}
                    {activeModal === 'medical' && <FileText size={20} />}
                    {activeModal === 'insurance' && <CreditCard size={20} />}
                    {activeModal === 'allergies' && <Heart size={20} />}
                    {activeModal === 'security' && <Shield size={20} />}
                    {activeModal === 'license' && <FileText size={20} />}
                    {activeModal === 'pharmacy_info' && <Building2 size={20} />}
                    {activeModal === 'stock_alerts' && <Bell size={20} />}
                    {activeModal === 'support' && <HelpCircle size={20} />}
                    {activeModal === 'suppliers' && <Truck size={20} />}
                    {activeModal === 'faq' && <HelpCircle size={20} />}
                  </div>
                  <div>
                    <h4 className="font-display font-bold text-slate-900 text-left">
                      {activeModal === 'personal_info' && "Informations Personnelles"}
                      {activeModal === 'medical' && "Dossier Médical"}
                      {activeModal === 'insurance' && "Carte Vitale / Assurance"}
                      {activeModal === 'allergies' && "Antécédents & Allergies"}
                      {activeModal === 'security' && "Sécurité des Données"}
                      {activeModal === 'license' && "Licence Professionnelle"}
                      {activeModal === 'pharmacy_info' && "Informations Établissement"}
                      {activeModal === 'stock_alerts' && "Alertes de Stock"}
                      {activeModal === 'support' && "Support Professionnel"}
                      {activeModal === 'suppliers' && "Gestion des Fournisseurs"}
                      {activeModal === 'faq' && "Centre d'aide"}
                    </h4>
                    <p className="text-[11px] text-slate-400 font-medium text-left">
                      {activeModal === 'personal_info' && "Modifiez votre nom, téléphone et adresse"}
                      {activeModal === 'medical' && "Renseignez vos caractéristiques de santé physiques"}
                      {activeModal === 'insurance' && "Informations administratives d'assurance maladie"}
                      {activeModal === 'allergies' && "Signalez-les pour que l'IA adapte ses conseils"}
                      {activeModal === 'security' && "Gérez l'accès, la sécurité et l'authentification"}
                      {activeModal === 'license' && "Informations d'accréditation et de conformité du praticien"}
                      {activeModal === 'pharmacy_info' && "Détails et horaires de votre officine de pharmacie"}
                      {activeModal === 'stock_alerts' && "Médicaments en rupture ou sous le seuil de stock critique"}
                      {activeModal === 'support' && "Service d'assistance technique dédié aux pharmaciens"}
                      {activeModal === 'suppliers' && "Configurez vos grossistes pour faciliter vos bons de commande"}
                      {activeModal === 'faq' && "Questions fréquentes et liens utiles"}
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setActiveModal(null)}
                  className="p-2 hover:bg-slate-100 text-slate-400 hover:text-slate-600 rounded-xl transition-all"
                >
                  <X size={20} />
                </button>
              </div>

              {/* Body */}
              <div className="p-6 md:p-8 overflow-y-auto space-y-6 flex-1 text-left">
                {errorMessage && (
                  <div className="p-4 bg-red-50 text-red-700 rounded-2xl text-xs font-semibold flex items-center gap-2">
                    <AlertTriangle size={14} className="shrink-0" />
                    {errorMessage}
                  </div>
                )}

                {/* Personal Info Modal */}
                {activeModal === 'personal_info' ? (
                  <form onSubmit={handleSavePersonalInfo} className="space-y-4">
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Nom complet</label>
                      <input
                        type="text"
                        placeholder="Votre nom et prénom"
                        value={personalForm.displayName}
                        onChange={(e) => setPersonalForm({ ...personalForm, displayName: e.target.value })}
                        className="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm focus:outline-none focus:ring-4 focus:ring-brand-600/10 transition-all bg-slate-50/50 text-slate-800"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Numéro de téléphone</label>
                      <input
                        type="tel"
                        placeholder="+237 6XX XXX XXX"
                        value={personalForm.phoneNumber}
                        onChange={(e) => setPersonalForm({ ...personalForm, phoneNumber: e.target.value })}
                        className="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm focus:outline-none focus:ring-4 focus:ring-brand-600/10 transition-all bg-slate-50/50 text-slate-800"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Adresse</label>
                      <input
                        type="text"
                        placeholder="Quartier, Ville"
                        value={personalForm.address}
                        onChange={(e) => setPersonalForm({ ...personalForm, address: e.target.value })}
                        className="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm focus:outline-none focus:ring-4 focus:ring-brand-600/10 transition-all bg-slate-50/50 text-slate-800"
                      />
                    </div>

                    <div className="bg-slate-50 p-3 rounded-xl border border-slate-100 space-y-1">
                      <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Adresse email</p>
                      <p className="text-sm text-slate-600 font-medium">{user.email}</p>
                      <p className="text-[10px] text-slate-400">L'email ne peut pas être modifié directement. Contactez le support pour toute demande.</p>
                    </div>

                    <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-3">
                      <button
                        type="button"
                        onClick={() => setActiveModal(null)}
                        className="bg-slate-100 hover:bg-slate-200 text-slate-700 px-5 py-2.5 rounded-xl font-bold transition-all text-xs"
                      >
                        Annuler
                      </button>
                      <button
                        type="submit"
                        disabled={saving || saveSuccess}
                        className={cn(
                          "px-6 py-2.5 rounded-xl font-bold text-white shadow-lg transition-all text-xs flex items-center gap-2",
                          saveSuccess
                            ? "bg-emerald-600 shadow-emerald-600/10"
                            : "bg-brand-600 hover:bg-brand-700 shadow-brand-600/10 hover:shadow-brand-600/25 active:scale-95 disabled:opacity-50"
                        )}
                      >
                        {saving ? "Enregistrement..." : saveSuccess ? (
                          <><CheckCircle2 size={16} /> Enregistré !</>
                        ) : "Enregistrer"}
                      </button>
                    </div>
                  </form>
                ) : activeModal === 'faq' ? (
                  <div className="space-y-4">
                    <FAQItem
                      q="Comment passer une commande ?"
                      a="Rendez-vous sur l'accueil, parcourez les produits disponibles et ajoutez-les à votre panier. Finalisez votre commande en choisissant un mode de paiement."
                    />
                    <FAQItem
                      q="Comment suivre ma commande ?"
                      a="Accédez à votre profil, puis cliquez sur 'Historique de commandes'. Chaque commande affiche son statut en temps réel."
                    />
                    <FAQItem
                      q="Comment mettre à jour mon dossier médical ?"
                      a="Dans votre profil, cliquez sur 'Dossier Médical' pour renseigner vos informations de santé. Ces données sont utilisées par l'IA pour personnaliser vos conseils."
                    />
                    <FAQItem
                      q="Mes données sont-elles sécurisées ?"
                      a="Oui, toutes vos données sont cryptées de bout en bout (AES-256). Seuls vous et les professionnels de santé autorisés peuvent y accéder."
                    />
                    <FAQItem
                      q="Comment contacter le support ?"
                      a="Si vous êtes pharmacien, utilisez le 'Support Professionnel' dans votre profil. Sinon, envoyez un email à support@dokta.cm."
                    />
                    <div className="pt-4 border-t border-slate-100 flex justify-end">
                      <button
                        onClick={() => setActiveModal(null)}
                        className="bg-slate-900 text-white px-6 py-2.5 rounded-xl font-bold hover:bg-slate-800 transition-all text-xs"
                      >
                        Fermer
                      </button>
                    </div>
                  </div>
                ) : activeModal === 'security' ? (
                  <div className="space-y-6">
                    {profile?.role === 'pharmacist' ? (
                      <div className="space-y-6">
                        <div className="bg-slate-50 p-4 rounded-2xl flex items-center justify-between border border-slate-100">
                          <div className="space-y-1">
                            <h5 className="text-sm font-bold text-slate-800">Double Authentification (2FA)</h5>
                            <p className="text-xs text-slate-500 max-w-xs">
                              Sécurisez l'accès à votre officine en exigeant un code unique à la connexion.
                            </p>
                          </div>
                          <button
                            type="button"
                            onClick={handleToggle2FA}
                            className={cn(
                              "relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none",
                              twoFactorEnabled ? "bg-brand-600" : "bg-slate-200"
                            )}
                            role="switch"
                            aria-checked={twoFactorEnabled}
                            aria-label="Activer la double authentification"
                          >
                            <span
                              className={cn(
                                "pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out",
                                twoFactorEnabled ? "translate-x-5" : "translate-x-0"
                              )}
                            />
                          </button>
                        </div>

                        <div className="bg-slate-50 p-4 rounded-2xl space-y-3 border border-slate-100">
                          <div className="flex items-center gap-2 text-slate-800">
                            <Lock size={16} className="text-brand-600" />
                            <h5 className="text-sm font-bold">Réinitialiser le mot de passe</h5>
                          </div>
                          <p className="text-xs text-slate-500">
                            Envoyer un lien de réinitialisation sécurisé à votre adresse de connexion : <strong className="text-slate-700">{user.email}</strong>.
                          </p>
                          {resetSent ? (
                            <div className="p-3 bg-emerald-50 text-emerald-800 text-xs rounded-xl font-bold flex items-center gap-2">
                              <CheckCircle2 size={14} /> Email de réinitialisation envoyé !
                            </div>
                          ) : (
                            <button
                              type="button"
                              onClick={handlePasswordReset}
                              className="bg-white hover:bg-slate-100 text-slate-800 border border-slate-200 px-4 py-2 rounded-xl text-xs font-bold transition-all active:scale-95 flex items-center gap-1.5"
                            >
                              <RefreshCw size={12} /> Envoyer l'email de réinitialisation
                            </button>
                          )}
                          {resetError && (
                            <p className="text-xs font-semibold text-red-600">{resetError}</p>
                          )}
                        </div>

                        <div className="space-y-4 text-slate-600 text-xs leading-relaxed border-t border-slate-100 pt-4">
                          <div className="flex gap-2.5 items-start">
                            <div className="p-1 bg-emerald-50 rounded-lg text-emerald-600 shrink-0">
                              <CheckCircle2 size={14} />
                            </div>
                            <p><strong>Cryptage de niveau bancaire :</strong> Toutes vos fiches patients et données de vente sont protégées par le protocole AES-256.</p>
                          </div>
                          <div className="flex gap-2.5 items-start">
                            <div className="p-1 bg-emerald-50 rounded-lg text-emerald-600 shrink-0">
                              <CheckCircle2 size={14} />
                            </div>
                            <p><strong>Conformité MINSANTE :</strong> Vos informations professionnelles et votre licence d'officine sont cryptées pour assurer la confidentialité médicale nationale.</p>
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div className="space-y-4 text-slate-600 text-sm leading-relaxed">
                        <div className="flex gap-3 items-start">
                          <div className="p-1.5 bg-emerald-50 rounded-lg text-emerald-600 mt-0.5 shrink-0">
                            <CheckCircle2 size={16} />
                          </div>
                          <p>
                            <strong>Cryptage de bout en bout :</strong> Vos données de santé et informations administratives sont cryptées et stockées de manière sécurisée.
                          </p>
                        </div>
                        <div className="flex gap-3 items-start">
                          <div className="p-1.5 bg-emerald-50 rounded-lg text-emerald-600 mt-0.5 shrink-0">
                            <Bot size={16} />
                          </div>
                          <p>
                            <strong>Intelligence Artificielle préventive :</strong> Care IA analyse vos allergies déclarées et antécédents pour s'assurer que les médicaments commandés ou suggérés ne présentent aucun risque d'interaction ou de choc allergique.
                          </p>
                        </div>
                        <div className="flex gap-3 items-start">
                          <div className="p-1.5 bg-emerald-50 rounded-lg text-emerald-600 mt-0.5 shrink-0">
                            <Activity size={16} />
                          </div>
                          <p>
                            <strong>Anticipation de renouvellement :</strong> L'IA détecte si vos traitements de fond (ex: asthme, diabète) nécessitent des commandes récurrentes et vous alerte pour éviter toute rupture.
                          </p>
                        </div>
                      </div>
                    )}
                    <div className="pt-4 border-t border-slate-100 flex justify-end">
                      <button
                        onClick={() => setActiveModal(null)}
                        className="bg-slate-900 text-white px-6 py-2.5 rounded-xl font-bold hover:bg-slate-800 transition-all text-xs"
                      >
                        Compris
                      </button>
                    </div>
                  </div>
                ) : activeModal === 'stock_alerts' ? (
                  <div className="space-y-4">
                    {medsLoading ? (
                      <div className="flex flex-col items-center justify-center py-12 space-y-3">
                        <div className="w-8 h-8 border-4 border-brand-600 border-t-transparent rounded-full animate-spin" />
                        <p className="text-slate-500 text-xs">Analyse du stock en cours...</p>
                      </div>
                    ) : lowStockMeds.length === 0 ? (
                      <div className="text-center py-12 space-y-4">
                        <div className="w-16 h-16 bg-emerald-50 rounded-full flex items-center justify-center text-emerald-600 mx-auto">
                          <CheckCircle2 size={36} />
                        </div>
                        <div className="space-y-1">
                          <h5 className="font-bold text-slate-800">Aucune alerte de stock</h5>
                          <p className="text-slate-400 text-xs max-w-xs mx-auto">
                            Tous vos produits d'inventaire disposent d'un volume suffisant au-dessus des seuils d'alerte.
                          </p>
                        </div>
                      </div>
                    ) : (
                      <div className="space-y-4">
                        <div className="p-3 bg-amber-50 text-amber-800 text-xs rounded-xl font-medium flex items-start gap-2 border border-amber-100">
                          <AlertTriangle size={16} className="shrink-0 mt-0.5" />
                          <p>
                            <strong>{lowStockMeds.length} médicaments</strong> nécessitent un réapprovisionnement immédiat pour éviter des ruptures dans votre pharmacie.
                          </p>
                        </div>

                        <div className="max-h-72 overflow-y-auto space-y-2 pr-1 divide-y divide-slate-100">
                          {lowStockMeds.map((med) => (
                            <div key={med.id} className="flex items-center justify-between py-2.5 first:pt-0">
                              <div className="space-y-1">
                                <p className="text-sm font-bold text-slate-800">{med.name}</p>
                                <p className="text-[10px] text-slate-400 font-medium">Dosage: {med.dosage} · Seuil min: {med.minThreshold || 15}</p>
                              </div>
                              <div className="text-right">
                                <span className={cn(
                                  "px-2 py-1 rounded-lg text-xs font-bold",
                                  med.stock === 0 ? "bg-red-100 text-red-700" : "bg-amber-100 text-amber-700"
                                )}>
                                  Stock: {med.stock}
                                </span>
                              </div>
                            </div>
                          ))}
                        </div>

                        <div className="pt-4 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-end gap-3">
                          <button
                            type="button"
                            onClick={() => setActiveModal(null)}
                            className="w-full sm:w-auto bg-slate-100 hover:bg-slate-200 text-slate-700 px-5 py-2.5 rounded-xl font-bold transition-all text-xs"
                          >
                            Fermer
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              setActiveModal(null);
                              navigate('/inventory');
                            }}
                            className="w-full sm:w-auto bg-brand-600 hover:bg-brand-700 text-white px-5 py-2.5 rounded-xl font-bold shadow-lg shadow-brand-600/10 transition-all active:scale-95 text-xs flex items-center justify-center gap-1.5"
                          >
                            Gérer le stock dans l'inventaire <ChevronRight size={14} />
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                ) : activeModal === 'support' ? (
                  <form onSubmit={handleSendTicket} className="space-y-4">
                    {ticketSuccess ? (
                      <div className="text-center py-8 space-y-4">
                        <div className="w-16 h-16 bg-emerald-50 rounded-full flex items-center justify-center text-emerald-600 mx-auto">
                          <CheckCircle2 size={36} />
                        </div>
                        <div className="space-y-1">
                          <h5 className="font-bold text-slate-800">Ticket envoyé avec succès !</h5>
                          <p className="text-slate-400 text-xs max-w-xs mx-auto">
                            Notre service d'assistance technique dédié aux officines vous recontactera sous 2 heures par téléphone ou email.
                          </p>
                        </div>
                      </div>
                    ) : (
                      <>
                        <div className="grid grid-cols-2 gap-3 bg-slate-50 p-3 rounded-2xl border border-slate-100">
                          <a href="tel:+237670000000" className="flex flex-col items-center p-2 bg-white hover:bg-slate-50 border border-slate-100 rounded-xl text-center transition-all">
                            <Phone size={14} className="text-brand-600 mb-1" />
                            <span className="text-[10px] font-bold text-slate-700">Ligne Directe Pro</span>
                            <span className="text-[9px] text-slate-400">+237 670 000 000</span>
                          </a>
                          <div className="flex flex-col items-center p-2 bg-white border border-slate-100 rounded-xl text-center">
                            <Mail size={14} className="text-emerald-600 mb-1" />
                            <span className="text-[10px] font-bold text-slate-700">Email Pro</span>
                            <span className="text-[9px] text-slate-400">pro-support@dokta.cm</span>
                          </div>
                        </div>

                        <div className="space-y-1">
                          <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Catégorie de la Demande</label>
                          <select
                            value={ticketData.category}
                            onChange={(e) => setTicketData({ ...ticketData, category: e.target.value })}
                            className="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm focus:outline-none focus:ring-4 focus:ring-brand-600/10 transition-all bg-slate-50/50 text-slate-800 font-medium"
                          >
                            <option value="Problème d'inventaire">Problème d'inventaire / Stock</option>
                            <option value="Erreur de facturation">Erreur de facturation / Paiement</option>
                            <option value="Dysfonctionnement technique">Dysfonctionnement technique de l'application</option>
                            <option value="Autre">Autre demande générale</option>
                          </select>
                        </div>

                        <div className="space-y-1">
                          <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Objet du Message</label>
                          <input
                            type="text"
                            placeholder="Ex: Erreur d'affichage du stock de Coartem..."
                            required
                            value={ticketData.subject}
                            onChange={(e) => setTicketData({ ...ticketData, subject: e.target.value })}
                            className="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm focus:outline-none focus:ring-4 focus:ring-brand-600/10 transition-all bg-slate-50/50 text-slate-800"
                          />
                        </div>

                        <div className="space-y-1">
                          <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Description Détaillée</label>
                          <textarea
                            rows={3}
                            placeholder="Veuillez décrire le problème rencontré en fournissant le plus de détails possible..."
                            required
                            value={ticketData.message}
                            onChange={(e) => setTicketData({ ...ticketData, message: e.target.value })}
                            className="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm focus:outline-none focus:ring-4 focus:ring-brand-600/10 transition-all bg-slate-50/50 resize-none text-slate-800"
                          />
                        </div>

                        <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-3">
                          <button
                            type="button"
                            onClick={() => setActiveModal(null)}
                            className="bg-slate-100 hover:bg-slate-200 text-slate-700 px-5 py-2.5 rounded-xl font-bold transition-all text-xs"
                          >
                            Annuler
                          </button>
                          <button
                            type="submit"
                            disabled={ticketSending}
                            className="bg-brand-600 hover:bg-brand-700 text-white px-6 py-2.5 rounded-xl font-bold shadow-lg shadow-brand-600/10 hover:shadow-brand-600/25 active:scale-95 disabled:opacity-50 text-xs flex items-center gap-1.5"
                          >
                            {ticketSending ? "Envoi du ticket..." : <><Send size={14} /> Envoyer la demande</>}
                          </button>
                        </div>
                      </>
                    )}
                  </form>
                ) : activeModal === 'suppliers' ? (
                  <div className="space-y-4">
                    {isEditingSupplier ? (
                      <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100 space-y-3">
                        <h5 className="font-bold text-xs text-slate-700 uppercase tracking-wider">
                          {editingSupplierId ? "Modifier le Fournisseur" : "Nouveau Fournisseur"}
                        </h5>
                        <div className="space-y-3 text-left">
                          <div>
                            <label className="text-[10px] font-black uppercase text-slate-400 block mb-1">Nom du grossiste *</label>
                            <input
                              type="text"
                              required
                              placeholder="Ex: LABOREX DOUALA"
                              value={supplierForm.name}
                              onChange={(e) => setSupplierForm({ ...supplierForm, name: e.target.value })}
                              className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2.5 text-xs font-semibold focus:ring-2 focus:ring-brand-600/10 outline-none text-slate-800"
                            />
                          </div>
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            <div>
                              <label className="text-[10px] font-black uppercase text-slate-400 block mb-1">Téléphone</label>
                              <input
                                type="text"
                                placeholder="+237 6..."
                                value={supplierForm.phone}
                                onChange={(e) => setSupplierForm({ ...supplierForm, phone: e.target.value })}
                                className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2.5 text-xs font-semibold focus:ring-2 focus:ring-brand-600/10 outline-none text-slate-800"
                              />
                            </div>
                            <div>
                              <label className="text-[10px] font-black uppercase text-slate-400 block mb-1">Email</label>
                              <input
                                type="email"
                                placeholder="contact@..."
                                value={supplierForm.email}
                                onChange={(e) => setSupplierForm({ ...supplierForm, email: e.target.value })}
                                className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2.5 text-xs font-semibold focus:ring-2 focus:ring-brand-600/10 outline-none text-slate-800"
                              />
                            </div>
                          </div>
                          <div>
                            <label className="text-[10px] font-black uppercase text-slate-400 block mb-1">Adresse physique</label>
                            <input
                              type="text"
                              placeholder="Ex: Zone Industrielle Bassa, Douala"
                              value={supplierForm.address}
                              onChange={(e) => setSupplierForm({ ...supplierForm, address: e.target.value })}
                              className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2.5 text-xs font-semibold focus:ring-2 focus:ring-brand-600/10 outline-none text-slate-800"
                            />
                          </div>
                          <div className="flex gap-2 justify-end pt-2">
                            <button
                              type="button"
                              onClick={() => {
                                setIsEditingSupplier(false);
                                setEditingSupplierId(null);
                                setSupplierForm({ name: '', email: '', phone: '', address: '' });
                              }}
                              className="px-3.5 py-2 bg-white border border-slate-200 text-slate-600 rounded-xl text-xs font-bold hover:bg-slate-50 transition-all"
                            >
                              Annuler
                            </button>
                            <button
                              type="button"
                              onClick={async () => {
                                if (!supplierForm.name.trim()) {
                                  alert("Le nom du fournisseur est obligatoire.");
                                  return;
                                }
                                if (editingSupplierId) {
                                  await handleUpdateSupplier(editingSupplierId, supplierForm);
                                } else {
                                  await handleAddSupplier(supplierForm);
                                }
                                setIsEditingSupplier(false);
                                setEditingSupplierId(null);
                                setSupplierForm({ name: '', email: '', phone: '', address: '' });
                              }}
                              className="px-4 py-2 bg-brand-600 hover:bg-brand-700 text-white rounded-xl text-xs font-bold transition-all shadow-md shadow-brand-600/10"
                            >
                              Enregistrer
                            </button>
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div className="flex justify-between items-center bg-slate-50 p-3 rounded-2xl border border-slate-100">
                        <span className="text-xs text-slate-500 font-semibold">{suppliers.length} fournisseur(s) configuré(s)</span>
                        <button
                          type="button"
                          onClick={() => {
                            setSupplierForm({ name: '', email: '', phone: '', address: '' });
                            setEditingSupplierId(null);
                            setIsEditingSupplier(true);
                          }}
                          className="px-3.5 py-2 bg-brand-600 hover:bg-brand-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-md shadow-brand-600/10 transition-all"
                        >
                          <Plus size={14} /> Ajouter un Fournisseur
                        </button>
                      </div>
                    )}

                    <div className="space-y-2 max-h-[320px] overflow-y-auto pr-1">
                      {suppliers.map((sup) => (
                        <div key={sup.id} className="p-3 bg-white rounded-2xl border border-slate-100 shadow-sm flex justify-between items-start gap-4 hover:border-slate-200 transition-all">
                          <div className="space-y-1 text-left">
                            <h6 className="font-bold text-slate-800 text-xs sm:text-sm">{sup.name}</h6>
                            <div className="flex flex-wrap gap-x-3 gap-y-1 text-[10px] text-slate-500 font-semibold">
                              {sup.phone && <span className="flex items-center gap-1"><Phone size={10} /> {sup.phone}</span>}
                              {sup.email && <span className="flex items-center gap-1"><Mail size={10} /> {sup.email}</span>}
                              {sup.address && <span className="flex items-center gap-1"><MapPin size={10} /> {sup.address}</span>}
                            </div>
                          </div>
                          <div className="flex gap-1 shrink-0">
                            <button
                              type="button"
                              onClick={() => {
                                setSupplierForm({ name: sup.name, email: sup.email || '', phone: sup.phone || '', address: sup.address || '' });
                                setEditingSupplierId(sup.id);
                                setIsEditingSupplier(true);
                              }}
                              className="p-1.5 bg-slate-50 hover:bg-slate-100 text-slate-500 rounded-lg transition-colors"
                              title="Modifier"
                            >
                              <Edit size={12} />
                            </button>
                            <button
                              type="button"
                              onClick={() => handleDeleteSupplier(sup.id)}
                              className="p-1.5 bg-rose-50 hover:bg-rose-100 text-rose-500 rounded-lg transition-colors"
                              title="Supprimer"
                            >
                              <Trash2 size={12} />
                            </button>
                          </div>
                        </div>
                      ))}
                      {suppliers.length === 0 && (
                        <div className="text-center py-12 text-xs text-slate-400 italic bg-slate-50 rounded-2xl border border-dashed border-slate-200">
                          Aucun fournisseur. Veuillez cliquer sur "Ajouter un Fournisseur".
                        </div>
                      )}
                    </div>

                    <div className="pt-4 border-t border-slate-100 flex justify-end">
                      <button
                        type="button"
                        onClick={() => setActiveModal(null)}
                        className="bg-slate-900 hover:bg-slate-800 text-white px-5 py-2.5 rounded-xl font-bold transition-all text-xs"
                      >
                        Fermer
                      </button>
                    </div>
                  </div>
                ) : (
                  <form onSubmit={handleSave} className="space-y-4">
                    {activeModal === 'license' && (
                      <div className="space-y-4">
                        <div className="p-3 bg-brand-50/50 text-brand-800 text-xs rounded-xl font-medium border border-brand-100 leading-relaxed">
                          Votre licence d'exercice est validée par le Ministère de la Santé. Vous pouvez modifier ces détails pour toute mise à jour administrative.
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                          <div className="space-y-1.5">
                            <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Numéro de Licence</label>
                            <input
                              type="text"
                              value={formData.licenseNumber}
                              onChange={(e) => setFormData({ ...formData, licenseNumber: e.target.value })}
                              className="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm focus:outline-none focus:ring-4 focus:ring-brand-600/10 transition-all bg-slate-50/50 text-slate-800 font-mono"
                            />
                          </div>
                          <div className="space-y-1.5">
                            <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Date de Délivrance</label>
                            <input
                              type="date"
                              value={formData.licenseDate}
                              onChange={(e) => setFormData({ ...formData, licenseDate: e.target.value })}
                              className="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm focus:outline-none focus:ring-4 focus:ring-brand-600/10 transition-all bg-slate-50/50 text-slate-800"
                            />
                          </div>
                        </div>

                        <div className="space-y-1.5">
                          <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Autorité de Délivrance</label>
                          <input
                            type="text"
                            value={formData.licenseIssuer}
                            onChange={(e) => setFormData({ ...formData, licenseIssuer: e.target.value })}
                            className="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm focus:outline-none focus:ring-4 focus:ring-brand-600/10 transition-all bg-slate-50/50 text-slate-800"
                          />
                        </div>

                        <div className="space-y-1.5">
                          <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Titre / Spécialité</label>
                          <input
                            type="text"
                            value={formData.pharmacistTitle}
                            onChange={(e) => setFormData({ ...formData, pharmacistTitle: e.target.value })}
                            className="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm focus:outline-none focus:ring-4 focus:ring-brand-600/10 transition-all bg-slate-50/50 text-slate-800"
                          />
                        </div>
                      </div>
                    )}

                    {activeModal === 'pharmacy_info' && (
                      <div className="space-y-4">
                        <div className="space-y-1.5">
                          <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Nom de l'Officine / Pharmacie</label>
                          <input
                            type="text"
                            value={formData.pharmacyName}
                            onChange={(e) => setFormData({ ...formData, pharmacyName: e.target.value })}
                            className="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm focus:outline-none focus:ring-4 focus:ring-brand-600/10 transition-all bg-slate-50/50 text-slate-800"
                          />
                        </div>

                        <div className="space-y-1.5">
                          <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Adresse Physique</label>
                          <input
                            type="text"
                            value={formData.pharmacyAddress}
                            onChange={(e) => setFormData({ ...formData, pharmacyAddress: e.target.value })}
                            className="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm focus:outline-none focus:ring-4 focus:ring-brand-600/10 transition-all bg-slate-50/50 text-slate-800"
                          />
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                          <div className="space-y-1.5">
                            <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Téléphone d'Officine</label>
                            <input
                              type="text"
                              value={formData.pharmacyPhone}
                              onChange={(e) => setFormData({ ...formData, pharmacyPhone: e.target.value })}
                              className="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm focus:outline-none focus:ring-4 focus:ring-brand-600/10 transition-all bg-slate-50/50 text-slate-800"
                            />
                          </div>
                          <div className="space-y-1.5">
                            <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Horaires d'Ouverture</label>
                            <input
                              type="text"
                              value={formData.pharmacyHours}
                              onChange={(e) => setFormData({ ...formData, pharmacyHours: e.target.value })}
                              className="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm focus:outline-none focus:ring-4 focus:ring-brand-600/10 transition-all bg-slate-50/50 text-slate-800"
                            />
                          </div>
                        </div>

                        <div className="space-y-1.5">
                          <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Email de Contact Professionnel</label>
                          <input
                            type="email"
                            value={formData.pharmacyEmail}
                            onChange={(e) => setFormData({ ...formData, pharmacyEmail: e.target.value })}
                            className="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm focus:outline-none focus:ring-4 focus:ring-brand-600/10 transition-all bg-slate-50/50 text-slate-800"
                          />
                        </div>
                      </div>
                    )}

                    {activeModal === 'medical' && (
                      <div className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                          <div className="space-y-1.5">
                            <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Date de Naissance</label>
                            <input
                              type="date"
                              value={formData.birthDate}
                              onChange={(e) => setFormData({ ...formData, birthDate: e.target.value })}
                              className="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm focus:outline-none focus:ring-4 focus:ring-brand-600/10 transition-all bg-slate-50/50 text-slate-800"
                            />
                          </div>
                          <div className="space-y-1.5">
                            <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Genre</label>
                            <select
                              value={formData.gender}
                              onChange={(e) => setFormData({ ...formData, gender: e.target.value })}
                              className="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm focus:outline-none focus:ring-4 focus:ring-brand-600/10 transition-all bg-slate-50/50 text-slate-800"
                            >
                              <option value="Femme">Femme</option>
                              <option value="Homme">Homme</option>
                              <option value="Autre">Autre</option>
                            </select>
                          </div>
                        </div>

                        <div className="grid grid-cols-3 gap-4">
                          <div className="space-y-1.5">
                            <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Groupe Sanguin</label>
                            <select
                              value={formData.bloodType}
                              onChange={(e) => setFormData({ ...formData, bloodType: e.target.value })}
                              className="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm focus:outline-none focus:ring-4 focus:ring-brand-600/10 transition-all bg-slate-50/50 text-slate-800"
                            >
                              {["O+", "O-", "A+", "A-", "B+", "B-", "AB+", "AB-"].map(bt => (
                                <option key={bt} value={bt}>{bt}</option>
                              ))}
                            </select>
                          </div>
                          <div className="space-y-1.5">
                            <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Poids (kg)</label>
                            <input
                              type="number"
                              placeholder="70"
                              value={formData.weight}
                              onChange={(e) => setFormData({ ...formData, weight: e.target.value })}
                              className="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm focus:outline-none focus:ring-4 focus:ring-brand-600/10 transition-all bg-slate-50/50 text-slate-800"
                            />
                          </div>
                          <div className="space-y-1.5">
                            <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Taille (cm)</label>
                            <input
                              type="number"
                              placeholder="175"
                              value={formData.height}
                              onChange={(e) => setFormData({ ...formData, height: e.target.value })}
                              className="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm focus:outline-none focus:ring-4 focus:ring-brand-600/10 transition-all bg-slate-50/50 text-slate-800"
                            />
                          </div>
                        </div>

                        <div className="space-y-1.5">
                          <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">N° d'Identité National (CNI)</label>
                          <input
                            type="text"
                            placeholder="N° CNI ou Passeport"
                            value={formData.nationalId}
                            onChange={(e) => setFormData({ ...formData, nationalId: e.target.value })}
                            className="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm focus:outline-none focus:ring-4 focus:ring-brand-600/10 transition-all bg-slate-50/50 text-slate-800"
                          />
                        </div>
                      </div>
                    )}

                    {activeModal === 'insurance' && (
                      <div className="space-y-4">
                        <div className="space-y-1.5">
                          <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Organisme d'Assurance / Mutuelle</label>
                          <input
                            type="text"
                            placeholder="Ex: CNPS, MUPRAC, AXA, ASCOMA..."
                            value={formData.insuranceName}
                            onChange={(e) => setFormData({ ...formData, insuranceName: e.target.value })}
                            className="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm focus:outline-none focus:ring-4 focus:ring-brand-600/10 transition-all bg-slate-50/50 text-slate-800"
                          />
                        </div>
                        <div className="space-y-1.5">
                          <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Numéro de carte d'assuré / Mutuelle</label>
                          <input
                            type="text"
                            placeholder="Ex: POL-987654-A"
                            value={formData.insuranceNumber}
                            onChange={(e) => setFormData({ ...formData, insuranceNumber: e.target.value })}
                            className="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm focus:outline-none focus:ring-4 focus:ring-brand-600/10 transition-all bg-slate-50/50 text-slate-800"
                          />
                        </div>
                      </div>
                    )}

                    {activeModal === 'allergies' && (
                      <div className="space-y-4">
                        <div className="space-y-1.5">
                          <div className="flex justify-between items-center">
                            <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Allergies Connues</label>
                            <span className="text-[10px] text-red-500 font-bold bg-red-50 px-2 py-0.5 rounded-full">Crucial pour l'IA</span>
                          </div>
                          <textarea
                            rows={2}
                            placeholder="Ex: Pénicilline, Ibuprofène, Aspirine, Paracétamol, Noix, Gluten..."
                            value={formData.allergies}
                            onChange={(e) => setFormData({ ...formData, allergies: e.target.value })}
                            className="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm focus:outline-none focus:ring-4 focus:ring-brand-600/10 transition-all bg-slate-50/50 resize-none text-slate-800"
                          />
                          <p className="text-[10px] text-slate-400 leading-tight">
                            Care IA analysera cette liste avant chaque conseil pour prévenir tout choc ou incident de médication.
                          </p>
                        </div>

                        <div className="space-y-1.5">
                          <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Antécédents & Maladies Chroniques</label>
                          <textarea
                            rows={2}
                            placeholder="Ex: Asthme, Diabète de type 1, Hypertension, Insuffisance rénale..."
                            value={formData.medicalHistory}
                            onChange={(e) => setFormData({ ...formData, medicalHistory: e.target.value })}
                            className="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm focus:outline-none focus:ring-4 focus:ring-brand-600/10 transition-all bg-slate-50/50 resize-none text-slate-800"
                          />
                        </div>

                        <div className="space-y-1.5">
                          <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Traitements en Cours</label>
                          <textarea
                            rows={2}
                            placeholder="Ex: Ventoline en cas de crise, Metformine 500mg, Coversyl..."
                            value={formData.currentTreatments}
                            onChange={(e) => setFormData({ ...formData, currentTreatments: e.target.value })}
                            className="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm focus:outline-none focus:ring-4 focus:ring-brand-600/10 transition-all bg-slate-50/50 resize-none text-slate-800"
                          />
                        </div>
                      </div>
                    )}

                    <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-3">
                      <button
                        type="button"
                        onClick={() => setActiveModal(null)}
                        className="bg-slate-100 hover:bg-slate-200 text-slate-700 px-5 py-2.5 rounded-xl font-bold transition-all text-xs"
                      >
                        Annuler
                      </button>
                      <button
                        type="submit"
                        disabled={saving || saveSuccess}
                        className={cn(
                          "px-6 py-2.5 rounded-xl font-bold text-white shadow-lg transition-all text-xs flex items-center gap-2",
                          saveSuccess
                            ? "bg-emerald-600 shadow-emerald-600/10"
                            : "bg-brand-600 hover:bg-brand-700 shadow-brand-600/10 hover:shadow-brand-600/25 active:scale-95 disabled:opacity-50"
                        )}
                      >
                        {saving ? "Enregistrement..." : saveSuccess ? (
                          <>
                            <CheckCircle2 size={16} /> Enregistré !
                          </>
                        ) : "Enregistrer"}
                      </button>
                    </div>
                  </form>
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}

function ProfileLink({ icon, label, trailing, onClick }: { icon: React.ReactNode; label: string; trailing?: string; onClick?: () => void }) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "w-full flex items-center justify-between p-5 hover:bg-slate-50 transition-colors border-b border-slate-50 last:border-none group",
        !onClick && "cursor-default hover:bg-transparent"
      )}
    >
      <div className="flex items-center gap-4">
        <div className="p-3 rounded-xl bg-slate-50 group-hover:bg-white transition-colors">{icon}</div>
        <span className="font-bold text-slate-800 text-left">{label}</span>
      </div>
      <div className="flex items-center gap-2">
        {trailing && <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 bg-slate-100 px-2 py-1 rounded-full">{trailing}</span>}
        {onClick && <ChevronRight size={18} className="text-slate-300 group-hover:text-slate-500 transition-colors" />}
      </div>
    </button>
  );
}

function OrderStatusBadge({ status }: { status: string }) {
  const config: Record<string, { label: string; bg: string; text: string }> = {
    pending_validation: { label: 'En attente', bg: 'bg-amber-100', text: 'text-amber-700' },
    validated: { label: 'Validée', bg: 'bg-blue-100', text: 'text-blue-700' },
    preparing: { label: 'En préparation', bg: 'bg-orange-100', text: 'text-orange-700' },
    en_cours: { label: 'En préparation', bg: 'bg-orange-100', text: 'text-orange-700' },
    out_for_delivery: { label: 'En livraison', bg: 'bg-indigo-100', text: 'text-indigo-700' },
    delivered: { label: 'Livré', bg: 'bg-emerald-100', text: 'text-emerald-700' },
    livre: { label: 'Livré', bg: 'bg-emerald-100', text: 'text-emerald-700' },
    rejected: { label: 'Rejetée', bg: 'bg-red-100', text: 'text-red-700' },
    annule: { label: 'Annulée', bg: 'bg-red-100', text: 'text-red-700' },
  };
  const c = config[status] || { label: status, bg: 'bg-slate-100', text: 'text-slate-700' };
  return (
    <span className={cn("px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest", c.bg, c.text)}>
      {c.label}
    </span>
  );
}

function FAQItem({ q, a }: { q: string; a: string }) {
  const [open, setOpen] = React.useState(false);
  return (
    <div className="border border-slate-100 rounded-2xl overflow-hidden">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between p-4 text-left hover:bg-slate-50 transition-colors"
      >
        <span className="text-sm font-bold text-slate-800 pr-4">{q}</span>
        <ChevronRight size={16} className={cn("text-slate-300 transition-transform shrink-0", open && "rotate-90")} />
      </button>
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden"
          >
            <p className="px-4 pb-4 text-xs text-slate-500 leading-relaxed">{a}</p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
