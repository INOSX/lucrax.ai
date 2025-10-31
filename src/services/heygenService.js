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
   * @param {string} avatarId - ID do avatar (opcional, usar padrão se não fornecido)
   * @param {string} voiceId - ID da voz (opcional, usar padrão se não fornecido)
   * @returns {Promise<Object>} Resposta da API com dados do vídeo
   */
  async generateAvatarVideo(text, avatarId = null, voiceId = null) {
    try {
      if (!this.apiKey) {
        throw new Error('HeyGen API key not configured')
      }

      // Listar avatares disponíveis se avatarId não for fornecido
      if (!avatarId || !voiceId) {
        const { avatar, voice } = await this.getDefaultAvatarAndVoice()
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
   * Lista avatares disponíveis
   * @returns {Promise<Array>} Lista de avatares
   */
  async listAvatars() {
    try {
      if (!this.apiKey) {
        throw new Error('HeyGen API key not configured')
      }

      const response = await fetch(`${this.baseURL}/avatars`, {
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

      return {
        avatar: avatars.length > 0 ? avatars[0].avatar_id : null,
        voice: voices.length > 0 ? voices[0].voice_id : null,
      }
    } catch (error) {
      console.error('Error getting default avatar and voice:', error)
      return { avatar: null, voice: null }
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

