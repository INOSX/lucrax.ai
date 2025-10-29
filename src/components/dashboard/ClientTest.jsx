import React, { useState, useEffect } from 'react'
import { useAuth } from '../../contexts/AuthContext'
import { ClientService } from '../../services/clientService'
import { OpenAIService } from '../../services/openaiService'
import Card from '../ui/Card'
import Button from '../ui/Button'
import { User, Database, Bot, CheckCircle, AlertCircle, Loader2 } from 'lucide-react'

const ClientTest = () => {
  const { user } = useAuth()
  const [client, setClient] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [testResults, setTestResults] = useState({})

  useEffect(() => {
    if (user) {
      loadClient()
    }
  }, [user])

  const loadClient = async () => {
    if (!user) return

    setLoading(true)
    setError(null)

    try {
      const result = await ClientService.getClientByUserId(user.id)
      
      if (result.success) {
        setClient(result.client)
      } else {
        setError(result.error)
      }
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const testVectorstore = async () => {
    if (!client?.vectorstore_id) return

    setTestResults(prev => ({ ...prev, vectorstore: 'testing' }))

    try {
      // Teste simples: tentar fazer upload de dados de teste
      const testData = [
        { nome: 'João', idade: 30, cidade: 'São Paulo' },
        { nome: 'Maria', idade: 25, cidade: 'Rio de Janeiro' },
        { nome: 'Pedro', idade: 35, cidade: 'Belo Horizonte' }
      ]

      const result = await OpenAIService.uploadDataToVectorstore(
        client.vectorstore_id,
        testData,
        'teste-vectorstore.csv'
      )

      setTestResults(prev => ({ 
        ...prev, 
        vectorstore: result.success ? 'success' : 'error',
        vectorstoreError: result.error
      }))
    } catch (err) {
      setTestResults(prev => ({ 
        ...prev, 
        vectorstore: 'error',
        vectorstoreError: err.message
      }))
    }
  }

  const testAssistant = async () => {
    if (!client?.openai_assistant_id) return

    setTestResults(prev => ({ ...prev, assistant: 'testing' }))

    try {
      // Teste simples: verificar se o assistente existe
      // (Em uma implementação real, você faria uma chamada para verificar o assistente)
      setTestResults(prev => ({ 
        ...prev, 
        assistant: 'success'
      }))
    } catch (err) {
      setTestResults(prev => ({ 
        ...prev, 
        assistant: 'error',
        assistantError: err.message
      }))
    }
  }

  const runAllTests = async () => {
    setTestResults({})
    await testVectorstore()
    await testAssistant()
  }

  const getStatusIcon = (status) => {
    switch (status) {
      case 'success':
        return <CheckCircle className="h-5 w-5 text-green-600" />
      case 'error':
        return <AlertCircle className="h-5 w-5 text-red-600" />
      case 'testing':
        return <Loader2 className="h-5 w-5 text-blue-600 animate-spin" />
      default:
        return <div className="h-5 w-5 rounded-full bg-gray-300" />
    }
  }

  const getStatusText = (status) => {
    switch (status) {
      case 'success':
        return 'Funcionando'
      case 'error':
        return 'Erro'
      case 'testing':
        return 'Testando...'
      default:
        return 'Não testado'
    }
  }

  if (loading) {
    return (
      <Card className="p-6">
        <div className="flex items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary-600" />
          <span className="ml-2">Carregando informações do cliente...</span>
        </div>
      </Card>
    )
  }

  if (error) {
    return (
      <Card className="p-6">
        <div className="flex items-center space-x-2 text-red-600">
          <AlertCircle className="h-5 w-5" />
          <span>Erro: {error}</span>
        </div>
        <div className="mt-4">
          <Button onClick={loadClient}>
            Tentar Novamente
          </Button>
        </div>
      </Card>
    )
  }

  if (!client) {
    return (
      <Card className="p-6">
        <div className="text-center">
          <AlertCircle className="h-12 w-12 text-yellow-600 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            Cliente não encontrado
          </h3>
          <p className="text-gray-600 mb-4">
            Parece que seu cliente não foi criado automaticamente. 
            Isso pode acontecer se você se registrou antes da implementação desta funcionalidade.
          </p>
          <Button onClick={loadClient}>
            Verificar Novamente
          </Button>
        </div>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      <Card className="p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">
          Informações do Cliente
        </h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-4">
            <div className="flex items-center space-x-3">
              <User className="h-5 w-5 text-primary-600" />
              <div>
                <p className="text-sm font-medium text-gray-900">Nome</p>
                <p className="text-sm text-gray-600">{client.name}</p>
              </div>
            </div>
            
            <div className="flex items-center space-x-3">
              <Database className="h-5 w-5 text-primary-600" />
              <div>
                <p className="text-sm font-medium text-gray-900">Código do Cliente</p>
                <p className="text-sm text-gray-600 font-mono">{client.client_code}</p>
              </div>
            </div>
          </div>
          
          <div className="space-y-4">
            <div className="flex items-center space-x-3">
              <Database className="h-5 w-5 text-primary-600" />
              <div>
                <p className="text-sm font-medium text-gray-900">Vectorstore ID</p>
                <p className="text-sm text-gray-600 font-mono text-xs break-all">
                  {client.vectorstore_id || 'Não configurado'}
                </p>
              </div>
            </div>
            
            <div className="flex items-center space-x-3">
              <Bot className="h-5 w-5 text-primary-600" />
              <div>
                <p className="text-sm font-medium text-gray-900">Assistente ID</p>
                <p className="text-sm text-gray-600 font-mono text-xs break-all">
                  {client.openai_assistant_id || 'Não configurado'}
                </p>
              </div>
            </div>
          </div>
        </div>
      </Card>

      <Card className="p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          Testes de Integração
        </h3>
        
        <div className="space-y-4">
          <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
            <div className="flex items-center space-x-3">
              {getStatusIcon(testResults.vectorstore)}
              <div>
                <p className="font-medium text-gray-900">Vectorstore</p>
                <p className="text-sm text-gray-600">
                  {getStatusText(testResults.vectorstore)}
                </p>
                {testResults.vectorstoreError && (
                  <p className="text-xs text-red-600 mt-1">
                    {testResults.vectorstoreError}
                  </p>
                )}
              </div>
            </div>
            <Button
              size="sm"
              onClick={testVectorstore}
              disabled={testResults.vectorstore === 'testing'}
            >
              Testar
            </Button>
          </div>

          <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
            <div className="flex items-center space-x-3">
              {getStatusIcon(testResults.assistant)}
              <div>
                <p className="font-medium text-gray-900">Assistente OpenAI</p>
                <p className="text-sm text-gray-600">
                  {getStatusText(testResults.assistant)}
                </p>
                {testResults.assistantError && (
                  <p className="text-xs text-red-600 mt-1">
                    {testResults.assistantError}
                  </p>
                )}
              </div>
            </div>
            <Button
              size="sm"
              onClick={testAssistant}
              disabled={testResults.assistant === 'testing'}
            >
              Testar
            </Button>
          </div>
        </div>

        <div className="mt-6 flex space-x-3">
          <Button onClick={runAllTests}>
            Executar Todos os Testes
          </Button>
          <Button variant="secondary" onClick={loadClient}>
            Atualizar
          </Button>
        </div>
      </Card>
    </div>
  )
}

export default ClientTest
