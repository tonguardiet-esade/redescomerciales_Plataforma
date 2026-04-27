
import { GoogleGenAI, Type } from "@google/genai";
import { UserLevel } from "../types";

// --- Role Matcher ---

export const recommendRole = async (
  userDescription: string
): Promise<{ recommendedLevel: number; roleName: string; justification: string } | null> => {
  // Inicializamos dentro de la función para asegurar que process.env.API_KEY esté disponible
  const ai = new GoogleGenAI({apiKey: process.env.API_KEY});
  
  const prompt = `
    Eres un experto consultor de Talento para RedesComerciales.ai. Tu objetivo es recomendar el rol ideal para un candidato basándote en su descripción.
    
    INFORMACIÓN DE LOS ROLES:
    1. PRESCRIPTOR (Nivel 1): Ingresos pasivos, networking.
    2. COLABORADOR (Nivel 2): Comercial con cartera propia.
    3. DELEGADO GESTIÓN (Nivel 3): Franquicia provincial.
    4. OFICINA TÉCNICA (Nivel 4): Redacción experta + venta.
    
    DESCRIPCIÓN DEL USUARIO: "${userDescription}"
    Analiza el perfil y selecciona el nivel (1-4).
  `;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-pro-preview",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            recommendedLevel: { type: Type.INTEGER },
            roleName: { type: Type.STRING },
            justification: { type: Type.STRING },
          },
          required: ["recommendedLevel", "roleName", "justification"],
          propertyOrdering: ["recommendedLevel", "roleName", "justification"],
        },
      },
    });

    return JSON.parse(response.text || "{}");
  } catch (error) {
    console.error("Error recommending role:", error);
    return null;
  }
};

export const evaluateTest = async (answers: Record<string, string>) => {
  const ai = new GoogleGenAI({apiKey: process.env.API_KEY});
  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-pro-preview",
      contents: `Evalúa las respuestas del test: ${JSON.stringify(answers)}`,
      config: {
        responseMimeType: "application/json",
        responseSchema: { 
          type: Type.OBJECT, 
          properties: { 
            score: { type: Type.INTEGER }, 
            passed: { type: Type.BOOLEAN }, 
            feedback: { type: Type.STRING } 
          },
          required: ["score", "passed", "feedback"],
          propertyOrdering: ["score", "passed", "feedback"]
        }
      }
    });
    return JSON.parse(response.text || "{}");
  } catch (error) {
    console.error("Error evaluating test:", error);
    return null;
  }
};

export const evaluateTask = async (taskContent: string, level: UserLevel) => {
  const ai = new GoogleGenAI({apiKey: process.env.API_KEY});
  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-pro-preview",
      contents: `Nivel ${level}. Tarea: ${taskContent}`,
      config: {
        responseMimeType: "application/json",
        responseSchema: { 
          type: Type.OBJECT, 
          properties: { 
            task_score: { type: Type.INTEGER }, 
            task_status: { type: Type.STRING }, 
            feedback: { type: Type.STRING } 
          },
          required: ["task_score", "task_status", "feedback"],
          propertyOrdering: ["task_score", "task_status", "feedback"]
        }
      }
    });
    return JSON.parse(response.text || "{}");
  } catch (error) {
    console.error("Error evaluating task:", error);
    return null;
  }
};

export const getChatResponse = async (message: string, context: string): Promise<string> => {
  const ai = new GoogleGenAI({apiKey: process.env.API_KEY});
  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: `Contexto: ${context}. Usuario: ${message}`,
      config: {
        systemInstruction: "Eres un asistente experto en RedesComerciales.ai. Ayuda al usuario con sus dudas sobre la formación."
      }
    });
    return response.text || "Lo siento, no he podido procesar tu duda.";
  } catch (error) {
    console.error("Error getting chat response:", error);
    return "Error de conexión.";
  }
};
