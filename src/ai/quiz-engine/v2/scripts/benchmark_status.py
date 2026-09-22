import sys, re
from datetime import datetime

log_file = "src/ai/quiz-engine/v2/reports/benchmark_live.log"
models = {}
current_model = None
total_q = 734
total_models = 9
total_expected = total_q * total_models

with open(log_file, "r") as f:
    lines = f.readlines()

for line in lines:
    if "MODEL_START" in line:
        m = re.search(r"MODEL=([\w.-]+)", line)
        if m: 
            current_model = m.group(1)
            if current_model not in models:
                models[current_model] = {"completed": 0, "invalid": 0, "errors": 0, "lat_sum": 0.0, "lat_count": 0}
    elif "PROGRESS=" in line:
        m = re.search(r"MODEL=([\w.-]+) PROGRESS=(\d+)/(\d+) .*? RESULT=(\w+) LATENCY=([\d.]+)s", line)
        if m:
            mod = m.group(1)
            prog = int(m.group(2))
            res = m.group(4)
            lat = float(m.group(5))
            
            if mod not in models:
                models[mod] = {"completed": 0, "invalid": 0, "errors": 0, "lat_sum": 0.0, "lat_count": 0}
            
            models[mod]["completed"] = prog
            models[mod]["lat_sum"] += lat
            models[mod]["lat_count"] += 1
            if res == "INVALID":
                models[mod]["invalid"] += 1
    elif "ERROR=" in line or "CRASH" in line:
        m = re.search(r"MODEL=([\w.-]+)", line)
        if m:
            mod = m.group(1)
            if mod in models:
                models[mod]["errors"] += 1
                
print("=== BENCHMARK STATUS REPORT ===")
total_invalid = 0
total_errors = 0
global_lat_sum = 0
global_lat_count = 0

print("Per-Model Breakdown:")
for mod, stats in models.items():
    avg = stats["lat_sum"]/stats["lat_count"] if stats["lat_count"] > 0 else 0
    print(f"- {mod}: completed {stats['completed']}/{total_q}, remaining {total_q - stats['completed']}, avg_lat: {avg:.2f}s, invalid: {stats['invalid']}, errors: {stats['errors']}")
    total_invalid += stats["invalid"]
    total_errors += stats["errors"]
    global_lat_sum += stats["lat_sum"]
    global_lat_count += stats["lat_count"]

total_completed = sum(s["completed"] for s in models.values())
print(f"\nOverall Progress:")
print(f"- Total Completed: {total_completed} / {total_expected}")
print(f"- Current Model: {current_model}")
print(f"- Total Invalid: {total_invalid}")
print(f"- Total Errors: {total_errors}")

if global_lat_count > 0:
    global_avg = global_lat_sum / global_lat_count
    total_remaining = total_expected - total_completed
    est_sec = total_remaining * global_avg
    print(f"- Average Latency: {global_avg:.2f}s")
    print(f"- Estimated Remaining Time: {est_sec/3600:.2f} hours")
    
if total_errors == 0:
    print("\nBenchmark is progressing normally.")
else:
    print(f"\nWarning: Benchmark encountered {total_errors} errors/crashes.")
