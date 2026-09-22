import json
import os
import time
import urllib.request
from io import BytesIO
from PIL import Image
import torch
from transformers import AutoProcessor, Qwen2_5_VLForConditionalGeneration
from qwen_vl_utils import process_vision_info

FINAL_DATASET_PATH = "src/ai/quiz-engine/v2/dataset/pilot_annotations_final.json"
ABLATION_OUT = "src/ai/quiz-engine/v2/evaluation/real_visual_ablation_results.json"
REPORT_OUT = "src/ai/quiz-engine/v2/reports/real_visual_ablation_report.md"

MODEL_ID = "Qwen/Qwen2.5-VL-3B-Instruct"

def get_device():
    if torch.backends.mps.is_available():
        return "mps"
    elif torch.cuda.is_available():
        return "cuda"
    return "cpu"

def download_image(url):
    try:
        req = urllib.request.Request(url, headers={'User-Agent': 'Mozilla/5.0'})
        with urllib.request.urlopen(req, timeout=10) as response:
            return Image.open(BytesIO(response.read())).convert("RGB")
    except Exception as e:
        print(f"Failed to download image {url}: {e}")
        return None

def extract_answer(text):
    # Strict parsing logic
    text = text.strip()
    if len(text) == 1 and text in ["A", "B", "C", "D"]:
        return text
    
    # Try to extract from common formats like "Answer: B" or "Option B"
    for line in text.split('\n'):
        if "answer is" in line.lower() or "answer:" in line.lower() or "option" in line.lower():
            for char in ["A", "B", "C", "D"]:
                if f" {char}" in line or f": {char}" in line or f"option {char.lower()}" in line.lower():
                    return char
                    
    # Look for a single isolated A, B, C, D at the end or beginning
    for char in ["A", "B", "C", "D"]:
        if text.startswith(char) or text.endswith(char):
            return char

    return "INVALID"

def main():
    device = get_device()
    print(f"Loading {MODEL_ID} on {device}...")
    
    try:
        model = Qwen2_5_VLForConditionalGeneration.from_pretrained(
            MODEL_ID, 
            torch_dtype=torch.float16 if device != "cpu" else torch.float32,
            device_map=device
        )
        processor = AutoProcessor.from_pretrained(MODEL_ID)
    except Exception as e:
        print(f"Error loading model: {e}")
        return
        
    print("Model loaded successfully.")
    
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
        "KEEP_VISUAL_EVIDENCE": 0,
        "REVIEW": 0
    }
    
    question_outcomes = []

    for idx, item in enumerate(image_mcqs):
        qid = item["annotation_id"]
        gold = item["correct_option"]
        url = item["image_url"]
        
        print(f"Evaluating [{idx+1}/{total}] {qid}")
        
        # Format text prompt
        prompt_text = "Answer the following multiple-choice question. Return only A, B, C, or D.\n\n"
        prompt_text += f"Question:\n{item['question']}\n\n"
        for i, opt in enumerate(item.get("options", [])):
            prompt_text += f"{['A','B','C','D'][i]}. {opt}\n"
            
        img = download_image(url)
        if not img:
            print(f"Skipping {qid} due to image load failure.")
            # Record explicit error without fabricating
            results.append({
                "annotation_id": qid,
                "model_id": MODEL_ID,
                "gold": gold,
                "image_prediction": "ERROR",
                "text_only_prediction": "ERROR",
                "image_correct": False,
                "text_only_correct": False,
                "image_invalid": True,
                "text_only_invalid": True,
                "visual_contribution": "INCONCLUSIVE",
                "image_latency_ms": 0,
                "text_only_latency_ms": 0
            })
            metrics["image_invalid"] += 1
            metrics["text_only_invalid"] += 1
            metrics["INCONCLUSIVE"] += 1
            metrics["REVIEW"] += 1
            question_outcomes.append((qid, "REVIEW (Image Error)"))
            continue
            
        # --- MODE A (Image Condition) ---
        messages_a = [
            {
                "role": "user",
                "content": [
                    {"type": "image", "image": img},
                    {"type": "text", "text": prompt_text},
                ],
            }
        ]
        text_a = processor.apply_chat_template(messages_a, tokenize=False, add_generation_prompt=True)
        image_inputs, video_inputs = process_vision_info(messages_a)
        inputs_a = processor(text=[text_a], images=image_inputs, videos=video_inputs, padding=True, return_tensors="pt")
        inputs_a = inputs_a.to(device)

        start_a = time.time()
        with torch.no_grad():
            outputs_a = model.generate(**inputs_a, max_new_tokens=20, do_sample=False, temperature=0.0)
        end_a = time.time()
        
        generated_ids_a = outputs_a[0][len(inputs_a.input_ids[0]):]
        out_text_a = processor.decode(generated_ids_a, skip_special_tokens=True)
        pred_a = extract_answer(out_text_a)
        
        # --- MODE B (Text-Only Condition) ---
        messages_b = [
            {
                "role": "user",
                "content": [
                    {"type": "text", "text": prompt_text},
                ],
            }
        ]
        text_b = processor.apply_chat_template(messages_b, tokenize=False, add_generation_prompt=True)
        inputs_b = processor(text=[text_b], images=None, videos=None, padding=True, return_tensors="pt")
        inputs_b = inputs_b.to(device)

        start_b = time.time()
        with torch.no_grad():
            outputs_b = model.generate(**inputs_b, max_new_tokens=20, do_sample=False, temperature=0.0)
        end_b = time.time()
        
        generated_ids_b = outputs_b[0][len(inputs_b.input_ids[0]):]
        out_text_b = processor.decode(generated_ids_b, skip_special_tokens=True)
        pred_b = extract_answer(out_text_b)
        
        # --- Classification ---
        img_corr = (pred_a == gold)
        txt_corr = (pred_b == gold)
        
        img_inv = (pred_a == "INVALID")
        txt_inv = (pred_b == "INVALID")
        
        if img_corr and not txt_corr:
            contrib = "STRONG"
            rec = "KEEP_VISUAL_EVIDENCE"
        elif img_corr and txt_corr:
            contrib = "NONE"
            rec = "REVIEW"
        else:
            contrib = "INCONCLUSIVE"
            rec = "REVIEW"
            
        metrics["image_correct"] += 1 if img_corr else 0
        metrics["text_only_correct"] += 1 if txt_corr else 0
        metrics["image_invalid"] += 1 if img_inv else 0
        metrics["text_only_invalid"] += 1 if txt_inv else 0
        metrics[contrib] += 1
        metrics[rec] += 1
        question_outcomes.append((qid, rec))
        
        results.append({
            "annotation_id": qid,
            "model_id": MODEL_ID,
            "gold": gold,
            "image_prediction": pred_a,
            "text_only_prediction": pred_b,
            "image_correct": img_corr,
            "text_only_correct": txt_corr,
            "image_invalid": img_inv,
            "text_only_invalid": txt_inv,
            "visual_contribution": contrib,
            "image_latency_ms": int((end_a - start_a) * 1000),
            "text_only_latency_ms": int((end_b - start_b) * 1000)
        })
        
        print(f"  Mode A (Img): {pred_a} | Mode B (Txt): {pred_b} | Gold: {gold} -> {contrib}")

    with open(ABLATION_OUT, "w") as f:
        json.dump(results, f, indent=2)
        
    img_acc = metrics["image_correct"] / total if total else 0
    txt_acc = metrics["text_only_correct"] / total if total else 0
    img_inv_rate = metrics["image_invalid"] / total if total else 0
    txt_inv_rate = metrics["text_only_invalid"] / total if total else 0
    vis_gain = img_acc - txt_acc
    strict_dep = metrics["STRONG"] / total if total else 0
    
    with open(REPORT_OUT, "w") as f:
        f.write("# Real Visual Ablation Report\n\n")
        f.write(f"- **MODEL**: {MODEL_ID}\n")
        f.write(f"- **TOTAL QUESTIONS**: {total}\n")
        f.write(f"- **IMAGE ACCURACY**: {img_acc * 100:.1f}%\n")
        f.write(f"- **TEXT-ONLY ACCURACY**: {txt_acc * 100:.1f}%\n")
        f.write(f"- **VISUAL ACCURACY GAIN**: {vis_gain * 100:.1f}%\n")
        f.write(f"- **STRICT VISUAL CONTRIBUTION RATE**: {strict_dep * 100:.1f}%\n")
        f.write(f"- **IMAGE INVALID RATE**: {img_inv_rate * 100:.1f}%\n")
        f.write(f"- **TEXT-ONLY INVALID RATE**: {txt_inv_rate * 100:.1f}%\n")
        
        avg_img_lat = sum([r["image_latency_ms"] for r in results if r["image_prediction"] != "ERROR"]) / total if total else 0
        avg_txt_lat = sum([r["text_only_latency_ms"] for r in results if r["text_only_prediction"] != "ERROR"]) / total if total else 0
        f.write(f"- **LATENCY**: Mode A Avg: {avg_img_lat:.0f}ms | Mode B Avg: {avg_txt_lat:.0f}ms\n\n")
        
        f.write("## Question-Level Outcomes\n\n")
        for qid, rec in question_outcomes:
            f.write(f"- {qid}: {rec}\n")
            
    print("Ablation inference complete.")

if __name__ == "__main__":
    main()
