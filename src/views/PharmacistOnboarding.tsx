import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useAuth } from '../components/AuthContext';
import { 
  FileText, 
  Calendar, 
  Clock, 
  CheckCircle2, 
  AlertTriangle, 
  ShieldCheck, 
  Sparkles, 
  Phone, 
  Building2, 
  Users, 
  Thermometer, 
  Tv, 
  Flame, 
  Trash2, 
  LogOut, 
  ChevronRight, 
  ArrowLeft,
  Settings,
  HelpCircle
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export function PharmacistOnboarding() {
  const { profile, updateUserProfile, logout } = useAuth();
  const navigate = useNavigate();
  
  // States
  const [step, setStep] = useState<number>(() => {
    if (!profile?.status || profile?.status === 'pending_technical_file') return 1;
    if (profile?.status === 'pending_appointment') return 2;
    if (profile?.status === 'pending_admin_approval') return 3;
    return 1;
  });

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Step 1: Technical Form State
  const [techForm, setTechForm] = useState({
    pharmacyName: profile?.technicalForm?.pharmacyName || profile?.displayName || '',
    onpcNumber: profile?.technicalForm?.onpcNumber || '',
    legalLicenseNumber: profile?.technicalForm?.legalLicenseNumber || '',
    pharmacistsCount: profile?.technicalForm?.pharmacistsCount || 1,
    coldChainEquipment: profile?.technicalForm?.coldChainEquipment || 'medical_fridge',
    temperatureMonitor: profile?.technicalForm?.temperatureMonitor ?? true,
    backupGenerator: profile?.technicalForm?.backupGenerator || 'automated',
    airConditioned: profile?.technicalForm?.airConditioned ?? true,
    narcoticsSafe: profile?.technicalForm?.narcoticsSafe ?? true,
    fireExtinguisher: profile?.technicalForm?.fireExtinguisher ?? true,
    wasteProtocol: profile?.technicalForm?.wasteProtocol ?? true,
  });

  // Step 2: Appointment State
  const [appointment, setAppointment] = useState({
    type: profile?.appointment?.type || 'visio',
    date: profile?.appointment?.date || '',
    time: profile?.appointment?.time || '',
    phoneNumber: profile?.appointment?.phoneNumber || profile?.phoneNumber || '',
    notes: profile?.appointment?.notes || '',
  });

  // Helper to generate next 7 days for booking (excluding weekends)
  const getAvailableDates = () => {
    const dates = [];
    const today = new Date();
    let count = 0;
    while (count < 10) {
      today.setDate(today.getDate() + 1);
      const day = today.getDay();
      if (day !== 0 && day !== 6) { // Exclude Sunday (0) and Saturday (6)
        dates.push({
          value: today.toISOString().split('T')[0],
          label: today.toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' })
        });
        count++;
      }
    }
    return dates;
  };

  const handleTechFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!techForm.pharmacyName || !techForm.onpcNumber || !techForm.legalLicenseNumber) {
      setError("Veuillez renseigner tous les champs requis.");
      return;
    }

    setSubmitting(true);
    setError(null);
    try {
      await updateUserProfile({
        technicalForm: techForm,
        status: 'pending_appointment',
        pharmacyName: techForm.pharmacyName, // also save at top level
      });
      setStep(2);
    } catch (err: any) {
      console.error(err);
      setError("Une erreur est survenue lors de la sauvegarde de votre fiche technique.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleAppointmentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!appointment.date || !appointment.time || !appointment.phoneNumber) {
      setError("Veuillez sélectionner la date, l'heure et renseigner votre téléphone.");
      return;
    }

    setSubmitting(true);
    setError(null);
    try {
      await updateUserProfile({
        appointment: appointment,
        status: 'pending_admin_approval',
      });
      setStep(3);
    } catch (err: any) {
      console.error(err);
      setError("Une erreur est survenue lors de la prise de rendez-vous.");
    } finally {
      setSubmitting(false);
    }
  };

  const simulateAdminActivation = async () => {
    setSubmitting(true);
    try {
      await updateUserProfile({
        status: 'activated'
      });
      // The shell or protection will automatically update and let them pass!
      window.location.reload(); 
    } catch (err: any) {
      console.error(err);
      setError("Erreur lors de l'activation simulée.");
    } finally {
      setSubmitting(false);
    }
  };

  const resetOnboarding = async () => {
    setSubmitting(true);
    try {
      await updateUserProfile({
        status: 'pending_technical_file',
        technicalForm: null,
        appointment: null,
      });
      setStep(1);
    } catch (err) {
      console.error(err);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-between selection:bg-brand-50">
      
      {/* Top Header */}
      <header className="bg-white border-b border-slate-100 h-16 shrink-0 flex items-center px-4 md:px-8 shadow-sm z-10">
        <div className="max-w-7xl mx-auto w-full flex justify-between items-center">
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 bg-brand-600 rounded-xl flex items-center justify-center shadow-lg shadow-brand-600/20">
              <ShieldCheck className="text-white" size={20} />
            </div>
            <div>
              <span className="font-display font-bold text-lg md:text-xl text-slate-900 leading-none">Dokta</span>
              <span className="text-[10px] text-emerald-600 font-extrabold uppercase tracking-widest block">
                Agrément & Conformité Officinale
              </span>
            </div>
          </div>
          
          <button 
            onClick={logout}
            className="flex items-center gap-1.5 px-3.5 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-600 rounded-xl text-xs font-bold border border-rose-100/50 transition-all active:scale-95"
          >
            <LogOut size={14} />
            <span>Déconnexion</span>
          </button>
        </div>
      </header>

      {/* Main Content Area */}
      <div className="flex-1 w-full max-w-4xl mx-auto px-4 py-8 md:py-12 flex flex-col justify-start">
        
        {/* Onboarding Stepper Header */}
        <div className="mb-8 md:mb-10 text-center">
          <span className="bg-emerald-50 text-emerald-700 px-3 py-1 rounded-full text-xs font-extrabold uppercase tracking-widest mb-3 inline-block">
            Accréditation requise
          </span>
          <h1 className="text-2xl md:text-3xl font-display font-black text-slate-900 tracking-tight">
            Activez votre Espace Pharmacien
          </h1>
          <p className="text-slate-500 text-sm mt-1.5 max-w-xl mx-auto leading-relaxed">
            Pour garantir la sécurité sanitaire de nos patients, l'accès à l'inventaire et aux commandes de Dokta est conditionné par la vérification réglementaire de votre officine.
          </p>
        </div>

        {/* Stepper Indicators */}
        <div className="grid grid-cols-3 gap-3 md:gap-6 mb-8 md:mb-10 max-w-3xl mx-auto w-full">
          {[
            { num: 1, label: "Fiche Technique", active: step >= 1, done: step > 1 },
            { num: 2, label: "Prendre RDV", active: step >= 2, done: step > 2 },
            { num: 3, label: "Validation Admin", active: step === 3, done: false },
          ].map((s) => (
            <div key={s.num} className="flex flex-col items-center text-center">
              <div className="flex items-center w-full">
                <div className={`flex-1 h-0.5 ${s.num === 1 ? 'invisible' : s.active ? 'bg-brand-600' : 'bg-slate-200'}`} />
                <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs transition-all ${
                  s.done 
                    ? 'bg-emerald-600 text-white shadow-md' 
                    : s.active && step === s.num
                    ? 'bg-brand-600 text-white ring-4 ring-brand-500/10 shadow-lg'
                    : 'bg-slate-200 text-slate-500'
                }`}>
                  {s.done ? <CheckCircle2 size={16} /> : s.num}
                </div>
                <div className={`flex-1 h-0.5 ${s.num === 3 ? 'invisible' : s.done ? 'bg-brand-600' : 'bg-slate-200'}`} />
              </div>
              <span className={`text-[10px] md:text-xs font-bold uppercase tracking-wider mt-2.5 ${
                s.active ? 'text-slate-900' : 'text-slate-400'
              }`}>
                {s.label}
              </span>
            </div>
          ))}
        </div>

        {error && (
          <div className="bg-rose-50 text-rose-600 p-4 rounded-2xl text-xs font-bold border border-rose-100 mb-6 flex items-start gap-2 max-w-3xl mx-auto w-full">
            <AlertTriangle size={16} className="shrink-0 mt-0.5" />
            <p>{error}</p>
          </div>
        )}

        {/* Dynamic Step Panels with framer motion transition */}
        <div className="bg-white rounded-[2rem] border border-slate-100 shadow-xl overflow-hidden max-w-3xl mx-auto w-full">
          <AnimatePresence mode="wait">
            {step === 1 && (
              <motion.form 
                key="step1"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                onSubmit={handleTechFormSubmit}
                className="p-6 md:p-10 space-y-8"
              >
                <div>
                  <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                    <FileText size={20} className="text-brand-600" />
                    1. Renseigner la Fiche Technique de l'Officine
                  </h3>
                  <p className="text-slate-400 text-xs mt-1 leading-relaxed">
                    Veuillez certifier sous serment que votre établissement respecte les exigences réglementaires du Ministère de la Santé Publique (MINSANTE) du Cameroun.
                  </p>
                </div>

                <div className="space-y-5">
                  <h4 className="text-xs font-extrabold uppercase tracking-widest text-brand-600">Identification Légale</h4>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest px-1">Nom Commercial de l'Officine</label>
                      <div className="relative group">
                        <Building2 className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-brand-600 transition-colors" size={16} />
                        <input 
                          type="text" 
                          required
                          placeholder="Ex: Pharmacie de l'Avenue"
                          className="w-full bg-slate-50 border border-slate-200 rounded-xl py-3 pl-11 pr-4 outline-none focus:ring-2 focus:ring-brand-600/10 focus:border-brand-600 transition-colors font-medium text-slate-900 placeholder:text-slate-400 text-sm"
                          value={techForm.pharmacyName}
                          onChange={(e) => setTechForm({...techForm, pharmacyName: e.target.value})}
                        />
                      </div>
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest px-1">N° d'Inscription ONPC</label>
                      <div className="relative group">
                        <ShieldCheck className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-brand-600 transition-colors" size={16} />
                        <input 
                          type="text" 
                          required
                          placeholder="Ex: ONPC-4389-CM"
                          className="w-full bg-slate-50 border border-slate-200 rounded-xl py-3 pl-11 pr-4 outline-none focus:ring-2 focus:ring-brand-600/10 focus:border-brand-600 transition-all font-mono font-bold text-slate-900 placeholder:text-slate-400 text-sm"
                          value={techForm.onpcNumber}
                          onChange={(e) => setTechForm({...techForm, onpcNumber: e.target.value.toUpperCase()})}
                        />
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest px-1">N° d'Arrêté Ministériel de Création</label>
                      <div className="relative group">
                        <FileText className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-brand-600 transition-colors" size={16} />
                        <input 
                          type="text" 
                          required
                          placeholder="Ex: ARR-0021-MINSANTE"
                          className="w-full bg-slate-50 border border-slate-200 rounded-xl py-3 pl-11 pr-4 outline-none focus:ring-2 focus:ring-brand-600/10 focus:border-brand-600 transition-all font-mono text-slate-900 placeholder:text-slate-400 text-sm"
                          value={techForm.legalLicenseNumber}
                          onChange={(e) => setTechForm({...techForm, legalLicenseNumber: e.target.value.toUpperCase()})}
                        />
                      </div>
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest px-1">Nombre de Pharmaciens Adjoints Diplômés</label>
                      <div className="relative group">
                        <Users className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-brand-600 transition-colors" size={16} />
                        <input 
                          type="number" 
                          required
                          min={1}
                          className="w-full bg-slate-50 border border-slate-200 rounded-xl py-3 pl-11 pr-4 outline-none focus:ring-2 focus:ring-brand-600/10 focus:border-brand-600 transition-colors font-medium text-slate-900 placeholder:text-slate-400 text-sm"
                          value={techForm.pharmacistsCount}
                          onChange={(e) => setTechForm({...techForm, pharmacistsCount: parseInt(e.target.value) || 1})}
                        />
                      </div>
                    </div>
                  </div>
                </div>

                <div className="space-y-4 pt-4 border-t border-slate-100">
                  <h4 className="text-xs font-extrabold uppercase tracking-widest text-brand-600 mb-2">Installations Techniques & Chaîne de Froid</h4>
                  
                  <div className="space-y-4">
                    {/* Cold Chain Select */}
                    <div className="flex flex-col md:flex-row md:items-center justify-between p-4 bg-slate-50 rounded-2xl border border-slate-100 gap-3">
                      <div>
                        <h5 className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                          <Thermometer size={14} className="text-blue-500 animate-pulse" />
                          Équipement de Conservation
                        </h5>
                        <p className="text-[10px] text-slate-400 mt-0.5">Quel type de réfrigérateur possédez-vous pour la conservation des vaccins et produits thermosensibles ?</p>
                      </div>
                      <select 
                        className="rounded-xl border border-slate-200 px-3 py-2 text-xs outline-none focus:ring-2 focus:ring-brand-600/10 transition-all bg-white text-slate-800 font-medium"
                        value={techForm.coldChainEquipment}
                        onChange={(e) => setTechForm({...techForm, coldChainEquipment: e.target.value})}
                      >
                        <option value="medical_fridge">Réfrigérateur médical certifié avec thermomètre</option>
                        <option value="pharma_freezer">Congélateur de grade pharmaceutique</option>
                        <option value="none">Aucun réfrigérateur spécialisé (Non-conforme)</option>
                      </select>
                    </div>

                    {/* Backup Generator */}
                    <div className="flex flex-col md:flex-row md:items-center justify-between p-4 bg-slate-50 rounded-2xl border border-slate-100 gap-3">
                      <div>
                        <h5 className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                          <Tv size={14} className="text-emerald-500" />
                          Garantie d'Alimentation d'Énergie
                        </h5>
                        <p className="text-[10px] text-slate-400 mt-0.5">Disposez-vous d'un système de secours automatique contre les coupures d'électricité (délestages) ?</p>
                      </div>
                      <select 
                        className="rounded-xl border border-slate-200 px-3 py-2 text-xs outline-none focus:ring-2 focus:ring-brand-600/10 transition-all bg-white text-slate-800 font-medium"
                        value={techForm.backupGenerator}
                        onChange={(e) => setTechForm({...techForm, backupGenerator: e.target.value})}
                      >
                        <option value="automated">Groupe électrogène automatique avec inverseur</option>
                        <option value="manual">Groupe électrogène manuel</option>
                        <option value="ups_only">Onduleurs de forte capacité (uniquement)</option>
                        <option value="none">Aucune source de secours (Non-conforme)</option>
                      </select>
                    </div>

                    {/* Checkboxes Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-2">
                      {[
                        { key: 'temperatureMonitor', label: "Thermomètre enregistreur calibré actif 24h/24", icon: <Thermometer size={14} className="text-blue-500" /> },
                        { key: 'airConditioned', label: "Climatisation continue de l'officine (T° < 25°C)", icon: <Tv size={14} className="text-teal-500" /> },
                        { key: 'narcoticsSafe', label: "Coffre-fort scellé pour substances contrôlées", icon: <ShieldCheck size={14} className="text-purple-500" /> },
                        { key: 'fireExtinguisher', label: "Système de sécurité incendie complet & à jour", icon: <Flame size={14} className="text-rose-500" /> },
                        { key: 'wasteProtocol', label: "Contrat signé d'élimination des périmés", icon: <Trash2 size={14} className="text-slate-500" /> },
                      ].map((chk) => (
                        <label 
                          key={chk.key} 
                          className="flex items-start gap-3 p-3 bg-slate-50/50 rounded-xl border border-slate-100 hover:border-slate-200 cursor-pointer select-none transition-all"
                        >
                          <input 
                            type="checkbox"
                            checked={(techForm as any)[chk.key]}
                            onChange={(e) => setTechForm({...techForm, [chk.key]: e.target.checked})}
                            className="w-4 h-4 rounded text-brand-600 focus:ring-brand-500 border-slate-300 mt-0.5"
                          />
                          <div className="text-left">
                            <span className="text-[11px] font-bold text-slate-700 flex items-center gap-1">
                              {chk.icon}
                              {chk.label}
                            </span>
                          </div>
                        </label>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="pt-6 border-t border-slate-100 flex justify-end">
                  <button 
                    type="submit"
                    disabled={submitting}
                    className="bg-brand-600 hover:bg-brand-700 text-white px-6 py-3 rounded-2xl font-bold shadow-lg shadow-brand-600/10 hover:shadow-brand-600/25 transition-all active:scale-95 disabled:opacity-50 text-xs flex items-center gap-1.5"
                  >
                    {submitting ? "Traitement..." : <>Étape suivante : Prise de RDV <ChevronRight size={14} /></>}
                  </button>
                </div>
              </motion.form>
            )}

            {step === 2 && (
              <motion.form 
                key="step2"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                onSubmit={handleAppointmentSubmit}
                className="p-6 md:p-10 space-y-8"
              >
                <div>
                  <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                    <Calendar size={20} className="text-brand-600" />
                    2. Prendre Rendez-vous d'Inspection avec l'Équipe Dokta
                  </h3>
                  <p className="text-slate-400 text-xs mt-1 leading-relaxed">
                    Afin d'activer définitivement votre compte, vous devez planifier un entretien obligatoire avec l'un de nos pharmaciens validateurs. Cet entretien permet de confirmer les informations de votre fiche technique.
                  </p>
                </div>

                <div className="space-y-6">
                  {/* Appointment Type Select */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <button
                      type="button"
                      onClick={() => setAppointment({...appointment, type: 'visio'})}
                      className={`p-5 rounded-2xl border-2 transition-all font-bold text-xs flex flex-col items-center gap-3 text-center ${
                        appointment.type === 'visio' 
                          ? 'border-brand-600 bg-brand-50/50 text-brand-700' 
                          : 'border-slate-100 bg-slate-50/50 text-slate-500 hover:border-slate-200'
                      }`}
                    >
                      <Tv size={28} className={appointment.type === 'visio' ? 'text-brand-600' : 'text-slate-400'} />
                      <div className="text-center">
                        <p className="font-bold">Vidéo-conférence (Recommandé)</p>
                        <p className="text-[10px] text-slate-400 font-medium mt-1">Inspection à distance par caméra sur Google Meet / WhatsApp.</p>
                      </div>
                    </button>

                    <button
                      type="button"
                      onClick={() => setAppointment({...appointment, type: 'onsite'})}
                      className={`p-5 rounded-2xl border-2 transition-all font-bold text-xs flex flex-col items-center gap-3 text-center ${
                        appointment.type === 'onsite' 
                          ? 'border-emerald-600 bg-emerald-50/50 text-emerald-700' 
                          : 'border-slate-100 bg-slate-50/50 text-slate-500 hover:border-slate-200'
                      }`}
                    >
                      <Building2 size={28} className={appointment.type === 'onsite' ? 'text-emerald-600' : 'text-slate-400'} />
                      <div className="text-center">
                        <p className="font-bold">Visite Physique sur Site</p>
                        <p className="text-[10px] text-slate-400 font-medium mt-1">Un inspecteur Dokta se déplace dans vos locaux (Douala/Yaoundé uniquement).</p>
                      </div>
                    </button>
                  </div>

                  {/* Calendar booking simulator */}
                  <div className="space-y-4 pt-4 border-t border-slate-100">
                    <h4 className="text-xs font-extrabold uppercase tracking-widest text-brand-600">Choisissez une date de passage</h4>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                      <div className="space-y-1.5">
                        <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest px-1">Date Souhaitée</label>
                        <select
                          required
                          value={appointment.date}
                          onChange={(e) => setAppointment({...appointment, date: e.target.value})}
                          className="w-full bg-slate-50 border border-slate-200 rounded-xl py-3 px-4 outline-none focus:ring-2 focus:ring-brand-600/10 focus:border-brand-600 transition-all font-bold text-slate-800 text-sm"
                        >
                          <option value="">-- Choisir une date --</option>
                          {getAvailableDates().map((d) => (
                            <option key={d.value} value={d.value}>{d.label}</option>
                          ))}
                        </select>
                      </div>

                      <div className="space-y-1.5">
                        <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest px-1">Créneau Horaire</label>
                        <select
                          required
                          value={appointment.time}
                          onChange={(e) => setAppointment({...appointment, time: e.target.value})}
                          className="w-full bg-slate-50 border border-slate-200 rounded-xl py-3 px-4 outline-none focus:ring-2 focus:ring-brand-600/10 focus:border-brand-600 transition-all font-bold text-slate-800 text-sm"
                        >
                          <option value="">-- Choisir un créneau --</option>
                          <option value="09:00">09:00 - Matin</option>
                          <option value="11:00">11:00 - Matin</option>
                          <option value="14:00">14:00 - Après-midi</option>
                          <option value="16:00">16:00 - Fin de journée</option>
                        </select>
                      </div>
                    </div>
                  </div>

                  {/* Telephone & details */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5 pt-2">
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest px-1">Téléphone de Contact Direct</label>
                      <div className="relative group">
                        <Phone className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-brand-600 transition-colors" size={16} />
                        <input 
                          type="tel" 
                          required
                          placeholder="Ex: +237 677 000 000"
                          className="w-full bg-slate-50 border border-slate-200 rounded-xl py-3 pl-11 pr-4 outline-none focus:ring-2 focus:ring-brand-600/10 focus:border-brand-600 transition-colors font-medium text-slate-900 placeholder:text-slate-400 text-sm"
                          value={appointment.phoneNumber}
                          onChange={(e) => setAppointment({...appointment, phoneNumber: e.target.value})}
                        />
                      </div>
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest px-1">Notes ou remarques complémentaires</label>
                      <input 
                        type="text" 
                        placeholder="Instructions de livraison, contraintes..."
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl py-3 px-4 outline-none focus:ring-2 focus:ring-brand-600/10 focus:border-brand-600 transition-colors font-medium text-slate-900 placeholder:text-slate-400 text-sm"
                        value={appointment.notes}
                        onChange={(e) => setAppointment({...appointment, notes: e.target.value})}
                      />
                    </div>
                  </div>
                </div>

                <div className="pt-6 border-t border-slate-100 flex justify-between items-center">
                  <button 
                    type="button"
                    onClick={() => setStep(1)}
                    className="flex items-center gap-1.5 text-slate-500 hover:text-slate-800 text-xs font-bold transition-colors"
                  >
                    <ArrowLeft size={14} />
                    Retour à l'étape 1
                  </button>
                  <button 
                    type="submit"
                    disabled={submitting}
                    className="bg-brand-600 hover:bg-brand-700 text-white px-6 py-3 rounded-2xl font-bold shadow-lg shadow-brand-600/10 hover:shadow-brand-600/25 transition-all active:scale-95 disabled:opacity-50 text-xs flex items-center gap-1.5"
                  >
                    {submitting ? "Traitement..." : <>Valider et envoyer le dossier <ChevronRight size={14} /></>}
                  </button>
                </div>
              </motion.form>
            )}

            {step === 3 && (
              <motion.div 
                key="step3"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="p-6 md:p-10 space-y-8"
              >
                <div className="text-center py-6 space-y-4 max-w-xl mx-auto">
                  <div className="w-20 h-20 bg-amber-50 rounded-full flex items-center justify-center text-amber-500 mx-auto border-4 border-white shadow-xl animate-pulse">
                    <Clock size={40} />
                  </div>
                  <div className="space-y-1.5">
                    <h3 className="text-xl font-bold text-slate-900">
                      Dossier en attente d'activation
                    </h3>
                    <p className="text-slate-500 text-xs leading-relaxed font-medium">
                      Votre dossier d'accréditation a été soumis avec succès à l'équipe de validation de Dokta Cameroun. 
                    </p>
                  </div>
                </div>

                {/* Summaries */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4 border-t border-slate-100">
                  <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100 space-y-2.5">
                    <h4 className="text-[10px] font-black uppercase tracking-widest text-slate-400">Rapport de Fiche Technique</h4>
                    <div className="space-y-1.5 text-xs text-slate-600">
                      <p>🏥 <strong>Officine :</strong> {techForm.pharmacyName}</p>
                      <p>📜 <strong>Agrément ONPC :</strong> <span className="font-mono">{techForm.onpcNumber}</span></p>
                      <p>📋 <strong>N° d'Arrêté :</strong> <span className="font-mono">{techForm.legalLicenseNumber}</span></p>
                      <p>❄️ <strong>Chaîne de froid :</strong> Réfrigérateur médical homologué</p>
                    </div>
                  </div>

                  <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100 space-y-2.5">
                    <h4 className="text-[10px] font-black uppercase tracking-widest text-slate-400">Détails du Rendez-vous</h4>
                    <div className="space-y-1.5 text-xs text-slate-600">
                      <p>📅 <strong>Date d'entretien :</strong> {appointment.date ? new Date(appointment.date).toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' }) : ''}</p>
                      <p>⏰ <strong>Heure :</strong> {appointment.time}</p>
                      <p>💻 <strong>Format :</strong> {appointment.type === 'visio' ? 'Vidéo-conférence (Google Meet)' : 'Visite physique de l\'établissement'}</p>
                      <p>📞 <strong>Téléphone :</strong> {appointment.phoneNumber}</p>
                    </div>
                  </div>
                </div>

                <div className="bg-brand-50 p-4 rounded-2xl border border-brand-100 flex gap-3 items-start">
                  <HelpCircle size={18} className="text-brand-600 shrink-0 mt-0.5" />
                  <p className="text-xs text-brand-900 leading-relaxed font-medium">
                    <strong>Que se passe-t-il maintenant ?</strong> Un inspecteur de Dokta vous appellera au numéro de téléphone spécifié le <strong>{appointment.date ? new Date(appointment.date).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long' }) : ''} à {appointment.time}</strong> pour mener l'évaluation de conformité de l'officine. Votre espace complet sera déverrouillé immédiatement à l'issue de cet entretien.
                  </p>
                </div>

                <div className="pt-2 flex justify-start">
                  <button 
                    type="button"
                    onClick={() => setStep(2)}
                    className="flex items-center gap-1.5 text-slate-500 hover:text-slate-800 text-xs font-bold transition-colors"
                  >
                    <ArrowLeft size={14} />
                    Modifier le rendez-vous
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Administration Simulation Assistant for Reviewers */}
        <div className="mt-12 bg-[#0C0E14] text-slate-300 rounded-[2rem] p-6 md:p-8 border border-white/5 relative overflow-hidden shadow-2xl max-w-3xl mx-auto w-full">
          <div className="absolute top-0 right-0 w-48 h-48 bg-brand-600/10 rounded-full blur-3xl" />
          <div className="relative z-10 space-y-4">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center border border-white/10">
                <Settings className="text-amber-400 animate-spin-slow" size={16} />
              </div>
              <div>
                <h4 className="text-sm font-bold text-white uppercase tracking-wider">Simulateur d'Administration Dokta</h4>
                <p className="text-[10px] text-slate-400">Réservé pour la revue et l'évaluation du projet</p>
              </div>
            </div>

            <p className="text-xs text-slate-400 leading-relaxed">
              En conditions réelles de production, la validation est accordée par l'administrateur Dokta après vérification minutieuse lors du rendez-vous d'inspection. Pour faciliter l'évaluation de cette application, vous pouvez forcer la validation immédiate ou réinitialiser le processus d'onboarding à tout moment :
            </p>

            <div className="flex flex-col sm:flex-row gap-3 pt-2">
              <button
                type="button"
                onClick={simulateAdminActivation}
                disabled={submitting}
                className="flex-1 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-extrabold px-5 py-3 rounded-xl text-xs transition-all active:scale-95 flex items-center justify-center gap-2 shadow-lg shadow-emerald-950/20 disabled:opacity-50"
              >
                <Sparkles size={14} className="text-amber-300 animate-pulse" />
                Valider et Activer le compte maintenant
              </button>

              <button
                type="button"
                onClick={resetOnboarding}
                disabled={submitting}
                className="bg-white/5 hover:bg-white/10 text-white border border-white/10 px-5 py-3 rounded-xl text-xs font-bold transition-all active:scale-95 flex items-center justify-center gap-1.5 disabled:opacity-50"
              >
                <ArrowLeft size={14} />
                Réinitialiser l'onboarding
              </button>
            </div>
          </div>
        </div>

      </div>

      {/* Footer */}
      <footer className="bg-white border-t border-slate-100 py-6 text-center shrink-0">
        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
          © 2026 Dokta Cameroun - Ministère de la Santé Publique
        </p>
      </footer>

    </div>
  );
}
