import React, { useEffect, useState } from 'react'
import Card from '../ui/Card'
import FileUpload from './FileUpload'
import ChartContainer from './ChartContainer'
import { 
  TrendingUp, 
  Users, 
  DollarSign, 
  Activity,
  Upload,
  BarChart3,
  X
} from 'lucide-react'

const Dashboard = () => {
  const [showFileUpload, setShowFileUpload] = useState(false)
  const [datasets, setDatasets] = useState([])
  const [selectedDataset, setSelectedDataset] = useState(null)
  const [chartType, setChartType] = useState('line')
  const [xColumn, setXColumn] = useState('')
  const [yColumn, setYColumn] = useState('')

  const handleDataLoaded = (newDataset) => {
    setDatasets(prev => [newDataset, ...prev])
    setSelectedDataset(newDataset)
    // Heurística: eixo X categórico, eixo Y numérico
    if (newDataset.columns && newDataset.columns.length >= 1) {
      const columnTypes = newDataset.columnTypes || {}
      const stats = newDataset.stats || {}
      const columnStats = stats.columnStats || {}
      const totalRows = stats.totalRows || (newDataset.data ? newDataset.data.length : 0)

      const isNumeric = (col) => columnTypes[col] === 'number'
      const isString = (col) => columnTypes[col] === 'string'

      // Preferir coluna categórica com número de categorias razoável
      const candidateCategoricals = (newDataset.columns || []).filter(col => isString(col))
        .sort((a, b) => {
          const ua = (columnStats[a]?.uniqueValues ?? Infinity)
          const ub = (columnStats[b]?.uniqueValues ?? Infinity)
          return ua - ub
        })
      const categoricalThreshold = Math.max(2, Math.min(20, Math.floor(totalRows / 2)))
      const xCandidate = candidateCategoricals.find(col => {
        const u = columnStats[col]?.uniqueValues
        return typeof u === 'number' ? u <= categoricalThreshold : true
      }) || candidateCategoricals[0]

      const yCandidate = (newDataset.columns || []).find(col => isNumeric(col))

      if (xCandidate) setXColumn(xCandidate)
      if (yCandidate) setYColumn(yCandidate)
      // Fallbacks
      if (!xCandidate && newDataset.columns.length >= 1) setXColumn(newDataset.columns[0])
      if (!yCandidate && newDataset.columns.length >= 2) setYColumn(newDataset.columns[1])
    }
  }

  // Ouvir seleção de dataset vinda da Sidebar (vector store)
  useEffect(() => {
    const handler = (e) => {
      const ds = e.detail
      handleDataLoaded({
        ...ds,
        rowCount: ds.row_count,
        columns: ds.columns
      })
    }
    window.addEventListener('dataset-selected', handler)
    return () => window.removeEventListener('dataset-selected', handler)
  }, [])

  // Abrir modal de upload quando a Sidebar indicar que o arquivo não existe no Storage
  useEffect(() => {
    const openHandler = () => setShowFileUpload(true)
    window.addEventListener('open-upload', openHandler)
    return () => window.removeEventListener('open-upload', openHandler)
  }, [])

  const handleChartTypeChange = (type) => {
    setChartType(type)
  }

  const handleColumnChange = (axis, column) => {
    if (axis === 'x') {
      setXColumn(column)
    } else {
      setYColumn(column)
    }
  }

  // Dados mockados para demonstração
  const kpis = [
    {
      title: 'Total de Vendas',
      value: 'R$ 45.231',
      change: '+12.5%',
      changeType: 'positive',
      icon: DollarSign
    },
    {
      title: 'Novos Clientes',
      value: '1.234',
      change: '+8.2%',
      changeType: 'positive',
      icon: Users
    },
    {
      title: 'Taxa de Conversão',
      value: '3.24%',
      change: '+2.1%',
      changeType: 'positive',
      icon: TrendingUp
    },
    {
      title: 'Atividade',
      value: '89.2%',
      change: '-1.2%',
      changeType: 'negative',
      icon: Activity
    }
  ]

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
          <p className="text-gray-600">Visão geral dos seus dados e análises</p>
        </div>
        <div className="flex space-x-3">
          <button 
            onClick={() => setShowFileUpload(true)}
            className="btn-secondary flex items-center space-x-2"
          >
            <Upload className="h-4 w-4" />
            <span>Upload de Dados</span>
          </button>
          <button className="btn-primary flex items-center space-x-2">
            <BarChart3 className="h-4 w-4" />
            <span>Nova Análise</span>
          </button>
        </div>
      </div>

      {/* KPIs Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {kpis.map((kpi, index) => {
          const Icon = kpi.icon
          return (
            <Card key={index} className="relative overflow-hidden">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">{kpi.title}</p>
                  <p className="text-2xl font-bold text-gray-900 mt-1">{kpi.value}</p>
                  <div className="flex items-center mt-2">
                    <span className={`text-sm font-medium ${
                      kpi.changeType === 'positive' ? 'text-green-600' : 'text-red-600'
                    }`}>
                      {kpi.change}
                    </span>
                    <span className="text-sm text-gray-500 ml-1">vs mês anterior</span>
                  </div>
                </div>
                <div className="h-12 w-12 bg-gradient-primary rounded-lg flex items-center justify-center">
                  <Icon className="h-6 w-6 text-white" />
                </div>
              </div>
            </Card>
          )
        })}
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Main Chart */}
        <div className="lg:col-span-2">
          <ChartContainer
            data={selectedDataset?.data || []}
            title="Visualização de Dados"
            chartType={chartType}
            xColumn={xColumn}
            yColumn={yColumn}
            onChartTypeChange={handleChartTypeChange}
            onColumnChange={handleColumnChange}
            availableColumns={selectedDataset?.columns || []}
            height={400}
          />
        </div>

        {/* Dataset Selection */}
        {datasets.length > 0 && (
          <Card>
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Datasets Carregados</h3>
            <div className="space-y-2">
              {datasets.map((dataset, index) => (
                <button
                  key={dataset.id || index}
                  onClick={() => setSelectedDataset(dataset)}
                  className={`w-full text-left p-3 rounded-lg border transition-colors ${
                    selectedDataset?.id === dataset.id
                      ? 'border-primary-300 bg-primary-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium text-gray-900">{dataset.name || `Dataset ${index + 1}`}</p>
                      <p className="text-sm text-gray-600">
                        {dataset.row_count || dataset.data?.length || 0} registros • {dataset.columns?.length || 0} colunas
                      </p>
                    </div>
                    <div className="text-xs text-gray-500">
                      {new Date(dataset.created_at).toLocaleDateString('pt-BR')}
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </Card>
        )}
      </div>

      {/* Recent Data Table */}
      <Card>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900">Dados Recentes</h3>
          <button className="text-sm text-primary-600 hover:text-primary-700">
            Ver todos
          </button>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Data
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Categoria
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Valor
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              <tr>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  2024-01-15
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  Vendas
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  R$ 1.234,56
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-green-100 text-green-800">
                    Ativo
                  </span>
                </td>
              </tr>
              <tr>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  2024-01-14
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  Marketing
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  R$ 987,65
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-yellow-100 text-yellow-800">
                    Pendente
                  </span>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </Card>

      {/* File Upload Modal */}
      {showFileUpload && (
        <FileUpload
          onDataLoaded={handleDataLoaded}
          onClose={() => setShowFileUpload(false)}
        />
      )}
    </div>
  )
}

export default Dashboard
