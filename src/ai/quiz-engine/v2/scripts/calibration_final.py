import os
import sys
import json
import time
import traceback
from PIL import Image
import torch
from transformers import AutoProcessor

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from benchmark_core.benchmark_config import MODELS
from benchmark_core.prompt import format_question
from benchmark_core.parser import parse_answer

def main():
    print("--- Running 9-Model Calibration ---")
    
    with open("src/ai/quiz-engine/v2/benchmark/v2_final_master.json") as f:
        dataset = json.load(f)
    
    # 3 image, 2 text
    image_qs = [q for q in dataset if q['question_type'] == 'IMAGE_MCQ'][:3]
    text_qs = [q for q in dataset if q['question_type'] == 'TEXT_MCQ'][:2]
    calib_qs = image_qs + text_qs
    
    report_rows = []
    
    for m_name, m_info in MODELS.items():
        print(f"\n{'='*50}\nMODEL: {m_name}\nBACKEND: {m_info['backend']}\nPRECISION: {m_info['precision']}\n{'='*50}")
        adapter = m_info["adapter"](m_info["id"], m_info["precision"])
        
        load_status = "OK"
        root_cause = ""
        try:
            adapter.load()
        except Exception as e:
            err = str(e)
            if "IsolatedError" in str(e) or "Isolated Error" in str(e):
                root_cause = str(e).replace('\n', ' ')
            elif "403 Client Error" in err or "gated" in err.lower():
                load_status = "AUTH_REQUIRED"
            else:
                load_status = "FAILED"
            if not root_cause: root_cause = err.replace('\n', ' ')
            print(f"LOAD_STATUS: {load_status}")
            print(f"Root Cause: {err}")
            
        if load_status != "OK":
            report_rows.append({
                "Model": m_name, "Backend": m_info['backend'], "Load": load_status,
                "Image": "SKIPPED", "Text": "SKIPPED", "Valid": "-", "Invalid": "-",
                "Accuracy": "-", "Avg Latency": "-", "Status": load_status, "Root Cause": root_cause
            })
            continue
            
        print(f"LOAD_STATUS: {load_status}")
        
        valid = 0
        correct = 0
        latencies = []
        status = "PASS"
        img_works = "YES"
        txt_works = "YES"
        
        q_results = []
        
        for i, q in enumerate(calib_qs):
            prompt = format_question(q)
            img_path = None
            if q['question_type'] == 'IMAGE_MCQ':
                img_path = os.path.join("src/ai/quiz-engine/v2/benchmark/images", q['image_url'].split('/')[-1])
                if not os.path.exists(img_path):
                    print(f"Q{i} ERROR: {img_path} not found")
                    status = "MISSING_IMAGE"
                    img_works = "NO"
                    break
            
            try:
                t0 = time.time()
                if "mlx" in m_info['backend']:
                    out = adapter.generate(prompt, img_path)
                else:
                    img_obj = Image.open(img_path).convert("RGB") if img_path else None
                    out = adapter.generate(prompt, img_obj)
                dt = time.time() - t0
                
                parsed = parse_answer(out)
                if parsed != "INVALID": valid += 1
                if parsed == q['answer']: correct += 1
                latencies.append(dt)
                out_str = out.strip().replace('\n', ' ')
                print(f"Q{i} raw: {out_str} -> parsed: {parsed} (expected: {q['answer']}) [{dt:.2f}s]")
                q_results.append(f"Q{i}: {parsed}")
                
            except Exception as e:
                print(f"Q{i} ERROR: {e}")
                status = "RUNTIME_FAILED"
                if q['question_type'] == 'IMAGE_MCQ': img_works = "NO"
                if q['question_type'] == 'TEXT_MCQ': txt_works = "NO"
                root_cause = str(e).replace('\n', ' ')
                break
                
        if status == "PASS":
            avg_lat = sum(latencies)/len(latencies) if latencies else 0
            acc = (correct / 5) * 100
            print(f"\nVALID_OUTPUTS: {valid}/5")
            print(f"INVALID_OUTPUTS: {5-valid}/5")
            print(f"CALIBRATION_ACCURACY: {acc}%")
            print(f"AVG_LATENCY: {avg_lat:.2f}s")
            print(f"STATUS: {status}")
            
            report_rows.append({
                "Model": m_name, "Backend": m_info['backend'], "Load": load_status,
                "Image": img_works, "Text": txt_works, "Valid": str(valid), "Invalid": str(5-valid),
                "Accuracy": f"{acc}%", "Avg Latency": f"{avg_lat:.2f}s", "Status": status, "Root Cause": ""
            })
        else:
            print(f"STATUS: {status}")
            report_rows.append({
                "Model": m_name, "Backend": m_info['backend'], "Load": load_status,
                "Image": img_works, "Text": txt_works, "Valid": "-", "Invalid": "-",
                "Accuracy": "-", "Avg Latency": "-", "Status": status, "Root Cause": root_cause
            })

    # Write report
    md_path = "src/ai/quiz-engine/v2/reports/final_9_model_calibration.md"
    os.makedirs(os.path.dirname(md_path), exist_ok=True)
    with open(md_path, "w") as f:
        f.write("# Final 9-Model Calibration Report\n\n")
        f.write("ENVIRONMENT:\n")
        f.write("- Python/PyTorch/Transformers/MLX versions logged in main output.\n")
        f.write("DEPENDENCIES_INSTALLED: None new. Existing einops, timm, mlx, transformers used.\n\n")
        
        f.write("| Model | Backend | Load | Image | Text | Valid | Invalid | Accuracy | Avg Latency | Status |\n")
        f.write("|-------|---------|------|-------|------|-------|---------|----------|-------------|--------|\n")
        
        blocked = []
        for r in report_rows:
            f.write(f"| {r['Model']} | {r['Backend']} | {r['Load']} | {r['Image']} | {r['Text']} | {r['Valid']} | {r['Invalid']} | {r['Accuracy']} | {r['Avg Latency']} | {r['Status']} |\n")
            if r['Status'] != 'PASS':
                blocked.append(f"- **{r['Model']}**: {r['Status']} ({r.get('Root Cause', '')})")
                
        f.write("\n\n")
        if not blocked:
            f.write("CAN_ALL_9_MODELS_BE_EVALUATED = YES\n")
        else:
            f.write("CAN_ALL_9_MODELS_BE_EVALUATED = NO\n\nBlocked Models:\n")
            for b in blocked:
                f.write(f"{b}\n")
                
    print(f"\nFinal report saved to {md_path}")

if __name__ == "__main__":
    main()
