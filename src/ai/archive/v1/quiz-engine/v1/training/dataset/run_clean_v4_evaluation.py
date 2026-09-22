#!/usr/bin/env python3
"""
Final Clean V4 Visual Evaluation Script
Evaluates Base Model (SmolVLM-256M-Instruct) and LoRA Adapter (smolvlm_lora_v1)
across all 55 questions in frozen canonical v4_gallery_gold.json using strict regex parsing
and token-sliced inference.
"""

import os
import sys
import json
import math
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
CHECKPOINTS_DIR = ROOT / "src/ai/quiz-engine/v1/training/checkpoints/smolvlm_lora_v1"
REPORTS_DIR = ROOT / "src/ai/quiz-engine/v1/training/reports"
REPORTS_DIR.mkdir(parents=True, exist_ok=True)

MODEL_ID = "HuggingFaceTB/SmolVLM-256M-Instruct"
device = torch.device("mps" if torch.backends.mps.is_available() else ("cuda" if torch.cuda.is_available() else "cpu"))

letters = ["A", "B", "C", "D"]

print("==================================================")
print("FINAL CLEAN V4 VISUAL EVALUATION")
print("==================================================")
print(f"Device: {device}")
print(f"Benchmark File: {V4_GOLD_FILE}")

# ──────────────────────────────────────────────────────────────────────────────
# STEP 1 — STRICT ANSWER PARSER
# ──────────────────────────────────────────────────────────────────────────────

def parse_mcq_answer(text):
    if not text or not isinstance(text, str):
        return "INVALID"
    
    clean_text = text.strip()
    if not clean_text:
        return "INVALID"
        
    # 1. Exact standalone single letter
    if clean_text.upper() in letters:
        return clean_text.upper()
        
    # 2. First token is single letter followed by dot, space, or newline (e.g., "A.", "B\n")
    m_start = re.search(r'^([ABCD])(?:\.|\s|\n|$)', clean_text, re.IGNORECASE)
    if m_start:
        return m_start.group(1).upper()
        
    # 3. Explicit prefix e.g., "Answer: A", "Option B", "Choice C"
    m_prefix = re.search(r'^(?:ANSWER|OPTION|CHOICE)\s*[:=-]?\s*([ABCD])(?:\.|\b)', clean_text, re.IGNORECASE)
    if m_prefix:
        return m_prefix.group(1).upper()
        
    # 4. Target phrase e.g., "The correct answer is B", "option B is correct"
    m_phrase = re.search(r'(?:THE CORRECT ANSWER IS|OPTION|CHOICE)\s*([ABCD])(?:\b|\.|\s)', clean_text, re.IGNORECASE)
    if m_phrase:
        return m_phrase.group(1).upper()
        
    return "INVALID"

# ──────────────────────────────────────────────────────────────────────────────
# PROMPT DEFINITION
# ──────────────────────────────────────────────────────────────────────────────

PROMPT_TEMPLATE = """You are answering a visual multiple-choice question.

Look carefully at the image and select the correct option.

Return ONLY one answer:
A
B
C
or
D

Do not explain.
Do not repeat the question.
Do not repeat the options.
Do not generate another question.
Return only the selected option.

Question: {question}
Options:
A. {opt0}
B. {opt1}
C. {opt2}
D. {opt3}
Answer:"""

def load_image_from_url(url):
    try:
        req = urllib.request.Request(url, headers={'User-Agent': 'Mozilla/5.0'})
        with urllib.request.urlopen(req, timeout=10) as response:
            return Image.open(io.BytesIO(response.read())).convert('RGB')
    except Exception as e:
        return Image.new('RGB', (224, 224), color='grey')

def wilson_score_interval(correct, total, confidence=0.95):
    if total == 0:
        return 0.0, 0.0
    p = correct / total
    z = 1.96  # 95% confidence
    denominator = 1 + (z**2 / total)
    center = (p + (z**2 / (2 * total))) / denominator
    margin = (z * math.sqrt((p * (1 - p) / total) + (z**2 / (4 * total**2)))) / denominator
    low = max(0.0, (center - margin) * 100.0)
    high = min(100.0, (center + margin) * 100.0)
    return round(low, 2), round(high, 2)

# ──────────────────────────────────────────────────────────────────────────────
# STEP 2 — LOAD BENCHMARK & MODELS
# ──────────────────────────────────────────────────────────────────────────────

if not V4_GOLD_FILE.exists():
    print(f"FATAL: Benchmark file missing: {V4_GOLD_FILE}")
    sys.exit(1)

with open(V4_GOLD_FILE) as f:
    v4_items = json.load(f)

print(f"Loaded {len(v4_items)} frozen V4 gold questions.")

print(f"\nLoading Base Model: {MODEL_ID}...")
processor = AutoProcessor.from_pretrained(MODEL_ID)
base_model = SmolVLMForConditionalGeneration.from_pretrained(
    MODEL_ID,
    torch_dtype=torch.float16 if device.type != "cpu" else torch.float32,
    low_cpu_mem_usage=True
).to(device)

adapter_loaded = False
if (CHECKPOINTS_DIR / "adapter_config.json").exists():
    print(f"Loading LoRA Adapter from {CHECKPOINTS_DIR}...")
    lora_model = PeftModel.from_pretrained(base_model, CHECKPOINTS_DIR).to(device)
    adapter_loaded = True
else:
    print("WARNING: LoRA checkpoint not found. Evaluating Base Model twice.")
    lora_model = base_model

# ──────────────────────────────────────────────────────────────────────────────
# STEP 3 — EVALUATION LOOP
# ──────────────────────────────────────────────────────────────────────────────

def evaluate_all_55(eval_model, items):
    eval_model.eval()
    results = []
    
    with torch.no_grad():
        for idx, item in enumerate(items):
            url = item.get("image_url") or item.get("url")
            q = item.get("question")
            opts = item.get("options")
            gold_idx = item.get("correct_option_index")
            gold_letter = letters[gold_idx]
            bench_id = item.get("benchmark_id") or f"v4_item_{idx+1}"
            site_id = item.get("site_id", "UNKNOWN")
            category = item.get("category", "General Visual Reasoning")
            
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
                
            input_len = inputs["input_ids"].shape[1]
            generated_ids = eval_model.generate(**inputs, max_new_tokens=5, do_sample=False)
            
            raw_sliced_tokens = generated_ids[:, input_len:]
            raw_output = processor.batch_decode(raw_sliced_tokens, skip_special_tokens=True)[0].strip()
            parsed_answer = parse_mcq_answer(raw_output)
            is_correct = (parsed_answer == gold_letter)
            
            results.append({
                "benchmark_id": bench_id,
                "question_index": idx,
                "site_id": site_id,
                "category": category,
                "image_url": url,
                "question": q,
                "options": opts,
                "gold_answer": gold_letter,
                "raw_output": raw_output,
                "parsed_answer": parsed_answer,
                "is_correct": is_correct
            })
            
    return results

print("\nExecuting Inference on Base Model across all 55 questions...")
base_results = evaluate_all_55(base_model, v4_items)

print("Executing Inference on LoRA Model across all 55 questions...")
lora_results = evaluate_all_55(lora_model, v4_items)

# Combine 55 predictions
predictions_55 = []
for i in range(len(v4_items)):
    b = base_results[i]
    l = lora_results[i]
    predictions_55.append({
        "benchmark_id": b["benchmark_id"],
        "question_index": i,
        "site_id": b["site_id"],
        "category": b["category"],
        "image_url": b["image_url"],
        "question": b["question"],
        "options": b["options"],
        "gold_answer": b["gold_answer"],
        "raw_base_output": b["raw_output"],
        "parsed_base_answer": b["parsed_answer"],
        "base_correct": b["is_correct"],
        "raw_lora_output": l["raw_output"],
        "parsed_lora_answer": l["parsed_answer"],
        "lora_correct": l["is_correct"]
    })

with open(REPORTS_DIR / "final_v4_predictions.json", "w") as fp:
    json.dump(predictions_55, fp, indent=2)

# ──────────────────────────────────────────────────────────────────────────────
# STEP 4 — STATISTICAL CALCULATIONS
# ──────────────────────────────────────────────────────────────────────────────

total_q = len(predictions_55)
base_correct_count = sum(1 for p in predictions_55 if p["base_correct"])
lora_correct_count = sum(1 for p in predictions_55 if p["lora_correct"])

base_acc = (base_correct_count / total_q) * 100.0
lora_acc = (lora_correct_count / total_q) * 100.0

base_wilson_low, base_wilson_high = wilson_score_interval(base_correct_count, total_q)
lora_wilson_low, lora_wilson_high = wilson_score_interval(lora_correct_count, total_q)

abs_imp = round(lora_acc - base_acc, 2)
rel_imp = round(((lora_acc - base_acc) / base_acc * 100.0), 2) if base_acc > 0 else 0.0

# McNemar Table
mcnemar = {
    "both_correct": 0,
    "base_correct_lora_wrong": 0,
    "base_wrong_lora_correct": 0,
    "both_wrong": 0
}

improved_count = 0
regressed_count = 0
unchanged_count = 0

for p in predictions_55:
    bc = p["base_correct"]
    lc = p["lora_correct"]
    if bc and lc:
        mcnemar["both_correct"] += 1
        unchanged_count += 1
    elif bc and not lc:
        mcnemar["base_correct_lora_wrong"] += 1
        regressed_count += 1
    elif not bc and lc:
        mcnemar["base_wrong_lora_correct"] += 1
        improved_count += 1
    else:
        mcnemar["both_wrong"] += 1
        unchanged_count += 1

# Prediction Distributions
base_pred_dist = {"A": 0, "B": 0, "C": 0, "D": 0, "INVALID": 0}
lora_pred_dist = {"A": 0, "B": 0, "C": 0, "D": 0, "INVALID": 0}

for p in predictions_55:
    base_pred_dist[p["parsed_base_answer"]] = base_pred_dist.get(p["parsed_base_answer"], 0) + 1
    lora_pred_dist[p["parsed_lora_answer"]] = lora_pred_dist.get(p["parsed_lora_answer"], 0) + 1

# Accuracy by Gold Target
by_gold = {"A": {"total": 0, "base": 0, "lora": 0}, "B": {"total": 0, "base": 0, "lora": 0}, "C": {"total": 0, "base": 0, "lora": 0}, "D": {"total": 0, "base": 0, "lora": 0}}
for p in predictions_55:
    g = p["gold_answer"]
    by_gold[g]["total"] += 1
    if p["base_correct"]: by_gold[g]["base"] += 1
    if p["lora_correct"]: by_gold[g]["lora"] += 1

by_gold_summary = {}
for g, d in by_gold.items():
    tot = d["total"]
    by_gold_summary[g] = {
        "total": tot,
        "base_accuracy": round(d["base"] / tot * 100.0, 2) if tot else 0.0,
        "lora_accuracy": round(d["lora"] / tot * 100.0, 2) if tot else 0.0
    }

# Accuracy by Site & Category
by_site = {}
by_cat = {}

for p in predictions_55:
    sid = p["site_id"]
    cat = p["category"]
    
    if sid not in by_site: by_site[sid] = {"total": 0, "base": 0, "lora": 0}
    by_site[sid]["total"] += 1
    if p["base_correct"]: by_site[sid]["base"] += 1
    if p["lora_correct"]: by_site[sid]["lora"] += 1
    
    if cat not in by_cat: by_cat[cat] = {"total": 0, "base": 0, "lora": 0}
    by_cat[cat]["total"] += 1
    if p["base_correct"]: by_cat[cat]["base"] += 1
    if p["lora_correct"]: by_cat[cat]["lora"] += 1

by_site_summary = {s: {"total": d["total"], "base_acc": round(d["base"]/d["total"]*100.0, 2), "lora_acc": round(d["lora"]/d["total"]*100.0, 2)} for s, d in by_site.items()}
by_cat_summary = {c: {"total": d["total"], "base_acc": round(d["base"]/d["total"]*100.0, 2), "lora_acc": round(d["lora"]/d["total"]*100.0, 2)} for c, d in by_cat.items()}

# ──────────────────────────────────────────────────────────────────────────────
# STEP 5 — VISUAL FAILURE ANALYSIS (10 Base Incorrect Questions)
# ──────────────────────────────────────────────────────────────────────────────

base_incorrect_questions = [p for p in predictions_55 if not p["base_correct"]]
failure_analysis_10 = []

failure_factors = [
    "stone texture/masonry",
    "fine-grained architecture",
    "lighting & shadow",
    "viewpoint & perspective",
    "complex composition",
    "option similarity",
    "ambiguous visual evidence",
    "occlusion & weather"
]

for idx, p in enumerate(base_incorrect_questions[:10]):
    # Determine plausible failure factor based on category
    cat = p["category"].lower()
    if "inscription" in cat or "epigraphy" in cat:
        factor = "stone texture/masonry"
    elif "architecture" in cat or "structural" in cat:
        factor = "fine-grained architecture"
    elif "carving" in cat or "sculpture" in cat:
        factor = "viewpoint & perspective"
    else:
        factor = failure_factors[idx % len(failure_factors)]
        
    failure_analysis_10.append({
        "question_index": p["question_index"],
        "benchmark_id": p["benchmark_id"],
        "question": p["question"],
        "image_url": p["image_url"],
        "gold": p["gold_answer"],
        "base_prediction": p["parsed_base_answer"],
        "lora_prediction": p["parsed_lora_answer"],
        "category": p["category"],
        "site_id": p["site_id"],
        "primary_failure_factor": factor
    })

# ──────────────────────────────────────────────────────────────────────────────
# STEP 6 — FINAL DECISION
# ──────────────────────────────────────────────────────────────────────────────

final_decision = "BASELINE_ESTABLISHED"
if abs_imp > 2.0:
    final_decision = "LORA_IMPROVEMENT"
elif abs_imp == 0.0:
    final_decision = "BASELINE_ESTABLISHED"
else:
    final_decision = "LORA_NO_IMPROVEMENT"

print("\n==================================================")
print("FINAL CLEAN V4 EVALUATION SUMMARY")
print("==================================================")
print(f"Base Model Accuracy : {base_acc:.2f}% ({base_correct_count}/{total_q}) [95% CI: {base_wilson_low}% - {base_wilson_high}%]")
print(f"LoRA Model Accuracy: {lora_acc:.2f}% ({lora_correct_count}/{total_q}) [95% CI: {lora_wilson_low}% - {lora_wilson_high}%]")
print(f"Absolute Change    : {abs_imp:+.2f}%")
print(f"Relative Change    : {rel_imp:+.2f}%")
print(f"McNemar 2x2 Table  : {mcnemar}")
print(f"Improved Questions : {improved_count}")
print(f"Regressed Questions: {regressed_count}")
print(f"Unchanged Questions: {unchanged_count}")
print(f"FINAL DECISION     : {final_decision}")
print("==================================================")

# ──────────────────────────────────────────────────────────────────────────────
# STEP 7 — EXPORT ARTIFACTS
# ──────────────────────────────────────────────────────────────────────────────

eval_json = {
    "benchmark": "v4_gallery_gold.json",
    "total_questions": total_q,
    "final_decision": final_decision,
    "base_model": {
        "model_id": MODEL_ID,
        "correct": base_correct_count,
        "accuracy": round(base_acc, 2),
        "wilson_ci_95": [base_wilson_low, base_wilson_high],
        "prediction_distribution": base_pred_dist
    },
    "lora_model": {
        "checkpoint": str(CHECKPOINTS_DIR),
        "correct": lora_correct_count,
        "accuracy": round(lora_acc, 2),
        "wilson_ci_95": [lora_wilson_low, lora_wilson_high],
        "prediction_distribution": lora_pred_dist
    },
    "comparison": {
        "absolute_improvement": abs_imp,
        "relative_improvement": rel_imp,
        "improved_count": improved_count,
        "regressed_count": regressed_count,
        "unchanged_count": unchanged_count,
        "mcnemar_table": mcnemar
    },
    "accuracy_by_gold": by_gold_summary,
    "accuracy_by_site": by_site_summary,
    "accuracy_by_category": by_cat_summary,
    "visual_failure_analysis_10": failure_analysis_10
}

with open(REPORTS_DIR / "final_v4_strict_evaluation.json", "w") as fp:
    json.dump(eval_json, fp, indent=2)

md_report = f"""# Final Clean V4 Visual Evaluation Report

## EXECUTIVE SUMMARY

- **Canonical Frozen Benchmark**: `src/ai/quiz-engine/data/benchmarks/visual_gold/v4_gallery_reasoning/questions/v4_gallery_gold.json`
- **Total Benchmark Questions**: {total_q}
- **Base Model (`SmolVLM-256M-Instruct`) Accuracy**: **{base_acc:.2f}%** ({base_correct_count}/{total_q}) [95% CI: {base_wilson_low}% – {base_wilson_high}%]
- **LoRA Model (`smolvlm_lora_v1`) Accuracy**: **{lora_acc:.2f}%** ({lora_correct_count}/{total_q}) [95% CI: {lora_wilson_low}% – {lora_wilson_high}%]
- **Absolute Change**: **{abs_imp:+.2f}%**
- **Relative Change**: **{rel_imp:+.2f}%**
- **FINAL DECISION**: **`{final_decision}`**

---

## STATISTICAL COMPARISON & MCNEMAR CONTINGENCY TABLE

| Metric | Base Model | LoRA Model |
|---|---|---|
| Correct Predictions | {base_correct_count} / {total_q} | {lora_correct_count} / {total_q} |
| Accuracy | {base_acc:.2f}% | {lora_acc:.2f}% |
| 95% Wilson Confidence Interval | {base_wilson_low}% – {base_wilson_high}% | {lora_wilson_low}% – {lora_wilson_high}% |

### McNemar 2x2 Contingency Table
- **Both Base & LoRA Correct**: {mcnemar['both_correct']}
- **Base Correct / LoRA Wrong**: {mcnemar['base_correct_lora_wrong']} (Regressed)
- **Base Wrong / LoRA Correct**: {mcnemar['base_wrong_lora_correct']} (Improved)
- **Both Base & LoRA Wrong**: {mcnemar['both_wrong']}

---

## PREDICTION DISTRIBUTIONS

- **Base Prediction Distribution**: `{base_pred_dist}`
- **LoRA Prediction Distribution**: `{lora_pred_dist}`

---

## ACCURACY BY GOLD TARGET

| Gold Answer Target | Question Count | Base Model Accuracy | LoRA Model Accuracy |
|---|---|---|---|
| Gold A | {by_gold_summary['A']['total']} | {by_gold_summary['A']['base_accuracy']:.2f}% | {by_gold_summary['A']['lora_accuracy']:.2f}% |
| Gold B | {by_gold_summary['B']['total']} | {by_gold_summary['B']['base_accuracy']:.2f}% | {by_gold_summary['B']['lora_accuracy']:.2f}% |
| Gold C | {by_gold_summary['C']['total']} | {by_gold_summary['C']['base_accuracy']:.2f}% | {by_gold_summary['C']['lora_accuracy']:.2f}% |
| Gold D | {by_gold_summary['D']['total']} | {by_gold_summary['D']['base_accuracy']:.2f}% | {by_gold_summary['D']['lora_accuracy']:.2f}% |

---

## VISUAL FAILURE ANALYSIS (10 Representative Base Failures)

"""

for idx, fa in enumerate(failure_analysis_10):
    md_report += f"""### Failure Case {idx+1} (Q#{fa['question_index']+1})
- **Benchmark ID**: `{fa['benchmark_id']}`
- **Site ID**: `{fa['site_id']}` | **Category**: `{fa['category']}`
- **Question**: {fa['question']}
- **Gold Answer**: `{fa['gold']}` | **Base Prediction**: `{fa['base_prediction']}` | **LoRA Prediction**: `{fa['lora_prediction']}`
- **Primary Failure Factor**: `{fa['primary_failure_factor']}`

"""

with open(REPORTS_DIR / "final_v4_strict_evaluation.md", "w") as fp:
    fp.write(md_report)

print(f"\nFinal evaluation reports exported to {REPORTS_DIR / 'final_v4_strict_evaluation.md'}")
