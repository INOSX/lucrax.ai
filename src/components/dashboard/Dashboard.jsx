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
  X,
  Minus
} from 'lucide-react'

const Dashboard = () => {
  const [showFileUpload, setShowFileUpload] = useState(false)
  const [datasets, setDatasets] = useState([])
  const [selectedDataset, setSelectedDataset] = useState(null)
  const [chartType, setChartType] = useState('line')
  const [xColumn, setXColumn] = useState('')
  const [yColumn, setYColumn] = useState('')
  const [hiddenKpiKeys, setHiddenKpiKeys] = useState(new Set())
  const [minimizedKpiKeys, setMinimizedKpiKeys] = useState(new Set())
  const location = useLocation()
  const { user } = useAuth()

  const handleDataLoaded = (newDataset) => {
    setDatasets(prev => [newDataset, ...prev])
    setSelectedDataset(newDataset)
    // Resetar visibilidade/estado dos cards ao carregar novos dados
    setHiddenKpiKeys(new Set())
    setMinimizedKpiKeys(new Set())
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

  const hideKpi = (key) => {
    setHiddenKpiKeys(prev => new Set(prev).add(key))
  }

  const toggleMinimizeKpi = (key) => {
    setMinimizedKpiKeys(prev => {
      const next = new Set(prev)
      if (next.has(key)) next.delete(key)
      else next.add(key)
      return next
    })
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

    // 1) Tentar gerar KPIs por categoria (ex.: Entrada, Saída) somando uma métrica numérica
    const candidateCategoricals = columns
      .filter(col => columnTypes[col] === 'string')
      .sort((a, b) => {
        const ua = (columnStats[a]?.uniqueValues ?? Number.MAX_SAFE_INTEGER)
        const ub = (columnStats[b]?.uniqueValues ?? Number.MAX_SAFE_INTEGER)
        return ua - ub
      })

    const categorical = candidateCategoricals.find(col => {
      const u = columnStats[col]?.uniqueValues
      return typeof u === 'number' && u >= 2 && u <= 10 // poucas categorias para cards
    })

    const numericColumns = columns.filter(col => columnTypes[col] === 'number' && columnStats[col]?.numeric)
    const measure = numericColumns[0]

    if (categorical && measure) {
      // Agregar soma por categoria
      const totalsByCategory = {}
      dataset.data.forEach(row => {
        const key = String(row[categorical] ?? '').trim()
        const valRaw = row[measure]
        const val = typeof valRaw === 'number' ? valRaw : Number(valRaw)
        if (!key || isNaN(val)) return
        totalsByCategory[key] = (totalsByCategory[key] || 0) + val
      })

      const entries = Object.entries(totalsByCategory)
        .sort((a, b) => b[1] - a[1])

      entries.forEach(([label, value]) => {
        // Ajuste de ícone quando o rótulo indica "entrada" ou "saída"
        const lower = label.toLowerCase()
        let Icon = getIconForColumn(measure)
        if (lower.includes('entrada')) Icon = TrendingUp
        if (lower.includes('saída') || lower.includes('saida')) Icon = Activity

        kpis.push({
          title: label, // título = valor categórico (ex.: Entrada, Saída)
          value: formatValue(value, measure, 'Total'),
          change: null,
          changeType: null,
          icon: Icon,
          rawValue: value,
          metricType: 'Total'
        })
      })

      if (kpis.length > 0) return kpis
    }

    // 2) Fallback: se não houver categórica adequada, mostrar KPIs por coluna numérica
    if (numericColumns.length === 0) {
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

    numericColumns.forEach(column => {
      const statsForColumn = columnStats[column].numeric
      if (!statsForColumn) return
      const metricValue = statsForColumn.sum
      kpis.push({
        title: column,
        value: formatValue(metricValue, column, 'Total'),
        change: null,
        changeType: null,
        icon: getIconForColumn(column),
        rawValue: metricValue,
        metricType: 'Total'
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
            const key = kpi.title || String(index)
            if (hiddenKpiKeys.has(key)) return null
            const minimized = minimizedKpiKeys.has(key)
            return (
              <Card key={key} className="relative overflow-hidden group">
                {/* Botões no canto superior direito (estilo Windows) */}
                <div className="absolute top-0 right-0 z-10 flex items-center bg-white rounded-bl-lg border-l border-b border-gray-200 shadow-sm">
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      toggleMinimizeKpi(key)
                    }}
                    className="p-1.5 text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-colors"
                    title={minimized ? 'Expandir' : 'Minimizar'}
                  >
                    <Minus className="h-3.5 w-3.5" />
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      hideKpi(key)
                    }}
                    className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 transition-colors"
                    title="Fechar"
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                </div>

                {/* Conteúdo do card */}
                <div className="flex items-center justify-between pr-2">
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-600 pr-16">{kpi.title}</p>
                    {!minimized && (
                      <>
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
                      </>
                    )}
                  </div>
                  <div className="h-12 w-12 bg-gradient-primary rounded-lg flex items-center justify-center flex-shrink-0">
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
