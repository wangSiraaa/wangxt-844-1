import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Table, Button, Tag, Space, Card, message, Modal, Form, Select, Input } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import { EyeOutlined, AuditOutlined } from '@ant-design/icons';
import { countTaskApi, storeApi } from '../api';
import type { CountTask, Store, ReviewResult } from '../types';
import { getStatusText, getStatusColor } from '../utils/status';
import dayjs from 'dayjs';

const { TextArea } = Input;
const { Option } = Select;

const ReviewList: React.FC = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [tasks, setTasks] = useState<CountTask[]>([]);
  const [stores, setStores] = useState<Store[]>([]);
  const [reviewModalVisible, setReviewModalVisible] = useState(false);
  const [selectedTask, setSelectedTask] = useState<CountTask | null>(null);
  const [reviewForm] = Form.useForm();

  useEffect(() => {
    loadStores();
    loadTasks();
  }, []);

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
      const data = await countTaskApi.getList({ status: 'REVIEWING' });
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

  const getStoreThreshold = (storeId: number) => {
    return stores.find((s) => s.id === storeId)?.thresholdAmount || 0;
  };

  const handleReviewClick = (task: CountTask) => {
    setSelectedTask(task);
    reviewForm.resetFields();
    setReviewModalVisible(true);
  };

  const handleReviewSubmit = async () => {
    if (!selectedTask) return;
    
    try {
      const values = await reviewForm.validateFields();
      await countTaskApi.review({
        taskId: selectedTask.id,
        reviewer: values.reviewer,
        reviewResult: values.reviewResult,
        reviewComment: values.reviewComment,
      });
      message.success('复盘完成');
      setReviewModalVisible(false);
      loadTasks();
    } catch (e: any) {
      message.error(e.message);
    }
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
      title: '门店阈值',
      dataIndex: 'storeId',
      key: 'threshold',
      width: 120,
      render: (storeId) => `¥${getStoreThreshold(storeId).toFixed(2)}`,
    },
    {
      title: '状态',
      dataIndex: 'taskStatus',
      key: 'taskStatus',
      width: 100,
      render: (status) => (
        <Tag color={getStatusColor(status)}>{getStatusText(status)}</Tag>
      ),
    },
    {
      title: '总差异金额',
      dataIndex: 'totalDiffAmount',
      key: 'totalDiffAmount',
      width: 140,
      render: (val) => (
        <span className={Math.abs(val) > 0 ? 'diff-negative' : ''}>
          ¥{val?.toFixed(2)}
        </span>
      ),
    },
    {
      title: '提交时间',
      dataIndex: 'submitTime',
      key: 'submitTime',
      width: 180,
      render: (val) => (val ? dayjs(val).format('YYYY-MM-DD HH:mm:ss') : '-'),
    },
    {
      title: '创建人',
      dataIndex: 'createdBy',
      key: 'createdBy',
      width: 100,
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
      width: 180,
      render: (_, record) => (
        <Space>
          <Button
            type="link"
            icon={<EyeOutlined />}
            onClick={() => navigate(`/tasks/${record.id}`)}
          >
            详情
          </Button>
          <Button
            type="primary"
            icon={<AuditOutlined />}
            onClick={() => handleReviewClick(record)}
          >
            复盘
          </Button>
        </Space>
      ),
    },
  ];

  return (
    <div>
      <Card title="区域复盘列表" extra={<Button onClick={loadTasks}>刷新</Button>}>
        <Table
          rowKey="id"
          columns={columns}
          dataSource={tasks}
          loading={loading}
          pagination={{ pageSize: 10 }}
          locale={{ emptyText: '暂无需要复盘的任务' }}
        />
      </Card>

      <Modal
        title="差异复盘"
        open={reviewModalVisible}
        onOk={handleReviewSubmit}
        onCancel={() => setReviewModalVisible(false)}
        width={500}
      >
        <Form form={reviewForm} layout="vertical">
          <Form.Item
            name="reviewer"
            label="复盘人"
            rules={[{ required: true, message: '请输入复盘人' }]}
          >
            <Input placeholder="请输入复盘人姓名" />
          </Form.Item>
          <Form.Item
            name="reviewResult"
            label="复盘结果"
            rules={[{ required: true, message: '请选择复盘结果' }]}
          >
            <Select placeholder="请选择复盘结果">
              <Option value="APPROVED">通过（同意调账）</Option>
              <Option value="REJECTED">驳回（需重新盘点）</Option>
            </Select>
          </Form.Item>
          <Form.Item name="reviewComment" label="复盘意见">
            <TextArea rows={4} placeholder="请输入复盘意见（选填）" />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default ReviewList;
