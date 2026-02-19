
import React, { useState, useMemo } from 'react';
import { PackagePlus, ShoppingCart, Hash, CheckCircle2, Warehouse, Loader2, ArrowDownCircle, Eye, X, FileText, Printer, Plus, Trash2, ListChecks } from 'lucide-react';
import { Product, StockStaff, Unit, View, Entry } from '../types';
import SignaturePad from './SignaturePad';

interface EntryFormProps {
  unit: Unit;
  products: Product[];
  stockStaff: StockStaff[];
  entries: Entry[];
  onAddStock: (data: { items: { productId: string, quantity: number }[], staffId: string, signature: string }) => void;
  onNavigate: (view: View) => void;
}

interface BatchItem {
  productId: string;
  quantity: number;
}

const EntryForm: React.FC<EntryFormProps> = ({ unit, products, stockStaff, entries, onAddStock, onNavigate }) => {
  const [productId, setProductId] = useState('');
  const [staffId, setStaffId] = useState('');
  const [quantity, setQuantity] = useState<number | string>(1);
  const [signature, setSignature] = useState('');
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, boolean>>({});
  
  // Novo estado para gerenciar múltiplos itens no lote atual
  const [batchItems, setBatchItems] = useState<BatchItem[]>([]);

  const handleAddItem = () => {
    const numQuantity = Number(quantity);
    if (!productId || numQuantity <= 0) {
      setErrors(prev => ({ ...prev, product: !productId, quantity: numQuantity <= 0 }));
      return;
    }
    
    // Verificar se o produto já está no lote
    const existingIndex = batchItems.findIndex(item => item.productId === productId);
    if (existingIndex >= 0) {
      const newItems = [...batchItems];
      newItems[existingIndex].quantity += numQuantity;
      setBatchItems(newItems);
    } else {
      setBatchItems([...batchItems, { productId, quantity: numQuantity }]);
    }

    setProductId('');
    setQuantity(1);
    setErrors(prev => ({ ...prev, product: false, quantity: false, items: false }));
  };

  const handleRemoveItem = (index: number) => {
    setBatchItems(batchItems.filter((_, i) => i !== index));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const newErrors = {
      staff: !staffId,
      signature: !signature,
      items: batchItems.length === 0
    };

    setErrors(newErrors);

    if (Object.values(newErrors).some(err => err)) {
      if (newErrors.items) alert("Adicione pelo menos um item ao lote antes de confirmar.");
      return;
    }

    setLoading(true);

    setTimeout(() => {
      onAddStock({
        items: batchItems,
        staffId,
        signature
      });
      setLoading(false);
      setSuccess(true);
      
      // Limpar formulário
      setSignature('');
      setStaffId('');
      setBatchItems([]);

      setTimeout(() => {
        setSuccess(false);
      }, 2500);
    }, 800);
  };

  const theme = {
    primaryFocus: 'focus:border-emerald-500',
    primaryButton: 'bg-emerald-600 hover:bg-emerald-700',
    accentText: 'text-emerald-600',
    lightBg: 'bg-emerald-50',
    border: 'border-emerald-600'
  };

  const inputClass = (err?: boolean) => `w-full bg-[#F8FAFC] border ${err ? 'border-red-500 bg-red-50' : 'border-slate-200'} rounded-none px-4 py-3.5 text-sm outline-none transition-all ${theme.primaryFocus}`;
  const labelClass = (err?: boolean) => `text-[10px] font-bold uppercase tracking-widest mb-2 flex items-center gap-2 ${err ? 'text-red-600' : 'text-slate-500'}`;

  const getProduct = (id: string) => products.find(p => p.id === id);
  const getStaff = (id: string) => stockStaff.find(s => s.id === id);

  return (
    <div className="space-y-10 pb-20 animate-in fade-in duration-500">
      <header className="border-b border-slate-200 pb-6">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-[#14213D] uppercase tracking-tighter">Entrada de Insumos</h1>
          <p className="text-[9px] sm:text-[10px] text-slate-500 mt-1 uppercase tracking-[0.2em] font-medium">Registro de Reabastecimento Múltiplo — {unit.toUpperCase()}</p>
        </div>
      </header>

      <div className="max-w-5xl mx-auto space-y-12">
        {/* FORMULÁRIO DE REGISTRO EM LOTE */}
        <section className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-6">
            <div className="flex items-center gap-2 mb-2">
              <ArrowDownCircle className="w-4 h-4 text-emerald-600" />
              <h2 className="text-[11px] font-bold uppercase tracking-widest text-slate-700">Montar Lote de Recebimento</h2>
            </div>
            
            <div className="bg-white border border-slate-200 p-6 sm:p-8 shadow-sm space-y-6">
              <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 items-end">
                <div className="sm:col-span-2 space-y-1">
                  <label className={labelClass(errors.product)}>Insumo / Material</label>
                  <select value={productId} onChange={(e) => setProductId(e.target.value)} className={inputClass(errors.product)}>
                    <option value="">Selecione...</option>
                    {products.sort((a,b) => a.name.localeCompare(b.name)).map(p => (
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
                <button 
                  type="button"
                  onClick={handleAddItem}
                  className="bg-slate-800 text-white py-3.5 px-4 flex items-center justify-center gap-2 text-[10px] font-bold uppercase tracking-widest hover:bg-black transition-all"
                >
                  <Plus className="w-4 h-4" /> Adicionar
                </button>
              </div>

              {/* LISTA TEMPORÁRIA DO LOTE */}
              <div className="border border-slate-100">
                <div className="bg-slate-50 px-4 py-2 border-b border-slate-100 flex items-center gap-2">
                  <ListChecks className="w-3 h-3 text-slate-400" />
                  <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Itens no Lote Atual</span>
                </div>
                <div className="min-h-[150px] max-h-[300px] overflow-y-auto custom-scrollbar">
                  {batchItems.length === 0 ? (
                    <div className="h-full flex flex-col items-center justify-center p-8 text-center opacity-30">
                      <ShoppingCart className="w-8 h-8 mb-2" />
                      <p className="text-[10px] uppercase font-bold tracking-widest">Lote Vazio</p>
                    </div>
                  ) : (
                    <table className="w-full text-left border-collapse">
                      <tbody className="divide-y divide-slate-50">
                        {batchItems.map((item, idx) => (
                          <tr key={idx} className="hover:bg-slate-50/50">
                            <td className="px-4 py-3 text-[10px] font-bold text-slate-700 uppercase">{getProduct(item.productId)?.name}</td>
                            <td className="px-4 py-3 text-[10px] font-black text-emerald-600 text-right">{item.quantity} {getProduct(item.productId)?.unit}</td>
                            <td className="px-4 py-3 text-right w-10">
                              <button onClick={() => handleRemoveItem(idx)} className="text-slate-300 hover:text-red-500 p-1">
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  )}
                </div>
              </div>
            </div>
          </div>

          <div className="space-y-6">
            <div className="flex items-center gap-2 mb-2">
              <Warehouse className="w-4 h-4 text-emerald-600" />
              <h2 className="text-[11px] font-bold uppercase tracking-widest text-slate-700">Finalizar Ficha</h2>
            </div>
            
            <form onSubmit={handleSubmit} className="bg-white border border-slate-200 p-6 shadow-sm space-y-6 relative overflow-hidden">
              {success && (
                <div className="absolute inset-0 bg-white/95 z-20 flex flex-col items-center justify-center text-center p-6 animate-in fade-in duration-300">
                  <CheckCircle2 className="w-10 h-10 text-emerald-600 mb-4" />
                  <h2 className="text-sm font-bold text-slate-800 uppercase tracking-tighter">Entrada Registrada</h2>
                </div>
              )}

              <div className="space-y-1">
                <label className={labelClass(errors.staff)}>Operador Responsável</label>
                <select value={staffId} onChange={(e) => setStaffId(e.target.value)} className={inputClass(errors.staff)} disabled={loading}>
                  <option value="">Selecione...</option>
                  {stockStaff.map(s => <option key={s.id} value={s.id}>{s.name.toUpperCase()}</option>)}
                </select>
              </div>

              <div className="space-y-2">
                <label className={labelClass(errors.signature)}>Assinatura Digital</label>
                <div className={`border p-2 transition-all ${errors.signature ? 'bg-red-50 border-red-200' : 'bg-slate-50 border-slate-200'}`}>
                  <SignaturePad 
                    label="Assinatura do Operador"
                    onSave={(val) => { setSignature(val); setErrors(prev => ({...prev, signature: false})); }} 
                    onClear={() => setSignature('')}
                    colorClass="text-emerald-600"
                    error={errors.signature}
                  />
                </div>
              </div>

              <button type="submit" disabled={loading || success || batchItems.length === 0} className={`w-full py-4 text-white font-bold uppercase tracking-[0.2em] text-[10px] transition-all flex items-center justify-center gap-3 shadow-lg ${loading || batchItems.length === 0 ? 'bg-slate-400' : theme.primaryButton}`}>
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
