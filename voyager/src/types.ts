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
    starLevel?: string;
    level?: string;
    cost?: string;
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
    token?: string;
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
    starLevel?: string;
    level?: string;
    cost?: string;
}

export interface SearchAllResponse {
    hotels: AmapPOI[];
    attractions: AmapPOI[];
    restaurants: AmapPOI[];
}

// 旅行计划生成相关类型
export interface TripPlanRequest {
    destination: string;
    startDate: string;
    endDate: string;
    travelers: string;
    style: string;
    selectedPlaces: SelectedPlace[];
    availablePlaces?: SelectedPlace[];
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
    image?: string;
    tel?: string;
}

// AI生成的旅行计划响应
export interface TravelPlanResponse {
    title?: string;
    destination?: string;
    days: TravelDayPlan[];
    localTips?: LocalTips;
}

export interface TravelDayPlan {
    day: number;
    date: string;
    plans: TravelPlan[];
    weather?: WeatherInfo;
}

export interface WeatherInfo {
    temperature: string;
    condition: string;
    feelsLike: string;
}

export interface LocalTips {
    culture: string;
    food: string;
    tips: string;
}

export interface TravelPlan {
    time: string;
    type: string;
    name: string;
    desc: string;
    duration: string;
    id?: string;
    image?: string;
    rating?: number;
    address?: string;
    starLevel?: string;
    level?: string;
    cost?: string;
    tel?: string;
    location?: {
        lat: number;
        lng: number;
    };
}

// 保存的行程列表摘要
export interface TripPlanSummary {
    id: number;
    title?: string;
    destination: string;
    startDate: string;
    endDate: string;
    travelers: string;
    style: string;
    coverImage?: string;
    createdAt: string;
    isOwner?: boolean;
}

// 从数据库读取的行程详情
export interface SavedTripPlanResponse {
    id: number;
    userId: number;
    title?: string;
    destination: string;
    startDate: string;
    endDate: string;
    travelers: string;
    style: string;
    planData: string;
    coverImage?: string;
    createdAt: string;
    updatedAt: string;
    isOwner: boolean;
}

// 分享行程请求
export interface ShareTripPlanRequest {
    teamId: number;
}

// 用户资料管理相关类型
export interface UserProfile {
    id: number;
    username: string;
    nickname?: string;
    email?: string;
    phone?: string;
    avatarUrl?: string;
    teamName?: string;
    createdAt: string;
    updatedAt?: string;
}

export interface UpdateProfileRequest {
    nickname?: string;
    email?: string;
    phone?: string;
    avatarUrl?: string;
}

export interface ChangePasswordRequest {
    oldPassword: string;
    newPassword: string;
}

// 团队管理相关类型
export interface CreateTeamRequest {
    name: string;
    description?: string;
    avatarUrl?: string;
}

export interface UpdateTeamRequest {
    name?: string;
    description?: string;
    avatarUrl?: string;
}

export interface AddTeamMemberRequest {
    username: string;
}

export interface TeamMemberInfo {
    id: number;
    userId: number;
    username: string;
    nickname?: string;
    avatarUrl?: string;
    role: 'creator' | 'member';
    joinedAt: string;
}

export interface TeamDetail {
    id: number;
    name: string;
    description?: string;
    avatarUrl?: string;
    creatorId: number;
    creatorName: string;
    createdAt: string;
    updatedAt?: string;
    members: TeamMemberInfo[];
}
