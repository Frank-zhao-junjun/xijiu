/**
 * CRM 客户标签类型定义
 * 包含标签相关的前端类型和常量
 */

// 预设颜色列表
export const TAG_COLORS = [
  { value: '#EF4444', label: '红色' },
  { value: '#F97316', label: '橙色' },
  { value: '#F59E0B', label: '琥珀' },
  { value: '#84CC16', label: '青柠' },
  { value: '#22C55E', label: '绿色' },
  { value: '#10B981', label: '翠绿' },
  { value: '#14B8A6', label: '青色' },
  { value: '#06B6D4', label: '天蓝' },
  { value: '#0EA5E9', label: '蓝色' },
  { value: '#3B82F6', label: '钴蓝' },
  { value: '#6366F1', label: '靛蓝' },
  { value: '#8B5CF6', label: '紫色' },
  { value: '#A855F7', label: '洋红' },
  { value: '#D946EF', label: '品红' },
  { value: '#EC4899', label: '粉色' },
  { value: '#F43F5E', label: '玫红' },
  { value: '#6B7280', label: '灰色' },
] as const;

// 预设图标列表
export const TAG_ICONS = [
  'tag', 'star', 'heart', 'flag', 'bookmark',
  'award', 'zap', 'target', 'trending', 'sparkles',
  'crown', 'gem'
] as const;

// 标签表单数据类型
export interface TagFormData {
  name: string;
  color: string;
  icon: string;
  description: string;
}

// 验证颜色值是否有效
export function isValidTagColor(color: string): boolean {
  return TAG_COLORS.some(c => c.value === color);
}

// 验证图标值是否有效
export function isValidTagIcon(icon: string): boolean {
  return TAG_ICONS.includes(icon as typeof TAG_ICONS[number]);
}
