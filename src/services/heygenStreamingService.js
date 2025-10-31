/**
 * Serviço para integração com HeyGen Streaming Avatar API
 * Baseado na documentação: https://docs.heygen.com/docs/streaming-api-overview
 * 
 * NOTA: Esta implementação usa a API REST da HeyGen para criar sessões de streaming.
 * Para WebRTC completo, pode ser necessário usar o SDK oficial da HeyGen.
 */
export class HeyGenStreamingService {
  constructor() {
    // API key não é mais necessária no frontend, pois usamos proxy no backend
    this.sessionId = null
    this.pc = null
    this.videoElement = null
  }

  /**
   * Cria uma nova sessão de streaming
   * @param {string} avatarId - ID do avatar (opcional)
   * @returns {Promise<string>} Session ID e token
   */
  async createSession(avatarId = null) {
    try {
      // Buscar avatar padrão se não fornecido
      if (!avatarId) {
        const avatars = await this.listAvatars()
        if (avatars.length > 0) {
          avatarId = avatars[0].avatar_id || avatars[0].id
        }
      }

      const response = await fetch('/api/heygen/proxy', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'createSession',
          avatar_id: avatarId,
        }),
      })

      if (!response.ok) {
        const error = await response.json().catch(() => ({ error: response.statusText }))
        throw new Error(`HeyGen API error: ${error.message || error.error || response.statusText}`)
      }

      const data = await response.json()
      this.sessionId = data.session_id
      return data
    } catch (error) {
      console.error('Error creating streaming session:', error)
      throw error
    }
  }

  /**
   * Conecta ao streaming do avatar usando WebRTC
   * @param {string} sessionId - ID da sessão
   * @param {Object} sdpOffer - SDP offer do WebRTC
   * @returns {Promise<Object>} SDP answer
   */
  async connectWithSDP(sessionId, sdpOffer) {
    try {
      const response = await fetch('/api/heygen/proxy', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'getToken',
          session_id: sessionId,
          sdp: sdpOffer,
        }),
      })

      if (!response.ok) {
        const error = await response.json().catch(() => ({ error: response.statusText }))
        throw new Error(`Failed to get streaming token: ${error.message || error.error || response.statusText}`)
      }

      return await response.json()
    } catch (error) {
      console.error('Error connecting with SDP:', error)
      throw error
    }
  }

  /**
   * Conecta ao WebRTC stream do avatar
   * @param {string} sessionId - ID da sessão
   * @param {HTMLVideoElement} videoElement - Elemento de vídeo
   * @returns {Promise<RTCPeerConnection>}
   */
  async connectStreaming(sessionId, videoElement) {
    try {
      this.sessionId = sessionId
      this.videoElement = videoElement

      // Criar PeerConnection
      const pc = new RTCPeerConnection({
        iceServers: [{ urls: 'stun:stun.l.google.com:19302' }],
      })

      // Receber stream de vídeo do avatar
      pc.ontrack = (event) => {
        if (event.track.kind === 'video' && videoElement) {
          videoElement.srcObject = event.streams[0]
          videoElement.play().catch(err => console.error('Error playing video:', err))
        }
      }

      pc.oniceconnectionstatechange = () => {
        console.log('ICE connection state:', pc.iceConnectionState)
        if (pc.iceConnectionState === 'failed' || pc.iceConnectionState === 'disconnected') {
          console.warn('Connection lost, attempting reconnect...')
        }
      }

      // Criar offer
      const offer = await pc.createOffer()
      await pc.setLocalDescription(offer)

      // Enviar offer para HeyGen e obter answer
      const { sdp, sdp_type } = await this.connectWithSDP(sessionId, offer.sdp)

      // Definir answer remoto
      await pc.setRemoteDescription({ type: sdp_type || 'answer', sdp })

      // Configurar captura de áudio do usuário para envio
      try {
        const audioStream = await navigator.mediaDevices.getUserMedia({ audio: true })
        audioStream.getAudioTracks().forEach((track) => {
          pc.addTrack(track, audioStream)
        })
      } catch (audioError) {
        console.warn('Could not capture user audio:', audioError)
      }

      this.pc = pc
      return pc
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
    if (!this.sessionId) {
      throw new Error('Session not initialized')
    }

    try {
      const response = await fetch('/api/heygen/proxy', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'speak',
          session_id: this.sessionId,
          text,
        }),
      })

      if (!response.ok) {
        const error = await response.json().catch(() => ({ error: response.statusText }))
        throw new Error(`Failed to send text: ${error.message || error.error || response.statusText}`)
      }

      return await response.json()
    } catch (error) {
      console.error('Error sending text:', error)
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
   * Encerra a sessão de streaming
   */
  async disconnect() {
    if (this.pc) {
      this.pc.close()
      this.pc = null
    }

    if (this.sessionId) {
      try {
        await fetch('/api/heygen/proxy', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            action: 'stop',
            session_id: this.sessionId,
          }),
        })
      } catch (error) {
        console.error('Error stopping session:', error)
      }
      this.sessionId = null
    }

    if (this.videoElement) {
      this.videoElement.srcObject = null
    }
  }
}
