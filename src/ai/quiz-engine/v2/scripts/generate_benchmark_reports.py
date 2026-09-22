import json
import os
import csv
import numpy as np
from collections import defaultdict
from statsmodels.stats.contingency_tables import mcnemar

# Ensure models metadata from runner
MODELS = {
    "SmolVLM-256M": {"params": "256M", "backend": "transformers", "precision": "bfloat16"},
    "SmolVLM-500M": {"params": "500M", "backend": "transformers", "precision": "bfloat16"},
    "llava-onevision-0.5b": {"params": "0.5B", "backend": "transformers", "precision": "float16"},
    "Qwen2-VL-2B-MLX": {"params": "2B", "backend": "mlx", "precision": "4-bit"},
    "Qwen3-VL-2B": {"params": "2B", "backend": "transformers", "precision": "bfloat16"},
    "Qwen2.5-VL-3B": {"params": "3B", "backend": "transformers", "precision": "bfloat16"},
    "Qwen3-VL-4B": {"params": "4B", "backend": "transformers", "precision": "bfloat16"},
    "InternVL3-2B": {"params": "2B", "backend": "transformers", "precision": "bfloat16"},
    "gemma-3-4b-it": {"params": "4B", "backend": "transformers", "precision": "bfloat16"}
}

def bootstrap_ci(accuracies, n_iterations=1000, alpha=0.05):
    n_size = len(accuracies)
    stats = []
    for _ in range(n_iterations):
        sample = np.random.choice(accuracies, size=n_size, replace=True)
        stats.append(np.mean(sample))
    lower = np.percentile(stats, (alpha / 2.0) * 100)
    upper = np.percentile(stats, (1 - alpha / 2.0) * 100)
    return lower, upper

def main():
    print("Generating Benchmark Reports...")
    
    with open("src/ai/quiz-engine/v2/benchmark/v2_final_master.json") as f:
        dataset = json.load(f)
        
    results_path = "src/ai/quiz-engine/v2/evaluation/final_9_model_results.json"
    if not os.path.exists(results_path):
        print(f"Results file not found at {results_path}")
        return
        
    with open(results_path) as f:
        results = json.load(f)
        
    q_map = {q['annotation_id']: q for q in dataset}
    
    # Calculate metrics
    model_metrics = {}
    site_accuracy = defaultdict(lambda: defaultdict(lambda: {"correct": 0, "total": 0}))
    
    for m_name, m_results in results.items():
        metrics = {
            "correct": 0, "incorrect": 0, "invalid": 0, "total": 0,
            "img_correct": 0, "img_total": 0,
            "txt_correct": 0, "txt_total": 0,
            "easy_correct": 0, "easy_total": 0,
            "mod_correct": 0, "mod_total": 0,
            "hard_correct": 0, "hard_total": 0,
            "latencies": [],
            "accuracies": [] # For bootstrap
        }
        
        for ann_id, res in m_results.items():
            if ann_id not in q_map: continue
            q = q_map[ann_id]
            is_correct = res.get('correct', False)
            parsed = res.get('parsed', 'INVALID')
            
            metrics["total"] += 1
            metrics["accuracies"].append(1 if is_correct else 0)
            
            if parsed == "INVALID": metrics["invalid"] += 1
            elif is_correct: metrics["correct"] += 1
            else: metrics["incorrect"] += 1
            
            if q['question_type'] == 'IMAGE_MCQ':
                metrics["img_total"] += 1
                if is_correct: metrics["img_correct"] += 1
            else:
                metrics["txt_total"] += 1
                if is_correct: metrics["txt_correct"] += 1
                
            diff = q.get('difficulty', 'MODERATE')
            if diff == 'EASY':
                metrics["easy_total"] += 1
                if is_correct: metrics["easy_correct"] += 1
            elif diff == 'MODERATE':
                metrics["mod_total"] += 1
                if is_correct: metrics["mod_correct"] += 1
            else:
                metrics["hard_total"] += 1
                if is_correct: metrics["hard_correct"] += 1
                
            site = q['site_id']
            site_accuracy[site][m_name]["total"] += 1
            if is_correct: site_accuracy[site][m_name]["correct"] += 1
            
            if res.get('latency'):
                metrics["latencies"].append(res['latency'])
                
        metrics["overall_acc"] = metrics["correct"] / metrics["total"] if metrics["total"] else 0
        metrics["img_acc"] = metrics["img_correct"] / metrics["img_total"] if metrics["img_total"] else 0
        metrics["txt_acc"] = metrics["txt_correct"] / metrics["txt_total"] if metrics["txt_total"] else 0
        metrics["invalid_rate"] = metrics["invalid"] / metrics["total"] if metrics["total"] else 0
        
        metrics["median_latency"] = np.median(metrics["latencies"]) if metrics["latencies"] else 0
        
        # Bootstrap CI
        if metrics["accuracies"]:
            ci_lower, ci_upper = bootstrap_ci(metrics["accuracies"])
            metrics["ci"] = (ci_lower, ci_upper)
        else:
            metrics["ci"] = (0, 0)
            
        model_metrics[m_name] = metrics
        
    # Statistical Tests (McNemar's)
    print("\nPairwise McNemar's Tests:")
    pairs = [
        ("Qwen2-VL-2B-MLX", "Qwen3-VL-2B"),
        ("Qwen2-VL-2B-MLX", "Qwen2.5-VL-3B"),
        ("Qwen2-VL-2B-MLX", "Qwen3-VL-4B"),
        ("Qwen3-VL-2B", "Qwen3-VL-4B")
    ]
    
    mcnemar_results = []
    for m1, m2 in pairs:
        if m1 in results and m2 in results:
            table = [[0, 0], [0, 0]]
            for ann_id in q_map.keys():
                res1 = results[m1].get(ann_id, {}).get('correct', False)
                res2 = results[m2].get(ann_id, {}).get('correct', False)
                
                if res1 and res2: table[0][0] += 1
                elif res1 and not res2: table[0][1] += 1
                elif not res1 and res2: table[1][0] += 1
                else: table[1][1] += 1
                
            res = mcnemar(table, exact=True)
            sig = res.pvalue < 0.05
            mcnemar_results.append(f"{m1} vs {m2} -> p-value: {res.pvalue:.4f} (Significant: {sig})")
            print(mcnemar_results[-1])
            
    # Generate CSV
    csv_path = "src/ai/quiz-engine/v2/reports/final_9_model_comparison.csv"
    os.makedirs(os.path.dirname(csv_path), exist_ok=True)
    with open(csv_path, "w", newline="") as f:
        writer = csv.writer(f)
        writer.writerow(["Rank", "Model", "Params", "Backend", "Precision", "Questions", "Correct", "Overall Accuracy", "Image Accuracy", "Text Accuracy", "Invalid Rate", "Median Latency"])
        
        sorted_models = sorted(model_metrics.items(), key=lambda x: x[1]['overall_acc'], reverse=True)
        for i, (m, metrics) in enumerate(sorted_models):
            info = MODELS.get(m, {})
            writer.writerow([
                i+1, m, info.get('params', 'Unknown'), info.get('backend', 'Unknown'), info.get('precision', 'Unknown'),
                metrics['total'], metrics['correct'], f"{metrics['overall_acc']:.2%}", 
                f"{metrics['img_acc']:.2%}", f"{metrics['txt_acc']:.2%}", 
                f"{metrics['invalid_rate']:.2%}", f"{metrics['median_latency']:.2f}s"
            ])
            
    # Generate Markdown Report
    md_path = "src/ai/quiz-engine/v2/reports/final_9_model_comparison.md"
    with open(md_path, "w") as f:
        f.write("# Maharitage V2 - Final 9-Model Benchmark Comparison\n\n")
        f.write("*All final rankings are based exclusively on the new synchronized 9-model benchmark run.*\n\n")
        
        f.write("## Main Final Table\n\n")
        f.write("| Rank | Model | Params | Backend | Precision | Questions | Correct | Overall Accuracy | Image Accuracy | Text Accuracy | Invalid Rate | Median Latency |\n")
        f.write("|------|-------|--------|---------|-----------|-----------|---------|-------------------|----------------|---------------|--------------|----------------|\n")
        
        for i, (m, metrics) in enumerate(sorted_models):
            info = MODELS.get(m, {})
            f.write(f"| {i+1} | {m} | {info.get('params', 'Unknown')} | {info.get('backend', 'Unknown')} | {info.get('precision', 'Unknown')} | {metrics['total']} | {metrics['correct']} | {metrics['overall_acc']:.2%} | {metrics['img_acc']:.2%} | {metrics['txt_acc']:.2%} | {metrics['invalid_rate']:.2%} | {metrics['median_latency']:.2f}s |\n")
            
        f.write("\n## Statistical Tests (McNemar's)\n\n")
        for res in mcnemar_results:
            f.write(f"- {res}\n")
            
        f.write("\n## 95% Confidence Intervals (Bootstrap)\n\n")
        for m, metrics in sorted_models:
            f.write(f"- {m}: [{metrics['ci'][0]:.2%}, {metrics['ci'][1]:.2%}]\n")
            
        f.write("\n## Final Interpretation\n\n")
        if sorted_models:
            best_overall = sorted_models[0][0]
            best_img = max(model_metrics.items(), key=lambda x: x[1]['img_acc'])[0]
            best_txt = max(model_metrics.items(), key=lambda x: x[1]['txt_acc'])[0]
            
            lw_models = {m: model_metrics[m] for m in ["Qwen2-VL-2B-MLX", "Qwen3-VL-2B", "InternVL3-2B", "SmolVLM-256M", "SmolVLM-500M", "llava-onevision-0.5b"] if m in model_metrics}
            best_lw = max(lw_models.items(), key=lambda x: x[1]['overall_acc'])[0] if lw_models else "N/A"
            
            fastest = min(model_metrics.items(), key=lambda x: x[1]['median_latency'])[0]
            
            f.write(f"- BEST_OVERALL_MODEL: {best_overall}\n")
            f.write(f"- BEST_IMAGE_MODEL: {best_img}\n")
            f.write(f"- BEST_TEXT_MODEL: {best_txt}\n")
            f.write(f"- BEST_LIGHTWEIGHT_MODEL: {best_lw}\n")
            f.write(f"- FASTEST_MODEL: {fastest}\n")
            
    # Generate Site Accuracy CSV
    site_csv = "src/ai/quiz-engine/v2/reports/final_9_model_site_accuracy.csv"
    with open(site_csv, "w", newline="") as f:
        writer = csv.writer(f)
        header = ["Site ID"] + [m for m, _ in sorted_models]
        writer.writerow(header)
        
        for site in sorted(site_accuracy.keys()):
            row = [site]
            for m, _ in sorted_models:
                m_site_acc = site_accuracy[site][m]["correct"] / site_accuracy[site][m]["total"] if site_accuracy[site][m]["total"] else 0
                row.append(f"{m_site_acc:.2%}")
            writer.writerow(row)
            
if __name__ == "__main__":
    main()
