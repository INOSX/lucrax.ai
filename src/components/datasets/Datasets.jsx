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

        // Bucket do usuário (um bucket por cliente, usando o id do cliente)
        const bucket = String(clientResult.client.id)
        // Tenta listar arquivos no root do bucket com opções explícitas
        let storageEntries = []
        {
          const { data: listA, error: errA } = await supabase.storage.from(bucket).list('', { limit: 1000, offset: 0, sortBy: { column: 'name', order: 'asc' } })
          if (errA) throw errA
          storageEntries = listA || []
        }
        // Fallback: alguns ambientes exigem chamada sem prefixo
        if (!storageEntries.length) {
          const { data: listB, error: errB } = await supabase.storage.from(bucket).list('')
          if (errB) throw errB
          storageEntries = listB || []
        }

        if (!mounted) return
        let mapped = (storageEntries || []).map(e => ({
          id: e.id || e.name,
          filename: e.name,
          // Supabase retorna size em bytes quando list v2? Aqui e.size pode não existir; manter "—" quando indefinido
          bytes: typeof e.metadata?.size === 'number' ? e.metadata.size : (typeof e.size === 'number' ? e.size : undefined),
          status: '—',
          created_at: e.created_at ? Date.parse(e.created_at) / 1000 : undefined,
          file_id: e.id || e.name
        }))
        
        // Fallback adicional: se nada no Storage, mostrar o que há em data_sources_new
        if (!mapped.length) {
          const { data: rows, error: rowsErr } = await supabase
            .from('data_sources_new')
            .select('filename, file_size, created_at')
            .eq('client_id', clientResult.client.id)
            .order('created_at', { ascending: false })
          if (!rowsErr && Array.isArray(rows)) {
            mapped = rows.map(r => ({
              id: r.filename,
              filename: r.filename,
              bytes: typeof r.file_size === 'number' ? r.file_size : undefined,
              status: '—',
              created_at: r.created_at ? Date.parse(r.created_at) / 1000 : undefined,
              file_id: r.filename
            }))
          }
        }
        setItems(mapped)
      } catch (err) {
        if (!mounted) return
        setError(err.message)
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
        <p className="text-sm text-gray-600">Arquivos presentes no seu bucket do Supabase</p>
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


