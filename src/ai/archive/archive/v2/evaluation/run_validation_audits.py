import json
import os
import urllib.request
from collections import defaultdict

DATASET_PATH = "src/ai/quiz-engine/v2/dataset/pilot_annotations.json"
OUTPUT_DIR = "src/ai/quiz-engine/v2/reports"
DATASET_DIR = "src/ai/quiz-engine/v2/dataset"
os.makedirs(OUTPUT_DIR, exist_ok=True)
os.makedirs(DATASET_DIR, exist_ok=True)

def main():
    if not os.path.exists(DATASET_PATH):
        print(f"Error: {DATASET_PATH} not found.")
        return

    with open(DATASET_PATH, 'r') as f:
        data = json.load(f)

    print(f"Loaded {len(data)} items for Validation Audits.")

    # 1. Automatic Structural Review
    structural_failures = []
    
    for item in data:
        qid = item.get("annotation_id", "UNKNOWN")
        opts = item.get("options", [])
        q_text = item.get("question", "")
        
        fails = []
        if len(opts) != 4: fails.append("Not exactly 4 options.")
        if item.get("correct_option") not in ["A", "B", "C", "D"]: fails.append("Correct option not A/B/C/D.")
        if any(not o for o in opts): fails.append("Empty option found.")
        if len(set(opts)) != len(opts): fails.append("Duplicate options found.")
        
        # Correct answer repeated verbatim
        c_idx = ["A", "B", "C", "D"].index(item.get("correct_option")) if item.get("correct_option") in ["A", "B", "C", "D"] else -1
        if c_idx != -1 and opts[c_idx].lower() in q_text.lower():
            fails.append("Correct answer repeated verbatim in question.")
            
        # Option length imbalance
        if len(opts) == 4:
            lengths = [len(str(o)) for o in opts]
            if max(lengths) > min(lengths) * 3 and min(lengths) > 3:
                fails.append("Severe option length imbalance (>3x).")
                
        # Source/Visual Evidence
        if not item.get("source_evidence"): fails.append("Missing source_evidence.")
        
        if item.get("question_type") == "IMAGE_MCQ":
            if not item.get("visual_evidence"): fails.append("Missing visual_evidence.")
            if not item.get("image_url"): fails.append("Missing image_url.")
            if not str(item.get("image_url")).startswith("http"): fails.append("Invalid image_url.")

        if fails:
            structural_failures.append({
                "annotation_id": qid,
                "failures": fails
            })

    with open(f"{DATASET_DIR}/pilot_structural_audit.json", "w") as f:
        json.dump(structural_failures, f, indent=2)

    with open(f"{DATASET_DIR}/pilot_structural_audit.md", "w") as f:
        f.write("# Pilot Structural Audit\n\n")
        if not structural_failures:
            f.write("No structural failures detected.\n")
        else:
            for sf in structural_failures:
                f.write(f"### {sf['annotation_id']}\n")
                for err in sf['failures']:
                    f.write(f"- {err}\n")

    # 2. Semantic Duplicate Review (Same facts / images)
    semantic_candidates = []
    # Group by duplicate_group
    dup_groups = defaultdict(list)
    for item in data:
        dg = item.get("duplicate_group")
        if dg:
            dup_groups[dg].append(item)
    
    for dg, items in dup_groups.items():
        if len(items) > 1:
            for i in range(len(items)):
                for j in range(i+1, len(items)):
                    semantic_candidates.append({
                        "question_id_1": items[i]["annotation_id"],
                        "question_id_2": items[j]["annotation_id"],
                        "reason": "Shared duplicate_group concept.",
                        "confidence": "HIGH"
                    })

    # 3. Visual Dependency Review (Ablation cases)
    ablation_cases = []
    for item in data:
        if item.get("question_type") == "IMAGE_MCQ":
            ablation_cases.append({
                "annotation_id": item.get("annotation_id"),
                "question": item.get("question"),
                "options": item.get("options"),
                "image_url": item.get("image_url"),
                "visual_dependency_claim": item.get("visual_dependency"),
                "ablation_status": "PENDING_EXTERNAL_MODEL"
            })
    
    with open(f"{DATASET_DIR}/image_ablation_cases.json", "w") as f:
        json.dump(ablation_cases, f, indent=2)

    # 4. Difficulty Audit
    difficulty_flags = []
    for item in data:
        qid = item.get("annotation_id")
        diff = item.get("difficulty")
        rt = item.get("reasoning_type", "")
        if diff == "HARD" and rt == "DIRECT_RECALL":
            difficulty_flags.append({"annotation_id": qid, "flag": "HARD question marked as DIRECT_RECALL"})
        if diff == "EASY" and "REASONING" in rt:
            difficulty_flags.append({"annotation_id": qid, "flag": "EASY question marked as REASONING"})

    with open(f"{DATASET_DIR}/difficulty_review.json", "w") as f:
        json.dump(difficulty_flags, f, indent=2)
    with open(f"{DATASET_DIR}/difficulty_review.md", "w") as f:
        f.write("# Difficulty Review\n\n")
        if not difficulty_flags: f.write("No flags.\n")
        else:
            for df in difficulty_flags:
                f.write(f"- {df['annotation_id']}: {df['flag']}\n")

    # 5. Source-Grounding Review
    grounding_flags = []
    for item in data:
        # We manually generated these so they should be supported, but we flag for human review
        # I'll just check if answer_validity is missing or explicitly UNSUPPORTED
        val = item.get("answer_validity", "AMBIGUOUS")
        if val != "SUPPORTED":
            grounding_flags.append({
                "annotation_id": item.get("annotation_id"),
                "status": val,
                "reason": "Question is not marked SUPPORTED."
            })

    # 6. Image Quality Review
    image_issues = []
    for item in data:
        if item.get("question_type") == "IMAGE_MCQ":
            url = item.get("image_url")
            qid = item.get("annotation_id")
            # We already validated URLs in the cache script, so they should be fine, but we flag for human verification
            image_issues.append({
                "annotation_id": qid,
                "image_url": url,
                "status": "REQUIRES_HUMAN_VERIFICATION",
                "reason": "Verify visual evidence corresponds to visible content."
            })
            
    with open(f"{DATASET_DIR}/image_review.json", "w") as f:
        json.dump(image_issues, f, indent=2)
    with open(f"{DATASET_DIR}/image_review.md", "w") as f:
        f.write("# Image Quality Review\n\nAll images require human verification to guarantee pixel mapping.\n")
        for iss in image_issues:
            f.write(f"- {iss['annotation_id']} : {iss['image_url']}\n")

    # 7. Human Review Queue
    # We will enqueue ALL questions since the prompt says "Review decision: KEEP/REVISE/REJECT... Do not mark anything HUMAN_REVIEWED automatically."
    # Wait, the prompt says "Include every question that requires human review".
    # If structural/semantic/difficulty issues exist, we enqueue them. I will enqueue all questions just to be thorough as a pilot needs 100% human review.
    # Actually, I'll enqueue only the flagged ones + the image ones. Let's just enqueue all 50 since it's the pilot.
    with open(f"{OUTPUT_DIR}/human_review_queue.md", "w") as f:
        f.write("# V2 Pilot Human Review Queue\n\n")
        for item in data:
            f.write(f"### {item.get('annotation_id')}\n")
            f.write(f"**Reason for Review:** Pilot Dataset Verification\n")
            f.write(f"**Question:** {item.get('question')}\n")
            f.write("**Options:**\n")
            for i, opt in enumerate(item.get("options", [])):
                f.write(f"  {['A','B','C','D'][i]}. {opt}\n")
            f.write(f"**Correct Answer:** {item.get('correct_option')}\n")
            f.write(f"**Source Evidence:** {item.get('source_evidence')}\n")
            if item.get("question_type") == "IMAGE_MCQ":
                f.write(f"**Image URL:** {item.get('image_url')}\n")
                f.write(f"**Visual Evidence:** {item.get('visual_evidence')}\n")
            f.write("**Review Decision:** `[ KEEP | REVISE | REJECT ]`\n")
            f.write("---\n")

    # 8. Pilot Validation Report
    val_status = "PASS"
    if structural_failures or semantic_candidates or difficulty_flags or grounding_flags:
        val_status = "PASS_WITH_REVISIONS"

    with open(f"{OUTPUT_DIR}/pilot_validation_report.md", "w") as f:
        f.write("# V2 Pilot Validation Report\n\n")
        f.write(f"- **Structural Failures:** {len(structural_failures)}\n")
        f.write(f"- **Semantic Duplicate Candidates:** {len(semantic_candidates)}\n")
        f.write(f"- **Source-Grounding Issues:** {len(grounding_flags)}\n")
        f.write(f"- **Visual Dependency Status:** PENDING_EXTERNAL_MODEL (Cases: {len(ablation_cases)})\n")
        f.write(f"- **Image Issues Flagged for Review:** {len(image_issues)}\n")
        f.write(f"- **Difficulty Issues:** {len(difficulty_flags)}\n")
        f.write(f"- **Human Review Count:** {len(data)}\n")
        f.write(f"- **Final Recommendation:** Proceed to Human Review.\n\n")
        f.write(f"**PILOT_VALIDATION_STATUS:** {val_status}\n")

    print(f"\nFinal Output:")
    print(f"PILOT_VALIDATION_STATUS: {val_status}")
    print(f"HUMAN_REVIEW_REQUIRED: {len(data)}")
    print(f"NEXT_STEP: HUMAN_REVIEW")

if __name__ == "__main__":
    main()
