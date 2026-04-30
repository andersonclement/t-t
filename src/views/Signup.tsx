import React, { useState } from 'react';
import { motion } from 'motion/react';
import { useAuth } from '../components/AuthContext';
import { ShieldCheck, HeartPulse, Mail, Lock, User, Phone, ArrowLeft, ArrowRight } from 'lucide-react';
import { Navigate, useNavigate, Link } from 'react-router-dom';

export function Signup() {
  const { user, loading, signUpWithEmail } = useAuth();
  const navigate = useNavigate();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: ''
  });

  if (loading) return null;
  if (user) return <Navigate to="/" replace />;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (formData.password !== formData.confirmPassword) {
      setError('Les mots de passe ne correspondent pas');
      return;
    }
    
    setIsSubmitting(true);
    setError(null);
    try {
      await signUpWithEmail(formData.email, formData.password, formData.name, formData.phone);
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
        className="w-full max-w-4xl bg-white rounded-[2rem] md:rounded-[3rem] shadow-2xl border border-slate-100 overflow-hidden flex flex-col md:flex-row mt-12 md:mt-0"
      >
        <div className="md:w-1/3 bg-slate-900 p-8 md:p-10 text-white flex flex-col justify-between relative overflow-hidden">
          <div className="relative z-10">
            <div className="w-10 h-10 md:w-12 md:h-12 bg-white/10 rounded-xl md:rounded-2xl flex items-center justify-center backdrop-blur-md mb-6 md:mb-8">
              <HeartPulse size={24} className="text-brand-400" />
            </div>
            <h2 className="text-xl md:text-2xl font-display font-bold leading-tight">Rejoignez l'aventure DiagPharma</h2>
          </div>
          <div className="relative z-10 space-y-4 mt-6 md:mt-0">
             <div className="flex items-center gap-3">
                <div className="w-2 h-2 bg-brand-400 rounded-full" />
                <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Santé Numérique</p>
             </div>
             <p className="text-[11px] md:text-xs text-slate-300 leading-relaxed">
               Gérez vos ordonnances, localisez les soins et accédez à des conseils personnalisés par IA.
             </p>
          </div>
          <div className="absolute top-0 right-0 w-64 h-64 bg-brand-600/20 rounded-full blur-[80px] -translate-y-1/2 translate-x-1/2" />
        </div>

        <div className="md:w-2/3 p-6 md:p-10 space-y-6 md:space-y-8">
          <div className="flex justify-between items-start">
            <h1 className="text-2xl md:text-3xl font-display font-bold text-slate-900">Créer un compte</h1>
            <Link to="/login" className="text-brand-600 text-xs md:text-sm font-bold hover:underline">Se connecter</Link>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="bg-red-50 text-red-600 p-4 rounded-2xl text-xs font-bold border border-red-100 animate-shake">
                {error}
              </div>
            )}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-widest px-1">Nom complet</label>
                <div className="relative">
                  <User className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                  <input 
                    type="text" 
                    required
                    placeholder="Andersson Clément"
                    className="w-full bg-slate-50 border border-slate-100 rounded-2xl py-4 pl-12 pr-4 focus:outline-none focus:ring-2 focus:ring-brand-600/20 focus:border-brand-600 transition-all font-medium"
                    value={formData.name}
                    onChange={(e) => setFormData({...formData, name: e.target.value})}
                  />
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-widest px-1">Téléphone</label>
                <div className="relative">
                  <Phone className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                  <input 
                    type="tel" 
                    required
                    placeholder="+237 6XX XXX XXX"
                    className="w-full bg-slate-50 border border-slate-100 rounded-2xl py-4 pl-12 pr-4 focus:outline-none focus:ring-2 focus:ring-brand-600/20 focus:border-brand-600 transition-all font-medium"
                    value={formData.phone}
                    onChange={(e) => setFormData({...formData, phone: e.target.value})}
                  />
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-500 uppercase tracking-widest px-1">Email</label>
              <div className="relative">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                <input 
                  type="email" 
                  required
                  placeholder="nom@exemple.com"
                  className="w-full bg-slate-50 border border-slate-100 rounded-2xl py-4 pl-12 pr-4 focus:outline-none focus:ring-2 focus:ring-brand-600/20 focus:border-brand-600 transition-all font-medium"
                  value={formData.email}
                  onChange={(e) => setFormData({...formData, email: e.target.value})}
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-widest px-1">Mot de passe</label>
                <div className="relative">
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                  <input 
                    type="password" 
                    required
                    placeholder="••••••••"
                    className="w-full bg-slate-50 border border-slate-100 rounded-2xl py-4 pl-12 pr-4 focus:outline-none focus:ring-2 focus:ring-brand-600/20 focus:border-brand-600 transition-all font-medium"
                    value={formData.password}
                    onChange={(e) => setFormData({...formData, password: e.target.value})}
                  />
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-widest px-1">Confirmation</label>
                <div className="relative">
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                  <input 
                    type="password" 
                    required
                    placeholder="••••••••"
                    className="w-full bg-slate-50 border border-slate-100 rounded-2xl py-4 pl-12 pr-4 focus:outline-none focus:ring-2 focus:ring-brand-600/20 focus:border-brand-600 transition-all font-medium"
                    value={formData.confirmPassword}
                    onChange={(e) => setFormData({...formData, confirmPassword: e.target.value})}
                  />
                </div>
              </div>
            </div>

            <button 
              type="submit"
              disabled={isSubmitting}
              className="w-full bg-brand-600 text-white font-bold py-4 md:py-5 rounded-xl md:rounded-[2rem] shadow-xl shadow-brand-600/20 hover:scale-[1.02] active:scale-95 transition-all text-base md:text-lg flex items-center justify-center gap-3 disabled:opacity-50"
            >
              {isSubmitting ? 'Création...' : 'Créer mon compte'}
              <ArrowRight size={20} />
            </button>
          </form>

          <p className="text-[10px] text-slate-400 text-center uppercase tracking-widest font-bold">
            En vous inscrivant, vous acceptez nos conditions d'utilisation
          </p>
        </div>
      </motion.div>
    </div>
  );
}
