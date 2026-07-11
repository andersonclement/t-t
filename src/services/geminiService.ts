
export const medicalCoachSystemInstruction = `
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

export async function chatWithMedicalCoach(message: string, history: { role: 'user' | 'model', parts: { text: string }[] }[] = []) {
  try {
    const response = await fetch('/api/ai/chat', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        message,
        history: history.map(h => ({
          role: h.role === 'model' ? 'model' : 'user',
          parts: h.parts
        }))
      })
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Erreur API');
    }

    const data = await response.json();
    return data.text;
  } catch (error) {
    console.error("Gemini Service Error:", error);
    return "Désolé, je rencontre une erreur technique. Veuillez réessayer plus tard.\n\n⚠️ Avertissement : Cette orientation ne remplace pas une consultation médicale. Consultez un professionnel de santé pour un diagnostic précis.";
  }
}
