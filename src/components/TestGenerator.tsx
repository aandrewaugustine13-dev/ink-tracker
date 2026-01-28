import { useState } from 'react';
import { generateFluxImage } from '../services/replicateFluxService';

export default function TestGenerator() {
    const [prompt, setPrompt] = useState('a beautiful sunset over mountains');
    const [loading, setLoading] = useState(false);
    const [imageUrl, setImageUrl] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);

    const handleGenerate = async () => {
        if (!prompt.trim()) {
            setError('Please enter a prompt');
            return;
        }

        setLoading(true);
        setError(null);
        
        try {
            const url = await generateFluxImage(prompt, 'SQUARE');
            setImageUrl(url);
        } catch (err: any) {
            setError(err.message || 'Failed to generate image');
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div style={{ padding: '20px', maxWidth: '600px' }}>
            <h2>Test Image Generation</h2>
            
            <div style={{ marginBottom: '20px' }}>
                <textarea
                    value={prompt}
                    onChange={(e) => setPrompt(e.target.value)}
                    placeholder="Describe the image..."
                    style={{
                        width: '100%',
                        minHeight: '80px',
                        padding: '10px',
                        marginBottom: '10px',
                        borderRadius: '4px',
                        border: '1px solid #ccc'
                    }}
                />
                
                <button
                    onClick={handleGenerate}
                    disabled={loading}
                    style={{
                        padding: '10px 20px',
                        background: loading ? '#ccc' : '#0070f3',
                        color: 'white',
                        border: 'none',
                        borderRadius: '5px',
                        cursor: loading ? 'not-allowed' : 'pointer'
                    }}
                >
                    {loading ? 'Generating...' : 'Generate Image'}
                </button>
            </div>

            {error && (
                <div style={{ color: 'red', margin: '10px 0', padding: '10px', background: '#ffe6e6' }}>
                    Error: {error}
                </div>
            )}

            {imageUrl && (
                <div style={{ marginTop: '20px' }}>
                    <h3>Generated Image:</h3>
                    <img
                        src={imageUrl}
                        alt="Generated"
                        style={{ maxWidth: '100%', borderRadius: '8px' }}
                    />
                </div>
            )}
        </div>
    );
}
