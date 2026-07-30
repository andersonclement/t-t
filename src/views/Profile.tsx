import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  User,
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
  Truck,
  Plus,
  Trash2,
  Edit,
  TrendingUp,
  Package,
  UserCheck,
  Copy,
  Check,
  Zap,
  ArrowRight,
  ShieldCheck,
  Pill,
  Sparkles,
  ThumbsUp,
} from 'lucide-react';
import { useAuth } from '../components/AuthContext';
import { useOrders } from '../components/OrderContext';
import { cn } from '../lib/utils';
import { inputCls, labelCls, PageContainer, StatCard } from '../components/ui';
import { useNavigate } from 'react-router-dom';
import { collection, query, where, onSnapshot, doc, setDoc, updateDoc, deleteDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

// ─── Helpers ────────────────────────────────────────────────

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
    hash = ((hash << 5) - hash) + seed.charCodeAt(i);
    hash |= 0;
  }
  const cells: boolean[] = [];
  for (let i = 0; i < 25; i++) {
    hash = ((hash * 1103515245) + 12345) & 0x7fffffff;
    cells.push(hash % 3 !== 0);
  }
  cells[0] = true; cells[1] = true; cells[4] = true;
  cells[5] = true; cells[20] = true; cells[24] = true;
  return cells;
}

// ─── Reusable stat card (matches Dashboard's PharmacistStatCard) ─────

// ─── Main Component ─────────────────────────────────────────

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
    birthDate: '', gender: 'Femme', bloodType: 'O+', weight: '', height: '', nationalId: '',
    insuranceName: '', insuranceNumber: '', allergies: '', medicalHistory: '', currentTreatments: '',
    licenseNumber: '', licenseIssuer: '', licenseDate: '', pharmacistTitle: '',
    pharmacyName: '', pharmacyAddress: '', pharmacyPhone: '', pharmacyHours: '', pharmacyEmail: '',
  });

  const [personalForm, setPersonalForm] = React.useState({ displayName: '', phoneNumber: '', address: '' });

  // ── Pharmacist: medications ──
  const [medications, setMedications] = React.useState<any[]>([]);
  const [medsLoading, setMedsLoading] = React.useState(false);

  React.useEffect(() => {
    if (profile?.role !== 'pharmacist') return;
    setMedsLoading(true);
    let unsubscribe = () => {};
    if (user) {
      const q = query(collection(db, 'medication_stock'), where('pharmacistId', '==', user.uid));
      unsubscribe = onSnapshot(q, (snap) => {
        let items: any[] = [];
        snap.forEach(d => items.push({ id: d.id, ...d.data() }));
        if (items.length === 0) { try { const s = localStorage.getItem('medimap_meds_stock'); if (s) items = JSON.parse(s); } catch {} }
        setMedications(items); setMedsLoading(false);
      }, () => {
        try { const s = localStorage.getItem('medimap_meds_stock'); if (s) setMedications(JSON.parse(s)); } catch {}
        setMedsLoading(false);
      });
    } else {
      try { const s = localStorage.getItem('medimap_meds_stock'); if (s) setMedications(JSON.parse(s)); } catch {}
      setMedsLoading(false);
    }
    return () => unsubscribe();
  }, [profile, user]);

  // ── Pharmacist: suppliers ──
  const [suppliers, setSuppliers] = React.useState<any[]>([]);
  const [suppliersLoading, setSuppliersLoading] = React.useState(false);
  const [isEditingSupplier, setIsEditingSupplier] = React.useState(false);
  const [editingSupplierId, setEditingSupplierId] = React.useState<string | null>(null);
  const [supplierForm, setSupplierForm] = React.useState({ name: '', email: '', phone: '', address: '' });

  React.useEffect(() => {
    if (profile?.role !== 'pharmacist') return;
    setSuppliersLoading(true);
    let unsubscribe = () => {};
    const defaultSups = [
      { id: 'sup-1', name: 'LABOREX DOUALA', email: 'douala@laborex.cm', phone: '+237 233 40 40 40', address: 'Zone Industrielle Bassa, Douala' },
      { id: 'sup-2', name: 'UBIPHARM CAMEROUN', email: 'cameroun@ubipharm.com', phone: '+237 233 43 43 43', address: 'Quartier Bonanjo, Douala' }
    ];
    if (user) {
      const q = query(collection(db, 'suppliers'), where('pharmacistId', '==', user.uid));
      unsubscribe = onSnapshot(q, (snap) => {
        let items: any[] = [];
        snap.forEach(d => items.push({ id: d.id, ...d.data() }));
        if (items.length === 0) {
          try { const s = localStorage.getItem('medimap_suppliers'); items = s ? JSON.parse(s) : defaultSups; if (!s) localStorage.setItem('medimap_suppliers', JSON.stringify(defaultSups)); } catch {}
        } else { localStorage.setItem('medimap_suppliers', JSON.stringify(items)); }
        setSuppliers(items); setSuppliersLoading(false);
      }, () => {
        try { const s = localStorage.getItem('medimap_suppliers'); if (s) setSuppliers(JSON.parse(s)); } catch {}
        setSuppliersLoading(false);
      });
    } else {
      try { const s = localStorage.getItem('medimap_suppliers'); setSuppliers(s ? JSON.parse(s) : defaultSups); if (!s) localStorage.setItem('medimap_suppliers', JSON.stringify(defaultSups)); } catch {}
      setSuppliersLoading(false);
    }
    return () => unsubscribe();
  }, [profile, user]);

  const handleAddSupplier = async (supData: typeof supplierForm) => {
    const newId = 'sup-' + Date.now();
    const newSup = { id: newId, ...supData, pharmacistId: user ? user.uid : 'guest' };
    if (user) { try { await setDoc(doc(db, 'suppliers', newId), newSup); } catch {} }
    else { const u = [...suppliers, newSup]; setSuppliers(u); localStorage.setItem('medimap_suppliers', JSON.stringify(u)); }
  };

  const handleUpdateSupplier = async (id: string, supData: typeof supplierForm) => {
    if (user) { try { await updateDoc(doc(db, 'suppliers', id), supData); } catch {} }
    else { const u = suppliers.map(s => s.id === id ? { ...s, ...supData } : s); setSuppliers(u); localStorage.setItem('medimap_suppliers', JSON.stringify(u)); }
  };

  const handleDeleteSupplier = async (id: string) => {
    if (!window.confirm("Êtes-vous sûr de vouloir supprimer ce fournisseur ?")) return;
    if (user) { try { await deleteDoc(doc(db, 'suppliers', id)); } catch {} }
    else { const u = suppliers.filter(s => s.id !== id); setSuppliers(u); localStorage.setItem('medimap_suppliers', JSON.stringify(u)); }
  };

  const lowStockMeds = medications.filter(med => {
    const min = med.minThreshold !== undefined ? Number(med.minThreshold) : 15;
    return Number(med.stock) <= min;
  });

  // ── Support ticket ──
  const [ticketData, setTicketData] = React.useState({ category: "Problème d'inventaire", subject: '', message: '' });
  const [ticketSending, setTicketSending] = React.useState(false);
  const [ticketSuccess, setTicketSuccess] = React.useState(false);
  const handleSendTicket = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!ticketData.subject || !ticketData.message) return;
    setTicketSending(true);
    try {
      await new Promise(r => setTimeout(r, 1500));
      setTicketSuccess(true);
      setTimeout(() => { setTicketSuccess(false); setTicketData({ category: "Problème d'inventaire", subject: '', message: '' }); setActiveModal(null); }, 2000);
    } catch {} finally { setTicketSending(false); }
  };

  // ── Security ──
  const [twoFactorEnabled, setTwoFactorEnabled] = React.useState(false);
  const handleToggle2FA = async () => {
    const next = !twoFactorEnabled; setTwoFactorEnabled(next);
    try { await updateUserProfile({ twoFactorEnabled: next }); } catch {}
  };
  const [resetSent, setResetSent] = React.useState(false);
  const [resetError, setResetError] = React.useState<string | null>(null);
  const handlePasswordReset = async () => {
    if (!user?.email) return;
    try { setResetError(null); await resetPassword(user.email); setResetSent(true); setTimeout(() => setResetSent(false), 5000); }
    catch (err: any) { setResetError(err.message || "Erreur de réinitialisation."); }
  };

  // ── Sync form from profile ──
  React.useEffect(() => {
    if (!profile) return;
    setFormData({
      birthDate: profile.birthDate || '', gender: profile.gender || 'Femme', bloodType: profile.bloodType || 'O+',
      weight: profile.weight || '', height: profile.height || '', nationalId: profile.nationalId || '',
      insuranceName: profile.insuranceName || '', insuranceNumber: profile.insuranceNumber || '',
      allergies: profile.allergies || '', medicalHistory: profile.medicalHistory || '', currentTreatments: profile.currentTreatments || '',
      licenseNumber: profile.licenseNumber || 'RP-2026-6743-A', licenseIssuer: profile.licenseIssuer || 'Ministère de la Santé Publique',
      licenseDate: profile.licenseDate || '2024-01-15', pharmacistTitle: profile.pharmacistTitle || 'Docteur en Pharmacie',
      pharmacyName: profile.pharmacyName || 'Pharmacie du Centre', pharmacyAddress: profile.pharmacyAddress || 'Avenue de la Liberté, Douala',
      pharmacyPhone: profile.pharmacyPhone || '+237 699 88 77 66', pharmacyHours: profile.pharmacyHours || '24h/24, 7j/7',
      pharmacyEmail: profile.pharmacyEmail || 'contact@pharmacieducentre.cm',
    });
    setPersonalForm({ displayName: profile.displayName || user?.displayName || '', phoneNumber: profile.phoneNumber || '', address: profile.address || '' });
    setTwoFactorEnabled(profile.twoFactorEnabled || false);
  }, [profile]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault(); setSaving(true); setErrorMessage(null); setSaveSuccess(false);
    try { await updateUserProfile(formData); setSaveSuccess(true); setTimeout(() => { setSaveSuccess(false); setActiveModal(null); }, 1500); }
    catch (err: any) { setErrorMessage(err.message || "Erreur lors de l'enregistrement."); }
    finally { setSaving(false); }
  };

  const handleSavePersonalInfo = async (e: React.FormEvent) => {
    e.preventDefault(); setSaving(true); setErrorMessage(null); setSaveSuccess(false);
    try { await updateUserProfile(personalForm); setSaveSuccess(true); setTimeout(() => { setSaveSuccess(false); setActiveModal(null); }, 1500); }
    catch (err: any) { setErrorMessage(err.message || "Erreur lors de l'enregistrement."); }
    finally { setSaving(false); }
  };

  // ── Computed ──
  const completionChecks = profile?.role === 'pharmacist'
    ? [
        { done: !!profile?.licenseNumber, label: 'Licence' },
        { done: !!profile?.pharmacyName, label: 'Officine' },
        { done: !!profile?.pharmacyPhone, label: 'Téléphone' },
        { done: !!profile?.pharmacyAddress, label: 'Adresse' },
        { done: !!profile?.pharmacyEmail, label: 'Email pro' },
        { done: suppliers.length > 0, label: 'Fournisseurs' },
      ]
    : [
        { done: !!profile?.birthDate, label: 'Naissance' },
        { done: !!profile?.gender, label: 'Genre' },
        { done: !!profile?.bloodType, label: 'Sang' },
        { done: !!(profile?.weight && profile?.height), label: 'Poids/Taille' },
        { done: !!profile?.insuranceName, label: 'Assurance' },
        { done: !!(profile?.allergies || profile?.medicalHistory), label: 'Antécédents' },
      ];
  const completedCount = completionChecks.filter(c => c.done).length;
  const completionPercent = Math.round((completedCount / completionChecks.length) * 100);

  const isMedicalComplete = profile?.birthDate && profile?.gender && profile?.bloodType && profile?.weight && profile?.height;
  const isInsuranceComplete = profile?.insuranceName && profile?.insuranceNumber;
  const isAllergiesFilled = profile?.allergies || profile?.medicalHistory;
  const memberSince = getMemberSinceLabel(profile);
  const qrCells = React.useMemo(() => generateDeterministicQR(user?.uid || 'default'), [user?.uid]);

  const handleCopyId = () => {
    if (!user?.uid) return;
    navigator.clipboard.writeText(user.uid).catch(() => {});
    setCopiedId(true); setTimeout(() => setCopiedId(false), 2000);
  };

  const activeOrdersCount = orders.filter(o => ['en_cours', 'pending_validation', 'preparing', 'validated'].includes(o.status)).length;
  const deliveredOrdersCount = orders.filter(o => o.status === 'delivered' || o.status === 'livre').length;

  const isPharmacist = profile?.role === 'pharmacist';

  // ─── Not logged in ──────────────────────────────────────────
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
        <button onClick={signInWithGoogle} className="bg-brand-600 text-white px-8 py-4 rounded-2xl font-bold flex items-center gap-2 hover:bg-brand-700 shadow-xl shadow-brand-600/20 transition-all active:scale-95">
          Se connecter avec Google
        </button>
      </div>
    );
  }

  // ─── Logged in ──────────────────────────────────────────────
  return (
    <PageContainer>
      {/* ──── Header (matches Dashboard pattern) ──── */}
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-4 md:gap-6 p-6 md:p-8 bg-white rounded-[2rem] md:rounded-[2.5rem] border border-slate-100 shadow-sm relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-brand-50 blur-3xl rounded-full -translate-y-1/2 translate-x-1/2 -z-10" />
        <div className="flex items-center gap-5 md:gap-6">
          {/* Avatar */}
          <div className="relative shrink-0">
            {user.photoURL ? (
              <img src={user.photoURL} className="w-16 h-16 md:w-20 md:h-20 rounded-2xl md:rounded-[1.5rem] object-cover ring-4 ring-brand-600/10" alt={`Photo de ${user.displayName || 'utilisateur'}`} />
            ) : (
              <div className="w-16 h-16 md:w-20 md:h-20 rounded-2xl md:rounded-[1.5rem] bg-gradient-to-br from-brand-500 to-brand-700 ring-4 ring-brand-600/10 flex items-center justify-center">
                <span className="text-white text-xl md:text-2xl font-display font-bold">{getInitials(user.displayName)}</span>
              </div>
            )}
            <button onClick={() => setActiveModal('personal_info')} className="absolute -bottom-1.5 -right-1.5 bg-brand-600 text-white p-1.5 rounded-lg shadow-lg border-2 border-white hover:bg-brand-700 transition-colors" title="Modifier le profil">
              <Edit size={10} />
            </button>
          </div>
          {/* Info */}
          <div className="space-y-1 min-w-0">
            <p className="text-xs text-slate-400 font-bold uppercase tracking-widest">Mon Profil</p>
            <h1 className="text-xl md:text-3xl font-display font-bold text-slate-900 truncate">
              {isPharmacist ? 'Dr. ' : ''}{user.displayName || 'Utilisateur'}
            </h1>
            <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
              <span className="text-[10px] md:text-xs text-slate-400 font-medium flex items-center gap-1"><Mail size={12} />{user.email}</span>
              {memberSince && <span className="text-[10px] md:text-xs text-slate-400 font-medium flex items-center gap-1"><Calendar size={12} />{memberSince}</span>}
              {profile?.phoneNumber && <span className="text-[10px] md:text-xs text-slate-400 font-medium flex items-center gap-1"><Phone size={12} />{profile.phoneNumber}</span>}
            </div>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2 md:gap-3">
          <div className="bg-emerald-100 text-emerald-700 px-3 md:px-4 py-1.5 md:py-2 rounded-xl text-[10px] md:text-xs font-bold uppercase tracking-widest flex items-center gap-2">
            <UserCheck size={14} /> {isPharmacist ? 'Pharmacien Certifié' : 'Patient Vérifié'}
          </div>
          <button onClick={handleCopyId} className="bg-slate-50 text-slate-400 hover:text-slate-600 px-3 py-1.5 md:py-2 rounded-xl text-[10px] font-mono flex items-center gap-1.5 border border-slate-100 transition-colors" title="Copier l'identifiant">
            {copiedId ? <Check size={12} className="text-emerald-500" /> : <Copy size={12} />}
            <span className="truncate max-w-[80px]">{user.uid}</span>
          </button>
          <button onClick={logout} className="bg-slate-50 text-slate-400 p-2.5 rounded-xl hover:bg-red-50 hover:text-red-500 transition-all border border-slate-100" title="Se déconnecter">
            <LogOut size={18} />
          </button>
        </div>
      </header>

      {/* ──── KPI Grid (matches Dashboard pattern) ──── */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
        <StatCard label={isPharmacist ? 'Ventes' : 'Commandes'} value={orders.length.toString()} icon={<Package className="text-purple-500" size={18} />} tone="bg-purple-50" />
        <StatCard label="En Cours" value={activeOrdersCount.toString()} icon={<Clock className="text-amber-500" size={18} />} tone="bg-amber-50" />
        <StatCard label="Livrées" value={deliveredOrdersCount.toString()} icon={<ThumbsUp className="text-emerald-500" size={18} />} tone="bg-emerald-50" />
        <StatCard label="Profil" value={`${completionPercent}%`} icon={<UserCheck className="text-brand-500" size={18} />} tone="bg-brand-50" />
      </div>

      {/* ──── Completion bar ──── */}
      <div className="bg-white rounded-[2rem] md:rounded-[2.5rem] p-5 md:p-6 border border-slate-100 shadow-sm space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-sm md:text-base font-display font-bold text-slate-900 flex items-center gap-2">
            <div className="w-1 h-5 bg-emerald-600 rounded-full" />
            Complétion du profil
          </h3>
          <span className={cn("text-[10px] md:text-xs font-bold px-2.5 py-1 rounded-full", completionPercent === 100 ? "bg-emerald-50 text-emerald-700" : "bg-amber-50 text-amber-700")}>
            {completedCount}/{completionChecks.length}
          </span>
        </div>
        <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
          <motion.div initial={{ width: 0 }} animate={{ width: `${completionPercent}%` }} transition={{ duration: 0.8, ease: 'easeOut' }}
            className={cn("h-full rounded-full", completionPercent === 100 ? "bg-emerald-500" : completionPercent >= 60 ? "bg-brand-500" : "bg-amber-500")} />
        </div>
        <div className="flex flex-wrap gap-1.5">
          {completionChecks.map((c, i) => (
            <span key={i} className={cn("text-[9px] md:text-[10px] font-bold px-2 py-0.5 rounded-lg border", c.done ? "bg-emerald-50 text-emerald-600 border-emerald-100" : "bg-slate-50 text-slate-400 border-slate-100")}>
              {c.done && <CheckCircle2 size={9} className="inline mr-0.5 -mt-0.5" />}{c.label}
            </span>
          ))}
        </div>
      </div>

      {/* ──── Main Content: 2/3 + 1/3 grid (matches Dashboard) ──── */}
      {!showOrders ? (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 md:gap-8">
          {/* Left: sections */}
          <div className="lg:col-span-2 space-y-6 md:space-y-8">
            {/* Health / Pharmacy section */}
            <section className="bg-white rounded-[2rem] md:rounded-[2.5rem] p-5 md:p-8 border border-slate-100 shadow-sm space-y-1">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-base md:text-xl font-display font-bold text-slate-900 flex items-center gap-2">
                  <div className="w-1 h-5 bg-emerald-600 rounded-full" />
                  {isPharmacist ? 'Ma Pharmacie' : 'Santé & Administratif'}
                </h3>
              </div>
              <ProfileLink icon={<User className="text-brand-500" />} label="Informations Personnelles" trailing={profile?.phoneNumber ? "Renseignées" : "À compléter"} onClick={() => setActiveModal('personal_info')} />
              {isPharmacist ? (
                <>
                  <ProfileLink icon={<FileText className="text-blue-500" />} label="Licence Professionnelle" trailing="Valide" onClick={() => setActiveModal('license')} />
                  <ProfileLink icon={<Building2 className="text-emerald-500" />} label="Informations Établissement" trailing={profile?.pharmacyName ? "Renseignées" : "À compléter"} onClick={() => setActiveModal('pharmacy_info')} />
                  <ProfileLink icon={<Shield className="text-slate-400" />} label="Paramètres de Sécurité" onClick={() => setActiveModal('security')} />
                  <ProfileLink icon={<Truck className="text-indigo-500" />} label="Gestion des Fournisseurs" trailing={suppliersLoading ? "..." : `${suppliers.length}`} onClick={() => setActiveModal('suppliers')} />
                </>
              ) : (
                <>
                  <ProfileLink icon={<FileText className="text-blue-500" />} label="Dossier Médical" trailing={isMedicalComplete ? "Complet" : "À renseigner"} onClick={() => setActiveModal('medical')} />
                  <ProfileLink icon={<CreditCard className="text-emerald-500" />} label="Carte Vitale / Mutuelle" trailing={isInsuranceComplete ? "Renseignée" : "À renseigner"} onClick={() => setActiveModal('insurance')} />
                  <ProfileLink icon={<Heart className="text-red-500" />} label="Antécédents & Allergies" trailing={isAllergiesFilled ? "Renseigné" : "À signaler !"} onClick={() => setActiveModal('allergies')} />
                  <ProfileLink icon={<Shield className="text-slate-400" />} label="Sécurité des données" trailing="Actif" onClick={() => setActiveModal('security')} />
                </>
              )}
            </section>

            {/* Quick Actions Grid (matches Dashboard) */}
            <section className="grid grid-cols-2 gap-3 md:gap-4">
              {(isPharmacist ? [
                { label: "Dashboard", sub: "Tableau de bord", icon: <TrendingUp className="text-emerald-600" />, color: "bg-emerald-50/50", action: () => navigate('/') },
                { label: "Inventaire", sub: "Gérer les stocks", icon: <Pill className="text-blue-600" />, color: "bg-blue-50/50", action: () => navigate('/inventory') },
                { label: "Commandes", sub: "Traiter les ventes", icon: <Truck className="text-violet-600" />, color: "bg-violet-50/50", action: () => navigate('/orders') },
                { label: "Care IA", sub: "Assistant intelligent", icon: <Sparkles className="text-amber-600" />, color: "bg-amber-50/50", action: () => navigate('/ai-sante') },
              ] : [
                { label: "Carte Santé", sub: "Pharmacies & garde", icon: <MapPin className="text-emerald-600" />, color: "bg-emerald-50/50", action: () => navigate('/map') },
                { label: "Commandes", sub: "Mon historique", icon: <ShoppingBag className="text-purple-600" />, color: "bg-purple-50/50", action: () => setShowOrders(true) },
                { label: "Répertoire", sub: "Établissements", icon: <Building2 className="text-blue-600" />, color: "bg-blue-50/50", action: () => navigate('/directory') },
                { label: "IA Santé", sub: "Conseils par IA", icon: <Zap className="text-violet-600" />, color: "bg-violet-50/50", action: () => navigate('/ai-sante') },
              ]).map((a, i) => (
                <motion.button key={i} whileHover={{ y: -3 }} whileTap={{ scale: 0.98 }} onClick={a.action}
                  className="group bg-white rounded-2xl md:rounded-[2rem] border border-slate-100 p-4 md:p-6 flex flex-col gap-3 md:gap-4 shadow-sm hover:shadow-lg transition-all text-left">
                  <div className={cn("p-3 md:p-4 rounded-xl md:rounded-2xl w-fit transition-transform group-hover:scale-110", a.color)}>
                    {React.cloneElement(a.icon as React.ReactElement, { size: 20 } as any)}
                  </div>
                  <div>
                    <h4 className="font-bold text-slate-900 text-xs md:text-sm">{a.label}</h4>
                    <p className="text-slate-400 text-[10px] md:text-xs mt-0.5">{a.sub}</p>
                  </div>
                  <ArrowRight size={14} className="text-slate-300 group-hover:text-brand-600 group-hover:translate-x-1 transition-all mt-auto" />
                </motion.button>
              ))}
            </section>
          </div>

          {/* Right Column */}
          <div className="space-y-6 md:space-y-8">
            {/* Activity / Orders */}
            <div className="bg-white rounded-[2rem] md:rounded-[2.5rem] p-5 md:p-6 border border-slate-100 shadow-sm space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-sm md:text-base font-display font-bold text-slate-900 flex items-center gap-2">
                  <div className="w-1 h-5 bg-emerald-600 rounded-full" />
                  {isPharmacist ? 'Activité' : 'Mes Commandes'}
                </h3>
                {isPharmacist
                  ? <button onClick={() => navigate('/orders')} className="text-[10px] md:text-xs font-bold text-brand-600 hover:underline">Commandes</button>
                  : <button onClick={() => setShowOrders(true)} className="text-[10px] md:text-xs font-bold text-brand-600 hover:underline">Tout voir</button>
                }
              </div>
              {isPharmacist ? (
                <div className="space-y-2">
                  <div className="flex items-center justify-between p-2.5 md:p-3 rounded-xl bg-amber-50/50 border border-amber-100">
                    <div className="flex items-center gap-2"><div className="w-2 h-2 rounded-full bg-amber-500" /><span className="text-[11px] md:text-xs font-medium text-amber-700">Alertes stock</span></div>
                    <span className="text-xs md:text-sm font-bold text-amber-700">{medsLoading ? '...' : lowStockMeds.length}</span>
                  </div>
                  <div className="flex items-center justify-between p-2.5 md:p-3 rounded-xl bg-purple-50/50 border border-purple-100">
                    <div className="flex items-center gap-2"><div className="w-2 h-2 rounded-full bg-purple-500" /><span className="text-[11px] md:text-xs font-medium text-purple-700">Fournisseurs</span></div>
                    <span className="text-xs md:text-sm font-bold text-purple-700">{suppliers.length}</span>
                  </div>
                </div>
              ) : (
                <div className="space-y-2">
                  {orders.slice(0, 3).map(order => (
                    <div key={order.id} className="flex items-center justify-between p-2.5 md:p-3 rounded-xl bg-slate-50 border border-slate-100">
                      <div className="flex items-center gap-2 min-w-0">
                        <Package size={14} className="text-slate-400 shrink-0" />
                        <span className="text-[11px] md:text-xs font-medium text-slate-600 truncate">#{order.id.substring(0, 8)}</span>
                      </div>
                      <OrderStatusBadge status={order.status} />
                    </div>
                  ))}
                  {orders.length === 0 && <p className="text-center text-slate-400 italic py-4 text-xs">Aucune commande.</p>}
                </div>
              )}
              <button onClick={isPharmacist ? () => setActiveModal('stock_alerts') : () => setShowOrders(true)}
                className="w-full bg-slate-900 text-white py-3 md:py-3.5 rounded-xl md:rounded-2xl font-bold text-xs md:text-sm flex items-center justify-center gap-2 hover:bg-slate-800 transition-colors">
                {isPharmacist ? <><Bell size={16} /> Voir les alertes</> : <><ShoppingBag size={16} /> Historique complet</>}
              </button>
            </div>

            {/* Pass Dokta / QR Card */}
            <div className="bg-gradient-to-br from-clinical-600 to-indigo-700 rounded-[2rem] md:rounded-[2.5rem] p-5 md:p-6 text-white space-y-4 relative overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 blur-[60px] rounded-full" />
              <div className="relative z-10 space-y-4">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 md:w-10 md:h-10 bg-white/10 rounded-lg md:rounded-xl flex items-center justify-center">
                    <ShieldCheck size={16} className="text-blue-200 md:w-5 md:h-5" />
                  </div>
                  <div>
                    <h3 className="font-display font-bold text-sm md:text-base">Pass Dokta</h3>
                    <p className="text-[9px] md:text-[10px] text-blue-200 font-bold uppercase tracking-widest">QR Santé</p>
                  </div>
                </div>
                <div className="bg-white p-3 rounded-2xl w-full aspect-square max-w-[160px] mx-auto flex items-center justify-center">
                  <div className="grid grid-cols-5 gap-1 p-2">
                    {qrCells.map((filled, i) => (
                      <div key={i} className={cn("w-3 h-3 md:w-3.5 md:h-3.5 rounded-sm", filled ? "bg-slate-800" : "bg-slate-100")} />
                    ))}
                  </div>
                </div>
                <p className="text-blue-100 text-[10px] md:text-xs text-center leading-relaxed">
                  Présentez ce code en pharmacie pour un accès instantané à votre profil.
                </p>
              </div>
            </div>

            {/* Help links */}
            <div className="bg-white rounded-[2rem] md:rounded-[2.5rem] p-5 md:p-6 border border-slate-100 shadow-sm space-y-1">
              {isPharmacist && (
                <ProfileLink icon={<HelpCircle className="text-slate-400" />} label="Support Pro" onClick={() => setActiveModal('support')} />
              )}
              <ProfileLink icon={<HelpCircle className="text-slate-400" />} label="Centre d'aide / FAQ" onClick={() => setActiveModal('faq')} />
            </div>
          </div>
        </div>
      ) : (
        /* ──── Order History View ──── */
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h3 className="text-base md:text-xl font-display font-bold text-slate-900 flex items-center gap-2">
              <div className="w-1 h-5 bg-emerald-600 rounded-full" />
              Historique de commandes
            </h3>
            <button onClick={() => setShowOrders(false)} className="text-xs md:text-sm font-bold text-brand-600 hover:underline">Retour au profil</button>
          </div>

          {/* Orders summary KPI */}
          <div className="grid grid-cols-3 gap-3 md:gap-4">
            <StatCard label="Total" value={orders.length.toString()} icon={<Package className="text-purple-500" size={18} />} tone="bg-purple-50" />
            <StatCard label="En Cours" value={activeOrdersCount.toString()} icon={<Clock className="text-amber-500" size={18} />} tone="bg-amber-50" />
            <StatCard label="Livrées" value={deliveredOrdersCount.toString()} icon={<CheckCircle2 className="text-emerald-500" size={18} />} tone="bg-emerald-50" />
          </div>

          <div className="space-y-4">
            {orders.length > 0 ? orders.map(order => (
              <div key={order.id} onClick={() => setExpandedOrderId(expandedOrderId === order.id ? null : order.id)}
                className={cn("bg-white rounded-[2rem] border transition-all cursor-pointer overflow-hidden", expandedOrderId === order.id ? "ring-2 ring-brand-600 border-transparent shadow-xl" : "border-slate-100 shadow-sm hover:shadow-md")}>
                <div className="p-5 md:p-6 space-y-4">
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{order.id}</p>
                      <p className="text-sm font-bold text-slate-900">{order.date}</p>
                    </div>
                    <div className="flex flex-col items-end gap-2">
                      <OrderStatusBadge status={order.status} />
                      <ChevronRight size={16} className={cn("text-slate-300 transition-transform", expandedOrderId === order.id && "rotate-90")} />
                    </div>
                  </div>
                  {expandedOrderId !== order.id && (
                    <div className="flex gap-2 overflow-x-auto pb-2 no-scrollbar">
                      {order.items.map((item, idx) => (
                        <div key={idx} className="flex-shrink-0 w-10 h-10 md:w-12 md:h-12 bg-slate-50 rounded-xl border border-slate-100 flex items-center justify-center overflow-hidden">
                          {item.image ? <img src={item.image} className="w-full h-full object-cover" alt={item.name} /> : <ShoppingBag size={16} className="text-slate-300" />}
                        </div>
                      ))}
                    </div>
                  )}
                  {expandedOrderId === order.id && (
                    <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} className="space-y-3 pt-4 border-t border-slate-50">
                      {order.items.map((item, idx) => (
                        <div key={idx} className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-slate-50 rounded-lg flex items-center justify-center border border-slate-100 overflow-hidden">
                              {item.image ? <img src={item.image} className="w-full h-full object-cover" alt={item.name} /> : <ShoppingBag size={14} className="text-slate-300" />}
                            </div>
                            <div>
                              <p className="text-sm font-bold text-slate-800">{item.name}</p>
                              <p className="text-[10px] text-slate-400 font-medium">{item.price.toLocaleString()} FCFA / unité</p>
                            </div>
                          </div>
                          <div className="text-right">
                            <p className="text-xs font-bold text-slate-900">{item.count}x</p>
                            <p className="text-xs font-bold text-brand-600">{(item.price * item.count).toLocaleString()} F</p>
                          </div>
                        </div>
                      ))}
                    </motion.div>
                  )}
                  <div className="flex justify-between items-center pt-4 border-t border-slate-50">
                    <div>
                      <p className="text-[10px] text-slate-400 font-bold uppercase">Paiement</p>
                      <p className="text-xs font-bold text-slate-700">{order.paymentMethod?.toUpperCase()}</p>
                    </div>
                    <p className="text-lg md:text-xl font-display font-bold text-brand-600">{order.total.toLocaleString()} FCFA</p>
                  </div>
                </div>
              </div>
            )) : (
              <div className="bg-white p-12 rounded-[2rem] border border-slate-100 text-center space-y-3">
                <ShoppingBag size={40} className="mx-auto text-slate-200" />
                <p className="font-bold text-slate-600 text-sm">Aucune commande</p>
                <p className="text-xs text-slate-400">Vos commandes apparaîtront ici.</p>
                <button onClick={() => { setShowOrders(false); navigate('/'); }} className="text-brand-600 font-bold text-xs hover:underline">Parcourir les produits</button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ──── Modals ──── */}
      <AnimatePresence>
        {activeModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setActiveModal(null)} className="absolute inset-0 bg-slate-950/40 backdrop-blur-sm" />
            <motion.div initial={{ opacity: 0, scale: 0.95, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="bg-white w-full max-w-lg rounded-[2rem] md:rounded-[2.5rem] border border-slate-100 shadow-2xl overflow-hidden relative z-10 flex flex-col max-h-[90vh]">
              {/* Modal Header */}
              <div className="p-5 md:p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50/50 shrink-0">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 bg-brand-50 rounded-xl md:rounded-2xl text-brand-600">
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
                    <h4 className="font-display font-bold text-slate-900 text-left text-sm md:text-base">
                      {({
                        personal_info: "Informations Personnelles", medical: "Dossier Médical", insurance: "Carte Vitale / Assurance",
                        allergies: "Antécédents & Allergies", security: "Sécurité des Données", license: "Licence Professionnelle",
                        pharmacy_info: "Informations Établissement", stock_alerts: "Alertes de Stock", support: "Support Professionnel",
                        suppliers: "Gestion des Fournisseurs", faq: "Centre d'aide",
                      } as any)[activeModal]}
                    </h4>
                  </div>
                </div>
                <button onClick={() => setActiveModal(null)} className="p-2 hover:bg-slate-100 text-slate-400 hover:text-slate-600 rounded-xl transition-all">
                  <X size={20} />
                </button>
              </div>

              {/* Modal Body */}
              <div className="p-5 md:p-8 overflow-y-auto space-y-5 flex-1 text-left">
                {errorMessage && (
                  <div className="p-3 bg-red-50 text-red-700 rounded-xl text-xs font-semibold flex items-center gap-2">
                    <AlertTriangle size={14} className="shrink-0" />{errorMessage}
                  </div>
                )}

                {activeModal === 'personal_info' && <ModalPersonalInfo form={personalForm} setForm={setPersonalForm} email={user.email || ''} saving={saving} saveSuccess={saveSuccess} onSave={handleSavePersonalInfo} onClose={() => setActiveModal(null)} />}
                {activeModal === 'faq' && <ModalFAQ onClose={() => setActiveModal(null)} />}
                {activeModal === 'security' && <ModalSecurity isPharmacist={!!isPharmacist} twoFactorEnabled={twoFactorEnabled} onToggle2FA={handleToggle2FA} email={user.email || ''} resetSent={resetSent} resetError={resetError} onPasswordReset={handlePasswordReset} onClose={() => setActiveModal(null)} />}
                {activeModal === 'stock_alerts' && <ModalStockAlerts medsLoading={medsLoading} lowStockMeds={lowStockMeds} onClose={() => setActiveModal(null)} onGoInventory={() => { setActiveModal(null); navigate('/inventory'); }} />}
                {activeModal === 'support' && <ModalSupport ticketData={ticketData} setTicketData={setTicketData} ticketSending={ticketSending} ticketSuccess={ticketSuccess} onSendTicket={handleSendTicket} onClose={() => setActiveModal(null)} />}
                {activeModal === 'suppliers' && <ModalSuppliers suppliers={suppliers} isEditing={isEditingSupplier} editingId={editingSupplierId} form={supplierForm} setForm={setSupplierForm} setIsEditing={setIsEditingSupplier} setEditingId={setEditingSupplierId} onAdd={handleAddSupplier} onUpdate={handleUpdateSupplier} onDelete={handleDeleteSupplier} onClose={() => setActiveModal(null)} />}
                {['medical', 'insurance', 'allergies', 'license', 'pharmacy_info'].includes(activeModal!) && (
                  <ModalForm activeModal={activeModal!} formData={formData} setFormData={setFormData} saving={saving} saveSuccess={saveSuccess} onSave={handleSave} onClose={() => setActiveModal(null)} />
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </PageContainer>
  );
}

// ─── Sub-Components ──────────────────────────────────────────

function ProfileLink({ icon, label, trailing, onClick }: { icon: React.ReactNode; label: string; trailing?: string; onClick?: () => void }) {
  return (
    <button onClick={onClick}
      className={cn("w-full flex items-center justify-between p-4 md:p-5 hover:bg-slate-50 transition-colors border-b border-slate-50 last:border-none group", !onClick && "cursor-default hover:bg-transparent")}>
      <div className="flex items-center gap-3 md:gap-4">
        <div className="p-2.5 md:p-3 rounded-xl bg-slate-50 group-hover:bg-white transition-colors">{icon}</div>
        <span className="font-bold text-slate-800 text-sm md:text-base text-left">{label}</span>
      </div>
      <div className="flex items-center gap-2">
        {trailing && <span className="text-[9px] md:text-[10px] font-bold uppercase tracking-wider text-slate-400 bg-slate-100 px-2 py-1 rounded-full">{trailing}</span>}
        {onClick && <ChevronRight size={16} className="text-slate-300 group-hover:text-slate-500 transition-colors" />}
      </div>
    </button>
  );
}

function OrderStatusBadge({ status }: { status: string }) {
  const c: Record<string, { l: string; bg: string }> = {
    pending_validation: { l: 'En attente', bg: 'bg-amber-100 text-amber-700' },
    validated: { l: 'Validée', bg: 'bg-blue-100 text-blue-700' },
    preparing: { l: 'Préparation', bg: 'bg-orange-100 text-orange-700' },
    en_cours: { l: 'En cours', bg: 'bg-orange-100 text-orange-700' },
    out_for_delivery: { l: 'Livraison', bg: 'bg-indigo-100 text-indigo-700' },
    delivered: { l: 'Livré', bg: 'bg-emerald-100 text-emerald-700' },
    livre: { l: 'Livré', bg: 'bg-emerald-100 text-emerald-700' },
    rejected: { l: 'Rejetée', bg: 'bg-red-100 text-red-700' },
    annule: { l: 'Annulée', bg: 'bg-red-100 text-red-700' },
  };
  const s = c[status] || { l: status, bg: 'bg-slate-100 text-slate-700' };
  return <span className={cn("px-2 py-0.5 rounded-md text-[9px] md:text-[10px] font-bold uppercase tracking-wider", s.bg)}>{s.l}</span>;
}

// ─── Modal sub-components ────────────────────────────────────


function ModalFooter({ saving, saveSuccess, onClose, onSave }: { saving: boolean; saveSuccess: boolean; onClose: () => void; onSave?: (e: React.FormEvent) => void }) {
  return (
    <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-3">
      <button type="button" onClick={onClose} className="bg-slate-100 hover:bg-slate-200 text-slate-700 px-5 py-2.5 rounded-xl font-bold transition-all text-xs">Annuler</button>
      <button type="submit" disabled={saving || saveSuccess}
        className={cn("px-6 py-2.5 rounded-xl font-bold text-white shadow-lg transition-all text-xs flex items-center gap-2", saveSuccess ? "bg-emerald-600 shadow-emerald-600/10" : "bg-brand-600 hover:bg-brand-700 shadow-brand-600/10 active:scale-95 disabled:opacity-50")}>
        {saving ? "Enregistrement..." : saveSuccess ? <><CheckCircle2 size={16} /> Enregistré !</> : "Enregistrer"}
      </button>
    </div>
  );
}

function ModalPersonalInfo({ form, setForm, email, saving, saveSuccess, onSave, onClose }: any) {
  return (
    <form onSubmit={onSave} className="space-y-4">
      <div className="space-y-1.5"><label className={labelCls}>Nom complet</label><input type="text" placeholder="Votre nom et prénom" value={form.displayName} onChange={e => setForm({ ...form, displayName: e.target.value })} className={inputCls} /></div>
      <div className="space-y-1.5"><label className={labelCls}>Numéro de téléphone</label><input type="tel" placeholder="+237 6XX XXX XXX" value={form.phoneNumber} onChange={e => setForm({ ...form, phoneNumber: e.target.value })} className={inputCls} /></div>
      <div className="space-y-1.5"><label className={labelCls}>Adresse</label><input type="text" placeholder="Quartier, Ville" value={form.address} onChange={e => setForm({ ...form, address: e.target.value })} className={inputCls} /></div>
      <div className="bg-slate-50 p-3 rounded-xl border border-slate-100 space-y-0.5">
        <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Adresse email</p>
        <p className="text-sm text-slate-600 font-medium">{email}</p>
      </div>
      <ModalFooter saving={saving} saveSuccess={saveSuccess} onClose={onClose} />
    </form>
  );
}

function ModalFAQ({ onClose }: { onClose: () => void }) {
  const items = [
    { q: "Comment passer une commande ?", a: "Rendez-vous sur l'accueil, parcourez les produits disponibles et ajoutez-les à votre panier. Finalisez votre commande en choisissant un mode de paiement." },
    { q: "Comment suivre ma commande ?", a: "Accédez à votre profil, puis cliquez sur 'Historique de commandes'. Chaque commande affiche son statut en temps réel." },
    { q: "Comment mettre à jour mon dossier médical ?", a: "Dans votre profil, cliquez sur 'Dossier Médical' pour renseigner vos informations de santé." },
    { q: "Mes données sont-elles sécurisées ?", a: "Oui, toutes vos données sont cryptées de bout en bout (AES-256). Seuls vous et les professionnels de santé autorisés peuvent y accéder." },
    { q: "Comment contacter le support ?", a: "Si vous êtes pharmacien, utilisez le 'Support Professionnel'. Sinon, envoyez un email à support@dokta.cm." },
  ];
  return (
    <div className="space-y-3">
      {items.map((item, i) => <FAQItem key={i} {...item} />)}
      <div className="pt-4 border-t border-slate-100 flex justify-end">
        <button onClick={onClose} className="bg-slate-900 text-white px-6 py-2.5 rounded-xl font-bold hover:bg-slate-800 transition-all text-xs">Fermer</button>
      </div>
    </div>
  );
}

function FAQItem({ q, a }: { q: string; a: string }) {
  const [open, setOpen] = React.useState(false);
  return (
    <div className="border border-slate-100 rounded-xl overflow-hidden">
      <button type="button" onClick={() => setOpen(!open)} className="w-full flex items-center justify-between p-3 md:p-4 text-left hover:bg-slate-50 transition-colors">
        <span className="text-xs md:text-sm font-bold text-slate-800 pr-4">{q}</span>
        <ChevronRight size={14} className={cn("text-slate-300 transition-transform shrink-0", open && "rotate-90")} />
      </button>
      <AnimatePresence>
        {open && <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
          <p className="px-3 md:px-4 pb-3 md:pb-4 text-[11px] md:text-xs text-slate-500 leading-relaxed">{a}</p>
        </motion.div>}
      </AnimatePresence>
    </div>
  );
}

function ModalSecurity({ isPharmacist, twoFactorEnabled, onToggle2FA, email, resetSent, resetError, onPasswordReset, onClose }: any) {
  return (
    <div className="space-y-5">
      {isPharmacist ? (
        <>
          <div className="bg-slate-50 p-4 rounded-xl flex items-center justify-between border border-slate-100">
            <div className="space-y-1"><h5 className="text-xs md:text-sm font-bold text-slate-800">Double Authentification (2FA)</h5><p className="text-[10px] md:text-xs text-slate-500 max-w-xs">Sécurisez l'accès en exigeant un code unique à la connexion.</p></div>
            <button type="button" onClick={onToggle2FA} role="switch" aria-checked={twoFactorEnabled} className={cn("relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors", twoFactorEnabled ? "bg-brand-600" : "bg-slate-200")}>
              <span className={cn("pointer-events-none inline-block h-5 w-5 rounded-full bg-white shadow transition", twoFactorEnabled ? "translate-x-5" : "translate-x-0")} />
            </button>
          </div>
          <div className="bg-slate-50 p-4 rounded-xl space-y-3 border border-slate-100">
            <div className="flex items-center gap-2 text-slate-800"><Lock size={16} className="text-brand-600" /><h5 className="text-xs md:text-sm font-bold">Réinitialiser le mot de passe</h5></div>
            <p className="text-[10px] md:text-xs text-slate-500">Envoyer un lien de réinitialisation à <strong className="text-slate-700">{email}</strong>.</p>
            {resetSent ? <div className="p-3 bg-emerald-50 text-emerald-800 text-xs rounded-xl font-bold flex items-center gap-2"><CheckCircle2 size={14} /> Email envoyé !</div>
            : <button type="button" onClick={onPasswordReset} className="bg-white hover:bg-slate-100 text-slate-800 border border-slate-200 px-4 py-2 rounded-xl text-xs font-bold transition-all active:scale-95 flex items-center gap-1.5"><RefreshCw size={12} /> Envoyer</button>}
            {resetError && <p className="text-xs font-semibold text-red-600">{resetError}</p>}
          </div>
        </>
      ) : (
        <div className="space-y-4 text-slate-600 text-xs md:text-sm leading-relaxed">
          {[
            { icon: <CheckCircle2 size={16} />, title: "Cryptage de bout en bout", desc: "Vos données de santé sont cryptées et stockées de manière sécurisée." },
            { icon: <Bot size={16} />, title: "IA préventive", desc: "Care IA analyse vos allergies et antécédents pour prévenir les risques d'interaction médicamenteuse." },
            { icon: <Activity size={16} />, title: "Anticipation de renouvellement", desc: "L'IA détecte si vos traitements nécessitent des commandes récurrentes." },
          ].map((item, i) => (
            <div key={i} className="flex gap-3 items-start"><div className="p-1.5 bg-emerald-50 rounded-lg text-emerald-600 mt-0.5 shrink-0">{item.icon}</div><p><strong>{item.title} :</strong> {item.desc}</p></div>
          ))}
        </div>
      )}
      <div className="pt-4 border-t border-slate-100 flex justify-end">
        <button onClick={onClose} className="bg-slate-900 text-white px-6 py-2.5 rounded-xl font-bold hover:bg-slate-800 transition-all text-xs">Compris</button>
      </div>
    </div>
  );
}

function ModalStockAlerts({ medsLoading, lowStockMeds, onClose, onGoInventory }: any) {
  if (medsLoading) return <div className="flex flex-col items-center justify-center py-12 space-y-3"><div className="w-8 h-8 border-4 border-brand-600 border-t-transparent rounded-full animate-spin" /><p className="text-slate-500 text-xs">Analyse du stock...</p></div>;
  if (lowStockMeds.length === 0) return (
    <div className="text-center py-12 space-y-3">
      <div className="w-14 h-14 bg-emerald-50 rounded-full flex items-center justify-center text-emerald-600 mx-auto"><CheckCircle2 size={32} /></div>
      <h5 className="font-bold text-slate-800 text-sm">Aucune alerte</h5>
      <p className="text-slate-400 text-xs max-w-xs mx-auto">Tous vos produits sont au-dessus des seuils d'alerte.</p>
    </div>
  );
  return (
    <div className="space-y-4">
      <div className="p-3 bg-amber-50 text-amber-800 text-xs rounded-xl font-medium flex items-start gap-2 border border-amber-100"><AlertTriangle size={16} className="shrink-0 mt-0.5" /><p><strong>{lowStockMeds.length} médicaments</strong> nécessitent un réapprovisionnement.</p></div>
      <div className="max-h-72 overflow-y-auto space-y-2 divide-y divide-slate-100">
        {lowStockMeds.map((med: any) => (
          <div key={med.id} className="flex items-center justify-between py-2.5 first:pt-0">
            <div className="space-y-0.5"><p className="text-xs md:text-sm font-bold text-slate-800">{med.name}</p><p className="text-[10px] text-slate-400 font-medium">Dosage: {med.dosage} · Seuil: {med.minThreshold || 15}</p></div>
            <span className={cn("px-2 py-1 rounded-lg text-[10px] md:text-xs font-bold", med.stock === 0 ? "bg-red-100 text-red-700" : "bg-amber-100 text-amber-700")}>Stock: {med.stock}</span>
          </div>
        ))}
      </div>
      <div className="pt-4 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-end gap-3">
        <button type="button" onClick={onClose} className="w-full sm:w-auto bg-slate-100 hover:bg-slate-200 text-slate-700 px-5 py-2.5 rounded-xl font-bold text-xs">Fermer</button>
        <button type="button" onClick={onGoInventory} className="w-full sm:w-auto bg-brand-600 hover:bg-brand-700 text-white px-5 py-2.5 rounded-xl font-bold shadow-lg shadow-brand-600/10 active:scale-95 text-xs flex items-center justify-center gap-1.5">Inventaire <ChevronRight size={14} /></button>
      </div>
    </div>
  );
}

function ModalSupport({ ticketData, setTicketData, ticketSending, ticketSuccess, onSendTicket, onClose }: any) {
  if (ticketSuccess) return (
    <div className="text-center py-8 space-y-3">
      <div className="w-14 h-14 bg-emerald-50 rounded-full flex items-center justify-center text-emerald-600 mx-auto"><CheckCircle2 size={32} /></div>
      <h5 className="font-bold text-slate-800 text-sm">Ticket envoyé !</h5>
      <p className="text-slate-400 text-xs max-w-xs mx-auto">Notre équipe vous recontactera sous 2 heures.</p>
    </div>
  );
  return (
    <form onSubmit={onSendTicket} className="space-y-4">
      <div className="grid grid-cols-2 gap-3 bg-slate-50 p-3 rounded-xl border border-slate-100">
        <a href="tel:+237670000000" className="flex flex-col items-center p-2 bg-white hover:bg-slate-50 border border-slate-100 rounded-xl text-center transition-all">
          <Phone size={14} className="text-brand-600 mb-1" /><span className="text-[10px] font-bold text-slate-700">Ligne Directe</span><span className="text-[9px] text-slate-400">+237 670 000 000</span>
        </a>
        <div className="flex flex-col items-center p-2 bg-white border border-slate-100 rounded-xl text-center">
          <Mail size={14} className="text-emerald-600 mb-1" /><span className="text-[10px] font-bold text-slate-700">Email Pro</span><span className="text-[9px] text-slate-400">pro-support@dokta.cm</span>
        </div>
      </div>
      <div className="space-y-1"><label className={labelCls}>Catégorie</label><select value={ticketData.category} onChange={e => setTicketData({ ...ticketData, category: e.target.value })} className={inputCls + " font-medium"}>
        <option value="Problème d'inventaire">Inventaire / Stock</option><option value="Erreur de facturation">Facturation / Paiement</option><option value="Dysfonctionnement technique">Bug technique</option><option value="Autre">Autre</option>
      </select></div>
      <div className="space-y-1"><label className={labelCls}>Objet</label><input type="text" placeholder="Ex: Erreur d'affichage du stock..." required value={ticketData.subject} onChange={e => setTicketData({ ...ticketData, subject: e.target.value })} className={inputCls} /></div>
      <div className="space-y-1"><label className={labelCls}>Description</label><textarea rows={3} placeholder="Décrivez le problème..." required value={ticketData.message} onChange={e => setTicketData({ ...ticketData, message: e.target.value })} className={inputCls + " resize-none"} /></div>
      <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-3">
        <button type="button" onClick={onClose} className="bg-slate-100 hover:bg-slate-200 text-slate-700 px-5 py-2.5 rounded-xl font-bold text-xs">Annuler</button>
        <button type="submit" disabled={ticketSending} className="bg-brand-600 hover:bg-brand-700 text-white px-6 py-2.5 rounded-xl font-bold shadow-lg shadow-brand-600/10 active:scale-95 disabled:opacity-50 text-xs flex items-center gap-1.5">
          {ticketSending ? "Envoi..." : <><Send size={14} /> Envoyer</>}
        </button>
      </div>
    </form>
  );
}

function ModalSuppliers({ suppliers, isEditing, editingId, form, setForm, setIsEditing, setEditingId, onAdd, onUpdate, onDelete, onClose }: any) {
  return (
    <div className="space-y-4">
      {isEditing ? (
        <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 space-y-3">
          <h5 className="font-bold text-[10px] md:text-xs text-slate-700 uppercase tracking-wider">{editingId ? "Modifier" : "Nouveau Fournisseur"}</h5>
          <div className="space-y-3">
            <div><label className="text-[10px] font-black uppercase text-slate-400 block mb-1">Nom *</label><input type="text" required placeholder="Ex: LABOREX DOUALA" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2.5 text-xs font-semibold focus:ring-2 focus:ring-brand-600/10 outline-none text-slate-800" /></div>
            <div className="grid grid-cols-2 gap-3">
              <div><label className="text-[10px] font-black uppercase text-slate-400 block mb-1">Téléphone</label><input type="text" placeholder="+237 6..." value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2.5 text-xs font-semibold focus:ring-2 focus:ring-brand-600/10 outline-none text-slate-800" /></div>
              <div><label className="text-[10px] font-black uppercase text-slate-400 block mb-1">Email</label><input type="email" placeholder="contact@..." value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2.5 text-xs font-semibold focus:ring-2 focus:ring-brand-600/10 outline-none text-slate-800" /></div>
            </div>
            <div><label className="text-[10px] font-black uppercase text-slate-400 block mb-1">Adresse</label><input type="text" placeholder="Zone Industrielle Bassa, Douala" value={form.address} onChange={e => setForm({ ...form, address: e.target.value })} className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2.5 text-xs font-semibold focus:ring-2 focus:ring-brand-600/10 outline-none text-slate-800" /></div>
            <div className="flex gap-2 justify-end pt-2">
              <button type="button" onClick={() => { setIsEditing(false); setEditingId(null); setForm({ name: '', email: '', phone: '', address: '' }); }} className="px-3.5 py-2 bg-white border border-slate-200 text-slate-600 rounded-xl text-xs font-bold hover:bg-slate-50">Annuler</button>
              <button type="button" onClick={async () => { if (!form.name.trim()) { alert("Nom obligatoire."); return; } if (editingId) await onUpdate(editingId, form); else await onAdd(form); setIsEditing(false); setEditingId(null); setForm({ name: '', email: '', phone: '', address: '' }); }}
                className="px-4 py-2 bg-brand-600 hover:bg-brand-700 text-white rounded-xl text-xs font-bold shadow-md shadow-brand-600/10">Enregistrer</button>
            </div>
          </div>
        </div>
      ) : (
        <div className="flex justify-between items-center bg-slate-50 p-3 rounded-xl border border-slate-100">
          <span className="text-xs text-slate-500 font-semibold">{suppliers.length} fournisseur(s)</span>
          <button type="button" onClick={() => { setForm({ name: '', email: '', phone: '', address: '' }); setEditingId(null); setIsEditing(true); }} className="px-3.5 py-2 bg-brand-600 hover:bg-brand-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-md shadow-brand-600/10"><Plus size={14} /> Ajouter</button>
        </div>
      )}
      <div className="space-y-2 max-h-[300px] overflow-y-auto">
        {suppliers.map((sup: any) => (
          <div key={sup.id} className="p-3 bg-white rounded-xl border border-slate-100 shadow-sm flex justify-between items-start gap-3 hover:border-slate-200 transition-all">
            <div className="space-y-1 text-left min-w-0">
              <h6 className="font-bold text-slate-800 text-xs md:text-sm truncate">{sup.name}</h6>
              <div className="flex flex-wrap gap-x-3 gap-y-0.5 text-[10px] text-slate-500 font-semibold">
                {sup.phone && <span className="flex items-center gap-1"><Phone size={10} />{sup.phone}</span>}
                {sup.email && <span className="flex items-center gap-1"><Mail size={10} />{sup.email}</span>}
              </div>
            </div>
            <div className="flex gap-1 shrink-0">
              <button type="button" onClick={() => { setForm({ name: sup.name, email: sup.email || '', phone: sup.phone || '', address: sup.address || '' }); setEditingId(sup.id); setIsEditing(true); }} className="p-1.5 bg-slate-50 hover:bg-slate-100 text-slate-500 rounded-lg" title="Modifier"><Edit size={12} /></button>
              <button type="button" onClick={() => onDelete(sup.id)} className="p-1.5 bg-rose-50 hover:bg-rose-100 text-rose-500 rounded-lg" title="Supprimer"><Trash2 size={12} /></button>
            </div>
          </div>
        ))}
        {suppliers.length === 0 && <div className="text-center py-8 text-xs text-slate-400 italic bg-slate-50 rounded-xl border border-dashed border-slate-200">Aucun fournisseur configuré.</div>}
      </div>
      <div className="pt-4 border-t border-slate-100 flex justify-end">
        <button type="button" onClick={onClose} className="bg-slate-900 hover:bg-slate-800 text-white px-5 py-2.5 rounded-xl font-bold text-xs">Fermer</button>
      </div>
    </div>
  );
}

function ModalForm({ activeModal, formData, setFormData, saving, saveSuccess, onSave, onClose }: any) {
  return (
    <form onSubmit={onSave} className="space-y-4">
      {activeModal === 'license' && (
        <>
          <div className="p-3 bg-brand-50/50 text-brand-800 text-xs rounded-xl font-medium border border-brand-100 leading-relaxed">Licence validée par le Ministère de la Santé.</div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5"><label className={labelCls}>Numéro de Licence</label><input type="text" value={formData.licenseNumber} onChange={e => setFormData({ ...formData, licenseNumber: e.target.value })} className={inputCls + " font-mono"} /></div>
            <div className="space-y-1.5"><label className={labelCls}>Date de Délivrance</label><input type="date" value={formData.licenseDate} onChange={e => setFormData({ ...formData, licenseDate: e.target.value })} className={inputCls} /></div>
          </div>
          <div className="space-y-1.5"><label className={labelCls}>Autorité de Délivrance</label><input type="text" value={formData.licenseIssuer} onChange={e => setFormData({ ...formData, licenseIssuer: e.target.value })} className={inputCls} /></div>
          <div className="space-y-1.5"><label className={labelCls}>Titre / Spécialité</label><input type="text" value={formData.pharmacistTitle} onChange={e => setFormData({ ...formData, pharmacistTitle: e.target.value })} className={inputCls} /></div>
        </>
      )}
      {activeModal === 'pharmacy_info' && (
        <>
          <div className="space-y-1.5"><label className={labelCls}>Nom de l'Officine</label><input type="text" value={formData.pharmacyName} onChange={e => setFormData({ ...formData, pharmacyName: e.target.value })} className={inputCls} /></div>
          <div className="space-y-1.5"><label className={labelCls}>Adresse Physique</label><input type="text" value={formData.pharmacyAddress} onChange={e => setFormData({ ...formData, pharmacyAddress: e.target.value })} className={inputCls} /></div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5"><label className={labelCls}>Téléphone</label><input type="text" value={formData.pharmacyPhone} onChange={e => setFormData({ ...formData, pharmacyPhone: e.target.value })} className={inputCls} /></div>
            <div className="space-y-1.5"><label className={labelCls}>Horaires</label><input type="text" value={formData.pharmacyHours} onChange={e => setFormData({ ...formData, pharmacyHours: e.target.value })} className={inputCls} /></div>
          </div>
          <div className="space-y-1.5"><label className={labelCls}>Email Professionnel</label><input type="email" value={formData.pharmacyEmail} onChange={e => setFormData({ ...formData, pharmacyEmail: e.target.value })} className={inputCls} /></div>
        </>
      )}
      {activeModal === 'medical' && (
        <>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5"><label className={labelCls}>Date de Naissance</label><input type="date" value={formData.birthDate} onChange={e => setFormData({ ...formData, birthDate: e.target.value })} className={inputCls} /></div>
            <div className="space-y-1.5"><label className={labelCls}>Genre</label><select value={formData.gender} onChange={e => setFormData({ ...formData, gender: e.target.value })} className={inputCls}><option>Femme</option><option>Homme</option><option>Autre</option></select></div>
          </div>
          <div className="grid grid-cols-3 gap-4">
            <div className="space-y-1.5"><label className={labelCls}>Groupe Sanguin</label><select value={formData.bloodType} onChange={e => setFormData({ ...formData, bloodType: e.target.value })} className={inputCls}>{["O+","O-","A+","A-","B+","B-","AB+","AB-"].map(b => <option key={b}>{b}</option>)}</select></div>
            <div className="space-y-1.5"><label className={labelCls}>Poids (kg)</label><input type="number" placeholder="70" value={formData.weight} onChange={e => setFormData({ ...formData, weight: e.target.value })} className={inputCls} /></div>
            <div className="space-y-1.5"><label className={labelCls}>Taille (cm)</label><input type="number" placeholder="175" value={formData.height} onChange={e => setFormData({ ...formData, height: e.target.value })} className={inputCls} /></div>
          </div>
          <div className="space-y-1.5"><label className={labelCls}>N° d'Identité (CNI)</label><input type="text" placeholder="N° CNI ou Passeport" value={formData.nationalId} onChange={e => setFormData({ ...formData, nationalId: e.target.value })} className={inputCls} /></div>
        </>
      )}
      {activeModal === 'insurance' && (
        <>
          <div className="space-y-1.5"><label className={labelCls}>Organisme d'Assurance</label><input type="text" placeholder="CNPS, MUPRAC, AXA..." value={formData.insuranceName} onChange={e => setFormData({ ...formData, insuranceName: e.target.value })} className={inputCls} /></div>
          <div className="space-y-1.5"><label className={labelCls}>Numéro de carte d'assuré</label><input type="text" placeholder="POL-987654-A" value={formData.insuranceNumber} onChange={e => setFormData({ ...formData, insuranceNumber: e.target.value })} className={inputCls} /></div>
        </>
      )}
      {activeModal === 'allergies' && (
        <>
          <div className="space-y-1.5">
            <div className="flex justify-between items-center"><label className={labelCls}>Allergies Connues</label><span className="text-[10px] text-red-500 font-bold bg-red-50 px-2 py-0.5 rounded-full">Crucial pour l'IA</span></div>
            <textarea rows={2} placeholder="Pénicilline, Ibuprofène, Aspirine..." value={formData.allergies} onChange={e => setFormData({ ...formData, allergies: e.target.value })} className={inputCls + " resize-none"} />
          </div>
          <div className="space-y-1.5"><label className={labelCls}>Antécédents & Maladies Chroniques</label><textarea rows={2} placeholder="Asthme, Diabète, Hypertension..." value={formData.medicalHistory} onChange={e => setFormData({ ...formData, medicalHistory: e.target.value })} className={inputCls + " resize-none"} /></div>
          <div className="space-y-1.5"><label className={labelCls}>Traitements en Cours</label><textarea rows={2} placeholder="Ventoline, Metformine 500mg..." value={formData.currentTreatments} onChange={e => setFormData({ ...formData, currentTreatments: e.target.value })} className={inputCls + " resize-none"} /></div>
        </>
      )}
      <ModalFooter saving={saving} saveSuccess={saveSuccess} onClose={onClose} />
    </form>
  );
}
