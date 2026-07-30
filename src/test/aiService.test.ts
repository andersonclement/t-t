import { describe, it, expect, vi, afterEach } from 'vitest';
import { chatWithMedicalCoach, checkDrugInteractions } from '../services/aiService';

/** Builds a Response whose body streams `chunks` as raw bytes. */
function sseResponse(chunks: string[]): Response {
  const encoder = new TextEncoder();
  const body = new ReadableStream<Uint8Array>({
    start(controller) {
      for (const chunk of chunks) controller.enqueue(encoder.encode(chunk));
      controller.close();
    },
  });
  return new Response(body, { status: 200 });
}

const frame = (payload: unknown) => `data: ${JSON.stringify(payload)}\n\n`;

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('chatWithMedicalCoach', () => {
  it('concatenates deltas and reports each one to onDelta', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue(
        sseResponse([
          frame({ type: 'delta', text: 'Bonjour' }),
          frame({ type: 'delta', text: ' Alice' }),
          frame({ type: 'done' }),
        ])
      )
    );

    const seen: string[] = [];
    const result = await chatWithMedicalCoach('Salut', [], { onDelta: (t) => seen.push(t) });

    expect(result).toBe('Bonjour Alice');
    expect(seen).toEqual(['Bonjour', ' Alice']);
  });

  it('reassembles a frame split across two network chunks', async () => {
    const full = frame({ type: 'delta', text: 'texte complet' });
    const cut = Math.floor(full.length / 2);

    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue(sseResponse([full.slice(0, cut), full.slice(cut), frame({ type: 'done' })]))
    );

    expect(await chatWithMedicalCoach('Salut')).toBe('texte complet');
  });

  it('surfaces a refusal as message text', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue(
        sseResponse([frame({ type: 'refusal', text: 'Je ne peux pas répondre.' }), frame({ type: 'done' })])
      )
    );

    expect(await chatWithMedicalCoach('...')).toBe('Je ne peux pas répondre.');
  });

  it('falls back to a safe message when the request fails', async () => {
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('network down')));

    const result = await chatWithMedicalCoach('Salut');

    expect(result).toContain('erreur technique');
    expect(result).toContain('ne remplace pas une consultation médicale');
  });

  it('forwards prior turns as role/content pairs', async () => {
    const fetchMock = vi.fn().mockResolvedValue(sseResponse([frame({ type: 'done' })]));
    vi.stubGlobal('fetch', fetchMock);

    await chatWithMedicalCoach('Et ensuite ?', [
      { role: 'user', content: 'Bonjour' },
      { role: 'assistant', content: 'Bonjour, comment puis-je aider ?' },
    ]);

    const body = JSON.parse(fetchMock.mock.calls[0][1].body);
    expect(body.history).toEqual([
      { role: 'user', content: 'Bonjour' },
      { role: 'assistant', content: 'Bonjour, comment puis-je aider ?' },
    ]);
    expect(body.message).toBe('Et ensuite ?');
  });
});

describe('checkDrugInteractions', () => {
  it('returns the parsed report', async () => {
    const report = { risqueGlobal: 'aucun', resume: 'Aucune interaction.', interactions: [] };
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response(JSON.stringify(report), { status: 200 })));

    expect(await checkDrugInteractions(['Paracétamol', 'Amoxicilline'])).toEqual(report);
  });

  it('throws with the server-provided reason', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue(
        new Response(JSON.stringify({ error: 'Indiquez au moins deux médicaments à comparer.' }), { status: 400 })
      )
    );

    await expect(checkDrugInteractions(['Paracétamol'])).rejects.toThrow('au moins deux médicaments');
  });
});
