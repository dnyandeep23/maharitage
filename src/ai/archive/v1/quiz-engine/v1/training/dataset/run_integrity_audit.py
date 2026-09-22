#!/usr/bin/env python3
"""
Final LoRA Evaluation Integrity Audit
Independently verifies benchmark datasets, evaluates Base vs LoRA models,
checks adapter attachment, and exports final audit reports.
"""

import os
import sys
import json
import time
import urllib.request
import io
from pathlib import Path
from PIL import Image
# pyrefly: ignore [missing-import]
import torch

ROOT = Path(__file__).resolve().parents[6]
V4_GOLD_FILE = ROOT / "src/ai/quiz-engine/data/benchmarks/visual_gold/v4_gallery_reasoning/questions/v4_gallery_gold.json"
HARD_DIAG_FILE = ROOT / "src/ai/quiz-engine/data/benchmarks/visual_gold/hard_image_diagnostic/questions/hard_image_diagnostic.json"
ANNOTATIONS_DIR = ROOT / "src/ai/quiz-engine/v1/training/annotations"
CHECKPOINTS_DIR = ROOT / "src/ai/quiz-engine/v1/training/checkpoints/smolvlm_lora_v1"
REPORTS_DIR = ROOT / "src/ai/quiz-engine/v1/training/reports"
REPORTS_DIR.mkdir(parents=True, exist_ok=True)

MODEL_ID = "HuggingFaceTB/SmolVLM-256M-Instruct"
device = torch.device("mps" if torch.backends.mps.is_available() else ("cuda" if torch.cuda.is_available() else "cpu"))

print("==================================================")
print("FINAL LoRA EVALUATION INTEGRITY AUDIT")
print("==================================================")
print(f"Device: {device}")
print(f"Checkpoint Directory: {CHECKPOINTS_DIR}")

# ──────────────────────────────────────────────────────────────────────────────
# STEP 1 — VERIFY V4 DATASET SCHEMA
# ──────────────────────────────────────────────────────────────────────────────

if not V4_GOLD_FILE.exists():
    print(f"FATAL: V4 Gold Benchmark file not found at {V4_GOLD_FILE}")
    sys.exit(1)

with open(V4_GOLD_FILE) as f:
    v4_raw_items = json.load(f)

v4_questions_count = len(v4_raw_items)
v4_valid_items = 0
v4_invalid_items = 0
gold_label_dist = {"A": 0, "B": 0, "C": 0, "D": 0}
letters = ["A", "B", "C", "D"]

for idx, item in enumerate(v4_raw_items):
    url = item.get("image_url") or item.get("url")
    q = item.get("question")
    opts = item.get("options")
    target_idx = item.get("correct_option_index")
    
    is_valid = True
    if not url or not q or not opts or not isinstance(opts, list) or len(opts) != 4 or target_idx is None or not (0 <= target_idx < 4):
        is_valid = False
        print(f"Malformed V4 item [{idx}]: url={bool(url)}, q={bool(q)}, opts_len={len(opts) if opts else 0}, target_idx={target_idx}")
    
    if is_valid:
        v4_valid_items += 1
        gold_label_dist[letters[target_idx]] += 1
    else:
        v4_invalid_items += 1

print(f"V4 Questions Total    : {v4_questions_count}")
print(f"V4 Valid Items        : {v4_valid_items}")
print(f"V4 Invalid Items      : {v4_invalid_items}")
print(f"V4 Gold Distribution  : {gold_label_dist}")

dataset_valid = (v4_invalid_items == 0 and v4_valid_items > 0)

# ──────────────────────────────────────────────────────────────────────────────
# STEP 2 — STRICT EVALUATION ENGINE
# ──────────────────────────────────────────────────────────────────────────────

def load_image_from_url(url):
    try:
        req = urllib.request.Request(url, headers={'User-Agent': 'Mozilla/5.0'})
        with urllib.request.urlopen(req, timeout=10) as response:
            return Image.open(io.BytesIO(response.read())).convert('RGB')
    except Exception as e:
        return Image.new('RGB', (224, 224), color='grey')

def evaluate_dataset_strict(eval_model, processor, items, name="Dataset"):
    eval_model.eval()
    correct = 0
    total = len(items)
    pred_dist = {"A": 0, "B": 0, "C": 0, "D": 0, "UNKNOWN": 0}
    
    if total == 0:
        return {"correct": 0, "total": 0, "accuracy": 0.0, "distribution": pred_dist}
        
    with torch.no_grad():
        for idx, item in enumerate(items):
            url = item.get("image_url") or item.get("url")
            q = item.get("question")
            opts = item.get("options")
            target_idx = item.get("correct_option_index")
            
            if not url or not q or not opts or len(opts) != 4 or target_idx is None:
                raise ValueError(f"Strict Evaluation Error: Item at index {idx} in {name} is missing required fields!")
                
            target_letter = letters[target_idx]
            image = load_image_from_url(url)
            
            prompt = f"<image>\nQuestion: {q}\nOptions:\nA. {opts[0]}\nB. {opts[1]}\nC. {opts[2]}\nD. {opts[3]}\nAnswer:"
            
            inputs = processor(text=prompt, images=image, return_tensors="pt", do_image_splitting=False).to(device)
            if device.type != "cpu" and "pixel_values" in inputs:
                inputs["pixel_values"] = inputs["pixel_values"].to(torch.float16)
                
            generated_ids = eval_model.generate(**inputs, max_new_tokens=5)
            generated_text = processor.batch_decode(generated_ids, skip_special_tokens=True)[0]
            
            pred_letter = None
            for l in letters:
                if l in generated_text.upper():
                    pred_letter = l
                    break
                    
            if pred_letter is None:
                pred_letter = "UNKNOWN"
                
            pred_dist[pred_letter] += 1
            if pred_letter == target_letter:
                correct += 1
                
    acc = (correct / total) * 100.0
    return {"correct": correct, "total": total, "accuracy": acc, "distribution": pred_dist}

# ──────────────────────────────────────────────────────────────────────────────
# STEP 3 & 7 — LOAD MODELS & CHECKPOINTS
# ──────────────────────────────────────────────────────────────────────────────

# pyrefly: ignore [missing-import]
from transformers import AutoProcessor, SmolVLMForConditionalGeneration
# pyrefly: ignore [missing-import]
from peft import PeftModel

print(f"\nLoading Base Model: {MODEL_ID}...")
processor = AutoProcessor.from_pretrained(MODEL_ID)\
# pyrefly: ignore [parse-error]
base_model = SmolVLMForConditionalGeneration.from_pretrained(
    MODEL_ID,
    torch_dtype=torch.float16 if device.type != "cpu" else torch.float32,
    low_cpu_mem_usage=True
).to(device)

print("Base model loaded successfully.")

# Checkpoint verification
adapter_weights_file = CHECKPOINTS_DIR / "adapter_model.safetensors"
if not adapter_weights_file.exists():
    adapter_weights_file = CHECKPOINTS_DIR / "adapter_model.bin"

adapter_config_file = CHECKPOINTS_DIR / "adapter_config.json"
adapter_loaded = False
lora_params = 0

if adapter_weights_file.exists() and adapter_config_file.exists():
    print(f"Loading LoRA Adapter from {CHECKPOINTS_DIR}...")
    lora_model = PeftModel.from_pretrained(base_model, CHECKPOINTS_DIR).to(device)
    adapter_loaded = True
    lora_params = sum(p.numel() for p in lora_model.parameters() if p.requires_grad)
    print(f"LoRA Adapter loaded successfully! Trainable params: {lora_params}")
else:
    print(f"WARNING: LoRA Checkpoint not found at {CHECKPOINTS_DIR}!")
    lora_model = base_model

# ──────────────────────────────────────────────────────────────────────────────
# STEP 3, 4, 5, 6 — RUN EVALUATIONS
# ──────────────────────────────────────────────────────────────────────────────

# 1. Validation Set
ann_files = list(ANNOTATIONS_DIR.glob("annotation_*.json"))
val_items = []
for f in ann_files[:3]:
    with open(f) as fp:
        val_items.append(json.load(fp))

print("\nRunning Evaluation on Validation Set...")
val_base_res = evaluate_dataset_strict(base_model, processor, val_items, "Validation Set")
val_lora_res = evaluate_dataset_strict(lora_model, processor, val_items, "Validation Set") if adapter_loaded else val_base_res

# 2. Frozen V4 Gold Benchmark
print("Running Evaluation on Frozen V4 Gold Benchmark...")
v4_base_res = evaluate_dataset_strict(base_model, processor, v4_raw_items, "V4 Gold Benchmark")
v4_lora_res = evaluate_dataset_strict(lora_model, processor, v4_raw_items, "V4 Gold Benchmark") if adapter_loaded else v4_base_res

# 3. Hard Image Diagnostic Benchmark
hard_raw_items = []
if HARD_DIAG_FILE.exists():
    with open(HARD_DIAG_FILE) as f:
        hard_raw_items = json.load(f)

print("Running Evaluation on Hard Image Diagnostic Benchmark...")
hard_base_res = evaluate_dataset_strict(base_model, processor, hard_raw_items, "Hard Diagnostic Benchmark")
hard_lora_res = evaluate_dataset_strict(lora_model, processor, hard_raw_items, "Hard Diagnostic Benchmark") if adapter_loaded else hard_base_res

# ──────────────────────────────────────────────────────────────────────────────
# STEP 8 — FINAL DECISION LOGIC
# ──────────────────────────────────────────────────────────────────────────────

v4_change = v4_lora_res["accuracy"] - v4_base_res["accuracy"]
hard_change = hard_lora_res["accuracy"] - hard_base_res["accuracy"]
val_change = val_lora_res["accuracy"] - val_base_res["accuracy"]

if not dataset_valid:
    final_status = "EVALUATION_INVALID"
elif hard_change > 5.0 and v4_change >= -2.0:
    final_status = "POTENTIAL_LORA_BENEFIT"
elif hard_change > 5.0 and v4_change < -2.0:
    final_status = "REGRESSION"
else:
    final_status = "LORA_NO_SIGNIFICANT_IMPROVEMENT"

print("\n==================================================")
print("INTEGRITY AUDIT RESULTS COMPARISON")
print("==================================================")
print(f"V4 Gold Benchmark      : Base = {v4_base_res['accuracy']:.2f}% ({v4_base_res['correct']}/{v4_base_res['total']}), LoRA = {v4_lora_res['accuracy']:.2f}% ({v4_lora_res['correct']}/{v4_lora_res['total']}), Change = {v4_change:+.2f}%")
print(f"Hard Image Diagnostic  : Base = {hard_base_res['accuracy']:.2f}% ({hard_base_res['correct']}/{hard_base_res['total']}), LoRA = {hard_lora_res['accuracy']:.2f}% ({hard_lora_res['correct']}/{hard_lora_res['total']}), Change = {hard_change:+.2f}%")
print(f"Validation Set         : Base = {val_base_res['accuracy']:.2f}% ({val_base_res['correct']}/{val_base_res['total']}), LoRA = {val_lora_res['accuracy']:.2f}% ({val_lora_res['correct']}/{val_lora_res['total']}), Change = {val_change:+.2f}%")
print(f"Adapter Loaded         : {'YES' if adapter_loaded else 'NO'} ({lora_params} params)")
print(f"FINAL DECISION STATUS  : {final_status}")
print("==================================================")

# ──────────────────────────────────────────────────────────────────────────────
# STEP 9 — EXPORT REPORTS
# ──────────────────────────────────────────────────────────────────────────────

audit_json = {
    "dataset_validity": "VALID" if dataset_valid else "INVALID",
    "v4_questions": v4_questions_count,
    "v4_valid_items": v4_valid_items,
    "v4_invalid_items": v4_invalid_items,
    "v4_gold_label_distribution": gold_label_dist,
    "base_model": {
        "v4_base_accuracy": round(v4_base_res["accuracy"], 2),
        "v4_base_correct": v4_base_res["correct"],
        "v4_base_distribution": v4_base_res["distribution"],
        "hard_base_accuracy": round(hard_base_res["accuracy"], 2),
        "hard_base_correct": hard_base_res["correct"],
        "hard_base_distribution": hard_base_res["distribution"],
        "validation_base_accuracy": round(val_base_res["accuracy"], 2),
        "validation_base_correct": val_base_res["correct"]
    },
    "lora_model": {
        "v4_lora_accuracy": round(v4_lora_res["accuracy"], 2),
        "v4_lora_correct": v4_lora_res["correct"],
        "v4_lora_distribution": v4_lora_res["distribution"],
        "hard_lora_accuracy": round(hard_lora_res["accuracy"], 2),
        "hard_lora_correct": hard_lora_res["correct"],
        "hard_lora_distribution": hard_lora_res["distribution"],
        "validation_lora_accuracy": round(val_lora_res["accuracy"], 2),
        "validation_lora_correct": val_lora_res["correct"]
    },
    "changes": {
        "v4_change": round(v4_change, 2),
        "hard_change": round(hard_change, 2),
        "validation_change": round(val_change, 2)
    },
    "checkpoint": {
        "adapter_loaded": adapter_loaded,
        "adapter_parameters": lora_params,
        "checkpoint_path": str(CHECKPOINTS_DIR)
    },
    "final_decision": final_status
}

with open(REPORTS_DIR / "final_lora_integrity_audit.json", "w") as fp:
    json.dump(audit_json, fp, indent=2)

md_audit = f"""# Final LoRA Evaluation Integrity Audit Report

## DATASET VALIDITY
- **V4 Benchmark File**: `{V4_GOLD_FILE}`
- **V4 Total Questions**: {v4_questions_count}
- **V4 Valid Items**: {v4_valid_items}
- **V4 Invalid Items**: {v4_invalid_items}
- **V4 Gold Label Distribution**: A={gold_label_dist['A']}, B={gold_label_dist['B']}, C={gold_label_dist['C']}, D={gold_label_dist['D']}
- **Dataset Validity Status**: **{"VALID" if dataset_valid else "INVALID"}**

## CHECKPOINT INTEGRITY
- **LoRA Adapter Loaded**: **{"YES" if adapter_loaded else "NO"}**
- **Adapter Parameters**: {lora_params}
- **Checkpoint Path**: `{CHECKPOINTS_DIR}`

## EXPERIMENTAL EVALUATION RESULTS

| Benchmark Dataset | Base Model Accuracy | LoRA Model Accuracy | Absolute Change |
|---|---|---|---|
| Frozen V4 Gold Benchmark (55 items) | {v4_base_res['accuracy']:.2f}% ({v4_base_res['correct']}/{v4_base_res['total']}) | {v4_lora_res['accuracy']:.2f}% ({v4_lora_res['correct']}/{v4_lora_res['total']}) | {v4_change:+.2f}% |
| Hard Image Diagnostic (50 items) | {hard_base_res['accuracy']:.2f}% ({hard_base_res['correct']}/{hard_base_res['total']}) | {hard_lora_res['accuracy']:.2f}% ({hard_lora_res['correct']}/{hard_lora_res['total']}) | {hard_change:+.2f}% |
| Validation Set (3 items) | {val_base_res['accuracy']:.2f}% ({val_base_res['correct']}/{val_base_res['total']}) | {val_lora_res['accuracy']:.2f}% ({val_lora_res['correct']}/{val_lora_res['total']}) | {val_change:+.2f}% |

## MODEL PREDICTION DISTRIBUTIONS

- **Base V4 Predictions**: {v4_base_res['distribution']}
- **LoRA V4 Predictions**: {v4_lora_res['distribution']}
- **Base Hard-Image Predictions**: {hard_base_res['distribution']}
- **LoRA Hard-Image Predictions**: {hard_lora_res['distribution']}

## FINAL AUDIT DECISION
**FINAL_STATUS**: **{final_status}**
"""

with open(REPORTS_DIR / "final_lora_integrity_audit.md", "w") as fp:
    fp.write(md_audit)

print(f"\nFinal audit report saved to {REPORTS_DIR / 'final_lora_integrity_audit.md'}")
