import { GoogleGenerativeAI } from "@google/generative-ai";
import { IAM_SYSTEM_INSTRUCTION, EXAM_GEN_PROMPT, SUMMARY_GEN_PROMPT } from "../constants";

// Inicialização estável
const genAI = new GoogleGenerativeAI(import.meta.env.VITE_API_KEY);
const model = genAI.getGenerativeModel({ 
  model: "gemini-2.5-flash", // Modelo mais estável para produção
});

export async function* askIAMStream(userMessage: string, context: string, chatHistory: any[] = []) {
  // Filtra histórico para evitar partes vazias que travam a API
  const history = chatHistory
    .filter(m => m?.parts?.[0]?.text?.trim())
    .map(m => ({
      role: m.role === 'user' ? 'user' : 'model',
      parts: m.parts
    }));

  try {
    const chat = model.startChat({
      history: history,
      generationConfig: {
        temperature: 0.7,
      },
      systemInstruction: IAM_SYSTEM_INSTRUCTION(context),
    });

    const result = await chat.sendMessageStream(userMessage);
    
    for await (const chunk of result.stream) {
      const chunkText = chunk.text();
      if (chunkText) yield chunkText;
    }
  } catch (error) {
    console.error("Erro no stream do Gemini:", error);
    yield "Erro de conexão com o IAM. Por favor, tente novamente.";
  }
}

export async function generateSummary(context: string, topic: string) {
  try {
    const result = await model.generateContent({
      contents: [{ role: 'user', parts: [{ text: SUMMARY_GEN_PROMPT(topic) }] }],
      systemInstruction: IAM_SYSTEM_INSTRUCTION(context),
    });
    return result.response.text();
  } catch (error) {
    return "Erro ao gerar resumo.";
  }
}

export async function generateExam(context: string, topic: string) {
  const randomSeed = Math.random().toString(36).substring(7) + Date.now();
  try {
    const result = await model.generateContent({
      contents: [{ role: 'user', parts: [{ text: EXAM_GEN_PROMPT(topic, randomSeed) }] }],
      generationConfig: {
        responseMimeType: "application/json",
      },
    });
    
    let text = result.response.text().trim();
    if (text.startsWith("```json")) {
      text = text.replace(/^```json/, "").replace(/```$/, "").trim();
    }
    return JSON.parse(text);
  } catch (error) {
    console.error("Erro ao gerar simulado:", error);
    return null;
  }
}
