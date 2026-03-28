import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../AuthContext';
import { useTeams } from '../TeamContext';
import { useNavigate } from 'react-router-dom';
import { User, LogOut, Users, Plus, UserPlus, Edit, Upload } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { apiService } from '../services/api';
import { UserProfile } from '../types';

const Profile: React.FC = () => {
  const { logout } = useAuth();
  const { teams, createTeam, addMember, removeMember, leaveTeam, deleteTeam, joinTeamByInviteCode, loading } = useTeams();
  const navigate = useNavigate();
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // Profile state
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loadingProfile, setLoadingProfile] = useState(true);
  
  // Modal states
  const [showCreateTeam, setShowCreateTeam] = useState(false);
  const [showJoinTeam, setShowJoinTeam] = useState(false);
  const [showEditProfile, setShowEditProfile] = useState(false);
  const [selectedTeamId, setSelectedTeamId] = useState<string | null>(null);
  
  // Form states
  const [newTeamName, setNewTeamName] = useState('');
  const [newTeamDescription, setNewTeamDescription] = useState('');
  const [joinInviteCode, setJoinInviteCode] = useState('');
  const [newMemberUsername, setNewMemberUsername] = useState('');
  const [editNickname, setEditNickname] = useState('');
  const [editEmail, setEditEmail] = useState('');
  const [editPhone, setEditPhone] = useState('');
  const [editAvatarUrl, setEditAvatarUrl] = useState('');
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState('');
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  
  // Error states
  const [error, setError] = useState('');

  // Load user profile
  useEffect(() => {
    loadProfile();
  }, []);

  const loadProfile = async () => {
    try {
      setLoadingProfile(true);
      const data = await apiService.getProfile();
      setProfile(data);
      setEditNickname(data.nickname || '');
      setEditEmail(data.email || '');
      setEditPhone(data.phone || '');
      setEditAvatarUrl(data.avatarUrl || '');
      setAvatarPreview(data.avatarUrl || '');
    } catch (err) {
      console.error('加载用户信息失败:', err);
      setError('加载用户信息失败');
    } finally {
      setLoadingProfile(false);
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const handleCreateTeam = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newTeamName.trim()) {
      try {
        setError('');
        await createTeam(newTeamName, newTeamDescription);
        setNewTeamName('');
        setNewTeamDescription('');
        setShowCreateTeam(false);
      } catch (err: any) {
        setError(err.message || '创建团队失败');
      }
    }
  };

  const handleAddMember = async (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedTeamId && newMemberUsername.trim()) {
      try {
        setError('');
        await addMember(selectedTeamId, newMemberUsername);
        setNewMemberUsername('');
        setSelectedTeamId(null);
      } catch (err: any) {
        setError(err.message || '添加成员失败');
      }
    }
  };

  const handleLeaveTeam = async (teamId: string) => {
    if (confirm('确定要退出这个团队吗？')) {
      try {
        setError('');
        await leaveTeam(teamId);
        alert('已成功退出团队');
      } catch (err: any) {
        setError(err.message || '退出团队失败');
        alert(err.message || '退出团队失败');
      }
    }
  };

  const handleDeleteTeam = async (teamId: string) => {
    if (confirm('确定要解散这个团队吗？此操作不可恢复！')) {
      try {
        setError('');
        await deleteTeam(teamId);
        alert('团队已解散');
      } catch (err: any) {
        setError(err.message || '解散团队失败');
        alert(err.message || '解散团队失败');
      }
    }
  };

  const handleRemoveMember = async (teamId: string, userId: number) => {
    if (confirm('确定要移除这个成员吗？')) {
      try {
        setError('');
        await removeMember(teamId, userId);
        alert('成员已移除');
      } catch (err: any) {
        setError(err.message || '移除成员失败');
        alert(err.message || '移除成员失败');
      }
    }
  };

  const handleJoinTeam = async (e: React.FormEvent) => {
    e.preventDefault();
    if (joinInviteCode.trim()) {
      try {
        setError('');
        await joinTeamByInviteCode(joinInviteCode.trim());
        setJoinInviteCode('');
        setShowJoinTeam(false);
        alert('成功加入团队！');
      } catch (err: any) {
        setError(err.message || '加入团队失败');
      }
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // 验证文件类型
      if (!file.type.startsWith('image/')) {
        setError('只能上传图片文件');
        return;
      }
      // 验证文件大小 (5MB)
      if (file.size > 5 * 1024 * 1024) {
        setError('文件大小不能超过5MB');
        return;
      }
      setAvatarFile(file);
      // 创建预览
      const reader = new FileReader();
      reader.onloadend = () => {
        setAvatarPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // 验证密码
    if (oldPassword || newPassword || confirmPassword) {
      if (!oldPassword) {
        setError('请输入旧密码');
        return;
      }
      if (!newPassword) {
        setError('请输入新密码');
        return;
      }
      if (newPassword !== confirmPassword) {
        setError('两次输入的密码不一致');
        return;
      }
    }

    try {
      setError('');
      
      let avatarUrl = editAvatarUrl;
      
      // 上传头像文件
      if (avatarFile) {
        setUploadingAvatar(true);
        console.log('开始上传头像文件...');
        const uploadResult = await apiService.uploadAvatar(avatarFile);
        console.log('头像上传成功，返回结果:', uploadResult);
        avatarUrl = uploadResult.url;
        console.log('新的头像URL:', avatarUrl);
        setUploadingAvatar(false);
      }
      
      // 更新用户资料
      const profileData = {
        nickname: editNickname,
        email: editEmail,
        phone: editPhone,
        avatarUrl
      };
      console.log('准备更新用户资料，数据:', profileData);
      const updated = await apiService.updateProfile(profileData);
      console.log('用户资料更新成功，返回数据:', updated);
      setProfile(updated);
      
      // 修改密码
      if (oldPassword && newPassword) {
        await apiService.changePassword({ oldPassword, newPassword });
        alert('资料和密码更新成功');
      } else {
        alert('资料更新成功');
      }
      
      setOldPassword('');
      setNewPassword('');
      setConfirmPassword('');
      setAvatarFile(null);
      setShowEditProfile(false);
    } catch (err: any) {
      setError(err.message || '更新失败');
      setUploadingAvatar(false);
    }
  };

  if (loadingProfile) {
    return (
      <div className="min-h-screen bg-surface flex items-center justify-center">
        <div className="text-on-surface-variant">加载中...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-surface pb-24 pt-6 md:pt-24 px-4 max-w-7xl mx-auto">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* User Info Card */}
        <div className="lg:col-span-1">
          <div className="bg-white rounded-[2.5rem] p-8 shadow-sm border border-gray-100 text-center sticky top-24">
            <div className="w-24 h-24 bg-surface-variant rounded-full flex items-center justify-center mx-auto mb-6 text-on-surface-variant relative overflow-hidden">
              {profile?.avatarUrl ? (
                <img src={profile.avatarUrl} alt="Avatar" className="w-full h-full object-cover" />
              ) : (
                <User className="w-12 h-12" />
              )}
            </div>
            <h1 className="text-2xl font-black tracking-tighter text-on-surface mb-1">
              {profile?.nickname || profile?.username || '用户'}
            </h1>
            <p className="text-on-surface-variant mb-2 text-sm font-medium">
              @{profile?.username}
            </p>
            {profile?.email && (
              <p className="text-on-surface-variant mb-2 text-xs">{profile.email}</p>
            )}
            {profile?.phone && (
              <p className="text-on-surface-variant mb-8 text-xs">{profile.phone}</p>
            )}
            
            <div className="space-y-3">
              <button 
                onClick={() => setShowEditProfile(true)}
                className="w-full py-4 bg-surface-variant/50 rounded-2xl text-on-surface font-bold text-sm flex items-center justify-center gap-2 hover:bg-surface-variant transition-all"
              >
                <Edit className="w-4 h-4" /> 编辑资料
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
              <div className="flex gap-3">
                <button 
                  onClick={() => setShowJoinTeam(true)}
                  className="flex items-center gap-2 px-6 py-3 bg-surface-variant text-on-surface rounded-2xl font-bold text-sm hover:bg-surface-variant/80 transition-all"
                >
                  <Users className="w-4 h-4" /> 加入团队
                </button>
                <button 
                  onClick={() => setShowCreateTeam(true)}
                  className="flex items-center gap-2 px-6 py-3 bg-primary text-white rounded-2xl font-bold text-sm shadow-lg shadow-primary/20 hover:scale-105 transition-all"
                >
                  <Plus className="w-4 h-4" /> 创建团队
                </button>
              </div>
            </div>

            {loading ? (
              <div className="text-center py-8 text-on-surface-variant">加载团队中...</div>
            ) : teams.length === 0 ? (
              <div className="text-center py-12 text-on-surface-variant">
                <Users className="w-16 h-16 mx-auto mb-4 opacity-30" />
                <p>还没有团队，创建一个开始协作吧</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {teams.map((team) => {
                  const isCreator = team.creatorId === profile?.id;
                  console.log('团队信息:', {
                    teamId: team.id,
                    teamName: team.name,
                    creatorId: team.creatorId,
                    profileId: profile?.id,
                    isCreator,
                    membersCount: team.members.length
                  });
                  
                  return (
                    <motion.div 
                      layout
                      key={team.id} 
                      className="bg-white rounded-[2rem] p-6 shadow-sm border border-gray-100 hover:shadow-xl transition-all"
                    >
                      <div className="flex items-center justify-between mb-4">
                        <div className="flex-1">
                          <h3 className="font-black text-lg text-on-surface">{team.name}</h3>
                          {team.description && (
                            <p className="text-xs text-on-surface-variant mt-1">{team.description}</p>
                          )}
                          {/* 显示邀请码 */}
                          <div className="mt-2 flex items-center gap-2">
                            <span className="text-xs text-on-surface-variant">邀请码:</span>
                            <code className="px-2 py-1 bg-primary/10 text-primary rounded font-mono font-bold text-sm">
                              {team.inviteCode}
                            </code>
                          </div>
                        </div>
                        <div className="flex gap-2">
                          {/* 只有创建者可以添加成员 */}
                          {isCreator && (
                            <button 
                              onClick={() => setSelectedTeamId(team.id.toString())}
                              className="p-2 bg-surface-variant rounded-xl text-primary hover:bg-primary hover:text-white transition-all"
                              title="添加成员"
                            >
                              <UserPlus className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      </div>
                      
                      <div className="flex flex-wrap gap-2 mb-4">
                        {team.members.map((member) => {
                          const isMemberCreator = member.role === 'creator';
                          const canRemoveMember = isCreator && !isMemberCreator;
                          
                          return (
                            <div key={member.id} className="group relative">
                              <div className="w-10 h-10 rounded-full border-2 border-white shadow-sm overflow-hidden bg-surface-variant flex items-center justify-center relative">
                                {member.avatarUrl ? (
                                  <img 
                                    src={member.avatarUrl} 
                                    alt={member.nickname || member.username} 
                                    className="w-full h-full object-cover"
                                  />
                                ) : (
                                  <User className="w-5 h-5 text-on-surface-variant" />
                                )}
                                {/* 删除成员按钮 - 只有创建者可以删除普通成员 */}
                                {canRemoveMember && (
                                  <button
                                    onClick={() => handleRemoveMember(team.id.toString(), member.userId)}
                                    className="absolute inset-0 bg-red-500/80 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                                    title="移除成员"
                                  >
                                    <span className="text-white text-xs font-bold">×</span>
                                  </button>
                                )}
                              </div>
                              <span className="absolute -bottom-8 left-1/2 -translate-x-1/2 bg-on-surface text-white text-[10px] px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-10">
                                {member.nickname || member.username}
                                {isMemberCreator && ' (创建者)'}
                              </span>
                            </div>
                          );
                        })}
                      </div>
                      
                      <div className="flex items-center justify-between">
                        <div className="text-[10px] font-bold text-outline uppercase tracking-widest">
                          {team.members.length} 位成员
                        </div>
                        <div className="flex gap-2">
                          {/* 普通成员可以退出团队 */}
                          {!isCreator && (
                            <button
                              onClick={() => handleLeaveTeam(team.id.toString())}
                              className="text-xs px-3 py-1 bg-yellow-50 text-yellow-600 rounded-lg hover:bg-yellow-100 transition-all"
                            >
                              退出团队
                            </button>
                          )}
                          {/* 只有创建者可以删除团队 */}
                          {isCreator && (
                            <button
                              onClick={() => handleDeleteTeam(team.id.toString())}
                              className="text-xs px-3 py-1 bg-red-50 text-red-600 rounded-lg hover:bg-red-100 transition-all"
                            >
                              解散团队
                            </button>
                          )}
                        </div>
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            )}
          </section>
        </div>
      </div>

      {/* Modals */}
      <AnimatePresence>
        {/* Create Team Modal */}
        {showCreateTeam && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
            <motion.div 
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="bg-white rounded-[2.5rem] p-8 w-full max-w-sm shadow-2xl"
            >
              <h3 className="text-xl font-black text-on-surface mb-6">创建新团队</h3>
              {error && <div className="mb-4 p-3 bg-red-50 text-red-600 rounded-xl text-sm">{error}</div>}
              <form onSubmit={handleCreateTeam} className="space-y-4">
                <input 
                  autoFocus
                  type="text" 
                  placeholder="团队名称"
                  className="w-full px-4 py-4 bg-surface-variant/50 rounded-2xl border-none focus:ring-2 focus:ring-primary/20 outline-none font-bold"
                  value={newTeamName}
                  onChange={(e) => setNewTeamName(e.target.value)}
                />
                <textarea 
                  placeholder="团队描述 (可选)"
                  className="w-full px-4 py-4 bg-surface-variant/50 rounded-2xl border-none focus:ring-2 focus:ring-primary/20 outline-none font-bold resize-none"
                  rows={3}
                  value={newTeamDescription}
                  onChange={(e) => setNewTeamDescription(e.target.value)}
                />
                <div className="flex gap-3">
                  <button 
                    type="button"
                    onClick={() => { setShowCreateTeam(false); setError(''); }}
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

        {/* Join Team Modal */}
        {showJoinTeam && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
            <motion.div 
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="bg-white rounded-[2.5rem] p-8 w-full max-w-sm shadow-2xl"
            >
              <h3 className="text-xl font-black text-on-surface mb-6">加入团队</h3>
              {error && <div className="mb-4 p-3 bg-red-50 text-red-600 rounded-xl text-sm">{error}</div>}
              <form onSubmit={handleJoinTeam} className="space-y-4">
                <div>
                  <label className="block text-sm font-bold text-on-surface mb-2">团队邀请码</label>
                  <input 
                    autoFocus
                    type="text" 
                    placeholder="输入4位数字邀请码"
                    maxLength={4}
                    className="w-full px-4 py-4 bg-surface-variant/50 rounded-2xl border-none focus:ring-2 focus:ring-primary/20 outline-none font-mono font-bold text-center text-2xl tracking-widest"
                    value={joinInviteCode}
                    onChange={(e) => setJoinInviteCode(e.target.value.replace(/\D/g, ''))}
                  />
                  <p className="text-xs text-on-surface-variant mt-2">请输入团队创建者提供的4位数字邀请码</p>
                </div>
                <div className="flex gap-3">
                  <button 
                    type="button"
                    onClick={() => { setShowJoinTeam(false); setError(''); setJoinInviteCode(''); }}
                    className="flex-1 py-4 bg-surface-variant rounded-2xl font-bold text-sm"
                  >
                    取消
                  </button>
                  <button 
                    type="submit"
                    disabled={joinInviteCode.length !== 4}
                    className="flex-1 py-4 bg-primary text-white rounded-2xl font-bold text-sm shadow-lg shadow-primary/20 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    加入
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}

        {/* Add Member Modal */}
        {selectedTeamId && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
            <motion.div 
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="bg-white rounded-[2.5rem] p-8 w-full max-w-sm shadow-2xl"
            >
              <h3 className="text-xl font-black text-on-surface mb-6">添加团队成员</h3>
              {error && <div className="mb-4 p-3 bg-red-50 text-red-600 rounded-xl text-sm">{error}</div>}
              <form onSubmit={handleAddMember} className="space-y-4">
                <input 
                  autoFocus
                  type="text" 
                  placeholder="用户名"
                  className="w-full px-4 py-4 bg-surface-variant/50 rounded-2xl border-none focus:ring-2 focus:ring-primary/20 outline-none font-bold"
                  value={newMemberUsername}
                  onChange={(e) => setNewMemberUsername(e.target.value)}
                />
                <p className="text-xs text-on-surface-variant">请输入要添加的用户的用户名</p>
                <div className="flex gap-3">
                  <button 
                    type="button"
                    onClick={() => { setSelectedTeamId(null); setError(''); }}
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

        {/* Edit Profile Modal */}
        {showEditProfile && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm overflow-y-auto">
            <motion.div 
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="bg-white rounded-[2.5rem] p-8 w-full max-w-md shadow-2xl my-8"
            >
              <h3 className="text-xl font-black text-on-surface mb-6">编辑资料</h3>
              {error && <div className="mb-4 p-3 bg-red-50 text-red-600 rounded-xl text-sm">{error}</div>}
              <form onSubmit={handleUpdateProfile} className="space-y-4">
                {/* 头像上传 */}
                <div className="space-y-3">
                  <label className="block text-sm font-bold text-on-surface">头像</label>
                  <div className="flex items-center gap-4">
                    <div className="w-20 h-20 bg-surface-variant rounded-full flex items-center justify-center overflow-hidden flex-shrink-0">
                      {avatarPreview ? (
                        <img src={avatarPreview} alt="Avatar" className="w-full h-full object-cover" />
                      ) : (
                        <User className="w-10 h-10 text-on-surface-variant" />
                      )}
                    </div>
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="flex-1 py-3 px-4 bg-surface-variant/50 rounded-2xl text-sm font-bold flex items-center justify-center gap-2 hover:bg-surface-variant transition-all"
                    >
                      <Upload className="w-4 h-4" /> 选择图片
                    </button>
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      onChange={handleFileSelect}
                      className="hidden"
                    />
                  </div>
                  <p className="text-xs text-on-surface-variant">支持JPG、PNG格式，最大5MB</p>
                </div>

                <div className="border-t border-surface-variant pt-4"></div>

                {/* 用户名（不可编辑） */}
                <div>
                  <label className="block text-xs font-bold text-on-surface-variant mb-2">用户名 (不可修改)</label>
                  <input 
                    type="text" 
                    disabled
                    className="w-full px-4 py-3 bg-surface-variant/30 rounded-2xl border-none outline-none text-sm text-on-surface-variant"
                    value={profile?.username}
                  />
                </div>

                {/* 昵称 */}
                <input 
                  type="text" 
                  placeholder="昵称"
                  className="w-full px-4 py-3 bg-surface-variant/50 rounded-2xl border-none focus:ring-2 focus:ring-primary/20 outline-none text-sm"
                  value={editNickname}
                  onChange={(e) => setEditNickname(e.target.value)}
                />

                {/* 邮箱 */}
                <input 
                  type="email" 
                  placeholder="邮箱"
                  className="w-full px-4 py-3 bg-surface-variant/50 rounded-2xl border-none focus:ring-2 focus:ring-primary/20 outline-none text-sm"
                  value={editEmail}
                  onChange={(e) => setEditEmail(e.target.value)}
                />

                {/* 手机号 */}
                <input 
                  type="tel" 
                  placeholder="手机号"
                  className="w-full px-4 py-3 bg-surface-variant/50 rounded-2xl border-none focus:ring-2 focus:ring-primary/20 outline-none text-sm"
                  value={editPhone}
                  onChange={(e) => setEditPhone(e.target.value)}
                />

                <div className="border-t border-surface-variant pt-4"></div>

                {/* 修改密码 */}
                <div className="space-y-3">
                  <label className="block text-sm font-bold text-on-surface">修改密码 (可选)</label>
                  <input 
                    type="password" 
                    placeholder="旧密码"
                    className="w-full px-4 py-3 bg-surface-variant/50 rounded-2xl border-none focus:ring-2 focus:ring-primary/20 outline-none text-sm"
                    value={oldPassword}
                    onChange={(e) => setOldPassword(e.target.value)}
                  />
                  <input 
                    type="password" 
                    placeholder="新密码"
                    className="w-full px-4 py-3 bg-surface-variant/50 rounded-2xl border-none focus:ring-2 focus:ring-primary/20 outline-none text-sm"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                  />
                  <input 
                    type="password" 
                    placeholder="确认新密码"
                    className="w-full px-4 py-3 bg-surface-variant/50 rounded-2xl border-none focus:ring-2 focus:ring-primary/20 outline-none text-sm"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                  />
                  <p className="text-xs text-on-surface-variant">如不需要修改密码，请留空</p>
                </div>

                <div className="flex gap-3 pt-2">
                  <button 
                    type="button"
                    onClick={() => {
                      setShowEditProfile(false);
                      setError('');
                      setOldPassword('');
                      setNewPassword('');
                      setConfirmPassword('');
                      setAvatarFile(null);
                      setAvatarPreview(profile?.avatarUrl || '');
                    }}
                    className="flex-1 py-4 bg-surface-variant rounded-2xl font-bold text-sm"
                  >
                    取消
                  </button>
                  <button 
                    type="submit"
                    disabled={uploadingAvatar}
                    className="flex-1 py-4 bg-primary text-white rounded-2xl font-bold text-sm shadow-lg shadow-primary/20 disabled:opacity-50"
                  >
                    {uploadingAvatar ? '上传中...' : '保存'}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default Profile;
