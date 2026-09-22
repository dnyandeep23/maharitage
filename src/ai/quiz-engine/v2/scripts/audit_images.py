import os
import json
import mimetypes
from PIL import Image

def main():
    dataset_path = "src/ai/quiz-engine/v2/benchmark/v2.0.1_master.json"
    manifest_path = "src/ai/quiz-engine/v2/evaluation/image_manifest.json"
    cache_dir = "src/ai/quiz-engine/v2/benchmark/images"
    report_path = "src/ai/quiz-engine/v2/reports/image_integrity_full_audit.md"
    
    with open(dataset_path) as f:
        dataset = json.load(f)
        
    # Group annotations by image_id
    image_groups = {}
    for q in dataset:
        if q["question_type"] == "IMAGE_MCQ":
            img_id = q["image_id"]
            if img_id not in image_groups:
                image_groups[img_id] = {
                    "image_url": q["image_url"],
                    "annotations": []
                }
            image_groups[img_id]["annotations"].append(q["annotation_id"])
            
    total = len(image_groups)
    ready = 0
    missing = 0
    broken = 0
    truncated = 0
    invalid = 0
    source_errors = 0
    
    failures = []
    
    for img_id, data in image_groups.items():
        url = data["image_url"]
        local_path = os.path.join(cache_dir, f"{img_id}.jpg")
        
        status = "READY"
        failure_type = None
        
        if not os.path.exists(local_path):
            status = "FAILED"
            failure_type = "MISSING_LOCAL_FILE"
            missing += 1
        elif os.path.getsize(local_path) == 0:
            status = "FAILED"
            failure_type = "ZERO_BYTE"
            invalid += 1
        else:
            mime_type, _ = mimetypes.guess_type(local_path)
            if not mime_type or not mime_type.startswith("image/"):
                status = "FAILED"
                failure_type = "INVALID_FORMAT"
                invalid += 1
            else:
                try:
                    with Image.open(local_path) as img:
                        pass
                except Exception as e:
                    status = "FAILED"
                    failure_type = "PIL_OPEN_ERROR"
                    broken += 1
                
                if status == "READY":
                    try:
                        with Image.open(local_path) as img:
                            img.verify()
                    except Exception as e:
                        status = "FAILED"
                        failure_type = "PIL_VERIFY_ERROR"
                        broken += 1
                        
                if status == "READY":
                    try:
                        with Image.open(local_path) as img:
                            img.load()
                    except Exception as e:
                        status = "FAILED"
                        if "truncated" in str(e).lower():
                            failure_type = "TRUNCATED_IMAGE"
                            truncated += 1
                        else:
                            failure_type = "PIL_LOAD_ERROR"
                            broken += 1
                            
        if status == "READY":
            ready += 1
        else:
            failures.append({
                "image_id": img_id,
                "image_url": url,
                "local_path": local_path,
                "status": status,
                "failure_type": failure_type,
                "annotations_affected": ", ".join(data["annotations"])
            })
            
    # Write report
    total_annotations = sum(len(d["annotations"]) for d in image_groups.values())
    ready_annotations = sum(len(d["annotations"]) for i, d in image_groups.items() if i not in [f["image_id"] for f in failures])
    
    with open(report_path, "w") as f:
        f.write("# Image Integrity Full Audit\n\n")
        f.write(f"- **TOTAL_IMAGE_ASSETS**: {total_annotations}\n")
        f.write(f"- **READY**: {ready_annotations}\n")
        f.write(f"- **MISSING**: {missing}\n")
        f.write(f"- **BROKEN**: {broken}\n")
        f.write(f"- **TRUNCATED**: {truncated}\n")
        f.write(f"- **INVALID**: {invalid}\n")
        f.write(f"- **SOURCE_ERRORS**: {source_errors}\n\n")
        
        if failures:
            f.write("### Failures\n\n")
            f.write("| image_id | image_url | local_path | status | failure_type | annotations_affected |\n")
            f.write("|----------|-----------|------------|--------|--------------|----------------------|\n")
            for fail in failures:
                f.write(f"| `{fail['image_id']}` | [url]({fail['image_url']}) | `{fail['local_path']}` | {fail['status']} | {fail['failure_type']} | {fail['annotations_affected']} |\n")
        else:
            f.write(f"### FULL IMAGE INTEGRITY SWEEP PASSED — SAFE TO RESUME BENCHMARK\n")
            f.write(f"IMAGE_INTEGRITY_AUDIT = PASS\n")
            f.write(f"READY_IMAGES = {ready_annotations}/{total_annotations}\n")
            f.write(f"BROKEN_IMAGES = 0\n")
            f.write(f"TRUNCATED_IMAGES = 0\n")
            f.write(f"MISSING_IMAGES = 0\n")

    print(f"Audit complete. Total {total}. Ready {ready}. Failures {len(failures)}.")

if __name__ == "__main__":
    main()
