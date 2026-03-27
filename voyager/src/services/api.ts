import { LoginRequest, RegisterRequest, AuthResponse, AmapSearchSuggestion, AmapPOI, SearchAllResponse, TripPlanRequest, TravelPlanResponse, TripPlanSummary } from '../types';

const API_BASE_URL = 'http://localhost:8080/api';

class ApiService {
  private getHeaders() {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json'
    };
    
    // 如果存在token，添加到请求头
    const token = localStorage.getItem('token');
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
    
    return headers;
  }

  // 用户认证相关API
  async login(credentials: LoginRequest): Promise<AuthResponse> {
    console.log('发起登录请求:', credentials);
    const response = await fetch(`${API_BASE_URL}/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(credentials)
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(errorText || '登录失败');
    }

    const data: AuthResponse = await response.json();
    console.log('登录响应数据:', data);
    
    // 保存token到localStorage
    if (data.token) {
      localStorage.setItem('token', data.token);
      console.log('Token已保存到localStorage:', data.token);
    } else {
      console.error('响应中没有token!');
    }

    return data;
  }

  async register(userData: RegisterRequest): Promise<AuthResponse> {
    console.log('发起注册请求:', userData);
    const response = await fetch(`${API_BASE_URL}/auth/register`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(userData)
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(errorText || '注册失败');
    }

    const data: AuthResponse = await response.json();
    console.log('注册响应数据:', data);
    
    // 保存token到localStorage
    if (data.token) {
      localStorage.setItem('token', data.token);
      console.log('Token已保存到localStorage:', data.token);
    } else {
      console.error('响应中没有token!');
    }

    return data;
  }

  // 高德地图搜索相关API
  async searchSuggestions(keyword: string): Promise<AmapSearchSuggestion[]> {
    const response = await fetch(`${API_BASE_URL}/amap/suggestions?keyword=${encodeURIComponent(keyword)}`, {
      headers: this.getHeaders()
    });

    if (!response.ok) {
      throw new Error('搜索建议获取失败');
    }

    return response.json();
  }

  async searchPOI(keyword: string, city?: string, types?: string): Promise<AmapPOI[]> {
    const params = new URLSearchParams({
      keyword,
      ...(city && { city }),
      ...(types && { types })
    });

    const response = await fetch(`${API_BASE_URL}/amap/search?${params}`, {
      headers: this.getHeaders()
    });

    if (!response.ok) {
      throw new Error('POI搜索失败');
    }

    return response.json();
  }

  async getNearbyPOI(
    location: { lat: number; lng: number }, 
    types: string, 
    radius: number = 3000
  ): Promise<AmapPOI[]> {
    const params = new URLSearchParams({
      lat: location.lat.toString(),
      lng: location.lng.toString(),
      types,
      radius: radius.toString()
    });

    const response = await fetch(`${API_BASE_URL}/amap/nearby?${params}`, {
      headers: this.getHeaders()
    });

    if (!response.ok) {
      throw new Error('周边搜索失败');
    }

    return response.json();
  }

  // 一次搜索所有类型（关键词搜索，可选计算距离）
  async searchAllPOI(
    keyword: string, 
    city?: string, 
    centerLocation?: { lat: number; lng: number }
  ): Promise<SearchAllResponse> {
    const params = new URLSearchParams({
      keyword,
      ...(city && { city }),
      ...(centerLocation && { 
        centerLat: centerLocation.lat.toString(),
        centerLng: centerLocation.lng.toString()
      })
    });

    console.log('发起关键词搜索请求:', `${API_BASE_URL}/amap/search-all?${params}`);
    if (centerLocation) {
      console.log('使用中心点坐标:', centerLocation);
    }

    const response = await fetch(`${API_BASE_URL}/amap/search-all?${params}`, {
      headers: this.getHeaders()
    });

    console.log('响应状态:', response.status);

    if (!response.ok) {
      const errorText = await response.text();
      console.error('搜索失败响应:', errorText);
      throw new Error('搜索失败');
    }

    const data = await response.json();
    console.log('搜索响应数据:', data);
    return data;
  }

  // 一次搜索周边所有类型（周边搜索，返回距离目标地的距离）
  async getNearbyAllPOI(
    location: { lat: number; lng: number }, 
    radius: number = 3000
  ): Promise<SearchAllResponse> {
    const params = new URLSearchParams({
      lat: location.lat.toString(),
      lng: location.lng.toString(),
      radius: radius.toString()
    });

    console.log('发起周边搜索请求（目标地）:', `${API_BASE_URL}/amap/nearby-all?${params}`);

    const response = await fetch(`${API_BASE_URL}/amap/nearby-all?${params}`, {
      headers: this.getHeaders()
    });

    console.log('响应状态:', response.status);

    if (!response.ok) {
      const errorText = await response.text();
      console.error('周边搜索失败响应:', errorText);
      throw new Error('周边搜索失败');
    }

    const data = await response.json();
    console.log('周边搜索响应数据:', data);
    return data;
  }

  // 旅行计划生成API
  async generateTripPlan(request: TripPlanRequest): Promise<TravelPlanResponse> {
    console.log('发起生成旅行计划请求:', request);

    const response = await fetch(`${API_BASE_URL}/trip/generate`, {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify(request)
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('生成旅行计划失败:', errorText);
      throw new Error(errorText || '生成旅行计划失败');
    }

    const data = await response.json();
    console.log('生成旅行计划响应:', data);
    return data;
  }

  // 我的行程相关API
  async getMyTripPlans(): Promise<TripPlanSummary[]> {
    const response = await fetch(`${API_BASE_URL}/my-trips`, {
      headers: this.getHeaders()
    });

    if (!response.ok) {
      throw new Error('获取旅行计划列表失败');
    }

    return response.json();
  }

  async getTripPlanDetail(id: number): Promise<TravelPlanResponse> {
    const response = await fetch(`${API_BASE_URL}/my-trips/${id}`, {
      headers: this.getHeaders()
    });

    if (!response.ok) {
      throw new Error('获取旅行计划详情失败');
    }

    return response.json();
  }

  async deleteTripPlan(id: number): Promise<void> {
    const response = await fetch(`${API_BASE_URL}/my-trips/${id}`, {
      method: 'DELETE',
      headers: this.getHeaders()
    });

    if (!response.ok) {
      throw new Error('删除旅行计划失败');
    }
  }

  // 用户资料相关API
  async getProfile(): Promise<any> {
    const token = localStorage.getItem('token');
    console.log('getProfile - Token from localStorage:', token);
    
    const headers = this.getHeaders();
    console.log('getProfile - Request headers:', headers);
    
    const response = await fetch(`${API_BASE_URL}/profile`, {
      headers
    });

    console.log('getProfile - Response status:', response.status);

    if (!response.ok) {
      const errorText = await response.text();
      console.error('getProfile - Error response:', errorText);
      throw new Error('获取用户资料失败');
    }

    return response.json();
  }

  async updateProfile(data: any): Promise<any> {
    const response = await fetch(`${API_BASE_URL}/profile`, {
      method: 'PUT',
      headers: this.getHeaders(),
      body: JSON.stringify(data)
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(errorText || '更新资料失败');
    }

    return response.json();
  }

  async changePassword(data: any): Promise<void> {
    const response = await fetch(`${API_BASE_URL}/profile/password`, {
      method: 'PUT',
      headers: this.getHeaders(),
      body: JSON.stringify(data)
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(errorText || '修改密码失败');
    }
  }

  async uploadAvatar(file: File): Promise<{ url: string }> {
    const formData = new FormData();
    formData.append('file', file);

    const token = localStorage.getItem('token');
    const headers: Record<string, string> = {};
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const response = await fetch(`${API_BASE_URL}/upload/avatar`, {
      method: 'POST',
      headers,
      body: formData
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(errorText || '上传头像失败');
    }

    return response.json();
  }

  // 团队管理相关API
  async getTeams(): Promise<any[]> {
    const response = await fetch(`${API_BASE_URL}/teams`, {
      headers: this.getHeaders()
    });

    if (!response.ok) {
      throw new Error('获取团队列表失败');
    }

    return response.json();
  }

  async createTeam(data: any): Promise<any> {
    const response = await fetch(`${API_BASE_URL}/teams`, {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify(data)
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(errorText || '创建团队失败');
    }

    return response.json();
  }

  async getTeamDetail(id: number): Promise<any> {
    const response = await fetch(`${API_BASE_URL}/teams/${id}`, {
      headers: this.getHeaders()
    });

    if (!response.ok) {
      throw new Error('获取团队详情失败');
    }

    return response.json();
  }

  async updateTeam(id: number, data: any): Promise<any> {
    const response = await fetch(`${API_BASE_URL}/teams/${id}`, {
      method: 'PUT',
      headers: this.getHeaders(),
      body: JSON.stringify(data)
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(errorText || '更新团队失败');
    }

    return response.json();
  }

  async deleteTeam(id: number): Promise<void> {
    const response = await fetch(`${API_BASE_URL}/teams/${id}`, {
      method: 'DELETE',
      headers: this.getHeaders()
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(errorText || '删除团队失败');
    }
  }

  async addTeamMember(id: number, username: string): Promise<void> {
    const response = await fetch(`${API_BASE_URL}/teams/${id}/members`, {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify({ username })
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(errorText || '添加成员失败');
    }
  }

  async removeTeamMember(teamId: number, memberId: number): Promise<void> {
    const response = await fetch(`${API_BASE_URL}/teams/${teamId}/members/${memberId}`, {
      method: 'DELETE',
      headers: this.getHeaders()
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(errorText || '移除成员失败');
    }
  }

  async leaveTeam(id: number): Promise<void> {
    const response = await fetch(`${API_BASE_URL}/teams/${id}/leave`, {
      method: 'POST',
      headers: this.getHeaders()
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(errorText || '退出团队失败');
    }
  }

  async joinTeamByInviteCode(inviteCode: string): Promise<any> {
    const response = await fetch(`${API_BASE_URL}/teams/join/${inviteCode}`, {
      method: 'POST',
      headers: this.getHeaders()
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(errorText || '加入团队失败');
    }

    return response.json();
  }
}

export const apiService = new ApiService();
