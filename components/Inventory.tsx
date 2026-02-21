
import React, { useState } from 'react';
import { Search, Boxes, AlertCircle, Filter, ChevronDown, Edit2, X, Check, Loader2 } from 'lucide-react';
import { Product, Unit } from '../types';

interface InventoryProps {
  unit: Unit;
  products: Product[];
  onUpdateStock: (productId: string, newStock: number) => Promise<void>;
}

const Inventory: React.FC<InventoryProps> = ({ unit, products, onUpdateStock }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('TODOS');
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [editValue, setEditValue] = useState<string>('');
  const [isSaving, setIsSaving] = useState(false);

  const categories = ['TODOS', ...new Set(products.map(p => p.category.toUpperCase()))];

  const filteredProducts = products.filter(p => {
    const matchesSearch = p.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = categoryFilter === 'TODOS' || p.category.toUpperCase() === categoryFilter;
    return matchesSearch && matchesCategory;
  }).sort((a, b) => a.name.localeCompare(b.name));

  const handleStartEdit = (p: Product) => {
    setEditingProduct(p);
    setEditValue(p.stock.toString());
  };

  const handleSaveEdit = async () => {
    if (!editingProduct) return;
    const newValue = parseInt(editValue);
    if (isNaN(newValue) || newValue < 0) {
      alert("Por favor, insira um valor válido.");
      return;
    }

    setIsSaving(true);
    await onUpdateStock(editingProduct.id, newValue);
    setIsSaving(false);
    setEditingProduct(null);
  };

  const theme = {
    primaryFocus: unit === 'sede' ? 'focus:border-[#14213D]' : 'focus:border-[#9A4E12]',
    accent: unit === 'sede' ? 'bg-[#14213D]' : 'bg-[#9A4E12]',
    text: unit === 'sede' ? 'text-[#14213D]' : 'text-[#9A4E12]',
    border: unit === 'sede' ? 'border-[#14213D]' : 'border-[#9A4E12]',
  };

  return (
    <div className="space-y-6 sm:space-y-10">
      {/* MODAL DE AJUSTE DE ESTOQUE */}
      {editingProduct && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={() => !isSaving && setEditingProduct(null)} />
          <div className={`relative bg-white w-full max-w-sm p-8 shadow-2xl border-t-8 ${theme.border} animate-in zoom-in duration-200`}>
            <button 
              onClick={() => setEditingProduct(null)} 
              disabled={isSaving}
              className="absolute top-4 right-4 text-slate-300 hover:text-slate-600 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
            
            <div className="text-center mb-8">
              <div className={`w-12 h-12 ${theme.accent} text-white rounded-full flex items-center justify-center mx-auto mb-4`}>
                <Edit2 className="w-6 h-6" />
              </div>
              <h3 className="text-[16px] font-semibold text-slate-800 uppercase tracking-tighter mb-1">Ajustar Inventário</h3>
              <p className="text-[11px] text-slate-400 font-normal uppercase tracking-widest leading-tight">
                {editingProduct.name}
              </p>
            </div>

            <div className="space-y-6">
              <div className="space-y-2">
                <label className="text-[11px] font-semibold text-slate-500 uppercase tracking-widest">Novo Saldo em Estoque</label>
                <div className="relative">
                  <input 
                    type="number" 
                    value={editValue}
                    onChange={(e) => setEditValue(e.target.value)}
                    autoFocus
                    className={`w-full bg-slate-50 border border-slate-200 px-4 py-4 text-center text-[26px] font-bold tracking-tighter outline-none ${theme.primaryFocus} transition-all`}
                  />
                  <span className="absolute right-4 top-1/2 -translate-y-1/2 text-[11px] font-semibold text-slate-400 uppercase">
                    {editingProduct.unit}
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <button 
                  onClick={() => setEditingProduct(null)}
                  disabled={isSaving}
                  className="py-3 bg-slate-100 text-slate-600 text-[12px] font-semibold uppercase tracking-widest hover:bg-slate-200 transition-colors disabled:opacity-50"
                >
                  Cancelar
                </button>
                <button 
                  onClick={handleSaveEdit}
                  disabled={isSaving}
                  className={`py-3 ${theme.accent} text-white text-[12px] font-semibold uppercase tracking-widest hover:opacity-90 transition-all flex items-center justify-center gap-2 disabled:opacity-50`}
                >
                  {isSaving ? <Loader2 className="w-3 h-3 animate-spin" /> : <Check className="w-3 h-3" />}
                  Confirmar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <header className="border-b border-slate-200 pb-6 flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
        <div>
          <h1 className="text-[20px] font-semibold text-[#14213D] uppercase tracking-tighter">Estoque de Insumos</h1>
          <p className="text-[12px] text-slate-500 mt-1 uppercase tracking-[0.2em] font-normal">Controle de Saldo e Disponibilidade</p>
        </div>
        
        <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-3 h-3" />
            <input 
              type="text" 
              placeholder="PESQUISAR ITEM..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className={`pl-9 pr-4 py-2.5 bg-white border border-slate-200 text-[12px] uppercase font-normal tracking-[0.2em] outline-none ${theme.primaryFocus} w-full sm:w-64 shadow-sm`}
            />
          </div>
          <div className="relative">
            <Filter className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-3 h-3" />
            <select 
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className={`pl-9 pr-8 py-2.5 bg-white border border-slate-200 text-[12px] uppercase font-normal tracking-[0.2em] outline-none ${theme.primaryFocus} w-full appearance-none shadow-sm`}
            >
              {categories.map(cat => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>
            <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 w-3 h-3 pointer-events-none" />
          </div>
        </div>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6">
        {filteredProducts.length > 0 ? (
          filteredProducts.map((p) => (
            <div key={p.id} className="bg-white border border-slate-200 p-5 shadow-sm relative group overflow-hidden transition-all hover:border-slate-300">
              <div className="flex justify-between items-start mb-4">
                <span className="text-[11px] font-semibold uppercase tracking-widest bg-slate-100 text-slate-400 px-2 py-0.5">
                  {p.category}
                </span>
                {p.stock <= 5 && (
                  <div className="flex items-center gap-1 text-red-500 animate-pulse">
                    <AlertCircle className="w-3 h-3" />
                    <span className="text-[11px] font-semibold uppercase tracking-tighter">Baixo Estoque</span>
                  </div>
                )}
              </div>
              
              <h3 className="text-[12px] font-semibold text-slate-800 uppercase leading-tight mb-6 h-8 line-clamp-2">
                {p.name}
              </h3>

              <div className="flex items-end justify-between border-t border-slate-50 pt-4">
                <div>
                  <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-widest mb-1">Saldo Atual</p>
                  <div className="flex items-baseline gap-1">
                    <span className={`text-[26px] font-bold tracking-tighter ${p.stock <= 5 ? 'text-red-500' : 'text-[#14213D]'}`}>
                      {p.stock}
                    </span>
                    <span className="text-[11px] font-semibold text-slate-400 uppercase">{p.unit}</span>
                  </div>
                </div>
                
                <div className="flex items-center gap-2">
                  <button 
                    onClick={() => handleStartEdit(p)}
                    className="p-2 text-slate-300 hover:text-slate-600 hover:bg-slate-100 transition-all rounded-full"
                    title="Ajustar Estoque"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                  </button>
                  <div className={`w-8 h-8 ${theme.accent} flex items-center justify-center text-white opacity-20 group-hover:opacity-100 transition-opacity`}>
                    <Boxes className="w-4 h-4" />
                  </div>
                </div>
              </div>

              {/* Barra de progresso visual de estoque (Simulado: assume max 100 para visualização) */}
              <div className="absolute bottom-0 left-0 w-full h-1 bg-slate-50">
                 <div 
                   className={`h-full transition-all duration-1000 ${p.stock <= 5 ? 'bg-red-500' : theme.accent}`} 
                   style={{ width: `${Math.min((p.stock / 100) * 100, 100)}%` }}
                 />
              </div>
            </div>
          ))
        ) : (
          <div className="col-span-full py-20 bg-white border border-slate-200 border-dashed flex flex-col items-center justify-center text-center">
            <Boxes className="w-12 h-12 text-slate-200 mb-4" />
            <p className="text-[12px] uppercase font-normal tracking-[0.3em] text-slate-300">Nenhum item localizado com esses filtros</p>
          </div>
        )}
      </div>

      <div className="mt-10 p-6 bg-slate-50 border border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <div className={`w-3 h-3 ${theme.accent}`}></div>
            <span className="text-[11px] font-semibold uppercase tracking-widest text-slate-500">Estoque Regular</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-red-500"></div>
            <span className="text-[11px] font-semibold uppercase tracking-widest text-slate-500">Estoque Crítico (≤ 5)</span>
          </div>
        </div>
        <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-widest">Total de Itens: {filteredProducts.length}</p>
      </div>
    </div>
  );
};

export default Inventory;
