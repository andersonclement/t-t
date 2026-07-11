
export const medicalCoachSystemInstruction = `
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

export async function chatWithMedicalCoach(message: string, history: { role: 'user' | 'model', parts: { text: string }[] }[] = [], patientProfile?: any, patientOrders?: any[]) {
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
        })),
        patientProfile,
        patientOrders
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
