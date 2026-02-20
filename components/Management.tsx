import React, { useState } from 'react';
import { Plus, Tag, Briefcase, UserCheck, Trash2 } from 'lucide-react';
import { Product, Sector, StockStaff, Unit } from '../types';

interface ManagementProps {
  unit: Unit;
  products: Product[];
  sectors: Sector[];
  stockStaff: StockStaff[];
  onAddProduct: (p: Omit<Product, 'id' | 'location'>) => void;
  onAddSector: (s: Omit<Sector, 'id' | 'location'>) => void;
  onAddStaff: (s: Omit<StockStaff, 'id' | 'location'>) => void;
  onDeleteProduct: (id: string) => void;
  onDeleteSector: (id: string) => void;
  onDeleteStaff: (id: string) => void;
}

const Management: React.FC<ManagementProps> = ({ 
  unit, products, sectors, stockStaff, onAddProduct, onAddSector, onAddStaff,
  onDeleteProduct, onDeleteSector, onDeleteStaff
}) => {
  const [prodName, setProdName] = useState('');
  const [prodCat, setProdCat] = useState('Químico');
  const [prodUnit, setProdUnit] = useState('Unidade');
  const [sectorName, setSectorName] = useState('');
  const [staffName, setStaffName] = useState('');

  const theme = {
    primaryFocus: unit === 'sede' ? 'focus:border-[#14213D]' : 'focus:border-[#9A4E12]',
    primaryButton: unit === 'sede' ? 'bg-[#14213D] hover:bg-[#1F2E4D]' : 'bg-[#9A4E12] hover:bg-[#7C3F0E]',
    primaryText: unit === 'sede' ? 'text-[#14213D]' : 'text-[#9A4E12]',
  };

  const inputClass = `w-full bg-[#F8FAFC] border border-slate-200 rounded-none px-4 py-2.5 text-sm ${theme.primaryFocus} outline-none transition-all`;
  const btnClass = `px-6 py-2.5 ${theme.primaryButton} text-white text-xs font-bold uppercase tracking-widest flex items-center gap-2 w-full justify-center mt-2 transition-colors`;

  return (
    <div className="space-y-10 pb-20">
      <header className="border-b border-slate-200 pb-6">
        <h1 className="text-[22px] font-semibold text-[#14213D] uppercase tracking-tighter">Gerenciamento Técnico</h1>
        <p className="text-[14px] text-slate-500 mt-1 uppercase tracking-[0.2em] font-normal">Configurações de Itens, Setores e Equipe de Suporte</p>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
        {/* Catálogo de Insumos */}
        <div className="bg-white border border-slate-200 shadow-sm flex flex-col">
          <div className="p-6 border-b border-slate-100 bg-slate-50 flex items-center gap-2">
            <Tag className={`w-3 h-3 ${theme.primaryText}`} />
            <h2 className="text-[14px] font-semibold uppercase tracking-widest text-slate-600">Catálogo de Insumos</h2>
          </div>
          <div className="p-6 space-y-4 border-b border-slate-100">
            <input 
              value={prodName} 
              onChange={(e) => setProdName(e.target.value)} 
              placeholder="NOME DO ITEM (EX: VEJA MULTIUSO)" 
              className={inputClass} 
            />
            <div className="grid grid-cols-2 gap-4">
              <select value={prodCat} onChange={(e) => setProdCat(e.target.value)} className={inputClass}>
                <option>Químico</option><option>Descartável</option><option>Utensílio</option><option>EPI</option>
              </select>
              <select value={prodUnit} onChange={(e) => setProdUnit(e.target.value)} className={inputClass}>
                <option>Unidade</option><option>Litro</option><option>Pacote</option><option>Caixa</option>
              </select>
            </div>
            <button 
              onClick={() => { if(prodName) { onAddProduct({ name: prodName, category: prodCat, unit: prodUnit, stock: 0 }); setProdName(''); } }} 
              className={btnClass}
            >
              <Plus className="w-3 h-3" /> Registrar Produto
            </button>
          </div>
          <div className="max-h-[300px] overflow-y-auto custom-scrollbar">
            {products.sort((a,b) => a.name.localeCompare(b.name)).map(p => (
              <div key={p.id} className="px-6 py-3 flex justify-between items-center border-b border-slate-50 hover:bg-slate-50 transition-colors">
                <div>
                  <p className="text-[14px] font-semibold text-slate-700 uppercase">{p.name}</p>
                  <p className="text-[13px] text-slate-400 uppercase tracking-widest">{p.category} | {p.unit}</p>
                </div>
                <button onClick={() => onDeleteProduct(p.id)} className="text-slate-300 hover:text-red-500 transition-colors p-2">
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* Cadastro de Setores */}
        <div className="bg-white border border-slate-200 shadow-sm flex flex-col">
          <div className="p-6 border-b border-slate-100 bg-slate-50 flex items-center gap-2">
            <Briefcase className={`w-3 h-3 ${theme.primaryText}`} />
            <h2 className="text-[14px] font-semibold uppercase tracking-widest text-slate-600">Cadastro de Setores</h2>
          </div>
          <div className="p-6 space-y-4 border-b border-slate-100">
            <input 
              value={sectorName} 
              onChange={(e) => setSectorName(e.target.value)} 
              placeholder="NOME DO SETOR (EX: COZINHA)" 
              className={inputClass} 
            />
            <button 
              onClick={() => { if(sectorName) { onAddSector({ name: sectorName }); setSectorName(''); } }} 
              className={btnClass}
            >
              <Plus className="w-3 h-3" /> Registrar Setor
            </button>
          </div>
          <div className="max-h-[300px] overflow-y-auto custom-scrollbar">
            {sectors.sort((a,b) => a.name.localeCompare(b.name)).map(s => (
              <div key={s.id} className="px-6 py-3 flex justify-between items-center border-b border-slate-50 hover:bg-slate-50 transition-colors">
                <div>
                  <p className="text-[14px] font-semibold text-slate-700 uppercase">{s.name}</p>
                </div>
                <button onClick={() => onDeleteSector(s.id)} className="text-slate-300 hover:text-red-500 transition-colors p-2">
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* Equipe de Suprimentos */}
        <div className="bg-white border border-slate-200 lg:col-span-2 shadow-sm">
          <div className="p-6 border-b border-slate-100 bg-slate-50 flex items-center gap-2">
            <UserCheck className={`w-3 h-3 ${theme.primaryText}`} />
            <h2 className="text-[14px] font-semibold uppercase tracking-widest text-slate-600">Equipe de Suprimentos (Operadores)</h2>
          </div>
          <div className="p-6 sm:p-8 flex flex-col sm:flex-row gap-4 border-b border-slate-50 items-end">
            <div className="flex-1 w-full space-y-1">
              <label className="text-[13px] font-semibold text-slate-400 uppercase tracking-widest ml-1">Nome do Operador</label>
              <input 
                value={staffName} 
                onChange={(e) => setStaffName(e.target.value)} 
                placeholder="EX: MÁRCIO" 
                className={inputClass} 
              />
            </div>
            <button 
              onClick={() => { if(staffName) { onAddStaff({ name: staffName }); setStaffName(''); } }} 
              className={btnClass + " sm:w-auto px-12 !mt-0"}
            >
              Registrar Operador
            </button>
          </div>
          <div className="p-6 sm:p-8">
            <div className="flex flex-wrap gap-2">
              {stockStaff.length > 0 ? stockStaff.map(s => (
                <div key={s.id} className="bg-slate-50 border border-slate-200 px-4 py-2 flex items-center gap-4 group">
                  <span className="text-[14px] font-semibold text-slate-600 uppercase">{s.name}</span>
                  <button onClick={() => onDeleteStaff(s.id)} className="text-slate-300 hover:text-red-500 transition-colors">
                    <Trash2 className="w-3 h-3" />
                  </button>
                </div>
              )) : (
                <p className="text-[14px] text-slate-400 uppercase font-normal italic">Nenhum operador cadastrado.</p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Management;