import OpenAI from 'openai'
import { config } from '../config/env.js'

// Inicializar cliente OpenAI
const openai = new OpenAI({
  apiKey: config.openai.apiKey,
})

/**
 * Serviço para gerenciar vectorstores e assistentes da OpenAI
 */
export class OpenAIService {
  /**
   * Cria um novo vectorstore para um cliente
   * @param {string} clientCode - Código do cliente
   * @returns {Promise<{vectorstoreId: string, error?: string}>}
   */
  static async createVectorstore(clientCode) {
    try {
      const vectorstoreName = `${clientCode}-vs`
      
      const vectorstore = await openai.beta.vectorstores.create({
        name: vectorstoreName,
        description: `Vectorstore para dados do cliente ${clientCode}`,
      })

      return { vectorstoreId: vectorstore.id }
    } catch (error) {
      console.error('Erro ao criar vectorstore:', error)
      return { error: error.message }
    }
  }

  /**
   * Cria um novo assistente para um cliente
   * @param {string} clientCode - Código do cliente
   * @param {string} vectorstoreId - ID do vectorstore
   * @returns {Promise<{assistantId: string, error?: string}>}
   */
  static async createAssistant(clientCode, vectorstoreId) {
    try {
      const assistantName = `${clientCode}-assistant`
      
      const assistant = await openai.beta.assistants.create({
        name: assistantName,
        instructions: `Você é um assistente especializado em análise de dados para o cliente ${clientCode}. 
        Use os dados do vectorstore para responder perguntas e gerar insights sobre os dados do cliente.
        Sempre forneça análises precisas e acionáveis baseadas nos dados disponíveis.`,
        model: "gpt-4o-mini",
        tools: [
          { type: "file_search" }
        ],
        tool_resources: {
          file_search: {
            vector_store_ids: [vectorstoreId]
          }
        }
      })

      return { assistantId: assistant.id }
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
      // Primeiro, fazer upload do arquivo
      const formData = new FormData()
      formData.append('file', file)
      formData.append('purpose', 'assistants')

      const uploadResponse = await fetch('https://api.openai.com/v1/files', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${config.openai.apiKey}`,
        },
        body: formData
      })

      if (!uploadResponse.ok) {
        throw new Error(`Erro no upload: ${uploadResponse.statusText}`)
      }

      const uploadResult = await uploadResponse.json()
      const fileId = uploadResult.id

      // Associar arquivo ao vectorstore
      await openai.beta.vectorstores.files.create(vectorstoreId, {
        file_id: fileId
      })

      return { fileId }
    } catch (error) {
      console.error('Erro ao fazer upload para vectorstore:', error)
      return { error: error.message }
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
      
      if (result.error) {
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
      await openai.beta.vectorstores.del(vectorstoreId)
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
      await openai.beta.assistants.del(assistantId)
      return { success: true }
    } catch (error) {
      console.error('Erro ao deletar assistente:', error)
      return { success: false, error: error.message }
    }
  }
}

export default OpenAIService