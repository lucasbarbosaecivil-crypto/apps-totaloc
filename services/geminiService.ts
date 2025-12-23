import { GoogleGenAI } from "@google/genai";

export const askArchitect = async (question: string) => {
  // Use process.env.API_KEY directly as per instructions
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  
  const systemInstruction = `
    Você é um Arquiteto de Software Sênior especialista em AppSheet e No-code.
    Seu objetivo é ajudar o usuário a configurar um sistema de locação de equipamentos.
    Foque em:
    1. Fórmulas da AppSheet Expression Language (SELECT, FILTER, LOOKUP, etc).
    2. Estrutura de dados para escalabilidade.
    3. UX/UI dentro das limitações do AppSheet.
    4. Boas práticas de segurança e integridade de dados.
    Mantenha as respostas concisas e técnicas.
  `;

  try {
    // Fix: Updated to gemini-3-pro-preview for complex reasoning tasks as per SDK guidelines.
    const response = await ai.models.generateContent({
      model: 'gemini-3-pro-preview',
      contents: question,
      config: {
        systemInstruction,
        temperature: 0.7,
      }
    });
    // response.text is a property, correct usage
    return response.text;
  } catch (error) {
    console.error("Gemini Error:", error);
    return "Desculpe, tive um problema ao processar sua consulta técnica. Verifique sua conexão ou configurações.";
  }
};