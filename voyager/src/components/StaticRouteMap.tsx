import React, { useMemo } from 'react';
import { Navigation, Maximize2 } from 'lucide-react';

interface StaticRouteMapProps {
  waypoints: Array<{
    name: string;
    location: { lat: number; lng: number };
  }>;
  onFullscreenClick: () => void;
}

// 高德静态地图API Key（Web服务API）
const AMAP_WEB_KEY = import.meta.env.VITE_AMAP_WEB_KEY;

const StaticRouteMap: React.FC<StaticRouteMapProps> = ({ waypoints, onFullscreenClick }) => {
  // 生成静态地图URL
  const staticMapUrl = useMemo(() => {
    if (waypoints.length === 0) return null;

    // 计算中心点
    const centerLng = waypoints.reduce((sum, p) => sum + p.location.lng, 0) / waypoints.length;
    const centerLat = waypoints.reduce((sum, p) => sum + p.location.lat, 0) / waypoints.length;

    // 构建标记点参数 - 每个标记单独一个markers参数
    const markersParams = waypoints.map((point, index) => {
      // 格式: markers=size,color,label:lng,lat
      return `markers=mid,0x3B82F6,${index + 1}:${point.location.lng},${point.location.lat}`;
    }).join('&');

    // 静态地图URL - 使用正确的参数格式
    const url = `https://restapi.amap.com/v3/staticmap?` +
      `location=${centerLng},${centerLat}` +
      `&zoom=15`+
      `&size=600*600` +
      `&${markersParams}` +
      `&key=${AMAP_WEB_KEY}`;

    console.log('静态地图URL:', url);
    return url;
  }, [waypoints]);

  if (waypoints.length === 0) {
    return (
      <div className="aspect-square bg-surface-variant rounded-3xl flex items-center justify-center">
        <div className="text-center p-4">
          <Navigation className="w-12 h-12 text-outline mx-auto mb-4" />
          <p className="text-sm text-on-surface-variant font-medium">暂无位置信息</p>
        </div>
      </div>
    );
  }

  return (
    <div className="relative group">
      <div className="aspect-square rounded-3xl overflow-hidden shadow-lg bg-gray-100">
        {staticMapUrl && (
          <img 
            src={staticMapUrl} 
            alt="路线地图"
            className="w-full h-full object-cover"
            onLoad={() => console.log('✅ 静态地图加载成功')}
            onError={(e) => {
              console.error('❌ 静态地图加载失败');
              console.error('URL:', staticMapUrl);
              console.error('请检查：');
              console.error('1. VITE_AMAP_WEB_KEY 是否配置正确');
              console.error('2. 该Key是否为"Web服务API"类型');
              console.error('3. 是否开通了"静态地图"服务');
              
              // 显示占位符
              e.currentTarget.src = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="600" height="600"%3E%3Crect fill="%23f3f4f6" width="600" height="600"/%3E%3Ctext x="50%25" y="45%25" text-anchor="middle" fill="%239ca3af" font-size="16"%3E静态地图加载失败%3C/text%3E%3Ctext x="50%25" y="52%25" text-anchor="middle" fill="%239ca3af" font-size="12"%3E请检查Web服务API Key配置%3C/text%3E%3Ctext x="50%25" y="58%25" text-anchor="middle" fill="%233B82F6" font-size="14" font-weight="bold"%3E点击右上角查看交互式地图%3C/text%3E%3C/svg%3E';
            }}
          />
        )}
      </div>
      
      {/* 全屏按钮 */}
      <button
        onClick={onFullscreenClick}
        className="absolute top-4 right-4 w-10 h-10 bg-white rounded-xl shadow-lg flex items-center justify-center hover:bg-primary hover:text-white transition-all opacity-0 group-hover:opacity-100"
        title="查看交互式地图"
      >
        <Maximize2 className="w-5 h-5" />
      </button>

      {/* 提示信息 */}
      <div className="absolute bottom-4 left-4 right-4 bg-white/95 backdrop-blur-sm rounded-2xl p-3 shadow-xl opacity-0 group-hover:opacity-100 transition-opacity">
        <p className="text-xs text-center text-on-surface-variant font-bold">
          点击右上角按钮查看交互式地图
        </p>
      </div>
    </div>
  );
};

export default StaticRouteMap;
