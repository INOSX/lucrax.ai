/**
 * Serviço para gerenciar vectorstores e assistentes da OpenAI
 * Usa API intermediária para manter a chave API segura no servidor
 */
export class OpenAIService {
  /**
   * Chama a API intermediária do Vercel
   * @param {string} action - Ação a ser executada
   * @param {Object} params - Parâmetros para a ação
   * @returns {Promise<Object>} - Resultado da operação
   */
  static async callAPI(action, params = {}) {
    try {
      const response = await fetch('/api/openai/vectorstore', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ action, ...params })
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Erro na API')
      }

      return await response.json()
    } catch (error) {
      console.error(`Erro na chamada da API (${action}):`, error)
      throw error
    }
  }

  /**
   * Cria um novo vectorstore para um cliente
   * @param {string} clientCode - Código do cliente
   * @returns {Promise<{vectorstoreId: string, error?: string}>}
   */
  static async createVectorstore(clientCode) {
    try {
      const vectorstoreName = `${clientCode}-vs`
      
      const result = await this.callAPI('createVectorstore', {
        name: vectorstoreName,
        description: `Vectorstore para dados do cliente ${clientCode}`
      })

      return { vectorstoreId: result.vectorstoreId }
    } catch (error) {
      console.error('Erro ao criar vectorstore:', error)
      return { error: error.message }
    }
  }

  /**
   * Vincula um vectorstore a um assistente
   * @param {string} assistantId - ID do assistente
   * @param {string} vectorstoreId - ID do vectorstore
   * @returns {Promise<{success: boolean, error?: string}>}
   */
  static async linkVectorstoreToAssistant(assistantId, vectorstoreId) {
    try {
      const result = await this.callAPI('linkVectorstoreToAssistant', {
        assistantId,
        vectorstoreId
      })

      return { success: true }
    } catch (error) {
      console.error('Erro ao vincular vectorstore ao assistente:', error)
      return { success: false, error: error.message }
    }
  }

  /**
   * Cria um novo assistente para um cliente
   * @param {string} clientCode - Código do cliente
   * @param {string} vectorstoreId - ID do vectorstore
   * @returns {Promise<{assistantId: string, error?: string}>}
   */
  static async createAssistant(clientCode) {
    try {
      const assistantName = `${clientCode}-assistant`
      
      const result = await this.callAPI('createAssistant', {
        name: assistantName,
        instructions: `Você é um assistente especializado em análise de dados para o cliente ${clientCode}. 
        Use os dados do vectorstore para responder perguntas e gerar insights sobre os dados do cliente.
        Sempre forneça análises precisas e acionáveis baseadas nos dados disponíveis.`,
      })

      return { assistantId: result.assistantId }
    } catch (error) {
      console.error('Erro ao criar assistente:', error)
      return { error: error.message }
    }
  }

  /**
   * Faz upload de arquivo para o vectorstore
   * @param {string} vectorstoreId - ID do vectorstore
   * @param {File} file - Arquivo para upload
   * @returns {Promise<{fileId: string, error?: string}>}
   */
  static async uploadFileToVectorstore(vectorstoreId, file) {
    try {
      // Converter arquivo para base64 para envio via JSON
      const arrayBuffer = await file.arrayBuffer()
      const base64 = btoa(String.fromCharCode(...new Uint8Array(arrayBuffer)))
      
      const result = await this.callAPI('uploadFile', {
        vectorstoreId: vectorstoreId,
        data: base64,
        fileName: file.name,
        fileType: file.type
      })

      return { success: true, fileId: result.fileId }
    } catch (error) {
      console.error('Erro ao fazer upload para vectorstore:', error)
      return { success: false, error: error.message }
    }
  }

  /**
   * Processa dados CSV/Excel e faz upload para vectorstore
   * @param {string} vectorstoreId - ID do vectorstore
   * @param {Array} data - Dados processados
   * @param {string} filename - Nome do arquivo
   * @returns {Promise<{success: boolean, error?: string}>}
   */
  static async uploadDataToVectorstore(vectorstoreId, data, filename) {
    try {
      // Converter dados para CSV
      const csvContent = this.convertToCSV(data)
      
      // Criar blob do CSV
      const blob = new Blob([csvContent], { type: 'text/csv' })
      const file = new File([blob], filename.replace(/\.[^/.]+$/, '.csv'), { type: 'text/csv' })

      // Fazer upload
      const result = await this.uploadFileToVectorstore(vectorstoreId, file)
      
      if (!result.success) {
        return { success: false, error: result.error }
      }

      return { success: true }
    } catch (error) {
      console.error('Erro ao processar dados para vectorstore:', error)
      return { success: false, error: error.message }
    }
  }

  /**
   * Converte array de objetos para CSV
   * @param {Array} data - Dados para converter
   * @returns {string} - Conteúdo CSV
   */
  static convertToCSV(data) {
    if (!data || data.length === 0) return ''

    const headers = Object.keys(data[0])
    const csvRows = [headers.join(',')]

    for (const row of data) {
      const values = headers.map(header => {
        const value = row[header]
        // Escapar vírgulas e aspas no CSV
        if (typeof value === 'string' && (value.includes(',') || value.includes('"'))) {
          return `"${value.replace(/"/g, '""')}"`
        }
        return value
      })
      csvRows.push(values.join(','))
    }

    return csvRows.join('\n')
  }

  /**
   * Deleta um vectorstore
   * @param {string} vectorstoreId - ID do vectorstore
   * @returns {Promise<{success: boolean, error?: string}>}
   */
  static async deleteVectorstore(vectorstoreId) {
    try {
      await this.callAPI('deleteVectorstore', { vectorstoreId })
      return { success: true }
    } catch (error) {
      console.error('Erro ao deletar vectorstore:', error)
      return { success: false, error: error.message }
    }
  }

  /**
   * Deleta um assistente
   * @param {string} assistantId - ID do assistente
   * @returns {Promise<{success: boolean, error?: string}>}
   */
  static async deleteAssistant(assistantId) {
    try {
      await this.callAPI('deleteAssistant', { assistantId })
      return { success: true }
    } catch (error) {
      console.error('Erro ao deletar assistente:', error)
      return { success: false, error: error.message }
    }
  }
}

export default OpenAIService