/**
 * Generation Model Configuration (Hugging Face VLM & LLM)
 * 
 * Configurable Hugging Face model settings for visual observation,
 * visual candidate question generation, and distractor generation.
 * 
 * The model acts ONLY as a candidate generator / observation assistant.
 * It is NOT the final correctness authority — Ground-Truth Verifier + MongoDB/Cloudinary
 * metadata are the authoritative source of truth.
 */

export const MODEL_CONFIG = {
  // Hugging Face VLM model identifier for visual candidate generation
  model_id: "HuggingFaceTB/SmolVLM-256M-Instruct",
  
  // Alternative supported vision models for Hugging Face Inference API / local endpoint
  supported_vision_models: [
    "HuggingFaceTB/SmolVLM-256M-Instruct",
    "HuggingFaceTB/SmolVLM-500M-Instruct",
    "Qwen/Qwen2-VL-7B-Instruct",
    "google/paligemma-3b-pt-224"
  ],

  // Execution mode: "local" | "hf_api" | "deterministic_vlm_extractor"
  execution_mode: "deterministic_vlm_extractor",

  // Generation parameters
  generation: {
    temperature: 0.6,
    max_new_tokens: 300,
    top_p: 0.9,
    do_sample: true,
    repetition_penalty: 1.2
  },

  // Device configuration
  device: "auto",

  // Retry settings
  retry: {
    max_attempts: 3,
    delay_ms: 1000
  },

  // API endpoint configuration (for Hugging Face Inference API or local vLLM server)
  api: {
    endpoint: process.env.HF_MODEL_ENDPOINT || "https://api-inference.huggingface.co/models/HuggingFaceTB/SmolVLM-256M-Instruct",
    token: process.env.HF_TOKEN || "",
    timeout_ms: 15000
  }
};
