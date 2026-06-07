import axios from 'axios';
import type { AxiosResponse } from 'axios';
import type { Result } from '../types';

const apiClient = axios.create({
  baseURL: '/api',
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

apiClient.interceptors.response.use(
  (response: AxiosResponse<Result<any>>) => {
    const { code, message, data } = response.data;
    if (code === 200) {
      return { ...response, data } as any;
    }
    return Promise.reject(new Error(message || '请求失败'));
  },
  (error) => {
    const msg = error.response?.data?.message || error.message || '网络错误';
    return Promise.reject(new Error(msg));
  }
);

export default apiClient;
