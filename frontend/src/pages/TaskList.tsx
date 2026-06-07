import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Table, Button, Select, Tag, Space, Card, message } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import { PlusOutlined, EyeOutlined } from '@ant-design/icons';
import { countTaskApi, storeApi } from '../api';
import type { CountTask, Store, TaskStatus } from '../types';
import { getStatusText, getStatusColor } from '../utils/status';
import dayjs from 'dayjs';

const TaskList: React.FC = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [tasks, setTasks] = useState<CountTask[]>([]);
  const [stores, setStores] = useState<Store[]>([]);
  const [selectedStore, setSelectedStore] = useState<number | undefined>();
  const [selectedStatus, setSelectedStatus] = useState<TaskStatus | undefined>();

  useEffect(() => {
    loadStores();
  }, []);

  useEffect(() => {
    loadTasks();
  }, [selectedStore, selectedStatus]);

  const loadStores = async () => {
    try {
      const data = await storeApi.getAll();
      setStores(data);
    } catch (e: any) {
      message.error(e.message);
    }
  };

  const loadTasks = async () => {
    setLoading(true);
    try {
      const params: { storeId?: number; status?: TaskStatus } = {};
      if (selectedStore) params.storeId = selectedStore;
      if (selectedStatus) params.status = selectedStatus;
      const data = await countTaskApi.getList(params);
      setTasks(data);
    } catch (e: any) {
      message.error(e.message);
    } finally {
      setLoading(false);
    }
  };

  const getStoreName = (storeId: number) => {
    return stores.find((s) => s.id === storeId)?.name || '-';
  };

  const columns: ColumnsType<CountTask> = [
    {
      title: '任务编号',
      dataIndex: 'taskNo',
      key: 'taskNo',
      width: 180,
    },
    {
      title: '门店',
      dataIndex: 'storeId',
      key: 'storeId',
      width: 120,
      render: (storeId) => getStoreName(storeId),
    },
    {
      title: '状态',
      dataIndex: 'taskStatus',
      key: 'taskStatus',
      width: 100,
      render: (status: TaskStatus) => (
        <Tag color={getStatusColor(status)}>{getStatusText(status)}</Tag>
      ),
    },
    {
      title: '总差异金额',
      dataIndex: 'totalDiffAmount',
      key: 'totalDiffAmount',
      width: 140,
      render: (val) => <span className={val > 0 ? 'diff-negative' : ''}>¥{val?.toFixed(2)}</span>,
    },
    {
      title: '创建人',
      dataIndex: 'createdBy',
      key: 'createdBy',
      width: 100,
    },
    {
      title: '创建时间',
      dataIndex: 'createdTime',
      key: 'createdTime',
      width: 180,
      render: (val) => dayjs(val).format('YYYY-MM-DD HH:mm:ss'),
    },
    {
      title: '备注',
      dataIndex: 'remark',
      key: 'remark',
      ellipsis: true,
    },
    {
      title: '操作',
      key: 'action',
      width: 120,
      render: (_, record) => (
        <Space>
          <Button
            type="link"
            icon={<EyeOutlined />}
            onClick={() => navigate(`/tasks/${record.id}`)}
          >
            详情
          </Button>
        </Space>
      ),
    },
  ];

  return (
    <div>
      <Card
        title="盘点任务列表"
        extra={
          <Button type="primary" icon={<PlusOutlined />} onClick={() => navigate('/create')}>
            新建盘点
          </Button>
        }
      >
        <Space style={{ marginBottom: 16 }}>
          <Select
            placeholder="选择门店"
            style={{ width: 180 }}
            allowClear
            value={selectedStore}
            onChange={setSelectedStore}
          >
            {stores.map((store) => (
              <Select.Option key={store.id} value={store.id}>
                {store.name}
              </Select.Option>
            ))}
          </Select>
          <Select
            placeholder="选择状态"
            style={{ width: 150 }}
            allowClear
            value={selectedStatus}
            onChange={setSelectedStatus}
          >
            <Select.Option value="DRAFT">草稿</Select.Option>
            <Select.Option value="SUBMITTED">已提交</Select.Option>
            <Select.Option value="REVIEWING">待复盘</Select.Option>
            <Select.Option value="REVIEWED">已复盘</Select.Option>
            <Select.Option value="ADJUSTED">已调账</Select.Option>
            <Select.Option value="CLOSED">已关闭</Select.Option>
          </Select>
          <Button onClick={loadTasks}>查询</Button>
        </Space>
        <Table
          rowKey="id"
          columns={columns}
          dataSource={tasks}
          loading={loading}
          pagination={{ pageSize: 10 }}
        />
      </Card>
    </div>
  );
};

export default TaskList;
