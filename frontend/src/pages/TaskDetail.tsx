import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  Card,
  Table,
  Button,
  Form,
  Select,
  Input,
  InputNumber,
  Space,
  Tag,
  message,
  Modal,
  Row,
  Col,
  Descriptions,
} from 'antd';
import type { ColumnsType } from 'antd/es/table';
import { ArrowLeftOutlined, CheckOutlined, AuditOutlined, CloseOutlined, ExclamationCircleOutlined, ImportOutlined, ReloadOutlined, SearchOutlined } from '@ant-design/icons';
import { countTaskApi, storeApi, productApi } from '../api';
import type { CountTask, CountRecord, Product, Store, ReviewResult, InventoryWithProductVO } from '../types';
import { getStatusText, getStatusColor } from '../utils/status';
import dayjs from 'dayjs';

interface TaskDetailProps {
  isCreate?: boolean;
}

const TaskDetail: React.FC<TaskDetailProps> = ({ isCreate }) => {
  const navigate = useNavigate();
  const { id } = useParams();
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [task, setTask] = useState<CountTask | null>(null);
  const [records, setRecords] = useState<CountRecord[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [stores, setStores] = useState<Store[]>([]);
  const [selectedStore, setSelectedStore] = useState<number | null>(null);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editValue, setEditValue] = useState<number>(0);
  const [reviewModalVisible, setReviewModalVisible] = useState(false);
  const [reviewForm] = Form.useForm();
  const [batchImportVisible, setBatchImportVisible] = useState(false);
  const [batchImportData, setBatchImportData] = useState<InventoryWithProductVO[]>([]);
  const [batchImportLoading, setBatchImportLoading] = useState(false);
  const [batchFilterForm] = Form.useForm();
  const [batchEditData, setBatchEditData] = useState<Map<number, number>>(new Map());

  useEffect(() => {
    loadStores();
    loadProducts();
    if (!isCreate && id) {
      loadTaskDetail(Number(id));
    }
  }, [isCreate, id]);

  const loadStores = async () => {
    try {
      const data = await storeApi.getAll();
      setStores(data);
    } catch (e: any) {
      message.error(e.message);
    }
  };

  const loadProducts = async () => {
    try {
      const data = await productApi.getAll();
      setProducts(data);
    } catch (e: any) {
      message.error(e.message);
    }
  };

  const loadTaskDetail = async (taskId: number) => {
    setLoading(true);
    try {
      const data = await countTaskApi.getDetail(taskId);
      setTask(data.task);
      setRecords(data.records);
    } catch (e: any) {
      message.error(e.message);
    } finally {
      setLoading(false);
    }
  };

  const getProductName = (productId: number) => {
    return products.find((p) => p.id === productId)?.name || '-';
  };

  const getProductSku = (productId: number) => {
    return products.find((p) => p.id === productId)?.sku || '-';
  };

  const handleCreate = async () => {
    try {
      const values = await form.validateFields();
      setLoading(true);
      const data = await countTaskApi.create({
        storeId: values.storeId,
        createdBy: values.createdBy || '店长',
        remark: values.remark,
      });
      message.success('盘点任务创建成功');
      navigate(`/tasks/${data.id}`);
    } catch (e: any) {
      message.error(e.message);
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (record: CountRecord) => {
    if (record.readOnly || task?.taskStatus === 'CLOSED') {
      message.error('任务已关闭，无法修改');
      return;
    }
    setEditingId(record.id);
    setEditValue(record.countedQuantity);
  };

  const handleSaveEdit = async (recordId: number) => {
    try {
      await countTaskApi.updateRecord({ recordId, countedQuantity: editValue });
      message.success('更新成功');
      setEditingId(null);
      if (task) {
        loadTaskDetail(task.id);
      }
    } catch (e: any) {
      message.error(e.message);
    }
  };

  const handleSubmit = () => {
    if (!task) return;
    Modal.confirm({
      title: '确认提交盘点任务',
      icon: <ExclamationCircleOutlined />,
      content: '提交后将自动判断是否需要区域复盘，确定提交吗？',
      onOk: async () => {
        try {
          const data = await countTaskApi.submit(task.id);
          setTask(data);
          message.success(`提交成功，当前状态：${getStatusText(data.taskStatus)}`);
          loadTaskDetail(task.id);
        } catch (e: any) {
          message.error(e.message);
        }
      },
    });
  };

  const handleReview = () => {
    setReviewModalVisible(true);
  };

  const handleReviewSubmit = async () => {
    try {
      const values = await reviewForm.validateFields();
      const data = await countTaskApi.review({
        taskId: task!.id,
        reviewer: values.reviewer,
        reviewResult: values.reviewResult,
        reviewComment: values.reviewComment,
      });
      message.success('复盘完成');
      setTask(data);
      setReviewModalVisible(false);
      loadTaskDetail(task!.id);
    } catch (e: any) {
      message.error(e.message);
    }
  };

  const handleAdjust = () => {
    Modal.confirm({
      title: '确认调账',
      icon: <ExclamationCircleOutlined />,
      content: '调账将根据盘点差异调整系统库存，确定执行吗？',
      onOk: async () => {
        try {
          const data = await countTaskApi.adjust({
            taskId: task!.id,
            operator: '系统管理员',
          });
          setTask(data);
          message.success('调账成功');
          loadTaskDetail(task!.id);
        } catch (e: any) {
          message.error(e.message);
        }
      },
    });
  };

  const handleClose = () => {
    Modal.confirm({
      title: '确认关闭任务',
      icon: <ExclamationCircleOutlined />,
      content: '关闭后所有盘点记录将变为只读，无法再修改。确定关闭吗？',
      onOk: async () => {
        try {
          const data = await countTaskApi.close(task!.id);
          setTask(data);
          message.success('任务已关闭');
          loadTaskDetail(task!.id);
        } catch (e: any) {
          message.error(e.message);
        }
      },
    });
  };

  const handleBatchImport = () => {
    if (!canEdit) {
      message.error('当前任务状态不允许批量导入');
      return;
    }
    setBatchImportVisible(true);
    setBatchEditData(new Map());
    loadBatchImportData();
  };

  const loadBatchImportData = async (category?: string, keyword?: string) => {
    if (!task) return;
    setBatchImportLoading(true);
    try {
      const data = await countTaskApi.getBatchImportData(task.id, { category, keyword });
      setBatchImportData(data);
    } catch (e: any) {
      message.error(e.message);
    } finally {
      setBatchImportLoading(false);
    }
  };

  const handleBatchFilter = async () => {
    const values = await batchFilterForm.validateFields();
    loadBatchImportData(values.category, values.keyword);
  };

  const handleBatchQuantityChange = (recordId: number, value: number) => {
    setBatchEditData((prev) => {
      const next = new Map(prev);
      next.set(recordId, value);
      return next;
    });
  };

  const handleBatchImportSubmit = async () => {
    if (!task || batchEditData.size === 0) {
      message.warning('请至少修改一个盘点数量');
      return;
    }

    const items = Array.from(batchEditData.entries()).map(([recordId, countedQuantity]) => ({
      recordId,
      countedQuantity,
    }));

    try {
      await countTaskApi.batchImport(task.id, { items });
      message.success(`批量导入成功，共更新 ${items.length} 条记录`);
      setBatchImportVisible(false);
      setBatchEditData(new Map());
      loadTaskDetail(task.id);
    } catch (e: any) {
      message.error(e.message);
    }
  };

  const handleBackToList = () => {
    navigate('/tasks');
  };

  const handleRefreshList = () => {
    if (task) {
      loadTaskDetail(task.id);
    }
  };

  const canEdit = task && (task.taskStatus === 'DRAFT' || task.taskStatus === 'REVIEWING');
  const canSubmit = task && (task.taskStatus === 'DRAFT' || task.taskStatus === 'REVIEWING');
  const canReview = task && task.taskStatus === 'REVIEWING';
  const canAdjust = task && (task.taskStatus === 'REVIEWED' || task.taskStatus === 'SUBMITTED');
  const canClose = task && (task.taskStatus === 'ADJUSTED' || task.taskStatus === 'SUBMITTED');

  const columns: ColumnsType<CountRecord> = [
    {
      title: '商品SKU',
      dataIndex: 'productId',
      key: 'sku',
      width: 120,
      render: (productId) => getProductSku(productId),
    },
    {
      title: '商品名称',
      dataIndex: 'productId',
      key: 'name',
      width: 150,
      render: (productId) => getProductName(productId),
    },
    {
      title: '系统数量',
      dataIndex: 'systemQuantity',
      key: 'systemQuantity',
      width: 100,
    },
    {
      title: '盘点数量',
      dataIndex: 'countedQuantity',
      key: 'countedQuantity',
      width: 180,
      render: (val, record) => {
        if (editingId === record.id) {
          return (
            <Space>
              <InputNumber
                min={0}
                value={editValue}
                onChange={(value) => setEditValue(value ?? 0)}
                autoFocus
                size="small"
                style={{ width: 100 }}
              />
              <Button size="small" type="primary" onClick={() => handleSaveEdit(record.id)}>
                保存
              </Button>
              <Button size="small" onClick={() => setEditingId(null)}>
                取消
              </Button>
            </Space>
          );
        }
        return (
          <Space>
            <span>{val}</span>
            {canEdit && !record.readOnly && (
              <Button
                type="link"
                size="small"
                onClick={() => handleEdit(record)}
              >
                编辑
              </Button>
            )}
            {record.readOnly && <Tag color="gray">只读</Tag>}
          </Space>
        );
      },
    },
    {
      title: '差异数量',
      dataIndex: 'diffQuantity',
      key: 'diffQuantity',
      width: 100,
      render: (val) => (
        <span className={val > 0 ? 'diff-positive' : val < 0 ? 'diff-negative' : ''}>
          {val > 0 ? '+' : ''}
          {val}
        </span>
      ),
    },
    {
      title: '差异金额',
      dataIndex: 'diffAmount',
      key: 'diffAmount',
      width: 120,
      render: (val) => (
        <span className={val > 0 ? 'diff-positive' : val < 0 ? 'diff-negative' : ''}>
          {val > 0 ? '+' : ''}¥{val?.toFixed(2)}
        </span>
      ),
    },
    {
      title: '单价',
      dataIndex: 'unitPrice',
      key: 'unitPrice',
      width: 100,
      render: (val) => `¥${val?.toFixed(2)}`,
    },
  ];

  if (isCreate) {
    return (
      <div>
        <Button icon={<ArrowLeftOutlined />} onClick={() => navigate('/tasks')} style={{ marginBottom: 16 }}>
          返回
        </Button>
        <Card title="新建盘点任务">
          <Form form={form} layout="vertical">
            <Row gutter={16}>
              <Col span={8}>
                <Form.Item
                  label="选择门店"
                  name="storeId"
                  rules={[{ required: true, message: '请选择门店' }]}
                >
                  <Select
                    placeholder="请选择门店"
                    onChange={setSelectedStore}
                  >
                    {stores.map((store) => (
                      <Select.Option key={store.id} value={store.id}>
                        {store.name}（阈值：¥{store.thresholdAmount.toFixed(2)}）
                      </Select.Option>
                    ))}
                  </Select>
                </Form.Item>
              </Col>
              <Col span={8}>
                <Form.Item label="创建人" name="createdBy">
                  <Input placeholder="请输入创建人姓名" defaultValue="店长" />
                </Form.Item>
              </Col>
              <Col span={8}>
                <Form.Item label="备注" name="remark">
                  <Input placeholder="请输入备注" />
                </Form.Item>
              </Col>
            </Row>
            {selectedStore && (
              <div
                style={{
                  marginTop: 16,
                  padding: 16,
                  background: '#f5f5f5',
                  borderRadius: 4,
                }}
              >
                <p>
                  <strong>门店阈值：¥
                  {stores.find((s) => s.id === selectedStore)?.thresholdAmount.toFixed(2)}
                  </strong>
                </p>
                <p style={{ color: '#666', fontSize: '12px' }}>
                  差异金额超过此阈值将自动进入区域复盘流程
                </p>
              </div>
            )}
            <Form.Item style={{ marginTop: 24 }}>
              <Button type="primary" onClick={handleCreate} loading={loading}>
                创建盘点任务
              </Button>
            </Form.Item>
          </Form>
        </Card>
      </div>
    );
  }

  return (
    <div>
      <Button icon={<ArrowLeftOutlined />} onClick={() => navigate('/tasks')} style={{ marginBottom: 16 }}>
        返回列表
      </Button>

      {task && (
        <Card
          title={
            <Space>
              <span>盘点任务详情</span>
              <Tag color={getStatusColor(task.taskStatus)}>{getStatusText(task.taskStatus)}</Tag>
              {task.taskStatus === 'REVIEWING' && (
                <Tag color="orange">
                  <ExclamationCircleOutlined /> 需要区域复盘
                </Tag>
              )}
            </Space>
          }
          extra={
            <Space>
              {canEdit && (
                <Button
                  icon={<ImportOutlined />}
                  onClick={handleBatchImport}
                >
                  批量导入
                </Button>
              )}
              {canSubmit && (
                <Button
                  type="primary"
                  icon={<CheckOutlined />}
                  onClick={handleSubmit}
                >
                  提交盘点
                </Button>
              )}
              {canReview && (
                <Button
                  type="primary"
                  icon={<AuditOutlined />}
                  onClick={handleReview}
                >
                  区域复盘
                </Button>
              )}
              {canAdjust && (
                <Button
                  type="primary"
                  icon={<CheckOutlined />}
                  onClick={handleAdjust}
                >
                  库存调账
                </Button>
              )}
              {canClose && (
                <Button
                  danger
                  icon={<CloseOutlined />}
                  onClick={handleClose}
                >
                  关闭任务
                </Button>
              )}
            </Space>
          }
        >
          <Descriptions column={3} style={{ marginBottom: 24 }}>
            <Descriptions.Item label="任务编号">{task.taskNo}</Descriptions.Item>
            <Descriptions.Item label="门店">
              {stores.find((s) => s.id === task.storeId)?.name}
            </Descriptions.Item>
            <Descriptions.Item label="创建人">{task.createdBy}</Descriptions.Item>
            <Descriptions.Item label="总差异金额">
              <span className={task.totalDiffAmount > 0 ? 'diff-negative' : ''}>
                ¥{task.totalDiffAmount?.toFixed(2)}
              </span>
            </Descriptions.Item>
            <Descriptions.Item label="创建时间">
              {dayjs(task.createdTime).format('YYYY-MM-DD HH:mm:ss')}
            </Descriptions.Item>
            <Descriptions.Item label="提交时间">
              {task.submitTime
                ? dayjs(task.submitTime).format('YYYY-MM-DD HH:mm:ss')
                : '-'}
            </Descriptions.Item>
            {task.remark && (
              <Descriptions.Item label="备注" span={3}>
                {task.remark}
              </Descriptions.Item>
            )}
          </Descriptions>

          <Table
            rowKey="id"
            columns={columns}
            dataSource={records}
            loading={loading}
            pagination={false}
          />
        </Card>
      )}

      <Modal
        title="区域复盘"
        open={reviewModalVisible}
        onCancel={() => setReviewModalVisible(false)}
        onOk={handleReviewSubmit}
      >
        <Form form={reviewForm} layout="vertical">
          <Form.Item
            label="复盘人"
            name="reviewer"
            rules={[{ required: true, message: '请输入复盘人' }]}
          >
            <Input placeholder="请输入复盘人姓名" />
          </Form.Item>
          <Form.Item
            label="复盘结果"
            name="reviewResult"
            rules={[{ required: true, message: '请选择复盘结果' }]}
          >
            <Select placeholder="请选择">
              <Select.Option value="APPROVED">通过</Select.Option>
              <Select.Option value="REJECTED">驳回</Select.Option>
            </Select>
          </Form.Item>
          <Form.Item label="复盘意见" name="reviewComment">
            <Input.TextArea rows={4} placeholder="请输入复盘意见" />
          </Form.Item>
        </Form>
      </Modal>

      <Modal
        title="批量导入盘点数据"
        open={batchImportVisible}
        onCancel={() => {
          setBatchImportVisible(false);
          setBatchEditData(new Map());
        }}
        onOk={handleBatchImportSubmit}
        okText="确认导入"
        cancelText="取消"
        width={1200}
        footer={
          <Space>
            <Button onClick={handleBackToList} icon={<ArrowLeftOutlined />}>
              返回列表
            </Button>
            <Button onClick={handleRefreshList} icon={<ReloadOutlined />}>
              刷新
            </Button>
            <Button
              type="primary"
              onClick={handleBatchImportSubmit}
              disabled={batchEditData.size === 0}
            >
              确认导入 ({batchEditData.size} 条)
            </Button>
            <Button onClick={() => {
              setBatchImportVisible(false);
              setBatchEditData(new Map());
            }}>
              取消
            </Button>
          </Space>
        }
      >
        <Card size="small" style={{ marginBottom: 16 }}>
          <Form form={batchFilterForm} layout="inline">
            <Form.Item name="category" label="商品分类">
              <Select
                placeholder="请选择分类"
                allowClear
                style={{ width: 150 }}
              >
                <Select.Option value="生鲜">生鲜</Select.Option>
                <Select.Option value="食品">食品</Select.Option>
                <Select.Option value="日用">日用</Select.Option>
                <Select.Option value="饮料">饮料</Select.Option>
                <Select.Option value="数码">数码</Select.Option>
              </Select>
            </Form.Item>
            <Form.Item name="keyword" label="关键词">
              <Input
                placeholder="SKU/商品名称"
                style={{ width: 200 }}
                allowClear
              />
            </Form.Item>
            <Form.Item>
              <Button
                type="primary"
                icon={<SearchOutlined />}
                onClick={handleBatchFilter}
              >
                查询
              </Button>
            </Form.Item>
            <Form.Item>
              <Button onClick={() => {
                batchFilterForm.resetFields();
                loadBatchImportData();
              }}>
                重置
              </Button>
            </Form.Item>
          </Form>
        </Card>

        <Table
          rowKey="recordId"
          columns={[
            {
              title: '商品SKU',
              dataIndex: 'sku',
              key: 'sku',
              width: 120,
            },
            {
              title: '商品名称',
              dataIndex: 'productName',
              key: 'productName',
              width: 150,
            },
            {
              title: '分类',
              dataIndex: 'category',
              key: 'category',
              width: 80,
            },
            {
              title: '单价',
              dataIndex: 'unitPrice',
              key: 'unitPrice',
              width: 100,
              render: (val) => `¥${val?.toFixed(2)}`,
            },
            {
              title: '系统库存',
              dataIndex: 'systemQuantity',
              key: 'systemQuantity',
              width: 100,
            },
            {
              title: '盘点数量',
              dataIndex: 'countedQuantity',
              key: 'countedQuantity',
              width: 180,
              render: (val, record: InventoryWithProductVO) => {
                const currentValue = batchEditData.get(record.recordId!) ?? val;
                if (record.readOnly) {
                  return (
                    <Space>
                      <span>{currentValue}</span>
                      <Tag color="gray">只读</Tag>
                    </Space>
                  );
                }
                return (
                  <InputNumber
                    min={0}
                    value={currentValue}
                    onChange={(value) =>
                      handleBatchQuantityChange(record.recordId!, value ?? 0)
                    }
                    size="small"
                    style={{ width: 120 }}
                  />
                );
              },
            },
            {
              title: '差异数量',
              dataIndex: 'diffQuantity',
              key: 'diffQuantity',
              width: 100,
              render: (val, record: InventoryWithProductVO) => {
                const counted = batchEditData.get(record.recordId!) ?? record.countedQuantity;
                const diff = counted - record.systemQuantity;
                return (
                  <span className={diff > 0 ? 'diff-positive' : diff < 0 ? 'diff-negative' : ''}>
                    {diff > 0 ? '+' : ''}{diff}
                  </span>
                );
              },
            },
            {
              title: '差异金额',
              key: 'diffAmount',
              width: 120,
              render: (_, record: InventoryWithProductVO) => {
                const counted = batchEditData.get(record.recordId!) ?? record.countedQuantity;
                const diff = counted - record.systemQuantity;
                const diffAmount = diff * record.unitPrice;
                return (
                  <span className={diffAmount > 0 ? 'diff-positive' : diffAmount < 0 ? 'diff-negative' : ''}>
                    {diffAmount > 0 ? '+' : ''}¥{diffAmount.toFixed(2)}
                  </span>
                );
              },
            },
          ]}
          dataSource={batchImportData}
          loading={batchImportLoading}
          pagination={{ pageSize: 10 }}
          scroll={{ y: 400 }}
        />
      </Modal>
    </div>
  );
};

export default TaskDetail;
