"""白酒供应链管理系统 - FastAPI主应用"""
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.api import suppliers, materials, products, purchase_orders, sales_orders, production, warehouses, dashboard, supplier_portal, supplier_qualification, qualification, sourcing, announcements

app = FastAPI(title="白酒供应链管理系统", description="白酒供应链全流程管理API", version="1.0.0", docs_url="/docs", redoc_url="/redoc")

app.add_middleware(CORSMiddleware, allow_origins=["*"], allow_credentials=True, allow_methods=["*"], allow_headers=["*"])

app.include_router(suppliers.router)
app.include_router(materials.router)
app.include_router(products.router)
app.include_router(purchase_orders.router)
app.include_router(sales_orders.router)
app.include_router(production.router)
app.include_router(warehouses.router)
app.include_router(dashboard.router)
app.include_router(supplier_portal.router)
app.include_router(supplier_qualification.router)
app.include_router(qualification.router)
app.include_router(sourcing.router)
app.include_router(announcements.router)

@app.get("/", tags=["首页"])
async def root():
    return {"name": "白酒供应链管理系统", "version": "1.0.0", "docs": "/docs"}

@app.get("/health", tags=["健康检查"])
async def health_check():
    return {"status": "healthy"}
