import React from 'react';
import { Plus, Search, MapPin, Calendar, Users, MoreHorizontal, ArrowRight, Share2, Users2 } from 'lucide-react';
import { MOCK_TRIPS } from '../constants';
import { motion } from 'motion/react';
import { useTeams } from '../TeamContext';

const MyGuides: React.FC = () => {
  const { sharedPlans, teams } = useTeams();

  return (
    <div className="pb-24 pt-6 md:pt-24 px-4 max-w-7xl mx-auto">
      {/* Header */}
      <header className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-black tracking-tight text-on-surface mb-1">我的行程</h1>
          <p className="text-on-surface-variant text-sm font-medium">管理您的所有旅行计划</p>
        </div>
        <button className="w-12 h-12 bg-primary rounded-2xl flex items-center justify-center text-white shadow-lg shadow-primary/20 hover:scale-110 transition-all">
          <Plus className="w-6 h-6" />
        </button>
      </header>

      {/* Search & Filters */}
      <div className="flex flex-col md:flex-row gap-4 mb-10">
        <div className="relative flex-1 group">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-outline w-5 h-5 group-focus-within:text-primary transition-colors" />
          <input
            type="text"
            placeholder="搜索您的行程..."
            className="w-full bg-surface-variant/50 border-none rounded-2xl py-4 pl-12 pr-4 focus:ring-2 focus:ring-primary/20 transition-all outline-none text-on-surface"
          />
        </div>
        <div className="flex gap-2 overflow-x-auto no-scrollbar pb-2">
          {['全部', '即将开始', '已完成', '草稿', '团队共享'].map((filter, i) => (
            <button
              key={filter}
              className={`px-6 py-2 rounded-xl whitespace-nowrap text-sm font-bold transition-all ${
                i === 0 ? 'bg-primary text-white shadow-lg shadow-primary/20' : 'bg-surface-variant text-on-surface-variant hover:bg-primary/10'
              }`}
            >
              {filter}
            </button>
          ))}
        </div>
      </div>

      {/* Shared Plans Section */}
      {sharedPlans.length > 0 && (
        <section className="mb-12">
          <h2 className="text-xl font-black text-on-surface mb-6 flex items-center gap-2">
            <Users2 className="w-5 h-5 text-primary" /> 团队共享计划
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {sharedPlans.map((share, i) => {
              const team = teams.find(t => t.id === share.teamId);
              return (
                <motion.div
                  key={share.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.1 }}
                  className="bg-white rounded-[2rem] p-6 shadow-sm border border-gray-100 hover:shadow-xl transition-all"
                >
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-10 h-10 bg-primary/10 rounded-xl flex items-center justify-center text-primary">
                      <Share2 className="w-5 h-5" />
                    </div>
                    <div>
                      <p className="text-xs font-bold text-outline uppercase tracking-widest">来自 {share.sharedBy}</p>
                      <p className="font-black text-on-surface">分享至 {team?.name}</p>
                    </div>
                  </div>
                  <div className="bg-surface-variant/30 rounded-2xl p-4 mb-6">
                    <h3 className="font-black text-on-surface mb-1">阿马尔菲海岸深度游</h3>
                    <p className="text-xs text-on-surface-variant font-medium">包含 3 个目的地 · 7 天行程</p>
                  </div>
                  <button className="w-full py-3 bg-primary text-white rounded-xl font-black text-sm shadow-lg shadow-primary/10 hover:scale-[1.02] transition-all">
                    查看共享计划
                  </button>
                </motion.div>
              );
            })}
          </div>
        </section>
      )}

      {/* Trip Grid */}
      <h2 className="text-xl font-black text-on-surface mb-6">我的个人计划</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {MOCK_TRIPS.map((trip, i) => (
          <motion.div
            key={trip.id}
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: i * 0.1 }}
            className="group bg-white rounded-[2rem] overflow-hidden shadow-sm hover:shadow-2xl transition-all border border-gray-100 flex flex-col"
          >
            <div className="relative h-64 overflow-hidden">
              <img
                src={trip.image}
                alt={trip.title}
                className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-1000"
                referrerPolicy="no-referrer"
              />
              <div className="absolute top-4 left-4">
                <span className={`px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest backdrop-blur-md shadow-lg ${
                  trip.status === 'upcoming' ? 'bg-primary/80 text-white' :
                  trip.status === 'completed' ? 'bg-green-500/80 text-white' :
                  'bg-orange-500/80 text-white'
                }`}>
                  {trip.status === 'upcoming' ? '即将开始' :
                   trip.status === 'completed' ? '已完成' : '规划中'}
                </span>
              </div>
              <button className="absolute top-4 right-4 w-10 h-10 bg-white/20 backdrop-blur-md rounded-full flex items-center justify-center text-white hover:bg-white hover:text-primary transition-all">
                <MoreHorizontal className="w-5 h-5" />
              </button>
              <div className="absolute bottom-0 left-0 right-0 p-6 bg-gradient-to-t from-black/80 via-black/40 to-transparent">
                <h3 className="text-xl font-black text-white leading-tight mb-2">{trip.title}</h3>
                <div className="flex items-center gap-4 text-white/80 text-xs font-bold uppercase tracking-wider">
                  <span className="flex items-center gap-1">
                    <Calendar className="w-3 h-3" /> {trip.dateRange}
                  </span>
                </div>
              </div>
            </div>
            <div className="p-6 flex-1 flex flex-col justify-between">
              <div className="space-y-4 mb-6">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-outline font-bold uppercase tracking-widest text-[10px]">旅行风格</span>
                  <span className="text-on-surface font-black">{trip.style}</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-outline font-bold uppercase tracking-widest text-[10px]">出行人数</span>
                  <span className="text-on-surface font-black">{trip.travelers}</span>
                </div>
              </div>
              <button className="w-full py-4 bg-surface-variant rounded-2xl text-primary font-black text-sm flex items-center justify-center gap-2 hover:bg-primary hover:text-white transition-all group/btn">
                查看详细行程 <ArrowRight className="w-4 h-4 group-hover/btn:translate-x-1 transition-transform" />
              </button>
            </div>
          </motion.div>
        ))}

        {/* Add New Trip Card */}
        <div className="border-2 border-dashed border-gray-200 rounded-[2rem] flex flex-col items-center justify-center p-12 hover:border-primary/50 hover:bg-primary/5 transition-all cursor-pointer group">
          <div className="w-16 h-16 bg-surface-variant rounded-full flex items-center justify-center text-outline group-hover:bg-primary group-hover:text-white transition-all mb-4">
            <Plus className="w-8 h-8" />
          </div>
          <h3 className="text-lg font-black text-on-surface mb-1">开启新旅程</h3>
          <p className="text-on-surface-variant text-sm font-medium text-center">
            点击这里开始规划您的下一次完美旅行
          </p>
        </div>
      </div>
    </div>
  );
};

export default MyGuides;
