import React from 'react';
import { motion } from 'motion/react';
import { useNavigate } from 'react-router-dom';
import {
  ArrowRight,
  Building2,
  CalendarClock,
  CheckCircle2,
  Compass,
  Sparkles,
  Stethoscope,
  UserCog,
  Users,
} from 'lucide-react';
import { useAuth } from '../components/AuthContext';
import { RoleIcon } from '../components/RoleIcon';
import {
  Badge,
  Card,
  CardSection,
  PageContainer,
  PageHeader,
  SectionHeader,
  SplitLayout,
  StatCard,
  StatGrid,
} from '../components/ui';
import { getEstablishmentName, getRole, type ProfessionalRole } from '../lib/roles';
import { cn } from '../lib/utils';

/**
 * Home screen for clinic and naturopath accounts.
 *
 * Consultation management isn't built yet, so this deliberately shows the
 * establishment's real verified record and the tools that do exist rather
 * than inventing metrics that aren't backed by anything.
 */
export function ProfessionalDashboard() {
  const { profile } = useAuth();
  const navigate = useNavigate();

  const role = (profile?.role ?? 'clinic') as ProfessionalRole;
  const definition = getRole(role);
  const establishment = getEstablishmentName(profile) || profile?.displayName || definition.label;
  const form = profile?.technicalForm ?? {};

  const quickActions = [
    {
      label: 'Répertoire santé',
      sub: 'Voir votre fiche publique et les autres établissements',
      icon: <Compass className="text-blue-600" />,
      tone: 'bg-blue-50',
      to: '/directory',
    },
    {
      label: 'Care IA',
      sub: 'Assistant clinique et vérificateur d\'interactions',
      icon: <Sparkles className="text-amber-600" />,
      tone: 'bg-amber-50',
      to: '/ai-sante',
    },
    {
      label: 'Carte de santé',
      sub: 'Situer votre établissement et les partenaires',
      icon: <Building2 className="text-emerald-600" />,
      tone: 'bg-emerald-50',
      to: '/map',
    },
    {
      label: 'Profil & équipe',
      sub: 'Coordonnées, horaires et informations légales',
      icon: <UserCog className="text-violet-600" />,
      tone: 'bg-violet-50',
      to: '/profile',
    },
  ];

  // Facts we actually hold, drawn from the verified technical file.
  const facts =
    role === 'clinic'
      ? [
          { label: 'Lits', value: form.bedsCount ?? '—', icon: <Users size={18} className="text-blue-600" />, tone: 'bg-blue-50' },
          { label: 'Médecins', value: form.doctorsCount ?? '—', icon: <Stethoscope size={18} className="text-emerald-600" />, tone: 'bg-emerald-50' },
          { label: 'Urgences', value: form.hasEmergency ? '24h/24' : 'Non', icon: <CalendarClock size={18} className="text-amber-600" />, tone: 'bg-amber-50' },
          { label: 'Bloc opératoire', value: form.hasOperatingRoom ? 'Oui' : 'Non', icon: <CheckCircle2 size={18} className="text-violet-600" />, tone: 'bg-violet-50' },
        ]
      : [
          { label: 'Expérience', value: form.yearsOfPractice ?? '—', unit: 'ans', icon: <Stethoscope size={18} className="text-amber-600" />, tone: 'bg-amber-50' },
          { label: 'Consultation', value: form.consultationDuration ?? '—', unit: 'min', icon: <CalendarClock size={18} className="text-blue-600" />, tone: 'bg-blue-50' },
          { label: 'À domicile', value: form.homeVisits ? 'Oui' : 'Non', icon: <Compass size={18} className="text-emerald-600" />, tone: 'bg-emerald-50' },
          { label: 'Téléconsultation', value: form.teleconsultation ? 'Oui' : 'Non', icon: <Sparkles size={18} className="text-violet-600" />, tone: 'bg-violet-50' },
        ];

  const disciplines: string[] = String(form.specialties || form.disciplines || '')
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);

  return (
    <PageContainer>
      <PageHeader
        eyebrow={`Espace ${definition.label}`}
        title={
          <>
            Bonjour, <span className={definition.accent.text}>{establishment}</span>
          </>
        }
        subtitle={`${form.city || 'Cameroun'} — ${new Date().toLocaleDateString('fr-FR', {
          weekday: 'long',
          day: 'numeric',
          month: 'long',
          year: 'numeric',
        })}`}
        actions={
          <>
            <Badge tone="success" icon={<CheckCircle2 size={14} />} className="px-3 md:px-4 py-1.5 md:py-2 rounded-xl">
              Établissement vérifié
            </Badge>
            <span
              className={cn(
                'w-10 h-10 rounded-xl flex items-center justify-center text-white',
                definition.accent.solid
              )}
            >
              <RoleIcon role={role} size={18} />
            </span>
          </>
        }
      />

      <StatGrid columns={4}>
        {facts.map((fact) => (
          <StatCard
            key={fact.label}
            label={fact.label}
            value={fact.value}
            unit={'unit' in fact ? (fact.unit as string) : undefined}
            icon={fact.icon}
            tone={fact.tone}
          />
        ))}
      </StatGrid>

      <SplitLayout
        main={
          <>
            <CardSection>
              <SectionHeader title="Accès rapide" />
              <div className="grid grid-cols-2 gap-3 md:gap-4">
                {quickActions.map((action) => (
                  <motion.button
                    key={action.label}
                    whileHover={{ y: -3 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => navigate(action.to)}
                    className="group bg-white rounded-2xl md:rounded-[2rem] border border-slate-100 p-4 md:p-6 flex flex-col gap-3 md:gap-4 shadow-sm hover:shadow-lg transition-all text-left"
                  >
                    <span
                      className={cn(
                        'p-3 md:p-4 rounded-xl md:rounded-2xl w-fit transition-transform group-hover:scale-110',
                        action.tone
                      )}
                    >
                      {React.cloneElement(action.icon as React.ReactElement, { size: 20 } as any)}
                    </span>
                    <div>
                      <h4 className="font-bold text-slate-900 text-xs md:text-sm">{action.label}</h4>
                      <p className="text-slate-400 text-[10px] md:text-xs mt-0.5">{action.sub}</p>
                    </div>
                    <ArrowRight
                      size={14}
                      className="text-slate-300 group-hover:text-brand-600 group-hover:translate-x-1 transition-all mt-auto"
                    />
                  </motion.button>
                ))}
              </div>
            </CardSection>

            {disciplines.length > 0 && (
              <CardSection>
                <SectionHeader
                  title={role === 'clinic' ? 'Spécialités déclarées' : 'Disciplines pratiquées'}
                />
                <div className="flex flex-wrap gap-2">
                  {disciplines.map((item) => (
                    <span
                      key={item}
                      className="px-3 py-1.5 rounded-xl bg-slate-50 border border-slate-100 text-xs font-bold text-slate-700"
                    >
                      {item}
                    </span>
                  ))}
                </div>
              </CardSection>
            )}
          </>
        }
        aside={
          <>
            <CardSection>
              <SectionHeader title="Votre dossier" accent="bg-blue-600" />
              <dl className="space-y-2">
                {[
                  { label: 'Établissement', value: establishment },
                  {
                    label: role === 'clinic' ? 'Agrément MINSANTE' : 'Certification',
                    value: form.healthMinistryNumber || form.certificationNumber || '—',
                  },
                  { label: 'Ville', value: form.city || '—' },
                  { label: 'Adresse', value: form.address || '—' },
                ].map((row) => (
                  <div
                    key={row.label}
                    className="flex items-start justify-between gap-3 p-3 rounded-xl bg-slate-50 border border-slate-100"
                  >
                    <dt className="text-[11px] font-bold text-slate-500 uppercase tracking-wider shrink-0">
                      {row.label}
                    </dt>
                    <dd className="text-xs font-bold text-slate-900 text-right min-w-0 truncate">
                      {row.value}
                    </dd>
                  </div>
                ))}
              </dl>
            </CardSection>

            {/* Honest about what isn't built rather than showing placeholder charts. */}
            <Card className="bg-slate-900 text-white space-y-4">
              <div className="flex items-center gap-3">
                <span className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center text-brand-400">
                  <CalendarClock size={18} />
                </span>
                <h3 className="font-display font-bold text-base">Bientôt disponible</h3>
              </div>
              <p className="text-xs text-slate-400 leading-relaxed">
                La gestion des consultations, l'agenda des praticiens et le dossier patient partagé
                arrivent dans une prochaine version. Votre établissement est déjà visible dans le
                répertoire et joignable par les patients.
              </p>
              <button
                onClick={() => navigate('/directory')}
                className="w-full bg-white/10 hover:bg-white/20 text-white font-bold py-3 rounded-xl transition-colors text-[10px] uppercase tracking-widest"
              >
                Voir ma fiche publique
              </button>
            </Card>
          </>
        }
      />
    </PageContainer>
  );
}
