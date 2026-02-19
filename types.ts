
export type Unit = 'sede' | '506';

export interface Product {
  id: string;
  name: string;
  category: string;
  unit: string; // Unidade de medida (Litro, Unidade, etc)
  stock: number;
  location: Unit; // Unidade física (Sede ou 506)
}

export interface Collaborator {
  id: string;
  name: string;
  department: string;
  location: Unit;
}

export interface StockStaff {
  id: string;
  name: string;
  location: Unit;
}

export interface Movement {
  id: string;
  date: string;
  time: string;
  collaboratorId: string;
  productId: string;
  quantity: number;
  stockStaffId: string;
  signatureWithdrawer: string;
  signatureDeliverer: string;
  unit: Unit;
}

export interface Entry {
  id: string;
  date: string;
  time: string;
  productId: string;
  quantity: number;
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
