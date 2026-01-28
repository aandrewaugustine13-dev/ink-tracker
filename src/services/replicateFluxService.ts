import { AspectRatio } from "../types";

const ASPECT_RATIO_MAP: Record<string, string> = {
    [AspectRatio.WIDE]: "16:9",
    [AspectRatio.STD]: "4:3",
    [AspectRatio.SQUARE]: "1:1",
    [AspectRatio.TALL]: "3:4",
    [AspectRatio.PORTRAIT]: "9:16",
};

async function proxyFetch(path: string, body: any, method: string = 'POST') {
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

    let prediction = await proxyFetch('/predictions', { version, input });

    if (prediction.error) {
        throw new Error(`Replicate Error: ${prediction.error}`);
    }

    const predictionId = prediction.id;
    const maxTime = 120000;
    const startTime = Date.now();

    while (prediction.status !== "succeeded" && prediction.status !== "failed" && prediction.status !== "canceled") {
        if (Date.now() - startTime > maxTime) {
            throw new Error("Replicate generation timed out after 120s.");
        }

        await new Promise((resolve) => setTimeout(resolve, 3000));
        prediction = await proxyFetch(`/predictions/${predictionId}`, {});
    }

    if (prediction.status === "failed") {
        throw new Error(`Replicate Generation Failed: ${prediction.error || "Unknown Error"}`);
    }

    if (prediction.status === "canceled") {
        throw new Error("Replicate Generation Canceled.");
    }

    const output = prediction.output;
    const url = Array.isArray(output) ? output[0] : output;

    if (!url) {
        throw new Error("No image URL in Replicate response output.");
    }

    return url;
}
