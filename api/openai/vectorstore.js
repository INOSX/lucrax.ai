import OpenAI from 'openai'

// Inicializar cliente OpenAI fora da função para reutilização
let openaiClient

function initializeOpenAI() {
  if (!openaiClient) {
    try {
      openaiClient = new OpenAI({
        apiKey: process.env.OPENAI_API_KEY,
      })
      console.log('Cliente OpenAI inicializado com sucesso')
    } catch (error) {
      console.error('Erro ao inicializar cliente OpenAI:', error)
      return null
    }
  }
  return openaiClient
}

export default async function handler(req, res) {
  // Inicializar ou obter cliente OpenAI
  const openaiClient = initializeOpenAI()
  if (!openaiClient) {
    return res.status(500).json({ error: 'Erro ao inicializar cliente OpenAI' })
  }
  // Configurar CORS
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization')

  if (req.method === 'OPTIONS') {
    res.status(200).end()
    return
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  // Verificar se a chave API está configurada
  if (!process.env.OPENAI_API_KEY) {
    console.error('OPENAI_API_KEY não configurada')
    return res.status(500).json({ error: 'OpenAI API key not configured' })
  }

  // Aviso (não bloquear) se a propriedade files não existir no SDK
  if (!openaiClient.files) {
    console.warn('Aviso: propriedade files não encontrada no cliente OpenAI; usaremos REST como fallback quando necessário')
  }

  try {
    const { action, ...params } = req.body
    console.log('API OpenAI - Action:', action, 'Params keys:', Object.keys(params))
    console.log('API OpenAI - OpenAI client type:', typeof openaiClient)
    console.log('API OpenAI - OpenAI beta type:', typeof openaiClient.beta)
    console.log('API OpenAI - OpenAI files type:', typeof openaiClient.files)
    console.log('API OpenAI - OpenAI files.create type:', typeof openaiClient.files?.create)
    console.log('API OpenAI - OpenAI beta.assistants type:', typeof openaiClient.beta?.assistants)
    console.log('API OpenAI - OpenAI beta.vector_stores type:', typeof openaiClient.beta?.vector_stores)

    switch (action) {
      case 'createVectorstore':
        console.log('Criando vectorstore...', { name: params.name, assistantId: params.assistantId })
        
        // Verificar se o cliente OpenAI está funcionando
        console.log('OpenAI client:', !!openaiClient)
        console.log('OpenAI beta:', !!openaiClient.beta)
        console.log('OpenAI beta vector_stores:', !!openaiClient.beta?.vector_stores)
        
        // Criar vectorstore usando a API correta
        let vectorstore
        try {
          vectorstore = await openaiClient.beta.vector_stores.create({
            name: params.name,
            description: params.description,
          })
        } catch (error) {
          console.error('Erro ao criar vectorstore via SDK:', error)
          // Fallback: usar API REST diretamente
          const response = await fetch('https://api.openai.com/v1/vector_stores', {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              name: params.name,
              description: params.description,
            })
          })
          
          if (!response.ok) {
            throw new Error(`API REST falhou: ${response.status} ${response.statusText}`)
          }
          
          vectorstore = await response.json()
        }
        
        console.log('Vectorstore criado:', vectorstore.id)

        return res.status(200).json({ vectorstoreId: vectorstore.id })

      case 'createAssistant':
        console.log('Criando assistente...', { name: params.name })
        
        // Criar assistente sem vectorstore inicialmente
        const assistant = await openaiClient.beta.assistants.create({
          name: params.name,
          instructions: params.instructions,
          model: "gpt-4o-mini",
          tools: [{ type: "file_search" }]
          // Não incluir tool_resources inicialmente
        })
        
        console.log('Assistente criado:', assistant.id)
        return res.status(200).json({ assistantId: assistant.id })

      case 'linkVectorstoreToAssistant':
        console.log('Vinculando vectorstore ao assistente...', { 
          assistantId: params.assistantId, 
          vectorstoreId: params.vectorstoreId 
        })
        
        await openaiClient.beta.assistants.update(params.assistantId, {
          tool_resources: {
            file_search: { vector_store_ids: [params.vectorstoreId] }
          },
          tools: [{ type: 'file_search' }]
        })
        
        console.log('Vectorstore vinculado ao assistente com sucesso')
        return res.status(200).json({ success: true })

      case 'uploadFile':
        console.log('UploadFile - Params:', { 
          vectorstoreId: params.vectorstoreId, 
          dataLength: params.data?.length, 
          fileName: params.fileName, 
          fileType: params.fileType 
        })
        
        // Processar arquivo base64 diretamente como Buffer
        const fileBuffer = Buffer.from(params.data || '', 'base64')
        console.log('UploadFile - File buffer created, length:', fileBuffer.length)
        
        const filename = params.fileName || 'upload.csv'
        const mimeType = params.fileType || 'text/csv'

        // Tentar pelo SDK primeiro; se falhar, usar REST
        let uploadedFileId
        try {
          if (!openaiClient?.files?.create) throw new Error('SDK files.create indisponível')

          // Criar Blob a partir do buffer (suportado no Node 18+)
          const blob = new Blob([fileBuffer], { type: mimeType })
          // O SDK aceita Blob diretamente
          const file = await openaiClient.files.create({
            file: blob,
            purpose: 'assistants',
            filename
          })
          uploadedFileId = file.id
          console.log('UploadFile - File uploaded via SDK:', uploadedFileId)
        } catch (sdkErr) {
          console.warn('Upload via SDK falhou, tentando REST...', sdkErr?.message)
          // REST: /v1/files com multipart form-data
          const form = new FormData()
          const blob = new Blob([fileBuffer], { type: mimeType })
          form.append('file', blob, filename)
          form.append('purpose', 'assistants')

          const uploadResp = await fetch('https://api.openai.com/v1/files', {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`
            },
            body: form
          })
          if (!uploadResp.ok) {
            const txt = await uploadResp.text()
            throw new Error(`Falha no upload de arquivo (REST): ${uploadResp.status} ${uploadResp.statusText} - ${txt}`)
          }
          const uploadJson = await uploadResp.json()
          uploadedFileId = uploadJson.id
          console.log('UploadFile - File uploaded via REST:', uploadedFileId)
        }

        // Associar ao vector store (SDK se disponível; senão REST)
        try {
          if (!openaiClient?.beta?.vector_stores?.files?.create) throw new Error('SDK vector_stores.files.create indisponível')
          await openaiClient.beta.vector_stores.files.create(
            params.vectorstoreId,
            { file_id: uploadedFileId }
          )
          console.log('UploadFile - File associated to vectorstore via SDK:', params.vectorstoreId)
        } catch (sdkAssocErr) {
          console.warn('Associação via SDK falhou, tentando REST...', sdkAssocErr?.message)
          const assocResp = await fetch(`https://api.openai.com/v1/vector_stores/${params.vectorstoreId}/files`, {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
              'Content-Type': 'application/json',
              'OpenAI-Beta': 'assistants=v2'
            },
            body: JSON.stringify({ file_id: uploadedFileId })
          })
          if (!assocResp.ok) {
            const txt = await assocResp.text()
            throw new Error(`Falha ao associar arquivo ao vectorstore (REST): ${assocResp.status} ${assocResp.statusText} - ${txt}`)
          }
          console.log('UploadFile - File associated to vectorstore via REST:', params.vectorstoreId)
        }

        return res.status(200).json({ fileId: uploadedFileId })

      case 'deleteVectorstore':
        console.log('Deletando vectorstore...', params.vectorstoreId)
        
        try {
          await openaiClient.beta.vector_stores.del(params.vectorstoreId)
          console.log('Vectorstore deletado via SDK')
        } catch (error) {
          console.error('Erro ao deletar vectorstore via SDK:', error)
          // Fallback: usar API REST diretamente
          const response = await fetch(`https://api.openai.com/v1/vector_stores/${params.vectorstoreId}`, {
            method: 'DELETE',
            headers: {
              'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
              'OpenAI-Beta': 'assistants=v2'
            }
          })
          
          if (!response.ok) {
            throw new Error(`API REST falhou: ${response.status} ${response.statusText}`)
          }
          
          console.log('Vectorstore deletado via API REST')
        }
        
        return res.status(200).json({ success: true })

      case 'deleteAssistant':
        await openaiClient.beta.assistants.del(params.assistantId)
        return res.status(200).json({ success: true })

      case 'checkAssistantExists':
        console.log('Verificando se assistente existe...', params.assistantId)
        try {
          const assistant = await openaiClient.beta.assistants.retrieve(params.assistantId)
          console.log('Assistente encontrado:', assistant.id)
          return res.status(200).json({ exists: true, assistant })
        } catch (error) {
          if (error.status === 404) {
            console.log('Assistente não encontrado')
            return res.status(200).json({ exists: false })
          }
          throw error
        }

      case 'checkVectorstoreExists':
        console.log('Verificando se vectorstore existe...', params.vectorstoreId)
        try {
          let vectorstore
          if (openaiClient?.beta?.vector_stores?.retrieve) {
            vectorstore = await openaiClient.beta.vector_stores.retrieve(params.vectorstoreId)
          } else {
            // Fallback REST
            const response = await fetch(`https://api.openai.com/v1/vector_stores/${params.vectorstoreId}`, {
              headers: {
                'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
                'OpenAI-Beta': 'assistants=v2'
              }
            })
            if (!response.ok) {
              if (response.status === 404) {
                return res.status(200).json({ exists: false })
              }
              throw new Error(`API REST falhou: ${response.status} ${response.statusText}`)
            }
            vectorstore = await response.json()
          }
          console.log('Vectorstore encontrado:', vectorstore.id)
          return res.status(200).json({ exists: true, vectorstore })
        } catch (error) {
          if (error.status === 404) {
            console.log('Vectorstore não encontrado')
            return res.status(200).json({ exists: false })
          }
          throw error
        }

      case 'listFiles':
        // Lista arquivos de um vectorstore e enriquece com dados do arquivo
        try {
          const { vectorstoreId, limit = 100, after } = params
          if (!vectorstoreId) {
            return res.status(400).json({ error: 'vectorstoreId é obrigatório' })
          }

          // Buscar lista de arquivos do vector store
          const url = new URL(`https://api.openai.com/v1/vector_stores/${vectorstoreId}/files`)
          url.searchParams.set('limit', String(limit))
          if (after) url.searchParams.set('after', after)

          const filesResp = await fetch(url.toString(), {
            headers: {
              'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
              'OpenAI-Beta': 'assistants=v2'
            }
          })
          if (!filesResp.ok) {
            const txt = await filesResp.text()
            throw new Error(`Falha ao listar arquivos do vector store: ${filesResp.status} ${filesResp.statusText} - ${txt}`)
          }
          const listJson = await filesResp.json()

          // Enriquecer cada item com detalhes do arquivo (filename, bytes)
          const items = listJson.data || []
          const enriched = []
          for (const item of items) {
            try {
              const f = await fetch(`https://api.openai.com/v1/files/${item.file_id || item.id}`, {
                headers: {
                  'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`
                }
              })
              if (f.ok) {
                const jf = await f.json()
                enriched.push({
                  id: item.id,
                  file_id: item.file_id || item.id,
                  status: item.status,
                  created_at: item.created_at,
                  last_error: item.last_error,
                  filename: jf.filename,
                  bytes: jf.bytes
                })
              } else {
                enriched.push(item)
              }
            } catch {
              enriched.push(item)
            }
          }

          return res.status(200).json({ data: enriched, has_more: listJson.has_more, last_id: listJson.last_id })
        } catch (error) {
          console.error('Erro ao listar arquivos do vectorstore:', error)
          return res.status(500).json({ error: error.message })
        }

      case 'getFileContent':
        try {
          const { fileId } = params
          if (!fileId) return res.status(400).json({ error: 'fileId é obrigatório' })
          const resp = await fetch(`https://api.openai.com/v1/files/${fileId}/content`, {
            headers: {
              'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`
            }
          })
          if (!resp.ok) {
            const txt = await resp.text()
            throw new Error(`Falha ao obter conteúdo do arquivo: ${resp.status} ${resp.statusText} - ${txt}`)
          }
          // Conteúdo pode ser binário (xlsx) ou texto (csv)
          const buffer = await resp.arrayBuffer()
          const contentType = resp.headers.get('content-type') || 'application/octet-stream'
          const base64 = Buffer.from(buffer).toString('base64')
          let text = null
          if (contentType.includes('text') || contentType.includes('csv')) {
            text = Buffer.from(buffer).toString('utf-8')
          }
          return res.status(200).json({ content: text, base64, contentType })
        } catch (error) {
          console.error('Erro ao obter conteúdo do arquivo:', error)
          return res.status(500).json({ error: error.message })
        }

      default:
        return res.status(400).json({ error: 'Invalid action' })
    }
  } catch (error) {
    console.error('Erro na API OpenAI:', error)
    return res.status(500).json({ error: error.message })
  }
}
