import React, { useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  ArrowLeft,
  ArrowRight,
  CalendarClock,
  Check,
  ClipboardList,
  HeartPulse,
  LogOut,
  ShieldCheck,
  TriangleAlert,
  Video,
} from 'lucide-react';
import { useAuth } from '../components/AuthContext';
import { RoleIcon } from '../components/RoleIcon';
import { Alert, Badge, Button, Card, Field, Input, Select, Textarea } from '../components/ui';
import { getRole, isProfessionalRole, type OnboardingField } from '../lib/roles';
import { cn } from '../lib/utils';

const STEPS = [
  { num: 1, label: 'Dossier technique', icon: <ClipboardList size={16} /> },
  { num: 2, label: 'Rendez-vous', icon: <CalendarClock size={16} /> },
  { num: 3, label: 'Validation', icon: <ShieldCheck size={16} /> },
];

/** Ten upcoming weekdays, for the verification appointment. */
function getAvailableDates() {
  const dates: { value: string; label: string }[] = [];
  const cursor = new Date();
  while (dates.length < 10) {
    cursor.setDate(cursor.getDate() + 1);
    const day = cursor.getDay();
    if (day !== 0 && day !== 6) {
      dates.push({
        value: cursor.toISOString().split('T')[0],
        label: cursor.toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' }),
      });
    }
  }
  return dates;
}

/** Sensible starting value for a field the professional hasn't filled yet. */
function defaultValue(field: OnboardingField) {
  if (field.type === 'toggle') return true;
  if (field.type === 'number') return 1;
  if (field.type === 'select') return field.options?.[0]?.value ?? '';
  return '';
}

/**
 * Verification flow every professional account goes through before it can
 * operate. The technical file is generated from the role registry, so a
 * pharmacy, a clinic and a naturopath each answer their own questions
 * without this screen knowing anything about them.
 */
export function ProfessionalOnboarding() {
  const { profile, updateUserProfile, logout } = useAuth();
  const definition = getRole(profile?.role);

  const [step, setStep] = useState<number>(() => {
    if (profile?.status === 'pending_appointment') return 2;
    if (profile?.status === 'pending_admin_approval') return 3;
    return 1;
  });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fields = useMemo(
    () => definition.onboarding.flatMap((section) => section.fields),
    [definition]
  );

  const [form, setForm] = useState<Record<string, any>>(() => {
    const saved = profile?.technicalForm ?? {};
    const initial: Record<string, any> = {};
    for (const field of fields) {
      initial[field.name] = saved[field.name] ?? defaultValue(field);
    }
    // Carry over the establishment name captured at signup.
    if (!initial.establishmentName && definition.establishmentField) {
      initial.establishmentName = profile?.[definition.establishmentField] || '';
    }
    return initial;
  });

  const [appointment, setAppointment] = useState({
    type: profile?.appointment?.type || 'visio',
    date: profile?.appointment?.date || '',
    time: profile?.appointment?.time || '',
    phoneNumber: profile?.appointment?.phoneNumber || profile?.phoneNumber || '',
    notes: profile?.appointment?.notes || '',
  });

  const availableDates = useMemo(getAvailableDates, []);
  const set = (name: string, value: any) => setForm((prev) => ({ ...prev, [name]: value }));

  // A profile that somehow reaches this screen without a professional role has
  // nothing to submit; send it back rather than rendering an empty form.
  if (!isProfessionalRole(profile?.role)) {
    return (
      <Shell>
        <Card>
          <Alert tone="warning" icon={<TriangleAlert size={16} />}>
            Ce parcours est réservé aux comptes professionnels.
          </Alert>
        </Card>
      </Shell>
    );
  }

  const handleTechnicalSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const missing = fields.filter(
      (f) => f.required && (form[f.name] === '' || form[f.name] === undefined || form[f.name] === null)
    );
    if (missing.length > 0) {
      setError(`Champs requis manquants : ${missing.map((f) => f.label).join(', ')}.`);
      return;
    }

    setSubmitting(true);
    try {
      await updateUserProfile({
        technicalForm: form,
        status: 'pending_appointment',
        // Mirror the establishment name at the top level so the rest of the
        // app can read it without digging into the technical file.
        ...(definition.establishmentField
          ? { [definition.establishmentField]: form.establishmentName }
          : {}),
      });
      setStep(2);
    } catch {
      setError('Une erreur est survenue lors de la sauvegarde de votre dossier.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleAppointmentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!appointment.date || !appointment.time) {
      setError('Veuillez choisir une date et une heure.');
      return;
    }

    setSubmitting(true);
    try {
      await updateUserProfile({ appointment, status: 'pending_admin_approval' });
      setStep(3);
    } catch {
      setError('Une erreur est survenue lors de la prise de rendez-vous.');
    } finally {
      setSubmitting(false);
    }
  };

  const rejected = profile?.status === 'rejected';

  return (
    <Shell>
      {/* Identity strip */}
      <Card className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3 min-w-0">
          <span
            className={cn(
              'w-12 h-12 rounded-2xl flex items-center justify-center text-white shrink-0',
              definition.accent.solid
            )}
          >
            <RoleIcon role={definition.id} size={22} />
          </span>
          <div className="min-w-0">
            <p className="text-xs text-slate-400 font-bold uppercase tracking-widest">
              Compte {definition.label.toLowerCase()}
            </p>
            <h1 className="text-lg md:text-xl font-display font-bold text-slate-900 truncate">
              {form.establishmentName || profile?.displayName || 'Votre établissement'}
            </h1>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <Badge tone={rejected ? 'danger' : 'warning'}>
            {rejected ? 'Dossier rejeté' : 'En cours de vérification'}
          </Badge>
          <Button variant="ghost" size="sm" onClick={() => logout()} icon={<LogOut size={14} />}>
            Quitter
          </Button>
        </div>
      </Card>

      {/* Progress */}
      <Card size="sm">
        <ol className="flex items-center gap-2 md:gap-4">
          {STEPS.map((s, i) => {
            const done = step > s.num;
            const active = step === s.num;
            return (
              <React.Fragment key={s.num}>
                <li className="flex items-center gap-2 min-w-0">
                  <span
                    className={cn(
                      'w-9 h-9 rounded-xl flex items-center justify-center shrink-0 transition-colors',
                      done
                        ? 'bg-emerald-600 text-white'
                        : active
                          ? 'bg-slate-900 text-white'
                          : 'bg-slate-100 text-slate-400'
                    )}
                  >
                    {done ? <Check size={16} strokeWidth={3} /> : s.icon}
                  </span>
                  <span
                    className={cn(
                      'text-[11px] md:text-xs font-bold whitespace-nowrap hidden sm:block',
                      active ? 'text-slate-900' : 'text-slate-400'
                    )}
                  >
                    {s.label}
                  </span>
                </li>
                {i < STEPS.length - 1 && (
                  <span
                    className={cn(
                      'flex-1 h-0.5 rounded-full transition-colors',
                      step > s.num ? 'bg-emerald-600' : 'bg-slate-100'
                    )}
                  />
                )}
              </React.Fragment>
            );
          })}
        </ol>
      </Card>

      {rejected && (
        <Alert tone="danger" icon={<TriangleAlert size={16} />} title="Votre dossier a été rejeté">
          {profile?.rejectionReason ||
            "Un administrateur a refusé votre dossier. Corrigez les informations ci-dessous et soumettez-le à nouveau."}
        </Alert>
      )}

      <AnimatePresence mode="wait">
        {/* ── Step 1: technical file ────────────────────────────── */}
        {step === 1 && (
          <motion.form
            key="tech"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            onSubmit={handleTechnicalSubmit}
            className="space-y-6 md:space-y-8"
          >
            {error && (
              <Alert tone="danger" icon={<TriangleAlert size={16} />}>
                {error}
              </Alert>
            )}

            {definition.onboarding.map((section) => (
              <Card key={section.title} className="space-y-5">
                <div>
                  <h2 className="text-base md:text-lg font-display font-bold text-slate-900">
                    {section.title}
                  </h2>
                  <p className="text-xs md:text-sm text-slate-500 font-medium mt-0.5">
                    {section.description}
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {section.fields.map((field) => (
                    <OnboardingInput
                      key={field.name}
                      field={field}
                      value={form[field.name]}
                      onChange={(value) => set(field.name, value)}
                    />
                  ))}
                </div>
              </Card>
            ))}

            <Button type="submit" size="lg" fullWidth loading={submitting} icon={<ArrowRight size={18} />}>
              Enregistrer et planifier la vérification
            </Button>
          </motion.form>
        )}

        {/* ── Step 2: appointment ───────────────────────────────── */}
        {step === 2 && (
          <motion.form
            key="appointment"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            onSubmit={handleAppointmentSubmit}
            className="space-y-6"
          >
            {error && (
              <Alert tone="danger" icon={<TriangleAlert size={16} />}>
                {error}
              </Alert>
            )}

            <Card className="space-y-5">
              <div>
                <h2 className="text-base md:text-lg font-display font-bold text-slate-900">
                  Rendez-vous de vérification
                </h2>
                <p className="text-xs md:text-sm text-slate-500 font-medium mt-0.5">
                  Un membre de l'équipe Dokta confirme les informations de votre dossier.
                </p>
              </div>

              <div className="grid grid-cols-2 gap-3">
                {[
                  { value: 'visio', label: 'Visioconférence', icon: <Video size={18} />, hint: '30 minutes' },
                  { value: 'onsite', label: 'Sur site', icon: <HeartPulse size={18} />, hint: 'Visite de vos locaux' },
                ].map((option) => (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() => setAppointment((a) => ({ ...a, type: option.value }))}
                    aria-pressed={appointment.type === option.value}
                    className={cn(
                      'flex flex-col gap-2 p-4 rounded-2xl border text-left transition-all',
                      appointment.type === option.value
                        ? 'border-brand-600 ring-2 ring-brand-600/10 bg-white'
                        : 'border-slate-100 bg-slate-50 hover:bg-white'
                    )}
                  >
                    <span className="w-9 h-9 rounded-xl bg-white border border-slate-100 flex items-center justify-center text-brand-600">
                      {option.icon}
                    </span>
                    <div>
                      <p className="text-sm font-bold text-slate-900">{option.label}</p>
                      <p className="text-[11px] text-slate-400">{option.hint}</p>
                    </div>
                  </button>
                ))}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Field label="Date" required>
                  <Select
                    required
                    value={appointment.date}
                    onChange={(e) => setAppointment((a) => ({ ...a, date: e.target.value }))}
                  >
                    <option value="">Choisir une date…</option>
                    {availableDates.map((d) => (
                      <option key={d.value} value={d.value}>
                        {d.label}
                      </option>
                    ))}
                  </Select>
                </Field>

                <Field label="Heure" required>
                  <Select
                    required
                    value={appointment.time}
                    onChange={(e) => setAppointment((a) => ({ ...a, time: e.target.value }))}
                  >
                    <option value="">Choisir une heure…</option>
                    {['08:00', '09:00', '10:00', '11:00', '14:00', '15:00', '16:00', '17:00'].map((t) => (
                      <option key={t} value={t}>
                        {t}
                      </option>
                    ))}
                  </Select>
                </Field>

                <Field label="Téléphone de contact" required>
                  <Input
                    required
                    type="tel"
                    value={appointment.phoneNumber}
                    onChange={(e) => setAppointment((a) => ({ ...a, phoneNumber: e.target.value }))}
                    placeholder="+237 6XX XXX XXX"
                  />
                </Field>

                <Field label="Précisions" hint="Facultatif — horaires, accès, contact sur place.">
                  <Input
                    value={appointment.notes}
                    onChange={(e) => setAppointment((a) => ({ ...a, notes: e.target.value }))}
                    placeholder="Une information utile ?"
                  />
                </Field>
              </div>
            </Card>

            <div className="flex flex-col-reverse sm:flex-row gap-3">
              <Button
                type="button"
                variant="outline"
                fullWidth
                onClick={() => setStep(1)}
                icon={<ArrowLeft size={16} />}
              >
                Revenir au dossier
              </Button>
              <Button type="submit" fullWidth loading={submitting} icon={<CalendarClock size={18} />}>
                Confirmer le rendez-vous
              </Button>
            </div>
          </motion.form>
        )}

        {/* ── Step 3: waiting on the administrator ──────────────── */}
        {step === 3 && (
          <motion.div
            key="review"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
          >
            <Card className="text-center space-y-5 py-10">
              <span className="w-16 h-16 rounded-[1.5rem] bg-amber-50 text-amber-600 flex items-center justify-center mx-auto">
                <ShieldCheck size={30} />
              </span>

              <div className="space-y-1.5 max-w-md mx-auto">
                <h2 className="text-xl font-display font-bold text-slate-900">Dossier en cours de validation</h2>
                <p className="text-sm text-slate-500 leading-relaxed">
                  Votre dossier et votre rendez-vous ont bien été enregistrés. Un administrateur
                  Dokta examine vos informations — vous recevrez un email dès l'activation de votre
                  espace {definition.label.toLowerCase()}.
                </p>
              </div>

              {appointment.date && (
                <div className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-50 border border-slate-100">
                  <CalendarClock size={15} className="text-slate-400" />
                  <span className="text-xs font-bold text-slate-700">
                    {new Date(appointment.date).toLocaleDateString('fr-FR', {
                      weekday: 'long',
                      day: 'numeric',
                      month: 'long',
                    })}{' '}
                    à {appointment.time}
                  </span>
                </div>
              )}

              <div className="flex flex-col sm:flex-row gap-3 justify-center pt-2">
                <Button variant="outline" onClick={() => setStep(2)} icon={<CalendarClock size={16} />}>
                  Modifier le rendez-vous
                </Button>
                <Button variant="ghost" onClick={() => logout()} icon={<LogOut size={16} />}>
                  Se déconnecter
                </Button>
              </div>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>
    </Shell>
  );
}

/** Renders one registry-defined field with the matching control. */
function OnboardingInput({
  field,
  value,
  onChange,
}: {
  field: OnboardingField;
  value: any;
  onChange: (value: any) => void;
}) {
  const wide = field.type === 'textarea';

  return (
    <Field
      label={field.label}
      required={field.required}
      hint={field.hint}
      className={cn(wide && 'md:col-span-2')}
    >
      {field.type === 'toggle' ? (
        <div className="grid grid-cols-2 gap-1 p-1 bg-slate-100 rounded-xl">
          {[true, false].map((option) => (
            <button
              key={String(option)}
              type="button"
              onClick={() => onChange(option)}
              className={cn(
                'py-2 rounded-lg text-xs font-bold transition-colors',
                value === option ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-900'
              )}
            >
              {option ? 'Oui' : 'Non'}
            </button>
          ))}
        </div>
      ) : field.type === 'select' ? (
        <Select value={value ?? ''} onChange={(e) => onChange(e.target.value)}>
          {field.options?.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </Select>
      ) : field.type === 'textarea' ? (
        <Textarea
          value={value ?? ''}
          onChange={(e) => onChange(e.target.value)}
          placeholder={field.placeholder}
          rows={3}
        />
      ) : (
        <Input
          type={field.type === 'number' ? 'number' : 'text'}
          min={field.type === 'number' ? 0 : undefined}
          value={value ?? ''}
          onChange={(e) =>
            onChange(field.type === 'number' ? Number(e.target.value) : e.target.value)
          }
          placeholder={field.placeholder}
        />
      )}
    </Field>
  );
}

/** Page chrome for the onboarding flow — it sits outside the app Shell. */
function Shell({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-slate-50">
      <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-100">
        <div className="max-w-4xl mx-auto px-4 md:px-8 h-16 flex items-center gap-2.5">
          <span className="w-9 h-9 bg-brand-600 rounded-xl flex items-center justify-center text-white">
            <HeartPulse size={20} />
          </span>
          <span className="font-display font-bold text-lg text-slate-900">Dokta</span>
          <span className="ml-auto text-[10px] font-bold uppercase tracking-widest text-slate-400">
            Espace professionnel
          </span>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 md:px-8 py-6 md:py-10 space-y-6 md:space-y-8 pb-16">
        {children}
      </main>
    </div>
  );
}
