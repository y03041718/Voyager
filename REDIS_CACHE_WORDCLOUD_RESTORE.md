# Redis 缓存和词云图功能恢复指南

## 已完成的步骤

### 1. 后端文件已创建
- ✅ `src/main/java/com/example/voyagerdemo/config/RedisConfig.java`
- ✅ `src/main/java/com/example/voyagerdemo/service/PoiCacheService.java`
- ✅ `src/main/java/com/example/voyagerdemo/service/SearchStatService.java`
- ✅ `src/main/java/com/example/voyagerdemo/controller/StatController.java`
- ✅ `src/main/java/com/example/voyagerdemo/dto/WordCloudItem.java`
- ✅ `src/main/java/com/example/voyagerdemo/controller/AmapController.java` (已更新)

### 2. 需要手动更新的文件

#### RegionPoiController.java

在 `src/main/java/com/example/voyagerdemo/controller/RegionPoiController.java` 中：

**添加依赖注入：**
```java
private final SearchStatService searchStatService;
```

**更新 getRegionPois 方法：**
在方法开始处添加：
```java
// 记录省市搜索统计
searchStatService.recordProvinceSearch(province);
```

### 3. 前端文件需要创建

#### WordCloudChart.tsx

创建文件：`voyager/src/components/WordCloudChart.tsx`

```typescript
import React, { useEffect, useRef } from 'react';
import * as echarts from 'echarts';

interface WordCloudChartProps {
  data: Array<{ name: string; value: number }>;
  onWordClick?: (word: string) => void;
  title?: string;
}

const WordCloudChart: React.FC<WordCloudChartProps> = ({ data, onWordClick, title }) => {
  const chartRef = useRef<HTMLDivElement>(null);
  const chartInstance = useRef<echarts.ECharts | null>(null);

  useEffect(() => {
    if (!chartRef.current || data.length === 0) return;

    // 初始化或获取图表实例
    if (!chartInstance.current) {
      chartInstance.current = echarts.init(chartRef.current);
    }

    const option: echarts.EChartsOption = {
      title: {
        text: title || '搜索热词',
        left: 'center',
        textStyle: {
          fontSize: 16,
          fontWeight: 'bold'
        }
      },
      tooltip: {
        show: true,
        formatter: (params: any) => {
          return `${params.name}: ${params.value} 次`;
        }
      },
      series: [{
        type: 'wordCloud',
        shape: 'circle',
        left: 'center',
        top: 'center',
        width: '90%',
        height: '90%',
        sizeRange: [14, 60],
        rotationRange: [0, 0],
        rotationStep: 0,
        gridSize: 8,
        drawOutOfBound: false,
        layoutAnimation: true,
        textStyle: {
          fontFamily: 'sans-serif',
          fontWeight: 'bold',
          color: function () {
            const colors = [
              '#5470c6', '#91cc75', '#fac858', '#ee6666', '#73c0de',
              '#3ba272', '#fc8452', '#9a60b4', '#ea7ccc'
            ];
            return colors[Math.floor(Math.random() * colors.length)];
          }
        },
        emphasis: {
          focus: 'self',
          textStyle: {
            textShadowBlur: 10,
            textShadowColor: '#333'
          }
        },
        data: data.map(item => ({
          name: item.name,
          value: item.value
        }))
      }]
    };

    chartInstance.current.setOption(option);

    // 点击事件
    if (onWordClick) {
      chartInstance.current.off('click');
      chartInstance.current.on('click', (params: any) => {
        if (params.componentType === 'series') {
          onWordClick(params.name);
        }
      });
    }

    // 响应式
    const handleResize = () => {
      chartInstance.current?.resize();
    };
    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
    };
  }, [data, onWordClick, title]);

  useEffect(() => {
    return () => {
      chartInstance.current?.dispose();
      chartInstance.current = null;
    };
  }, []);

  return <div ref={chartRef} style={{ width: '100%', height: '400px' }} />;
};

export default WordCloudChart;
```

#### 更新 Explore.tsx

在 `voyager/src/pages/Explore.tsx` 中添加词云图组件：

1. 导入组件和类型：
```typescript
import WordCloudChart from '../components/WordCloudChart';
import { apiService } from '../services/api';
```

2. 添加状态：
```typescript
const [wordCloudData, setWordCloudData] = useState<Array<{ name: string; value: number }>>([]);
```

3. 添加加载词云数据的函数：
```typescript
const loadWordCloudData = async () => {
  try {
    const data = await apiService.getTextWordCloud();
    setWordCloudData(data);
  } catch (error) {
    console.error('加载词云数据失败:', error);
  }
};

useEffect(() => {
  loadWordCloudData();
}, []);
```

4. 添加词云点击处理：
```typescript
const handleWordClick = async (word: string) => {
  setSearchKeyword(word);
  // 触发搜索
  await handleSearch(word);
};
```

5. 在页面中添加词云图组件（在搜索框下方）：
```typescript
{wordCloudData.length > 0 && (
  <div className="mb-8 bg-white rounded-2xl p-6 shadow-sm">
    <WordCloudChart 
      data={wordCloudData} 
      onWordClick={handleWordClick}
      title="热门搜索"
    />
  </div>
)}
```

### 4. 更新 API 服务

在 `voyager/src/services/api.ts` 中添加：

```typescript
// 获取文本搜索词云数据
async getTextWordCloud(): Promise<Array<{ name: string; value: number }>> {
  const response = await fetch(`${API_BASE_URL}/stat/wordcloud/text`, {
    headers: this.getHeaders()
  });

  if (!response.ok) {
    throw new Error('获取词云数据失败');
  }

  return response.json();
}

// 获取省市搜索词云数据
async getProvinceWordCloud(): Promise<Array<{ name: string; value: number }>> {
  const response = await fetch(`${API_BASE_URL}/stat/wordcloud/province`, {
    headers: this.getHeaders()
  });

  if (!response.ok) {
    throw new Error('获取词云数据失败');
  }

  return response.json();
}
```

### 5. 安装依赖

前端需要安装 ECharts：

```bash
cd voyager
npm install echarts echarts-wordcloud
```

### 6. 配置 Redis

确保 `application.properties` 或 `application.yml` 中有 Redis 配置：

```properties
spring.data.redis.host=localhost
spring.data.redis.port=6379
spring.data.redis.password=
spring.data.redis.database=0
```

### 7. 启动 Redis

确保 Redis 服务已启动：
```bash
redis-server
```

## 功能说明

### Redis 缓存
- **缓存 key 格式**: `travel:poi:text:{关键词}:{类型}:{城市}`
- **过期时间**: 24小时
- **缓存内容**: 文本搜索的高德POI结果

### 搜索统计
- **文本搜索统计**: `stat:search:text` (ZSet)
- **省市搜索统计**: `stat:search:province` (ZSet)
- **数据结构**: 使用 Redis ZSet，score 为搜索次数

### 词云图
- **使用 ECharts** 实现
- **支持鼠标悬浮**显示搜索次数
- **支持点击**触发搜索
- **自动配色**和动画效果

## 测试步骤

1. 启动 Redis 服务
2. 启动后端应用
3. 启动前端应用
4. 在搜索框中搜索几个关键词（如：酒店、景点、餐厅）
5. 刷新页面，应该能看到词云图
6. 点击词云中的词，应该触发搜索
7. 再次搜索相同关键词，应该从缓存中获取（查看后端日志）

## 验证缓存

使用 Redis CLI 查看缓存：

```bash
redis-cli
keys travel:poi:*
keys stat:search:*
zrange stat:search:text 0 -1 withscores
```
