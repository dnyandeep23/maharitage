import json
import os

DATA_PATH = "src/ai/quiz-engine/v2/reports/external_review/pilot_annotations.json"
OUTPUT_DIR = "src/ai/quiz-engine/v2/reports/external_review/questions"
os.makedirs(OUTPUT_DIR, exist_ok=True)

def main():
    if not os.path.exists(DATA_PATH):
        print("Data not found.")
        return

    with open(DATA_PATH, "r") as f:
        data = json.load(f)

    for item in data:
        qid = item.get("annotation_id")
        filepath = os.path.join(OUTPUT_DIR, f"{qid}.md")
        
        with open(filepath, "w") as f:
            f.write(f"# Question Review: {qid}\n\n")
            f.write(f"- **Site:** {item.get('site_id')} - {item.get('site_name')}\n")
            f.write(f"- **Category:** {item.get('category')}\n")
            f.write(f"- **Difficulty:** {item.get('difficulty')}\n")
            f.write(f"- **Duplicate Status:** {item.get('duplicate_status')} ({item.get('duplicate_group', '')})\n\n")
            f.write(f"## Question\n{item.get('question')}\n\n")
            
            opts = item.get('options', [])
            f.write("## Options\n")
            f.write(f"A. {opts[0] if len(opts)>0 else ''}\n")
            f.write(f"B. {opts[1] if len(opts)>1 else ''}\n")
            f.write(f"C. {opts[2] if len(opts)>2 else ''}\n")
            f.write(f"D. {opts[3] if len(opts)>3 else ''}\n\n")
            
            f.write(f"**Correct Answer:** {item.get('correct_option')}\n\n")
            f.write(f"## Evidence\n")
            f.write(f"- **Source Evidence:** {item.get('source_evidence')}\n")
            
            if item.get("question_type") == "IMAGE_MCQ":
                f.write(f"- **Visual Evidence:** {item.get('visual_evidence')}\n")
                f.write(f"- **Visual Dependency:** {item.get('visual_dependency')}\n")
                f.write(f"- **Image URL:** {item.get('image_url')}\n")
            
            f.write("\n---\n\n")
            f.write("## Review Form\n\n")
            f.write("Please provide your review decision here:\n\n")
            f.write("```\n")
            f.write("[ KEEP | REVISE | REJECT ]\n\n")
            f.write("Reason:\n")
            f.write("<text>\n")
            f.write("```\n")

    print(f"Generated {len(data)} review files in {OUTPUT_DIR}")

if __name__ == "__main__":
    main()
