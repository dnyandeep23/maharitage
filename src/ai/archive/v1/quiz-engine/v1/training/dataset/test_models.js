import fs from 'fs';
import path from 'path';
import { GoogleGenAI } from '@google/genai';

const ROOT = process.cwd();
const envPath = path.resolve(ROOT, '.env.local');
let geminiApiKey = process.env.GEMINI_API_KEY;
if (fs.existsSync(envPath)) {
  const envContent = fs.readFileSync(envPath, 'utf8');
  if (!geminiApiKey) {
    const match = envContent.match(/GEMINI_API_KEY=[\"']?([^\"'\n]+)/);
    if (match) geminiApiKey = match[1];
  }
}

const ai = new GoogleGenAI({ apiKey: geminiApiKey });

const modelsToTest = [
  'gemini-2.5-flash',
  'gemini-2.0-flash',
  'gemini-1.5-flash',
  'gemini-1.5-pro',
  'gemini-2.0-flash-lite'
];

async function run() {
  for (const m of modelsToTest) {
    try {
      console.log(`Testing model: ${m}...`);
      const resp = await ai.models.generateContent({
        model: m,
        contents: ["Hello, respond with JSON: {\"status\": \"ok\"}"],
        config: { responseMimeType: "application/json" }
      });
      console.log(`  SUCCESS: ${m} -> ${resp.text}`);
    } catch (e) {
      console.log(`  FAILED: ${m} -> ${e.message}`);
    }
  }
}

run();
