import React from 'react'
import { Scatter } from 'react-chartjs-2'
import { scatterChartOptions, generateColors, formatNumber } from '../../../utils/chartConfig'

const ScatterChart = ({ 
  data, 
  xColumn, 
  yColumn, 
  title = 'Gráfico de Dispersão',
  height = 300,
  showLegend = true,
  showTrendline = false
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
    datasets: [
      {
        label: `${xColumn} vs ${yColumn}`,
        data: data.map(item => ({
          x: parseFloat(item[xColumn]) || 0,
          y: parseFloat(item[yColumn]) || 0
        })),
        backgroundColor: 'rgba(139, 92, 246, 0.6)',
        borderColor: '#8b5cf6',
        borderWidth: 2,
        pointRadius: 6,
        pointHoverRadius: 8,
        pointBackgroundColor: '#8b5cf6',
        pointBorderColor: '#ffffff',
        pointBorderWidth: 2
      }
    ]
  }

  // Adicionar linha de tendência se solicitado
  if (showTrendline && data.length > 1) {
    const xValues = data.map(item => parseFloat(item[xColumn]) || 0)
    const yValues = data.map(item => parseFloat(item[yColumn]) || 0)
    
    // Cálculo simples da linha de tendência (regressão linear)
    const n = data.length
    const sumX = xValues.reduce((a, b) => a + b, 0)
    const sumY = yValues.reduce((a, b) => a + b, 0)
    const sumXY = xValues.reduce((sum, x, i) => sum + x * yValues[i], 0)
    const sumXX = xValues.reduce((sum, x) => sum + x * x, 0)
    
    const slope = (n * sumXY - sumX * sumY) / (n * sumXX - sumX * sumX)
    const intercept = (sumY - slope * sumX) / n
    
    const minX = Math.min(...xValues)
    const maxX = Math.max(...xValues)
    
    chartData.datasets.push({
      label: 'Linha de Tendência',
      data: [
        { x: minX, y: slope * minX + intercept },
        { x: maxX, y: slope * maxX + intercept }
      ],
      type: 'line',
      borderColor: '#ef4444',
      backgroundColor: 'transparent',
      borderWidth: 2,
      borderDash: [5, 5],
      pointRadius: 0,
      fill: false
    })
  }

  const options = {
    ...scatterChartOptions,
    plugins: {
      ...scatterChartOptions.plugins,
      legend: {
        ...scatterChartOptions.plugins.legend,
        display: showLegend
      },
      title: {
        ...scatterChartOptions.plugins.title,
        text: title
      },
      tooltip: {
        ...scatterChartOptions.plugins.tooltip,
        callbacks: {
          label: function(context) {
            if (context.datasetIndex === 0) {
              return `${xColumn}: ${formatNumber(context.parsed.x)}, ${yColumn}: ${formatNumber(context.parsed.y)}`
            }
            return context.dataset.label
          }
        }
      }
    },
    scales: {
      x: {
        ...scatterChartOptions.scales.x,
        title: {
          display: true,
          text: xColumn,
          font: {
            size: 12,
            weight: 'bold'
          }
        },
        ticks: {
          ...scatterChartOptions.scales.x.ticks,
          callback: function(value) {
            return formatNumber(value)
          }
        }
      },
      y: {
        ...scatterChartOptions.scales.y,
        title: {
          display: true,
          text: yColumn,
          font: {
            size: 12,
            weight: 'bold'
          }
        },
        ticks: {
          ...scatterChartOptions.scales.y.ticks,
          callback: function(value) {
            return formatNumber(value)
          }
        }
      }
    }
  }

  return (
    <div style={{ height: `${height}px` }}>
      <Scatter data={chartData} options={options} />
    </div>
  )
}

export default ScatterChart
