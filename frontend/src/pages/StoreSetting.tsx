import React, { useState, useEffect } from 'react';
import { Table, Button, Tag, Space, Card, message, Modal, Form, InputNumber } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import { SettingOutlined, ReloadOutlined } from '@ant-design/icons';
import { storeApi } from '../api';
import type { Store } from '../types';
import dayjs from 'dayjs';

const StoreSetting: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [stores, setStores] = useState<Store[]>([]);
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [selectedStore, setSelectedStore] = useState<Store | null>(null);
  const [editForm] = Form.useForm();

  useEffect(() => {
    loadStores();
  }, []);

  const loadStores = async () => {
    setLoading(true);
    try {
      const data = await storeApi.getAll();
      setStores(data);
    } catch (e: any) {
      message.error(e.message);
    } finally {
      setLoading(false);
    }
  };

  const handleEditClick = (store: Store) => {
    setSelectedStore(store);
    editForm.setFieldsValue({
      thresholdAmount: store.thresholdAmount,
    });
    setEditModalVisible(true);
  };

  const handleEditSubmit = async () => {
    if (!selectedStore) return;
    
    try {
      const values = await editForm.validateFields();
      await storeApi.updateThreshold(selectedStore.id, values.thresholdAmount);
      message.success('阈值更新成功');
      setEditModalVisible(false);
      loadStores();
    } catch (e: any) {
      message.error(e.message);
    }
  };

  const columns: ColumnsType<Store> = [
    {
      title: '门店编码',
      dataIndex: 'code',
      key: 'code',
      width: 120,
    },
    {
      title: '门店名称',
      dataIndex: 'name',
      key: 'name',
      width: 150,
    },
    {
      title: '地址',
      dataIndex: 'address',
      key: 'address',
      ellipsis: true,
    },
    {
      title: '店长',
      dataIndex: 'managerName',
      key: 'managerName',
      width: 100,
    },
    {
      title: '差异阈值',
      dataIndex: 'thresholdAmount',
      key: 'thresholdAmount',
      width: 140,
      render: (val) => (
        <Tag color="orange" style={{ fontSize: '14px', padding: '4px 12px' }}>
          ¥{val?.toFixed(2)}
        </Tag>
      ),
    },
    {
      title: '创建时间',
      dataIndex: 'createdTime',
      key: 'createdTime',
      width: 180,
      render: (val) => dayjs(val).format('YYYY-MM-DD HH:mm:ss'),
    },
    {
      title: '操作',
      key: 'action',
      width: 120,
      render: (_, record) => (
        <Space>
          <Button
            type="link"
            icon={<SettingOutlined />}
            onClick={() => handleEditClick(record)}
          >
            设置阈值
          </Button>
        </Space>
      ),
    },
  ];

  return (
    <div>
      <Card
        title="门店设置"
        extra={
          <Button icon={<ReloadOutlined />} onClick={loadStores}>
            刷新
          </Button>
        }
      >
        <Table
          rowKey="id"
          columns={columns}
          dataSource={stores}
          loading={loading}
          pagination={false}
        />
      </Card>

      <Modal
        title="设置差异阈值"
        open={editModalVisible}
        onOk={handleEditSubmit}
        onCancel={() => setEditModalVisible(false)}
        width={400}
      >
        <Form form={editForm} layout="vertical">
          <Form.Item
            label="门店"
            name="storeName"
          >
            <div style={{ padding: '8px 12px', background: '#f5f5f5', borderRadius: '4px' }}>
              {selectedStore?.name} ({selectedStore?.code})
            </div>
          </Form.Item>
          <Form.Item
            name="thresholdAmount"
            label="差异金额阈值（元）"
            rules={[
              { required: true, message: '请输入阈值' },
              { type: 'number', min: 0, message: '阈值不能小于0' },
            ]}
            extra="当盘点差异总金额超过此阈值时，任务将进入区域复盘流程"
          >
            <InputNumber
              style={{ width: '100%' }}
              min={0}
              step={1000}
              precision={2}
              placeholder="请输入阈值金额"
              prefix="¥"
            />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default StoreSetting;
