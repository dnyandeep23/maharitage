import json
import os
import math
import random
import numpy as np
from collections import defaultdict

def bootstrap_ci(data, num_samples=10000, alpha=0.05):
    """Calculate 95% Confidence Interval using bootstrap resampling."""
    n = len(data)
    if n == 0: return 0.0, 0.0
    
    # Pre-calculate to avoid overhead in loop
    data = np.array(data)
    means = np.zeros(num_samples)
    
    for i in range(num_samples):
        sample = np.random.choice(data, size=n, replace=True)
        means[i] = np.mean(sample)
        
    lower = np.percentile(means, (alpha/2) * 100)
    upper = np.percentile(means, (1 - alpha/2) * 100)
    return lower * 100, upper * 100

def mcnemar_test(model_a_results, model_b_results):
    """
    Calculate McNemar's test for paired nominal data.
    model_a_results and model_b_results are dictionaries mapping question_id to boolean (correct/incorrect).
    Returns (chi2_statistic, p_value, significance_string)
    """
    common_keys = set(model_a_results.keys()).intersection(set(model_b_results.keys()))
    if not common_keys:
        return 0, 1.0, "No common evaluations"
        
    # b: A is correct, B is incorrect
    # c: A is incorrect, B is correct
    b = 0
    c = 0
    for k in common_keys:
        a_corr = model_a_results[k]
        b_corr = model_b_results[k]
        if a_corr and not b_corr: b += 1
        elif not a_corr and b_corr: c += 1
        
    if b + c == 0:
        return 0, 1.0, "Exact tie"
        
    # Exact binomial test for small numbers (typically < 25), but we'll use chi-square with continuity correction
    chi2 = ((abs(b - c) - 1) ** 2) / (b + c)
    
    # Calculate p-value (1 degree of freedom)
    import scipy.stats as stats
    p_value = 1.0 - stats.chi2.cdf(chi2, 1)
    
    if p_value < 0.001: sig = "*** (p<0.001)"
    elif p_value < 0.01: sig = "** (p<0.01)"
    elif p_value < 0.05: sig = "* (p<0.05)"
    else: sig = "n.s."
    
    # Determine direction
    direction = ""
    if p_value < 0.05:
        if b > c: direction = "Model A > Model B"
        else: direction = "Model B > Model A"
        
    return chi2, p_value, f"{sig} {direction}"

def p95(latencies):
    if not latencies: return 0.0
    return np.percentile(latencies, 95)
    
def median(latencies):
    if not latencies: return 0.0
    return np.percentile(latencies, 50)

def main():
    results_file = "src/ai/quiz-engine/v2/reports/benchmark_results.jsonl"
    manifest_file = "src/ai/quiz-engine/v2/evaluation/benchmark_manifest.json"
    
    with open(manifest_file) as f:
        manifest = json.load(f)
        
    model_stats = defaultdict(lambda: {
        "total": 0, "correct": 0, "valid": 0,
        "text_total": 0, "text_correct": 0,
        "img_total": 0, "img_correct": 0,
        "easy_t": 0, "easy_c": 0,
        "mod_t": 0, "mod_c": 0,
        "hard_t": 0, "hard_c": 0,
        "invalid": 0,
        "latencies": [],
        "sites": defaultdict(lambda: {"t": 0, "c": 0}),
        "results_dict": {}, # q_id -> correct
        "raw_correctness_array": [] # for bootstrap
    })
    
    with open(results_file, "r") as f:
        for line in f:
            if not line.strip(): continue
            d = json.loads(line)
            m_id = d.get("model_name", "Unknown")
            
            if d.get("status") == "EXCLUDED_BY_STUDY_SCOPE" or m_id == "InternVL3-2B":
                continue
            
            st = model_stats[m_id]
            st["total"] += 1
            if d["parsed"] != "INVALID": st["valid"] += 1
            else: st["invalid"] += 1
            
            c = 1 if d["correct"] else 0
            st["correct"] += c
            st["raw_correctness_array"].append(c)
            st["results_dict"][d["annotation_id"]] = d["correct"]
            st["latencies"].append(d["latency"])
            
            if d["question_type"] == "TEXT_MCQ":
                st["text_total"] += 1
                st["text_correct"] += c
            else:
                st["img_total"] += 1
                st["img_correct"] += c
                
            diff = d["difficulty"].lower()
            if diff == "easy":
                st["easy_t"] += 1
                st["easy_c"] += c
            elif diff == "moderate":
                st["mod_t"] += 1
                st["mod_c"] += c
            elif diff == "hard":
                st["hard_t"] += 1
                st["hard_c"] += c
                
            site = d.get("site_id", "Unknown")
            st["sites"][site]["t"] += 1
            st["sites"][site]["c"] += c

    is_incomplete = False
    for st in model_stats.values():
        if st["total"] < 734: # Adjusted to 734 from 739 for v2.0.1
            is_incomplete = True
            break
            
    report_path = "src/ai/quiz-engine/v2/reports/model_comparison_report.md"
    with open(report_path, "w") as f:
        if is_incomplete:
            f.write("# Maharitage V2 — Model Comparison Report (DRY_RUN / INCOMPLETE)\n\n")
        else:
            f.write("# Maharitage V2 — Model Comparison Report\n\n")
            
        f.write("FINAL_MODEL_COUNT = 8\n")
        f.write("EVALUATED_MODELS = 8\n")
        f.write("EXCLUDED_MODELS = 1\n")
        f.write("INTERNVL3-2B = EXCLUDED_BY_STUDY_SCOPE\n\n")
        
        f.write("## 1. Benchmark Configuration\n\n")
        f.write(f"- **Benchmark Version**: {manifest['benchmark_version']}\n")
        f.write(f"- **Dataset SHA-256**: `{manifest['dataset_sha256']}`\n")
        f.write(f"- **Total Questions**: {manifest['dataset_question_count']} ({manifest['text_count']} Text, {manifest['image_count']} Image)\n\n")
        
        f.write("## 2. Nine-Model Baseline Benchmark\n\n")
        f.write("| Model | Backend | Evals | Overall | Text | Image | Easy | Moderate | Hard | Invalid | Avg Latency | P95 |\n")
        f.write("|------|------|------:|------:|------:|------:|------:|------:|------:|------:|------:|------:|\n")
        
        for m_id, st in model_stats.items():
            if st["total"] == 0: continue
            ov = (st["correct"] / st["total"]) * 100
            tx = (st["text_correct"] / st["text_total"] * 100) if st["text_total"] else 0
            im = (st["img_correct"] / st["img_total"] * 100) if st["img_total"] else 0
            ez = (st["easy_c"] / st["easy_t"] * 100) if st["easy_t"] else 0
            md = (st["mod_c"] / st["mod_t"] * 100) if st["mod_t"] else 0
            hd = (st["hard_c"] / st["hard_t"] * 100) if st["hard_t"] else 0
            
            avg_lat = sum(st["latencies"])/len(st["latencies"])
            p95_lat = p95(st["latencies"])
            
            backend = manifest["models"][m_id]["backend"] if m_id in manifest["models"] else "Unknown"
            f.write(f"| {m_id} | {backend} | {st['total']} | {ov:.1f}% ({st['correct']}) | {tx:.1f}% ({st['text_correct']}) | {im:.1f}% ({st['img_correct']}) | {ez:.1f}% ({st['easy_c']}) | {md:.1f}% ({st['mod_c']}) | {hd:.1f}% ({st['hard_c']}) | {st['invalid']} | {avg_lat:.2f}s | {p95_lat:.2f}s |\n")

        f.write("\n## 3. Category Breakdown\n\n")
        f.write("Valid-Response Accuracy focuses only on questions where the model produced a parseable A/B/C/D answer.\n\n")
        f.write("| Model | Overall Accuracy | Valid-Response Accuracy | 95% CI (Bootstrap) |\n")
        f.write("|-------|------------------|-------------------------|--------------------|\n")
        for m_id, st in model_stats.items():
            if st["total"] == 0: continue
            ov = (st["correct"] / st["total"]) * 100
            val_acc = (st["correct"] / st["valid"] * 100) if st["valid"] else 0
            low, high = bootstrap_ci(st["raw_correctness_array"])
            f.write(f"| {m_id} | {ov:.1f}% | {val_acc:.1f}% | [{low:.1f}%, {high:.1f}%] |\n")
            
        f.write("\n## 4. Site-Level Performance\n\n")
        all_sites = sorted(list(set(site for st in model_stats.values() for site in st["sites"].keys())))
        header = "| Model | " + " | ".join(all_sites) + " |\n"
        separator = "|-------|" + "|".join(["---"] * len(all_sites)) + "|\n"
        f.write(header)
        f.write(separator)
        
        for m_id, st in model_stats.items():
            if st["total"] == 0: continue
            row = f"| {m_id} | "
            for site in all_sites:
                site_d = st["sites"][site]
                if site_d["t"] > 0:
                    acc = (site_d["c"] / site_d["t"]) * 100
                    row += f"{acc:.1f}% ({site_d['c']}/{site_d['t']}) | "
                else:
                    row += "- | "
            f.write(row + "\n")
            
        f.write("\n## 5. Statistical Comparison\n\n")
        f.write("McNemar's Test for paired accuracy differences:\n\n")
        f.write("| Comparison | Chi-Square | p-value | Significance |\n")
        f.write("|------------|------------|---------|--------------|\n")
        
        pairs = [
            ("Qwen2-VL-2B-Instruct-MLX", "Qwen3-VL-2B-Instruct"),
            ("Qwen2-VL-2B-Instruct-MLX", "Qwen2.5-VL-3B-Instruct"),
            ("Qwen2-VL-2B-Instruct-MLX", "Qwen3-VL-4B-Instruct"),
            ("Qwen3-VL-2B-Instruct", "Qwen3-VL-4B-Instruct")
        ]
        
        for m1, m2 in pairs:
            if m1 in model_stats and m2 in model_stats:
                chi, p, sig = mcnemar_test(model_stats[m1]["results_dict"], model_stats[m2]["results_dict"])
                f.write(f"| {m1} vs {m2} | {chi:.2f} | {p:.4f} | {sig} |\n")
                
        f.write("\n## 6. Model Selection\n\n")
        
        if is_incomplete:
            f.write("Model selection skipped: Run is INCOMPLETE / DRY_RUN.\n")
        elif model_stats:
            best_ov = max(model_stats.keys(), key=lambda k: (model_stats[k]["correct"]/model_stats[k]["total"]) if model_stats[k]["total"] else 0)
            best_img = max(model_stats.keys(), key=lambda k: (model_stats[k]["img_correct"]/model_stats[k]["img_total"]) if model_stats[k]["img_total"] else 0)
            best_txt = max(model_stats.keys(), key=lambda k: (model_stats[k]["text_correct"]/model_stats[k]["text_total"]) if model_stats[k]["text_total"] else 0)
            
            f.write(f"- **Best Overall**: {best_ov}\n")
            f.write(f"- **Best Image**: {best_img}\n")
            f.write(f"- **Best Text**: {best_txt}\n")
            
        print(f"Report generated successfully at {report_path}")

if __name__ == "__main__":
    main()
