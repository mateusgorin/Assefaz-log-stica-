import { GoogleGenAI, Type } from "@google/genai";

let aiInstance: GoogleGenAI | null = null;

const getAi = () => {
  if (!aiInstance) {
    // Safe access to process.env for browser environments
    const apiKey = typeof process !== 'undefined' && process.env ? process.env.GEMINI_API_KEY : '';
    aiInstance = new GoogleGenAI({ apiKey: apiKey || '' });
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
  
  const prompt = `Analise esta Nota Fiscal (imagem ou PDF) e extraia os itens comprados. 
  Retorne uma lista de objetos contendo: nome do produto, quantidade, valor unitário e valor total do item.
  Também extraia o valor total da nota, o número da nota, a data e o nome do fornecedor.
  
  Importante: Se o nome do produto for complexo, tente simplificá-lo para o nome comum.
  Retorne APENAS o JSON conforme o esquema solicitado.`;

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

  const text = response.text;
  if (!text) throw new Error("Não foi possível extrair dados da nota.");
  
  return JSON.parse(text) as ExtractedInvoice;
}
