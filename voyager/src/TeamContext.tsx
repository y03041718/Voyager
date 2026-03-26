import React, { createContext, useContext, useState, ReactNode, useEffect } from 'react';

export interface TeamMember {
  id: string;
  name: string;
  avatar: string;
}

export interface Team {
  id: string;
  name: string;
  members: TeamMember[];
}

export interface SharedPlan {
  id: string;
  teamId: string;
  planId: string; // Reference to a trip ID
  sharedBy: string; // Member name
  sharedAt: string;
}

interface TeamContextType {
  teams: Team[];
  sharedPlans: SharedPlan[];
  createTeam: (name: string) => void;
  addMember: (teamId: string, name: string) => void;
  sharePlan: (planId: string, teamId: string, sharedBy: string) => void;
}

const TeamContext = createContext<TeamContextType | undefined>(undefined);

export const TeamProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [teams, setTeams] = useState<Team[]>(() => {
    const saved = localStorage.getItem('voyager_teams');
    return saved ? JSON.parse(saved) : [
      {
        id: '1',
        name: '家庭旅行团',
        members: [
          { id: 'm1', name: '我', avatar: 'https://i.pravatar.cc/150?u=me' },
          { id: 'm2', name: '小明', avatar: 'https://i.pravatar.cc/150?u=xiaoming' }
        ]
      }
    ];
  });

  const [sharedPlans, setSharedPlans] = useState<SharedPlan[]>(() => {
    const saved = localStorage.getItem('voyager_shared_plans');
    return saved ? JSON.parse(saved) : [];
  });

  useEffect(() => {
    localStorage.setItem('voyager_teams', JSON.stringify(teams));
  }, [teams]);

  useEffect(() => {
    localStorage.setItem('voyager_shared_plans', JSON.stringify(sharedPlans));
  }, [sharedPlans]);

  const createTeam = (name: string) => {
    const newTeam: Team = {
      id: Date.now().toString(),
      name,
      members: [{ id: 'me', name: '我', avatar: 'https://i.pravatar.cc/150?u=me' }]
    };
    setTeams([...teams, newTeam]);
  };

  const addMember = (teamId: string, name: string) => {
    setTeams(teams.map(t => {
      if (t.id === teamId) {
        return {
          ...t,
          members: [...t.members, { id: Date.now().toString(), name, avatar: `https://i.pravatar.cc/150?u=${name}` }]
        };
      }
      return t;
    }));
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
    <TeamContext.Provider value={{ teams, sharedPlans, createTeam, addMember, sharePlan }}>
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
