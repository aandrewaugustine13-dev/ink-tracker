import { AspectRatio } from "../types";

const ASPECT_RATIO_MAP: Record<string, string> = {
    [AspectRatio.WIDE]: "16:9",
    [AspectRatio.STD]: "4:3",
    [AspectRatio.SQUARE]: "1:1",
    [AspectRatio.TALL]: "3:4",
    [AspectRatio.PORTRAIT]: "9:16",
};

// Use a simpler model that's more reliable
const FAL_MODELS = {
    FLUX: "fal-ai/flux",
    FLUX_DEV: "fal-ai/flux-dev", // More reliable, less busy
    LIGHTNING: "fal-ai/stable-diffusion-lightning", // Faster, cheaper
} as const;

interface FalRequest {
    request_id: string;
    status: "IN_QUEUE" | "IN_PROGRESS" | "COMPLETED" | "FAILED";
    response?: {
        images: Array<{ url: string }>;
    };
    error?: string;
}

// Cache for rate limiting
let lastRequestTime = 0;
const MIN_REQUEST_INTERVAL = 3000; // 3 seconds between requests

export async function generateFalImage(
    prompt: string,
    aspectRatio: AspectRatio | string,
    model: string = FAL_MODELS.FLUX_DEV
): Promise<string> {
    try {
        // Rate limiting
        const now = Date.now();
        if (now - lastRequestTime < MIN_REQUEST_INTERVAL) {
            await new Promise(resolve => setTimeout(resolve, MIN_REQUEST_INTERVAL));
        }
        lastRequestTime = Date.now();

        console.log('🚀 Starting FAL generation with model:', model);
        console.log('Prompt:', prompt.substring(0, 100));
        
        const replicateAspectRatio = ASPECT_RATIO_MAP[aspectRatio as AspectRatio] || "1:1";
        
        // Convert aspect ratio to FAL's format
        let imageSize = "square_hd";
        if (replicateAspectRatio === "16:9") imageSize = "landscape_4_3";
        if (replicateAspectRatio === "9:16") imageSize = "portrait_9_16";
        
        // Step 1: Create generation request
        const response = await fetch('/api/fal', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                endpoint: '/queue/flux',
                data: {
                    model_name: model,
                    prompt: prompt.trim(),
                    image_size: imageSize,
                    num_inference_steps: 20, // Reduced for speed
                    guidance_scale: 3.5,
                    enable_safety_checker: false, // Disable for more reliability
                    sync_mode: false
                }
            })
        });

        if (!response.ok) {
            const errorText = await response.text();
            console.error('❌ FAL request failed:', response.status, errorText);
            
            // Check for specific errors
            if (response.status === 429) {
                throw new Error('Rate limited: Too many requests. Wait a few minutes.');
            }
            if (response.status === 402) {
                throw new Error('Out of credits. Add more credits at fal.ai/dashboard.');
            }
            
            throw new Error(`FAL API error (${response.status}): ${errorText.substring(0, 100)}`);
        }

        const data: FalRequest = await response.json();
        console.log('📦 Request created:', data.request_id);
        
        if (!data.request_id) {
            throw new Error('No request ID received from FAL');
        }

        const requestId = data.request_id;

        // Step 2: Poll for completion
        const maxAttempts = 40; // Increased for reliability
        const pollInterval = 3000; // 3 seconds
        
        for (let attempt = 1; attempt <= maxAttempts; attempt++) {
            console.log(`⏳ Polling attempt ${attempt}/${maxAttempts}...`);
            
            await new Promise(resolve => setTimeout(resolve, pollInterval));
            
            try {
                const statusResponse = await fetch('/api/fal', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        endpoint: `/queue/${requestId}`,
                        data: {}
                    })
                });

                if (!statusResponse.ok) {
                    console.warn(`⚠️ Poll ${attempt} failed:`, statusResponse.status);
                    continue; // Try again
                }

                const statusData: FalRequest = await statusResponse.json();
                console.log(`📊 Status: ${statusData.status}`);
                
                if (statusData.status === "COMPLETED") {
                    if (statusData.response?.images?.[0]?.url) {
                        const imageUrl = statusData.response.images[0].url;
                        console.log('✅ Image generated:', imageUrl);
                        return imageUrl;
                    } else {
                        throw new Error('No image URL in completed response');
                    }
                } else if (statusData.status === "FAILED") {
                    throw new Error(`FAL generation failed: ${statusData.error || 'Unknown error'}`);
                }
                // Continue polling for IN_QUEUE or IN_PROGRESS
                
            } catch (pollError) {
                console.warn(`⚠️ Poll ${attempt} error:`, pollError);
                // Continue polling
            }
        }

        throw new Error('Generation timed out after 2 minutes');
        
    } catch (error) {
        console.error('❌ FAL generation failed:', error);
        
        // Provide user-friendly error messages
        const errorMsg = error instanceof Error ? error.message : String(error);
        
        if (errorMsg.includes('credits') || errorMsg.includes('402')) {
            throw new Error('Out of FAL credits. Add more at fal.ai/dashboard');
        }
        if (errorMsg.includes('rate') || errorMsg.includes('429')) {
            throw new Error('Rate limited. Wait a few minutes before trying again.');
        }
        if (errorMsg.includes('timeout')) {
            throw new Error('Generation took too long. Try a simpler prompt.');
        }
        
        throw new Error(`FAL Error: ${errorMsg}`);
    }
}

// Quick test function
export async function testFalQuick(): Promise<boolean> {
    try {
        console.log('Testing FAL connection...');
        const response = await fetch('/api/fal', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                endpoint: '/models',
                data: {}
            })
        });
        
        const ok = response.ok;
        console.log('FAL test result:', ok);
        return ok;
    } catch (error) {
        console.error('FAL test error:', error);
        return false;
    }
}

// Get credit balance (if FAL provides this endpoint)
export async function checkFalCredits(): Promise<number | null> {
    try {
        const response = await fetch('/api/fal', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                endpoint: '/billing/credits',
                data: {}
            })
        });
        
        if (response.ok) {
            const data = await response.json();
            return data.credits || null;
        }
        return null;
    } catch {
        return null;
    }
}