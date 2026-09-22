import json
import os

def main():
    dataset_path = "src/ai/quiz-engine/v2/benchmark/v2.0.1_master.json"
    results_path = "src/ai/quiz-engine/v2/reports/benchmark_results.jsonl"
    tmp_path = results_path + ".tmp"
    
    with open(dataset_path) as f:
        dataset = json.load(f)
        
    valid_annotations = {q["annotation_id"] for q in dataset}
    
    if not os.path.exists(results_path):
        print("No existing results to migrate.")
        return
        
    valid_records = []
    removed_records = 0
    with open(results_path, "r") as f:
        for line in f:
            if not line.strip(): continue
            record = json.loads(line)
            if record["annotation_id"] in valid_annotations:
                valid_records.append(line)
            else:
                removed_records += 1
                
    with open(tmp_path, "w") as f:
        for r in valid_records:
            f.write(r)
            
    os.replace(tmp_path, results_path)
    
    print(f"Total valid records preserved: {len(valid_records)}")
    print(f"Total records removed (due to dataset update): {removed_records}")

if __name__ == "__main__":
    main()
