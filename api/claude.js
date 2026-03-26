// Vercel Serverless Function — Anthropic API Proxy
// La clé API n'est JAMAIS exposée au frontend.
// Elle vit uniquement dans les variables d'environnement Vercel.

export const config = { maxDuration: 60 }

export default async function handler(req, res) {
  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type')

  if (req.method === 'OPTIONS') {
    return res.status(200).end()
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const apiKey = process.env.ANTHROPIC_API_KEY
  if (!apiKey) {
    return res.status(500).json({ error: 'ANTHROPIC_API_KEY not configured on Vercel.' })
  }

  try {
    const { system, userPrompt, maxTokens = 8000 } = req.body

    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-3-5-sonnet-20241022',
        max_tokens: maxTokens,
        system,
        messages: [{ role: 'user', content: userPrompt }],
      }),
    })

    if (!response.ok) {
      const err = await response.json().catch(() => ({}))
      return res.status(response.status).json({
        error: err?.error?.message || `Anthropic API error ${response.status}`,
      })
    }

    const data = await response.json()
    const text = data.content?.[0]?.text || ''
    const cleaned = text.replace(/```json\s*/g, '').replace(/```\s*/g, '').trim()

    return res.status(200).json({ result: cleaned })
  } catch (err) {
    console.error('Proxy error:', err)
    return res.status(500).json({ error: err.message || 'Internal server error' })
  }
}
