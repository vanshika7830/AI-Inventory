import React, { useContext } from 'react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  Filler
} from 'chart.js';
import { Line, Bar } from 'react-chartjs-2';
import { TrendingUp, BarChart3 } from 'lucide-react';
import { ThemeContext } from '../context/ThemeContext';

// Register Chart.js components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

// Revenue over time line chart
export const RevenueLineChart = ({ data, isEmpty }) => {
  const { theme } = useContext(ThemeContext);
  const isDark = theme === 'dark';

  if (isEmpty) {
    return (
      <div className="relative h-64 w-full flex items-center justify-center bg-gray-100/50 dark:bg-dark-800/40 rounded-2xl border border-gray-200 dark:border-gray-800/80 overflow-hidden transition-all duration-200">
        {/* Background Grid Lines Mock */}
        <div className="absolute inset-0 grid grid-cols-6 grid-rows-4 opacity-5 pointer-events-none">
          {Array.from({ length: 24 }).map((_, i) => (
            <div key={i} className="border-t border-l border-gray-400 dark:border-white"></div>
          ))}
        </div>
        
        {/* Mock Wave Line */}
        <svg className="absolute inset-0 w-full h-full text-gray-300/30 dark:text-gray-700/20" preserveAspectRatio="none" viewBox="0 0 100 100">
          <path 
            d="M 0 80 Q 20 50 40 70 T 80 30 T 100 50 L 100 100 L 0 100 Z" 
            fill="currentColor"
          />
          <path 
            d="M 0 80 Q 20 50 40 70 T 80 30 T 100 50" 
            fill="none" 
            stroke="currentColor" 
            strokeWidth="2" 
            strokeDasharray="4 4"
          />
        </svg>

        {/* Floating Message */}
        <div className="z-10 text-center px-6">
          <div className="inline-flex p-3 bg-brand/10 text-brand-light rounded-full mb-3 border border-brand/20">
            <TrendingUp className="h-5 w-5" />
          </div>
          <h4 className="text-sm font-bold text-gray-900 dark:text-white mb-1">No sales data yet</h4>
          <p className="text-xs text-gray-600 dark:text-gray-400 max-w-xs">
            Add products and record sales to see your revenue analytics.
          </p>
        </div>
      </div>
    );
  }

  const chartData = {
    labels: data.map((item) => item.month),
    datasets: [
      {
        fill: true,
        label: 'Revenue ($)',
        data: data.map((item) => item.revenue),
        borderColor: '#8B5CF6',
        backgroundColor: isDark ? 'rgba(109, 40, 217, 0.15)' : 'rgba(139, 92, 246, 0.1)',
        tension: 0.4,
        pointBackgroundColor: '#8B5CF6',
        pointBorderColor: '#fff',
        pointHoverRadius: 6,
      },
    ],
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: false,
      },
      tooltip: {
        backgroundColor: isDark ? '#1F2937' : '#FFFFFF',
        titleColor: isDark ? '#FFF' : '#111827',
        bodyColor: isDark ? '#D1D5DB' : '#374151',
        borderColor: isDark ? 'rgba(139, 92, 246, 0.2)' : 'rgba(139, 92, 246, 0.3)',
        borderWidth: 1,
      },
    },
    scales: {
      x: {
        grid: {
          color: isDark ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.05)',
        },
        ticks: {
          color: isDark ? '#9CA3AF' : '#4B5563',
          font: {
            family: 'Inter',
          },
        },
      },
      y: {
        grid: {
          color: isDark ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.05)',
        },
        ticks: {
          color: isDark ? '#9CA3AF' : '#4B5563',
          font: {
            family: 'Inter',
          },
        },
      },
    },
  };

  return (
    <div className="h-64">
      <Line data={chartData} options={options} />
    </div>
  );
};

// Top Selling Products bar chart
export const CategoryBarChart = ({ data, isEmpty }) => {
  const { theme } = useContext(ThemeContext);
  const isDark = theme === 'dark';

  if (isEmpty) {
    return (
      <div className="relative h-64 w-full flex items-center justify-center bg-gray-100/50 dark:bg-dark-800/40 rounded-2xl border border-gray-200 dark:border-gray-800/80 overflow-hidden transition-all duration-200">
        {/* Mock Bars */}
        <div className="absolute bottom-4 left-0 right-0 h-32 flex items-end justify-around px-8 opacity-10 pointer-events-none">
          <div className="w-10 bg-gray-400 dark:bg-dark-700 rounded-t-lg" style={{ height: '40%' }}></div>
          <div className="w-10 bg-gray-400 dark:bg-dark-700 rounded-t-lg" style={{ height: '70%' }}></div>
          <div className="w-10 bg-gray-400 dark:bg-dark-700 rounded-t-lg" style={{ height: '50%' }}></div>
          <div className="w-10 bg-gray-400 dark:bg-dark-700 rounded-t-lg" style={{ height: '85%' }}></div>
          <div className="w-10 bg-gray-400 dark:bg-dark-700 rounded-t-lg" style={{ height: '30%' }}></div>
        </div>

        {/* Floating Message */}
        <div className="z-10 text-center px-6">
          <div className="inline-flex p-3 bg-indigo-500/10 text-indigo-500 dark:text-indigo-400 rounded-full mb-3 border border-indigo-500/20">
            <BarChart3 className="h-5 w-5" />
          </div>
          <h4 className="text-sm font-bold text-gray-900 dark:text-white mb-1">No products yet</h4>
          <p className="text-xs text-gray-600 dark:text-gray-400 max-w-xs">
            Create products and log transactions to see your top performing catalog.
          </p>
        </div>
      </div>
    );
  }

  const chartData = {
    labels: data.map((item) => item.name),
    datasets: [
      {
        label: 'Quantity Sold',
        data: data.map((item) => item.totalQuantity),
        backgroundColor: isDark ? 'rgba(139, 92, 246, 0.8)' : 'rgba(139, 92, 246, 0.75)',
        borderColor: '#8B5CF6',
        borderWidth: 1,
        borderRadius: 6,
        hoverBackgroundColor: '#8B5CF6',
      },
    ],
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: false,
      },
      tooltip: {
        backgroundColor: isDark ? '#1F2937' : '#FFFFFF',
        titleColor: isDark ? '#FFF' : '#111827',
        bodyColor: isDark ? '#D1D5DB' : '#374151',
        borderColor: isDark ? 'rgba(139, 92, 246, 0.2)' : 'rgba(139, 92, 246, 0.3)',
        borderWidth: 1,
      },
    },
    scales: {
      x: {
        grid: {
          display: false,
        },
        ticks: {
          color: isDark ? '#9CA3AF' : '#4B5563',
          font: {
            family: 'Inter',
          },
        },
      },
      y: {
        grid: {
          color: isDark ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.05)',
        },
        ticks: {
          color: isDark ? '#9CA3AF' : '#4B5563',
          precision: 0,
        },
      },
    },
  };

  return (
    <div className="h-64">
      <Bar data={chartData} options={options} />
    </div>
  );
};
