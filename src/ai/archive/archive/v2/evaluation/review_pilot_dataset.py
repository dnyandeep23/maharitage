import json
import os

DATASET_PATH = "src/ai/quiz-engine/v2/dataset/pilot_annotations.json"

def main():
    if not os.path.exists(DATASET_PATH):
        print(f"Error: Could not find {DATASET_PATH}")
        return

    with open(DATASET_PATH, 'r') as f:
        data = json.load(f)

    print("==================================================")
    print(f"V2 PILOT DATASET REVIEW REPORT ({len(data)} items)")
    print("==================================================\n")

    for i, item in enumerate(data):
        print(f"[{i+1}/{len(data)}] annotation_id: {item.get('annotation_id')}")
        print(f"Site: {item.get('site_id')} - {item.get('site_name')}")
        print(f"Category: {item.get('category')} | Difficulty: {item.get('difficulty')}")
        print(f"Review Status: {item.get('review_status')}")
        print(f"Duplicate Group: {item.get('duplicate_group')}")
        print("-" * 50)
        print(f"Q: {item.get('question')}")
        opts = item.get('options', [])
        letters = ["A", "B", "C", "D"]
        for j, opt in enumerate(opts):
            prefix = letters[j] if j < len(letters) else "?"
            mark = "[*]" if prefix == item.get("correct_option") else "[ ]"
            print(f"  {mark} {prefix}. {opt}")
        
        print("-" * 50)
        print(f"Source Evidence: {item.get('source_evidence')}")
        
        if item.get("question_type") == "IMAGE_MCQ":
            print(f"Visual Dependency: {item.get('visual_dependency')}")
            print(f"Visual Evidence: {item.get('visual_evidence')}")
            print(f"Visible Feature: {item.get('visible_feature')}")
            print(f"Image URL: {item.get('image_url')}")
            
        print("==================================================\n")

if __name__ == "__main__":
    main()
