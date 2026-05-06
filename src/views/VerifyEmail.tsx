import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { useAuth } from '../components/AuthContext';
import { Mail, CheckCircle2, ArrowRight, LogOut, RefreshCcw } from 'lucide-react';
import { Navigate } from 'react-router-dom';

export function VerifyEmail() {
  const { user, resendVerification, refreshUser, logout } = useAuth();
  const [resending, setResending] = useState(false);
  const [checking, setChecking] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);

  useEffect(() => {
    // Check status periodically if user is logged in but not verified
    let interval: NodeJS.Timeout;
    if (user && !user.emailVerified) {
      interval = setInterval(async () => {
        try {
          await refreshUser();
          console.log("Checking verification status...");
        } catch (err: any) {
          // If network fails, we'll just wait for the next interval
          if (err.code === 'auth/network-request-failed') {
            return;
          }
          console.error("Verification check failed:", err);
        }
      }, 10000); // 10 seconds is more reasonable for background checks
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [user?.emailVerified]);

  if (!user) return <Navigate to="/welcome" replace />;
  if (user.emailVerified) return <Navigate to="/" replace />;

  const handleResend = async () => {
    setResending(true);
    setMessage(null);
    try {
      await resendVerification();
      setMessage({ type: 'success', text: 'Email de vérification envoyé ! Pensez à vérifier vos spams.' });
      console.log("Verification email resent to:", user?.email);
    } catch (err: any) {
      console.error("Resend Verification Error:", err);
      if (err.code === 'auth/too-many-requests') {
        setMessage({ type: 'error', text: "Trop de tentatives. Veuillez attendre quelques minutes avant de réessayer." });
      } else {
        setMessage({ type: 'error', text: err.message || "Erreur lors de l'envoi. Veuillez réessayer plus tard." });
      }
    } finally {
      setResending(false);
    }
  };

  const handleCheck = async () => {
    setChecking(true);
    try {
      await refreshUser();
    } catch (err) {
      console.error(err);
    } finally {
      setChecking(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-md w-full bg-white rounded-[2.5rem] p-8 md:p-12 shadow-2xl shadow-slate-200 border border-slate-100 text-center space-y-8"
      >
        <div className="w-20 h-20 bg-brand-50 rounded-3xl flex items-center justify-center mx-auto text-brand-600">
          <Mail size={40} />
        </div>

        <div className="space-y-2">
          <h1 className="text-3xl font-display font-bold text-slate-900">Vérifiez votre email</h1>
          <p className="text-slate-500 leading-relaxed max-w-xs mx-auto">
            Nous avons envoyé un lien de confirmation à <br/>
            <span className="font-bold text-slate-900 break-all">{user.email}</span>.
          </p>
          <div className="bg-amber-50 p-3 rounded-xl border border-amber-100 mt-4">
             <p className="text-[10px] text-amber-800 font-medium">
               Pensez à regarder dans vos <strong>courriers indésirables (spam)</strong> si vous ne voyez rien.
             </p>
          </div>
        </div>

        {message && (
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className={`p-4 rounded-2xl text-sm font-medium ${
              message.type === 'success' ? 'bg-emerald-50 text-emerald-700' : 'bg-red-50 text-red-700'
            }`}
          >
            {message.text}
          </motion.div>
        )}

        <div className="space-y-3">
          <button
            onClick={handleCheck}
            disabled={checking}
            className="w-full bg-brand-600 text-white rounded-2xl py-4 font-bold flex items-center justify-center gap-2 shadow-lg shadow-brand-600/20 active:scale-[0.98] transition-all disabled:opacity-50"
          >
            {checking ? <RefreshCcw className="animate-spin" size={20} /> : <CheckCircle2 size={20} />}
            J'ai vérifié mon email
          </button>

          <button
            onClick={() => window.location.reload()}
            className="w-full bg-white text-slate-600 border border-slate-200 rounded-2xl py-4 font-bold flex items-center justify-center gap-2 hover:bg-slate-50 active:scale-[0.98] transition-all"
          >
            <RefreshCcw size={18} />
            Actualiser la page
          </button>

          <button
            onClick={handleResend}
            disabled={resending}
            className="w-full bg-slate-50 text-slate-400 rounded-2xl py-3 font-bold flex items-center justify-center gap-2 hover:bg-slate-100 active:scale-[0.98] transition-all disabled:opacity-50 text-xs"
          >
            {resending ? <RefreshCcw className="animate-spin" size={14} /> : <RefreshCcw size={14} />}
            Renvoyer l'email
          </button>
        </div>

        <div className="pt-6 border-t border-slate-100">
          <button
            onClick={logout}
            className="text-slate-400 hover:text-red-500 font-bold text-sm flex items-center justify-center gap-2 mx-auto transition-colors"
          >
            <LogOut size={16} />
            Se déconnecter
          </button>
        </div>
      </motion.div>
    </div>
  );
}
