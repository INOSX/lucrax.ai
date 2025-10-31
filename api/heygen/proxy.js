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

  // Usar a URL base da variável de ambiente ou padrão
  const baseURL = process.env.NEXT_PUBLIC_BASE_API_URL || process.env.HEYGEN_BASE_URL || 'https://api.heygen.com/v1'
  
  console.log('HeyGen Proxy - Action:', action, 'Base URL:', baseURL)

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

        console.log('Creating session with body:', JSON.stringify(requestBody))
        
        // Tentar diferentes endpoints possíveis
        let response
        let lastError
        
        // Tentativa 1: /streaming.create
        try {
          response = await fetch(`${baseURL}/streaming.create`, {
            method: 'POST',
            headers: {
              'X-Api-Key': heygenApiKey,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify(requestBody),
          })
          
          if (response.ok) {
            const data = await response.json()
            return res.status(200).json(data)
          }
          lastError = await response.text()
        } catch (err) {
          lastError = err.message
        }
        
        // Tentativa 2: /streaming/create
        try {
          response = await fetch(`${baseURL}/streaming/create`, {
            method: 'POST',
            headers: {
              'X-Api-Key': heygenApiKey,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify(requestBody),
          })
          
          if (response.ok) {
            const data = await response.json()
            return res.status(200).json(data)
          }
          lastError = await response.text()
        } catch (err) {
          lastError = err.message
        }

        throw new Error(`HeyGen API error: ${response?.status || 'Unknown'} - ${lastError}`)
      }

      case 'getToken': {
        // Tentar diferentes endpoints possíveis
        let response
        let lastError
        
        // Tentativa 1: /streaming.get_token
        try {
          response = await fetch(`${baseURL}/streaming.get_token`, {
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
          
          if (response.ok) {
            const data = await response.json()
            return res.status(200).json(data)
          }
          lastError = await response.text()
        } catch (err) {
          lastError = err.message
        }
        
        // Tentativa 2: /streaming/get_token
        try {
          response = await fetch(`${baseURL}/streaming/get_token`, {
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
          
          if (response.ok) {
            const data = await response.json()
            return res.status(200).json(data)
          }
          lastError = await response.text()
        } catch (err) {
          lastError = err.message
        }

        throw new Error(`HeyGen API error: ${response?.status || 'Unknown'} - ${lastError}`)
      }

      case 'speak': {
        // Tentar diferentes endpoints possíveis
        let response
        let lastError
        
        // Tentativa 1: /streaming.speak
        try {
          response = await fetch(`${baseURL}/streaming.speak`, {
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
          
          if (response.ok) {
            const data = await response.json()
            return res.status(200).json(data)
          }
          lastError = await response.text()
        } catch (err) {
          lastError = err.message
        }
        
        // Tentativa 2: /streaming/speak
        try {
          response = await fetch(`${baseURL}/streaming/speak`, {
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
          
          if (response.ok) {
            const data = await response.json()
            return res.status(200).json(data)
          }
          lastError = await response.text()
        } catch (err) {
          lastError = err.message
        }

        throw new Error(`HeyGen API error: ${response?.status || 'Unknown'} - ${lastError}`)
      }

      case 'stop': {
        // Tentar diferentes endpoints possíveis
        let response
        let lastError
        
        // Tentativa 1: /streaming.stop
        try {
          response = await fetch(`${baseURL}/streaming.stop`, {
            method: 'POST',
            headers: {
              'X-Api-Key': heygenApiKey,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              session_id: params.session_id,
            }),
          })
          
          if (response.ok) {
            const data = await response.json()
            return res.status(200).json(data)
          }
          lastError = await response.text()
        } catch (err) {
          lastError = err.message
        }
        
        // Tentativa 2: /streaming/stop
        try {
          response = await fetch(`${baseURL}/streaming/stop`, {
            method: 'POST',
            headers: {
              'X-Api-Key': heygenApiKey,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              session_id: params.session_id,
            }),
          })
          
          if (response.ok) {
            const data = await response.json()
            return res.status(200).json(data)
          }
          lastError = await response.text()
        } catch (err) {
          lastError = err.message
        }

        throw new Error(`HeyGen API error: ${response?.status || 'Unknown'} - ${lastError}`)
      }

      default:
        return res.status(400).json({ error: 'Invalid action' })
    }
  } catch (error) {
    console.error('Error in HeyGen proxy:', error)
    console.error('Error stack:', error.stack)
    return res.status(500).json({ 
      error: error.message || 'Failed to process request',
      details: error.stack
    })
  }
}

