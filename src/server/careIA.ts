/**
 * Care IA request handling, kept free of any web framework.
 *
 * The same logic backs the local Express server (`server.ts`) and the Vercel
 * serverless functions in `api/` — the deployed app is static, so the Express
 * process never runs in production.
 */

import Anthropic from '@anthropic-ai/sdk';

export const MODEL = 'claude-opus-5';

/**
 * Safety classifiers can decline a request outright — medical and
 * life-sciences prompts occasionally trip them even when benign. Declaring a
 * fallback lets the API re-run the declined request on another model
 * server-side instead of handing the user an error.
 */
export const FALLBACK_BETA = 'server-side-fallback-2026-07-01';

export const REFUSAL_MESSAGE =
  "Je ne peux pas répondre à cette demande. Reformulez votre question ou consultez directement un professionnel de santé.";

export const ERROR_MESSAGE =
  "Désolé, je rencontre une erreur technique. Veuillez réessayer plus tard.\n\n⚠️ Avertissement : Cette orientation ne remplace pas une consultation médicale. Consultez un professionnel de santé pour un diagnostic précis.";

export const MISSING_KEY_MESSAGE =
  "Clé API non configurée sur le serveur. Veuillez configurer ANTHROPIC_API_KEY.";

const medicalCoachSystemInstruction = `
Tu es Care IA, un assistant d'orientation médicale préliminaire spécialisé pour le contexte camerounais.
Tu es SOUS AUCUN PRÉTEXTE un médecin. Tu ne fais pas de diagnostic définitif et tu ne prescris pas de médicaments sur ordonnance.

RÈGLES STRICTES :
1. BASE TOI EXCLUSIVEMENT sur les informations médicales validées. Si tu n'as pas l'information, dis-le.
2. NE DONNE JAMAIS de numéros de téléphone d'urgence (comme le 15, 112, 118, SAMU, etc.) ni d'instructions pour appeler les urgences. Le bouton d'appel d'urgence a été retiré de l'application. Si les symptômes décrits incluent des signes d'urgence vitale, conseille simplement de consulter immédiatement un professionnel de santé ou de se rendre à l'hôpital le plus proche.
3. Ne suggère JAMAIS de médicaments soumis à ordonnance. Tu peux uniquement suggérer des mesures d'hygiène ou des médicaments d'automédication courante (paracétamol, etc. en rappelant de lire la notice).
4. Pose des questions ciblées pour affiner (durée, intensité de 1 à 10, autres symptômes).
5. À la fin de CHAQUE réponse, tu DOIS inclure exactement ce message : "⚠️ Avertissement : Cette orientation ne remplace pas une consultation médicale. Consultez un professionnel de santé ou rendez-vous dans la pharmacie la plus proche pour un diagnostic précis."

Structure tes réponses : [Analyse], [Conseils], [Recommandations].
Garde tes réponses concises et directes : va à l'essentiel, sans préambule ni répétition de la question.
Langue : Français.
`;

export interface PatientProfile {
  gender?: string;
  birthDate?: string;
  bloodType?: string;
  weight?: string | number;
  height?: string | number;
  allergies?: string;
  medicalHistory?: string;
  currentTreatments?: string;
}

export interface PatientOrder {
  id?: string;
  date?: string;
  status?: string;
  total?: number;
  items?: { count?: number; name?: string; price?: number }[];
}

export function getClient(): Anthropic | null {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  return apiKey ? new Anthropic({ apiKey }) : null;
}

/** Folds the patient's chart and order history into the system prompt. */
export function buildSystemPrompt(profile?: PatientProfile, orders?: PatientOrder[]): string {
  let instruction = medicalCoachSystemInstruction;

  if (profile) {
    instruction += `\n\n=== PROFIL DU PATIENT ACTUEL ===
- Genre: ${profile.gender || 'Non renseigné'}
- Date de naissance / Âge: ${profile.birthDate || 'Non renseignée'}
- Groupe sanguin: ${profile.bloodType || 'Non renseigné'}
- Poids: ${profile.weight ? profile.weight + ' kg' : 'Non renseigné'}
- Taille: ${profile.height ? profile.height + ' cm' : 'Non renseignée'}
- ALLERGIES CONNUES: ${profile.allergies || 'Aucune allergie signalée.'}
- ANTÉCÉDENTS MÉDICAUX / MALADIES CHRONIQUES: ${profile.medicalHistory || 'Aucun antécédent particulier signalé.'}
- TRAITEMENTS EN COURS: ${profile.currentTreatments || 'Aucun traitement de fond signalé.'}

CONSIGNES DE SÉCURITÉ DE PERSONNALISATION LIÉES AU PROFIL :
1. Si le patient déclare une ALLERGIE (par exemple à la Pénicilline, au Paracétamol, à l'Ibuprofène, aux noix ou autre), tu dois ABSOLUMENT adapter tes conseils : INTERDIS-TOI FORMELLEMENT de mentionner ou suggérer des médicaments ou substances à risque pour ses allergies. Alerte-le explicitement s'il pose des questions sur un produit dangereux par rapport à ses allergies.
2. S'il a des antécédents médicaux comme l'ASTHME, ne lui suggère pas d'anti-inflammatoires non stéroïdiens (comme l'ibuprofène ou l'aspirine) qui risquent de déclencher des crises de bronchospasme.
3. ANTICIPATION DES COMMANDES : S'il a un TRAITEMENT EN COURS régulier pour une maladie chronique (comme l'asthme, l'hypertension ou le diabète), rappelle-lui amicalement d'anticiper le renouvellement de ses médicaments en passant commande à l'avance sur l'application Dokta pour éviter toute interruption de traitement.
4. Montre de manière subtile mais rassurante dans ton diagnostic que tu as pris connaissance de ses caractéristiques (ex: ses allergies ou son asthme) pour lui proposer une orientation totalement sécurisée et sur-mesure.
`;
  }

  if (orders && orders.length > 0) {
    instruction += `\n\nHISTORIQUE DES COMMANDES RÉCENTES DU PATIENT :`;
    orders.forEach((order, i) => {
      instruction += `\n- Commande #${order.id || i} (Date: ${order.date || 'Inconnue'}) - Statut: ${order.status || 'En cours'} - Total: ${order.total || 0} FCFA`;
      order.items?.forEach((item) => {
        instruction += `\n  * ${item.count || 1}x ${item.name} (Prix: ${item.price || 0} FCFA)`;
      });
    });
    instruction += `\n\nCONSIGNES SUR L'HISTORIQUE DE COMMANDES :
1. Analyse les commandes passées du patient pour détecter s'il a commandé des médicaments de traitement régulier/chronique (par exemple, traitements de l'hypertension, du diabète, de l'asthme, etc.).
2. Si c'est le cas, propose-lui de manière proactive de l'aider à anticiper le renouvellement de ses traitements réguliers en passant une nouvelle commande sur Dokta.
3. N'hésite pas à faire référence poliment à ses achats récents s'il demande conseil sur l'un de ces produits.
`;
  }

  return instruction;
}

/** Turns the client's history into Messages API turns, dropping anything malformed. */
export function toMessages(history: unknown, message: string): Anthropic.MessageParam[] {
  const messages: Anthropic.MessageParam[] = [];

  if (Array.isArray(history)) {
    for (const turn of history) {
      if (turn?.role === 'user' || turn?.role === 'assistant') {
        messages.push({ role: turn.role, content: String(turn.content ?? '') });
      }
    }
  }

  messages.push({ role: 'user', content: message });
  return messages;
}

/** Schema for the drug-interaction checker's structured response. */
export const interactionSchema = {
  type: 'object',
  properties: {
    risqueGlobal: {
      type: 'string',
      enum: ['aucun', 'faible', 'modere', 'eleve'],
      description: 'Niveau de risque le plus élevé détecté parmi toutes les paires analysées.',
    },
    resume: {
      type: 'string',
      description: 'Synthèse en une ou deux phrases, compréhensible par un patient.',
    },
    interactions: {
      type: 'array',
      description: 'Une entrée par paire de médicaments présentant une interaction.',
      items: {
        type: 'object',
        properties: {
          medicaments: {
            type: 'array',
            items: { type: 'string' },
            description: 'Les médicaments concernés par cette interaction.',
          },
          severite: { type: 'string', enum: ['faible', 'moderee', 'majeure'] },
          description: { type: 'string', description: 'Ce qui se passe et pourquoi.' },
          conduite: { type: 'string', description: 'Conduite à tenir concrète pour le patient.' },
        },
        required: ['medicaments', 'severite', 'description', 'conduite'],
        additionalProperties: false,
      },
    },
  },
  required: ['risqueGlobal', 'resume', 'interactions'],
  additionalProperties: false,
} as const;

export function buildInteractionSystemPrompt(profile?: PatientProfile): string {
  return `Tu es un pharmacien clinicien. Analyse les interactions médicamenteuses entre les produits fournis.
Retourne uniquement les paires qui présentent réellement une interaction documentée — si aucune interaction n'existe, renvoie un tableau vide et un risque global "aucun".
Écris en français, dans un langage compréhensible par un patient, sans jargon inutile.
Tu ne remplaces pas un avis médical : la conduite à tenir doit toujours orienter vers un pharmacien ou un médecin en cas de doute.${
    profile?.allergies
      ? `\n\nALLERGIES DÉCLARÉES PAR LE PATIENT : ${profile.allergies}. Signale toute contre-indication liée à ces allergies.`
      : ''
  }${
    profile?.medicalHistory
      ? `\n\nANTÉCÉDENTS MÉDICAUX : ${profile.medicalHistory}. Tiens-en compte dans ton analyse.`
      : ''
  }`;
}

/** Normalises the medication list a client submitted. */
export function normaliseMedications(medications: unknown): string[] {
  if (!Array.isArray(medications)) return [];
  return medications
    .map((m) => String(m).trim())
    .filter(Boolean)
    .slice(0, 10);
}

export interface InteractionReport {
  risqueGlobal: string;
  resume: string;
  interactions: unknown[];
}

/** Runs the interaction check and returns the parsed report. */
export async function runInteractionCheck(
  client: Anthropic,
  medications: string[],
  profile?: PatientProfile
): Promise<{ ok: true; report: InteractionReport } | { ok: false; status: number; error: string }> {
  const response = await client.beta.messages.create({
    model: MODEL,
    max_tokens: 16000,
    betas: [FALLBACK_BETA],
    fallbacks: 'default',
    system: buildInteractionSystemPrompt(profile),
    messages: [
      {
        role: 'user',
        content: `Analyse les interactions entre ces médicaments : ${medications.join(', ')}.`,
      },
    ],
    output_config: {
      format: { type: 'json_schema', schema: interactionSchema },
    },
  });

  if (response.stop_reason === 'refusal') {
    return { ok: false, status: 422, error: REFUSAL_MESSAGE };
  }

  const text = response.content.find((block) => block.type === 'text')?.text;
  if (!text) {
    return { ok: false, status: 502, error: "Réponse vide de l'IA." };
  }

  return { ok: true, report: JSON.parse(text) as InteractionReport };
}

/** SSE frame helper shared by both transports. */
export function sseFrame(payload: unknown): string {
  return `data: ${JSON.stringify(payload)}\n\n`;
}
