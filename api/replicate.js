export default async function handler(req, res) {
  // Set JSON header FIRST
  res.setHeader('Content-Type', 'application/json');
  
  // Only allow POST
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed. Use POST.' });
  }

  try {
    console.log('API received request');
    
    const { path, body, method = 'POST' } = req.body;
    
    if (!path) {
      console.error('Missing path in request');
      return res.status(400).json({ error: 'Missing path parameter' });
    }

    // Get API key from environment
    const apiKey = process.env.REPLICATE_API_TOKEN;
    console.log('API Key present:', !!apiKey);
    
    if (!apiKey) {
      console.error('Replicate API token missing');
      return res.status(500).json({ error: 'Server configuration error: No API token' });
    }

    const replicateUrl = `https://api.replicate.com/v1${path}`;
    console.log('Calling Replicate:', replicateUrl, 'Method:', method);
    
    const fetchOptions = {
      method,
      headers: {
        'Authorization': `Token ${apiKey}`,
        'Content-Type': 'application/json',
        'User-Agent': 'ink-tracker/1.0'
      }
    };

    // Add body for non-GET requests
    if (method !== 'GET' && body) {
      fetchOptions.body = JSON.stringify(body);
      console.log('Request body:', JSON.stringify(body, null, 2));
    }

    console.log('Fetch options:', fetchOptions);
    
    const response = await fetch(replicateUrl, fetchOptions);
    
    // Get response as text first
    const responseText = await response.text();
    console.log('Replicate response status:', response.status);
    console.log('Replicate response text:', responseText.substring(0, 500));
    
    // Try to parse as JSON
    let data;
    try {
      data = responseText ? JSON.parse(responseText) : {};
    } catch (e) {
      console.error('Failed to parse Replicate response as JSON:', e);
      return res.status(500).json({ 
        error: 'Replicate returned invalid JSON', 
        details: responseText.substring(0, 200) 
      });
    }

    if (!response.ok) {
      console.error('Replicate API error:', data);
      return res.status(response.status).json({ 
        error: data.detail || `Replicate API error: ${response.status}`,
        fullError: data
      });
    }

    console.log('Successfully returning data');
    return res.status(200).json(data);
    
  } catch (error) {
    console.error('Proxy error:', error);
    return res.status(500).json({ 
      error: 'Internal server error in proxy',
      details: error.message 
    });
  }
}
