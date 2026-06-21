import dotenv from 'dotenv';
import { CaptchaSolverOptions } from '../types/CaptchaSolverOptions';

dotenv.config();

const GEMINI_MODEL = 'gemini-2.5-flash';

function normalizeBase64(base64Image: string): string {
    const match = base64Image.match(/^data:image\/[^;]+;base64,(.+)$/);
    return match ? match[1] : base64Image;
}

function detectMimeType(base64Image: string): string {
    if (base64Image.startsWith('/9j/')) return 'image/jpeg';
    if (base64Image.startsWith('iVBOR')) return 'image/png';
    if (base64Image.startsWith('R0lGOD')) return 'image/gif';
    return 'image/png';
}

function buildPrompt(options?: CaptchaSolverOptions): string {
    let prompt =
        'Please read the text in this CAPTCHA image and return only the text characters you see. Do not include any explanations or additional text.';

    if (options?.expectedLength) {
        prompt += ` The text should be exactly ${options.expectedLength} characters long.`;
    }

    if (options?.validationRegex) {
        prompt += ' The text should only contain alphanumeric characters.';
    }

    return prompt;
}

export async function solveCaptcha(
    base64Image: string,
    options?: CaptchaSolverOptions
): Promise<string> {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
        throw new Error('GEMINI_API_KEY environment variable is not set');
    }

    const imageData = normalizeBase64(base64Image);
    const mimeType = detectMimeType(imageData);
    const prompt = buildPrompt(options);

    try {
        const url = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${encodeURIComponent(apiKey)}`;

        const response = await fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                contents: [
                    {
                        parts: [
                            { text: prompt },
                            {
                                inline_data: {
                                    mime_type: mimeType,
                                    data: imageData,
                                },
                            },
                        ],
                    },
                ],
                generationConfig: {
                    temperature: 0,
                    maxOutputTokens: 256,
                    thinkingConfig: { thinkingBudget: 0 },
                },
            }),
        });

        const body = await response.text();
        if (!response.ok) {
            throw new Error(`Gemini API error (${response.status}): ${body}`);
        }

        const json = JSON.parse(body);
        const result = json.candidates?.[0]?.content?.parts?.[0]?.text;
        if (!result) {
            throw new Error(`No response from Gemini API: ${body}`);
        }

        console.log('Gemini result:', result);

        const cleanedText = result.replace(/\s+/g, '').trim();
        console.log('Cleaned text:', cleanedText);

        if (options) {
            const { expectedLength, validationRegex } = options;

            if (expectedLength && cleanedText.length !== expectedLength) {
                throw new Error(
                    `CAPTCHA text length ${cleanedText.length} does not match expected length ${expectedLength}`
                );
            }

            if (validationRegex && !validationRegex.test(cleanedText)) {
                throw new Error('CAPTCHA text does not match validation pattern');
            }
        }

        return cleanedText;
    } catch (error) {
        console.error('Error solving CAPTCHA with Gemini:', error);
        throw error;
    }
}
