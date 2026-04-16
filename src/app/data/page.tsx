'use client';

import { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Download, Upload, FileSpreadsheet, CheckCircle2, XCircle, AlertCircle, FileText, ArrowRight } from 'lucide-react';

type EntityType = 'customers' | 'contacts' | 'leads' | 'opportunities';
type ExportFormat = 'csv' | 'xlsx';

const ENTITY_LABELS: Record<EntityType, string> = {
  customers: '客户',
  contacts: '联系人',
  leads: '销售线索',
  opportunities: '商机',
};

interface PreviewResult {
  success: boolean;
  mode: string;
  summary: { total: number; valid: number; invalid: number; missingFields?: string[] };
  headers: string[];
  validRows: Array<{ rowIndex: number; data: Record<string, unknown> }>;
  invalidRows: Array<{ rowIndex: number; errors: Array<{ field: string; message: string }> }>;
  errors: Array<{ row: number; field: string; message: string }>;
}

interface ImportResult {
  success: boolean;
  mode: string;
  summary: { total: number; imported: number; failed: number; skipped: number };
  importedIds: string[];
  errors: Array<{ row: number; error: string }>;
}

export default function DataPage() {
  const [activeTab, setActiveTab] = useState('export');
  
  // 导出状态
  const [exportType, setExportType] = useState<EntityType>('customers');
  const [exportFormat, setExportFormat] = useState<ExportFormat>('csv');
  const [isExporting, setIsExporting] = useState(false);
  
  // 导入状态
  const [importType, setImportType] = useState<EntityType>('customers');
  const [importFile, setImportFile] = useState<File | null>(null);
  const [isImporting, setIsImporting] = useState(false);
  const [isPreviewMode, setIsPreviewMode] = useState(true);
  const [previewResult, setPreviewResult] = useState<PreviewResult | null>(null);
  const [importResult, setImportResult] = useState<ImportResult | null>(null);
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // 导出处理
  const handleExport = async () => {
    setIsExporting(true);
    try {
      const response = await fetch(`/api/export?type=${exportType}&format=${exportFormat}`);
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || '导出失败');
      }
      
      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `${exportType}_${new Date().toISOString().split('T')[0]}.${exportFormat}`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch (error) {
      alert(`导出失败: ${(error as Error).message}`);
    } finally {
      setIsExporting(false);
    }
  };
  
  // 文件选择处理
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const fileName = file.name.toLowerCase();
      if (!fileName.endsWith('.csv') && !fileName.endsWith('.xlsx') && !fileName.endsWith('.xls')) {
        alert('请上传CSV或Excel文件');
        return;
      }
      setImportFile(file);
      setPreviewResult(null);
      setImportResult(null);
    }
  };
  
  // 拖放处理
  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const file = e.dataTransfer.files?.[0];
    if (file) {
      const fileName = file.name.toLowerCase();
      if (!fileName.endsWith('.csv') && !fileName.endsWith('.xlsx') && !fileName.endsWith('.xls')) {
        alert('请上传CSV或Excel文件');
        return;
      }
      setImportFile(file);
      setPreviewResult(null);
      setImportResult(null);
    }
  };
  
  // 预览处理
  const handlePreview = async () => {
    if (!importFile) {
      alert('请先选择文件');
      return;
    }
    
    setIsImporting(true);
    setIsPreviewMode(true);
    setPreviewResult(null);
    setImportResult(null);
    
    try {
      const formData = new FormData();
      formData.append('file', importFile);
      formData.append('type', importType);
      formData.append('mode', 'preview');
      
      const response = await fetch('/api/import', {
        method: 'POST',
        body: formData,
      });
      
      const result = await response.json();
      if (!response.ok) {
        throw new Error(result.error || '预览失败');
      }
      setPreviewResult(result);
    } catch (error) {
      alert(`预览失败: ${(error as Error).message}`);
    } finally {
      setIsImporting(false);
    }
  };
  
  // 导入处理
  const handleImport = async () => {
    if (!importFile) {
      alert('请先选择文件');
      return;
    }
    
    setIsImporting(true);
    setIsPreviewMode(false);
    setImportResult(null);
    
    try {
      const formData = new FormData();
      formData.append('file', importFile);
      formData.append('type', importType);
      formData.append('mode', 'import');
      
      const response = await fetch('/api/import', {
        method: 'POST',
        body: formData,
      });
      
      const result = await response.json();
      if (!response.ok) {
        throw new Error(result.error || '导入失败');
      }
      setImportResult(result);
      setPreviewResult(null);
    } catch (error) {
      alert(`导入失败: ${(error as Error).message}`);
    } finally {
      setIsImporting(false);
    }
  };
  
  return (
    <div className="container mx-auto py-8 space-y-8">
      {/* 页面标题 */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight gradient-text">数据导入导出</h1>
        <p className="text-muted-foreground mt-2">管理客户、联系人、销售线索和商机数据的导入导出</p>
      </div>
      
      {/* 标签页 */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="export" className="gap-2">
            <Download className="h-4 w-4" />
            导出数据
          </TabsTrigger>
          <TabsTrigger value="import" className="gap-2">
            <Upload className="h-4 w-4" />
            导入数据
          </TabsTrigger>
        </TabsList>
        
        {/* 导出页面 */}
        <TabsContent value="export" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileSpreadsheet className="h-5 w-5" />
                导出数据
              </CardTitle>
              <CardDescription>
                将CRM数据导出为CSV或Excel格式，方便备份和分析
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* 导出选项 */}
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="export-type">数据类型</Label>
                  <Select value={exportType} onValueChange={(v) => setExportType(v as EntityType)}>
                    <SelectTrigger id="export-type">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.entries(ENTITY_LABELS).map(([value, label]) => (
                        <SelectItem key={value} value={value}>{label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="export-format">文件格式</Label>
                  <Select value={exportFormat} onValueChange={(v) => setExportFormat(v as ExportFormat)}>
                    <SelectTrigger id="export-format">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="csv">CSV (逗号分隔)</SelectItem>
                      <SelectItem value="xlsx">Excel (.xlsx)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              
              {/* 导出按钮 */}
              <Button onClick={handleExport} disabled={isExporting} className="gap-2">
                {isExporting ? (
                  <>导出中...</>
                ) : (
                  <>
                    <Download className="h-4 w-4" />
                    导出 {ENTITY_LABELS[exportType]}
                  </>
                )}
              </Button>
              
              {/* 导出说明 */}
              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>导出说明</AlertTitle>
                <AlertDescription>
                  <ul className="list-disc list-inside space-y-1 mt-2 text-sm">
                    <li>CSV格式适用于大多数数据处理工具</li>
                    <li>Excel格式支持更丰富的格式设置和公式</li>
                    <li>导出文件已使用UTF-8编码，支持中文显示</li>
                  </ul>
                </AlertDescription>
              </Alert>
            </CardContent>
          </Card>
        </TabsContent>
        
        {/* 导入页面 */}
        <TabsContent value="import" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Upload className="h-5 w-5" />
                导入数据
              </CardTitle>
              <CardDescription>
                从CSV或Excel文件批量导入数据，支持数据预览和验证
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* 导入选项 */}
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="import-type">数据类型</Label>
                  <Select value={importType} onValueChange={(v) => setImportType(v as EntityType)}>
                    <SelectTrigger id="import-type">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.entries(ENTITY_LABELS).map(([value, label]) => (
                        <SelectItem key={value} value={value}>{label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              
              {/* 文件上传 */}
              <div
                className="border-2 border-dashed rounded-lg p-8 text-center cursor-pointer hover:border-primary/50 transition-colors"
                onClick={() => fileInputRef.current?.click()}
                onDrop={handleDrop}
                onDragOver={(e) => e.preventDefault()}
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".csv,.xlsx,.xls"
                  onChange={handleFileSelect}
                  className="hidden"
                />
                {importFile ? (
                  <div className="space-y-2">
                    <FileText className="h-12 w-12 mx-auto text-primary" />
                    <p className="font-medium">{importFile.name}</p>
                    <p className="text-sm text-muted-foreground">
                      {(importFile.size / 1024).toFixed(2)} KB
                    </p>
                    <Button variant="outline" size="sm" onClick={(e) => { e.stopPropagation(); setImportFile(null); }}>
                      移除
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <Upload className="h-12 w-12 mx-auto text-muted-foreground" />
                    <p className="font-medium">点击选择文件或将文件拖拽到这里</p>
                    <p className="text-sm text-muted-foreground">
                      支持 CSV、Excel (.xlsx, .xls) 格式
                    </p>
                  </div>
                )}
              </div>
              
              {/* 操作按钮 */}
              <div className="flex gap-4">
                <Button onClick={handlePreview} disabled={!importFile || isImporting} variant="outline" className="gap-2">
                  {isImporting && isPreviewMode ? (
                    <>分析中...</>
                  ) : (
                    <>
                      <FileText className="h-4 w-4" />
                      预览数据
                    </>
                  )}
                </Button>
                <Button onClick={handleImport} disabled={!importFile || isImporting} className="gap-2">
                  {isImporting && !isPreviewMode ? (
                    <>导入中...</>
                  ) : (
                    <>
                      <ArrowRight className="h-4 w-4" />
                      开始导入
                    </>
                  )}
                </Button>
              </div>
              
              {/* 预览结果 */}
              {previewResult && (
                <div className="space-y-4">
                  <Alert variant={previewResult.summary.valid > 0 ? 'default' : 'destructive'}>
                    <AlertCircle className="h-4 w-4" />
                    <AlertTitle>预览结果</AlertTitle>
                    <AlertDescription>
                      <div className="grid grid-cols-3 gap-4 mt-2">
                        <div>
                          <p className="text-2xl font-bold">{previewResult.summary.total}</p>
                          <p className="text-sm text-muted-foreground">总行数</p>
                        </div>
                        <div>
                          <p className="text-2xl font-bold text-green-600">{previewResult.summary.valid}</p>
                          <p className="text-sm text-muted-foreground">有效行</p>
                        </div>
                        <div>
                          <p className="text-2xl font-bold text-red-600">{previewResult.summary.invalid}</p>
                          <p className="text-sm text-muted-foreground">无效行</p>
                        </div>
                      </div>
                      <Progress value={(previewResult.summary.valid / previewResult.summary.total) * 100} className="mt-4" />
                    </AlertDescription>
                  </Alert>
                  
                  {/* 预览表格 */}
                  {previewResult.validRows.length > 0 && (
                    <div>
                      <h3 className="font-medium mb-2">有效数据预览（前10行）</h3>
                      <div className="border rounded-lg overflow-auto max-h-64">
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead className="w-12">行号</TableHead>
                              {previewResult.headers.slice(0, 6).map(header => (
                                <TableHead key={header}>{header}</TableHead>
                              ))}
                              {previewResult.headers.length > 6 && <TableHead>...</TableHead>}
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {previewResult.validRows.map(row => (
                              <TableRow key={row.rowIndex}>
                                <TableCell className="font-medium">{row.rowIndex}</TableCell>
                                {previewResult.headers.slice(0, 6).map(header => (
                                  <TableCell key={header} className="max-w-[150px] truncate">
                                    {String(row.data[header] || '-')}
                                  </TableCell>
                                ))}
                                {previewResult.headers.length > 6 && <TableCell>...</TableCell>}
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </div>
                    </div>
                  )}
                  
                  {/* 错误列表 */}
                  {previewResult.invalidRows.length > 0 && (
                    <div>
                      <h3 className="font-medium mb-2 text-red-600">错误详情（前10行）</h3>
                      <div className="border rounded-lg p-4 space-y-2 max-h-48 overflow-auto">
                        {previewResult.invalidRows.map(row => (
                          <div key={row.rowIndex} className="text-sm">
                            <span className="font-medium">第{row.rowIndex}行:</span>
                            {row.errors.map((err, i) => (
                              <Badge key={i} variant="destructive" className="ml-2 text-xs">
                                [{err.field}] {err.message}
                              </Badge>
                            ))}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
              
              {/* 导入结果 */}
              {importResult && (
                <Alert variant={importResult.summary.failed === 0 ? 'default' : 'destructive'}>
                  {importResult.summary.failed === 0 ? (
                    <CheckCircle2 className="h-4 w-4" />
                  ) : (
                    <XCircle className="h-4 w-4" />
                  )}
                  <AlertTitle>导入完成</AlertTitle>
                  <AlertDescription>
                    <div className="space-y-2">
                      <p>成功导入 <strong>{importResult.summary.imported}</strong> 条记录</p>
                      {importResult.summary.skipped > 0 && (
                        <p className="text-yellow-600">跳过 <strong>{importResult.summary.skipped}</strong> 条无效记录</p>
                      )}
                      {importResult.summary.failed > 0 && (
                        <p className="text-red-600">失败 <strong>{importResult.summary.failed}</strong> 条记录</p>
                      )}
                    </div>
                  </AlertDescription>
                </Alert>
              )}
              
              {/* 导入说明 */}
              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>导入说明</AlertTitle>
                <AlertDescription>
                  <ul className="list-disc list-inside space-y-1 mt-2 text-sm">
                    <li>文件第一行应为表头，包含字段名称</li>
                    <li>必填字段：客户需要「姓名」，联系人需要「名」和「姓」</li>
                    <li>支持枚举值的中文转换，如「活跃」会自动转换为 active</li>
                    <li>预览模式不会导入数据，仅供检查</li>
                    <li>导入前建议先预览数据，确保格式正确</li>
                  </ul>
                </AlertDescription>
              </Alert>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
