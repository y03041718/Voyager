import React, { createContext, useContext, useState, ReactNode, useEffect } from 'react';
import { User, LoginRequest, RegisterRequest } from './types';
import { apiService } from './services/api';

interface AuthContextType {
  isAuthenticated: boolean;
  user: User | null;
  login: (credentials: LoginRequest) => Promise<void>;
  register: (userData: RegisterRequest) => Promise<void>;
  logout: () => void;
  loading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    // 检查本地存储的认证状态
    const userData = localStorage.getItem('userData');
    
    if (userData) {
      try {
        setUser(JSON.parse(userData));
        setIsAuthenticated(true);
      } catch (error) {
        // 清除无效数据
        localStorage.removeItem('userData');
      }
    }
    setLoading(false);
  }, []);

  const login = async (credentials: LoginRequest) => {
    try {
      setLoading(true);
      console.log('AuthContext: 开始登录流程');
      const response = await apiService.login(credentials);
      console.log('AuthContext: 登录响应:', response);
      
      // token已在apiService中保存到localStorage
      // 保存用户信息
      localStorage.setItem('userData', JSON.stringify(response.user));
      console.log('AuthContext: 用户数据已保存');
      
      setUser(response.user);
      setIsAuthenticated(true);
      console.log('AuthContext: 登录状态已更新');
    } catch (error) {
      console.error('AuthContext: 登录失败:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const register = async (userData: RegisterRequest) => {
    try {
      setLoading(true);
      console.log('AuthContext: 开始注册流程');
      const response = await apiService.register(userData);
      console.log('AuthContext: 注册响应:', response);
      
      // token已在apiService中保存到localStorage
      // 注册成功后自动登录
      localStorage.setItem('userData', JSON.stringify(response.user));
      console.log('AuthContext: 用户数据已保存');
      
      setUser(response.user);
      setIsAuthenticated(true);
      console.log('AuthContext: 注册状态已更新');
    } catch (error) {
      console.error('AuthContext: 注册失败:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const logout = () => {
    localStorage.removeItem('userData');
    localStorage.removeItem('token');
    setUser(null);
    setIsAuthenticated(false);
  };

  return (
    <AuthContext.Provider value={{ 
      isAuthenticated, 
      user, 
      login, 
      register, 
      logout, 
      loading 
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
