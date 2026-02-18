
import React, { useState, useCallback, useEffect } from 'react';
import { MENU_ITEMS } from './constants.tsx';
import { Unit, View, Movement, Product, Collaborator, StockStaff } from './types.ts';
import { supabase, isConfigured } from './lib/supabase.ts';
import Dashboard from './components/Dashboard.tsx';
import OutflowForm from './components/OutflowForm.tsx';
import EntryForm from './components/EntryForm.tsx';
import History from './components/History.tsx';
import Management from './components/Management.tsx';
import Reports from './components/Reports.tsx';
import Inventory from './components/Inventory.tsx';
import { LogOut, Menu, Building2, Loader2, RefreshCw, AlertTriangle, Trash2, X, MapPin, Building, Smartphone } from 'lucide-react';

const App: React.FC = () => {
  const [activeUnit, setActiveUnit] = useState<Unit | null>(null);
  const [currentView, setCurrentView] = useState<View>(View.DASHBOARD);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [configured, setConfigured] = useState(isConfigured());
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);

  const [confirmModal, setConfirmModal] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    onConfirm: () => void;
  }>({ isOpen: false, title: '', message: '', onConfirm: () => {} });

  const [products, setProducts] = useState<Product[]>([]);
  const [collaborators, setCollaborators] = useState<Collaborator[]>([]);
  const [stockStaff, setStockStaff] = useState<StockStaff[]>([]);
  const [movements, setMovements] = useState<Movement[]>([]);

  // Lógica para capturar evento de instalação do PWA
  useEffect(() => {
    window.addEventListener('beforeinstallprompt', (e) => {
      e.preventDefault();
      setDeferredPrompt(e);
    });

    window.addEventListener('appinstalled', () => {
      setDeferredPrompt(null);
      console.log('App instalado com sucesso!');
    });
  }, []);

  const handleInstallClick = async () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === 'accepted') {
      setDeferredPrompt(null);
    }
  };

  const fetchData = useCallback(async () => {
    if (!configured || !activeUnit) return;
    setLoading(true);
    try {
      const [prods, cols, staff, movs] = await Promise.all([
        supabase.from('products').select('*').eq('location', activeUnit).order('name'),
        supabase.from('collaborators').select('*').eq('location', activeUnit).order('name'),
        supabase.from('stock_staff').select('*').eq('location', activeUnit).order('name'),
        supabase.from('movements').select('*').eq('unit', activeUnit).order('created_at', { ascending: false })
      ]);

      setProducts(prods.data || []);
      setCollaborators(cols.data || []);
      setStockStaff(staff.data || []);
      
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
          signatureDeliverer: m.signature_deliverer,
          unit: m.unit as Unit
        }));
        setMovements(formattedMovs);
      } else {
        setMovements([]);
      }
    } catch (error) {
      console.error("Erro ao sincronizar:", error);
    } finally {
      setLoading(false);
    }
  }, [configured, activeUnit]);

  useEffect(() => {
    if (configured && activeUnit) {
      fetchData();
    }
  }, [configured, activeUnit, fetchData]);

  const openConfirm = (title: string, message: string, onConfirm: () => void) => {
    setConfirmModal({ isOpen: true, title, message, onConfirm });
  };

  const closeConfirm = () => {
    setConfirmModal(prev => ({ ...prev, isOpen: false }));
  };

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
      console.error(error);
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

  const handleDeleteCollaborator = useCallback((id: string) => {
    openConfirm(
      "Excluir Colaboradora?", 
      "Esta ação é permanente e removerá todos os registros associados.", 
      async () => {
        const { error } = await supabase.from('collaborators').delete().eq('id', id);
        if (!error) await fetchData();
        closeConfirm();
      }
    );
  }, [fetchData]);

  const handleDeleteProduct = useCallback((id: string) => {
    openConfirm(
      "Remover Produto?", 
      "O item será excluído do catálogo permanentemente.", 
      async () => {
        const { error } = await supabase.from('products').delete().eq('id', id);
        if (!error) await fetchData();
        closeConfirm();
      }
    );
  }, [fetchData]);

  const handleAddStock = useCallback(async (productId: string, quantity: number) => {
    const product = products.find(p => p.id === productId);
    if (product) {
      const newStock = product.stock + quantity;
      const { error } = await supabase.from('products').update({ stock: newStock }).eq('id', productId);
      if (!error) await fetchData();
    }
  }, [products, fetchData]);

  const handleAddProduct = useCallback(async (p: Omit<Product, 'id' | 'location'>) => {
    if (!activeUnit) return;
    const { error } = await supabase.from('products').insert([{ ...p, location: activeUnit }]);
    if (!error) await fetchData();
  }, [fetchData, activeUnit]);

  const handleAddCollaborator = useCallback(async (c: Omit<Collaborator, 'id' | 'location'>) => {
    if (!activeUnit) return;
    const { error } = await supabase.from('collaborators').insert([{ ...c, location: activeUnit }]);
    if (!error) await fetchData();
  }, [fetchData, activeUnit]);

  const handleAddStaff = useCallback(async (s: Omit<StockStaff, 'id' | 'location'>) => {
    if (!activeUnit) return;
    const { error } = await supabase.from('stock_staff').insert([{ ...s, location: activeUnit }]);
    if (!error) await fetchData();
  }, [fetchData, activeUnit]);

  const handleDeleteMovement = useCallback((id: string) => {
    openConfirm("Excluir Registro?", "O histórico de saída será apagado.", async () => {
      const { error } = await supabase.from('movements').delete().eq('id', id);
      if (!error) await fetchData();
      closeConfirm();
    });
  }, [fetchData]);

  const handleDeleteStaff = useCallback((id: string) => {
    openConfirm("Remover Operador?", "Ele não aparecerá mais nas listas de entrega.", async () => {
      const { error } = await supabase.from('stock_staff').delete().eq('id', id);
      if (!error) await fetchData();
      closeConfirm();
    });
  }, [fetchData]);

  if (!configured) {
    return (
      <div className="h-screen w-screen bg-slate-900 flex items-center justify-center p-6">
        <div className="max-w-md w-full bg-white p-10 shadow-2xl border-t-4 border-amber-500 text-center">
          <AlertTriangle className="w-16 h-16 text-amber-500 mx-auto mb-6" />
          <h1 className="text-xl font-bold text-slate-800 uppercase tracking-tighter mb-4">Configuração Pendente</h1>
          <p className="text-sm text-slate-500 mb-8 leading-relaxed">Conecte o sistema ao seu banco de dados Supabase.</p>
          <button onClick={() => setConfigured(isConfigured())} className="w-full bg-slate-800 text-white py-3 font-bold uppercase tracking-widest text-[10px] hover:bg-black transition-colors">Verificar agora</button>
        </div>
      </div>
    );
  }

  if (!activeUnit) {
    return (
      <div className="flex flex-col lg:flex-row h-screen w-screen overflow-hidden">
        {/* Banner de Instalação PWA */}
        {deferredPrompt && (
          <div className="fixed top-0 left-0 w-full z-[100] bg-emerald-600 text-white p-4 flex items-center justify-between shadow-2xl animate-in slide-in-from-top duration-500">
            <div className="flex items-center gap-3">
              <Smartphone className="w-5 h-5" />
              <p className="text-[10px] sm:text-xs font-bold uppercase tracking-widest">Deseja instalar como aplicativo?</p>
            </div>
            <div className="flex gap-2">
              <button onClick={() => setDeferredPrompt(null)} className="px-3 py-1 text-[9px] uppercase font-bold border border-white/20">Agora não</button>
              <button onClick={handleInstallClick} className="px-4 py-1 bg-white text-emerald-600 text-[9px] uppercase font-black">Instalar</button>
            </div>
          </div>
        )}

        <div 
          className="group relative flex-1 bg-[#14213D] flex flex-col items-center justify-center p-12 cursor-pointer transition-all duration-700 hover:flex-[1.2]" 
          onClick={() => setActiveUnit('sede')}
        >
          <div className="absolute inset-0 flex items-center justify-center opacity-5 pointer-events-none transition-transform duration-700 group-hover:scale-110">
            <Building className="w-[80%] h-[80%] text-white" />
          </div>
          <div className="relative z-10 flex flex-col items-center text-center">
            <h1 className="text-white text-4xl sm:text-5xl font-black tracking-widest uppercase mb-4 drop-shadow-2xl">Sede</h1>
            <p className="text-white/40 text-[10px] uppercase tracking-[0.4em] mb-12 font-bold">Administração Central</p>
            <button className="bg-white text-[#14213D] px-12 py-4 font-black uppercase tracking-widest text-xs transition-all duration-300 shadow-xl group-hover:shadow-[#00000040] group-hover:-translate-y-1">
              Acessar unidade
            </button>
          </div>
        </div>

        <div 
          className="group relative flex-1 bg-[#9A4E12] flex flex-col items-center justify-center p-12 cursor-pointer transition-all duration-700 hover:flex-[1.2]" 
          onClick={() => setActiveUnit('506')}
        >
          <div className="absolute inset-0 flex items-center justify-center opacity-5 pointer-events-none transition-transform duration-700 group-hover:scale-110">
            <MapPin className="w-[80%] h-[80%] text-white" />
          </div>
          <div className="relative z-10 flex flex-col items-center text-center">
            <h1 className="text-white text-4xl sm:text-5xl font-black tracking-widest uppercase mb-4 drop-shadow-2xl">506</h1>
            <p className="text-white/40 text-[10px] uppercase tracking-[0.4em] mb-12 font-bold">Unidade de Apoio</p>
            <button className="bg-white text-[#9A4E12] px-12 py-4 font-black uppercase tracking-widest text-xs transition-all duration-300 shadow-xl group-hover:shadow-[#00000040] group-hover:-translate-y-1">
              Acessar unidade
            </button>
          </div>
        </div>
      </div>
    );
  }

  const theme = {
    menuBg: activeUnit === 'sede' ? 'bg-[#14213D]' : 'bg-[#9A4E12]',
    itemActiveDetail: activeUnit === 'sede' ? 'border-[#B45309]' : 'border-[#14213D]',
    badgeBg: activeUnit === 'sede' ? 'bg-[#14213D]' : 'bg-[#9A4E12]',
    confirmBorder: activeUnit === 'sede' ? 'border-[#14213D]' : 'border-[#9A4E12]',
    confirmIconBg: activeUnit === 'sede' ? 'bg-[#14213D]/10' : 'bg-[#9A4E12]/10',
    confirmIconText: activeUnit === 'sede' ? 'text-[#14213D]' : 'text-[#9A4E12]',
    confirmBtn: activeUnit === 'sede' ? 'bg-[#14213D] hover:bg-[#1c2e55]' : 'bg-[#9A4E12] hover:bg-[#b35a15]',
  };

  return (
    <div className="flex h-screen bg-[#F4F6F8]">
      {confirmModal.isOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6">
          <div className="absolute inset-0 bg-slate-900/80 backdrop-blur-sm" onClick={closeConfirm} />
          <div className={`relative bg-white w-full max-w-sm p-8 shadow-2xl border-t-8 ${theme.confirmBorder} animate-in zoom-in duration-200`}>
            <button onClick={closeConfirm} className="absolute top-4 right-4 text-slate-300 hover:text-slate-600 transition-colors">
              <X className="w-5 h-5" />
            </button>
            <div className="flex justify-center mb-6">
              <div className={`w-16 h-16 ${theme.confirmIconBg} rounded-full flex items-center justify-center ${theme.confirmIconText}`}>
                <Trash2 className="w-8 h-8" />
              </div>
            </div>
            <h3 className="text-center text-lg font-black text-slate-800 uppercase tracking-tighter mb-2">
              {confirmModal.title}
            </h3>
            <p className="text-center text-[10px] text-slate-500 uppercase font-bold tracking-tight leading-relaxed mb-8">
              {confirmModal.message}
            </p>
            <div className="grid grid-cols-2 gap-3">
              <button 
                onClick={closeConfirm} 
                className="py-3 bg-slate-100 text-slate-600 text-[10px] font-bold uppercase tracking-widest hover:bg-slate-200 transition-colors"
              >
                Cancelar
              </button>
              <button 
                onClick={confirmModal.onConfirm} 
                className={`py-3 ${theme.confirmBtn} text-white text-[10px] font-bold uppercase tracking-widest transition-colors shadow-lg shadow-black/10`}
              >
                Sim, Apagar
              </button>
            </div>
          </div>
        </div>
      )}

      {sidebarOpen && <div className="fixed inset-0 bg-black/60 z-[60] lg:hidden backdrop-blur-sm" onClick={() => setSidebarOpen(false)} />}

      <aside className={`fixed lg:static inset-y-0 left-0 z-[70] w-72 ${theme.menuBg} text-white flex flex-col transform ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'} lg:translate-x-0 transition-transform duration-300`}>
        <div className="p-8 border-b border-white/5">
          <div className="flex items-center gap-3 mb-2">
            <Building2 className="w-6 h-6" />
            <span className="font-bold text-lg uppercase">Assefaz</span>
          </div>
          <p className="text-[9px] uppercase tracking-wider text-white/50 font-semibold">Controle Logístico</p>
        </div>
        <nav className="flex-1 pt-6 overflow-y-auto custom-scrollbar">
          {MENU_ITEMS.map((item) => (
            <button key={item.id} onClick={() => { setCurrentView(item.id); setSidebarOpen(false); }} className={`w-full flex items-center gap-4 px-8 py-4 text-[11px] uppercase tracking-widest transition-all border-l-4 ${currentView === item.id ? `bg-white/10 ${theme.itemActiveDetail} text-white font-bold` : 'border-transparent text-white/60 hover:text-white hover:bg-white/5'}`}>
              {item.icon}
              <span>{item.label}</span>
            </button>
          ))}
        </nav>
        <div className="p-8 border-t border-white/5 bg-black/5 text-center">
          <p className="text-[8px] uppercase tracking-[0.3em] font-medium text-white/30">Desenvolvido por Mateus Miranda</p>
        </div>
      </aside>

      <div className="flex-1 flex flex-col overflow-hidden">
        <header className="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-4 sm:px-8 shrink-0 shadow-sm z-50">
          <div className="flex items-center gap-3">
            <button onClick={() => setSidebarOpen(true)} className="lg:hidden p-2"><Menu className="w-5 h-5 text-slate-500" /></button>
            <span className="text-sm font-bold text-slate-800 uppercase flex items-center gap-2">Logística {loading && <Loader2 className="w-3 h-3 animate-spin text-slate-300" />}</span>
          </div>
          <div className="flex items-center gap-3 sm:gap-6">
            <button onClick={fetchData} className="p-2 text-slate-400 hover:text-slate-600 transition-colors" title="Sincronizar dados"><RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} /></button>
            <div className={`h-8 px-3 flex items-center justify-center text-white text-[10px] font-bold ${theme.badgeBg}`}>{activeUnit.toUpperCase()}</div>
            <button onClick={() => setActiveUnit(null)} className="text-slate-400 hover:text-red-600 p-1" title="Sair da Unidade"><LogOut className="w-4 h-4" /></button>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-10 custom-scrollbar">
          <div className="max-w-6xl mx-auto">
            {currentView === View.DASHBOARD && <Dashboard unit={activeUnit} movements={movements} products={products} collaborators={collaborators} />}
            {currentView === View.OUTFLOW && <OutflowForm unit={activeUnit} products={products} collaborators={collaborators} stockStaff={stockStaff} onAddMovement={handleAddMovement} onNavigate={(view) => setCurrentView(view)} />}
            {currentView === View.ENTRY && <EntryForm unit={activeUnit} products={products} stockStaff={stockStaff} onAddStock={handleAddStock} onNavigate={(view) => setCurrentView(view)} />}
            {currentView === View.STOCK && <Inventory unit={activeUnit} products={products} />}
            {currentView === View.HISTORY && <History unit={activeUnit} movements={movements} products={products} collaborators={collaborators} stockStaff={stockStaff} onDelete={handleDeleteMovement} />}
            {currentView === View.MANAGEMENT && <Management unit={activeUnit} products={products} collaborators={collaborators} stockStaff={stockStaff} onAddProduct={handleAddProduct} onAddCollaborator={handleAddCollaborator} onAddStaff={handleAddStaff} onDeleteProduct={handleDeleteProduct} onDeleteCollaborator={handleDeleteCollaborator} onDeleteStaff={handleDeleteStaff} />}
            {currentView === View.REPORTS && <Reports unit={activeUnit} movements={movements} products={products} collaborators={collaborators} stockStaff={stockStaff} />}
          </div>
        </main>
      </div>
    </div>
  );
};

export default App;
