import express from "express";
import { createServer as createViteServer } from "vite";
import rateLimit from "express-rate-limit";
import path from "path";
import {
  ERROR_MESSAGE,
  FALLBACK_BETA,
  MISSING_KEY_MESSAGE,
  MODEL,
  REFUSAL_MESSAGE,
  buildSystemPrompt,
  getClient,
  normaliseMedications,
  runInteractionCheck,
  sseFrame,
  toMessages,
} from "./src/server/careIA";

/**
 * Local development server.
 *
 * In production the site is served statically and the Care IA endpoints run as
 * Vercel serverless functions (`api/ai/*`); the two share the handlers in
 * `src/server/careIA.ts`, so behaviour stays identical.
 */
async function startServer() {
  const app = express();
  const PORT = 3000;

  // Trust proxy is required for express-rate-limit to work correctly in our proxy environment
  app.set("trust proxy", 1);

  app.use(express.json());

  const apiLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 50,
    message: { error: "Trop de requêtes, veuillez réessayer plus tard." },
    standardHeaders: true,
    legacyHeaders: false,
  });

  app.use("/api/ai/", apiLimiter);

  app.post("/api/ai/chat", async (req, res) => {
    const client = getClient();
    if (!client) {
      return res.status(500).json({ error: MISSING_KEY_MESSAGE });
    }

    const { message, history, patientProfile, patientOrders } = req.body;
    if (typeof message !== "string" || !message.trim()) {
      return res.status(400).json({ error: "Le message est requis." });
    }

    res.setHeader("Content-Type", "text/event-stream");
    res.setHeader("Cache-Control", "no-cache, no-transform");
    res.setHeader("Connection", "keep-alive");
    res.flushHeaders();

    const send = (payload: unknown) => res.write(sseFrame(payload));

    try {
      const stream = client.beta.messages.stream({
        model: MODEL,
        max_tokens: 8000,
        betas: [FALLBACK_BETA],
        fallbacks: "default",
        system: buildSystemPrompt(patientProfile, patientOrders),
        messages: toMessages(history, message),
      });

      req.on("close", () => stream.abort());

      for await (const event of stream) {
        if (event.type === "content_block_delta" && event.delta.type === "text_delta") {
          send({ type: "delta", text: event.delta.text });
        }
      }

      const final = await stream.finalMessage();
      if (final.stop_reason === "refusal") {
        send({ type: "refusal", text: REFUSAL_MESSAGE });
      }
      send({ type: "done" });
    } catch (error) {
      console.error("Care IA chat error:", error);
      send({ type: "error", text: ERROR_MESSAGE });
    } finally {
      res.end();
    }
  });

  app.post("/api/ai/interactions", async (req, res) => {
    const client = getClient();
    if (!client) {
      return res.status(500).json({ error: MISSING_KEY_MESSAGE });
    }

    const names = normaliseMedications(req.body?.medications);
    if (names.length < 2) {
      return res.status(400).json({ error: "Indiquez au moins deux médicaments à comparer." });
    }

    try {
      const result = await runInteractionCheck(client, names, req.body?.patientProfile);
      if (!result.ok) {
        return res.status(result.status).json({ error: result.error });
      }
      res.json(result.report);
    } catch (error) {
      console.error("Care IA interaction check error:", error);
      res.status(500).json({ error: "Erreur lors de l'analyse des interactions." });
    }
  });

  app.get("/api/health", (req, res) => {
    res.json({ status: "ok" });
  });

  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*all", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer().catch(err => {
  console.error("Failed to start server:", err);
  process.exit(1);
});
