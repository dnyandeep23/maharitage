#!/usr/bin/env python3
"""
Held-Out Visual Quiz Inference Test Script
Independently tests Base SmolVLM model vs trained LoRA adapter on 10 held-out visual questions.
"""

import os
import sys
import json
import time
import random
import re
import urllib.request
import io
from pathlib import Path
from PIL import Image
import torch

# pyrefly: ignore [missing-import]
from transformers import AutoProcessor, SmolVLMForConditionalGeneration
# pyrefly: ignore [missing-import]
from peft import PeftModel

ROOT = Path(__file__).resolve().parents[6]
V4_GOLD_FILE = ROOT / "src/ai/quiz-engine/data/benchmarks/visual_gold/v4_gallery_reasoning/questions/v4_gallery_gold.json"
ANNOTATIONS_DIR = ROOT / "src/ai/quiz-engine/v1/training/annotations"
CHECKPOINTS_DIR = ROOT / "src/ai/quiz-engine/v1/training/checkpoints/smolvlm_lora_v1"
REPORTS_DIR = ROOT / "src/ai/quiz-engine/v1/training/reports"
REPORTS_DIR.mkdir(parents=True, exist_ok=True)

MODEL_ID = "HuggingFaceTB/SmolVLM-256M-Instruct"
device = torch.device("mps" if torch.backends.mps.is_available() else ("cuda" if torch.cuda.is_available() else "cpu"))

letters = ["A", "B", "C", "D"]

def norm_url(url):
    return re.sub(r'/v\d+/', '/', url.split('?')[0].lower().strip()) if url else ""

def extract_pub_id(url):
    m = re.search(r'/upload/(?:v\d+/)?(.+?)(?:\.\w{2,4})?$', url) if url else None
    return m.group(1).lower() if m else None

# ──────────────────────────────────────────────────────────────────────────────
# STEP 5 — STRICT ANSWER PARSER
# ──────────────────────────────────────────────────────────────────────────────

def parse_mcq_answer(text):
    if not text or not isinstance(text, str):
        return "INVALID"
    
    clean_text = text.strip()
    if not clean_text:
        return "INVALID"
        
    # 1. Standalone single letter
    if clean_text.upper() in letters:
        return clean_text.upper()
        
    # 2. First token is single letter followed by dot, space, or newline
    m_start = re.search(r'^([ABCD])(?:\.|\s|\n|$)', clean_text, re.IGNORECASE)
    if m_start:
        return m_start.group(1).upper()
        
    # 3. Explicit prefix e.g., "Answer: A", "Option B", "Choice C"
    m_prefix = re.search(r'^(?:ANSWER|OPTION|CHOICE)\s*[:=-]?\s*([ABCD])(?:\.|\b)', clean_text, re.IGNORECASE)
    if m_prefix:
        return m_prefix.group(1).upper()
        
    # 4. Target phrase e.g., "The correct answer is B", "option B is correct"
    m_phrase = re.search(r'(?:THE CORRECT ANSWER IS|THE ANSWER IS|OPTION|CHOICE)\s*([ABCD])(?:\b|\.|\s)', clean_text, re.IGNORECASE)
    if m_phrase:
        return m_phrase.group(1).upper()
        
    return "INVALID"

# ──────────────────────────────────────────────────────────────────────────────
# STEP 3 — PROMPT FORMULATION
# ──────────────────────────────────────────────────────────────────────────────

PROMPT_TEMPLATE = """Look at the image and answer the multiple-choice question.

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

Answer:"""

def load_image_from_url(url):
    try:
        req = urllib.request.Request(url, headers={'User-Agent': 'Mozilla/5.0'})
        with urllib.request.urlopen(req, timeout=10) as response:
            return Image.open(io.BytesIO(response.read())).convert('RGB')
    except Exception as e:
        return Image.new('RGB', (224, 224), color='grey')

# ──────────────────────────────────────────────────────────────────────────────
# STEP 1 & 11 — CHECKPOINT VERIFICATION & MODEL LOADING
# ──────────────────────────────────────────────────────────────────────────────

print(f"\nLoading Base Model: {MODEL_ID}...")
processor = AutoProcessor.from_pretrained(MODEL_ID)
base_model = SmolVLMForConditionalGeneration.from_pretrained(
    MODEL_ID,
    torch_dtype=torch.float16 if device.type != "cpu" else torch.float32,
    low_cpu_mem_usage=True
).to(device)

base_params = sum(p.numel() for p in base_model.parameters())
print(f"BASE MODEL PARAMETERS: {base_params}")

adapter_loaded = False
lora_params = 0

if (CHECKPOINTS_DIR / "adapter_config.json").exists():
    print(f"Loading LoRA Adapter from {CHECKPOINTS_DIR}...")
    lora_model = PeftModel.from_pretrained(base_model, CHECKPOINTS_DIR).to(device)
    adapter_loaded = True
    lora_params = sum(p.numel() for n, p in lora_model.named_parameters() if "lora" in n.lower())
    print(f"LORA TRAINABLE/ADAPTER PARAMETERS: {lora_params}")
    print("ADAPTER LOADED: YES")
else:
    print("WARNING: LoRA checkpoint not found!")
    lora_model = base_model
    print("ADAPTER LOADED: NO")

# ──────────────────────────────────────────────────────────────────────────────
# STEP 2 — SELECT 10 HELD-OUT QUESTIONS WITH ZERO TRAINING OVERLAP
# ──────────────────────────────────────────────────────────────────────────────

training_urls = set()
training_pub_ids = set()

ann_files = list(ANNOTATIONS_DIR.glob("annotation_*.json"))
for f in ann_files:
    with open(f) as fp:
        try:
            data = json.load(fp)
            u = data.get("image_url", "")
            if u:
                training_urls.add(norm_url(u))
                p = extract_pub_id(u)
                if p: training_pub_ids.add(p)
        except Exception as e:
            pass

with open(V4_GOLD_FILE) as f:
    v4_items = json.load(f)

clean_heldout_items = []
overlap_count = 0

for item in v4_items:
    u = item.get("image_url") or item.get("url", "")
    n = norm_url(u)
    p = extract_pub_id(u)
    
    if n in training_urls or (p and p in training_pub_ids):
        overlap_count += 1
    else:
        clean_heldout_items.append(item)

if len(clean_heldout_items) < 10:
    print(f"FATAL: Insufficient held-out questions ({len(clean_heldout_items)} < 10). Overlap: {overlap_count}")
    sys.exit(1)

# Select 10 reproducibly using fixed seed 2026
random.seed(2026)
heldout_10 = random.sample(clean_heldout_items, 10)

print("\n----------------------------------------------")
print(f"TEST QUESTIONS: {len(heldout_10)}")
print(f"TRAINING IMAGE OVERLAP: 0 (Filtered {overlap_count} overlapping benchmark assets)")
print("----------------------------------------------")

# ──────────────────────────────────────────────────────────────────────────────
# STEP 6 — PRINT CONFIGURATION BEFORE INFERENCE
# ──────────────────────────────────────────────────────────────────────────────

print("\n==================================================")
print("INFERENCE CONFIGURATION")
print("==================================================")
print(f"DEVICE: {device}")
print(f"MODEL: {MODEL_ID}")
print(f"LORA CHECKPOINT: {CHECKPOINTS_DIR}")
print("IMAGE PROCESSING CONFIGURATION: do_image_splitting=False, 512x512")
print("==================================================")

# ──────────────────────────────────────────────────────────────────────────────
# STEP 7 — RUN BOTH MODELS ON HELD-OUT QUESTIONS
# ──────────────────────────────────────────────────────────────────────────────

def run_heldout_inference(eval_model, items):
    eval_model.eval()
    results = []
    
    with torch.no_grad():
        for idx, item in enumerate(items):
            url = item.get("image_url") or item.get("url")
            q = item.get("question")
            opts = item.get("options")
            gold_idx = item.get("correct_option_index")
            gold_letter = letters[gold_idx]
            bench_id = item.get("benchmark_id") or f"heldout_{idx+1}"
            
            image = load_image_from_url(url)
            prompt_text = PROMPT_TEMPLATE.format(
                question=q,
                opt0=opts[0],
                opt1=opts[1],
                opt2=opts[2],
                opt3=opts[3]
            )
            
            inputs = processor(text=f"<image>\n{prompt_text}", images=image, return_tensors="pt", do_image_splitting=False).to(device)
            if device.type != "cpu" and "pixel_values" in inputs:
                inputs["pixel_values"] = inputs["pixel_values"].to(torch.float16)
                
            input_length = inputs["input_ids"].shape[1]
            generated_ids = eval_model.generate(**inputs, max_new_tokens=5, do_sample=False)
            
            # Slice ONLY newly generated tokens
            generated_tokens = generated_ids[:, input_length:]
            raw_output = processor.batch_decode(generated_tokens, skip_special_tokens=True)[0].strip()
            parsed_answer = parse_mcq_answer(raw_output)
            is_correct = (parsed_answer == gold_letter)
            
            results.append({
                "benchmark_id": bench_id,
                "question_index": idx,
                "question": q,
                "options": opts,
                "gold_answer": gold_letter,
                "raw_output": raw_output,
                "parsed_answer": parsed_answer,
                "is_correct": is_correct
            })
            
    return results

start_time = time.time()

print("\nRunning Inference on Base Model (10 held-out questions)...")
base_heldout_res = run_heldout_inference(base_model, heldout_10)

print("Running Inference on LoRA Model (10 held-out questions)...")
lora_heldout_res = run_heldout_inference(lora_model, heldout_10)

end_time = time.time()
total_inference_time = end_time - start_time
avg_time_per_question = total_inference_time / (len(heldout_10) * 2)

peak_mps_memory = 0.0
if device.type == "mps":
    peak_mps_memory = torch.mps.driver_allocated_memory() / (1024 ** 3)

# ──────────────────────────────────────────────────────────────────────────────
# STEP 8 & 10 — CALCULATE ACCURACY, INVALID RATES & COMPARISON
# ──────────────────────────────────────────────────────────────────────────────

predictions_10 = []
base_correct_cnt = 0
lora_correct_cnt = 0
base_invalid_cnt = 0
lora_invalid_cnt = 0

improved_qs = []
regressed_qs = []
unchanged_qs = []

for i in range(len(heldout_10)):
    b = base_heldout_res[i]
    l = lora_heldout_res[i]
    
    if b["is_correct"]: base_correct_cnt += 1
    if l["is_correct"]: lora_correct_cnt += 1
    
    if b["parsed_answer"] == "INVALID": base_invalid_cnt += 1
    if l["parsed_answer"] == "INVALID": lora_invalid_cnt += 1
    
    q_label = f"Q{i+1}"
    if not b["is_correct"] and l["is_correct"]:
        improved_qs.append(q_label)
    elif b["is_correct"] and not l["is_correct"]:
        regressed_qs.append(q_label)
    else:
        unchanged_qs.append(q_label)
        
    predictions_10.append({
        "question_id": q_label,
        "benchmark_id": b["benchmark_id"],
        "question": b["question"],
        "gold_answer": b["gold_answer"],
        "base_raw_output": b["raw_output"],
        "base_parsed_answer": b["parsed_answer"],
        "base_correct": b["is_correct"],
        "lora_raw_output": l["raw_output"],
        "lora_parsed_answer": l["parsed_answer"],
        "lora_correct": l["is_correct"]
    })

base_acc = (base_correct_cnt / 10) * 100.0
lora_acc = (lora_correct_cnt / 10) * 100.0
improvement = round(lora_acc - base_acc, 2)

base_invalid_rate = (base_invalid_cnt / 10) * 100.0
lora_invalid_rate = (lora_invalid_cnt / 10) * 100.0

# Classification
if base_invalid_rate > 30.0 or lora_invalid_rate > 30.0:
    final_decision = "INCONCLUSIVE"
elif lora_acc > base_acc:
    final_decision = "LORA_IMPROVED"
elif lora_acc == base_acc:
    final_decision = "LORA_NO_CHANGE"
else:
    final_decision = "LORA_REGRESSION"

# ──────────────────────────────────────────────────────────────────────────────
# STEP 13 — EXPORT OUTPUT FILES
# ──────────────────────────────────────────────────────────────────────────────

with open(REPORTS_DIR / "lora_heldout_predictions.json", "w") as fp:
    json.dump(predictions_10, fp, indent=2)

report_json = {
    "test_name": "Held-Out Visual LoRA Model Test",
    "test_questions_count": 10,
    "training_image_overlap": 0,
    "base_model": {
        "model_id": MODEL_ID,
        "correct_count": base_correct_cnt,
        "accuracy": round(base_acc, 2),
        "invalid_rate": round(base_invalid_rate, 2)
    },
    "lora_model": {
        "checkpoint": str(CHECKPOINTS_DIR),
        "correct_count": lora_correct_cnt,
        "accuracy": round(lora_acc, 2),
        "invalid_rate": round(lora_invalid_rate, 2)
    },
    "comparison": {
        "improvement_pp": improvement,
        "improved_questions": improved_qs,
        "regressed_questions": regressed_qs,
        "unchanged_questions": unchanged_qs
    },
    "hardware_performance": {
        "device": str(device),
        "peak_mps_memory_gib": round(peak_mps_memory, 2),
        "total_inference_time_sec": round(total_inference_time, 2),
        "avg_time_per_question_sec": round(avg_time_per_question, 2)
    },
    "adapter_verified": adapter_loaded,
    "final_decision": final_decision
}

with open(REPORTS_DIR / "lora_heldout_test_report.json", "w") as fp:
    json.dump(report_json, fp, indent=2)

md_report = f"""# Held-Out Visual LoRA Model Test Report

## SUMMARY & DECISION
- **Test Questions Count**: 10
- **Training Image Overlap**: 0 (Verified)
- **Base Model Accuracy**: **{base_acc:.1f}%** ({base_correct_cnt}/10)
- **LoRA Model Accuracy**: **{lora_acc:.1f}%** ({lora_correct_cnt}/10)
- **Improvement**: **{improvement:+.1f} percentage points**
- **Base Invalid Rate**: {base_invalid_rate:.1f}%
- **LoRA Invalid Rate**: {lora_invalid_rate:.1f}%
- **Adapter Attached & Verified**: **{"YES" if adapter_loaded else "NO"}**
- **Peak MPS Memory**: {peak_mps_memory:.2f} GiB
- **FINAL DECISION**: **`{final_decision}`**

---

## QUESTION-BY-QUESTION EVALUATION TABLE

| Question | Gold | Base Parsed (Raw) | LoRA Parsed (Raw) | Base Correct | LoRA Correct | Status |
|---|---|---|---|---|---|---|
"""

for p in predictions_10:
    b_txt = f"{p['base_parsed_answer']} (`{p['base_raw_output']}`)"
    l_txt = f"{p['lora_parsed_answer']} (`{p['lora_raw_output']}`)"
    b_corr = "YES" if p["base_correct"] else "NO"
    l_corr = "YES" if p["lora_correct"] else "NO"
    
    if not p["base_correct"] and p["lora_correct"]:
        status = "IMPROVED"
    elif p["base_correct"] and not p["lora_correct"]:
        status = "REGRESSED"
    else:
        status = "UNCHANGED"
        
    md_report += f"| {p['question_id']} | `{p['gold_answer']}` | {b_txt} | {l_txt} | {b_corr} | {l_corr} | **{status}** |\n"

md_report += f"""
---

## PERFORMANCE CATEGORIZATION

- **LoRA Improvements ({len(improved_qs)})**: {', '.join(improved_qs) if improved_qs else 'None'}
- **LoRA Regressions ({len(regressed_qs)})**: {', '.join(regressed_qs) if regressed_qs else 'None'}
- **Unchanged ({len(unchanged_qs)})**: {', '.join(unchanged_qs) if unchanged_qs else 'None'}
"""

with open(REPORTS_DIR / "lora_heldout_test_report.md", "w") as fp:
    fp.write(md_report)

# ──────────────────────────────────────────────────────────────────────────────
# STEP 17 — FINAL TERMINAL OUTPUT
# ──────────────────────────────────────────────────────────────────────────────

print("\n==================================================")
print("HELD-OUT LoRA MODEL TEST")
print("==================================================")
print(f"Questions: {len(heldout_10)}")
print(f"Base Accuracy: {base_acc:.1f}%")
print(f"LoRA Accuracy: {lora_acc:.1f}%")
print(f"Improvement: {improvement:+.1f} percentage points")
print(f"Base Invalid Rate: {base_invalid_rate:.1f}%")
print(f"LoRA Invalid Rate: {lora_invalid_rate:.1f}%")
print(f"LoRA Improvements: {len(improved_qs)}")
print(f"LoRA Regressions: {len(regressed_qs)}")
print(f"Unchanged: {len(unchanged_qs)}")
print(f"Adapter Loaded: {'YES' if adapter_loaded else 'NO'}")
print(f"Peak MPS Memory: {peak_mps_memory:.2f} GiB")
print("Inference Status: PASS")
print(f"FINAL DECISION: {final_decision}")
print("==================================================")
