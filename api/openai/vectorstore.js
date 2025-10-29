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

  try {
    const { action, ...params } = req.body

    switch (action) {
      case 'createVectorstore':
        const vectorstore = await openai.beta.vectorstores.create({
          name: params.name,
          description: params.description,
        })
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
        // Processar arquivo base64
        const fileBuffer = Buffer.from(params.file.data, 'base64')
        
        // Fazer upload para OpenAI
        const file = await openai.files.create({
          file: fileBuffer,
          purpose: 'assistants',
        })
        
        // Associar ao vectorstore
        await openai.beta.vectorStores.files.create(
          params.vectorstoreId,
          { file_id: file.id }
        )
        
        return res.status(200).json({ fileId: file.id })

      case 'deleteVectorstore':
        await openai.beta.vectorstores.del(params.vectorstoreId)
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
