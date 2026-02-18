
import React, { useState } from 'react';
import { Search, Printer, FileDown, Clock, User, Package, Trash2, Eye, X, CheckCircle2, Warehouse, FileText } from 'lucide-react';
import { Movement, Product, Collaborator, StockStaff, Unit } from '../types';

interface HistoryProps {
  unit: Unit;
  movements: Movement[];
  products: Product[];
  collaborators: Collaborator[];
  stockStaff: StockStaff[];
  onDelete: (id: string) => void;
}

const History: React.FC<HistoryProps> = ({ unit, movements, products, collaborators, stockStaff, onDelete }) => {
  const [viewingMovement, setViewingMovement] = useState<Movement | null>(null);
  const [searchTerm, setSearchTerm] = useState('');

  const unitMovements = movements
    .filter(m => {
      if (m.unit !== unit) return false;
      const search = searchTerm.toLowerCase();
      const colName = collaborators.find(c => c.id === m.collaboratorId)?.name.toLowerCase() || '';
      const prodName = products.find(p => p.id === m.productId)?.name.toLowerCase() || '';
      return colName.includes(search) || prodName.includes(search) || m.date.includes(search);
    })
    .sort((a, b) => {
      const dateA = new Date(`${a.date.split('/').reverse().join('-')} ${a.time}`);
      const dateB = new Date(`${b.date.split('/').reverse().join('-')} ${b.time}`);
      return dateB.getTime() - dateA.getTime();
    });

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
      {/* MODAL DE VISUALIZAÇÃO DE COMPROVANTE */}
      {viewingMovement && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6 overflow-y-auto">
          <div className="absolute inset-0 bg-slate-900/80 backdrop-blur-sm" onClick={() => setViewingMovement(null)} />
          <div className={`relative bg-white w-full max-w-2xl shadow-2xl border-t-8 ${theme.border} animate-in zoom-in duration-200 overflow-hidden`}>
            {/* Cabeçalho do Comprovante */}
            <div className="p-6 sm:p-8 border-b border-slate-100 flex justify-between items-start">
              <div className="flex items-center gap-3">
                <div className={`w-12 h-12 rounded-full ${theme.light} ${theme.text} flex items-center justify-center`}>
                  <FileText className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-lg font-black text-slate-800 uppercase tracking-tighter">Comprovante Digital</h3>
                  <p className="text-[9px] text-slate-400 font-bold uppercase tracking-widest">ID: {viewingMovement.id}</p>
                </div>
              </div>
              <button onClick={() => setViewingMovement(null)} className="p-2 hover:bg-slate-100 text-slate-300 hover:text-slate-600 transition-all rounded-full">
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Detalhes da Movimentação */}
            <div className="p-6 sm:p-8 space-y-8">
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-6">
                <div>
                  <p className="text-[8px] font-bold text-slate-400 uppercase tracking-widest mb-1">Solicitante</p>
                  <p className="text-[11px] font-black text-slate-700 uppercase">{getCollaborator(viewingMovement.collaboratorId)?.name || 'N/A'}</p>
                  <p className="text-[9px] text-slate-400 uppercase font-medium">{getCollaborator(viewingMovement.collaboratorId)?.department || 'N/A'}</p>
                </div>
                <div>
                  <p className="text-[8px] font-bold text-slate-400 uppercase tracking-widest mb-1">Item Retirado</p>
                  <p className="text-[11px] font-black text-slate-700 uppercase">{getProduct(viewingMovement.productId)?.name || 'N/A'}</p>
                  <p className="text-[9px] text-slate-400 uppercase font-medium">{viewingMovement.quantity} {getProduct(viewingMovement.productId)?.unit || 'UN'}</p>
                </div>
                <div>
                  <p className="text-[8px] font-bold text-slate-400 uppercase tracking-widest mb-1">Unidade / Data</p>
                  <p className="text-[11px] font-black text-slate-700 uppercase">{viewingMovement.unit.toUpperCase()}</p>
                  <p className="text-[9px] text-slate-400 uppercase font-medium">{viewingMovement.date} às {viewingMovement.time}</p>
                </div>
              </div>

              {/* Seção de Assinaturas */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="bg-slate-50 border border-slate-100 p-4">
                  <p className="text-[8px] font-bold text-slate-400 uppercase tracking-widest mb-3 text-center">Assinatura do Retirante</p>
                  <div className="bg-white border border-slate-100 h-24 flex items-center justify-center">
                    {viewingMovement.signatureWithdrawer ? (
                      <img src={viewingMovement.signatureWithdrawer} alt="Assinatura Retirante" className="max-h-full max-w-full mix-blend-multiply" />
                    ) : (
                      <span className="text-[9px] text-slate-300 uppercase font-bold">Sem assinatura</span>
                    )}
                  </div>
                  <p className="text-[8px] text-slate-400 text-center mt-2 uppercase italic">Validado via Sistema Assefaz</p>
                </div>
                <div className="bg-slate-50 border border-slate-100 p-4">
                  <p className="text-[8px] font-bold text-slate-400 uppercase tracking-widest mb-3 text-center">Assinatura do Entregador</p>
                  <div className="bg-white border border-slate-100 h-24 flex items-center justify-center">
                    {viewingMovement.signatureDeliverer ? (
                      <img src={viewingMovement.signatureDeliverer} alt="Assinatura Entregador" className="max-h-full max-w-full mix-blend-multiply" />
                    ) : (
                      <span className="text-[9px] text-slate-300 uppercase font-bold">Sem assinatura</span>
                    )}
                  </div>
                  <p className="text-[8px] text-slate-400 text-center mt-2 uppercase font-bold tracking-tighter">RESPONSÁVEL: {getStaff(viewingMovement.stockStaffId)?.name.toUpperCase()}</p>
                </div>
              </div>
            </div>

            <div className="p-6 bg-slate-50 border-t border-slate-100 flex flex-col sm:flex-row gap-3">
              <button 
                onClick={() => window.print()} 
                className={`flex-1 flex items-center justify-center gap-2 py-3 ${theme.badge} text-white text-[10px] font-bold uppercase tracking-widest shadow-lg shadow-black/10 hover:opacity-90 transition-all`}
              >
                <Printer className="w-3.5 h-3.5" /> Imprimir Comprovante
              </button>
              <button 
                onClick={() => setViewingMovement(null)} 
                className="flex-1 py-3 bg-white border border-slate-200 text-slate-400 text-[10px] font-bold uppercase tracking-widest hover:bg-slate-100 transition-all"
              >
                Fechar Visualização
              </button>
            </div>
          </div>
        </div>
      )}

      <header className="flex flex-col lg:flex-row lg:items-end justify-between gap-4 border-b border-slate-200 pb-6">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-[#14213D] uppercase tracking-tighter">Histórico Oficial</h1>
          <p className="text-[9px] sm:text-[10px] text-slate-500 mt-1 uppercase tracking-[0.2em] font-medium">Registro Cronológico de Movimentações</p>
        </div>
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
          <div className="relative flex-1 sm:flex-none">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-3 h-3" />
            <input 
              type="text" 
              placeholder="PESQUISAR..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className={`pl-9 pr-4 py-2.5 bg-white border border-slate-200 text-[9px] uppercase font-bold tracking-[0.2em] outline-none ${theme.primaryFocus} w-full sm:w-64 shadow-sm`}
            />
          </div>
          <div className="flex gap-2">
            <button className="flex-1 sm:flex-none p-2.5 border border-slate-200 bg-white hover:bg-slate-50 text-slate-600 transition-colors shadow-sm flex justify-center">
              <Printer className="w-4 h-4" />
            </button>
            <button className="flex-1 sm:flex-none p-2.5 border border-slate-200 bg-white hover:bg-slate-50 text-slate-600 transition-colors shadow-sm flex justify-center">
              <FileDown className="w-4 h-4" />
            </button>
          </div>
        </div>
      </header>

      {/* Desktop Table View */}
      <div className="hidden md:block bg-white border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto custom-scrollbar">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200">
                <th className="px-6 py-4 text-[9px] font-bold text-slate-400 uppercase tracking-[0.3em]">Data/Hora</th>
                <th className="px-6 py-4 text-[9px] font-bold text-slate-400 uppercase tracking-[0.3em]">Colaborador</th>
                <th className="px-6 py-4 text-[9px] font-bold text-slate-400 uppercase tracking-[0.3em]">Insumo</th>
                <th className="px-6 py-4 text-center text-[9px] font-bold text-slate-400 uppercase tracking-[0.3em]">Vol</th>
                <th className="px-6 py-4 text-center text-[9px] font-bold text-slate-400 uppercase tracking-[0.3em]">Documento</th>
                <th className="px-6 py-4 text-[9px] font-bold text-slate-400 uppercase tracking-[0.3em]">Responsável</th>
                <th className="px-6 py-4 text-right text-[9px] font-bold text-slate-400 uppercase tracking-[0.3em]">Remover</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {unitMovements.length > 0 ? (
                unitMovements.map((m) => (
                  <tr key={m.id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <p className="text-[11px] font-bold text-slate-700">{m.date}</p>
                      <p className="text-[9px] text-slate-400 tracking-tighter">{m.time}</p>
                    </td>
                    <td className="px-6 py-4 text-[10px] font-bold text-slate-600 uppercase">
                      {getCollaborator(m.collaboratorId)?.name || m.collaboratorId}
                    </td>
                    <td className="px-6 py-4">
                      <p className="text-[10px] text-slate-700 font-medium uppercase">{getProduct(m.productId)?.name || m.productId}</p>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <span className="text-[11px] font-bold text-slate-900">{m.quantity}</span>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <button 
                        onClick={() => setViewingMovement(m)}
                        className={`inline-flex items-center gap-2 px-3 py-1.5 ${theme.light} ${theme.text} hover:bg-slate-200 transition-all rounded-none text-[9px] font-bold uppercase tracking-widest`}
                      >
                        <Eye className="w-3.5 h-3.5" /> Ver DOC
                      </button>
                    </td>
                    <td className="px-6 py-4 text-[10px] text-slate-500 uppercase">
                      {getStaff(m.stockStaffId)?.name || m.stockStaffId}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button 
                        onClick={() => onDelete(m.id)}
                        className="p-2 text-slate-300 hover:text-red-500 hover:bg-red-50 transition-all rounded-full"
                        title="Excluir Registro permanentemente"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={7} className="px-6 py-20 text-center text-[10px] uppercase font-bold tracking-[0.3em] text-slate-300">Nenhum registro localizado</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Mobile Card View */}
      <div className="md:hidden space-y-4">
        {unitMovements.length > 0 ? (
          unitMovements.map((m) => (
            <div key={m.id} className="bg-white border border-slate-200 shadow-sm relative overflow-hidden group">
              {/* Botão de Excluir isolado no topo */}
              <div className="absolute top-2 right-2">
                 <button onClick={() => onDelete(m.id)} className="p-3 text-slate-300 bg-white border border-slate-100 shadow-sm rounded-full active:bg-red-50 active:text-red-500">
                    <Trash2 className="w-4 h-4" />
                 </button>
              </div>
              
              <div className="p-5 pb-0">
                <div className="flex items-center gap-3 border-b border-slate-50 pb-3 mb-4">
                  <div className={`w-10 h-10 ${theme.badge} flex items-center justify-center text-white`}>
                    <Package className="w-5 h-5" />
                  </div>
                  <div className="pr-12">
                    <p className="text-[10px] font-bold text-slate-800 uppercase leading-none mb-1 truncate">{getProduct(m.productId)?.name || m.productId}</p>
                    <p className="text-[9px] text-slate-400 uppercase tracking-tighter font-bold">{m.quantity} {getProduct(m.productId)?.unit || 'UN'}</p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4 mb-4">
                  <div className="space-y-1">
                    <div className="flex items-center gap-1.5 text-[8px] font-bold text-slate-400 uppercase tracking-wider">
                      <User className="w-2.5 h-2.5" /> Solicitante
                    </div>
                    <p className="text-[10px] font-bold text-slate-600 uppercase truncate">{getCollaborator(m.collaboratorId)?.name || m.collaboratorId}</p>
                  </div>
                  <div className="space-y-1 text-right">
                    <div className="flex items-center gap-1.5 text-[8px] font-bold text-slate-400 uppercase tracking-wider justify-end">
                      <Clock className="w-2.5 h-2.5" /> Horário
                    </div>
                    <p className="text-[10px] font-bold text-slate-600 uppercase">{m.date} - {m.time}</p>
                  </div>
                </div>

                <div className="pt-3 border-t border-slate-50 flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <Warehouse className="w-3.5 h-3.5 text-slate-400" />
                    <span className="text-[9px] font-bold text-slate-400 uppercase">Entrega: {getStaff(m.stockStaffId)?.name.toUpperCase() || m.stockStaffId}</span>
                  </div>
                </div>
              </div>

              {/* Botão de Visualização em Rodapé de largura total para máxima segurança de clique */}
              <button 
                onClick={() => setViewingMovement(m)} 
                className={`w-full py-4 ${theme.light} ${theme.text} flex items-center justify-center gap-3 text-[10px] font-black uppercase tracking-widest border-t border-slate-100 active:bg-slate-200 transition-all`}
              >
                <Eye className="w-4 h-4" /> Visualizar Comprovante
              </button>
            </div>
          ))
        ) : (
          <div className="bg-white border border-slate-200 p-10 text-center">
             <p className="text-[10px] uppercase font-bold tracking-[0.3em] text-slate-300">Nenhum registro localizado</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default History;
