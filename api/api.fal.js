export default async function handler(req, res) {
  res.setHeader('Content-Type', 'application/json');
  
  console.log(`[FAL API] ${req.method} request`);
  
  if (req.method !== 'POST') {
    console.log('[FAL API] Wrong method');
    return res.status(405).json({ error: 'Use POST' });
  }

  try {
    const { endpoint, data } = req.body;
    
    if (!endpoint) {
      console.log('[FAL API] Missing endpoint');
      return res.status(400).json({ error: 'Missing endpoint' });
    }

    const apiKey = process.env.FAL_API_KEY;
    if (!apiKey) {
      console.error('[FAL API] No API key configured');
      return res.status(500).json({ error: 'FAL_API_KEY not configured' });
    }

    const url = `https://api.fal.ai/v1${endpoint}`;
    console.log(`[FAL API] Calling: ${url}`);
    
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Authorization': `Key ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data)
    });

    const responseText = await response.text();
    console.log(`[FAL API] Response status: ${response.status}`);
    console.log(`[FAL API] Response: ${responseText.substring(0, 200)}`);
    
    let result;
    try {
      result = responseText ? JSON.parse(responseText) : {};
    } catch (e) {
      console.error('[FAL API] JSON parse failed:', responseText);
      return res.status(500).json({ error: 'Invalid JSON response' });
    }

    if (!response.ok) {
      console.error('[FAL API] Error:', result);
      return res.status(response.status).json({ 
        error: result.message || result.detail || 'FAL API error',
        details: result
      });
    }

    console.log('[FAL API] Success');
    return res.status(200).json(result);
  } catch (error) {
    console.error('[FAL API] Unhandled error:', error);
    return res.status(500).json({ 
      error: 'Proxy error',
      message: error.message 
    });
  }
}