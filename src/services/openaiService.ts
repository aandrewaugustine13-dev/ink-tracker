import { AspectRatio } from '../types';

function getImageSize(aspectRatio: string): string {
  const ratio = String(aspectRatio).toLowerCase();
  switch (ratio) {
    case 'wide':
      return '1792x1024';
    case 'tall':
    case 'portrait':
      return '1024x1792';
    case 'std':
    case 'square':
    default:
      return '1024x1024';
  }
}

interface OpenAIImageRequest {
  model: string;
  prompt: string;
  n: number;
  size: string;
  quality: string;
  response_format: string;
}

/**
 * Generates an image using OpenAI's DALL-E 3 API.
 * @param prompt - The text prompt for image generation
 * @param aspectRatio - The desired aspect ratio
 * @param apiKey - The OpenAI API key
 * @param initImage - Not supported by DALL-E 3; kept for interface consistency
 * @param strength - Not supported by DALL-E 3; kept for interface consistency
 */
export async function generateOpenAIImage(
  prompt: string,
  aspectRatio: AspectRatio | string,
  apiKey: string,
  initImage?: string,
  strength?: number
): Promise<string> {
  if (!apiKey || !apiKey.trim()) throw new Error('OpenAI API key is required');

  const body: OpenAIImageRequest = {
    model: 'dall-e-3',
    prompt: (prompt || '').trim(),
    n: 1,
    size: getImageSize(aspectRatio),
    quality: 'standard',
    response_format: 'b64_json'
  };

  const response = await fetch('https://api.openai.com/v1/images/generations', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey.trim()}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(body)
  });

  if (!response.ok) {
    const text = await response.text();
    // surface 403/verification messages clearly
    if (response.status === 403) {
      throw new Error(`OpenAI image generation failed (403). Organization verification may be required. Response: ${text}`);
    }
    throw new Error(`OpenAI image generation failed: ${response.status} ${response.statusText} - ${text}`);
  }

  const data = await response.json();
  if (!data || !data.data || !data.data[0] || !data.data[0].b64_json) {
    throw new Error('OpenAI image generation returned an unexpected response shape');
  }

  return `data:image/png;base64,${data.data[0].b64_json}`;
}
