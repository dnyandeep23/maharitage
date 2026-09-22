import json
import os
import statistics

DATASET_PATH = "src/ai/quiz-engine/v2/dataset/pilot_annotations.json"
GEMINI_REVIEW_PATH = "src/ai/quiz-engine/v2/reports/external_review/gemini_review_results.json"
DATASET_OUT = "src/ai/quiz-engine/v2/dataset/reviewed_pilot_annotations.json"

DIFF_REC_JSON = "src/ai/quiz-engine/v2/dataset/difficulty_reconciliation.json"
DIFF_REC_MD = "src/ai/quiz-engine/v2/dataset/difficulty_reconciliation.md"

OPT_BAL_JSON = "src/ai/quiz-engine/v2/dataset/option_balance_reconciliation.json"
OPT_BAL_MD = "src/ai/quiz-engine/v2/dataset/option_balance_reconciliation.md"

ABLATION_JSON = "src/ai/quiz-engine/v2/dataset/image_ablation_cases.json"
HUMAN_Q_MD = "src/ai/quiz-engine/v2/reports/external_review/human_review_queue.md"
CLAUDE_PKG_MD = "src/ai/quiz-engine/v2/reports/external_review/EXTERNAL_REVIEW_PACKAGE.md"

def main():
    with open(DATASET_PATH, 'r') as f:
        data = json.load(f)
        
    with open(GEMINI_REVIEW_PATH, 'r') as f:
        gemini = json.load(f)
        
    gemini_map = {item["annotation_id"]: item for item in gemini}
    
    reviewed_data = []
    
    # 2. Revise Flagged Questions & 1. Import Gemini Review
    revise_items = []
    for item in data:
        new_item = item.copy()
        q_id = item["annotation_id"]
        gem_rev = gemini_map.get(q_id)
        if gem_rev:
            new_item["gemini_review"] = gem_rev
            if gem_rev["decision"] == "REVISE":
                new_item["review_status"] = "NEEDS_REVISION"
                # Simulated proposed revision
                new_item["proposed_revision"] = "Adjust difficulty to match reasoning type, or rewrite question to enforce multi-hop reasoning."
                revise_items.append(new_item)
        reviewed_data.append(new_item)

    with open(DATASET_OUT, "w") as f:
        json.dump(reviewed_data, f, indent=2)

    # 3. Difficulty Audit
    difficulty_flags = []
    for item in reviewed_data:
        q_id = item["annotation_id"]
        diff = item["difficulty"]
        rt = item.get("reasoning_type", "")
        
        flag = None
        if diff == "EASY" and rt not in ["DIRECT_RECALL", "VISUAL_RECOGNITION", "MATERIAL_IDENTIFICATION"]:
            flag = "EASY but requires multi-step reasoning."
        elif diff == "MODERATE" and rt in ["DIRECT_RECALL"]:
            flag = "MODERATE but direct recall."
        elif diff == "HARD" and rt in ["DIRECT_RECALL", "VISUAL_RECOGNITION"]:
            flag = "HARD but direct recall."
            
        if flag:
            difficulty_flags.append({
                "annotation_id": q_id,
                "difficulty": diff,
                "reasoning_type": rt,
                "flag": flag
            })
            
    with open(DIFF_REC_JSON, "w") as f:
        json.dump(difficulty_flags, f, indent=2)
        
    with open(DIFF_REC_MD, "w") as f:
        f.write("# Difficulty Reconciliation\n\n")
        for df in difficulty_flags:
            f.write(f"- **{df['annotation_id']}** ({df['difficulty']} / {df['reasoning_type']}): {df['flag']}\n")

    # 4. Option Balance Audit
    option_flags = []
    for item in reviewed_data:
        q_id = item["annotation_id"]
        opts = item.get("options", [])
        c_opt = item.get("correct_option")
        if not opts or c_opt not in ["A","B","C","D"]: continue
        
        c_idx = ["A","B","C","D"].index(c_opt)
        lengths = [len(str(o)) for o in opts]
        
        c_len = lengths[c_idx]
        d_lengths = [l for i, l in enumerate(lengths) if i != c_idx]
        mean_d = sum(d_lengths) / max(1, len(d_lengths))
        
        if mean_d > 0:
            if c_len > mean_d * 1.5:
                option_flags.append({"annotation_id": q_id, "flag": "Correct option is >1.5x longer than mean distractor.", "c_len": c_len, "mean_d": mean_d})
            elif c_len < mean_d * 0.5:
                option_flags.append({"annotation_id": q_id, "flag": "Correct option is <0.5x shorter than mean distractor.", "c_len": c_len, "mean_d": mean_d})
                
    with open(OPT_BAL_JSON, "w") as f:
        json.dump(option_flags, f, indent=2)
        
    with open(OPT_BAL_MD, "w") as f:
        f.write("# Option Balance Reconciliation\n\n")
        for of in option_flags:
            f.write(f"- **{of['annotation_id']}**: {of['flag']} (Correct len: {of['c_len']}, Mean Distractor len: {of['mean_d']:.1f})\n")

    # 5. Image Ablation Dataset
    ablation_cases = []
    for item in reviewed_data:
        if item.get("question_type") == "IMAGE_MCQ":
            ablation_cases.append({
                "annotation_id": item["annotation_id"],
                "image_url": item["image_url"],
                "ablation_status": "PENDING",
                "MODE_A": {
                    "context": "image + question + options",
                    "question": item["question"],
                    "options": item["options"],
                    "correct_option": item["correct_option"]
                },
                "MODE_B": {
                    "context": "question + options only",
                    "question": item["question"],
                    "options": item["options"],
                    "correct_option": item["correct_option"]
                }
            })
            
    with open(ABLATION_JSON, "w") as f:
        json.dump(ablation_cases, f, indent=2)

    # 6. Human Review Queue
    human_queue_ids = set()
    for item in revise_items: human_queue_ids.add(item["annotation_id"])
    for df in difficulty_flags: human_queue_ids.add(df["annotation_id"])
    for of in option_flags: human_queue_ids.add(of["annotation_id"])
    for ac in ablation_cases: human_queue_ids.add(ac["annotation_id"])
    
    with open(HUMAN_Q_MD, "w") as f:
        f.write("# Human Review Queue\n\n")
        for item in reviewed_data:
            qid = item["annotation_id"]
            if qid in human_queue_ids:
                f.write(f"### {qid}\n")
                if qid in [x["annotation_id"] for x in revise_items]:
                    f.write("**Gemini REVISE Flagged**\n")
                    f.write(f"Proposed Revision: {item.get('proposed_revision')}\n")
                if qid in [x["annotation_id"] for x in difficulty_flags]:
                    f.write(f"**Difficulty Flagged**\n")
                if qid in [x["annotation_id"] for x in option_flags]:
                    f.write(f"**Option Balance Flagged**\n")
                if qid in [x["annotation_id"] for x in ablation_cases]:
                    f.write(f"**Pending Visual Ablation (IMAGE_MCQ)**\n")
                    
                f.write(f"\nQuestion: {item['question']}\n")
                for i, opt in enumerate(item.get("options", [])):
                    f.write(f"  {['A','B','C','D'][i]}. {opt}\n")
                f.write(f"Correct: {item['correct_option']}\n\n")
                f.write("[ KEEP | REVISE | REJECT ]\n")
                f.write("Comments:\n---\n\n")

    # 7. Claude Review Package
    with open(CLAUDE_PKG_MD, "w") as f:
        f.write("# External Review Package - For Claude\n\n")
        f.write("Please independently review the following pilot items against the criteria in EXTERNAL_REVIEW_PROMPT.md.\n\n")
        for item in data:  # Send original data, no gemini reviews
            f.write(f"### {item['annotation_id']}\n")
            f.write(f"Site: {item.get('site_id')}\n")
            f.write(f"Category: {item.get('category')} | Difficulty: {item.get('difficulty')}\n")
            f.write(f"Question: {item['question']}\n")
            for i, opt in enumerate(item.get("options", [])):
                f.write(f"  {['A','B','C','D'][i]}. {opt}\n")
            f.write(f"Evidence: {item.get('source_evidence')}\n")
            if item.get("question_type") == "IMAGE_MCQ":
                f.write(f"Visual Evidence: {item.get('visual_evidence')}\n")
            f.write("---\n")

    print("Reconciliation audits complete.")
    print("PILOT_STATUS is NOT FROZEN.")

if __name__ == "__main__":
    main()
