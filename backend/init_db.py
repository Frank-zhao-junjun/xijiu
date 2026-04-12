"""Initialize database"""
import asyncio
import json
from datetime import datetime, timedelta
from app.core.database import async_engine, Base, AsyncSessionLocal
from app.models.supply_chain import (Supplier, Material, Product, PurchaseOrder, PurchaseOrderItem, SalesOrder, ProductionRecord, MaterialUsage, Warehouse, ShipmentNote, ShipmentNoteItem, SupplierInvitation, SupplierRegistration, SupplierCertification, SupplierAlert, QualificationProject, QualificationSubmission, SourcingProject, SourcingInvitation, SourcingBid, SourcingAward, ContractTemplate, Contract, ContractComment, PurchaseForecast, ForecastResponse, DeliverySchedule, ASN, Receipt, SettlementStatement, Invoice, Payment, User, Announcement, AnnouncementRead, AnnouncementType)

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

        # 创建系统用户（用于外键引用）
        from app.models.supply_chain import User
        users = [
            User(username="admin", display_name="系统管理员", role="buyer"),
            User(username="buyer1", display_name="张明远", role="buyer"),
            User(username="buyer2", display_name="李采购员", role="buyer"),
            User(username="buyer3", display_name="王采购员", role="buyer"),
        ]
        session.add_all(users)
        await session.flush()

        suppliers = [
            Supplier(name="贵州红缨子高粱种植基地", contact_person="张三", phone="13800138001", email="zhangsan@example.com", address="贵州省茅台镇", rating=4.8,
                     origin_type="核心产区", main_category="粮食类", annual_capacity=2000.0, cooperation_years=3, quality_score=4.9, delivery_score=4.7, service_score=4.8,
                     qualifications=json.dumps([
                         {"name": "食品生产许可证", "type": "SC", "cert_no": "SC11552038200099", "issue_date": "2022-01-15", "expire_date": "2027-01-14", "status": "valid"},
                         {"name": "有机产品认证", "type": "有机", "cert_no": "ORG-2022-GZ001", "issue_date": "2022-06-01", "expire_date": "2025-05-31", "status": "valid"}
                     ], ensure_ascii=False)),
            Supplier(name="四川泸州老窖原料供应商", contact_person="李四", phone="13800138002", email="lisi@example.com", address="四川省泸州市", rating=4.6,
                     origin_type="一般产区", main_category="粮食类/辅料类", annual_capacity=5000.0, cooperation_years=2, quality_score=4.5, delivery_score=4.6, service_score=4.4,
                     qualifications=json.dumps([
                         {"name": "食品经营许可证", "type": "经营", "cert_no": "JY15105020001234", "issue_date": "2021-03-10", "expire_date": "2026-03-09", "status": "valid"}
                     ], ensure_ascii=False)),
            Supplier(name="江苏酒曲专业合作社", contact_person="王五", phone="13800138003", email="wangwu@example.com", address="江苏省宿迁市", rating=4.9,
                     origin_type="一般产区", main_category="酵母类", annual_capacity=800.0, cooperation_years=5, quality_score=5.0, delivery_score=4.8, service_score=4.9,
                     qualifications=json.dumps([
                         {"name": "食品生产许可证", "type": "SC", "cert_no": "SC11332130001567", "issue_date": "2020-08-20", "expire_date": "2025-08-19", "status": "valid"},
                         {"name": "ISO22000", "type": "质量体系", "cert_no": "ISO-2020-JS001", "issue_date": "2021-01-01", "expire_date": "2024-12-31", "status": "expiring_soon"}
                     ], ensure_ascii=False)),
            Supplier(name="宜宾五粮液原料基地", contact_person="赵六", phone="13800138004", email="zhaoliu@example.com", address="四川省宜宾市", rating=4.7,
                     origin_type="一般产区", main_category="粮食类", annual_capacity=3000.0, cooperation_years=1, quality_score=4.6, delivery_score=4.5, service_score=4.7,
                     qualifications=json.dumps([], ensure_ascii=False))
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
        
        # ===== 采购订单（多种状态，用于协同演示）=====
        po1 = PurchaseOrder(order_no="PO20260411001", supplier_id=suppliers[0].id, total_amount=85000.0, status="delivered",
                            expected_delivery_date=datetime.now()-timedelta(days=5), actual_delivery_date=datetime.now()-timedelta(days=5),
                            created_by="张明远")
        session.add(po1); await session.flush()
        session.add(PurchaseOrderItem(purchase_order_id=po1.id, material_id=materials_list[0].id, quantity=10.0, unit_price=8500.0, subtotal=85000.0))

        # 待供应商确认的订单
        po2 = PurchaseOrder(order_no="PO20260412001", supplier_id=suppliers[0].id, total_amount=127500.0, status="pending",
                            expected_delivery_date=datetime.now()+timedelta(days=10), notes="本季度第二批高粱采购", created_by="张明远")
        session.add(po2); await session.flush()
        session.add(PurchaseOrderItem(purchase_order_id=po2.id, material_id=materials_list[0].id, quantity=15.0, unit_price=8500.0, subtotal=127500.0))

        # 已确认待发货
        po3 = PurchaseOrder(order_no="PO20260411002", supplier_id=suppliers[1].id, total_amount=64000.0, status="confirmed",
                            expected_delivery_date=datetime.now()+timedelta(days=3), supplier_confirmed_at=datetime.now()-timedelta(days=1),
                            created_by="李采购员")
        session.add(po3); await session.flush()
        session.add(PurchaseOrderItem(purchase_order_id=po3.id, material_id=materials_list[1].id, quantity=20.0, unit_price=3200.0, subtotal=64000.0))

        # 已发货/运输中
        po4 = PurchaseOrder(order_no="PO20260410001", supplier_id=suppliers[2].id, total_amount=36000.0, status="shipped",
                            expected_delivery_date=datetime.now()-timedelta(days=1), supplier_confirmed_at=datetime.now()-timedelta(days=5),
                            created_by="王采购员")
        session.add(po4); await session.flush()
        session.add(PurchaseOrderItem(purchase_order_id=po4.id, material_id=materials_list[2].id, quantity=3.0, unit_price=12000.0, subtotal=36000.0))

        # ===== 送货单(ASN) 演示数据 =====
        asn1 = ShipmentNote(shipment_no="ASN20260410001", purchase_order_id=po4.id, supplier_id=suppliers[2].id,
                           status="in_transit", carrier_name="顺丰速运", tracking_no="SF1234567890",
                           vehicle_no="川C·D8888", driver_name="陈师傅", driver_phone="13900001111",
                           expected_arrival=datetime.now()-timedelta(hours=6), actual_arrival=None,
                           shipping_address="江苏省宿迁市酒曲合作社仓库", receiving_warehouse="一号原料仓库",
                           total_quantity=3.0)
        session.add(asn1); await session.flush()
        session.add(ShipmentNoteItem(shipment_note_id=asn1.id, material_id=materials_list[2].id,
                                     material_name="高温大曲", quantity=3.0, unit="吨",
                                     batch_no="JQ-2026-04-001", production_date=datetime.now()-timedelta(days=30),
                                     origin_location="江苏宿迁发酵车间A区", quality_grade="特级",
                                     package_count=15))
        
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
        
        # ===== 供应商资质证书（用于演示到期预警）=====
        from app.models.supply_chain import SupplierCertification, SupplierAlert
        certs = [
            # 即将到期的资质（7天后到期 -> 触发7天预警）
            SupplierCertification(
                supplier_id=suppliers[2].id, cert_type="质量体系认证",
                cert_name="ISO22000食品安全管理体系认证",
                cert_no="ISO-2020-JS001",
                issue_date=datetime(2021, 1, 1),
                expiry_date=datetime.now() + timedelta(days=7),
                status="valid"
            ),
            # 15天后到期
            SupplierCertification(
                supplier_id=suppliers[1].id, cert_type="生产许可证",
                cert_name="食品生产许可证",
                cert_no="JY15105020001234",
                issue_date=datetime(2021, 3, 10),
                expiry_date=datetime.now() + timedelta(days=15),
                status="valid"
            ),
            # 已过期资质
            SupplierCertification(
                supplier_id=suppliers[2].id, cert_type="行业资质",
                cert_name="有机产品认证",
                cert_no="ORG-2022-GZ001",
                issue_date=datetime(2022, 6, 1),
                expiry_date=datetime.now() - timedelta(days=5),
                status="expired"
            ),
            # 正常资质（1年后到期）
            SupplierCertification(
                supplier_id=suppliers[0].id, cert_type="营业执照",
                cert_name="营业执照（统一社会信用代码）",
                cert_no="91520382MA6DJXXX01",
                issue_date=datetime(2020, 1, 1),
                expiry_date=datetime.now() + timedelta(days=365),
                status="valid"
            ),
        ]
        session.add_all(certs)
        await session.flush()

        # 资质预警
        alerts = [
            SupplierAlert(
                supplier_id=suppliers[2].id,
                alert_type="cert_expiring",
                certification_id=certs[0].id,
                message="【ISO22000食品安全管理体系认证】将于7天后到期，请及时重认证",
                days_before_expiry=7
            ),
            SupplierAlert(
                supplier_id=suppliers[2].id,
                alert_type="cert_expired",
                certification_id=certs[2].id,
                message="【有机产品认证】已于5天前到期，请立即重认证",
                days_before_expiry=0
            ),
        ]
        session.add_all(alerts)

        # ===== 公告栏种子数据 =====
        from app.models.supply_chain import Announcement, AnnouncementType
        
        announcements = [
            Announcement(
                title="【重要】2026年度供应商资质年审通知",
                content="各供应商伙伴：\n\n根据《供应商管理办法》规定，现启动2026年度供应商资质年审工作。请各供应商于5月31日前完成以下事项：\n\n1. 更新营业执照、食品生产许可证等证照信息\n2. 提交上年度供货质量评估报告\n3. 确认本年度供货能力及价格清单\n\n逾期未完成的供应商，将影响2026年度采购订单分配。感谢配合！",
                announcement_type=AnnouncementType.ANNOUNCEMENT,
                priority=2,
                is_pinned=1,
                published_by="张明远",
                view_count=128
            ),
            Announcement(
                title="关于规范送货单据填写的通知",
                content="为确保入库流程顺畅，请各供应商在送货时注意以下事项：\n\n1. 送货单需加盖供应商公章或合同专用章\n2. 批号必须与质检报告一致\n3. 随货附上对应的质检报告原件\n4. 运输车辆信息需提前在系统中登记\n\n如有疑问，请联系采购部李经理（分机：8012）。",
                announcement_type=AnnouncementType.GUIDE,
                priority=1,
                is_pinned=0,
                published_by="李采购员",
                view_count=86
            ),
            Announcement(
                title="关于实施供应商分级管理的通知",
                content="各供应商伙伴：\n\n为进一步优化供应链管理，我司将自2026年4月1日起实施供应商分级管理方案：\n\n【A级供应商】优先合作、账期优惠、新品推荐\n【B级供应商】稳定合作、标准账期\n【C级供应商】观察期、缩减订单份额\n【D级供应商】淘汰名单\n\n评级依据：质量评分(40%) + 交期评分(30%) + 服务评分(20%) + 资质合规(10%)\n\n详情请查阅附件《供应商分级评定办法》。",
                announcement_type=AnnouncementType.POLICY,
                priority=1,
                is_pinned=0,
                published_by="张明远",
                view_count=215
            ),
            Announcement(
                title="端午节假日期间送货安排",
                content="各供应商：\n\n端午节假期（6月10日-6月12日）期间仓库收货安排如下：\n\n- 6月9日（周一）：最后收货日\n- 6月10日-12日：停止收货\n- 6月13日（周四）：恢复正常\n\n请提前安排送货计划，避免货物滞留在途。如有紧急情况，请联系仓库值班电话：139-0000-8888。",
                announcement_type=AnnouncementType.ANNOUNCEMENT,
                priority=0,
                is_pinned=0,
                published_by="王采购员",
                view_count=54
            ),
            Announcement(
                title="供应商门户系统升级通知",
                content="各供应商伙伴：\n\n我司供应商门户系统将于4月20日凌晨2:00-6:00进行版本升级，届时系统将暂停服务。\n\n升级内容：\n1. 新增移动端H5版本\n2. 优化订单推送通知\n3. 增加对账单在线确认功能\n\n如有紧急业务处理，请联系采购部值班人员。给您带来不便，敬请谅解！",
                announcement_type=AnnouncementType.ANNOUNCEMENT,
                priority=1,
                is_pinned=0,
                published_by="系统管理员",
                view_count=102
            ),
        ]
        session.add_all(announcements)

        await session.commit()
        print("✅ Demo data added successfully!")

async def main():
    await init_database()
    await seed_demo_data()
    await async_engine.dispose()

if __name__ == "__main__":
    asyncio.run(main())
