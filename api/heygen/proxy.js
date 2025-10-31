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
  let rawBaseURL = process.env.NEXT_PUBLIC_BASE_API_URL || process.env.HEYGEN_BASE_URL || 'https://api.heygen.com'
  
  // Remover barras finais
  rawBaseURL = rawBaseURL.replace(/\/$/, '')
  
  // Para streaming, HeyGen usa v2; para outros endpoints, usa v1
  // Vamos criar ambas as URLs base
  const baseURLv1 = rawBaseURL + (rawBaseURL.includes('/v1') ? '' : '/v1')
  const baseURLv2 = rawBaseURL + (rawBaseURL.includes('/v2') ? '' : '/v2')
  const baseURL = baseURLv2 // Priorizar v2 para streaming (se não funcionar, tentaremos v1)
  
  console.log('HeyGen Proxy - Action:', action)
  console.log('HeyGen Proxy - Base URL:', baseURL)
  console.log('HeyGen Proxy - API Key exists:', !!heygenApiKey)
  console.log('HeyGen Proxy - API Key prefix:', heygenApiKey ? heygenApiKey.substring(0, 5) + '...' : 'N/A')

  try {
    switch (action) {
      case 'listAvatars': {
        // Tentar v2 primeiro, depois v1
        let response
        let lastError
        
        // Tentativa 1: v2/avatars
        try {
          console.log(`Fetching avatars from: ${baseURLv2}/avatars`)
          response = await fetch(`${baseURLv2}/avatars`, {
            method: 'GET',
            headers: {
              'X-Api-Key': heygenApiKey,
            },
          })
          
          console.log(`Avatars v2 response status: ${response.status}`)
          
          if (response.ok) {
            const data = await response.json()
            console.log(`✅ Avatars retrieved from v2. Data keys:`, Object.keys(data))
            return res.status(200).json(data)
          }
          lastError = await response.text()
          console.log(`Avatars v2 error: ${lastError.substring(0, 200)}`)
        } catch (err) {
          lastError = err.message
          console.error(`Avatars v2 exception: ${err.message}`)
        }
        
        // Tentativa 2: v1/avatars
        try {
          console.log(`Fetching avatars from: ${baseURLv1}/avatars`)
          response = await fetch(`${baseURLv1}/avatars`, {
            method: 'GET',
            headers: {
              'X-Api-Key': heygenApiKey,
            },
          })
          
          console.log(`Avatars v1 response status: ${response.status}`)
          
          if (response.ok) {
            const data = await response.json()
            console.log(`✅ Avatars retrieved from v1. Data keys:`, Object.keys(data))
            return res.status(200).json(data)
          }
          lastError = await response.text()
          console.log(`Avatars v1 error: ${lastError.substring(0, 200)}`)
        } catch (err) {
          lastError = err.message
          console.error(`Avatars v1 exception: ${err.message}`)
        }
        
        throw new Error(`HeyGen API error: ${response?.status || 'Unknown'} - ${lastError}`)
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

      case 'createSessionToken': {
        // Criar Session Token primeiro (conforme documentação: https://docs.heygen.com/reference/create-session-token)
        // Endpoint correto: POST https://api.heygen.com/v1/streaming.create_token
        console.log('Creating session token (required before streaming)')
        
        let response
        let lastError
        let lastStatus
        const endpoints = [
          { url: `${baseURLv1}/streaming.create_token`, name: 'v1 streaming.create_token (CORRETO)' },
          { url: `${rawBaseURL}/v1/streaming.create_token`, name: 'explicit v1 streaming.create_token' },
          { url: `${baseURLv2}/streaming.create_token`, name: 'v2 streaming.create_token' },
          { url: `${baseURLv1}/session/create_token`, name: 'v1 session/create_token' },
        ]
        
        for (let i = 0; i < endpoints.length; i++) {
          const endpoint = endpoints[i]
          try {
            console.log(`Trying endpoint ${i + 1}: ${endpoint.name} - ${endpoint.url}`)
            response = await fetch(endpoint.url, {
              method: 'POST',
              headers: {
                'X-Api-Key': heygenApiKey,
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({}),
            })
            
            lastStatus = response.status
            console.log(`Endpoint ${i + 1} (${endpoint.name}) response status: ${lastStatus}`)
            
            if (response.ok) {
              const data = await response.json()
              console.log(`✅ Session token created successfully via ${endpoint.name}`)
              return res.status(200).json(data)
            }
            lastError = await response.text()
            console.log(`Endpoint ${i + 1} error (first 200 chars): ${lastError.substring(0, 200)}`)
          } catch (err) {
            lastError = err.message
            console.error(`Endpoint ${i + 1} exception: ${err.message}`)
          }
        }

        const errorMsg = `Failed to create session token: Status ${lastStatus || 'Unknown'} - ${lastError ? lastError.substring(0, 500) : 'No response'}`
        console.error('❌ All createSessionToken endpoints failed. Final error:', errorMsg)
        throw new Error(errorMsg)
      }

      case 'createSession': {
        const requestBody = {}
        if (params.avatar_id) {
          requestBody.avatar_id = params.avatar_id
        }

        console.log('Creating session with body:', JSON.stringify(requestBody))
        console.log(`Base URL v1: ${baseURLv1}`)
        console.log(`Base URL v2: ${baseURLv2}`)
        
        // Tentar diferentes endpoints possíveis baseados na documentação
        // NOTA: Segundo a documentação, o endpoint pode ser /v1/streaming.new
        let response
        let lastError
        let lastStatus
        const endpoints = [
          { url: `${baseURLv1}/streaming.new`, name: 'v1 streaming.new' },
          { url: `${baseURLv1}/streaming/create`, name: 'v1 streaming/create' },
          { url: `${baseURLv2}/streaming.create_token`, name: 'v2 streaming.create_token' },
          { url: `${baseURLv2}/streaming/create_token`, name: 'v2 streaming/create_token' },
          { url: `${baseURLv2}/streaming.create`, name: 'v2 streaming.create' },
          { url: `${baseURLv2}/streaming/create`, name: 'v2 streaming/create' },
          { url: `${baseURLv1}/streaming.create_token`, name: 'v1 streaming.create_token' },
          { url: `${baseURLv1}/streaming/create_token`, name: 'v1 streaming/create_token' },
          { url: `${baseURLv1}/streaming.create`, name: 'v1 streaming.create' },
          { url: `${rawBaseURL}/streaming.create_token`, name: 'root streaming.create_token' },
        ]
        
        for (let i = 0; i < endpoints.length; i++) {
          const endpoint = endpoints[i]
          try {
            console.log(`Trying endpoint ${i + 1}: ${endpoint.name} - ${endpoint.url}`)
            response = await fetch(endpoint.url, {
              method: 'POST',
              headers: {
                'X-Api-Key': heygenApiKey,
                'Content-Type': 'application/json',
              },
              body: JSON.stringify(requestBody),
            })
            
            lastStatus = response.status
            console.log(`Endpoint ${i + 1} (${endpoint.name}) response status: ${lastStatus}`)
            
            if (response.ok) {
              const data = await response.json()
              console.log(`✅ Session created successfully via ${endpoint.name}`)
              return res.status(200).json(data)
            }
            lastError = await response.text()
            console.log(`Endpoint ${i + 1} error (first 200 chars): ${lastError.substring(0, 200)}`)
          } catch (err) {
            lastError = err.message
            console.error(`Endpoint ${i + 1} exception: ${err.message}`)
          }
        }

        // Se todas as tentativas falharam, retornar erro detalhado
        const errorMsg = `HeyGen API error: Status ${lastStatus || 'Unknown'} - ${lastError ? lastError.substring(0, 500) : 'No response'}`
        console.error('❌ All endpoints failed. Final error:', errorMsg)
        throw new Error(errorMsg)
      }

      case 'getToken': {
        console.log('Getting token for session:', params.session_id)
        console.log('SDP length:', params.sdp?.length || 0)
        
        const requestBody = {
          session_id: params.session_id,
          sdp: params.sdp,
        }
        
        let response
        let lastError
        let lastStatus
        const endpoints = [
          { url: `${baseURLv2}/streaming.get_token`, name: 'v2 streaming.get_token' },
          { url: `${baseURLv2}/streaming/get_token`, name: 'v2 streaming/get_token' },
          { url: `${baseURLv1}/streaming.get_token`, name: 'v1 streaming.get_token' },
          { url: `${baseURLv1}/streaming/get_token`, name: 'v1 streaming/get_token' },
          { url: `${rawBaseURL}/streaming.get_token`, name: 'root streaming.get_token' },
        ]
        
        for (let i = 0; i < endpoints.length; i++) {
          const endpoint = endpoints[i]
          try {
            console.log(`Trying endpoint ${i + 1}: ${endpoint.name} - ${endpoint.url}`)
            response = await fetch(endpoint.url, {
              method: 'POST',
              headers: {
                'X-Api-Key': heygenApiKey,
                'Content-Type': 'application/json',
              },
              body: JSON.stringify(requestBody),
            })
            
            lastStatus = response.status
            console.log(`Endpoint ${i + 1} (${endpoint.name}) response status: ${lastStatus}`)
            
            if (response.ok) {
              const data = await response.json()
              console.log(`✅ Token retrieved successfully via ${endpoint.name}`)
              return res.status(200).json(data)
            }
            lastError = await response.text()
            console.log(`Endpoint ${i + 1} error (first 200 chars): ${lastError.substring(0, 200)}`)
          } catch (err) {
            lastError = err.message
            console.error(`Endpoint ${i + 1} exception: ${err.message}`)
          }
        }

        const errorMsg = `Failed to get streaming token: HeyGen API error: ${lastStatus || 'Unknown'} - ${lastError ? lastError.substring(0, 500) : 'No response'}`
        console.error('❌ All getToken endpoints failed. Final error:', errorMsg)
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

