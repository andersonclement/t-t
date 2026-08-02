import type { IncomingMessage, ServerResponse } from 'http';
import {
  ERROR_MESSAGE,
  FALLBACK_BETA,
  MISSING_KEY_MESSAGE,
  MODEL,
  REFUSAL_MESSAGE,
  buildSystemPrompt,
  getClient,
  sseFrame,
  toMessages,
} from '../../src/server/careIA';

type Req = IncomingMessage & { method?: string; body?: any };
type Res = ServerResponse & {
  status: (code: number) => Res;
  json: (body: unknown) => void;
};

/**
 * Streams the medical coach's reply as Server-Sent Events.
 *
 * The deployed site is static, so this serverless function — not the Express
 * app in `server.ts` — is what answers in production.
 */
export default async function handler(req: Req, res: Res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Méthode non autorisée.' });
  }

  const client = getClient();
  if (!client) {
    return res.status(500).json({ error: MISSING_KEY_MESSAGE });
  }

  const { message, history, patientProfile, patientOrders } = req.body ?? {};
  if (typeof message !== 'string' || !message.trim()) {
    return res.status(400).json({ error: 'Le message est requis.' });
  }

  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache, no-transform');
  res.setHeader('Connection', 'keep-alive');

  const send = (payload: unknown) => res.write(sseFrame(payload));

  try {
    const stream = client.beta.messages.stream({
      model: MODEL,
      max_tokens: 8000,
      betas: [FALLBACK_BETA],
      fallbacks: 'default',
      system: buildSystemPrompt(patientProfile, patientOrders),
      messages: toMessages(history, message),
    });

    // Abandon generation if the browser navigates away mid-answer.
    req.on('close', () => stream.abort());

    for await (const event of stream) {
      if (event.type === 'content_block_delta' && event.delta.type === 'text_delta') {
        send({ type: 'delta', text: event.delta.text });
      }
    }

    const final = await stream.finalMessage();
    if (final.stop_reason === 'refusal') {
      send({ type: 'refusal', text: REFUSAL_MESSAGE });
    }
    send({ type: 'done' });
  } catch (error) {
    console.error('Care IA chat error:', error);
    send({ type: 'error', text: ERROR_MESSAGE });
  } finally {
    res.end();
  }
}
