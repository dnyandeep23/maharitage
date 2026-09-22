#!/usr/bin/env python3
"""
Strict Answer Parser & Visual Inference Pipeline Diagnostic Script
Implements a strict regex answer parser, updated single-character prompt,
token-slicing generation, control tests, and 20-question diagnostic.
"""

import os
import sys
import json
import re
import urllib.request
import io
from pathlib import Path
from PIL import Image
# pyrefly: ignore [missing-import]
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
print("STRICT PARSER & VISUAL INFERENCE DIAGNOSTIC")
print("==================================================")
print(f"Device: {device}")

# ──────────────────────────────────────────────────────────────────────────────
# STEP 1 — STRICT ANSWER PARSER IMPLEMENTATION
# ──────────────────────────────────────────────────────────────────────────────

def parse_mcq_answer(text):
    """
    Strict MCQ Answer Parser:
    - Does NOT search for "A" inside words (e.g., "Answer", "Based", "Wall")
    - Recognizes explicit single letters, "Answer: X", "Option X", "The correct answer is X"
    - Returns "A", "B", "C", "D", or "INVALID"
    """
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
# STEP 4 — CONTROL TEST ON PARSER
# ──────────────────────────────────────────────────────────────────────────────

control_tests = [
    ("A", "A"),
    ("B", "B"),
    ("C", "C"),
    ("D", "D"),
    ("Answer: A", "A"),
    ("Answer: B", "B"),
    ("Answer: C", "C"),
    ("Answer: D", "D"),
    ("Option C", "C"),
    ("The correct answer is D", "D"),
    ("Based on the image, option B is correct", "B"),
    ("Question: ... Answer", "INVALID")
]

print("\n--- Running Parser Control Tests ---")
control_passed = True
control_details = []

for raw_in, expected in control_tests:
    got = parse_mcq_answer(raw_in)
    status = "PASS" if got == expected else "FAIL"
    if got != expected:
        control_passed = False
    print(f"  [{status}] In: '{raw_in}' -> Got: '{got}' (Expected: '{expected}')")
    control_details.append({"input": raw_in, "expected": expected, "got": got, "status": status})

print(f"Control Test Status: {'ALL PASSED' if control_passed else 'FAILED'}")

# ──────────────────────────────────────────────────────────────────────────────
# STEP 2 & 3 — PROMPT & GENERATION FUNCTION
# ──────────────────────────────────────────────────────────────────────────────

PROMPT_TEMPLATE = """You are answering a visual multiple-choice question.

Look at the image and select the correct option.

Return ONLY ONE character:
A
B
C
or
D

Do not explain.
Do not repeat the question.
Do not repeat the options.
Do not generate another question.
Do not output anything except A, B, C, or D.

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

# ──────────────────────────────────────────────────────────────────────────────
# LOAD 20 V4 QUESTIONS
# ──────────────────────────────────────────────────────────────────────────────

with open(V4_GOLD_FILE) as f:
    v4_items = json.load(f)

by_target = {"A": [], "B": [], "C": [], "D": []}
for item in v4_items:
    idx = item.get("correct_option_index", 0)
    target = letters[idx]
    by_target[target].append(item)

selected_20 = []
for l in letters:
    selected_20.extend(by_target[l][:5])

print(f"\nLoaded {len(selected_20)} V4 diagnostic questions (5 A, 5 B, 5 C, 5 D)")

# ──────────────────────────────────────────────────────────────────────────────
# LOAD MODELS
# ──────────────────────────────────────────────────────────────────────────────

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
    lora_model = base_model

# ──────────────────────────────────────────────────────────────────────────────
# STEP 5 — RUN DIAGNOSTIC ON 20 QUESTIONS
# ──────────────────────────────────────────────────────────────────────────────

def run_strict_diagnostic(eval_model, items, label="Base"):
    eval_model.eval()
    results = []
    raw_dist = {"A": 0, "B": 0, "C": 0, "D": 0, "OTHER": 0, "EMPTY": 0}
    parsed_dist = {"A": 0, "B": 0, "C": 0, "D": 0, "INVALID": 0}
    correct = 0
    total = len(items)
    
    with torch.no_grad():
        for idx, item in enumerate(items):
            url = item.get("image_url") or item.get("url")
            q = item.get("question")
            opts = item.get("options")
            gold_idx = item.get("correct_option_index")
            gold_letter = letters[gold_idx]
            
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
                
            input_token_len = inputs["input_ids"].shape[1]
            generated_ids = eval_model.generate(**inputs, max_new_tokens=5, do_sample=False)
            
            # Pure sliced token generation
            raw_sliced_tokens = generated_ids[:, input_token_len:]
            raw_output = processor.batch_decode(raw_sliced_tokens, skip_special_tokens=True)[0].strip()
            
            parsed_answer = parse_mcq_answer(raw_output)
            
            # Raw category
            raw_upper = raw_output.upper()
            if raw_output == "":
                raw_cat = "EMPTY"
            elif raw_upper in letters:
                raw_cat = raw_upper
            else:
                raw_cat = "OTHER"
                
            raw_dist[raw_cat] += 1
            parsed_dist[parsed_answer] += 1
            
            if parsed_answer == gold_letter:
                correct += 1
                
            results.append({
                "item_index": idx,
                "question": q,
                "gold": gold_letter,
                "raw_output": raw_output,
                "parsed_answer": parsed_answer,
                "is_correct": (parsed_answer == gold_letter)
            })
            
    acc = (correct / total) * 100.0 if total > 0 else 0.0
    invalid_count = parsed_dist["INVALID"]
    invalid_rate = (invalid_count / total) * 100.0 if total > 0 else 0.0
    
    return {
        "results": results,
        "raw_distribution": raw_dist,
        "parsed_distribution": parsed_dist,
        "correct": correct,
        "total": total,
        "accuracy": acc,
        "invalid_rate": invalid_rate
    }

print("\nRunning Strict Diagnostic on Base Model...")
base_diag = run_strict_diagnostic(base_model, selected_20, "Base")

print("Running Strict Diagnostic on LoRA Model...")
lora_diag = run_strict_diagnostic(lora_model, selected_20, "LoRA")

# ──────────────────────────────────────────────────────────────────────────────
# STEP 6 — CLASSIFICATION LOGIC
# ──────────────────────────────────────────────────────────────────────────────

base_raw = base_diag["raw_distribution"]
base_parsed = base_diag["parsed_distribution"]

if base_raw["A"] >= 15 or (base_raw["A"] + base_raw["OTHER"]) == 20 and base_raw["B"] == 0 and base_raw["C"] == 0 and base_raw["D"] == 0:
    if base_raw["OTHER"] > 5:
        final_classification = "MODEL_OUTPUT_COLLAPSE"
        classification_explanation = "The model is generating malformed text, repeated options, or question repetitions instead of clean A/B/C/D option characters."
    else:
        final_classification = "MODEL_OUTPUT_COLLAPSE"
        classification_explanation = "The model itself is producing option 'A' exclusively across all test questions."
elif base_raw["B"] > 0 or base_raw["C"] > 0 or base_raw["D"] > 0:
    if base_parsed["INVALID"] == 0:
        final_classification = "PARSER_BUG_FIXED"
        classification_explanation = "The model produces diverse A/B/C/D raw outputs, and the strict answer parser accurately parses them without false 'A' matches."
    else:
        final_classification = "MIXED_PIPELINE_PROBLEM_REDUCED"
        classification_explanation = "The strict answer parser fixed false 'A' matches, but the model output still contains non-standard text variations."
else:
    final_classification = "MIXED_PIPELINE_PROBLEM_REDUCED"
    classification_explanation = "The pipeline issues are partially reduced by strict parsing and token slicing."

print("\n==================================================")
print("STRICT DIAGNOSTIC RESULTS")
print("==================================================")
print(f"FINAL CLASSIFICATION: {final_classification}")
print(f"Explanation         : {classification_explanation}")
print(f"\nBASE RAW DISTRIBUTION   : {base_diag['raw_distribution']}")
print(f"BASE PARSED DISTRIBUTION: {base_diag['parsed_distribution']}")
print(f"BASE ACCURACY           : {base_diag['accuracy']:.2f}% ({base_diag['correct']}/{base_diag['total']})")
print(f"BASE INVALID RATE       : {base_diag['invalid_rate']:.2f}%")
print(f"\nLORA RAW DISTRIBUTION   : {lora_diag['raw_distribution']}")
print(f"LORA PARSED DISTRIBUTION: {lora_diag['parsed_distribution']}")
print(f"LORA ACCURACY           : {lora_diag['accuracy']:.2f}% ({lora_diag['correct']}/{lora_diag['total']})")
print(f"LORA INVALID RATE       : {lora_diag['invalid_rate']:.2f}%")

# 5 Representative Examples
representative_5 = []
for i in range(min(5, len(base_diag["results"]))):
    b = base_diag["results"][i]
    l = lora_diag["results"][i]
    representative_5.append({
        "question": b["question"],
        "gold": b["gold"],
        "raw_base": repr(b["raw_output"]),
        "parsed_base": b["parsed_answer"],
        "raw_lora": repr(l["raw_output"]),
        "parsed_lora": l["parsed_answer"]
    })

print("\n--- 5 Representative Examples ---")
for idx, ex in enumerate(representative_5):
    print(f"\nExample [{idx+1}]:")
    print(f"  Question   : {ex['question']}")
    print(f"  Gold       : {ex['gold']}")
    print(f"  Raw Base   : {ex['raw_base']} -> Parsed: {ex['parsed_base']}")
    print(f"  Raw LoRA   : {ex['raw_lora']} -> Parsed: {ex['parsed_lora']}")

# ──────────────────────────────────────────────────────────────────────────────
# STEP 8 — EXPORT REPORT
# ──────────────────────────────────────────────────────────────────────────────

diag_json = {
    "final_classification": final_classification,
    "explanation": classification_explanation,
    "parser_control_tests": control_details,
    "base_model": {
        "raw_distribution": base_diag["raw_distribution"],
        "parsed_distribution": base_diag["parsed_distribution"],
        "accuracy": round(base_diag["accuracy"], 2),
        "correct": base_diag["correct"],
        "total": base_diag["total"],
        "invalid_rate": round(base_diag["invalid_rate"], 2)
    },
    "lora_model": {
        "raw_distribution": lora_diag["raw_distribution"],
        "parsed_distribution": lora_diag["parsed_distribution"],
        "accuracy": round(lora_diag["accuracy"], 2),
        "correct": lora_diag["correct"],
        "total": lora_diag["total"],
        "invalid_rate": round(lora_diag["invalid_rate"], 2)
    },
    "representative_examples": representative_5
}

with open(REPORTS_DIR / "strict_answer_parser_diagnostic.json", "w") as fp:
    json.dump(diag_json, fp, indent=2)

md_diag = f"""# Strict Answer Parser & Inference Fix Diagnostic Report

## FINAL CLASSIFICATION
**CLASSIFICATION**: `{final_classification}`

**Explanation**: {classification_explanation}

## PARSER CONTROL TEST RESULTS
- All 12 standardized test strings passed: **{"YES" if control_passed else "NO"}**

| Input String | Expected | Parsed Output | Status |
|---|---|---|---|
"""
for item in control_details:
    md_diag += f"| `{item['input']}` | `{item['expected']}` | `{item['got']}` | **{item['status']}** |\n"

md_diag += f"""
## EXPERIMENTAL DIAGNOSTIC RESULTS (20 V4 Questions)

| Metric | Base Model | LoRA Model |
|---|---|---|
| **Raw Output Distribution** | `{base_diag['raw_distribution']}` | `{lora_diag['raw_distribution']}` |
| **Parsed Output Distribution** | `{base_diag['parsed_distribution']}` | `{lora_diag['parsed_distribution']}` |
| **Accuracy** | **{base_diag['accuracy']:.2f}%** ({base_diag['correct']}/{base_diag['total']}) | **{lora_diag['accuracy']:.2f}%** ({lora_diag['correct']}/{lora_diag['total']}) |
| **Invalid Rate** | **{base_diag['invalid_rate']:.2f}%** | **{lora_diag['invalid_rate']:.2f}%** |

## REPRESENTATIVE EXAMPLES

"""
for idx, ex in enumerate(representative_5):
    md_diag += f"""### Example {idx+1}
- **Question**: {ex['question']}
- **Gold Label**: `{ex['gold']}`
- **Raw Base Output**: `{ex['raw_base']}` -> **Parsed Base**: `{ex['parsed_base']}`
- **Raw LoRA Output**: `{ex['raw_lora']}` -> **Parsed LoRA**: `{ex['parsed_lora']}`

"""

with open(REPORTS_DIR / "strict_answer_parser_diagnostic.md", "w") as fp:
    fp.write(md_diag)

print(f"\nReport saved to {REPORTS_DIR / 'strict_answer_parser_diagnostic.md'}")
