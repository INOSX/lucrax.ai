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
        const folder = String(cr.client.id)
        // Listar DIRETAMENTE os arquivos do Supabase Storage do cliente
        const { data: storageEntries, error: stErr } = await supabase.storage.from('datasets').list(folder)
        if (stErr) throw stErr
        let items = (storageEntries || [])
          .filter(e => !!e.name && (e.name.endsWith('.csv') || e.name.endsWith('.xlsx') || e.name.endsWith('.xls')))
          .map(e => ({ id: e.name, name: e.name }))

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

            {/* Lista de Arquivos do Supabase */}
            <div className="mt-6">
              <h3 className="px-3 text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">
                Arquivos (Supabase)
              </h3>
              <div className="px-3 space-y-2">
                {loadingFiles && (
                  <div className="text-xs text-gray-500">Carregando...</div>
                )}
                {!loadingFiles && error && (
                  <div className="text-xs text-red-600">{error}</div>
                )}
                {!loadingFiles && !error && vectorFiles.length === 0 && (
                  <div className="text-xs text-gray-500">Nenhum arquivo encontrado no Supabase para este cliente.</div>
                )}
                {!loadingFiles && !error && vectorFiles.length > 0 && (
                  <ul className="divide-y divide-gray-200 border rounded-lg">
                    {vectorFiles.map(file => (
                      <li key={file.id} className="flex items-center justify-between px-3 py-2 text-sm">
                        <span className="truncate mr-2">{file.name}</span>
                        <button
                          className="text-primary-600 hover:text-primary-700"
                          onClick={async () => {
                            try {
                              const cr = await ClientService.getClientByUserId(user.id)
                              if (!cr.success) throw new Error('Cliente não encontrado')
                              const folder = String(cr.client.id)
                              let { data: fileObj, error: downloadError } = await supabase.storage.from('datasets').download(`${folder}/${file.name}`)
                              if (downloadError) {
                                const listResp = await supabase.storage.from('datasets').list(folder)
                                const entries = listResp.data || []
                                const ci = (s) => (s || '').toLowerCase()
                                const match = entries.find(e => ci(e.name) === ci(file.name))
                                if (!match) throw new Error('Arquivo não encontrado no Storage do cliente.')
                                const dl2 = await supabase.storage.from('datasets').download(`${folder}/${match.name}`)
                                if (dl2.error) throw new Error(dl2.error.message || 'Erro ao baixar do Storage')
                                fileObj = dl2.data
                              }
                              let parsed
                              if (file.name.toLowerCase().endsWith('.csv')) {
                                const text = await fileObj.text()
                                parsed = await parseCSVString(text)
                              } else {
                                const buf = await fileObj.arrayBuffer()
                                parsed = parseExcelFromArrayBuffer(buf)
                              }
                              const cleaned = cleanData(parsed.data)
                              const columnTypes = detectColumnTypes(cleaned)
                              const stats = generateDataStats(cleaned)
                              const dataset = {
                                id: file.id,
                                name: file.name,
                                data: cleaned,
                                columns: parsed.columns,
                                row_count: parsed.rowCount,
                                columnTypes,
                                stats,
                                created_at: Date.now()
                              }
                              window.dispatchEvent(new CustomEvent('dataset-selected', { detail: dataset }))
                            } catch (err) {
                              console.error('Falha ao carregar arquivo do Supabase Storage:', err)
                              setError(err.message)
                            }
                          }}
                        >Usar</button>
                      </li>
                    ))}
                  </ul>
                )}
                <div className="text-xs text-gray-500">
                  <button
                    className="underline"
                    onClick={(e) => {
                      e.preventDefault()
                      ;(async () => {
                        setLoadingFiles(true)
                        try {
                          const cr = await ClientService.getClientByUserId(user.id)
                          if (!cr.success) throw new Error('Cliente não encontrado')
                          const folder = String(cr.client.id)
                          const { data: storageEntries } = await supabase.storage.from('datasets').list(folder)
                          const items = (storageEntries || [])
                            .filter(e => !!e.name && (e.name.endsWith('.csv') || e.name.endsWith('.xlsx') || e.name.endsWith('.xls')))
                            .map(e => ({ id: e.name, name: e.name }))
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
