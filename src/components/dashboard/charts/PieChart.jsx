import React from 'react'
import { Pie } from 'react-chartjs-2'
import { pieChartOptions, generateColors, formatNumber } from '../../../utils/chartConfig'

const PieChart = ({ 
  data, 
  labelColumn, 
  valueColumn, 
  title = 'Gráfico de Pizza',
  height = 300,
  showLegend = true,
  showPercentage = true
}) => {
  if (!data || data.length === 0) {
    return (
      <div className="h-64 flex items-center justify-center text-gray-500">
        <p>Nenhum dado disponível</p>
      </div>
    )
  }

  // Agrupar dados por categoria
  const groupedData = data.reduce((acc, item) => {
    const label = item[labelColumn] || 'Sem categoria'
    const value = parseFloat(item[valueColumn]) || 0
    
    if (acc[label]) {
      acc[label] += value
    } else {
      acc[label] = value
    }
    
    return acc
  }, {})

  const labels = Object.keys(groupedData)
  const values = Object.values(groupedData)
  const total = values.reduce((sum, value) => sum + value, 0)

  // Preparar dados para o gráfico
  const chartData = {
    labels,
    datasets: [
      {
        data: values,
        backgroundColor: generateColors(labels.length, 'default'),
        borderColor: '#ffffff',
        borderWidth: 2,
        hoverOffset: 4
      }
    ]
  }

  const options = {
    ...pieChartOptions,
    plugins: {
      ...pieChartOptions.plugins,
      legend: {
        ...pieChartOptions.plugins.legend,
        display: showLegend,
        labels: {
          ...pieChartOptions.plugins.legend.labels,
          generateLabels: function(chart) {
            const data = chart.data
            if (data.labels.length && data.datasets.length) {
              return data.labels.map((label, i) => {
                const value = data.datasets[0].data[i]
                const percentage = showPercentage ? ` (${((value / total) * 100).toFixed(1)}%)` : ''
                return {
                  text: `${label}: ${formatNumber(value)}${percentage}`,
                  fillStyle: data.datasets[0].backgroundColor[i],
                  strokeStyle: data.datasets[0].borderColor,
                  lineWidth: data.datasets[0].borderWidth,
                  hidden: false,
                  index: i
                }
              })
            }
            return []
          }
        }
      },
      title: {
        ...pieChartOptions.plugins.title,
        text: title
      },
      tooltip: {
        ...pieChartOptions.plugins.tooltip,
        callbacks: {
          label: function(context) {
            const label = context.label || ''
            const value = context.parsed
            const percentage = ((value / total) * 100).toFixed(1)
            return `${label}: ${formatNumber(value)} (${percentage}%)`
          }
        }
      }
    }
  }

  return (
    <div style={{ height: `${height}px` }}>
      <Pie data={chartData} options={options} />
    </div>
  )
}

export default PieChart
