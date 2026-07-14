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
  FileSpreadsheet
} from 'lucide-react';
import { useAuth } from '../components/AuthContext';
import { useOrders, Order } from '../components/OrderContext';
import { cn } from '../lib/utils';
import { useNavigate } from 'react-router-dom';
import { collection, query, getDocs, where, onSnapshot } from 'firebase/firestore';
import { db } from '../lib/firebase';

export function Profile() {
  const { user, profile, logout, signInWithGoogle, updateUserProfile, resetPassword } = useAuth();
  const { orders } = useOrders();
  const navigate = useNavigate();
  const [showOrders, setShowOrders] = React.useState(false);
  const [expandedOrderId, setExpandedOrderId] = React.useState<string | null>(null);

  const [activeModal, setActiveModal] = React.useState<
    'medical' | 'insurance' | 'allergies' | 'security' | 'license' | 'pharmacy_info' | 'stock_alerts' | 'support' | null
  >(null);
  const [saving, setSaving] = React.useState(false);
  const [saveSuccess, setSaveSuccess] = React.useState(false);
  const [errorMessage, setErrorMessage] = React.useState<string | null>(null);

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
    
    // Pharmacist exclusive fields
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

  // Fetch stock medications to calculate alerts
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

          // Fallback to localStorage if Firestore is empty
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
        // Unauthenticated guest pharmacist fallback
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

  const lowStockMeds = medications.filter(med => {
    const min = med.minThreshold !== undefined ? Number(med.minThreshold) : 15;
    return Number(med.stock) <= min;
  });

  // Support ticket state
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

  // 2FA Security state
  const [twoFactorEnabled, setTwoFactorEnabled] = React.useState(profile?.twoFactorEnabled || false);
  const handleToggle2FA = async () => {
    const nextVal = !twoFactorEnabled;
    setTwoFactorEnabled(nextVal);
    try {
      await updateUserProfile({ twoFactorEnabled: nextVal });
    } catch (err) {
      console.error(err);
    }
  };

  // Password Reset state
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
        
        // Pharmacist fields loaded with sensible default fallback if missing
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

  const isMedicalComplete = profile?.birthDate && profile?.gender && profile?.bloodType && profile?.weight && profile?.height;
  const isInsuranceComplete = profile?.insuranceName && profile?.insuranceNumber;
  const isAllergiesFilled = profile?.allergies || profile?.medicalHistory;

  if (!user) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center text-center p-6 space-y-6">
        <div className="w-24 h-24 bg-slate-100 rounded-full flex items-center justify-center text-slate-400">
          <User size={64} />
        </div>
        <div className="space-y-2">
          <h2 className="text-3xl font-display font-bold text-slate-900">Bienvenue sur PharmaConnect</h2>
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
      <section className="bg-white rounded-[2.5rem] p-8 border border-slate-100 shadow-sm flex flex-col md:flex-row items-center gap-8 ring-8 ring-slate-50">
        <div className="relative">
          <img 
            src={user.photoURL || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=200&h=200&fit=crop'} 
            className="w-32 h-32 rounded-[2rem] object-cover ring-4 ring-brand-600/10" 
            alt="User" 
          />
          <div className="absolute -bottom-2 -right-2 bg-brand-600 text-white p-2 rounded-xl shadow-lg border-4 border-white">
            <Settings size={16} />
          </div>
        </div>
        <div className="flex-1 text-center md:text-left">
          <div className="inline-flex items-center gap-2 bg-brand-50 text-brand-700 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest mb-2">
             {profile?.role === 'pharmacist' ? 'Pharmacien Certifié' : 'Patient Vérifié'}
          </div>
          <h2 className="text-3xl font-display font-bold text-slate-900">{user.displayName || 'Utilisateur'}</h2>
          <div className="flex flex-wrap justify-center md:justify-start gap-4 mt-2">
            <p className="text-slate-400 text-sm flex items-center gap-1 font-medium">
              <Mail size={14} />
              {user.email}
            </p>
            <p className="text-slate-400 text-sm flex items-center gap-1 font-medium">
              <Calendar size={14} />
              Membre depuis fév. 2026
            </p>
          </div>
        </div>
        <button 
          onClick={logout}
          className="bg-slate-50 text-slate-400 p-4 rounded-2xl hover:bg-red-50 hover:text-red-500 transition-all"
        >
          <LogOut size={24} />
        </button>
      </section>

      {/* Conditional Rendering: Main Hub vs Order History */}
      {!showOrders ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Main Context Card */}
          <div className="space-y-4">
            <h3 className="text-lg font-display font-bold text-slate-900 px-1 italic">
              {profile?.role === 'pharmacist' ? 'Ma Pharmacie & Boutique' : 'Santé & Administratif'}
            </h3>
            <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden">
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
                  <ProfileLink icon={<Bell className="text-orange-500" />} label="Notifications & Rappels" trailing="3 actifs" />
                  <ProfileLink icon={<HelpCircle className="text-slate-400" />} label="Centre d'aide / FAQ" />
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
              className="text-brand-600 font-bold text-sm hover:underline"
            >
              Retour au profil
            </button>
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
                        <span className={cn(
                          "px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest",
                          order.status === 'en_cours' ? "bg-orange-100 text-orange-700" : "bg-emerald-100 text-emerald-700"
                        )}>
                          {order.status === 'en_cours' ? 'En préparation' : 'Livré'}
                        </span>
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
                              <img src={item.image} className="w-full h-full object-cover" />
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
                                  {item.image ? <img src={item.image} className="w-full h-full object-cover" /> : <ShoppingBag size={14} className="text-slate-300" />}
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
                        <p className="text-xs font-bold text-slate-700">{order.paymentMethod.toUpperCase()}</p>
                      </div>
                      <p className="text-xl font-display font-bold text-brand-600">{order.total.toLocaleString()} FCFA</p>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="bg-white p-12 rounded-[2rem] border border-slate-100 text-center space-y-4 italic text-slate-400">
                <ShoppingBag size={48} className="mx-auto opacity-20" />
                <p>Vous n'avez pas encore passé de commande.</p>
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
            <h4 className="text-2xl font-display font-bold">Pass PharmaConnect</h4>
            <p className="text-blue-100 text-sm max-w-sm">
              Présentez ce code en pharmacie ou à l'hôpital pour un accès instantané à votre profil partagé.
            </p>
          </div>
          <div className="bg-white p-4 rounded-3xl w-48 h-48 mx-auto md:mx-0 shadow-lg flex items-center justify-center">
            <div className="w-full h-full bg-slate-100 rounded-2xl flex items-center justify-center text-slate-300">
               {/* Simulating QR */}
               <div className="grid grid-cols-4 gap-1 p-2">
                 {[...Array(16)].map((_, i) => (
                   <div key={i} className={cn("w-4 h-4 rounded-sm", (Math.random() > 0.5) ? "bg-slate-800" : "bg-transparent")} />
                 ))}
               </div>
            </div>
          </div>
        </div>
        <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/2" />
      </motion.div>

      {/* Modal overlays using AnimatePresence */}
      <AnimatePresence>
        {activeModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            {/* Backdrop */}
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setActiveModal(null)}
              className="absolute inset-0 bg-slate-950/40 backdrop-blur-sm"
            />

            {/* Modal Box */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="bg-white w-full max-w-lg rounded-[2.5rem] border border-slate-100 shadow-2xl overflow-hidden relative z-10 flex flex-col max-h-[90vh]"
            >
              {/* Header */}
              <div className="p-6 border-b border-slate-50 flex justify-between items-center bg-slate-50/50">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 bg-brand-50 rounded-2xl text-brand-600">
                    {activeModal === 'medical' && <FileText size={20} />}
                    {activeModal === 'insurance' && <CreditCard size={20} />}
                    {activeModal === 'allergies' && <Heart size={20} />}
                    {activeModal === 'security' && <Shield size={20} />}
                    {activeModal === 'license' && <FileText size={20} />}
                    {activeModal === 'pharmacy_info' && <Building2 size={20} />}
                    {activeModal === 'stock_alerts' && <Bell size={20} />}
                    {activeModal === 'support' && <HelpCircle size={20} />}
                  </div>
                  <div>
                    <h4 className="font-display font-bold text-slate-900 text-left">
                      {activeModal === 'medical' && "Dossier Médical"}
                      {activeModal === 'insurance' && "Carte Vitale / Assurance"}
                      {activeModal === 'allergies' && "Antécédents & Allergies"}
                      {activeModal === 'security' && "Sécurité des Données"}
                      {activeModal === 'license' && "Licence Professionnelle"}
                      {activeModal === 'pharmacy_info' && "Informations Établissement"}
                      {activeModal === 'stock_alerts' && "Alertes de Stock"}
                      {activeModal === 'support' && "Support Professionnel"}
                    </h4>
                    <p className="text-[11px] text-slate-400 font-medium text-left">
                      {activeModal === 'medical' && "Renseignez vos caractéristiques de santé physiques"}
                      {activeModal === 'insurance' && "Informations administratives d'assurance maladie"}
                      {activeModal === 'allergies' && "Signalez-les pour que l'IA adapte ses conseils"}
                      {activeModal === 'security' && "Gérez l'accès, la sécurité et l'authentification"}
                      {activeModal === 'license' && "Informations d'accréditation et de conformité du praticien"}
                      {activeModal === 'pharmacy_info' && "Détails et horaires de votre officine de pharmacie"}
                      {activeModal === 'stock_alerts' && "Médicaments en rupture ou sous le seuil de stock critique"}
                      {activeModal === 'support' && "Service d'assistance technique dédié aux pharmaciens"}
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
                  <div className="p-4 bg-red-50 text-red-700 rounded-2xl text-xs font-semibold">
                    {errorMessage}
                  </div>
                )}

                {activeModal === 'security' ? (
                  <div className="space-y-6">
                    {profile?.role === 'pharmacist' ? (
                      <div className="space-y-6">
                        {/* 2FA Toggle */}
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
                          >
                            <span
                              className={cn(
                                "pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out",
                                twoFactorEnabled ? "translate-x-5" : "translate-x-0"
                              )}
                            />
                          </button>
                        </div>

                        {/* Password Reset Section */}
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

                        {/* Compliances */}
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
                        {/* Hotlines */}
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

                        {/* Category */}
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

                        {/* Subject */}
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

                        {/* Message */}
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

                        <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-3 bg-slate-50/50 -mx-6 -mb-6 p-6">
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

                    <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-3 bg-slate-50/50 -mx-6 -mb-6 p-6">
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
        <span className="font-bold text-slate-800">{label}</span>
      </div>
      <div className="flex items-center gap-2">
        {trailing && <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 bg-slate-100 px-2 py-1 rounded-full">{trailing}</span>}
        <ChevronRight size={18} className="text-slate-300 group-hover:text-slate-500 transition-colors" />
      </div>
    </button>
  );
}
