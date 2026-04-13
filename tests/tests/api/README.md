# API Tests

pytest API测试套件

## 快速开始

### 安装依赖

```bash
pip install pytest pytest-asyncio httpx aiosqlite
```

### 运行测试

```bash
# 运行所有测试
pytest -v

# 运行指定测试文件
pytest test_dashboard.py -v

# 运行指定测试用例
pytest test_dashboard.py::TestDashboardAPI::test_get_dashboard_metrics -v

# 生成HTML报告
pytest --html=report.html --self-contained-html
```

## 测试覆盖

### Dashboard API (test_dashboard.py)
- D-API-001 ~ D-API-015

### Purchase Order API (test_purchase_orders.py)
- PO-API-001 ~ PO-API-013

### Supplier API (test_suppliers.py)
- S-API-001 ~ S-API-011

## 环境配置

```bash
# 设置API基础URL
export API_BASE_URL=http://localhost:8080
```

## CI/CD

在 `backend/` 目录运行：

```bash
cd ../backend
pytest ../tests/api -v --tb=short
```
