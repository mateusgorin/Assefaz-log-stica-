import React, { useState, useRef } from 'react';
import { Camera, FileText, Loader2, X, Check, AlertCircle, Upload, Smartphone } from 'lucide-react';
import { extractInvoiceData, ExtractedInvoice, ExtractedInvoiceItem } from '../lib/gemini';
import { Product } from '../types';

interface InvoiceScannerProps {
  products: Product[];
  onItemsExtracted: (items: { productId: string, quantity: number, unitPrice: number }[]) => void;
  onClose: () => void;
  showToast: (message: string, type?: 'success' | 'error') => void;
}

const InvoiceScanner: React.FC<InvoiceScannerProps> = ({ products, onItemsExtracted, onClose, showToast }) => {
  const [loading, setLoading] = useState(false);
  const [loadingTime, setLoadingTime] = useState(0);
  const [extractedData, setExtractedData] = useState<ExtractedInvoice | null>(null);
  const [mappings, setMappings] = useState<Record<number, string>>({}); // index -> productId
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const loadingInterval = useRef<any>(null);

  const startLoading = () => {
    setLoading(true);
    setLoadingTime(0);
    loadingInterval.current = setInterval(() => {
      setLoadingTime(prev => prev + 1);
    }, 1000);
  };

  const stopLoading = () => {
    setLoading(false);
    if (loadingInterval.current) {
      clearInterval(loadingInterval.current);
      loadingInterval.current = null;
    }
  };

  const resizeImage = (base64Str: string): Promise<string> => {
    return new Promise((resolve) => {
      const img = new Image();
      img.src = `data:image/jpeg;base64,${base64Str}`;
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const MAX_WIDTH = 1200;
        const MAX_HEIGHT = 1200;
        let width = img.width;
        let height = img.height;

        if (width > height) {
          if (width > MAX_WIDTH) {
            height *= MAX_WIDTH / width;
            width = MAX_WIDTH;
          }
        } else {
          if (height > MAX_HEIGHT) {
            width *= MAX_HEIGHT / height;
            height = MAX_HEIGHT;
          }
        }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        ctx?.drawImage(img, 0, 0, width, height);
        
        // Compress to JPEG with 0.7 quality
        const resizedBase64 = canvas.toDataURL('image/jpeg', 0.7).split(',')[1];
        resolve(resizedBase64);
      };
    });
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    startLoading();
    setExtractedData(null);
    setMappings({});

    try {
      const reader = new FileReader();
      reader.onload = async () => {
        try {
          let base64 = (reader.result as string).split(',')[1];
          
          // Se for imagem, redimensionar para melhorar performance
          if (file.type.startsWith('image/')) {
            base64 = await resizeImage(base64);
          }

          const data = await extractInvoiceData(base64, file.type.startsWith('image/') ? 'image/jpeg' : file.type);
          
          if (!data || !data.items || data.items.length === 0) {
            throw new Error("Nenhum item encontrado na nota fiscal.");
          }

          setExtractedData(data);
          
          // Tentar mapear automaticamente por nome
          const initialMappings: Record<number, string> = {};
          data.items.forEach((item, index) => {
            const match = products.find(p => 
              p.name.toLowerCase().includes(item.name.toLowerCase()) || 
              item.name.toLowerCase().includes(p.name.toLowerCase())
            );
            if (match) initialMappings[index] = match.id;
          });
          setMappings(initialMappings);
        } catch (error: any) {
          console.error("Erro no processamento da nota:", error);
          showToast(error.message || "Erro ao processar nota fiscal. Verifique a imagem e tente novamente.", "error");
        } finally {
          stopLoading();
        }
      };
      reader.onerror = () => {
        showToast("Erro ao ler arquivo.", "error");
        stopLoading();
      };
      reader.readAsDataURL(file);
    } catch (error) {
      console.error("Erro ao iniciar leitura do arquivo:", error);
      showToast("Erro ao processar nota fiscal. Tente novamente.", "error");
      stopLoading();
    }
  };

  const handleConfirm = () => {
    if (!extractedData) return;

    const itemsToConfirm = extractedData.items
      .map((item, index) => ({
        productId: mappings[index],
        quantity: item.quantity,
        unitPrice: item.unitPrice
      }))
      .filter(item => item.productId);

    if (itemsToConfirm.length === 0) {
      showToast("Selecione os produtos correspondentes no sistema.", "error");
      return;
    }

    onItemsExtracted(itemsToConfirm as { productId: string, quantity: number, unitPrice: number }[]);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[400] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-300">
      <div className="bg-white w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col shadow-2xl rounded-none border border-slate-200">
        {/* Header */}
        <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-emerald-100 rounded-lg">
              <FileText className="w-5 h-5 text-emerald-600" />
            </div>
            <div>
              <h3 className="text-[16px] font-bold uppercase tracking-widest text-[#14213D]">Leitura Automática de NF</h3>
              <p className="text-[11px] text-slate-500 uppercase tracking-wider">IA processando PDF ou Foto</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-slate-200 transition-colors text-slate-400">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-8 custom-scrollbar">
          {!extractedData && !loading && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 py-10">
              <button 
                onClick={() => fileInputRef.current?.click()}
                className="flex flex-col items-center justify-center gap-4 p-10 border-2 border-dashed border-slate-200 hover:border-emerald-500 hover:bg-emerald-50 transition-all group"
              >
                <div className="p-4 bg-slate-100 rounded-full group-hover:bg-emerald-100 transition-colors">
                  <Upload className="w-8 h-8 text-slate-400 group-hover:text-emerald-600" />
                </div>
                <div className="text-center">
                  <span className="block text-[14px] font-bold uppercase tracking-widest text-slate-700">Subir PDF / Arquivo</span>
                  <span className="text-[11px] text-slate-400 uppercase tracking-wider">Selecione o arquivo da nota</span>
                </div>
                <input type="file" ref={fileInputRef} onChange={handleFileChange} accept="application/pdf,image/*" className="hidden" />
              </button>

              <button 
                onClick={() => cameraInputRef.current?.click()}
                className="flex flex-col items-center justify-center gap-4 p-10 border-2 border-dashed border-slate-200 hover:border-blue-500 hover:bg-blue-50 transition-all group"
              >
                <div className="p-4 bg-slate-100 rounded-full group-hover:bg-blue-100 transition-colors">
                  <Camera className="w-8 h-8 text-slate-400 group-hover:text-blue-600" />
                </div>
                <div className="text-center">
                  <span className="block text-[14px] font-bold uppercase tracking-widest text-slate-700">Tirar Foto da Nota</span>
                  <span className="text-[11px] text-slate-400 uppercase tracking-wider">Use a câmera do celular/tablet</span>
                </div>
                <input type="file" ref={cameraInputRef} onChange={handleFileChange} accept="image/*" capture="environment" className="hidden" />
              </button>
            </div>
          )}

          {loading && (
            <div className="flex flex-col items-center justify-center py-20 space-y-4">
              <div className="relative">
                <Loader2 className="w-12 h-12 text-emerald-600 animate-spin" />
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="w-2 h-2 bg-emerald-600 rounded-full animate-ping"></div>
                </div>
              </div>
              <div className="text-center">
                <p className="text-[14px] font-bold uppercase tracking-widest text-slate-700">Processando Nota Fiscal...</p>
                <p className="text-[11px] text-slate-400 uppercase tracking-widest animate-pulse">A Inteligência Artificial está lendo os dados</p>
                
                {loadingTime > 15 && (
                  <div className="mt-4 p-3 bg-amber-50 border border-amber-100 rounded-lg animate-in fade-in slide-in-from-top-2">
                    <p className="text-[10px] text-amber-700 font-bold uppercase tracking-widest leading-tight">
                      Isso está demorando mais que o normal.<br/>
                      Verifique sua conexão ou tente uma foto mais nítida.
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}

          {extractedData && (
            <div className="space-y-6 animate-in slide-in-from-bottom-4 duration-500">
              <div className="bg-emerald-50 border border-emerald-100 p-4 flex items-start gap-3">
                <Check className="w-5 h-5 text-emerald-600 mt-0.5" />
                <div>
                  <p className="text-[13px] font-bold text-emerald-900 uppercase tracking-widest">Leitura Concluída!</p>
                  <p className="text-[12px] text-emerald-800/70">
                    Encontramos {extractedData.items.length} itens na nota de {extractedData.vendorName || 'Fornecedor não identificado'}.
                    Valor Total: <span className="font-bold">R$ {extractedData.totalValue.toFixed(2)}</span>
                  </p>
                </div>
              </div>

              <div className="space-y-4">
                <h4 className="text-[12px] font-bold uppercase tracking-widest text-slate-500 flex items-center gap-2">
                  <AlertCircle className="w-4 h-4" /> Vincular Itens ao Estoque
                </h4>
                
                <div className="border border-slate-200 overflow-hidden">
                  <table className="w-full text-left border-collapse">
                    <thead className="bg-slate-50 border-b border-slate-200">
                      <tr>
                        <th className="px-4 py-3 text-[10px] font-bold uppercase tracking-widest text-slate-400">Item na Nota</th>
                        <th className="px-4 py-3 text-[10px] font-bold uppercase tracking-widest text-slate-400">Qtd / Valor</th>
                        <th className="px-4 py-3 text-[10px] font-bold uppercase tracking-widest text-slate-400">Produto no Sistema</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {extractedData.items.map((item, index) => (
                        <tr key={index} className="hover:bg-slate-50/50 transition-colors">
                          <td className="px-4 py-4">
                            <p className="text-[12px] font-bold text-slate-700 uppercase leading-tight">{item.name}</p>
                          </td>
                          <td className="px-4 py-4">
                            <div className="flex flex-col gap-2">
                              <div className="flex items-center gap-2">
                                <span className="text-[10px] font-bold text-slate-400 uppercase w-8">Qtd:</span>
                                <input 
                                  type="number" 
                                  value={item.quantity}
                                  onChange={(e) => {
                                    const newData = { ...extractedData };
                                    newData.items[index].quantity = Number(e.target.value);
                                    setExtractedData(newData);
                                  }}
                                  className="w-16 text-[11px] font-bold text-emerald-600 border border-slate-200 p-1 outline-none focus:border-emerald-500"
                                />
                              </div>
                              <div className="flex items-center gap-2">
                                <span className="text-[10px] font-bold text-slate-400 uppercase w-8">R$:</span>
                                <input 
                                  type="number" 
                                  step="0.01"
                                  value={item.unitPrice}
                                  onChange={(e) => {
                                    const newData = { ...extractedData };
                                    newData.items[index].unitPrice = Number(e.target.value);
                                    setExtractedData(newData);
                                  }}
                                  className="w-20 text-[11px] text-slate-600 border border-slate-200 p-1 outline-none focus:border-emerald-500"
                                />
                              </div>
                            </div>
                          </td>
                          <td className="px-4 py-4">
                            <select 
                              value={mappings[index] || ''} 
                              onChange={(e) => setMappings(prev => ({ ...prev, [index]: e.target.value }))}
                              className={`w-full text-[11px] p-2 border outline-none transition-all ${mappings[index] ? 'border-emerald-200 bg-emerald-50/30 text-emerald-700' : 'border-slate-200 text-slate-500'}`}
                            >
                              <option value="">Vincular produto...</option>
                              {products.filter(p => p.active !== false).sort((a,b) => a.name.localeCompare(b.name)).map(p => (
                                <option key={p.id} value={p.id}>{p.name.toUpperCase()}</option>
                              ))}
                            </select>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-slate-100 bg-slate-50 flex items-center justify-between">
          <button 
            onClick={() => { setExtractedData(null); setMappings({}); }}
            className="text-[11px] font-bold uppercase tracking-widest text-slate-400 hover:text-slate-600 transition-colors"
            disabled={loading}
          >
            Limpar / Novo Scan
          </button>
          <div className="flex items-center gap-3">
            <button 
              onClick={onClose}
              className="px-6 py-3 text-[11px] font-bold uppercase tracking-widest text-slate-500 hover:bg-slate-200 transition-all"
            >
              Cancelar
            </button>
            <button 
              onClick={handleConfirm}
              disabled={!extractedData || loading}
              className={`px-8 py-3 text-white text-[11px] font-bold uppercase tracking-widest shadow-lg transition-all flex items-center gap-2 ${!extractedData || loading ? 'bg-slate-300 cursor-not-allowed' : 'bg-[#14213D] hover:bg-black'}`}
            >
              <Check className="w-4 h-4" /> Importar para o Lote
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default InvoiceScanner;
