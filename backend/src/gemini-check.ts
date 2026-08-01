import dotenv from 'dotenv';
import { GoogleGenAI } from '@google/genai';

dotenv.config();

const apiKey = process.env.GEMINI_API_KEY;
const placeholderValues = ['YOUR_KEY', 'YOUR_API_KEY', 'YOUR_GEMINI_API_KEY', 'CHANGE_ME', 'REPLACE_ME', 'YOUR_GEMINI_KEY'];

if (!apiKey) {
  console.error('GEMINI_API_KEY is not set.');
  process.exit(1);
}

if (placeholderValues.some((value) => apiKey.toUpperCase().includes(value))) {
  console.error('GEMINI_API_KEY looks like a placeholder value. Replace it in backend/.env with a real Gemini API key from Google AI Studio.');
  process.exit(1);
}

const ai = new GoogleGenAI({ apiKey });

async function main() {
  const response = await ai.models.generateContent({
    model: 'gemini-2.0-flash',
    contents: 'Reply with a short hello in one sentence.'
  });

  console.log(response.text);
}

main().catch((error) => {
  console.error('Gemini call failed:', error);
  process.exit(1);
});
