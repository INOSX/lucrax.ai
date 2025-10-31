/**
 * Serviço para integração com HeyGen API
 * Baseado na documentação: https://docs.heygen.com
 */

export class HeyGenService {
  constructor() {
    this.apiKey = import.meta.env.HEYGEN_API_KEY || ''
    this.baseURL = 'https://api.heygen.com/v1'
  }

  /**
   * Gera um vídeo com avatar da HeyGen
   * @param {string} text - Texto para o avatar falar
   * @param {string} avatarId - ID do avatar (opcional, buscar automaticamente se não fornecido)
   * @param {string} voiceId - ID da voz (opcional, buscar automaticamente se não fornecido)
   * @returns {Promise<Object>} Resposta da API com dados do vídeo
   */
  async generateAvatarVideo(text, avatarId = null, voiceId = null) {
    try {
      if (!this.apiKey) {
        throw new Error('HeyGen API key not configured')
      }

      // Buscar avatar e voz padrão se não fornecidos
      if (!avatarId || !voiceId) {
        const { avatar, voice } = await this.getDefaultAvatarAndVoice()
        if (!avatar || !voice) {
          throw new Error('Não foi possível encontrar avatar ou voz disponível')
        }
        avatarId = avatarId || avatar
        voiceId = voiceId || voice
      }

      const response = await fetch(`${this.baseURL}/video/generate`, {
        method: 'POST',
        headers: {
          'X-Api-Key': this.apiKey,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          video_input: {
            character: {
              type: 'avatar',
              avatar_id: avatarId,
            },
            background: {
              type: 'color',
              value: '#FFFFFF',
            },
          },
          audio_input: {
            text,
            voice_id: voiceId,
          },
        }),
      })

      if (!response.ok) {
        const error = await response.json().catch(() => ({ error: response.statusText }))
        throw new Error(`HeyGen API error: ${error.message || error.error || response.statusText}`)
      }

      return await response.json()
    } catch (error) {
      console.error('Error generating HeyGen video:', error)
      throw error
    }
  }

  /**
   * Lista avatares disponíveis (usando MCP se disponível, senão API direta)
   * @returns {Promise<Array>} Lista de avatares
   */
  async listAvatars() {
    try {
      if (!this.apiKey) {
        throw new Error('HeyGen API key not configured')
      }

      // Tentar usar API direta
      const response = await fetch(`${this.baseURL}/avatars`, {
        method: 'GET',
        headers: {
          'X-Api-Key': this.apiKey,
        },
      })

      if (!response.ok) {
        // Se falhar, retornar array vazio e o código usará valores padrão
        console.warn('Error listing avatars from API, will use defaults')
        return []
      }

      const data = await response.json()
      return data.data || data.avatars || []
    } catch (error) {
      console.error('Error listing avatars:', error)
      return []
    }
  }

  /**
   * Lista vozes disponíveis
   * @returns {Promise<Array>} Lista de vozes
   */
  async listVoices() {
    try {
      if (!this.apiKey) {
        throw new Error('HeyGen API key not configured')
      }

      const response = await fetch(`${this.baseURL}/voices`, {
        method: 'GET',
        headers: {
          'X-Api-Key': this.apiKey,
        },
      })

      if (!response.ok) {
        throw new Error(`HeyGen API error: ${response.statusText}`)
      }

      const data = await response.json()
      return data.data || []
    } catch (error) {
      console.error('Error listing voices:', error)
      return []
    }
  }

  /**
   * Obtém avatar e voz padrão (primeiro disponível)
   * @returns {Promise<Object>} { avatar: string, voice: string }
   */
  async getDefaultAvatarAndVoice() {
    try {
      const [avatars, voices] = await Promise.all([
        this.listAvatars(),
        this.listVoices(),
      ])

      // Tentar encontrar avatar e voz válidos
      let avatarId = null
      let voiceId = null

      // Para avatar: procurar por avatar_id, id, ou usar o primeiro item
      if (avatars.length > 0) {
        const firstAvatar = avatars[0]
        avatarId = firstAvatar.avatar_id || firstAvatar.id || (typeof firstAvatar === 'string' ? firstAvatar : null)
      }

      // Para voz: procurar por voice_id, id, ou usar o primeiro item
      if (voices.length > 0) {
        const firstVoice = voices[0]
        voiceId = firstVoice.voice_id || firstVoice.id || (typeof firstVoice === 'string' ? firstVoice : null)
      }

      // Fallback: usar valores padrão conhecidos se nenhum for encontrado
      if (!avatarId) {
        console.warn('No avatar found, using default')
        avatarId = 'Josh' // Exemplo - pode precisar ser ajustado
      }

      if (!voiceId) {
        console.warn('No voice found, using default')
        voiceId = '8bc1f710-8803-4f4b-9cf2-4e1c8f3f5e6a' // Exemplo - pode precisar ser ajustado
      }

      return {
        avatar: avatarId,
        voice: voiceId,
      }
    } catch (error) {
      console.error('Error getting default avatar and voice:', error)
      // Retornar valores padrão como fallback
      return {
        avatar: 'Josh',
        voice: '8bc1f710-8803-4f4b-9cf2-4e1c8f3f5e6a',
      }
    }
  }

  /**
   * Verifica o status de um vídeo
   * @param {string} videoId - ID do vídeo
   * @returns {Promise<Object>} Status do vídeo
   */
  async getVideoStatus(videoId) {
    try {
      if (!this.apiKey) {
        throw new Error('HeyGen API key not configured')
      }

      const response = await fetch(`${this.baseURL}/video_status/${videoId}`, {
        method: 'GET',
        headers: {
          'X-Api-Key': this.apiKey,
        },
      })

      if (!response.ok) {
        throw new Error(`HeyGen API error: ${response.statusText}`)
      }

      return await response.json()
    } catch (error) {
      console.error('Error getting video status:', error)
      throw error
    }
  }
}

