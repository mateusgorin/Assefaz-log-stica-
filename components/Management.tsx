
import React, { useState } from 'react';
import { Plus, Tag, Briefcase, UserCheck, Trash2, Database, Copy, CheckCircle, Info, AlertTriangle, ShieldAlert } from 'lucide-react';
import { Product, Collaborator, StockStaff, Unit } from '../types';

interface ManagementProps {
  unit: Unit;
  products: Product[];
  collaborators: Collaborator[];
  stockStaff: StockStaff[];
  onAddProduct: (p: Omit<Product, 'id'>) => void;
  onAddCollaborator: (c: Omit<Collaborator, 'id'>) => void;
  onAddStaff: (s: Omit<StockStaff, 'id'>) => void;
  onDeleteProduct: (id: string) => void;
  onDeleteCollaborator: (id: string) => void;
  onDeleteStaff: (id: string) => void;
}

const Management: React.FC<ManagementProps> = ({ 
  unit, products, collaborators, stockStaff, onAddProduct, onAddCollaborator, onAddStaff,
  onDeleteProduct, onDeleteCollaborator, onDeleteStaff
}) => {
  const [prodName, setProdName] = useState('');
  const [prodCat, setProdCat] = useState('Químico');
  const [prodUnit, setProdUnit] = useState('Unidade');
  const [prodStock, setProdStock] = useState('0');
  const [colName, setColName] = useState('');
  const [colDept, setColDept] = useState('');
  const [staffName, setStaffName] = useState('');
  const [copied, setCopied] = useState(false);

  const theme = {
    primaryFocus: unit === 'sede' ? 'focus:border-[#14213D]' : 'focus:border-[#9A4E12]',
    primaryButton: unit === 'sede' ? 'bg-[#14213D] hover:bg-[#1F2E4D]' : 'bg-[#9A4E12] hover:bg-[#7C3F0E]',
    primaryText: unit === 'sede' ? 'text-[#14213D]' : 'text-[#9A4E12]',
    accentBg: unit === 'sede' ? 'bg-blue-50' : 'bg-orange-50',
    accentBorder: unit === 'sede' ? 'border-blue-100' : 'border-orange-100',
  };

  const sqlCommand = `-- COMANDO PARA LIBERAR EXCLUSÃO DE COLABORADORES (IMPORTANTE!)
ALTER TABLE movements DROP CONSTRAINT IF EXISTS movements_collaborator_id_fkey;
ALTER TABLE movements ADD CONSTRAINT movements_collaborator_id_fkey 
FOREIGN KEY (collaborator_id) REFERENCES collaborators(id) ON DELETE CASCADE;

-- COMANDO PARA LIBERAR EXCLUSÃO DE PRODUTOS
ALTER TABLE movements DROP CONSTRAINT IF EXISTS movements_product_id_fkey;
ALTER TABLE movements ADD CONSTRAINT movements_product_id_fkey 
FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE;

-- COMANDO PARA LIBERAR EXCLUSÃO DE OPERADORES
ALTER TABLE movements DROP CONSTRAINT IF EXISTS movements_stock_staff_id_fkey;
ALTER TABLE movements ADD CONSTRAINT movements_stock_staff_id_fkey 
FOREIGN KEY (stock_staff_id) REFERENCES stock_staff(id) ON DELETE CASCADE;`;

  const copySql = () => {
    navigator.clipboard.writeText(sqlCommand);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const inputClass = `w-full bg-[#F8FAFC] border border-slate-200 rounded-none px-4 py-2 text-xs ${theme.primaryFocus} outline-none`;
  const btnClass = `px-6 py-2 ${theme.primaryButton} text-white text-[10px] font-bold uppercase tracking-widest flex items-center gap-2 w-full justify-center mt-2`;

  const handleAddProductClick = () => {
    if(prodName) { 
      onAddProduct({ 
        name: prodName, 
        category: prodCat, 
        unit: prodUnit, 
        stock: parseInt(prodStock) || 0 
      }); 
      setProdName(''); 
      setProdStock('0');
    }
  };

  return (
    <div className="space-y-10 pb-20">
      <header className="border-b border-slate-200 pb-6">
        <h1 className="text-2xl font-bold text-[#14213D] uppercase tracking-tighter">Gerenciamento Técnico</h1>
        <p className="text-[10px] text-slate-500 mt-1 uppercase tracking-[0.2em] font-medium">Configurações de Itens e Equipe Operacional</p>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
        {/* Catálogo de Insumos */}
        <div className="bg-white border border-slate-200 shadow-sm flex flex-col">
          <div className="p-6 border-b border-slate-100 bg-slate-50 flex items-center gap-2">
            <Tag className={`w-3 h-3 ${theme.primaryText}`} />
            <h2 className="text-[10px] font-bold uppercase tracking-widest text-slate-600">Catálogo de Insumos</h2>
          </div>
          <div className="p-6 space-y-4 border-b border-slate-100">
            <div className="space-y-1">
              <label className="text-[8px] font-bold text-slate-400 uppercase tracking-widest ml-1">Novo Item</label>
              <input value={prodName} onChange={(e) => setProdName(e.target.value)} placeholder="EX: DESINFETANTE 5L" className={inputClass} />
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-[8px] font-bold text-slate-400 uppercase tracking-widest ml-1">Categoria</label>
                <select value={prodCat} onChange={(e) => setProdCat(e.target.value)} className={inputClass}>
                  <option>Químico</option><option>Descartável</option><option>Utensílio</option><option>EPI</option>
                </select>
              </div>
              <div className="space-y-1">
                <label className="text-[8px] font-bold text-slate-400 uppercase tracking-widest ml-1">Medida</label>
                <select value={prodUnit} onChange={(e) => setProdUnit(e.target.value)} className={inputClass}>
                  <option>Unidade</option><option>Litro</option><option>Pacote</option><option>Caixa</option>
                </select>
              </div>
            </div>

            <button onClick={handleAddProductClick} className={btnClass}>
              <Plus className="w-3 h-3" /> Registrar Insumo
            </button>
          </div>

          <div className="max-h-[300px] overflow-y-auto custom-scrollbar">
            <table className="w-full text-left text-[10px]">
              <thead className="bg-slate-50 sticky top-0 border-b border-slate-100 z-10">
                <tr>
                  <th className="px-6 py-3 font-bold uppercase tracking-widest text-slate-400">Item</th>
                  <th className="px-6 py-3 font-bold uppercase tracking-widest text-slate-400 text-right">Ação</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {products.sort((a,b) => a.name.localeCompare(b.name)).map(p => (
                  <tr key={p.id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-6 py-3 font-bold text-slate-700 uppercase">{p.name} <span className="text-[8px] font-normal text-slate-400 ml-2">({p.category})</span></td>
                    <td className="px-6 py-3 text-right">
                       <button onClick={() => onDeleteProduct(p.id)} className="text-slate-300 hover:text-red-500 transition-colors">
                          <Trash2 className="w-3 h-3" />
                       </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Colaboradoras */}
        <div className="bg-white border border-slate-200 shadow-sm flex flex-col">
          <div className="p-6 border-b border-slate-100 bg-slate-50 flex items-center gap-2">
            <Briefcase className={`w-3 h-3 ${theme.primaryText}`} />
            <h2 className="text-[10px] font-bold uppercase tracking-widest text-slate-600">Cadastro de Colaboradoras</h2>
          </div>
          <div className="p-6 space-y-4 border-b border-slate-100">
            <input value={colName} onChange={(e) => setColName(e.target.value)} placeholder="NOME COMPLETO" className={inputClass} />
            <input value={colDept} onChange={(e) => setColDept(e.target.value)} placeholder="DEPARTAMENTO/SETOR" className={inputClass} />
            <button onClick={() => { if(colName && colDept) { onAddCollaborator({ name: colName, department: colDept }); setColName(''); setColDept(''); } }} className={btnClass}>
              <Plus className="w-3 h-3" /> Registrar Colaboradora
            </button>
          </div>
          <div className="max-h-[300px] overflow-y-auto custom-scrollbar">
            <table className="w-full text-left text-[10px]">
              <thead className="bg-slate-50 sticky top-0 border-b border-slate-100 z-10">
                <tr>
                  <th className="px-6 py-3 font-bold uppercase tracking-widest text-slate-400">Nome</th>
                  <th className="px-6 py-3 font-bold uppercase tracking-widest text-slate-400 text-right">Ação</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {collaborators.map(c => (
                  <tr key={c.id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-6 py-3 font-bold text-slate-700 uppercase">{c.name} <span className="text-[8px] font-normal text-slate-400 ml-2">({c.department})</span></td>
                    <td className="px-6 py-3 text-right">
                       <button onClick={() => onDeleteCollaborator(c.id)} className="text-slate-300 hover:text-red-500 transition-colors">
                          <Trash2 className="w-3 h-3" />
                       </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Equipe de Suprimentos */}
        <div className="bg-white border border-slate-200 lg:col-span-2 shadow-sm">
          <div className="p-6 border-b border-slate-100 bg-slate-50 flex items-center gap-2">
            <UserCheck className={`w-3 h-3 ${theme.primaryText}`} />
            <h2 className="text-[10px] font-bold uppercase tracking-widest text-slate-600">Equipe de Suprimentos (Administradores)</h2>
          </div>
          <div className="p-8 flex gap-4 border-b border-slate-100">
            <input value={staffName} onChange={(e) => setStaffName(e.target.value)} placeholder="NOME DO OPERADOR" className={inputClass} />
            <button onClick={() => { if(staffName) { onAddStaff({ name: staffName }); setStaffName(''); } }} className={btnClass + " !w-auto !mt-0 px-10"}>
              Registrar
            </button>
          </div>
          <div className="p-8">
            <div className="flex flex-wrap gap-2">
              {stockStaff.map(s => (
                <div key={s.id} className="bg-slate-100 px-4 py-2 border border-slate-200 text-[9px] font-bold text-slate-600 flex items-center gap-3">
                  {s.name.toUpperCase()}
                  <button onClick={() => onDeleteStaff(s.id)} className="text-slate-300 hover:text-red-500 transition-colors">
                    <Trash2 className="w-3 h-3" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* AJUDA TÉCNICA - RESOLVER ERRO DE DELEÇÃO */}
        <div className={`lg:col-span-2 border-2 border-dashed ${unit === 'sede' ? 'border-amber-400 bg-amber-50' : 'border-slate-400 bg-slate-50'} p-6 sm:p-10 space-y-8`}>
          <div className="flex items-start gap-4">
            <div className={`p-3 rounded-full bg-amber-500 text-white shrink-0 mt-1 shadow-lg`}>
              <AlertTriangle className="w-6 h-6" />
            </div>
            <div className="space-y-2">
              <h3 className="text-sm font-black text-slate-800 uppercase tracking-tighter">⚠️ Solução para erro ao apagar Colaboradoras</h3>
              <p className="text-[10px] text-slate-600 uppercase leading-relaxed font-bold">
                Se você já rodou o SQL de CASCADE (abaixo) e continua não conseguindo apagar, siga estes passos extras de segurança.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-white p-5 border border-amber-200 space-y-3">
               <div className="flex items-center gap-2 text-[10px] font-black text-amber-600 uppercase">
                 <Database className="w-3 h-3" /> Passo 1: SQL Cascade
               </div>
               <p className="text-[9px] text-slate-500 uppercase leading-tight font-medium">Copie este código e rode no SQL Editor do Supabase para liberar o histórico.</p>
               <div className="bg-slate-900 p-3 rounded relative group">
                  <button onClick={copySql} className="absolute top-2 right-2 text-white/40 hover:text-white">
                    <Copy className="w-3 h-3" />
                  </button>
                  <pre className="text-[8px] text-blue-300 font-mono leading-tight overflow-x-auto pr-6">
                    {sqlCommand}
                  </pre>
               </div>
            </div>

            <div className="bg-white p-5 border border-red-200 space-y-3">
               <div className="flex items-center gap-2 text-[10px] font-black text-red-600 uppercase">
                 <ShieldAlert className="w-3 h-3" /> Passo 2: Permissão (RLS)
               </div>
               <p className="text-[9px] text-slate-500 uppercase leading-tight font-medium">Se o erro for 'Permission Denied', você deve ir no Supabase e:</p>
               <ul className="text-[8px] text-slate-600 uppercase font-bold space-y-1 list-disc pl-4">
                 <li>Vá em 'Table Editor'</li>
                 <li>Clique em 'Collaborators'</li>
                 <li>Clique em 'RLS Disabled' ou crie uma política para 'DELETE'</li>
                 <li>Repita o mesmo para a tabela 'Products'</li>
               </ul>
            </div>
          </div>

          <div className="flex items-center gap-3 text-[9px] font-bold uppercase tracking-widest text-amber-700 bg-white/70 p-4 border border-amber-200">
            <Info className="w-4 h-4 shrink-0" />
            <span>DICA: Tente dar um REFRESH (F5) no navegador após rodar o comando no SQL Editor.</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Management;
