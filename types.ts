
export type Unit = 'sede' | '506';

export interface Product {
  id: string;
  name: string;
  category: string;
  unit: string; // Unidade de medida (Litro, Unidade, etc)
  stock: number;
  location: Unit; // Unidade física (Sede ou 506)
  active?: boolean;
}

export interface Sector {
  id: string;
  name: string;
  location: Unit;
  active?: boolean;
}

export interface StockStaff {
  id: string;
  name: string;
  location: Unit;
  active?: boolean;
}

export interface Movement {
  id: string;
  batchId?: string; // Identificador do lote para agrupar múltiplos itens
  date: string;
  time: string;
  sectorId: string;
  productId: string;
  quantity: number;
  stockStaffId: string;
  signatureWithdrawer: string;
  signatureDeliverer: string;
  unit: Unit;
}

export interface Entry {
  id: string;
  batchId?: string; // Identificador do lote para agrupar múltiplos itens
  date: string;
  time: string;
  productId: string;
  quantity: number;
  unitPrice: number; // Valor unitário em Reais
  stockStaffId: string;
  signature: string;
  unit: Unit;
}

export enum View {
  DASHBOARD = 'DASHBOARD',
  OUTFLOW = 'OUTFLOW',
  ENTRY = 'ENTRY',
  STOCK = 'STOCK',
  HISTORY = 'HISTORY',
  MANAGEMENT = 'MANAGEMENT',
  REPORTS = 'REPORTS'
}
