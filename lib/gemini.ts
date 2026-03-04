import { GoogleGenAI, Type } from "@google/genai";

let aiInstance: GoogleGenAI | null = null;

const getAi = () => {
  if (!aiInstance) {
    // Try to get API key from process.env (standard) or import.meta.env (Vite fallback)
    const apiKey = (typeof process !== 'undefined' && process.env?.GEMINI_API_KEY) 
      || (import.meta as any).env?.VITE_GEMINI_API_KEY 
      || '';
      
    if (!apiKey) {
      console.warn("GEMINI_API_KEY não encontrada nas variáveis de ambiente.");
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
  const model = "gemini-3-flash-preview";
  const ai = getAi();
  
  console.log("Iniciando extração de dados com Gemini...");

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
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            items: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  name: { type: Type.STRING },
                  quantity: { type: Type.NUMBER },
                  unitPrice: { type: Type.NUMBER },
                  totalPrice: { type: Type.NUMBER }
                },
                required: ["name", "quantity", "unitPrice", "totalPrice"]
              }
            },
            totalValue: { type: Type.NUMBER },
            invoiceNumber: { type: Type.STRING },
            date: { type: Type.STRING },
            vendorName: { type: Type.STRING }
          },
          required: ["items", "totalValue"]
        }
      }
    });

    console.log("Resposta recebida do Gemini.");
    const text = response.text;
    
    if (!text) {
      console.error("Resposta do Gemini vazia.");
      throw new Error("A Inteligência Artificial não conseguiu ler os dados da imagem. Tente uma foto mais nítida.");
    }
    
    try {
      return JSON.parse(text) as ExtractedInvoice;
    } catch (parseError) {
      console.error("Erro ao parsear JSON do Gemini:", text);
      throw new Error("Erro ao processar os dados lidos. Tente novamente.");
    }
  } catch (apiError: any) {
    console.error("Erro na API do Gemini:", apiError);
    if (apiError.message?.includes("API key")) {
      throw new Error("Configuração de API inválida. Contate o administrador.");
    }
    throw new Error("A IA demorou muito para responder ou encontrou um erro. Tente novamente com uma imagem menor ou mais nítida.");
  }
}
