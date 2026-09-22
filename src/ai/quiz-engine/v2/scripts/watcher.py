import time
import os
import re

log_file = "src/ai/quiz-engine/v2/reports/benchmark_live.log"

def main():
    print("Watcher started...")
    
    with open(log_file, "r") as f:
        f.seek(0, 2) # Move to end of file
        
        while True:
            line = f.readline()
            if not line:
                time.sleep(1)
                continue
                
            if "MODEL=Qwen3-VL-4B-Instruct" in line and "PROGRESS=734/734" in line:
                print("Detected 734/734 for Qwen3-VL-4B-Instruct!")
                # Wait a tiny bit for the file write/flush to complete fully
                time.sleep(2)
                print("Killing benchmark process...")
                os.system("pkill -f benchmark_final_9.py")
                
                # Append the completion marker
                with open(log_file, "a") as out:
                    out.write("\nQWEN3_VL_4B_COMPLETE\nCOMPLETED=734/734\n")
                    
                print("Watcher finished.")
                break
            
            if "MODEL_COMPLETE MODEL=Qwen3-VL-4B-Instruct" in line:
                print("Detected MODEL_COMPLETE for Qwen3-VL-4B-Instruct!")
                time.sleep(2)
                os.system("pkill -f benchmark_final_9.py")
                with open(log_file, "a") as out:
                    out.write("\nQWEN3_VL_4B_COMPLETE\nCOMPLETED=734/734\n")
                break

if __name__ == "__main__":
    main()
