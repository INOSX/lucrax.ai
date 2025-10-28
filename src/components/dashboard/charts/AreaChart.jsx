import React from 'react'
import { Line } from 'react-chartjs-2'
import { areaChartOptions, generateColors, formatNumber } from '../../../utils/chartConfig'

const AreaChart = ({ 
  data, 
  xColumn, 
  yColumn, 
  title = 'Gráfico de Área',
  height = 300,
  showLegend = true,
  showGrid = true,
  gradient = true
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
        backgroundColor: gradient 
          ? 'rgba(139, 92, 246, 0.2)'
          : 'rgba(139, 92, 246, 0.1)',
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
    ...areaChartOptions,
    plugins: {
      ...areaChartOptions.plugins,
      legend: {
        ...areaChartOptions.plugins.legend,
        display: showLegend
      },
      title: {
        ...areaChartOptions.plugins.title,
        text: title
      },
      tooltip: {
        ...areaChartOptions.plugins.tooltip,
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
      ...areaChartOptions.scales,
      x: {
        ...areaChartOptions.scales.x,
        grid: {
          display: showGrid
        }
      },
      y: {
        ...areaChartOptions.scales.y,
        grid: {
          display: showGrid,
          color: showGrid ? '#f3f4f6' : 'transparent'
        },
        ticks: {
          ...areaChartOptions.scales.y.ticks,
          callback: function(value) {
            return formatNumber(value)
          }
        }
      }
    },
    elements: {
      ...areaChartOptions.elements,
      point: {
        ...areaChartOptions.elements.point,
        radius: 4,
        hoverRadius: 6
      }
    }
  }

  return (
    <div style={{ height: `${height}px` }}>
      <Line data={chartData} options={options} />
    </div>
  )
}

export default AreaChart
