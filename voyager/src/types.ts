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

// 旅行计划生成相关类型（新格式）
export interface TripPlanRequest {
  destination: string;
  startDate: string;
  endDate: string;
  travelers: string;
  style: string;
  selectedPlaces: SelectedPlace[];  // 用户选中的POI（必选）
  availablePlaces?: SelectedPlace[]; // 所有可用的POI（供AI选择）
}

export interface SelectedPlace {
  id: string;
  name: string;
  type: 'hotel' | 'attraction' | 'restaurant';
  address: string;
  rating: number;
  starLevel?: string;
  level?: string;
  cost?: string;
  location: {
    lat: number;
    lng: number;
  };
  image?: string;  // 图片URL
  tel?: string;    // 电话
}

// 新的响应格式
export interface TravelPlanResponse {
  destination?: string;  // 目的地城市名
  days: TravelDayPlan[];
}

export interface TravelDayPlan {
  day: number;
  date: string;
  plans: TravelPlan[];
  weather?: WeatherInfo;  // 每日天气信息
  localTips?: LocalTips;  // 当地特色与提示
}

export interface WeatherInfo {
  temperature: string;    // 温度，如 "24"
  condition: string;      // 天气状况，如 "晴朗"
  feelsLike: string;      // 体感温度，如 "26"
}

export interface LocalTips {
  culture: string;   // 文化特色
  food: string;      // 美食特色
  tips: string;      // 旅行提示
}

export interface TravelPlan {
  time: string;
  type: string;
  name: string;
  desc: string;
  duration: string;
  // 从POI获取的完整信息
  id?: string;
  image?: string;
  rating?: number;
  address?: string;
  starLevel?: string;
  level?: string;
  cost?: string;
  tel?: string;
}

// 旧的响应格式（保留兼容）
export interface TripPlanResponse {
  itinerary: string;
  dayPlans: DayPlanDetail[];
}

export interface DayPlanDetail {
  day: number;
  date: string;
  subtitle: string;
  activities: ActivityDetail[];
}

export interface ActivityDetail {
  id: string;
  time: string;
  title: string;
  description: string;
  type: string;
  image: string;
  location?: string;
  address?: string;
  rating?: number;
  duration?: string;
  tip?: string;
}

// 我的行程列表相关类型
export interface TripPlanSummary {
  id: number;
  destination: string;
  startDate: string;
  endDate: string;
  travelers: string;
  style: string;
  createdAt: string;
}
