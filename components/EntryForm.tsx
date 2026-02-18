
import React, { useState } from 'react';
import { PackagePlus, ShoppingCart, Hash, CheckCircle2, Warehouse, Loader2, AlertCircle } from 'lucide-react';
import { Product, StockStaff, Unit, View } from '../types';

interface EntryFormProps {
  unit: Unit;
  products: Product[];
  stockStaff: StockStaff[];
  onAddStock: (productId: string, quantity: number) => void;
  onNavigate: (view: View) => void;
}

const EntryForm: React.FC<EntryFormProps> = ({ unit, products, stockStaff, onAddStock, onNavigate }) => {
  const [productId, setProductId] = useState('');
  const [staffId, setStaffId] = useState('');
  const [quantity, setQuantity] = useState(1);
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!productId || !staffId || quantity <= 0) {
      setError(true);
      return;
    }

    setLoading(true);
    setError(false);

    // Simula processamento
    setTimeout(() => {
      onAddStock(productId, quantity);
      setLoading(false);
      setSuccess(true);

      setTimeout(() => {
        onNavigate(View.STOCK);
      }, 1500);
    }, 600);
  };

  const theme = {
    primaryFocus: 'focus:border-emerald-500',
    primaryButton: 'bg-emerald-600 hover:bg-emerald-700',
    accentText: 'text-emerald-600',
  };

  const inputClass = `w-full bg-[#F8FAFC] border border-slate-200 rounded-none px-4 py-3.5 text-sm outline-none transition-all ${theme.primaryFocus}`;
  const labelClass = "text-[10px] font-bold uppercase tracking-widest mb-2 flex items-center gap-2 text-slate-500";

  return (
    <div className="space-y-10">
      <header className="border-b border-slate-200 pb-6">
        <h1 className="text-2xl font-bold text-[#14213D] uppercase tracking-tighter">Entrada de Insumos</h1>
        <p className="text-[10px] text-slate-500 mt-1 uppercase tracking-[0.2em] font-medium">Reabastecimento Mensal de Estoque</p>
      </header>

      <div className="max-w-3xl mx-auto">
        <form onSubmit={handleSubmit} className="relative bg-white border border-slate-200 p-8 sm:p-12 shadow-sm space-y-8">
          {success && (
            <div className="absolute inset-0 bg-white/95 z-20 flex flex-col items-center justify-center text-center p-6 animate-in fade-in duration-300">
              <div className="w-20 h-20 bg-emerald-50 rounded-full flex items-center justify-center mb-6">
                <CheckCircle2 className="w-10 h-10 text-emerald-600" />
              </div>
              <h2 className="text-xl font-bold text-slate-800 uppercase tracking-tighter mb-2">Estoque Atualizado</h2>
              <p className="text-[10px] text-slate-500 uppercase tracking-widest">O saldo do item foi incrementado com sucesso.</p>
            </div>
          )}

          {error && (
            <div className="bg-red-50 border-l-4 border-red-500 p-4 mb-6 flex items-center gap-3">
              <AlertCircle className="w-4 h-4 text-red-600" />
              <p className="text-[9px] font-bold text-red-700 uppercase tracking-widest">Preencha todos os campos corretamente.</p>
            </div>
          )}

          <div className="grid grid-cols-1 gap-8">
            <div className="space-y-2">
              <label className={labelClass}>
                <ShoppingCart className="w-3 h-3" /> Selecionar Insumo para Reabastecer
              </label>
              <select 
                value={productId} 
                onChange={(e) => setProductId(e.target.value)} 
                className={inputClass}
                disabled={loading}
              >
                <option value="">Selecione o produto...</option>
                {products.sort((a,b) => a.name.localeCompare(b.name)).map(p => (
                  <option key={p.id} value={p.id}>
                    {p.name.toUpperCase()} (SALDO ATUAL: {p.stock} {p.unit.toUpperCase()})
                  </option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="space-y-2">
                <label className={labelClass}>
                  <Hash className="w-3 h-3" /> Quantidade Recebida
                </label>
                <input 
                  type="number" 
                  min="1" 
                  value={quantity} 
                  onChange={(e) => setQuantity(Number(e.target.value))} 
                  className={inputClass}
                  disabled={loading} 
                />
              </div>

              <div className="space-y-2">
                <label className={labelClass}>
                  <Warehouse className="w-3 h-3" /> Responsável pelo Recebimento
                </label>
                <select 
                  value={staffId} 
                  onChange={(e) => setStaffId(e.target.value)} 
                  className={inputClass}
                  disabled={loading}
                >
                  <option value="">Selecione o operador...</option>
                  {stockStaff.map(s => (
                    <option key={s.id} value={s.id}>{s.name.toUpperCase()}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          <div className="pt-6 border-t border-slate-100 flex justify-end">
            <button
              type="submit"
              disabled={loading || success}
              className={`w-full md:w-auto px-12 py-4 text-white font-bold uppercase tracking-[0.2em] text-[10px] transition-all flex items-center justify-center gap-3 ${
                loading ? 'bg-slate-400 cursor-not-allowed' : theme.primaryButton
              }`}
            >
              {loading ? (
                <><Loader2 className="w-4 h-4 animate-spin" /> Processando...</>
              ) : (
                <><PackagePlus className="w-4 h-4" /> Confirmar Entrada</>
              )}
            </button>
          </div>
        </form>
        
        <div className="mt-8 bg-slate-50 border border-slate-200 p-6 flex items-start gap-4">
          <AlertCircle className="w-5 h-5 text-slate-400 shrink-0 mt-0.5" />
          <p className="text-[10px] text-slate-500 uppercase leading-relaxed font-medium">
            Esta operação irá somar a quantidade informada ao estoque atual da unidade. Certifique-se de que o material foi fisicamente conferido antes de confirmar a entrada no sistema.
          </p>
        </div>
      </div>
    </div>
  );
};

export default EntryForm;
