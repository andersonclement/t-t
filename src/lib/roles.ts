/**
 * Single source of truth for account types.
 *
 * Signup, onboarding, admin validation, navigation and the demo accounts all
 * derive from this registry — adding a profession means adding an entry here,
 * not touching six screens.
 */

export type Role = 'patient' | 'pharmacist' | 'clinic' | 'naturopath' | 'admin';

/** Roles that go through document review before they can operate. */
export type ProfessionalRole = 'pharmacist' | 'clinic' | 'naturopath';

export const PROFESSIONAL_ROLES: ProfessionalRole[] = ['pharmacist', 'clinic', 'naturopath'];

/**
 * Onboarding status. Professionals start at `pending_technical_file` and move
 * forward as the admin reviews them; everyone else is `activated` on signup.
 */
export type AccountStatus =
  | 'pending_technical_file'
  | 'pending_appointment'
  | 'pending_admin_approval'
  | 'activated'
  | 'rejected';

export interface OnboardingField {
  name: string;
  label: string;
  /** `select` renders a dropdown from `options`; `toggle` renders a yes/no switch. */
  type: 'text' | 'number' | 'select' | 'toggle' | 'textarea';
  placeholder?: string;
  required?: boolean;
  options?: { value: string; label: string }[];
  /** Rendered under the field to explain what the reviewer expects. */
  hint?: string;
}

export interface RoleDefinition {
  id: Role;
  label: string;
  plural: string;
  /** Shown on the signup role picker. */
  tagline: string;
  /** Name of the establishment this role runs, e.g. "Pharmacie". Null for non-professionals. */
  establishmentLabel: string | null;
  /** Field name on the profile holding the establishment name. */
  establishmentField: string | null;
  accent: {
    /** Tailwind background for solid chips. */
    solid: string;
    /** Tailwind background + text for soft chips. */
    soft: string;
    /** Tailwind text colour. */
    text: string;
  };
  isProfessional: boolean;
  /** Landing route once the account is active. */
  home: string;
  /** Sections of the onboarding technical file, in order. */
  onboarding: { title: string; description: string; fields: OnboardingField[] }[];
}

const YES_NO: OnboardingField['options'] = [
  { value: 'true', label: 'Oui' },
  { value: 'false', label: 'Non' },
];

export const ROLES: Record<Role, RoleDefinition> = {
  patient: {
    id: 'patient',
    label: 'Patient',
    plural: 'Patients',
    tagline: 'Commander mes médicaments et suivre ma santé',
    establishmentLabel: null,
    establishmentField: null,
    accent: { solid: 'bg-brand-600', soft: 'bg-brand-50 text-brand-700', text: 'text-brand-600' },
    isProfessional: false,
    home: '/',
    onboarding: [],
  },

  pharmacist: {
    id: 'pharmacist',
    label: 'Pharmacien',
    plural: 'Pharmaciens',
    tagline: 'Gérer mon officine, mon stock et mes commandes',
    establishmentLabel: 'Pharmacie',
    establishmentField: 'pharmacyName',
    accent: { solid: 'bg-emerald-600', soft: 'bg-emerald-50 text-emerald-700', text: 'text-emerald-600' },
    isProfessional: true,
    home: '/',
    onboarding: [
      {
        title: 'Identité légale',
        description: "Les références qui permettent de vérifier l'existence légale de l'officine.",
        fields: [
          { name: 'establishmentName', label: "Nom de l'officine", type: 'text', required: true, placeholder: 'Pharmacie de la Paix' },
          { name: 'onpcNumber', label: 'Numéro ONPC', type: 'text', required: true, placeholder: 'ONPC-2024-XXXX', hint: "Ordre National des Pharmaciens du Cameroun." },
          { name: 'legalLicenseNumber', label: "Licence d'exploitation", type: 'text', required: true, placeholder: 'LIC-XXXXX' },
          { name: 'city', label: 'Ville', type: 'text', required: true, placeholder: 'Douala' },
          { name: 'address', label: 'Adresse complète', type: 'text', required: true, placeholder: 'Boulevard de la Liberté, Akwa' },
        ],
      },
      {
        title: 'Équipe et conservation',
        description: 'Ces éléments conditionnent la conservation des médicaments thermosensibles.',
        fields: [
          { name: 'pharmacistsCount', label: 'Pharmaciens diplômés', type: 'number', required: true },
          {
            name: 'coldChainEquipment',
            label: 'Chaîne du froid',
            type: 'select',
            required: true,
            options: [
              { value: 'medical_fridge', label: 'Réfrigérateur médical certifié' },
              { value: 'standard_fridge', label: 'Réfrigérateur standard' },
              { value: 'none', label: 'Aucun équipement' },
            ],
          },
          { name: 'temperatureMonitor', label: 'Sonde de température', type: 'toggle', options: YES_NO },
          {
            name: 'backupGenerator',
            label: 'Groupe électrogène',
            type: 'select',
            options: [
              { value: 'automated', label: 'Automatique' },
              { value: 'manual', label: 'Manuel' },
              { value: 'none', label: 'Aucun' },
            ],
          },
        ],
      },
      {
        title: 'Sécurité et conformité',
        description: 'Obligations réglementaires pour la détention de produits pharmaceutiques.',
        fields: [
          { name: 'narcoticsSafe', label: 'Coffre à stupéfiants', type: 'toggle', options: YES_NO },
          { name: 'fireExtinguisher', label: 'Extincteur en règle', type: 'toggle', options: YES_NO },
          { name: 'airConditioned', label: 'Local climatisé', type: 'toggle', options: YES_NO },
          { name: 'wasteProtocol', label: 'Protocole déchets (DASRI)', type: 'toggle', options: YES_NO },
        ],
      },
    ],
  },

  clinic: {
    id: 'clinic',
    label: 'Clinique',
    plural: 'Cliniques',
    tagline: 'Gérer mes consultations, mes praticiens et mes patients',
    establishmentLabel: 'Clinique',
    establishmentField: 'clinicName',
    accent: { solid: 'bg-blue-600', soft: 'bg-blue-50 text-blue-700', text: 'text-blue-600' },
    isProfessional: true,
    home: '/',
    onboarding: [
      {
        title: 'Identité légale',
        description: "Références d'agrément de l'établissement de soins.",
        fields: [
          { name: 'establishmentName', label: "Nom de l'établissement", type: 'text', required: true, placeholder: "Clinique de l'Espoir" },
          { name: 'healthMinistryNumber', label: 'Agrément Ministère de la Santé', type: 'text', required: true, placeholder: 'MINSANTE-XXXX', hint: "Numéro d'autorisation d'ouverture." },
          { name: 'legalLicenseNumber', label: "Licence d'exploitation", type: 'text', required: true, placeholder: 'LIC-XXXXX' },
          { name: 'city', label: 'Ville', type: 'text', required: true, placeholder: 'Douala' },
          { name: 'address', label: 'Adresse complète', type: 'text', required: true, placeholder: 'Quartier Bonanjo' },
        ],
      },
      {
        title: 'Capacité et plateau technique',
        description: 'Ce que la clinique peut réellement prendre en charge.',
        fields: [
          { name: 'bedsCount', label: "Lits d'hospitalisation", type: 'number', required: true },
          { name: 'doctorsCount', label: 'Médecins inscrits à l\'Ordre', type: 'number', required: true },
          {
            name: 'specialties',
            label: 'Spécialités proposées',
            type: 'textarea',
            required: true,
            placeholder: 'Médecine générale, pédiatrie, gynécologie…',
            hint: 'Séparez les spécialités par des virgules.',
          },
          { name: 'hasEmergency', label: 'Service d\'urgence 24h/24', type: 'toggle', options: YES_NO },
          { name: 'hasOperatingRoom', label: 'Bloc opératoire', type: 'toggle', options: YES_NO },
          { name: 'hasLaboratory', label: 'Laboratoire interne', type: 'toggle', options: YES_NO },
        ],
      },
      {
        title: 'Hygiène et conformité',
        description: 'Obligations sanitaires pour un établissement recevant des patients.',
        fields: [
          { name: 'sterilizationUnit', label: 'Unité de stérilisation', type: 'toggle', options: YES_NO },
          { name: 'wasteProtocol', label: 'Protocole déchets (DASRI)', type: 'toggle', options: YES_NO },
          { name: 'backupGenerator', label: 'Groupe électrogène', type: 'select', options: [
            { value: 'automated', label: 'Automatique' },
            { value: 'manual', label: 'Manuel' },
            { value: 'none', label: 'Aucun' },
          ] },
          { name: 'insurancePartners', label: 'Assurances conventionnées', type: 'text', placeholder: 'Activa, Chanas, Beneficial…' },
        ],
      },
    ],
  },

  naturopath: {
    id: 'naturopath',
    label: 'Naturopathe',
    plural: 'Naturopathes',
    tagline: 'Proposer mes consultations et remèdes naturels',
    establishmentLabel: 'Cabinet',
    establishmentField: 'practiceName',
    accent: { solid: 'bg-amber-600', soft: 'bg-amber-50 text-amber-700', text: 'text-amber-600' },
    isProfessional: true,
    home: '/',
    onboarding: [
      {
        title: 'Identité professionnelle',
        description: 'Ce qui atteste de votre formation et de votre pratique.',
        fields: [
          { name: 'establishmentName', label: 'Nom du cabinet', type: 'text', required: true, placeholder: 'Cabinet Bien-Être Nature' },
          { name: 'certificationBody', label: 'Organisme de certification', type: 'text', required: true, placeholder: 'FENAHMAN, OMNES…', hint: "L'organisme qui a délivré votre diplôme." },
          { name: 'certificationNumber', label: 'Numéro de certification', type: 'text', required: true, placeholder: 'CERT-XXXXX' },
          { name: 'yearsOfPractice', label: "Années d'expérience", type: 'number', required: true },
          { name: 'city', label: 'Ville', type: 'text', required: true, placeholder: 'Yaoundé' },
          { name: 'address', label: 'Adresse du cabinet', type: 'text', required: true, placeholder: 'Quartier Bastos' },
        ],
      },
      {
        title: 'Pratique',
        description: 'Ce que vous proposez à vos consultants.',
        fields: [
          {
            name: 'disciplines',
            label: 'Disciplines pratiquées',
            type: 'textarea',
            required: true,
            placeholder: 'Phytothérapie, nutrition, aromathérapie…',
            hint: 'Séparez les disciplines par des virgules.',
          },
          { name: 'consultationDuration', label: 'Durée d\'une consultation (min)', type: 'number', required: true },
          { name: 'homeVisits', label: 'Consultations à domicile', type: 'toggle', options: YES_NO },
          { name: 'teleconsultation', label: 'Téléconsultation', type: 'toggle', options: YES_NO },
        ],
      },
      {
        title: 'Produits et conformité',
        description: 'La vente de préparations engage votre responsabilité.',
        fields: [
          { name: 'sellsRemedies', label: 'Vente de préparations', type: 'toggle', options: YES_NO },
          {
            name: 'sourcingPolicy',
            label: 'Provenance des plantes',
            type: 'select',
            options: [
              { value: 'certified', label: 'Fournisseurs certifiés' },
              { value: 'own_production', label: 'Production personnelle' },
              { value: 'mixed', label: 'Mixte' },
              { value: 'none', label: 'Non concerné' },
            ],
          },
          {
            name: 'referralPolicy',
            label: 'Orientation médicale',
            type: 'toggle',
            options: YES_NO,
            hint: "Vous engagez-vous à orienter vers un médecin en cas de signe d'alerte ?",
          },
        ],
      },
    ],
  },

  admin: {
    id: 'admin',
    label: 'Administrateur',
    plural: 'Administrateurs',
    tagline: 'Valider les professionnels et superviser la plateforme',
    establishmentLabel: null,
    establishmentField: null,
    accent: { solid: 'bg-slate-900', soft: 'bg-slate-100 text-slate-700', text: 'text-slate-900' },
    isProfessional: false,
    home: '/admin',
    onboarding: [],
  },
};

export function isProfessionalRole(role: string | undefined | null): role is ProfessionalRole {
  return PROFESSIONAL_ROLES.includes(role as ProfessionalRole);
}

export function getRole(role: string | undefined | null): RoleDefinition {
  return ROLES[(role as Role) ?? 'patient'] ?? ROLES.patient;
}

/** The establishment name for a profile, whatever role it holds. */
export function getEstablishmentName(profile: any): string | null {
  if (!profile) return null;
  const definition = getRole(profile.role);
  if (!definition.establishmentField) return null;
  return profile[definition.establishmentField] || profile.technicalForm?.establishmentName || null;
}

// ─── Demo accounts ────────────────────────────────────────────────────────
//
// These are REAL Firebase accounts with a shared, published password. They
// exist so each interface can be demonstrated without provisioning users, and
// they are gated by VITE_ENABLE_DEMO for that reason — an open admin login is
// not something you want on a production deployment.

export const DEMO_PASSWORD = 'Dokta123!';

export interface DemoAccount {
  role: Role;
  email: string;
  displayName: string;
  establishmentName?: string;
  /** What the tester will see after signing in. */
  blurb: string;
}

export const DEMO_ACCOUNTS: DemoAccount[] = [
  {
    role: 'patient',
    email: 'patient@dokta.cm',
    displayName: 'Awa Patient',
    blurb: 'Recherche de médicaments, commandes, carte de santé et Care IA.',
  },
  {
    role: 'pharmacist',
    email: 'pharmacien@dokta.cm',
    displayName: 'Dr. Nkeng',
    establishmentName: 'Pharmacie de la Paix',
    blurb: 'Tableau de bord officine, inventaire, commandes et ordonnances.',
  },
  {
    role: 'clinic',
    email: 'clinique@dokta.cm',
    displayName: "Clinique de l'Espoir",
    establishmentName: "Clinique de l'Espoir",
    blurb: 'Consultations, praticiens et suivi des patients.',
  },
  {
    role: 'naturopath',
    email: 'naturopathe@dokta.cm',
    displayName: 'Mama Ngo',
    establishmentName: 'Cabinet Bien-Être Nature',
    blurb: 'Consultations naturopathiques et remèdes traditionnels.',
  },
  {
    role: 'admin',
    email: 'admin@dokta.cm',
    displayName: 'Admin Dokta',
    blurb: 'Validation des professionnels et supervision de la plateforme.',
  },
];

/**
 * Demo sign-in is on unless explicitly disabled. Set VITE_ENABLE_DEMO=false
 * for a production deployment — otherwise the admin portal is reachable with
 * a password that is published in this file.
 */
export const DEMO_ENABLED = import.meta.env.VITE_ENABLE_DEMO !== 'false';

export function getDemoAccount(role: Role): DemoAccount | undefined {
  return DEMO_ACCOUNTS.find((a) => a.role === role);
}
