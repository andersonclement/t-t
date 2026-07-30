import React from 'react';
import { motion } from 'motion/react';
import { Link, Navigate, useNavigate } from 'react-router-dom';
import {
  ArrowRight,
  Building2,
  Compass,
  HeartPulse,
  Leaf,
  MapPin,
  Pill,
  ShieldCheck,
  Sparkles,
  Truck,
} from 'lucide-react';
import { useAuth } from '../components/AuthContext';
import { RoleIcon } from '../components/RoleIcon';
import { PROFESSIONAL_ROLES, ROLES } from '../lib/roles';
import { cn } from '../lib/utils';

const FEATURES = [
  {
    icon: <Pill size={20} />,
    tone: 'bg-emerald-50 text-emerald-600',
    title: 'Vos médicaments, livrés',
    body: "Commandez auprès d'une officine agréée près de chez vous et suivez la livraison en temps réel.",
  },
  {
    icon: <Sparkles size={20} />,
    tone: 'bg-amber-50 text-amber-600',
    title: 'Care IA',
    body: 'Une orientation santé immédiate qui tient compte de vos allergies, antécédents et traitements en cours.',
  },
  {
    icon: <MapPin size={20} />,
    tone: 'bg-blue-50 text-blue-600',
    title: 'Carte de santé',
    body: 'Pharmacies de garde, hôpitaux et laboratoires géolocalisés, avec itinéraire calculé.',
  },
  {
    icon: <ShieldCheck size={20} />,
    tone: 'bg-violet-50 text-violet-600',
    title: 'Professionnels vérifiés',
    body: 'Chaque établissement fournit un dossier technique validé par un administrateur avant publication.',
  },
];

const STEPS = [
  { n: '01', title: 'Décrivez votre besoin', body: 'Un symptôme, une ordonnance à renouveler, un médicament précis.' },
  { n: '02', title: 'Choisissez un établissement', body: 'Comparez distance, disponibilité et horaires de garde.' },
  { n: '03', title: 'Recevez ou retirez', body: 'Livraison à domicile ou retrait au comptoir, selon votre préférence.' },
];

export function Landing() {
  const navigate = useNavigate();
  const { user, loading } = useAuth();

  if (!loading && user) {
    return <Navigate to="/" replace />;
  }

  return (
    <div className="min-h-screen bg-white">
      {/* ── Navbar ────────────────────────────────────────────── */}
      <header className="sticky top-0 z-50 bg-white/90 backdrop-blur-md border-b border-slate-100">
        <div className="max-w-7xl mx-auto px-4 md:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <span className="w-9 h-9 bg-brand-600 rounded-xl flex items-center justify-center text-white shadow-lg shadow-brand-600/20">
              <HeartPulse size={20} />
            </span>
            <span className="font-display font-bold text-lg md:text-xl text-slate-900">Dokta</span>
          </div>

          <nav className="flex items-center gap-2 md:gap-3">
            <Link
              to="/login"
              className="px-3 md:px-4 py-2 rounded-xl text-xs md:text-sm font-bold text-slate-600 hover:text-slate-900 hover:bg-slate-50 transition-colors"
            >
              Connexion
            </Link>
            <Link
              to="/signup"
              className="px-4 md:px-5 py-2 md:py-2.5 rounded-xl bg-slate-900 text-white text-xs md:text-sm font-bold hover:bg-slate-800 transition-colors"
            >
              Créer un compte
            </Link>
          </nav>
        </div>
      </header>

      {/* ── Hero ──────────────────────────────────────────────── */}
      <section className="relative overflow-hidden">
        <div
          aria-hidden="true"
          className="absolute top-0 right-0 w-[36rem] h-[36rem] bg-brand-100/40 blur-3xl rounded-full -translate-y-1/3 translate-x-1/4"
        />
        <div
          aria-hidden="true"
          className="absolute bottom-0 left-0 w-96 h-96 bg-blue-100/30 blur-3xl rounded-full translate-y-1/3"
        />

        <div className="relative max-w-7xl mx-auto px-4 md:px-8 pt-14 pb-16 md:pt-24 md:pb-24 grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-6 text-center lg:text-left"
          >
            <span className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-brand-50 text-brand-700 text-[11px] font-bold uppercase tracking-widest border border-brand-100">
              <span className="w-1.5 h-1.5 rounded-full bg-brand-600 animate-pulse" />
              Douala · Yaoundé · Cameroun
            </span>

            <h1 className="text-3xl sm:text-4xl md:text-5xl font-display font-bold text-slate-900 leading-[1.1]">
              Toute la santé du Cameroun,{' '}
              <span className="text-brand-600">à portée de main.</span>
            </h1>

            <p className="text-sm md:text-base text-slate-500 leading-relaxed max-w-lg mx-auto lg:mx-0">
              Trouvez une pharmacie de garde, commandez vos médicaments, consultez une clinique ou
              un naturopathe — et gardez Care IA à vos côtés pour vous orienter.
            </p>

            <div className="flex flex-col sm:flex-row gap-3 justify-center lg:justify-start">
              <button
                onClick={() => navigate('/signup')}
                className="inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-2xl bg-brand-600 text-white font-bold text-sm hover:bg-brand-700 transition-colors shadow-lg shadow-brand-600/20"
              >
                Commencer gratuitement
                <ArrowRight size={18} />
              </button>
              <button
                onClick={() => navigate('/login')}
                className="inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-2xl bg-white border border-slate-200 text-slate-700 font-bold text-sm hover:bg-slate-50 transition-colors"
              >
                J'ai déjà un compte
              </button>
            </div>

            <dl className="flex items-center gap-6 md:gap-8 justify-center lg:justify-start pt-2">
              {[
                { value: '24h/24', label: 'Pharmacies de garde' },
                { value: '3', label: 'Types de professionnels' },
                { value: '100%', label: 'Établissements vérifiés' },
              ].map((stat) => (
                <div key={stat.label}>
                  <dt className="text-xl md:text-2xl font-display font-black text-slate-900">{stat.value}</dt>
                  <dd className="text-[10px] md:text-[11px] text-slate-400 font-bold uppercase tracking-wider mt-0.5">
                    {stat.label}
                  </dd>
                </div>
              ))}
            </dl>
          </motion.div>

          {/* Product preview */}
          <motion.div
            initial={{ opacity: 0, scale: 0.96 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.1 }}
            className="relative"
          >
            <div className="bg-white rounded-[2rem] md:rounded-[2.5rem] border border-slate-100 shadow-2xl shadow-slate-200/60 p-5 md:p-6 space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Autour de vous</p>
                  <p className="font-display font-bold text-slate-900">Akwa, Douala</p>
                </div>
                <span className="px-2.5 py-1 rounded-lg bg-emerald-50 text-emerald-700 text-[10px] font-bold uppercase tracking-wider">
                  5 ouverts
                </span>
              </div>

              {[
                { name: 'Pharmacie de la Paix', meta: '450 m · De garde', icon: <Pill size={16} />, tone: 'bg-emerald-500' },
                { name: 'Hôpital Général', meta: '1.2 km · Ouvert', icon: <Building2 size={16} />, tone: 'bg-blue-600' },
                { name: 'Cabinet Bien-Être', meta: '900 m · Sur rendez-vous', icon: <Leaf size={16} />, tone: 'bg-amber-600' },
              ].map((row, i) => (
                <motion.div
                  key={row.name}
                  initial={{ opacity: 0, x: 12 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.25 + i * 0.1 }}
                  className="flex items-center gap-3 p-3 rounded-2xl bg-slate-50 border border-slate-100"
                >
                  <span className={cn('w-10 h-10 rounded-xl flex items-center justify-center text-white shrink-0', row.tone)}>
                    {row.icon}
                  </span>
                  <div className="min-w-0">
                    <p className="text-sm font-bold text-slate-900 truncate">{row.name}</p>
                    <p className="text-[11px] text-slate-400 font-medium">{row.meta}</p>
                  </div>
                  <ArrowRight size={15} className="ml-auto text-slate-300 shrink-0" />
                </motion.div>
              ))}

              <div className="flex items-start gap-3 p-3.5 rounded-2xl bg-slate-900 text-white">
                <span className="w-8 h-8 rounded-lg bg-white/10 flex items-center justify-center shrink-0 text-brand-400">
                  <Sparkles size={15} />
                </span>
                <p className="text-[11px] leading-relaxed text-slate-300">
                  <span className="font-bold text-white">Care IA · </span>
                  Vous avez un traitement pour l'asthme en cours. Pensez à anticiper son
                  renouvellement avant la fin du mois.
                </p>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* ── Features ──────────────────────────────────────────── */}
      <section className="max-w-7xl mx-auto px-4 md:px-8 py-16 md:py-24">
        <div className="text-center max-w-2xl mx-auto space-y-3 mb-10 md:mb-14">
          <p className="text-xs text-brand-600 font-bold uppercase tracking-widest">Ce que fait Dokta</p>
          <h2 className="text-2xl md:text-4xl font-display font-bold text-slate-900">
            Un parcours de soin sans friction
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4 md:gap-5">
          {FEATURES.map((feature, i) => (
            <motion.article
              key={feature.title}
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.06 }}
              className="bg-white rounded-[2rem] border border-slate-100 shadow-sm p-6 space-y-3 hover:shadow-lg transition-shadow"
            >
              <span className={cn('w-12 h-12 rounded-2xl flex items-center justify-center', feature.tone)}>
                {feature.icon}
              </span>
              <h3 className="font-display font-bold text-slate-900">{feature.title}</h3>
              <p className="text-xs md:text-sm text-slate-500 leading-relaxed">{feature.body}</p>
            </motion.article>
          ))}
        </div>
      </section>

      {/* ── How it works ──────────────────────────────────────── */}
      <section className="bg-slate-50 border-y border-slate-100">
        <div className="max-w-7xl mx-auto px-4 md:px-8 py-16 md:py-24 grid lg:grid-cols-3 gap-8 md:gap-10">
          {STEPS.map((step, i) => (
            <motion.div
              key={step.n}
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.08 }}
              className="space-y-3"
            >
              <span className="text-4xl md:text-5xl font-display font-black text-brand-600/20">{step.n}</span>
              <h3 className="font-display font-bold text-lg text-slate-900">{step.title}</h3>
              <p className="text-sm text-slate-500 leading-relaxed">{step.body}</p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* ── For professionals ─────────────────────────────────── */}
      <section className="max-w-7xl mx-auto px-4 md:px-8 py-16 md:py-24">
        <div className="text-center max-w-2xl mx-auto space-y-3 mb-10 md:mb-14">
          <p className="text-xs text-brand-600 font-bold uppercase tracking-widest">Pour les professionnels</p>
          <h2 className="text-2xl md:text-4xl font-display font-bold text-slate-900">
            Rejoignez le réseau Dokta
          </h2>
          <p className="text-sm text-slate-500 leading-relaxed">
            Votre dossier est vérifié par un administrateur avant publication — une garantie pour
            vos patients comme pour votre établissement.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-5">
          {PROFESSIONAL_ROLES.map((id, i) => {
            const role = ROLES[id];
            return (
              <motion.button
                key={id}
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.08 }}
                onClick={() => navigate('/signup')}
                className="group text-left bg-white rounded-[2rem] border border-slate-100 shadow-sm p-6 space-y-3 hover:shadow-lg hover:border-slate-200 transition-all"
              >
                <span
                  className={cn(
                    'w-12 h-12 rounded-2xl flex items-center justify-center text-white',
                    role.accent.solid
                  )}
                >
                  <RoleIcon role={id} size={20} />
                </span>
                <h3 className="font-display font-bold text-slate-900">{role.label}</h3>
                <p className="text-xs md:text-sm text-slate-500 leading-relaxed">{role.tagline}</p>
                <span className="inline-flex items-center gap-1.5 text-xs font-bold text-brand-600 pt-1">
                  Créer un compte
                  <ArrowRight size={14} className="group-hover:translate-x-1 transition-transform" />
                </span>
              </motion.button>
            );
          })}
        </div>
      </section>

      {/* ── Final call to action ──────────────────────────────── */}
      <section className="max-w-7xl mx-auto px-4 md:px-8 pb-16 md:pb-24">
        <div className="relative overflow-hidden rounded-[2rem] md:rounded-[2.5rem] bg-slate-900 text-white p-8 md:p-14 text-center">
          <div
            aria-hidden="true"
            className="absolute -top-20 -right-10 w-72 h-72 bg-brand-600/25 blur-3xl rounded-full"
          />
          <div className="relative space-y-5 max-w-xl mx-auto">
            <span className="w-14 h-14 rounded-2xl bg-white/10 flex items-center justify-center mx-auto text-brand-400">
              <Compass size={26} />
            </span>
            <h2 className="text-2xl md:text-3xl font-display font-bold">Prêt à prendre soin de vous ?</h2>
            <p className="text-sm text-slate-400 leading-relaxed">
              Créez votre compte en moins d'une minute. Aucun engagement, aucune carte bancaire.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center pt-1">
              <button
                onClick={() => navigate('/signup')}
                className="inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-2xl bg-brand-600 text-white font-bold text-sm hover:bg-brand-500 transition-colors"
              >
                Créer mon compte
                <ArrowRight size={18} />
              </button>
              <button
                onClick={() => navigate('/login')}
                className="inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-2xl bg-white/10 text-white font-bold text-sm hover:bg-white/20 transition-colors"
              >
                Voir une démonstration
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* ── Footer ────────────────────────────────────────────── */}
      <footer className="border-t border-slate-100">
        <div className="max-w-7xl mx-auto px-4 md:px-8 py-8 flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2.5">
            <span className="w-8 h-8 bg-brand-600 rounded-lg flex items-center justify-center text-white">
              <HeartPulse size={17} />
            </span>
            <span className="font-display font-bold text-slate-900">Dokta</span>
          </div>

          <p className="text-[11px] text-slate-400 text-center">
            © {new Date().getFullYear()} Dokta — Plateforme de santé digitale, Cameroun.
          </p>

          <div className="flex items-center gap-2 text-[11px] text-slate-400">
            <Truck size={14} />
            <span>Livraison Douala &amp; Yaoundé</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
