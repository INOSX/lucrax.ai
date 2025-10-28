import React, { useState } from 'react'
import { 
  BarChart3, 
  TrendingUp, 
  PieChart, 
  Zap, 
  Activity,
  Settings,
  Download,
  Maximize2
} from 'lucide-react'
import Card from '../ui/Card'
import Button from '../ui/Button'
import LineChart from './charts/LineChart'
import BarChart from './charts/BarChart'
import PieChartComponent from './charts/PieChart'
import ScatterChart from './charts/ScatterChart'
import AreaChart from './charts/AreaChart'

const ChartContainer = ({ 
  data, 
  title = 'Gráfico',
  chartType = 'line',
  xColumn,
  yColumn,
  onChartTypeChange,
  onColumnChange,
  availableColumns = [],
  height = 300
}) => {
  const [isFullscreen, setIsFullscreen] = useState(false)
  const [showSettings, setShowSettings] = useState(false)

  const chartTypes = [
    { id: 'line', name: 'Linha', icon: TrendingUp },
    { id: 'bar', name: 'Barras', icon: BarChart3 },
    { id: 'pie', name: 'Pizza', icon: PieChart },
    { id: 'scatter', name: 'Dispersão', icon: Zap },
    { id: 'area', name: 'Área', icon: Activity }
  ]

  const renderChart = () => {
    if (!data || data.length === 0) {
      return (
        <div className="h-64 flex items-center justify-center text-gray-500">
          <div className="text-center">
            <BarChart3 className="h-12 w-12 text-gray-400 mx-auto mb-2" />
            <p>Nenhum dado disponível</p>
            <p className="text-sm">Carregue dados para visualizar gráficos</p>
          </div>
        </div>
      )
    }

    const commonProps = {
      data,
      xColumn,
      yColumn,
      title,
      height: isFullscreen ? 500 : height
    }

    switch (chartType) {
      case 'line':
        return <LineChart {...commonProps} />
      case 'bar':
        return <BarChart {...commonProps} />
      case 'pie':
        return <PieChartComponent {...commonProps} labelColumn={xColumn} valueColumn={yColumn} />
      case 'scatter':
        return <ScatterChart {...commonProps} />
      case 'area':
        return <AreaChart {...commonProps} />
      default:
        return <LineChart {...commonProps} />
    }
  }

  const handleDownload = () => {
    // Implementar download do gráfico
    console.log('Download do gráfico')
  }

  const containerClasses = isFullscreen 
    ? 'fixed inset-0 z-50 bg-white p-6' 
    : ''

  return (
    <div className={containerClasses}>
      <Card className="h-full">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-3">
            <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
            {onChartTypeChange && (
              <div className="flex space-x-1">
                {chartTypes.map((type) => {
                  const Icon = type.icon
                  return (
                    <button
                      key={type.id}
                      onClick={() => onChartTypeChange(type.id)}
                      className={`p-2 rounded-lg transition-colors ${
                        chartType === type.id
                          ? 'bg-primary-100 text-primary-700'
                          : 'text-gray-500 hover:bg-gray-100'
                      }`}
                      title={type.name}
                    >
                      <Icon className="h-4 w-4" />
                    </button>
                  )
                })}
              </div>
            )}
          </div>
          
          <div className="flex items-center space-x-2">
            {onColumnChange && availableColumns.length > 0 && (
              <button
                onClick={() => setShowSettings(!showSettings)}
                className="p-2 text-gray-500 hover:bg-gray-100 rounded-lg transition-colors"
                title="Configurações"
              >
                <Settings className="h-4 w-4" />
              </button>
            )}
            
            <button
              onClick={handleDownload}
              className="p-2 text-gray-500 hover:bg-gray-100 rounded-lg transition-colors"
              title="Download"
            >
              <Download className="h-4 w-4" />
            </button>
            
            <button
              onClick={() => setIsFullscreen(!isFullscreen)}
              className="p-2 text-gray-500 hover:bg-gray-100 rounded-lg transition-colors"
              title={isFullscreen ? 'Sair da tela cheia' : 'Tela cheia'}
            >
              <Maximize2 className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* Settings Panel */}
        {showSettings && onColumnChange && availableColumns.length > 0 && (
          <div className="mb-4 p-4 bg-gray-50 rounded-lg">
            <h4 className="text-sm font-medium text-gray-900 mb-3">Configurações do Gráfico</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Eixo X
                </label>
                <select
                  value={xColumn || ''}
                  onChange={(e) => onColumnChange('x', e.target.value)}
                  className="input text-sm"
                >
                  <option value="">Selecione uma coluna</option>
                  {availableColumns.map((column) => (
                    <option key={column} value={column}>
                      {column}
                    </option>
                  ))}
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Eixo Y
                </label>
                <select
                  value={yColumn || ''}
                  onChange={(e) => onColumnChange('y', e.target.value)}
                  className="input text-sm"
                >
                  <option value="">Selecione uma coluna</option>
                  {availableColumns.map((column) => (
                    <option key={column} value={column}>
                      {column}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>
        )}

        {/* Chart */}
        <div className="relative">
          {renderChart()}
        </div>

        {/* Footer */}
        <div className="mt-4 pt-4 border-t border-gray-200">
          <div className="flex items-center justify-between text-sm text-gray-500">
            <div>
              {data && data.length > 0 && (
                <span>{data.length} registros</span>
              )}
            </div>
            <div className="flex items-center space-x-4">
              <span>Tipo: {chartTypes.find(t => t.id === chartType)?.name}</span>
              {xColumn && yColumn && (
                <span>{xColumn} × {yColumn}</span>
              )}
            </div>
          </div>
        </div>
      </Card>
    </div>
  )
}

export default ChartContainer
