import React, { useState } from 'react';
import { useAuth } from '../AuthContext';
import { useTeams } from '../TeamContext';
import { useNavigate } from 'react-router-dom';
import { User, LogOut, Users, Plus, UserPlus, Trash2 } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

const Profile: React.FC = () => {
  const { logout } = useAuth();
  const { teams, createTeam, addMember } = useTeams();
  const navigate = useNavigate();
  const [showCreateTeam, setShowCreateTeam] = useState(false);
  const [newTeamName, setNewTeamName] = useState('');
  const [selectedTeamId, setSelectedTeamId] = useState<string | null>(null);
  const [newMemberName, setNewMemberName] = useState('');

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const handleCreateTeam = (e: React.FormEvent) => {
    e.preventDefault();
    if (newTeamName.trim()) {
      createTeam(newTeamName);
      setNewTeamName('');
      setShowCreateTeam(false);
    }
  };

  const handleAddMember = (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedTeamId && newMemberName.trim()) {
      addMember(selectedTeamId, newMemberName);
      setNewMemberName('');
      setSelectedTeamId(null);
    }
  };

  return (
    <div className="min-h-screen bg-surface pb-24 pt-6 md:pt-24 px-4 max-w-7xl mx-auto">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* User Info Card */}
        <div className="lg:col-span-1">
          <div className="bg-white rounded-[2.5rem] p-8 shadow-sm border border-gray-100 text-center sticky top-24">
            <div className="w-24 h-24 bg-surface-variant rounded-full flex items-center justify-center mx-auto mb-6 text-on-surface-variant relative overflow-hidden">
              <img src="https://i.pravatar.cc/150?u=me" alt="Avatar" className="w-full h-full object-cover" />
            </div>
            <h1 className="text-2xl font-black tracking-tighter text-on-surface mb-1">我的主页</h1>
            <p className="text-on-surface-variant mb-8 text-sm font-medium">xiaoxiaoyulgu@gmail.com</p>
            
            <div className="space-y-3">
              <button className="w-full py-4 bg-surface-variant/50 rounded-2xl text-on-surface font-bold text-sm flex items-center justify-center gap-2 hover:bg-surface-variant transition-all">
                <User className="w-4 h-4" /> 编辑资料
              </button>
              <button 
                onClick={handleLogout}
                className="w-full py-4 bg-red-50 text-red-600 rounded-2xl font-bold text-sm flex items-center justify-center gap-2 hover:bg-red-100 transition-all"
              >
                <LogOut className="w-4 h-4" /> 退出登录
              </button>
            </div>
          </div>
        </div>

        {/* Team Management Section */}
        <div className="lg:col-span-2 space-y-8">
          <section>
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-2xl font-black tracking-tight text-on-surface flex items-center gap-2">
                  <Users className="w-6 h-6 text-primary" /> 我的团队
                </h2>
                <p className="text-on-surface-variant text-sm font-medium">管理您的旅行伙伴和协作团队</p>
              </div>
              <button 
                onClick={() => setShowCreateTeam(true)}
                className="flex items-center gap-2 px-6 py-3 bg-primary text-white rounded-2xl font-bold text-sm shadow-lg shadow-primary/20 hover:scale-105 transition-all"
              >
                <Plus className="w-4 h-4" /> 创建团队
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {teams.map((team) => (
                <motion.div 
                  layout
                  key={team.id} 
                  className="bg-white rounded-[2rem] p-6 shadow-sm border border-gray-100 hover:shadow-xl transition-all"
                >
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="font-black text-lg text-on-surface">{team.name}</h3>
                    <button 
                      onClick={() => setSelectedTeamId(team.id)}
                      className="p-2 bg-surface-variant rounded-xl text-primary hover:bg-primary hover:text-white transition-all"
                    >
                      <UserPlus className="w-4 h-4" />
                    </button>
                  </div>
                  
                  <div className="flex flex-wrap gap-2 mb-4">
                    {team.members.map((member) => (
                      <div key={member.id} className="group relative">
                        <img 
                          src={member.avatar} 
                          alt={member.name} 
                          className="w-10 h-10 rounded-full border-2 border-white shadow-sm"
                          title={member.name}
                        />
                        <span className="absolute -bottom-8 left-1/2 -translate-x-1/2 bg-on-surface text-white text-[10px] px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-10">
                          {member.name}
                        </span>
                      </div>
                    ))}
                  </div>
                  
                  <div className="text-[10px] font-bold text-outline uppercase tracking-widest">
                    {team.members.length} 位成员
                  </div>
                </motion.div>
              ))}
            </div>
          </section>

          {/* Modals */}
          <AnimatePresence>
            {showCreateTeam && (
              <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
                <motion.div 
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  className="bg-white rounded-[2.5rem] p-8 w-full max-w-sm shadow-2xl"
                >
                  <h3 className="text-xl font-black text-on-surface mb-6">创建新团队</h3>
                  <form onSubmit={handleCreateTeam} className="space-y-4">
                    <input 
                      autoFocus
                      type="text" 
                      placeholder="团队名称 (例: 家庭旅行团)"
                      className="w-full px-4 py-4 bg-surface-variant/50 rounded-2xl border-none focus:ring-2 focus:ring-primary/20 outline-none font-bold"
                      value={newTeamName}
                      onChange={(e) => setNewTeamName(e.target.value)}
                    />
                    <div className="flex gap-3">
                      <button 
                        type="button"
                        onClick={() => setShowCreateTeam(false)}
                        className="flex-1 py-4 bg-surface-variant rounded-2xl font-bold text-sm"
                      >
                        取消
                      </button>
                      <button 
                        type="submit"
                        className="flex-1 py-4 bg-primary text-white rounded-2xl font-bold text-sm shadow-lg shadow-primary/20"
                      >
                        创建
                      </button>
                    </div>
                  </form>
                </motion.div>
              </div>
            )}

            {selectedTeamId && (
              <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
                <motion.div 
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  className="bg-white rounded-[2.5rem] p-8 w-full max-w-sm shadow-2xl"
                >
                  <h3 className="text-xl font-black text-on-surface mb-6">添加团队成员</h3>
                  <form onSubmit={handleAddMember} className="space-y-4">
                    <input 
                      autoFocus
                      type="text" 
                      placeholder="成员姓名"
                      className="w-full px-4 py-4 bg-surface-variant/50 rounded-2xl border-none focus:ring-2 focus:ring-primary/20 outline-none font-bold"
                      value={newMemberName}
                      onChange={(e) => setNewMemberName(e.target.value)}
                    />
                    <div className="flex gap-3">
                      <button 
                        type="button"
                        onClick={() => setSelectedTeamId(null)}
                        className="flex-1 py-4 bg-surface-variant rounded-2xl font-bold text-sm"
                      >
                        取消
                      </button>
                      <button 
                        type="submit"
                        className="flex-1 py-4 bg-primary text-white rounded-2xl font-bold text-sm shadow-lg shadow-primary/20"
                      >
                        添加
                      </button>
                    </div>
                  </form>
                </motion.div>
              </div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
};

export default Profile;
