import os
import sys
import json
import time
import argparse
import hashlib
from datetime import datetime
from PIL import Image

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from benchmark_core.benchmark_config import MODELS
from benchmark_core.prompt import format_question
from benchmark_core.parser import parse_answer

def compute_sha256(filepath):
    sha256 = hashlib.sha256()
    with open(filepath, 'rb') as f:
        for chunk in iter(lambda: f.read(4096), b""):
            sha256.update(chunk)
    return sha256.hexdigest()

def verify_manifest(dataset_path):
    manifest_path = "src/ai/quiz-engine/v2/evaluation/benchmark_manifest.json"
    if not os.path.exists(manifest_path):
        raise RuntimeError("Manifest not found! Freeze manifest first.")
    
    with open(manifest_path) as f:
        manifest = json.load(f)
        
    current_hash = compute_sha256(dataset_path)
    if current_hash != manifest["dataset_sha256"]:
        raise RuntimeError(f"Dataset hash mismatch! Manifest has {manifest['dataset_sha256']} but dataset has {current_hash}. STOPPING.")
    return manifest

def get_timestamp():
    return datetime.now().strftime("%H:%M:%S")

def log_event(msg):
    log_file = "src/ai/quiz-engine/v2/reports/benchmark_live.log"
    with open(log_file, "a") as f:
        f.write(msg + "\n")
        f.flush()
    print(msg)

def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--limit", type=int, help="Number of questions to evaluate per model (for dry runs)")
    args = parser.parse_args()

    dataset_path = "src/ai/quiz-engine/v2/benchmark/v2.0.1_master.json"
    
    log_event(f"[{get_timestamp()}] BENCHMARK_START")
    
    print("Verifying manifest...")
    manifest = verify_manifest(dataset_path)
    log_event(f"[{get_timestamp()}] MANIFEST_VERIFIED")

    # Image Preflight
    image_manifest_path = "src/ai/quiz-engine/v2/evaluation/image_manifest.json"
    if not os.path.exists(image_manifest_path):
        raise RuntimeError("Image manifest not found! Run cache_images.py first.")
        
    with open(image_manifest_path) as f:
        img_manifest = json.load(f)
        
    img_map = {}
    for m in img_manifest:
        if m["status"] != "READY":
            raise RuntimeError(f"IMAGE_PREFLIGHT FAILED: Image {m['image_id']} for {m['annotation_id']} is not READY.")
        img_map[m["annotation_id"]] = m["local_path"]
        
    with open(dataset_path) as f:
        dataset = json.load(f)
        
    img_count_in_dataset = sum(1 for q in dataset if q["question_type"] == "IMAGE_MCQ")
    if len(img_map) != img_count_in_dataset:
        raise RuntimeError(f"IMAGE_PREFLIGHT FAILED: Manifest has {len(img_map)} images, dataset expects {img_count_in_dataset}.")
    
    log_event(f"[{get_timestamp()}] IMAGE_PREFLIGHT = PASS. All {len(img_map)}/{img_count_in_dataset} image assets are READY.")

    out_file = "src/ai/quiz-engine/v2/reports/benchmark_results.jsonl"
    os.makedirs(os.path.dirname(out_file), exist_ok=True)
    
    # Load existing results for resumption
    completed_keys = set()
    if os.path.exists(out_file):
        with open(out_file, "r") as f:
            for line in f:
                if not line.strip(): continue
                data = json.loads(line)
                if data.get("status") == "EXCLUDED_BY_STUDY_SCOPE":
                    continue
                completed_keys.add(f"{data['model_id']}_{data['annotation_id']}")
                
    if completed_keys:
        log_event(f"[{get_timestamp()}] RESUME Loaded {len(completed_keys)} existing completed inference records.")

    new_inferences_count = 0
    total_evals_across_models = 0

    for m_name, m_info in MODELS.items():
        log_event(f"[{get_timestamp()}] MODEL_START MODEL={m_name}")
        
        adapter = None
        loaded = False
        
        # Prepare evaluation slice
        eval_qs = dataset
        if args.limit:
            eval_qs = eval_qs[:args.limit]
            print(f"Dry run limit applied. Evaluating {len(eval_qs)} questions for this model.")
        
        total_q = len(eval_qs)
        completed_for_model = sum(1 for q in eval_qs if f"{m_info['id']}_{q['annotation_id']}" in completed_keys)
        
        model_correct = 0
        model_invalid = 0
        model_latency_sum = 0
        
        for idx, q in enumerate(eval_qs):
            q_id = q['annotation_id']
            key = f"{m_info['id']}_{q_id}"
            
            if key in completed_keys:
                continue # SKIP completed pairs
                
            # Lazy load the adapter only if there is actual work to do
            if not loaded:
                try:
                    adapter = m_info["adapter"](m_info["id"], m_info["precision"])
                    adapter.load()
                    loaded = True
                except Exception as e:
                    log_event(f"[{get_timestamp()}] MODEL_CRASH MODEL={m_name} ERROR={e}")
                    break # Skip to next model

            prompt = format_question(q)
            img_path = None
            if q['question_type'] == 'IMAGE_MCQ':
                img_path = img_map[q_id]
                
            try:
                t0 = time.time()
                if "mlx" in m_info['backend']:
                    out = adapter.generate(prompt, img_path)
                else:
                    img_obj = Image.open(img_path).convert("RGB") if img_path else None
                    out = adapter.generate(prompt, img_obj)
                dt = time.time() - t0
                
                parsed = parse_answer(out)
                is_correct = (parsed == q['answer'])
                
                result_record = {
                    "model_id": m_info["id"],
                    "model_name": m_name,
                    "annotation_id": q_id,
                    "question_type": q["question_type"],
                    "difficulty": q.get("difficulty", "Moderate"),
                    "site_id": q.get("site_id", "Unknown"),
                    "expected": q["answer"],
                    "raw_output": out.strip().replace('\n', ' '),
                    "parsed": parsed,
                    "correct": is_correct,
                    "latency": dt,
                    "timestamp": time.time()
                }
                
                with open(out_file, "a") as f:
                    f.write(json.dumps(result_record) + "\n")
                    
                completed_keys.add(key)
                new_inferences_count += 1
                completed_for_model += 1
                total_evals_across_models += 1
                
                model_latency_sum += dt
                if is_correct: model_correct += 1
                if parsed not in ["A", "B", "C", "D"]: model_invalid += 1
                
                result_str = "CORRECT" if is_correct else ("INVALID" if parsed not in ["A", "B", "C", "D"] else "INCORRECT")
                
                log_event(f"[{get_timestamp()}] MODEL={m_name} PROGRESS={completed_for_model}/{total_q} REMAINING={total_q - completed_for_model} ANNOTATION={q_id} TYPE={q['question_type']} PREDICTION={parsed} RESULT={result_str} LATENCY={dt:.2f}s")
                
                # Periodic summary every 10 evals
                if new_inferences_count % 10 == 0:
                    acc = (model_correct / new_inferences_count) * 100 if new_inferences_count > 0 else 0
                    avg_lat = model_latency_sum / new_inferences_count if new_inferences_count > 0 else 0
                    log_event(f"\n[SUMMARY]\nMODEL={m_name}\nCOMPLETED={completed_for_model}/{total_q}\nREMAINING={total_q - completed_for_model}\nACCURACY={acc:.1f}%\nINVALID={model_invalid}\nAVG_LATENCY={avg_lat:.1f}s\n")
                    log_event(f"[{get_timestamp()}] CHECKPOINT BENCHMARK_PROGRESS")
                
            except Exception as e:
                log_event(f"[{get_timestamp()}] MODEL_CRASH MODEL={m_name} ANNOTATION={q_id} ERROR={e}")
                break # Model failure isolation. Break the question loop, but continue to next model.
        
    log_event(f"\n[{get_timestamp()}] GEMMA_COMPLETE\nCOMPLETED=734/734")

if __name__ == "__main__":
    main()
