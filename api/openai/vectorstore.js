import OpenAI from 'openai'

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
})

export default async function handler(req, res) {
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

  // Verificar se o cliente OpenAI está inicializado
  if (!openai) {
    console.error('Cliente OpenAI não inicializado')
    return res.status(500).json({ error: 'OpenAI client not initialized' })
  }

  try {
    const { action, ...params } = req.body
    console.log('API OpenAI - Action:', action, 'Params keys:', Object.keys(params))

    switch (action) {
      case 'createVectorstore':
        // Criar vectorstore (SDK usa beta.vectorStores)
        const vectorstore = await openai.beta.vectorStores.create({
          name: params.name,
          description: params.description,
        })

        // Opcional: vincular ao assistente, se fornecido
        if (params.assistantId) {
          await openai.beta.assistants.update(params.assistantId, {
            tool_resources: {
              file_search: { vector_store_ids: [vectorstore.id] }
            },
            tools: [{ type: 'file_search' }]
          })
        }

        return res.status(200).json({ vectorstoreId: vectorstore.id })

      case 'createAssistant':
        const assistant = await openai.beta.assistants.create({
          name: params.name,
          instructions: params.instructions,
          model: "gpt-4o-mini",
          tools: [{ type: "file_search" }],
          tool_resources: {
            file_search: {
              vector_store_ids: [params.vectorstoreId]
            }
          }
        })
        return res.status(200).json({ assistantId: assistant.id })

      case 'uploadFile':
        console.log('UploadFile - Params:', { 
          vectorstoreId: params.vectorstoreId, 
          dataLength: params.data?.length, 
          fileName: params.fileName, 
          fileType: params.fileType 
        })
        
        // Processar arquivo base64 em um File compatível com o SDK
        const { toFile } = await import('openai/uploads')
        const fileBuffer = Buffer.from(params.data || '', 'base64')
        const uploadFile = await toFile(fileBuffer, params.fileName || 'upload.csv', {
          type: params.fileType || 'text/csv'
        })

        console.log('UploadFile - File created:', uploadFile.name, uploadFile.type)

        // Fazer upload para OpenAI (purpose: assistants)
        const file = await openai.files.create({
          file: uploadFile,
          purpose: 'assistants',
        })
        
        console.log('UploadFile - File uploaded to OpenAI:', file.id)
        
        // Associar ao vectorstore
        await openai.beta.vectorStores.files.create(
          params.vectorstoreId,
          { file_id: file.id }
        )
        
        console.log('UploadFile - File associated with vectorstore:', params.vectorstoreId)
        
        return res.status(200).json({ fileId: file.id })

      case 'deleteVectorstore':
        await openai.beta.vectorStores.del(params.vectorstoreId)
        return res.status(200).json({ success: true })

      case 'deleteAssistant':
        await openai.beta.assistants.del(params.assistantId)
        return res.status(200).json({ success: true })

      default:
        return res.status(400).json({ error: 'Invalid action' })
    }
  } catch (error) {
    console.error('Erro na API OpenAI:', error)
    return res.status(500).json({ error: error.message })
  }
}
