import OpenAI from 'openai';
import { CaptchaSolverOptions } from '../types/CaptchaSolverOptions';

// Initialize OpenAI client
const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
});

export async function solveCaptcha(
    base64Image: string,
    options?: CaptchaSolverOptions
): Promise<string> {
    try {
        // Prepare the prompt based on options
        let prompt = "Please read the text in this CAPTCHA image and return only the text characters you see. Do not include any explanations or additional text.";
        
        if (options?.expectedLength) {
            prompt += ` The text should be exactly ${options.expectedLength} characters long.`;
        }
        
        if (options?.validationRegex) {
            prompt += ` The text should only contain alphanumeric characters.`;
        }

        // Call OpenAI Vision API
        const response = await openai.chat.completions.create({
            model: "gpt-4o-mini",
            messages: [
                {
                    role: "user",
                    content: [
                        {
                            type: "text",
                            text: prompt
                        },
                        {
                            type: "image_url",
                            image_url: {
                                url: `data:image/png;base64,${base64Image}`
                            }
                        }
                    ]
                }
            ],
            max_tokens: 50,
            temperature: 0
        });

        const result = response.choices[0]?.message?.content;
        if (!result) {
            throw new Error('No response from OpenAI API');
        }

        console.log('OpenAI result:', result);
        
        // Clean the result - remove any whitespace and newlines
        const cleanedText = result.replace(/\s+/g, '').trim();
        console.log('Cleaned text:', cleanedText);

        // Validate result if options are provided
        if (options) {
            const { expectedLength, validationRegex } = options;

            if (expectedLength && cleanedText.length !== expectedLength) {
                throw new Error(`CAPTCHA text length ${cleanedText.length} does not match expected length ${expectedLength}`);
            }

            if (validationRegex && !validationRegex.test(cleanedText)) {
                throw new Error('CAPTCHA text does not match validation pattern');
            }
        }

        return cleanedText;
    } catch (error) {
        console.error('Error solving CAPTCHA with OpenAI:', error);
        throw error;
    }
}
