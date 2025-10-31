/**
 * Serviço para integração com HeyGen Streaming Avatar usando SDK oficial
 * Baseado na documentação: https://docs.heygen.com/docs/streaming-avatar-sdk
 */
import { StreamingAvatar, StreamingEvents, TaskType } from '@heygen/streaming-avatar'

export class HeyGenStreamingService {
  constructor() {
    this.avatar = null
    this.sessionId = null
    this.videoElement = null
    this.sessionToken = null
  }

  /**
   * Obtém o session token do backend (proxy)
   * @returns {Promise<string>} Session token
   */
  async getSessionToken() {
    if (this.sessionToken) {
      return this.sessionToken
    }

    try {
      const response = await fetch('/api/heygen/proxy', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'createSessionToken',
        }),
      })

      if (!response.ok) {
        const error = await response.json().catch(() => ({ error: response.statusText }))
        throw new Error(`Failed to get session token: ${error.message || error.error || response.statusText}`)
      }

      const data = await response.json()
      // O token pode estar em diferentes campos dependendo da resposta
      this.sessionToken = data.token || data.access_token || data.session_token || data.data?.token
      
      if (!this.sessionToken) {
        throw new Error('Session token not found in response')
      }

      return this.sessionToken
    } catch (error) {
      console.error('Error getting session token:', error)
      throw error
    }
  }

  /**
   * Lista avatares disponíveis
   */
  async listAvatars() {
    try {
      const response = await fetch('/api/heygen/proxy', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'listAvatars',
        }),
      })

      if (!response.ok) {
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
   * Cria uma nova sessão de streaming usando o SDK oficial
   * @param {string} avatarId - ID do avatar (opcional)
   * @returns {Promise<Object>} Session data
   */
  async createSession(avatarId = null) {
    try {
      // Obter session token primeiro
      const token = await this.getSessionToken()
      
      // Buscar avatar padrão se não fornecido
      if (!avatarId) {
        const avatars = await this.listAvatars()
        if (avatars.length > 0) {
          // Extrair o nome do avatar (pode estar em diferentes campos)
          avatarId = avatars[0].avatar_name || avatars[0].name || avatars[0].avatar_id || avatars[0].id
        }
      }

      // Criar instância do SDK
      this.avatar = new StreamingAvatar({ token })

      // Criar e iniciar sessão
      // O SDK gerencia automaticamente a conexão LiveKit
      const sessionData = await this.avatar.createStartAvatar({
        avatarName: avatarId || 'default',
        quality: 'high',
      })

      this.sessionId = sessionData.session_id
      console.log('✅ Session created with SDK:', this.sessionId)

      return sessionData
    } catch (error) {
      console.error('Error creating streaming session:', error)
      throw error
    }
  }

  /**
   * Conecta ao streaming do avatar e configura o elemento de vídeo
   * @param {string} sessionId - ID da sessão
   * @param {HTMLVideoElement} videoElement - Elemento de vídeo
   * @returns {Promise<void>}
   */
  async connectStreaming(sessionId, videoElement) {
    try {
      this.sessionId = sessionId
      this.videoElement = videoElement

      if (!this.avatar) {
        throw new Error('Avatar not initialized. Call createSession first.')
      }

      // Configurar event listeners antes de esperar pelo stream
      return new Promise((resolve, reject) => {
        // Listener para quando o stream estiver pronto
        const onStreamReady = (event) => {
          console.log('✅ Stream is ready')
          if (videoElement && event.detail) {
            // event.detail contém o MediaStream
            videoElement.srcObject = event.detail
            videoElement.play()
              .then(() => {
                console.log('✅ Video started playing')
                resolve()
              })
              .catch(err => {
                console.error('Error playing video:', err)
                reject(err)
              })
          } else {
            resolve()
          }
        }

        // Listener para desconexão
        const onDisconnected = () => {
          console.log('Stream disconnected')
          if (videoElement) {
            videoElement.srcObject = null
          }
        }

        // Listener para quando avatar começa a falar
        const onAvatarStart = () => {
          console.log('Avatar started speaking')
        }

        // Listener para quando avatar para de falar
        const onAvatarStop = () => {
          console.log('Avatar stopped speaking')
        }

        // Registrar listeners
        this.avatar.on(StreamingEvents.STREAM_READY, onStreamReady)
        this.avatar.on(StreamingEvents.STREAM_DISCONNECTED, onDisconnected)
        this.avatar.on(StreamingEvents.AVATAR_START, onAvatarStart)
        this.avatar.on(StreamingEvents.AVATAR_STOP, onAvatarStop)

        // Timeout de segurança (30 segundos)
        setTimeout(() => {
          if (!videoElement.srcObject) {
            console.warn('Stream ready event not received within timeout')
            reject(new Error('Stream timeout: STREAM_READY event not received'))
          }
        }, 30000)
      })
      
    } catch (error) {
      console.error('Error connecting to streaming:', error)
      throw error
    }
  }

  /**
   * Envia texto para o avatar falar
   * @param {string} text - Texto para o avatar falar
   */
  async sendText(text) {
    if (!this.avatar || !this.sessionId) {
      throw new Error('Session not initialized. Call createSession first.')
    }

    try {
      await this.avatar.speak({
        sessionId: this.sessionId,
        text: text,
        task_type: TaskType.REPEAT, // REPEAT = falar imediatamente
      })
      console.log('✅ Text sent to avatar:', text)
    } catch (error) {
      console.error('Error sending text:', error)
      throw error
    }
  }

  /**
   * Encerra a sessão de streaming
   */
  async disconnect() {
    try {
      if (this.avatar && this.sessionId) {
        await this.avatar.stopAvatar({ sessionId: this.sessionId })
        console.log('✅ Session stopped')
      }
    } catch (error) {
      console.error('Error stopping session:', error)
    }

    if (this.videoElement) {
      this.videoElement.srcObject = null
    }

    this.avatar = null
    this.sessionId = null
  }
}
