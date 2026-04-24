import { GoogleGenerativeAI } from "@google/generative-ai";
import { IAM_SYSTEM_INSTRUCTION, EXAM_GEN_PROMPT, SUMMARY_GEN_PROMPT } from "../constants";

// Inicialização estável com a variável de ambiente correta da Vercel
const genAI = new GoogleGenerativeAI(import.meta.env.GEMINI_API_KEY || import.meta.env.VITE_API_KEY);

/**
 * Função auxiliar para criar o modelo com a System Instruction formatada corretamente
 * Isso resolve o erro [400] Invalid value at 'system_instruction'
 */
const getConfiguredModel = (context: string) => {
  return genAI.getGenerativeModel({
    model: "gemini-1.5-flash",
    systemInstruction: {
      parts: [{ text: IAM_SYSTEM_INSTRUCTION(context) }],
    },
  });
};

export async function* askIAMStream(userMessage: string, context: string, chatHistory: any[] = []) {
  const model = getConfiguredModel(context);

  // Filtra histórico para garantir que os papéis e textos estejam no padrão exigido
  const history = chatHistory
    .filter(m => m?.parts?.[0]?.text?.trim())
    .map(m => ({
      role: m.role === 'user' ? 'user' : 'model',
      parts: [{ text: m.parts[0].text }]
    }));

  try {
    const chat = model.startChat({
      history: history,
      generationConfig: {
        temperature: 0.7,
        maxOutputTokens: 2000,
      },
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
  const model = getConfiguredModel(context);
  try {
    const result = await model.generateContent({
      contents: [{ role: 'user', parts: [{ text: SUMMARY_GEN_PROMPT(topic) }] }],
    });
    return result.response.text();
  } catch (error) {
    console.error("Erro ao gerar resumo:", error);
    return "Erro ao gerar resumo.";
  }
}

export async function generateExam(context: string, topic: string) {
  const model = getConfiguredModel(context);
  const randomSeed = Math.random().toString(36).substring(7) + Date.now();
  
  try {
    const result = await model.generateContent({
      contents: [{ role: 'user', parts: [{ text: EXAM_GEN_PROMPT(topic, randomSeed) }] }],
      generationConfig: {
        responseMimeType: "application/json",
        temperature: 1.0,
      },
    });
    
    let text = result.response.text().trim();
    // Limpeza de Markdown caso o modelo retorne blocos de código
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
 
