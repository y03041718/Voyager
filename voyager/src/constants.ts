import { Trip, Destination } from './types';

export const MOCK_TRIPS: Trip[] = [
  {
    id: '1',
    title: '京都：古都漫步与禅意之旅',
    dateRange: '2024.10.15 - 2024.10.20',
    travelers: '2 成人',
    style: '文化体验 / 慢旅行',
    image: 'https://picsum.photos/seed/kyoto/800/600',
    status: 'upcoming',
    days: [
      {
        day: 1,
        subtitle: '抵达京都：初见古都的宁静',
        activities: [
          {
            id: 'a1',
            time: '14:00',
            title: '抵达京都站',
            description: '从关西机场乘坐 HARUKA 特急列车抵达京都站。',
            image: 'https://picsum.photos/seed/kyotostation/400/300',
            location: '京都站',
            status: '已确认'
          },
          {
            id: 'a2',
            time: '16:00',
            title: '入住 虹夕诺雅 京都',
            description: '乘船进入酒店，体验极致的日式奢华与宁静。',
            image: 'https://picsum.photos/seed/hoshinoya/400/300',
            location: '岚山',
            status: '已确认',
            tip: '酒店提供的欢迎茶点非常精致，建议准时抵达。'
          }
        ]
      }
    ]
  },
  {
    id: '2',
    title: '北海道：冬日雪国与温泉物语',
    dateRange: '2024.12.05 - 2024.12.12',
    travelers: '4 成人',
    style: '滑雪 / 温泉 / 美食',
    image: 'https://picsum.photos/seed/hokkaido/800/600',
    status: 'planned'
  },
  {
    id: '3',
    title: '巴黎：浪漫之都的艺术洗礼',
    dateRange: '2024.05.20 - 2024.05.28',
    travelers: '1 成人',
    style: '艺术 / 摄影 / 城市探索',
    image: 'https://picsum.photos/seed/paris/800/600',
    status: 'completed'
  }
];

export const MOCK_DESTINATIONS: Destination[] = [
  {
    id: 'h1',
    name: '京都 虹夕诺雅',
    distance: '1.2km',
    rating: 4.9,
    description: '隐匿于岚山深处的日式旅馆，乘船方可抵达，尽享四季之美。',
    image: 'https://picsum.photos/seed/hotel1/400/300',
    type: 'hotel',
    price: '¥8,000+',
    category: '豪华度假村',
    reviews: '2,456 条评价',
    tags: ['私密', '禅意', '顶级服务'],
    starLevel: '五星级'
  },
  {
    id: 'a1',
    name: '清水寺',
    distance: '3.5km',
    rating: 4.8,
    description: '京都最古老的寺院，清水舞台可俯瞰全城美景，樱花与红叶季尤为壮观。',
    image: 'https://picsum.photos/seed/attraction1/400/300',
    type: 'attraction',
    category: '历史遗迹',
    reviews: '15,890 条评价',
    tags: ['必打卡', '世界遗产', '绝美景观'],
    level: '5A级景区'
  },
  {
    id: 'r1',
    name: '菊乃井 本店',
    distance: '2.1km',
    rating: 4.9,
    description: '米其林三星怀石料理，传承百年的极致美味与款待之道。',
    image: 'https://picsum.photos/seed/food1/400/300',
    type: 'restaurant',
    price: '¥30,000+',
    category: '怀石料理',
    reviews: '1,230 条评价',
    tags: ['米其林三星', '传统', '季节限定'],
    cost: '500'
  }
];
