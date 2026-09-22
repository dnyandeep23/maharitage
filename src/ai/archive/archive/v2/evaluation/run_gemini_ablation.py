import os
import json
import time
import requests
import base64
import datetime

FINAL_DATASET_PATH = "src/ai/quiz-engine/v2/dataset/pilot_annotations_final.json"
ABLATION_OUT = "src/ai/quiz-engine/v2/evaluation/gemini_visual_ablation_results.json"
REPORT_OUT = "src/ai/quiz-engine/v2/reports/gemini_visual_ablation_report.md"

PROVIDER = "Google Gemini API"

def get_api_key():
    api_key = os.environ.get("GEMINI_API_KEY")
    if not api_key and os.path.exists(".env.local"):
        with open(".env.local") as env_file:
            for line in env_file:
                if line.startswith("GEMINI_API_KEY="):
                    api_key = line.strip().split("=", 1)[1].strip('"').strip("'")
                    break
    return api_key

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

def download_image_as_base64(url):
    res = requests.get(url, timeout=15)
    res.raise_for_status()
    # Check mime type from headers if possible, default to jpeg
    content_type = res.headers.get('Content-Type', 'image/jpeg')
    b64_data = base64.b64encode(res.content).decode('utf-8')
    return b64_data, content_type

def make_gemini_request(model_id, api_key, payload, max_retries=2):
    url = f"https://generativelanguage.googleapis.com/v1beta/models/{model_id}:generateContent?key={api_key}"
    headers = {"Content-Type": "application/json"}
    
    delays = [3, 8]
    for attempt in range(max_retries + 1):
        start = time.time()
        try:
            res = requests.post(url, headers=headers, json=payload, timeout=30)
            res.raise_for_status()
            lat = int((time.time() - start) * 1000)
            
            data = res.json()
            try:
                content = data["candidates"][0]["content"]["parts"][0]["text"]
                return content, lat, None, False
            except (KeyError, IndexError):
                return None, lat, f"Unexpected response format: {json.dumps(data)}", False
            
        except requests.exceptions.HTTPError as e:
            status_code = e.response.status_code
            if status_code in [401, 403, 404]:
                # Non-retriable auth/model missing error
                return None, 0, f"HTTP {status_code}: {e.response.text}", True
            
            if attempt < max_retries:
                time.sleep(delays[attempt])
                continue
            return None, 0, f"HTTP {status_code} after {max_retries} retries", False
            
        except (requests.exceptions.Timeout, requests.exceptions.ConnectionError) as e:
            if attempt < max_retries:
                time.sleep(5)
                continue
            return None, 0, f"Timeout/Connection error after {max_retries} retries: {str(e)}", False
            
        except Exception as e:
            if attempt < max_retries:
                time.sleep(delays[attempt])
                continue
            return None, 0, f"Unknown error after {max_retries} retries: {str(e)}", False

def load_resumable_results():
    if os.path.exists(ABLATION_OUT):
        with open(ABLATION_OUT, 'r') as f:
            return json.load(f)
    return []

def save_results(results):
    with open(ABLATION_OUT, "w") as f:
        json.dump(results, f, indent=2)

def main():
    api_key = get_api_key()
    if not api_key:
        print("GEMINI_API_KEY missing.")
        return
        
    # First try gemini-2.5-flash-lite, fallback to gemini-2.5-flash if 404/403
    active_model = "gemini-2.5-flash-lite"
    
    # Pre-test model access
    test_payload = {
        "contents": [{"parts": [{"text": "Hello"}]}]
    }
    _, _, err, hard_fail = make_gemini_request(active_model, api_key, test_payload, max_retries=0)
    if hard_fail and "404" in err:
        print(f"{active_model} not found. Falling back to gemini-2.5-flash")
        active_model = "gemini-2.5-flash"
        _, _, err, hard_fail = make_gemini_request(active_model, api_key, test_payload, max_retries=0)
        if err:
            print(f"Fallback model also failed: {err}")
            return
    elif err:
        print(f"Initial model test failed: {err}")
        return
        
    print(f"Using Model: {active_model}")

    with open(FINAL_DATASET_PATH, 'r') as f:
        data = json.load(f)
        
    image_mcqs = [i for i in data if i.get("question_type") == "IMAGE_MCQ"]
    total = len(image_mcqs)
    
    results = load_resumable_results()
    results_map = {r["annotation_id"]: r for r in results}

    print("\n--- RUNNING GEMINI ABLATION ---\n")
    
    for idx, item in enumerate(image_mcqs):
        qid = item["annotation_id"]
        gold = item["correct_option"]
        url = item["image_url"]
        
        print(f"[{idx+1}/{total}] {qid}")
        
        existing = results_map.get(qid)
        if existing and existing.get("image_prediction") and existing.get("text_only_prediction"):
            if existing["image_prediction"] != "ERROR" and existing["text_only_prediction"] != "ERROR":
                print(f"  IMAGE: cached ({existing['image_prediction']})")
                print(f"  TEXT: cached ({existing['text_only_prediction']})")
                print(f"  RESULT: {existing.get('visual_contribution', 'N/A')}")
                continue

        if not existing:
            existing = {
                "annotation_id": qid,
                "model_id": active_model,
                "provider": PROVIDER,
                "gold": gold,
                "image_raw_output": None,
                "text_only_raw_output": None,
                "image_prediction": None,
                "text_only_prediction": None,
                "image_correct": None,
                "text_only_correct": None,
                "image_invalid": False,
                "text_only_invalid": False,
                "image_latency_ms": 0,
                "text_only_latency_ms": 0,
                "visual_contribution": "INCOMPLETE"
            }
            results.append(existing)
            results_map[qid] = existing

        prompt_text = "Answer the following multiple-choice question.\nReturn ONLY A, B, C, or D.\n\n"
        prompt_text += f"Question:\n{item['question']}\n\n"
        prompt_text += f"A. {item['options'][0]}\n"
        prompt_text += f"B. {item['options'][1]}\n"
        prompt_text += f"C. {item['options'][2]}\n"
        prompt_text += f"D. {item['options'][3]}"
            
        # MODE A
        if existing["image_prediction"] is None or existing["image_prediction"] == "ERROR":
            print("  IMAGE: running...")
            try:
                b64_img, mime = download_image_as_base64(url)
                p_img = {
                    "contents": [{
                        "parts": [
                            {"text": prompt_text},
                            {"inline_data": {"mime_type": mime, "data": b64_img}}
                        ]
                    }],
                    "generationConfig": {"temperature": 0.0}
                }
                raw, lat, err, hard_fail = make_gemini_request(active_model, api_key, p_img)
            except Exception as e:
                err = f"Failed to download image: {e}"
                hard_fail = False
                
            if err:
                existing["image_prediction"] = None
                existing["image_correct"] = None
                existing["image_raw_output"] = f"ERROR: {err}"
                existing["image_invalid"] = False
                existing["visual_contribution"] = "INCOMPLETE"
                print(f"  IMAGE: ERROR ({err})")
                if hard_fail:
                    print("Hard failure. Aborting.")
                    break
            else:
                pred = extract_answer(raw)
                existing["image_prediction"] = pred
                existing["image_raw_output"] = raw
                existing["image_latency_ms"] = lat
                existing["image_correct"] = (pred == gold)
                existing["image_invalid"] = (pred == "INVALID")
                print(f"  IMAGE: {pred} ({lat/1000:.1f}s)")
            
            save_results(results)
            time.sleep(2)
            
        # MODE B
        if existing["text_only_prediction"] is None or existing["text_only_prediction"] == "ERROR":
            print("  TEXT: running...")
            p_txt = {
                "contents": [{
                    "parts": [{"text": prompt_text}]
                }],
                "generationConfig": {"temperature": 0.0}
            }
            raw, lat, err, hard_fail = make_gemini_request(active_model, api_key, p_txt)
            if err:
                existing["text_only_prediction"] = None
                existing["text_only_correct"] = None
                existing["text_only_raw_output"] = f"ERROR: {err}"
                existing["text_only_invalid"] = False
                existing["visual_contribution"] = "INCOMPLETE"
                print(f"  TEXT: ERROR ({err})")
                if hard_fail:
                    print("Hard failure. Aborting.")
                    break
            else:
                pred = extract_answer(raw)
                existing["text_only_prediction"] = pred
                existing["text_only_raw_output"] = raw
                existing["text_only_latency_ms"] = lat
                existing["text_only_correct"] = (pred == gold)
                existing["text_only_invalid"] = (pred == "INVALID")
                print(f"  TEXT: {pred} ({lat/1000:.1f}s)")
            
            save_results(results)
            time.sleep(2)
        
        # Classification Update
        if existing["image_prediction"] is None or existing["text_only_prediction"] is None:
            existing["visual_contribution"] = "INCOMPLETE"
        else:
            img_corr = existing["image_correct"]
            txt_corr = existing["text_only_correct"]
            
            if img_corr and not txt_corr:
                existing["visual_contribution"] = "STRONG"
            elif img_corr and txt_corr:
                existing["visual_contribution"] = "NONE"
            else:
                existing["visual_contribution"] = "INCONCLUSIVE"
                
        print(f"  RESULT: {existing['visual_contribution']}")
        save_results(results)
        
    # Build Report
    both_completed = []
    partial = 0
    failed = 0
    
    for r in results:
        i_pred = r["image_prediction"]
        t_pred = r["text_only_prediction"]
        
        if i_pred is None and t_pred is None:
            failed += 1
        elif i_pred is None or t_pred is None:
            partial += 1
        else:
            both_completed.append(r)
            
    completed_count = len(both_completed)
    
    img_completed = [r for r in results if r["image_prediction"] is not None]
    txt_completed = [r for r in results if r["text_only_prediction"] is not None]
    
    img_acc = sum(1 for r in img_completed if r["image_correct"]) / len(img_completed) if img_completed else 0
    txt_acc = sum(1 for r in txt_completed if r["text_only_correct"]) / len(txt_completed) if txt_completed else 0
    
    if completed_count > 0:
        paired_img_acc = sum(1 for r in both_completed if r["image_correct"]) / completed_count
        paired_txt_acc = sum(1 for r in both_completed if r["text_only_correct"]) / completed_count
        vis_gain = paired_img_acc - paired_txt_acc
        
        strong = sum(1 for r in both_completed if r["visual_contribution"] == "STRONG")
        none = sum(1 for r in both_completed if r["visual_contribution"] == "NONE")
        inc = sum(1 for r in both_completed if r["visual_contribution"] == "INCONCLUSIVE")
        strict_gain = strong / completed_count
    else:
        paired_img_acc = paired_txt_acc = vis_gain = strong = none = inc = strict_gain = 0
        
    error_rate = (partial + failed) / total if total > 0 else 0
    
    img_inv_rate = sum(1 for r in img_completed if r["image_invalid"]) / len(img_completed) if img_completed else 0
    txt_inv_rate = sum(1 for r in txt_completed if r["text_only_invalid"]) / len(txt_completed) if txt_completed else 0

    if completed_count / total >= 0.8:
        coverage_status = "USABLE_WITH_LIMITATIONS" if completed_count < total else "USABLE"
    else:
        coverage_status = "INSUFFICIENT_FOR_FINAL_DECISION"

    if error_rate == 0:
        ablation_status = "COMPLETE"
    elif completed_count > 0:
        ablation_status = "PARTIAL"
    else:
        ablation_status = "FAILED"

    with open(REPORT_OUT, "w") as f:
        f.write("# Gemini Visual Ablation Report\n\n")
        f.write(f"- **REAL_ABLATION_STATUS** = {ablation_status}\n")
        f.write(f"- **MODEL** = {active_model}\n")
        f.write(f"- **PROVIDER** = {PROVIDER}\n\n")
        
        f.write(f"## Dataset Completion\n")
        f.write(f"- **TOTAL_QUESTIONS** = {total}\n")
        f.write(f"- **BOTH_COMPLETED** = {completed_count}\n")
        f.write(f"- **PARTIAL** = {partial}\n")
        f.write(f"- **FAILED** = {failed}\n")
        f.write(f"- **ERROR_RATE** = {error_rate * 100:.1f}%\n\n")
        
        f.write(f"## Accuracy Metrics\n")
        f.write(f"- **IMAGE_ACCURACY** (over valid images) = {img_acc * 100:.1f}%\n")
        f.write(f"- **TEXT_ONLY_ACCURACY** (over valid text) = {txt_acc * 100:.1f}%\n")
        f.write(f"- **VISUAL_GAIN** (over BOTH_COMPLETED) = {vis_gain * 100:.1f} percentage points\n")
        f.write(f"- **STRICT_VISUAL_CONTRIBUTION_RATE** (over BOTH_COMPLETED) = {strict_gain * 100:.1f}%\n\n")
        
        f.write(f"## Data Quality\n")
        f.write(f"- **IMAGE_INVALID_RATE** = {img_inv_rate * 100:.1f}%\n")
        f.write(f"- **TEXT_ONLY_INVALID_RATE** = {txt_inv_rate * 100:.1f}%\n\n")
        
        f.write(f"## Scientific Interpretation of Paired Cases\n")
        f.write(f"- **STRONG_VISUAL_CASES** = {strong} (Image inference succeeded where text-only failed, demonstrating clear visual reliance.)\n")
        f.write(f"- **NONE_CASES** = {none} (Both conditions correctly answered the question; the text alone was sufficient.)\n")
        f.write(f"- **INCONCLUSIVE_CASES** = {inc} (Both conditions failed, or ambiguous outcomes preventing a strong conclusion.)\n")
        f.write(f"- **INCOMPLETE_CASES** = {partial + failed} (One or both model API calls timed out or failed, preventing paired comparison.)\n\n")
        
        f.write(f"## Limitations & Pilot Status\n")
        f.write(f"- Gemini was used as a high-throughput proxy to validate the visual dependency of the pilot, rather than part of the target HF benchmark set.\n")
        f.write(f"- **PILOT_STATUS** = CONDITIONALLY_FROZEN\n")
        f.write(f"- **VISUAL_ABLATION_COVERAGE** = {coverage_status}\n\n")
        
        f.write("\n## Question-Level Outcomes\n\n")
        f.write("| ID | Gold | Image Prediction | Text-only Prediction | Image Correct | Text-only Correct | Visual Contribution |\n")
        f.write("|---|---|---|---|---|---|---|\n")
        for r in results:
            f.write(f"| {r['annotation_id']} | {r['gold']} | {r.get('image_prediction')} | {r.get('text_only_prediction')} | {r.get('image_correct')} | {r.get('text_only_correct')} | {r['visual_contribution']} |\n")
            
    print("\n==================================================")
    print(f"REAL_ABLATION_STATUS = {ablation_status}")
    print(f"MODEL = {active_model}")
    print(f"TOTAL = {total}")
    print(f"BOTH_COMPLETED = {completed_count}")
    print(f"PARTIAL = {partial}")
    print(f"FAILED = {failed}")
    print(f"IMAGE_ACCURACY = {img_acc * 100:.1f}%")
    print(f"TEXT_ONLY_ACCURACY = {txt_acc * 100:.1f}%")
    print(f"VISUAL_GAIN = {vis_gain * 100:.1f}%")
    print(f"STRONG = {strong}")
    print(f"NONE = {none}")
    print(f"INCONCLUSIVE = {inc}")
    print(f"ERROR_RATE = {error_rate * 100:.1f}%")
    print(f"STRICT_VISUAL_CONTRIBUTION_RATE = {strict_gain * 100:.1f}%")
    print("PILOT_STATUS = CONDITIONALLY_FROZEN")
    print("==================================================")

if __name__ == "__main__":
    main()
