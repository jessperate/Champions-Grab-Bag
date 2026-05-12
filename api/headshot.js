export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type')

  if (req.method === 'OPTIONS') return res.status(200).end()
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' })

  const { imageBase64 } = req.body ?? {}
  if (!imageBase64) return res.status(400).json({ error: 'Missing imageBase64 in request body' })

  const apiKey = process.env.GEMINI_API_KEY
  if (!apiKey) return res.status(500).json({ error: 'GEMINI_API_KEY environment variable is not set' })

  const prompt =
    'Transform this photo into a PURE BLACK AND WHITE (monochrome, no color) stipple/engraving illustration on a pure white background. ' +
    'CRITICAL: the output must contain ONLY pure black (#000000) ink strokes/dots on a pure white (#ffffff) background. ' +
    'NO color tints whatsoever — no green, no sepia, no blue, no warm or cool casts. Strictly grayscale, leaning pure black ink on white paper. ' +
    'Remove all background elements completely — only the person should remain, on a solid pure-white background. ' +
    'Create a high-contrast stipple portrait with fine black dot patterns for shading, black crosshatching for darker areas, ' +
    'and clean pure-white highlights. The style should look like a detailed editorial engraving or vintage portrait illustration printed in black ink on white paper. ' +
    'Output the illustration as a pure black-on-white (#000000 on #ffffff) image with NO color tinting.'

  const requestBody = {
    contents: [
      {
        parts: [
          { text: prompt },
          {
            inlineData: {
              mimeType: 'image/jpeg',
              data: imageBase64,
            },
          },
        ],
      },
    ],
    generationConfig: {
      responseModalities: ['IMAGE', 'TEXT'],
    },
  }

  try {
    const geminiRes = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-image:generateContent?key=${apiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestBody),
      },
    )

    const data = await geminiRes.json()

    if (!geminiRes.ok) {
      const errMsg = data?.error?.message ?? `Gemini API error: HTTP ${geminiRes.status}`
      return res.status(502).json({ error: errMsg })
    }

    // Extract image from response
    const candidates = data.candidates ?? []
    let imageBase64Result = null

    for (const candidate of candidates) {
      for (const part of candidate.content?.parts ?? []) {
        if (part.inlineData?.data) {
          imageBase64Result = part.inlineData.data
          break
        }
      }
      if (imageBase64Result) break
    }

    if (!imageBase64Result) {
      return res.status(502).json({ error: 'Gemini did not return an image. The model may not support image generation for this input.' })
    }

    return res.status(200).json({ imageBase64: imageBase64Result })
  } catch (e) {
    return res.status(500).json({ error: e.message })
  }
}
