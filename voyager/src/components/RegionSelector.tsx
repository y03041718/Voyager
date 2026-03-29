import React, { useState, useEffect } from 'react';
import { MapPin, ChevronDown, Check } from 'lucide-react';
import { apiService } from '../services/api';
import { RegionInfo } from '../types';

interface RegionSelectorProps {
  onSelect: (province: string, city?: string) => void;
  className?: string;
}

const RegionSelector: React.FC<RegionSelectorProps> = ({ onSelect, className = '' }) => {
  const [provinces, setProvinces] = useState<string[]>([]);
  const [cities, setCities] = useState<RegionInfo[]>([]);
  const [selectedProvince, setSelectedProvince] = useState<string>('');
  const [selectedCity, setSelectedCity] = useState<string>('');
  const [showProvinceDropdown, setShowProvinceDropdown] = useState(false);
  const [showCityDropdown, setShowCityDropdown] = useState(false);
  const [loading, setLoading] = useState(false);

  // 加载省份列表
  useEffect(() => {
    loadProvinces();
  }, []);

  // 当选择省份时，加载城市列表
  useEffect(() => {
    if (selectedProvince) {
      loadCities(selectedProvince);
    } else {
      setCities([]);
      setSelectedCity('');
    }
  }, [selectedProvince]);

  const loadProvinces = async () => {
    try {
      console.log('🔍 开始加载省份列表...');
      console.log('API URL:', 'http://localhost:8080/api/regions/provinces');
      
      const data = await apiService.getProvinces();
      
      console.log('✅ 省份列表加载成功:', data);
      console.log('省份数量:', data.length);
      
      setProvinces(data);
    } catch (error) {
      console.error('❌ 加载省份列表失败:', error);
      console.error('错误详情:', error instanceof Error ? error.message : error);
    }
  };

  const loadCities = async (province: string) => {
    try {
      setLoading(true);
      const data = await apiService.getCitiesByProvince(province);
      setCities(data);
    } catch (error) {
      console.error('加载城市列表失败:', error);
      setCities([]);
    } finally {
      setLoading(false);
    }
  };

  const handleProvinceSelect = (province: string) => {
    setSelectedProvince(province);
    setSelectedCity('');
    setShowProvinceDropdown(false);
    // 选择省份后，如果没有城市，直接触发搜索
    if (cities.length === 0) {
      onSelect(province);
    }
  };

  const handleCitySelect = (city: string) => {
    setSelectedCity(city);
    setShowCityDropdown(false);
    onSelect(selectedProvince, city);
  };

  const handleProvinceOnly = () => {
    if (selectedProvince) {
      setSelectedCity('');
      onSelect(selectedProvince);
    }
  };

  return (
    <div className={`flex gap-3 ${className}`}>
      {/* 省份选择 */}
      <div className="relative flex-1">
        <button
          onClick={() => setShowProvinceDropdown(!showProvinceDropdown)}
          className="w-full bg-surface-variant/50 border-none rounded-2xl py-4 px-4 flex items-center justify-between hover:bg-surface-variant transition-all"
        >
          <div className="flex items-center gap-2">
            <MapPin className="w-5 h-5 text-primary" />
            <span className={selectedProvince ? 'text-on-surface font-medium' : 'text-outline'}>
              {selectedProvince || '选择省份'}
            </span>
          </div>
          <ChevronDown className={`w-5 h-5 text-outline transition-transform ${showProvinceDropdown ? 'rotate-180' : ''}`} />
        </button>

        {showProvinceDropdown && (
          <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-2xl shadow-xl border border-gray-100 max-h-80 overflow-y-auto z-50">
            {provinces.map((province) => (
              <button
                key={province}
                onClick={() => handleProvinceSelect(province)}
                className="w-full text-left px-4 py-3 hover:bg-gray-50 transition-colors flex items-center justify-between"
              >
                <span className="text-on-surface">{province}</span>
                {selectedProvince === province && <Check className="w-4 h-4 text-primary" />}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* 城市选择 */}
      {selectedProvince && (
        <div className="relative flex-1">
          <button
            onClick={() => setShowCityDropdown(!showCityDropdown)}
            disabled={loading || cities.length === 0}
            className="w-full bg-surface-variant/50 border-none rounded-2xl py-4 px-4 flex items-center justify-between hover:bg-surface-variant transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <span className={selectedCity ? 'text-on-surface font-medium' : 'text-outline'}>
              {loading ? '加载中...' : (selectedCity || cities.length > 0 ? '选择城市（可选）' : '全省')}
            </span>
            {cities.length > 0 && (
              <ChevronDown className={`w-5 h-5 text-outline transition-transform ${showCityDropdown ? 'rotate-180' : ''}`} />
            )}
          </button>

          {showCityDropdown && cities.length > 0 && (
            <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-2xl shadow-xl border border-gray-100 max-h-80 overflow-y-auto z-50">
              <button
                onClick={handleProvinceOnly}
                className="w-full text-left px-4 py-3 hover:bg-gray-50 transition-colors flex items-center justify-between border-b border-gray-100"
              >
                <span className="text-on-surface font-medium">全省</span>
                {!selectedCity && <Check className="w-4 h-4 text-primary" />}
              </button>
              {cities.map((city) => (
                <button
                  key={city.id}
                  onClick={() => handleCitySelect(city.city!)}
                  className="w-full text-left px-4 py-3 hover:bg-gray-50 transition-colors flex items-center justify-between"
                >
                  <span className="text-on-surface">{city.displayName}</span>
                  {selectedCity === city.city && <Check className="w-4 h-4 text-primary" />}
                </button>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default RegionSelector;
