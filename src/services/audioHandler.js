/**
 * Audio Recorder para Speech-to-Text usando OpenAI Whisper API
 * Baseado na documentação: https://docs.heygen.com/docs/adding-speech-to-text-integration-to-demo-project
 */
export class AudioRecorder {
  constructor(onStatusChange, onTranscriptionComplete) {
    this.mediaRecorder = null
    this.audioChunks = []
    this.isRecording = false
    this.onStatusChange = onStatusChange
    this.onTranscriptionComplete = onTranscriptionComplete
  }

  async startRecording() {
    try {
      console.log('Requesting microphone access...')
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      console.log('Microphone access granted')
      
      this.mediaRecorder = new MediaRecorder(stream)
      this.audioChunks = []
      this.isRecording = true

      this.mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          console.log('Received audio chunk:', event.data.size, 'bytes')
          this.audioChunks.push(event.data)
        }
      }

      this.mediaRecorder.onstop = async () => {
        console.log('Recording stopped, processing audio...')
        const audioBlob = new Blob(this.audioChunks, { type: 'audio/webm' })
        console.log('Audio blob size:', audioBlob.size, 'bytes')
        await this.sendToWhisper(audioBlob)
      }

      this.mediaRecorder.start(1000) // Collect data every second
      console.log('Started recording')
      this.onStatusChange('Recording... Speak now')
    } catch (error) {
      console.error('Error starting recording:', error)
      this.onStatusChange('Error: ' + error.message)
    }
  }

  stopRecording() {
    if (this.mediaRecorder && this.isRecording) {
      console.log('Stopping recording...')
      this.mediaRecorder.stop()
      this.isRecording = false
      this.onStatusChange('Processing audio...')
      
      // Stop all tracks in the stream
      const stream = this.mediaRecorder.stream
      stream.getTracks().forEach(track => track.stop())
    }
  }

  async sendToWhisper(audioBlob) {
    try {
      console.log('Sending audio to Whisper API...')
      
      // Converter blob para base64 para enviar via JSON
      const base64 = await this.blobToBase64(audioBlob)
      
      const response = await fetch('/api/openai/whisper', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          file: base64,
        }),
      })

      if (!response.ok) {
        const errorText = await response.text()
        throw new Error(`HTTP error! status: ${response.status}, details: ${errorText}`)
      }

      const data = await response.json()
      console.log('Received transcription:', data.text)
      this.onStatusChange('')
      this.onTranscriptionComplete(data.text)
    } catch (error) {
      console.error('Error transcribing audio:', error)
      this.onStatusChange('Error: Failed to transcribe audio')
    }
  }

  blobToBase64(blob) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader()
      reader.onloadend = () => {
        // Remover o prefixo data:audio/webm;base64,
        const base64 = reader.result.split(',')[1]
        resolve(base64)
      }
      reader.onerror = reject
      reader.readAsDataURL(blob)
    })
  }
}

