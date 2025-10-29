import OpenAI from 'openaiClient'

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
  const openaiClientClient = initializeOpenAI()
  if (!openaiClientClient) {
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

  // Verificar se a propriedade files existe
  if (!openaiClientClient.files) {
    console.error('Propriedade files não encontrada no cliente OpenAI')
    return res.status(500).json({ error: 'OpenAI client missing files property' })
  }

  try {
    const { action, ...params } = req.body
    console.log('API OpenAI - Action:', action, 'Params keys:', Object.keys(params))
    console.log('API OpenAI - OpenAI client type:', typeof openaiClientClient)
    console.log('API OpenAI - OpenAI files type:', typeof openaiClientClient.files)
    console.log('API OpenAI - OpenAI files.create type:', typeof openaiClientClient.files?.create)

    switch (action) {
      case 'createVectorstore':
        console.log('Criando vectorstore...', { name: params.name, assistantId: params.assistantId })
        
        // Verificar se o cliente OpenAI está funcionando
        console.log('OpenAI client:', !!openaiClient)
        console.log('OpenAI beta:', !!openaiClient.beta)
        console.log('OpenAI beta vectorStores:', !!openaiClient.beta?.vectorStores)
        
        // Criar vectorstore usando a API correta
        let vectorstore
        try {
          vectorstore = await openaiClient.beta.vectorStores.create({
            name: params.name,
            description: params.description,
          })
        } catch (error) {
          console.error('Erro ao criar vectorstore via SDK:', error)
          // Fallback: usar API REST diretamente
          const response = await fetch('https://api.openaiClient.com/v1/vector_stores', {
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

        // Criar um objeto File a partir do Buffer
        const fileToUpload = new File([fileBuffer], params.fileName || 'upload.csv', {
          type: params.fileType || 'text/csv'
        })

        console.log('UploadFile - File object created:', fileToUpload.name, fileToUpload.type, fileToUpload.size)

        // Fazer upload para OpenAI usando o objeto File
        const file = await openaiClient.files.create({
          file: fileToUpload,
          purpose: 'assistants'
        })
        
        console.log('UploadFile - File uploaded to OpenAI:', file.id)
        
        // Associar ao vectorstore
        await openaiClient.beta.vectorStores.files.create(
          params.vectorstoreId,
          { file_id: file.id }
        )
        
        console.log('UploadFile - File associated with vectorstore:', params.vectorstoreId)
        
        return res.status(200).json({ fileId: file.id })

      case 'deleteVectorstore':
        console.log('Deletando vectorstore...', params.vectorstoreId)
        
        try {
          await openaiClient.beta.vectorStores.del(params.vectorstoreId)
          console.log('Vectorstore deletado via SDK')
        } catch (error) {
          console.error('Erro ao deletar vectorstore via SDK:', error)
          // Fallback: usar API REST diretamente
          const response = await fetch(`https://api.openaiClient.com/v1/vector_stores/${params.vectorstoreId}`, {
            method: 'DELETE',
            headers: {
              'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
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
          const vectorstore = await openaiClient.beta.vectorStores.retrieve(params.vectorstoreId)
          console.log('Vectorstore encontrado:', vectorstore.id)
          return res.status(200).json({ exists: true, vectorstore })
        } catch (error) {
          if (error.status === 404) {
            console.log('Vectorstore não encontrado')
            return res.status(200).json({ exists: false })
          }
          throw error
        }

      default:
        return res.status(400).json({ error: 'Invalid action' })
    }
  } catch (error) {
    console.error('Erro na API OpenAI:', error)
    return res.status(500).json({ error: error.message })
  }
}
