import express from "express";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI } from "@google/genai";
import rateLimit from "express-rate-limit";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  const app = express();
  const PORT = 3000;

  // Static initialization of Gemini - will be used inside the handler
  const apiKey = process.env.GEMINI_API_KEY;
  const genAI = apiKey ? new GoogleGenAI({ apiKey }) : null;

  // Body parser
  app.use(express.json());

  // Rate limiting to protect Gemini API
  const apiLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 50, // limit each IP to 50 requests per windowMs
    message: { error: "Trop de requêtes, veuillez réessayer plus tard." },
    standardHeaders: true,
    legacyHeaders: false,
  });

  // Apply rate limiter to AI routes
  app.use("/api/ai/", apiLimiter);

  const medicalCoachSystemInstruction = `
Tu es Medimap-IA, un assistant d'orientation médicale préliminaire spécialisé pour le contexte camerounais.
Tu es SOUS AUCUN PRÉTEXTE un médecin. Tu ne fais pas de diagnostic définitif et tu ne prescris pas de médicaments sur ordonnance.

RÈGLES STRICTES :
1. BASE TOI EXCLUSIVEMENT sur les informations médicales validées. Si tu n'as pas l'information, dis-le.
2. SI LES SYMPTÔMES DÉCRITS INCLUENT DES SIGNES D'URGENCE VITALE (douleur thoracique intense, difficulté à respirer, perte de conscience, saignement abondant, signes d'AVC), TU DOIS IMMÉDIATEMENT conseiller d'appeler les urgences au Cameroun (15 pour le SAMU, 112 ou 118) et arrêter le jeu de questions.
3. Ne suggère JAMAIS de médicaments soumis à ordonnance. Tu peux uniquement suggérer des mesures d'hygiène ou des médicaments d'automédication courante (paracétamol, etc. en rappelant de lire la notice).
4. Pose des questions ciblées pour affiner (durée, intensité de 1 à 10, autres symptômes).
5. À la fin de CHAQUE réponse, tu DOIS inclure exactement ce message : "⚠️ Avertissement : Cette orientation ne remplace pas une consultation médicale. Consultez un professionnel de santé ou rendez-vous dans la pharmacie la plus proche pour un diagnostic précis."

Structure tes réponses : [Analyse], [Conseils], [Recommandations].
Langue : Français.
`;

  // Gemini Proxy Endpoint
  app.post("/api/ai/chat", async (req, res) => {
    try {
      const { message, history } = req.body;
      
      if (!genAI) {
        return res.status(500).json({ error: "Clé API non configurée sur le serveur." });
      }

      const modelName = "gemini-1.5-flash"; // Using a stable model name
      
      const contents = [];
      if (history && Array.isArray(history)) {
        contents.push(...history);
      }
      contents.push({ role: "user", parts: [{ text: message }] });

      const response = await genAI.models.generateContent({
        model: "gemini-3-flash-preview",
        contents,
        config: {
          systemInstruction: medicalCoachSystemInstruction,
          temperature: 0.3,
        }
      });
      
      res.json({ text: response.text });
    } catch (error) {
      console.error("Gemini Proxy Error:", error);
      res.status(500).json({ error: "Erreur lors de la communication avec l'IA." });
    }
  });

  // Health check
  app.get("/api/health", (req, res) => {
    res.json({ status: "ok" });
  });

  // Vite middleware for development
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
