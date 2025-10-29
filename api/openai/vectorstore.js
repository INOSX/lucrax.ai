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
        // Primeiro, fazer upload do arquivo
        const formData = new FormData()
        formData.append('file', params.file)
        formData.append('purpose', 'assistants')

        const uploadResponse = await fetch('https://api.openai.com/v1/files', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
          },
          body: formData
        })

        if (!uploadResponse.ok) {
          throw new Error(`Erro no upload: ${uploadResponse.statusText}`)
        }

        const uploadResult = await uploadResponse.json()
        const fileId = uploadResult.id

        // Associar arquivo ao vectorstore
        await openai.beta.vectorstores.files.create(params.vectorstoreId, {
          file_id: fileId
        })

        return res.status(200).json({ fileId })

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
