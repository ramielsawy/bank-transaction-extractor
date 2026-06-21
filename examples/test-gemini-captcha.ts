import * as fs from 'fs';
import * as path from 'path';

const DEFAULT_IMAGE = '/Users/ramielsawy/.cursor/projects/Users-ramielsawy-Documents-repos-bank-transaction-extractor/assets/image-49f3bc69-326c-4e58-a3a7-bd631a09edff.png';
const IMAGE_PATH = process.argv[2] ? path.resolve(process.argv[2]) : DEFAULT_IMAGE;

const PROMPT =
  'Read the text in this CAPTCHA image and return only the characters you see. No explanation.';

async function callGemini(
  apiKey: string,
  base64Image: string,
  model: string,
  auth: 'query' | 'bearer'
): Promise<string> {
  const url =
    auth === 'query'
      ? `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${encodeURIComponent(apiKey)}`
      : `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`;

  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  if (auth === 'bearer') {
    headers.Authorization = `Bearer ${apiKey}`;
  }

  const response = await fetch(url, {
    method: 'POST',
    headers,
    body: JSON.stringify({
      contents: [
        {
          parts: [
            { text: PROMPT },
            {
              inline_data: {
                mime_type: 'image/png',
                data: base64Image,
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
    throw new Error(`HTTP ${response.status}: ${body}`);
  }

  const json = JSON.parse(body);
  const text = json.candidates?.[0]?.content?.parts?.[0]?.text;
  if (!text) {
    throw new Error(`Unexpected response: ${body}`);
  }
  return text.replace(/\s+/g, '').trim();
}

async function main() {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    console.error('Set GEMINI_API_KEY environment variable');
    process.exit(1);
  }

  if (!fs.existsSync(IMAGE_PATH)) {
    console.error(`Image not found: ${IMAGE_PATH}`);
    process.exit(1);
  }

  const base64Image = fs.readFileSync(IMAGE_PATH).toString('base64');
  const models = ['gemini-2.5-flash', 'gemini-2.0-flash-001', 'gemini-flash-latest'];

  for (const auth of ['query'] as const) {
    for (const model of models) {
      try {
        console.log(`Trying ${model} with ${auth} auth...`);
        const result = await callGemini(apiKey, base64Image, model, auth);
        console.log(`Success (${model}, ${auth}): "${result}"`);
        return;
      } catch (error) {
        console.error(`Failed (${model}, ${auth}):`, (error as Error).message);
      }
    }
  }

  process.exit(1);
}

main();
