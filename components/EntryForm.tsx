
import React, { useState } from 'react';
import { PackagePlus, ShoppingCart, Hash, CheckCircle2, Warehouse, Loader2, ArrowDownCircle } from 'lucide-react';
import { Product, StockStaff, Unit, View, Entry } from '../types';
import SignaturePad from './SignaturePad';

interface EntryFormProps {
  unit: Unit;
  products: Product[];
  stockStaff: StockStaff[];
  entries: Entry[];
  onAddStock: (data: { productId: string, quantity: number, staffId: string, signature: string }) => void;
  onNavigate: (view: View) => void;
}

const EntryForm: React.FC<EntryFormProps> = ({ unit, products, stockStaff, entries, onAddStock, onNavigate }) => {
  const [productId, setProductId] = useState('');
  const [staffId, setStaffId] = useState('');
  const [quantity, setQuantity] = useState(1);
  const [signature, setSignature] = useState('');
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, boolean>>({});

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const newErrors = {
      product: !productId,
      staff: !staffId,
      quantity: quantity <= 0,
      signature: !signature
    };

    setErrors(newErrors);

    if (Object.values(newErrors).some(err => err)) {
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }

    setLoading(true);

    // Simulação de delay para feedback visual
    setTimeout(() => {
      onAddStock({
        productId,
        quantity,
        staffId,
        signature
      });
      setLoading(false);
      setSuccess(true);
      
      // Limpar formulário
      setSignature('');
      setProductId('');
      setStaffId('');
      setQuantity(1);

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

  return (
    <div className="space-y-10 pb-20 animate-in fade-in duration-500">
      <header className="border-b border-slate-200 pb-6">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-[#14213D] uppercase tracking-tighter">Entrada de Insumos</h1>
          <p className="text-[9px] sm:text-[10px] text-slate-500 mt-1 uppercase tracking-[0.2em] font-medium">Registro de Reabastecimento — {unit.toUpperCase()}</p>
        </div>
      </header>

      <div className="max-w-4xl mx-auto space-y-12">
        {/* FORMULÁRIO DE REGISTRO */}
        <section className="space-y-6">
          <div className="flex items-center gap-2 mb-2">
            <ArrowDownCircle className="w-4 h-4 text-emerald-600" />
            <h2 className="text-[11px] font-bold uppercase tracking-widest text-slate-700">Novo Registro de Entrada</h2>
          </div>
          
          <form onSubmit={handleSubmit} className="relative bg-white border border-slate-200 p-6 sm:p-10 shadow-sm space-y-8 overflow-hidden">
            {success && (
              <div className="absolute inset-0 bg-white/95 z-20 flex flex-col items-center justify-center text-center p-6 animate-in fade-in duration-300">
                <div className="w-16 h-16 bg-emerald-50 rounded-full flex items-center justify-center mb-6">
                  <CheckCircle2 className="w-8 h-8 text-emerald-600" />
                </div>
                <h2 className="text-lg font-bold text-slate-800 uppercase tracking-tighter mb-1">Entrada Confirmada</h2>
                <p className="text-[9px] text-slate-500 uppercase tracking-widest">O saldo foi atualizado no sistema.</p>
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2 md:col-span-2">
                <label className={labelClass(errors.product)}>
                  <ShoppingCart className="w-3 h-3" /> Insumo / Material
                </label>
                <select value={productId} onChange={(e) => setProductId(e.target.value)} className={inputClass(errors.product)} disabled={loading}>
                  <option value="">Selecione o item...</option>
                  {products.sort((a,b) => a.name.localeCompare(b.name)).map(p => (
                    <option key={p.id} value={p.id}>{p.name.toUpperCase()} (ATUAL: {p.stock} {p.unit.toUpperCase()})</option>
                  ))}
                </select>
              </div>

              <div className="space-y-2">
                <label className={labelClass(errors.quantity)}>
                  <Hash className="w-3 h-3" /> Quantidade de Entrada
                </label>
                <input type="number" min="1" value={quantity} onChange={(e) => setQuantity(Number(e.target.value))} className={inputClass(errors.quantity)} disabled={loading} />
              </div>

              <div className="space-y-2">
                <label className={labelClass(errors.staff)}>
                  <Warehouse className="w-3 h-3" /> Operador de Recebimento
                </label>
                <select value={staffId} onChange={(e) => setStaffId(e.target.value)} className={inputClass(errors.staff)} disabled={loading}>
                  <option value="">Selecione o operador...</option>
                  {stockStaff.map(s => (
                    <option key={s.id} value={s.id}>{s.name.toUpperCase()}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="pt-6 border-t border-slate-100">
              <div className={`p-5 sm:p-8 border transition-all ${errors.signature ? 'bg-red-50 border-red-200' : 'bg-slate-50 border-slate-200'}`}>
                <SignaturePad 
                  label="Biometria Digital / Assinatura do Operador" 
                  onSave={(val) => { setSignature(val); setErrors(prev => ({...prev, signature: false})); }} 
                  onClear={() => setSignature('')}
                  colorClass="text-emerald-600"
                  error={errors.signature}
                />
              </div>
            </div>

            <div className="flex justify-end pt-4">
              <button type="submit" disabled={loading || success} className={`w-full md:w-auto px-16 py-4 text-white font-bold uppercase tracking-[0.2em] text-[10px] transition-all flex items-center justify-center gap-3 shadow-lg ${loading ? 'bg-slate-400' : theme.primaryButton}`}>
                {loading ? <><Loader2 className="w-4 h-4 animate-spin" /> Gravando...</> : <><PackagePlus className="w-4 h-4" /> Confirmar Entrada</>}
              </button>
            </div>
          </form>
        </section>

        {/* HISTÓRICO DE RECEBIMENTO */}
        <section className="space-y-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <PackagePlus className="w-4 h-4 text-emerald-600" />
              <h2 className="text-[11px] font-bold uppercase tracking-widest text-slate-700">Histórico de Recebimento</h2>
            </div>
            <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">{entries.length} registros encontrados</span>
          </div>

          <div className="bg-white border border-slate-200 overflow-hidden shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200">
                    <th className="px-6 py-4 text-[9px] font-black text-slate-500 uppercase tracking-widest">Data/Hora</th>
                    <th className="px-6 py-4 text-[9px] font-black text-slate-500 uppercase tracking-widest">Insumo</th>
                    <th className="px-6 py-4 text-[9px] font-black text-slate-500 uppercase tracking-widest">Qtd</th>
                    <th className="px-6 py-4 text-[9px] font-black text-slate-500 uppercase tracking-widest">Recebido por</th>
                    <th className="px-6 py-4 text-[9px] font-black text-slate-500 uppercase tracking-widest text-center">Assinatura</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {entries.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="px-6 py-12 text-center">
                        <p className="text-[10px] text-slate-400 uppercase tracking-widest font-bold">Nenhum registro de entrada encontrado.</p>
                      </td>
                    </tr>
                  ) : (
                    entries.slice(0, 10).map((entry) => {
                      const product = products.find(p => p.id === entry.productId);
                      const staff = stockStaff.find(s => s.id === entry.stockStaffId);
                      return (
                        <tr key={entry.id} className="hover:bg-slate-50 transition-colors">
                          <td className="px-6 py-4">
                            <div className="text-[10px] font-bold text-slate-700">{entry.date}</div>
                            <div className="text-[9px] text-slate-400 font-medium">{entry.time}</div>
                          </td>
                          <td className="px-6 py-4">
                            <div className="text-[10px] font-black text-slate-800 uppercase tracking-tight">{product?.name || 'Item Removido'}</div>
                            <div className="text-[8px] text-slate-400 uppercase font-bold">{product?.category}</div>
                          </td>
                          <td className="px-6 py-4">
                            <span className="inline-flex items-center px-2 py-1 bg-emerald-50 text-emerald-700 text-[10px] font-black rounded">
                              +{entry.quantity}
                            </span>
                          </td>
                          <td className="px-6 py-4">
                            <div className="text-[10px] font-bold text-slate-700 uppercase">{staff?.name || 'Desconhecido'}</div>
                          </td>
                          <td className="px-6 py-4">
                            <div className="flex justify-center">
                              {entry.signature ? (
                                <img src={entry.signature} alt="Assinatura" className="h-8 object-contain opacity-80 hover:opacity-100 transition-opacity" />
                              ) : (
                                <span className="text-[8px] text-slate-300 uppercase font-bold italic">Sem assinatura</span>
                              )}
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
            {entries.length > 10 && (
              <div className="p-4 bg-slate-50 border-t border-slate-200 text-center">
                <button 
                  onClick={() => onNavigate(View.HISTORY)}
                  className="text-[9px] font-bold text-emerald-600 uppercase tracking-widest hover:underline"
                >
                  Ver histórico completo no menu lateral
                </button>
              </div>
            )}
          </div>
        </section>
      </div>
    </div>
  );
};

export default EntryForm;
