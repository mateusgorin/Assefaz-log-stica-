
import React, { useState, useMemo } from 'react';
import { PackagePlus, ShoppingCart, Hash, CheckCircle2, Warehouse, Loader2, ArrowDownCircle, Eye, X, FileText, Printer, Plus, Trash2, ListChecks, ScanLine } from 'lucide-react';
import { Product, StockStaff, Unit, View, Entry } from '../types';
import InvoiceScanner from './InvoiceScanner';

interface EntryFormProps {
  unit: Unit;
  products: Product[];
  stockStaff: StockStaff[];
  entries: Entry[];
  onAddStock: (data: { items: { productId: string, quantity: number, unitPrice: number }[], staffId: string }) => void;
  onNavigate: (view: View) => void;
  showToast: (message: string, type?: 'success' | 'error') => void;
}

interface BatchItem {
  productId: string;
  quantity: number;
  unitPrice: number;
}

const EntryForm: React.FC<EntryFormProps> = ({ unit, products, stockStaff, entries, onAddStock, onNavigate, showToast }) => {
  const [productId, setProductId] = useState('');
  const [staffId, setStaffId] = useState('');
  const [quantity, setQuantity] = useState<number | string>(1);
  const [unitPrice, setUnitPrice] = useState<number | string>('');
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, boolean>>({});
  const [showScanner, setShowScanner] = useState(false);
  
  // Novo estado para gerenciar múltiplos itens no lote atual
  const [batchItems, setBatchItems] = useState<BatchItem[]>([]);

  // Cálculo do valor total do lote
  const totalBatchValue = useMemo(() => {
    return batchItems.reduce((acc, item) => acc + (item.quantity * item.unitPrice), 0);
  }, [batchItems]);

  const handleAddExtractedItems = (items: { productId: string, quantity: number, unitPrice: number }[]) => {
    const newBatchItems = [...batchItems];
    
    items.forEach(newItem => {
      // Garantir que os valores são números válidos
      const safeQuantity = Number(newItem.quantity) || 0;
      const safeUnitPrice = Number(newItem.unitPrice) || 0;

      const existingIndex = newBatchItems.findIndex(item => item.productId === newItem.productId);
      if (existingIndex >= 0) {
        newBatchItems[existingIndex].quantity += safeQuantity;
        newBatchItems[existingIndex].unitPrice = safeUnitPrice;
      } else {
        newBatchItems.push({
          productId: newItem.productId,
          quantity: safeQuantity,
          unitPrice: safeUnitPrice
        });
      }
    });
    
    setBatchItems(newBatchItems);
    showToast(`${items.length} itens importados da nota fiscal com sucesso!`, "success");
  };

  const handleAddItem = () => {
    const numQuantity = Number(quantity);
    const numPrice = Number(unitPrice);
    if (!productId || numQuantity <= 0 || isNaN(numPrice) || numPrice < 0) {
      setErrors(prev => ({ ...prev, product: !productId, quantity: numQuantity <= 0, price: isNaN(numPrice) || numPrice < 0 }));
      return;
    }
    
    // Verificar se o produto já está no lote
    const existingIndex = batchItems.findIndex(item => item.productId === productId);
    if (existingIndex >= 0) {
      const newItems = [...batchItems];
      newItems[existingIndex].quantity += numQuantity;
      // Mantemos o preço anterior ou atualizamos? O usuário disse que o valor altera muito.
      // Vou atualizar para o preço mais recente inserido.
      newItems[existingIndex].unitPrice = numPrice;
      setBatchItems(newItems);
    } else {
      setBatchItems([...batchItems, { productId, quantity: numQuantity, unitPrice: numPrice }]);
    }

    setProductId('');
    setQuantity(1);
    setUnitPrice('');
    setErrors(prev => ({ ...prev, product: false, quantity: false, price: false, items: false }));
  };

  const handleRemoveItem = (index: number) => {
    setBatchItems(batchItems.filter((_, i) => i !== index));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const newErrors = {
      staff: !staffId,
      items: batchItems.length === 0
    };

    setErrors(newErrors);

    if (Object.values(newErrors).some(err => err)) {
      if (newErrors.items) showToast("Adicione pelo menos um item ao lote antes de confirmar.", "error");
      return;
    }

    setLoading(true);

    setTimeout(() => {
      onAddStock({
        items: batchItems,
        staffId
      });
      setLoading(false);
      onNavigate(View.HISTORY);
    }, 500);
  };

  const theme = {
    primaryFocus: 'focus:border-emerald-500',
    primaryButton: 'bg-emerald-600 hover:bg-emerald-700',
    accentText: 'text-emerald-600',
    lightBg: 'bg-emerald-50',
    border: 'border-emerald-600'
  };

  const inputClass = (err?: boolean) => `w-full bg-[#F8FAFC] border ${err ? 'border-red-500 bg-red-50' : 'border-slate-200'} rounded-none px-4 py-3.5 text-[12px] font-normal outline-none transition-all ${theme.primaryFocus}`;
  const labelClass = (err?: boolean) => `text-[11px] font-semibold uppercase tracking-widest mb-2 flex items-center gap-2 ${err ? 'text-red-600' : 'text-slate-500'}`;

  const getProduct = (id: string) => products.find(p => p.id === id);
  const getStaff = (id: string) => stockStaff.find(s => s.id === id);

  return (
    <div className="space-y-10 pb-20 animate-in fade-in duration-500">
      <header className="border-b border-slate-200 pb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-[20px] font-semibold text-[#14213D] uppercase tracking-tighter">Entrada de Insumos</h1>
          <p className="text-[12px] text-slate-500 mt-1 uppercase tracking-[0.2em] font-normal">Registro de Reabastecimento Múltiplo — {unit.toUpperCase()}</p>
        </div>
        <button 
          onClick={() => setShowScanner(true)}
          className="flex items-center gap-3 bg-amber-500 text-white px-6 py-3 text-[12px] font-bold uppercase tracking-widest hover:bg-amber-600 transition-all shadow-md hover:shadow-lg"
        >
          <ScanLine className="w-5 h-5" /> Importar Nota Fiscal
        </button>
      </header>

      {showScanner && (
        <InvoiceScanner 
          products={products}
          onClose={() => setShowScanner(false)}
          onItemsExtracted={handleAddExtractedItems}
          showToast={showToast}
        />
      )}

      <div className="max-w-5xl mx-auto space-y-12">
        {/* FORMULÁRIO DE REGISTRO EM LOTE */}
        <section className="flex flex-col gap-10">
          <div className="space-y-6">
            <div className="flex items-center gap-2 mb-2">
              <ArrowDownCircle className="w-4 h-4 text-emerald-600" />
              <h2 className="text-[16px] font-semibold uppercase tracking-widest text-slate-700">Montar Lote de Recebimento</h2>
            </div>
            
            <div className="bg-white border border-slate-200 p-6 sm:p-8 shadow-sm space-y-6">
              <div className="grid grid-cols-1 sm:grid-cols-6 gap-4 items-end">
                <div className="sm:col-span-2 space-y-1">
                  <label className={labelClass(errors.product)}>Insumo / Material</label>
                  <select value={productId} onChange={(e) => setProductId(e.target.value)} className={inputClass(errors.product)}>
                    <option value="">Selecione...</option>
                    {products.filter(p => p.active !== false).sort((a,b) => a.name.localeCompare(b.name)).map(p => (
                      <option key={p.id} value={p.id}>{p.name.toUpperCase()}</option>
                    ))}
                  </select>
                </div>
                <div className="space-y-1">
                  <label className={labelClass(errors.quantity)}>Qtd</label>
                  <input 
                    type="number" 
                    min="1" 
                    value={quantity} 
                    onChange={(e) => {
                      const val = e.target.value;
                      setQuantity(val === '' ? '' : Number(val));
                    }} 
                    className={inputClass(errors.quantity)} 
                  />
                </div>
                <div className="sm:col-span-2 space-y-1">
                  <label className={labelClass(errors.price)}>Valor Unitário (R$)</label>
                  <input 
                    type="number" 
                    step="0.01"
                    min="0"
                    placeholder="0,00"
                    value={unitPrice} 
                    onChange={(e) => {
                      const val = e.target.value;
                      setUnitPrice(val === '' ? '' : Number(val));
                    }} 
                    className={inputClass(errors.price)} 
                  />
                </div>
                <button 
                  type="button"
                  onClick={handleAddItem}
                  className="bg-slate-800 text-white py-3.5 px-4 flex items-center justify-center gap-2 text-[12px] font-semibold uppercase tracking-widest hover:bg-black transition-all"
                >
                  <Plus className="w-4 h-4" /> Adicionar
                </button>
              </div>

              {/* LISTA TEMPORÁRIA DO LOTE */}
              <div className="border border-slate-100">
                <div className="bg-slate-50 px-4 py-2 border-b border-slate-100 flex items-center gap-2">
                  <ListChecks className="w-3 h-3 text-slate-400" />
                  <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-widest">Itens no Lote Atual</span>
                </div>
                <div className="min-h-[150px] max-h-[300px] overflow-y-auto custom-scrollbar">
                  {batchItems.length === 0 ? (
                    <div className="h-full flex flex-col items-center justify-center p-8 text-center opacity-30">
                      <ShoppingCart className="w-8 h-8 mb-2" />
                      <p className="text-[12px] uppercase font-semibold tracking-widest">Lote Vazio</p>
                    </div>
                  ) : (
                    <table className="w-full text-left border-collapse">
                      <thead className="bg-slate-100/50 border-b border-slate-100">
                        <tr>
                          <th className="px-4 py-2 text-[10px] font-bold uppercase tracking-widest text-slate-500">Item</th>
                          <th className="px-4 py-2 text-[10px] font-bold uppercase tracking-widest text-slate-500 text-right">Unitário</th>
                          <th className="px-4 py-2 text-[10px] font-bold uppercase tracking-widest text-slate-500 text-right">Qtd</th>
                          <th className="px-4 py-2 text-[10px] font-bold uppercase tracking-widest text-slate-500 text-right">Total</th>
                          <th className="px-4 py-2 w-10"></th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-50">
                        {batchItems.map((item, idx) => (
                          <tr key={idx} className="hover:bg-slate-50/50">
                            <td className="px-4 py-3 text-[12px] font-semibold text-slate-700 uppercase">{getProduct(item.productId)?.name}</td>
                            <td className="px-4 py-3 text-[12px] font-normal text-slate-500 text-right whitespace-nowrap">R$ {item.unitPrice.toFixed(2)}</td>
                            <td className="px-4 py-3 text-[12px] font-bold text-slate-600 text-right whitespace-nowrap">{item.quantity} {getProduct(item.productId)?.unit}</td>
                            <td className="px-4 py-3 text-[12px] font-bold text-emerald-600 text-right whitespace-nowrap">R$ {(item.quantity * item.unitPrice).toFixed(2)}</td>
                            <td className="px-4 py-3 text-right w-10">
                              <button onClick={() => handleRemoveItem(idx)} className="text-slate-300 hover:text-red-500 p-1">
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                      <tfoot className="bg-slate-50 border-t border-slate-200">
                        <tr>
                          <td colSpan={3} className="px-4 py-4 text-[12px] font-bold text-slate-500 uppercase tracking-widest text-right">Total da Nota:</td>
                          <td className="px-4 py-4 text-[16px] font-black text-emerald-700 text-right whitespace-nowrap">R$ {totalBatchValue.toFixed(2)}</td>
                          <td></td>
                        </tr>
                      </tfoot>
                    </table>
                  )}
                </div>
              </div>
            </div>
          </div>

          <div className="space-y-6">
            <div className="flex items-center gap-2 mb-2">
              <Warehouse className="w-4 h-4 text-emerald-600" />
              <h2 className="text-[16px] font-semibold uppercase tracking-widest text-slate-700">Finalizar Ficha</h2>
            </div>
            
            <form onSubmit={handleSubmit} className="bg-white border border-slate-200 p-6 shadow-sm space-y-6 relative overflow-hidden">
              <div className="space-y-1">
                <label className={labelClass(errors.staff)}>Operador Responsável</label>
                <select value={staffId} onChange={(e) => setStaffId(e.target.value)} className={inputClass(errors.staff)} disabled={loading}>
                  <option value="">Selecione...</option>
                  {stockStaff.filter(s => s.active !== false).map(s => <option key={s.id} value={s.id}>{s.name.toUpperCase()}</option>)}
                </select>
              </div>

              <button type="submit" disabled={loading || batchItems.length === 0} className={`w-full py-4 text-white font-semibold uppercase tracking-[0.2em] text-[12px] transition-all flex items-center justify-center gap-3 shadow-lg ${loading || batchItems.length === 0 ? 'bg-slate-400' : theme.primaryButton}`}>
                {loading ? <><Loader2 className="w-4 h-4 animate-spin" /> Gravando...</> : <><PackagePlus className="w-4 h-4" /> Confirmar Lote</>}
              </button>
            </form>
          </div>
        </section>

      </div>
    </div>
  );
};

export default EntryForm;
