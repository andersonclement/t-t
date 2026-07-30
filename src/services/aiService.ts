/**
 * Client for the Care IA endpoints. The API key never reaches the browser —
 * these call our own server, which talks to Claude.
 */

export interface ChatTurn {
  role: 'user' | 'assistant';
  content: string;
}

export interface DrugInteraction {
  medicaments: string[];
  severite: 'faible' | 'moderee' | 'majeure';
  description: string;
  conduite: string;
}

export interface InteractionReport {
  risqueGlobal: 'aucun' | 'faible' | 'modere' | 'eleve';
  resume: string;
  interactions: DrugInteraction[];
}

const FALLBACK_MESSAGE =
  "Désolé, je rencontre une erreur technique. Veuillez réessayer plus tard.\n\n⚠️ Avertissement : Cette orientation ne remplace pas une consultation médicale. Consultez un professionnel de santé pour un diagnostic précis.";

interface ChatOptions {
  patientProfile?: unknown;
  patientOrders?: unknown[];
  /** Called with each chunk of text as it arrives. */
  onDelta?: (text: string) => void;
  signal?: AbortSignal;
}

/**
 * Streams a reply from the medical coach, invoking `onDelta` as tokens arrive
 * and resolving with the complete text.
 */
export async function chatWithMedicalCoach(
  message: string,
  history: ChatTurn[] = [],
  options: ChatOptions = {}
): Promise<string> {
  const { patientProfile, patientOrders, onDelta, signal } = options;

  try {
    const response = await fetch('/api/ai/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message, history, patientProfile, patientOrders }),
      signal,
    });

    if (!response.ok || !response.body) {
      const detail = await response.json().catch(() => null);
      throw new Error(detail?.error || 'Erreur API');
    }

    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let buffer = '';
    let full = '';

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });

      // SSE frames are separated by a blank line; keep any partial tail.
      const frames = buffer.split('\n\n');
      buffer = frames.pop() ?? '';

      for (const frame of frames) {
        const line = frame.split('\n').find((l) => l.startsWith('data: '));
        if (!line) continue;

        let event: { type: string; text?: string };
        try {
          event = JSON.parse(line.slice(6));
        } catch {
          continue;
        }

        if (event.type === 'delta' && event.text) {
          full += event.text;
          onDelta?.(event.text);
        } else if ((event.type === 'error' || event.type === 'refusal') && event.text) {
          full += event.text;
          onDelta?.(event.text);
        }
      }
    }

    return full || FALLBACK_MESSAGE;
  } catch (error) {
    if (error instanceof DOMException && error.name === 'AbortError') return '';
    console.error('Care IA chat error:', error);
    return FALLBACK_MESSAGE;
  }
}

/** Analyses a list of medications for documented interactions. */
export async function checkDrugInteractions(
  medications: string[],
  patientProfile?: unknown
): Promise<InteractionReport> {
  const response = await fetch('/api/ai/interactions', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ medications, patientProfile }),
  });

  const payload = await response.json().catch(() => null);

  if (!response.ok) {
    throw new Error(payload?.error || "Erreur lors de l'analyse des interactions.");
  }

  return payload as InteractionReport;
}
