export interface DashboardMetrics {
  total_orders: number; pending_orders: number; delivered_orders: number;
  total_amount: number; inventory_quantity: number; inventory_value: number;
  supplier_count: number; inspection_pending: number; inspection_passed: number;
}
export interface AlertItem { id: number; type: string; title: string; description: string; time: string; level: string; }
export interface TodoItem { id: number; title: string; category: string; priority: string; time: string; }
export interface FulfillmentStatus { status: string; count: number; percentage: number; }

export interface Supplier {
  supplier_id: string; supplier_code: string; name: string; type: string;
  category: string; contact_person: string; contact_phone: string;
  status: string; credit_level: string; create_time: string;
}
export interface PurchaseOrder {
  order_id: string; order_number: string; supplier_id: string; plan_type: string;
  total_amount: number; currency: string; expected_delivery_date: string;
  status: string; created_by: string; created_at: string;
  approved_by: string; line_items: OrderLineItem[]; status_history: OrderStatusHistory[];
}
export interface OrderLineItem {
  line_id: string; order_id: string; material_name: string; material_code: string;
  specification: string; quantity: number; unit: string; unit_price: number;
  subtotal: number; actual_delivered_qty: number; arrived_qty: number; accepted_qty: number; line_number: number;
}
export interface OrderStatusHistory {
  history_id: string; from_status: string; to_status: string; change_time: string; changed_by: string; reason: string;
}
export interface Inventory {
  inventory_id: string; material_id: string; material_name: string; material_code: string;
  storage_location_id: string; quantity: number; available_quantity: number;
  frozen_quantity: number; locked_quantity: number; unit: string;
  safe_stock: number; unit_cost: number; total_value: number; status: string; create_time: string;
}
export interface QualityInspection {
  inspection_id: string; inspection_number: string; batch_id: string; batch_number: string;
  material_name: string; inspection_type: string; sample_size: number; inspector: string;
  status: string; judgment_result: string; create_time: string; inspection_items: any[];
}
export interface Waybill {
  waybill_id: string; waybill_number: string; order_id: string; order_number: string;
  carrier_name: string; vehicle_number: string; driver_name: string;
  cargo_type: string; total_quantity: number; status: string; create_time: string;
}
export interface PaginatedResponse<T> { items: T[]; total: number; page: number; page_size: number; }
