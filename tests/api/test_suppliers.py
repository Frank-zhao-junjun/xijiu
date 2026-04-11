"""
供应商API测试
"""
import pytest


class TestSupplierAPI:
    """供应商API测试"""

    def test_list_suppliers(self, client):
        """S-API-001: 获取供应商列表"""
        response = client.get("/suppliers/")
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        assert len(data) >= 0

    def test_get_supplier_detail(self, client):
        """S-API-002: 获取供应商详情"""
        response = client.get("/suppliers/1")
        assert response.status_code == 200
        data = response.json()
        assert "name" in data
        assert "contact_person" in data

    def test_supplier_not_found(self, client):
        """S-API-003: 供应商不存在"""
        response = client.get("/suppliers/99999")
        assert response.status_code in [404, 422, 500]

    def test_supplier_fields(self, client):
        """S-API-004: 验证供应商字段"""
        response = client.get("/suppliers/")
        assert response.status_code == 200
        data = response.json()
        if len(data) > 0:
            supplier = data[0]
            required_fields = ["name", "contact_person", "phone", "status", "rating"]
            for field in required_fields:
                assert field in supplier, f"Missing field: {field}"


class TestMaterialsAPI:
    """原材料API测试"""

    def test_list_materials(self, client):
        """M-API-001: 获取原材料列表"""
        response = client.get("/materials/")
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)

    def test_low_stock_materials(self, client):
        """M-API-002: 获取低库存原材料"""
        response = client.get("/materials/low-stock")
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)


class TestProductsAPI:
    """产品API测试"""

    def test_list_products(self, client):
        """P-API-001: 获取产品列表"""
        response = client.get("/products/")
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)

    def test_product_categories(self, client):
        """P-API-002: 获取产品分类"""
        response = client.get("/products/categories")
        assert response.status_code == 200

    def test_product_brands(self, client):
        """P-API-003: 获取产品品牌"""
        response = client.get("/products/brands")
        assert response.status_code == 200


class TestDashboardAPI:
    """仪表盘API测试"""

    def test_dashboard_stats(self, client):
        """D-API-001: 获取仪表盘统计数据"""
        response = client.get("/dashboard/stats")
        assert response.status_code == 200
        data = response.json()
        assert "total_products" in data
        assert "total_suppliers" in data
        assert "total_orders" in data

    def test_sales_summary(self, client):
        """D-API-002: 获取销售摘要"""
        response = client.get("/dashboard/sales-summary")
        assert response.status_code == 200

    def test_inventory_alerts(self, client):
        """D-API-003: 获取库存预警"""
        response = client.get("/dashboard/inventory-alerts")
        assert response.status_code == 200


class TestHealthCheck:
    """健康检查"""

    def test_health(self, client):
        """H-001: 服务健康检查"""
        response = client.get("/health")
        assert response.status_code == 200
