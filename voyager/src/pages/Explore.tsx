import React, { useState } from 'react';
import { MapPin, Star, Heart, CheckCircle2 } from 'lucide-react';
import { MOCK_DESTINATIONS } from '../constants';
import { motion } from 'motion/react';
import { useSelection } from '../SelectionContext';
import SmartSearch from '../components/SmartSearch';
import { apiService } from '../services/api';
import { AmapSearchSuggestion, AmapPOI, SearchAllResponse } from '../types';

const Explore: React.FC = () => {
  const { selectedDestinations, toggleSelection, setAllSearchResults: saveAllSearchResults } = useSelection();
  const [activeCategory, setActiveCategory] = useState('酒店');
  const [allSearchResults, setAllSearchResults] = useState<SearchAllResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [showMockData, setShowMockData] = useState(true);
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);

  const categories = ['酒店', '景点', '餐厅'];

  // 获取用户位置
  React.useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setUserLocation({
            lat: position.coords.latitude,
            lng: position.coords.longitude
          });
          console.log('用户位置:', position.coords.latitude, position.coords.longitude);
        },
        (error) => {
          console.warn('无法获取用户位置:', error);
          // 使用默认位置（京都）
          setUserLocation({ lat: 35.0116, lng: 135.7681 });
        }
      );
    } else {
      // 使用默认位置（京都）
      setUserLocation({ lat: 35.0116, lng: 135.7681 });
    }
  }, []);

  const handleSearch = async (keyword: string, suggestion?: AmapSearchSuggestion) => {
    console.log('=== 搜索开始 ===');
    console.log('关键字:', keyword);
    console.log('选中的POI:', suggestion?.name);
    console.log('POI位置:', suggestion?.location);
    
    setLoading(true);
    setShowMockData(false);
    
    try {
      let results: SearchAllResponse;
      
      if (suggestion && suggestion.location) {
        console.log('✅ 使用周边搜索逻辑:');
        console.log('  - 中心点:', suggestion.name);
        console.log('  - 坐标:', suggestion.location);
        console.log('  - 搜索半径: 3000米');
        
        // 使用选中地点的坐标进行周边搜索
        results = await apiService.getNearbyAllPOI(suggestion.location, 3000);
      } else {
        console.log('使用关键词搜索（无中心点）:', keyword);
        // 纯关键词搜索，不计算距离
        results = await apiService.searchAllPOI(keyword, '京都');
      }
      
      console.log('搜索结果:', results);
      console.log('酒店数量:', results.hotels?.length || 0);
      console.log('景点数量:', results.attractions?.length || 0);
      console.log('餐厅数量:', results.restaurants?.length || 0);
      
      setAllSearchResults(results);
      
      // 保存所有搜索结果到Context，供生成行程时使用
      const allDestinations = [
        ...(results.hotels || []).map(poi => convertAmapPOIToDestination(poi, 'hotel')),
        ...(results.attractions || []).map(poi => convertAmapPOIToDestination(poi, 'attraction')),
        ...(results.restaurants || []).map(poi => convertAmapPOIToDestination(poi, 'restaurant'))
      ];
      saveAllSearchResults(allDestinations);
      console.log('已保存所有搜索结果到Context，共', allDestinations.length, '个POI');
      console.log('=== 搜索完成 ===');
      
    } catch (error) {
      console.error('搜索失败:', error);
      // 搜索失败时显示模拟数据
      setShowMockData(true);
      setAllSearchResults(null);
    } finally {
      setLoading(false);
    }
  };

  const getCategoryType = (category: string): 'hotel' | 'attraction' | 'restaurant' => {
    switch (category) {
      case '酒店': return 'hotel';
      case '景点': return 'attraction';
      case '餐厅': return 'restaurant';
      default: return 'hotel';
    }
  };

  // 转换AmapPOI到Destination格式
  const convertAmapPOIToDestination = (poi: AmapPOI, type: 'hotel' | 'attraction' | 'restaurant') => {
    return {
      id: poi.id,
      name: poi.name,
      distance: poi.distance ? `${(poi.distance / 1000).toFixed(1)}km` : '距离未知',
      rating: poi.rating || 4.5,
      description: poi.address || '暂无描述',
      image: poi.photos && poi.photos.length > 0 ? poi.photos[0] : `https://picsum.photos/seed/${poi.id}/400/300`,
      type: type,
      address: poi.address,
      cityname: poi.cityname,  // 保存城市名
      adname: poi.adname,      // 保存区域名
      location: poi.location ? {
        lat: poi.location.lat,
        lng: poi.location.lng
      } : undefined,
      tags: [poi.type],
      starLevel: poi.starLevel,
      level: poi.level,
      cost: poi.cost
    };
  };

  // 根据当前分类获取对应的搜索结果
  const getCurrentCategoryResults = () => {
    if (!allSearchResults) {
      console.log('allSearchResults 为空');
      return [];
    }
    
    console.log('当前分类:', activeCategory);
    console.log('所有搜索结果:', allSearchResults);
    
    let results = [];
    switch (activeCategory) {
      case '酒店':
        results = (allSearchResults.hotels || []).map(poi => convertAmapPOIToDestination(poi, 'hotel'));
        console.log('酒店结果:', results);
        break;
      case '景点':
        results = (allSearchResults.attractions || []).map(poi => convertAmapPOIToDestination(poi, 'attraction'));
        console.log('景点结果:', results);
        break;
      case '餐厅':
        results = (allSearchResults.restaurants || []).map(poi => convertAmapPOIToDestination(poi, 'restaurant'));
        console.log('餐厅结果:', results);
        break;
      default:
        results = [];
    }
    
    return results;
  };

  const filteredDestinations = showMockData 
    ? MOCK_DESTINATIONS.filter(dest => {
        if (activeCategory === '酒店') return dest.type === 'hotel';
        if (activeCategory === '景点') return dest.type === 'attraction';
        if (activeCategory === '餐厅') return dest.type === 'restaurant';
        return true;
      })
    : getCurrentCategoryResults();

  // 获取每个分类的数量
  const getCategoryCount = (category: string) => {
    if (showMockData || !allSearchResults) return 0;
    
    switch (category) {
      case '酒店': return allSearchResults.hotels.length;
      case '景点': return allSearchResults.attractions.length;
      case '餐厅': return allSearchResults.restaurants.length;
      default: return 0;
    }
  };

  return (
    <div className="pb-24 pt-6 md:pt-24 px-4 max-w-7xl mx-auto">
      {/* Header */}
      <header className="mb-8">
        <h1 className="text-3xl font-black tracking-tight text-on-surface mb-2">探索周边</h1>
        <div className="flex items-center text-on-surface-variant gap-1">
          <MapPin className="w-4 h-4 text-primary" />
          <span className="text-sm font-medium">当前位置：福建，福州</span>
        </div>
        <p className="text-xs text-outline mt-1 ml-5">
          💡 提示：选择搜索建议中的地点，可查看该地点周边的酒店、景点和餐厅
        </p>
      </header>

      {/* Search Bar */}
      <SmartSearch 
        onSearch={handleSearch}
        placeholder="搜索景点、酒店、餐厅..."
        className="mb-10"
      />

      {/* Categories */}
      <section className="mb-12 overflow-x-auto no-scrollbar flex gap-4 pb-2">
        {categories.map((cat) => {
          const count = getCategoryCount(cat);
          return (
            <button
              key={cat}
              onClick={() => setActiveCategory(cat)}
              className={`px-8 py-3 rounded-full whitespace-nowrap text-sm font-bold transition-all relative ${
                activeCategory === cat ? 'bg-primary text-white shadow-lg shadow-primary/20' : 'bg-surface-variant text-on-surface-variant hover:bg-primary/10'
              }`}
            >
              {cat}
              {!showMockData && count > 0 && (
                <span className={`ml-2 px-2 py-0.5 rounded-full text-xs ${
                  activeCategory === cat ? 'bg-white/20' : 'bg-primary/10 text-primary'
                }`}>
                  {count}
                </span>
              )}
            </button>
          );
        })}
      </section>

      {/* Featured Section */}
      <section className="mb-12">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-black tracking-tight">
            {showMockData ? '为您推荐' : '搜索结果'}
          </h2>
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-outline uppercase tracking-widest">
              已选: {selectedDestinations.length}
            </span>
            {loading && (
              <div className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
            )}
          </div>
        </div>

        {filteredDestinations.length === 0 && !loading && !showMockData && (
          <div className="text-center py-12">
            <MapPin className="w-16 h-16 mx-auto mb-4 text-outline opacity-50" />
            <p className="text-on-surface-variant text-lg">未找到相关{activeCategory}</p>
            <p className="text-outline text-sm mt-2">试试搜索其他关键词或切换分类</p>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {filteredDestinations.map((dest, i) => {
            const isSelected = selectedDestinations.some(d => d.id === dest.id);
            return (
              <motion.div
                key={dest.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.1 }}
                onClick={() => toggleSelection(dest)}
                className={`group bg-white rounded-3xl overflow-hidden shadow-sm hover:shadow-xl transition-all border cursor-pointer ${
                  isSelected ? 'border-primary ring-2 ring-primary/10' : 'border-gray-100'
                }`}
              >
                <div className="relative h-56 overflow-hidden">
                  <img
                    src={dest.image}
                    alt={dest.name}
                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                    referrerPolicy="no-referrer"
                  />
                  <div className={`absolute top-4 right-4 w-10 h-10 rounded-full flex items-center justify-center transition-all ${
                    isSelected ? 'bg-primary text-white' : 'bg-white/20 backdrop-blur-md text-white hover:bg-white hover:text-red-500'
                  }`}>
                    {isSelected ? <CheckCircle2 className="w-6 h-6" /> : <Heart className="w-5 h-5" />}
                  </div>
                  <div className="absolute bottom-4 left-4 flex gap-2">
                    {dest.tags?.slice(0, 2).map(tag => (
                      <span key={tag} className="px-3 py-1 bg-black/30 backdrop-blur-md text-white text-[10px] font-bold rounded-full uppercase tracking-wider">
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>
                <div className="p-5">
                  <div className="flex justify-between items-start mb-2">
                    <h3 className="text-lg font-black tracking-tight text-on-surface">{dest.name}</h3>
                    <div className="flex items-center gap-1 bg-primary/5 px-2 py-1 rounded-lg">
                      <Star className="w-4 h-4 text-yellow-500 fill-yellow-500" />
                      <span className="text-xs font-black text-primary">{dest.rating}</span>
                    </div>
                  </div>
                  <p className="text-on-surface-variant text-sm line-clamp-2 mb-4 leading-relaxed">
                    {dest.description}
                  </p>
                  <div className="flex items-center justify-between pt-4 border-t border-gray-50">
                    <div className="flex flex-col">
                      {/* 酒店显示星级 */}
                      {dest.type === 'hotel' && (
                        <>
                          <span className="text-[10px] text-outline font-bold uppercase tracking-widest">星级</span>
                          <span className="text-primary font-black text-lg">{dest.starLevel || '未评级'}</span>
                        </>
                      )}
                      {/* 景点显示评级 */}
                      {dest.type === 'attraction' && (
                        <>
                          <span className="text-[10px] text-outline font-bold uppercase tracking-widest">评级</span>
                          <span className="text-primary font-black text-lg">{dest.level || '未评级'}</span>
                        </>
                      )}
                      {/* 餐厅显示人均价格 */}
                      {dest.type === 'restaurant' && (
                        <>
                          <span className="text-[10px] text-outline font-bold uppercase tracking-widest">人均</span>
                          <span className="text-primary font-black text-lg">{dest.cost ? `¥${dest.cost}` : '价格未知'}</span>
                        </>
                      )}
                    </div>
                    <span className="text-xs text-outline font-medium">{dest.distance}</span>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      </section>
    </div>
  );
};

export default Explore;
