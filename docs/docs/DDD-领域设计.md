# 白酒供应链系统 DDD领域设计文档

| 版本信息 | |
|---|---|
| 文档版本 | V1.0 |
| 创建日期 | 2026-06-20 |
| 文档状态 | 完成 |
| 基于PRD | 白酒企业供应链数字化Demo系统 V1.0 |

---

## 目录

1. [领域概述](#1-领域概述)
2. [聚合根设计](#2-聚合根设计)
3. [领域服务](#3-领域服务)
4. [领域事件](#4-领域事件)
5. [模块设计（CQRS）](#5-模块设计cqrs)
6. [数据映射](#6-数据映射)
7. [白酒行业特色设计](#7-白酒行业特色设计)

---

## 1. 领域概述

### 1.1 领域全景图

```
┌─────────────────────────────────────────────────────────────────────────────────────┐
│                            白酒供应链领域全景                                        │
├─────────────┬─────────────┬─────────────┬─────────────┬─────────────────────────────┤
│   采购域     │   仓储域    │   物流域    │ 生产协同域  │       数据中台域            │
│ Procurement │  Warehouse  │  Logistics │ Production  │      Data Platform          │
│   Domain    │   Domain    │   Domain   │   Domain    │        Domain               │
├─────────────┼─────────────┼─────────────┼─────────────┼─────────────────────────────┤
│ 供应商管理   │  库房管理   │  运输管理   │  窖池管理   │       数据采集              │
│ 采购计划    │  库存管理   │  签收管理   │  生产计划   │       数据治理              │
│ 采购执行    │  质检协同   │            │  领料协同   │       数据服务              │
├─────────────┴─────────────┴─────────────┴─────────────┴─────────────────────────────┤
│                              白酒行业特色                                            │
│                    原料季节性 | 窖池管理 | 基酒年份 | 质检追溯                        │
└─────────────────────────────────────────────────────────────────────────────────────┘
```

### 1.2 限界上下文定义

| 限界上下文 | 所属领域 | 职责类型 | 核心能力 |
|-----------|---------|---------|---------|
| **供应商管理** | 采购域 | 通用域 | 供应商准入、评级、合作状态 |
| **采购计划** | 采购域 | 通用域 | 年度/月度计划、需求汇总 |
| **采购执行** | 采购域 | 核心域 | 询价比价、下单、跟踪、入库协同 |
| **库房管理** | 仓储域 | 核心域 | 库房配置、库位规划、库容监控 |
| **库存管理** | 仓储域 | 核心域 | 入库、出库、盘点、调拨、冻结 |
| **质检协同** | 仓储域 | 核心域 | 送检、检验、判定、不合格处理 |
| **运输管理** | 物流域 | 支撑域 | 车辆调度、轨迹跟踪、到货预测 |
| **签收管理** | 物流域 | 支撑域 | 到货通知、签收录入、差异处理 |
| **窖池管理** | 生产域 | 核心域 | 窖池档案、出酒率、酒龄管理 |
| **生产计划** | 生产域 | 核心域 | 计划排程、原料需求计算 |
| **领料协同** | 生产域 | 支撑域 | 领料申请、库存锁定、实物调拨 |
| **数据采集** | 中台域 | 通用域 | CDC同步、批量导入、API接入 |
| **数据治理** | 中台域 | 通用域 | 数据清洗、标准化、血缘追踪 |
| **数据服务** | 中台域 | 通用域 | 指标计算、看板配置、告警管理 |

---

## 2. 聚合根设计

### 2.1 采购域（Procurement Domain）

#### 2.1.1 聚合根：供应商（Supplier）

```
┌─────────────────────────────────────────────────────────────────────────────┐
│ 聚合根：供应商（Supplier）                                                    │
├─────────────────────────────────────────────────────────────────────────────┤
│ 【标识】supplier_id: UUID                                                    │
│ 【属性】                                                                     │
│   - supplier_code: String (供应商编码)                                       │
│   - name: String (供应商名称)                                                │
│   - type: SupplierType (综合供应商/粮食供应商/包材供应商)                     │
│   - category: String (主营品类：白酒原料、包材等)                            │
│   - business_license: String (营业执照号)                                    │
│   - contact_person: String (联系人)                                         │
│   - contact_phone: String (联系电话)                                        │
│   - contact_email: String (邮箱)                                            │
│   - bank_name: String (开户银行)                                             │
│   - bank_account: String (银行账号)                                          │
│   - address: Address (注册地址)                                              │
│   - status: SupplierStatus (待审核/合作中/暂停/终止)                          │
│   - credit_level: CreditLevel (A级/B级/C级)                                  │
│   - create_time: DateTime                                                   │
│   - update_time: DateTime                                                   │
├─────────────────────────────────────────────────────────────────────────────┤
│ 【内部实体】                                                                  │
│   - SupplierRatingHistory[] (评级历史记录)                                   │
│     * rating_id: UUID                                                       │
│     * rating_year: Integer (评级年份)                                        │
│     * rating_level: CreditLevel                                             │
│     * rating_date: DateTime                                                 │
│     * rating_by: String (评级人)                                             │
│     * remarks: String (备注)                                                │
│                                                                              │
│   - SupplierQualification[] (资质证明)                                       │
│     * qualification_id: UUID                                                │
│     * type: QualificationType (营业执照/生产许可证/质检报告)                  │
│     * file_url: String (文件URL)                                            │
│     * expire_date: Date (过期日期)                                           │
│     * status: ValidStatus (有效/过期)                                       │
├─────────────────────────────────────────────────────────────────────────────┤
│ 【值对象】                                                                   │
│   - Address: province, city, district, street, postal_code                    │
│   - SupplierRating: current_level, rating_date, valid_until                 │
├─────────────────────────────────────────────────────────────────────────────┤
│ 【聚合方法】                                                                 │
│   + submitForReview() → 提交准入审核，发布 SupplierSubmittedEvent           │
│   + approve(entry) → 审核通过，设置合作状态，发布 SupplierApprovedEvent      │
│   + reject(reason) → 审核拒绝，记录原因，发布 SupplierRejectedEvent           │
│   + updateRating(newLevel, reason) → 更新评级，发布 SupplierRatingChangedEvent│
│   + suspend(reason) → 暂停合作，发布 SupplierSuspendedEvent                   │
│   + resume() → 恢复合作，发布 SupplierResumedEvent                            │
│   + terminate(reason) → 终止合作，发布 SupplierTerminatedEvent               │
│   + addQualification(qualification) → 添加资质证明                           │
│   + removeQualification(qualificationId) → 移除资质证明                     │
├─────────────────────────────────────────────────────────────────────────────┤
│ 【业务规则】                                                                 │
│   1. 供应商编码唯一                                                         │
│   2. 营业执照号格式校验                                                     │
│   3. 资质证明过期前30天预警                                                 │
│   4. 评级变更需要记录历史                                                   │
│   5. 暂停后不可创建新采购订单                                               │
└─────────────────────────────────────────────────────────────────────────────┘
```

#### 2.1.2 聚合根：采购订单（PurchaseOrder）

```
┌─────────────────────────────────────────────────────────────────────────────┐
│ 聚合根：采购订单（PurchaseOrder）                                             │
├─────────────────────────────────────────────────────────────────────────────┤
│ 【标识】order_id: UUID                                                       │
│ 【属性】                                                                     │
│   - order_number: String (订单编号，格式：PO-YYYYMMDD-XXXX)                   │
│   - supplier_id: UUID (供应商ID，引用Supplier聚合)                            │
│   - plan_type: PlanType (年度计划/月度计划/临时计划)                         │
│   - season_tag: SeasonTag (春季/夏季/秋季/冬季，对应原料收购季节)             │
│   - created_by: String (创建人)                                              │
│   - created_at: DateTime                                                     │
│   - approved_by: String (审批人)                                             │
│   - approved_at: DateTime                                                    │
│   - status: OrderStatus (草稿/已提交/已确认/已发货/已到货/已入库/已取消)      │
│   - total_amount: Money (订单总金额)                                         │
│   - currency: String (币种，默认CNY)                                         │
│   - payment_term: PaymentTerm (付款条款：款到发货/货到付款/月结30天)         │
│   - delivery_term: DeliveryTerm (交货条款：FOB/CIF/DDP)                      │
│   - expected_delivery_date: Date (预计交货日期)                               │
│   - actual_delivery_date: Date (实际交货日期)                                 │
│   - remarks: String (备注)                                                   │
├─────────────────────────────────────────────────────────────────────────────┤
│ 【内部实体】                                                                  │
│   - OrderLineItem[] (订单明细)                                               │
│     * line_id: UUID                                                         │
│     * material_id: UUID (物料ID)                                             │
│     * material_name: String (物料名称)                                       │
│     * material_code: String (物料编码)                                       │
│     * specification: String (规格等级，如：淀粉≥72%)                         │
│     * quantity: Decimal (采购数量)                                           │
│     * unit: String (单位：吨/千克/件)                                        │
│     * unit_price: Money (单价)                                              │
│     * subtotal: Money (小计金额)                                            │
│     * delivery_date: Date (计划交货日期)                                     │
│     * actual_delivered_qty: Decimal (实际交货数量)                           │
│     * arrived_qty: Decimal (到货数量)                                       │
│     * accepted_qty: Decimal (验收合格数量)                                   │
│                                                                              │
│   - OrderStatusHistory[] (状态变更历史)                                      │
│     * history_id: UUID                                                      │
│     * from_status: OrderStatus                                              │
│     * to_status: OrderStatus                                                │
│     * change_time: DateTime                                                 │
│     * changed_by: String                                                    │
│     * reason: String (变更原因)                                              │
├─────────────────────────────────────────────────────────────────────────────┤
│ 【值对象】                                                                   │
│   - Money: amount, currency                                                 │
│   - PaymentTerm: term_type, advance_ratio, credit_days                      │
│   - DeliveryTerm: incoterm, delivery_place, loading_port                      │
│   - DeliverySchedule: planned_date, actual_date, is_delayed                  │
├─────────────────────────────────────────────────────────────────────────────┤
│ 【聚合方法】                                                                 │
│   + createDraft(supplier, lineItems) → 创建草稿订单                          │
│   + addLineItem(item) → 添加订单明细                                        │
│   + removeLineItem(lineId) → 移除订单明细                                   │
│   + updateLineItemQuantity(lineId, quantity) → 更新明细数量                  │
│   + submit() → 提交订单，发布 OrderSubmittedEvent                             │
│   + approve(approver) → 审批通过，发布 OrderApprovedEvent                    │
│   + reject(reason) → 审批拒绝，发布 OrderRejectedEvent                        │
│   + confirm() → 供应商确认，发布 OrderConfirmedEvent                          │
│   + ship(lineItemQtyMap) → 发货，更新发货数量，发布 OrderShippedEvent         │
│   + arrive(arriveQtyMap) → 到货登记，发布 OrderArrivedEvent                   │
│   + recordDifference(lineId, difference) → 记录差异                          │
│   + completeStorage() → 完成入库，发布 OrderStoredEvent                       │
│   + cancel(reason) → 取消订单，发布 OrderCancelledEvent                       │
├─────────────────────────────────────────────────────────────────────────────┤
│ 【业务规则】                                                                 │
│   1. 草稿状态可自由修改，其他状态需符合状态机流转                             │
│   2. 订单提交时必须至少有一行明细                                             │
│   3. 发货数量不能超过订单数量                                                 │
│   4. 到货数量超过发货数量时触发差异处理                                       │
│   5. 订单取消后不可再次激活                                                   │
│   6. 不同季节标签影响原料采购优先级                                          │
│   7. 状态机规则：草稿→已提交→已确认→已发货→已到货→已入库                      │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

### 2.2 仓储域（Warehouse Domain）

#### 2.2.1 聚合根：批次（Batch）

```
┌─────────────────────────────────────────────────────────────────────────────┐
│ 聚合根：批次（Batch）                                                         │
├─────────────────────────────────────────────────────────────────────────────┤
│ 【标识】batch_id: UUID                                                       │
│ 【属性】                                                                     │
│   - batch_number: String (批次号，格式：B-YYYYMMDD-XXXX)                      │
│   - material_id: UUID (物料ID)                                               │
│   - material_name: String (物料名称)                                         │
│   - material_code: String (物料编码)                                         │
│   - source_type: SourceType (采购入库/生产入库/调拨入库/退料入库)            │
│   - source_order_id: UUID (来源订单ID，可选)                                 │
│   - quantity: Decimal (批次数量)                                             │
│   - unit: String (单位)                                                      │
│   - storage_location_id: UUID (存储库位ID)                                  │
│   - production_date: Date (生产日期/收购日期)                                │
│   - harvest_season: SeasonTag (原料收购季节：春收/秋收)                       │
│   - origin_region: String (原料产地，如：东北/贵州/豫北)                      │
│   - specification: String (规格等级)                                         │
│   - starch_content: Decimal (淀粉含量%，白酒原料特有关键指标)                │
│   - moisture_content: Decimal (水分含量%)                                    │
│   - base_liquor_year: Integer (基酒年份，白酒行业特有)                       │
│   - storage_start_date: Date (入库时间)                                      │
│   - expiry_date: Date (保质期截止日期)                                       │
│   - current_status: BatchStatus (待检/检验中/合格/不合格/已出库/已冻结)       │
│   - quality_level: QualityLevel (优等/一等/合格/不合格)                       │
│   - trace_code: String (追溯码，用于全链路追溯)                              │
│   - remarks: String (备注)                                                   │
├─────────────────────────────────────────────────────────────────────────────┤
│ 【内部实体】                                                                  │
│   - QualityRecord[] (质检记录)                                               │
│     * record_id: UUID                                                       │
│     * inspection_id: UUID (关联质检单)                                       │
│     * check_item: String (检验项目，如：感官/理化/卫生)                      │
│     * check_method: String (检验方法)                                        │
│     * result: String (检验结果)                                             │
│     * standard_value: String (标准值)                                        │
│     * is_passed: Boolean (是否合格)                                          │
│     * inspector: String                                                      │
│     * inspect_time: DateTime                                                 │
│                                                                              │
│   - TraceRecord[] (追溯记录)                                                 │
│     * trace_id: UUID                                                        │
│     * event_type: TraceEventType (入库/出库/加工/质检/运输)                  │
│     * event_time: DateTime                                                   │
│     * location: String (发生地点)                                           │
│     * handler: String (操作人)                                               │
│     * details: String (详细信息JSON)                                        │
│                                                                              │
│   - InventoryTransaction[] (库存事务记录)                                    │
│     * transaction_id: UUID                                                  │
│     * transaction_type: TransactionType (入库/出库/调拨/盘点/冻结)          │
│     * quantity: Decimal                                                     │
│     * before_quantity: Decimal                                               │
│     * after_quantity: Decimal                                               │
│     * order_id: UUID (关联订单，可选)                                        │
│     * transaction_time: DateTime                                            │
│     * operator: String                                                      │
├─────────────────────────────────────────────────────────────────────────────┤
│ 【值对象】                                                                   │
│   - StorageLocation: warehouse_id, zone, row, shelf, position               │
│   - QualityStandard: check_item, standard_value, upper_limit, lower_limit   │
│   - AgingPeriod: aging_years, aging_start_date, aging_end_date               │
│   - TraceInfo: previous_trace_id, next_trace_ids[], trace_chain            │
├─────────────────────────────────────────────────────────────────────────────┤
│ 【聚合方法】                                                                 │
│   + create(storageInfo) → 创建批次，发布 BatchCreatedEvent                   │
│   + assignLocation(locationId) → 分配库位                                    │
│   + submitForInspection(inspectionId) → 提交质检，发布 InspectionSubmittedEvent│
│   + receiveInspectionResult(result) → 接收质检结果                          │
│   + passInspection() → 质检合格，发布 BatchPassedInspectionEvent             │
│   + failInspection(reason) → 质检不合格，发布 BatchFailedInspectionEvent     │
│   + freeze(reason) → 冻结批次，发布 BatchFrozenEvent                        │
│   + unfreeze() → 解冻批次，发布 BatchUnfrozenEvent                          │
│   + deductQuantity(quantity, reason) → 扣减数量（出库）                   │
│   + transferLocation(newLocation) → 库位转移，记录追溯                      │
│   + addTraceRecord(traceInfo) → 添加追溯记录                                 │
│   + archive() → 归档批次                                                    │
├─────────────────────────────────────────────────────────────────────────────┤
│ 【业务规则】                                                                 │
│   1. 批次号全局唯一                                                          │
│   2. 批次创建后必须经过质检流程                                             │
│   3. 质检不合格批次必须隔离处理                                             │
│   4. 追溯码贯穿批次全生命周期                                               │
│   5. 基酒批次需记录年份，用于勾调计算                                        │
│   6. 原料批次关联收购季节，影响采购计划                                     │
│   7. 保质期前60天触发预警                                                   │
│   8. 批次数量为负时禁止操作                                                  │
│   9. 冻结批次不可出库                                                       │
└─────────────────────────────────────────────────────────────────────────────┘
```

#### 2.2.2 聚合根：质检单（QualityInspection）

```
┌─────────────────────────────────────────────────────────────────────────────┐
│ 聚合根：质检单（QualityInspection）                                          │
├─────────────────────────────────────────────────────────────────────────────┤
│ 【标识】inspection_id: UUID                                                  │
│ 【属性】                                                                     │
│   - inspection_number: String (质检单号，格式：QI-YYYYMMDD-XXXX)               │
│   - batch_id: UUID (批次ID，引用Batch聚合)                                  │
│   - batch_number: String (批次号)                                            │
│   - material_name: String (物料名称)                                         │
│   - material_code: String (物料编码)                                         │
│   - inspection_type: InspectionType (到货检验/定期检验/复检/出库检验)     │
│   - sample_size: Integer (抽样数量)                                         │
│   - sample_code: String (样品编号)                                          │
│   - sampling_location: String (抽样地点)                                    │
│   - sampling_time: DateTime (抽样时间)                                      │
│   - inspector: String (主检员)                                               │
│   - inspector_assist: String (辅助检员)                                      │
│   - status: InspectionStatus (待检/检验中/已判定/已归档)                    │
│   - judgment_result: JudgmentResult (合格/不合格/让步接收)                  │
│   - judgment_by: String (判定人)                                            │
│   - judgment_time: DateTime                                                  │
│   - judgment_remarks: String (判定备注)                                      │
│   - reject_reason: String (不合格原因，可选)                                │
│   - report_url: String (质检报告URL)                                        │
│   - conclusion: String (综合结论)                                           │
├─────────────────────────────────────────────────────────────────────────────┤
│ 【内部实体】                                                                  │
│   - InspectionItem[] (检验项目明细)                                         │
│     * item_id: UUID                                                        │
│     * item_name: String (项目名称：感官/淀粉含量/水分/杂质/卫生指标)         │
│     * item_category: ItemCategory (感观/理化/微生物/安全指标)               │
│     * standard_code: String (执行标准编号)                                  │
│     * standard_value: String (标准值/范围)                                  │
│     * test_method: String (检测方法)                                        │
│     * unit: String (单位)                                                  │
│     * actual_value: String (实际检测值)                                     │
│     * is_passed: Boolean (是否合格)                                         │
│     * deviation: String (偏差值)                                            │
│     * test_equipment: String (检测设备)                                    │
│     * test_time: DateTime                                                    │
│                                                                              │
│   - InspectionAttachment[] (检验附件)                                       │
│     * attachment_id: UUID                                                  │
│     * attachment_type: AttachmentType (照片/报告/原始记录)                   │
│     * file_url: String                                                     │
│     * upload_time: DateTime                                                 │
│     * uploaded_by: String                                                   │
├─────────────────────────────────────────────────────────────────────────────┤
│ 【值对象】                                                                   │
│   - QualityStandard: standard_code, standard_name, limits, test_methods     │
│   - JudgmentResult: result, reason, approver, approve_time                  │
│   - SamplingInfo: sample_size, sampling_method, sample_code                 │
├─────────────────────────────────────────────────────────────────────────────┤
│ 【聚合方法】                                                                 │
│   + create(batch, inspectionType) → 创建质检单，发布 InspectionCreatedEvent  │
│   + sampling(sampleInfo) → 记录抽样信息                                     │
│   + addInspectionItem(item) → 添加检验项目                                  │
│   + updateItemResult(itemId, actualValue) → 更新检验结果                    │
│   + submitForJudgment() → 提交判定，发布 InspectionSubmittedEvent            │
│   + pass(inspector) → 判定合格，发布 InspectionPassedEvent                   │
│   + fail(reason) → 判定不合格，发布 InspectionFailedEvent                    │
│   + conditionalAccept(reason) → 让步接收                                    │
│   + reInspect() → 申请复检，创建新质检单                                    │
│   + attachDocument(attachment) → 添加附件                                   │
│   + archive() → 归档质检单                                                  │
├─────────────────────────────────────────────────────────────────────────────┤
│ 【业务规则】                                                                 │
│   1. 检验项目根据物料类型自动带出标准                                        │
│   2. 所有项目必须完成才能提交判定                                            │
│   3. 任一关键指标不合格则判定不合格                                          │
│   4. 不合格品需隔离并记录原因                                                │
│   5. 质检报告必须上传才能归档                                               │
│   6. 复检时必须使用留样                                                     │
│   7. 感官检验必须在取样后2小时内完成                                        │
│   8. 理化指标检验时效：常规项目24小时，特殊项目72小时                         │
└─────────────────────────────────────────────────────────────────────────────┘
```

#### 2.2.3 聚合根：库存（Inventory）

```
┌─────────────────────────────────────────────────────────────────────────────┐
│ 聚合根：库存（Inventory）                                                     │
├─────────────────────────────────────────────────────────────────────────────┤
│ 【标识】inventory_id: UUID                                                   │
│ 【组合标识】material_id + storage_location_id (物料+库位唯一)                │
│ 【属性】                                                                     │
│   - material_id: UUID (物料ID)                                              │
│   - material_name: String (物料名称)                                        │
│   - material_code: String (物料编码)                                         │
│   - storage_location_id: UUID (库位ID)                                      │
│   - warehouse_id: UUID (所属库房ID)                                          │
│   - quantity: Decimal (当前库存数量)                                         │
│   - available_quantity: Decimal (可用库存)                                  │
│   - frozen_quantity: Decimal (冻结库存)                                     │
│   - locked_quantity: Decimal (预锁库存，用于生产领料)                        │
│   - unit: String (计量单位)                                                  │
│   - safe_stock: Decimal (安全库存)                                          │
│   - max_stock: Decimal (最高库存)                                          │
│   - reorder_point: Decimal (再订货点)                                      │
│   - unit_cost: Money (单位成本)                                             │
│   - total_value: Money (库存总值)                                           │
│   - last_inbound_date: Date (最后入库日期)                                  │
│   - last_outbound_date: Date (最后出库日期)                                  │
│   - avg_storage_days: Integer (平均存储天数)                                │
│   - status: InventoryStatus (正常/预警/不足/超储/冻结)                      │
├─────────────────────────────────────────────────────────────────────────────┤
│ 【内部实体】                                                                  │
│   - InventorySnapshot[] (库存快照)                                          │
│     * snapshot_id: UUID                                                    │
│     * snapshot_date: Date                                                  │
│     * quantity: Decimal                                                    │
│     * total_value: Money                                                   │
│     * snapshot_time: DateTime                                               │
│                                                                              │
│   - InventoryAlert[] (库存预警记录)                                         │
│     * alert_id: UUID                                                      │
│     * alert_type: AlertType (低于安全库存/接近保质期/超储)                  │
│     * alert_level: AlertLevel (提示/警告/紧急)                              │
│     * threshold: Decimal                                                   │
│     * actual_value: Decimal                                                │
│     * is_resolved: Boolean                                                 │
│     * resolve_time: DateTime                                               │
│     * resolve_remarks: String                                              │
├─────────────────────────────────────────────────────────────────────────────┤
│ 【值对象】                                                                   │
│   - StockLevel: current_level, safe_level, max_level, turnover_rate         │
│   - CostInfo: unit_cost, total_cost, currency, last_update_time             │
│   - AlertThreshold: safe_stock, reorder_point, max_stock, expiry_warning    │
├─────────────────────────────────────────────────────────────────────────────┤
│ 【聚合方法】                                                                 │
│   + receiveInbound(batchId, quantity) → 入库，增加库存，发布 InventoryIncreasedEvent│
│   + allocateForProduction(materialReqId, quantity) → 预锁库存               │
│   + confirmAllocation(materialReqId, quantity) → 确认出库                   │
│   + cancelAllocation(materialReqId, quantity) → 取消预锁                    │
│   + freeze(quantity, reason) → 冻结库存                                      │
│   + unfreeze(frozenQty, reason) → 解冻库存                                   │
│   + adjustQuantity(adjustedQty, reason, adjuster) → 库存调整                │
│   + transfer(fromLocation, toLocation, quantity) → 库位调拨                  │
│   + checkAndUpdateStatus() → 检查并更新库存状态                              │
│   + triggerAlert(alertType) → 触发预警                                       │
│   + resolveAlert(alertId, remarks) → 解决预警                               │
│   + updateCost(newCost) → 更新单位成本                                      │
│   + createSnapshot() → 创建库存快照                                        │
├─────────────────────────────────────────────────────────────────────────────┤
│ 【业务规则】                                                                 │
│   1. 可用库存 = 当前库存 - 冻结库存 - 预锁库存                              │
│   2. 库存数量为负时禁止出库操作                                             │
│   3. 低于安全库存时触发预警                                                │
│   4. 冻结库存不可用于出库分配                                               │
│   5. 预锁库存有效期24小时，超时自动释放                                     │
│   6. 库位转移时需要验证目标库位容量                                         │
│   7. 库存调整需要记录原因和审批人                                           │
│   8. 保质期前30天触发预警                                                   │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

### 2.3 物流域（Logistics Domain）

#### 2.3.1 聚合根：运单（Waybill）

```
┌─────────────────────────────────────────────────────────────────────────────┐
│ 聚合根：运单（Waybill）                                                       │
├─────────────────────────────────────────────────────────────────────────────┤
│ 【标识】waybill_id: UUID                                                     │
│ 【属性】                                                                     │
│   - waybill_number: String (运单号，格式：WB-YYYYMMDD-XXXX)                  │
│   - order_id: UUID (关联采购订单ID)                                          │
│   - order_number: String (订单号)                                            │
│   - supplier_id: UUID (供应商ID)                                             │
│   - carrier_id: UUID (承运商ID)                                              │
│   - carrier_name: String (承运商名称)                                        │
│   - vehicle_number: String (车牌号)                                         │
│   - driver_name: String (司机姓名)                                          │
│   - driver_phone: String (司机电话)                                          │
│   - source_location: Location (发货地)                                      │
│   - dest_location: Location (收货地)                                        │
│   - cargo_type: String (货物类型)                                           │
│   - total_quantity: Decimal (总数量)                                        │
│   - total_weight: Decimal (总重量，单位：吨)                                 │
│   - package_count: Integer (件数)                                          │
│   - departure_time: DateTime (发车时间)                                    │
│   - estimated_arrival_time: DateTime (预计到达时间)                          │
│   - actual_arrival_time: DateTime (实际到达时间)                            │
│   - status: WaybillStatus (待发货/在途/已到达/已签收/异常)                   │
│   - temperature_control: TemperatureControl (温控要求：常温/冷藏/保温)      │
│   - cargo_value: Money (货物价值)                                           │
│   - freight_cost: Money (运费)                                              │
├─────────────────────────────────────────────────────────────────────────────┤
│ 【内部实体】                                                                  │
│   - TrackingPoint[] (轨迹点)                                                 │
│     * point_id: UUID                                                        │
│     * point_time: DateTime (记录时间)                                       │
│     * latitude: Decimal (纬度)                                              │
│     * longitude: Decimal (经度)                                             │
│     * location_name: String (位置名称)                                      │
│     * speed: Decimal (速度 km/h)                                            │
│     * heading: Integer (方向角度)                                           │
│     * event_type: TrackEventType (定位/状态上报/到达/离开)                  │
│     * remarks: String (备注)                                                │
│                                                                              │
│   - CargoDetail[] (货物明细)                                                │
│     * detail_id: UUID                                                     │
│     * material_name: String (物料名称)                                     │
│     * quantity: Decimal                                                    │
│     * package_type: String (包装类型)                                       │
│     * package_count: Integer                                              │
│     * is_damaged: Boolean                                                  │
│     * damage_remarks: String (损坏备注)                                     │
│                                                                              │
│   - SignRecord[] (签收记录)                                                 │
│     * sign_id: UUID                                                        │
│     * sign_time: DateTime                                                   │
│     * signed_by: String (签收人)                                           │
│     * sign_type: SignType (本人签收/代收)                                   │
│     * sign_quantity: Decimal (签收数量)                                    │
│     * difference_quantity: Decimal (差异数量)                              │
│     * sign_photo_url: String (签收照片URL)                                 │
│     * remarks: String (备注)                                                │
├─────────────────────────────────────────────────────────────────────────────┤
│ 【值对象】                                                                   │
│   - Location: province, city, district, address, longitude, latitude        │
│   - ETA: estimated_time, confidence, update_reason                         │
│   - CargoInfo: cargo_type, total_quantity, total_weight, special_requirements│
│   - TemperatureRange: min_temp, max_temp, unit (摄氏度)                     │
├─────────────────────────────────────────────────────────────────────────────┤
│ 【聚合方法】                                                                 │
│   + create(orderId, logisticsInfo) → 创建运单                               │
│   + setCarrier(carrierInfo) → 设置承运信息                                  │
│   + depart() → 发车，发布 ShipmentDepartedEvent                              │
│   + addTrackingPoint(point) → 添加轨迹点                                    │
│   + updateETA(newEta) → 更新预计到达时间                                    │
│   + arrive() → 到达目的地，发布 ShipmentArrivedEvent                        │
│   + sign(signInfo) → 签收，发布 ShipmentSignedEvent                          │
│   + recordDifference(lineItems) → 记录差异货物                               │
│   + reportAnomaly(anomalyType, description) → 上报异常                     │
│   + resolveAnomaly(resolution) → 解决异常                                  │
│   + cancel() → 取消运单                                                     │
├─────────────────────────────────────────────────────────────────────────────┤
│ 【业务规则】                                                                 │
│   1. 一个运单只能关联一个采购订单                                            │
│   2. 轨迹点采集间隔不超过30分钟                                            │
│   3. 签收数量与运单货物数量对比，差异超过±3%触发差异处理                    │
│   4. 异常状态需要记录原因和处理结果                                         │
│   5. 温控货物需全程监控温度，超出范围触发预警                               │
│   6. 预计到达时间根据实时路况动态调整                                       │
│   7. 签收照片作为实物交接凭证                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

### 2.4 生产协同域（Production Domain）

#### 2.4.1 聚合根：窖池（PitCellar）

```
┌─────────────────────────────────────────────────────────────────────────────┐
│ 聚合根：窖池（PitCellar）                                                     │
├─────────────────────────────────────────────────────────────────────────────┤
│ 【标识】pit_id: UUID                                                         │
│ 【属性】                                                                     │
│   - pit_code: String (窖池编号，如：1号窖/2号窖)                            │
│   - pit_name: String (窖池名称)                                             │
│   - cellar_name: String (所属窖房名称)                                      │
│   - pit_type: PitType (浓香型/酱香型/清香型/兼香型)                         │
│   - capacity: Decimal (设计容量，单位：吨)                                  │
│   - current_fill_rate: Decimal (当前装窖量/容量%)                          │
│   - status: PitStatus (空闲/发酵中/待蒸馏/蒸馏中/养护中)                   │
│   - activation_date: Date (投料日期/窖池启用日期)                           │
│   - expected_open_date: Date (预计开窖日期)                                 │
│   - actual_open_date: Date (实际开窖日期)                                   │
│   - fermentation_cycle: Integer (发酵周期，天数)                          │
│   - current_cycle_days: Integer (当前发酵天数)                             │
│   - base_liquor_yield: Decimal (出酒率，%)                                 │
│   - base_liquor_grade: Decimal (基酒度数，%)                               │
│   - temperature_range: String (发酵温度范围)                               │
│   - humidity_range: String (发酵湿度范围)                                  │
│   - remarks: String (备注)                                                  │
├─────────────────────────────────────────────────────────────────────────────┤
│ 【内部实体】                                                                  │
│   - FermentationRecord[] (发酵记录)                                         │
│     * record_id: UUID                                                      │
│     * record_date: Date                                                    │
│     * temperature: Decimal (窖温，℃)                                       │
│     * humidity: Decimal (湿度，%)                                           │
│     * acidity: Decimal (酸度)                                              │
│     * sugar_content: Decimal (糖分，%)                                     │
│     * record_by: String (记录人)                                           │
│     * remarks: String (备注)                                               │
│                                                                              │
│   - PitOperation[] (窖池操作记录)                                           │
│     * operation_id: UUID                                                   │
│     * operation_type: OperationType (投料/蒸馏/养护/清理)                  │
│     * operation_date: DateTime                                             │
│     * operator: String                                                     │
│     * materials_used: String (使用物料)                                    │
│     * output_quantity: Decimal (产出数量，可选)                             │
│     * output_quality: String (产出质量，可选)                              │
│     * remarks: String                                                      │
│                                                                              │
│   - BaseLiquorProduction[] (基酒产出记录)                                   │
│     * production_id: UUID                                                  │
│     * production_date: Date                                                │
│     * yield_quantity: Decimal (产出基酒量，吨)                              │
│     * yield_rate: Decimal (出酒率，%)                                       │
│     * alcohol_degree: Decimal (酒精度数，%)                                │
│     * quality_grade: QualityGrade (特级/优级/一级/二级)                    │
│     * aging_year: Integer (宜存年份)                                        │
│     * storage_location: String (存储位置/陶坛编号)                         │
│     * remarks: String                                                      │
├─────────────────────────────────────────────────────────────────────────────┤
│ 【值对象】                                                                   │
│   - FermentationProgress: cycle_days, fill_rate, expected_yield, risk_level│
│   - BaseLiquorYield: yield_quantity, yield_rate, quality_grade, aging_period│
│   - PitEnvironment: temperature, humidity, acidity, recorded_time          │
│   - AgingPeriod: aging_years, aging_start_date, optimal_drink_year         │
├─────────────────────────────────────────────────────────────────────────────┤
│ 【聚合方法】                                                                 │
│   + activate(materials[], expectedCycleDays) → 投料启用，发布 PitActivatedEvent│
│   + recordFermentation(envData) → 记录发酵数据                              │
│   + updateFermentationStatus() → 更新发酵状态                               │
│   + scheduleOpen(expectedDate) → 预约开窖日期                               │
│   + startDistillation() → 开始蒸馏，发布 DistillationStartedEvent           │
│   + completeDistillation(output, yieldRate) → 完成蒸馏，记录产出基酒        │
│   + recordBaseLiquor(baseLiquor) → 记录基酒产出详情                        │
│   + startMaintenance() → 开始养护期                                        │
│   + completeMaintenance() → 完成养护，准备下次投料                          │
│   + idle() → 窖池空闲                                                       │
│   + archive() → 归档窖池历史                                                │
├─────────────────────────────────────────────────────────────────────────────┤
│ 【业务规则】                                                                 │
│   1. 浓香型发酵周期通常60-90天，酱香型需1年以上                             │
│   2. 开窖前必须记录完整的发酵数据                                           │
│   3. 出酒率计算：基酒产量/投料总量×100%                                     │
│   4. 基酒质量等级影响最终产品定价                                          │
│   5. 基酒年份是白酒价值的重要指标                                           │
│   6. 窖池状态必须按状态机流转                                              │
│   7. 发酵温度异常时自动预警                                                 │
│   8. 养护期不少于30天才能下次投料                                           │
└─────────────────────────────────────────────────────────────────────────────┘
```

#### 2.4.2 聚合根：生产工单（ProductionOrder）

```
┌─────────────────────────────────────────────────────────────────────────────┐
│ 聚合根：生产工单（ProductionOrder）                                           │
├─────────────────────────────────────────────────────────────────────────────┤
│ 【标识】order_id: UUID                                                       │
│ 【属性】                                                                     │
│   - order_number: String (工单编号，格式：PRD-YYYYMMDD-XXXX)                 │
│   - product_id: UUID (产品ID)                                               │
│   - product_name: String (产品名称)                                         │
│   - product_code: String (产品编码)                                        │
│   - planned_quantity: Decimal (计划产量，单位：吨)                          │
│   - actual_quantity: Decimal (实际产量)                                      │
│   - unit: String (单位)                                                      │
│   - pit_id: UUID (使用窖池ID)                                                │
│   - production_type: ProductionType (基酒酿造/勾调/包装)                   │
│   - plan_start_date: Date (计划开始日期)                                    │
│   - plan_end_date: Date (计划结束日期)                                       │
│   - actual_start_date: Date (实际开始日期)                                  │
│   - actual_end_date: Date (实际结束日期)                                     │
│   - status: ProductionStatus (计划/已下达/生产中/已完成/已入库/已取消)     │
│   - priority: Priority (普通/紧急)                                          │
│   - created_by: String (创建人)                                             │
│   - created_at: DateTime                                                    │
│   - remarks: String (备注)                                                  │
├─────────────────────────────────────────────────────────────────────────────┤
│ 【内部实体】                                                                  │
│   - MaterialRequisition[] (领料单)                                          │
│     * requisition_id: UUID                                                 │
│     * material_id: UUID                                                    │
│     * material_name: String                                                 │
│     * requested_quantity: Decimal (申请数量)                                │
│     * approved_quantity: Decimal (批准数量)                                 │
│     * issued_quantity: Decimal (已发放数量)                                 │
│     * source_location_id: UUID (领料库位)                                   │
│     * status: RequisitionStatus (待审批/已批准/已领料/已取消)               │
│     * requested_by: String                                                 │
│     * requested_at: DateTime                                                │
│     * issued_by: String                                                     │
│     * issued_at: DateTime                                                   │
│                                                                              │
│   - ProductionRecord[] (生产记录)                                           │
│     * record_id: UUID                                                      │
│     * record_time: DateTime                                                 │
│     * record_type: RecordType (投料/发酵/蒸馏/勾调/包装)                    │
│     * operator: String                                                      │
│     * details: String (详细记录JSON)                                        │
│     * output_quantity: Decimal (产出数量)                                   │
│     * quality_data: String (质量数据JSON)                                   │
├─────────────────────────────────────────────────────────────────────────────┤
│ 【值对象】                                                                   │
│   - ProductionSchedule: plan_start, plan_end, actual_start, actual_end     │
│   - MaterialRequirement: material_id, material_name, required_qty, source    │
│   - OutputPlan: planned_yield, actual_yield, yield_rate, quality_grade      │
├─────────────────────────────────────────────────────────────────────────────┤
│ 【聚合方法】                                                                 │
│   + create(productionPlan) → 创建工单，发布 OrderCreatedEvent                │
│   + submitForApproval() → 提交审批                                          │
│   + approve() → 审批通过，下达工单                                           │
│   + reject(reason) → 审批拒绝                                               │
│   + start() → 开始生产，发布 OrderStartedEvent                               │
│   + createMaterialRequisition(materials[]) → 创建领料单                     │
│   + approveRequisition(reqId, qty) → 批准领料                               │
│   + issueMaterial(reqId, qty) → 发放物料，记录出库                          │
│   + recordProduction(record) → 记录生产数据                                  │
│   + complete(outputQty, outputData) → 完成生产，记录产出                     │
│   + recordOutput(output) → 记录产出入库                                     │
│   + cancel(reason) → 取消工单，发布 OrderCancelledEvent                      │
│   + pause(reason) → 暂停生产                                                │
│   + resume() → 恢复生产                                                     │
├─────────────────────────────────────────────────────────────────────────────┤
│ 【业务规则】                                                                 │
│   1. 工单创建时自动计算原料需求                                              │
│   2. 领料单审批后才能发放物料                                                │
│   3. 物料发放时自动锁定库存                                                 │
│   4. 实际产量与计划产量偏差超过±10%需记录原因                               │
│   5. 生产完成前不允许关闭工单                                               │
│   6. 取消工单时需回退已领物料                                               │
│   7. 基酒工单需要关联窖池记录                                               │
│   8. 勾调工单需要记录配方和比例                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## 3. 领域服务

### 3.1 采购域领域服务

#### 3.1.1 供应商评估服务（SupplierAssessmentService）

```
┌─────────────────────────────────────────────────────────────────────────────┐
│ 领域服务：供应商评估服务（SupplierAssessmentService）                         │
├─────────────────────────────────────────────────────────────────────────────┤
│ 【服务职责】                                                                  │
│   跨供应商聚合和采购订单聚合，评估供应商综合能力                              │
│                                                                              │
│ 【核心方法】                                                                 │
│   + assessSupplier(supplierId): AssessmentResult                            │
│     职责：综合评估供应商能力                                                 │
│     输入：supplierId                                                         │
│     处理：                                                                   │
│       1. 查询供应商基本信息                                                  │
│       2. 查询历史订单交付情况                                               │
│       3. 查询历史质检合格率                                                  │
│       4. 计算交付及时率评分                                                  │
│       5. 计算质量评分                                                        │
│       6. 综合计算综合评分                                                    │
│     输出：AssessmentResult {score, grade, details}                           │
│                                                                              │
│   + validateSupplierForOrder(supplierId, orderItems): ValidationResult       │
│     职责：验证供应商是否可用于特定订单                                       │
│     输入：supplierId, orderItems                                             │
│     处理：                                                                   │
│       1. 检查供应商状态是否为合作中                                          │
│       2. 检查资质是否在有效期内                                             │
│       3. 检查供应商是否主营相关品类                                         │
│       4. 检查信用等级是否满足要求                                           │
│     输出：ValidationResult {isValid, errors[]}                               │
│                                                                              │
│   + recommendSuppliers(materialCategory, criteria): Supplier[]               │
│     职责：推荐合适的供应商                                                   │
│     输入：materialCategory, criteria                                         │
│     处理：                                                                   │
│       1. 按品类筛选供应商                                                    │
│       2. 按评级排序                                                          │
│       3. 按历史交付表现排序                                                 │
│     输出：推荐供应商列表                                                     │
└─────────────────────────────────────────────────────────────────────────────┘
```

#### 3.1.2 采购计划计算服务（PurchasePlanCalculator）

```
┌─────────────────────────────────────────────────────────────────────────────┐
│ 领域服务：采购计划计算服务（PurchasePlanCalculator）                          │
├─────────────────────────────────────────────────────────────────────────────┤
│ 【服务职责】                                                                  │
│   基于生产计划、库存预测、季节性因素计算采购需求                              │
│                                                                              │
│ 【核心方法】                                                                 │
│   + calculatePurchaseRequirement(planMonth): PurchaseRequirement[]          │
│     职责：计算月度采购需求                                                   │
│     输入：planMonth (目标月份)                                                │
│     处理：                                                                   │
│       1. 获取生产计划月度产量                                               │
│       2. 根据配方计算各原料需求量                                           │
│       3. 减去当前库存                                                        │
│       4. 考虑安全库存                                                        │
│       5. 应用季节性系数（旺季提前采购）                                      │
│     输出：采购需求列表                                                       │
│                                                                              │
│   + applySeasonalFactor(materialId, baseQuantity, targetMonth): AdjustedQty │
│     职责：应用季节性系数调整                                                 │
│     输入：materialId, baseQuantity, targetMonth                              │
│     处理：                                                                   │
│       1. 查询物料的收购季节                                                  │
│       2. 判断目标月份与收购季节关系                                         │
│       3. 应用不同系数：                                                     │
│          - 收购季节：系数1.0，原料新鲜、价格优                              │
│          - 收购季节前1月：系数1.2，提前备货                                 │
│          - 收购季节后2月：系数0.8，消耗库存                                 │
│          - 其他月份：系数0.9-1.1                                           │
│     输出：调整后数量                                                         │
│                                                                              │
│   + optimizePurchaseSchedule(requirements[]): PurchaseSchedule[]            │
│     职责：优化采购排期                                                       │
│     输入：采购需求列表                                                       │
│     处理：                                                                   │
│       1. 按物料保质期排序                                                    │
│       2. 按供应商交货周期安排                                               │
│       3. 合并同一供应商的小批量订单                                         │
│     输出：最优采购计划排期                                                   │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

### 3.2 仓储域领域服务

#### 3.2.1 库位分配服务（LocationAllocationService）

```
┌─────────────────────────────────────────────────────────────────────────────┐
│ 领域服务：库位分配服务（LocationAllocationService）                           │
├─────────────────────────────────────────────────────────────────────────────┤
│ 【服务职责】                                                                  │
│   根据物料特性和存储要求，智能分配最优库位                                    │
│                                                                              │
│ 【核心方法】                                                                 │
│   + allocateLocation(batch, strategy): StorageLocation                       │
│     职责：分配最优库位                                                       │
│     输入：batch (批次信息), strategy (分配策略)                              │
│     处理：                                                                   │
│       1. 根据物料特性筛选可用库区（温度/湿度/通风）                          │
│       2. 根据保质期选择库位（保质期短的放门口）                              │
│       3. 考虑先进先出（FIFO）策略                                           │
│       4. 平衡库区利用率                                                     │
│       5. 检查库位容量                                                       │
│     输出：最优库位                                                           │
│                                                                              │
│   + suggestRelocation(inventoryId): RelocationSuggestion[]                   │
│     职责：建议库位调整                                                       │
│     输入：inventoryId                                                        │
│     处理：                                                                   │
│       1. 检查保质期预警                                                     │
│       2. 检查呆滞库存                                                       │
│       3. 检查库区利用率平衡                                                 │
│       4. 生成调整建议                                                       │
│     输出：调整建议列表                                                       │
│                                                                              │
│   + validateStorageCondition(materialId, locationId): ValidationResult       │
│     职责：验证存储条件                                                       │
│     输入：materialId, locationId                                             │
│     处理：                                                                   │
│       1. 检查库区温度是否满足要求                                           │
│       2. 检查库区湿度是否满足要求                                           │
│       3. 检查是否有串味风险（浓香型vs酱香型）                                │
│     输出：验证结果                                                           │
└─────────────────────────────────────────────────────────────────────────────┘
```

#### 3.2.2 库存预警服务（InventoryAlertService）

```
┌─────────────────────────────────────────────────────────────────────────────┐
│ 领域服务：库存预警服务（InventoryAlertService）                               │
├─────────────────────────────────────────────────────────────────────────────┤
│ 【服务职责】                                                                  │
│   监控库存状态，触发各类预警规则                                              │
│                                                                              │
│ 【核心方法】                                                                 │
│   + checkStockLevel(inventoryId): AlertResult                                │
│     职责：检查库存水位                                                       │
│     输入：inventoryId                                                        │
│     处理：                                                                   │
│       1. 获取当前库存和阈值                                                 │
│       2. 判断是否触发预警：                                                 │
│          - 低于安全库存：YELLOW                                             │
│          - 低于再订货点：ORANGE                                              │
│          - 低于安全库存的50%：RED                                            │
│          - 高于最高库存：超储预警                                           │
│       3. 生成预警                                                           │
│     输出：AlertResult                                                        │
│                                                                              │
│   + checkExpiryRisk(batchId): AlertResult                                    │
│     职责：检查保质期风险                                                     │
│     输入：batchId                                                             │
│     处理：                                                                   │
│       1. 计算剩余保质期天数                                                  │
│       2. 判断风险等级：                                                     │
│          - 剩余30天：YELLOW                                                 │
│          - 剩余15天：ORANGE                                                 │
│          - 剩余7天：RED                                                      │
│       3. 建议优先出库                                                       │
│     输出：AlertResult                                                        │
│                                                                              │
│   + checkFreshnessRisk(materialId): AlertResult                               │
│     职责：检查原料新鲜度（白酒行业特有）                                     │
│     输入：materialId                                                         │
│     处理：                                                                   │
│       1. 查询物料收购季节                                                  │
│       2. 计算库存时长                                                      │
│       3. 判断新鲜度风险（粮食原料有最佳使用期）                             │
│     输出：AlertResult                                                        │
│                                                                              │
│   + sendAlertNotification(alert): void                                        │
│     职责：发送预警通知                                                       │
│     输入：alert                                                               │
│     处理：                                                                   │
│       1. 获取预警规则配置                                                   │
│       2. 选择通知渠道                                                       │
│       3. 发送通知                                                           │
│     输出：void                                                                │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

### 3.3 物流域领域服务

#### 3.3.1 运输调度服务（TransportDispatchService）

```
┌─────────────────────────────────────────────────────────────────────────────┐
│ 领域服务：运输调度服务（TransportDispatchService）                            │
├─────────────────────────────────────────────────────────────────────────────┤
│ 【服务职责】                                                                  │
│   优化运输调度，计算最优路线和ETA                                            │
│                                                                              │
│ 【核心方法】                                                                 │
│   + calculateETA(waybillId): ETAInfo                                         │
│     职责：计算预计到达时间                                                   │
│     输入：waybillId                                                          │
│     处理：                                                                   │
│       1. 获取当前轨迹位置                                                  │
│       2. 查询实时路况                                                       │
│       3. 计算到目的地距离                                                   │
│       4. 应用历史平均速度                                                   │
│       5. 考虑天气因素                                                       │
│     输出：ETAInfo {eta, confidence, factors}                                │
│                                                                              │
│   + optimizeRoute(origin, destination, constraints): RoutePlan               │
│     职责：优化运输路线                                                       │
│     输入：origin, destination, constraints                                   │
│     处理：                                                                   │
│       1. 获取多条候选路线                                                  │
│       2. 评估各路线距离、时间、费用                                         │
│       3. 考虑温控要求                                                       │
│       4. 选择最优路线                                                      │
│     输出：RoutePlan                                                          │
│                                                                              │
│   + dispatchVehicle(orderId, requirements): DispatchResult                   │
│     职责：调度车辆                                                           │
│     输入：orderId, requirements                                              │
│     处理：                                                                   │
│       1. 查询可用车辆                                                      │
│       2. 匹配载重需求                                                       │
│       3. 匹配温控要求                                                       │
│       4. 优化装载率                                                        │
│       5. 生成运单                                                           │
│     输出：DispatchResult                                                     │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

### 3.4 生产域领域服务

#### 3.4.1 基酒年份管理服务（BaseLiquorAgingService）

```
┌─────────────────────────────────────────────────────────────────────────────┐
│ 领域服务：基酒年份管理服务（BaseLiquorAgingService）                          │
├─────────────────────────────────────────────────────────────────────────────┤
│ 【服务职责】                                                                  │
│   管理基酒的存储年份，计算最佳勾调时机（白酒行业核心服务）                   │
│                                                                              │
│ 【核心方法】                                                                 │
│   + calculateAgingValue(baseLiquorBatch): AgingValue                          │
│     职责：计算基酒年份价值                                                   │
│     输入：baseLiquorBatch (基酒批次)                                         │
│     处理：                                                                   │
│       1. 计算存储时长                                                        │
│       2. 根据香型确定最佳年份：                                             │
│          - 浓香型：3-5年最佳                                                │
│          - 酱香型：5-10年最佳                                               │
│          - 清香型：1-3年最佳                                                │
│       3. 计算年份溢价系数                                                   │
│     输出：AgingValue {years, optimalRange, premium}                          │
│                                                                              │
│   + suggestBlendingRatio(targetProduct): BlendingPlan                        │
│     职责：建议勾调比例                                                       │
│     输入：targetProduct (目标产品)                                           │
│     处理：                                                                   │
│       1. 查询目标产品的标准配方                                             │
│       2. 检查各年份基酒库存                                                │
│       3. 考虑年份基酒可用量                                                 │
│       4. 计算最优勾调方案                                                  │
│     输出：BlendingPlan                                                      │
│                                                                              │
│   + trackAgingProcess(baseLiquorBatchId): AgingProgress                      │
│     职责：追踪基酒陈酿进度                                                   │
│     输入：baseLiquorBatchId                                                  │
│     处理：                                                                   │
│       1. 获取基酒入库时间                                                  │
│       2. 计算已存储时长                                                    │
│       3. 评估当前风味成熟度                                                │
│       4. 预测最佳饮用时间                                                  │
│     输出：AgingProgress                                                     │
└─────────────────────────────────────────────────────────────────────────────┘
```

#### 3.4.2 生产排程服务（ProductionSchedulingService）

```
┌─────────────────────────────────────────────────────────────────────────────┐
│ 领域服务：生产排程服务（ProductionSchedulingService）                        │
├─────────────────────────────────────────────────────────────────────────────┤
│ 【服务职责】                                                                  │
│   协调窖池产能、原料供应、产品需求进行生产排程                                │
│                                                                              │
│ 【核心方法】                                                                 │
│   + generateProductionSchedule(planMonth): ProductionSchedule                │
│     职责：生成月度生产计划                                                   │
│     输入：planMonth (计划月份)                                               │
│     处理：                                                                   │
│       1. 获取产品需求                                                        │
│       2. 检查窖池可用状态                                                  │
│       3. 检查原料库存                                                      │
│       4. 考虑窖池发酵周期                                                  │
│       5. 生成排程方案                                                      │
│     输出：ProductionSchedule                                                 │
│                                                                              │
│   + checkMaterialAvailability(productionOrder): AvailabilityResult            │
│     职责：检查原料可用性                                                     │
│     输入：productionOrder                                                    │
│     处理：                                                                   │
│       1. 汇总所需物料清单                                                  │
│       2. 检查各物料库存                                                    │
│       3. 计算缺口                                                          │
│       4. 生成采购建议                                                      │
│     输出：AvailabilityResult {isAvailable, shortageItems[]}                  │
│                                                                              │
│   + optimizePitAllocation(products[]): PitAllocationPlan                     │
│     职责：优化窖池分配                                                       │
│     输入：products[] (待生产产品列表)                                         │
│     处理：                                                                   │
│       1. 按香型分类产品                                                     │
│       2. 匹配窖池类型                                                      │
│       3. 平衡各窖池工作量                                                  │
│       4. 考虑连续作业                                                       │
│     输出：PitAllocationPlan                                                 │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## 4. 领域事件

### 4.1 事件全景图

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                            白酒供应链领域事件流                                   │
├─────────────────────────────────────────────────────────────────────────────────┤
│                                                                                  │
│  ┌─────────────┐    OrderSubmittedEvent    ┌─────────────┐                       │
│  │   采购域     │ ───────────────────────→ │   物流域     │                       │
│  │PurchaseOrder│    OrderConfirmedEvent   │  Waybill    │                       │
│  └──────┬──────┘ ←─────────────────────── └──────┬──────┘                       │
│         │                                          │                              │
│         │ OrderShippedEvent                        │                              │
│         └──────────────────────────┐               │                              │
│                                    ↓               │                              │
│                           ┌─────────────┐          │                              │
│                           │   仓储域     │          │                              │
│                           │   Batch     │◀─────────┘                              │
│                           │ Inspection  │   InspectionSubmittedEvent              │
│                           └──────┬──────┘                                         │
│                                  │                                                │
│                   InspectionCompletedEvent│                                     │
│                                  │                                                │
│         ┌─────────────────────────┼─────────────────────────┐                    │
│         ↓                         ↓                         ↓                    │
│ ┌───────────────┐        ┌───────────────┐        ┌───────────────┐             │
│ │BatchPassedEvent│       │BatchStoredEvent│       │ BatchFailedEvent│            │
│ └───────┬───────┘        └───────┬───────┘        └───────┬───────┘             │
│         │                        │                        │                      │
│         │                        │                        │                      │
│         └────────────────────────┼────────────────────────┘                      │
│                                  ↓                                                │
│                         ┌───────────────┐                                       │
│                         │   数据中台     │                                       │
│                         │ DataPlatform  │◀──── 各类聚合事件                       │
│                         └───────────────┘                                       │
│                                  │                                               │
│                    MetricsUpdatedEvent│                                         │
│                                  │                                               │
│                    ┌─────────────┴─────────────┐                               │
│                    ↓           ↓           ↓                                    │
│             ┌───────────┐ ┌───────────┐ ┌───────────┐                          │
│             │ 采购看板  │ │ 仓储看板  │ │ 生产看板  │                          │
│             └───────────┘ └───────────┘ └───────────┘                          │
│                                                                                  │
└─────────────────────────────────────────────────────────────────────────────────┘
```

### 4.2 采购域事件

| 事件名称 | 触发时机 | 事件字段 | 下游处理 |
|---------|---------|---------|---------|
| **SupplierSubmittedEvent** | 供应商提交准入申请 | supplierId, submitter, submitTime | 触发审核流程 |
| **SupplierApprovedEvent** | 供应商准入审核通过 | supplierId, approver, approveTime, initialRating | 开通采购权限 |
| **SupplierRejectedEvent** | 供应商准入审核拒绝 | supplierId, rejector, rejectTime, rejectReason | 通知申请人 |
| **SupplierRatingChangedEvent** | 供应商评级变更 | supplierId, oldRating, newRating, changeTime, reason | 更新供应商档案 |
| **OrderCreatedEvent** | 采购订单创建 | orderId, supplierId, totalAmount, createdBy, createdAt | 记录日志 |
| **OrderSubmittedEvent** | 采购订单提交审批 | orderId, submittedBy, submittedAt, lineItemCount | 触发审批流 |
| **OrderApprovedEvent** | 采购订单审批通过 | orderId, approver, approveTime | 通知供应商 |
| **OrderRejectedEvent** | 采购订单审批拒绝 | orderId, rejector, rejectTime, rejectReason | 通知申请人 |
| **OrderConfirmedEvent** | 供应商确认订单 | orderId, supplierId, confirmedAt, deliveryDate | 创建待发货任务 |
| **OrderShippedEvent** | 采购订单发货 | orderId, supplierId, shippedAt, shipmentInfo, lineItemQtyMap | 生成运单 |
| **OrderArrivedEvent** | 采购订单到货 | orderId, waybillId, arrivedAt, arriveQtyMap | 创建待检任务 |
| **OrderStoredEvent** | 采购订单入库完成 | orderId, batchNumbers[], storedAt | 更新订单状态 |
| **OrderCancelledEvent** | 采购订单取消 | orderId, cancelledBy, cancelTime, cancelReason | 释放预锁库存 |

### 4.3 仓储域事件

| 事件名称 | 触发时机 | 事件字段 | 下游处理 |
|---------|---------|---------|---------|
| **BatchCreatedEvent** | 批次创建 | batchId, batchNumber, materialInfo, sourceOrderId, createTime | 记录追溯链起点 |
| **InspectionSubmittedEvent** | 提交质检 | inspectionId, batchId, inspectionType, submitTime | 通知质检员 |
| **InspectionPassedEvent** | 质检合格 | inspectionId, batchId, judgmentBy, judgmentTime, qualityLevel | 更新批次状态 |
| **InspectionFailedEvent** | 质检不合格 | inspectionId, batchId, judgmentBy, judgmentTime, failReason | 触发不合格处理 |
| **BatchStoredEvent** | 批次入库完成 | batchId, storageLocation, storedAt, operator | 更新库存 |
| **BatchFrozenEvent** | 批次冻结 | batchId, frozenBy, frozenAt, frozenReason | 限制出库 |
| **BatchUnfrozenEvent** | 批次解冻 | batchId, unfrozenBy, unfrozenAt, unfreezeReason | 恢复出库 |
| **InventoryIncreasedEvent** | 库存增加 | inventoryId, batchId, quantity, beforeQty, afterQty, reason | 更新库存视图 |
| **InventoryDecreasedEvent** | 库存减少 | inventoryId, materialId, quantity, beforeQty, afterQty, reason, orderId | 更新库存视图 |
| **StockAlertTriggeredEvent** | 库存预警触发 | inventoryId, alertType, alertLevel, currentQty, threshold | 发送预警通知 |
| **BatchTraceRequestedEvent** | 批次追溯请求 | batchId, traceType, requestTime | 生成追溯报告 |

### 4.4 物流域事件

| 事件名称 | 触发时机 | 事件字段 | 下游处理 |
|---------|---------|---------|---------|
| **ShipmentDepartedEvent** | 运单发车 | waybillId, orderId, departureTime, carrierInfo, vehicleInfo | 启动轨迹跟踪 |
| **ShipmentInTransitEvent** | 运单在途状态更新 | waybillId, trackingPoint, currentLocation, eta | 更新ETA |
| **ShipmentArrivedEvent** | 运单到达 | waybillId, arrivalTime, arrivalLocation | 通知仓库收货 |
| **ShipmentSignedEvent** | 运单签收 | waybillId, signedBy, signTime, signedQty, differenceQty | 触发差异处理 |
| **ShipmentAnomalyEvent** | 运单异常 | waybillId, anomalyType, description, reportTime | 触发异常处理流程 |
| **ETAUpdatedEvent** | ETA更新 | waybillId, oldEta, newEta, updateReason | 通知相关方 |

### 4.5 生产域事件

| 事件名称 | 触发时机 | 事件字段 | 下游处理 |
|---------|---------|---------|---------|
| **PitActivatedEvent** | 窖池启用 | pitId, activationDate, materialsUsed, expectedOpenDate | 更新窖池状态 |
| **FermentationDataRecordedEvent** | 发酵数据记录 | pitId, recordData, recordTime, isAnomaly | 监控发酵状态 |
| **DistillationStartedEvent** | 开始蒸馏 | pitId, startTime, expectedDuration | 通知调度 |
| **DistillationCompletedEvent** | 蒸馏完成 | pitId, endTime, baseLiquorYield, qualityGrade | 记录基酒产出 |
| **BaseLiquorProducedEvent** | 基酒产出 | baseLiquorId, pitId, yieldQty, agingYear, qualityGrade | 创建基酒批次 |
| **ProductionOrderStartedEvent** | 生产工单开始 | orderId, startTime, pitId | 更新工单状态 |
| **MaterialAllocatedEvent** | 物料分配 | orderId, requisitionId, materialId, allocatedQty | 锁定库存 |
| **MaterialIssuedEvent** | 物料发放 | orderId, requisitionId, issuedQty, batchIds | 扣减库存 |
| **ProductionOrderCompletedEvent** | 生产工单完成 | orderId, actualOutput, outputQuality, completionTime | 记录产出 |
| **AgingMilestoneReachedEvent** | 陈酿里程碑达成 | baseLiquorId, milestoneType, milestoneTime, agingYears | 更新年份信息 |

### 4.6 数据中台事件

| 事件名称 | 触发时机 | 事件字段 | 下游处理 |
|---------|---------|---------|---------|
| **OrderMetricsUpdatedEvent** | 订单指标更新 | orderId, metricsType, metricsValue, updateTime | 刷新看板 |
| **InventoryMetricsUpdatedEvent** | 库存指标更新 | inventoryId, metricsType, metricsValue, updateTime | 刷新看板 |
| **QualityMetricsUpdatedEvent** | 质量指标更新 | metricsType, passRate, updateTime | 刷新看板 |
| **AlertTriggeredEvent** | 预警触发 | alertId, alertType, alertLevel, content, triggerTime | 发送告警 |
| **AlertResolvedEvent** | 预警解决 | alertId, resolvedBy, resolveTime, resolution | 关闭告警 |

---

## 5. 模块设计（CQRS）

### 5.1 采购域CQRS设计

#### 5.1.1 命令层（Command）

```
┌─────────────────────────────────────────────────────────────────────────────┐
│ 采购域 - 命令层                                                              │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│ 【供应商管理命令】                                                            │
│ ├── CreateSupplierCommand                                                    │
│ │   输入：supplierCode, name, type, contactInfo, businessLicense           │
│ │   验证：编码唯一、必填字段、格式校验                                       │
│ │   处理：调用SupplierFactory创建，发布SupplierSubmittedEvent               │
│ │   输出：supplierId                                                        │
│ │                                                                            │
│ ├── ApproveSupplierCommand                                                   │
│ │   输入：supplierId, approverId, approvalResult, remarks                   │
│ │   验证：供应商状态、审批权限                                              │
│ │   处理：调用supplier.approve()/reject()                                  │
│ │   输出：void                                                               │
│ │                                                                            │
│ ├── UpdateSupplierRatingCommand                                              │
│ │   输入：supplierId, newRating, ratingReason                               │
│ │   验证：供应商存在、评级有效                                               │
│ │   处理：调用supplier.updateRating()，记录评级历史                         │
│ │   输出：void                                                               │
│ │                                                                            │
│ 【采购订单命令】                                                              │
│ ├── CreatePurchaseOrderCommand                                              │
│ │   输入：supplierId, planType, seasonTag, lineItems[], paymentTerm        │
│ │   验证：供应商可用、至少一条明细、金额计算正确                             │
│ │   处理：调用OrderFactory创建，发布OrderCreatedEvent                       │
│ │   输出：orderId                                                           │
│ │                                                                            │
│ ├── SubmitPurchaseOrderCommand                                               │
│ │   输入：orderId, submittedBy                                               │
│ │   验证：订单状态为草稿、明细不为空                                         │
│ │   处理：调用order.submit()                                                 │
│ │   输出：void                                                               │
│ │                                                                            │
│ ├── ApprovePurchaseOrderCommand                                              │
│ │   输入：orderId, approverId, decision, remarks                            │
│ │   验证：订单状态、审批权限                                                 │
│ │   处理：调用order.approve()/reject()                                       │
│ │   输出：void                                                               │
│ │                                                                            │
│ ├── ConfirmPurchaseOrderCommand                                              │
│ │   输入：orderId, confirmedDeliveryDate                                     │
│ │   验证：订单已审批、供应商确认中                                           │
│ │   处理：调用order.confirm()                                                │
│ │   输出：void                                                               │
│ │                                                                            │
│ ├── ShipPurchaseOrderCommand                                                 │
│ │   输入：orderId, shipmentInfo, lineItemQtyMap                             │
│ │   验证：订单已确认、发货数量≤订单数量                                      │
│ │   处理：调用order.ship()，触发ShipmentDepartedEvent                        │
│ │   输出：waybillId                                                          │
│ │                                                                            │
│ └── CancelPurchaseOrderCommand                                               │
│     输入：orderId, cancelReason, cancelledBy                                  │
│     验证：订单状态允许取消（草稿/已提交/已确认）                             │
│     处理：调用order.cancel()，释放预锁资源                                   │
│     输出：void                                                                │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

#### 5.1.2 查询层（Query）

```
┌─────────────────────────────────────────────────────────────────────────────┐
│ 采购域 - 查询层                                                              │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│ 【供应商查询】                                                                │
│ ├── SupplierListQuery                                                        │
│ │   输入：status[], category, creditLevel, page, size                       │
│ │   输出：SupplierListView[]                                                 │
│ │   视图字段：supplierId, code, name, type, creditLevel, status,           │
│ │            contactPerson, contactPhone, createTime                        │
│ │                                                                            │
│ ├── SupplierDetailQuery                                                      │
│ │   输入：supplierId                                                          │
│ │   输出：SupplierDetailView                                                 │
│ │   视图字段：完整供应商信息 + 评级历史 + 资质列表 + 近三月订单统计          │
│ │                                                                            │
│ ├── SupplierPerformanceQuery                                                │
│ │   输入：supplierId, startDate, endDate                                     │
│ │   输出：SupplierPerformanceView                                            │
│ │   视图字段：订单数量、交付及时率、质检合格率、平均价格偏离度               │
│ │                                                                            │
│ 【采购订单查询】                                                              │
│ ├── PurchaseOrderListQuery                                                   │
│ │   输入：status[], supplierId[], createdBy, dateRange, page, size        │
│ │   输出：PurchaseOrderListView[]                                            │
│ │   视图字段：orderId, orderNumber, supplierName, status, totalAmount,      │
│ │            lineItemCount, createdAt, expectedDeliveryDate                 │
│ │                                                                            │
│ ├── PurchaseOrderDetailQuery                                                 │
│ │   输入：orderId                                                             │
│ │   输出：PurchaseOrderDetailView                                             │
│ │   视图字段：完整订单信息 + 明细列表 + 状态历史 + 关联运单 + 关联批次       │
│ │                                                                            │
│ ├── PurchaseOrderTrackingQuery                                               │
│ │   输入：orderId                                                             │
│ │   输出：PurchaseOrderTrackingView                                           │
│ │   视图字段：订单当前阶段、已完成节点、进行中节点、待办节点、时间轴          │
│ │                                                                            │
│ ├── SupplierOrderSummaryQuery                                                │
│ │   输入：supplierId, startDate, endDate                                     │
│ │   输出：SupplierOrderSummaryView                                            │
│ │   视图字段：订单总金额、订单数量、平均订单金额、按时交付率                 │
│ │                                                                            │
│ 【采购分析查询】                                                              │
│ ├── PurchaseAmountTrendQuery                                                  │
│ │   输入：startMonth, endMonth, groupBy (day/week/month)                    │
│ │   输出：TrendView[]                                                        │
│ │   视图字段：period, amount, orderCount, avgAmount                          │
│ │                                                                            │
│ ├── PurchaseSupplierDistributionQuery                                         │
│ │   输入：startDate, endDate, topN                                            │
│ │   输出：DistributionView[]                                                 │
│ │   视图字段：supplierId, supplierName, amount, proportion, rank          │
│ │                                                                            │
│ └── PurchaseMaterialDistributionQuery                                        │
│     输入：startDate, endDate, topN                                            │
│     输出：DistributionView[]                                                 │
│     视图字段：materialId, materialName, amount, proportion, rank             │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

#### 5.1.3 任务层（Task）

```
┌─────────────────────────────────────────────────────────────────────────────┐
│ 采购域 - 任务层                                                              │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│ 【定时任务】                                                                  │
│ ├── SupplierQualificationCheckTask                                          │
│ │   执行策略：每日凌晨2点执行                                                │
│ │   处理逻辑：                                                               │
│ │     1. 查询所有供应商资质                                                  │
│ │     2. 筛选过期日期在30天内的资质                                         │
│ │     3. 发送续期提醒                                                        │
│ │     4. 标记已过期资质                                                      │
│ │   输出：资质预警报告                                                       │
│ │                                                                            │
│ ├── SupplierRatingCalculationTask                                           │
│ │   执行策略：每月1日凌晨3点执行                                             │
│ │   处理逻辑：                                                               │
│ │     1. 计算上月各供应商绩效评分                                           │
│ │     2. 根据评分规则更新评级                                               │
│ │     3. 生成评级变更通知                                                    │
│ │   输出：评级调整报告                                                       │
│ │                                                                            │
│ ├── PurchaseOrderAutoConfirmTask                                             │
│ │   执行策略：每日下午6点执行                                                │
│ │   处理逻辑：                                                               │
│ │     1. 查询等待供应商确认超过48小时的订单                                 │
│ │     2. 发送催促通知                                                        │
│ │   输出：催促通知列表                                                       │
│ │                                                                            │
│ ├── PurchaseDeliveryMonitorTask                                              │
│ │   执行策略：每小时执行                                                     │
│ │   处理逻辑：                                                               │
│ │     1. 查询预计今日到达的运单                                              │
│ │     2. 监控运单轨迹                                                        │
│ │     3. 异常到达预警                                                        │
│ │   输出：异常预警列表                                                       │
│ │                                                                            │
│ 【异步任务】                                                                  │
│ ├── PurchaseOrderExportTask                                                  │
│ │   触发：用户发起导出请求                                                   │
│ │   处理：生成Excel/PDF文件                                                  │
│ │   输出：文件下载链接                                                       │
│ │                                                                            │
│ └── BatchSupplierImportTask                                                  │
│     触发：批量导入供应商数据                                                 │
│     处理：数据校验、重复检测、批量创建                                       │
│     输出：导入结果报告                                                       │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

### 5.2 仓储域CQRS设计

#### 5.2.1 命令层（Command）

```
┌─────────────────────────────────────────────────────────────────────────────┐
│ 仓储域 - 命令层                                                              │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│ 【批次命令】                                                                  │
│ ├── CreateBatchCommand                                                       │
│ │   输入：materialInfo, sourceType, sourceOrderId, quantity, samplingInfo   │
│ │   验证：物料信息完整、数量为正、来源订单存在                               │
│ │   处理：调用BatchFactory创建批次                                           │
│ │   输出：batchId                                                           │
│ │                                                                            │
│ ├── SubmitForInspectionCommand                                               │
│ │   输入：batchId, inspectionType, inspector, samplingInfo                  │
│ │   验证：批次状态为待检、存在可送检数量                                     │
│ │   处理：创建质检单，调用batch.submitForInspection()                        │
│ │   输出：inspectionId                                                      │
│ │                                                                            │
│ ├── RecordInspectionResultCommand                                            │
│ │   输入：inspectionId, itemResults[], judgmentResult, judgmentBy          │
│ │   验证：所有项目已检验、判定结果有效                                       │
│ │   处理：调用inspection.recordResult() + pass()/fail()                    │
│ │   输出：void                                                               │
│ │                                                                            │
│ ├── StoreBatchCommand                                                        │
│ │   输入：batchId, storageLocationId                                        │
│ │   验证：批次已质检合格、库位可用、容量足够                                 │
│ │   处理：分配库位，调用batch.assignLocation()，更新库存                     │
│ │   输出：void                                                               │
│ │                                                                            │
│ ├── FreezeBatchCommand                                                       │
│ │   输入：batchId, freezeReason, frozenBy                                    │
│ │   验证：批次状态为合格、当前未冻结                                         │
│ │   处理：调用batch.freeze()，限制出库                                       │
│ │   输出：void                                                               │
│ │                                                                            │
│ ├── DeductBatchQuantityCommand                                               │
│ │   输入：batchId, quantity, reason, orderId                                 │
│ │   验证：批次数量充足、批次未冻结                                           │
│ │   处理：调用batch.deductQuantity()，更新库存                              │
│ │   输出：void                                                               │
│ │                                                                            │
│ 【质检命令】                                                                  │
│ ├── CreateInspectionCommand                                                  │
│ │   输入：batchId, inspectionType, sampleInfo                               │
│ │   验证：批次存在、质检类型有效                                             │
│ │   处理：创建质检单                                                         │
│ │   输出：inspectionId                                                      │
│ │                                                                            │
│ ├── AddInspectionItemCommand                                                 │
│ │   输入：inspectionId, itemInfo                                            │
│ │   验证：质检单状态为待检                                                   │
│ │   处理：添加检验项目                                                       │
│ │   输出：void                                                               │
│ │                                                                            │
│ ├── SubmitInspectionJudgmentCommand                                           │
│ │   输入：inspectionId, judgmentResult, judgmentBy, remarks                 │
│ │   验证：所有检验项目完成、判定人有权限                                     │
│ │   处理：调用inspection.submitForJudgment()                                 │
│ │   输出：void                                                               │
│ │                                                                            │
│ 【库存命令】                                                                  │
│ ├── InboundCommand                                                           │
│ │   输入：batchId, quantity, targetLocationId                                │
│ │   验证：批次已质检合格、库位容量足够                                       │
│ │   处理：调用inventory.receiveInbound()                                    │
│ │   输出：void                                                               │
│ │                                                                            │
│ ├── OutboundCommand                                                          │
│ │   输入：materialId, quantity, reason, orderId                              │
│ │   验证：可用库存充足                                                       │
│ │   处理：调用inventory.allocate() + confirmAllocation()                   │
│ │   输出：void                                                               │
│ │                                                                            │
│ ├── FreezeInventoryCommand                                                   │
│ │   输入：inventoryId, quantity, reason                                     │
│ │   验证：可用库存充足                                                       │
│ │   处理：调用inventory.freeze()                                            │
│ │   输出：void                                                               │
│ │                                                                            │
│ └── AdjustInventoryCommand                                                   │
│     输入：inventoryId, adjustedQuantity, reason, adjuster                   │
│     验证：调整原因有效、审批通过                                             │
│     处理：调用inventory.adjustQuantity()                                    │
│     输出：void                                                               │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

#### 5.2.2 查询层（Query）

```
┌─────────────────────────────────────────────────────────────────────────────┐
│ 仓储域 - 查询层                                                              │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│ 【批次查询】                                                                  │
│ ├── BatchListQuery                                                           │
│ │   输入：status[], materialId[], warehouseId[], dateRange, page, size      │
│ │   输出：BatchListView[]                                                     │
│ │   视图字段：batchId, batchNumber, materialName, status, quantity,         │
│ │            storageLocation, createTime                                   │
│ │                                                                            │
│ ├── BatchDetailQuery                                                         │
│ │   输入：batchId                                                             │
│ │   输出：BatchDetailView                                                     │
│ │   视图字段：完整批次信息 + 质检记录 + 追溯记录 + 库存变动记录              │
│ │                                                                            │
│ ├── BatchTraceQuery                                                          │
│ │   输入：batchId, traceScope (入库/全链路)                                  │
│ │   输出：BatchTraceView                                                      │
│ │   视图字段：批次全生命周期事件、每个节点的操作信息、关联单据              │
│ │                                                                            │
│ ├── BatchTraceByCodeQuery                                                    │
│ │   输入：traceCode                                                           │
│ │   输出：BatchTraceView                                                      │
│ │   视图字段：同上                                                            │
│ │                                                                            │
│ 【质检查询】                                                                  │
│ ├── InspectionListQuery                                                      │
│ │   输入：status[], batchId[], inspectionType[], dateRange, page, size    │
│ │   输出：InspectionListView[]                                                │
│ │   视图字段：inspectionId, inspectionNumber, batchNumber, status,         │
│ │            judgmentResult, inspector, createTime                         │
│ │                                                                            │
│ ├── InspectionDetailQuery                                                    │
│ │   输入：inspectionId                                                       │
│ │   输出：InspectionDetailView                                                │
│ │   视图字段：完整质检信息 + 检验项目明细 + 附件列表                         │
│ │                                                                            │
│ ├── PendingInspectionQuery                                                   │
│ │   输入：warehouseId                                                        │
│ │   输出：PendingInspectionView[]                                            │
│ │   视图字段：待检批次列表、检验优先级、待检时长                             │
│ │                                                                            │
│ 【库存查询】                                                                  │
│ ├── InventoryListQuery                                                       │
│ │   输入：materialId[], warehouseId[], status[], page, size                │
│ │   输出：InventoryListView[]                                                  │
│ │   视图字段：inventoryId, materialName, warehouseName, quantity,          │
│ │            availableQuantity, safeStock, status                           │
│ │                                                                            │
│ ├── InventoryDetailQuery                                                     │
│ │   输入：inventoryId                                                        │
│ │   输出：InventoryDetailView                                                  │
│ │   视图字段：完整库存信息 + 批次明细 + 预警信息 + 库存变动趋势               │
│ │                                                                            │
│ ├── InventoryByLocationQuery                                                  │
│ │   输入：warehouseId, zone, row, shelf                                      │
│ │   输出：LocationInventoryView[]                                             │
│ │   视图字段：库位库存分布、库位利用率                                        │
│ │                                                                            │
│ ├── BatchInventoryQuery                                                      │
│ │   输入：materialId                                                          │
│ │   输出：BatchInventoryView[]                                                 │
│ │   视图字段：按批次分组库存、批次新鲜度、保质期预警                         │
│ │                                                                            │
│ 【预警查询】                                                                  │
│ ├── StockAlertListQuery                                                      │
│ │   输入：alertType[], alertLevel[], isResolved, page, size                 │
│ │   输出：AlertListView[]                                                      │
│ │   视图字段：alertId, alertType, alertLevel, materialName, threshold,      │
│ │            currentValue, triggerTime, isResolved                         │
│ │                                                                            │
│ ├── ExpiryAlertQuery                                                         │
│ │   输入：daysToExpiry (天数)                                                 │
│ │   输出：ExpiryAlertView[]                                                   │
│ │   视图字段：批次号、剩余保质期、建议处理方式                               │
│ │                                                                            │
│ 【看板查询】                                                                  │
│ ├── WarehouseOverviewQuery                                                    │
│ │   输入：date (可选)                                                         │
│ │   输出：WarehouseOverviewView                                               │
│ │   视图字段：今日入库量、待检量、质检合格率、库容使用率                     │
│ │                                                                            │
│ ├── InboundTrendQuery                                                        │
│ │   输入：startDate, endDate, groupBy                                        │
│ │   输出：TrendView[]                                                        │
│ │   视图字段：日期、入库量、质检合格率趋势                                   │
│ │                                                                            │
│ └── InventoryDistributionQuery                                               │
│     输入：无                                                                  │
│     输出：DistributionView[]                                                   │
│     视图字段：各物料库存占比                                                 │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

#### 5.2.3 任务层（Task）

```
┌─────────────────────────────────────────────────────────────────────────────┐
│ 仓储域 - 任务层                                                              │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│ 【定时任务】                                                                  │
│ ├── ExpiryCheckTask                                                          │
│ │   执行策略：每日凌晨1点执行                                                │
│ │   处理逻辑：                                                               │
│ │     1. 查询所有批次                                                        │
│ │     2. 计算剩余保质期                                                      │
│ │     3. 触发预警规则（30天/15天/7天）                                       │
│ │     4. 发送预警通知                                                        │
│ │     5. 建议优先出库                                                        │
│ │   输出：保质期预警报告                                                       │
│ │                                                                            │
│ ├── StockLevelCheckTask                                                      │
│ │   执行策略：每小时执行                                                     │
│ │   处理逻辑：                                                               │
│ │     1. 遍历所有库存                                                        │
│ │     2. 检查是否低于安全库存                                                │
│ │     3. 触发分级预警                                                        │
│ │     4. 生成采购建议                                                        │
│ │   输出：库存预警报告                                                       │
│ │                                                                            │
│ ├── FreshnessCheckTask                                                       │
│ │   执行策略：每日凌晨3点执行（白酒行业特色）                               │
│ │   处理逻辑：                                                               │
│ │     1. 查询原料库存                                                        │
│ │     2. 根据收购季节计算新鲜度                                              │
│ │     3. 对超过最佳使用期的原料发出预警                                     │
│ │   输出：新鲜度预警报告                                                     │
│ │                                                                            │
│ ├── IdleBatchCheckTask                                                       │
│ │   执行策略：每周一执行                                                     │
│ │   处理逻辑：                                                               │
│ │     1. 查询超过90天未动的批次                                              │
│ │     2. 生成呆滞预警                                                        │
│ │     3. 建议处理方式                                                        │
│ │   输出：呆滞库存报告                                                       │
│ │                                                                            │
│ ├── InventorySnapshotTask                                                    │
│ │   执行策略：每日凌晨零点执行                                               │
│ │   处理逻辑：                                                               │
│ │     1. 创建各物料库存快照                                                  │
│ │     2. 记录快照时间                                                        │
│ │     3. 支持历史追溯                                                        │
│ │   输出：快照记录                                                           │
│ │                                                                            │
│ ├── LocationUtilizationReportTask                                            │
│ │   执行策略：每日凌晨4点执行                                                │
│ │   处理逻辑：                                                               │
│ │     1. 统计各库区利用率                                                    │
│ │     2. 识别利用率异常区域                                                 │
│ │     3. 生成优化建议                                                        │
│ │   输出：库位利用率报告                                                     │
│ │                                                                            │
│ 【异步任务】                                                                  │
│ ├── BatchTraceExportTask                                                     │
│ │   触发：用户发起追溯导出请求                                               │
│ │   处理：生成批次追溯报告                                                   │
│ │   输出：文件下载链接                                                       │
│ │                                                                            │
│ ├── QualityReportGenerateTask                                                │
│ │   触发：质检完成                                                           │
│ │   处理：生成质检报告PDF                                                   │
│ │   输出：报告URL                                                             │
│ │                                                                            │
│ └── InventoryReconciliationTask                                             │
│     触发：人工触发或月末结账                                                  │
│     处理：比对系统库存与实物，生成差异报告                                   │
│     输出：盘点差异报告                                                       │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## 6. 数据映射

### 6.1 采购域数据映射

#### 6.1.1 供应商表（supplier）

| 字段名 | 类型 | 说明 | 约束 |
|-------|------|------|------|
| supplier_id | CHAR(36) | 供应商ID | PK |
| supplier_code | VARCHAR(50) | 供应商编码 | UNIQUE, NOT NULL |
| name | VARCHAR(200) | 供应商名称 | NOT NULL |
| type | VARCHAR(50) | 供应商类型 | NOT NULL |
| category | VARCHAR(100) | 主营品类 | |
| business_license | VARCHAR(100) | 营业执照号 | |
| contact_person | VARCHAR(100) | 联系人 | |
| contact_phone | VARCHAR(50) | 联系电话 | |
| contact_email | VARCHAR(100) | 邮箱 | |
| bank_name | VARCHAR(200) | 开户银行 | |
| bank_account | VARCHAR(100) | 银行账号 | |
| province | VARCHAR(50) | 省份 | |
| city | VARCHAR(50) | 城市 | |
| district | VARCHAR(50) | 区县 | |
| street | VARCHAR(200) | 详细地址 | |
| postal_code | VARCHAR(20) | 邮编 | |
| status | VARCHAR(20) | 状态 | NOT NULL |
| credit_level | VARCHAR(10) | 信用等级 | |
| create_time | DATETIME | 创建时间 | NOT NULL |
| update_time | DATETIME | 更新时间 | NOT NULL |
| version | INT | 版本号 | 用于乐观锁 |

**索引设计**：
- PRIMARY KEY (supplier_id)
- UNIQUE INDEX idx_supplier_code (supplier_code)
- INDEX idx_supplier_status (status)
- INDEX idx_supplier_category (category)
- INDEX idx_supplier_credit_level (credit_level)

#### 6.1.2 采购订单表（purchase_order）

| 字段名 | 类型 | 说明 | 约束 |
|-------|------|------|------|
| order_id | CHAR(36) | 订单ID | PK |
| order_number | VARCHAR(50) | 订单编号 | UNIQUE, NOT NULL |
| supplier_id | CHAR(36) | 供应商ID | FK, NOT NULL |
| plan_type | VARCHAR(20) | 计划类型 | NOT NULL |
| season_tag | VARCHAR(20) | 季节标签 | |
| created_by | VARCHAR(100) | 创建人 | NOT NULL |
| created_at | DATETIME | 创建时间 | NOT NULL |
| approved_by | VARCHAR(100) | 审批人 | |
| approved_at | DATETIME | 审批时间 | |
| status | VARCHAR(20) | 订单状态 | NOT NULL |
| total_amount | DECIMAL(18,2) | 订单总金额 | |
| currency | VARCHAR(10) | 币种 | DEFAULT 'CNY' |
| payment_term | VARCHAR(50) | 付款条款 | |
| delivery_term | VARCHAR(50) | 交货条款 | |
| expected_delivery_date | DATE | 预计交货日期 | |
| actual_delivery_date | DATE | 实际交货日期 | |
| remarks | TEXT | 备注 | |
| version | INT | 版本号 | 用于乐观锁 |

**索引设计**：
- PRIMARY KEY (order_id)
- UNIQUE INDEX idx_order_number (order_number)
- INDEX idx_order_supplier (supplier_id)
- INDEX idx_order_status (status)
- INDEX idx_order_created_at (created_at)
- INDEX idx_order_expected_delivery (expected_delivery_date)

#### 6.1.3 订单明细表（order_line_item）

| 字段名 | 类型 | 说明 | 约束 |
|-------|------|------|------|
| line_id | CHAR(36) | 明细ID | PK |
| order_id | CHAR(36) | 订单ID | FK, NOT NULL |
| material_id | CHAR(36) | 物料ID | NOT NULL |
| material_name | VARCHAR(200) | 物料名称 | NOT NULL |
| material_code | VARCHAR(50) | 物料编码 | |
| specification | VARCHAR(200) | 规格等级 | |
| quantity | DECIMAL(18,4) | 采购数量 | NOT NULL |
| unit | VARCHAR(20) | 单位 | NOT NULL |
| unit_price | DECIMAL(18,4) | 单价 | |
| subtotal | DECIMAL(18,2) | 小计金额 | |
| delivery_date | DATE | 计划交货日期 | |
| actual_delivered_qty | DECIMAL(18,4) | 实际发货数量 | |
| arrived_qty | DECIMAL(18,4) | 到货数量 | |
| accepted_qty | DECIMAL(18,4) | 验收合格数量 | |
| create_time | DATETIME | 创建时间 | NOT NULL |

**索引设计**：
- PRIMARY KEY (line_id)
- INDEX idx_line_order (order_id)
- INDEX idx_line_material (material_id)

---

### 6.2 仓储域数据映射

#### 6.2.1 批次表（batch）

| 字段名 | 类型 | 说明 | 约束 |
|-------|------|------|------|
| batch_id | CHAR(36) | 批次ID | PK |
| batch_number | VARCHAR(50) | 批次号 | UNIQUE, NOT NULL |
| material_id | CHAR(36) | 物料ID | NOT NULL |
| material_name | VARCHAR(200) | 物料名称 | NOT NULL |
| material_code | VARCHAR(50) | 物料编码 | |
| source_type | VARCHAR(30) | 来源类型 | NOT NULL |
| source_order_id | CHAR(36) | 来源订单ID | |
| quantity | DECIMAL(18,4) | 批次数量 | NOT NULL |
| unit | VARCHAR(20) | 单位 | NOT NULL |
| warehouse_id | CHAR(36) | 库房ID | |
| storage_location_id | CHAR(36) | 库位ID | |
| production_date | DATE | 生产日期 | |
| harvest_season | VARCHAR(20) | 收购季节 | |
| origin_region | VARCHAR(100) | 产地 | |
| specification | VARCHAR(200) | 规格等级 | |
| starch_content | DECIMAL(5,2) | 淀粉含量% | |
| moisture_content | DECIMAL(5,2) | 水分含量% | |
| base_liquor_year | INT | 基酒年份 | |
| storage_start_date | DATETIME | 入库时间 | |
| expiry_date | DATE | 保质期截止日期 | |
| current_status | VARCHAR(20) | 批次状态 | NOT NULL |
| quality_level | VARCHAR(20) | 质量等级 | |
| trace_code | VARCHAR(100) | 追溯码 | INDEX |
| remarks | TEXT | 备注 | |
| create_time | DATETIME | 创建时间 | NOT NULL |
| update_time | DATETIME | 更新时间 | NOT NULL |
| version | INT | 版本号 | |

**索引设计**：
- PRIMARY KEY (batch_id)
- UNIQUE INDEX idx_batch_number (batch_number)
- INDEX idx_batch_material (material_id)
- INDEX idx_batch_status (current_status)
- INDEX idx_batch_location (storage_location_id)
- INDEX idx_batch_trace_code (trace_code)
- INDEX idx_batch_expiry (expiry_date)

#### 6.2.2 质检单表（quality_inspection）

| 字段名 | 类型 | 说明 | 约束 |
|-------|------|------|------|
| inspection_id | CHAR(36) | 质检ID | PK |
| inspection_number | VARCHAR(50) | 质检单号 | UNIQUE, NOT NULL |
| batch_id | CHAR(36) | 批次ID | FK, NOT NULL |
| batch_number | VARCHAR(50) | 批次号 | |
| material_name | VARCHAR(200) | 物料名称 | |
| material_code | VARCHAR(50) | 物料编码 | |
| inspection_type | VARCHAR(30) | 质检类型 | NOT NULL |
| sample_size | INT | 抽样数量 | |
| sample_code | VARCHAR(50) | 样品编号 | |
| sampling_location | VARCHAR(200) | 抽样地点 | |
| sampling_time | DATETIME | 抽样时间 | |
| inspector | VARCHAR(100) | 主检员 | |
| inspector_assist | VARCHAR(100) | 辅助检员 | |
| status | VARCHAR(20) | 状态 | NOT NULL |
| judgment_result | VARCHAR(20) | 判定结果 | |
| judgment_by | VARCHAR(100) | 判定人 | |
| judgment_time | DATETIME | 判定时间 | |
| judgment_remarks | TEXT | 判定备注 | |
| reject_reason | TEXT | 不合格原因 | |
| report_url | VARCHAR(500) | 质检报告URL | |
| conclusion | TEXT | 综合结论 | |
| create_time | DATETIME | 创建时间 | NOT NULL |

**索引设计**：
- PRIMARY KEY (inspection_id)
- UNIQUE INDEX idx_inspection_number (inspection_number)
- INDEX idx_inspection_batch (batch_id)
- INDEX idx_inspection_status (status)
- INDEX idx_inspection_type (inspection_type)

#### 6.2.3 库存表（inventory）

| 字段名 | 类型 | 说明 | 约束 |
|-------|------|------|------|
| inventory_id | CHAR(36) | 库存ID | PK |
| material_id | CHAR(36) | 物料ID | NOT NULL |
| material_name | VARCHAR(200) | 物料名称 | NOT NULL |
| material_code | VARCHAR(50) | 物料编码 | |
| warehouse_id | CHAR(36) | 库房ID | NOT NULL |
| storage_location_id | CHAR(36) | 库位ID | |
| quantity | DECIMAL(18,4) | 当前库存数量 | NOT NULL |
| available_quantity | DECIMAL(18,4) | 可用库存 | |
| frozen_quantity | DECIMAL(18,4) | 冻结库存 | |
| locked_quantity | DECIMAL(18,4) | 预锁库存 | |
| unit | VARCHAR(20) | 单位 | NOT NULL |
| safe_stock | DECIMAL(18,4) | 安全库存 | |
| max_stock | DECIMAL(18,4) | 最高库存 | |
| reorder_point | DECIMAL(18,4) | 再订货点 | |
| unit_cost | DECIMAL(18,4) | 单位成本 | |
| total_value | DECIMAL(18,2) | 库存总值 | |
| last_inbound_date | DATE | 最后入库日期 | |
| last_outbound_date | DATE | 最后出库日期 | |
| avg_storage_days | INT | 平均存储天数 | |
| status | VARCHAR(20) | 状态 | NOT NULL |
| create_time | DATETIME | 创建时间 | NOT NULL |
| update_time | DATETIME | 更新时间 | NOT NULL |

**唯一约束**：
- UNIQUE (material_id, storage_location_id)

**索引设计**：
- PRIMARY KEY (inventory_id)
- INDEX idx_inventory_material (material_id)
- INDEX idx_inventory_warehouse (warehouse_id)
- INDEX idx_inventory_status (status)
- INDEX idx_inventory_location (storage_location_id)

---

### 6.3 物流域数据映射

#### 6.3.1 运单表（waybill）

| 字段名 | 类型 | 说明 | 约束 |
|-------|------|------|------|
| waybill_id | CHAR(36) | 运单ID | PK |
| waybill_number | VARCHAR(50) | 运单号 | UNIQUE, NOT NULL |
| order_id | CHAR(36) | 采购订单ID | FK, NOT NULL |
| order_number | VARCHAR(50) | 订单号 | |
| supplier_id | CHAR(36) | 供应商ID | |
| carrier_id | CHAR(36) | 承运商ID | |
| carrier_name | VARCHAR(200) | 承运商名称 | |
| vehicle_number | VARCHAR(50) | 车牌号 | |
| driver_name | VARCHAR(100) | 司机姓名 | |
| driver_phone | VARCHAR(50) | 司机电话 | |
| source_province | VARCHAR(50) | 发货省份 | |
| source_city | VARCHAR(50) | 发货城市 | |
| source_address | VARCHAR(500) | 发货地址 | |
| dest_province | VARCHAR(50) | 收货省份 | |
| dest_city | VARCHAR(50) | 收货城市 | |
| dest_address | VARCHAR(500) | 收货地址 | |
| cargo_type | VARCHAR(100) | 货物类型 | |
| total_quantity | DECIMAL(18,4) | 总数量 | |
| total_weight | DECIMAL(18,4) | 总重量 | |
| package_count | INT | 件数 | |
| departure_time | DATETIME | 发车时间 | |
| estimated_arrival_time | DATETIME | 预计到达时间 | |
| actual_arrival_time | DATETIME | 实际到达时间 | |
| status | VARCHAR(20) | 状态 | NOT NULL |
| temperature_control | VARCHAR(20) | 温控要求 | |
| cargo_value | DECIMAL(18,2) | 货物价值 | |
| freight_cost | DECIMAL(18,2) | 运费 | |
| create_time | DATETIME | 创建时间 | NOT NULL |
| update_time | DATETIME | 更新时间 | NOT NULL |

**索引设计**：
- PRIMARY KEY (waybill_id)
- UNIQUE INDEX idx_waybill_number (waybill_number)
- INDEX idx_waybill_order (order_id)
- INDEX idx_waybill_supplier (supplier_id)
- INDEX idx_waybill_status (status)
- INDEX idx_waybill_departure (departure_time)

#### 6.3.2 轨迹点表（tracking_point）

| 字段名 | 类型 | 说明 | 约束 |
|-------|------|------|------|
| point_id | CHAR(36) | 轨迹点ID | PK |
| waybill_id | CHAR(36) | 运单ID | FK, NOT NULL |
| point_time | DATETIME | 记录时间 | NOT NULL |
| latitude | DECIMAL(10,6) | 纬度 | |
| longitude | DECIMAL(10,6) | 经度 | |
| location_name | VARCHAR(200) | 位置名称 | |
| speed | DECIMAL(6,2) | 速度km/h | |
| heading | INT | 方向角度 | |
| event_type | VARCHAR(30) | 事件类型 | |
| remarks | VARCHAR(500) | 备注 | |

**索引设计**：
- PRIMARY KEY (point_id)
- INDEX idx_track_waybill (waybill_id)
- INDEX idx_track_time (point_time)

---

### 6.4 生产域数据映射

#### 6.4.1 窖池表（pit_cellar）

| 字段名 | 类型 | 说明 | 约束 |
|-------|------|------|------|
| pit_id | CHAR(36) | 窖池ID | PK |
| pit_code | VARCHAR(50) | 窖池编号 | UNIQUE, NOT NULL |
| pit_name | VARCHAR(100) | 窖池名称 | NOT NULL |
| cellar_name | VARCHAR(100) | 所属窖房 | |
| pit_type | VARCHAR(30) | 窖池类型 | NOT NULL |
| capacity | DECIMAL(18,4) | 设计容量吨 | NOT NULL |
| current_fill_rate | DECIMAL(5,2) | 当前装窖量% | |
| status | VARCHAR(20) | 状态 | NOT NULL |
| activation_date | DATE | 投料日期 | |
| expected_open_date | DATE | 预计开窖日期 | |
| actual_open_date | DATE | 实际开窖日期 | |
| fermentation_cycle | INT | 发酵周期天数 | |
| current_cycle_days | INT | 当前发酵天数 | |
| base_liquor_yield | DECIMAL(5,2) | 出酒率% | |
| base_liquor_grade | DECIMAL(5,2) | 基酒度数% | |
| temperature_range | VARCHAR(50) | 发酵温度范围 | |
| humidity_range | VARCHAR(50) | 发酵湿度范围 | |
| remarks | TEXT | 备注 | |
| create_time | DATETIME | 创建时间 | NOT NULL |
| update_time | DATETIME | 更新时间 | NOT NULL |

**索引设计**：
- PRIMARY KEY (pit_id)
- UNIQUE INDEX idx_pit_code (pit_code)
- INDEX idx_pit_status (status)
- INDEX idx_pit_type (pit_type)
- INDEX idx_pit_expected_open (expected_open_date)

#### 6.4.2 基酒产出表（base_liquor_production）

| 字段名 | 类型 | 说明 | 约束 |
|-------|------|------|------|
| production_id | CHAR(36) | 产出ID | PK |
| production_number | VARCHAR(50) | 产出编号 | UNIQUE, NOT NULL |
| pit_id | CHAR(36) | 窖池ID | FK, NOT NULL |
| pit_code | VARCHAR(50) | 窖池编号 | |
| production_date | DATE | 产出日期 | NOT NULL |
| yield_quantity | DECIMAL(18,4) | 产出基酒量吨 | NOT NULL |
| yield_rate | DECIMAL(5,2) | 出酒率% | |
| alcohol_degree | DECIMAL(5,2) | 酒精度数% | |
| quality_grade | VARCHAR(20) | 质量等级 | |
| aging_year | INT | 宜存年份 | |
| storage_location | VARCHAR(100) | 存储位置 | |
| batch_id | CHAR(36) | 对应批次ID | FK |
| remarks | TEXT | 备注 | |
| create_time | DATETIME | 创建时间 | NOT NULL |

**索引设计**：
- PRIMARY KEY (production_id)
- UNIQUE INDEX idx_production_number (production_number)
- INDEX idx_production_pit (pit_id)
- INDEX idx_production_date (production_date)
- INDEX idx_production_grade (quality_grade)
- INDEX idx_production_aging_year (aging_year)

#### 6.4.3 生产工单表（production_order）

| 字段名 | 类型 | 说明 | 约束 |
|-------|------|------|------|
| order_id | CHAR(36) | 工单ID | PK |
| order_number | VARCHAR(50) | 工单编号 | UNIQUE, NOT NULL |
| product_id | CHAR(36) | 产品ID | |
| product_name | VARCHAR(200) | 产品名称 | |
| product_code | VARCHAR(50) | 产品编码 | |
| planned_quantity | DECIMAL(18,4) | 计划产量 | NOT NULL |
| actual_quantity | DECIMAL(18,4) | 实际产量 | |
| unit | VARCHAR(20) | 单位 | NOT NULL |
| pit_id | CHAR(36) | 使用窖池ID | FK |
| production_type | VARCHAR(30) | 生产类型 | NOT NULL |
| plan_start_date | DATE | 计划开始日期 | |
| plan_end_date | DATE | 计划结束日期 | |
| actual_start_date | DATE | 实际开始日期 | |
| actual_end_date | DATE | 实际结束日期 | |
| status | VARCHAR(20) | 状态 | NOT NULL |
| priority | VARCHAR(10) | 优先级 | |
| created_by | VARCHAR(100) | 创建人 | NOT NULL |
| created_at | DATETIME | 创建时间 | NOT NULL |
| remarks | TEXT | 备注 | |
| version | INT | 版本号 | |

**索引设计**：
- PRIMARY KEY (order_id)
- UNIQUE INDEX idx_prod_order_number (order_number)
- INDEX idx_prod_pit (pit_id)
- INDEX idx_prod_status (status)
- INDEX idx_prod_plan_date (plan_start_date)

---

## 7. 白酒行业特色设计

### 7.1 原料季节性设计

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                        白酒原料季节性管理                                     │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│ 【季节定义】                                                                  │
│ ┌────────────────┬────────────────┬────────────────┬────────────────┐         │
│ │    春收季      │     夏季       │     秋收季     │     冬季       │         │
│ │  Mar - May     │  Jun - Aug    │  Sep - Nov    │  Dec - Feb    │         │
│ ├────────────────┼────────────────┼────────────────┼────────────────┤         │
│ │ 小麦、豌豆     │  原料储备调整   │ 高粱主收获季   │ 基酒盘存期    │         │
│ │  新鲜原料上市  │  价格波动期    │  大量采购期    │  生产调整期   │         │
│ └────────────────┴────────────────┴────────────────┴────────────────┘         │
│                                                                              │
│ 【采购计划季节调整】                                                           │
│                                                                              │
│ 1. 收购季节前：                                                              │
│    - 自动增加采购计划预测量（+20%）                                         │
│    - 提前与供应商锁定收购量                                                 │
│    - 预备仓容                                                              │
│                                                                              │
│ 2. 收购季节中：                                                              │
│    - 优先安排当季原料采购                                                   │
│    - 质量抽检频次提高                                                       │
│    - 价格按市场行情浮动                                                     │
│                                                                              │
│ 3. 收购季节后：                                                             │
│    - 减少采购量，消化库存                                                   │
│    - 关注保质期管理                                                         │
│    - 适时补充次级原料                                                       │
│                                                                              │
│ 【值对象：SeasonTag】                                                        │
│ - season: Enum {SPRING, SUMMER, AUTUMN, WINTER}                             │
│ - harvestPeriod: {startMonth, endMonth}                                      │
│ - recommendedStockRatio: Decimal (建议库存比例)                             │
│ - priceIndex: Decimal (价格系数)                                            │
│                                                                              │
│ 【领域服务：PurchasePlanCalculator】                                          │
│ - applySeasonalFactor()                                                      │
│   收购季节：系数1.0，原料金额×1.0                                           │
│   收购前1月：系数1.2，提前备货                                               │
│   收购后2月：系数0.8，消化库存                                               │
│   其他月份：系数0.9-1.1                                                     │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

### 7.2 窖池管理设计

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                           白酒窖池管理                                        │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│ 【窖池生命周期】                                                              │
│                                                                              │
│   ┌────────┐     ┌──────────┐     ┌────────┐     ┌────────┐     ┌────────┐ │
│   │  空闲  │────→│  投料发酵 │────→│ 待蒸馏 │────→│  蒸馏  │────→│  养护  │ │
│   │  IDLE  │     │ACTIVATING│     │ WAITING│     │DISTILL │     │MAINTEN.│ │
│   └────────┘     └──────────┘     └────────┘     └────────┘     └────────┘ │
│        ↑                                                                    │ │
│        │                    ┌────────┐                                     │ │
│        └────────────────────│  归档  │                                     │ │
│                             │ARCHIVED│                                     │ │
│                             └────────┘                                     │ │
│                                                                              │
│ 【香型与发酵周期】                                                            │
│ ┌────────────┬────────────────┬────────────────┬────────────────────────┐   │
│ │   香型      │   发酵周期      │   最佳储存期    │     特点              │   │
│ ├────────────┼────────────────┼────────────────┼────────────────────────┤   │
│ │  浓香型    │   60-90天       │   3-5年        │ 窖香浓郁，绵甜醇和    │   │
│ │  酱香型    │   1年+（9次蒸煮）│   5-10年       │ 酱香突出，回味悠长    │   │
│ │  清香型    │   28天左右      │   1-3年        │ 清香纯正，余味爽净    │   │
│ │  兼香型    │   45-60天       │   3-5年        │ 浓酱谐调，风味独特    │   │
│ └────────────┴────────────────┴────────────────┴────────────────────────┘   │
│                                                                              │
│ 【窖池监控指标】                                                              │
│ - 窖温：发酵过程中监控，温度异常预警                                         │
│ - 湿度：保持适宜湿度，防止过度干燥                                           │
│ - 酸度：发酵过程监控，影响出酒率和风味                                       │
│ - 糖分：监控糖化进程，判断发酵状态                                           │
│ - 填充率：监控投料量与容量的比例                                             │
│                                                                              │
│ 【出酒率计算】                                                                │
│ 出酒率 = 基酒产量（吨）÷ 投料总量（吨）× 100%                               │
│                                                                              │
│ 典型出酒率参考：                                                             │
│ - 优质高粱：出酒率45-55%                                                    │
│ - 普通高粱：出酒率35-45%                                                    │
│ - 小麦：出酒率40-50%                                                        │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

### 7.3 基酒年份管理设计

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                           基酒年份管理                                        │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│ 【基酒价值体系】                                                              │
│                                                                              │
│ ┌─────────────────────────────────────────────────────────────────────────┐ │
│ │                          基酒年份价值曲线                                │ │
│ │                                                                         │ │
│ │   价值  │                                    ╭───────────── 陈酿期      │ │
│ │    ↑    │                            ╭──────╯                            │ │
│ │    │    │                      ╭─────╯                                   │ │
│ │    │    │               ╭─────╯                                          │ │
│ │    │    │         ╭─────╯     ╭──╮                                       │ │
│ │    │    │   ╭─────╯           │  │                                       │ │
│ │    │    ├───╯                 │  │    ╭───────╮                          │ │
│ │    │    │                     │  │    │       │ 品质开始下降           │ │
│ │    └────┼─────────────────────┼──┼────┼───────┼────────────────────────→│ │
│ │         0        3        5    8  10   15      年份                     │ │
│ │                最佳饮用期                                                   │ │
│ └─────────────────────────────────────────────────────────────────────────┘ │
│                                                                              │
│ 【年份基酒管理】                                                              │
│                                                                              │
│ 1. 基酒入库时记录：                                                          │
│    - 窖池来源（哪号窖池产出）                                               │
│    - 蒸馏日期                                                                │
│    - 产出批次号                                                             │
│    - 酒精度数                                                                │
│    - 质量等级（特级/优级/一级/二级）                                        │
│    - 初始宜存年份                                                           │
│                                                                              │
│ 2. 存储管理：                                                                │
│    - 陶坛存储：传统存储方式，空气缓慢渗透促进老熟                           │
│    - 不锈钢罐：大规模存储，便于管理                                         │
│    - 温度控制：15-25℃最佳                                                  │
│    - 避光保存：防止光照影响酒体                                             │
│                                                                              │
│ 3. 年份计算规则：                                                            │
│    - 从蒸馏入库日期开始计算                                                 │
│    - 满1年计为一个年份单位                                                  │
│    - 每年12月31日统一标记年份增长                                           │
│                                                                              │
│ 4. 勾调应用：                                                                │
│    - 不同年份基酒按配方比例勾调                                             │
│    - 年份长的基酒用量少但作用关键                                           │
│    - 记录勾调配方，便于追溯                                                 │
│                                                                              │
│ 【值对象：AgingPeriod】                                                      │
│ - agingYears: Integer (陈酿年份)                                            │
│ - agingStartDate: Date (开始陈酿日期)                                       │
│ - agingEndDate: Date (陈酿结束日期，可选)                                   │
│ - agingLocation: String (存储位置)                                          │
│ - optimalDrinkYear: Integer (最佳饮用年份)                                  │
│ - isPeakCondition: Boolean (是否处于最佳状态)                               │
│                                                                              │
│ 【领域服务：BaseLiquorAgingService】                                         │
│ - calculateAgingValue() → 计算当前年份价值                                  │
│ - suggestBlendingRatio() → 建议勾调比例                                      │
│ - trackAgingProcess() → 追踪陈酿进度                                        │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

### 7.4 质检追溯设计

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                           白酒质量追溯体系                                    │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│ 【追溯链条】                                                                  │
│                                                                              │
│ ┌─────────┐    ┌─────────┐    ┌─────────┐    ┌─────────┐    ┌─────────┐   │
│ │ 原料种植 │───→│ 原料收购 │───→│ 生产酿造 │───→│ 基酒储存 │───→│ 产品勾调 │   │
│ │  基地    │    │   入库   │    │   蒸馏   │    │  陶坛    │    │  成品    │   │
│ └────┬────┘    └────┬────┘    └────┬────┘    └────┬────┘    └────┬────┘   │
│      │              │              │              │              │        │
│      └──────────────┴──────────────┴──────────────┴──────────────┘        │
│                                    │                                        │
│                                    ↓                                        │
│                           ┌─────────────────┐                               │
│                           │   批次追溯码     │                               │
│                           │   TraceCode      │                               │
│                           └─────────────────┘                               │
│                                                                              │
│ 【质检项目标准（白酒原料）】                                                  │
│                                                                              │
│ ┌──────────────┬──────────────┬──────────────┬──────────────────────────┐  │
│ │   检验类别    │   检验项目    │    标准值    │       说明              │  │
│ ├──────────────┼──────────────┼──────────────┼──────────────────────────┤  │
│ │  感官检验    │  色泽         │  正常、无杂质 │  肉眼观察               │  │
│ │              │  气味         │  正常、无异味 │  嗅觉判断                │  │
│ │              │  滋味         │  正常、无异响 │  品尝判断                │  │
│ ├──────────────┼──────────────┼──────────────┼──────────────────────────┤  │
│ │  理化指标    │  淀粉含量     │  ≥68-72%     │  高粱核心指标            │  │
│ │              │  水分         │  ≤14%        │  存储安全指标            │  │
│ │              │  杂质         │  ≤1%         │  纯净度指标              │  │
│ │              │  蛋白质       │  ≥8-12%      │  小麦品质指标            │  │
│ ├──────────────┼──────────────┼──────────────┼──────────────────────────┤  │
│ │  卫生指标    │  重金属       │  符合国标     │  安全底线                │  │
│ │              │  农药残留     │  符合国标     │  食品安全                │  │
│ │              │  黄曲霉素     │  不得检出     │  严禁检出                │  │
│ └──────────────┴──────────────┴──────────────┴──────────────────────────┘  │
│                                                                              │
│ 【追溯码结构】                                                                │
│                                                                              │
│ TraceCode = YY-MM-BBB-XXXX-NNN                                              │
│                                                                              │
│ 组成部分：                                                                   │
│ - YY：生产年份（后两位）                                                    │
│ - MM：生产月份                                                              │
│ - BBB：产品编码                                                             │
│ - XXXX：批次流水号                                                          │
│ - NNN：质检序列号                                                           │
│                                                                              │
│ 示例：26-06-GJL-0001-001                                                    │
│ → 2026年6月，高粱原料，第0001批次，第001次质检                             │
│                                                                              │
│ 【追溯查询】                                                                  │
│                                                                              │
│ 正向追溯：原料批次 → 质检记录 → 入库记录 → 库存 → 生产领用 → 产品          │
│                                                                              │
│ 反向追溯：产品 → 勾调配方 → 基酒批次 → 窖池信息 → 原料批次                 │
│                                                                              │
│ 质量事故：批次召回 → 影响范围分析 → 同批次产品追溯                          │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## 附录：设计总结

### 领域模型设计原则

1. **聚合边界清晰**：每个聚合包含完整的业务逻辑，聚合之间通过ID引用
2. **实体标识稳定**：实体ID在生命周期内保持不变
3. **值对象不可变**：值对象创建后不可修改
4. **领域服务无状态**：领域服务处理跨聚合的业务逻辑
5. **事件驱动解耦**：通过领域事件实现跨限界上下文的异步通信

### CQRS设计要点

1. **命令写入校验**：命令层负责业务规则校验和数据校验
2. **查询视图优化**：查询层直接读取物化视图，支持分页和过滤
3. **读写分离**：命令端保证数据一致性，查询端保证读取性能
4. **最终一致性**：通过事件驱动实现视图数据的最终一致

### 白酒行业特色总结

| 特色 | 设计体现 |
|------|---------|
| 原料季节性 | SeasonTag、PurchasePlanCalculator季节系数 |
| 窖池管理 | PitCellar聚合、发酵周期监控、酒龄管理 |
| 基酒年份 | AgingPeriod值对象、BaseLiquorAgingService |
| 质检追溯 | TraceCode追溯码、Batch追溯链、质检项目标准 |

---

**文档结束**

*本DDD领域设计文档基于白酒供应链数字化管控平台PRD文档生成，遵循DDD核心概念和CQRS设计模式。*
