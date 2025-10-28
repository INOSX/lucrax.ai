import React from 'react'
import { Line } from 'react-chartjs-2'
import { lineChartOptions, generateColors, formatNumber } from '../../../utils/chartConfig'

const LineChart = ({ 
  data, 
  xColumn, 
  yColumn, 
  title = 'Gráfico de Linha',
  height = 300,
  showLegend = true,
  showGrid = true
}) => {
  if (!data || data.length === 0) {
    return (
      <div className="h-64 flex items-center justify-center text-gray-500">
        <p>Nenhum dado disponível</p>
      </div>
    )
  }

  // Preparar dados para o gráfico
  const chartData = {
    labels: data.map(item => item[xColumn] || ''),
    datasets: [
      {
        label: yColumn,
        data: data.map(item => item[yColumn] || 0),
        borderColor: '#8b5cf6',
        backgroundColor: 'rgba(139, 92, 246, 0.1)',
        borderWidth: 2,
        fill: true,
        tension: 0.4,
        pointBackgroundColor: '#8b5cf6',
        pointBorderColor: '#ffffff',
        pointBorderWidth: 2,
        pointRadius: 4,
        pointHoverRadius: 6
      }
    ]
  }

  const options = {
    ...lineChartOptions,
    plugins: {
      ...lineChartOptions.plugins,
      legend: {
        ...lineChartOptions.plugins.legend,
        display: showLegend
      },
      title: {
        ...lineChartOptions.plugins.title,
        text: title
      },
      tooltip: {
        ...lineChartOptions.plugins.tooltip,
        callbacks: {
          label: function(context) {
            const label = context.dataset.label || ''
            const value = context.parsed.y
            return `${label}: ${formatNumber(value)}`
          }
        }
      }
    },
    scales: {
      ...lineChartOptions.scales,
      x: {
        ...lineChartOptions.scales.x,
        grid: {
          display: showGrid
        }
      },
      y: {
        ...lineChartOptions.scales.y,
        grid: {
          display: showGrid,
          color: showGrid ? '#f3f4f6' : 'transparent'
        },
        ticks: {
          ...lineChartOptions.scales.y.ticks,
          callback: function(value) {
            return formatNumber(value)
          }
        }
      }
    }
  }

  return (
    <div style={{ height: `${height}px` }}>
      <Line data={chartData} options={options} />
    </div>
  )
}

export default LineChart
