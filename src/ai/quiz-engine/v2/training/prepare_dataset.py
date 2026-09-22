import os
import json
import hashlib
import sys
from PIL import Image

sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '..', 'scripts')))
from benchmark_core.prompt import format_question

V2_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), '..'))
MASTER_JSON = os.path.join(V2_DIR, 'benchmark', 'v2.0.1_master.json')
TRAIN_SPLIT = os.path.join(V2_DIR, 'dataset', 'splits', 'train.json')
VAL_SPLIT = os.path.join(V2_DIR, 'dataset', 'splits', 'validation.json')
TEST_SPLIT = os.path.join(V2_DIR, 'dataset', 'splits', 'test.json')
IMAGE_DIR = os.path.join(V2_DIR, 'benchmark', 'images')
OUTPUT_DIR = os.path.join(V2_DIR, 'training', 'data')

def verify_dataset():
    with open(MASTER_JSON, 'rb') as f:
        data_bytes = f.read()
    sha = hashlib.sha256(data_bytes).hexdigest()
    if sha != "3951af0d0c4de8874e6ef963645ecd0110b359f03c246cc692ec4ee4f3e97b63":
        print(f"ERROR: Dataset hash mismatch: {sha}")
        sys.exit(1)
    print(f"Dataset verified. SHA-256: {sha}")
    
    master = json.loads(data_bytes.decode('utf-8'))
    master_map = {q['annotation_id']: q for q in master}
    return master_map

def get_image_path(image_id, manifest_data):
    for item in manifest_data:
        if item.get("image_id") == image_id:
            return os.path.join(V2_DIR, 'benchmark', 'images', os.path.basename(item['local_path']))
    return None

def prepare_split(master_map, manifest_data, split_path, split_name, expected_count):
    with open(split_path, 'r') as f:
        split_data = json.load(f)
    
    split_ids = split_data['annotation_ids']
    valid_records = []
    
    for aid in split_ids:
        if aid in master_map:
            valid_records.append(master_map[aid])
            
    if len(valid_records) != expected_count:
        print(f"ERROR: Split {split_name} count mismatch. Expected {expected_count}, got {len(valid_records)}")
        sys.exit(1)
        
    print(f"Split {split_name} successfully resolved {len(valid_records)} valid records.")
    
    output_records = []
    for q in valid_records:
        prompt_text = format_question(q)
        content = []
        
        abs_img_path = None
        if q['question_type'] == 'IMAGE_MCQ':
            img_path = get_image_path(q['image_id'], manifest_data)
            if not img_path or not os.path.exists(img_path):
                print(f"ERROR: Missing image for ID {q['image_id']}: {img_path}")
                sys.exit(1)
            try:
                with Image.open(img_path) as img:
                    img.verify()
            except Exception as e:
                print(f"ERROR: Corrupted image: {img_path} - {e}")
                sys.exit(1)
            abs_img_path = os.path.abspath(img_path)
            content.append({"type": "image", "image": f"file://{abs_img_path}"})
            
        content.append({"type": "text", "text": prompt_text})
        target_text = f"ANSWER: {q['answer']}"
        
        record = {
            "messages": [
                {"role": "user", "content": content},
                {"role": "assistant", "content": [{"type": "text", "text": target_text}]}
            ]
        }
        
        if abs_img_path:
            # Explicit images column for robust TRL loading
            record["images"] = [abs_img_path]
            
        output_records.append(record)
        
    os.makedirs(OUTPUT_DIR, exist_ok=True)
    out_file = os.path.join(OUTPUT_DIR, f"{split_name}.jsonl")
    with open(out_file, 'w') as f:
        for r in output_records:
            f.write(json.dumps(r) + '\n')
            
    print(f"Saved {split_name} to {out_file}")

if __name__ == "__main__":
    print("Preparing dataset for fine-tuning...")
    master_map = verify_dataset()
    manifest_path = os.path.join(V2_DIR, 'evaluation', 'image_manifest.json')
    with open(manifest_path, 'r') as f:
        manifest_data = json.load(f)
    prepare_split(master_map, manifest_data, TRAIN_SPLIT, "train", 657)
    prepare_split(master_map, manifest_data, VAL_SPLIT, "validation", 23)
    prepare_split(master_map, manifest_data, TEST_SPLIT, "test", 54)
    print("Dataset preparation complete.")
