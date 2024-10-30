import Tesseract from 'tesseract.js';
import { CaptchaSolverOptions } from '../types/CaptchaSolverOptions';

export async function solveCaptcha(
    base64Image: string,
    options?: CaptchaSolverOptions
): Promise<string> {
    const captchaBuffer = Buffer.from(base64Image, 'base64');
    
    // Solve the captcha
    const result = await Tesseract.recognize(captchaBuffer, options?.language ?? 'eng');

    console.log('Result:', result);
    // Clean the result
    const cleanedText = result.data.text.replace(/\s+/g, '');
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
}
