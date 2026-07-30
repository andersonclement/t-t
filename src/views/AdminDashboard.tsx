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
  Filter, 
  FileText, 
  Calendar, 
  CheckCircle2, 
  XCircle, 
  Phone, 
  Mail, 
  Building2, 
  ArrowUpDown,
  MapPin,
  Check,
  X,
  ExternalLink,
  Info,
  ChevronRight
} from 'lucide-react';
import { cn } from '../lib/utils';
import { Alert, Badge, PageContainer, PageHeader, StatCard, StatGrid } from '../components/ui';
import { PROFESSIONAL_ROLES, getEstablishmentName, getRole, type ProfessionalRole } from '../lib/roles';
import { RoleIcon } from '../components/RoleIcon';

/** Shape varies per role — the registry drives which fields exist. */
type TechnicalForm = Record<string, unknown>;

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
  role: ProfessionalRole;
  status: 'pending_technical_file' | 'pending_appointment' | 'pending_admin_approval' | 'activated' | 'rejected';
  createdAt?: any;
  updatedAt?: any;
  technicalForm?: TechnicalForm;
  appointment?: Appointment;
  phoneNumber?: string;
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

  // Fetch all pharmacists from firestore
  useEffect(() => {
    const q = query(collection(db, 'users'), where('role', 'in', PROFESSIONAL_ROLES));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const list: PharmacistUser[] = [];
      snapshot.forEach((docSnap) => {
        const data = docSnap.data();
        list.push({
          id: docSnap.id,
          uid: data.uid || docSnap.id,
          displayName: data.displayName || 'Professionnel sans nom',
          email: data.email || '',
          role: data.role || 'pharmacist',
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

  // Filter & Search Logic
  const filteredPharma = pharmacists.filter((pharma) => {
    const matchesSearch = 
      pharma.displayName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      pharma.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (getEstablishmentName(pharma) || '').toLowerCase().includes(searchTerm.toLowerCase());

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

  return (
    <PageContainer id="admin-dashboard-container">
      <PageHeader
        eyebrow="Administration"
        title="Portail d'Administration Médical"
        subtitle="Gérez et validez l'accès des pharmaciens certifiés à la plateforme."
      />

      {/* Notifications */}
      <AnimatePresence>
        {successMessage && (
          <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}>
            <Alert tone="success" icon={<CheckCircle2 size={18} className="text-emerald-500" />}>
              <div className="flex items-start gap-3">
                <span className="flex-1">{successMessage}</span>
                <button onClick={() => setSuccessMessage(null)} aria-label="Fermer" className="text-emerald-500 hover:text-emerald-700">
                  <X size={16} />
                </button>
              </div>
            </Alert>
          </motion.div>
        )}
        {errorMessage && (
          <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}>
            <Alert tone="danger" icon={<AlertTriangle size={18} className="text-rose-500" />}>
              <div className="flex items-start gap-3">
                <span className="flex-1">{errorMessage}</span>
                <button onClick={() => setErrorMessage(null)} aria-label="Fermer" className="text-rose-500 hover:text-rose-700">
                  <X size={16} />
                </button>
              </div>
            </Alert>
          </motion.div>
        )}
      </AnimatePresence>

      <StatGrid columns={4}>
        <StatCard
          label="Total pharmaciens"
          value={stats.total}
          icon={<Users size={18} className="text-slate-600" />}
          tone="bg-slate-100"
        />
        <StatCard
          label="En attente"
          value={stats.pending}
          icon={<Clock size={18} className={cn('text-amber-600', stats.pending > 0 && 'animate-pulse')} />}
          tone="bg-amber-50"
        />
        <StatCard
          label="Activés / validés"
          value={stats.activated}
          icon={<ShieldCheck size={18} className="text-emerald-600" />}
          tone="bg-emerald-50"
        />
        <StatCard
          label="Inscriptions rejetées"
          value={stats.rejected}
          icon={<XCircle size={18} className="text-rose-600" />}
          tone="bg-rose-50"
        />
      </StatGrid>

      {/* Main Content Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 md:gap-8 items-start">
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
                            {getEstablishmentName(pharma) || pharma.displayName}
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
                          <span
                            className={cn(
                              'inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold',
                              getRole(pharma.role).accent.soft
                            )}
                          >
                            <RoleIcon role={pharma.role} size={10} />
                            {getRole(pharma.role).label}
                          </span>
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

              {/* Technical file, rendered from the role's own schema */}
              {selectedPharma.technicalForm ? (
                <div className="space-y-3">
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest border-b border-slate-100 pb-1.5 flex items-center gap-1.5">
                    <Building2 size={12} />
                    Dossier {getRole(selectedPharma.role).label.toLowerCase()}
                  </p>

                  {getRole(selectedPharma.role).onboarding.map((section) => (
                    <div key={section.title} className="space-y-2">
                      <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                        {section.title}
                      </p>
                      <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-xs">
                        {section.fields.map((field) => {
                          const raw = (selectedPharma.technicalForm as any)?.[field.name];
                          const value =
                            field.type === 'toggle'
                              ? raw ? 'Oui' : 'Non'
                              : field.type === 'select'
                                ? field.options?.find((o) => o.value === String(raw))?.label ?? '—'
                                : raw === undefined || raw === '' || raw === null
                                  ? '—'
                                  : String(raw);

                          return (
                            <div key={field.name} className={cn(field.type === 'textarea' && 'col-span-2')}>
                              <span className="text-slate-400">{field.label}</span>
                              <p
                                className={cn(
                                  'font-semibold text-slate-700 mt-0.5 break-words',
                                  field.type === 'toggle' && (raw ? 'text-emerald-600' : 'text-slate-400')
                                )}
                              >
                                {value}
                              </p>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="bg-slate-50 p-4 rounded-xl border border-dashed border-slate-200 text-center text-xs text-slate-400">
                  <FileText className="mx-auto mb-1.5 text-slate-300" size={18} />
                  Dossier technique non complété.
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
    </PageContainer>
  );
}
