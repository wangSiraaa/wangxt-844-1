import apiClient from './client';
import type { Store, Product, Inventory, CountTask, CountTaskDetailVO, TaskStatus, ReviewResult } from '../types';

export const storeApi = {
  getAll: () => apiClient.get<any, Store[]>('/stores'),
  getById: (id: number) => apiClient.get<any, Store>(`/stores/${id}`),
  updateThreshold: (id: number, threshold: number) =>
    apiClient.put<any, Store>(`/stores/${id}/threshold?threshold=${threshold}`),
};

export const productApi = {
  getAll: () => apiClient.get<any, Product[]>('/products'),
  getById: (id: number) => apiClient.get<any, Product>(`/products/${id}`),
};

export const inventoryApi = {
  getByStoreId: (storeId: number) => apiClient.get<any, Inventory[]>(`/inventory?storeId=${storeId}`),
  get: (storeId: number, productId: number) => apiClient.get<any, Inventory>(`/inventory/${storeId}/${productId}`),
};

export const countTaskApi = {
  getList: (params: { storeId?: number; status?: TaskStatus }) =>
    apiClient.get<any, CountTask[]>('/count-tasks', { params }),
  getDetail: (taskId: number) => apiClient.get<any, CountTaskDetailVO>(`/count-tasks/${taskId}`),
  create: (data: { storeId: number; createdBy?: string; remark?: string }) =>
    apiClient.post<any, CountTask>('/count-tasks', data),
  updateRecord: (data: { recordId: number; countedQuantity: number }) =>
    apiClient.put<any, any>('/count-tasks/records', data),
  submit: (taskId: number) => apiClient.post<any, CountTask>(`/count-tasks/${taskId}/submit`),
  review: (data: { taskId: number; reviewer: string; reviewResult: ReviewResult; reviewComment?: string }) =>
    apiClient.post<any, CountTask>('/count-tasks/review', data),
  adjust: (data: { taskId: number; operator: string; remark?: string }) =>
    apiClient.post<any, CountTask>('/count-tasks/adjust', data),
  close: (taskId: number) => apiClient.post<any, CountTask>(`/count-tasks/${taskId}/close`),
};
