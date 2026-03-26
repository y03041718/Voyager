import React, { useState } from 'react';
import { 
  Calendar, MapPin, Clock, MoreVertical, Share2, Printer, 
  Download, ChevronRight, Cloud, Thermometer, Navigation,
  Home, Star, Info, ExternalLink, ArrowLeft, Users2, Check
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useSelection } from '../SelectionContext';
import { useTeams } from '../TeamContext';
import { useNavigate } from 'react-router-dom';

const Itinerary: React.FC = () => {
  const navigate = useNavigate();
  const { selectedDestinations, tripDetails, generatedPlan } = useSelection();
  const { teams, sharePlan } = useTeams();
  const [showShareModal, setShowShareModal] = useState(false);
  const [sharedTeamId, setSharedTeamId] = useState<string | null>(null);
  const [selectedDay, setSelectedDay] = useState(1);

  const handleShare = (teamId: string) => {
    // In a real app, we'd have a plan ID. For now, we'll use a mock one.
    sharePlan('current-trip', teamId, '我');
    setSharedTeamId(teamId);
    setTimeout(() => {
      setShowShareModal(false);
      setSharedTeamId(null);
    }, 1500);
  };

  if (!generatedPlan || selectedDestinations.length === 0) {
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
  const currentDayPlan = generatedPlan.dayPlans.find(d => d.day === selectedDay) || generatedPlan.dayPlans[0];
  
  // Group destinations by type for the sidebar
  const hotels = selectedDestinations.filter(d => d.type === 'hotel');
  const weather = generatedPlan.weather;

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
              {generatedPlan.title}
            </h1>
            <div className="flex flex-wrap items-center gap-6 text-on-surface-variant text-sm font-bold">
              <span className="flex items-center gap-2 bg-white px-4 py-2 rounded-full shadow-sm">
                <Calendar className="w-4 h-4 text-primary" /> 
                {generatedPlan.dateRange}
              </span>
              <span className="flex items-center gap-2 bg-white px-4 py-2 rounded-full shadow-sm">
                <Users className="w-4 h-4 text-primary" /> {generatedPlan.travelers}
              </span>
              <span className="flex items-center gap-2 bg-white px-4 py-2 rounded-full shadow-sm">
                <Compass className="w-4 h-4 text-primary" /> {generatedPlan.style}
              </span>
            </div>
          </div>
          
          <div className="flex gap-3">
            <button 
              onClick={() => setShowShareModal(true)}
              className="w-14 h-14 bg-white rounded-2xl flex items-center justify-center text-on-surface shadow-sm hover:shadow-md transition-all"
            >
              <Share2 className="w-6 h-6" />
            </button>
            <button className="w-14 h-14 bg-white rounded-2xl flex items-center justify-center text-on-surface shadow-sm hover:shadow-md transition-all">
              <Printer className="w-6 h-6" />
            </button>
            <button className="bg-on-surface text-white px-8 h-14 rounded-2xl font-black flex items-center gap-3 hover:bg-primary transition-all shadow-lg">
              <Download className="w-5 h-5" /> 导出 PDF
            </button>
          </div>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
          {/* Main Timeline - Left Column */}
          <div className="lg:col-span-8">
            <div className="flex items-center justify-between mb-12">
              <h2 className="text-3xl font-black tracking-tighter">每日行程安排</h2>
              <div className="flex gap-2">
                {generatedPlan.dayPlans.map(dayPlan => (
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

            <div className="relative space-y-16">
              {/* Vertical Line */}
              <div className="absolute left-8 top-0 bottom-0 w-px bg-gray-200" />

              {currentDayPlan.activities.map((activity, idx) => (
                <motion.div 
                  key={activity.id + idx}
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
                      {activity.time}
                    </span>
                    <span className="px-3 py-1 bg-primary/10 text-primary text-[10px] font-black rounded-full uppercase tracking-widest">
                      {activity.type === 'hotel' ? '住宿' : activity.type === 'attraction' ? '景点' : '美食'}
                    </span>
                  </div>

                  {/* Editorial Card */}
                  <div className="group">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
                      <div className="order-2 md:order-1">
                        <h3 className="text-4xl font-black tracking-tighter mb-4 group-hover:text-primary transition-colors">
                          {activity.title}
                        </h3>
                        <p className="text-on-surface-variant leading-relaxed mb-6 font-medium">
                          {activity.description}
                        </p>
                        <div className="flex items-center gap-6 mb-4">
                          <div className="flex items-center gap-1">
                            <Star className="w-4 h-4 text-yellow-500 fill-yellow-500" />
                            <span className="text-sm font-black">{activity.rating.toFixed(1)}</span>
                          </div>
                          {activity.duration && (
                            <div className="flex items-center gap-1 text-on-surface-variant">
                              <Clock className="w-4 h-4" />
                              <span className="text-sm font-bold">{activity.duration}</span>
                            </div>
                          )}
                        </div>
                        {activity.tip && (
                          <div className="bg-primary/5 border-l-4 border-primary p-4 rounded-r-xl">
                            <p className="text-sm text-on-surface-variant font-medium">💡 {activity.tip}</p>
                          </div>
                        )}
                      </div>
                      <div className="order-1 md:order-2 relative">
                        <div className="aspect-[4/5] rounded-[2.5rem] overflow-hidden shadow-2xl transform group-hover:scale-[1.02] transition-transform duration-700">
                          <img 
                            src={activity.image} 
                            alt={activity.title}
                            className="w-full h-full object-cover"
                            referrerPolicy="no-referrer"
                          />
                        </div>
                        {activity.duration && (
                          <div className="absolute -bottom-4 -right-4 bg-white p-4 rounded-2xl shadow-xl flex items-center gap-3">
                            <div className="w-10 h-10 bg-primary/10 rounded-xl flex items-center justify-center text-primary">
                              <Info className="w-5 h-5" />
                            </div>
                            <div>
                              <p className="text-[10px] font-black text-outline uppercase tracking-widest">建议时长</p>
                              <p className="text-sm font-black">{activity.duration}</p>
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
            {/* Map Card */}
            <div className="bg-white rounded-[2.5rem] p-8 shadow-sm border border-gray-100">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-black tracking-tight">路线地图</h3>
                <Navigation className="w-5 h-5 text-primary" />
              </div>
              <div className="aspect-square bg-surface-variant rounded-3xl mb-6 overflow-hidden relative group">
                <img 
                  src="https://picsum.photos/seed/map/400/400" 
                  alt="Map" 
                  className="w-full h-full object-cover opacity-80 group-hover:scale-110 transition-transform duration-700"
                  referrerPolicy="no-referrer"
                />
                <div className="absolute inset-0 flex items-center justify-center">
                  <button className="bg-white text-on-surface px-6 py-3 rounded-2xl font-black shadow-xl flex items-center gap-2 hover:bg-primary hover:text-white transition-all">
                    查看完整地图 <ExternalLink className="w-4 h-4" />
                  </button>
                </div>
              </div>
              <div className="space-y-4">
                <div className="flex items-center gap-3 text-sm font-bold text-on-surface-variant">
                  <div className="w-2 h-2 bg-primary rounded-full" />
                  <span>总行程距离: 12.4 km</span>
                </div>
                <div className="flex items-center gap-3 text-sm font-bold text-on-surface-variant">
                  <div className="w-2 h-2 bg-primary rounded-full" />
                  <span>预计交通时间: 45 分钟</span>
                </div>
              </div>
            </div>

            {/* Weather Card */}
            <div className="bg-on-surface rounded-[2.5rem] p-8 text-white shadow-xl">
              <div className="flex items-center justify-between mb-8">
                <h3 className="text-xl font-black tracking-tight">当地天气</h3>
                <Cloud className="w-6 h-6 text-primary" />
              </div>
              <div className="flex items-center gap-6 mb-8">
                <span className="text-6xl font-black tracking-tighter">24°</span>
                <div>
                  <p className="text-lg font-bold">晴朗</p>
                  <p className="text-white/60 text-sm font-medium">体感温度 26°</p>
                </div>
              </div>
              <div className="grid grid-cols-4 gap-2">
                {['周一', '周二', '周三', '周四'].map((day, i) => (
                  <div key={i} className="text-center p-2 rounded-xl bg-white/10">
                    <p className="text-[10px] font-bold opacity-60 mb-1">{day}</p>
                    <Thermometer className="w-4 h-4 mx-auto mb-1 text-primary" />
                    <p className="text-xs font-black">22°</p>
                  </div>
                ))}
              </div>
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
                    <p className="text-sm text-on-surface-variant font-medium mb-4">{hotel.location}</p>
                    <button className="w-full py-3 bg-surface-variant rounded-xl font-black text-sm hover:bg-primary/10 hover:text-primary transition-all">
                      查看订单详情
                    </button>
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

              <div className="space-y-3 mb-8">
                {teams.length === 0 ? (
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
                  teams.map((team) => (
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
                          <p className="text-[10px] text-outline font-bold uppercase tracking-widest">{team.members.length} 位成员</p>
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
    </div>
  );
};

const SparkleIcon = ({ className }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M12 3L14.5 9.5L21 12L14.5 14.5L12 21L9.5 14.5L3 12L9.5 9.5L12 3Z" fill="currentColor" />
  </svg>
);

const Users = ({ className }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M22 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" />
  </svg>
);

const Compass = ({ className }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="10" /><polygon points="16.24 7.76 14.12 14.12 7.76 16.24 9.88 9.88 16.24 7.76" />
  </svg>
);

export default Itinerary;
