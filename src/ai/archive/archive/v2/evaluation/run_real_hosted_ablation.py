import os
import json
import time
import datetime
from huggingface_hub import InferenceClient

FINAL_DATASET_PATH = "src/ai/quiz-engine/v2/dataset/pilot_annotations_final.json"
ABLATION_OUT = "src/ai/quiz-engine/v2/evaluation/real_hosted_visual_ablation_results.json"
REPORT_OUT = "src/ai/quiz-engine/v2/reports/real_hosted_visual_ablation_report.md"

MODEL_ID = "Qwen/Qwen2.5-VL-72B-Instruct"
PROVIDER = "hf-inference"

def extract_answer(text):
    if not text:
        return "INVALID"
        
    text = text.strip()
    if len(text) == 1 and text in ["A", "B", "C", "D"]:
        return text
    
    for line in text.split('\n'):
        if "answer is" in line.lower() or "answer:" in line.lower() or "option" in line.lower():
            for char in ["A", "B", "C", "D"]:
                if f" {char}" in line or f": {char}" in line or f"option {char.lower()}" in line.lower():
                    return char
                    
    for char in ["A", "B", "C", "D"]:
        if text.startswith(char) or text.endswith(char):
            return char

    return "INVALID"

def main():
    token = os.environ.get("HF_TOKEN")
    client = InferenceClient(model=MODEL_ID, token=token, headers={"X-Provider": PROVIDER} if PROVIDER != "hf-inference" else None)
    
    print(f"Starting real hosted ablation evaluation using {MODEL_ID} via {PROVIDER}")
    
    with open(FINAL_DATASET_PATH, 'r') as f:
        data = json.load(f)
        
    image_mcqs = [i for i in data if i.get("question_type") == "IMAGE_MCQ"]
    total = len(image_mcqs)
    print(f"Total IMAGE_MCQs to evaluate: {total}")
    
    results = []
    
    metrics = {
        "image_correct": 0,
        "text_only_correct": 0,
        "image_invalid": 0,
        "text_only_invalid": 0,
        "STRONG": 0,
        "NONE": 0,
        "INCONCLUSIVE": 0,
    }

    for idx, item in enumerate(image_mcqs):
        qid = item["annotation_id"]
        gold = item["correct_option"]
        url = item["image_url"]
        
        print(f"Evaluating [{idx+1}/{total}] {qid}")
        
        prompt_text = "Answer the following multiple-choice question.\nReturn ONLY A, B, C, or D.\n\n"
        prompt_text += f"Question:\n{item['question']}\n\n"
        prompt_text += f"A. {item['options'][0]}\n"
        prompt_text += f"B. {item['options'][1]}\n"
        prompt_text += f"C. {item['options'][2]}\n"
        prompt_text += f"D. {item['options'][3]}"
            
        # --- MODE A (Image Condition) ---
        start_a = time.time()
        try:
            res_a = client.chat.completions.create(
                messages=[
                    {
                        "role": "user",
                        "content": [
                            {"type": "image_url", "image_url": {"url": url}},
                            {"type": "text", "text": prompt_text}
                        ]
                    }
                ],
                max_tokens=20,
                temperature=0.01  # Deterministic as possible
            )
            end_a = time.time()
            raw_a = res_a.choices[0].message.content
            pred_a = extract_answer(raw_a)
            lat_a = int((end_a - start_a) * 1000)
        except Exception as e:
            print(f"Mode A Error: {e}")
            raw_a = f"ERROR: {e}"
            pred_a = "ERROR"
            lat_a = 0
            
        # --- MODE B (Text-Only Condition) ---
        start_b = time.time()
        try:
            res_b = client.chat.completions.create(
                messages=[
                    {
                        "role": "user",
                        "content": [
                            {"type": "text", "text": prompt_text}
                        ]
                    }
                ],
                max_tokens=20,
                temperature=0.01
            )
            end_b = time.time()
            raw_b = res_b.choices[0].message.content
            pred_b = extract_answer(raw_b)
            lat_b = int((end_b - start_b) * 1000)
        except Exception as e:
            print(f"Mode B Error: {e}")
            raw_b = f"ERROR: {e}"
            pred_b = "ERROR"
            lat_b = 0
        
        # --- Classification ---
        img_corr = (pred_a == gold)
        txt_corr = (pred_b == gold)
        
        img_inv = (pred_a in ["INVALID", "ERROR"])
        txt_inv = (pred_b in ["INVALID", "ERROR"])
        
        if img_corr and not txt_corr:
            contrib = "STRONG"
        elif img_corr and txt_corr:
            contrib = "NONE"
        else:
            contrib = "INCONCLUSIVE"
            
        metrics["image_correct"] += 1 if img_corr else 0
        metrics["text_only_correct"] += 1 if txt_corr else 0
        metrics["image_invalid"] += 1 if img_inv else 0
        metrics["text_only_invalid"] += 1 if txt_inv else 0
        metrics[contrib] += 1
        
        results.append({
            "annotation_id": qid,
            "model_id": MODEL_ID,
            "provider": PROVIDER,
            "gold": gold,
            "image_raw_output": raw_a,
            "text_only_raw_output": raw_b,
            "image_prediction": pred_a,
            "text_only_prediction": pred_b,
            "image_correct": img_corr,
            "text_only_correct": txt_corr,
            "image_invalid": img_inv,
            "text_only_invalid": txt_inv,
            "image_latency_ms": lat_a,
            "text_only_latency_ms": lat_b,
            "visual_contribution": contrib
        })
        
        print(f"  Mode A (Img): {pred_a} | Mode B (Txt): {pred_b} | Gold: {gold} -> {contrib}")
        
        # Add small delay to respect HF serverless rate limits
        time.sleep(2)

    with open(ABLATION_OUT, "w") as f:
        json.dump(results, f, indent=2)
        
    img_acc = metrics["image_correct"] / total if total else 0
    txt_acc = metrics["text_only_correct"] / total if total else 0
    img_inv_rate = metrics["image_invalid"] / total if total else 0
    txt_inv_rate = metrics["text_only_invalid"] / total if total else 0
    vis_gain = img_acc - txt_acc
    strict_dep = metrics["STRONG"] / total if total else 0
    
    status = "PASS" if strict_dep > 0 else "FAILED"
    
    with open(REPORT_OUT, "w") as f:
        f.write("# Real Hosted Visual Ablation Report\n\n")
        f.write(f"**REAL_ABLATION_STATUS** = {status}\n\n")
        f.write(f"- **MODEL** = {MODEL_ID}\n")
        f.write(f"- **PROVIDER** = {PROVIDER}\n")
        f.write(f"- **TOTAL** = {total}\n")
        f.write(f"- **IMAGE_ACCURACY** = {img_acc * 100:.1f}%\n")
        f.write(f"- **TEXT_ONLY_ACCURACY** = {txt_acc * 100:.1f}%\n")
        f.write(f"- **VISUAL_GAIN** = {vis_gain * 100:.1f} percentage points\n")
        f.write(f"- **STRICT_VISUAL_CONTRIBUTION** = {strict_dep * 100:.1f}%\n")
        f.write(f"- **INVALID_RATE** = {max(img_inv_rate, txt_inv_rate) * 100:.1f}%\n")
        
        f.write(f"- **STRONG_VISUAL_CASES** = {metrics['STRONG']}\n")
        f.write(f"- **NONE_VISUAL_CASES** = {metrics['NONE']}\n")
        f.write(f"- **INCONCLUSIVE** = {metrics['INCONCLUSIVE']}\n")
        
        f.write("\n## Reproducibility\n")
        f.write("- **Endpoint**: chat.completions\n")
        f.write("- **Temperature**: 0.01\n")
        f.write("- **Max Tokens**: 20\n")
        f.write(f"- **Date**: {datetime.datetime.now().isoformat()}\n")
        
        f.write("\n## Question-Level Outcomes\n\n")
        f.write("| ID | Gold | Image Prediction | Text-only Prediction | Image Correct | Text-only Correct | Visual Contribution |\n")
        f.write("|---|---|---|---|---|---|---|\n")
        for r in results:
            f.write(f"| {r['annotation_id']} | {r['gold']} | {r['image_prediction']} | {r['text_only_prediction']} | {r['image_correct']} | {r['text_only_correct']} | {r['visual_contribution']} |\n")
            
    print("Hosted ablation evaluation complete.")

if __name__ == "__main__":
    main()
