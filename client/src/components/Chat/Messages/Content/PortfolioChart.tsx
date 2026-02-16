import React from 'react';
import {
  BarChart,
  Bar,
  PieChart,
  Pie,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  Cell,
} from 'recharts';
import type { UIResource } from 'librechat-data-provider';

interface PortfolioChartProps {
  resource: UIResource;
}

interface ChartData {
  chartType?: 'bar' | 'pie' | 'line';
  data: Array<Record<string, any>>;
  xKey?: string;
  yKey?: string;
  title?: string;
  colors?: string[];
}

// Premium gradient colors designed for maximum visual impact
const PREMIUM_COLORS = [
  { solid: '#6366f1', gradient: ['#818cf8', '#6366f1'] }, // Vibrant Indigo
  { solid: '#10b981', gradient: ['#34d399', '#10b981'] }, // Success Green
  { solid: '#f59e0b', gradient: ['#fbbf24', '#f59e0b'] }, // Gold/Wealth
  { solid: '#ec4899', gradient: ['#f472b6', '#ec4899'] }, // Energetic Pink
  { solid: '#8b5cf6', gradient: ['#a78bfa', '#8b5cf6'] }, // Royal Purple
  { solid: '#06b6d4', gradient: ['#22d3ee', '#06b6d4'] }, // Cyan
];

// Custom tooltip with clean styling
const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="rounded-lg border border-gray-200 bg-white p-3 shadow-lg dark:border-gray-700 dark:bg-gray-800">
        <p className="mb-1 text-sm font-semibold text-gray-700 dark:text-gray-300">{label}</p>
        {payload.map((entry: any, index: number) => (
          <p key={index} className="text-base font-bold" style={{ color: entry.color }}>
            ₹{entry.value?.toLocaleString('en-IN')}
          </p>
        ))}
      </div>
    );
  }
  return null;
};

const PortfolioChart: React.FC<PortfolioChartProps> = ({ resource }) => {
  console.log('📊 PortfolioChart - Full resource:', resource);

  const chartData = resource.data as ChartData;

  console.log('📊 PortfolioChart - chartData:', chartData);
  console.log('📊 PortfolioChart - chartData.data:', chartData?.data);

  if (!chartData || !chartData.data || !Array.isArray(chartData.data)) {
    console.error('❌ PortfolioChart - Invalid chart data:', {
      hasChartData: !!chartData,
      hasData: !!chartData?.data,
      isArray: Array.isArray(chartData?.data),
      dataType: typeof chartData?.data,
      chartData
    });
    return (
      <div className="flex h-full items-center justify-center rounded-lg bg-surface-tertiary p-4 text-text-secondary">
        <p>Invalid chart data</p>
      </div>
    );
  }

  const {
    chartType = 'pie',
    data,
    xKey = 'name',
    yKey = 'value',
    title,
    colors = PREMIUM_COLORS,
  } = chartData;

  console.log('📊 PortfolioChart - Extracted values:', {
    chartType,
    dataLength: data.length,
    xKey,
    yKey,
    title,
    firstItem: data[0],
    firstItemKeys: data[0] ? Object.keys(data[0]) : [],
  });

  // DEBUG: Log each data item
  data.forEach((item, index) => {
    console.log(`📊 PortfolioChart - Data item [${index}]:`, item);
    console.log(`   - ${xKey}:`, item[xKey]);
    console.log(`   - ${yKey}:`, item[yKey]);
  });

  const renderChart = () => {
    switch (chartType) {
      case 'pie':
        return (
          <PieChart>
            <defs>
              {PREMIUM_COLORS.map((color, index) => (
                <linearGradient key={`gradient-${index}`} id={`pieGradient${index}`} x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor={color.gradient[0]} stopOpacity={1} />
                  <stop offset="100%" stopColor={color.gradient[1]} stopOpacity={0.9} />
                </linearGradient>
              ))}
            </defs>
            <Pie
              data={data}
              dataKey={yKey}
              nameKey={xKey}
              cx="50%"
              cy="50%"
              innerRadius={60}
              outerRadius={120}
              paddingAngle={3}
              animationBegin={0}
              animationDuration={1200}
              animationEasing="ease-out"
              label={({ name, percent }) => `${name} ${((percent ?? 0) * 100).toFixed(1)}%`}
              labelLine={false}
              style={{
                cursor: 'pointer',
              }}
            >
              {data.map((_, index) => (
                <Cell
                  key={`cell-${index}`}
                  fill={`url(#pieGradient${index % PREMIUM_COLORS.length})`}
                  stroke="rgba(255, 255, 255, 0.3)"
                  strokeWidth={1}
                />
              ))}
            </Pie>
            <Tooltip content={<CustomTooltip />} />
            <Legend
              wrapperStyle={{
                paddingTop: '20px',
                fontWeight: '600',
                fontSize: '14px',
              }}
              iconType="circle"
            />
          </PieChart>
        );

      case 'line':
        return (
          <LineChart data={data} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
            <defs>
              <linearGradient id="lineGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#10b981" stopOpacity={0.8} />
                <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" strokeWidth={1} />
            <XAxis
              dataKey={xKey}
              stroke="hsl(var(--text-secondary))"
              tick={{ fill: 'hsl(var(--text-secondary))', fontSize: 12, fontWeight: 600 }}
              axisLine={{ stroke: 'hsl(var(--border))' }}
            />
            <YAxis
              stroke="hsl(var(--text-secondary))"
              tick={{ fill: 'hsl(var(--text-secondary))', fontSize: 12, fontWeight: 600 }}
              axisLine={{ stroke: 'hsl(var(--border))' }}
            />
            <Tooltip content={<CustomTooltip />} />
            <Legend wrapperStyle={{ paddingTop: '20px', fontWeight: '600', fontSize: '14px' }} />
            <Line
              type="monotone"
              dataKey={yKey}
              stroke="#10b981"
              strokeWidth={3}
              dot={{
                fill: '#10b981',
                r: 5,
                strokeWidth: 2,
                stroke: '#fff',
              }}
              activeDot={{
                r: 7,
                fill: '#10b981',
                stroke: '#fff',
                strokeWidth: 2,
              }}
              animationDuration={1500}
              animationEasing="ease-in-out"
            />
          </LineChart>
        );

      case 'bar':
      default:
        return (
          <BarChart data={data} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
            <defs>
              {PREMIUM_COLORS.map((color, index) => (
                <linearGradient key={`barGradient-${index}`} id={`barGradient${index}`} x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor={color.gradient[0]} stopOpacity={1} />
                  <stop offset="100%" stopColor={color.gradient[1]} stopOpacity={0.85} />
                </linearGradient>
              ))}
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
            <XAxis
              dataKey={xKey}
              stroke="hsl(var(--text-secondary))"
              tick={{ fill: 'hsl(var(--text-secondary))', fontSize: 13, fontWeight: 700 }}
              axisLine={{ stroke: 'hsl(var(--border))' }}
            />
            <YAxis
              stroke="hsl(var(--text-secondary))"
              tick={{ fill: 'hsl(var(--text-secondary))', fontSize: 12, fontWeight: 600 }}
              axisLine={{ stroke: 'hsl(var(--border))' }}
            />
            <Tooltip content={<CustomTooltip />} />
            <Legend wrapperStyle={{ paddingTop: '20px', fontWeight: '700', fontSize: '14px' }} />
            <Bar
              dataKey={yKey}
              radius={[12, 12, 0, 0]}
              animationDuration={1200}
              animationEasing="ease-out"
            >
              {data.map((_, index) => (
                <Cell
                  key={`cell-${index}`}
                  fill={`url(#barGradient${index % PREMIUM_COLORS.length})`}
                />
              ))}
            </Bar>
          </BarChart>
        );
    }
  };

  return (
    <div className="group relative overflow-hidden p-4">
      <div className="relative z-10 flex h-full flex-col">
        {title && (
          <div className="mb-6 text-center">
            <h3 className="text-2xl font-bold tracking-tight text-gray-900 dark:text-white">
              {title}
            </h3>
            <div
              className="mx-auto mt-2 h-1 w-20 rounded-full"
              style={{
                background: 'linear-gradient(90deg, #10b981, #6366f1, #f59e0b)',
              }}
            />
          </div>
        )}

        <ResponsiveContainer width="100%" height={chartType === 'pie' ? 400 : 350}>
          {renderChart()}
        </ResponsiveContainer>
      </div>
    </div>
  );
};

export default PortfolioChart;
