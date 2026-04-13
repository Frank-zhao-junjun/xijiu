# Ralph 闭环（本仓库）

面向 `docs/US.txt` 中的用户故事，采用 **执行 → 验证 → 修复 → 重复** 的闭环，直到客观验收通过。

## 每轮迭代

1. **读规范**：打开 `docs/US.txt` 与下方「验收映射」中的目标 US。
2. **改实现**：后端 `backend/app/api/`、前端 `frontend/src/`。
3. **跑验证**（在 `xijiu` 根目录）：
   - 后端：`cd backend && python init_db.py && uvicorn app.main:app --host 0.0.0.0 --port 8000`
   - **US 全量测试（含 Docker 部署）**：项目根目录执行 `.\scripts\run-us-tests.ps1`（或 `./scripts/run-us-tests.sh`）；经 Nginx 验证加 `-ThroughNginx` / `--nginx`；干净库加 `-Fresh` / `--fresh`。
   - 仅 pytest：`pip install -r requirements-dev.txt` 后 `pytest tests/api/test_user_stories_smoke.py -v`（**勿并行**，依赖共享状态 `ST`；`XIJIU_API_BASE` 指向后端或 `http://127.0.0.1:3000`）
   - 前端：`cd frontend && pnpm install && pnpm exec vite --port 5000`
4. **对结果**：失败则根据报错修复后回到步骤 2。

## 验收映射（US → 主要能力）

| 区间 | 模块 | 说明 |
|------|------|------|
| US-101~109 | `supplier-portal`, `qualification`, `supplier_qualification` | 准入、评审、资质 |
| US-201~208 | `sourcing`（`/sourcing/*`, `/contracts/*`） | 寻源、合同、签署 |
| US-301~302 | `collaboration` `/collaboration/forecasts*` | 预测发布与产能响应 |
| US-303~304 | `purchase_orders` | 订单确认/拒绝/异议；变更仍用 `PUT` |
| US-305~306 | `collaboration` `/collaboration/delivery-schedules*` | 要货计划 |
| US-307~309 | `logistics` `/logistics/shipment-notes*` | ASN、装箱批次 |
| US-310 | `logistics/receipts` | 收货与质检结果展示 |
| US-401~405 | `financial` | 结算审核、发票、三单匹配、付款 |
| US-501 | `announcements` | 公告与已读 |

更细的拆分（如 US-xxx-1 / -2）在采购/供应商双端由 **同一 API + 不同页面** 覆盖。

## 占位符（若接入外部系统）

ERP/SRM/电子签/WMS 的数据同步可在对应路由内替换为 **出站/入站适配器**，本仓库提供可运行的协同语义与状态机演示。
