
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
import AboutSystem from './components/AboutSystem';
import { LogOut, Menu, Building2, Loader2, RefreshCw, AlertTriangle, Trash2, X, MapPin, Building, Lock, ArrowRight, CheckCircle, AlertCircle, Info } from 'lucide-react';

// SENHA DE ACESSO DO SISTEMA ATUALIZADA
const ACCESS_PASSCODE = (import.meta as any).env.VITE_ACCESS_PASSCODE || "Assefaz89";

const App: React.FC = () => {
  const [isAuthorized, setIsAuthorized] = useState(() => localStorage.getItem('assefaz_auth') === 'true');
  const [passcodeInput, setPasscodeInput] = useState('');
  const [passError, setPassError] = useState(false);
  const [showAboutModal, setShowAboutModal] = useState(false);
  
  const [activeUnit, setActiveUnit] = useState<Unit | null>(null);
  const [currentView, setCurrentView] = useState<View>(View.DASHBOARD);
  const [historyTab, setHistoryTab] = useState<'outflows' | 'entries'>('outflows');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [configured, setConfigured] = useState(isConfigured());

  const [toast, setToast] = useState<{ show: boolean; message: string; type: 'success' | 'error' }>({
    show: false,
    message: '',
    type: 'success'
  });

  const showToast = (message: string, type: 'success' | 'error' = 'success') => {
    setToast({ show: true, message, type });
    setTimeout(() => setToast(prev => ({ ...prev, show: false })), 2000);
  };

  const [confirmModal, setConfirmModal] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    confirmText?: string;
    onConfirm: () => void;
    isSuccess?: boolean;
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

      if (prodsRes.error || secsRes.error || staffRes.error || movsRes.error || entsRes.error) {
        showToast("Erro ao sincronizar dados com o servidor.", "error");
      }

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

  const openConfirm = (title: string, message: string, onConfirm: () => void | Promise<void>, confirmText?: string) => {
    setConfirmModal({ 
      isOpen: true, 
      title, 
      message, 
      confirmText,
      isSuccess: false,
      onConfirm: async () => {
        try {
          await onConfirm();
          setConfirmModal(prev => ({ 
            ...prev, 
            isSuccess: true, 
            title: "Concluído!", 
            message: "A exclusão foi realizada com sucesso." 
          }));
          setTimeout(() => {
            closeConfirm();
          }, 1500);
        } catch (err) {
          console.error("Erro na confirmação:", err);
          showToast("Ocorreu um erro ao processar a operação.", "error");
          closeConfirm();
        }
      } 
    });
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
        showToast(`Erro ao salvar saída: ${movError.message}`, "error");
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
      showToast("Saída de estoque registrada com sucesso!");
    } catch (err) {
      console.error("Erro inesperado na saída de estoque:", err);
      showToast("Erro ao registrar saída.", "error");
    }
  }, [activeUnit, products, fetchData]);

  const handleDeleteSector = useCallback((id: string) => {
    openConfirm(
      "Excluir Setor?", 
      "Esta ação é permanente e removerá todos os registros associados.", 
      async () => {
        const { error } = await supabase.from('collaborators').delete().eq('id', id);
        if (error) {
          console.error("Erro ao excluir setor:", error);
          showToast(`Erro ao excluir: ${error.message}`, "error");
        } else {
          await fetchData();
        }
      }
    );
  }, [fetchData]);

  const handleDeleteProduct = useCallback((id: string) => {
    openConfirm(
      "Remover Produto?", 
      "O item será excluído do catálogo permanentemente.", 
      async () => {
        const { error } = await supabase.from('products').delete().eq('id', id);
        if (error) {
          console.error("Erro ao excluir produto:", error);
          showToast(`Erro ao excluir: ${error.message}`, "error");
        } else {
          await fetchData();
        }
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

      const { error: entryError } = await supabase.from('entries').insert(entriesToInsert);

      if (entryError) {
        console.error("Erro ao inserir entrada:", entryError);
        showToast(`Erro ao salvar entrada: ${entryError.message}`, "error");
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
      showToast("Entrada de estoque registrada com sucesso!");
    } catch (err) {
      console.error("Erro inesperado na entrada de estoque:", err);
      showToast("Erro ao registrar entrada.", "error");
    }
  }, [products, activeUnit, fetchData]);

  const handleUpdateStock = useCallback(async (productId: string, newStock: number) => {
    const { error } = await supabase.from('products').update({ stock: newStock }).eq('id', productId);
    if (error) {
      console.error("Erro ao atualizar estoque:", error);
      showToast(`Erro ao atualizar estoque: ${error.message}`, "error");
    } else {
      await fetchData();
      showToast("Estoque atualizado com sucesso!");
    }
  }, [fetchData]);

  const handleAddProduct = useCallback(async (p: Omit<Product, 'id' | 'location'>) => {
    if (!activeUnit) return;
    const { error } = await supabase.from('products').insert([{ ...p, location: activeUnit, active: true }]);
    if (error) {
      console.error("Erro ao adicionar produto:", error);
      showToast(`Erro ao adicionar: ${error.message}`, "error");
    } else {
      await fetchData();
      showToast("Produto adicionado com sucesso!");
    }
  }, [fetchData, activeUnit]);

  const handleUpdateProduct = useCallback(async (id: string, updates: Partial<Product>) => {
    const { error } = await supabase.from('products').update(updates).eq('id', id);
    if (error) {
      console.error("Erro ao atualizar produto:", error);
      showToast(`Erro ao atualizar: ${error.message}`, "error");
    } else {
      await fetchData();
      showToast("Produto atualizado com sucesso!");
    }
  }, [fetchData]);

  const handleAddSector = useCallback(async (s: Omit<Sector, 'id' | 'location'>) => {
    if (!activeUnit) return;
    const { error } = await supabase.from('collaborators').insert([{ ...s, location: activeUnit, active: true }]);
    if (error) {
      console.error("Erro ao adicionar setor:", error);
      showToast(`Erro ao adicionar: ${error.message}`, "error");
    } else {
      await fetchData();
      showToast("Setor adicionado com sucesso!");
    }
  }, [fetchData, activeUnit]);

  const handleUpdateSector = useCallback(async (id: string, updates: Partial<Sector>) => {
    const { error } = await supabase.from('collaborators').update(updates).eq('id', id);
    if (error) {
      console.error("Erro ao atualizar setor:", error);
      showToast(`Erro ao atualizar: ${error.message}`, "error");
    } else {
      await fetchData();
      showToast("Setor atualizado com sucesso!");
    }
  }, [fetchData]);

  const handleAddStaff = useCallback(async (s: Omit<StockStaff, 'id' | 'location'>) => {
    if (!activeUnit) return;
    const { error } = await supabase.from('stock_staff').insert([{ ...s, location: activeUnit, active: true }]);
    if (error) {
      console.error("Erro ao adicionar operador:", error);
      showToast(`Erro ao adicionar: ${error.message}`, "error");
    } else {
      await fetchData();
      showToast("Operador adicionado com sucesso!");
    }
  }, [fetchData, activeUnit]);

  const handleUpdateStaff = useCallback(async (id: string, updates: Partial<StockStaff>) => {
    const { error } = await supabase.from('stock_staff').update(updates).eq('id', id);
    if (error) {
      console.error("Erro ao atualizar operador:", error);
      showToast(`Erro ao atualizar: ${error.message}`, "error");
    } else {
      await fetchData();
      showToast("Operador atualizado com sucesso!");
    }
  }, [fetchData]);

  const handleDeleteMovement = useCallback((batchId: string) => {
    openConfirm("Excluir Registro?", "O histórico de saída será apagado e o estoque será devolvido.", async () => {
      try {
        const isNumeric = !isNaN(Number(batchId)) && !batchId.includes('-');
        
        // 1. Buscar os itens que serão deletados para reverter o estoque
        let fetchQuery;
        if (isNumeric) {
          fetchQuery = supabase.from('movements').select('product_id, quantity').eq('id', batchId);
        } else {
          fetchQuery = supabase.from('movements').select('product_id, quantity').eq('batch_id', batchId);
        }

        const { data: itemsToRevert, error: fetchError } = await fetchQuery;

        if (fetchError) {
          throw new Error(`Erro ao buscar dados para reversão: ${fetchError.message}`);
        }

        // 2. Reverter o estoque
        if (itemsToRevert) {
          for (const item of itemsToRevert) {
            const product = products.find(p => p.id === item.product_id);
            if (product) {
              const newStock = product.stock + item.quantity;
              await supabase.from('products').update({ stock: newStock }).eq('id', item.product_id);
            }
          }
        }

        // 3. Deletar os registros
        let deleteQuery;
        if (isNumeric) {
          deleteQuery = supabase.from('movements').delete().eq('id', batchId);
        } else {
          deleteQuery = supabase.from('movements').delete().eq('batch_id', batchId);
        }

        const { error: deleteError } = await deleteQuery;
        
        if (deleteError) {
          console.error("Erro ao excluir saída:", deleteError);
          showToast(`Erro ao excluir: ${deleteError.message}`, "error");
        } else {
          await fetchData();
        }
      } catch (err) {
        console.error("Erro inesperado ao excluir:", err);
        showToast("Erro ao processar a exclusão.", "error");
      }
    });
  }, [fetchData, products]);

  const handleDeleteEntry = useCallback((batchId: string) => {
    openConfirm("Excluir Ficha de Entrada?", "Todos os itens deste lote serão removidos e o estoque será subtraído.", async () => {
      try {
        const isNumeric = !isNaN(Number(batchId)) && !batchId.includes('-');
        
        // 1. Buscar os itens para reverter o estoque
        let fetchQuery;
        if (isNumeric) {
          fetchQuery = supabase.from('entries').select('product_id, quantity').eq('id', batchId);
        } else {
          fetchQuery = supabase.from('entries').select('product_id, quantity').eq('batch_id', batchId);
        }

        const { data: itemsToRevert, error: fetchError } = await fetchQuery;

        if (fetchError) {
          throw new Error(`Erro ao buscar dados para reversão: ${fetchError.message}`);
        }

        // 2. Reverter o estoque (subtrair o que entrou)
        if (itemsToRevert) {
          for (const item of itemsToRevert) {
            const product = products.find(p => p.id === item.product_id);
            if (product) {
              const newStock = Math.max(0, product.stock - item.quantity);
              await supabase.from('products').update({ stock: newStock }).eq('id', item.product_id);
            }
          }
        }

        // 3. Deletar os registros
        let deleteQuery;
        if (isNumeric) {
          deleteQuery = supabase.from('entries').delete().eq('id', batchId);
        } else {
          deleteQuery = supabase.from('entries').delete().eq('batch_id', batchId);
        }

        const { error: deleteError } = await deleteQuery;
        
        if (deleteError) {
          console.error("Erro ao excluir entrada:", deleteError);
          showToast(`Erro ao excluir: ${deleteError.message}`, "error");
        } else {
          await fetchData();
        }
      } catch (err) {
        console.error("Erro inesperado ao excluir:", err);
        showToast("Erro ao processar a exclusão.", "error");
      }
    });
  }, [fetchData, products]);

  const handleDeleteStaff = useCallback((id: string) => {
    openConfirm("Remover Operador?", "Ele não aparecerá mais nas listas de entrega.", async () => {
      const { error } = await supabase.from('stock_staff').delete().eq('id', id);
      if (error) {
        console.error("Erro ao excluir operador:", error);
        showToast(`Erro ao excluir: ${error.message}`, "error");
      } else {
        await fetchData();
      }
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
          <h1 className="text-[20px] font-semibold text-slate-800 uppercase tracking-tighter mb-2">Acesso Restrito</h1>
          <p className="text-[11px] text-slate-400 mb-8 uppercase tracking-widest font-normal">Logística Assefaz</p>
          
          <div className="space-y-4">
            <input 
              type="password" 
              placeholder="SENHA DE ACESSO"
              value={passcodeInput}
              onChange={(e) => setPasscodeInput(e.target.value)}
              className={`w-full bg-slate-50 border ${passError ? 'border-red-500' : 'border-slate-200'} px-4 py-4 text-center text-[12px] font-normal tracking-[0.2em] focus:outline-none focus:border-[#14213D] transition-all`}
            />
            {passError && <p className="text-[11px] text-red-500 font-normal uppercase">Senha incorreta!</p>}
            <button type="submit" className="w-full bg-[#14213D] text-white py-4 font-semibold uppercase tracking-widest text-[12px] hover:bg-black transition-all flex items-center justify-center gap-2">
              Entrar no sistema <ArrowRight className="w-4 h-4" />
            </button>
          </div>
          <p className="mt-8 text-[11px] text-slate-300 uppercase tracking-widest font-normal">Uso restrito a funcionários autorizados</p>
          
          <button 
            type="button"
            onClick={() => setShowAboutModal(true)}
            className="mt-6 flex items-center justify-center gap-2 text-[10px] text-slate-400 uppercase tracking-widest hover:text-amber-600 transition-colors mx-auto"
          >
            <Info className="w-3 h-3" /> Saiba mais sobre o sistema
          </button>

          {showAboutModal && <AboutSystem isModal onClose={() => setShowAboutModal(false)} />}
        </form>
      </div>
    );
  }

  if (!configured) {
    return (
      <div className="h-screen w-screen bg-slate-900 flex items-center justify-center p-6">
        <div className="max-w-md w-full bg-white p-10 shadow-2xl border-t-4 border-amber-500 text-center">
          <AlertTriangle className="w-16 h-16 text-amber-500 mx-auto mb-6" />
          <h1 className="text-[20px] font-semibold text-slate-800 uppercase tracking-tighter mb-4">Configuração Pendente</h1>
          <p className="text-[12px] font-normal text-slate-500 mb-8 leading-relaxed">Conecte o sistema ao seu banco de dados Supabase.</p>
          <button onClick={() => setConfigured(isConfigured())} className="w-full bg-slate-800 text-white py-3 font-semibold uppercase tracking-widest text-[12px] hover:bg-black transition-colors">Verificar agora</button>
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
            <h1 className="text-white text-[30px] font-bold tracking-widest uppercase mb-4 drop-shadow-2xl">Sede</h1>
            <p className="text-white/40 text-[11px] uppercase tracking-[0.4em] mb-12 font-medium">Administração Central</p>
            <button className="bg-white text-[#14213D] px-12 py-4 font-semibold uppercase tracking-widest text-[12px] transition-all duration-300 shadow-xl group-hover:shadow-[#00000040] group-hover:-translate-y-1">
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
            <h1 className="text-white text-[30px] font-bold tracking-widest uppercase mb-4 drop-shadow-2xl">506</h1>
            <p className="text-white/40 text-[11px] uppercase tracking-[0.4em] mb-12 font-medium">Unidade de Apoio</p>
            <button className="bg-white text-[#9A4E12] px-12 py-4 font-semibold uppercase tracking-widest text-[12px] transition-all duration-300 shadow-xl group-hover:shadow-[#00000040] group-hover:-translate-y-1">
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
      {/* TOAST NOTIFICATION */}
      {toast.show && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 pointer-events-none">
          <div className={`flex flex-col items-center gap-4 px-10 py-8 shadow-2xl border-t-8 animate-in zoom-in duration-300 pointer-events-auto ${toast.type === 'success' ? 'bg-white border-green-500 text-slate-800' : 'bg-white border-red-500 text-red-800'}`}>
            <div className={`w-16 h-16 rounded-full flex items-center justify-center ${toast.type === 'success' ? 'bg-green-50 text-green-500' : 'bg-red-50 text-red-500'}`}>
              {toast.type === 'success' ? <CheckCircle className="w-10 h-10" /> : <AlertCircle className="w-10 h-10" />}
            </div>
            <p className="text-[14px] font-bold uppercase tracking-[0.2em] text-center max-w-xs">{toast.message}</p>
          </div>
        </div>
      )}

      {confirmModal.isOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6">
          <div className="absolute inset-0 bg-slate-900/80 backdrop-blur-sm" onClick={closeConfirm} />
          <div className={`relative bg-white w-full max-w-sm p-8 shadow-2xl border-t-8 ${confirmModal.isSuccess ? 'border-green-500' : theme.confirmBorder} animate-in zoom-in duration-200`}>
            {!confirmModal.isSuccess && (
              <button onClick={closeConfirm} className="absolute top-4 right-4 text-slate-300 hover:text-slate-600 transition-colors">
                <X className="w-5 h-5" />
              </button>
            )}
            <div className="flex justify-center mb-6">
              <div className={`w-16 h-16 ${confirmModal.isSuccess ? 'bg-green-50 text-green-500' : theme.confirmIconBg} rounded-full flex items-center justify-center ${confirmModal.isSuccess ? '' : theme.confirmIconText}`}>
                {confirmModal.isSuccess ? <CheckCircle className="w-8 h-8" /> : <Trash2 className="w-8 h-8" />}
              </div>
            </div>
            <h3 className={`text-center text-[16px] font-semibold uppercase tracking-tighter mb-2 ${confirmModal.isSuccess ? 'text-green-600' : 'text-slate-800'}`}>
              {confirmModal.title}
            </h3>
            <p className="text-center text-[11px] text-slate-500 uppercase font-normal tracking-tight leading-relaxed mb-8">
              {confirmModal.message}
            </p>
            {!confirmModal.isSuccess && (
              <div className="grid grid-cols-2 gap-3">
                <button 
                  onClick={closeConfirm} 
                  className="py-3 bg-slate-100 text-slate-600 text-[12px] font-semibold uppercase tracking-widest hover:bg-slate-200 transition-colors"
                >
                  Cancelar
                </button>
                <button 
                  onClick={confirmModal.onConfirm} 
                  className={`py-3 ${theme.confirmBtn} text-white text-[12px] font-semibold uppercase tracking-widest transition-colors shadow-lg shadow-black/10`}
                >
                  {confirmModal.confirmText || "Sim, Confirmar"}
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {sidebarOpen && <div className="fixed inset-0 bg-black/60 z-[60] lg:hidden backdrop-blur-sm" onClick={() => setSidebarOpen(false)} />}

      <aside className={`fixed lg:static inset-y-0 left-0 z-[70] w-72 ${theme.menuBg} text-white flex flex-col transform ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'} lg:translate-x-0 transition-transform duration-300`}>
        <div className="p-8 border-b border-white/5">
          <div className="flex items-center gap-3 mb-2">
            <Building2 className="w-6 h-6" />
            <span className="font-semibold text-[16px] uppercase">Assefaz</span>
          </div>
          <p className="text-[11px] uppercase tracking-wider text-white/50 font-medium">Controle Logístico</p>
        </div>
        <nav className="flex-1 pt-6 overflow-y-auto custom-scrollbar">
          {MENU_ITEMS.map((item) => (
            <button key={item.id} onClick={() => { setCurrentView(item.id); setSidebarOpen(false); }} className={`w-full flex items-center gap-4 px-8 py-4 text-[12px] uppercase tracking-widest transition-all border-l-4 ${currentView === item.id ? `bg-white/10 ${theme.itemActiveDetail} text-white font-semibold` : 'border-transparent text-white/60 hover:text-white hover:bg-white/5 font-medium'}`}>
              {item.icon}
              <span>{item.label}</span>
            </button>
          ))}
        </nav>
        <div className="p-8 border-t border-white/5 bg-black/5 text-center">
          <a href="https://wa.me/5561981290099?text=Ol%C3%A1%20Mateus%2C%20tenho%20uma%20d%C3%BAvida%20quanto%20ao%20sistema%20de%20controle%20log%C3%ADstico." target="_blank" rel="noopener noreferrer" className="text-[10px] uppercase tracking-[0.3em] font-normal text-white/20 hover:text-white/40 transition-colors block">Desenvolvido por Mateus Miranda</a>
        </div>
      </aside>

      <div className="flex-1 flex flex-col overflow-hidden">
        <header className="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-4 sm:px-8 shrink-0 shadow-sm z-50">
          <div className="flex items-center gap-3">
            <button onClick={() => setSidebarOpen(true)} className="lg:hidden p-2"><Menu className="w-5 h-5 text-slate-500" /></button>
            <span className="text-[16px] font-semibold text-slate-800 uppercase flex items-center gap-2">Logística {loading && <Loader2 className="w-3 h-3 animate-spin text-slate-300" />}</span>
          </div>
          <div className="flex items-center gap-3 sm:gap-6">
            <button onClick={fetchData} className="p-2 text-slate-400 hover:text-slate-600 transition-colors" title="Sincronizar dados"><RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} /></button>
            <div className={`h-8 px-3 flex items-center justify-center text-white text-[11px] font-semibold ${theme.badgeBg}`}>{activeUnit.toUpperCase()}</div>
            <button onClick={() => setActiveUnit(null)} className="text-slate-400 hover:text-red-600 p-1" title="Sair da Unidade"><LogOut className="w-4 h-4" /></button>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-10 custom-scrollbar">
          <div className="max-w-6xl mx-auto">
            {currentView === View.DASHBOARD && <Dashboard unit={activeUnit} movements={movements} products={products} sectors={sectors} />}
            {currentView === View.OUTFLOW && <OutflowForm unit={activeUnit} products={products} sectors={sectors} stockStaff={stockStaff} onAddMovement={handleAddMovement} onNavigate={(view) => { setCurrentView(view); setHistoryTab('outflows'); }} showToast={showToast} />}
            {currentView === View.ENTRY && <EntryForm unit={activeUnit} products={products} stockStaff={stockStaff} entries={entries} onAddStock={handleAddStock} onNavigate={(view) => { setCurrentView(view); setHistoryTab('entries'); }} showToast={showToast} />}
            {currentView === View.STOCK && <Inventory unit={activeUnit} products={products} onUpdateStock={handleUpdateStock} showToast={showToast} />}
            {currentView === View.HISTORY && <History unit={activeUnit} movements={movements} entries={entries} products={products} sectors={sectors} stockStaff={stockStaff} onDelete={handleDeleteMovement} onDeleteEntry={handleDeleteEntry} initialTab={historyTab} />}
            {currentView === View.MANAGEMENT && <Management unit={activeUnit} products={products} sectors={sectors} stockStaff={stockStaff} onAddProduct={handleAddProduct} onAddSector={handleAddSector} onAddStaff={handleAddStaff} onDeleteProduct={handleDeleteProduct} onDeleteSector={handleDeleteSector} onDeleteStaff={handleDeleteStaff} onUpdateProduct={handleUpdateProduct} onUpdateSector={handleUpdateSector} onUpdateStaff={handleUpdateStaff} openConfirm={openConfirm} />}
            {currentView === View.REPORTS && <Reports unit={activeUnit} movements={movements} entries={entries} products={products} sectors={sectors} stockStaff={stockStaff} showToast={showToast} />}
            {currentView === View.ABOUT && <AboutSystem />}
          </div>
        </main>
      </div>
    </div>
  );
};

export default App;
