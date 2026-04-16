'use client';

import { useState, useEffect } from 'react';
import type { Tag } from '@/storage/database/shared/schema';

const PRESET_COLORS = [
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
];

const PRESET_ICONS = ['tag', 'star', 'heart', 'flag', 'bookmark', 'award', 'zap', 'target', 'trending', 'sparkles', 'crown', 'gem'];

interface TagFormData {
  name: string;
  color: string;
  icon: string;
  description: string;
}

export default function TagsPage() {
  const [tags, setTags] = useState<Tag[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingTag, setEditingTag] = useState<Tag | null>(null);
  const [formData, setFormData] = useState<TagFormData>({
    name: '',
    color: '#6B7280',
    icon: 'tag',
    description: '',
  });
  const [error, setError] = useState('');

  useEffect(() => {
    fetchTags();
  }, []);

  async function fetchTags() {
    try {
      const res = await fetch('/api/tags');
      if (res.ok) {
        const data = await res.json();
        setTags(data);
      }
    } catch (err) {
      console.error('获取标签失败:', err);
    } finally {
      setLoading(false);
    }
  }

  function openCreateModal() {
    setEditingTag(null);
    setFormData({ name: '', color: '#6B7280', icon: 'tag', description: '' });
    setError('');
    setShowModal(true);
  }

  function openEditModal(tag: Tag) {
    setEditingTag(tag);
    setFormData({
      name: tag.name,
      color: tag.color,
      icon: tag.icon || 'tag',
      description: tag.description || '',
    });
    setError('');
    setShowModal(true);
  }

  function closeModal() {
    setShowModal(false);
    setEditingTag(null);
    setError('');
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    if (!formData.name.trim()) {
      setError('标签名称不能为空');
      return;
    }

    if (formData.name.length > 64) {
      setError('标签名称不能超过64个字符');
      return;
    }

    const url = editingTag ? '/api/tags' : '/api/tags';
    const method = editingTag ? 'PUT' : 'POST';
    const body = editingTag ? { id: editingTag.id, ...formData } : formData;

    try {
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      if (res.ok) {
        await fetchTags();
        closeModal();
      } else {
        const data = await res.json();
        setError(data.error || '操作失败');
      }
    } catch {
      setError('操作失败，请重试');
    }
  }

  async function handleDelete(tag: Tag) {
    if (!confirm(`确定要删除标签 "${tag.name}" 吗？`)) return;

    try {
      const res = await fetch(`/api/tags?id=${tag.id}`, { method: 'DELETE' });
      if (res.ok) {
        await fetchTags();
      }
    } catch {
      alert('删除失败');
    }
  }

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold">客户标签</h1>
          <p className="text-gray-500 mt-1">管理和维护客户标签</p>
        </div>
        <button
          onClick={openCreateModal}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          新建标签
        </button>
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      ) : tags.length === 0 ? (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-12 text-center">
          <svg className="w-12 h-12 mx-auto text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A2 2 0 013 12V7a4 4 0 014-4z" />
          </svg>
          <h3 className="mt-4 text-lg font-medium text-gray-900">暂无标签</h3>
          <p className="mt-2 text-gray-500">创建第一个标签来管理您的客户</p>
          <button
            onClick={openCreateModal}
            className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            创建标签
          </button>
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  标签
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  描述
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  使用次数
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  操作
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {tags.map((tag) => (
                <tr key={tag.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center gap-3">
                      <span
                        className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium"
                        style={{
                          backgroundColor: `${tag.color}20`,
                          color: tag.color,
                        }}
                      >
                        {tag.name}
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-gray-500 text-sm">
                    {tag.description || '-'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-gray-500 text-sm">
                    {tag.usage_count || 0}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm">
                    <button
                      onClick={() => openEditModal(tag)}
                      className="text-blue-600 hover:text-blue-800 mr-4"
                    >
                      编辑
                    </button>
                    <button
                      onClick={() => handleDelete(tag)}
                      className="text-red-600 hover:text-red-800"
                    >
                      删除
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black opacity-50" onClick={closeModal}></div>
          <div className="relative bg-white rounded-lg shadow-xl max-w-md w-full mx-4 p-6">
            <h2 className="text-xl font-bold mb-4">
              {editingTag ? '编辑标签' : '新建标签'}
            </h2>

            <form onSubmit={handleSubmit}>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  标签名称 <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="输入标签名称"
                  maxLength={64}
                />
              </div>

              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  标签颜色
                </label>
                <div className="flex flex-wrap gap-2">
                  {PRESET_COLORS.map((color) => (
                    <button
                      key={color.value}
                      type="button"
                      onClick={() => setFormData({ ...formData, color: color.value })}
                      className={`w-8 h-8 rounded-full border-2 transition-all ${
                        formData.color === color.value
                          ? 'border-gray-900 scale-110'
                          : 'border-transparent hover:scale-105'
                      }`}
                      style={{ backgroundColor: color.value }}
                      title={color.label}
                    />
                  ))}
                </div>
              </div>

              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  图标
                </label>
                <div className="flex flex-wrap gap-2">
                  {PRESET_ICONS.map((icon) => (
                    <button
                      key={icon}
                      type="button"
                      onClick={() => setFormData({ ...formData, icon })}
                      className={`w-10 h-10 rounded-lg border-2 flex items-center justify-center transition-all ${
                        formData.icon === icon
                          ? 'border-blue-500 bg-blue-50'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <span className="text-sm">{icon}</span>
                    </button>
                  ))}
                </div>
              </div>

              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  描述
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="可选：添加标签描述"
                  rows={3}
                />
              </div>

              {error && (
                <div className="mb-4 p-3 bg-red-50 text-red-600 rounded-lg text-sm">
                  {error}
                </div>
              )}

              <div className="flex justify-end gap-3">
                <button
                  type="button"
                  onClick={closeModal}
                  className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
                >
                  取消
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  {editingTag ? '保存' : '创建'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
