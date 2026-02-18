import React, { useState } from 'react';
import { User, ShoppingCart, Hash, CheckCircle2, Warehouse, FileText, Loader2, AlertCircle } from 'lucide-react';
import { Collaborator, Product, StockStaff, Movement, Unit, View } from '../types';
import SignaturePad from './SignaturePad';

interface OutflowFormProps {
  unit: Unit;
  collaborators: Collaborator[];
  products: Product[];
  stockStaff: StockStaff[];
  onAddMovement: (movement: Omit<Movement, 'id' | 'date' | 'time' | 'unit'>) => void;
  onNavigate: (view: View) => void;
}

const OutflowForm: React.FC<OutflowFormProps> = ({ unit, collaborators, products, stockStaff, onAddMovement, onNavigate }) => {
  const [collaboratorId, setCollaboratorId] = useState('');
  const [productId, setProductId] = useState('');
  const [staffId, setStaffId] = useState('');
  const [quantity, setQuantity] = useState(1);
  const [sigWithdrawer, setSigWithdrawer] = useState('');
  const [sigDeliverer, setSigDeliverer] = useState('');
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);
  
  const [errors, setErrors] = useState<Record<string, boolean>>({});

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const newErrors: Record<string, boolean> = {
      collaborator: !collaboratorId,
      product: !productId,
      staff: !staffId,
      sigWithdrawer: !sigWithdrawer,
      sigDeliverer: !sigDeliverer,
      quantity: quantity <= 0
    };

    setErrors(newErrors);

    const hasErrors = Object.values(newErrors).some(error => error);

    if (hasErrors) {
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }

    setLoading(true);

    setTimeout(() => {
      onAddMovement({
        collaboratorId,
        productId,
        stockStaffId: staffId,
        quantity,
        signatureWithdrawer: sigWithdrawer,
        signatureDeliverer: sigDeliverer
      });

      setLoading(false);
      setSuccess(true);

      setTimeout(() => {
        onNavigate(View.HISTORY);
      }, 1500);
    }, 600);
  };

  const theme = {
    primaryFocus: unit === 'sede' ? 'focus:border-[#14213D]' : 'focus:border-[#9A4E12]',
    primaryButton: unit === 'sede' ? 'bg-[#14213D] hover:bg-[#1F2E4D]' : 'bg-[#9A4E12] hover:bg-[#7C3F0E]',
    primaryText: unit === 'sede' ? 'text-[#14213D]' : 'text-[#9A4E12]',
  };

  const getInputClass = (isError: boolean) => `
    w-full rounded-none px-4 py-3.5 text-sm focus:ring-0 outline-none transition-all placeholder:text-slate-400
    ${isError 
      ? 'bg-red-50 border-red-500 text-red-900' 
      : `bg-[#F8FAFC] border-slate-200 text-slate-700 ${theme.primaryFocus}`
    }
    border
  `;

  const labelClass = "text-[9px] sm:text-[10px] font-bold uppercase tracking-widest mb-2 flex items-center gap-2 transition-colors";

  return (
    <div className="space-y-6 sm:space-y-10">
      <header className="border-b border-slate-200 pb-6">
        <h1 className="text-xl sm:text-2xl font-bold text-[#14213D] uppercase tracking-tighter">Requisição de Material</h1>
        <p className="text-[9px] sm:text-[10px] text-slate-500 mt-1 uppercase tracking-[0.2em] font-medium">Controle de Fluxo de Insumos</p>
      </header>

      <form onSubmit={handleSubmit} className="relative bg-white border border-slate-200 p-5 sm:p-10 space-y-8 sm:space-y-10 shadow-sm">
        {success && (
          <div className="absolute inset-0 bg-white/95 z-20 flex flex-col items-center justify-center text-center p-6 animate-in fade-in duration-300">
            <div className="w-16 h-16 sm:w-20 sm:h-20 bg-green-50 rounded-full flex items-center justify-center mb-6">
              <CheckCircle2 className="w-8 h-8 sm:w-10 sm:h-10 text-green-600" />
            </div>
            <h2 className="text-lg sm:text-xl font-bold text-slate-800 uppercase tracking-tighter mb-2">Registro Confirmado</h2>
            <p className="text-[9px] sm:text-[10px] text-slate-500 uppercase tracking-widest">A movimentação foi gravada com sucesso.</p>
          </div>
        )}

        {Object.values(errors).some(e => e) && (
          <div className="bg-red-50 border-l-4 border-red-500 p-4 mb-6 animate-in slide-in-from-top-2">
            <div className="flex items-center gap-3">
              <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
              <p className="text-[9px] font-bold text-red-700 uppercase tracking-widest leading-relaxed">
                Campos obrigatórios não preenchidos.
              </p>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 sm:gap-8">
          <div className="space-y-2">
            <label className={`${labelClass} ${errors.collaborator ? 'text-red-600' : 'text-slate-500'}`}>
              <User className="w-3 h-3" /> Colaborador Solicitante
            </label>
            <select 
              value={collaboratorId} 
              onChange={(e) => {
                setCollaboratorId(e.target.value);
                setErrors(prev => ({...prev, collaborator: false}));
              }} 
              className={getInputClass(!!errors.collaborator)}
              disabled={loading}
            >
              <option value="">Selecione...</option>
              {collaborators.map(c => (
                <option key={c.id} value={c.id}>{c.name.toUpperCase()} — {c.department.toUpperCase()}</option>
              ))}
            </select>
          </div>

          <div className="space-y-2">
            <label className={`${labelClass} ${errors.staff ? 'text-red-600' : 'text-slate-500'}`}>
              <Warehouse className="w-3 h-3" /> Responsável pela Entrega
            </label>
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

          <div className="space-y-2">
            <label className={`${labelClass} ${errors.product ? 'text-red-600' : 'text-slate-500'}`}>
              <ShoppingCart className="w-3 h-3" /> Item Solicitado
            </label>
            <select 
              value={productId} 
              onChange={(e) => {
                setProductId(e.target.value);
                setErrors(prev => ({...prev, product: false}));
              }} 
              className={getInputClass(!!errors.product)}
              disabled={loading}
            >
              <option value="">Selecione...</option>
              {products.sort((a,b) => a.name.localeCompare(b.name)).map(p => (
                <option key={p.id} value={p.id}>{p.name.toUpperCase()} ({p.unit.toUpperCase()})</option>
              ))}
            </select>
          </div>

          <div className="space-y-2">
            <label className={`${labelClass} ${errors.quantity ? 'text-red-600' : 'text-slate-500'}`}>
              <Hash className="w-3 h-3" /> Quantidade
            </label>
            <input 
              type="number" 
              min="1" 
              value={quantity} 
              onChange={(e) => {
                setQuantity(Number(e.target.value));
                setErrors(prev => ({...prev, quantity: false}));
              }} 
              className={getInputClass(!!errors.quantity)}
              disabled={loading} 
            />
          </div>
        </div>

        <div className="pt-6 border-t border-slate-100 grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div className={`p-4 sm:p-6 border transition-all ${errors.sigWithdrawer ? 'bg-red-50 border-red-200' : 'bg-slate-50 border-slate-200'}`}>
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
          <div className={`p-4 sm:p-6 border transition-all ${errors.sigDeliverer ? 'bg-red-50 border-red-200' : 'bg-slate-50 border-slate-200'}`}>
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

        <div className="flex justify-end pt-4">
          <button
            type="submit"
            disabled={loading || success}
            className={`w-full lg:w-auto px-10 sm:px-16 py-4 text-white font-bold uppercase tracking-[0.2em] text-[10px] transition-all flex items-center justify-center gap-3 ${
              loading ? 'bg-slate-400 cursor-not-allowed' : theme.primaryButton
            }`}
          >
            {loading ? (
              <><Loader2 className="w-4 h-4 animate-spin" /> Processando...</>
            ) : (
              <><FileText className="w-4 h-4" /> Confirmar Operação</>
            )}
          </button>
        </div>
      </form>
    </div>
  );
};

export default OutflowForm;