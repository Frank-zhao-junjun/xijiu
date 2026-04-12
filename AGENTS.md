# 白酒供应链数字化管控平台 - AGENTS.md

## 项目概览

面向白酒企业的供应链全链路数字化管控系统 Demo，聚焦"采购→到货验收→入库→库存管理"核心链路。

### 技术栈
| 层级 | 技术 | 版本 |
|------|------|------|
| 前端框架 | React + TypeScript | 18 / 5.3 |
| UI 组件库 | Ant Design | 5.x |
| 构建工具 | Vite | 5.x |
| 状态管理 | Zustand | 4.x |
| HTTP 客户端 | Axios | 1.6.x |
| 后端框架 | FastAPI (Python 3.12) | 0.109 |
| ORM | SQLAlchemy 2.0 (async) | 2.0.25 |
| 数据库 | SQLite (aiosqlite) | - |

## 项目结构

```
/workspace/projects/
├── .coze                          # 项目配置（构建/运行）
├── backend/                       # Python FastAPI 后端
│   ├── app/
│   │   ├── main.py                # FastAPI 应用入口
│   │   ├── config.py              # 配置管理（Pydantic Settings）
│   │   ├── database.py            # 数据库连接（旧版，未使用）
│   │   ├── core/
│   │   │   └── database.py        # 数据库连接（实际使用）
│   │   ├── api/                   # API 路由层
│   │   │   ├── dashboard.py       # 仪表盘接口
│   │   │   ├── suppliers.py       # 供应商管理
│   │   │   ├── materials.py       # 物料/原料管理
│   │   │   ├── products.py        # 产品管理
│   │   │   ├── purchase_orders.py # 采购订单
│   │   │   ├── sales_orders.py    # 销售订单
│   │   │   ├── production.py      # 生产记录
│   │   │   └── warehouses.py      # 仓库管理
│   │   ├── models/                # ORM 模型
│   │   │   ├── supply_chain.py    # 核心业务模型（SQLite 兼容）
│   │   │   ├── supplier.py        # DDD 供应商模型
│   │   │   ├── purchase_order.py  # DDD 采购订单模型
│   │   │   ├── batch.py           # 批次模型
│   │   │   ├── quality_inspection.py # 质检模型
│   │   │   ├── inventory.py       # 库存模型
│   │   │   ├── waybill.py         # 运单模型
│   │   │   ├── pit_cellar.py      # 窖池模型
│   │   │   └── production_order.py # 生产订单模型
│   │   ├── schemas/               # Pydantic Schema
│   │   ├── services/              # 领域服务
│   │   └── routers/               # DDD 风格路由（备用）
│   ├── init_db.py                 # 数据库初始化 & 种子数据
│   └── requirements.txt           # Python 依赖
├── frontend/                      # React 前端
│   ├── src/
│   │   ├── main.tsx               # 入口文件
│   │   ├── App.tsx                # 路由配置
│   │   ├── index.css              # 全局样式
│   │   ├── pages/                 # 页面组件
│   │   │   ├── buyer/             # 采购端页面
│   │   │   │   ├── BuyerHome.tsx  # 采购端首页
│   │   │   │   ├── SourcingList.tsx    # 寻源项目列表
│   │   │   │   ├── SourcingDetail.tsx  # 寻源项目详情
│   │   │   │   └── ContractList.tsx    # 合同管理
│   │   │   ├── supplier/          # 供应商端页面
│   │   │   │   ├── SupplierHome.tsx    # 供应商端首页
│   │   │   │   ├── InvitationList.tsx # 收到的邀请
│   │   │   │   ├── BidList.tsx        # 投标管理
│   │   │   │   ├── ContractList.tsx    # 合同管理
│   │   │   │   └── OrderList.tsx      # 销售订单
│   │   │   ├── PurchaseOrderList.tsx    # 采购订单列表
│   │   │   ├── PurchaseOrderDetail.tsx # 采购订单详情
│   │   │   ├── SupplierList.tsx   # 供应商列表
│   │   │   ├── ReceiptList.tsx    # 入库单列表
│   │   │   ├── InventoryList.tsx  # 库存查询
│   │   │   └── InspectionList.tsx # 质检单列表
│   │   ├── components/
│   │   │   └── Layout.tsx         # 整体布局（侧边栏+内容区）
│   │   ├── api/                   # API 调用层
│   │   │   ├── request.ts         # Axios 实例配置
│   │   │   └── index.ts           # API 函数导出
│   │   ├── store/                 # Zustand 状态管理
│   │   └── types/                 # TypeScript 类型定义
│   ├── vite.config.ts             # Vite 配置（含代理）
│   └── package.json
├── docs/                          # 设计文档
│   ├── PRD.md                     # 产品需求文档
│   ├── DDD-领域设计.md            # DDD 领域设计
│   ├── 技术架构设计.md             # 技术架构
│   ├── E2E测试方案.md             # E2E 测试方案
│   └── ui/                        # UI 原型（HTML）
└── tests/                         # 测试
    ├── api/                       # API 测试（Python pytest）
    └── e2e/                       # E2E 测试（Playwright）
```

## 构建和运行命令

### 开发环境
```bash
# 后端：安装依赖 + 初始化数据库 + 启动服务（端口 8000）
cd backend && pip3 install -r requirements.txt && python3 init_db.py && uvicorn app.main:app --host 0.0.0.0 --port 8000

# 前端：安装依赖 + 启动开发服务器（端口 5000，代理到后端 8000）
cd frontend && pnpm install && npx vite --port 5000 --host 0.0.0.0
```

### 生产环境
```bash
# 前端构建
cd frontend && pnpm build

# 静态文件服务
npx server -l 5000
```

## API 接口清单

### Phase 1: 供应商准入与主数据协同 (US-101~US-108)

| 方法 | 路径 | 功能 | 状态 |
|------|------|------|------|
| GET | `/health` | 健康检查 | ✅ |
| GET | `/suppliers/` | 供应商列表 | ✅ |
| POST | `/suppliers/` | 创建供应商 | ✅ |
| GET | `/suppliers/{id}` | 供应商详情 | ✅ |
| PUT | `/suppliers/{id}` | 更新供应商 | ✅ |
| POST | `/suppliers/{id}/qualifications` | 提交资质文件 | ✅ |
| GET | `/suppliers/{id}/qualifications` | 获取资质列表 | ✅ |
| GET | `/suppliers/qualifications/{qual_id}` | 资质详情 | ✅ |
| POST | `/qualifications/{qual_id}/review` | 资质评审（通过/拒绝） | ✅ |
| GET | `/dashboard/buyer-home` | 采购端首页统计 | ✅ |
| GET | `/dashboard/supplier-home` | 供应商端首页统计 | ✅ |

### Phase 2: 寻源与合同协同 (US-201~US-208)

| 方法 | 路径 | 功能 | 状态 |
|------|------|------|------|
| GET | `/sourcing/` | 寻源项目列表 | ✅ |
| POST | `/sourcing/` | 创建寻源项目 | ✅ |
| GET | `/sourcing/{id}` | 寻源项目详情 | ✅ |
| POST | `/sourcing/{id}/invite` | 邀请供应商 | ✅ |
| GET | `/sourcing/{id}/invitations` | 查看邀请列表 | ✅ |
| POST | `/sourcing/{id}/invitations/{inv_id}/accept` | 供应商接受邀请 | ✅ |
| POST | `/sourcing/{id}/invitations/{inv_id}/decline` | 供应商拒绝邀请 | ✅ |
| GET | `/sourcing/{id}/bids` | 供应商投标列表 | ✅ |
| POST | `/sourcing/{id}/bids` | 供应商投标 | ✅ |
| PUT | `/sourcing/{sourcing_id}/bids/{bid_id}` | 供应商修改投标 | ✅ |
| GET | `/sourcing/{id}/bids/{bid_id}` | 投标详情 | ✅ |
| POST | `/sourcing/{id}/open` | 开标 | ✅ |
| POST | `/sourcing/{sourcing_id}/bids/{bid_id}/award` | 授标 | ✅ |
| GET | `/contracts/` | 合同列表 | ✅ |
| GET | `/contracts/{id}` | 合同详情 | ✅ |
| POST | `/contracts/{id}/sign` | 合同签署 | ✅ |

### Phase 3: 预测与订单执行协同 (US-301~US-315)

| 方法 | 路径 | 功能 | 状态 |
|------|------|------|------|
| GET | `/materials/` | 物料/原料列表 | ✅ |
| GET | `/materials/low-stock` | 低库存物料 | ✅ |
| GET | `/products/` | 产品列表 | ✅ |
| GET | `/products/categories` | 产品分类 | ✅ |
| GET | `/products/brands` | 产品品牌 | ✅ |
| GET | `/purchase-orders/` | 采购订单列表 | ✅ |
| GET | `/purchase-orders/{id}` | 订单详情 | ✅ |
| POST | `/purchase-orders/` | 创建采购订单 | ✅ |
| PUT | `/purchase-orders/{id}` | 更新采购订单 | ✅ |
| POST | `/purchase-orders/{id}/confirm` | 确认采购订单 | ✅ |
| POST | `/purchase-orders/{id}/dispatch` | 发货 | ✅ |
| GET | `/sales-orders/` | 销售订单列表 | ✅ |
| GET | `/production/today-stats` | 今日生产统计 | ✅ |
| GET | `/production/records` | 生产记录列表 | ✅ |
| GET | `/warehouses/` | 仓库列表 | ✅ |
| GET | `/receipts/` | 入库单列表 | ✅ |
| POST | `/receipts/` | 创建入库单 | ✅ |
| GET | `/inspections/` | 质检单列表 | ✅ |
| POST | `/inspections/` | 创建质检单 | ✅ |
| GET | `/inventory/` | 库存查询 | ✅ |

### 仪表盘 & 通用

| 方法 | 路径 | 功能 | 状态 |
|------|------|------|------|
| GET | `/dashboard/stats` | 仪表盘核心指标 | ✅ |
| GET | `/dashboard/inventory-alerts` | 库存预警信息 | ✅ |

## 关键技术说明

### 前端代理配置
前端 Vite 开发服务器在 `vite.config.ts` 中配置了 API 代理：
- 所有 `/dashboard`, `/suppliers`, `/materials`, `/products`, `/purchase-orders`, `/sales-orders`, `/production`, `/warehouses` 路径的请求
- 代理到后端 `http://localhost:8000`

### 数据库
- **开发环境**：使用 SQLite（`supply_chain.db`），通过 `aiosqlite` 异步驱动
- **初始化**：执行 `python3 init_db.py` 自动建表并填充 Demo 种子数据
- **模型兼容性**：DDD 模型已从 PostgreSQL 类型（UUID, JSONB）迁移为 SQLite 兼容类型（String(36), Text）

### 双模型体系
项目存在两套模型：
1. **`app/models/supply_chain.py`**：简化版模型，被 API 路由实际使用，基于 `app.core.database.Base`
2. **`app/models/*.py`**：DDD 完整模型，用于领域设计参考，基于 `app.database.Base`

## 常见问题排查

### 后端启动失败
- 检查 Python 依赖：`pip3 install -r backend/requirements.txt`
- 检查数据库初始化：`cd backend && python3 init_db.py`
- 查看日志：`tail -n 50 /app/work/logs/bypass/app.log`

### 前端页面报错
- 检查依赖安装：`cd frontend && pnpm install`
- 确认 `@ant-design/icons` 已安装（多个页面依赖图标组件）
- 查看 Vite 日志：`tail -n 50 /app/work/logs/bypass/console.log`

### API 请求失败
- 确认后端服务运行在 8000 端口
- 确认前端代理配置正确（`vite.config.ts`）
- 直接测试后端：`curl http://localhost:8000/health`

## 项目进度

### 已完成

- **Phase 1 (供应商准入与主数据协同)**：
  - US-101~US-108 全部完成
  - 供应商主数据管理、资质文件上传、资质评审流程
  - 采购端/供应商端首页统计面板

- **Phase 2 (寻源与合同协同)**：
  - US-201~US-208 全部完成
  - 寻源项目创建、供应商邀请、投标管理、开标比价、授标、合同生成与签署
  - 前端重构：去除数据中台，拆分为采购端/供应商端双入口

### 待执行

- **Phase 3 (预测与订单执行协同)**：US-301~US-315
- **Phase 4 (财务结算协同)**：US-401~US-410
