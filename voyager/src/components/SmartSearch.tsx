import React, { useState, useEffect, useRef } from 'react';
import { Search, MapPin, Clock, X } from 'lucide-react';
import { AmapSearchSuggestion } from '../types';
import { apiService } from '../services/api';

interface SmartSearchProps {
  onSearch: (keyword: string, suggestion?: AmapSearchSuggestion) => void;
  placeholder?: string;
  className?: string;
}

const SmartSearch: React.FC<SmartSearchProps> = ({ 
  onSearch, 
  placeholder = "搜索景点、酒店、餐厅...",
  className = ""
}) => {
  const [keyword, setKeyword] = useState('');
  const [suggestions, setSuggestions] = useState<AmapSearchSuggestion[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [loading, setLoading] = useState(false);
  const [recentSearches, setRecentSearches] = useState<string[]>([]);
  const searchRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // 加载历史搜索记录
  useEffect(() => {
    const saved = localStorage.getItem('recentSearches');
    if (saved) {
      try {
        setRecentSearches(JSON.parse(saved));
      } catch (error) {
        console.error('Failed to load recent searches:', error);
      }
    }
  }, []);

  // 搜索建议防抖
  useEffect(() => {
    const timer = setTimeout(async () => {
      if (keyword.trim() && keyword.length >= 2) {
        try {
          setLoading(true);
          const results = await apiService.searchSuggestions(keyword.trim());
          setSuggestions(results);
        } catch (error) {
          console.error('搜索建议失败:', error);
          setSuggestions([]);
        } finally {
          setLoading(false);
        }
      } else {
        setSuggestions([]);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [keyword]);

  // 点击外部关闭建议框
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setShowSuggestions(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setKeyword(value);
    setShowSuggestions(true);
  };

  const handleInputFocus = () => {
    setShowSuggestions(true);
  };

  const handleSearch = (searchKeyword: string, suggestion?: AmapSearchSuggestion) => {
    if (!searchKeyword.trim()) return;

    // 保存到历史记录
    const newRecentSearches = [
      searchKeyword,
      ...recentSearches.filter(item => item !== searchKeyword)
    ].slice(0, 5); // 只保留最近5条

    setRecentSearches(newRecentSearches);
    localStorage.setItem('recentSearches', JSON.stringify(newRecentSearches));

    // 执行搜索
    onSearch(searchKeyword, suggestion);
    setShowSuggestions(false);
    
    // 如果是通过建议选择的，更新输入框
    if (suggestion) {
      setKeyword(suggestion.name);
    }
  };

  const handleSuggestionClick = (suggestion: AmapSearchSuggestion) => {
    handleSearch(suggestion.name, suggestion);
  };

  const handleRecentSearchClick = (recentSearch: string) => {
    setKeyword(recentSearch);
    handleSearch(recentSearch);
  };

  const clearRecentSearches = () => {
    setRecentSearches([]);
    localStorage.removeItem('recentSearches');
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (keyword.trim()) {
      handleSearch(keyword.trim());
    }
  };

  return (
    <div ref={searchRef} className={`relative ${className}`}>
      {/* 搜索输入框 */}
      <form onSubmit={handleSubmit} className="relative group">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-outline w-5 h-5 group-focus-within:text-primary transition-colors" />
        <input
          ref={inputRef}
          type="text"
          value={keyword}
          onChange={handleInputChange}
          onFocus={handleInputFocus}
          placeholder={placeholder}
          className="w-full bg-surface-variant/50 border-none rounded-2xl py-4 pl-12 pr-4 focus:ring-2 focus:ring-primary/20 transition-all outline-none text-on-surface"
        />
        {loading && (
          <div className="absolute right-4 top-1/2 -translate-y-1/2">
            <div className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
          </div>
        )}
      </form>

      {/* 搜索建议下拉框 */}
      {showSuggestions && (
        <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-2xl shadow-xl border border-gray-100 max-h-96 overflow-y-auto z-50">
          {/* 搜索建议 */}
          {suggestions.length > 0 && (
            <div className="p-2">
              <div className="text-xs font-bold text-outline uppercase tracking-widest px-3 py-2">搜索建议</div>
              {suggestions.map((suggestion) => (
                <button
                  key={suggestion.id}
                  onClick={() => handleSuggestionClick(suggestion)}
                  className="w-full text-left px-3 py-3 hover:bg-gray-50 rounded-lg transition-colors flex items-center gap-3"
                >
                  <MapPin className="w-4 h-4 text-primary flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <div className="font-medium text-on-surface truncate">{suggestion.name}</div>
                    <div className="text-sm text-on-surface-variant truncate">{suggestion.address}</div>
                  </div>
                </button>
              ))}
            </div>
          )}

          {/* 历史搜索 */}
          {recentSearches.length > 0 && suggestions.length === 0 && !loading && (
            <div className="p-2">
              <div className="flex items-center justify-between px-3 py-2">
                <span className="text-xs font-bold text-outline uppercase tracking-widest">最近搜索</span>
                <button
                  onClick={clearRecentSearches}
                  className="text-xs text-primary hover:opacity-70 transition-opacity"
                >
                  清除
                </button>
              </div>
              {recentSearches.map((recentSearch, index) => (
                <button
                  key={index}
                  onClick={() => handleRecentSearchClick(recentSearch)}
                  className="w-full text-left px-3 py-3 hover:bg-gray-50 rounded-lg transition-colors flex items-center gap-3"
                >
                  <Clock className="w-4 h-4 text-outline flex-shrink-0" />
                  <span className="flex-1 text-on-surface truncate">{recentSearch}</span>
                  <X className="w-3 h-3 text-outline opacity-0 group-hover:opacity-100 transition-opacity" />
                </button>
              ))}
            </div>
          )}

          {/* 空状态 */}
          {suggestions.length === 0 && recentSearches.length === 0 && !loading && keyword.length >= 2 && (
            <div className="p-6 text-center text-on-surface-variant">
              <MapPin className="w-8 h-8 mx-auto mb-2 opacity-50" />
              <p className="text-sm">未找到相关地点</p>
            </div>
          )}

          {/* 提示信息 */}
          {keyword.length < 2 && keyword.length > 0 && (
            <div className="p-4 text-center text-on-surface-variant text-sm">
              请输入至少2个字符进行搜索
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default SmartSearch;