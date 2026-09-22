#!/usr/bin/env python3
"""
Hugging Face Hub LoRA Adapter Upload Helper Script
Provides instructions and commands for uploading the local smolvlm_lora_v1 adapter
to Hugging Face Hub for hosted inference deployment.
"""

import os
from pathlib import Path

ROOT = Path(__file__).resolve().parents[6]
CHECKPOINTS_DIR = ROOT / "src/ai/quiz-engine/v1/training/checkpoints/smolvlm_lora_v1"

print("==================================================")
print("HUGGING FACE HUB LORA ADAPTER DEPLOYMENT GUIDANCE")
print("==================================================")
print(f"Local LoRA Checkpoint: {CHECKPOINTS_DIR}")
print(f"Checkpoint Exists: {CHECKPOINTS_DIR.exists()}")
if CHECKPOINTS_DIR.exists():
    print(f"adapter_config.json: {(CHECKPOINTS_DIR / 'adapter_config.json').exists()}")

print("\n----------------------------------------------")
print("STEPS TO DEPLOY LOCAL LORA ADAPTER TO HF HUB")
print("----------------------------------------------")
print("1. Install huggingface_hub:")
print("   pip install huggingface_hub")
print("\n2. Log in with your Hugging Face Access Token:")
print("   huggingface-cli login")
print("\n3. Push local adapter to your Hugging Face repository:")
print("   from peft import PeftModel")
print("   model = PeftModel.from_pretrained(base_model, str(CHECKPOINTS_DIR))")
print("   model.push_to_hub('your-hf-username/smolvlm_lora_v1')")
print("\n4. Update HF_INFERENCE_URL in src/lib/hfVisualInference.js to point to your repository.")
print("==================================================")
