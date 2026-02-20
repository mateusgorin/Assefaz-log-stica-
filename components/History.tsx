
import React, { useState, useMemo } from 'react';
import { Search, Printer, FileDown, Clock, User, Package, Trash2, Eye, X, CheckCircle2, Warehouse, FileText, ArrowDownCircle, ArrowUpCircle, ListChecks } from 'lucide-react';
import { Movement, Product, Collaborator, StockStaff, Unit, Entry } from '../types';

interface HistoryProps {
  unit: Unit;
  movements: Movement[];
  entries: Entry[];
  products: Product[];
  collaborators: Collaborator[];
  stockStaff: StockStaff[];
  onDelete: (id: string) => void;
  onDeleteEntry: (batchId: string) => void;
}

const History: React.FC<HistoryProps> = ({ unit, movements, entries, products, collaborators, stockStaff, onDelete, onDeleteEntry }) => {
  const [activeTab, setActiveTab] = useState<'outflows' | 'entries'>('outflows');
  const [viewingMovementBatch, setViewingMovementBatch] = useState<Movement[] | null>(null);
  const [viewingBatch, setViewingBatch] = useState<Entry[] | null>(null);
  const [searchTerm, setSearchTerm] = useState('');

  const groupedMovements = useMemo(() => {
    const groups: Record<string, Movement[]> = {};
    movements.filter(m => m.unit === unit).forEach(mov => {
      const key = mov.batchId || mov.id;
      if (!groups[key]) groups[key] = [];
      groups[key].push(mov);
    });

    return Object.values(groups)
      .filter(batch => {
        const search = searchTerm.toLowerCase();
        const colName = collaborators.find(c => c.id === batch[0].collaboratorId)?.name.toLowerCase() || '';
        const hasProduct = batch.some(item => products.find(p => p.id === item.productId)?.name.toLowerCase().includes(search));
        return colName.includes(search) || batch[0].date.includes(search) || hasProduct;
      })
      .sort((a, b) => {
        const dateA = new Date(`${a[0].date.split('/').reverse().join('-')} ${a[0].time}`);
        const dateB = new Date(`${b[0].date.split('/').reverse().join('-')} ${b[0].time}`);
        return dateB.getTime() - dateA.getTime();
      });
  }, [movements, unit, searchTerm, collaborators, products]);

  const groupedEntries = useMemo(() => {
    const groups: Record<string, Entry[]> = {};
    entries.filter(e => e.unit === unit).forEach(entry => {
      const key = entry.batchId || entry.id;
      if (!groups[key]) groups[key] = [];
      groups[key].push(entry);
    });

    return Object.values(groups)
      .filter(batch => {
        const search = searchTerm.toLowerCase();
        const staffName = stockStaff.find(s => s.id === batch[0].stockStaffId)?.name.toLowerCase() || '';
        const hasProduct = batch.some(item => products.find(p => p.id === item.productId)?.name.toLowerCase().includes(search));
        return staffName.includes(search) || batch[0].date.includes(search) || hasProduct;
      })
      .sort((a, b) => {
        const dateA = new Date(`${a[0].date.split('/').reverse().join('-')} ${a[0].time}`);
        const dateB = new Date(`${b[0].date.split('/').reverse().join('-')} ${b[0].time}`);
        return dateB.getTime() - dateA.getTime();
      });
  }, [entries, unit, searchTerm, stockStaff, products]);

  const getCollaborator = (id: string) => collaborators.find(c => c.id === id);
  const getProduct = (id: string) => products.find(p => p.id === id);
  const getStaff = (id: string) => stockStaff.find(s => s.id === id);

  const theme = {
    primaryFocus: unit === 'sede' ? 'focus:border-[#14213D]' : 'focus:border-[#9A4E12]',
    badge: unit === 'sede' ? 'bg-[#14213D]' : 'bg-[#9A4E12]',
    text: unit === 'sede' ? 'text-[#14213D]' : 'text-[#9A4E12]',
    border: unit === 'sede' ? 'border-[#14213D]' : 'border-[#9A4E12]',
    light: unit === 'sede' ? 'bg-[#14213D]/5' : 'bg-[#9A4E12]/5',
  };

  return (
    <div className="space-y-6 sm:space-y-8">
      {/* MODAL DE VISUALIZAÇÃO DE COMPROVANTE DE SAÍDA */}
      {viewingMovementBatch && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6 overflow-y-auto">
          <div className="absolute inset-0 bg-slate-900/80 backdrop-blur-sm" onClick={() => setViewingMovementBatch(null)} />
          <div className={`relative bg-white w-full max-w-2xl shadow-2xl border-t-8 ${theme.border} animate-in zoom-in duration-200 overflow-hidden`}>
            <div className="p-6 sm:p-8 border-b border-slate-100 flex justify-between items-start">
              <div className="flex items-center gap-3">
                <div className={`w-12 h-12 rounded-full ${theme.light} ${theme.text} flex items-center justify-center`}>
                  <FileText className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-lg font-black text-slate-800 uppercase tracking-tighter">Comprovante de Saída</h3>
                  <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">ID: {viewingMovementBatch[0].batchId || viewingMovementBatch[0].id}</p>
                </div>
              </div>
              <button onClick={() => setViewingMovementBatch(null)} className="p-2 hover:bg-slate-100 text-slate-300 hover:text-slate-600 transition-all rounded-full">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 sm:p-8 space-y-8">
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-6">
                <div>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Solicitante</p>
                  <p className="text-xs font-black text-slate-700 uppercase">{getCollaborator(viewingMovementBatch[0].collaboratorId)?.name || 'N/A'}</p>
                  <p className="text-[10px] text-slate-400 uppercase font-medium">{getCollaborator(viewingMovementBatch[0].collaboratorId)?.department || 'N/A'}</p>
                </div>
                <div>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Unidade / Data</p>
                  <p className="text-xs font-black text-slate-700 uppercase">{viewingMovementBatch[0].unit.toUpperCase()}</p>
                  <p className="text-[10px] text-slate-400 uppercase font-medium">{viewingMovementBatch[0].date} às {viewingMovementBatch[0].time}</p>
                </div>
                <div className="text-right">
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Responsável</p>
                  <p className="text-xs font-black text-slate-700 uppercase">{getStaff(viewingMovementBatch[0].stockStaffId)?.name || 'N/A'}</p>
                </div>
              </div>

              <div className="border border-slate-100">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-100">
                      <th className="px-4 py-2 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Item Retirado</th>
                      <th className="px-4 py-2 text-[10px] font-bold text-slate-400 uppercase tracking-widest text-right">Quantidade</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50">
                    {viewingMovementBatch.map((item, idx) => (
                      <tr key={idx}>
                        <td className="px-4 py-3 text-xs font-bold text-slate-700 uppercase">{getProduct(item.productId)?.name || 'N/A'}</td>
                        <td className="px-4 py-3 text-xs font-black text-slate-900 text-right">{item.quantity} {getProduct(item.productId)?.unit || 'UN'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="bg-slate-50 border border-slate-100 p-4">
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-3 text-center">Assinatura do Retirante</p>
                  <div className="bg-white border border-slate-100 h-24 flex items-center justify-center">
                    {viewingMovementBatch[0].signatureWithdrawer ? (
                      <img src={viewingMovementBatch[0].signatureWithdrawer} alt="Assinatura Retirante" className="max-h-full max-w-full mix-blend-multiply" />
                    ) : (
                      <span className="text-[10px] text-slate-300 uppercase font-bold">Sem assinatura</span>
                    )}
                  </div>
                </div>
                <div className="bg-slate-50 border border-slate-100 p-4">
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-3 text-center">Assinatura do Entregador</p>
                  <div className="bg-white border border-slate-100 h-24 flex items-center justify-center">
                    {viewingMovementBatch[0].signatureDeliverer ? (
                      <img src={viewingMovementBatch[0].signatureDeliverer} alt="Assinatura Entregador" className="max-h-full max-w-full mix-blend-multiply" />
                    ) : (
                      <span className="text-[10px] text-slate-300 uppercase font-bold">Sem assinatura</span>
                    )}
                  </div>
                </div>
              </div>
            </div>

            <div className="p-6 bg-slate-50 border-t border-slate-100 flex flex-col sm:flex-row gap-3">
              <button onClick={() => window.print()} className={`flex-1 flex items-center justify-center gap-2 py-3 ${theme.badge} text-white text-xs font-bold uppercase tracking-widest shadow-lg shadow-black/10 hover:opacity-90 transition-all`}>
                <Printer className="w-3.5 h-3.5" /> Imprimir
              </button>
              <button onClick={() => setViewingMovementBatch(null)} className="flex-1 py-3 bg-white border border-slate-200 text-slate-400 text-xs font-bold uppercase tracking-widest hover:bg-slate-100 transition-all">
                Fechar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL DE VISUALIZAÇÃO DE FICHA DE ENTRADA */}
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
                  <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Lote: {viewingBatch[0].batchId || viewingBatch[0].id}</p>
                </div>
              </div>
              <button onClick={() => setViewingBatch(null)} className="p-2 hover:bg-slate-100 text-slate-300 hover:text-slate-600 transition-all rounded-full">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 sm:p-8 space-y-8">
              <div className="grid grid-cols-2 gap-6">
                <div>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Operador Responsável</p>
                  <p className="text-xs font-black text-slate-700 uppercase">{getStaff(viewingBatch[0].stockStaffId)?.name || 'N/A'}</p>
                </div>
                <div className="text-right">
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Unidade / Data / Hora</p>
                  <p className="text-xs font-black text-slate-700 uppercase">{viewingBatch[0].unit.toUpperCase()}</p>
                  <p className="text-[10px] text-slate-400 uppercase font-medium">{viewingBatch[0].date} às {viewingBatch[0].time}</p>
                </div>
              </div>

              <div className="border border-slate-100">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-100">
                      <th className="px-4 py-2 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Item Recebido</th>
                      <th className="px-4 py-2 text-[10px] font-bold text-slate-400 uppercase tracking-widest text-right">Quantidade</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50">
                    {viewingBatch.map((item, idx) => (
                      <tr key={idx}>
                        <td className="px-4 py-3 text-xs font-bold text-slate-700 uppercase">{getProduct(item.productId)?.name || 'N/A'}</td>
                        <td className="px-4 py-3 text-xs font-black text-emerald-600 text-right">+{item.quantity} {getProduct(item.productId)?.unit || 'UN'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="bg-slate-50 border border-slate-100 p-6">
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-4 text-center">Assinatura do Operador</p>
                <div className="bg-white border border-slate-100 h-32 flex items-center justify-center">
                  {viewingBatch[0].signature ? (
                    <img src={viewingBatch[0].signature} alt="Assinatura" className="max-h-full max-w-full mix-blend-multiply" />
                  ) : (
                    <span className="text-[10px] text-slate-300 uppercase font-bold">Sem assinatura</span>
                  )}
                </div>
              </div>
            </div>

            <div className="p-6 bg-slate-50 border-t border-slate-100 flex flex-col sm:flex-row gap-3">
              <button onClick={() => window.print()} className={`flex-1 flex items-center justify-center gap-2 py-3 bg-emerald-600 text-white text-xs font-bold uppercase tracking-widest shadow-lg shadow-black/10 hover:bg-emerald-700 transition-all`}>
                <Printer className="w-3.5 h-3.5" /> Imprimir
              </button>
              <button onClick={() => setViewingBatch(null)} className="flex-1 py-3 bg-white border border-slate-200 text-slate-400 text-xs font-bold uppercase tracking-widest hover:bg-slate-100 transition-all">
                Fechar
              </button>
            </div>
          </div>
        </div>
      )}

      <header className="flex flex-col lg:flex-row lg:items-end justify-between gap-4 border-b border-slate-200 pb-6">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-[#14213D] uppercase tracking-tighter">Histórico Oficial</h1>
          <p className="text-[10px] sm:text-xs text-slate-500 mt-1 uppercase tracking-[0.2em] font-medium">Registro Cronológico de Movimentações</p>
        </div>
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
          <div className="relative flex-1 sm:flex-none">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-3 h-3" />
            <input 
              type="text" 
              placeholder="PESQUISAR..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className={`pl-9 pr-4 py-2.5 bg-white border border-slate-200 text-xs uppercase font-bold tracking-[0.2em] outline-none ${theme.primaryFocus} w-full sm:w-64 shadow-sm`}
            />
          </div>
        </div>
      </header>

      {/* TABS DE NAVEGAÇÃO */}
      <div className="flex border-b border-slate-200">
        <button 
          onClick={() => setActiveTab('outflows')}
          className={`px-6 py-4 text-xs font-black uppercase tracking-widest transition-all border-b-2 ${activeTab === 'outflows' ? `${theme.border} ${theme.text}` : 'border-transparent text-slate-400 hover:text-slate-600'}`}
        >
          <div className="flex items-center gap-2">
            <ArrowUpCircle className="w-4 h-4" /> Saídas (Consumo)
          </div>
        </button>
        <button 
          onClick={() => setActiveTab('entries')}
          className={`px-6 py-4 text-xs font-black uppercase tracking-widest transition-all border-b-2 ${activeTab === 'entries' ? 'border-emerald-600 text-emerald-600' : 'border-transparent text-slate-400 hover:text-slate-600'}`}
        >
          <div className="flex items-center gap-2">
            <ArrowDownCircle className="w-4 h-4" /> Entradas (Recebimento)
          </div>
        </button>
      </div>

      {activeTab === 'outflows' ? (
        <>
          {/* Desktop Table View - Saídas */}
          <div className="hidden md:block bg-white border border-slate-200 shadow-sm overflow-hidden">
            <div className="overflow-x-auto custom-scrollbar">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200">
                    <th className="px-6 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-[0.3em]">Data/Hora</th>
                    <th className="px-6 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-[0.3em]">Solicitante</th>
                    <th className="px-6 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-[0.3em]">Resumo do Lote</th>
                    <th className="px-6 py-4 text-center text-[10px] font-bold text-slate-400 uppercase tracking-[0.3em]">Itens</th>
                    <th className="px-6 py-4 text-center text-[10px] font-bold text-slate-400 uppercase tracking-[0.3em]">Documento</th>
                    <th className="px-6 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-[0.3em]">Responsável</th>
                    <th className="px-6 py-4 text-right text-[10px] font-bold text-slate-400 uppercase tracking-[0.3em]">Remover</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {groupedMovements.length > 0 ? (
                    groupedMovements.map((batch, idx) => {
                      const collaborator = getCollaborator(batch[0].collaboratorId);
                      const firstProduct = getProduct(batch[0].productId);
                      const batchId = batch[0].batchId || batch[0].id;
                      return (
                        <tr key={idx} className="hover:bg-slate-50/50 transition-colors">
                          <td className="px-6 py-4 whitespace-nowrap">
                            <p className="text-xs font-bold text-slate-700">{batch[0].date}</p>
                            <p className="text-[10px] text-slate-400 tracking-tighter">{batch[0].time}</p>
                          </td>
                          <td className="px-6 py-4 text-xs font-bold text-slate-600 uppercase">
                            {collaborator?.name || 'Solicitante'}
                          </td>
                          <td className="px-6 py-4 text-xs text-slate-700 font-medium uppercase">
                            {firstProduct?.name || 'Item'} {batch.length > 1 ? `e mais ${batch.length - 1}...` : ''}
                          </td>
                          <td className="px-6 py-4 text-center">
                            <span className="inline-flex items-center px-2 py-1 bg-slate-100 text-slate-700 text-xs font-black rounded">
                              {batch.length}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-center">
                            <button onClick={() => setViewingMovementBatch(batch)} className={`inline-flex items-center gap-2 px-3 py-1.5 ${theme.light} ${theme.text} hover:bg-slate-200 transition-all text-xs font-bold uppercase tracking-widest`}>
                              <Eye className="w-3.5 h-3.5" /> Ver DOC
                            </button>
                          </td>
                          <td className="px-6 py-4 text-xs text-slate-500 uppercase">
                            {getStaff(batch[0].stockStaffId)?.name || 'Responsável'}
                          </td>
                          <td className="px-6 py-4 text-right">
                            <button onClick={() => onDelete(batchId)} className="p-2 text-slate-300 hover:text-red-500 hover:bg-red-50 transition-all rounded-full">
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </td>
                        </tr>
                      );
                    })
                  ) : (
                    <tr>
                      <td colSpan={7} className="px-6 py-20 text-center text-xs uppercase font-bold tracking-[0.3em] text-slate-300">Nenhum registro localizado</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Mobile Card View - Saídas */}
          <div className="md:hidden space-y-4">
            {groupedMovements.map((batch, idx) => {
              const collaborator = getCollaborator(batch[0].collaboratorId);
              const firstProduct = getProduct(batch[0].productId);
              const batchId = batch[0].batchId || batch[0].id;
              return (
                <div key={idx} className="bg-white border border-slate-200 shadow-sm relative overflow-hidden group">
                  <div className="absolute top-2 right-2">
                    <button onClick={() => onDelete(batchId)} className="p-3 text-slate-300 bg-white border border-slate-100 shadow-sm rounded-full active:bg-red-50 active:text-red-500">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                  <div className="p-5 pb-0">
                    <div className="flex items-center gap-3 border-b border-slate-50 pb-3 mb-4">
                      <div className={`w-10 h-10 ${theme.badge} flex items-center justify-center text-white`}>
                        <Package className="w-5 h-5" />
                      </div>
                      <div className="pr-12">
                        <p className="text-xs font-bold text-slate-800 uppercase leading-none mb-1 truncate">
                          {firstProduct?.name || 'Item'} {batch.length > 1 ? `+${batch.length - 1}` : ''}
                        </p>
                        <p className="text-[10px] text-slate-400 uppercase tracking-tighter font-bold">Comprovante com {batch.length} itens</p>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4 mb-4">
                      <div className="space-y-1">
                        <div className="flex items-center gap-1.5 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                          <User className="w-2.5 h-2.5" /> Solicitante
                        </div>
                        <p className="text-xs font-bold text-slate-600 uppercase truncate">{collaborator?.name || 'Solicitante'}</p>
                      </div>
                      <div className="space-y-1 text-right">
                        <div className="flex items-center gap-1.5 text-[10px] font-bold text-slate-400 uppercase tracking-wider justify-end">
                          <Clock className="w-2.5 h-2.5" /> Horário
                        </div>
                        <p className="text-xs font-bold text-slate-600 uppercase">{batch[0].date} - {batch[0].time}</p>
                      </div>
                    </div>
                  </div>
                  <button onClick={() => setViewingMovementBatch(batch)} className={`w-full py-4 ${theme.light} ${theme.text} flex items-center justify-center gap-3 text-xs font-black uppercase tracking-widest border-t border-slate-100 active:bg-slate-200 transition-all`}>
                    <Eye className="w-4 h-4" /> Visualizar Comprovante
                  </button>
                </div>
              );
            })}
          </div>
        </>
      ) : (
        <>
          {/* Desktop Table View - Entradas */}
          <div className="hidden md:block bg-white border border-slate-200 shadow-sm overflow-hidden animate-in fade-in slide-in-from-left-4 duration-300">
            <div className="overflow-x-auto custom-scrollbar">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200">
                    <th className="px-6 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-[0.3em]">Data/Hora</th>
                    <th className="px-6 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-[0.3em]">Resumo do Lote</th>
                    <th className="px-6 py-4 text-center text-[10px] font-bold text-slate-400 uppercase tracking-[0.3em]">Itens</th>
                    <th className="px-6 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-[0.3em]">Operador</th>
                    <th className="px-6 py-4 text-center text-[10px] font-bold text-slate-400 uppercase tracking-[0.3em]">Documento</th>
                    <th className="px-6 py-4 text-right text-[10px] font-bold text-slate-400 uppercase tracking-[0.3em]">Remover</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {groupedEntries.length > 0 ? (
                    groupedEntries.map((batch, idx) => {
                      const staff = getStaff(batch[0].stockStaffId);
                      const firstProduct = getProduct(batch[0].productId);
                      const batchId = batch[0].batchId || batch[0].id;
                      return (
                        <tr key={idx} className="hover:bg-slate-50/50 transition-colors">
                          <td className="px-6 py-4 whitespace-nowrap">
                            <p className="text-xs font-bold text-slate-700">{batch[0].date}</p>
                            <p className="text-[10px] text-slate-400 tracking-tighter">{batch[0].time}</p>
                          </td>
                          <td className="px-6 py-4 text-xs font-bold text-slate-600 uppercase">
                            {firstProduct?.name || 'Item'} {batch.length > 1 ? `e mais ${batch.length - 1}...` : ''}
                          </td>
                          <td className="px-6 py-4 text-center">
                            <span className="inline-flex items-center px-2 py-1 bg-emerald-50 text-emerald-700 text-xs font-black rounded">
                              {batch.length}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-xs text-slate-500 uppercase">
                            {staff?.name || 'Desconhecido'}
                          </td>
                          <td className="px-6 py-4 text-center">
                            <button onClick={() => setViewingBatch(batch)} className="inline-flex items-center gap-2 px-3 py-1.5 bg-emerald-50 text-emerald-600 hover:bg-emerald-100 transition-all text-xs font-bold uppercase tracking-widest">
                              <Eye className="w-3.5 h-3.5" /> Ver Ficha
                            </button>
                          </td>
                          <td className="px-6 py-4 text-right">
                            <button onClick={() => onDeleteEntry(batchId)} className="p-2 text-slate-300 hover:text-red-500 hover:bg-red-50 transition-all rounded-full">
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </td>
                        </tr>
                      );
                    })
                  ) : (
                    <tr>
                      <td colSpan={6} className="px-6 py-20 text-center text-xs uppercase font-bold tracking-[0.3em] text-slate-300">Nenhum lote localizado</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Mobile Card View - Entradas */}
          <div className="md:hidden space-y-4 animate-in fade-in slide-in-from-left-4 duration-300">
            {groupedEntries.map((batch, idx) => {
              const staff = getStaff(batch[0].stockStaffId);
              const firstProduct = getProduct(batch[0].productId);
              const batchId = batch[0].batchId || batch[0].id;
              return (
                <div key={idx} className="bg-white border border-slate-200 shadow-sm relative overflow-hidden group">
                  <div className="absolute top-2 right-2">
                     <button onClick={() => onDeleteEntry(batchId)} className="p-3 text-slate-300 bg-white border border-slate-100 shadow-sm rounded-full active:bg-red-50 active:text-red-500">
                        <Trash2 className="w-4 h-4" />
                     </button>
                  </div>
                  <div className="p-5 pb-0">
                    <div className="flex items-center gap-3 border-b border-slate-50 pb-3 mb-4">
                      <div className="w-10 h-10 bg-emerald-600 flex items-center justify-center text-white">
                        <ListChecks className="w-5 h-5" />
                      </div>
                      <div className="pr-12">
                        <p className="text-xs font-bold text-slate-800 uppercase leading-none mb-1 truncate">
                          {firstProduct?.name || 'Item'} {batch.length > 1 ? `+${batch.length - 1}` : ''}
                        </p>
                        <p className="text-[10px] text-emerald-600 uppercase tracking-tighter font-bold">Ficha com {batch.length} itens</p>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4 mb-4">
                      <div className="space-y-1">
                        <div className="flex items-center gap-1.5 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                          <Warehouse className="w-2.5 h-2.5" /> Operador
                        </div>
                        <p className="text-xs font-bold text-slate-600 uppercase truncate">{staff?.name || 'Desconhecido'}</p>
                      </div>
                      <div className="space-y-1 text-right">
                        <div className="flex items-center gap-1.5 text-[10px] font-bold text-slate-400 uppercase tracking-wider justify-end">
                          <Clock className="w-2.5 h-2.5" /> Horário
                        </div>
                        <p className="text-xs font-bold text-slate-600 uppercase">{batch[0].date} - {batch[0].time}</p>
                      </div>
                    </div>
                  </div>
                  <button onClick={() => setViewingBatch(batch)} className="w-full py-4 bg-emerald-50 text-emerald-600 flex items-center justify-center gap-3 text-xs font-black uppercase tracking-widest border-t border-emerald-100 active:bg-emerald-100 transition-all">
                    <Eye className="w-4 h-4" /> Visualizar Ficha Completa
                  </button>
                </div>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
};

export default History;
