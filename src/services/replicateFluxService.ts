import { AspectRatio } from "../types";

// Using a CORS proxy to allow direct browser-to-Replicate communication
const PROXY_URL = "https://corsproxy.io/?";
const REPLICATE_API_BASE = "https://api.replicate.com/v1";

const ASPECT_RATIO_MAP: Record<string, string> = {
    [AspectRatio.WIDE]: "16:9",
    [AspectRatio.STD]: "4:3",
    [AspectRatio.SQUARE]: "1:1",
    [AspectRatio.TALL]: "3:4",
    [AspectRatio.PORTRAIT]: "9:16",
};

/**
 * Generates an image using Replicate's Flux models.
 * Uses a CORS proxy to bypass browser security restrictions.
 */
export async function generateFluxImage(
    prompt: string,
    aspectRatio: AspectRatio | string,
    apiKey: string,
    modelVersion: string = "776402431718227633f81525a7a72d1a37c4f42065840d21e89f81f1856956f1", // Default to Flux 1.1 Pro
    initImage?: string,
    strength: number = 0.7
): Promise<string> {
    if (!apiKey?.trim()) {
        throw new Error("Replicate API key is missing.");
    }

    const isImg2Img = !!initImage;
    // If img2img, we usually use Flux Dev or a specific i2i version
    const version = isImg2Img
    ? "8bb04ca03d368e597c554a938c4b2b1a8d052d3a958e0a294d13e9a597a731b9"
    : modelVersion;

    const replicateAspectRatio = ASPECT_RATIO_MAP[aspectRatio as AspectRatio] || "1:1";

    const input: any = {
        prompt,
        num_inference_steps: 28,
        guidance_scale: 3.5,
        num_outputs: 1,
        output_format: "png"
    };

    if (isImg2Img && initImage) {
        input.image = initImage;
        input.prompt_strength = strength;
    } else {
        input.aspect_ratio = replicateAspectRatio;
    }

    // 1. Create Prediction via Proxy
    const createRes = await fetch(`${PROXY_URL}${encodeURIComponent(REPLICATE_API_BASE + "/predictions")}`, {
        method: "POST",
        headers: {
            "Authorization": `Bearer ${apiKey.trim()}`,
                                  "Content-Type": "application/json",
        },
        body: JSON.stringify({
            version,
            input,
        }),
    });

    if (!createRes.ok) {
        const errorData = await createRes.json().catch(() => ({ detail: createRes.statusText }));
        throw new Error(`Replicate Create Error ${createRes.status}: ${errorData.detail || "CORS or Network Failure"}`);
    }

    let prediction = await createRes.json();
    const predictionId = prediction.id;

    // 2. Poll status via Proxy
    const maxTime = 120000;
    const startTime = Date.now();

    while (prediction.status !== "succeeded" && prediction.status !== "failed" && prediction.status !== "canceled") {
        if (Date.now() - startTime > maxTime) {
            throw new Error("Replicate generation timed out after 120s.");
        }

        await new Promise((resolve) => setTimeout(resolve, 3000));

        const pollRes = await fetch(`${PROXY_URL}${encodeURIComponent(`${REPLICATE_API_BASE}/predictions/${predictionId}`)}`, {
            headers: {
                "Authorization": `Bearer ${apiKey.trim()}`,
            },
        });

        if (!pollRes.ok) {
            throw new Error(`Replicate Poll Error ${pollRes.status}: ${pollRes.statusText}`);
        }

        prediction = await pollRes.json();
    }

    if (prediction.status === "failed") {
        throw new Error(`Replicate Generation Failed: ${prediction.error || "Unknown Error"}`);
    }

    const output = prediction.output;
    const url = Array.isArray(output) ? output[0] : output;

    if (!url) {
        throw new Error("No image URL in Replicate response output.");
    }

    return url;
}
