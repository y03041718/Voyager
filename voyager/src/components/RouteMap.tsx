import React, { useEffect, useRef, useState } from 'react';
import { Navigation, Maximize2, Minimize2 } from 'lucide-react';

interface RouteMapProps {
  waypoints: Array<{
    name: string;
    location: { lat: number; lng: number };
  }>;
  onRouteCalculated?: (distance: number, duration: number) => void;
}

// 声明高德地图全局变量
declare global {
  interface Window {
    AMap: any;
    _AMapSecurityConfig: any;
  }
}

// 高德地图Web服务API Key（从环境变量获取）
// 在 .env 文件中配置: VITE_AMAP_KEY=your_key
// 高德地图Web服务API Key（从环境变量获取）
const AMAP_WEB_KEY = import.meta.env.VITE_AMAP_KEY;
const RouteMap: React.FC<RouteMapProps> = ({ waypoints, onRouteCalculated }) => {
  const mapContainer = useRef<HTMLDivElement>(null);
  const [map, setMap] = useState<any>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [routeInfo, setRouteInfo] = useState<{ distance: number; duration: number } | null>(null);

  // 加载高德地图JS API
  useEffect(() => {
    if (window.AMap) {
      setLoading(false);
      return;
    }

    // 设置安全密钥（如果需要）
    window._AMapSecurityConfig = {
      securityJsCode: '5133570b1b8d8b7b1a04e1e5136c4fff', // 可选，在高德控制台获取
    };

    const script = document.createElement('script');
    script.src = `https://webapi.amap.com/maps?v=2.0&key=${AMAP_WEB_KEY}&plugin=AMap.Driving`;
    script.async = true;
    script.onload = () => {
      setLoading(false);
    };
    script.onerror = () => {
      setError('地图加载失败，请检查网络连接');
      setLoading(false);
    };
    document.head.appendChild(script);

    return () => {
      if (script.parentNode) {
        script.parentNode.removeChild(script);
      }
    };
  }, []);

  // 初始化地图
  useEffect(() => {
    if (!mapContainer.current || loading || !window.AMap || waypoints.length === 0) {
      return;
    }

    try {
      // 创建地图实例
      const mapInstance = new window.AMap.Map(mapContainer.current, {
        zoom: 13,
        center: [waypoints[0].location.lng, waypoints[0].location.lat],
        viewMode: '3D',
        pitch: 50,
        mapStyle: 'amap://styles/normal'
      });

      setMap(mapInstance);

      // 添加标记点
      waypoints.forEach((point, index) => {
        const marker = new window.AMap.Marker({
          position: [point.location.lng, point.location.lat],
          title: point.name,
          label: {
            content: `<div style="background: white; padding: 4px 8px; border-radius: 8px; font-weight: bold; box-shadow: 0 2px 8px rgba(0,0,0,0.1);">${index + 1}. ${point.name}</div>`,
            offset: new window.AMap.Pixel(0, -40)
          }
        });
        mapInstance.add(marker);
      });

      // 如果有多个点，规划路线
      if (waypoints.length > 1) {
        const driving = new window.AMap.Driving({
          map: mapInstance,
          panel: null,
          hideMarkers: true,
          autoFitView: true
        });

        // 规划多点路线
        const points = waypoints.map(p => new window.AMap.LngLat(p.location.lng, p.location.lat));
        
        if (points.length === 2) {
          // 两点之间直接规划
          driving.search(points[0], points[1], (status: string, result: any) => {
            if (status === 'complete') {
              const route = result.routes[0];
              const distance = Math.round(route.distance / 1000 * 10) / 10; // km
              const duration = Math.round(route.time / 60); // 分钟
              setRouteInfo({ distance, duration });
              if (onRouteCalculated) {
                onRouteCalculated(distance, duration);
              }
            }
          });
        } else {
          // 多点路线：使用途经点
          const origin = points[0];
          const destination = points[points.length - 1];
          const wayPointsMiddle = points.slice(1, -1);

          driving.search(
            origin,
            destination,
            { waypoints: wayPointsMiddle },
            (status: string, result: any) => {
              if (status === 'complete') {
                const route = result.routes[0];
                const distance = Math.round(route.distance / 1000 * 10) / 10;
                const duration = Math.round(route.time / 60);
                setRouteInfo({ distance, duration });
                if (onRouteCalculated) {
                  onRouteCalculated(distance, duration);
                }
              }
            }
          );
        }
      }

      // 自适应显示所有标记
      if (waypoints.length > 0) {
        mapInstance.setFitView();
      }

    } catch (err) {
      console.error('地图初始化失败:', err);
      setError('地图初始化失败');
    }

    return () => {
      if (map) {
        map.destroy();
      }
    };
  }, [loading, waypoints]);

  const toggleFullscreen = () => {
    setIsFullscreen(!isFullscreen);
  };

  if (loading) {
    return (
      <div className="aspect-square bg-surface-variant rounded-3xl flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-sm text-on-surface-variant font-medium">加载地图中...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="aspect-square bg-surface-variant rounded-3xl flex items-center justify-center">
        <div className="text-center p-4">
          <Navigation className="w-12 h-12 text-outline mx-auto mb-4" />
          <p className="text-sm text-on-surface-variant font-medium">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="relative">
        <div 
          ref={mapContainer} 
          className="aspect-square rounded-3xl overflow-hidden shadow-lg"
          style={{ minHeight: '400px' }}
        />
        <button
          onClick={toggleFullscreen}
          className="absolute top-4 right-4 w-10 h-10 bg-white rounded-xl shadow-lg flex items-center justify-center hover:bg-primary hover:text-white transition-all z-10"
        >
          {isFullscreen ? <Minimize2 className="w-5 h-5" /> : <Maximize2 className="w-5 h-5" />}
        </button>
        
        {routeInfo && (
          <div className="absolute bottom-4 left-4 right-4 bg-white/95 backdrop-blur-sm rounded-2xl p-4 shadow-xl">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-xs text-outline font-bold uppercase tracking-widest mb-1">总距离</p>
                <p className="text-2xl font-black text-primary">{routeInfo.distance} km</p>
              </div>
              <div>
                <p className="text-xs text-outline font-bold uppercase tracking-widest mb-1">预计时间</p>
                <p className="text-2xl font-black text-primary">{routeInfo.duration} 分钟</p>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* 全屏模态框 */}
      {isFullscreen && (
        <div className="fixed inset-0 z-[200] bg-black/90 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full h-full max-w-7xl max-h-[90vh] relative">
            <div 
              ref={mapContainer} 
              className="w-full h-full rounded-3xl overflow-hidden shadow-2xl"
            />
            <button
              onClick={toggleFullscreen}
              className="absolute top-4 right-4 w-12 h-12 bg-white rounded-xl shadow-lg flex items-center justify-center hover:bg-primary hover:text-white transition-all"
            >
              <Minimize2 className="w-6 h-6" />
            </button>
            
            {routeInfo && (
              <div className="absolute bottom-4 left-4 right-4 bg-white/95 backdrop-blur-sm rounded-2xl p-6 shadow-xl">
                <div className="grid grid-cols-2 gap-6">
                  <div>
                    <p className="text-xs text-outline font-bold uppercase tracking-widest mb-2">总距离</p>
                    <p className="text-3xl font-black text-primary">{routeInfo.distance} km</p>
                  </div>
                  <div>
                    <p className="text-xs text-outline font-bold uppercase tracking-widest mb-2">预计时间</p>
                    <p className="text-3xl font-black text-primary">{routeInfo.duration} 分钟</p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
};

export default RouteMap;
