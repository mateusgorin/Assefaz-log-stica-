
import React from 'react';
import { 
  LayoutDashboard, 
  ArrowUpRight, 
  ArrowDownLeft,
  History, 
  Settings, 
  FileText,
  Boxes
} from 'lucide-react';
import { Product, Collaborator, StockStaff, View, Movement } from './types';

export const UNITS = [
  { id: 'sede', name: 'Sede', description: 'Administração Assefaz Sede', color: 'blue' },
  { id: '506', name: '506', description: 'Administração Assefaz 506', color: 'orange' }
];

export const MENU_ITEMS = [
  { id: View.DASHBOARD, label: 'Painel Geral', icon: <LayoutDashboard className="w-5 h-5" /> },
  { id: View.OUTFLOW, label: 'Registrar Saída', icon: <ArrowUpRight className="w-5 h-5" /> },
  { id: View.ENTRY, label: 'Entrada de Estoque', icon: <ArrowDownLeft className="w-5 h-5" /> },
  { id: View.STOCK, label: 'Estoque', icon: <Boxes className="w-5 h-5" /> },
  { id: View.HISTORY, label: 'Histórico', icon: <History className="w-5 h-5" /> },
  { id: View.MANAGEMENT, label: 'Cadastros', icon: <Settings className="w-5 h-5" /> },
  { id: View.REPORTS, label: 'Relatórios', icon: <FileText className="w-5 h-5" /> },
];

export const INITIAL_PRODUCTS: Product[] = [
  { id: '1', name: 'Desinfetante Talco (Diluído)', category: 'Químico', unit: 'Litro', stock: 50 },
  { id: '2', name: 'Água Sanitária', category: 'Químico', unit: 'Litro', stock: 30 },
  { id: '3', name: 'Pano de Chão', category: 'Utensílio', unit: 'Unidade', stock: 100 },
  { id: '4', name: 'Flanela', category: 'Utensílio', unit: 'Unidade', stock: 80 },
  { id: '5', name: 'Pasta Rosa', category: 'Químico', unit: 'Pote', stock: 15 },
  { id: '6', name: 'Lava Louça Minuano', category: 'Químico', unit: 'Frasco', stock: 40 },
  { id: '7', name: 'Detergente Gel Azulim', category: 'Químico', unit: 'Litro', stock: 25 },
  { id: '8', name: 'Álcool', category: 'Químico', unit: 'Litro', stock: 60 },
  { id: '9', name: 'Bucha', category: 'Utensílio', unit: 'Unidade', stock: 200 },
  { id: '10', name: 'Bom Ar', category: 'Químico', unit: 'Frasco', stock: 12 },
  { id: '11', name: 'Pedra Sanitária', category: 'Químico', unit: 'Unidade', stock: 45 },
  { id: '12', name: 'Barra de Sabão', category: 'Químico', unit: 'Unidade', stock: 30 },
  { id: '13', name: 'Saco de Lixo 150L', category: 'Descartável', unit: 'Pacote', stock: 20 },
  { id: '14', name: 'Saco de Lixo 100L', category: 'Descartável', unit: 'Pacote', stock: 20 },
  { id: '15', name: 'Saco de Lixo 60L', category: 'Descartável', unit: 'Pacote', stock: 20 },
  { id: '16', name: 'Saco de Lixo 40L', category: 'Descartável', unit: 'Pacote', stock: 20 },
  { id: '17', name: 'Veja Multiuso', category: 'Químico', unit: 'Frasco', stock: 25 },
  { id: '18', name: 'Bucha para LT (Verde)', category: 'Utensílio', unit: 'Unidade', stock: 50 },
  { id: '19', name: 'Papel Toalha', category: 'Descartável', unit: 'Caixa', stock: 10 },
  { id: '20', name: 'Papel Higiênico', category: 'Descartável', unit: 'Caixa', stock: 15 },
  { id: '21', name: 'Sabão em Pó 250g', category: 'Químico', unit: 'Caixa', stock: 10 },
  { id: '22', name: 'Luva Amarela', category: 'EPI', unit: 'Par', stock: 20 },
  { id: '23', name: 'Luva Azul', category: 'EPI', unit: 'Par', stock: 20 },
  { id: '24', name: 'Borrifador', category: 'Utensílio', unit: 'Unidade', stock: 30 },
  { id: '25', name: 'Removedor', category: 'Químico', unit: 'Galão', stock: 5 },
  { id: '26', name: 'Disco Verde', category: 'Utensílio', unit: 'Unidade', stock: 10 },
  { id: '27', name: 'Disco Preto', category: 'Utensílio', unit: 'Unidade', stock: 10 },
  { id: '28', name: 'Rodo', category: 'Utensílio', unit: 'Unidade', stock: 15 },
];

export const INITIAL_COLLABORATORS: Collaborator[] = [
  { id: 'c1', name: 'Janete', department: 'Térreo e Sobreloja' },
  { id: 'c2', name: 'Cleide', department: '1º Andar' },
  { id: 'c3', name: 'Laurita', department: '2º e 6º Andar' },
  { id: 'c4', name: 'Leiliane', department: '3º Andar' },
  { id: 'c5', name: 'Tatiana', department: '4º e 5º Andar' },
  { id: 'c6', name: 'Derick', department: 'Sede e Arquivo 714' },
  { id: 'c7', name: 'Copa', department: '5º Andar' },
  { id: 'c8', name: 'Refeitório', department: '6º Andar' },
];

export const INITIAL_STOCK_STAFF: StockStaff[] = [
  { id: 's1', name: 'Márcio' },
  { id: 's2', name: 'Marcus' },
  { id: 's3', name: 'Cíntia' },
  { id: 's4', name: 'Michele' },
  { id: 's5', name: 'Alex' },
];

const generateMockMovements = (): Movement[] => {
  const movements: Movement[] = [];
  const collaborators = INITIAL_COLLABORATORS;
  const products = INITIAL_PRODUCTS;
  const staff = INITIAL_STOCK_STAFF;
  const units: ('sede' | '506')[] = ['sede', '506'];
  const now = new Date();

  for (let i = 0; i < 60; i++) {
    const randomDays = Math.floor(Math.random() * 25);
    const date = new Date(now);
    date.setDate(now.getDate() - randomDays);
    
    const randomHour = Math.floor(Math.random() * 10) + 8;
    const randomMinute = Math.floor(Math.random() * 60);
    const time = `${randomHour.toString().padStart(2, '0')}:${randomMinute.toString().padStart(2, '0')}`;
    
    const col = collaborators[Math.floor(Math.random() * collaborators.length)];
    const prod = products[Math.floor(Math.random() * products.length)];
    const stf = staff[Math.floor(Math.random() * staff.length)];
    const unit = units[Math.floor(Math.random() * units.length)];
    
    movements.push({
      id: `mock-${i}`,
      date: date.toLocaleDateString('pt-br'),
      time: time,
      collaboratorId: col.id,
      productId: prod.id,
      quantity: Math.floor(Math.random() * 10) + 1,
      stockStaffId: stf.id,
      signatureWithdrawer: "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8/5+hHgAHggJ/PchI7wAAAABJRU5ErkJggg==",
      signatureDeliverer: "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8/5+hHgAHggJ/PchI7wAAAABJRU5ErkJggg==",
      unit: unit
    });
  }
  
  return movements.sort((a, b) => {
    const da = new Date(`${a.date.split('/').reverse().join('-')} ${a.time}`);
    const db = new Date(`${b.date.split('/').reverse().join('-')} ${b.time}`);
    return db.getTime() - da.getTime();
  });
};

export const INITIAL_MOVEMENTS: Movement[] = generateMockMovements();
