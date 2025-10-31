import React, { useEffect, useState } from 'react'
import { useAuth } from '../../contexts/AuthContext'
import { ClientService } from '../../services/clientService'
import { supabase } from '../../services/supabase'
import Card from '../ui/Card'
import Loading from '../ui/Loading'

const Datasets = () => {
  const { user } = useAuth()
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState(null)
  const [items, setItems] = useState([])
  const [client, setClient] = useState(null)
  const [selected, setSelected] = useState({})

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
        {!isLoading && !error && items.length === 0 && (
          <div className="p-6 text-sm text-gray-600">Nenhum arquivo encontrado no bucket.</div>
        )}
        {!isLoading && !error && items.length > 0 && (
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
        )}
      </Card>
    </div>
  )
}

export default Datasets


