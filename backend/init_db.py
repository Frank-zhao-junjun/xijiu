"""Initialize database"""
import asyncio
from datetime import datetime, timedelta
from app.core.database import async_engine, Base, AsyncSessionLocal
from app.models.supply_chain import Supplier, Material, Product, PurchaseOrder, PurchaseOrderItem, SalesOrder, ProductionRecord, MaterialUsage, Warehouse

async def init_database():
    print("Creating database tables...")
    async with async_engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    print("✅ Database tables created!")

async def seed_demo_data():
    print("Adding demo data...")
    async with AsyncSessionLocal() as session:
        from sqlalchemy import select
        result = await session.execute(select(Supplier))
        if result.scalars().first():
            print("Demo data already exists, skipping...")
            return
        
        suppliers = [
            Supplier(name="贵州红缨子高粱种植基地", contact_person="张三", phone="13800138001", email="zhangsan@example.com", address="贵州省茅台镇", rating=4.8),
            Supplier(name="四川泸州老窖原料供应商", contact_person="李四", phone="13800138002", email="lisi@example.com", address="四川省泸州市", rating=4.6),
            Supplier(name="江苏酒曲专业合作社", contact_person="王五", phone="13800138003", email="wangwu@example.com", address="江苏省宿迁市", rating=4.9),
            Supplier(name="宜宾五粮液原料基地", contact_person="赵六", phone="13800138004", email="zhaoliu@example.com", address="四川省宜宾市", rating=4.7)
        ]
        session.add_all(suppliers)
        await session.flush()
        
        materials_list = [
            Material(name="红缨子糯高粱", category="粮食类", unit="吨", unit_price=8500.0, stock_quantity=500.0, reorder_point=100.0, supplier_id=suppliers[0].id, origin="贵州茅台镇"),
            Material(name="优质小麦", category="粮食类", unit="吨", unit_price=3200.0, stock_quantity=200.0, reorder_point=50.0, supplier_id=suppliers[1].id, origin="河南"),
            Material(name="高温大曲", category="酵母类", unit="吨", unit_price=12000.0, stock_quantity=80.0, reorder_point=20.0, supplier_id=suppliers[2].id, origin="江苏宿迁"),
            Material(name="小麦曲", category="酵母类", unit="吨", unit_price=9500.0, stock_quantity=60.0, reorder_point=15.0, supplier_id=suppliers[2].id, origin="江苏宿迁"),
            Material(name="糯米", category="粮食类", unit="吨", unit_price=4000.0, stock_quantity=150.0, reorder_point=30.0, supplier_id=suppliers[3].id, origin="四川"),
            Material(name="包装材料", category="辅料类", unit="套", unit_price=15.0, stock_quantity=50000.0, reorder_point=10000.0, supplier_id=suppliers[1].id, origin="四川成都")
        ]
        session.add_all(materials_list)
        await session.flush()
        
        products_list = [
            Product(name="53度飞天茅台", brand="茅台", category="酱香型", abv=53.0, specification="500ml", unit_price=1499.0, stock_quantity=1000, description="酱香突出、幽雅细腻"),
            Product(name="52度五粮液普五", brand="五粮液", category="浓香型", abv=52.0, specification="500ml", unit_price=999.0, stock_quantity=2000, description="香气悠久、味醇厚"),
            Product(name="42度洋河天之蓝", brand="洋河", category="绵柔型", abv=42.0, specification="480ml", unit_price=458.0, stock_quantity=3000, description="绵柔型白酒典范"),
            Product(name="53度习酒窖藏1988", brand="习酒", category="酱香型", abv=53.0, specification="500ml", unit_price=698.0, stock_quantity=1500, description="酱香突出、陈香舒适"),
            Product(name="52度泸州老窖特曲", brand="泸州老窖", category="浓香型", abv=52.0, specification="500ml", unit_price=328.0, stock_quantity=5000, description="窖香浓郁、饮后尤香")
        ]
        session.add_all(products_list)
        await session.flush()
        
        po1 = PurchaseOrder(order_no="PO20260411001", supplier_id=suppliers[0].id, total_amount=85000.0, status="delivered", expected_delivery_date=datetime.now()-timedelta(days=5), actual_delivery_date=datetime.now()-timedelta(days=5))
        session.add(po1)
        await session.flush()
        session.add(PurchaseOrderItem(purchase_order_id=po1.id, material_id=materials_list[0].id, quantity=10.0, unit_price=8500.0, subtotal=85000.0))
        
        session.add(SalesOrder(order_no="SO20260411001", product_id=products_list[0].id, customer_name="华润万家超市", customer_contact="13900139001", quantity=50, unit_price=1499.0, total_amount=74950.0, status="delivered", shipping_address="深圳市南山区科技园", actual_ship_date=datetime.now()-timedelta(days=2)))
        session.add(SalesOrder(order_no="SO20260411002", product_id=products_list[1].id, customer_name="永辉超市", customer_contact="13900139002", quantity=100, unit_price=999.0, total_amount=99900.0, status="shipped", shipping_address="上海市浦东新区", expected_ship_date=datetime.now()+timedelta(days=1)))
        session.add(SalesOrder(order_no="SO20260411003", product_id=products_list[4].id, customer_name="家乐福", customer_contact="13900139003", quantity=200, unit_price=328.0, total_amount=65600.0, status="pending", shipping_address="北京市朝阳区"))
        
        pr = ProductionRecord(product_id=products_list[0].id, batch_no="MT2026041101", quantity=1000, qualified_quantity=980, quality_rate=98.0, operator="李师傅")
        session.add(pr)
        await session.flush()
        session.add(MaterialUsage(production_record_id=pr.id, material_name="红缨子糯高粱", quantity=50.0))
        session.add(MaterialUsage(production_record_id=pr.id, material_name="高温大曲", quantity=15.0))
        
        session.add_all([
            Warehouse(name="一号原料仓库", location="茅台镇原料仓库A区", capacity=5000, current_stock=1500, manager="陈经理"),
            Warehouse(name="二号成品仓库", location="茅台镇成品仓库B区", capacity=10000, current_stock=4500, manager="刘经理"),
            Warehouse(name="三号包装材料库", location="茅台镇包装仓库C区", capacity=100000, current_stock=50000, manager="周经理")
        ])
        
        await session.commit()
        print("✅ Demo data added successfully!")

async def main():
    await init_database()
    await seed_demo_data()
    await async_engine.dispose()

if __name__ == "__main__":
    asyncio.run(main())
