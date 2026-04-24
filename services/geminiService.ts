
import { GoogleGenAI, Type } from "@google/genai";
import { IAM_SYSTEM_INSTRUCTION, EXAM_GEN_PROMPT, SUMMARY_GEN_PROMPT } from "../constants";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

export async function* askIAMStream(userMessage: string, context: string, chatHistory: any[] = []) {
  const historyWithoutEmpty = chatHistory.filter((m: any) => m?.parts?.[0]?.text?.trim()?.length > 0);
  try {
    const responseStream = await ai.models.generateContentStream({
      model: 'gemini-2.5-flash',
      contents: [...historyWithoutEmpty, { role: 'user', parts: [{ text: userMessage }] }],
      config: { systemInstruction: IAM_SYSTEM_INSTRUCTION(context), temperature: 0.7 },
    });
    
    for await (const chunk of responseStream) {
      if (chunk.text) {
        yield chunk.text;
      }
    }
  } catch (error) {
    console.error("Erro no stream do Gemini:", error);
    yield "Erro de conexão com o IAM. Por favor, tente novamente.";
  }
}

// Mantemos as funções não-stream para Resumo e Simulado pois são conteúdos estruturados únicos
export async function generateSummary(context: string, topic: string) {
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: [{ role: 'user', parts: [{ text: SUMMARY_GEN_PROMPT(topic) }] }],
      config: { systemInstruction: IAM_SYSTEM_INSTRUCTION(context) },
    });
    return response.text || "Não foi possível gerar o resumo.";
  } catch (error) {
    return "Erro ao gerar resumo.";
  }
}

export async function generateExam(context: string, topic: string) {
  const randomSeed = Math.random().toString(36).substring(7) + Date.now();
  
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: [{ role: 'user', parts: [{ text: EXAM_GEN_PROMPT(topic, randomSeed) }] }],
      config: { 
        systemInstruction: IAM_SYSTEM_INSTRUCTION(context),
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              id: { type: Type.NUMBER },
              question: { type: Type.STRING },
              options: { type: Type.ARRAY, items: { type: Type.STRING } },
              correctAnswer: { type: Type.NUMBER },
              explanation: { type: Type.STRING },
            },
            required: ["id", "question", "options", "correctAnswer", "explanation"],
          },
        },
        temperature: 1.0,
      },
    });
    
    let text = response.text.trim();
    if (text.startsWith("```json")) {
      text = text.replace(/^```json/, "").replace(/```$/, "").trim();
    } else if (text.startsWith("```")) {
      text = text.replace(/^```/, "").replace(/```$/, "").trim();
    }
    
    return JSON.parse(text);
  } catch (error) {
    console.error("Erro ao gerar simulado:", error);
    return null;
  }
}
