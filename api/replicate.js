// api/replicate.js
export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { path, body, apiKey, method = 'POST' } = req.body;

    if (!apiKey) {
      return res.status(400).json({ error: 'API key is required' });
    }

    const response = await fetch(`https://api.replicate.com/v1${path}`, {
      method: method,
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: method !== 'GET' ? JSON.stringify(body) : undefined,
    });

    const data = await response.json();
    res.status(response.status).json(data);
  } catch (error) {
    console.error('Replicate proxy error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}
