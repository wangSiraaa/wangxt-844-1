import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { Layout, Menu } from 'antd';
import {
  UnorderedListOutlined,
  FileAddOutlined,
  AuditOutlined,
  SettingOutlined,
} from '@ant-design/icons';
import TaskList from './pages/TaskList';
import TaskDetail from './pages/TaskDetail';
import ReviewList from './pages/ReviewList';
import StoreSetting from './pages/StoreSetting';

const { Header, Sider, Content } = Layout;

const App: React.FC = () => {
  const menuItems = [
    {
      key: '/tasks',
      icon: <UnorderedListOutlined />,
      label: '盘点任务',
    },
    {
      key: '/create',
      icon: <FileAddOutlined />,
      label: '新建盘点',
    },
    {
      key: '/review',
      icon: <AuditOutlined />,
      label: '区域复盘',
    },
    {
      key: '/settings',
      icon: <SettingOutlined />,
      label: '门店设置',
    },
  ];

  return (
    <Layout className="app-container">
      <Header style={{ display: 'flex', alignItems: 'center', background: '#001529' }}>
        <div style={{ color: '#fff', fontSize: '18px', fontWeight: 'bold', marginRight: '48px' }}>
          连锁门店盘点差异处理系统
        </div>
        <Menu
          theme="dark"
          mode="horizontal"
          selectedKeys={[window.location.pathname]}
          items={menuItems}
          onClick={({ key }) => {
            window.location.hash = key;
            window.location.pathname !== key && (window.location.href = key);
          }}
          style={{ flex: 1, minWidth: 0, background: '#001529' }}
        />
      </Header>
      <Layout>
        <Sider width={200} style={{ background: '#fff' }}>
          <Menu
            mode="inline"
            selectedKeys={[window.location.pathname]}
            items={menuItems}
            onClick={({ key }) => {
              window.location.href = key;
            }}
            style={{ height: '100%', borderRight: 0 }}
          />
        </Sider>
        <Layout style={{ padding: '24px' }}>
          <Content className="page-content">
            <Routes>
              <Route path="/" element={<Navigate to="/tasks" replace />} />
              <Route path="/tasks" element={<TaskList />} />
              <Route path="/tasks/:id" element={<TaskDetail />} />
              <Route path="/create" element={<TaskDetail isCreate />} />
              <Route path="/review" element={<ReviewList />} />
              <Route path="/settings" element={<StoreSetting />} />
            </Routes>
          </Content>
        </Layout>
      </Layout>
    </Layout>
  );
};

export default App;
