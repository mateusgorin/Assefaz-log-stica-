
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
  const [quantity, setQuantity] = useState(1);
  const [signature, setSignature] = useState('');
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, boolean>>({});
  const [viewingBatch, setViewingBatch] = useState<Entry[] | null>(null);
  
  // Novo estado para gerenciar múltiplos itens no lote atual
  const [batchItems, setBatchItems] = useState<BatchItem[]>([]);

  // Agrupar entradas por lote para o histórico
  const groupedEntries = useMemo(() => {
    const groups: Record<string, Entry[]> = {};
    entries.forEach(entry => {
      const key = entry.batchId || entry.id;
      if (!groups[key]) groups[key] = [];
      groups[key].push(entry);
    });
    return Object.values(groups).sort((a, b) => {
      const dateA = new Date(`${a[0].date.split('/').reverse().join('-')} ${a[0].time}`);
      const dateB = new Date(`${b[0].date.split('/').reverse().join('-')} ${b[0].time}`);
      return dateB.getTime() - dateA.getTime();
    });
  }, [entries]);

  const handleAddItem = () => {
    if (!productId || quantity <= 0) {
      setErrors(prev => ({ ...prev, product: !productId, quantity: quantity <= 0 }));
      return;
    }
    
    // Verificar se o produto já está no lote
    const existingIndex = batchItems.findIndex(item => item.productId === productId);
    if (existingIndex >= 0) {
      const newItems = [...batchItems];
      newItems[existingIndex].quantity += quantity;
      setBatchItems(newItems);
    } else {
      setBatchItems([...batchItems, { productId, quantity }]);
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
      {/* MODAL DE VISUALIZAÇÃO DE COMPROVANTE DE ENTRADA (LOTE) */}
      {viewingBatch && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6 overflow-y-auto">
          <div className="absolute inset-0 bg-slate-900/80 backdrop-blur-sm" onClick={() => setViewingBatch(null)} />
          <div className={`relative bg-white w-full max-w-2xl shadow-2xl border-t-8 border-emerald-600 animate-in zoom-in duration-200 overflow-hidden`}>
            <div className="p-6 sm:p-8 border-b border-slate-100 flex justify-between items-start">
              <div className="flex items-center gap-3">
                <div className={`w-12 h-12 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center`}>
                  <FileText className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-lg font-black text-slate-800 uppercase tracking-tighter">Ficha de Recebimento</h3>
                  <p className="text-[9px] text-slate-400 font-bold uppercase tracking-widest">Lote: {viewingBatch[0].batchId || viewingBatch[0].id}</p>
                </div>
              </div>
              <button onClick={() => setViewingBatch(null)} className="p-2 hover:bg-slate-100 text-slate-300 hover:text-slate-600 transition-all rounded-full">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 sm:p-8 space-y-8">
              <div className="grid grid-cols-2 gap-6">
                <div>
                  <p className="text-[8px] font-bold text-slate-400 uppercase tracking-widest mb-1">Operador Responsável</p>
                  <p className="text-[11px] font-black text-slate-700 uppercase">{getStaff(viewingBatch[0].stockStaffId)?.name || 'N/A'}</p>
                </div>
                <div className="text-right">
                  <p className="text-[8px] font-bold text-slate-400 uppercase tracking-widest mb-1">Unidade / Data / Hora</p>
                  <p className="text-[11px] font-black text-slate-700 uppercase">{viewingBatch[0].unit.toUpperCase()}</p>
                  <p className="text-[9px] text-slate-400 uppercase font-medium">{viewingBatch[0].date} às {viewingBatch[0].time}</p>
                </div>
              </div>

              <div className="border border-slate-100">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-100">
                      <th className="px-4 py-2 text-[8px] font-bold text-slate-400 uppercase tracking-widest">Item Recebido</th>
                      <th className="px-4 py-2 text-[8px] font-bold text-slate-400 uppercase tracking-widest text-right">Quantidade</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50">
                    {viewingBatch.map((item, idx) => (
                      <tr key={idx}>
                        <td className="px-4 py-3 text-[10px] font-bold text-slate-700 uppercase">{getProduct(item.productId)?.name || 'N/A'}</td>
                        <td className="px-4 py-3 text-[10px] font-black text-emerald-600 text-right">+{item.quantity} {getProduct(item.productId)?.unit || 'UN'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="bg-slate-50 border border-slate-100 p-6">
                <p className="text-[8px] font-bold text-slate-400 uppercase tracking-widest mb-4 text-center">Assinatura do Operador</p>
                <div className="bg-white border border-slate-100 h-32 flex items-center justify-center">
                  {viewingBatch[0].signature ? (
                    <img src={viewingBatch[0].signature} alt="Assinatura" className="max-h-full max-w-full mix-blend-multiply" />
                  ) : (
                    <span className="text-[9px] text-slate-300 uppercase font-bold">Sem assinatura</span>
                  )}
                </div>
                <p className="text-[8px] text-slate-400 text-center mt-3 uppercase italic">Documento gerado eletronicamente via Sistema Logística Assefaz</p>
              </div>
            </div>

            <div className="p-6 bg-slate-50 border-t border-slate-100 flex flex-col sm:flex-row gap-3">
              <button 
                onClick={() => window.print()} 
                className={`flex-1 flex items-center justify-center gap-2 py-3 bg-emerald-600 text-white text-[10px] font-bold uppercase tracking-widest shadow-lg shadow-black/10 hover:bg-emerald-700 transition-all`}
              >
                <Printer className="w-3.5 h-3.5" /> Imprimir Ficha
              </button>
              <button 
                onClick={() => setViewingBatch(null)} 
                className="flex-1 py-3 bg-white border border-slate-200 text-slate-400 text-[10px] font-bold uppercase tracking-widest hover:bg-slate-100 transition-all"
              >
                Fechar
              </button>
            </div>
          </div>
        </div>
      )}

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
                  <input type="number" min="1" value={quantity} onChange={(e) => setQuantity(Number(e.target.value))} className={inputClass(errors.quantity)} />
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

        {/* HISTÓRICO DE RECEBIMENTO AGRUPADO */}
        <section className="space-y-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <PackagePlus className="w-4 h-4 text-emerald-600" />
              <h2 className="text-[11px] font-bold uppercase tracking-widest text-slate-700">Fichas de Recebimento Recentes</h2>
            </div>
            <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">{groupedEntries.length} fichas encontradas</span>
          </div>

          <div className="bg-white border border-slate-200 overflow-hidden shadow-sm">
            {/* Desktop Table View */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200">
                    <th className="px-6 py-4 text-[9px] font-black text-slate-500 uppercase tracking-widest">Data/Hora</th>
                    <th className="px-6 py-4 text-[9px] font-black text-slate-500 uppercase tracking-widest">Resumo do Lote</th>
                    <th className="px-6 py-4 text-[9px] font-black text-slate-500 uppercase tracking-widest text-center">Itens</th>
                    <th className="px-6 py-4 text-[9px] font-black text-slate-500 uppercase tracking-widest">Operador</th>
                    <th className="px-6 py-4 text-[9px] font-black text-slate-500 uppercase tracking-widest text-center">Documento</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {groupedEntries.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="px-6 py-12 text-center text-[10px] text-slate-400 uppercase font-bold">Nenhum registro encontrado.</td>
                    </tr>
                  ) : (
                    groupedEntries.slice(0, 10).map((batch, idx) => {
                      const staff = stockStaff.find(s => s.id === batch[0].stockStaffId);
                      const firstProduct = products.find(p => p.id === batch[0].productId);
                      return (
                        <tr key={idx} className="hover:bg-slate-50 transition-colors">
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-[10px] font-bold text-slate-700">{batch[0].date}</div>
                            <div className="text-[9px] text-slate-400 font-medium">{batch[0].time}</div>
                          </td>
                          <td className="px-6 py-4">
                            <div className="text-[10px] font-black text-slate-800 uppercase tracking-tight">
                              {firstProduct?.name || 'Item'} {batch.length > 1 ? `e mais ${batch.length - 1}...` : ''}
                            </div>
                          </td>
                          <td className="px-6 py-4 text-center">
                            <span className="inline-flex items-center px-2 py-1 bg-emerald-50 text-emerald-700 text-[10px] font-black rounded">
                              {batch.length}
                            </span>
                          </td>
                          <td className="px-6 py-4">
                            <div className="text-[10px] font-bold text-slate-700 uppercase">{staff?.name || 'Desconhecido'}</div>
                          </td>
                          <td className="px-6 py-4">
                            <div className="flex justify-center">
                              <button 
                                onClick={() => setViewingBatch(batch)}
                                className="inline-flex items-center gap-2 px-3 py-1.5 bg-emerald-50 text-emerald-600 hover:bg-emerald-100 transition-all text-[9px] font-bold uppercase tracking-widest"
                              >
                                <Eye className="w-3.5 h-3.5" /> Ver Ficha
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>

            {/* Mobile Card View */}
            <div className="md:hidden divide-y divide-slate-100">
              {groupedEntries.length === 0 ? (
                <div className="p-10 text-center text-[10px] uppercase font-bold text-slate-300">Nenhum registro localizado</div>
              ) : (
                groupedEntries.slice(0, 10).map((batch, idx) => {
                  const staff = stockStaff.find(s => s.id === batch[0].stockStaffId);
                  const firstProduct = products.find(p => p.id === batch[0].productId);
                  return (
                    <div key={idx} className="bg-white relative overflow-hidden group">
                      <div className="p-5">
                        <div className="flex items-center gap-3 border-b border-slate-50 pb-3 mb-4">
                          <div className="w-10 h-10 bg-emerald-50 flex items-center justify-center text-emerald-600">
                            <ListChecks className="w-5 h-5" />
                          </div>
                          <div>
                            <p className="text-[10px] font-bold text-slate-800 uppercase leading-none mb-1 truncate">
                              {firstProduct?.name || 'Item'} {batch.length > 1 ? `+${batch.length - 1}` : ''}
                            </p>
                            <p className="text-[9px] text-emerald-600 uppercase tracking-tighter font-bold">Ficha com {batch.length} itens</p>
                          </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4 mb-4">
                          <div className="space-y-1">
                            <div className="flex items-center gap-1.5 text-[8px] font-bold text-slate-400 uppercase tracking-wider">
                              <Warehouse className="w-2.5 h-2.5" /> Operador
                            </div>
                            <p className="text-[10px] font-bold text-slate-600 uppercase truncate">{staff?.name || 'Desconhecido'}</p>
                          </div>
                          <div className="space-y-1 text-right">
                            <div className="flex items-center gap-1.5 text-[8px] font-bold text-slate-400 uppercase tracking-wider justify-end">
                              <ArrowDownCircle className="w-2.5 h-2.5" /> Horário
                            </div>
                            <p className="text-[10px] font-bold text-slate-600 uppercase">{batch[0].date} - {batch[0].time}</p>
                          </div>
                        </div>
                      </div>

                      <button 
                        onClick={() => setViewingBatch(batch)} 
                        className="w-full py-4 bg-emerald-50 text-emerald-600 flex items-center justify-center gap-3 text-[10px] font-black uppercase tracking-widest border-t border-emerald-100 active:bg-emerald-100 transition-all"
                      >
                        <Eye className="w-4 h-4" /> Visualizar Ficha Completa
                      </button>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </section>
      </div>
    </div>
  );
};

export default EntryForm;
