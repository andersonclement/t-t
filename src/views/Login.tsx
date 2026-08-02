import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Navigate, Link, useNavigate, useLocation } from 'react-router-dom';
import { ArrowLeft, ArrowRight, Lock, Mail, TriangleAlert } from 'lucide-react';
import { useAuth } from '../components/AuthContext';
import { AuthLayout } from '../components/AuthLayout';
import { RoleIcon } from '../components/RoleIcon';
import { Alert, Button, Card, Field, Input } from '../components/ui';
import { DEMO_ACCOUNTS, DEMO_ENABLED, DEMO_PASSWORD, ROLES, type Role } from '../lib/roles';
import { cn } from '../lib/utils';

type Screen = 'options' | 'email' | 'forgot-password' | 'demo';

export function Login() {
  const { user, signInWithGoogle, signInAsDemo, signInWithEmail, resetPassword, loading } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [screen, setScreen] = React.useState<Screen>(location.state?.email ? 'email' : 'options');
  const [email, setEmail] = React.useState(location.state?.email || '');
  const [password, setPassword] = React.useState('');
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [pendingRole, setPendingRole] = React.useState<Role | null>(null);
  const [error, setError] = React.useState<string | null>(null);
  const [success, setSuccess] = React.useState<string | null>(null);

  if (loading) return null;
  if (user) return <Navigate to="/" replace />;

  const back = () => {
    setScreen('options');
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
      setError('Veuillez entrer votre adresse email.');
      return;
    }
    setIsSubmitting(true);
    setError(null);
    setSuccess(null);
    try {
      await resetPassword(email);
      setSuccess(
        'Un email de récupération a été envoyé. Pensez à vérifier vos courriers indésirables.'
      );
    } catch (err: any) {
      if (err.code === 'auth/too-many-requests') {
        setError('Trop de tentatives. Veuillez réessayer plus tard.');
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
    } catch (err: any) {
      setError(googleErrorMessage(err));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDemoLogin = async (role: Role) => {
    setPendingRole(role);
    setError(null);
    try {
      await signInAsDemo(role);
      navigate(ROLES[role].home);
    } catch (err: any) {
      setError(
        err?.message ||
          'Impossible de se connecter au compte de démonstration. Veuillez réessayer.'
      );
    } finally {
      setPendingRole(null);
    }
  };

  const busy = isSubmitting || pendingRole !== null;

  return (
    <AuthLayout
      eyebrow={
        screen === 'demo' ? 'Découverte' : screen === 'forgot-password' ? 'Récupération' : 'Bon retour'
      }
      title={
        screen === 'forgot-password'
          ? 'Mot de passe oublié'
          : screen === 'demo'
            ? 'Comptes de démonstration'
            : 'Connexion'
      }
      subtitle={
        screen === 'forgot-password'
          ? 'Nous vous enverrons un lien pour en choisir un nouveau.'
          : screen === 'demo'
            ? 'Explorez chaque interface sans créer de compte.'
            : 'Accédez à votre espace Dokta.'
      }
      wide={screen === 'demo'}
    >
      <Card className="space-y-5">
        <AnimatePresence mode="wait">
          {/* ── Method picker ─────────────────────────────────────── */}
          {screen === 'options' && (
            <motion.div
              key="options"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              className="space-y-3"
            >
              {error && (
                <Alert tone="danger" icon={<TriangleAlert size={16} />}>
                  {error}
                </Alert>
              )}

              <Button
                variant="outline"
                size="lg"
                fullWidth
                loading={isSubmitting}
                onClick={handleGoogleLogin}
                icon={<GoogleMark />}
              >
                Continuer avec Google
              </Button>

              <div className="flex items-center gap-3 py-1">
                <span className="flex-1 h-px bg-slate-100" />
                <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400">ou</span>
                <span className="flex-1 h-px bg-slate-100" />
              </div>

              <Button
                variant="dark"
                size="lg"
                fullWidth
                onClick={() => setScreen('email')}
                icon={<Mail size={18} />}
              >
                Continuer avec un email
              </Button>

              {DEMO_ENABLED && (
                <button
                  onClick={() => setScreen('demo')}
                  className="w-full flex items-center justify-between gap-3 p-3.5 rounded-xl md:rounded-2xl bg-slate-50 border border-slate-100 hover:border-brand-200 hover:bg-white transition-colors text-left group"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <span className="w-9 h-9 rounded-xl bg-white border border-slate-100 flex items-center justify-center text-brand-600 shrink-0">
                      <RoleIcon role="pharmacist" size={16} />
                    </span>
                    <div className="min-w-0">
                      <p className="text-xs md:text-sm font-bold text-slate-900">Comptes de test</p>
                      <p className="text-[11px] text-slate-400">Voir chaque interface en un clic</p>
                    </div>
                  </div>
                  <ArrowRight
                    size={16}
                    className="text-slate-300 group-hover:text-brand-600 group-hover:translate-x-0.5 transition-all shrink-0"
                  />
                </button>
              )}

              <p className="text-xs text-center text-slate-500 pt-1">
                Pas encore de compte ?{' '}
                <Link to="/signup" className="font-bold text-brand-600 hover:underline">
                  Créer un compte
                </Link>
              </p>
            </motion.div>
          )}

          {/* ── Email + password ──────────────────────────────────── */}
          {screen === 'email' && (
            <motion.form
              key="email"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              onSubmit={handleEmailLogin}
              className="space-y-4"
            >
              {error && (
                <Alert tone="danger" icon={<TriangleAlert size={16} />}>
                  {error}
                </Alert>
              )}

              <Field label="Adresse email" required>
                <Input
                  type="email"
                  required
                  autoComplete="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="vous@exemple.cm"
                />
              </Field>

              <Field label="Mot de passe" required>
                <Input
                  type="password"
                  required
                  autoComplete="current-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                />
              </Field>

              <button
                type="button"
                onClick={() => {
                  setScreen('forgot-password');
                  setError(null);
                }}
                className="text-xs font-bold text-brand-600 hover:underline"
              >
                Mot de passe oublié ?
              </button>

              <Button type="submit" size="lg" fullWidth loading={isSubmitting} icon={<Lock size={18} />}>
                Se connecter
              </Button>

              <Button type="button" variant="ghost" fullWidth onClick={back} icon={<ArrowLeft size={16} />}>
                Autres méthodes
              </Button>
            </motion.form>
          )}

          {/* ── Password reset ────────────────────────────────────── */}
          {screen === 'forgot-password' && (
            <motion.form
              key="forgot"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              onSubmit={handleForgotPassword}
              className="space-y-4"
            >
              {error && (
                <Alert tone="danger" icon={<TriangleAlert size={16} />}>
                  {error}
                </Alert>
              )}
              {success && <Alert tone="success">{success}</Alert>}

              <Field label="Adresse email" required>
                <Input
                  type="email"
                  required
                  autoComplete="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="vous@exemple.cm"
                />
              </Field>

              <Button type="submit" size="lg" fullWidth loading={isSubmitting} icon={<Mail size={18} />}>
                Envoyer le lien
              </Button>

              <Button
                type="button"
                variant="ghost"
                fullWidth
                onClick={() => setScreen('email')}
                icon={<ArrowLeft size={16} />}
              >
                Retour
              </Button>
            </motion.form>
          )}

          {/* ── Demo accounts ─────────────────────────────────────── */}
          {screen === 'demo' && (
            <motion.div
              key="demo"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              className="space-y-3"
            >
              {error && (
                <Alert tone="danger" icon={<TriangleAlert size={16} />}>
                  {error}
                </Alert>
              )}

              <Alert tone="warning" icon={<TriangleAlert size={16} />}>
                Comptes partagés à but de démonstration. Ne saisissez aucune donnée réelle et
                désactivez-les en production via <code className="font-mono">VITE_ENABLE_DEMO=false</code>.
              </Alert>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {DEMO_ACCOUNTS.map((account) => {
                  const definition = ROLES[account.role];
                  const isPending = pendingRole === account.role;

                  return (
                    <button
                      key={account.role}
                      onClick={() => handleDemoLogin(account.role)}
                      disabled={busy}
                      className={cn(
                        'flex flex-col gap-2 p-4 rounded-2xl border text-left transition-all disabled:opacity-60',
                        isPending
                          ? 'border-brand-600 ring-2 ring-brand-600/10 bg-white'
                          : 'border-slate-100 bg-slate-50 hover:bg-white hover:border-slate-200'
                      )}
                    >
                      <div className="flex items-center gap-2.5">
                        <span
                          className={cn(
                            'w-9 h-9 rounded-xl flex items-center justify-center text-white shrink-0',
                            definition.accent.solid
                          )}
                        >
                          <RoleIcon role={account.role} size={16} />
                        </span>
                        <div className="min-w-0">
                          <p className="text-sm font-bold text-slate-900 truncate">{definition.label}</p>
                          <p className="text-[10px] text-slate-400 font-mono truncate">{account.email}</p>
                        </div>
                      </div>
                      <p className="text-[11px] text-slate-500 leading-snug">{account.blurb}</p>
                      {isPending && (
                        <span className="text-[10px] font-bold text-brand-600 uppercase tracking-widest">
                          Connexion…
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>

              <p className="text-[11px] text-slate-400 text-center">
                Mot de passe commun : <code className="font-mono text-slate-600">{DEMO_PASSWORD}</code>
              </p>

              <Button variant="ghost" fullWidth onClick={back} icon={<ArrowLeft size={16} />}>
                Retour
              </Button>
            </motion.div>
          )}
        </AnimatePresence>
      </Card>
    </AuthLayout>
  );
}

function GoogleMark() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden="true">
      <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1Z" />
      <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84A11 11 0 0 0 12 23Z" />
      <path fill="#FBBC05" d="M5.84 14.1a6.6 6.6 0 0 1 0-4.2V7.06H2.18a11 11 0 0 0 0 9.88l3.66-2.84Z" />
      <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1a11 11 0 0 0-9.82 6.06l3.66 2.84C6.71 7.3 9.14 5.38 12 5.38Z" />
    </svg>
  );
}

function googleErrorMessage(err: any): string {
  switch (err?.code) {
    case 'auth/popup-blocked':
      return "Le popup de connexion a été bloqué. Ouvrez l'application dans un nouvel onglet ou autorisez les popups.";
    case 'auth/popup-closed-by-user':
      return "Fenêtre de connexion fermée. Les navigateurs bloquent souvent Google dans les aperçus intégrés — ouvrez l'application dans un nouvel onglet.";
    case 'auth/operation-not-allowed':
      return "La connexion Google n'est pas activée dans la console Firebase (Authentication > Sign-in method).";
    case 'auth/unauthorized-domain':
      return "Ce domaine n'est pas autorisé dans la console Firebase (Authentication > Settings > Authorized domains).";
    case 'auth/cancelled-popup-request':
      return '';
    case 'auth/network-request-failed':
      return 'Erreur réseau. Vérifiez votre connexion internet.';
    default:
      return `Erreur lors de la connexion Google (${err?.code || 'inconnue'}). Veuillez réessayer.`;
  }
}
