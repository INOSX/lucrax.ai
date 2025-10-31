import React, { useEffect, useState, useRef } from 'react'
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
  Activity,
  X,
  Minus,
  DollarSign,
  Mic,
  Loader2
} from 'lucide-react'
import Card from '../ui/Card'
import { AudioRecorder } from '../../services/audioHandler'
import { HeyGenStreamingService } from '../../services/heygenStreamingService'

const Sidebar = ({ isOpen, onClose }) => {
  const { user } = useAuth()
  const [vectorFiles, setVectorFiles] = useState([])
  const [loadingFiles, setLoadingFiles] = useState(false)
  const [error, setError] = useState(null)
  const [selectKey, setSelectKey] = useState(0)
  const [refreshTick, setRefreshTick] = useState(0)
  const [sidebarKpiHidden, setSidebarKpiHidden] = useState(false)
  const [sidebarKpiMinimized, setSidebarKpiMinimized] = useState(false)
  const [isRecording, setIsRecording] = useState(false)
  const [recordingStatus, setRecordingStatus] = useState('')
  const [audioRecorder, setAudioRecorder] = useState(null)
  const [streamingService] = useState(() => new HeyGenStreamingService())
  const [avatarConnected, setAvatarConnected] = useState(false)
  const videoRef = useRef(null)

  useEffect(() => {
    let mounted = true
    async function loadFiles() {
      if (!user) return
      setLoadingFiles(true)
      setError(null)
      try {
        const cr = await ClientService.getClientByUserId(user.id)
        if (!cr.success) throw new Error('Cliente não encontrado')
        const bucket = String(cr.client.id)
        // Listar DIRETAMENTE os arquivos do Supabase Storage do cliente (bucket por usuário)
        const { data: storageEntries, error: stErr } = await supabase.storage.from(bucket).list('')
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

  // Inicializar AudioRecorder e conectar avatar
  useEffect(() => {
    if (!audioRecorder) {
      const recorder = new AudioRecorder(
        (status) => {
          setRecordingStatus(status)
        },
        async (text) => {
          // Quando a transcrição for concluída, enviar texto para o avatar falar
          if (avatarConnected) {
            setRecordingStatus('Enviando para avatar...')
            try {
              await streamingService.sendText(text)
              setRecordingStatus('')
            } catch (error) {
              console.error('Error sending text to avatar:', error)
              setRecordingStatus('Erro: ' + error.message)
            }
          } else {
            setRecordingStatus('Avatar não conectado')
          }
        }
      )
      setAudioRecorder(recorder)
    }
  }, [audioRecorder, avatarConnected, streamingService])

  // Conectar avatar ao montar o componente
  // NOTA: A conexão deve ser iniciada após interação do usuário devido à política de AudioContext do navegador
  useEffect(() => {
    let mounted = true
    
    // Não conectar automaticamente - aguardar interação do usuário
    // A conexão será iniciada quando o usuário clicar no botão "Enviar Áudio" pela primeira vez
    
    return () => {
      mounted = false
      if (avatarConnected) {
        streamingService.disconnect()
      }
    }
  }, [avatarConnected, streamingService])

  // Função para inicializar o avatar (chamada na primeira interação do usuário)
  const initializeAvatar = async () => {
    if (!videoRef.current) return
    
    if (avatarConnected) {
      // Avatar já está conectado
      return
    }

    try {
      setRecordingStatus('Conectando avatar...')
      // Passar videoElement diretamente para createSession para configurar listeners ANTES da sessão
      const sessionData = await streamingService.createSession(null, videoRef.current)
      // Se chegou aqui, o stream está pronto
      setAvatarConnected(true)
      setRecordingStatus('Avatar conectado!')
      setTimeout(() => setRecordingStatus(''), 2000)
    } catch (error) {
      console.error('Error connecting avatar:', error)
      setRecordingStatus('Erro ao conectar: ' + error.message)
      setTimeout(() => setRecordingStatus(''), 3000)
    }
  }

  const toggleRecording = async () => {
    if (!audioRecorder) return

    // Se o avatar não estiver conectado, inicializar primeiro
    if (!avatarConnected) {
      await initializeAvatar()
      // Aguardar um pouco para o avatar se conectar
      await new Promise(resolve => setTimeout(resolve, 1000))
    }

    if (!isRecording) {
      setIsRecording(true)
      await audioRecorder.startRecording()
    } else {
      setIsRecording(false)
      audioRecorder.stopRecording()
    }
  }
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

            {/* Card KPI abaixo de Análises */}
            {!sidebarKpiHidden && (
              <div className="mt-6 px-3">
                <Card className="relative overflow-hidden group" padding="none">
                  {/* Botões no canto superior direito (estilo Windows) */}
                  <div className="absolute top-0 right-0 z-10 flex items-center bg-white rounded-bl-lg border-l border-b border-gray-200 shadow-sm">
                    {/* Ícone do KPI (drasticamente reduzido) */}
                    <div className="h-5 w-5 bg-gradient-primary rounded-sm flex items-center justify-center mr-0.5">
                      <DollarSign className="h-3 w-3 text-white" />
                    </div>
                    <button
                      onClick={() => setSidebarKpiMinimized(!sidebarKpiMinimized)}
                      className="p-1.5 text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-colors"
                      title={sidebarKpiMinimized ? 'Expandir' : 'Minimizar'}
                    >
                      <Minus className="h-3.5 w-3.5" />
                    </button>
                    <button
                      onClick={() => setSidebarKpiHidden(true)}
                      className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 transition-colors"
                      title="Fechar"
                    >
                      <X className="h-3.5 w-3.5" />
                    </button>
                  </div>

                  {/* Conteúdo do card */}
                  <div className="p-4 pr-2">
                    <div className="flex-1">
                      <p className="text-sm font-medium text-gray-600 pr-16">Avatar HeyGen</p>
                      {!sidebarKpiMinimized && (
                        <div className="mt-2 space-y-2">
                          {/* Vídeo do avatar ao vivo */}
                          <div className="relative w-full bg-gray-100 rounded-lg overflow-hidden" style={{ aspectRatio: '16/9', minHeight: '120px' }}>
                            <video
                              ref={videoRef}
                              autoPlay
                              playsInline
                              muted
                              className="w-full h-full object-cover"
                            />
                            {!avatarConnected && (
                              <div className="absolute inset-0 flex items-center justify-center bg-gray-200">
                                <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
                              </div>
                            )}
                          </div>
                          
                          {/* Botão de gravação */}
                          <button
                            onClick={toggleRecording}
                            disabled={!audioRecorder || !avatarConnected}
                            className={`w-full flex items-center justify-center space-x-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                              isRecording
                                ? 'bg-red-100 text-red-700 hover:bg-red-200'
                                : 'bg-primary-100 text-primary-700 hover:bg-primary-200'
                            } disabled:opacity-50 disabled:cursor-not-allowed`}
                          >
                            {isRecording ? (
                              <>
                                <Loader2 className="h-4 w-4 animate-spin" />
                                <span>Parar Gravação</span>
                              </>
                            ) : (
                              <>
                                <Mic className="h-4 w-4" />
                                <span>Enviar Áudio</span>
                              </>
                            )}
                          </button>
                          {recordingStatus && (
                            <p className="text-xs text-gray-600 text-center">{recordingStatus}</p>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                </Card>
              </div>
            )}

            {/* Lista de Arquivos do Supabase removida a pedido */}

            {/* Tipos de Gráficos removidos a pedido */}
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
