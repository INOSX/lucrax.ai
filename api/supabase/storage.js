import { createClient } from '@supabase/supabase-js'

let supabaseAdmin
function getAdminClient() {
  if (!supabaseAdmin) {
    const url = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE || process.env.SUPABASE_SERVICE_ROLE_KEY
    if (!url || !serviceKey) {
      throw new Error('Supabase admin credentials missing (SUPABASE_URL and SUPABASE_SERVICE_ROLE)')
    }
    supabaseAdmin = createClient(url, serviceKey)
  }
  return supabaseAdmin
}

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization')

  if (req.method === 'OPTIONS') return res.status(200).end()
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' })

  const { action, userId } = req.body || {}
  try {
    const admin = getAdminClient()

    switch (action) {
      case 'ensureBucket': {
        if (!userId) return res.status(400).json({ error: 'userId is required' })
        // Tentar obter bucket
        const { data: got, error: getErr } = await admin.storage.getBucket(userId)
        if (got && !getErr) {
          return res.status(200).json({ bucket: userId, existed: true })
        }

        // Criar bucket (público por enquanto; ajuste depois conforme regras)
        const { data: created, error: createErr } = await admin.storage.createBucket(userId, {
          public: true,
        })
        if (createErr && !String(createErr.message || '').toLowerCase().includes('already exists')) {
          throw createErr
        }
        return res.status(200).json({ bucket: userId, existed: false })
      }

      case 'upload': {
        const { bucket, path, data, contentType } = req.body || {}
        if (!bucket || !path || !data) return res.status(400).json({ error: 'bucket, path e data são obrigatórios' })
        const buffer = Buffer.from(data, 'base64')
        const { error: upErr } = await admin.storage.from(bucket).upload(path, buffer, {
          upsert: true,
          contentType: contentType || 'application/octet-stream'
        })
        if (upErr) throw upErr
        return res.status(200).json({ ok: true })
      }

      default:
        return res.status(400).json({ error: 'Invalid action' })
    }
  } catch (err) {
    console.error('Supabase admin API error:', err)
    return res.status(500).json({ error: err.message || 'Unknown error' })
  }
}


