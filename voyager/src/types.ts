export interface Activity {
  id: string;
  time: string;
  title: string;
  description: string;
  image: string;
  location?: string;
  status?: string;
  tip?: string;
}

export interface DayPlan {
  day: number;
  subtitle: string;
  activities: Activity[];
}

export interface Trip {
  id: string;
  title: string;
  dateRange: string;
  travelers: string;
  style: string;
  image: string;
  status: 'upcoming' | 'completed' | 'planned' | 'ongoing';
  days?: DayPlan[];
}

export interface Destination {
  id: string;
  name: string;
  distance: string;
  rating: number;
  description: string;
  image: string;
  type: 'hotel' | 'attraction' | 'restaurant';
  price?: string;
  category?: string;
  reviews?: string;
  tags?: string[];
  location?: {
    lat: number;
    lng: number;
  };
  address?: string;
  starLevel?: string; // 酒店星级
  level?: string; // 景点评级
  cost?: string; // 餐厅人均价格
}

// 用户相关类型
export interface User {
  id: string;
  username: string;
  teamName?: string;
  createdAt: string;
}

export interface LoginRequest {
  username: string;
  password: string;
}

export interface RegisterRequest {
  username: string;
  password: string;
  teamName?: string;
}

export interface AuthResponse {
  user: User;
}

// 高德地图搜索相关类型
export interface AmapSearchSuggestion {
  id: string;
  name: string;
  district: string;
  address: string;
  location: {
    lat: number;
    lng: number;
  };
}

export interface AmapPOI {
  id: string;
  name: string;
  type: string;
  address: string;
  location: {
    lat: number;
    lng: number;
  };
  tel?: string;
  rating?: number;
  photos?: string[];
  distance?: number;
  starLevel?: string; // 酒店星级
  level?: string; // 景点评级
  cost?: string; // 餐厅人均价格
}

export interface SearchAllResponse {
  hotels: AmapPOI[];
  attractions: AmapPOI[];
  restaurants: AmapPOI[];
}
