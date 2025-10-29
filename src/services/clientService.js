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
      
      // Criar vectorstore
      const vectorstoreResult = await OpenAIService.createVectorstore(clientCode)
      if (vectorstoreResult.error) {
        return { success: false, error: `Erro ao criar vectorstore: ${vectorstoreResult.error}` }
      }

      // Criar assistente
      const assistantResult = await OpenAIService.createAssistant(clientCode, vectorstoreResult.vectorstoreId)
      if (assistantResult.error) {
        // Se falhar ao criar assistente, deletar vectorstore
        await OpenAIService.deleteVectorstore(vectorstoreResult.vectorstoreId)
        return { success: false, error: `Erro ao criar assistente: ${assistantResult.error}` }
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
        await OpenAIService.deleteAssistant(assistantResult.assistantId)
        await OpenAIService.deleteVectorstore(vectorstoreResult.vectorstoreId)
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

      // Criar vectorstore se ausente
      let vectorstoreId = client.vectorstore_id
      if (!vectorstoreId) {
        const vs = await OpenAIService.createVectorstore(client.client_code)
        if (vs.error) return { success: false, error: vs.error }
        vectorstoreId = vs.vectorstoreId
      }

      // Criar assistente se ausente e vincular ao vectorstore
      let assistantId = client.openai_assistant_id
      if (!assistantId) {
        const asst = await OpenAIService.createAssistant(client.client_code, vectorstoreId)
        if (asst.error) {
          // rollback do vectorstore recém-criado
          if (!client.vectorstore_id && vectorstoreId) await OpenAIService.deleteVectorstore(vectorstoreId)
          return { success: false, error: asst.error }
        }
        assistantId = asst.assistantId
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
