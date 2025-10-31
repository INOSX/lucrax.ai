/**
 * API Route para transcrição de áudio usando OpenAI Whisper
 * Mantém a chave da API segura no servidor
 */
export default async function handler(req, res) {
  // Configurar CORS
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type')

  if (req.method === 'OPTIONS') {
    res.status(200).end()
    return
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const openaiApiKey = process.env.OPENAI_API_KEY

  if (!openaiApiKey) {
    console.error('OpenAI API key missing')
    return res.status(500).json({ error: 'OpenAI API key not configured' })
  }

  try {
    // O arquivo vem como base64 no body
    const { file } = req.body

    if (!file) {
      return res.status(400).json({ error: 'No audio file provided' })
    }

    // Converter base64 para Buffer
    const fileBuffer = Buffer.from(file, 'base64')

    // Criar FormData para enviar para OpenAI usando multipart/form-data manual
    const boundary = '----WebKitFormBoundary' + Math.random().toString(16).substring(2)
    const formDataParts = []
    
    // Adicionar arquivo
    formDataParts.push(`--${boundary}`)
    formDataParts.push('Content-Disposition: form-data; name="file"; filename="audio.webm"')
    formDataParts.push('Content-Type: audio/webm')
    formDataParts.push('')
    formDataParts.push(fileBuffer)
    
    // Adicionar model
    formDataParts.push(`--${boundary}`)
    formDataParts.push('Content-Disposition: form-data; name="model"')
    formDataParts.push('')
    formDataParts.push('whisper-1')
    
    // Finalizar boundary
    formDataParts.push(`--${boundary}--`)
    
    // Concatenar todas as partes
    const formDataBuffer = Buffer.concat(
      formDataParts.map(part => 
        Buffer.isBuffer(part) ? part : Buffer.from(part + '\r\n', 'utf8')
      )
    )

    const response = await fetch('https://api.openai.com/v1/audio/transcriptions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openaiApiKey}`,
        'Content-Type': `multipart/form-data; boundary=${boundary}`,
      },
      body: formDataBuffer,
    })

    if (!response.ok) {
      const errorText = await response.text()
      console.error('OpenAI Whisper API error:', response.status, errorText)
      throw new Error(`OpenAI API error: ${response.status} - ${errorText}`)
    }

    const data = await response.json()
    return res.status(200).json(data)
  } catch (error) {
    console.error('Error in Whisper API route:', error)
    return res.status(500).json({ error: error.message || 'Failed to transcribe audio' })
  }
}
