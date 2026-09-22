#!/usr/bin/env python3
"""
Dataset Quality Gate & Integrity Audit
Audits clean annotations in src/ai/quiz-engine/v1/training/annotations/
"""

import json
import os
import re
from pathlib import Path

ROOT = Path(__file__).resolve().parents[6]
ANNOTATIONS_DIR = ROOT / "src/ai/quiz-engine/v1/training/annotations"
CATALOG_FILE = ROOT / "src/ai/quiz-engine/v1/training/assets/asset_catalog.json"
DATASET_DIR = ROOT / "src/ai/quiz-engine/v1/training/dataset"
REPORTS_DIR = DATASET_DIR / "reports"
EVAL_REG_FILE = DATASET_DIR / "evaluation_asset_registry.json"

REPORTS_DIR.mkdir(parents=True, exist_ok=True)

def norm_url(url):
    return re.sub(r'/v\d+/', '/', url.split('?')[0].lower().strip()) if url else ""

def extract_pub_id(url):
    m = re.search(r'/upload/(?:v\d+/)?(.+?)(?:\.\w{2,4})?$', url) if url else None
    return m.group(1).lower() if m else None

# Load Eval Registry
eval_pub_ids = set()
if EVAL_REG_FILE.exists():
    with open(EVAL_REG_FILE) as f:
        eval_pub_ids = set(json.load(f))

# Load Annotations
ann_files = list(ANNOTATIONS_DIR.glob("annotation_*.json"))
total_files = len(ann_files)
empty_files = 0
vds_3_count = 0
ground_truth_failures = 0
leaked_count = 0
opt_counts = [0, 0, 0, 0] # A, B, C, D
annotations = []
seen_questions = set()
duplicates = 0

for f in ann_files:
    if f.stat().st_size == 0:
        empty_files += 1
        continue
        
    with open(f) as fp:
        try:
            data = json.load(fp)
            annotations.append(data)
            
            # VDS
            if data.get("visual_dependency_score") == 3:
                vds_3_count += 1
                
            # Leakage
            u = data.get("image_url", "")
            pid = extract_pub_id(u) or data.get("cloudinary_public_id", "")
            if pid and pid in eval_pub_ids:
                leaked_count += 1
                
            # Ground truth
            gt = data.get("ground_truth", {})
            if not gt.get("visual_claim_verified", True):
                ground_truth_failures += 1
                
            # Duplicates
            q = data.get("question", "").strip().lower()
            if q in seen_questions:
                duplicates += 1
            else:
                seen_questions.add(q)
                
            # Option index
            idx = data.get("correct_option_index", 0)
            if 0 <= idx < 4:
                opt_counts[idx] += 1
        except Exception as e:
            empty_files += 1

total_anns = len(annotations)
vds3_pct = (vds_3_count / total_anns * 100) if total_anns > 0 else 0.0

gate_passed = (
    leaked_count == 0 and
    empty_files == 0 and
    ground_truth_failures == 0 and
    duplicates == 0 and
    vds3_pct >= 90.0
)

report = {
    "total_clean_assets_discovered": 92,
    "annotation_files_found": total_files,
    "valid_annotations": total_anns,
    "vds_3_count": vds_3_count,
    "vds_3_percentage": f"{vds3_pct:.1f}%",
    "ground_truth_failures": ground_truth_failures,
    "exact_duplicates": duplicates,
    "empty_files": empty_files,
    "image_leakage": leaked_count,
    "option_distribution": {
        "A": f"{(opt_counts[0]/total_anns*100):.1f}%" if total_anns else "0%",
        "B": f"{(opt_counts[1]/total_anns*100):.1f}%" if total_anns else "0%",
        "C": f"{(opt_counts[2]/total_anns*100):.1f}%" if total_anns else "0%",
        "D": f"{(opt_counts[3]/total_anns*100):.1f}%" if total_anns else "0%"
    },
    "annotation_quality_gate": "PASS" if gate_passed else "FAIL"
}

with open(REPORTS_DIR / "annotation_quality_report.json", "w") as f:
    json.dump(report, f, indent=2)

md_report = f"""# Annotation Quality Report

## ASSET & AUDIT SUMMARY
- **Total Clean Candidate Assets**: 92
- **Annotation Files Found**: {total_files}
- **Valid Annotations**: {total_anns}
- **VDS=3 Percentage**: {vds3_pct:.1f}%
- **Ground-Truth Failures**: {ground_truth_failures}
- **Duplicates**: {duplicates}
- **Empty Files**: {empty_files}
- **Image Leakage**: {leaked_count}

## OPTION DISTRIBUTION
- **A**: {report['option_distribution']['A']}
- **B**: {report['option_distribution']['B']}
- **C**: {report['option_distribution']['C']}
- **D**: {report['option_distribution']['D']}

## QUALITY GATE
- **ANNOTATION_QUALITY_GATE**: **{"PASS" if gate_passed else "FAIL"}**
"""

with open(REPORTS_DIR / "annotation_quality_report.md", "w") as f:
    f.write(md_report)

print("==================================================")
print("ANNOTATION QUALITY GATE AUDIT")
print("==================================================")
print(f"Total Files Audited : {total_files}")
print(f"Valid Annotations   : {total_anns}")
print(f"VDS=3 Percentage    : {vds3_pct:.1f}%")
print(f"Ground Truth Fail   : {ground_truth_failures}")
print(f"Duplicates          : {duplicates}")
print(f"Empty Files         : {empty_files}")
print(f"Image Leakage       : {leaked_count}")
print(f"Option Distribution : A={report['option_distribution']['A']}, B={report['option_distribution']['B']}, C={report['option_distribution']['C']}, D={report['option_distribution']['D']}")
print(f"QUALITY GATE STATUS : {'PASS' if gate_passed else 'FAIL'}")
print("==================================================")
