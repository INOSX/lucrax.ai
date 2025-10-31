import React, { useEffect, useState } from 'react'
import { useAuth } from '../../contexts/AuthContext'
import { ClientService } from '../../services/clientService'
import { supabase } from '../../services/supabase'
import Card from '../ui/Card'
import Loading from '../ui/Loading'
import { Download, Trash2, Play } from 'lucide-react'
import { useNavigate } from 'react-router-dom'

const Datasets = () => {
  const { user } = useAuth()
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState(null)
  const [items, setItems] = useState([])
  const [client, setClient] = useState(null)
  const [selected, setSelected] = useState({})
  const [isProcessing, setIsProcessing] = useState(false)
  const [successMessage, setSuccessMessage] = useState(null)
  const navigate = useNavigate()

  useEffect(() => {
    let mounted = true
    async function load() {
      if (!user) return
      setIsLoading(true)
      setError(null)
      try {
        // Cliente do usuário
        const clientResult = await ClientService.getClientByUserId(user.id)
        if (!clientResult.success) throw new Error('Cliente não encontrado')
        if (!mounted) return
        setClient(clientResult.client)

        const clientId = clientResult.client.id
        let mapped = []

        // Primeiro, tentar buscar da tabela data_sources_new (fonte confiável de metadados)
        const { data: dbRows, error: dbErr } = await supabase
          .from('data_sources_new')
          .select('id, filename, file_type, file_size, created_at, row_count, column_count')
          .eq('client_id', clientId)
          .order('created_at', { ascending: false })

        if (dbErr) {
          console.error('Erro ao buscar data_sources_new:', dbErr, 'clientId:', clientId)
          setError(`Erro ao buscar dados: ${dbErr.message || dbErr}`)
        } else if (Array.isArray(dbRows) && dbRows.length > 0) {
          console.log('Datasets encontrados na tabela:', dbRows.length, dbRows)
          // Usar dados da tabela como fonte principal
          mapped = dbRows.map(r => ({
            id: r.id || r.filename,
            filename: r.filename || '—',
            bytes: typeof r.file_size === 'number' ? r.file_size : undefined,
            status: 'completed',
            created_at: r.created_at ? (typeof r.created_at === 'string' ? Date.parse(r.created_at) / 1000 : r.created_at) : undefined,
            file_id: r.id || r.filename,
            file_type: r.file_type,
            row_count: r.row_count,
            column_count: r.column_count
          }))
        }

        // Tentar complementar com dados do Storage (tamanho real, etc)
        if (mounted) {
          const bucket = String(clientId)
          try {
            const { data: storageEntries, error: stErr } = await supabase.storage.from(bucket).list('', {
              limit: 1000,
              sortBy: { column: 'name', order: 'asc' }
            })
            
            if (!stErr && Array.isArray(storageEntries) && storageEntries.length > 0) {
              // Criar mapa de arquivos do storage por nome
              const storageMap = new Map()
              storageEntries.forEach(e => {
                if (e.name) {
                  storageMap.set(e.name, {
                    size: e.metadata?.size || e.size,
                    created_at: e.created_at ? (typeof e.created_at === 'string' ? Date.parse(e.created_at) / 1000 : e.created_at) : undefined,
                    id: e.id || e.name
                  })
                }
              })

              // Atualizar dados com informações do storage quando disponível
              mapped = mapped.map(item => {
                const storageInfo = storageMap.get(item.filename)
                if (storageInfo) {
                  return {
                    ...item,
                    bytes: storageInfo.size || item.bytes,
                    created_at: storageInfo.created_at || item.created_at,
                    file_id: storageInfo.id || item.file_id
                  }
                }
                return item
              })

              // Adicionar arquivos do storage que não estão na tabela (se houver)
              storageEntries.forEach(e => {
                if (e.name && !mapped.find(m => m.filename === e.name)) {
                  mapped.push({
                    id: e.id || e.name,
                    filename: e.name,
                    bytes: e.metadata?.size || e.size,
                    status: 'completed',
                    created_at: e.created_at ? (typeof e.created_at === 'string' ? Date.parse(e.created_at) / 1000 : e.created_at) : undefined,
                    file_id: e.id || e.name
                  })
                }
              })
            } else if (stErr) {
              console.warn('Erro ao buscar Storage:', stErr)
              // Não falhar completamente se Storage falhar, usar apenas dados da tabela
            }
          } catch (storageErr) {
            console.warn('Erro ao acessar Storage:', storageErr)
            // Continuar com dados da tabela mesmo se Storage falhar
          }
        }

        if (!mounted) return
        console.log('Total de datasets mapeados:', mapped.length, mapped)
        setItems(mapped)
      } catch (err) {
        if (!mounted) return
        console.error('Erro ao carregar datasets:', err)
        setError(err.message || 'Erro ao carregar datasets')
      } finally {
        if (mounted) setIsLoading(false)
      }
    }
    load()
    return () => { mounted = false }
  }, [user])

  const toggleSelect = (id) => {
    setSelected(prev => ({ ...prev, [id]: !prev[id] }))
  }

  const toggleSelectAll = () => {
    const allSelected = Object.values(selected).every(v => v === true) && items.length > 0
    if (allSelected) {
      setSelected({})
    } else {
      const newSelected = {}
      items.forEach(item => {
        newSelected[item.id] = true
      })
      setSelected(newSelected)
    }
  }

  const getSelectedItems = () => {
    return items.filter(item => selected[item.id] === true)
  }

  const handleDownload = async () => {
    const selectedItems = getSelectedItems()
    if (selectedItems.length === 0) {
      setError('Selecione pelo menos um arquivo para download')
      return
    }

    if (!client) {
      setError('Cliente não encontrado')
      return
    }

    setIsProcessing(true)
    setError(null)
    setSuccessMessage(null)

    try {
      const bucket = String(client.id)
      
      for (const item of selectedItems) {
        try {
          const { data, error: downloadErr } = await supabase.storage
            .from(bucket)
            .download(item.filename)

          if (downloadErr) {
            console.error(`Erro ao baixar ${item.filename}:`, downloadErr)
            setError(`Erro ao baixar ${item.filename}: ${downloadErr.message}`)
            continue
          }

          // Criar link de download
          const url = window.URL.createObjectURL(data)
          const a = document.createElement('a')
          a.href = url
          a.download = item.filename
          document.body.appendChild(a)
          a.click()
          document.body.removeChild(a)
          window.URL.revokeObjectURL(url)
        } catch (err) {
          console.error(`Erro ao processar download de ${item.filename}:`, err)
          setError(`Erro ao baixar ${item.filename}`)
        }
      }

      setSuccessMessage(`${selectedItems.length} arquivo(s) baixado(s) com sucesso`)
      setTimeout(() => setSuccessMessage(null), 3000)
    } catch (err) {
      console.error('Erro ao fazer download:', err)
      setError(err.message || 'Erro ao fazer download dos arquivos')
    } finally {
      setIsProcessing(false)
    }
  }

  const handleDelete = async () => {
    const selectedItems = getSelectedItems()
    if (selectedItems.length === 0) {
      setError('Selecione pelo menos um arquivo para excluir')
      return
    }

    if (!client) {
      setError('Cliente não encontrado')
      return
    }

    const confirmed = window.confirm(
      `Tem certeza que deseja excluir ${selectedItems.length} arquivo(s)? Esta ação não pode ser desfeita.`
    )

    if (!confirmed) return

    setIsProcessing(true)
    setError(null)
    setSuccessMessage(null)

    try {
      const bucket = String(client.id)
      const clientId = client.id
      let deletedCount = 0
      let failedCount = 0

      for (const item of selectedItems) {
        try {
          // Excluir do Storage
          const { error: storageErr } = await supabase.storage
            .from(bucket)
            .remove([item.filename])

          if (storageErr) {
            console.warn(`Erro ao excluir ${item.filename} do Storage:`, storageErr)
            // Continuar mesmo se falhar no Storage
          }

          // Excluir da tabela data_sources_new (usando o id se disponível)
          if (item.id && item.id !== item.filename) {
            const { error: dbErr } = await supabase
              .from('data_sources_new')
              .delete()
              .eq('id', item.id)
              .eq('client_id', clientId)

            if (dbErr) {
              console.warn(`Erro ao excluir ${item.filename} da tabela:`, dbErr)
              // Tentar excluir por filename se não encontrou por id
              const { error: dbErr2 } = await supabase
                .from('data_sources_new')
                .delete()
                .eq('filename', item.filename)
                .eq('client_id', clientId)

              if (dbErr2) {
                console.warn(`Erro ao excluir ${item.filename} da tabela (por filename):`, dbErr2)
              }
            }
          } else {
            // Tentar excluir por filename
            const { error: dbErr } = await supabase
              .from('data_sources_new')
              .delete()
              .eq('filename', item.filename)
              .eq('client_id', clientId)

            if (dbErr) {
              console.warn(`Erro ao excluir ${item.filename} da tabela:`, dbErr)
            }
          }

          deletedCount++
        } catch (err) {
          console.error(`Erro ao excluir ${item.filename}:`, err)
          failedCount++
        }
      }

      // Limpar seleções
      setSelected({})

      // Recarregar lista
      if (deletedCount > 0) {
        setSuccessMessage(`${deletedCount} arquivo(s) excluído(s) com sucesso`)
        setTimeout(() => setSuccessMessage(null), 3000)
        
        // Remover itens excluídos da lista local
        const deletedIds = new Set(selectedItems.map(item => item.id))
        setItems(prevItems => prevItems.filter(item => !deletedIds.has(item.id)))
        
        // Disparar evento para recarregar se necessário
        window.dispatchEvent(new Event('storage-updated'))
      }

      if (failedCount > 0) {
        setError(`${failedCount} arquivo(s) não puderam ser excluídos. Verifique o console para detalhes.`)
      }
    } catch (err) {
      console.error('Erro ao excluir arquivos:', err)
      setError(err.message || 'Erro ao excluir arquivos')
    } finally {
      setIsProcessing(false)
    }
  }

  const handleUseInDashboard = () => {
    const selectedItems = getSelectedItems()
    if (selectedItems.length === 0) {
      setError('Selecione pelo menos um arquivo para usar no Dashboard')
      return
    }
    // Enviar nomes/ids para o Dashboard via state de navegação
    navigate('/', {
      state: {
        selectedFiles: selectedItems.map(it => ({ id: it.id, filename: it.filename }))
      }
    })
  }

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-semibold text-gray-900">Meus Datasets</h1>
        <p className="text-sm text-gray-600">Arquivos presentes no seu bucket do Supabase e tabela de datasets</p>
      </div>

      <Card>
        {isLoading && (
          <div className="p-6"><Loading text="Carregando datasets..." /></div>
        )}
        {!isLoading && error && (
          <div className="p-6 text-sm text-red-600">{error}</div>
        )}
        {!isLoading && successMessage && (
          <div className="p-4 mx-6 mt-4 text-sm text-green-600 bg-green-50 rounded-md">{successMessage}</div>
        )}
        {!isLoading && !error && items.length === 0 && (
          <div className="p-6 text-sm text-gray-600">Nenhum arquivo encontrado no bucket.</div>
        )}
        {!isLoading && !error && items.length > 0 && (
          <>
            {/* Barra de ações */}
            <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
              <div className="flex items-center gap-4">
                <button
                  onClick={toggleSelectAll}
                  className="text-sm text-gray-700 hover:text-gray-900 font-medium"
                >
                  {Object.values(selected).every(v => v === true) && items.length > 0
                    ? 'Desselecionar Todos'
                    : 'Selecionar Todos'}
                </button>
                <span className="text-sm text-gray-500">
                  {Object.values(selected).filter(v => v === true).length} de {items.length} selecionado(s)
                </span>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={handleUseInDashboard}
                  disabled={isProcessing || Object.values(selected).filter(v => v === true).length === 0}
                  className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-emerald-600 rounded-md hover:bg-emerald-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
                >
                  <Play className="w-4 h-4" />
                  Usar no Dashboard
                </button>
                <button
                  onClick={handleDownload}
                  disabled={isProcessing || Object.values(selected).filter(v => v === true).length === 0}
                  className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
                >
                  <Download className="w-4 h-4" />
                  Download
                </button>
                <button
                  onClick={handleDelete}
                  disabled={isProcessing || Object.values(selected).filter(v => v === true).length === 0}
                  className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-md hover:bg-red-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
                >
                  <Trash2 className="w-4 h-4" />
                  Excluir
                </button>
              </div>
            </div>
            {isProcessing && (
              <div className="px-6 py-2 bg-blue-50 text-blue-700 text-sm">
                Processando... Por favor, aguarde.
              </div>
            )}
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"></th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Arquivo</th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Tamanho</th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Criado em</th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">ID</th>
                  </tr>
                </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {items.map((it) => (
                  <tr key={it.id}>
                    <td className="px-4 py-2">
                      <input
                        type="checkbox"
                        className="h-4 w-4 text-primary-600 border-gray-300 rounded"
                        checked={!!selected[it.id]}
                        onChange={() => toggleSelect(it.id)}
                      />
                    </td>
                    <td className="px-4 py-2 text-sm text-gray-900">{it.filename || '—'}</td>
                    <td className="px-4 py-2 text-sm text-gray-600">{typeof it.bytes === 'number' ? `${(it.bytes/1024).toFixed(1)} KB` : '—'}</td>
                    <td className="px-4 py-2 text-sm text-gray-600">{it.status || '—'}</td>
                    <td className="px-4 py-2 text-sm text-gray-600">{it.created_at ? new Date(it.created_at * 1000).toLocaleString() : '—'}</td>
                    <td className="px-4 py-2 text-xs text-gray-500">{it.file_id || it.id}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            </div>
          </>
        )}
      </Card>
    </div>
  )
}

export default Datasets


