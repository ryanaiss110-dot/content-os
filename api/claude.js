// Vercel Serverless Function — OpenAI API Proxy
// La clé API n'est JAMAIS exposée au frontend.
// Elle vit uniquement dans les variables d'environnement Vercel.

export const config = { maxDuration: 60 }

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type')

  if (req.method === 'OPTIONS') return res.status(200).end()
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' })

  const apiKey = process.env.OPENAI_API_KEY
  if (!apiKey) return res.status(500).json({ error: 'OPENAI_API_KEY not configured on Vercel.' })

  try {
    const { system, userPrompt, maxTokens = 4096 } = req.body

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: 'gpt-4o',
        max_tokens: maxTokens,
        temperature: 0.7,
        response_format: { type: 'json_object' },
        messages: [
          { role: 'system', content: system },
          { role: 'user', content: userPrompt },
        ],
      }),
    })

    if (!response.ok) {
      const err = await response.json().catch(() => ({}))
      return res.status(response.status).json({
        error: err?.error?.message || `OpenAI API error ${response.status}`,
      })
    }

    const data = await response.json()
    const text = data.choices?.[0]?.message?.content || ''
    const cleaned = text.replace(/```json\s*/g, '').replace(/```\s*/g, '').trim()

    return res.status(200).json({ result: cleaned })
  } catch (err) {
    console.error('Proxy error:', err)
    return res.status(500).json({ error: err.message || 'Internal server error' })
  }
}
