import React, { createContext, useContext, useState, ReactNode, useEffect } from 'react';
import { apiService } from './services/api';
import { TeamDetail } from './types';

export interface SharedPlan {
  id: string;
  teamId: string;
  planId: string;
  sharedBy: string;
  sharedAt: string;
}

interface TeamContextType {
  teams: TeamDetail[];
  sharedPlans: SharedPlan[];
  loading: boolean;
  createTeam: (name: string, description?: string) => Promise<void>;
  addMember: (teamId: string, username: string) => Promise<void>;
  removeMember: (teamId: string, userId: number) => Promise<void>;
  leaveTeam: (teamId: string) => Promise<void>;
  deleteTeam: (teamId: string) => Promise<void>;
  joinTeamByInviteCode: (inviteCode: string) => Promise<void>;
  refreshTeams: () => Promise<void>;
  sharePlan: (planId: string, teamId: string, sharedBy: string) => void;
}

const TeamContext = createContext<TeamContextType | undefined>(undefined);

export const TeamProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [teams, setTeams] = useState<TeamDetail[]>([]);
  const [loading, setLoading] = useState(false);
  const [sharedPlans, setSharedPlans] = useState<SharedPlan[]>(() => {
    const saved = localStorage.getItem('voyager_shared_plans');
    return saved ? JSON.parse(saved) : [];
  });

  useEffect(() => {
    localStorage.setItem('voyager_shared_plans', JSON.stringify(sharedPlans));
  }, [sharedPlans]);

  // 加载团队列表
  const refreshTeams = async () => {
    try {
      setLoading(true);
      const teamDetails = await apiService.getTeams();
      setTeams(teamDetails);
    } catch (error) {
      console.error('加载团队列表失败:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  // 初始加载
  useEffect(() => {
    refreshTeams();
  }, []);

  const createTeam = async (name: string, description?: string) => {
    try {
      await apiService.createTeam({ name, description });
      await refreshTeams();
    } catch (error) {
      console.error('创建团队失败:', error);
      throw error;
    }
  };

  const addMember = async (teamId: string, username: string) => {
    try {
      await apiService.addTeamMember(Number(teamId), username);
      await refreshTeams();
    } catch (error) {
      console.error('添加成员失败:', error);
      throw error;
    }
  };

  const removeMember = async (teamId: string, userId: number) => {
    try {
      await apiService.removeTeamMember(Number(teamId), userId);
      await refreshTeams();
    } catch (error) {
      console.error('删除成员失败:', error);
      throw error;
    }
  };

  const leaveTeam = async (teamId: string) => {
    try {
      await apiService.leaveTeam(Number(teamId));
      await refreshTeams();
    } catch (error) {
      console.error('退出团队失败:', error);
      throw error;
    }
  };

  const deleteTeam = async (teamId: string) => {
    try {
      await apiService.deleteTeam(Number(teamId));
      await refreshTeams();
    } catch (error) {
      console.error('删除团队失败:', error);
      throw error;
    }
  };

  const joinTeamByInviteCode = async (inviteCode: string) => {
    try {
      await apiService.joinTeamByInviteCode(inviteCode);
      await refreshTeams();
    } catch (error) {
      console.error('加入团队失败:', error);
      throw error;
    }
  };

  const sharePlan = (planId: string, teamId: string, sharedBy: string) => {
    const newShare: SharedPlan = {
      id: Date.now().toString(),
      teamId,
      planId,
      sharedBy,
      sharedAt: new Date().toISOString()
    };
    setSharedPlans([...sharedPlans, newShare]);
  };

  return (
    <TeamContext.Provider value={{ 
      teams, 
      sharedPlans, 
      loading,
      createTeam, 
      addMember, 
      removeMember,
      leaveTeam,
      deleteTeam,
      joinTeamByInviteCode,
      refreshTeams,
      sharePlan 
    }}>
      {children}
    </TeamContext.Provider>
  );
};

export const useTeams = () => {
  const context = useContext(TeamContext);
  if (!context) {
    throw new Error('useTeams must be used within a TeamProvider');
  }
  return context;
};
