import os
import sys
import json

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from benchmark_core.benchmark_config import MODELS
from PIL import Image

def main():
    dataset_path = "src/ai/quiz-engine/v2/benchmark/v2_final_master.json"
    manifest_path = "src/ai/quiz-engine/v2/evaluation/image_manifest.json"
    
    with open(manifest_path) as f:
        manifest = json.load(f)
        
    img_map = {m["annotation_id"]: m["local_path"] for m in manifest}
    
    with open(dataset_path) as f:
        dataset = json.load(f)
        
    target_q = next((q for q in dataset if q["annotation_id"] == "Aja0003_img_331568_1786965253267_0"), None)
    
    if not target_q:
        print("Target question not found!")
        return
        
    print(f"Target question found. Image ID: {target_q['image_id']}")
    print(f"Local Path mapped: {img_map[target_q['annotation_id']]}")
    
    img_path = img_map[target_q['annotation_id']]
    
    from benchmark_core.prompt import format_question
    prompt = format_question(target_q)
    
    for m_name, m_info in MODELS.items():
        try:
            print(f"Testing {m_name}...")
            adapter = m_info["adapter"](m_info["id"], m_info["precision"])
            adapter.load()
            
            if "mlx" in m_info["backend"]:
                res = adapter.generate(prompt, img_path)
            else:
                img_obj = Image.open(img_path).convert("RGB")
                res = adapter.generate(prompt, img_obj)
            print(f"{m_name} output: {res.strip()}")
        except Exception as e:
            print(f"FAILED on {m_name}: {e}")

if __name__ == "__main__":
    main()
