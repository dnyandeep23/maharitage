import json
import os

def main():
    old_dataset_path = "src/ai/quiz-engine/v2/benchmark/v2_final_master.json"
    new_dataset_path = "src/ai/quiz-engine/v2/benchmark/v2.0.1_master.json"
    
    with open(old_dataset_path, "r") as f:
        old_data = json.load(f)
        
    target_image_id = "Fort0001_img_0863e4"
    affected_annotations = [
        "Fort0001_img_0863e4_1786974425663_0",
        "Fort0001_img_0863e4_1786974425663_1",
        "Fort0001_img_0863e4_1786974425663_2",
        "Fort0001_img_0863e4_1786974425663_3",
        "Fort0001_img_0863e4_1786977555734_0"
    ]
    
    new_data = [q for q in old_data if q["annotation_id"] not in affected_annotations]
    
    with open(new_dataset_path, "w") as f:
        json.dump(new_data, f, indent=2)
        
    print(f"Original questions: {len(old_data)}")
    print(f"Removed annotations: {len(old_data) - len(new_data)}")
    print(f"New questions: {len(new_data)}")
    print(f"Saved new dataset to {new_dataset_path}")

if __name__ == "__main__":
    main()
