'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useCRM } from '@/lib/crm-context';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { ArrowLeft, Save, Package } from 'lucide-react';
import Link from 'next/link';
import { ProductCategory } from '@/lib/crm-types';

export default function EditProductPage() {
  const params = useParams();
  const router = useRouter();
  const { products, updateProduct } = useCRM();
  
  const product = products.find(p => p.id === params.id);
  
  const [form, setForm] = useState({
    name: '',
    sku: '',
    category: 'software' as ProductCategory,
    description: '',
    unitPrice: '',
    unit: '个',
    cost: '',
    stock: '',
    isActive: true,
  });
  
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (product) {
      setForm({
        name: product.name,
        sku: product.sku,
        category: product.category,
        description: product.description || '',
        unitPrice: product.unitPrice.toString(),
        unit: product.unit,
        cost: product.cost.toString(),
        stock: product.stock?.toString() || '',
        isActive: product.isActive,
      });
    }
  }, [product]);

  if (!product) {
    return (
      <div className="container mx-auto py-6">
        <div className="text-center py-12">
          <Package className="h-12 w-12 mx-auto text-muted-foreground/50 mb-4" />
          <h3 className="text-lg font-medium mb-2">产品不存在</h3>
          <p className="text-sm text-muted-foreground mb-4">
            该产品可能已被删除
          </p>
          <Button asChild>
            <Link href="/products">返回产品列表</Link>
          </Button>
        </div>
      </div>
    );
  }

  const validateForm = () => {
    const newErrors: Record<string, string> = {};
    
    if (!form.name.trim()) {
      newErrors.name = '请输入产品名称';
    }
    if (!form.sku.trim()) {
      newErrors.sku = '请输入SKU编码';
    }
    if (!form.unitPrice || Number(form.unitPrice) < 0) {
      newErrors.unitPrice = '请输入有效的单价';
    }
    if (!form.unit.trim()) {
      newErrors.unit = '请输入单位';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) return;
    
    updateProduct(product.id, {
      name: form.name.trim(),
      sku: form.sku.trim().toUpperCase(),
      category: form.category,
      description: form.description.trim() || undefined,
      unitPrice: Number(form.unitPrice),
      unit: form.unit.trim(),
      cost: form.cost ? Number(form.cost) : 0,
      stock: form.stock ? Number(form.stock) : undefined,
      isActive: form.isActive,
    });
    
    router.push('/products');
  };

  return (
    <div className="container mx-auto py-6 space-y-6">
      {/* 页面标题 */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild>
          <Link href={`/products/${product.id}`}>
            <ArrowLeft className="h-5 w-5" />
          </Link>
        </Button>
        <div className="flex items-center gap-3">
          <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
            <Package className="h-6 w-6 text-blue-600 dark:text-blue-400" />
          </div>
          <div>
            <h1 className="text-2xl font-bold">编辑产品</h1>
            <p className="text-sm text-muted-foreground">
              修改产品信息
            </p>
          </div>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* 基本信息 */}
        <Card>
          <CardHeader>
            <CardTitle>基本信息</CardTitle>
            <CardDescription>修改产品的基本属性</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="name">产品名称 *</Label>
                <Input
                  id="name"
                  placeholder="输入产品名称"
                  value={form.name}
                  onChange={(e) => setForm(prev => ({ ...prev, name: e.target.value }))}
                />
                {errors.name && <p className="text-xs text-red-500">{errors.name}</p>}
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="sku">SKU编码 *</Label>
                <Input
                  id="sku"
                  placeholder="如：SW-001"
                  value={form.sku}
                  onChange={(e) => setForm(prev => ({ ...prev, sku: e.target.value.toUpperCase() }))}
                />
                {errors.sku && <p className="text-xs text-red-500">{errors.sku}</p>}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="category">产品分类</Label>
                <Select 
                  value={form.category} 
                  onValueChange={(value) => setForm(prev => ({ ...prev, category: value as ProductCategory }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="选择分类" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="software">软件</SelectItem>
                    <SelectItem value="hardware">硬件</SelectItem>
                    <SelectItem value="service">服务</SelectItem>
                    <SelectItem value="consulting">咨询</SelectItem>
                    <SelectItem value="other">其他</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="unit">单位 *</Label>
                <Input
                  id="unit"
                  placeholder="如：个、套、年、月"
                  value={form.unit}
                  onChange={(e) => setForm(prev => ({ ...prev, unit: e.target.value }))}
                />
                {errors.unit && <p className="text-xs text-red-500">{errors.unit}</p>}
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">产品描述</Label>
              <textarea
                id="description"
                placeholder="输入产品描述或详细说明"
                value={form.description}
                onChange={(e) => setForm(prev => ({ ...prev, description: e.target.value }))}
                className="flex min-h-[100px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
              />
            </div>
          </CardContent>
        </Card>

        {/* 价格信息 */}
        <Card>
          <CardHeader>
            <CardTitle>价格信息</CardTitle>
            <CardDescription>修改产品的售价和成本</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="unitPrice">销售单价 *</Label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">¥</span>
                  <Input
                    id="unitPrice"
                    type="number"
                    min="0"
                    step="0.01"
                    placeholder="0.00"
                    value={form.unitPrice}
                    onChange={(e) => setForm(prev => ({ ...prev, unitPrice: e.target.value }))}
                    className="pl-7"
                  />
                </div>
                {errors.unitPrice && <p className="text-xs text-red-500">{errors.unitPrice}</p>}
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="cost">成本价</Label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">¥</span>
                  <Input
                    id="cost"
                    type="number"
                    min="0"
                    step="0.01"
                    placeholder="0.00"
                    value={form.cost}
                    onChange={(e) => setForm(prev => ({ ...prev, cost: e.target.value }))}
                    className="pl-7"
                  />
                </div>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="stock">库存数量</Label>
                <Input
                  id="stock"
                  type="number"
                  min="0"
                  placeholder="无限"
                  value={form.stock}
                  onChange={(e) => setForm(prev => ({ ...prev, stock: e.target.value }))}
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* 状态 */}
        <Card>
          <CardHeader>
            <CardTitle>状态设置</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setForm(prev => ({ ...prev, isActive: true }))}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg border transition-colors ${
                  form.isActive 
                    ? 'bg-green-50 border-green-500 text-green-700 dark:bg-green-900/20 dark:border-green-700' 
                    : 'bg-background border-muted'
                }`}
              >
                {form.isActive ? '✓' : ''} 启用
              </button>
              <button
                type="button"
                onClick={() => setForm(prev => ({ ...prev, isActive: false }))}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg border transition-colors ${
                  !form.isActive 
                    ? 'bg-gray-100 border-gray-400 text-gray-700 dark:bg-gray-800' 
                    : 'bg-background border-muted'
                }`}
              >
                {!form.isActive ? '✓' : ''} 禁用
              </button>
            </div>
            <p className="text-sm text-muted-foreground mt-2">
              禁用的产品在报价单和订单选品时不会显示
            </p>
          </CardContent>
        </Card>

        {/* 提交按钮 */}
        <div className="flex justify-end gap-4">
          <Button type="button" variant="outline" asChild>
            <Link href={`/products/${product.id}`}>取消</Link>
          </Button>
          <Button type="submit">
            <Save className="h-4 w-4 mr-2" />
            保存修改
          </Button>
        </div>
      </form>
    </div>
  );
}
