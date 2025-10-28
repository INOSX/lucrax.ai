import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  Filler
} from 'chart.js'

// Registrar componentes do Chart.js
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  Filler
)

// Cores padrão do tema
export const chartColors = {
  primary: '#8b5cf6',
  secondary: '#3b82f6',
  success: '#10b981',
  warning: '#f59e0b',
  danger: '#ef4444',
  info: '#06b6d4',
  purple: '#a855f7',
  blue: '#2563eb',
  green: '#059669',
  yellow: '#d97706',
  red: '#dc2626',
  indigo: '#4f46e5',
  pink: '#db2777',
  gray: '#6b7280'
}

// Paleta de cores para gráficos
export const colorPalettes = {
  default: [
    chartColors.primary,
    chartColors.secondary,
    chartColors.success,
    chartColors.warning,
    chartColors.danger,
    chartColors.info
  ],
  gradient: [
    '#8b5cf6',
    '#3b82f6',
    '#06b6d4',
    '#10b981',
    '#f59e0b',
    '#ef4444'
  ],
  pastel: [
    '#a78bfa',
    '#60a5fa',
    '#34d399',
    '#fbbf24',
    '#f87171',
    '#22d3ee'
  ]
}

// Configurações padrão para todos os gráficos
export const defaultChartOptions = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: {
      position: 'top',
      labels: {
        usePointStyle: true,
        padding: 20,
        font: {
          size: 12,
          family: 'Inter, system-ui, sans-serif'
        }
      }
    },
    title: {
      display: true,
      font: {
        size: 16,
        weight: 'bold',
        family: 'Inter, system-ui, sans-serif'
      },
      color: '#1f2937'
    },
    tooltip: {
      backgroundColor: 'rgba(0, 0, 0, 0.8)',
      titleColor: '#fff',
      bodyColor: '#fff',
      borderColor: '#374151',
      borderWidth: 1,
      cornerRadius: 8,
      displayColors: true,
      titleFont: {
        size: 13,
        weight: 'bold'
      },
      bodyFont: {
        size: 12
      },
      padding: 12
    }
  },
  scales: {
    x: {
      grid: {
        display: false
      },
      ticks: {
        font: {
          size: 11,
          family: 'Inter, system-ui, sans-serif'
        },
        color: '#6b7280'
      }
    },
    y: {
      grid: {
        color: '#f3f4f6',
        drawBorder: false
      },
      ticks: {
        font: {
          size: 11,
          family: 'Inter, system-ui, sans-serif'
        },
        color: '#6b7280'
      }
    }
  },
  elements: {
    point: {
      radius: 4,
      hoverRadius: 6
    },
    line: {
      tension: 0.4
    }
  }
}

// Configurações específicas para gráfico de linha
export const lineChartOptions = {
  ...defaultChartOptions,
  plugins: {
    ...defaultChartOptions.plugins,
    filler: {
      propagate: false
    }
  },
  interaction: {
    intersect: false,
    mode: 'index'
  }
}

// Configurações específicas para gráfico de barra
export const barChartOptions = {
  ...defaultChartOptions,
  scales: {
    ...defaultChartOptions.scales,
    x: {
      ...defaultChartOptions.scales.x,
      grid: {
        display: false
      }
    },
    y: {
      ...defaultChartOptions.scales.y,
      beginAtZero: true
    }
  }
}

// Configurações específicas para gráfico de pizza
export const pieChartOptions = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: {
      position: 'right',
      labels: {
        usePointStyle: true,
        padding: 20,
        font: {
          size: 12,
          family: 'Inter, system-ui, sans-serif'
        }
      }
    },
    title: {
      display: true,
      font: {
        size: 16,
        weight: 'bold',
        family: 'Inter, system-ui, sans-serif'
      },
      color: '#1f2937'
    },
    tooltip: {
      backgroundColor: 'rgba(0, 0, 0, 0.8)',
      titleColor: '#fff',
      bodyColor: '#fff',
      borderColor: '#374151',
      borderWidth: 1,
      cornerRadius: 8,
      displayColors: true,
      callbacks: {
        label: function(context) {
          const label = context.label || ''
          const value = context.parsed
          const total = context.dataset.data.reduce((a, b) => a + b, 0)
          const percentage = ((value / total) * 100).toFixed(1)
          return `${label}: ${value} (${percentage}%)`
        }
      }
    }
  }
}

// Configurações específicas para gráfico de dispersão
export const scatterChartOptions = {
  ...defaultChartOptions,
  scales: {
    x: {
      type: 'linear',
      position: 'bottom',
      grid: {
        color: '#f3f4f6',
        drawBorder: false
      },
      ticks: {
        font: {
          size: 11,
          family: 'Inter, system-ui, sans-serif'
        },
        color: '#6b7280'
      }
    },
    y: {
      grid: {
        color: '#f3f4f6',
        drawBorder: false
      },
      ticks: {
        font: {
          size: 11,
          family: 'Inter, system-ui, sans-serif'
        },
        color: '#6b7280'
      }
    }
  }
}

// Configurações específicas para gráfico de área
export const areaChartOptions = {
  ...lineChartOptions,
  plugins: {
    ...lineChartOptions.plugins,
    filler: {
      propagate: false
    }
  }
}

// Função para gerar cores baseadas em dados
export const generateColors = (dataLength, palette = 'default') => {
  const colors = colorPalettes[palette]
  const result = []
  
  for (let i = 0; i < dataLength; i++) {
    result.push(colors[i % colors.length])
  }
  
  return result
}

// Função para criar gradiente
export const createGradient = (ctx, color1, color2) => {
  const gradient = ctx.createLinearGradient(0, 0, 0, 400)
  gradient.addColorStop(0, color1)
  gradient.addColorStop(1, color2)
  return gradient
}

// Função para formatar números
export const formatNumber = (value, type = 'number') => {
  if (typeof value !== 'number') return value
  
  switch (type) {
    case 'currency':
      return new Intl.NumberFormat('pt-BR', {
        style: 'currency',
        currency: 'BRL'
      }).format(value)
    case 'percentage':
      return `${value.toFixed(1)}%`
    case 'decimal':
      return value.toFixed(2)
    default:
      return new Intl.NumberFormat('pt-BR').format(value)
  }
}

// Função para formatar datas
export const formatDate = (value, format = 'short') => {
  if (!value) return ''
  
  const date = new Date(value)
  if (isNaN(date.getTime())) return value
  
  switch (format) {
    case 'short':
      return date.toLocaleDateString('pt-BR')
    case 'long':
      return date.toLocaleDateString('pt-BR', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      })
    case 'time':
      return date.toLocaleTimeString('pt-BR')
    default:
      return date.toLocaleDateString('pt-BR')
  }
}
