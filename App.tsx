
import React, { useState, useCallback, useEffect } from 'react';
import { MENU_ITEMS } from './constants';
import { Unit, View, Movement, Product, Sector, StockStaff, Entry } from './types';
import { supabase, isConfigured } from './lib/supabase';
import Dashboard from './components/Dashboard';
import OutflowForm from './components/OutflowForm';
import EntryForm from './components/EntryForm';
import History from './components/History';
import Management from './components/Management';
import Reports from './components/Reports';
import Inventory from './components/Inventory';
import { LogOut, Menu, Building2, Loader2, RefreshCw, AlertTriangle, Trash2, X, MapPin, Building, Lock, ArrowRight } from 'lucide-react';

// SENHA DE ACESSO DO SISTEMA ATUALIZADA
const ACCESS_PASSCODE = "Assefaz89";

const App: React.FC = () => {
  const [isAuthorized, setIsAuthorized] = useState(() => localStorage.getItem('assefaz_auth') === 'true');
  const [passcodeInput, setPasscodeInput] = useState('');
  const [passError, setPassError] = useState(false);
  
  const [activeUnit, setActiveUnit] = useState<Unit | null>(null);
  const [currentView, setCurrentView] = useState<View>(View.DASHBOARD);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [configured, setConfigured] = useState(isConfigured());

  const [confirmModal, setConfirmModal] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    onConfirm: () => void;
  }>({ isOpen: false, title: '', message: '', onConfirm: () => {} });

  const [products, setProducts] = useState<Product[]>([]);
  const [sectors, setSectors] = useState<Sector[]>([]);
  const [stockStaff, setStockStaff] = useState<StockStaff[]>([]);
  const [movements, setMovements] = useState<Movement[]>([]);
  const [entries, setEntries] = useState<Entry[]>([]);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (passcodeInput === ACCESS_PASSCODE) {
      localStorage.setItem('assefaz_auth', 'true');
      setIsAuthorized(true);
      setPassError(false);
    } else {
      setPassError(true);
      setPasscodeInput('');
    }
  };

  const fetchData = useCallback(async () => {
    if (!configured || !activeUnit) return;
    setLoading(true);
    try {
      const [prodsRes, secsRes, staffRes, movsRes, entsRes] = await Promise.all([
        supabase.from('products').select('*').eq('location', activeUnit).order('name'),
        supabase.from('collaborators').select('*').eq('location', activeUnit).order('name'),
        supabase.from('stock_staff').select('*').eq('location', activeUnit).order('name'),
        supabase.from('movements').select('*').eq('unit', activeUnit).order('id', { ascending: false }),
        supabase.from('entries').select('*').eq('unit', activeUnit).order('id', { ascending: false })
      ]);

      if (prodsRes.error) console.error("Erro Produtos:", prodsRes.error);
      if (secsRes.error) console.error("Erro Setores:", secsRes.error);
      if (staffRes.error) console.error("Erro Operadores:", staffRes.error);
      if (movsRes.error) console.error("Erro Movimentações:", movsRes.error);
      if (entsRes.error) console.error("Erro Entradas:", entsRes.error);

      setProducts(prodsRes.data || []);
      setSectors(secsRes.data || []);
      setStockStaff(staffRes.data || []);
      
      if (movsRes.data) {
        setMovements(movsRes.data.map(m => ({
          id: m.id,
          batchId: m.batch_id,
          date: m.date,
          time: m.time,
          sectorId: m.collaborator_id, // Usando a coluna collaborator_id para o setor
          productId: m.product_id,
          quantity: m.quantity,
          stockStaffId: m.stock_staff_id,
          signatureWithdrawer: m.signature_withdrawer,
          signatureDeliverer: m.signature_deliverer,
          unit: m.unit as Unit
        })));
      } else {
        setMovements([]);
      }

      if (entsRes.data) {
        setEntries(entsRes.data.map(e => ({
          id: e.id,
          batchId: e.batch_id,
          date: e.date,
          time: e.time,
          productId: e.product_id,
          quantity: e.quantity,
          unitPrice: e.unit_price || 0,
          stockStaffId: e.stock_staff_id,
          signature: e.signature,
          unit: e.unit as Unit
        })));
      } else {
        setEntries([]);
      }
    } catch (error) {
      console.error("Erro ao sincronizar:", error);
    } finally {
      setLoading(false);
    }
  }, [configured, activeUnit]);

  useEffect(() => {
    if (activeUnit) {
      setCurrentView(View.DASHBOARD);
    }
  }, [activeUnit]);

  useEffect(() => {
    if (configured && activeUnit && isAuthorized) {
      fetchData();
    }
  }, [configured, activeUnit, fetchData, isAuthorized]);

  const openConfirm = (title: string, message: string, onConfirm: () => void) => {
    setConfirmModal({ isOpen: true, title, message, onConfirm });
  };

  const closeConfirm = () => {
    setConfirmModal(prev => ({ ...prev, isOpen: false }));
  };

  const handleAddMovement = useCallback(async (data: { 
    items: { productId: string, quantity: number }[], 
    sectorId: string, 
    staffId: string, 
    signatureWithdrawer: string, 
    signatureDeliverer: string 
  }) => {
    if (!activeUnit) return;
    const now = new Date();
    const batchId = `OUT-${now.getTime()}`;
    
    try {
      const movementsToInsert = data.items.map(item => ({
        batch_id: batchId,
        date: now.toLocaleDateString('pt-br'),
        time: now.toLocaleTimeString('pt-br', { hour: '2-digit', minute: '2-digit' }),
        collaborator_id: data.sectorId,
        product_id: item.productId,
        quantity: item.quantity,
        stock_staff_id: data.staffId,
        signature_withdrawer: data.signatureWithdrawer,
        signature_deliverer: data.signatureDeliverer,
        unit: activeUnit
      }));

      const { error: movError } = await supabase.from('movements').insert(movementsToInsert);

      if (movError) {
        console.error("Erro ao inserir saída:", movError);
        alert(`Erro ao salvar saída: ${movError.message}\n\nVerifique se a coluna 'batch_id' existe na tabela 'movements' do seu Supabase.`);
        return;
      }

      // Update stock for each product
      for (const item of data.items) {
        const product = products.find(p => p.id === item.productId);
        if (product) {
          const newStock = Math.max(0, product.stock - item.quantity);
          await supabase.from('products').update({ stock: newStock }).eq('id', item.productId);
        }
      }
      
      await fetchData();
    } catch (err) {
      console.error("Erro inesperado na saída de estoque:", err);
    }
  }, [activeUnit, products, fetchData]);

  const handleDeleteSector = useCallback((id: string) => {
    openConfirm(
      "Excluir Setor?", 
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

  const handleAddStock = useCallback(async (data: { items: { productId: string, quantity: number, unitPrice: number }[], staffId: string, signature: string }) => {
    if (!activeUnit) return;
    const now = new Date();
    const batchId = `BATCH-${now.getTime()}`;
    
    try {
      // 1. Log the entries
      const entriesToInsert = data.items.map(item => ({
        batch_id: batchId,
        date: now.toLocaleDateString('pt-br'),
        time: now.toLocaleTimeString('pt-br', { hour: '2-digit', minute: '2-digit' }),
        product_id: item.productId,
        quantity: item.quantity,
        unit_price: item.unitPrice,
        stock_staff_id: data.staffId,
        signature: data.signature,
        unit: activeUnit
      }));

      let { error: entryError } = await supabase.from('entries').insert(entriesToInsert);

      // Fallback if columns don't exist in the database yet
      if (entryError && entryError.message.includes('column')) {
        console.warn("Colunas novas não encontradas, tentando inserção em modo de compatibilidade...");
        const fallbackEntries = data.items.map(item => ({
          date: now.toLocaleDateString('pt-br'),
          time: now.toLocaleTimeString('pt-br', { hour: '2-digit', minute: '2-digit' }),
          product_id: item.productId,
          quantity: item.quantity,
          stock_staff_id: data.staffId,
          signature: data.signature,
          unit: activeUnit
        }));
        
        const fallbackRes = await supabase.from('entries').insert(fallbackEntries);
        entryError = fallbackRes.error;
      }

      if (entryError) {
        console.error("Erro ao inserir entrada:", entryError);
        alert(`Erro do Banco de Dados: ${entryError.message}`);
        return;
      }

      // 2. Update stock for each product
      for (const item of data.items) {
        const product = products.find(p => p.id === item.productId);
        if (product) {
          const newStock = product.stock + item.quantity;
          await supabase.from('products').update({ stock: newStock }).eq('id', item.productId);
        }
      }
      
      await fetchData();
    } catch (err) {
      console.error("Erro inesperado na entrada de estoque:", err);
    }
  }, [products, activeUnit, fetchData]);

  const handleUpdateStock = useCallback(async (productId: string, newStock: number) => {
    const { error } = await supabase.from('products').update({ stock: newStock }).eq('id', productId);
    if (!error) await fetchData();
  }, [fetchData]);

  const handleAddProduct = useCallback(async (p: Omit<Product, 'id' | 'location'>) => {
    if (!activeUnit) return;
    const { error } = await supabase.from('products').insert([{ ...p, location: activeUnit }]);
    if (!error) await fetchData();
  }, [fetchData, activeUnit]);

  const handleAddSector = useCallback(async (s: Omit<Sector, 'id' | 'location'>) => {
    if (!activeUnit) return;
    let { error } = await supabase.from('collaborators').insert([{ ...s, location: activeUnit }]);
    
    // Fallback if department is still required in the database
    if (error && error.message.includes('null value in column "department"')) {
      console.warn("Coluna department é obrigatória, tentando inserção em modo de compatibilidade...");
      const fallbackRes = await supabase.from('collaborators').insert([{ ...s, location: activeUnit, department: 'Geral' }]);
      error = fallbackRes.error;
    }

    if (error) {
      console.error("Erro ao adicionar setor:", error);
      alert(`Erro ao adicionar setor: ${error.message}`);
    } else {
      await fetchData();
    }
  }, [fetchData, activeUnit]);

  const handleAddStaff = useCallback(async (s: Omit<StockStaff, 'id' | 'location'>) => {
    if (!activeUnit) return;
    const { error } = await supabase.from('stock_staff').insert([{ ...s, location: activeUnit }]);
    if (!error) await fetchData();
  }, [fetchData, activeUnit]);

  const handleDeleteMovement = useCallback((batchId: string) => {
    openConfirm("Excluir Registro?", "O histórico de saída será apagado.", async () => {
      const { error } = await supabase.from('movements').delete().or(`batch_id.eq.${batchId},id.eq.${batchId}`);
      if (!error) await fetchData();
      closeConfirm();
    });
  }, [fetchData]);

  const handleDeleteEntry = useCallback((batchId: string) => {
    openConfirm("Excluir Ficha de Entrada?", "Todos os itens deste lote serão removidos do histórico.", async () => {
      // Deleta tanto pelo batch_id quanto pelo id (caso seja registro antigo sem batch_id)
      const { error } = await supabase.from('entries').delete().or(`batch_id.eq.${batchId},id.eq.${batchId}`);
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

  // TELA DE ACESSO (Login)
  if (!isAuthorized) {
    return (
      <div className="h-screen w-screen bg-[#14213D] flex items-center justify-center p-6">
        <form onSubmit={handleLogin} className="max-w-sm w-full bg-white p-10 shadow-2xl border-t-8 border-amber-500 text-center animate-in zoom-in duration-300">
          <div className="w-16 h-16 bg-[#14213D]/10 rounded-full flex items-center justify-center mx-auto mb-6">
            <Lock className="w-8 h-8 text-[#14213D]" />
          </div>
          <h1 className="text-[22px] font-semibold text-slate-800 uppercase tracking-tighter mb-2">Acesso Restrito</h1>
          <p className="text-[13px] text-slate-400 mb-8 uppercase tracking-widest font-normal">Logística Assefaz</p>
          
          <div className="space-y-4">
            <input 
              type="password" 
              placeholder="SENHA DE ACESSO"
              value={passcodeInput}
              onChange={(e) => setPasscodeInput(e.target.value)}
              className={`w-full bg-slate-50 border ${passError ? 'border-red-500' : 'border-slate-200'} px-4 py-4 text-center text-[14px] font-normal tracking-[0.2em] focus:outline-none focus:border-[#14213D] transition-all`}
            />
            {passError && <p className="text-[13px] text-red-500 font-normal uppercase">Senha incorreta!</p>}
            <button type="submit" className="w-full bg-[#14213D] text-white py-4 font-semibold uppercase tracking-widest text-[14px] hover:bg-black transition-all flex items-center justify-center gap-2">
              Entrar no sistema <ArrowRight className="w-4 h-4" />
            </button>
          </div>
          <p className="mt-8 text-[13px] text-slate-300 uppercase tracking-widest font-normal">Uso restrito a funcionários autorizados</p>
        </form>
      </div>
    );
  }

  if (!configured) {
    return (
      <div className="h-screen w-screen bg-slate-900 flex items-center justify-center p-6">
        <div className="max-w-md w-full bg-white p-10 shadow-2xl border-t-4 border-amber-500 text-center">
          <AlertTriangle className="w-16 h-16 text-amber-500 mx-auto mb-6" />
          <h1 className="text-[22px] font-semibold text-slate-800 uppercase tracking-tighter mb-4">Configuração Pendente</h1>
          <p className="text-[14px] font-normal text-slate-500 mb-8 leading-relaxed">Conecte o sistema ao seu banco de dados Supabase.</p>
          <button onClick={() => setConfigured(isConfigured())} className="w-full bg-slate-800 text-white py-3 font-semibold uppercase tracking-widest text-[14px] hover:bg-black transition-colors">Verificar agora</button>
        </div>
      </div>
    );
  }

  if (!activeUnit) {
    return (
      <div className="flex flex-col lg:flex-row h-screen w-screen overflow-hidden">
        <div 
          className="group relative flex-1 bg-[#14213D] flex flex-col items-center justify-center p-12 cursor-pointer transition-all duration-700 hover:flex-[1.2]" 
          onClick={() => setActiveUnit('sede')}
        >
          <div className="absolute inset-0 flex items-center justify-center opacity-5 pointer-events-none transition-transform duration-700 group-hover:scale-110">
            <Building className="w-[80%] h-[80%] text-white" />
          </div>
          <div className="relative z-10 flex flex-col items-center text-center">
            <h1 className="text-white text-[32px] font-bold tracking-widest uppercase mb-4 drop-shadow-2xl">Sede</h1>
            <p className="text-white/40 text-[13px] uppercase tracking-[0.4em] mb-12 font-medium">Administração Central</p>
            <button className="bg-white text-[#14213D] px-12 py-4 font-semibold uppercase tracking-widest text-[14px] transition-all duration-300 shadow-xl group-hover:shadow-[#00000040] group-hover:-translate-y-1">
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
            <h1 className="text-white text-[32px] font-bold tracking-widest uppercase mb-4 drop-shadow-2xl">506</h1>
            <p className="text-white/40 text-[13px] uppercase tracking-[0.4em] mb-12 font-medium">Unidade de Apoio</p>
            <button className="bg-white text-[#9A4E12] px-12 py-4 font-semibold uppercase tracking-widest text-[14px] transition-all duration-300 shadow-xl group-hover:shadow-[#00000040] group-hover:-translate-y-1">
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
          <div className={`relative bg-white w-full max-sm p-8 shadow-2xl border-t-8 ${theme.confirmBorder} animate-in zoom-in duration-200`}>
            <button onClick={closeConfirm} className="absolute top-4 right-4 text-slate-300 hover:text-slate-600 transition-colors">
              <X className="w-5 h-5" />
            </button>
            <div className="flex justify-center mb-6">
              <div className={`w-16 h-16 ${theme.confirmIconBg} rounded-full flex items-center justify-center ${theme.confirmIconText}`}>
                <Trash2 className="w-8 h-8" />
              </div>
            </div>
            <h3 className="text-center text-[18px] font-semibold text-slate-800 uppercase tracking-tighter mb-2">
              {confirmModal.title}
            </h3>
            <p className="text-center text-[13px] text-slate-500 uppercase font-normal tracking-tight leading-relaxed mb-8">
              {confirmModal.message}
            </p>
            <div className="grid grid-cols-2 gap-3">
              <button 
                onClick={closeConfirm} 
                className="py-3 bg-slate-100 text-slate-600 text-[14px] font-semibold uppercase tracking-widest hover:bg-slate-200 transition-colors"
              >
                Cancelar
              </button>
              <button 
                onClick={confirmModal.onConfirm} 
                className={`py-3 ${theme.confirmBtn} text-white text-[14px] font-semibold uppercase tracking-widest transition-colors shadow-lg shadow-black/10`}
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
            <span className="font-semibold text-[18px] uppercase">Assefaz</span>
          </div>
          <p className="text-[13px] uppercase tracking-wider text-white/50 font-medium">Controle Logístico</p>
        </div>
        <nav className="flex-1 pt-6 overflow-y-auto custom-scrollbar">
          {MENU_ITEMS.map((item) => (
            <button key={item.id} onClick={() => { setCurrentView(item.id); setSidebarOpen(false); }} className={`w-full flex items-center gap-4 px-8 py-4 text-[14px] uppercase tracking-widest transition-all border-l-4 ${currentView === item.id ? `bg-white/10 ${theme.itemActiveDetail} text-white font-semibold` : 'border-transparent text-white/60 hover:text-white hover:bg-white/5 font-medium'}`}>
              {item.icon}
              <span>{item.label}</span>
            </button>
          ))}
        </nav>
        <div className="p-8 border-t border-white/5 bg-black/5 text-center">
          <p className="text-[13px] uppercase tracking-[0.3em] font-normal text-white/20">Desenvolvido por Mateus Miranda</p>
        </div>
      </aside>

      <div className="flex-1 flex flex-col overflow-hidden">
        <header className="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-4 sm:px-8 shrink-0 shadow-sm z-50">
          <div className="flex items-center gap-3">
            <button onClick={() => setSidebarOpen(true)} className="lg:hidden p-2"><Menu className="w-5 h-5 text-slate-500" /></button>
            <span className="text-[18px] font-semibold text-slate-800 uppercase flex items-center gap-2">Logística {loading && <Loader2 className="w-3 h-3 animate-spin text-slate-300" />}</span>
          </div>
          <div className="flex items-center gap-3 sm:gap-6">
            <button onClick={fetchData} className="p-2 text-slate-400 hover:text-slate-600 transition-colors" title="Sincronizar dados"><RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} /></button>
            <div className={`h-8 px-3 flex items-center justify-center text-white text-[13px] font-semibold ${theme.badgeBg}`}>{activeUnit.toUpperCase()}</div>
            <button onClick={() => setActiveUnit(null)} className="text-slate-400 hover:text-red-600 p-1" title="Sair da Unidade"><LogOut className="w-4 h-4" /></button>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-10 custom-scrollbar">
          <div className="max-w-6xl mx-auto">
            {currentView === View.DASHBOARD && <Dashboard unit={activeUnit} movements={movements} products={products} sectors={sectors} />}
            {currentView === View.OUTFLOW && <OutflowForm unit={activeUnit} products={products} sectors={sectors} stockStaff={stockStaff} onAddMovement={handleAddMovement} onNavigate={(view) => setCurrentView(view)} />}
            {currentView === View.ENTRY && <EntryForm unit={activeUnit} products={products} stockStaff={stockStaff} entries={entries} onAddStock={handleAddStock} onNavigate={(view) => setCurrentView(view)} />}
            {currentView === View.STOCK && <Inventory unit={activeUnit} products={products} onUpdateStock={handleUpdateStock} />}
            {currentView === View.HISTORY && <History unit={activeUnit} movements={movements} entries={entries} products={products} sectors={sectors} stockStaff={stockStaff} onDelete={handleDeleteMovement} onDeleteEntry={handleDeleteEntry} />}
            {currentView === View.MANAGEMENT && <Management unit={activeUnit} products={products} sectors={sectors} stockStaff={stockStaff} onAddProduct={handleAddProduct} onAddSector={handleAddSector} onAddStaff={handleAddStaff} onDeleteProduct={handleDeleteProduct} onDeleteSector={handleDeleteSector} onDeleteStaff={handleDeleteStaff} />}
            {currentView === View.REPORTS && <Reports unit={activeUnit} movements={movements} entries={entries} products={products} sectors={sectors} stockStaff={stockStaff} />}
          </div>
        </main>
      </div>
    </div>
  );
};

export default App;
