
export type Unit = 'sede' | '506';

export interface Product {
  id: string;
  name: string;
  category: string;
  unit: string;
  stock: number;
}

export interface Collaborator {
  id: string;
  name: string;
  department: string;
}

export interface StockStaff {
  id: string;
  name: string;
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

export enum View {
  DASHBOARD = 'DASHBOARD',
  OUTFLOW = 'OUTFLOW',
  ENTRY = 'ENTRY',
  STOCK = 'STOCK',
  HISTORY = 'HISTORY',
  MANAGEMENT = 'MANAGEMENT',
  REPORTS = 'REPORTS'
}
