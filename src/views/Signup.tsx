import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Navigate, Link, useNavigate } from 'react-router-dom';
import { ArrowLeft, ArrowRight, Check, KeyRound, TriangleAlert, UserPlus } from 'lucide-react';
import { useAuth } from '../components/AuthContext';
import { AuthLayout } from '../components/AuthLayout';
import { RoleIcon } from '../components/RoleIcon';
import { Alert, Button, Card, Field, Input } from '../components/ui';
import { PROFESSIONAL_ROLES, ROLES, isProfessionalRole, type Role } from '../lib/roles';
import { cn } from '../lib/utils';

/** Professional signups need an authorisation code issued by an administrator. */
const PRO_INVITE_CODE = 'DOKTA-PRO-2026';

const SIGNUP_ROLES: Role[] = ['patient', ...PROFESSIONAL_ROLES];

interface Requirements {
  length: boolean;
  uppercase: boolean;
  lowercase: boolean;
  number: boolean;
  special: boolean;
}

const REQUIREMENT_LABELS: { key: keyof Requirements; label: string }[] = [
  { key: 'length', label: '8 caractères minimum' },
  { key: 'uppercase', label: 'Une majuscule' },
  { key: 'lowercase', label: 'Une minuscule' },
  { key: 'number', label: 'Un chiffre' },
  { key: 'special', label: 'Un caractère spécial' },
];

function evaluatePassword(password: string) {
  const requirements: Requirements = {
    length: password.length >= 8,
    uppercase: /[A-Z]/.test(password),
    lowercase: /[a-z]/.test(password),
    number: /[0-9]/.test(password),
    special: /[^A-Za-z0-9]/.test(password),
  };
  const score = Object.values(requirements).filter(Boolean).length;
  const feedback = score >= 5 ? 'Très fort' : score >= 4 ? 'Fort' : score >= 3 ? 'Moyen' : 'Faible';
  return { requirements, score, feedback };
}

export function Signup() {
  const { user, signUpWithEmail, loading } = useAuth();
  const navigate = useNavigate();

  const [step, setStep] = React.useState<1 | 2>(1);
  const [role, setRole] = React.useState<Role>('patient');
  const [form, setForm] = React.useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    establishmentName: '',
    inviteCode: '',
  });
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const strength = React.useMemo(() => evaluatePassword(form.password), [form.password]);
  const definition = ROLES[role];
  const isPro = isProfessionalRole(role);

  if (loading) return null;
  if (user) return <Navigate to="/" replace />;

  const set = (patch: Partial<typeof form>) => setForm((prev) => ({ ...prev, ...patch }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (strength.score < 5) {
      setError('Le mot de passe ne remplit pas toutes les exigences de sécurité.');
      return;
    }
    if (form.password !== form.confirmPassword) {
      setError('Les mots de passe ne correspondent pas.');
      return;
    }
    if (isPro) {
      if (!form.establishmentName.trim()) {
        setError(`Le nom de votre ${definition.establishmentLabel?.toLowerCase()} est requis.`);
        return;
      }
      if (form.inviteCode.trim().toUpperCase() !== PRO_INVITE_CODE) {
        setError(
          "Code d'autorisation incorrect. L'inscription professionnelle requiert l'accord préalable d'un administrateur — écrivez à admin@dokta.cm pour obtenir votre code."
        );
        return;
      }
    }

    setIsSubmitting(true);
    try {
      await signUpWithEmail(
        form.email,
        form.password,
        form.name,
        role,
        isPro ? form.establishmentName : undefined
      );
      navigate('/');
    } catch (err: any) {
      setError(err.message || "Une erreur est survenue lors de l'inscription.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <AuthLayout
      eyebrow={step === 1 ? 'Étape 1 sur 2' : 'Étape 2 sur 2'}
      title={step === 1 ? 'Créer un compte' : `Compte ${definition.label.toLowerCase()}`}
      subtitle={
        step === 1
          ? 'Choisissez le type de compte qui vous correspond.'
          : isPro
            ? 'Votre dossier sera vérifié avant activation.'
            : 'Encore quelques informations et vous y êtes.'
      }
      wide={step === 1}
    >
      <Card className="space-y-5">
        <AnimatePresence mode="wait">
          {/* ── Step 1: account type ──────────────────────────────── */}
          {step === 1 && (
            <motion.div
              key="role"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              className="space-y-3"
            >
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {SIGNUP_ROLES.map((id) => {
                  const item = ROLES[id];
                  const selected = role === id;

                  return (
                    <button
                      key={id}
                      onClick={() => setRole(id)}
                      aria-pressed={selected}
                      className={cn(
                        'relative flex flex-col gap-2 p-4 rounded-2xl border text-left transition-all',
                        selected
                          ? 'border-brand-600 ring-2 ring-brand-600/10 bg-white'
                          : 'border-slate-100 bg-slate-50 hover:bg-white hover:border-slate-200'
                      )}
                    >
                      {selected && (
                        <motion.span
                          layoutId="role-check"
                          className="absolute top-3 right-3 w-5 h-5 rounded-full bg-brand-600 text-white flex items-center justify-center"
                        >
                          <Check size={12} strokeWidth={3} />
                        </motion.span>
                      )}

                      <span
                        className={cn(
                          'w-10 h-10 rounded-xl flex items-center justify-center text-white',
                          item.accent.solid
                        )}
                      >
                        <RoleIcon role={id} size={18} />
                      </span>

                      <div>
                        <p className="text-sm font-bold text-slate-900">{item.label}</p>
                        <p className="text-[11px] text-slate-500 leading-snug mt-0.5">{item.tagline}</p>
                      </div>
                    </button>
                  );
                })}
              </div>

              {isPro && (
                <Alert tone="info" icon={<KeyRound size={16} />}>
                  Les comptes professionnels sont vérifiés : il vous faudra un code d'autorisation
                  puis un dossier technique validé par un administrateur.
                </Alert>
              )}

              <Button size="lg" fullWidth onClick={() => setStep(2)}>
                Continuer
                <ArrowRight size={18} />
              </Button>

              <p className="text-xs text-center text-slate-500">
                Déjà inscrit ?{' '}
                <Link to="/login" className="font-bold text-brand-600 hover:underline">
                  Se connecter
                </Link>
              </p>
            </motion.div>
          )}

          {/* ── Step 2: details ───────────────────────────────────── */}
          {step === 2 && (
            <motion.form
              key="details"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              onSubmit={handleSubmit}
              className="space-y-4"
            >
              {error && (
                <Alert tone="danger" icon={<TriangleAlert size={16} />}>
                  {error}
                </Alert>
              )}

              <Field label="Nom complet" required>
                <Input
                  required
                  autoComplete="name"
                  value={form.name}
                  onChange={(e) => set({ name: e.target.value })}
                  placeholder="Prénom et nom"
                />
              </Field>

              {isPro && definition.establishmentLabel && (
                <Field label={`Nom de la ${definition.establishmentLabel.toLowerCase()}`} required>
                  <Input
                    required
                    value={form.establishmentName}
                    onChange={(e) => set({ establishmentName: e.target.value })}
                    placeholder={
                      role === 'pharmacist'
                        ? 'Pharmacie de la Paix'
                        : role === 'clinic'
                          ? "Clinique de l'Espoir"
                          : 'Cabinet Bien-Être Nature'
                    }
                  />
                </Field>
              )}

              <Field label="Adresse email" required>
                <Input
                  type="email"
                  required
                  autoComplete="email"
                  value={form.email}
                  onChange={(e) => set({ email: e.target.value })}
                  placeholder="vous@exemple.cm"
                />
              </Field>

              <Field label="Mot de passe" required>
                <Input
                  type="password"
                  required
                  autoComplete="new-password"
                  value={form.password}
                  onChange={(e) => set({ password: e.target.value })}
                  placeholder="••••••••"
                />
              </Field>

              {form.password && (
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <div className="flex-1 flex gap-1">
                      {[1, 2, 3, 4, 5].map((tick) => (
                        <span
                          key={tick}
                          className={cn(
                            'h-1.5 flex-1 rounded-full transition-colors',
                            strength.score >= tick
                              ? strength.score >= 5
                                ? 'bg-emerald-500'
                                : strength.score >= 4
                                  ? 'bg-lime-500'
                                  : strength.score >= 3
                                    ? 'bg-amber-500'
                                    : 'bg-red-500'
                              : 'bg-slate-200'
                          )}
                        />
                      ))}
                    </div>
                    <span className="text-[10px] font-bold uppercase tracking-widest text-slate-500 shrink-0">
                      {strength.feedback}
                    </span>
                  </div>

                  <ul className="grid grid-cols-2 gap-x-3 gap-y-1">
                    {REQUIREMENT_LABELS.map(({ key, label }) => (
                      <li
                        key={key}
                        className={cn(
                          'flex items-center gap-1.5 text-[10px] font-medium',
                          strength.requirements[key] ? 'text-emerald-600' : 'text-slate-400'
                        )}
                      >
                        <Check
                          size={11}
                          strokeWidth={3}
                          className={cn(!strength.requirements[key] && 'opacity-30')}
                        />
                        {label}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              <Field label="Confirmer le mot de passe" required>
                <Input
                  type="password"
                  required
                  autoComplete="new-password"
                  value={form.confirmPassword}
                  onChange={(e) => set({ confirmPassword: e.target.value })}
                  placeholder="••••••••"
                  invalid={!!form.confirmPassword && form.confirmPassword !== form.password}
                />
              </Field>

              {isPro && (
                <Field
                  label="Code d'autorisation"
                  required
                  hint="Fourni par un administrateur Dokta (admin@dokta.cm)."
                >
                  <Input
                    required
                    value={form.inviteCode}
                    onChange={(e) => set({ inviteCode: e.target.value })}
                    placeholder="DOKTA-PRO-…"
                    className="font-mono"
                  />
                </Field>
              )}

              <Button type="submit" size="lg" fullWidth loading={isSubmitting} icon={<UserPlus size={18} />}>
                Créer mon compte
              </Button>

              <Button
                type="button"
                variant="ghost"
                fullWidth
                onClick={() => {
                  setStep(1);
                  setError(null);
                }}
                icon={<ArrowLeft size={16} />}
              >
                Changer de type de compte
              </Button>
            </motion.form>
          )}
        </AnimatePresence>
      </Card>
    </AuthLayout>
  );
}
