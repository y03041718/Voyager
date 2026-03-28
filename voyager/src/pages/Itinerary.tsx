import React, { useState, useEffect } from 'react';
import { 
  Calendar, Clock, Share2, Printer, 
  Download, ChevronRight, Cloud, Navigation,
  Home, Star, Info, ExternalLink, ArrowLeft, Users2, Check,
  ChevronDown, Sparkles, UtensilsCrossed, Lightbulb, Compass, Users
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useSelection } from '../SelectionContext';
import { useNavigate, useParams } from 'react-router-dom';
import { apiService } from '../services/api';
import { TravelPlanResponse } from '../types';
import StaticRouteMap from '../components/StaticRouteMap';
import InteractiveRouteMap from '../components/InteractiveRouteMap';

const Itinerary: React.FC = () => {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const { selectedDestinations, tripDetails, generatedPlan, setGeneratedPlan } = useSelection();
  const [showShareModal, setShowShareModal] = useState(false);
  const [sharedTeamId, setSharedTeamId] = useState<number | null>(null);
  const [selectedDay, setSelectedDay] = useState(1);
  const [showLocalTips, setShowLocalTips] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loadedPlan, setLoadedPlan] = useState<TravelPlanResponse | null>(null);
  const [showInteractiveMap, setShowInteractiveMap] = useState(false);
  const [currentTripId, setCurrentTripId] = useState<number | null>(null);
  const [shareError, setShareError] = useState<string | null>(null);
  const [myTeams, setMyTeams] = useState<any[]>([]);
  const [loadingTeams, setLoadingTeams] = useState(false);

  // 如果有 ID 参数，从 API 加载计划
  useEffect(() => {
    if (id) {
      loadPlanFromApi(parseInt(id));
    }
  }, [id]);

  const loadPlanFromApi = async (planId: number) => {
    try {
      setLoading(true);
      setError(null);
      const response = await apiService.getTripPlanDetail(planId);
      
      // 后端返回的 response.planData 是 JSON 字符串，需要解析
      const planData: TravelPlanResponse = JSON.parse(response.planData);
      
      setLoadedPlan(planData);
      setGeneratedPlan(planData); // 同时更新 context
      setCurrentTripId(planId); // 保存行程ID
      
      console.log('✅ 成功加载保存的行程:', planData);
    } catch (err) {
      console.error('❌ 加载旅行计划失败:', err);
      setError(err instanceof Error ? err.message : '加载失败');
    } finally {
      setLoading(false);
    }
  };

  const handleShare = async (teamId: number) => {
    // 检查是否有行程ID
    if (!currentTripId) {
      setShareError('无法分享：行程未保存');
      return;
    }

    try {
      setShareError(null);
      await apiService.shareTripPlan(currentTripId, teamId);
      setSharedTeamId(teamId);
      
      // 1.5秒后关闭模态框
      setTimeout(() => {
        setShowShareModal(false);
        setSharedTeamId(null);
      }, 1500);
    } catch (err) {
      console.error('分享行程失败:', err);
      setShareError(err instanceof Error ? err.message : '分享失败');
      // 3秒后清除错误
      setTimeout(() => {
        setShareError(null);
      }, 3000);
    }
  };

  // 加载用户的团队列表
  const loadTeams = async () => {
    try {
      setLoadingTeams(true);
      const teams = await apiService.getTeams();
      setMyTeams(teams);
    } catch (err) {
      console.error('加载团队列表失败:', err);
    } finally {
      setLoadingTeams(false);
    }
  };

  // 打开分享模态框时加载团队
  const handleOpenShareModal = () => {
    setShowShareModal(true);
    loadTeams();
  };

  // 打印处理函数
  const handlePrint = () => {
    window.print();
  };

  // 使用加载的计划或 context 中的计划
  const currentPlan = loadedPlan || generatedPlan;

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-4">
        <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin mb-4"></div>
        <p className="text-on-surface-variant font-medium">加载行程中...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-4 text-center">
        <div className="w-24 h-24 bg-red-50 rounded-full flex items-center justify-center mb-6">
          <Calendar className="w-12 h-12 text-red-500" />
        </div>
        <h2 className="text-3xl font-black tracking-tighter text-on-surface mb-2">加载失败</h2>
        <p className="text-on-surface-variant mb-8 max-w-md">{error}</p>
        <button 
          onClick={() => navigate('/my-guides')}
          className="bg-primary text-white px-8 py-4 rounded-2xl font-black shadow-xl shadow-primary/20 hover:scale-105 transition-all flex items-center gap-2"
        >
          <ArrowLeft className="w-5 h-5" /> 返回我的行程
        </button>
      </div>
    );
  }

  if (!currentPlan || (!id && selectedDestinations.length === 0)) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-4 text-center">
        <div className="w-24 h-24 bg-surface-variant rounded-full flex items-center justify-center mb-6 text-on-surface-variant">
          <Calendar className="w-12 h-12" />
        </div>
        <h2 className="text-3xl font-black tracking-tighter text-on-surface mb-2">暂无行程</h2>
        <p className="text-on-surface-variant mb-8 max-w-md">您还没有生成旅行计划。请先去探索页面挑选您心仪的景点、酒店或餐厅，然后生成行程。</p>
        <button 
          onClick={() => navigate('/')}
          className="bg-primary text-white px-8 py-4 rounded-2xl font-black shadow-xl shadow-primary/20 hover:scale-105 transition-all flex items-center gap-2"
        >
          <ArrowLeft className="w-5 h-5" /> 返回探索
        </button>
      </div>
    );
  }

  // 获取当前选中天的行程
  const currentDayPlan = currentPlan.days.find(d => d.day === selectedDay) || currentPlan.days[0];
  
  // 过滤掉酒店类型的计划（酒店在右侧单独展示）
  const filteredPlans = currentDayPlan?.plans?.filter(plan => plan.type !== 'hotel') || [];
  
  // Group destinations by type for the sidebar
  const hotels = selectedDestinations.filter(d => d.type === 'hotel');
  
  // 获取当前天的天气信息（从AI生成的数据中）
  const weatherInfo = currentDayPlan?.weather || null;
  
  // 获取当前天的当地特色与提示（从顶层获取，整个行程共用）
  const localTips = generatedPlan?.localTips || null;
  
  // 构建标题和日期范围 - 优先使用AI生成的title，其次使用destination
  const tripTitle = generatedPlan.title || generatedPlan.destination || selectedDestinations[0]?.address?.match(/(.+?[市区县])/)?.[1] || '旅行计划';
  const dateRange = tripDetails.startDate && tripDetails.endDate 
    ? `${tripDetails.startDate} - ${tripDetails.endDate}` 
    : '未设置日期';
  
  console.log('当前选中天:', selectedDay);
  console.log('当前天计划:', currentDayPlan);
  console.log('过滤后的计划数量:', filteredPlans.length);

  // 构建路线地图的途经点
  const mapWaypoints = filteredPlans
    .filter(plan => plan.location)
    .map(plan => ({
      name: plan.name,
      location: plan.location!
    }));

  console.log('=== 路线地图调试信息 ===');
  console.log('当前天的所有计划:', filteredPlans);
  console.log('第一个计划的详细信息:', filteredPlans[0]);
  console.log('第一个计划是否有location字段:', filteredPlans[0]?.location);
  console.log('有位置信息的计划:', mapWaypoints);
  console.log('位置信息数量:', mapWaypoints.length);

  return (
    <div className="bg-[#f8f9fa] min-h-screen">
      <div className="max-w-7xl mx-auto px-4 py-12">
        {/* Header Section */}
        <header className="mb-16 flex flex-col md:flex-row md:items-end justify-between gap-8">
          <div className="max-w-2xl">
            <div className="flex items-center gap-2 text-primary text-xs font-black uppercase tracking-[0.2em] mb-4">
              <SparkleIcon className="w-4 h-4" />
              <span>AI 智能生成行程</span>
            </div>
            <h1 className="text-5xl md:text-7xl font-black tracking-tighter text-on-surface mb-6 leading-[0.9]">
              {tripTitle}
            </h1>
            <div className="flex flex-wrap items-center gap-6 text-on-surface-variant text-sm font-bold">
              <span className="flex items-center gap-2 bg-white px-4 py-2 rounded-full shadow-sm">
                <Calendar className="w-4 h-4 text-primary" /> 
                {dateRange}
              </span>
              <span className="flex items-center gap-2 bg-white px-4 py-2 rounded-full shadow-sm">
                <Users className="w-4 h-4 text-primary" /> {tripDetails.travelers}
              </span>
              <span className="flex items-center gap-2 bg-white px-4 py-2 rounded-full shadow-sm">
                <Compass className="w-4 h-4 text-primary" /> {tripDetails.style}
              </span>
            </div>
          </div>
          
          <div className="flex gap-3 no-print">
            {currentTripId && (
              <button 
                onClick={handleOpenShareModal}
                className="w-14 h-14 bg-white rounded-2xl flex items-center justify-center text-on-surface shadow-sm hover:shadow-md transition-all"
                title="分享到团队"
              >
                <Share2 className="w-6 h-6" />
              </button>
            )}
            <button 
              onClick={handlePrint}
              className="bg-on-surface text-white px-8 h-14 rounded-2xl font-black flex items-center gap-3 hover:bg-primary transition-all shadow-lg"
            >
              <Printer className="w-6 h-6" /> 打印/导出PDF
            </button>
          </div>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
          {/* Main Timeline - Left Column */}
          <div className="lg:col-span-8">
            <div className="flex items-center justify-between mb-12">
              <h2 className="text-3xl font-black tracking-tighter">每日行程安排</h2>
              <div className="flex gap-2 no-print">
                {generatedPlan.days.map(dayPlan => (
                  <button 
                    key={dayPlan.day} 
                    onClick={() => setSelectedDay(dayPlan.day)}
                    className={`px-6 py-2 rounded-xl font-black text-sm transition-all ${
                      selectedDay === dayPlan.day ? 'bg-primary text-white' : 'bg-white text-on-surface-variant'
                    }`}
                  >
                    Day {dayPlan.day}
                  </button>
                ))}
              </div>
            </div>

            {/* 打印时显示所有天数，屏幕上只显示选中的天 */}
            <div className="relative space-y-16">
              {/* Vertical Line */}
              <div className="absolute left-8 top-0 bottom-0 w-px bg-gray-200" />

              {filteredPlans.map((plan, idx) => (
                <motion.div 
                  key={plan.id || idx}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: idx * 0.1 }}
                  className="relative pl-24"
                >
                  {/* Timeline Node */}
                  <div className="absolute left-6 top-0 w-5 h-5 bg-white border-4 border-primary rounded-full z-10 shadow-sm" />
                  
                  {/* Time & Category */}
                  <div className="flex items-center gap-3 mb-6">
                    <span className="text-sm font-black text-primary tracking-widest uppercase">
                      {plan.time}
                    </span>
                    <span className="px-3 py-1 bg-primary/10 text-primary text-[10px] font-black rounded-full uppercase tracking-widest">
                      {plan.type === 'hotel' ? '住宿' : plan.type === 'attraction' ? '景点' : '美食'}
                    </span>
                  </div>

                  {/* Editorial Card */}
                  <div className="group">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
                      <div className="order-2 md:order-1">
                        <h3 className="text-4xl font-black tracking-tighter mb-4 group-hover:text-primary transition-colors">
                          {plan.name}
                        </h3>
                        <p className="text-on-surface-variant leading-relaxed mb-6 font-medium">
                          {plan.desc}
                        </p>
                        <div className="flex items-center gap-6 mb-4">
                          {plan.rating && (
                            <div className="flex items-center gap-1">
                              <Star className="w-4 h-4 text-yellow-500 fill-yellow-500" />
                              <span className="text-sm font-black">{plan.rating.toFixed(1)}</span>
                            </div>
                          )}
                          {plan.duration && (
                            <div className="flex items-center gap-1 text-on-surface-variant">
                              <Clock className="w-4 h-4" />
                              <span className="text-sm font-bold">{plan.duration}</span>
                            </div>
                          )}
                        </div>
                        {plan.address && (
                          <div className="bg-primary/5 border-l-4 border-primary p-4 rounded-r-xl mb-4">
                            <p className="text-sm text-on-surface-variant font-medium">� {plan.address}</p>
                          </div>
                        )}
                      </div>
                      <div className="order-1 md:order-2 relative">
                        <div className="aspect-[4/5] rounded-[2.5rem] overflow-hidden shadow-2xl transform group-hover:scale-[1.02] transition-transform duration-700">
                          <img 
                            src={plan.image || `https://picsum.photos/seed/${plan.name}/800/600`}
                            alt={plan.name}
                            className="w-full h-full object-cover"
                            referrerPolicy="no-referrer"
                          />
                        </div>
                        {plan.duration && (
                          <div className="absolute -bottom-4 -right-4 bg-white p-4 rounded-2xl shadow-xl flex items-center gap-3">
                            <div className="w-10 h-10 bg-primary/10 rounded-xl flex items-center justify-center text-primary">
                              <Info className="w-5 h-5" />
                            </div>
                            <div>
                              <p className="text-[10px] font-black text-outline uppercase tracking-widest">建议时长</p>
                              <p className="text-sm font-black">{plan.duration}</p>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>


          {/* Sidebar Tools - Right Column */}
          <div className="lg:col-span-4 space-y-8">
            {/* Local Tips - 当地特色与提示 */}
            {localTips && (
                <div className="mb-12 bg-white rounded-[2.5rem] p-8 shadow-sm border border-gray-100">
                  <button
                      onClick={() => setShowLocalTips(!showLocalTips)}
                      className="w-full flex items-center justify-between mb-4"
                  >
                    <div className="flex items-center gap-3">
                      <h3 className="text-xl font-black tracking-tight text-on-surface">行前必读</h3>
                    </div>
                    {showLocalTips ? (
                          <Sparkles className="w-6 h-6" />
                    ) : (
                        <ChevronDown className="w-6 h-6 bg-primary/10 rounded-2xl flex items-center justify-center text-primary" />
                    )}
                  </button>

                  {showLocalTips && (
                      <motion.div
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: 'auto' }}
                          exit={{ opacity: 0, height: 0 }}
                          className="space-y-4 pt-4"
                      >
                        <div className="flex items-start gap-4 p-4 bg-blue-50 rounded-2xl">
                          <div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center flex-shrink-0">
                            <Sparkles className="w-5 h-5 text-blue-600" />
                          </div>
                          <div>
                            <h4 className="font-black text-on-surface mb-1">风土人情</h4>
                            <p className="text-sm text-on-surface-variant font-medium">{localTips.culture}</p>
                          </div>
                        </div>

                        <div className="flex items-start gap-4 p-4 bg-orange-50 rounded-2xl">
                          <div className="w-10 h-10 bg-orange-100 rounded-xl flex items-center justify-center flex-shrink-0">
                            <UtensilsCrossed className="w-5 h-5 text-orange-600" />
                          </div>
                          <div>
                            <h4 className="font-black text-on-surface mb-1">舌尖推荐</h4>
                            <p className="text-sm text-on-surface-variant font-medium">{localTips.food}</p>
                          </div>
                        </div>

                        <div className="flex items-start gap-4 p-4 bg-green-50 rounded-2xl">
                          <div className="w-10 h-10 bg-green-100 rounded-xl flex items-center justify-center flex-shrink-0">
                            <Lightbulb className="w-5 h-5 text-green-600" />
                          </div>
                          <div>
                            <h4 className="font-black text-on-surface mb-1">实用提示</h4>
                            <p className="text-sm text-on-surface-variant font-medium">{localTips.tips}</p>
                          </div>
                        </div>
                      </motion.div>
                  )}
                </div>
            )}

            {/* Map Card */}
            <div className="bg-white rounded-[2.5rem] p-8 shadow-sm border border-gray-100">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-black tracking-tight">路线地图</h3>
                <Navigation className="w-5 h-5 text-primary" />
              </div>
              
              <StaticRouteMap 
                waypoints={mapWaypoints} 
                onFullscreenClick={() => setShowInteractiveMap(true)}
              />
            </div>

            {/* Weather Card */}
            <div className="bg-on-surface rounded-[2.5rem] p-8 text-white shadow-xl">
              <div className="flex items-center justify-between mb-8">
                <h3 className="text-xl font-black tracking-tight">当地天气</h3>
                <Cloud className="w-6 h-6 text-primary" />
              </div>
              {weatherInfo ? (
                <div className="flex items-center gap-6">
                  <span className="text-6xl font-black tracking-tighter">{weatherInfo.temperature}°</span>
                  <div>
                    <p className="text-lg font-bold">{weatherInfo.condition}</p>
                    <p className="text-white/60 text-sm font-medium">体感温度 {weatherInfo.feelsLike}°</p>
                  </div>
                </div>
              ) : (
                <div className="flex items-center gap-6">
                  <span className="text-6xl font-black tracking-tighter">24°</span>
                  <div>
                    <p className="text-lg font-bold">晴朗</p>
                    <p className="text-white/60 text-sm font-medium">体感温度 26°</p>
                  </div>
                </div>
              )}
            </div>

            {/* Accommodation Card */}
            {hotels.length > 0 && (
              <div className="bg-white rounded-[2.5rem] p-8 shadow-sm border border-gray-100">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-xl font-black tracking-tight">住宿安排</h3>
                  <Home className="w-5 h-5 text-primary" />
                </div>
                {hotels.map(hotel => (
                  <div key={hotel.id} className="group cursor-pointer">
                    <div className="aspect-video rounded-2xl overflow-hidden mb-4">
                      <img 
                        src={hotel.image} 
                        alt={hotel.name}
                        className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                        referrerPolicy="no-referrer"
                      />
                    </div>
                    <h4 className="font-black text-lg mb-1 group-hover:text-primary transition-colors">{hotel.name}</h4>
                    <p className="text-sm text-on-surface-variant font-medium mb-4">{hotel.address || '地址未知'}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Share Modal */}
      <AnimatePresence>
        {showShareModal && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
            <motion.div 
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="bg-white rounded-[2.5rem] p-8 w-full max-w-md shadow-2xl"
            >
              <div className="flex items-center justify-between mb-8">
                <h3 className="text-2xl font-black text-on-surface">分享行程</h3>
                <button 
                  onClick={() => setShowShareModal(false)}
                  className="p-2 hover:bg-surface-variant rounded-full transition-all"
                >
                  <ArrowLeft className="w-5 h-5" />
                </button>
              </div>

              <p className="text-on-surface-variant text-sm font-medium mb-6">选择一个团队分享您的精彩计划：</p>

              {shareError && (
                <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-2xl">
                  <p className="text-red-600 text-sm font-medium">{shareError}</p>
                </div>
              )}

              <div className="space-y-3 mb-8">
                {loadingTeams ? (
                  <div className="text-center py-8">
                    <div className="inline-block w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin mb-2"></div>
                    <p className="text-sm text-outline font-bold">加载团队中...</p>
                  </div>
                ) : myTeams.length === 0 ? (
                  <div className="text-center py-8 bg-surface-variant/30 rounded-2xl">
                    <Users2 className="w-10 h-10 text-outline mx-auto mb-2" />
                    <p className="text-sm text-outline font-bold">暂无团队</p>
                    <button 
                      onClick={() => navigate('/profile')}
                      className="text-primary text-xs font-black mt-2"
                    >
                      去创建团队
                    </button>
                  </div>
                ) : (
                  myTeams.map((team) => (
                    <button 
                      key={team.id}
                      onClick={() => handleShare(team.id)}
                      disabled={sharedTeamId === team.id}
                      className={`w-full p-4 rounded-2xl border-2 transition-all flex items-center justify-between group ${
                        sharedTeamId === team.id 
                          ? 'border-green-500 bg-green-50' 
                          : 'border-transparent bg-surface-variant/50 hover:border-primary/30'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center text-primary shadow-sm">
                          <Users2 className="w-5 h-5" />
                        </div>
                        <div className="text-left">
                          <p className="font-black text-on-surface">{team.name}</p>
                          <p className="text-[10px] text-outline font-bold uppercase tracking-widest">{team.members?.length || 0} 位成员</p>
                        </div>
                      </div>
                      {sharedTeamId === team.id ? (
                        <Check className="w-5 h-5 text-green-500" />
                      ) : (
                        <ChevronRight className="w-5 h-5 text-outline group-hover:text-primary transition-all" />
                      )}
                    </button>
                  ))
                )}
              </div>

              <div className="grid grid-cols-4 gap-4">
                {['微信', '朋友圈', '微博', '复制链接'].map((platform) => (
                  <button key={platform} className="flex flex-col items-center gap-2">
                    <div className="w-12 h-12 bg-surface-variant rounded-2xl flex items-center justify-center text-on-surface-variant hover:bg-primary/10 hover:text-primary transition-all">
                      <Share2 className="w-5 h-5" />
                    </div>
                    <span className="text-[10px] font-bold text-outline">{platform}</span>
                  </button>
                ))}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* 交互式地图模态框 */}
      {showInteractiveMap && (
        <InteractiveRouteMap 
          waypoints={mapWaypoints}
          onClose={() => setShowInteractiveMap(false)}
        />
      )}
    </div>
  );
};

const SparkleIcon = ({ className }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M12 3L14.5 9.5L21 12L14.5 14.5L12 21L9.5 14.5L3 12L9.5 9.5L12 3Z" fill="currentColor" />
  </svg>
);



export default Itinerary;
