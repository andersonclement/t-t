import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useAuth } from '../components/AuthContext';
import { ShieldCheck, HeartPulse, Mail, Lock, User, ArrowLeft, ArrowRight, Check, X, Sparkles, Building2, Key } from 'lucide-react';
import { Navigate, useNavigate, Link } from 'react-router-dom';
import { cn } from '../lib/utils';

function RequirementItem({ met, label }: { met: boolean; label: string }) {
  return (
    <div className="flex items-center gap-1.5">
      {met ? (
        <Check size={10} className="text-emerald-500" />
      ) : (
        <X size={10} className="text-slate-300" />
      )}
      <span className={cn(
        "text-[9px] font-bold uppercase tracking-wider transition-colors",
        met ? "text-emerald-600" : "text-slate-400"
      )}>
        {label}
      </span>
    </div>
  );
}

export function Signup() {
  const { user, loading, signUpWithEmail, signInWithGoogle, signInAsDemo } = useAuth();
  const navigate = useNavigate();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isIframe, setIsIframe] = useState(false);

  React.useEffect(() => {
    setIsIframe(window.self !== window.top);
  }, []);

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    role: 'patient',
    confirmPassword: '',
    pharmacyName: '',
    inviteCode: ''
  });

  const handleGoogleSignup = async () => {
    setIsSubmitting(true);
    setError(null);
    try {
      await signInWithGoogle();
      navigate('/');
    } catch (err: any) {
      console.error("Google Auth Error:", err);
      if (err.code === 'auth/popup-blocked') {
        setError("Le popup de connexion a été bloqué par votre navigateur. Astuce: Ouvrez l'application dans un nouvel onglet (icône en haut à droite) ou autorisez les popups.");
      } else if (err.code === 'auth/popup-closed-by-user') {
        setError("La fenêtre de connexion Google a été fermée. Astuce: Les navigateurs bloquent souvent l'inscription Google dans les cadres d'aperçu (iframes). Ouvrez l'application dans un nouvel onglet (bouton en haut à droite) ou utilisez l'inscription par e-mail.");
      } else if (err.code === 'auth/operation-not-allowed') {
        setError("La connexion Google n'est pas activée dans votre console Firebase. Activez-la dans Authentication > Sign-in method.");
      } else if (err.code === 'auth/unauthorized-domain') {
        setError("Ce domaine n'est pas autorisé dans votre console Firebase. Ajoutez-le dans Authentication > Settings > Authorized domains.");
      } else if (err.code === 'auth/network-request-failed') {
        setError("Erreur réseau. Vérifiez votre connexion internet.");
      } else {
        setError(`Erreur lors de la connexion Google (${err.code || 'Inconnue'}). Veuillez réessayer. Astuce: Essayez d'ouvrir l'application dans un nouvel onglet.`);
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDemoSignup = async () => {
    setIsSubmitting(true);
    setError(null);
    try {
      await signInAsDemo();
      navigate('/');
    } catch (err: any) {
      console.error("Demo Auth Error:", err);
      setError("Une erreur est survenue lors de la connexion démo. Veuillez réessayer.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const [passwordStrength, setPasswordStrength] = useState({
    score: 0,
    feedback: '',
    requirements: {
      length: false,
      uppercase: false,
      lowercase: false,
      number: false,
      special: false
    }
  });

  const checkPasswordStrength = (password: string) => {
    const requirements = {
      length: password.length >= 8,
      uppercase: /[A-Z]/.test(password),
      lowercase: /[a-z]/.test(password),
      number: /[0-9]/.test(password),
      special: /[^A-Za-z0-9]/.test(password)
    };

    let score = 0;
    if (requirements.length) score += 1;
    if (requirements.uppercase) score += 1;
    if (requirements.lowercase) score += 1;
    if (requirements.number) score += 1;
    if (requirements.special) score += 1;

    let feedback = 'Faible';
    if (score >= 5) feedback = 'Très fort';
    else if (score >= 4) feedback = 'Fort';
    else if (score >= 3) feedback = 'Moyen';

    setPasswordStrength({ score, feedback, requirements });
  };

  if (loading) return null;
  if (user) return <Navigate to="/" replace />;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (passwordStrength.score < 5) {
      setError('Veuillez respecter toutes les exigences de sécurité pour le mot de passe.');
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      setError('Les mots de passe ne correspondent pas');
      return;
    }

    if (formData.role === 'pharmacist') {
      if (!formData.pharmacyName.trim()) {
        setError("Le nom de la pharmacie est requis pour l'inscription d'un pharmacien.");
        return;
      }
      if (formData.inviteCode.trim().toUpperCase() !== 'DOKTA-PRO-2026') {
        setError("Le code d'autorisation administrateur est incorrect ou expiré. L'inscription professionnelle requiert l'accord préalable de l'administrateur. Veuillez le contacter à admin@dokta.cm pour obtenir votre code d'accès.");
        return;
      }
    }
    
    setIsSubmitting(true);
    setError(null);
    try {
      await signUpWithEmail(formData.email, formData.password, formData.name, formData.role, formData.pharmacyName);
      navigate('/');
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Une erreur est survenue lors de l\'inscription');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#FDFDFF] flex items-center justify-center p-4 md:p-6 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-brand-50/50 via-transparent to-transparent">
      {/* Back button */}
      <button 
        onClick={() => navigate('/welcome')}
        className="fixed top-4 md:top-8 left-4 md:left-8 p-3 bg-white rounded-xl md:rounded-2xl border border-slate-100 shadow-sm hover:shadow-md transition-all text-slate-500 hover:text-brand-600 flex items-center gap-2 font-bold text-sm z-50"
      >
        <ArrowLeft size={18} />
        <span className="hidden sm:inline">Retour à l'accueil</span>
      </button>

      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="w-full max-w-4xl bg-white rounded-[2rem] md:rounded-[2.5rem] shadow-2xl border border-slate-100 overflow-hidden flex flex-col md:flex-row mt-12 md:mt-0"
      >
        <div className="md:w-2/5 bg-[#0A0B0E] p-8 md:p-12 text-white flex flex-col justify-between relative overflow-hidden">
          {/* Background effects */}
          <div className="absolute top-0 right-0 w-full h-full opacity-30">
            <div className="absolute top-0 right-0 w-[400px] h-[400px] bg-brand-600 rounded-full blur-[120px] -translate-y-1/2 translate-x-1/2" />
            <div className="absolute bottom-0 left-0 w-[300px] h-[300px] bg-emerald-600 rounded-full blur-[100px] translate-y-1/2 -translate-x-1/2" />
          </div>

          <div className="relative z-10">
            <motion.div 
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ duration: 0.5 }}
              className="w-14 h-14 bg-white/5 rounded-2xl flex items-center justify-center backdrop-blur-xl border border-white/10 mb-10"
            >
              <HeartPulse size={32} className="text-brand-400" />
            </motion.div>
            
            <motion.div
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.2, duration: 0.5 }}
              className="space-y-4"
            >
              <h2 className="text-3xl md:text-4xl font-display font-bold leading-tight tracking-tight">
                L'avenir de la santé au <span className="text-brand-400">Cameroun</span>
              </h2>
              <p className="text-slate-400 text-sm md:text-base leading-relaxed max-w-xs font-medium">
                Rejoignez Dokta pour une expérience de santé connectée, humaine et sécurisée.
              </p>
            </motion.div>
          </div>

          <div className="relative z-10 space-y-6">
            <div className="flex items-center gap-4 group">
               <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center border border-white/10 group-hover:bg-brand-600/20 group-hover:border-brand-600/30 transition-all">
                  <ShieldCheck size={20} className="text-brand-400" />
               </div>
               <div>
                  <p className="text-xs font-bold uppercase tracking-widest text-slate-400 mb-0.5 group-hover:text-white transition-colors">100% Sécurisé</p>
                  <p className="text-[10px] text-slate-500">Chiffrement AES-256</p>
               </div>
            </div>

            <div className="pt-4 border-t border-white/5">
              <p className="text-[10px] font-bold text-slate-500 uppercase tracking-[0.2em] mb-4">ILS NOUS FONT CONFIANCE</p>
              <div className="flex gap-4 opacity-50 grayscale hover:grayscale-0 transition-all cursor-default">
                 {/* Mock logos or icons */}
                 <div className="w-8 h-8 rounded-lg bg-white/10" />
                 <div className="w-8 h-8 rounded-lg bg-white/10" />
                 <div className="w-8 h-8 rounded-lg bg-white/10" />
              </div>
            </div>
          </div>
        </div>

        <div className="md:w-3/5 p-8 md:p-14 space-y-8 bg-white selection:bg-brand-50">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h1 className="text-3xl font-display font-bold text-slate-900 tracking-tight">Créer un compte</h1>
              <p className="text-slate-500 text-sm mt-1">Commencez votre parcours de soin dès aujourd'hui.</p>
            </div>
            <Link to="/login" className="text-brand-600 text-sm font-bold hover:text-brand-700 transition-colors py-2 px-4 bg-brand-50 rounded-xl inline-block text-center sm:text-left">Se connecter</Link>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            {error && (
              <motion.div 
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-rose-50 text-rose-600 p-4 rounded-2xl text-xs font-bold border border-rose-100 animate-shake space-y-2"
              >
                <div className="flex items-center gap-2">
                  <X size={16} />
                  <p>{error}</p>
                </div>
                {error.includes("déjà utilisée") && (
                  <button 
                    type="button"
                    onClick={() => navigate('/login', { state: { email: formData.email } })}
                    className="text-brand-700 hover:underline flex items-center gap-1 font-extrabold uppercase tracking-widest text-[10px] mt-2 bg-white px-3 py-1.5 rounded-lg shadow-sm border border-rose-200"
                  >
                    Voulez-vous vous connecter à la place ?
                  </button>
                )}
              </motion.div>
            )}



            <button 
              type="button"
              onClick={handleDemoSignup}
              disabled={isSubmitting}
              className="w-full bg-slate-900 hover:bg-slate-800 text-white font-bold py-4 rounded-2xl flex items-center justify-center gap-3 transition-all shadow-lg active:scale-95 text-sm disabled:opacity-50 border border-slate-900"
            >
              <Sparkles size={18} className="text-amber-400 animate-pulse" />
              Connexion Démo Rapide (Recommandé)
            </button>

            <div className="relative py-1 flex items-center">
              <div className="flex-grow border-t border-slate-100"></div>
              <span className="flex-shrink mx-4 text-[9px] font-bold text-slate-400 uppercase tracking-widest">ou</span>
              <div className="flex-grow border-t border-slate-100"></div>
            </div>

            <button 
              type="button"
              onClick={handleGoogleSignup}
              disabled={isSubmitting}
              className="w-full bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 font-bold py-4 rounded-2xl flex items-center justify-center gap-3 transition-all shadow-sm active:scale-95 text-sm disabled:opacity-50"
            >
              <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" className="w-5 h-5" alt="Google" />
              S'inscrire avec Google
            </button>

            <div className="relative py-2 flex items-center">
              <div className="flex-grow border-t border-slate-100"></div>
              <span className="flex-shrink mx-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest">ou avec email</span>
              <div className="flex-grow border-t border-slate-100"></div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              <div className="space-y-2">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest px-1">Nom complet</label>
                <div className="relative group">
                  <User className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-brand-600 transition-colors" size={18} />
                  <input 
                    type="text" 
                    required
                    placeholder="Marc Embolo"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl md:rounded-2xl py-4 pl-12 pr-4 outline-none focus:ring-2 focus:ring-brand-600/10 focus:border-brand-600 focus:bg-white transition-colors font-medium text-slate-900 placeholder:text-slate-400"
                    value={formData.name}
                    onChange={(e) => setFormData({...formData, name: e.target.value})}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest px-1">Email</label>
                <div className="relative group">
                  <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-brand-600 transition-colors" size={18} />
                  <input 
                    type="email" 
                    required
                    placeholder="marc@dokta.cm"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl md:rounded-2xl py-4 pl-12 pr-4 outline-none focus:ring-2 focus:ring-brand-600/10 focus:border-brand-600 focus:bg-white transition-colors font-medium text-slate-900 placeholder:text-slate-400"
                    value={formData.email}
                    onChange={(e) => setFormData({...formData, email: e.target.value})}
                  />
                </div>
              </div>
            </div>

            <div className="space-y-3">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest px-1">Je suis un...</label>
              <div className="grid grid-cols-2 gap-3">
                <motion.button
                  whileHover={{ y: -2 }}
                  whileTap={{ scale: 0.98 }}
                  type="button"
                  onClick={() => setFormData({...formData, role: 'patient'})}
                  className={cn(
                    "relative py-4 rounded-2xl border-2 transition-all font-bold text-xs flex flex-col items-center gap-2 overflow-hidden",
                    formData.role === 'patient' 
                      ? "border-brand-600 bg-brand-50 text-brand-600 shadow-xl shadow-brand-600/10" 
                      : "border-slate-100 bg-slate-50/50 text-slate-400 hover:border-slate-200"
                  )}
                >
                  <div className={cn(
                    "w-10 h-10 rounded-xl flex items-center justify-center transition-colors shadow-sm",
                    formData.role === 'patient' ? "bg-brand-600 text-white" : "bg-white text-slate-400"
                  )}>
                    <User size={20} />
                  </div>
                  Patient
                  {formData.role === 'patient' && (
                    <motion.div layoutId="role-check" className="absolute top-1 right-1 flex items-center justify-center w-4 h-4 bg-brand-600 rounded-full text-white shadow-sm">
                       <Check size={10} />
                    </motion.div>
                  )}
                </motion.button>
                <motion.button
                  whileHover={{ y: -2 }}
                  whileTap={{ scale: 0.98 }}
                  type="button"
                  onClick={() => setFormData({...formData, role: 'pharmacist'})}
                  className={cn(
                    "relative py-4 rounded-2xl border-2 transition-all font-bold text-xs flex flex-col items-center gap-2 overflow-hidden",
                    formData.role === 'pharmacist' 
                      ? "border-emerald-600 bg-emerald-50 text-emerald-600 shadow-xl shadow-emerald-600/10" 
                      : "border-slate-100 bg-slate-50/50 text-slate-400 hover:border-slate-200"
                  )}
                >
                  <div className={cn(
                    "w-10 h-10 rounded-xl flex items-center justify-center transition-colors shadow-sm",
                    formData.role === 'pharmacist' ? "bg-emerald-600 text-white" : "bg-white text-slate-400"
                  )}>
                    <ShieldCheck size={20} />
                  </div>
                  Pharmacien
                  {formData.role === 'pharmacist' && (
                    <motion.div layoutId="role-check" className="absolute top-1 right-1 flex items-center justify-center w-4 h-4 bg-emerald-600 rounded-full text-white shadow-sm">
                       <Check size={10} />
                    </motion.div>
                  )}
                </motion.button>
              </div>
            </div>

            {formData.role === 'pharmacist' && (
              <motion.div 
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="space-y-4 p-5 rounded-2xl bg-emerald-50/50 border border-emerald-100 text-left"
              >
                <p className="text-[11px] font-medium text-emerald-800 leading-relaxed">
                  🔒 <strong>Note d'approbation requise :</strong> Pour garantir la conformité réglementaire, la création d'un compte Pharmacien nécessite la validation préalable de l'administrateur de <strong>Dokta</strong>.
                </p>

                <div className="space-y-2">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest px-1">Nom de la Pharmacie (Officine)</label>
                  <div className="relative group">
                    <Building2 className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-emerald-600 transition-colors" size={18} />
                    <input 
                      type="text" 
                      required={formData.role === 'pharmacist'}
                      placeholder="Ex: Pharmacie du Centre, Pharmacie de l'Avenue"
                      className="w-full bg-white border border-slate-200 rounded-xl md:rounded-2xl py-4 pl-12 pr-4 outline-none focus:ring-2 focus:ring-emerald-600/10 focus:border-emerald-600 transition-colors font-medium text-slate-900 placeholder:text-slate-400"
                      value={formData.pharmacyName}
                      onChange={(e) => setFormData({...formData, pharmacyName: e.target.value})}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest px-1">Code d'Autorisation Administrateur</label>
                  <div className="relative group">
                    <Key className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-emerald-600 transition-colors" size={18} />
                    <input 
                      type="text" 
                      required={formData.role === 'pharmacist'}
                      placeholder="Saisissez le code d'autorisation pro"
                      className="w-full bg-white border border-slate-200 rounded-xl md:rounded-2xl py-4 pl-12 pr-4 outline-none focus:ring-2 focus:ring-emerald-600/10 focus:border-emerald-600 transition-colors font-mono font-bold text-slate-900 placeholder:text-slate-400"
                      value={formData.inviteCode}
                      onChange={(e) => setFormData({...formData, inviteCode: e.target.value})}
                    />
                  </div>
                  <p className="text-[9px] text-slate-400 px-1">
                    Pour tester, utilisez le code temporaire : <span className="font-mono font-bold text-slate-600">DOKTA-PRO-2026</span>
                  </p>
                </div>
              </motion.div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              <div className="space-y-2">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest px-1">Mot de passe</label>
                <div className="relative group">
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-brand-600 transition-colors" size={18} />
                  <input 
                    type="password" 
                    required
                    placeholder="••••••••"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl md:rounded-2xl py-4 pl-12 pr-4 outline-none focus:ring-2 focus:ring-brand-600/10 focus:border-brand-600 focus:bg-white transition-colors font-medium text-slate-900 placeholder:text-slate-400"
                    value={formData.password}
                    onChange={(e) => {
                      const val = e.target.value;
                      setFormData({...formData, password: val});
                      checkPasswordStrength(val);
                    }}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest px-1">Confirmation</label>
                <div className="relative group">
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-brand-600 transition-colors" size={18} />
                  <input 
                    type="password" 
                    required
                    placeholder="••••••••"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl md:rounded-2xl py-4 pl-12 pr-4 outline-none focus:ring-2 focus:ring-brand-600/10 focus:border-brand-600 focus:bg-white transition-colors font-medium text-slate-900 placeholder:text-slate-400"
                    value={formData.confirmPassword}
                    onChange={(e) => setFormData({...formData, confirmPassword: e.target.value})}
                  />
                </div>
              </div>
            </div>
            
            {/* Password Strength Indicator */}
            <AnimatePresence>
              {formData.password && (
                <motion.div 
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="space-y-4 pt-2 overflow-hidden px-1"
                >
                  <div className="flex items-center gap-3">
                    <div className="flex-1 h-2 bg-slate-100 rounded-full overflow-hidden flex gap-1 p-0.5">
                      {[1, 2, 3, 4, 5].map((step) => (
                        <div 
                          key={step}
                          className={cn(
                            "flex-1 rounded-full transition-all duration-300",
                            passwordStrength.score >= step 
                              ? (passwordStrength.score < 3 ? "bg-rose-500" : passwordStrength.score < 5 ? "bg-amber-500" : "bg-emerald-500")
                              : "bg-slate-200"
                          )}
                        />
                      ))}
                    </div>
                    <span className={cn(
                      "text-[10px] font-black uppercase tracking-wider min-w-[70px] text-right",
                      passwordStrength.score < 3 ? "text-rose-500" : passwordStrength.score < 5 ? "text-amber-500" : "text-emerald-500"
                    )}>
                      {passwordStrength.feedback}
                    </span>
                  </div>
                  
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-y-2 gap-x-4 bg-slate-50 p-4 rounded-2xl border border-slate-100">
                    <RequirementItem met={passwordStrength.requirements.length} label="8+ caractères" />
                    <RequirementItem met={passwordStrength.requirements.uppercase} label="Majuscule" />
                    <RequirementItem met={passwordStrength.requirements.lowercase} label="Minuscule" />
                    <RequirementItem met={passwordStrength.requirements.number} label="Chiffre" />
                    <RequirementItem met={passwordStrength.requirements.special} label="Caractère spécial" />
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            <button 
              type="submit"
              disabled={isSubmitting}
              className="w-full bg-slate-900 text-white font-bold py-5 rounded-[2rem] shadow-2xl shadow-slate-900/20 hover:bg-slate-800 active:scale-95 transition-all text-lg flex items-center justify-center gap-3 disabled:opacity-50 mt-6"
            >
              {isSubmitting ? (
                <div className="flex items-center gap-2">
                   <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                   <span>Traitement...</span>
                </div>
              ) : (
                <>
                  <span>Créer mon compte</span>
                  <ArrowRight size={20} />
                </>
              )}
            </button>
          </form>

          <div className="pt-6 border-t border-slate-100">
            <p className="text-[10px] text-slate-400 text-center uppercase tracking-[0.2em] font-bold">
              En continuant, vous acceptez nos <a href="#" className="text-slate-900 underline underline-offset-4 decoration-slate-200 hover:decoration-brand-600 transition-all">conditions d'utilisation</a>
            </p>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
