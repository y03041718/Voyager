import React, { useState } from 'react';
import { MapPin, Calendar, Users, Compass, ArrowRight, ChevronLeft, Sparkles, Wand2, Star, Trash2 } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useNavigate } from 'react-router-dom';
import { useSelection } from '../SelectionContext';

const TripPlanner: React.FC = () => {
  const navigate = useNavigate();
  const { selectedDestinations, toggleSelection, tripDetails, updateTripDetails } = useSelection();
  const [step, setStep] = useState(1);
  const [isGenerating, setIsGenerating] = useState(false);
  const totalSteps = 4;

  const nextStep = () => {
    if (step === totalSteps) {
      handleGenerate();
    } else {
      setStep(s => Math.min(s + 1, totalSteps));
    }
  };
  const prevStep = () => setStep(s => Math.max(s - 1, 1));

  const handleGenerate = async () => {
    setIsGenerating(true);
    // Simulate AI generation delay
    await new Promise(resolve => setTimeout(resolve, 2000));
    setIsGenerating(false);
    navigate('/itinerary');
  };

  return (
    <div className="pb-24 pt-6 md:pt-24 px-4 max-w-3xl mx-auto min-h-screen flex flex-col">
      {/* Progress Bar */}
      <div className="mb-12 flex items-center justify-between gap-4">
        <button
          onClick={prevStep}
          className={`w-10 h-10 rounded-full flex items-center justify-center transition-all ${
            step === 1 ? 'opacity-0 pointer-events-none' : 'bg-surface-variant text-on-surface-variant hover:bg-primary/10 hover:text-primary'
          }`}
        >
          <ChevronLeft className="w-6 h-6" />
        </button>
        <div className="flex-1 h-2 bg-surface-variant rounded-full overflow-hidden">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${(step / totalSteps) * 100}%` }}
            className="h-full bg-primary shadow-lg shadow-primary/20"
          />
        </div>
        <span className="text-xs font-black text-primary tracking-widest uppercase">
          {step} / {totalSteps}
        </span>
      </div>

      {/* Content */}
      <div className="flex-1">
        <AnimatePresence mode="wait">
          {step === 1 && (
            <motion.div
              key="step1"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-8"
            >
              <div className="space-y-2">
                <h1 className="text-4xl font-black tracking-tighter text-on-surface leading-tight">
                  确认您的选择
                </h1>
                <p className="text-on-surface-variant font-medium">这些是您在探索页面选择的地点</p>
              </div>
              
              {selectedDestinations.length > 0 ? (
                <div className="space-y-4">
                  {selectedDestinations.map((dest) => (
                    <div key={dest.id} className="bg-white p-4 rounded-3xl border border-gray-100 flex items-center gap-4 shadow-sm group">
                      <img src={dest.image} alt="" className="w-20 h-20 rounded-2xl object-cover" />
                      <div className="flex-1">
                        <h3 className="font-black text-on-surface">{dest.name}</h3>
                        <div className="flex items-center gap-2 text-xs text-on-surface-variant mt-1">
                          <span className="px-2 py-0.5 bg-primary/10 text-primary rounded-md font-bold">
                            {dest.type === 'hotel' ? '酒店' : dest.type === 'attraction' ? '景点' : '餐厅'}
                          </span>
                          <div className="flex items-center gap-1">
                            <Star className="w-3 h-3 text-yellow-500 fill-yellow-500" />
                            <span className="font-bold">{dest.rating}</span>
                          </div>
                        </div>
                      </div>
                      <button 
                        onClick={() => toggleSelection(dest)}
                        className="p-2 text-outline hover:text-red-500 transition-colors"
                      >
                        <Trash2 className="w-5 h-5" />
                      </button>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="bg-surface-variant/30 border-2 border-dashed border-gray-200 rounded-[2rem] p-12 text-center">
                  <p className="text-on-surface-variant font-medium mb-4">您还没有选择任何地点</p>
                  <button 
                    onClick={() => navigate('/')}
                    className="text-primary font-black hover:underline"
                  >
                    去探索页面看看吧
                  </button>
                </div>
              )}
            </motion.div>
          )}

          {step === 2 && (
            <motion.div
              key="step2"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-8"
            >
              <div className="space-y-2">
                <h1 className="text-4xl font-black tracking-tighter text-on-surface leading-tight">
                  什么时候出发？
                </h1>
                <p className="text-on-surface-variant font-medium">选择您的旅行日期</p>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-widest text-outline ml-4">出发日期</label>
                  <div className="relative">
                    <Calendar className="absolute left-6 top-1/2 -translate-y-1/2 text-primary w-5 h-5" />
                    <input 
                      type="date" 
                      value={tripDetails.startDate}
                      onChange={(e) => updateTripDetails({ startDate: e.target.value })}
                      className="w-full bg-surface-variant/50 border-none rounded-3xl py-5 pl-14 pr-6 font-black outline-none focus:ring-4 focus:ring-primary/10 transition-all" 
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-widest text-outline ml-4">返程日期</label>
                  <div className="relative">
                    <Calendar className="absolute left-6 top-1/2 -translate-y-1/2 text-primary w-5 h-5" />
                    <input 
                      type="date" 
                      value={tripDetails.endDate}
                      onChange={(e) => updateTripDetails({ endDate: e.target.value })}
                      className="w-full bg-surface-variant/50 border-none rounded-3xl py-5 pl-14 pr-6 font-black outline-none focus:ring-4 focus:ring-primary/10 transition-all" 
                    />
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {step === 3 && (
            <motion.div
              key="step3"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-8"
            >
              <div className="space-y-2">
                <h1 className="text-4xl font-black tracking-tighter text-on-surface leading-tight">
                  和谁一起去？
                </h1>
                <p className="text-on-surface-variant font-medium">告诉我们您的旅行伙伴</p>
              </div>
              <div className="grid grid-cols-2 gap-4">
                {[
                  { icon: <Users className="w-6 h-6" />, label: '独自一人', sub: '享受自由' },
                  { icon: <Users className="w-6 h-6" />, label: '情侣/夫妻', sub: '浪漫之旅' },
                  { icon: <Users className="w-6 h-6" />, label: '家庭出游', sub: '温馨时光' },
                  { icon: <Users className="w-6 h-6" />, label: '好友同行', sub: '快乐加倍' },
                ].map((item, i) => (
                  <button 
                    key={i} 
                    onClick={() => updateTripDetails({ travelers: item.label })}
                    className={`p-6 border rounded-3xl text-left transition-all group flex flex-col gap-4 ${
                      tripDetails.travelers === item.label ? 'bg-primary/5 border-primary ring-2 ring-primary/10' : 'bg-white border-gray-100 hover:border-primary hover:bg-primary/5'
                    }`}
                  >
                    <div className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-all ${
                      tripDetails.travelers === item.label ? 'bg-primary text-white' : 'bg-surface-variant text-on-surface-variant group-hover:bg-primary group-hover:text-white'
                    }`}>
                      {item.icon}
                    </div>
                    <div>
                      <h3 className={`font-black ${tripDetails.travelers === item.label ? 'text-primary' : 'text-on-surface group-hover:text-primary'}`}>{item.label}</h3>
                      <p className="text-xs text-on-surface-variant font-medium">{item.sub}</p>
                    </div>
                  </button>
                ))}
              </div>
            </motion.div>
          )}

          {step === 4 && (
            <motion.div
              key="step4"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-8"
            >
              <div className="space-y-2">
                <h1 className="text-4xl font-black tracking-tighter text-on-surface leading-tight">
                  您的旅行风格？
                </h1>
                <p className="text-on-surface-variant font-medium">让我们更了解您的偏好</p>
              </div>
              <div className="grid grid-cols-2 gap-4">
                {[
                  { icon: <Compass className="w-6 h-6" />, label: '特种兵', sub: '高效打卡' },
                  { icon: <Compass className="w-6 h-6" />, label: '慢旅行', sub: '深度体验' },
                  { icon: <Compass className="w-6 h-6" />, label: '美食家', sub: '味蕾盛宴' },
                  { icon: <Compass className="w-6 h-6" />, label: '艺术控', sub: '文化洗礼' },
                ].map((item, i) => (
                  <button 
                    key={i} 
                    onClick={() => updateTripDetails({ style: item.label })}
                    className={`p-6 border rounded-3xl text-left transition-all group flex flex-col gap-4 ${
                      tripDetails.style === item.label ? 'bg-primary/5 border-primary ring-2 ring-primary/10' : 'bg-white border-gray-100 hover:border-primary hover:bg-primary/5'
                    }`}
                  >
                    <div className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-all ${
                      tripDetails.style === item.label ? 'bg-primary text-white' : 'bg-surface-variant text-on-surface-variant group-hover:bg-primary group-hover:text-white'
                    }`}>
                      {item.icon}
                    </div>
                    <div>
                      <h3 className={`font-black ${tripDetails.style === item.label ? 'text-primary' : 'text-on-surface group-hover:text-primary'}`}>{item.label}</h3>
                      <p className="text-xs text-on-surface-variant font-medium">{item.sub}</p>
                    </div>
                  </button>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Footer Actions */}
      <div className="mt-auto pt-12">
        <button
          onClick={nextStep}
          disabled={(step === 1 && selectedDestinations.length === 0) || isGenerating}
          className={`w-full py-6 rounded-3xl text-white font-black text-xl shadow-2xl flex items-center justify-center gap-3 transition-all group ${
            (step === 1 && selectedDestinations.length === 0) || isGenerating ? 'bg-gray-300 cursor-not-allowed shadow-none' : 'bg-primary shadow-primary/30 hover:scale-[1.02]'
          }`}
        >
          {isGenerating ? (
            <>
              <motion.div 
                animate={{ rotate: 360 }}
                transition={{ repeat: Infinity, duration: 1, ease: "linear" }}
              >
                <Sparkles className="w-6 h-6" />
              </motion.div>
              正在生成专属行程...
            </>
          ) : step === totalSteps ? (
            <>
              <Sparkles className="w-6 h-6 animate-pulse" />
              AI 生成行程
              <Wand2 className="w-6 h-6" />
            </>
          ) : (
            <>
              下一步
              <ArrowRight className="w-6 h-6 group-hover:translate-x-2 transition-transform" />
            </>
          )}
        </button>
      </div>
    </div>
  );
};

export default TripPlanner;
