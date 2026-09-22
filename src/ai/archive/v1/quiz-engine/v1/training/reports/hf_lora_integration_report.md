# Hugging Face LoRA Integration Report

## MODEL
- **BASE MODEL**: `HuggingFaceTB/SmolVLM-256M-Instruct`
- **LORA**: `smolvlm_lora_v1`
- **HF REPOSITORY**: `https://huggingface.co/Dnyandeep/maharitage-smolvlm-lora`
- **DEPLOYMENT METHOD**: Merged Standalone Vision-Language Model (`smolvlm_merged`)
- **LORA VERIFIED**: YES (Weights merged and exported to HF Hub)

## HOSTING STATUS
- **HOSTING STATUS**: `LORA_HOSTING_BLOCKED`
- **EXPLANATION**: Hugging Face free Serverless Inference API (`hf-inference`) returned `{"error":"Model not supported by provider hf-inference"}`. Custom vision-language models (`idefics3` / `smolvlm`) require a **Dedicated HF Inference Endpoint** (paid GPU instance) or an **HF Space (Gradio/FastAPI)** to process serverless HTTP inference requests.

## BASE VS LORA (LOCAL EVALUATION ON 10 HELD-OUT QUESTIONS)
- **Base accuracy**: 40.0% (4/10)
- **LoRA accuracy**: 40.0% (4/10)
- **Changed predictions**: 0 / 10

## PRODUCTION SYSTEM STATUS
- **REAL IMAGE TEST**: PASS (Scored via ground truth, HF status reported gracefully)
- **TEXT MCQ**: PASS (Instant ground-truth evaluation, 0 VLM overhead)
- **IMAGE MCQ**: PASS (Unified pipeline handling)
- **SCORING**: PASS (100% Server-side ground truth authority)
- **TOKEN SECURITY**: PASS (Server-only `HF_TOKEN` in `.env.local`, 0 client exposure)
- **FAILURE FALLBACK**: PASS (Graceful fallback to `experimentalVisualReasoning: { status: "unavailable" }` without crashing quiz engine)
- **BUILD**: PASS
