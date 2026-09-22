import json
import os
import sys

DATASET_PATH = "src/ai/quiz-engine/v2/dataset/pilot_annotations_final.json"

def run_audit():
    if not os.path.exists(DATASET_PATH):
        print(f"Error: Dataset not found at {DATASET_PATH}")
        sys.exit(1)

    with open(DATASET_PATH, 'r') as f:
        data = json.load(f)

    print(f"Starting V2 Pilot Quality Audit on {len(data)} items...\n")

    errors = []
    
    exact_questions = set()
    exact_ids = set()
    
    categories = {}
    difficulties = {}
    sites = set()
    image_count = 0
    text_count = 0

    for i, item in enumerate(data):
        qid = item.get("annotation_id", f"index_{i}")
        q_text = item.get("question", "")
        
        # Exact Duplicates
        if qid in exact_ids:
            errors.append(f"[{qid}] Duplicate annotation_id.")
        exact_ids.add(qid)
        
        if q_text in exact_questions:
            errors.append(f"[{qid}] Exact duplicate question text: '{q_text}'")
        exact_questions.add(q_text)

        # Options check
        options = item.get("options", [])
        if len(options) != 4:
            errors.append(f"[{qid}] Does not have exactly 4 options. Found {len(options)}.")
        
        # Correct option
        correct = item.get("correct_option")
        if correct not in ["A", "B", "C", "D"]:
            errors.append(f"[{qid}] Invalid correct_option: {correct}")
        
        # Option length bias
        if len(options) == 4:
            lengths = [len(opt) for opt in options]
            min_len = min(lengths)
            max_len = max(lengths)
            # If the longest is more than 5x the shortest and shortest > 3 chars, flag it
            if min_len > 3 and max_len > min_len * 5:
                errors.append(f"[{qid}] Potential option length leakage. Min: {min_len}, Max: {max_len}")
        
        # Answer Validity
        if item.get("answer_validity") != "SUPPORTED":
            errors.append(f"[{qid}] answer_validity is not SUPPORTED.")
            
        if item.get("distractor_quality") != "GOOD":
            errors.append(f"[{qid}] distractor_quality is not GOOD.")

        if item.get("review_status") not in ["DRAFT", "AUTO_VALIDATED", "APPROVED", "REVISED_APPROVED"]:
            errors.append(f"[{qid}] review_status is not valid.")
            
        if not item.get("source_evidence"):
            errors.append(f"[{qid}] Missing source_evidence.")

        # Type checks
        q_type = item.get("question_type")
        if q_type == "IMAGE_MCQ":
            image_count += 1
            if not item.get("image_url"):
                errors.append(f"[{qid}] IMAGE_MCQ missing image_url.")
            if not item.get("visual_evidence"):
                errors.append(f"[{qid}] IMAGE_MCQ missing visual_evidence.")
            if not item.get("visible_feature"):
                errors.append(f"[{qid}] IMAGE_MCQ missing visible_feature.")
            vd = item.get("visual_dependency")
            if vd not in ["MEDIUM", "HIGH"]:
                errors.append(f"[{qid}] IMAGE_MCQ has invalid visual_dependency: {vd}")
        elif q_type == "TEXT_MCQ":
            text_count += 1
        else:
            errors.append(f"[{qid}] Invalid question_type: {q_type}")
            
        # Meta stats
        cat = item.get("category")
        categories[cat] = categories.get(cat, 0) + 1
        
        diff = item.get("difficulty")
        difficulties[diff] = difficulties.get(diff, 0) + 1
        
        sites.add(item.get("site_id"))

    print("--- Distribution Stats ---")
    print(f"Total Questions: {len(data)}")
    print(f"TEXT_MCQ: {text_count} | IMAGE_MCQ: {image_count}")
    print(f"Sites Covered: {len(sites)} {list(sites)}")
    print(f"Difficulties: {difficulties}")
    print(f"Categories: {categories}")
    print("--------------------------\n")

    print("--- Audit Results ---")
    if len(errors) == 0:
        print("0 exact duplicates found.")
        print("0 unsupported answers found.")
        print("100% 4-option validity.")
        print("100% IMAGE_MCQ compliance (URL, dependency, evidence).")
        print("\nPILOT_QUALITY_GATE: PASS")
    else:
        print(f"Found {len(errors)} errors:")
        for err in errors:
            print(f" - {err}")
        print("\nPILOT_QUALITY_GATE: FAIL")
        sys.exit(1)

if __name__ == "__main__":
    run_audit()
