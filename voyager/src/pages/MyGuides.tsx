import React, { useEffect, useState } from 'react';
import { Plus, Search, MapPin, Calendar, Users, MoreHorizontal, ArrowRight, Share2, Users2, Trash2 } from 'lucide-react';
import { motion } from 'motion/react';
import { useTeams } from '../TeamContext';
import { apiService } from '../services/api';
import { TripPlanSummary } from '../types';
import { useNavigate } from 'react-router-dom';

const MyGuides: React.FC = () => {
  const { sharedPlans, teams } = useTeams();
  const navigate = useNavigate();
  const [myPlans, setMyPlans] = useState<TripPlanSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'my' | 'shared'>('all');

  useEffect(() => {
    loadTripPlans();
  }, [filter]);

  const loadTripPlans = async () => {
    try {
      setLoading(true);
      let plans: TripPlanSummary[];
      
      if (filter === 'my') {
        plans = await apiService.getMyTripPlans();
      } else if (filter === 'shared') {
        plans = await apiService.getVisibleTripPlans();
        plans = plans.filter(p => !p.isOwner);
      } else {
        plans = await apiService.getVisibleTripPlans();
      }
      
      setMyPlans(plans);
    } catch (error) {
      console.error('加载行程列表失败:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDeletePlan = async (id: number) => {
    if (!confirm('确定要删除这个行程吗？')) {
      return;
    }

    try {
      await apiService.deleteTripPlan(id);
      loadTripPlans();
    } catch (error) {
      console.error('删除行程失败:', error);
      alert('删除失败，请重试');
    }
  };

  const handleViewPlan = (id: number) => {
    // 导航到行程详情页面，传递行程ID
    navigate(`/itinerary/${id}`);
  };

  const getStatusLabel = (startDate: string, endDate: string) => {
    const now = new Date();
    const start = new Date(startDate);
    const end = new Date(endDate);

    if (now < start) {
      return { label: '即将开始', color: 'bg-primary/80' };
    } else if (now > end) {
      return { label: '已完成', color: 'bg-green-500/80' };
    } else {
      return { label: '进行中', color: 'bg-orange-500/80' };
    }
  };

  return (
    <div className="pb-24 pt-6 md:pt-24 px-4 max-w-7xl mx-auto">
      {/* Header */}
      <header className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-black tracking-tight text-on-surface mb-1">我的行程</h1>
          <p className="text-on-surface-variant text-sm font-medium">管理您的所有旅行计划</p>
        </div>
        <button 
          onClick={() => navigate('/explore')}
          className="w-12 h-12 bg-primary rounded-2xl flex items-center justify-center text-white shadow-lg shadow-primary/20 hover:scale-110 transition-all"
        >
          <Plus className="w-6 h-6" />
        </button>
      </header>

      {/* Filters */}
      <div className="flex gap-2 overflow-x-auto no-scrollbar pb-2 mb-10">
        {[
          { key: 'all', label: '全部' },
          { key: 'my', label: '我的行程' },
          { key: 'shared', label: '团队共享' }
        ].map((f) => (
          <button
            key={f.key}
            onClick={() => setFilter(f.key as any)}
            className={`px-6 py-2 rounded-xl whitespace-nowrap text-sm font-bold transition-all ${
              filter === f.key ? 'bg-primary text-white shadow-lg shadow-primary/20' : 'bg-surface-variant text-on-surface-variant hover:bg-primary/10'
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      {/* Loading State */}
      {loading && (
        <div className="text-center py-12">
          <div className="inline-block w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
          <p className="mt-4 text-on-surface-variant">加载中...</p>
        </div>
      )}

      {/* Empty State */}
      {!loading && myPlans.length === 0 && (
        <div className="text-center py-12">
          <div className="w-24 h-24 bg-surface-variant rounded-full flex items-center justify-center mx-auto mb-4">
            <MapPin className="w-12 h-12 text-outline" />
          </div>
          <h3 className="text-xl font-black text-on-surface mb-2">还没有行程</h3>
          <p className="text-on-surface-variant mb-6">开始规划您的第一次旅行吧</p>
          <button 
            onClick={() => navigate('/explore')}
            className="px-6 py-3 bg-primary text-white rounded-xl font-bold hover:scale-105 transition-all"
          >
            开始规划
          </button>
        </div>
      )}

      {/* Trip Grid */}
      {!loading && myPlans.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {myPlans.map((plan, i) => {
            const status = getStatusLabel(plan.startDate, plan.endDate);
            
            return (
              <motion.div
                key={plan.id}
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: i * 0.1 }}
                className="group bg-white rounded-[2rem] overflow-hidden shadow-sm hover:shadow-2xl transition-all border border-gray-100 flex flex-col"
              >
                <div className="relative h-64 overflow-hidden">
                  <img
                    src={plan.coverImage || 'https://picsum.photos/seed/' + plan.id + '/800/600'}
                    alt={plan.title || plan.destination}
                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-1000"
                    referrerPolicy="no-referrer"
                  />
                  <div className="absolute top-4 left-4">
                    <span className={`px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest backdrop-blur-md shadow-lg text-white ${status.color}`}>
                      {status.label}
                    </span>
                  </div>
                  {plan.isOwner && (
                    <button 
                      onClick={() => handleDeletePlan(plan.id)}
                      className="absolute top-4 right-4 w-10 h-10 bg-white/20 backdrop-blur-md rounded-full flex items-center justify-center text-white hover:bg-red-500 hover:text-white transition-all"
                    >
                      <Trash2 className="w-5 h-5" />
                    </button>
                  )}
                  {!plan.isOwner && (
                    <div className="absolute top-4 right-4">
                      <span className="px-3 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest backdrop-blur-md shadow-lg bg-blue-500/80 text-white">
                        团队共享
                      </span>
                    </div>
                  )}
                  <div className="absolute bottom-0 left-0 right-0 p-6 bg-gradient-to-t from-black/80 via-black/40 to-transparent">
                    <h3 className="text-xl font-black text-white leading-tight mb-2">
                      {plan.title || `${plan.destination}之旅`}
                    </h3>
                    <div className="flex items-center gap-4 text-white/80 text-xs font-bold uppercase tracking-wider">
                      <span className="flex items-center gap-1">
                        <Calendar className="w-3 h-3" /> {plan.startDate} ~ {plan.endDate}
                      </span>
                    </div>
                  </div>
                </div>
                <div className="p-6 flex-1 flex flex-col justify-between">
                  <div className="space-y-4 mb-6">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-outline font-bold uppercase tracking-widest text-[10px]">目的地</span>
                      <span className="text-on-surface font-black">{plan.destination}</span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-outline font-bold uppercase tracking-widest text-[10px]">旅行风格</span>
                      <span className="text-on-surface font-black">{plan.style}</span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-outline font-bold uppercase tracking-widest text-[10px]">出行人数</span>
                      <span className="text-on-surface font-black">{plan.travelers}</span>
                    </div>
                  </div>
                  <button 
                    onClick={() => handleViewPlan(plan.id)}
                    className="w-full py-4 bg-surface-variant rounded-2xl text-primary font-black text-sm flex items-center justify-center gap-2 hover:bg-primary hover:text-white transition-all group/btn"
                  >
                    查看详细行程 <ArrowRight className="w-4 h-4 group-hover/btn:translate-x-1 transition-transform" />
                  </button>
                </div>
              </motion.div>
            );
          })}

          {/* Add New Trip Card */}
          <div 
            onClick={() => navigate('/explore')}
            className="border-2 border-dashed border-gray-200 rounded-[2rem] flex flex-col items-center justify-center p-12 hover:border-primary/50 hover:bg-primary/5 transition-all cursor-pointer group"
          >
            <div className="w-16 h-16 bg-surface-variant rounded-full flex items-center justify-center text-outline group-hover:bg-primary group-hover:text-white transition-all mb-4">
              <Plus className="w-8 h-8" />
            </div>
            <h3 className="text-lg font-black text-on-surface mb-1">开启新旅程</h3>
            <p className="text-on-surface-variant text-sm font-medium text-center">
              点击这里开始规划您的下一次完美旅行
            </p>
          </div>
        </div>
      )}
    </div>
  );
};

export default MyGuides;
