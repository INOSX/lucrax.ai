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
        console.log('Criando vectorstore...', { name: params.name, assistantId: params.assistantId })
        
        // Verificar se o cliente OpenAI está funcionando
        console.log('OpenAI client:', !!openai)
        console.log('OpenAI beta:', !!openai.beta)
        console.log('OpenAI beta vectorStores:', !!openai.beta?.vectorStores)
        
        // Criar vectorstore usando a API correta
        let vectorstore
        try {
          vectorstore = await openai.beta.vectorStores.create({
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

        // Opcional: vincular ao assistente, se fornecido
        if (params.assistantId) {
          console.log('Vinculando vectorstore ao assistente...', params.assistantId)
          await openai.beta.assistants.update(params.assistantId, {
            tool_resources: {
              file_search: { vector_store_ids: [vectorstore.id] }
            },
            tools: [{ type: 'file_search' }]
          })
          console.log('Vectorstore vinculado ao assistente')
        }

        return res.status(200).json({ vectorstoreId: vectorstore.id })

      case 'createAssistant':
        console.log('Criando assistente...', { name: params.name })
        
        // Criar assistente sem vectorstore inicialmente
        const assistant = await openai.beta.assistants.create({
          name: params.name,
          instructions: params.instructions,
          model: "gpt-4o-mini",
          tools: [{ type: "file_search" }]
          // Não incluir tool_resources inicialmente
        })
        
        console.log('Assistente criado:', assistant.id)
        return res.status(200).json({ assistantId: assistant.id })

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
        const file = await openai.files.create({
          file: fileToUpload,
          purpose: 'assistants'
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
        console.log('Deletando vectorstore...', params.vectorstoreId)
        
        try {
          await openai.beta.vectorStores.del(params.vectorstoreId)
          console.log('Vectorstore deletado via SDK')
        } catch (error) {
          console.error('Erro ao deletar vectorstore via SDK:', error)
          // Fallback: usar API REST diretamente
          const response = await fetch(`https://api.openai.com/v1/vector_stores/${params.vectorstoreId}`, {
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
