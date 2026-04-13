# 白酒供应链数字化管控平台

面向白酒企业的供应链全链路数字化管控系统 Demo，聚焦"采购→到货验收→入库→库存管理"核心链路。

## 系统功能

### 供应商准入与主数据协同 (Phase 1)
- 供应商注册邀请与自助注册
- 供应商资格评审项目管理
- 资质文件上传与评审流程
- 资质过期预警与重认证

### 寻源与合同协同 (Phase 2)
- 寻源项目发布（RFQ/RFP/RFI）
- 供应商邀请与投标管理
- 开标比价与授标
- 合同草案生成与在线签署

### 预测与订单执行协同 (Phase 3)
- 采购预测发布与产能响应
- 采购订单发布与确认
- 要货计划确认与调整
- ASN 创建与送货计划管理
- 收货验收与入库

### 财务结算协同 (Phase 4)
- 结算单创建与审核
- 发票管理与三单匹配
- 付款申请与审批

### 公告栏运营
- 公告、政策、操作指引发布
- 已读记录管理

## 技术架构

### 后端
- **框架**: FastAPI + SQLAlchemy 2.0 (async)
- **数据库**: SQLite (开发) / PostgreSQL (生产)
- **API文档**: Swagger UI (/docs)

### 前端
- **框架**: React 18 + TypeScript
- **UI库**: Ant Design 5.x
- **状态管理**: Zustand
- **构建工具**: Vite

## 快速启动

### 开发环境

```bash
# 后端：安装依赖 + 初始化数据库 + 启动服务（端口 8000）
cd backend && pip3 install -r requirements.txt && python3 init_db.py && uvicorn app.main:app --host 0.0.0.0 --port 8000

# 前端：安装依赖 + 启动开发服务器（端口 5000）
cd frontend && pnpm install && npx vite --port 5000 --host 0.0.0.0
```

### 生产环境

```bash
# 构建
pnpm build

# 启动服务（前端静态服务器 + API 代理）
node server.mjs
```

## 访问地址

| 服务 | 地址 |
|------|------|
| 前端界面 | http://localhost:5000 |
| API文档 | http://localhost:8000/docs |
| 健康检查 | http://localhost:8000/health |

## 项目结构

```
supply-chain-demo/
├── .coze                    # Coze 项目配置
├── .cozeproj               # Coze 脚手架脚本
├── backend/                 # FastAPI 后端
│   ├── app/
│   │   ├── api/            # API 路由层
│   │   ├── core/           # 核心配置
│   │   ├── models/         # ORM 模型
│   │   └── schemas/        # Pydantic Schema
│   ├── init_db.py          # 数据库初始化
│   └── requirements.txt    # Python 依赖
├── frontend/               # React 前端
│   ├── src/
│   │   ├── pages/         # 页面组件
│   │   │   ├── buyer/     # 采购端页面
│   │   │   └── supplier/ # 供应商端页面
│   │   ├── components/    # 公共组件
│   │   ├── api/           # API 调用
│   │   └── store/         # Zustand 状态
│   └── package.json
├── docs/                   # 设计文档
│   ├── PRD.md             # 产品需求文档
│   └── DDD-领域设计.md    # DDD 领域设计
├── tests/                  # 测试
│   └── api/               # API 测试
└── server.mjs             # 生产环境静态服务器
```

## API 接口清单

### 供应商管理
| 方法 | 路径 | 功能 |
|------|------|------|
| GET | `/suppliers/` | 供应商列表 |
| POST | `/suppliers/` | 创建供应商 |
| GET | `/suppliers/{id}` | 供应商详情 |
| GET | `/supplier-portal/profile/{id}` | 供应商 Profile |
| GET | `/supplier-portal/profile/{id}/qualifications` | 供应商资质 |

### 寻源与合同
| 方法 | 路径 | 功能 |
|------|------|------|
| GET | `/sourcing/projects` | 寻源项目列表 |
| POST | `/sourcing/projects` | 创建寻源项目 |
| GET | `/sourcing/projects/{id}` | 寻源项目详情 |
| POST | `/sourcing/projects/{id}/award` | 授标 |
| GET | `/contracts/` | 合同列表 |
| GET | `/contracts/{id}` | 合同详情 |
| POST | `/contracts/{id}/sign` | 合同签署 |

### 采购订单
| 方法 | 路径 | 功能 |
|------|------|------|
| GET | `/purchase-orders/` | 采购订单列表 |
| GET | `/purchase-orders/{id}` | 订单详情 |
| POST | `/purchase-orders/` | 创建采购订单 |
| GET | `/supplier-portal/orders` | 供应商订单列表 |

### 物流仓储
| 方法 | 路径 | 功能 |
|------|------|------|
| GET | `/logistics/shipment-notes/` | 发货单列表 |
| GET | `/logistics/receipts/` | 入库单列表 |
| POST | `/logistics/receipts/` | 创建入库单 |

### 财务结算
| 方法 | 路径 | 功能 |
|------|------|------|
| GET | `/financial/statements/` | 结算单列表 |
| GET | `/financial/invoices/` | 发票列表 |
| GET | `/financial/payments/` | 付款记录 |

### 公告栏
| 方法 | 路径 | 功能 |
|------|------|------|
| GET | `/announcements/` | 公告列表 |
| POST | `/announcements/` | 发布公告 |
| GET | `/announcements/{id}` | 公告详情 |

## 许可证

MIT License
