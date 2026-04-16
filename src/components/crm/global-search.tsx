'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Search, X, User, Briefcase, FileText, Package, Users, TrendingUp, DollarSign, ScrollText } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';

interface SearchResult {
  id: string;
  type: 'customer' | 'contact' | 'opportunity' | 'lead' | 'quote' | 'order' | 'contract' | 'product';
  title: string;
  subtitle: string;
  url: string;
}

// Type icons
const TYPE_ICONS: Record<SearchResult['type'], React.ReactNode> = {
  customer: <User className="h-4 w-4" />,
  contact: <Users className="h-4 w-4" />,
  opportunity: <TrendingUp className="h-4 w-4" />,
  lead: <Briefcase className="h-4 w-4" />,
  quote: <FileText className="h-4 w-4" />,
  order: <DollarSign className="h-4 w-4" />,
  contract: <ScrollText className="h-4 w-4" />,
  product: <Package className="h-4 w-4" />,
};

// Type labels
const TYPE_LABELS: Record<SearchResult['type'], string> = {
  customer: '客户',
  contact: '联系人',
  opportunity: '商机',
  lead: '线索',
  quote: '报价单',
  order: '订单',
  contract: '合同',
  product: '产品',
};

// Type colors
const TYPE_COLORS: Record<SearchResult['type'], string> = {
  customer: 'text-blue-600 bg-blue-50',
  contact: 'text-green-600 bg-green-50',
  opportunity: 'text-purple-600 bg-purple-50',
  lead: 'text-orange-600 bg-orange-50',
  quote: 'text-cyan-600 bg-cyan-50',
  order: 'text-emerald-600 bg-emerald-50',
  contract: 'text-rose-600 bg-rose-50',
  product: 'text-amber-600 bg-amber-50',
};

interface GlobalSearchProps {
  className?: string;
}

export function GlobalSearch({ className }: GlobalSearchProps) {
  const router = useRouter();
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const debounceRef = useRef<NodeJS.Timeout | null>(null);

  // Debounced search
  const performSearch = useCallback(async (searchQuery: string) => {
    if (searchQuery.length < 1) {
      setResults([]);
      setIsOpen(false);
      return;
    }

    setIsLoading(true);
    try {
      const response = await fetch(`/api/search?q=${encodeURIComponent(searchQuery)}`);
      if (!response.ok) throw new Error('Search failed');
      
      const data = await response.json();
      setResults(data.results || []);
      setIsOpen(true);
      setSelectedIndex(0);
    } catch (error) {
      console.error('Search error:', error);
      setResults([]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Handle input change with debounce
  useEffect(() => {
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }

    debounceRef.current = setTimeout(() => {
      performSearch(query);
    }, 300);

    return () => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }
    };
  }, [query, performSearch]);

  // Close on click outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Keyboard navigation
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!isOpen || results.length === 0) {
      if (e.key === 'Escape') {
        setQuery('');
        setIsOpen(false);
        inputRef.current?.blur();
      }
      return;
    }

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setSelectedIndex((prev) => (prev + 1) % results.length);
        break;
      case 'ArrowUp':
        e.preventDefault();
        setSelectedIndex((prev) => (prev - 1 + results.length) % results.length);
        break;
      case 'Enter':
        e.preventDefault();
        if (results[selectedIndex]) {
          navigateToResult(results[selectedIndex]);
        }
        break;
      case 'Escape':
        e.preventDefault();
        setIsOpen(false);
        inputRef.current?.blur();
        break;
    }
  };

  // Navigate to result
  const navigateToResult = (result: SearchResult) => {
    router.push(result.url);
    setQuery('');
    setIsOpen(false);
  };

  // Clear search
  const clearSearch = () => {
    setQuery('');
    setResults([]);
    setIsOpen(false);
    inputRef.current?.focus();
  };

  // Highlight matching text
  const highlightMatch = (text: string, query: string) => {
    if (!query) return text;
    
    const regex = new RegExp(`(${query})`, 'gi');
    const parts = text.split(regex);
    
    return parts.map((part, index) =>
      regex.test(part) ? (
        <mark key={index} className="bg-yellow-200 text-inherit rounded px-0.5">
          {part}
        </mark>
      ) : (
        part
      )
    );
  };

  // Group results by type
  const groupedResults = results.reduce((acc, result) => {
    if (!acc[result.type]) {
      acc[result.type] = [];
    }
    acc[result.type].push(result);
    return acc;
  }, {} as Record<SearchResult['type'], SearchResult[]>);

  return (
    <div ref={containerRef} className={cn('relative w-full max-w-md', className)}>
      {/* Search Input */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          ref={inputRef}
          type="search"
          placeholder="搜索客户、联系人、商机..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={handleKeyDown}
          onFocus={() => query.length >= 1 && setIsOpen(true)}
          className="pl-9 pr-9 bg-muted/50 border-transparent focus:bg-background focus:border-input"
        />
        {query && (
          <button
            onClick={clearSearch}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </div>

      {/* Search Results Dropdown */}
      {isOpen && (
        <div className="absolute top-full left-0 right-0 mt-2 bg-background border rounded-lg shadow-lg overflow-hidden z-50 max-h-[400px] overflow-y-auto">
          {isLoading ? (
            <div className="p-4 text-center text-muted-foreground">
              <div className="inline-block h-5 w-5 border-2 border-primary border-t-transparent rounded-full animate-spin" />
              <span className="ml-2">搜索中...</span>
            </div>
          ) : results.length === 0 ? (
            <div className="p-6 text-center text-muted-foreground">
              <Search className="h-8 w-8 mx-auto mb-2 opacity-50" />
              <p>未找到相关结果</p>
              <p className="text-sm mt-1">尝试其他关键词</p>
            </div>
          ) : (
            <div className="py-2">
              {Object.entries(groupedResults).map(([type, items]) => (
                <div key={type}>
                  {/* Type Header */}
                  <div className="px-3 py-1.5 text-xs font-semibold text-muted-foreground uppercase tracking-wide flex items-center gap-2">
                    <span className={cn('p-1 rounded', TYPE_COLORS[type as SearchResult['type']])}>
                      {TYPE_ICONS[type as SearchResult['type']]}
                    </span>
                    {TYPE_LABELS[type as SearchResult['type']]}
                  </div>
                  
                  {/* Type Results */}
                  {items.map((result) => {
                    const globalIndex = results.findIndex((r) => r.id === result.id);
                    return (
                      <button
                        key={result.id}
                        onClick={() => navigateToResult(result)}
                        className={cn(
                          'w-full px-3 py-2 text-left flex items-start gap-3 hover:bg-muted/50 transition-colors',
                          globalIndex === selectedIndex && 'bg-muted/50'
                        )}
                      >
                        <span className={cn('mt-0.5 p-1.5 rounded', TYPE_COLORS[result.type])}>
                          {TYPE_ICONS[result.type]}
                        </span>
                        <div className="flex-1 min-w-0">
                          <p className="font-medium truncate">
                            {highlightMatch(result.title, query)}
                          </p>
                          <p className="text-sm text-muted-foreground truncate">
                            {highlightMatch(result.subtitle, query)}
                          </p>
                        </div>
                      </button>
                    );
                  })}
                </div>
              ))}
              
              {/* Footer hint */}
              <div className="px-3 py-2 border-t text-xs text-muted-foreground flex items-center gap-4">
                <span className="flex items-center gap-1">
                  <kbd className="px-1.5 py-0.5 bg-muted rounded text-[10px]">↑↓</kbd>
                  导航
                </span>
                <span className="flex items-center gap-1">
                  <kbd className="px-1.5 py-0.5 bg-muted rounded text-[10px]">Enter</kbd>
                  选择
                </span>
                <span className="flex items-center gap-1">
                  <kbd className="px-1.5 py-0.5 bg-muted rounded text-[10px]">Esc</kbd>
                  关闭
                </span>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
