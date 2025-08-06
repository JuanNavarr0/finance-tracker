import { CATEGORY_COLORS } from './index'

// Chart.js default options
export const defaultChartOptions = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: {
      display: true,
      position: 'bottom' as const,
      labels: {
        padding: 20,
        usePointStyle: true,
        font: {
          size: 12,
          family: 'Inter',
        },
        color: '#9ca3af', // text-gray-400
      },
    },
    tooltip: {
      backgroundColor: '#1f1f1f',
      titleColor: '#fff',
      bodyColor: '#d1d5db',
      borderColor: '#374151',
      borderWidth: 1,
      padding: 12,
      boxPadding: 6,
      usePointStyle: true,
      callbacks: {
        label: function(context: any) {
          let label = context.dataset.label || ''
          if (label) {
            label += ': '
          }
          if (context.parsed.y !== null) {
            label += new Intl.NumberFormat('es-ES', {
              style: 'currency',
              currency: 'EUR'
            }).format(context.parsed.y)
          }
          return label
        }
      }
    },
  },
  scales: {
    x: {
      grid: {
        display: false,
      },
      ticks: {
        color: '#9ca3af',
        font: {
          size: 11,
        },
      },
    },
    y: {
      grid: {
        color: '#1f2937',
      },
      ticks: {
        color: '#9ca3af',
        font: {
          size: 11,
        },
        callback: function(value: any) {
          return new Intl.NumberFormat('es-ES', {
            style: 'currency',
            currency: 'EUR',
            minimumFractionDigits: 0,
            maximumFractionDigits: 0,
          }).format(value)
        }
      },
    },
  },
}

// Recharts theme configuration
export const rechartsTheme = {
  backgroundColor: '#141414',
  textColor: '#9ca3af',
  gridColor: '#1f2937',
  tooltipBackground: '#1f1f1f',
  colors: [
    '#3b82f6', // primary
    '#10b981', // green
    '#f59e0b', // yellow
    '#ef4444', // red
    '#8b5cf6', // purple
    '#ec4899', // pink
    '#06b6d4', // cyan
    '#6366f1', // indigo
  ],
}

// Common chart colors
export const chartColors = {
  income: '#10b981',
  expense: '#ef4444',
  savings: '#3b82f6',
  investment: '#8b5cf6',
  goal: '#f59e0b',
}

// Category colors for pie/donut charts
export const categoryColors = CATEGORY_COLORS

// Gradient definitions for charts
export const chartGradients = {
  primary: {
    start: 'rgba(59, 130, 246, 0.5)',
    end: 'rgba(59, 130, 246, 0)',
  },
  success: {
    start: 'rgba(16, 185, 129, 0.5)',
    end: 'rgba(16, 185, 129, 0)',
  },
  danger: {
    start: 'rgba(239, 68, 68, 0.5)',
    end: 'rgba(239, 68, 68, 0)',
  },
}

// Animation configuration
export const chartAnimation = {
  duration: 750,
  easing: 'ease-in-out' as const,
}

// Recharts common props
export const commonRechartsProps = {
  margin: { top: 5, right: 5, left: 5, bottom: 5 },
}

// Format functions for charts
export const chartFormatters = {
  currency: (value: number) => 
    new Intl.NumberFormat('es-ES', {
      style: 'currency',
      currency: 'EUR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value),
    
  percentage: (value: number) => `${value.toFixed(1)}%`,
  
  number: (value: number) =>
    new Intl.NumberFormat('es-ES', {
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value),
    
  shortNumber: (value: number) => {
    if (value >= 1000000) {
      return `${(value / 1000000).toFixed(1)}M`
    } else if (value >= 1000) {
      return `${(value / 1000).toFixed(1)}k`
    }
    return value.toString()
  }
}