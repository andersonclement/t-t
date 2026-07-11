import React from 'react';
import { motion } from 'motion/react';
import { 
  ShieldCheck, 
  Search, 
  MapPin, 
  Smartphone, 
  Sparkles, 
  ArrowRight,
  HeartPulse,
  Leaf,
  Stethoscope
} from 'lucide-react';
import { useNavigate, Navigate } from 'react-router-dom';
import { useAuth } from '../components/AuthContext';

export function Landing() {
  const navigate = useNavigate();
  const { user, loading } = useAuth();

  if (!loading && user) {
    return <Navigate to="/" replace />;
  }

  return (
    <div className="min-h-screen bg-[#FDFDFF] text-slate-900 font-sans selection:bg-brand-100 selection:text-brand-700">
      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-white/80 backdrop-blur-xl border-b border-slate-100">
        <div className="max-w-7xl mx-auto px-4 md:px-6 h-16 md:h-20 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 md:w-10 md:h-10 bg-brand-600 rounded-lg md:rounded-xl flex items-center justify-center shadow-lg shadow-brand-600/20">
              <HeartPulse className="text-white" size={20} />
            </div>
            <span className="text-lg md:text-xl font-display font-bold tracking-tight">Medimap</span>
          </div>
          <div className="flex items-center gap-4 md:gap-8">
            <div className="hidden md:flex items-center gap-8">
              <a href="#features" className="text-sm font-semibold text-slate-500 hover:text-brand-600 transition-colors">Services</a>
              <a href="#" className="text-sm font-semibold text-slate-500 hover:text-brand-600 transition-colors">À propos</a>
            </div>
            <button 
              onClick={() => navigate('/login')}
              className="bg-slate-900 text-white px-4 md:px-6 py-2 md:py-2.5 rounded-lg md:rounded-xl text-xs md:text-sm font-bold shadow-xl shadow-slate-900/10 hover:scale-105 active:scale-95 transition-all"
            >
              Se Connecter
            </button>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="pt-28 md:pt-40 pb-12 md:pb-20 px-4 md:px-6">
        <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-10 md:gap-16 items-center">
          <motion.div 
            initial={{ opacity: 0, x: -30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8 }}
            className="space-y-6 md:space-y-8 text-center lg:text-left"
          >
            <div className="inline-flex items-center gap-2 bg-emerald-50 text-emerald-700 px-3 md:px-4 py-1.5 md:py-2 rounded-full text-[10px] md:text-xs font-bold uppercase tracking-widest border border-emerald-100">
               <Sparkles size={14} />
               Propulsé par Care IA
            </div>
            <h1 className="text-4xl md:text-7xl font-display font-bold leading-tight tracking-tight text-slate-900">
              Votre santé au <br className="hidden md:block" />
              <span className="text-brand-600">Cameroun</span>, simplifiée.
            </h1>
            <p className="text-lg md:text-xl text-slate-600 leading-relaxed max-w-lg mx-auto lg:mx-0">
              Medimap centralise pharmacies, hôpitaux et laboratoires. Analysez vos ordonnances par IA et trouvez vos médicaments instantanément au meilleur prix.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 px-4 sm:px-0">
              <button 
                onClick={() => navigate('/signup')}
                className="bg-brand-600 text-white px-8 md:px-10 py-4 md:py-5 rounded-xl md:rounded-2xl font-bold text-base md:text-lg shadow-2xl shadow-brand-600/30 hover:scale-105 active:scale-95 transition-all flex items-center justify-center gap-3"
              >
                Commencer gratuitement
                <ArrowRight size={20} />
              </button>
              <button 
                onClick={() => navigate('/login')}
                className="bg-white border border-slate-200 text-slate-900 px-8 md:px-10 py-4 md:py-5 rounded-xl md:rounded-2xl font-bold text-base md:text-lg hover:bg-slate-50 transition-all flex items-center justify-center gap-3"
              >
                Explorer l'App
              </button>
            </div>
            <div className="flex flex-col md:flex-row items-center gap-4 md:gap-6 pt-4">
              <div className="flex -space-x-3">
                {[1,2,3,4].map(i => (
                  <div key={i} className="w-8 h-8 md:w-10 md:h-10 rounded-full border-2 border-white bg-slate-200 overflow-hidden shadow-sm">
                    <img src={`https://i.pravatar.cc/100?img=${i+10}`} alt="User" />
                  </div>
                ))}
              </div>
              <p className="text-xs md:text-sm font-medium text-slate-500">
                Rejoint par <span className="text-slate-900 font-bold">+2,000</span> utilisateurs à Douala & Yaoundé.
              </p>
            </div>
          </motion.div>

          <motion.div 
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 1 }}
            className="relative px-4 md:px-0"
          >
            <div className="relative z-10 bg-white rounded-[2rem] md:rounded-[3rem] p-3 md:p-4 shadow-[0_50px_100px_-20px_rgba(0,0,0,0.1)] border border-slate-100">
              <img 
                src="https://images.unsplash.com/photo-1576091160550-217359f4ecf8?w=800&h=1000&fit=crop" 
                className="rounded-[1.5rem] md:rounded-[2.5rem] w-full" 
                alt="Health App" 
              />
              <div className="absolute -bottom-6 md:-bottom-10 -left-2 md:-left-10 bg-white p-4 md:p-6 rounded-2xl md:rounded-3xl shadow-2xl border border-slate-50 space-y-2 md:space-y-4 max-w-[160px] md:max-w-xs animate-bounce-slow">
                 <div className="flex items-center gap-2 md:gap-3">
                    <div className="w-8 h-8 md:w-10 md:h-10 bg-emerald-500 rounded-lg md:rounded-xl flex items-center justify-center shrink-0">
                       <ShieldCheck className="text-white" size={16} />
                    </div>
                    <div>
                       <p className="text-[10px] font-bold text-slate-400 uppercase">Ordonnance</p>
                       <p className="text-xs md:text-sm font-bold text-slate-900 leading-tight">Analyse 100% Validée</p>
                    </div>
                 </div>
              </div>
            </div>
            <div className="absolute -top-10 -right-10 bg-brand-600 p-8 rounded-full blur-[100px] opacity-20 w-40 h-40 md:w-80 md:h-80" />
            <div className="absolute -bottom-10 -left-10 bg-emerald-500 p-8 rounded-full blur-[100px] opacity-20 w-40 h-40 md:w-80 md:h-80" />
          </motion.div>
        </div>
      </section>

      {/* Stats */}
      <section className="bg-slate-900 py-20">
        <div className="max-w-7xl mx-auto px-6 grid grid-cols-2 md:grid-cols-4 gap-12 text-center">
          <div>
            <p className="text-4xl font-display font-bold text-white mb-2">150+</p>
            <p className="text-slate-400 text-sm font-bold uppercase tracking-widest">Pharmacies</p>
          </div>
          <div>
            <p className="text-4xl font-display font-bold text-white mb-2">24/7</p>
            <p className="text-slate-400 text-sm font-bold uppercase tracking-widest">Urgence 15</p>
          </div>
          <div>
            <p className="text-4xl font-display font-bold text-white mb-2">99%</p>
            <p className="text-slate-400 text-sm font-bold uppercase tracking-widest">IA Précision</p>
          </div>
          <div>
            <p className="text-4xl font-display font-bold text-white mb-2">FCFA</p>
            <p className="text-slate-400 text-sm font-bold uppercase tracking-widest">Paiement Mobile</p>
          </div>
        </div>
      </section>

      {/* Features */}
      <section id="features" className="py-32 px-6 bg-white">
        <div className="max-w-7xl mx-auto">
          <div className="text-center max-w-2xl mx-auto mb-20 space-y-4">
            <h2 className="text-brand-600 font-bold uppercase tracking-widest text-sm">Nos Services</h2>
            <p className="text-4xl font-display font-bold text-slate-900 leading-tight">
              Tout ce dont vous avez besoin pour gérer votre santé sereinement.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <FeatureCard 
              icon={<Smartphone className="text-brand-600" size={32} />}
              title="Numérisation IA"
              description="Prenez une photo de votre ordonnance. Notre IA extrait les molécules et vérifie la disponibilité instantanément."
            />
            <FeatureCard 
              icon={<MapPin className="text-emerald-500" size={32} />}
              title="Géolocalisation"
              description="Trouvez l'hôpital ou la pharmacie de garde la plus proche de vous au Cameroun avec les tarifs en temps réel."
            />
            <FeatureCard 
              icon={<Leaf className="text-orange-500" size={32} />}
              title="Remèdes Naturels"
              description="Accédez à un catalogue de recettes ancestrales validées scientifiquement pour les soins courants."
            />
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-slate-50 py-20 px-6 border-t border-slate-100">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-8">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-brand-600 rounded-lg flex items-center justify-center">
              <HeartPulse className="text-white" size={18} />
            </div>
            <span className="text-lg font-display font-bold">Medimap</span>
          </div>
          <p className="text-slate-500 text-sm">© 2026 Medimap Cameroun. Tous droits réservés.</p>
          <div className="flex items-center gap-6">
            <a href="#" className="text-slate-400 hover:text-slate-900 transition-colors">Politique de confidentialité</a>
            <a href="#" className="text-slate-400 hover:text-slate-900 transition-colors">Mentions légales</a>
          </div>
        </div>
      </footer>
    </div>
  );
}

function FeatureCard({ icon, title, description }: { icon: React.ReactNode; title: string; description: string }) {
  return (
    <div className="bg-[#FDFDFF] p-10 rounded-[2.5rem] border border-slate-100 hover:shadow-2xl hover:shadow-slate-200/50 transition-all group">
      <div className="w-16 h-16 bg-white rounded-2xl flex items-center justify-center shadow-sm border border-slate-100 mb-8 group-hover:scale-110 transition-transform">
        {icon}
      </div>
      <h3 className="text-xl font-display font-bold text-slate-900 mb-4">{title}</h3>
      <p className="text-slate-500 leading-relaxed text-sm font-medium">{description}</p>
    </div>
  );
}
