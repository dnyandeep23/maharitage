#!/usr/bin/env python3
"""
Final Raw-Inference Diagnostic Script
Captures exact raw model outputs (sliced after prompt tokens) for 20 representative V4 questions,
audits parser behavior against full vs sliced outputs, tests format handling, and classifies root cause.
"""

import os
import sys
import json
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
print("FINAL RAW-INFERENCE DIAGNOSTIC")
print("==================================================")
print(f"Device: {device}")

# ──────────────────────────────────────────────────────────────────────────────
# STEP 1 — LOAD & SELECT 20 REPRESENTATIVE V4 QUESTIONS
# ──────────────────────────────────────────────────────────────────────────────

with open(V4_GOLD_FILE) as f:
    v4_items = json.load(f)

# Group by gold target
by_target = {"A": [], "B": [], "C": [], "D": []}
for item in v4_items:
    idx = item.get("correct_option_index", 0)
    target = letters[idx]
    by_target[target].append(item)

# Pick 5 of each for balanced 20 questions
selected_20 = []
for l in letters:
    selected_20.extend(by_target[l][:5])

print(f"Selected {len(selected_20)} V4 questions (5 A, 5 B, 5 C, 5 D)")

# ──────────────────────────────────────────────────────────────────────────────
# STEP 3 & 4 — TEST PARSER BEHAVIOR ON STANDARDIZED FORMATS
# ──────────────────────────────────────────────────────────────────────────────

def current_parser_legacy(full_text):
    """The legacy parser logic used previously in evaluation scripts."""
    pred_letter = "A" # or None
    for l in letters:
        if l in full_text.upper():
            return l
    return "A"

def current_parser_strict(text):
    """Parser checking letter presence."""
    for l in letters:
        if l in text.upper():
            return l
    return "UNKNOWN"

test_formats = [
    "A",
    "B",
    "C",
    "D",
    "Answer: A",
    "The correct answer is B",
    "Option C",
    "The answer is D because...",
    "Based on the image, option B is correct."
]

print("\n--- Testing Parser on Standard Formats ---")
parser_test_results = {}
for fmt in test_formats:
    parsed = current_parser_strict(fmt)
    parser_test_results[fmt] = parsed
    print(f"  Format: '{fmt}' -> Parsed: '{parsed}'")

# ──────────────────────────────────────────────────────────────────────────────
# STEP 2, 5, 6 — RUN BASE & LORA RAW INFERENCE
# ──────────────────────────────────────────────────────────────────────────────

def load_image_from_url(url):
    try:
        req = urllib.request.Request(url, headers={'User-Agent': 'Mozilla/5.0'})
        with urllib.request.urlopen(req, timeout=10) as response:
            return Image.open(io.BytesIO(response.read())).convert('RGB')
    except Exception as e:
        return Image.new('RGB', (224, 224), color='grey')

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

def run_diagnostic_on_items(eval_model, items, label="Base"):
    eval_model.eval()
    results = []
    raw_dist = {"A": 0, "B": 0, "C": 0, "D": 0, "OTHER": 0, "EMPTY": 0}
    full_parsed_dist = {"A": 0, "B": 0, "C": 0, "D": 0, "UNKNOWN": 0}
    sliced_parsed_dist = {"A": 0, "B": 0, "C": 0, "D": 0, "UNKNOWN": 0}
    
    with torch.no_grad():
        for idx, item in enumerate(items):
            url = item.get("image_url") or item.get("url")
            q = item.get("question")
            opts = item.get("options")
            gold_idx = item.get("correct_option_index")
            gold_letter = letters[gold_idx]
            
            image = load_image_from_url(url)
            prompt = f"<image>\nQuestion: {q}\nOptions:\nA. {opts[0]}\nB. {opts[1]}\nC. {opts[2]}\nD. {opts[3]}\nAnswer:"
            
            inputs = processor(text=prompt, images=image, return_tensors="pt", do_image_splitting=False).to(device)
            if device.type != "cpu" and "pixel_values" in inputs:
                inputs["pixel_values"] = inputs["pixel_values"].to(torch.float16)
                
            input_token_len = inputs["input_ids"].shape[1]
            generated_ids = eval_model.generate(**inputs, max_new_tokens=15, do_sample=False)
            
            # 1. Full decoded text (includes prompt tokens)
            full_decoded = processor.batch_decode(generated_ids, skip_special_tokens=True)[0]
            
            # 2. Sliced raw generated text (ONLY new tokens)
            raw_sliced_tokens = generated_ids[:, input_token_len:]
            raw_generated_text = processor.batch_decode(raw_sliced_tokens, skip_special_tokens=True)[0].strip()
            
            # Parsed from full prompt vs sliced
            full_parsed = current_parser_legacy(full_decoded) # This checks full_decoded string
            sliced_parsed = current_parser_strict(raw_generated_text) # This checks raw_generated_text
            
            # Categorize raw generated string
            raw_upper = raw_generated_text.upper()
            if raw_generated_text == "":
                raw_category = "EMPTY"
            elif raw_upper in letters:
                raw_category = raw_upper
            elif any(f"ANSWER: {l}" in raw_upper or f"OPTION {l}" in raw_upper or f"CHOICE {l}" in raw_upper for l in letters):
                for l in letters:
                    if l in raw_upper:
                        raw_category = l
                        break
            else:
                raw_category = "OTHER"
                
            raw_dist[raw_category] += 1
            full_parsed_dist[full_parsed] += 1
            sliced_parsed_dist[sliced_parsed] += 1
            
            results.append({
                "item_index": idx,
                "question": q,
                "gold": gold_letter,
                "full_decoded": full_decoded,
                "raw_generated_text": raw_generated_text,
                "full_parsed": full_parsed,
                "sliced_parsed": sliced_parsed,
                "raw_category": raw_category
            })
            
    return results, raw_dist, full_parsed_dist, sliced_parsed_dist

print("\nRunning Raw Diagnostic on Base Model...")
base_results, base_raw_dist, base_full_parsed_dist, base_sliced_parsed_dist = run_diagnostic_on_items(base_model, selected_20, "Base")

print("Running Raw Diagnostic on LoRA Model...")
lora_results, lora_raw_dist, lora_full_parsed_dist, lora_sliced_parsed_dist = run_diagnostic_on_items(lora_model, selected_20, "LoRA")

# ──────────────────────────────────────────────────────────────────────────────
# STEP 7 & 8 — GENERATION CONFIG & HIDDEN DEFAULTS AUDIT
# ──────────────────────────────────────────────────────────────────────────────

config_audit = {
    "model_id": MODEL_ID,
    "model_class": base_model.__class__.__name__,
    "processor_class": processor.__class__.__name__,
    "do_image_splitting": False,
    "max_new_tokens": 15,
    "do_sample": False,
    "prompt_structure": "<image>\\nQuestion: ...\\nOptions:\\nA. ...\\nB. ...\\nC. ...\\nD. ...\\nAnswer:",
    "prompt_contains_option_A": True,
    "bug_mechanism": "processor.batch_decode(generated_ids) decodes prompt tokens containing 'Options:\\nA.'. Checking 'if \"A\" in full_decoded' matches 'A.' inside the prompt string for 100% of questions."
}

# ──────────────────────────────────────────────────────────────────────────────
# STEP 10 — FINAL CLASSIFICATION & EXAMPLES
# ──────────────────────────────────────────────────────────────────────────────

# Classification check
if base_full_parsed_dist["A"] == 20 and base_sliced_parsed_dist["A"] != 20:
    classification = "PARSER_BUG"
    explanation = "The evaluation pipeline passed the full decoded string (which included the input prompt containing 'Options:\\nA. ...') to the answer parser. The parser searched for 'A' in the full string and matched the prompt's option text 'A.' for 100% of questions, overriding the model's actual generation."
elif base_raw_dist["EMPTY"] > 10:
    classification = "MODEL_OUTPUT_COLLAPSE"
    explanation = "The model is generating empty tokens or whitespace."
elif base_raw_dist["A"] == 20:
    classification = "MODEL_OUTPUT_COLLAPSE"
    explanation = "The model itself is generating 'A' for all questions."
else:
    classification = "MIXED_PIPELINE_PROBLEM"
    explanation = f"Combination of prompt decoding inclusion and raw output format variations. Full parsed: {base_full_parsed_dist}, Sliced parsed: {base_sliced_parsed_dist}, Raw sliced: {base_raw_dist}"

print("\n==================================================")
print("RAW-INFERENCE DIAGNOSTIC RESULTS")
print("==================================================")
print(f"CLASSIFICATION: {classification}")
print(f"Explanation   : {explanation}")
print(f"\nBASE RAW DISTRIBUTION (Sliced tokens)   : {base_raw_dist}")
print(f"LORA RAW DISTRIBUTION (Sliced tokens)   : {lora_raw_dist}")
print(f"BASE FULL PARSED (Legacy full string)   : {base_full_parsed_dist}")
print(f"LORA FULL PARSED (Legacy full string)   : {lora_full_parsed_dist}")
print(f"BASE SLICED PARSED (Pure generated)     : {base_sliced_parsed_dist}")
print(f"LORA SLICED PARSED (Pure generated)     : {lora_sliced_parsed_dist}")

# 5 Representative Examples
representative_5 = []
for i in range(min(5, len(base_results))):
    b = base_results[i]
    l = lora_results[i]
    representative_5.append({
        "question": b["question"],
        "gold": b["gold"],
        "raw_base_output": repr(b["raw_generated_text"]),
        "parsed_base_legacy": b["full_parsed"],
        "parsed_base_sliced": b["sliced_parsed"],
        "raw_lora_output": repr(l["raw_generated_text"]),
        "parsed_lora_legacy": l["full_parsed"],
        "parsed_lora_sliced": l["sliced_parsed"]
    })

print("\n--- 5 Representative Examples ---")
for idx, ex in enumerate(representative_5):
    print(f"\nExample [{idx+1}]:")
    print(f"  Question   : {ex['question']}")
    print(f"  Gold       : {ex['gold']}")
    print(f"  Raw Base   : {ex['raw_base_output']}")
    print(f"  Parsed Base: {ex['parsed_base_legacy']} (Full) vs {ex['parsed_base_sliced']} (Sliced)")
    print(f"  Raw LoRA   : {ex['raw_lora_output']}")
    print(f"  Parsed LoRA: {ex['parsed_lora_legacy']} (Full) vs {ex['parsed_lora_sliced']} (Sliced)")

# ──────────────────────────────────────────────────────────────────────────────
# EXPORT REPORTS
# ──────────────────────────────────────────────────────────────────────────────

diag_json = {
    "final_classification": classification,
    "explanation": explanation,
    "base_raw_distribution": base_raw_dist,
    "lora_raw_distribution": lora_raw_dist,
    "base_full_parsed_distribution": base_full_parsed_dist,
    "lora_full_parsed_distribution": lora_full_parsed_dist,
    "base_sliced_parsed_distribution": base_sliced_parsed_dist,
    "lora_sliced_parsed_distribution": lora_sliced_parsed_dist,
    "config_audit": config_audit,
    "representative_examples": representative_5
}

with open(REPORTS_DIR / "raw_inference_diagnostic_report.json", "w") as fp:
    json.dump(diag_json, fp, indent=2)

md_diag = f"""# Final Raw-Inference Diagnostic Report

## FINAL CLASSIFICATION
**CLASSIFICATION**: `{classification}`

**Explanation**: {explanation}

## GENERATION DISTRIBUTIONS

- **BASE_RAW_DISTRIBUTION (Sliced Tokens Only)**: `{base_raw_dist}`
- **LORA_RAW_DISTRIBUTION (Sliced Tokens Only)**: `{lora_raw_dist}`
- **BASE_FULL_PARSED_DISTRIBUTION (Legacy Full Sequence)**: `{base_full_parsed_dist}`
- **LORA_FULL_PARSED_DISTRIBUTION (Legacy Full Sequence)**: `{lora_full_parsed_dist}`
- **BASE_SLICED_PARSED_DISTRIBUTION (Pure Sliced Sequence)**: `{base_sliced_parsed_dist}`
- **LORA_SLICED_PARSED_DISTRIBUTION (Pure Sliced Sequence)**: `{lora_sliced_parsed_dist}`

## ROOT CAUSE DIAGNOSIS

1. **The Prompt Ingestion Issue**:
   - `model.generate()` returns token IDs representing the **entire sequence** (input prompt + newly generated tokens).
   - In previous evaluation scripts, `processor.batch_decode(generated_ids)` decoded the full token sequence including the prompt:
     `"Question: ... \\nOptions:\\nA. Option text... \\nB. ... \\nAnswer:"`
   - The legacy parser searched for letter `"A"` in `full_decoded.upper()`. Because `"A."` is physically present in the prompt string on line `Options:\\nA.`, `if "A" in full_decoded.upper()` evaluated to `True` for **100% of questions**.
   - This caused the evaluator to record prediction `'A'` for all 55 V4 items and all 50 Hard Diagnostic items.

2. **Pure Raw Model Output Behavior**:
   - When generated IDs are properly sliced (`generated_ids[:, input_ids.shape[1]:]`), the raw generated text contains the model's true outputs.

## REPRESENTATIVE EXAMPLES

"""

for idx, ex in enumerate(representative_5):
    md_diag += f"""### Example {idx+1}
- **Question**: {ex['question']}
- **Gold Label**: `{ex['gold']}`
- **Raw Base Output**: `{ex['raw_base_output']}`
- **Parsed Base (Legacy Full)**: `{ex['parsed_base_legacy']}` | **Parsed Base (Sliced)**: `{ex['parsed_base_sliced']}`
- **Raw LoRA Output**: `{ex['raw_lora_output']}`
- **Parsed LoRA (Legacy Full)**: `{ex['parsed_lora_legacy']}` | **Parsed LoRA (Sliced)**: `{ex['parsed_lora_sliced']}`

"""

with open(REPORTS_DIR / "raw_inference_diagnostic_report.md", "w") as fp:
    fp.write(md_diag)

print(f"\nDiagnostic reports saved to {REPORTS_DIR / 'raw_inference_diagnostic_report.md'}")
