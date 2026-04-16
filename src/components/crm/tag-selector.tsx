'use client';

import { useState, useEffect } from 'react';
import type { Tag } from '@/storage/database/shared/schema';

interface TagSelectorProps {
  customerId: string;
  selectedTagIds: string[];
  onChange: (tagIds: string[]) => void;
  placeholder?: string;
}

export default function TagSelector({
  customerId: _customerId,
  selectedTagIds,
  onChange,
  placeholder = '选择标签',
}: TagSelectorProps) {
  const [allTags, setAllTags] = useState<Tag[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchTags();
  }, []);

  async function fetchTags() {
    try {
      const res = await fetch('/api/tags');
      if (res.ok) {
        const data = await res.json();
        setAllTags(data);
      }
    } catch (err) {
      console.error('获取标签失败:', err);
    } finally {
      setLoading(false);
    }
  }

  function toggleTag(tagId: string) {
    if (selectedTagIds.includes(tagId)) {
      onChange(selectedTagIds.filter((id) => id !== tagId));
    } else {
      onChange([...selectedTagIds, tagId]);
    }
  }

  function removeTag(tagId: string) {
    onChange(selectedTagIds.filter((id) => id !== tagId));
  }

  const selectedTags = allTags.filter((tag) => selectedTagIds.includes(tag.id));

  return (
    <div className="relative">
      <div
        className="min-h-[42px] border border-gray-300 rounded-lg p-2 cursor-pointer bg-white flex flex-wrap gap-1 items-start"
        onClick={() => setIsOpen(!isOpen)}
      >
        {selectedTags.length > 0 ? (
          selectedTags.map((tag) => (
            <span
              key={tag.id}
              className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-sm"
              style={{
                backgroundColor: `${tag.color}20`,
                color: tag.color,
              }}
            >
              {tag.name}
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  removeTag(tag.id);
                }}
                className="hover:opacity-70 ml-1"
              >
                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </span>
          ))
        ) : (
          <span className="text-gray-400 text-sm">{placeholder}</span>
        )}
      </div>

      {isOpen && (
        <div className="absolute z-50 mt-1 w-full bg-white border border-gray-200 rounded-lg shadow-lg max-h-64 overflow-auto">
          {loading ? (
            <div className="p-4 text-center text-gray-500">加载中...</div>
          ) : allTags.length === 0 ? (
            <div className="p-4 text-center text-gray-500">
              暂无标签
              <br />
              <a href="/settings/tags" className="text-blue-600 hover:underline text-sm">
                去创建
              </a>
            </div>
          ) : (
            <div className="p-2">
              {allTags.map((tag) => (
                <div
                  key={tag.id}
                  className="flex items-center gap-2 px-3 py-2 hover:bg-gray-50 rounded cursor-pointer"
                  onClick={() => toggleTag(tag.id)}
                >
                  <input
                    type="checkbox"
                    checked={selectedTagIds.includes(tag.id)}
                    onChange={() => {}}
                    className="w-4 h-4 text-blue-600 rounded"
                  />
                  <span
                    className="inline-flex items-center px-2 py-0.5 rounded-full text-sm"
                    style={{
                      backgroundColor: `${tag.color}20`,
                      color: tag.color,
                    }}
                  >
                    {tag.name}
                  </span>
                  <span className="text-gray-400 text-xs ml-auto">
                    {tag.usage_count || 0} 次使用
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {isOpen && (
        <div className="fixed inset-0 z-40" onClick={() => setIsOpen(false)} />
      )}
    </div>
  );
}

interface TagDisplayProps {
  tags: Tag[];
  maxDisplay?: number;
}

export function TagDisplay({ tags, maxDisplay = 3 }: TagDisplayProps) {
  if (!tags || tags.length === 0) {
    return <span className="text-gray-400 text-sm">暂无标签</span>;
  }

  const displayTags = tags.slice(0, maxDisplay);
  const remaining = tags.length - maxDisplay;

  return (
    <div className="flex flex-wrap gap-1">
      {displayTags.map((tag) => (
        <span
          key={tag.id}
          className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium"
          style={{
            backgroundColor: `${tag.color}20`,
            color: tag.color,
          }}
        >
          {tag.name}
        </span>
      ))}
      {remaining > 0 && (
        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs bg-gray-100 text-gray-600">
          +{remaining}
        </span>
      )}
    </div>
  );
}

interface TagFilterProps {
  selectedTagId: string | null;
  onChange: (tagId: string | null) => void;
}

export function TagFilter({ selectedTagId, onChange }: TagFilterProps) {
  const [tags, setTags] = useState<Tag[]>([]);
  const [loading, setLoading] = useState(true);

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

  if (loading) {
    return <span className="text-gray-400 text-sm">加载中...</span>;
  }

  return (
    <select
      value={selectedTagId || ''}
      onChange={(e) => onChange(e.target.value || null)}
      className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
    >
      <option value="">全部标签</option>
      {tags.map((tag) => (
        <option key={tag.id} value={tag.id}>
          {tag.name} ({tag.usage_count || 0})
        </option>
      ))}
    </select>
  );
}
