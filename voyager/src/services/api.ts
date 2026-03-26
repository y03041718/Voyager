import { LoginRequest, RegisterRequest, AuthResponse, AmapSearchSuggestion, AmapPOI, SearchAllResponse } from '../types';

const API_BASE_URL = 'http://localhost:8080/api';

class ApiService {
  private getHeaders() {
    return {
      'Content-Type': 'application/json'
    };
  }

  // 用户认证相关API
  async login(credentials: LoginRequest): Promise<AuthResponse> {
    const response = await fetch(`${API_BASE_URL}/auth/login`, {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify(credentials)
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(errorText || '登录失败');
    }

    return response.json();
  }

  async register(userData: RegisterRequest): Promise<AuthResponse> {
    const response = await fetch(`${API_BASE_URL}/auth/register`, {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify(userData)
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(errorText || '注册失败');
    }

    return response.json();
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

  // 一次搜索所有类型（关键词搜索，不计算距离）
  async searchAllPOI(keyword: string, city?: string): Promise<SearchAllResponse> {
    const params = new URLSearchParams({
      keyword,
      ...(city && { city })
    });

    console.log('发起关键词搜索请求:', `${API_BASE_URL}/amap/search-all?${params}`);

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
}

export const apiService = new ApiService();
