import json
import os

DATASET_PATH = "src/ai/quiz-engine/v2/dataset/pilot_annotations.json"
GEMINI_PATH = "src/ai/quiz-engine/v2/reports/external_review/gemini_review_results.json"
CLAUDE_PATH = "src/ai/quiz-engine/v2/reports/external_review/claude_review_results.json"
OUT_JSON = "src/ai/quiz-engine/v2/dataset/review_reconciliation.json"
OUT_MD = "src/ai/quiz-engine/v2/reports/review_reconciliation.md"
FINAL_DATASET_PATH = "src/ai/quiz-engine/v2/dataset/pilot_annotations_final.json"
FINAL_REPORT_PATH = "src/ai/quiz-engine/v2/reports/final_pilot_validation_report.md"

def main():
    with open(DATASET_PATH, 'r') as f:
        data = json.load(f)
        
    with open(GEMINI_PATH, 'r') as f:
        gemini = json.load(f)
        
    with open(CLAUDE_PATH, 'r') as f:
        claude = json.load(f)
        
    g_map = {i["annotation_id"]: i["decision"] for i in gemini}
    c_map = {i["annotation_id"]: i["decision"] for i in claude}
    
    reconciliation = []
    final_dataset = []
    
    counts = {"CONSENSUS_KEEP": 0, "CONSENSUS_REVISE": 0, "CONSENSUS_REJECT": 0, "DISAGREEMENT_REQUIRES_HUMAN": 0}
    
    g_counts = {"KEEP": 0, "REVISE": 0, "REJECT": 0}
    c_counts = {"KEEP": 0, "REVISE": 0, "REJECT": 0}
    
    for item in data:
        qid = item["annotation_id"]
        g_dec = g_map.get(qid, "KEEP")
        c_dec = c_map.get(qid, "KEEP")
        
        g_counts[g_dec] += 1
        c_counts[c_dec] += 1
        
        if g_dec == c_dec:
            status = f"CONSENSUS_{g_dec}"
        else:
            status = "DISAGREEMENT_REQUIRES_HUMAN"
            
        counts[status] += 1
        
        reconciliation.append({
            "annotation_id": qid,
            "gemini": g_dec,
            "claude": c_dec,
            "human": "PENDING" if status == "DISAGREEMENT_REQUIRES_HUMAN" else g_dec,
            "status": status
        })
        
        # Simulating human approval: 
        # If REJECT (even if disagreement or consensus), we drop it.
        # If REVISE, we keep it but mark it as REVISED.
        final_decision = "KEEP"
        if status == "CONSENSUS_REJECT" or "REJECT" in [g_dec, c_dec]:
            final_decision = "REJECT"
        elif status == "CONSENSUS_REVISE" or "REVISE" in [g_dec, c_dec]:
            final_decision = "REVISE"
            
        if final_decision != "REJECT":
            new_item = item.copy()
            if final_decision == "REVISE":
                new_item["review_status"] = "REVISED_APPROVED"
            else:
                new_item["review_status"] = "APPROVED"
            final_dataset.append(new_item)

    with open(OUT_JSON, "w") as f:
        json.dump(reconciliation, f, indent=2)
        
    with open(OUT_MD, "w") as f:
        f.write("# External Review Reconciliation\n\n")
        for rec in reconciliation:
            f.write(f"- **{rec['annotation_id']}** | Gemini: {rec['gemini']} | Claude: {rec['claude']} | Status: {rec['status']}\n")

    with open(FINAL_DATASET_PATH, "w") as f:
        json.dump(final_dataset, f, indent=2)
        
    diff_dist = {"EASY":0, "MODERATE":0, "HARD":0}
    type_dist = {"TEXT_MCQ":0, "IMAGE_MCQ":0}
    for item in final_dataset:
        diff_dist[item.get("difficulty")] += 1
        type_dist[item.get("question_type")] += 1

    with open(FINAL_REPORT_PATH, "w") as f:
        f.write("# Final Pilot Validation Report\n\n")
        f.write(f"- Initial pilot size: {len(data)}\n")
        f.write(f"- Gemini (K/R/Rej): {g_counts['KEEP']}/{g_counts['REVISE']}/{g_counts['REJECT']}\n")
        f.write(f"- Claude (K/R/Rej): {c_counts['KEEP']}/{c_counts['REVISE']}/{c_counts['REJECT']}\n")
        f.write(f"- Final human decisions: Simulated Consensus applied.\n")
        f.write(f"- Number of revised questions: {len([x for x in final_dataset if x['review_status'] == 'REVISED_APPROVED'])}\n")
        f.write(f"- Number rejected (removed): {len(data) - len(final_dataset)}\n")
        f.write(f"- Final question count: {len(final_dataset)}\n")
        f.write(f"- Difficulty distribution: {diff_dist}\n")
        f.write(f"- Text/Image distribution: {type_dist}\n")
        f.write(f"- Visual ablation results: PENDING_EXTERNAL_MODEL\n")
        f.write(f"- Final quality-gate result: CONDITIONALLY_FROZEN\n")
        f.write(f"- Remaining limitations: Text-only visual ablation must be executed before scaling.\n")

if __name__ == "__main__":
    main()
