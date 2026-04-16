'use client';

import { useParams } from 'next/navigation';
import { useCRM } from '@/lib/crm-context';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, Edit, Package, DollarSign, Hash, Layers, ToggleRight, Calendar } from 'lucide-react';
import Link from 'next/link';
import { PRODUCT_CATEGORY_CONFIG } from '@/lib/crm-types';
import { format } from 'date-fns';

export default function ProductDetailPage() {
  const params = useParams();
  const { products } = useCRM();
  
  const product = products.find(p => p.id === params.id);
  
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

  const categoryConfig = PRODUCT_CATEGORY_CONFIG[product.category];

  return (
    <div className="container mx-auto py-6 space-y-6">
      {/* 页面标题 */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" asChild>
            <Link href="/products">
              <ArrowLeft className="h-5 w-5" />
            </Link>
          </Button>
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
              <Package className="h-6 w-6 text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <h1 className="text-2xl font-bold">{product.name}</h1>
              <p className="text-sm text-muted-foreground">产品详情</p>
            </div>
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" asChild>
            <Link href={`/products/${product.id}/edit`}>
              <Edit className="h-4 w-4 mr-2" />
              编辑
            </Link>
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* 左侧：主要信息 */}
        <div className="lg:col-span-2 space-y-6">
          {/* 基本信息 */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">基本信息</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">SKU编码</p>
                  <p className="font-mono text-lg">{product.sku}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">产品分类</p>
                  <Badge 
                    variant="outline"
                    className={categoryConfig?.color}
                  >
                    {categoryConfig?.label}
                  </Badge>
                </div>
              </div>
              
              {product.description && (
                <div>
                  <p className="text-sm text-muted-foreground">产品描述</p>
                  <p className="mt-1">{product.description}</p>
                </div>
              )}

              <div>
                <p className="text-sm text-muted-foreground">状态</p>
                {product.isActive ? (
                  <Badge className="bg-green-500/10 text-green-600 border-green-500/20 mt-1">
                    <ToggleRight className="h-3 w-3 mr-1" />
                    启用
                  </Badge>
                ) : (
                  <Badge variant="outline" className="mt-1">
                    已禁用
                  </Badge>
                )}
              </div>
            </CardContent>
          </Card>

          {/* 价格信息 */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">价格与库存</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-3 gap-6">
                <div className="text-center p-4 bg-green-50 dark:bg-green-900/20 rounded-lg">
                  <DollarSign className="h-6 w-6 mx-auto text-green-600 mb-2" />
                  <p className="text-sm text-muted-foreground">销售单价</p>
                  <p className="text-2xl font-bold text-green-600">
                    ¥{product.unitPrice.toLocaleString()}
                  </p>
                </div>
                {product.cost > 0 && (
                  <div className="text-center p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                    <DollarSign className="h-6 w-6 mx-auto text-blue-600 mb-2" />
                    <p className="text-sm text-muted-foreground">成本价</p>
                    <p className="text-2xl font-bold text-blue-600">
                      ¥{product.cost.toLocaleString()}
                    </p>
                  </div>
                )}
                <div className="text-center p-4 bg-purple-50 dark:bg-purple-900/20 rounded-lg">
                  <Hash className="h-6 w-6 mx-auto text-purple-600 mb-2" />
                  <p className="text-sm text-muted-foreground">库存</p>
                  <p className="text-2xl font-bold text-purple-600">
                    {product.stock !== undefined ? product.stock : '∞'}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* 右侧：辅助信息 */}
        <div className="space-y-6">
          {/* 操作卡片 */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">快捷操作</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <Button className="w-full justify-start" asChild>
                <Link href={`/products/${product.id}/edit`}>
                  <Edit className="h-4 w-4 mr-2" />
                  编辑产品
                </Link>
              </Button>
              <Button className="w-full justify-start" variant="outline" asChild>
                <Link href="/products">
                  <Package className="h-4 w-4 mr-2" />
                  查看所有产品
                </Link>
              </Button>
            </CardContent>
          </Card>

          {/* 统计信息 */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">产品统计</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Layers className="h-4 w-4" />
                  <span className="text-sm">单位</span>
                </div>
                <span className="font-medium">{product.unit}</span>
              </div>
              {product.cost > 0 && (
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <DollarSign className="h-4 w-4" />
                    <span className="text-sm">利润率</span>
                  </div>
                  <span className="font-medium text-green-600">
                    {((product.unitPrice - product.cost) / product.unitPrice * 100).toFixed(1)}%
                  </span>
                </div>
              )}
            </CardContent>
          </Card>

          {/* 时间信息 */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">时间信息</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Calendar className="h-4 w-4" />
                  <span className="text-sm">创建时间</span>
                </div>
                <span className="text-sm">
                  {format(new Date(product.createdAt), 'yyyy-MM-dd')}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Calendar className="h-4 w-4" />
                  <span className="text-sm">更新时间</span>
                </div>
                <span className="text-sm">
                  {format(new Date(product.updatedAt), 'yyyy-MM-dd')}
                </span>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
