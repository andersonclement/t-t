import React from 'react';
import { motion } from 'motion/react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, HeartPulse, ShieldCheck, Sparkles, Truck } from 'lucide-react';
import { cn } from '../lib/utils';

const HIGHLIGHTS = [
  { icon: <Truck size={16} />, title: 'Livraison suivie', body: 'Vos médicaments livrés depuis une officine agréée près de chez vous.' },
  { icon: <Sparkles size={16} />, title: 'Care IA', body: 'Une orientation santé immédiate, adaptée à votre profil médical.' },
  { icon: <ShieldCheck size={16} />, title: 'Professionnels vérifiés', body: 'Chaque pharmacie, clinique et cabinet est validé avant publication.' },
];

/**
 * Shared shell for the authentication screens: a brand panel on large
 * viewports, the form alone on mobile. Keeps Login and Signup visually
 * identical instead of each inventing its own layout.
 */
export function AuthLayout({
  eyebrow,
  title,
  subtitle,
  children,
  wide = false,
}: {
  eyebrow?: string;
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  /** Signup needs more room for its role picker. */
  wide?: boolean;
}) {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-slate-50 lg:grid lg:grid-cols-[minmax(0,1fr)_minmax(0,1.1fr)]">
      {/* Brand panel — desktop only */}
      <aside className="hidden lg:flex flex-col justify-between bg-slate-900 text-white p-12 relative overflow-hidden">
        <div
          aria-hidden="true"
          className="absolute -top-24 -left-24 w-96 h-96 bg-brand-600/25 blur-3xl rounded-full"
        />
        <div
          aria-hidden="true"
          className="absolute bottom-0 right-0 w-80 h-80 bg-blue-500/15 blur-3xl rounded-full translate-y-1/3"
        />

        <div className="relative">
          <button
            onClick={() => navigate('/welcome')}
            className="flex items-center gap-2.5 group"
          >
            <span className="w-10 h-10 bg-brand-600 rounded-xl flex items-center justify-center shadow-lg shadow-brand-600/30">
              <HeartPulse size={22} />
            </span>
            <span className="font-display font-bold text-xl">Dokta</span>
          </button>
        </div>

        <div className="relative space-y-8 max-w-md">
          <div className="space-y-3">
            <h2 className="font-display font-bold text-3xl leading-tight">
              La santé du Cameroun,{' '}
              <span className="text-brand-400">connectée.</span>
            </h2>
            <p className="text-slate-400 text-sm leading-relaxed">
              Pharmacies, cliniques et naturopathes réunis sur une seule plateforme —
              pour les patients comme pour les professionnels.
            </p>
          </div>

          <ul className="space-y-4">
            {HIGHLIGHTS.map((item, i) => (
              <motion.li
                key={item.title}
                initial={{ opacity: 0, x: -12 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.1 + i * 0.08 }}
                className="flex items-start gap-3"
              >
                <span className="w-9 h-9 rounded-xl bg-white/10 flex items-center justify-center shrink-0 text-brand-400">
                  {item.icon}
                </span>
                <div>
                  <p className="font-bold text-sm">{item.title}</p>
                  <p className="text-slate-400 text-xs leading-relaxed mt-0.5">{item.body}</p>
                </div>
              </motion.li>
            ))}
          </ul>
        </div>

        <p className="relative text-[11px] text-slate-500">
          © {new Date().getFullYear()} Dokta — Douala, Cameroun
        </p>
      </aside>

      {/* Form panel */}
      <main className="flex flex-col min-h-screen lg:min-h-0 px-4 py-6 md:px-8 md:py-10">
        <button
          onClick={() => navigate('/welcome')}
          className="lg:hidden self-start flex items-center gap-2 text-sm font-bold text-slate-500 hover:text-brand-600 transition-colors mb-6"
        >
          <ArrowLeft size={18} />
          Accueil
        </button>

        <div className="flex-1 flex items-center justify-center">
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            className={cn('w-full', wide ? 'max-w-2xl' : 'max-w-md')}
          >
            {/* Mobile logo */}
            <div className="lg:hidden flex items-center justify-center gap-2.5 mb-8">
              <span className="w-10 h-10 bg-brand-600 rounded-xl flex items-center justify-center text-white shadow-lg shadow-brand-600/20">
                <HeartPulse size={22} />
              </span>
              <span className="font-display font-bold text-xl text-slate-900">Dokta</span>
            </div>

            <div className="text-center lg:text-left space-y-1.5 mb-6 md:mb-8">
              {eyebrow && (
                <p className="text-xs text-brand-600 font-bold uppercase tracking-widest">{eyebrow}</p>
              )}
              <h1 className="text-2xl md:text-3xl font-display font-bold text-slate-900">{title}</h1>
              {subtitle && <p className="text-sm text-slate-500 font-medium">{subtitle}</p>}
            </div>

            {children}
          </motion.div>
        </div>
      </main>
    </div>
  );
}
