/**
 * Hugging Face Hosted Visual Inference Integration Module
 * Handles visual question predictions via Hugging Face Hosted Inference.
 * 
 * SECURITY:
 * Reads process.env.HF_TOKEN strictly on the server.
 * NEVER exposes HF_TOKEN to client/browser JavaScript or NEXT_PUBLIC variables.
 */

const LETTERS = ["A", "B", "C", "D"];
const HF_MODEL_ID = "Dnyandeep/maharitage-smolvlm-lora";
const HF_INFERENCE_URL = `https://router.huggingface.co/hf-inference/models/${HF_MODEL_ID}`;

const PROMPT_TEMPLATE = `Look at the image and answer the multiple-choice question.

Question:
{question}

Options:
A. {opt0}
B. {opt1}
C. {opt2}
D. {opt3}

Respond with ONLY ONE option letter:
A
B
C
or
D

Answer:`;

function parseMCQAnswer(text) {
  if (!text || typeof text !== 'string') return null;
  const cleanText = text.trim();
  if (!cleanText) return null;

  if (LETTERS.includes(cleanText.toUpperCase())) {
    return cleanText.toUpperCase();
  }

  const mStart = cleanText.match(/^([ABCD])(?:\.|\s|\n|$)/i);
  if (mStart) return mStart[1].toUpperCase();

  const mPrefix = cleanText.match(/^(?:ANSWER|OPTION|CHOICE)\s*[:=-]?\s*([ABCD])(?:\.|\b)/i);
  if (mPrefix) return mPrefix[1].toUpperCase();

  const mPhrase = cleanText.match(/(?:THE CORRECT ANSWER IS|THE ANSWER IS|OPTION|CHOICE)\s*([ABCD])(?:\b|\.|\s)/i);
  if (mPhrase) return mPhrase[1].toUpperCase();

  return null;
}

export async function getHFVisualPrediction({ question, options, imageUrl }) {
  const token = process.env.HF_TOKEN;

  // Server-side environment check
  if (!token || !token.trim()) {
    return {
      status: "config_error",
      reason: "HF_TOKEN missing in server environment variables (.env.local)",
      prediction: null,
      model: HF_MODEL_ID,
      adapter: "smolvlm_lora_v1 (HF Hub Uploaded)"
    };
  }

  if (!question || !Array.isArray(options) || options.length < 4 || !imageUrl) {
    return {
      status: "invalid_input",
      reason: "Invalid question, options, or imageUrl parameters",
      prediction: null
    };
  }

  const promptText = PROMPT_TEMPLATE
    .replace('{question}', question)
    .replace('{opt0}', options[0])
    .replace('{opt1}', options[1])
    .replace('{opt2}', options[2])
    .replace('{opt3}', options[3]);

  const startMs = Date.now();

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 4000); // 4-second timeout limit

    const payload = {
      inputs: {
        image: imageUrl,
        prompt: promptText
      },
      parameters: {
        max_new_tokens: 5,
        do_sample: false
      }
    };

    const res = await fetch(HF_INFERENCE_URL, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${token.trim()}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify(payload),
      signal: controller.signal
    });

    clearTimeout(timeoutId);

    const latencyMs = Date.now() - startMs;

    if (!res.ok) {
      const errText = await res.text();
      let errorMsg = `Hugging Face API returned status ${res.status}: ${errText.slice(0, 100)}`;
      if (res.status === 400 && errText.includes("Model not supported")) {
        errorMsg = "Model not supported by HF free Serverless Provider (Requires HF Dedicated Inference Endpoint or Space)";
      }
      return {
        status: "unavailable",
        statusCode: res.status,
        reason: errorMsg,
        prediction: null,
        model: HF_MODEL_ID,
        adapter: "smolvlm_lora_v1 (LORA_HOSTING_BLOCKED on Free HF Serverless)",
        latencyMs
      };
    }

    const data = await res.json();
    let rawText = "";

    if (Array.isArray(data) && data[0]?.generated_text) {
      rawText = data[0].generated_text;
    } else if (typeof data === "string") {
      rawText = data;
    } else if (data?.generated_text) {
      rawText = data.generated_text;
    }

    const parsedPrediction = parseMCQAnswer(rawText);

    return {
      status: "success",
      prediction: parsedPrediction,
      model: HF_MODEL_ID,
      adapter: "smolvlm_lora_v1 (HF Hosted Model)",
      latencyMs
    };

  } catch (err) {
    const latencyMs = Date.now() - startMs;
    return {
      status: "unavailable",
      reason: err.name === "AbortError" ? "Hugging Face API request timed out (4000ms)" : err.message,
      prediction: null,
      model: HF_MODEL_ID,
      adapter: "smolvlm_lora_v1 (HF Hub Uploaded)",
      latencyMs
    };
  }
}
