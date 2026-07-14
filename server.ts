import express from "express";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI } from "@google/genai";
import rateLimit from "express-rate-limit";
import path from "path";

async function startServer() {
  const app = express();
  const PORT = 3000;

  // Trust proxy is required for express-rate-limit to work correctly in our proxy environment
  app.set("trust proxy", 1);

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
Tu es Care IA, un assistant d'orientation médicale préliminaire spécialisé pour le contexte camerounais.
Tu es SOUS AUCUN PRÉTEXTE un médecin. Tu ne fais pas de diagnostic définitif et tu ne prescris pas de médicaments sur ordonnance.

RÈGLES STRICTES :
1. BASE TOI EXCLUSIVEMENT sur les informations médicales validées. Si tu n'as pas l'information, dis-le.
2. NE DONNE JAMAIS de numéros de téléphone d'urgence (comme le 15, 112, 118, SAMU, etc.) ni d'instructions pour appeler les urgences. Le bouton d'appel d'urgence a été retiré de l'application. Si les symptômes décrits incluent des signes d'urgence vitale, conseille simplement de consulter immédiatement un professionnel de santé ou de se rendre à l'hôpital le plus proche.
3. Ne suggère JAMAIS de médicaments soumis à ordonnance. Tu peux uniquement suggérer des mesures d'hygiène ou des médicaments d'automédication courante (paracétamol, etc. en rappelant de lire la notice).
4. Pose des questions ciblées pour affiner (durée, intensité de 1 à 10, autres symptômes).
5. À la fin de CHAQUE réponse, tu DOIS inclure exactement ce message : "⚠️ Avertissement : Cette orientation ne remplace pas une consultation médicale. Consultez un professionnel de santé ou rendez-vous dans la pharmacie la plus proche pour un diagnostic précis."

Structure tes réponses : [Analyse], [Conseils], [Recommandations].
Langue : Français.
`;

  // Gemini Proxy Endpoint
  app.post("/api/ai/chat", async (req, res) => {
    try {
      const { message, history, patientProfile, patientOrders } = req.body;
      
      const apiKey = process.env.GEMINI_API_KEY;
      if (!apiKey) {
        return res.status(500).json({ error: "Clé API non configurée sur le serveur. Veuillez configurer GEMINI_API_KEY." });
      }

      // Initialize the Gemini client lazily with telemetry User-Agent header
      const client = new GoogleGenAI({
        apiKey,
        httpOptions: {
          headers: {
            'User-Agent': 'aistudio-build',
          }
        }
      });
      
      const contents = [];
      if (history && Array.isArray(history)) {
        contents.push(...history);
      }
      contents.push({ role: "user", parts: [{ text: message }] });

      let dynamicInstruction = medicalCoachSystemInstruction;
      if (patientProfile) {
        const p = patientProfile;
        dynamicInstruction += `\n\n=== PROFIL DU PATIENT ACTUEL ===
- Genre: ${p.gender || 'Non renseigné'}
- Date de naissance / Âge: ${p.birthDate || 'Non renseignée'}
- Groupe sanguin: ${p.bloodType || 'Non renseigné'}
- Poids: ${p.weight ? p.weight + ' kg' : 'Non renseigné'}
- Taille: ${p.height ? p.height + ' cm' : 'Non renseignée'}
- ALLERGIES CONNUES: ${p.allergies || 'Aucune allergie signalée.'}
- ANTÉCÉDENTS MÉDICAUX / MALADIES CHRONIQUES: ${p.medicalHistory || 'Aucun antécédent particulier signalé.'}
- TRAITEMENTS EN COURS: ${p.currentTreatments || 'Aucun traitement de fond signalé.'}

CONSIGNES DE SÉCURITÉ DE PERSONNALISATION LIÉES AU PROFIL :
1. Si le patient déclare une ALLERGIE (par exemple à la Pénicilline, au Paracétamol, à l'Ibuprofène, aux noix ou autre), tu dois ABSOLUMENT adapter tes conseils : INTERDIS-TOI FORMELLEMENT de mentionner ou suggérer des médicaments ou substances à risque pour ses allergies. Alerte-le explicitement s'il pose des questions sur un produit dangereux par rapport à ses allergies.
2. S'il a des antécédents médicaux comme l'ASTHME, ne lui suggère pas d'anti-inflammatoires non stéroïdiens (comme l'ibuprofène ou l'aspirine) qui risquent de déclencher des crises de bronchospasme.
3. ANTICIPATION DES COMMANDES : S'il a un TRAITEMENT EN COURS régulier pour une maladie chronique (comme l'asthme, l'hypertension ou le diabète), rappelle-lui amicalement d'anticiper le renouvellement de ses médicaments en passant commande à l'avance sur l'application Medimap pour éviter toute interruption de traitement.
4. Montre de manière subtile mais rassurante dans ton diagnostic que tu as pris connaissance de ses caractéristiques (ex: ses allergies ou son asthme) pour lui proposer une orientation totalement sécurisée et sur-mesure.
`;
      }

      if (patientOrders && Array.isArray(patientOrders) && patientOrders.length > 0) {
        dynamicInstruction += `\n\nHISTORIQUE DES COMMANDES RÉCENTES DU PATIENT :`;
        patientOrders.forEach((o, i) => {
          dynamicInstruction += `\n- Commande #${o.id || i} (Date: ${o.date || 'Inconnue'}) - Statut: ${o.status || 'En cours'} - Total: ${o.total || 0} FCFA`;
          if (o.items && Array.isArray(o.items)) {
            o.items.forEach(item => {
              dynamicInstruction += `\n  * ${item.count || 1}x ${item.name} (Prix: ${item.price || 0} FCFA)`;
            });
          }
        });
        dynamicInstruction += `\n\nCONSIGNES SUR L'HISTORIQUE DE COMMANDES :
1. Analyse les commandes passées du patient pour détecter s'il a commandé des médicaments de traitement régulier/chronique (par exemple, traitements de l'hypertension, du diabète, de l'asthme, etc.).
2. Si c'est le cas, propose-lui de manière proactive de l'aider à anticiper le renouvellement de ses traitements réguliers en passant une nouvelle commande sur Medimap.
3. N'hésite pas à faire référence poliment à ses achats récents s'il demande conseil sur l'un de ces produits.
`;
      }

      const response = await client.models.generateContent({
        model: "gemini-3.5-flash",
        contents,
        config: {
          systemInstruction: dynamicInstruction,
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
