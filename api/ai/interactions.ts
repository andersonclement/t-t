import type { IncomingMessage, ServerResponse } from 'http';
import {
  MISSING_KEY_MESSAGE,
  getClient,
  normaliseMedications,
  runInteractionCheck,
} from '../../src/server/careIA';

type Req = IncomingMessage & { method?: string; body?: any };
type Res = ServerResponse & {
  status: (code: number) => Res;
  json: (body: unknown) => void;
};

/** Returns a structured, severity-graded drug interaction report. */
export default async function handler(req: Req, res: Res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Méthode non autorisée.' });
  }

  const client = getClient();
  if (!client) {
    return res.status(500).json({ error: MISSING_KEY_MESSAGE });
  }

  const { medications, patientProfile } = req.body ?? {};
  const names = normaliseMedications(medications);

  if (names.length < 2) {
    return res.status(400).json({ error: 'Indiquez au moins deux médicaments à comparer.' });
  }

  try {
    const result = await runInteractionCheck(client, names, patientProfile);
    if (!result.ok) {
      return res.status(result.status).json({ error: result.error });
    }
    res.status(200).json(result.report);
  } catch (error) {
    console.error('Care IA interaction check error:', error);
    res.status(500).json({ error: "Erreur lors de l'analyse des interactions." });
  }
}
