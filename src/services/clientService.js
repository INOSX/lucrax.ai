import { supabase } from './supabase.js'
import { OpenAIService } from './openaiService.js'

/**
 * Serviço para gerenciar clientes e suas integrações com OpenAI
 */
export class ClientService {
  /**
   * Gera um código único para o cliente
   * @returns {string} - Código único do cliente
   */
  static generateClientCode() {
    const timestamp = Date.now().toString(36)
    const random = Math.random().toString(36).substring(2, 8)
    return `CLI-${timestamp}-${random}`.toUpperCase()
  }

  /**
   * Gera um hash SHA-256 para garantir nomes únicos
   * @param {string} input - String para gerar hash
   * @returns {string} Hash SHA-256 (primeiros 8 caracteres)
   */
  static generateHash(input) {
    // Usar Web Crypto API para gerar SHA-256
    const encoder = new TextEncoder()
    const data = encoder.encode(input)
    
    // Para ambiente Node.js (API route), usar crypto nativo
    if (typeof window === 'undefined') {
      const crypto = require('crypto')
      return crypto.createHash('sha256').update(input).digest('hex').substring(0, 8)
    }
    
    // Para ambiente browser, usar SubtleCrypto (assíncrono)
    return crypto.subtle.digest('SHA-256', data).then(hashBuffer => {
      const hashArray = Array.from(new Uint8Array(hashBuffer))
      return hashArray.map(b => b.toString(16).padStart(2, '0')).join('').substring(0, 8)
    })
  }

  /**
   * Gera um hash único para um cliente (mesmo hash para assistente e vectorstore)
   * @param {string} clientCode - Código do cliente
   * @returns {Promise<string>} Hash único para o cliente
   */
  static async generateClientHash(clientCode) {
    const timestamp = Date.now().toString()
    const input = `${clientCode}-${timestamp}`
    
    try {
      const hash = await this.generateHash(input)
      return hash
    } catch (error) {
      // Fallback: usar timestamp e random se hash falhar
      const random = Math.random().toString(36).substring(2, 6)
      return `${timestamp.substring(-4)}-${random}`
    }
  }

  /**
   * Gera nomes únicos para assistente e vectorstore do mesmo cliente
   * @param {string} clientCode - Código do cliente
   * @returns {Promise<{assistantName: string, vectorstoreName: string}>} Nomes únicos
   */
  static async generateUniqueNames(clientCode) {
    const hash = await this.generateClientHash(clientCode)
    
    return {
      assistantName: `${clientCode}-assistant-${hash}`,
      vectorstoreName: `${clientCode}-vectorstore-${hash}`
    }
  }

  /**
   * Cria um novo cliente com vectorstore e assistente OpenAI
   * @param {Object} clientData - Dados do cliente
   * @param {string} clientData.name - Nome do cliente
   * @param {string} clientData.email - Email do cliente
   * @param {string} clientData.userId - ID do usuário no Supabase
   * @returns {Promise<{success: boolean, client?: Object, error?: string}>}
   */
  static async createClient(clientData) {
    try {
      const { name, email, userId } = clientData
      
      // Gerar código único do cliente
      const clientCode = this.generateClientCode()
      
      // Gerar nomes únicos (mesmo hash para ambos)
      const { assistantName, vectorstoreName } = await this.generateUniqueNames(clientCode)

      // 1) Criar assistente primeiro
      const assistantResult = await OpenAIService.createAssistant(clientCode, assistantName)
      if (assistantResult.error) {
        return { success: false, error: `Erro ao criar assistente: ${assistantResult.error}` }
      }

      // 2) Criar vectorstore (sem vincular ainda)
      const vectorstoreResult = await OpenAIService.createVectorstore(clientCode, vectorstoreName)
      if (vectorstoreResult.error) {
        // rollback do assistente se vectorstore falhar
        await OpenAIService.deleteAssistant(assistantResult.assistantId)
        return { success: false, error: `Erro ao criar vectorstore: ${vectorstoreResult.error}` }
      }

      // 3) Vincular vectorstore ao assistente
      const linkResult = await OpenAIService.linkVectorstoreToAssistant(assistantResult.assistantId, vectorstoreResult.vectorstoreId)
      if (linkResult.error) {
        // rollback: deletar vectorstore e assistente
        await OpenAIService.deleteVectorstore(vectorstoreResult.vectorstoreId)
        await OpenAIService.deleteAssistant(assistantResult.assistantId)
        return { success: false, error: `Erro ao vincular vectorstore ao assistente: ${linkResult.error}` }
      }

      // Salvar cliente no Supabase
      const { data, error } = await supabase
        .from('clients')
        .insert({
          user_id: userId,
          client_code: clientCode,
          name,
          email,
          openai_assistant_id: assistantResult.assistantId,
          vectorstore_id: vectorstoreResult.vectorstoreId
        })
        .select()
        .single()

      if (error) {
        // Se falhar ao salvar no Supabase, deletar recursos OpenAI
        await OpenAIService.deleteVectorstore(vectorstoreResult.vectorstoreId)
        await OpenAIService.deleteAssistant(assistantResult.assistantId)
        return { success: false, error: `Erro ao salvar cliente: ${error.message}` }
      }

      return { success: true, client: data }
    } catch (error) {
      console.error('Erro ao criar cliente:', error)
      return { success: false, error: error.message }
    }
  }

  /**
   * Busca cliente por ID do usuário
   * @param {string} userId - ID do usuário
   * @returns {Promise<{success: boolean, client?: Object, error?: string}>}
   */
  static async getClientByUserId(userId) {
    try {
      const { data, error } = await supabase
        .from('clients')
        .select('*')
        .eq('user_id', userId)
        .single()

      if (error) {
        if (error.code === 'PGRST116') {
          return { success: false, error: 'Cliente não encontrado' }
        }
        return { success: false, error: error.message }
      }

      return { success: true, client: data }
    } catch (error) {
      console.error('Erro ao buscar cliente:', error)
      return { success: false, error: error.message }
    }
  }

  /**
   * Busca cliente por código
   * @param {string} clientCode - Código do cliente
   * @returns {Promise<{success: boolean, client?: Object, error?: string}>}
   */
  static async getClientByCode(clientCode) {
    try {
      const { data, error } = await supabase
        .from('clients')
        .select('*')
        .eq('client_code', clientCode)
        .single()

      if (error) {
        if (error.code === 'PGRST116') {
          return { success: false, error: 'Cliente não encontrado' }
        }
        return { success: false, error: error.message }
      }

      return { success: true, client: data }
    } catch (error) {
      console.error('Erro ao buscar cliente:', error)
      return { success: false, error: error.message }
    }
  }

  /**
   * Atualiza dados do cliente
   * @param {string} clientId - ID do cliente
   * @param {Object} updateData - Dados para atualizar
   * @returns {Promise<{success: boolean, client?: Object, error?: string}>}
   */
  static async updateClient(clientId, updateData) {
    try {
      const { data, error } = await supabase
        .from('clients')
        .update({
          ...updateData,
          updated_at: new Date().toISOString()
        })
        .eq('id', clientId)
        .select()
        .single()

      if (error) {
        return { success: false, error: error.message }
      }

      return { success: true, client: data }
    } catch (error) {
      console.error('Erro ao atualizar cliente:', error)
      return { success: false, error: error.message }
    }
  }

  /**
   * Provisiona vectorstore e assistente para um cliente existente que ainda não possui recursos
   * @param {Object} client - Registro do cliente (deve conter id, client_code)
   * @returns {Promise<{success: boolean, client?: Object, error?: string}>}
   */
  static async provisionResourcesForClient(client) {
    try {
      if (!client?.id || !client?.client_code) {
        return { success: false, error: 'Cliente inválido' }
      }

      // Gerar nomes únicos se necessário (mesmo hash para ambos)
      let assistantName, vectorstoreName
      if (!client.openai_assistant_id || !client.vectorstore_id) {
        const names = await this.generateUniqueNames(client.client_code)
        assistantName = names.assistantName
        vectorstoreName = names.vectorstoreName
      }

      // 1) Criar assistente se ausente
      let assistantId = client.openai_assistant_id
      if (!assistantId) {
        const asst = await OpenAIService.createAssistant(client.client_code, assistantName)
        if (asst.error) return { success: false, error: asst.error }
        assistantId = asst.assistantId
      }

      // 2) Criar vectorstore se ausente
      let vectorstoreId = client.vectorstore_id
      if (!vectorstoreId) {
        const vs = await OpenAIService.createVectorstore(client.client_code, vectorstoreName)
        if (vs.error) {
          // rollback do assistente recém-criado
          if (!client.openai_assistant_id && assistantId) await OpenAIService.deleteAssistant(assistantId)
          return { success: false, error: vs.error }
        }
        vectorstoreId = vs.vectorstoreId
      }

      // 3) Vincular vectorstore ao assistente
      const linkResult = await OpenAIService.linkVectorstoreToAssistant(assistantId, vectorstoreId)
      if (linkResult.error) {
        // rollback: deletar recursos recém-criados
        if (!client.openai_assistant_id && assistantId) await OpenAIService.deleteAssistant(assistantId)
        if (!client.vectorstore_id && vectorstoreId) await OpenAIService.deleteVectorstore(vectorstoreId)
        return { success: false, error: linkResult.error }
      }

      // Atualizar cliente
      const update = {}
      if (!client.vectorstore_id) update.vectorstore_id = vectorstoreId
      if (!client.openai_assistant_id) update.openai_assistant_id = assistantId

      if (Object.keys(update).length > 0) {
        return await this.updateClient(client.id, update)
      }

      return { success: true, client }
    } catch (error) {
      console.error('Erro ao provisionar recursos do cliente:', error)
      return { success: false, error: error.message }
    }
  }

  /**
   * Deleta cliente e seus recursos OpenAI
   * @param {string} clientId - ID do cliente
   * @returns {Promise<{success: boolean, error?: string}>}
   */
  static async deleteClient(clientId) {
    try {
      // Buscar dados do cliente primeiro
      const { data: client, error: fetchError } = await supabase
        .from('clients')
        .select('openai_assistant_id, vectorstore_id')
        .eq('id', clientId)
        .single()

      if (fetchError) {
        return { success: false, error: fetchError.message }
      }

      // Deletar assistente OpenAI
      if (client.openai_assistant_id) {
        await OpenAIService.deleteAssistant(client.openai_assistant_id)
      }

      // Deletar vectorstore OpenAI
      if (client.vectorstore_id) {
        await OpenAIService.deleteVectorstore(client.vectorstore_id)
      }

      // Deletar cliente do Supabase
      const { error } = await supabase
        .from('clients')
        .delete()
        .eq('id', clientId)

      if (error) {
        return { success: false, error: error.message }
      }

      return { success: true }
    } catch (error) {
      console.error('Erro ao deletar cliente:', error)
      return { success: false, error: error.message }
    }
  }

  /**
   * Lista todos os clientes de um usuário
   * @param {string} userId - ID do usuário
   * @returns {Promise<{success: boolean, clients?: Array, error?: string}>}
   */
  static async listClientsByUserId(userId) {
    try {
      const { data, error } = await supabase
        .from('clients')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })

      if (error) {
        return { success: false, error: error.message }
      }

      return { success: true, clients: data || [] }
    } catch (error) {
      console.error('Erro ao listar clientes:', error)
      return { success: false, error: error.message }
    }
  }
}

export default ClientService
