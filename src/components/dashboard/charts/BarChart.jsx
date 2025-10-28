import React from 'react'
import { Bar } from 'react-chartjs-2'
import { barChartOptions, generateColors, formatNumber } from '../../../utils/chartConfig'

const BarChart = ({ 
  data, 
  xColumn, 
  yColumn, 
  title = 'Gráfico de Barras',
  height = 300,
  showLegend = true,
  horizontal = false
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
        backgroundColor: generateColors(data.length, 'default'),
        borderColor: generateColors(data.length, 'default'),
        borderWidth: 1,
        borderRadius: 4,
        borderSkipped: false
      }
    ]
  }

  const options = {
    ...barChartOptions,
    indexAxis: horizontal ? 'y' : 'x',
    plugins: {
      ...barChartOptions.plugins,
      legend: {
        ...barChartOptions.plugins.legend,
        display: showLegend
      },
      title: {
        ...barChartOptions.plugins.title,
        text: title
      },
      tooltip: {
        ...barChartOptions.plugins.tooltip,
        callbacks: {
          label: function(context) {
            const label = context.dataset.label || ''
            const value = context.parsed[horizontal ? 'x' : 'y']
            return `${label}: ${formatNumber(value)}`
          }
        }
      }
    },
    scales: {
      ...barChartOptions.scales,
      x: {
        ...barChartOptions.scales.x,
        grid: {
          display: !horizontal
        },
        ticks: {
          ...barChartOptions.scales.x.ticks,
          maxRotation: horizontal ? 0 : 45,
          minRotation: horizontal ? 0 : 0
        }
      },
      y: {
        ...barChartOptions.scales.y,
        grid: {
          display: horizontal
        },
        ticks: {
          ...barChartOptions.scales.y.ticks,
          callback: function(value) {
            return formatNumber(value)
          }
        }
      }
    }
  }

  return (
    <div style={{ height: `${height}px` }}>
      <Bar data={chartData} options={options} />
    </div>
  )
}

export default BarChart
