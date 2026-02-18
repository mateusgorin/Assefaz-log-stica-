
import React from 'react';
import { Search, Printer, FileDown, Clock, User, Package, ShieldCheck, Trash2 } from 'lucide-react';
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
  const unitMovements = movements
    .filter(m => m.unit === unit)
    .sort((a, b) => {
      const dateA = new Date(`${a.date.split('/').reverse().join('-')} ${a.time}`);
      const dateB = new Date(`${b.date.split('/').reverse().join('-')} ${b.time}`);
      return dateB.getTime() - dateA.getTime();
    });

  const getCollaboratorName = (id: string) => collaborators.find(c => c.id === id)?.name || id;
  const getProductName = (id: string) => products.find(p => p.id === id)?.name || id;
  const getStaffName = (id: string) => stockStaff.find(s => s.id === id)?.name || id;

  const theme = {
    primaryFocus: unit === 'sede' ? 'focus:border-[#14213D]' : 'focus:border-[#9A4E12]',
    badge: unit === 'sede' ? 'bg-[#14213D]' : 'bg-[#9A4E12]'
  };

  return (
    <div className="space-y-6 sm:space-y-8">
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
                <th className="px-6 py-4 text-[9px] font-bold text-slate-400 uppercase tracking-[0.3em]">Timestamp</th>
                <th className="px-6 py-4 text-[9px] font-bold text-slate-400 uppercase tracking-[0.3em]">Colaborador</th>
                <th className="px-6 py-4 text-[9px] font-bold text-slate-400 uppercase tracking-[0.3em]">Insumo</th>
                <th className="px-6 py-4 text-center text-[9px] font-bold text-slate-400 uppercase tracking-[0.3em]">Vol</th>
                <th className="px-6 py-4 text-[9px] font-bold text-slate-400 uppercase tracking-[0.3em]">Responsável</th>
                <th className="px-6 py-4 text-right text-[9px] font-bold text-slate-400 uppercase tracking-[0.3em]">Ações</th>
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
                      {getCollaboratorName(m.collaboratorId)}
                    </td>
                    <td className="px-6 py-4">
                      <p className="text-[10px] text-slate-700 font-medium uppercase">{getProductName(m.productId)}</p>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <span className="text-[11px] font-bold text-slate-900">{m.quantity}</span>
                    </td>
                    <td className="px-6 py-4 text-[10px] text-slate-500 uppercase">
                      {getStaffName(m.stockStaffId)}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button 
                        onClick={() => onDelete(m.id)}
                        className="p-2 text-slate-300 hover:text-red-500 transition-colors"
                        title="Excluir Registro"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={6} className="px-6 py-20 text-center text-[10px] uppercase font-bold tracking-[0.3em] text-slate-300">Nenhum registro localizado</td>
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
            <div key={m.id} className="bg-white border border-slate-200 p-5 space-y-4 shadow-sm relative overflow-hidden">
              <div className="absolute top-0 right-0 p-2">
                 <button onClick={() => onDelete(m.id)} className="p-2 text-slate-300 hover:text-red-500">
                    <Trash2 className="w-3.5 h-3.5" />
                 </button>
              </div>
              
              <div className="flex items-center gap-3 border-b border-slate-50 pb-3">
                <div className={`w-10 h-10 ${theme.badge} flex items-center justify-center text-white`}>
                  <Package className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-[10px] font-bold text-slate-800 uppercase leading-none mb-1">{getProductName(m.productId)}</p>
                  <p className="text-[9px] text-slate-400 uppercase tracking-tighter font-bold">{m.quantity} Unidades</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <div className="flex items-center gap-1.5 text-[8px] font-bold text-slate-400 uppercase tracking-wider">
                    <User className="w-2.5 h-2.5" /> Solicitante
                  </div>
                  <p className="text-[10px] font-bold text-slate-600 uppercase truncate">{getCollaboratorName(m.collaboratorId)}</p>
                </div>
                <div className="space-y-1 text-right">
                  <div className="flex items-center gap-1.5 text-[8px] font-bold text-slate-400 uppercase tracking-wider justify-end">
                    <Clock className="w-2.5 h-2.5" /> Horário
                  </div>
                  <p className="text-[10px] font-bold text-slate-600 uppercase">{m.date} - {m.time}</p>
                </div>
              </div>

              <div className="pt-3 border-t border-slate-50 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-5 h-5 bg-slate-100 flex items-center justify-center">
                    <ShieldCheck className="w-3 h-3 text-slate-400" />
                  </div>
                  <span className="text-[9px] font-bold text-slate-400 uppercase">Entrega: {getStaffName(m.stockStaffId)}</span>
                </div>
              </div>
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
