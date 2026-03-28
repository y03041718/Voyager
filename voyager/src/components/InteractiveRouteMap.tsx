import React, { useEffect, useRef, useState } from 'react';
import { X, Car, Navigation as NavigationIcon, Bike, Footprints } from 'lucide-react';

interface InteractiveRouteMapProps {
  waypoints: Array<{
    name: string;
    location: { lat: number; lng: number };
  }>;
  onClose: () => void;
}

// 声明高德地图全局变量
declare global {
  interface Window {
    AMap: any;
    _AMapSecurityConfig: any;
  }
}

const AMAP_WEB_KEY = import.meta.env.VITE_AMAP_KEY;

type TravelMode = 'driving' | 'walking' | 'riding';

const InteractiveRouteMap: React.FC<InteractiveRouteMapProps> = ({ waypoints, onClose }) => {
  const mapContainer = useRef<HTMLDivElement>(null);
  const [map, setMap] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [routeInfo, setRouteInfo] = useState<{ distance: number; duration: number } | null>(null);
  const [travelMode, setTravelMode] = useState<TravelMode>('driving');
  const drivingRef = useRef<any>(null);

  // 加载高德地图JS API
  useEffect(() => {
    if (window.AMap) {
      console.log('高德地图API已加载');
      setLoading(false);
      return;
    }

    // 设置安全密钥
    window._AMapSecurityConfig = {
      securityJsCode: import.meta.env.VITE_AMAP_SECURITY_CODE || '',
    };

    console.log('开始加载高德地图API...');
    const script = document.createElement('script');
    // 加载所有需要的插件
    script.src = `https://webapi.amap.com/maps?v=2.0&key=${AMAP_WEB_KEY}&plugin=AMap.Driving,AMap.Walking,AMap.Riding`;
    script.async = true;
    script.onload = () => {
      console.log('高德地图API加载成功');
      console.log('可用服务:', {
        Driving: !!window.AMap.Driving,
        Walking: !!window.AMap.Walking,
        Riding: !!window.AMap.Riding
      });
      setLoading(false);
    };
    script.onerror = () => {
      console.error('高德地图API加载失败');
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
      console.log('地图初始化条件未满足:', {
        hasContainer: !!mapContainer.current,
        loading,
        hasAMap: !!window.AMap,
        waypointsCount: waypoints.length
      });
      return;
    }

    console.log('开始初始化地图，途经点:', waypoints);

    try {
      // 创建地图实例
      const mapInstance = new window.AMap.Map(mapContainer.current, {
        zoom: 13,
        center: [waypoints[0].location.lng, waypoints[0].location.lat],
        viewMode: '3D',
        pitch: 50,
        mapStyle: 'amap://styles/normal'
      });

      console.log('地图实例创建成功');
      setMap(mapInstance);

      // 添加标记点
      waypoints.forEach((point, index) => {
        const marker = new window.AMap.Marker({
          position: [point.location.lng, point.location.lat],
          title: point.name,
          label: {
            content: `<div style="background: white; padding: 6px 12px; border-radius: 12px; font-weight: bold; box-shadow: 0 2px 8px rgba(0,0,0,0.15); font-size: 14px;">${index + 1}. ${point.name}</div>`,
            offset: new window.AMap.Pixel(0, -40)
          },
          icon: new window.AMap.Icon({
            size: new window.AMap.Size(32, 32),
            image: `data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='32' height='32'%3E%3Ccircle cx='16' cy='16' r='14' fill='%233B82F6' stroke='white' stroke-width='3'/%3E%3Ctext x='16' y='21' text-anchor='middle' fill='white' font-size='14' font-weight='bold'%3E${index + 1}%3C/text%3E%3C/svg%3E`,
            imageSize: new window.AMap.Size(32, 32)
          })
        });
        mapInstance.add(marker);
        console.log(`添加标记点 ${index + 1}:`, point.name, `[${point.location.lng}, ${point.location.lat}]`);
      });

      // 自适应显示所有标记
      mapInstance.setFitView();
      console.log('地图初始化完成');

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

  // 规划路线
  useEffect(() => {
    if (!map || waypoints.length < 2) return;

    console.log('开始规划路线，出行方式:', travelMode, '途经点数量:', waypoints.length);

    // 清除之前的路线
    if (drivingRef.current) {
      drivingRef.current.clear();
    }

    const points = waypoints.map(p => new window.AMap.LngLat(p.location.lng, p.location.lat));
    console.log('途经点坐标:', points.map(p => `[${p.getLng()}, ${p.getLat()}]`));

    // 根据出行方式选择服务
    let routeService: any;
    if (travelMode === 'driving') {
      routeService = new window.AMap.Driving({
        map: map,
        panel: null,
        hideMarkers: true,
        autoFitView: true,
        policy: window.AMap.DrivingPolicy.LEAST_TIME // 最快路线
      });
    } else if (travelMode === 'walking') {
      routeService = new window.AMap.Walking({
        map: map,
        panel: null,
        hideMarkers: true,
        autoFitView: true
      });
    } else if (travelMode === 'riding') {
      routeService = new window.AMap.Riding({
        map: map,
        panel: null,
        hideMarkers: true,
        autoFitView: true
      });
    }

    drivingRef.current = routeService;

    // 规划路线
    if (points.length === 2) {
      // 两点之间直接规划
      console.log('规划两点路线:', points[0], '→', points[1]);
      routeService.search(points[0], points[1], (status: string, result: any) => {
        console.log('路线规划结果 - 状态:', status, '结果:', result);
        if (status === 'complete') {
          const route = result.routes[0];
          const distance = Math.round(route.distance / 1000 * 10) / 10;
          const duration = Math.round(route.time / 60);
          setRouteInfo({ distance, duration });
          console.log('路线规划成功 - 距离:', distance, 'km, 时间:', duration, '分钟');
        } else {
          console.error('路线规划失败 - 状态:', status, '错误信息:', result);
          setError(`路线规划失败: ${result || '未知错误'}`);
        }
      });
    } else {
      // 多点路线
      const origin = points[0];
      const destination = points[points.length - 1];
      const wayPointsMiddle = points.slice(1, -1);

      console.log('规划多点路线 - 起点:', origin, '终点:', destination, '途经点:', wayPointsMiddle);

      routeService.search(
        origin,
        destination,
        { waypoints: wayPointsMiddle },
        (status: string, result: any) => {
          console.log('多点路线规划结果 - 状态:', status, '结果:', result);
          if (status === 'complete') {
            const route = result.routes[0];
            const distance = Math.round(route.distance / 1000 * 10) / 10;
            const duration = Math.round(route.time / 60);
            setRouteInfo({ distance, duration });
            console.log('多点路线规划成功 - 距离:', distance, 'km, 时间:', duration, '分钟');
          } else {
            console.error('多点路线规划失败 - 状态:', status, '错误信息:', result);
            setError(`路线规划失败: ${result || '未知错误'}`);
          }
        }
      );
    }
  }, [map, waypoints, travelMode]);

  const travelModes = [
    { id: 'driving' as TravelMode, label: '驾车', icon: Car },
    { id: 'walking' as TravelMode, label: '步行', icon: Footprints },
    { id: 'riding' as TravelMode, label: '骑行', icon: Bike }
  ];

  if (loading) {
    return (
      <div className="fixed inset-0 z-[200] bg-black/90 backdrop-blur-sm flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-white text-lg font-medium">加载地图中...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="fixed inset-0 z-[200] bg-black/90 backdrop-blur-sm flex items-center justify-center p-4">
        <div className="bg-white rounded-3xl p-8 max-w-md text-center">
          <NavigationIcon className="w-16 h-16 text-outline mx-auto mb-4" />
          <p className="text-lg text-on-surface font-medium mb-4">{error}</p>
          <button
            onClick={onClose}
            className="bg-primary text-white px-6 py-3 rounded-xl font-bold hover:bg-primary/90 transition-all"
          >
            关闭
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-[200] bg-black/90 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="w-full h-full max-w-7xl max-h-[90vh] relative">
        {/* 地图容器 */}
        <div 
          ref={mapContainer} 
          className="w-full h-full rounded-3xl overflow-hidden shadow-2xl"
        />
        
        {/* 关闭按钮 */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 w-12 h-12 bg-white rounded-xl shadow-lg flex items-center justify-center hover:bg-red-500 hover:text-white transition-all"
        >
          <X className="w-6 h-6" />
        </button>

        {/* 出行方式切换 */}
        <div className="absolute top-4 left-4 bg-white rounded-2xl shadow-lg p-2 flex gap-2">
          {travelModes.map(mode => {
            const Icon = mode.icon;
            return (
              <button
                key={mode.id}
                onClick={() => setTravelMode(mode.id)}
                className={`px-4 py-2 rounded-xl font-bold text-sm flex items-center gap-2 transition-all ${
                  travelMode === mode.id
                    ? 'bg-primary text-white'
                    : 'bg-gray-100 text-on-surface-variant hover:bg-gray-200'
                }`}
              >
                <Icon className="w-4 h-4" />
                {mode.label}
              </button>
            );
          })}
        </div>
        
        {/* 路线信息 */}
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
  );
};

export default InteractiveRouteMap;
