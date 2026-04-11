# 白酒供应链数字化管控平台

面向白酒企业的供应链全链路数字化管控系统Demo，聚焦"采购→到货验收→入库→库存管理"核心链路。

## 系统功能

### 数据中台
- 核心指标看板（订单量、库存、供应商等）
- 订单履约状态分析
- 预警信息推送
- 待办事项管理

### 采购管理
- 采购订单管理（创建、审批、跟踪）
- 供应商管理（准入、评级、合作状态）

### 仓储管理
- 入库单管理
- 库存查询（原料/成品）
- 质检单管理（到货检验、定期检验）
- 批次追溯

## 技术架构

### 后端
- **框架**: FastAPI + SQLAlchemy 2.0
- **数据库**: PostgreSQL 15
- **API文档**: Swagger UI (/docs)

### 前端
- **框架**: React 18 + TypeScript
- **UI库**: Ant Design 5.x
- **构建工具**: Vite

## 快速启动

### 前置要求
- Docker >= 20.10
- Docker Compose >= 2.0

### 启动步骤

```bash
# 进入项目目录
cd supply-chain-demo

# 启动所有服务（自动初始化数据库）
chmod +x start.sh
./start.sh
```

### 访问地址

| 服务 | 地址 |
|------|------|
| 前端界面 | http://localhost:3000 |
| API文档 | http://localhost:8000/docs |
| 健康检查 | http://localhost:8000/health |

## 项目结构

```
supply-chain-demo/
├── backend/                    # FastAPI后端
│   ├── app/
│   │   ├── models/           # SQLAlchemy模型
│   │   ├── schemas/         # Pydantic模型
│   │   ├── routers/        # API路由
│   │   └── services/        # 领域服务
│   ├── requirements.txt
│   ├── Dockerfile
│   └── init_db.py          # 数据库初始化
├── frontend/                 # React前端
│   ├── src/
│   │   ├── pages/          # 页面组件
│   │   ├── components/      # 公共组件
│   │   └── api/            # API调用
│   ├── package.json
│   └── Dockerfile
├── docker-compose.yml
├── start.sh                 # 启动脚本
└── README.md
```

## API接口

### Dashboard
- `GET /api/v1/dashboard/metrics` - 获取仪表盘指标
- `GET /api/v1/dashboard/alerts` - 获取预警列表
- `GET /api/v1/dashboard/todos` - 获取待办事项

### 供应商管理
- `GET /api/v1/suppliers` - 获取供应商列表
- `POST /api/v1/suppliers` - 创建供应商
- `GET /api/v1/suppliers/{id}` - 获取供应商详情

### 采购订单
- `GET /api/v1/orders` - 获取订单列表
- `POST /api/v1/orders` - 创建订单
- `GET /api/v1/orders/{id}` - 获取订单详情
- `POST /api/v1/orders/{id}/submit` - 提交订单

### 库存管理
- `GET /api/v1/inventory` - 获取库存列表
- `GET /api/v1/inventory/stats` - 获取库存统计

### 质检管理
- `GET /api/v1/inspections` - 获取质检列表
- `POST /api/v1/inspections` - 创建质检单
- `POST /api/v1/inspections/{id}/complete` - 完成质检

## 数据库

默认使用Docker Compose启动PostgreSQL容器：
- **端口**: 5432
- **数据库**: supply_chain
- **用户名**: postgres
- **密码**: postgres

## 常用命令

```bash
# 启动服务
./start.sh

# 停止服务
./stop.sh

# 查看日志
docker-compose logs -f

# 重启服务
docker-compose restart

# 重新构建
docker-compose up -d --build
```

## 开发者

### 本地开发

**后端开发：**
```bash
cd backend
pip install -r requirements.txt
python init_db.py  # 初始化数据库
uvicorn app.main:app --reload
```

**前端开发：**
```bash
cd frontend
npm install
npm run dev
```

## License

MIT
