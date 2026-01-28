export default async function handler(req, res) {
  res.setHeader('Content-Type', 'application/json');
  
  return res.status(200).json({
    status: 'ok',
    message: 'API is working',
    timestamp: new Date().toISOString(),
    hasApiKey: !!process.env.REPLICATE_API_TOKEN
  });
}
