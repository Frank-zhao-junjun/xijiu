"""
pytest配置文件 - 简化版
直接测试运行中的API服务
"""
import pytest
import httpx

API_BASE_URL = "http://localhost:8080"


@pytest.fixture
def client():
    """HTTP客户端"""
    with httpx.Client(base_url=API_BASE_URL, timeout=30.0) as c:
        yield c
