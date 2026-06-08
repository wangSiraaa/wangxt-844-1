export interface Store {
  id: number;
  name: string;
  code: string;
  address: string;
  managerName: string;
  thresholdAmount: number;
  createdTime: string;
  updatedTime: string;
}

export interface Product {
  id: number;
  sku: string;
  name: string;
  category: string;
  unitPrice: number;
  unit: string;
}

export interface Inventory {
  id: number;
  storeId: number;
  productId: number;
  quantity: number;
  lastUpdated: string;
  version: number;
}

export type TaskStatus = 'DRAFT' | 'SUBMITTED' | 'REVIEWING' | 'REVIEWED' | 'ADJUSTED' | 'CLOSED';

export interface CountTask {
  id: number;
  storeId: number;
  taskNo: string;
  taskStatus: TaskStatus;
  totalDiffAmount: number;
  submitTime: string;
  closeTime: string;
  createdBy: string;
  remark: string;
  createdTime: string;
  updatedTime: string;
}

export interface CountRecord {
  id: number;
  taskId: number;
  productId: number;
  systemQuantity: number;
  countedQuantity: number;
  diffQuantity: number;
  diffAmount: number;
  unitPrice: number;
  readOnly: boolean;
  createdTime: string;
  updatedTime: string;
}

export interface CountTaskDetailVO {
  task: CountTask;
  records: CountRecord[];
}

export interface InventoryWithProductVO {
  id?: number;
  storeId?: number;
  productId: number;
  sku: string;
  productName: string;
  category: string;
  unitPrice: number;
  unit: string;
  systemQuantity: number;
  countedQuantity: number;
  diffQuantity: number;
  diffAmount: number;
  readOnly: boolean;
  recordId?: number;
}

export type ReviewResult = 'PENDING' | 'APPROVED' | 'REJECTED';

export interface Result<T> {
  code: number;
  message: string;
  data: T;
}
