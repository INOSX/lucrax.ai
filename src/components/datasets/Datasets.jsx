import React, { useEffect, useState } from 'react'
import { useAuth } from '../../contexts/AuthContext'
import { ClientService } from '../../services/clientService'
import { OpenAIService } from '../../services/openaiService'
import Card from '../ui/Card'
import Loading from '../ui/Loading'

const Datasets = () => {
  const { user } = useAuth()
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState(null)
  const [items, setItems] = useState([])
  const [client, setClient] = useState(null)

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

        const vectorstoreId = clientResult.client.vectorstore_id
        if (!vectorstoreId) throw new Error('Vectorstore não configurado para este cliente')

        // Listar arquivos
        const list = await OpenAIService.listVectorstoreFiles(vectorstoreId)
        if (!mounted) return
        setItems(list.data || [])
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

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-semibold text-gray-900">Meus Datasets</h1>
        <p className="text-sm text-gray-600">Arquivos presentes no seu vector store</p>
      </div>

      <Card>
        {isLoading && (
          <div className="p-6"><Loading text="Carregando datasets..." /></div>
        )}
        {!isLoading && error && (
          <div className="p-6 text-sm text-red-600">{error}</div>
        )}
        {!isLoading && !error && items.length === 0 && (
          <div className="p-6 text-sm text-gray-600">Nenhum arquivo encontrado no vector store.</div>
        )}
        {!isLoading && !error && items.length > 0 && (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
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


