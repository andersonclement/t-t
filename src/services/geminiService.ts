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
