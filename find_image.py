import json, os, hashlib
from pathlib import Path

def run():
    base_dir = "src/ai/quiz-engine/v2/dataset"
    for site in os.listdir(base_dir):
        ann_path = os.path.join(base_dir, site, "image", "annotations.json")
        if os.path.exists(ann_path):
            with open(ann_path) as f:
                data = json.load(f)
                for q in data:
                    if q.get('image_url'):
                        url = q['image_url']
                        url_hash = hashlib.md5(url.encode()).hexdigest()[:6]
                        img_id = f"{site}_img_{url_hash}"
                        print(f"{img_id} -> {url}")
                        break
run()
