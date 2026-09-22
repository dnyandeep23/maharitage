import os
import json
import requests
from PIL import Image
from io import BytesIO

def main():
    dataset_path = "src/ai/quiz-engine/v2/benchmark/v2.0.1_master.json"
    cache_dir = "src/ai/quiz-engine/v2/benchmark/images"
    manifest_path = "src/ai/quiz-engine/v2/evaluation/image_manifest.json"
    
    os.makedirs(cache_dir, exist_ok=True)
    os.makedirs(os.path.dirname(manifest_path), exist_ok=True)

    with open(dataset_path, "r") as f:
        dataset = json.load(f)
        
    images_to_process = {}
    for q in dataset:
        if q["question_type"] == "IMAGE_MCQ":
            image_id = q.get("image_id")
            image_url = q.get("image_url")
            
            if not image_id or not image_url:
                print(f"ERROR: Missing image_id or image_url in annotation {q['annotation_id']}")
                continue
                
            if image_id not in images_to_process:
                images_to_process[image_id] = {
                    "image_id": image_id,
                    "image_url": image_url,
                    "annotations": []
                }
            images_to_process[image_id]["annotations"].append(q["annotation_id"])

    manifest = []
    
    for img_id, data in images_to_process.items():
        url = data["image_url"]
        local_path = os.path.join(cache_dir, f"{img_id}.jpg")
        status = "UNRESOLVED"
        width = None
        height = None
        fmt = None
        
        try:
            if not os.path.exists(local_path):
                print(f"Downloading {img_id} from {url}...")
                resp = requests.get(url, timeout=10)
                resp.raise_for_status()
                img_bytes = resp.content
                
                with open(local_path, "wb") as f:
                    f.write(img_bytes)
            
            # Verify with PIL
            with Image.open(local_path) as img:
                img.verify()
                
            # Reopen to load and get dimensions
            with Image.open(local_path) as img:
                img.load() # Forces loading the whole image data to catch truncation
                width, height = img.size
                fmt = img.format
                
            status = "READY"
        except Exception as e:
            print(f"FAILED on {img_id}: {e}")
            status = "BROKEN_SOURCE"
            
        for ann_id in data["annotations"]:
            manifest.append({
                "annotation_id": ann_id,
                "image_id": img_id,
                "image_url": url,
                "local_path": local_path,
                "status": status,
                "width": width,
                "height": height,
                "format": fmt
            })
            
    with open(manifest_path, "w") as f:
        json.dump(manifest, f, indent=4)
        
    ready_count = sum(1 for m in manifest if m["status"] == "READY")
    print(f"Manifest written to {manifest_path}")
    print(f"IMAGE_ASSETS: {ready_count}/{len(manifest)} READY.")

if __name__ == "__main__":
    main()
