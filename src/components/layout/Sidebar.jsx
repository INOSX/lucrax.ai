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

  useEffect(() => {
    let mounted = true
    async function loadFiles() {
      if (!user) return
      setLoadingFiles(true)
      setError(null)
      try {
        const cr = await ClientService.getClientByUserId(user.id)
        if (!cr.success) throw new Error('Cliente não encontrado')
        const vs = cr.client.vectorstore_id
        if (!vs) throw new Error('Vectorstore não configurado')
        const list = await OpenAIService.listVectorstoreFiles(vs)

        // Evitar chamadas 400: por ora não buscamos metadados adicionais
        if (!mounted) return
        setVectorFiles((list.data || []).map(f => ({
          id: f.file_id || f.id,
          name: f.filename || f.id,
          storagePath: null
        })))
      } catch (e) {
        if (!mounted) return
        setError(e.message)
      } finally {
        if (mounted) setLoadingFiles(false)
      }
    }
    loadFiles()
    return () => { mounted = false }
  }, [user])
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
                  className="w-full input text-sm"
                  disabled={loadingFiles || !!error || vectorFiles.length === 0}
                  onChange={async (e) => {
                    const fileId = e.target.value
                    if (!fileId) return
                    try {
                      const meta = vectorFiles.find(v => v.id === fileId)
                      const clientResult = await ClientService.getClientByUserId(user.id)
                      if (!clientResult.success) throw new Error('Cliente não encontrado')
                      const folder = String(clientResult.client.id)
                      const baseCsv = (meta?.name || 'arquivo').replace(/\.[^/.]+$/, '.csv')

                      // Apenas Supabase Storage (sem tentar OpenAI)
                      console.log(`Tentando baixar: ${folder}/${baseCsv}`)
                      
                      // Primeiro, listar o que existe na pasta
                      const { data: entries, error: listError } = await supabase.storage.from('datasets').list(folder)
                      console.log('Arquivos disponíveis na pasta:', entries)
                      
                      if (listError) {
                        throw new Error(`Erro ao listar pasta: ${listError.message}`)
                      }
                      
                      if (!entries || entries.length === 0) {
                        throw new Error('Nenhum arquivo encontrado na pasta do cliente. Faça upload de um arquivo primeiro.')
                      }
                      
                      // Procurar por arquivo CSV que corresponda ao nome
                      const ci = (s) => (s || '').toLowerCase()
                      const match = entries.find(e => ci(e.name) === ci(baseCsv))
                      
                      if (!match) {
                        console.log('Arquivo exato não encontrado. Arquivos disponíveis:', entries.map(e => e.name))
                        throw new Error(`Arquivo ${baseCsv} não encontrado. Arquivos disponíveis: ${entries.map(e => e.name).join(', ')}`)
                      }
                      
                      console.log(`Baixando arquivo: ${folder}/${match.name}`)
                      const { data: fileObj, error: downloadError } = await supabase.storage.from('datasets').download(`${folder}/${match.name}`)
                      
                      if (downloadError) {
                        throw new Error(`Erro ao baixar arquivo: ${downloadError.message}`)
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
