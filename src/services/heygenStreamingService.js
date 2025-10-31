/**
 * Serviço para integração com HeyGen Streaming Avatar usando SDK oficial
 * Baseado na documentação: https://docs.heygen.com/docs/streaming-avatar-sdk
 */
import StreamingAvatar, { StreamingEvents, TaskType } from '@heygen/streaming-avatar'

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
   * Configura os event listeners do avatar
   * @param {HTMLVideoElement} videoElement - Elemento de vídeo
   * @returns {Promise<void>} Resolve quando o stream estiver pronto
   */
  setupEventListeners(videoElement) {
    return new Promise((resolve, reject) => {
      if (!this.avatar) {
        reject(new Error('Avatar not initialized'))
        return
      }

      let streamReady = false
      let timeoutId = null

      // Listener para quando o stream estiver pronto
      const onStreamReady = (event) => {
        console.log('✅ Stream is ready event received')
        streamReady = true
        
        if (timeoutId) {
          clearTimeout(timeoutId)
          timeoutId = null
        }

        // O MediaStream está disponível na propriedade mediaStream do avatar
        const stream = this.avatar.mediaStream || (event && event.detail && event.detail.stream) || (event && event.detail)
        
        if (videoElement && stream) {
          console.log('Setting video srcObject from stream')
          videoElement.srcObject = stream
          videoElement.play()
            .then(() => {
              console.log('✅ Video started playing')
              resolve()
            })
            .catch(err => {
              console.error('Error playing video:', err)
              // Não rejeitar aqui, apenas logar o erro
              // O stream pode estar pronto mesmo que o play falhe inicialmente
              resolve()
            })
        } else {
          // Verificar novamente após um breve delay
          setTimeout(() => {
            if (this.avatar && this.avatar.mediaStream) {
              console.log('Setting video srcObject from avatar.mediaStream (delayed)')
              videoElement.srcObject = this.avatar.mediaStream
              videoElement.play()
                .then(() => {
                  console.log('✅ Video started playing (delayed)')
                  resolve()
                })
                .catch(err => {
                  console.error('Error playing video (delayed):', err)
                  resolve()
                })
            } else {
              console.warn('Stream ready but no mediaStream found')
              resolve()
            }
          }, 1000)
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
      const onAvatarStartTalking = () => {
        console.log('Avatar started speaking')
      }

      // Listener para quando avatar para de falar
      const onAvatarStopTalking = () => {
        console.log('Avatar stopped speaking')
      }

      // Registrar listeners ANTES de iniciar a sessão
      this.avatar.on(StreamingEvents.STREAM_READY, onStreamReady)
      this.avatar.on(StreamingEvents.STREAM_DISCONNECTED, onDisconnected)
      this.avatar.on(StreamingEvents.AVATAR_START_TALKING, onAvatarStartTalking)
      this.avatar.on(StreamingEvents.AVATAR_STOP_TALKING, onAvatarStopTalking)

      // Verificar periodicamente se o mediaStream está disponível
      const checkInterval = setInterval(() => {
        if (this.avatar && this.avatar.mediaStream && !videoElement.srcObject) {
          console.log('MediaStream detected via polling, setting video srcObject')
          streamReady = true
          clearInterval(checkInterval)
          if (timeoutId) {
            clearTimeout(timeoutId)
            timeoutId = null
          }
          videoElement.srcObject = this.avatar.mediaStream
          videoElement.play()
            .then(() => {
              console.log('✅ Video started playing (via polling)')
              resolve()
            })
            .catch(err => {
              console.error('Error playing video (via polling):', err)
              resolve()
            })
        }
      }, 500)

      // Timeout de segurança aumentado para 60 segundos
      timeoutId = setTimeout(() => {
        clearInterval(checkInterval)
        if (!streamReady && !videoElement.srcObject) {
          console.warn('Stream ready event not received within timeout')
          // Verificar uma última vez se o mediaStream está disponível
          if (this.avatar && this.avatar.mediaStream) {
            console.log('MediaStream found after timeout, attempting to use it')
            videoElement.srcObject = this.avatar.mediaStream
            videoElement.play()
              .then(() => {
                console.log('✅ Video started playing (after timeout)')
                resolve()
              })
              .catch(err => {
                console.error('Error playing video (after timeout):', err)
                // Não rejeitar, apenas logar
                resolve()
              })
          } else {
            reject(new Error('Stream timeout: STREAM_READY event not received and mediaStream not available'))
          }
        } else {
          // Stream está pronto, apenas limpar
          clearInterval(checkInterval)
        }
      }, 60000) // 60 segundos
    })
  }

  /**
   * Cria uma nova sessão de streaming usando o SDK oficial
   * @param {string} avatarId - ID do avatar (opcional)
   * @param {HTMLVideoElement} videoElement - Elemento de vídeo (opcional, pode ser configurado depois)
   * @returns {Promise<Object>} Session data
   */
  async createSession(avatarId = null, videoElement = null) {
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

      // Configurar event listeners ANTES de criar a sessão se videoElement fornecido
      let streamReadyPromise = null
      if (videoElement) {
        this.videoElement = videoElement
        streamReadyPromise = this.setupEventListeners(videoElement)
      }

      // Criar e iniciar sessão
      // O SDK gerencia automaticamente a conexão LiveKit
      const sessionData = await this.avatar.createStartAvatar({
        avatarName: avatarId || 'default',
        quality: 'high',
      })

      this.sessionId = sessionData.session_id
      console.log('✅ Session created with SDK:', this.sessionId)

      // Aguardar o stream ficar pronto se listeners foram configurados
      if (streamReadyPromise) {
        await streamReadyPromise
      }

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

      // Se os listeners ainda não foram configurados, configurar agora
      await this.setupEventListeners(videoElement)
      
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
      if (this.avatar) {
        await this.avatar.stopAvatar()
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
