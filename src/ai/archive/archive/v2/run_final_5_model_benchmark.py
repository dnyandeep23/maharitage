import json
import os
import time
import requests
import math
import numpy as np
import re
import sys
import base64
import traceback
import csv
from io import BytesIO

# Paths
base = '/Users/dnyandeep/Dnyandeep/Project/maharitage/src/ai/quiz-engine/v2'
frozen_db_path = os.path.join(base, 'benchmark', 'pilot_v2_frozen.json')
results_dir = os.path.join(base, 'evaluation')
reports_dir = os.path.join(base, 'reports')
results_path = os.path.join(results_dir, 'model_benchmark_results.json')

os.makedirs(results_dir, exist_ok=True)
os.makedirs(reports_dir, exist_ok=True)

# Load env
env = {}
try:
    with open('/Users/dnyandeep/Dnyandeep/Project/maharitage/.env.local', 'r') as f:
        for line in f:
            line = line.strip()
            if not line or line.startswith('#'): continue
            if line.startswith('export '): line = line[7:]
            if '=' in line:
                k, v = line.split('=', 1)
                env[k] = v.strip('"\'')
except FileNotFoundError:
    pass
OPENROUTER_KEY = env.get('OPENROUTER_API_KEY', os.environ.get('OPENROUTER_API_KEY'))

# Final 5 Models
MODELS = [
    {"model_id": "HuggingFaceTB/SmolVLM-256M-Instruct", "backend": "transformers"},
    {"model_id": "HuggingFaceTB/SmolVLM-500M-Instruct", "backend": "transformers"},
    {"model_id": "mlx-community/Qwen2-VL-2B-Instruct-4bit", "backend": "mlx"},
    {"model_id": "qwen/qwen3-vl-8b-instruct", "backend": "openrouter"},
    {"model_id": "google/gemma-3-12b-it", "backend": "openrouter"}
]

# Strict Parser
def parse_answer(raw):
    raw = str(raw).strip()
    if not raw:
        return "INVALID"
    
    if raw in ['A', 'B', 'C', 'D']:
        return raw
    
    match = re.search(r'(?i)(?:answer|option)[\s:]*([A-D])\b', raw)
    if match:
        return match.group(1).upper()
        
    if len(raw) > 1 and raw[0] in ['A', 'B', 'C', 'D'] and raw[1] in ['.', ' ', ')', ':']:
        return raw[0]

    match = re.search(r'^[\s]*([A-D])[\s]*$', raw)
    if match:
        return match.group(1).upper()
        
    return "INVALID"

# Load dataset
def load_dataset():
    with open(frozen_db_path, 'r') as f:
        return json.load(f)

# Load existing results for resumability
def load_results():
    if os.path.exists(results_path):
        try:
            with open(results_path, 'r') as f:
                return json.load(f)
        except Exception:
            return []
    return []

def save_results(results):
    with open(results_path, 'w') as f:
        json.dump(results, f, indent=2)

def build_prompt(item):
    prompt = f"You are answering a Maharashtra heritage multiple-choice question.\n\nReturn only one answer choice: A, B, C, or D.\n\nQuestion:\n{item['question']}\n\n"
    prompt += f"A. {item['options'][0]}\n"
    prompt += f"B. {item['options'][1]}\n"
    prompt += f"C. {item['options'][2]}\n"
    prompt += f"D. {item['options'][3]}"
    return prompt

def get_image_path(item):
    if not item.get('image_url'):
        return None
    img_dir = os.path.join(base, 'benchmark', 'images')
    os.makedirs(img_dir, exist_ok=True)
    url = item['image_url']
    filename = url.split('/')[-1]
    if '?' in filename:
        filename = filename.split('?')[0]
    img_path = os.path.join(img_dir, filename)
    if not os.path.exists(img_path):
        print(f"Downloading {url} to {img_path}")
        try:
            r = requests.get(url, timeout=10)
            if r.status_code == 200:
                with open(img_path, 'wb') as f:
                    f.write(r.content)
            else:
                return None
        except Exception:
            return None
    return img_path

def run_openrouter(model_id, item):
    headers = {"Authorization": f"Bearer {OPENROUTER_KEY}", "Content-Type": "application/json"}
    prompt = build_prompt(item)
    
    content = [{"type": "text", "text": prompt}]
    if item.get('question_type') == 'IMAGE_MCQ':
        img_path = get_image_path(item)
        if img_path and os.path.exists(img_path):
            with open(img_path, "rb") as image_file:
                encoded_string = base64.b64encode(image_file.read()).decode('utf-8')
                content.append({"type": "image_url", "image_url": {"url": f"data:image/jpeg;base64,{encoded_string}"}})
        elif item.get('image_url'):
            content.append({"type": "image_url", "image_url": {"url": item['image_url']}})
        
    payload = {
        "model": model_id,
        "messages": [{"role": "user", "content": content}],
        "max_tokens": 10,
        "temperature": 0.0,
        "logprobs": True,
        "top_logprobs": 5
    }
    
    start = time.time()
    for attempt in range(3):
        try:
            r = requests.post("https://openrouter.ai/api/v1/chat/completions", headers=headers, json=payload, timeout=30)
            if r.status_code == 200:
                dur = time.time() - start
                data = r.json()
                choice = data['choices'][0]
                raw = choice['message'].get('content', '')
                parsed = parse_answer(raw)
                
                conf_type = "UNAVAILABLE"
                prob = None
                logprobs_obj = choice.get('logprobs')
                if logprobs_obj and logprobs_obj.get('content'):
                    first_tok = logprobs_obj['content'][0]
                    prob = math.exp(first_tok['logprob'])
                    conf_type = "MODEL_LOGPROB"
                
                return {
                    "raw_output": raw,
                    "prediction": parsed,
                    "confidence_type": conf_type,
                    "answer_probability": prob,
                    "latency_ms": int(dur * 1000),
                    "status": "SUCCESS"
                }
            elif r.status_code == 429 or r.status_code >= 500:
                print(f"OpenRouter Error {r.status_code}. Retrying ({attempt+1}/2)...")
                time.sleep(2 ** attempt)
                continue
            else:
                return {"status": "ERROR", "raw_output": r.text, "latency_ms": int((time.time() - start)*1000)}
        except Exception as e:
            if attempt == 2:
                return {"status": "ERROR", "raw_output": str(e), "latency_ms": int((time.time() - start)*1000)}
            print(f"OpenRouter Exception {str(e)}. Retrying ({attempt+1}/2)...")
            time.sleep(2 ** attempt)
            
    return {"status": "ERROR", "raw_output": "Max retries exceeded", "latency_ms": int((time.time() - start)*1000)}


processor_cache = {}
model_cache = {}

def run_transformers(model_id, item):
    global processor_cache, model_cache
    import torch
    from PIL import Image
    from transformers import AutoProcessor, AutoModelForImageTextToText
    
    if model_id not in model_cache:
        print(f"Loading transformers model {model_id} to MPS...")
        processor_cache[model_id] = AutoProcessor.from_pretrained(model_id)
        model_cache[model_id] = AutoModelForImageTextToText.from_pretrained(model_id, device_map="mps", torch_dtype="auto")
        print("Loaded.")
        
    processor = processor_cache[model_id]
    model = model_cache[model_id]
    
    prompt = build_prompt(item)
    messages = []
    images = []
    
    if item.get('question_type') == 'IMAGE_MCQ':
        img_path = get_image_path(item)
        if img_path and os.path.exists(img_path):
            images.append(Image.open(img_path).convert("RGB"))
            messages = [{"role": "user", "content": [{"type": "image"}, {"type": "text", "text": prompt}]}]
        else:
            return {"status": "ERROR", "raw_output": "Local image missing", "latency_ms": 0}
    else:
        messages = [{"role": "user", "content": [{"type": "text", "text": prompt}]}]
        images = None

    start = time.time()
    try:
        prompt_fmt = processor.apply_chat_template(messages, add_generation_prompt=True)
        if images:
            inputs = processor(text=prompt_fmt, images=images, return_tensors="pt").to("mps")
        else:
            inputs = processor(text=prompt_fmt, return_tensors="pt").to("mps")
            
        gen_out = model.generate(**inputs, max_new_tokens=10, temperature=0.0, return_dict_in_generate=True, output_scores=True)
        dur = time.time() - start
        
        input_len = inputs["input_ids"].shape[1]
        gen_seq = gen_out.sequences[0][input_len:]
        raw = processor.decode(gen_seq, skip_special_tokens=True).strip()
        parsed = parse_answer(raw)
        
        prob = None
        conf_type = "UNAVAILABLE"
        if len(gen_out.scores) > 0:
            first_scores = gen_out.scores[0][0]
            probs = torch.nn.functional.softmax(first_scores, dim=-1)
            prob = probs[gen_seq[0]].item()
            conf_type = "MODEL_LOGPROB"
            
        return {
            "raw_output": raw,
            "prediction": parsed,
            "confidence_type": conf_type,
            "answer_probability": prob,
            "latency_ms": int(dur * 1000),
            "status": "SUCCESS"
        }
    except Exception as e:
        traceback.print_exc()
        return {"status": "ERROR", "raw_output": str(e), "latency_ms": int((time.time() - start)*1000)}

def run_mlx(model_id, item):
    global processor_cache, model_cache
    import mlx.core as mx
    from mlx_vlm import load, generate
    from mlx_vlm.prompt_utils import apply_chat_template
    
    if model_id not in model_cache:
        print(f"Loading MLX model {model_id}...")
        model_cache[model_id], processor_cache[model_id] = load(model_id)
        print("Loaded.")
        
    model = model_cache[model_id]
    processor = processor_cache[model_id]
    
    prompt = build_prompt(item)
    img_path = None
    
    if item.get('question_type') == 'IMAGE_MCQ':
        img_path = get_image_path(item)
        if not img_path or not os.path.exists(img_path):
             return {"status": "ERROR", "raw_output": "Local image missing", "latency_ms": 0}
             
    start = time.time()
    try:
        if "qwen" in model_id.lower() and img_path:
            messages = [
                {"role": "user", "content": [
                    {"type": "image"},
                    {"type": "text", "text": prompt}
                ]}
            ]
            formatted_prompt = apply_chat_template(processor, model.config, messages)
        else:
            formatted_prompt = prompt
            
        img_arg = [img_path] if img_path else None
        # mlx generation does not give logprobs easily through the standard high level generate() method right now
        # so we leave it as UNAVAILABLE.
        
        out_text = generate(model, processor, prompt=formatted_prompt, image=img_arg, max_tokens=10, verbose=False)
        dur = time.time() - start
        
        if hasattr(out_text, 'text'):
            raw = out_text.text
        else:
            raw = str(out_text)
            
        parsed = parse_answer(raw)
        
        return {
            "raw_output": raw,
            "prediction": parsed,
            "confidence_type": "UNAVAILABLE",
            "answer_probability": None,
            "latency_ms": int(dur * 1000),
            "status": "SUCCESS"
        }
    except Exception as e:
        traceback.print_exc()
        return {"status": "ERROR", "raw_output": str(e), "latency_ms": int((time.time() - start)*1000)}

def evaluate_models():
    dataset = load_dataset()
    results = load_results()
    
    # Fast lookup for completed (model_id, annotation_id)
    completed = set()
    for r in results:
        completed.add((r['model_id'], r['annotation_id']))
        
    for m in MODELS:
        mid = m['model_id']
        backend = m['backend']
        print(f"\\n--- Evaluating {mid} via {backend} ---")
        
        for i, item in enumerate(dataset):
            ann_id = item.get('annotation_id', str(i))
            
            if (mid, ann_id) in completed:
                print(f"[{mid}][{i+1}/{len(dataset)}] Skipped (already completed)")
                continue
                
            print(f"[{mid}][{i+1}/{len(dataset)}] Running...")
            
            if backend == "openrouter":
                res = run_openrouter(mid, item)
            elif backend == "transformers":
                res = run_transformers(mid, item)
            elif backend == "mlx":
                res = run_mlx(mid, item)
            else:
                res = {"status": "ERROR", "raw_output": f"Unknown backend {backend}"}
                
            prediction = res.get('prediction')
            correct = None
            if prediction and prediction != "INVALID" and res.get('status') == 'SUCCESS':
                correct = (prediction == item.get('correct_option'))
            
            rec = {
                "annotation_id": ann_id,
                "model_id": mid,
                "inference_backend": backend,
                "question_type": item.get('question_type', 'UNKNOWN'),
                "category": item.get('category', 'UNKNOWN'),
                "difficulty": item.get('difficulty', 'UNKNOWN'),
                "gold": item.get('correct_option', ''),
                "prediction": prediction if res.get('status') == 'SUCCESS' else None,
                "raw_output": res.get('raw_output', ''),
                "correct": correct,
                "confidence_type": res.get('confidence_type', 'UNAVAILABLE'),
                "answer_probability": res.get('answer_probability'),
                "latency_ms": res.get('latency_ms', 0),
                "status": res.get('status', 'ERROR')
            }
            
            results.append(rec)
            completed.add((mid, ann_id))
            save_results(results) # Resumability save
            
            print(f"  status={rec['status']} prediction={rec['prediction']} gold={rec['gold']} correct={rec['correct']} latency={rec['latency_ms']}ms raw='{rec['raw_output'].strip()}'")
            
    return results

def compute_metrics(results, dataset):
    # Map dataset by annotation_id for fast lookup
    ds_map = {item.get('annotation_id', str(i)): item for i, item in enumerate(dataset)}
    
    metrics = {}
    for r in results:
        mid = r['model_id']
        if mid not in metrics:
            metrics[mid] = {
                'total': 0, 'successful': 0, 'invalid': 0, 'error': 0,
                'correct': 0,
                'text_total': 0, 'text_correct': 0,
                'image_total': 0, 'image_correct': 0,
                'easy_total': 0, 'easy_correct': 0,
                'mod_total': 0, 'mod_correct': 0,
                'hard_total': 0, 'hard_correct': 0,
                'cats': {}, 'latencies': [],
                'conf_all': [], 'conf_correct': [], 'conf_wrong': [],
                'backend': r['inference_backend']
            }
            
        m = metrics[mid]
        m['total'] += 1
        
        if r['status'] == 'ERROR':
            m['error'] += 1
            continue
            
        m['successful'] += 1
        m['latencies'].append(r['latency_ms'])
        
        if r['prediction'] == "INVALID" or r['prediction'] is None:
            m['invalid'] += 1
        elif r['correct']:
            m['correct'] += 1
            
        qtype = r['question_type']
        if qtype == 'TEXT_MCQ':
            m['text_total'] += 1
            if r['correct']: m['text_correct'] += 1
        else:
            m['image_total'] += 1
            if r['correct']: m['image_correct'] += 1
            
        diff = r['difficulty'].upper()
        if diff == 'EASY':
            m['easy_total'] += 1
            if r['correct']: m['easy_correct'] += 1
        elif diff == 'MODERATE':
            m['mod_total'] += 1
            if r['correct']: m['mod_correct'] += 1
        elif diff == 'HARD':
            m['hard_total'] += 1
            if r['correct']: m['hard_correct'] += 1
            
        cat = r['category']
        if cat not in m['cats']: m['cats'][cat] = {'total': 0, 'correct': 0}
        m['cats'][cat]['total'] += 1
        if r['correct']: m['cats'][cat]['correct'] += 1
        
        prob = r['answer_probability']
        if prob is not None:
            m['conf_all'].append(prob)
            if r['correct']: m['conf_correct'].append(prob)
            if r['correct'] is False and r['prediction'] != "INVALID": m['conf_wrong'].append(prob)

    return metrics

def pct(c, t): return (c/t*100) if t > 0 else 0
def avg(l): return sum(l)/len(l) if len(l) > 0 else 0

def generate_reports(metrics, dataset):
    md = "# Model Comparison Report\n\n"
    md += "**PRELIMINARY_MODEL_SELECTION**\n"
    md += "This is a 48-question pilot. Small accuracy differences may not be statistically significant.\n\n"
    
    csv_rows = [["Model", "Backend", "Evaluations", "Errors", "Overall Acc", "Text Acc", "Image Acc", "Easy Acc", "Moderate Acc", "Hard Acc", "Avg Conf", "Correct Conf", "Wrong Conf", "Invalid %", "Avg Latency (ms)", "P95 Latency (ms)"]]
    
    md_table = "| Model | Backend | Evals | Overall | Text | Image | Easy | Moderate | Hard | Avg Conf | Correct Conf | Wrong Conf | Invalid | Avg Latency | P95 |\n"
    md_table += "|---|---|---|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|\n"
    
    ranked = []
    for mid, m in metrics.items():
        evals = m['successful']
        overall = pct(m['correct'], evals)
        txt = pct(m['text_correct'], m['text_total'])
        img = pct(m['image_correct'], m['image_total'])
        easy = pct(m['easy_correct'], m['easy_total'])
        mod = pct(m['mod_correct'], m['mod_total'])
        hard = pct(m['hard_correct'], m['hard_total'])
        inv = pct(m['invalid'], evals)
        
        al = avg(m['latencies'])
        p95 = np.percentile(m['latencies'], 95) if m['latencies'] else 0
        
        ac = avg(m['conf_all'])
        cc = avg(m['conf_correct'])
        wc = avg(m['conf_wrong'])
        
        ranked.append({
            'mid': mid, 'backend': m['backend'], 'evals': evals, 'errors': m['error'],
            'overall': overall, 'txt': txt, 'img': img,
            'easy': easy, 'mod': mod, 'hard': hard, 'inv': inv,
            'al': al, 'p95': p95, 'ac': ac, 'cc': cc, 'wc': wc, 'm_data': m
        })

    # Rank: 1. Overall, 2. Image, 3. Hard, 4. Invalid, 5. Latency
    ranked.sort(key=lambda x: (x['overall'], x['img'], x['hard'], -x['inv'], -x['al']), reverse=True)
    
    for r in ranked:
        mid_short = r['mid'].split('/')[-1]
        csv_rows.append([r['mid'], r['backend'], f"{r['evals']}/48", r['errors'], f"{r['overall']:.1f}", f"{r['txt']:.1f}", f"{r['img']:.1f}", f"{r['easy']:.1f}", f"{r['mod']:.1f}", f"{r['hard']:.1f}", f"{r['ac']:.3f}", f"{r['cc']:.3f}", f"{r['wc']:.3f}", f"{r['inv']:.1f}", f"{r['al']:.0f}", f"{r['p95']:.0f}"])
        md_table += f"| {mid_short} | {r['backend']} | {r['evals']}/48 | {r['overall']:.1f}% | {r['txt']:.1f}% | {r['img']:.1f}% | {r['easy']:.1f}% | {r['mod']:.1f}% | {r['hard']:.1f}% | {r['ac']:.3f} | {r['cc']:.3f} | {r['wc']:.3f} | {r['inv']:.1f}% | {r['al']:.0f}ms | {r['p95']:.0f}ms |\n"

    md += md_table
    md += "\n\n## Category Breakdown\n\n"
    
    cats = ['HISTORICAL', 'ARCHITECTURAL', 'CULTURAL_RELIGIOUS', 'INSCRIPTION', 'CHRONOLOGY', 'COMPARATIVE_REASONING', 'VISUAL_ARCHITECTURE', 'VISUAL_SCULPTURE', 'VISUAL_MATERIAL', 'VISUAL_INSCRIPTION']
    
    md += "| Model | " + " | ".join(cats) + " |\n"
    md += "|---|" + "|".join(["---:"] * len(cats)) + "|\n"
    
    for r in ranked:
        mid_short = r['mid'].split('/')[-1]
        row = f"| {mid_short} |"
        for cat in cats:
            cat_data = r['m_data']['cats'].get(cat, {'total': 0, 'correct': 0})
            if cat_data['total'] > 0:
                acc = pct(cat_data['correct'], cat_data['total'])
                row += f" {acc:.0f}% (n={cat_data['total']}) |"
            else:
                row += " N/A |"
        md += row + "\n"
        
    md += "\n*Note: Categories with small n values are indicative only.*\n"
    
    with open(os.path.join(reports_dir, 'model_comparison_report.md'), 'w') as f:
        f.write(md)
        
    with open(os.path.join(reports_dir, 'model_comparison_summary.csv'), 'w', newline='') as f:
        writer = csv.writer(f)
        writer.writerows(csv_rows)
        
    conf_md = "# Model Confidence Analysis\n\n"
    for r in ranked:
        mid = r['mid']
        conf_md += f"## {mid}\n"
        conf_type = "MODEL_LOGPROB" if r['ac'] > 0 else "UNAVAILABLE"
        conf_md += f"- **Confidence Type**: {conf_type}\n"
        conf_md += f"- **Mean Confidence (All)**: {r['ac']:.4f}\n"
        conf_md += f"- **Mean Confidence (Correct)**: {r['cc']:.4f}\n"
        conf_md += f"- **Mean Confidence (Wrong)**: {r['wc']:.4f}\n\n"

    with open(os.path.join(reports_dir, 'model_confidence_analysis.md'), 'w') as f:
        f.write(conf_md)

def main():
    print("Starting Final 5-Model Benchmark...")
    results = evaluate_models()
    dataset = load_dataset()
    print("\\nComputing metrics...")
    metrics = compute_metrics(results, dataset)
    print("Generating reports...")
    generate_reports(metrics, dataset)
    print("Benchmark complete!")

if __name__ == "__main__":
    main()
