
import React, { useState, useCallback, useEffect } from 'react';
import { MENU_ITEMS } from './constants';
import { Unit, View, Movement, Product, Collaborator, StockStaff } from './types';
import { supabase, isConfigured } from './lib/supabase';
import Dashboard from './components/Dashboard';
import OutflowForm from './components/OutflowForm';
import EntryForm from './components/EntryForm';
import History from './components/History';
import Management from './components/Management';
import Reports from './components/Reports';
import Inventory from './components/Inventory';
import { LogOut, Menu, Building2, Loader2, RefreshCw, AlertTriangle, ExternalLink, PlusCircle } from 'lucide-react';

const App: React.FC = () => {
  const [activeUnit, setActiveUnit] = useState<Unit | null>(null);
  const [currentView, setCurrentView] = useState<View>(View.DASHBOARD);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [configured, setConfigured] = useState(isConfigured());

  const [products, setProducts] = useState<Product[]>([]);
  const [collaborators, setCollaborators] = useState<Collaborator[]>([]);
  const [stockStaff, setStockStaff] = useState<StockStaff[]>([]);
  const [movements, setMovements] = useState<Movement[]>([]);

  const fetchData = useCallback(async () => {
    if (!configured) return;
    setLoading(true);
    try {
      const [prods, cols, staff, movs] = await Promise.all([
        supabase.from('products').select('*').order('name'),
        supabase.from('collaborators').select('*').order('name'),
        supabase.from('stock_staff').select('*').order('name'),
        supabase.from('movements').select('*').order('created_at', { ascending: false })
      ]);

      if (prods.data) setProducts(prods.data);
      if (cols.data) setCollaborators(cols.data);
      if (staff.data) setStockStaff(staff.data);
      
      if (movs.data) {
        const formattedMovs: Movement[] = movs.data.map(m => ({
          id: m.id,
          date: m.date,
          time: m.time,
          collaboratorId: m.collaborator_id,
          productId: m.product_id,
          quantity: m.quantity,
          stockStaffId: m.stock_staff_id,
          signatureWithdrawer: m.signature_withdrawer,
          signature_deliverer: m.signature_deliverer,
          unit: m.unit as Unit
        }));
        setMovements(formattedMovs);
      }
    } catch (error) {
      console.error("Erro ao buscar dados:", error);
    } finally {
      setLoading(false);
    }
  }, [configured]);

  useEffect(() => {
    if (configured) {
      fetchData();
    }
  }, [configured, fetchData]);

  const handleAddMovement = useCallback(async (data: Omit<Movement, 'id' | 'date' | 'time' | 'unit'>) => {
    if (!activeUnit) return;
    
    const now = new Date();
    const { data: inserted, error } = await supabase.from('movements').insert([{
      date: now.toLocaleDateString('pt-br'),
      time: now.toLocaleTimeString('pt-br', { hour: '2-digit', minute: '2-digit' }),
      collaborator_id: data.collaboratorId,
      product_id: data.productId,
      quantity: data.quantity,
      stock_staff_id: data.stockStaffId,
      signature_withdrawer: data.signatureWithdrawer,
      signature_deliverer: data.signatureDeliverer,
      unit: activeUnit
    }]).select();

    if (error) {
      alert(`Erro ao registrar: ${error.message}`);
      return;
    }

    if (inserted) {
      const product = products.find(p => p.id === data.productId);
      if (product) {
        const newStock = Math.max(0, product.stock - data.quantity);
        await supabase.from('products').update({ stock: newStock }).eq('id', data.productId);
        await fetchData();
      }
    }
  }, [activeUnit, products, fetchData]);

  const handleAddStock = useCallback(async (productId: string, quantity: number) => {
    const product = products.find(p => p.id === productId);
    if (product) {
      const newStock = product.stock + quantity;
      const { error } = await supabase.from('products').update({ stock: newStock }).eq('id', productId);
      if (!error) await fetchData();
    }
  }, [products, fetchData]);

  const handleAddProduct = useCallback(async (p: Omit<Product, 'id'>) => {
    const { error } = await supabase.from('products').insert([p]);
    if (!error) await fetchData();
  }, [fetchData]);

  const handleAddCollaborator = useCallback(async (c: Omit<Collaborator, 'id'>) => {
    const { error } = await supabase.from('collaborators').insert([c]);
    if (!error) await fetchData();
  }, [fetchData]);

  const handleAddStaff = useCallback(async (s: Omit<StockStaff, 'id'>) => {
    const { error } = await supabase.from('stock_staff').insert([s]);
    if (!error) await fetchData();
  }, [fetchData]);

  const handleDeleteMovement = useCallback(async (id: string) => {
    if(!confirm("Deseja realmente excluir este registro?")) return;
    const { error } = await supabase.from('movements').delete().eq('id', id);
    if (error) {
      alert(`Erro ao excluir movimento: ${error.message}`);
    } else {
      await fetchData();
    }
  }, [fetchData]);

  const handleDeleteProduct = useCallback(async (id: string) => {
    if(!confirm("Excluir este produto permanentemente?")) return;
    const { error } = await supabase.from('products').delete().eq('id', id);
    if (error) {
      console.error("Erro completo:", error);
      alert(`ERRO: ${error.message}\n\nSe o erro for 'violates foreign key', rode o script SQL no Supabase. Se for 'permission denied', desative o RLS nas tabelas.`);
    } else {
      await fetchData();
    }
  }, [fetchData]);

  const handleDeleteCollaborator = useCallback(async (id: string) => {
    if(!confirm("Deseja excluir esta colaboradora? Isso é permanente.")) return;
    const { error } = await supabase.from('collaborators').delete().eq('id', id);
    if (error) {
      console.error("Erro completo:", error);
      alert(`FALHA NA EXCLUSÃO: ${error.message}\n\nSe você já rodou o SQL de CASCADE, verifique se o RLS (Row Level Security) está permitindo DELETE para anon/public no painel do Supabase.`);
    } else {
      await fetchData();
    }
  }, [fetchData]);

  const handleDeleteStaff = useCallback(async (id: string) => {
    if(!confirm("Excluir este operador?")) return;
    const { error } = await supabase.from('stock_staff').delete().eq('id', id);
    if (error) {
      alert(`ERRO: ${error.message}`);
    } else {
      await fetchData();
    }
  }, [fetchData]);

  if (!configured) {
    return (
      <div className="h-screen w-screen bg-slate-900 flex items-center justify-center p-6">
        <div className="max-w-md w-full bg-white p-10 shadow-2xl border-t-4 border-amber-500">
          <div className="flex justify-center mb-6 text-amber-500">
            <AlertTriangle className="w-16 h-16" />
          </div>
          <h1 className="text-xl font-bold text-slate-800 uppercase tracking-tighter text-center mb-4">Configuração Pendente</h1>
          <p className="text-sm text-slate-500 text-center mb-8 leading-relaxed">
            O sistema ainda não está conectado ao seu banco de dados. 
            Você precisa copiar a <span className="font-bold text-slate-700">Anon Key</span> do Supabase e colar no arquivo <code className="bg-slate-100 px-1 font-mono text-amber-700">lib/supabase.ts</code>.
          </p>
          <div className="space-y-3">
            <a 
              href="https://supabase.com/dashboard/project/sdtayaezhoxqkgznjnxz/settings/api" 
              target="_blank" 
              rel="noopener noreferrer"
              className="w-full bg-slate-800 text-white py-3 font-bold uppercase tracking-widest text-[10px] flex items-center justify-center gap-2 hover:bg-black transition-colors"
            >
              Abrir Painel de API <ExternalLink className="w-3 h-3" />
            </a>
            <button 
              onClick={() => setConfigured(isConfigured())}
              className="w-full border border-slate-200 text-slate-600 py-3 font-bold uppercase tracking-widest text-[10px] hover:bg-slate-50 transition-colors"
            >
              Já colei, verificar agora
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (!activeUnit) {
    return (
      <div className="flex flex-col lg:flex-row h-screen w-screen overflow-hidden">
        <div className="flex-1 bg-[#14213D] flex flex-col items-center justify-center p-8 sm:p-12 group cursor-pointer transition-all duration-500 hover:flex-[1.1] border-b lg:border-b-0 lg:border-r border-white/10" 
             onClick={() => setActiveUnit('sede')}>
          <h1 className="text-white text-3xl sm:text-4xl font-light tracking-widest uppercase mb-2">Sede</h1>
          <p className="text-white/40 text-[9px] sm:text-[10px] uppercase tracking-[0.3em] mb-8 font-medium">Controle Logístico Institucional</p>
          <button className="bg-white text-[#14213D] px-8 sm:px-10 py-3 rounded-none font-bold uppercase tracking-widest text-xs sm:text-sm hover:bg-slate-200 transition-colors">
            Acessar Unidade
          </button>
        </div>
        <div className="flex-1 bg-[#9A4E12] flex flex-col items-center justify-center p-8 sm:p-12 group cursor-pointer transition-all duration-500 hover:flex-[1.1]"
             onClick={() => setActiveUnit('506')}>
          <h1 className="text-white text-3xl sm:text-4xl font-light tracking-widest uppercase mb-2">506</h1>
          <p className="text-white/40 text-[9px] sm:text-[10px] uppercase tracking-[0.3em] mb-8 font-medium">Controle Logístico Institucional</p>
          <button className="bg-white text-[#9A4E12] px-8 sm:px-10 py-3 rounded-none font-bold uppercase tracking-widest text-xs sm:text-sm hover:bg-slate-200 transition-colors">
            Acessar Unidade
          </button>
        </div>
      </div>
    );
  }

  const theme = {
    menuBg: activeUnit === 'sede' ? 'bg-[#14213D]' : 'bg-[#9A4E12]',
    itemActiveDetail: activeUnit === 'sede' ? 'border-[#B45309]' : 'border-[#14213D]',
    badgeBg: activeUnit === 'sede' ? 'bg-[#14213D]' : 'bg-[#9A4E12]',
    badgeText: activeUnit === 'sede' ? 'text-[#14213D]' : 'text-[#9A4E12]',
  };

  return (
    <div className="flex h-screen bg-[#F4F6F8]">
      {sidebarOpen && (
        <div className="fixed inset-0 bg-black/60 z-[60] lg:hidden backdrop-blur-sm transition-opacity" onClick={() => setSidebarOpen(false)} />
      )}

      <aside className={`fixed lg:static inset-y-0 left-0 z-[70] w-64 sm:w-72 ${theme.menuBg} text-white flex flex-col transform ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'} lg:translate-x-0 transition-transform duration-300 ease-in-out border-r border-white/5`}>
        <div className="p-6 sm:p-8 border-b border-white/5">
          <div className="flex items-center gap-3 mb-2">
            <Building2 className={`w-5 h-5 sm:w-6 sm:h-6 ${activeUnit === 'sede' ? 'text-[#B45309]' : 'text-white/80'}`} />
            <span className="font-bold tracking-tighter text-base sm:text-lg uppercase">Assefaz</span>
          </div>
          <p className="text-[8px] sm:text-[9px] uppercase tracking-wider text-white/50 font-semibold leading-relaxed">Controle Logístico Institucional | Sistema Interno</p>
        </div>

        <nav className="flex-1 pt-4 sm:pt-6 overflow-y-auto custom-scrollbar">
          {MENU_ITEMS.map((item) => (
            <button
              key={item.id}
              onClick={() => {
                setCurrentView(item.id);
                setSidebarOpen(false);
              }}
              className={`w-full flex items-center gap-4 px-6 sm:px-8 py-3.5 sm:py-4 text-[10px] sm:text-[11px] uppercase tracking-widest transition-all border-l-4 ${
                currentView === item.id 
                  ? `bg-white/10 ${theme.itemActiveDetail} text-white font-bold` 
                  : 'border-transparent text-white/60 hover:text-white hover:bg-white/5'
              }`}
            >
              <div className={currentView === item.id ? (activeUnit === 'sede' ? 'text-[#B45309]' : 'text-white') : ''}>{item.icon}</div>
              <span>{item.label}</span>
            </button>
          ))}
        </nav>

        <div className="p-6 sm:p-8 border-t border-white/5 bg-black/5">
          <p className="text-[9px] text-white/40 uppercase tracking-widest mb-1 font-bold">Desenvolvedor</p>
          <p className="text-xs font-semibold text-white/80">Mateus Gorin</p>
        </div>
      </aside>

      <div className="flex-1 flex flex-col overflow-hidden">
        <header className="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-4 sm:px-8 shrink-0 shadow-sm z-50">
          <div className="flex items-center gap-3">
            <button onClick={() => setSidebarOpen(true)} className="lg:hidden text-slate-500 hover:text-slate-800 transition-colors p-2">
              <Menu className="w-5 h-5" />
            </button>
            <div className="h-4 w-[1px] bg-slate-200 hidden lg:block"></div>
            <span className="text-xs sm:text-sm font-bold text-slate-800 uppercase tracking-tight flex items-center gap-2">
              Controle Logístico 
              {loading && <Loader2 className="w-3 h-3 animate-spin text-slate-300" />}
            </span>
          </div>

          <div className="flex items-center gap-2 sm:gap-6">
            <button onClick={fetchData} className="p-2 text-slate-400 hover:text-slate-600 transition-colors" title="Sincronizar Dados">
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            </button>
            <div className={`h-7 sm:h-8 px-3 rounded-none flex items-center justify-center text-white text-[9px] sm:text-[10px] font-bold shadow-sm ${theme.badgeBg}`}>
              {activeUnit.toUpperCase()}
            </div>
            <button onClick={() => setActiveUnit(null)} className="flex items-center gap-1.5 text-slate-400 hover:text-red-600 transition-colors p-1">
              <LogOut className="w-4 h-4" />
              <span className="text-[9px] uppercase font-bold tracking-widest hidden sm:inline">Sair</span>
            </button>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-10 custom-scrollbar">
          <div className="max-w-6xl mx-auto">
            {products.length === 0 && !loading && currentView === View.DASHBOARD ? (
              <div className="bg-white border border-slate-200 p-12 text-center shadow-sm">
                <PlusCircle className="w-12 h-12 text-slate-200 mx-auto mb-4" />
                <h2 className="text-lg font-bold text-slate-800 uppercase tracking-tighter mb-2">Seu estoque está vazio</h2>
                <p className="text-xs text-slate-500 uppercase tracking-widest mb-8">Comece cadastrando seus primeiros produtos e colaboradoras.</p>
                <button 
                  onClick={() => setCurrentView(View.MANAGEMENT)}
                  className={`px-8 py-3 text-white text-[10px] font-bold uppercase tracking-[0.2em] ${theme.badgeBg}`}
                >
                  Ir para Cadastros
                </button>
              </div>
            ) : (
              <>
                {currentView === View.DASHBOARD && (
                  <Dashboard unit={activeUnit} movements={movements} products={products} collaborators={collaborators} />
                )}
                {currentView === View.OUTFLOW && (
                  <OutflowForm unit={activeUnit} products={products} collaborators={collaborators} stockStaff={stockStaff} onAddMovement={handleAddMovement} onNavigate={(view) => setCurrentView(view)} />
                )}
                {currentView === View.ENTRY && (
                  <EntryForm unit={activeUnit} products={products} stockStaff={stockStaff} onAddStock={handleAddStock} onNavigate={(view) => setCurrentView(view)} />
                )}
                {currentView === View.STOCK && (
                  <Inventory unit={activeUnit} products={products} />
                )}
                {currentView === View.HISTORY && (
                  <History unit={activeUnit} movements={movements} products={products} collaborators={collaborators} stockStaff={stockStaff} onDelete={handleDeleteMovement} />
                )}
                {currentView === View.MANAGEMENT && (
                  <Management 
                    unit={activeUnit} 
                    products={products} 
                    collaborators={collaborators} 
                    stockStaff={stockStaff} 
                    onAddProduct={handleAddProduct} 
                    onAddCollaborator={handleAddCollaborator} 
                    onAddStaff={handleAddStaff} 
                    onDeleteProduct={handleDeleteProduct}
                    onDeleteCollaborator={handleDeleteCollaborator}
                    onDeleteStaff={handleDeleteStaff}
                  />
                )}
                {currentView === View.REPORTS && (
                  <Reports unit={activeUnit} movements={movements} products={products} collaborators={collaborators} stockStaff={stockStaff} />
                )}
              </>
            )}
          </div>
        </main>
      </div>
    </div>
  );
};

export default App;
