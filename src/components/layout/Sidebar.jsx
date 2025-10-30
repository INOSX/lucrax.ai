import React, { useEffect, useState } from 'react'
import { useAuth } from '../../contexts/AuthContext'
import { ClientService } from '../../services/clientService'
import { OpenAIService } from '../../services/openaiService'
import { supabase } from '../../services/supabase'
import { parseCSVString, detectColumnTypes, generateDataStats, cleanData, parseExcelFromArrayBuffer, base64ToUint8Array } from '../../services/dataParser'
import { 
  BarChart3, 
  Upload, 
  FileText, 
  Settings, 
  HelpCircle,
  TrendingUp,
  PieChart,
  BarChart2,
  Zap,
  Activity
} from 'lucide-react'

const Sidebar = ({ isOpen, onClose }) => {
  const { user } = useAuth()
  const [vectorFiles, setVectorFiles] = useState([])
  const [loadingFiles, setLoadingFiles] = useState(false)
  const [error, setError] = useState(null)
  const [selectKey, setSelectKey] = useState(0)
  const [refreshTick, setRefreshTick] = useState(0)

  useEffect(() => {
    let mounted = true
    async function loadFiles() {
      if (!user) return
      setLoadingFiles(true)
      setError(null)
      try {
        const cr = await ClientService.getClientByUserId(user.id)
        if (!cr.success) throw new Error('Cliente não encontrado')
        // 1) Buscar pela tabela data_sources_new (fonte de verdade do usuário)
        const { data: rows, error: rowsErr } = await supabase
          .from('data_sources_new')
          .select('filename')
          .eq('client_id', cr.client.id)
          .order('created_at', { ascending: false })
          .limit(100)
        if (rowsErr) throw rowsErr
        let items = (rows || [])
          .map(r => (r.filename || '').replace(/\.[^/.]+$/, '.csv'))
          .filter(name => !!name)
          .map(name => ({ id: name, name }))

        if (!mounted) return
        setVectorFiles(items)
        setSelectKey(prev => prev + 1)
      } catch (e) {
        if (!mounted) return
        setError(e.message)
        setVectorFiles([])
        setSelectKey(prev => prev + 1)
      } finally {
        if (mounted) setLoadingFiles(false)
      }
    }
    loadFiles()
    return () => { mounted = false }
  }, [user, refreshTick])

  // Recarregar quando o upload concluir
  useEffect(() => {
    const onUpdated = () => setRefreshTick(t => t + 1)
    window.addEventListener('storage-updated', onUpdated)
    return () => window.removeEventListener('storage-updated', onUpdated)
  }, [])
  const menuItems = [
    {
      icon: BarChart3,
      label: 'Dashboard',
      href: '/',
      active: true
    },
    {
      icon: Upload,
      label: 'Upload de Dados',
      href: '/upload'
    },
    {
      icon: FileText,
      label: 'Meus Datasets',
      href: '/datasets'
    },
    // Seção dinâmica virá aqui
    {
      icon: TrendingUp,
      label: 'Análises',
      href: '/analyses'
    }
  ]

  const chartTypes = [
    {
      icon: BarChart2,
      label: 'Gráfico de Barras',
      type: 'bar'
    },
    {
      icon: TrendingUp,
      label: 'Gráfico de Linha',
      type: 'line'
    },
    {
      icon: PieChart,
      label: 'Gráfico de Pizza',
      type: 'pie'
    },
    {
      icon: Zap,
      label: 'Gráfico de Dispersão',
      type: 'scatter'
    },
    {
      icon: Activity,
      label: 'Gráfico de Área',
      type: 'area'
    }
  ]

  return (
    <>
      {/* Overlay for mobile */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden"
          onClick={onClose}
        />
      )}

      {/* Sidebar */}
      <div className={`
        fixed inset-y-0 left-0 z-50 w-64 bg-white border-r border-gray-200 transform transition-transform duration-300 ease-in-out
        ${isOpen ? 'translate-x-0' : '-translate-x-full'}
        lg:translate-x-0 lg:static lg:inset-0 lg:flex-shrink-0
      `}>
        <div className="flex flex-col h-full">
          {/* Logo */}
          <div className="p-6 border-b border-gray-200">
            <div className="flex items-center space-x-2">
              <div className="h-8 w-8 bg-gradient-primary rounded-lg flex items-center justify-center">
                <BarChart3 className="h-5 w-5 text-white" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-gray-900">Lucrax.ai</h2>
                <p className="text-xs text-gray-500">Dashboard</p>
              </div>
            </div>
          </div>

          {/* Navigation */}
          <nav className="flex-1 px-4 py-6 space-y-2">
            <div className="space-y-1">
              {menuItems.map((item) => {
                const Icon = item.icon
                return (
                  <a
                    key={item.label}
                    href={item.href}
                    className={`
                      flex items-center space-x-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors
                      ${item.active 
                        ? 'bg-primary-50 text-primary-700 border border-primary-200' 
                        : 'text-gray-700 hover:bg-gray-100'
                      }
                    `}
                  >
                    <Icon className="h-5 w-5" />
                    <span>{item.label}</span>
                  </a>
                )
              })}
            </div>

            {/* Selector de Arquivo do Vector Store */}
            <div className="mt-6">
              <h3 className="px-3 text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">
                Selecionar Arquivo (Vector Store)
              </h3>
              <div className="px-3">
                <select
                  key={selectKey}
                  className="w-full input text-sm"
                  disabled={loadingFiles}
                  onChange={async (e) => {
                    const fileName = e.target.value
                    if (!fileName) return
                    try {
                      const meta = vectorFiles.find(v => v.id === fileName)
                      if (!meta) {
                        setError('Arquivo não encontrado na lista atual. Clique em "Recarregar lista" e tente novamente.')
                        return
                      }
                      const clientResult = await ClientService.getClientByUserId(user.id)
                      if (!clientResult.success) throw new Error('Cliente não encontrado')
                      const folder = String(clientResult.client.id)
                      console.log(`Baixando arquivo do Storage: ${folder}/${meta.name}`)
                      let { data: fileObj, error: downloadError } = await supabase.storage.from('datasets').download(`${folder}/${meta.name}`)

                      // Tentar correspondência por case-insensitive quando 400/404
                      if (downloadError) {
                        console.warn('Download direto falhou, tentando correspondência flexível...', downloadError)
                        const listResp = await supabase.storage.from('datasets').list(folder)
                        const entries = listResp.data || []
                        const ci = (s) => (s || '').toLowerCase()
                        const target = ci(meta.name)
                        const match = entries.find(e => ci(e.name) === target)
                        if (match) {
                          const dl2 = await supabase.storage.from('datasets').download(`${folder}/${match.name}`)
                          if (dl2.error) throw new Error(`Erro ao baixar arquivo (match): ${dl2.error.message || 'desconhecido'}`)
                          fileObj = dl2.data
                        } else {
                          throw new Error('Arquivo não encontrado no Storage do cliente.')
                        }
                      }
                      
                      const text = await fileObj.text()
                      const parsed = await parseCSVString(text)
                      const cleaned = cleanData(parsed.data)
                      const columnTypes = detectColumnTypes(cleaned)
                      const stats = generateDataStats(cleaned)
                      const dataset = {
                        id: fileId,
                        name: meta?.name || 'Arquivo do Vector Store',
                        data: cleaned,
                        columns: parsed.columns,
                        row_count: parsed.rowCount,
                        columnTypes,
                        stats,
                        created_at: Date.now()
                      }
                      window.dispatchEvent(new CustomEvent('dataset-selected', { detail: dataset }))
                    } catch (err) {
                      console.error('Falha ao carregar arquivo do vector store:', err)
                    }
                  }}
                  defaultValue=""
                >
                  <option value="" disabled>
                    {loadingFiles ? 'Carregando...' : (error ? 'Erro ao carregar' : 'Escolha um arquivo')}
                  </option>
                  {vectorFiles.map(f => (
                    <option key={f.id} value={f.id}>{f.name}</option>
                  ))}
                </select>
                <div className="mt-2 text-xs text-gray-500">
                  <button
                    className="underline"
                    onClick={(e) => {
                      e.preventDefault()
                      // Recarregar lista manualmente
                      ;(async () => {
                        setLoadingFiles(true)
                        try {
                          const cr = await ClientService.getClientByUserId(user.id)
                          if (!cr.success) throw new Error('Cliente não encontrado')
                          const vs = cr.client.vectorstore_id
                          const list = await OpenAIService.listVectorstoreFiles(vs)
                          const folder = String(cr.client.id)
                          const { data: storageEntries } = await supabase.storage.from('datasets').list(folder)
                          const storageSet = new Set((storageEntries || []).map(e => (e.name || '').toLowerCase()))
                          const items = (list.data || [])
                            .map(f => ({ id: f.file_id || f.id, name: f.filename || f.id }))
                            .filter(f => storageSet.has((f.name || '').toLowerCase().replace(/\.[^/.]+$/, '.csv'))
                              || storageSet.has((f.name || '').toLowerCase()))
                          setVectorFiles(items)
                        } catch (err) {
                          setError(err.message)
                        } finally {
                          setLoadingFiles(false)
                        }
                      })()
                    }}
                  >Recarregar lista</button>
                </div>
              </div>
            </div>

            {/* Chart Types Section */}
            <div className="mt-8">
              <h3 className="px-3 text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">
                Tipos de Gráficos
              </h3>
              <div className="space-y-1">
                {chartTypes.map((chart) => {
                  const Icon = chart.icon
                  return (
                    <button
                      key={chart.type}
                      className="w-full flex items-center space-x-3 px-3 py-2 rounded-lg text-sm text-gray-700 hover:bg-gray-100 transition-colors"
                    >
                      <Icon className="h-4 w-4" />
                      <span>{chart.label}</span>
                    </button>
                  )
                })}
              </div>
            </div>
          </nav>

          {/* Bottom section */}
          <div className="p-4 border-t border-gray-200 space-y-2">
            <a
              href="/settings"
              className="flex items-center space-x-3 px-3 py-2 rounded-lg text-sm text-gray-700 hover:bg-gray-100 transition-colors"
            >
              <Settings className="h-5 w-5" />
              <span>Configurações</span>
            </a>
            <a
              href="/help"
              className="flex items-center space-x-3 px-3 py-2 rounded-lg text-sm text-gray-700 hover:bg-gray-100 transition-colors"
            >
              <HelpCircle className="h-5 w-5" />
              <span>Ajuda</span>
            </a>
          </div>
        </div>
      </div>
    </>
  )
}

export default Sidebar
