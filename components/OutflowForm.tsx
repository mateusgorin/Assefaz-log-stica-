import React, { useState, useRef, useEffect } from 'react';
import { User, ShoppingCart, Hash, CheckCircle2, Warehouse, FileText, Loader2, AlertCircle, Plus, Trash2, ListChecks, ArrowUpCircle, Search, ChevronDown, X } from 'lucide-react';
import { Sector, Product, StockStaff, Movement, Unit, View } from '../types';
import SignaturePad from './SignaturePad';

interface OutflowFormProps {
  unit: Unit;
  sectors: Sector[];
  products: Product[];
  stockStaff: StockStaff[];
  onAddMovement: (data: { 
    items: { productId: string, quantity: number }[], 
    sectorId: string, 
    staffId: string, 
    signatureWithdrawer: string, 
    signatureDeliverer: string 
  }) => void;
  onNavigate: (view: View) => void;
}

interface BatchItem {
  productId: string;
  quantity: number;
}

const OutflowForm: React.FC<OutflowFormProps> = ({ unit, sectors, products, stockStaff, onAddMovement, onNavigate }) => {
  const [sectorId, setSectorId] = useState('');
  const [productId, setProductId] = useState('');
  const [staffId, setStaffId] = useState('');
  const [quantity, setQuantity] = useState<number | string>(1);
  const [sigWithdrawer, setSigWithdrawer] = useState('');
  const [sigDeliverer, setSigDeliverer] = useState('');
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);
  
  const [batchItems, setBatchItems] = useState<BatchItem[]>([]);
  const [errors, setErrors] = useState<Record<string, boolean>>({});

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
    
    const newErrors: Record<string, boolean> = {
      sector: !sectorId,
      staff: !staffId,
      sigWithdrawer: !sigWithdrawer,
      sigDeliverer: !sigDeliverer,
      items: batchItems.length === 0
    };

    setErrors(newErrors);

    if (Object.values(newErrors).some(error => error)) {
      if (newErrors.items) alert("Adicione pelo menos um item ao lote antes de confirmar.");
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }

    setLoading(true);

    setTimeout(() => {
      onAddMovement({
        items: batchItems,
        sectorId,
        staffId,
        signatureWithdrawer: sigWithdrawer,
        signatureDeliverer: sigDeliverer
      });

      setLoading(false);
      setSuccess(true);

      setTimeout(() => {
        onNavigate(View.HISTORY);
      }, 1500);
    }, 800);
  };

  const theme = {
    primaryFocus: unit === 'sede' ? 'focus:border-[#14213D]' : 'focus:border-[#9A4E12]',
    primaryButton: unit === 'sede' ? 'bg-[#14213D] hover:bg-[#1F2E4D]' : 'bg-[#9A4E12] hover:bg-[#7C3F0E]',
    primaryText: unit === 'sede' ? 'text-[#14213D]' : 'text-[#9A4E12]',
  };

  const getInputClass = (isError: boolean) => `
    w-full rounded-none px-4 py-3.5 text-[12px] font-normal focus:ring-0 outline-none transition-all placeholder:text-slate-400
    ${isError 
      ? 'bg-red-50 border-red-500 text-red-900' 
      : `bg-[#F8FAFC] border-slate-200 text-slate-700 ${theme.primaryFocus}`
    }
    border
  `;

  const labelClass = "text-[11px] font-semibold uppercase tracking-widest mb-2 flex items-center gap-2 transition-colors";

  const getProduct = (id: string) => products.find(p => p.id === id);

  return (
    <div className="space-y-6 sm:space-y-10 animate-in fade-in duration-500">
      <header className="border-b border-slate-200 pb-6">
        <h1 className="text-[20px] font-semibold text-[#14213D] uppercase tracking-tighter">Requisição de Material</h1>
        <p className="text-[12px] text-slate-500 mt-1 uppercase tracking-[0.2em] font-normal">Registro de Saída Múltipla — {unit.toUpperCase()}</p>
      </header>

      <div className="max-w-5xl mx-auto space-y-12">
        <section className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-6">
            <div className="flex items-center gap-2 mb-2">
              <ArrowUpCircle className="w-4 h-4 text-slate-700" />
              <h2 className="text-[16px] font-semibold uppercase tracking-widest text-slate-700">Montar Lote de Saída</h2>
            </div>
            
            <div className="bg-white border border-slate-200 p-6 sm:p-8 shadow-sm space-y-6">
              <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 items-end">
                <div className="sm:col-span-2 space-y-1">
                  <label className={`${labelClass} ${errors.product ? 'text-red-600' : 'text-slate-500'}`}>Insumo / Material</label>
                  <select 
                    value={productId} 
                    onChange={(e) => {
                      setProductId(e.target.value);
                      setErrors(prev => ({...prev, product: false}));
                    }} 
                    className={getInputClass(!!errors.product)}
                  >
                    <option value="">Selecione...</option>
                    {products.sort((a,b) => a.name.localeCompare(b.name)).map(p => (
                      <option key={p.id} value={p.id}>{p.name.toUpperCase()} ({p.stock})</option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1">
                  <label className={`${labelClass} ${errors.quantity ? 'text-red-600' : 'text-slate-500'}`}>Qtd</label>
                  <input 
                    type="number" 
                    min="1" 
                    value={quantity} 
                    onChange={(e) => {
                      const val = e.target.value;
                      setQuantity(val === '' ? '' : Number(val));
                      setErrors(prev => ({...prev, quantity: false}));
                    }} 
                    className={getInputClass(!!errors.quantity)} 
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
                  <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-widest">Itens no Lote de Saída</span>
                </div>
                <div className="min-h-[150px] max-h-[300px] overflow-y-auto custom-scrollbar">
                  {batchItems.length === 0 ? (
                    <div className="h-full flex flex-col items-center justify-center p-8 text-center opacity-30">
                      <ShoppingCart className="w-8 h-8 mb-2" />
                      <p className="text-[12px] uppercase font-semibold tracking-widest">Lote Vazio</p>
                    </div>
                  ) : (
                    <table className="w-full text-left border-collapse">
                      <tbody className="divide-y divide-slate-50">
                        {batchItems.map((item, idx) => (
                          <tr key={idx} className="hover:bg-slate-50/50">
                            <td className="px-4 py-3 text-[12px] font-semibold text-slate-700 uppercase">{getProduct(item.productId)?.name}</td>
                            <td className="px-4 py-3 text-[12px] font-bold text-slate-900 text-right">{item.quantity} {getProduct(item.productId)?.unit}</td>
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
              <FileText className="w-4 h-4 text-slate-700" />
              <h2 className="text-[16px] font-semibold uppercase tracking-widest text-slate-700">Finalizar Requisição</h2>
            </div>
            
            <form onSubmit={handleSubmit} className="bg-white border border-slate-200 p-6 shadow-sm space-y-6 relative overflow-hidden">
              {success && (
                <div className="absolute inset-0 bg-white/95 z-20 flex flex-col items-center justify-center text-center p-6 animate-in fade-in duration-300">
                  <CheckCircle2 className="w-10 h-10 text-green-600 mb-4" />
                  <h2 className="text-[12px] font-semibold text-slate-800 uppercase tracking-tighter">Saída Registrada</h2>
                </div>
              )}

              <div className="space-y-1">
                <label className={`${labelClass} ${errors.sector ? 'text-red-600' : 'text-slate-500'}`}>Setor Solicitante</label>
                <select 
                  value={sectorId} 
                  onChange={(e) => {
                    setSectorId(e.target.value);
                    setErrors(prev => ({...prev, sector: false}));
                  }} 
                  className={getInputClass(!!errors.sector)}
                  disabled={loading}
                >
                  <option value="">Selecione...</option>
                  {sectors.map(s => (
                    <option key={s.id} value={s.id}>{s.name.toUpperCase()}</option>
                  ))}
                </select>
              </div>

              <div className="space-y-1">
                <label className={`${labelClass} ${errors.staff ? 'text-red-600' : 'text-slate-500'}`}>Responsável pela Entrega</label>
                <select 
                  value={staffId} 
                  onChange={(e) => {
                    setStaffId(e.target.value);
                    setErrors(prev => ({...prev, staff: false}));
                  }} 
                  className={getInputClass(!!errors.staff)}
                  disabled={loading}
                >
                  <option value="">Selecione...</option>
                  {stockStaff.map(s => (
                    <option key={s.id} value={s.id}>{s.name.toUpperCase()}</option>
                  ))}
                </select>
              </div>

              <div className="space-y-4 pt-4 border-t border-slate-50">
                <div className={`p-3 border transition-all ${errors.sigWithdrawer ? 'bg-red-50 border-red-200' : 'bg-slate-50 border-slate-200'}`}>
                  <SignaturePad 
                    label="Assinatura do Retirante" 
                    onSave={(val) => {
                      setSigWithdrawer(val);
                      if (val) setErrors(prev => ({...prev, sigWithdrawer: false}));
                    }} 
                    onClear={() => setSigWithdrawer('')}
                    colorClass={theme.primaryText}
                    error={errors.sigWithdrawer}
                  />
                </div>
                <div className={`p-3 border transition-all ${errors.sigDeliverer ? 'bg-red-50 border-red-200' : 'bg-slate-50 border-slate-200'}`}>
                  <SignaturePad 
                    label="Assinatura do Entregador" 
                    onSave={(val) => {
                      setSigDeliverer(val);
                      if (val) setErrors(prev => ({...prev, sigDeliverer: false}));
                    }} 
                    onClear={() => setSigDeliverer('')}
                    colorClass={theme.primaryText}
                    error={errors.sigDeliverer}
                  />
                </div>
              </div>

              <button type="submit" disabled={loading || success || batchItems.length === 0} className={`w-full py-4 text-white font-semibold uppercase tracking-[0.2em] text-[12px] transition-all flex items-center justify-center gap-3 shadow-lg ${loading || batchItems.length === 0 ? 'bg-slate-400' : theme.primaryButton}`}>
                {loading ? <><Loader2 className="w-4 h-4 animate-spin" /> Gravando...</> : <><FileText className="w-4 h-4" /> Confirmar Saída</>}
              </button>
            </form>
          </div>
        </section>
      </div>
    </div>
  );
};

export default OutflowForm;
