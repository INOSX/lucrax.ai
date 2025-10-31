/**
 * API Route proxy para chamadas à API HeyGen
 * Resolve problemas de CORS fazendo chamadas do servidor
 */
export default async function handler(req, res) {
  // Configurar CORS
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization')

  if (req.method === 'OPTIONS') {
    res.status(200).end()
    return
  }

  const heygenApiKey = process.env.HEYGEN_API_KEY

  if (!heygenApiKey) {
    console.error('HeyGen API key missing')
    return res.status(500).json({ error: 'HeyGen API key not configured' })
  }

  const { action, ...params } = req.body || {}

  if (!action) {
    return res.status(400).json({ error: 'Action is required' })
  }

  const baseURL = 'https://api.heygen.com/v1'

  try {
    switch (action) {
      case 'listAvatars': {
        const response = await fetch(`${baseURL}/avatars`, {
          method: 'GET',
          headers: {
            'X-Api-Key': heygenApiKey,
          },
        })

        if (!response.ok) {
          const errorText = await response.text()
          throw new Error(`HeyGen API error: ${response.status} - ${errorText}`)
        }

        const data = await response.json()
        return res.status(200).json(data)
      }

      case 'listVoices': {
        const response = await fetch(`${baseURL}/voices`, {
          method: 'GET',
          headers: {
            'X-Api-Key': heygenApiKey,
          },
        })

        if (!response.ok) {
          const errorText = await response.text()
          throw new Error(`HeyGen API error: ${response.status} - ${errorText}`)
        }

        const data = await response.json()
        return res.status(200).json(data)
      }

      case 'createSession': {
        const requestBody = {}
        if (params.avatar_id) {
          requestBody.avatar_id = params.avatar_id
        }

        const response = await fetch(`${baseURL}/streaming.create`, {
          method: 'POST',
          headers: {
            'X-Api-Key': heygenApiKey,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(requestBody),
        })

        if (!response.ok) {
          const errorText = await response.text()
          throw new Error(`HeyGen API error: ${response.status} - ${errorText}`)
        }

        const data = await response.json()
        return res.status(200).json(data)
      }

      case 'getToken': {
        const response = await fetch(`${baseURL}/streaming.get_token`, {
          method: 'POST',
          headers: {
            'X-Api-Key': heygenApiKey,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            session_id: params.session_id,
            sdp: params.sdp,
          }),
        })

        if (!response.ok) {
          const errorText = await response.text()
          throw new Error(`HeyGen API error: ${response.status} - ${errorText}`)
        }

        const data = await response.json()
        return res.status(200).json(data)
      }

      case 'speak': {
        const response = await fetch(`${baseURL}/streaming.speak`, {
          method: 'POST',
          headers: {
            'X-Api-Key': heygenApiKey,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            session_id: params.session_id,
            text: params.text,
          }),
        })

        if (!response.ok) {
          const errorText = await response.text()
          throw new Error(`HeyGen API error: ${response.status} - ${errorText}`)
        }

        const data = await response.json()
        return res.status(200).json(data)
      }

      case 'stop': {
        const response = await fetch(`${baseURL}/streaming.stop`, {
          method: 'POST',
          headers: {
            'X-Api-Key': heygenApiKey,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            session_id: params.session_id,
          }),
        })

        if (!response.ok) {
          const errorText = await response.text()
          throw new Error(`HeyGen API error: ${response.status} - ${errorText}`)
        }

        const data = await response.json()
        return res.status(200).json(data)
      }

      default:
        return res.status(400).json({ error: 'Invalid action' })
    }
  } catch (error) {
    console.error('Error in HeyGen proxy:', error)
    return res.status(500).json({ error: error.message || 'Failed to process request' })
  }
}

