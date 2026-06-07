import type { TaskStatus } from '../types';

export const statusMap: Record<TaskStatus, { text: string; color: string }> = {
  DRAFT: { text: '草稿', color: 'default' },
  SUBMITTED: { text: '已提交', color: 'blue' },
  REVIEWING: { text: '待复盘', color: 'orange' },
  REVIEWED: { text: '已复盘', color: 'cyan' },
  ADJUSTED: { text: '已调账', color: 'purple' },
  CLOSED: { text: '已关闭', color: 'gray' },
};

export const getStatusText = (status: TaskStatus) => statusMap[status]?.text || status;
export const getStatusColor = (status: TaskStatus) => statusMap[status]?.color || 'default';
