import { AspectRatio } from "../types";

const ASPECT_RATIO_MAP: Record<string, string> = {
    [AspectRatio.WIDE]: "16:9",
    [AspectRatio.STD]: "4:3",
    [AspectRatio.SQUARE]: "1:1",
    [AspectRatio.TALL]: "3:4",
    [AspectRatio.PORTRAIT]: "9:16",
};

async function callReplicateAPI(path: string, body: any = {}, method: string = 'POST') {
    const response = await fetch('/api/replicate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ path, body, method }),
    });
    return response.json();
}

export async function generateFluxImage(
    prompt: string,
    aspectRatio: AspectRatio | string,
    apiKey?: string,  // Keep parameter for compatibility
    modelVersion: string = "776402431718227633f81525a7a72d1a37c4f42065840d21e89f81f1856956f1",
    initImage?: string,
    strength: number = 0.7
): Promise<string> {
    const isImg2Img = !!initImage;
    const version = isImg2Img
        ? "8bb04ca03d368e597c554a938c4b2b1a8d052d3a958e0a294d13e9a597a731b9"
        : modelVersion;

    const replicateAspectRatio = ASPECT_RATIO_MAP[aspectRatio as AspectRatio] || "1:1";

    const input: any = {
        prompt: prompt.trim(),
        num_outputs: 1,
        output_format: "png",
        guidance_scale: 3.5,
        num_inference_steps: 28,
    };

    if (isImg2Img && initImage) {
        input.image = initImage;
        input.prompt_strength = Math.max(0.1, Math.min(1, strength));
    } else {
        input.aspect_ratio = replicateAspectRatio;
    }

    const prediction = await callReplicateAPI('/predictions', {
        version,
        input
    });

    if (prediction.error) {
        throw new Error(`Replicate Error: ${prediction.error}`);
    }

    const predictionId = prediction.id;
    const pollInterval = 2000;
    const maxPollTime = 180000;
    const startTime = Date.now();

    while (Date.now() - startTime < maxPollTime) {
        await new Promise(resolve => setTimeout(resolve, pollInterval));
        
        const statusCheck = await callReplicateAPI(
            `/predictions/${predictionId}`,
            undefined,
            'GET'
        );

        if (statusCheck.status === 'succeeded') {
            const output = statusCheck.output;
            const imageUrl = Array.isArray(output) ? output[0] : output;
            
            if (!imageUrl || typeof imageUrl !== 'string') {
                throw new Error('Invalid image URL');
            }
            return imageUrl;
        } else if (statusCheck.status === 'failed' || statusCheck.status === 'canceled') {
            throw new Error(`Generation ${statusCheck.status}: ${statusCheck.error || 'Unknown error'}`);
        }
    }

    throw new Error('Generation timed out');
}
