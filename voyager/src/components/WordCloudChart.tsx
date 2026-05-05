import React, { useEffect, useState, useRef } from 'react';
import * as echarts from 'echarts';
import 'echarts-wordcloud';
import { apiService } from '../services/api';

interface WordCloudItem {
    text: string;
    value: number;
}

interface WordCloudChartProps {
    type: 'text' | 'province';
    onWordClick?: (word: string) => void;
}

const WordCloudChart: React.FC<WordCloudChartProps> = ({ type, onWordClick }) => {
    const [words, setWords] = useState<WordCloudItem[]>([]);
    const [loading, setLoading] = useState(true);
    const chartRef = useRef<HTMLDivElement>(null);
    const chartInstance = useRef<echarts.ECharts | null>(null);

    useEffect(() => {
        loadWordCloudData();
    }, [type]);

    useEffect(() => {
        if (words.length > 0 && chartRef.current) {
            initChart();
        }

        // 清理函数
        return () => {
            if (chartInstance.current) {
                chartInstance.current.dispose();
                chartInstance.current = null;
            }
        };
    }, [words]);

    // 窗口大小变化时重新渲染
    useEffect(() => {
        const handleResize = () => {
            if (chartInstance.current) {
                chartInstance.current.resize();
            }
        };

        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    const loadWordCloudData = async () => {
        try {
            setLoading(true);
            const data = type === 'text'
                ? await apiService.getTextSearchWordCloud()
                : await apiService.getProvinceSearchWordCloud();

            setWords(data);
        } catch (error) {
            console.error('加载词云数据失败:', error);
            setWords([]);
        } finally {
            setLoading(false);
        }
    };

    const initChart = () => {
        if (!chartRef.current) return;

        // 如果已存在实例，先销毁
        if (chartInstance.current) {
            chartInstance.current.dispose();
        }

        // 创建新实例
        chartInstance.current = echarts.init(chartRef.current);

        // 转换数据格式为ECharts需要的格式
        const chartData = words.map(word => ({
            name: word.text,
            value: word.value
        }));

        const option: echarts.EChartsOption = {
            tooltip: {
                show: true,
                formatter: (params: any) => {
                    return `${params.name}: ${params.value}次搜索`;
                },
                backgroundColor: 'rgba(0, 0, 0, 0.8)',
                borderColor: '#333',
                borderWidth: 0,
                textStyle: {
                    color: '#fff',
                    fontSize: 14
                },
                padding: [8, 12]
            },
            series: [{
                type: 'wordCloud',
                shape: 'circle',
                keepAspect: false,
                left: 'center',
                top: 'center',
                width: '100%',
                height: '100%',
                right: null,
                bottom: null,
                sizeRange: [20, 80],
                rotationRange: [0, 0],
                rotationStep: 0,
                gridSize: 8,
                drawOutOfBound: false,
                layoutAnimation: true,
                textStyle: {
                    fontFamily: 'system-ui, -apple-system, sans-serif',
                    fontWeight: 'bold',
                    color: () => {
                        const colors = [
                            '#FF6B6B', '#4ECDC4', '#45B7D1', '#FFA07A',
                            '#98D8C8', '#F7DC6F', '#BB8FCE', '#85C1E2',
                            '#F06292', '#BA68C8', '#9575CD', '#7986CB',
                            '#64B5F6', '#4FC3F7', '#4DD0E1', '#4DB6AC'
                        ];
                        return colors[Math.floor(Math.random() * colors.length)];
                    }
                },
                emphasis: {
                    focus: 'self',
                    textStyle: {
                        fontWeight: 'bolder'
                    }
                },
                data: chartData
            }]
        };

        chartInstance.current.setOption(option);

        // 添加点击事件
        chartInstance.current.on('click', (params: any) => {
            console.log('点击词云:', params.name);
            if (onWordClick) {
                onWordClick(params.name);
            }
        });
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center h-96">
                <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
            </div>
        );
    }

    if (words.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center h-96 text-on-surface-variant">
                <p className="text-lg font-medium mb-2">暂无搜索数据</p>
                <p className="text-sm text-outline">开始搜索以生成词云图</p>
            </div>
        );
    }

    return (
        <div
            ref={chartRef}
            className="w-full h-96"
            style={{ minHeight: '400px' }}
        />
    );
};

export default WordCloudChart;
