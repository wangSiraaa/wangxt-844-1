# 连锁门店盘点差异处理系统

## 业务流程

```
门店店长录入盘点 → 提交盘点任务 → [差异超阈值→区域复盘] → 复盘通过 → 调账 → 关闭任务
                                                           ↓ (未复盘)
                                                         不能调账
                                                                   ↓ (关闭后)
                                                               盘点数只读
```

## 核心业务规则

1. **差异金额超阈值要区域复盘**：盘点差异总金额 > 门店设置阈值时，提交后进入 `REVIEWING` 状态
2. **未复盘不能调账**：只有 `REVIEWED` 状态才能执行调账操作
3. **任务关闭后盘点数只读**：`CLOSED` 状态下盘点记录标记为只读，无法编辑

## 技术栈

- **后端**: Spring Boot 3.2 + MySQL 8.0 + JPA
- **前端**: React 18 + TypeScript + Vite + Ant Design
- **部署**: Docker Compose

## 快速启动

```bash
# 1. 启动所有服务
docker-compose up -d

# 2. 等待服务启动完成（约30秒）
# 3. 运行测试脚本复现业务流程
bash scripts/test-difference-flow.sh
```

## 访问地址

- 前端应用: http://localhost:3000
- 后端API: http://localhost:8080
- API文档: http://localhost:8080/swagger-ui.html

## 测试脚本

`scripts/test-difference-flow.sh` - 复现"录入高金额差异并验证进入复盘状态"流程
