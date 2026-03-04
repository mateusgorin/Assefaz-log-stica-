import { GoogleGenAI, Type } from "@google/genai";

let aiInstance: GoogleGenAI | null = null;

const getAi = () => {
  if (!aiInstance) {
    // Robust API key retrieval for different environments (AI Studio, Vercel, Local)
    const apiKey = (typeof process !== 'undefined' && (process.env?.GEMINI_API_KEY || process.env?.API_KEY)) 
      || (import.meta as any).env?.VITE_GEMINI_API_KEY 
      || (import.meta as any).env?.GEMINI_API_KEY
      || '';
      
    if (!apiKey) {
      console.error("ERRO: GEMINI_API_KEY não encontrada. Certifique-se de configurar VITE_GEMINI_API_KEY no Vercel.");
    }
    
    aiInstance = new GoogleGenAI({ apiKey });
  }
  return aiInstance;
};

export interface ExtractedInvoiceItem {
  name: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
}

export interface ExtractedInvoice {
  items: ExtractedInvoiceItem[];
  totalValue: number;
  invoiceNumber?: string;
  date?: string;
  vendorName?: string;
}

export async function extractInvoiceData(fileBase64: string, mimeType: string): Promise<ExtractedInvoice> {
  const model = "gemini-2.5-flash";
  const ai = getAi();
  
  console.log(`Iniciando extração de dados com ${model}...`);

  const prompt = `Analyze this Invoice image or PDF. 
  Extract all purchased items into a list of objects.
  Each object must have: "name" (simplified product name), "quantity" (number), "unitPrice" (number), and "totalPrice" (number).
  Also extract: "totalValue" (total invoice amount), "invoiceNumber", "date", and "vendorName".
  
  Return ONLY the JSON matching the requested schema.`;

  try {
    const response = await ai.models.generateContent({
      model,
      contents: [
        {
          parts: [
            { text: prompt },
            {
              inlineData: {
                data: fileBase64,
                mimeType: mimeType
              }
            }
          ]
        }
      ],
      config: {
        responseMimeType: "application/json",
      }
    });

    console.log("Resposta recebida do Gemini.");
    const text = response.text;
    
    if (!text) {
      console.error("Resposta do Gemini vazia.");
      throw new Error("A Inteligência Artificial não retornou dados. Tente uma foto mais nítida.");
    }
    
    try {
      // Limpa possíveis marcações de markdown do JSON
      const cleanJson = text.replace(/```json|```/g, "").trim();
      return JSON.parse(cleanJson) as ExtractedInvoice;
    } catch (parseError) {
      console.error("Erro ao parsear JSON do Gemini:", text);
      throw new Error("Erro ao processar os dados lidos pela IA.");
    }
  } catch (apiError: any) {
    console.error("Erro detalhado na API do Gemini:", apiError);
    
    let userMessage = "Erro na IA: ";
    if (apiError.message?.includes("429")) {
      userMessage = "Limite de uso da IA excedido. Aguarde 60 segundos.";
    } else if (apiError.message?.includes("503")) {
      userMessage = "O Google está com alta demanda agora. Tente novamente em alguns segundos.";
    } else if (apiError.message?.includes("403") || apiError.message?.includes("401")) {
      userMessage = "Chave da IA inválida ou sem permissão.";
    } else if (apiError.message?.includes("500")) {
      userMessage = "O servidor do Google falhou. Tente novamente.";
    } else {
      userMessage += apiError.message || "Erro desconhecido";
    }
    
    throw new Error(userMessage);
  }
}
