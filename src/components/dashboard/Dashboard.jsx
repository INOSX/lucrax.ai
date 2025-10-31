import React, { useEffect, useState } from 'react'
import { useLocation } from 'react-router-dom'
import { useAuth } from '../../contexts/AuthContext'
import { ClientService } from '../../services/clientService'
import { supabase } from '../../services/supabase'
import { parseCSVString, parseExcelFromArrayBuffer, cleanData, detectColumnTypes, generateDataStats } from '../../services/dataParser'
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
  const location = useLocation()
  const { user } = useAuth()

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

  // Carregar arquivos selecionados vindos da página Datasets
  useEffect(() => {
    const state = location.state
    if (!state || !state.selectedFiles || state._consumed) return

    let cancelled = false
    async function loadFromStorage() {
      try {
        // Obter client/bucket do usuário
        const cr = await ClientService.getClientByUserId(user?.id)
        if (!cr?.success) return
        const bucket = String(cr.client.id)

        for (const file of state.selectedFiles) {
          if (cancelled) break
          const filename = file.filename
          const { data: blob, error } = await supabase.storage.from(bucket).download(filename)
          if (error || !blob) continue

          let parsed
          // Tentar CSV primeiro
          if (filename.toLowerCase().endsWith('.csv')) {
            const text = await blob.text()
            parsed = await parseCSVString(text)
          } else if (filename.toLowerCase().endsWith('.xlsx') || filename.toLowerCase().endsWith('.xls')) {
            const ab = await blob.arrayBuffer()
            parsed = parseExcelFromArrayBuffer(ab)
          } else {
            // Se não reconhecido, tentar como CSV por padrão
            const text = await blob.text()
            parsed = await parseCSVString(text)
          }

          // Limpeza / tipos / stats
          const cleaned = cleanData(parsed.data)
          const columnTypes = detectColumnTypes(cleaned)
          const stats = generateDataStats(cleaned)

          handleDataLoaded({
            id: filename,
            name: filename,
            data: cleaned,
            columns: parsed.columns,
            columnTypes,
            stats,
            created_at: Date.now()
          })
        }
      } catch (e) {
        console.error('Erro ao carregar arquivos do Storage:', e)
      }
    }
    loadFromStorage()
    // Marcar state como consumido para evitar reprocessar ao navegar
    location.state._consumed = true
    return () => { cancelled = true }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location.state?.selectedFiles?.length, user?.id])

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

  // Função para escolher ícone baseado no nome da coluna
  const getIconForColumn = (columnName) => {
    const lowerName = columnName.toLowerCase()
    if (lowerName.includes('venda') || lowerName.includes('receita') || lowerName.includes('valor') || lowerName.includes('preço') || lowerName.includes('total')) {
      return DollarSign
    }
    if (lowerName.includes('cliente') || lowerName.includes('pessoa') || lowerName.includes('usuário')) {
      return Users
    }
    if (lowerName.includes('taxa') || lowerName.includes('percentual') || lowerName.includes('conversão') || lowerName.includes('crescimento')) {
      return TrendingUp
    }
    if (lowerName.includes('atividade') || lowerName.includes('ativo') || lowerName.includes('status')) {
      return Activity
    }
    // Padrão: TrendingUp para métricas gerais
    return TrendingUp
  }

  // Função para formatar valores baseado no tipo e magnitude
  const formatValue = (value, columnName, metricType) => {
    const lowerName = columnName.toLowerCase()
    
    // Se é um percentual (nome contém 'percent', 'taxa', etc.) ou o valor está entre 0 e 1
    if (lowerName.includes('percent') || lowerName.includes('taxa') || lowerName.includes('rate') || 
        (value > 0 && value < 1 && lowerName.includes('proporção'))) {
      return `${(value * 100).toFixed(2)}%`
    }
    
    // Se é um valor monetário
    if (lowerName.includes('valor') || lowerName.includes('preço') || lowerName.includes('custo') || 
        lowerName.includes('receita') || lowerName.includes('venda') || lowerName.includes('total') ||
        lowerName.includes('r$') || lowerName.includes('dinheiro')) {
      return new Intl.NumberFormat('pt-BR', {
        style: 'currency',
        currency: 'BRL'
      }).format(value)
    }
    
    // Números grandes: usar separador de milhares
    if (Math.abs(value) >= 1000) {
      return new Intl.NumberFormat('pt-BR', {
        minimumFractionDigits: 0,
        maximumFractionDigits: 2
      }).format(value)
    }
    
    // Números pequenos: manter decimais se necessário
    return value.toFixed(2)
  }

  // Gerar KPIs dinamicamente a partir dos dados
  const generateKPIsFromDataset = (dataset) => {
    if (!dataset || !dataset.data || !dataset.columnTypes || !dataset.stats) {
      return []
    }

    const { columnTypes, stats, columns } = dataset
    const { columnStats } = stats
    const kpis = []

    // Encontrar todas as colunas numéricas
    const numericColumns = columns.filter(col => columnTypes[col] === 'number' && columnStats[col]?.numeric)

    // Se não houver colunas numéricas, retornar array vazio ou criar um card genérico
    if (numericColumns.length === 0) {
      // Se houver dados mas sem colunas numéricas, criar um card de contagem
      if (dataset.data.length > 0) {
        return [{
          title: 'Total de Registros',
          value: dataset.data.length.toLocaleString('pt-BR'),
          change: null,
          changeType: null,
          icon: Activity
        }]
      }
      return []
    }

    // Gerar um KPI para cada coluna numérica disponível
    numericColumns.forEach(column => {
      const statsForColumn = columnStats[column].numeric
      if (!statsForColumn) return

      // Decidir qual métrica usar baseado no nome da coluna
      let metricValue
      let metricLabel = 'Total'
      
      const lowerName = column.toLowerCase()
      
      // Para colunas que sugerem totais (venda, receita, quantidade)
      if (lowerName.includes('total') || lowerName.includes('soma') || 
          lowerName.includes('venda') || lowerName.includes('receita') ||
          lowerName.includes('quantidade') || lowerName.includes('qtd')) {
        metricValue = statsForColumn.sum
        metricLabel = 'Total'
      }
      // Para colunas que sugerem médias (taxa, percentual, média)
      else if (lowerName.includes('média') || lowerName.includes('media') || 
               lowerName.includes('taxa') || lowerName.includes('percentual') ||
               lowerName.includes('rate') || lowerName.includes('avg')) {
        metricValue = statsForColumn.avg
        metricLabel = 'Média'
      }
      // Para colunas de preço ou valor unitário
      else if (lowerName.includes('preço') || lowerName.includes('preco') || 
               lowerName.includes('valor') || lowerName.includes('unitário')) {
        metricValue = statsForColumn.avg
        metricLabel = 'Média'
      }
      // Padrão: usar soma se for um valor grande, média caso contrário
      else {
        // Se a soma for muito grande, usar média
        if (Math.abs(statsForColumn.sum) > 10000) {
          metricValue = statsForColumn.avg
          metricLabel = 'Média'
        } else {
          metricValue = statsForColumn.sum
          metricLabel = 'Total'
        }
      }

      kpis.push({
        title: column,
        value: formatValue(metricValue, column, metricLabel),
        change: null, // Por enquanto sem mudança percentual (pode ser adicionada depois com dados históricos)
        changeType: null,
        icon: getIconForColumn(column),
        rawValue: metricValue,
        metricType: metricLabel
      })
    })

    return kpis
  }

  // Gerar KPIs dinâmicos baseados no dataset selecionado
  const kpis = selectedDataset ? generateKPIsFromDataset(selectedDataset) : []

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

      {/* KPIs Grid - Dinâmico baseado nos dados */}
      {kpis.length > 0 ? (
        <div className={`grid grid-cols-1 md:grid-cols-2 ${kpis.length === 3 ? 'lg:grid-cols-3' : ''} ${kpis.length >= 4 ? 'lg:grid-cols-4' : ''} gap-6`}>
          {kpis.map((kpi, index) => {
            const Icon = kpi.icon
            return (
              <Card key={index} className="relative overflow-hidden">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-600">{kpi.title}</p>
                    <p className="text-2xl font-bold text-gray-900 mt-1">{kpi.value}</p>
                    {kpi.change !== null && kpi.changeType !== null && (
                      <div className="flex items-center mt-2">
                        <span className={`text-sm font-medium ${
                          kpi.changeType === 'positive' ? 'text-green-600' : 'text-red-600'
                        }`}>
                          {kpi.change}
                        </span>
                        <span className="text-sm text-gray-500 ml-1">vs mês anterior</span>
                      </div>
                    )}
                  </div>
                  <div className="h-12 w-12 bg-gradient-primary rounded-lg flex items-center justify-center flex-shrink-0 ml-4">
                    <Icon className="h-6 w-6 text-white" />
                  </div>
                </div>
              </Card>
            )
          })}
        </div>
      ) : (
        <Card className="p-6 text-center">
          <p className="text-gray-500">Carregue dados para visualizar métricas</p>
        </Card>
      )}

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
