import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useAuth } from '../components/AuthContext';
import { LogIn, Mail, ShieldCheck, HeartPulse, Activity, Lock, ArrowLeft, Sparkles } from 'lucide-react';
import { Navigate, Link, useNavigate, useLocation } from 'react-router-dom';

export function Login() {
  const { user, signInWithGoogle, signInAsDemo, signInWithEmail, resetPassword, loading } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [method, setMethod] = React.useState<'options' | 'email' | 'forgot-password'>(location.state?.email ? 'email' : 'options');
  const [email, setEmail] = React.useState(location.state?.email || '');
  const [password, setPassword] = React.useState('');
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [success, setSuccess] = React.useState<string | null>(null);
  const [isIframe, setIsIframe] = React.useState(false);

  React.useEffect(() => {
    setIsIframe(window.self !== window.top);
  }, []);

  if (loading) return null;
  if (user) return <Navigate to="/" replace />;

  const handleBack = () => {
    setMethod('options');
    setError(null);
    setSuccess(null);
  };

  const handleEmailLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);
    try {
      await signInWithEmail(email, password);
      navigate('/');
    } catch (err: any) {
      setError(err.message || 'Email ou mot de passe incorrect');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) {
      setError("Veuillez entrer votre adresse email.");
      return;
    }
    setIsSubmitting(true);
    setError(null);
    setSuccess(null);
    try {
      await resetPassword(email);
      setSuccess("Un email de récupération a été envoyé. Pensez à vérifier vos courriers indésirables (spam).");
      console.log("Password reset email sent to:", email);
    } catch (err: any) {
      console.error("Password Reset Error:", err);
      if (err.code === 'auth/too-many-requests') {
        setError("Trop de tentatives. Veuillez réessayer plus tard.");
      } else if (err.code === 'auth/invalid-email') {
        setError("Format d'email invalide.");
      } else {
        setError(err.message || "Une erreur est survenue lors de l'envoi du mail.");
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleGoogleLogin = async () => {
    setIsSubmitting(true);
    setError(null);
    try {
      await signInWithGoogle();
      // Le Navigate s'activera automatiquement via l'état user
    } catch (err: any) {
      console.error("Google Auth Error:", err);
      if (err.code === 'auth/popup-blocked') {
        setError("Le popup de connexion a été bloqué par votre navigateur. Astuce: Ouvrez l'application dans un nouvel onglet (icône en haut à droite) ou autorisez les popups.");
      } else if (err.code === 'auth/popup-closed-by-user') {
        setError("La fenêtre de connexion Google a été fermée. Astuce: Les navigateurs bloquent souvent la connexion Google dans les cadres d'aperçu (iframes). Ouvrez l'application dans un nouvel onglet (bouton en haut à droite) ou utilisez la connexion par e-mail.");
      } else if (err.code === 'auth/operation-not-allowed') {
        setError("La connexion Google n'est pas activée dans votre console Firebase. Activez-la dans Authentication > Sign-in method.");
      } else if (err.code === 'auth/unauthorized-domain') {
        setError("Ce domaine n'est pas autorisé dans votre console Firebase. Ajoutez-le dans Authentication > Settings > Authorized domains.");
      } else if (err.code === 'auth/cancelled-popup-request') {
        // Ignorer si une autre requête est déjà en cours
      } else if (err.code === 'auth/network-request-failed') {
        setError("Erreur réseau. Vérifiez votre connexion internet.");
      } else {
        setError(`Erreur lors de la connexion Google (${err.code || 'Inconnue'}). Veuillez réessayer. Astuce: Essayez d'ouvrir l'application dans un nouvel onglet.`);
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDemoLogin = async () => {
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

  return (
    <div className="min-h-screen bg-[#FDFDFF] flex items-center justify-center p-4 md:p-6 bg-[radial-gradient(circle_at_bottom_left,_var(--tw-gradient-stops))] from-brand-50/50 via-transparent to-transparent">
      <button 
        onClick={() => navigate('/welcome')}
        className="fixed top-4 md:top-8 left-4 md:left-8 p-3 bg-white rounded-xl md:rounded-2xl border border-slate-100 shadow-sm hover:shadow-md transition-all text-slate-500 hover:text-brand-600 flex items-center gap-2 font-bold text-sm z-50"
      >
        <ArrowLeft size={18} />
        <span className="hidden sm:inline">Retour à l'accueil</span>
      </button>

      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md pt-12 md:pt-0"
      >
        <div className="bg-white rounded-[2rem] md:rounded-[3rem] shadow-2xl border border-slate-100 overflow-hidden">
          {/* Header */}
          <div className="p-6 md:p-10 text-center space-y-4 md:space-y-6">
            <div className="inline-flex items-center justify-center w-16 h-16 md:w-20 md:h-20 bg-brand-50 rounded-[1.5rem] md:rounded-[2rem] text-brand-600 relative group transition-transform hover:scale-110">
              <HeartPulse size={32} className="md:w-10 md:h-10" />
              <motion.div 
                animate={{ scale: [1, 1.2, 1] }}
                transition={{ repeat: Infinity, duration: 2 }}
                className="absolute -top-1 -right-1 w-6 h-6 bg-rose-500 rounded-full flex items-center justify-center text-white text-[10px]"
              >
                <Activity size={12} />
              </motion.div>
            </div>
            <div>
              <h1 className="text-3xl font-display font-bold text-slate-900 tracking-tight">Medimap</h1>              <p className="text-slate-500 mt-2 font-medium">Santé & Pharmacie Connectée au Cameroun</p>
            </div>
          </div>

          <div className="px-6 md:px-10 pb-8 md:pb-10 space-y-4">
            {error && (
              <div className="bg-red-50 text-red-600 p-4 rounded-xl md:rounded-2xl text-[10px] md:text-xs font-bold border border-red-100 mb-4 animate-shake text-center">
                {error}
              </div>
            )}
            {success && (
              <div className="bg-emerald-50 text-emerald-600 p-4 rounded-xl md:rounded-2xl text-[10px] md:text-xs font-bold border border-emerald-100 mb-4 text-center">
                {success}
              </div>
            )}
            <AnimatePresence mode="wait">
              {method === 'options' ? (
                <motion.div 
                  key="options"
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  className="space-y-3 md:space-y-4"
                >
                  {isIframe && (
                    <div className="bg-amber-50 border border-amber-100 rounded-2xl p-4 text-xs text-amber-800 space-y-3 mb-2 text-left">
                      <div className="flex items-start gap-2.5">
                        <span className="text-base shrink-0 mt-0.5">💡</span>
                        <div>
                          <p className="font-bold text-amber-950">Aperçu limité par le navigateur</p>
                          <p className="mt-1 leading-relaxed text-[11px] text-amber-900/90 font-medium">
                            Les navigateurs bloquent la connexion Google dans les cadres d'aperçu intégrés (iframes). 
                            Veuillez ouvrir l'application dans un nouvel onglet pour vous connecter avec Google en toute sécurité.
                          </p>
                        </div>
                      </div>
                      <div className="flex justify-end pt-1">
                        <a 
                          href={window.location.href} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="bg-amber-600 hover:bg-amber-700 text-white font-extrabold px-3 py-2 rounded-xl text-[10px] uppercase tracking-wider inline-flex items-center gap-1.5 transition-all shadow-sm active:scale-95"
                        >
                          Ouvrir dans un nouvel onglet
                        </a>
                      </div>
                    </div>
                  )}

                  <button 
                    onClick={handleDemoLogin}
                    disabled={isSubmitting}
                    className="w-full bg-slate-900 hover:bg-slate-800 text-white font-bold py-3.5 md:py-4 rounded-xl md:rounded-2xl flex items-center justify-center gap-3 transition-all shadow-lg active:scale-95 text-sm md:text-base disabled:opacity-50 border border-slate-900"
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
                    onClick={handleGoogleLogin}
                    disabled={isSubmitting}
                    className="w-full bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 font-bold py-3.5 md:py-4 rounded-xl md:rounded-2xl flex items-center justify-center gap-3 transition-all shadow-sm active:scale-95 text-sm md:text-base disabled:opacity-50"
                  >
                    <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" className="w-5 h-5" alt="Google" />
                    Continuer avec Google
                  </button>

                  <div className="flex flex-col gap-3 md:gap-4">
                    <button 
                      onClick={() => setMethod('email')}
                      className="bg-slate-50 hover:bg-slate-100 text-slate-700 font-bold py-3.5 md:py-4 rounded-xl md:rounded-2xl flex items-center justify-center gap-3 transition-all group"
                    >
                      <Mail size={18} className="text-brand-600 group-hover:scale-110 transition-transform md:w-5 md:h-5" />
                      <span className="text-xs">Continuer avec Email</span>
                    </button>
                  </div>
                </motion.div>
              ) : (
                <motion.div 
                  key="form"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="space-y-6"
                >
                  {method === 'email' ? (
                    <form onSubmit={handleEmailLogin} className="space-y-4">
                       <div className="space-y-2">
                        <label className="text-xs font-bold text-slate-500 uppercase tracking-widest px-1">Adresse Email</label>
                        <div className="relative">
                          <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                          <input 
                            type="email" 
                            required
                            placeholder="votre@email.com"
                            className="w-full bg-slate-50 border border-slate-100 rounded-2xl py-4 pl-12 pr-4 focus:outline-none focus:ring-2 focus:ring-brand-600/20 focus:border-brand-600 transition-all font-medium"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                          />
                        </div>
                      </div>
                      <div className="space-y-2">
                        <label className="text-xs font-bold text-slate-500 uppercase tracking-widest px-1">Mot de passe</label>
                        <div className="relative">
                          <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                          <input 
                            type="password" 
                            required
                            placeholder="••••••••"
                            className="w-full bg-slate-50 border border-slate-100 rounded-2xl py-4 pl-12 pr-4 focus:outline-none focus:ring-2 focus:ring-brand-600/20 focus:border-brand-600 transition-all font-medium"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                          />
                        </div>
                        <div className="flex justify-end px-1">
                          <button 
                            type="button"
                            onClick={() => {
                              setMethod('forgot-password');
                              setError(null);
                              setSuccess(null);
                            }}
                            className="text-[10px] md:text-xs font-bold text-brand-600 hover:underline"
                          >
                            Mot de passe oublié ?
                          </button>
                        </div>
                      </div>
                      <div className="flex gap-3">
                        <button 
                          type="button"
                          onClick={handleBack}
                          className="w-14 h-14 bg-slate-50 border border-slate-100 rounded-2xl flex items-center justify-center text-slate-400 hover:text-brand-600 hover:bg-brand-50 transition-all"
                        >
                          <LogIn className="rotate-180" size={20} />
                        </button>
                        <button 
                          type="submit"
                          disabled={isSubmitting}
                          className="flex-1 bg-slate-900 text-white font-bold py-4 rounded-2xl shadow-xl shadow-slate-900/10 hover:bg-brand-600 transition-all disabled:opacity-50"
                        >
                          {isSubmitting ? 'Connexion...' : 'Se connecter'}
                        </button>
                      </div>
                    </form>
                  ) : (
                    <form onSubmit={handleForgotPassword} className="space-y-6">
                      <div className="space-y-2">
                        <label className="text-xs font-bold text-slate-500 uppercase tracking-widest px-1">Adresse Email</label>
                        <p className="text-[10px] text-slate-400 leading-tight px-1 pb-1">
                          Entrez votre adresse email pour recevoir un lien de réinitialisation.
                        </p>
                        <div className="relative">
                          <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                          <input 
                            type="email" 
                            required
                            placeholder="votre@email.com"
                            className="w-full bg-slate-50 border border-slate-100 rounded-2xl py-4 pl-12 pr-4 focus:outline-none focus:ring-2 focus:ring-brand-600/20 focus:border-brand-600 transition-all font-medium"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                          />
                        </div>
                      </div>

                      <div className="flex gap-3">
                        <button 
                          type="button"
                          onClick={() => setMethod('email')}
                          className="w-14 h-14 bg-slate-50 border border-slate-100 rounded-2xl flex items-center justify-center text-slate-400 hover:text-brand-600 hover:bg-brand-50 transition-all"
                        >
                          <LogIn className="rotate-180" size={20} />
                        </button>
                        <button 
                          type="submit"
                          disabled={isSubmitting}
                          className="flex-1 bg-slate-900 text-white font-bold py-4 rounded-2xl shadow-xl shadow-slate-900/10 hover:bg-brand-600 transition-all disabled:opacity-50"
                        >
                          {isSubmitting ? 'Envoi...' : 'Envoyer le lien'}
                        </button>
                      </div>
                    </form>
                  )}
                </motion.div>
              )}
            </AnimatePresence>

            <div className="pt-8 border-t border-slate-50">
              <div className="flex items-start gap-4 bg-slate-50 p-5 rounded-[1.5rem] border border-slate-100">
                <ShieldCheck className="text-brand-500 shrink-0 mt-0.5" size={18} />
                <p className="text-[11px] text-slate-500 leading-relaxed font-medium">
                  Vos données médicales sont protégées par chiffrement de bout en bout. Medimap respecte la souveraineté numérique du Cameroun.
                </p>
              </div>
            </div>
          </div>

          <div className="p-8 bg-slate-900 text-center">
            <p className="text-white/60 text-sm">
              Pas encore de compte ? <Link to="/signup" className="text-brand-400 font-bold hover:underline">S'inscrire gratuitement</Link>
            </p>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
