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
  // NOTA: NEXT_PUBLIC_* variáveis são expostas no frontend, mas estamos no backend então funciona
  let baseURL = process.env.NEXT_PUBLIC_BASE_API_URL || process.env.HEYGEN_BASE_URL || 'https://api.heygen.com'
  
  // Remover barras finais e garantir /v1
  baseURL = baseURL.replace(/\/$/, '') // Remove barra final se existir
  if (!baseURL.endsWith('/v1')) {
    baseURL = baseURL + '/v1'
  }
  
  console.log('HeyGen Proxy - Action:', action)
  console.log('HeyGen Proxy - Base URL:', baseURL)
  console.log('HeyGen Proxy - API Key exists:', !!heygenApiKey)
  console.log('HeyGen Proxy - API Key prefix:', heygenApiKey ? heygenApiKey.substring(0, 5) + '...' : 'N/A')

  try {
    switch (action) {
      case 'listAvatars': {
        console.log(`Fetching avatars from: ${baseURL}/avatars`)
        const response = await fetch(`${baseURL}/avatars`, {
          method: 'GET',
          headers: {
            'X-Api-Key': heygenApiKey,
          },
        })

        console.log(`Avatars response status: ${response.status}`)

        if (!response.ok) {
          const errorText = await response.text()
          console.error(`Avatars error: ${errorText}`)
          throw new Error(`HeyGen API error: ${response.status} - ${errorText}`)
        }

        const data = await response.json()
        console.log(`Avatars response data keys:`, Object.keys(data))
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
        console.log(`Base URL being used: ${baseURL}`)
        
        // Tentar diferentes endpoints possíveis baseados na documentação
        let response
        let lastError
        let lastStatus
        
        // Tentativa 1: /streaming.create_token (endpoint mais comum)
        try {
          const url1 = `${baseURL}/streaming.create_token`
          console.log(`Trying endpoint 1: ${url1}`)
          response = await fetch(url1, {
            method: 'POST',
            headers: {
              'X-Api-Key': heygenApiKey,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify(requestBody),
          })
          
          lastStatus = response.status
          console.log(`Endpoint 1 (create_token) response status: ${lastStatus}`)
          
          if (response.ok) {
            const data = await response.json()
            console.log('Session created successfully via create_token')
            return res.status(200).json(data)
          }
          lastError = await response.text()
          console.log(`Endpoint 1 error: ${lastError.substring(0, 200)}`)
        } catch (err) {
          lastError = err.message
          console.error(`Endpoint 1 exception: ${err.message}`)
        }
        
        // Tentativa 2: /streaming.create (formato alternativo)
        try {
          const url2 = `${baseURL}/streaming.create`
          console.log(`Trying endpoint 2: ${url2}`)
          response = await fetch(url2, {
            method: 'POST',
            headers: {
              'X-Api-Key': heygenApiKey,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify(requestBody),
          })
          
          lastStatus = response.status
          console.log(`Endpoint 2 (create) response status: ${lastStatus}`)
          
          if (response.ok) {
            const data = await response.json()
            console.log('Session created successfully via create')
            return res.status(200).json(data)
          }
          lastError = await response.text()
          console.log(`Endpoint 2 error: ${lastError.substring(0, 200)}`)
        } catch (err) {
          lastError = err.message
          console.error(`Endpoint 2 exception: ${err.message}`)
        }
        
        // Tentativa 3: /streaming/create (formato REST)
        try {
          const url3 = `${baseURL}/streaming/create`
          console.log(`Trying endpoint 3: ${url3}`)
          response = await fetch(url3, {
            method: 'POST',
            headers: {
              'X-Api-Key': heygenApiKey,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify(requestBody),
          })
          
          lastStatus = response.status
          console.log(`Endpoint 3 (REST create) response status: ${lastStatus}`)
          
          if (response.ok) {
            const data = await response.json()
            console.log('Session created successfully via REST create')
            return res.status(200).json(data)
          }
          lastError = await response.text()
          console.log(`Endpoint 3 error: ${lastError.substring(0, 200)}`)
        } catch (err) {
          lastError = err.message
          console.error(`Endpoint 3 exception: ${err.message}`)
        }

        // Tentativa 4: v2/streaming.create_token (caso use v2)
        try {
          const url4 = baseURL.replace('/v1', '/v2') + '/streaming.create_token'
          console.log(`Trying endpoint 4: ${url4}`)
          response = await fetch(url4, {
            method: 'POST',
            headers: {
              'X-Api-Key': heygenApiKey,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify(requestBody),
          })
          
          lastStatus = response.status
          console.log(`Endpoint 4 (v2 create_token) response status: ${lastStatus}`)
          
          if (response.ok) {
            const data = await response.json()
            console.log('Session created successfully via v2 create_token')
            return res.status(200).json(data)
          }
          lastError = await response.text()
          console.log(`Endpoint 4 error: ${lastError.substring(0, 200)}`)
        } catch (err) {
          lastError = err.message
          console.error(`Endpoint 4 exception: ${err.message}`)
        }

        // Tentativa 5: Sem /v1 no path (URL base direta)
        try {
          const baseURLWithoutV1 = baseURL.replace('/v1', '')
          const url5 = `${baseURLWithoutV1}/streaming.create_token`
          console.log(`Trying endpoint 5: ${url5}`)
          response = await fetch(url5, {
            method: 'POST',
            headers: {
              'X-Api-Key': heygenApiKey,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify(requestBody),
          })
          
          lastStatus = response.status
          console.log(`Endpoint 5 (no /v1) response status: ${lastStatus}`)
          
          if (response.ok) {
            const data = await response.json()
            console.log('Session created successfully via endpoint without /v1')
            return res.status(200).json(data)
          }
          lastError = await response.text()
          console.log(`Endpoint 5 error: ${lastError.substring(0, 200)}`)
        } catch (err) {
          lastError = err.message
          console.error(`Endpoint 5 exception: ${err.message}`)
        }

        // Se todas as tentativas falharam, retornar erro detalhado
        const errorMsg = `HeyGen API error: Status ${lastStatus || 'Unknown'} - ${lastError ? lastError.substring(0, 500) : 'No response'}`
        console.error('All endpoints failed. Final error:', errorMsg)
        throw new Error(errorMsg)
      }

      case 'getToken': {
        console.log('Getting token for session:', params.session_id)
        console.log('SDP length:', params.sdp?.length || 0)
        
        // Tentar diferentes endpoints possíveis
        let response
        let lastError
        let lastStatus
        
        // Tentativa 1: /streaming.get_token (formato com ponto)
        try {
          const url1 = `${baseURL}/streaming.get_token`
          console.log(`Trying endpoint 1: ${url1}`)
          response = await fetch(url1, {
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
          
          lastStatus = response.status
          console.log(`Endpoint 1 (get_token) response status: ${lastStatus}`)
          
          if (response.ok) {
            const data = await response.json()
            console.log('Token retrieved successfully via get_token')
            return res.status(200).json(data)
          }
          lastError = await response.text()
          console.log(`Endpoint 1 error: ${lastError.substring(0, 200)}`)
        } catch (err) {
          lastError = err.message
          console.error(`Endpoint 1 exception: ${err.message}`)
        }
        
        // Tentativa 2: /streaming/get_token (formato REST)
        try {
          const url2 = `${baseURL}/streaming/get_token`
          console.log(`Trying endpoint 2: ${url2}`)
          response = await fetch(url2, {
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
          
          lastStatus = response.status
          console.log(`Endpoint 2 (REST get_token) response status: ${lastStatus}`)
          
          if (response.ok) {
            const data = await response.json()
            console.log('Token retrieved successfully via REST get_token')
            return res.status(200).json(data)
          }
          lastError = await response.text()
          console.log(`Endpoint 2 error: ${lastError.substring(0, 200)}`)
        } catch (err) {
          lastError = err.message
          console.error(`Endpoint 2 exception: ${err.message}`)
        }

        const errorMsg = `Failed to get streaming token: HeyGen API error: ${lastStatus || 'Unknown'} - ${lastError ? lastError.substring(0, 500) : 'No response'}`
        console.error('All getToken endpoints failed. Final error:', errorMsg)
        throw new Error(errorMsg)
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

