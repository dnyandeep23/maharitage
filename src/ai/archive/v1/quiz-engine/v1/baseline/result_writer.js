/**
 * Zero-Shot Visual Baseline Report Writer
 * 
 * Formats baseline experiment results into:
 * - data/annotations/reports/visual_baseline_report.md
 * - data/annotations/reports/visual_baseline_report.json
 * 
 * Calculates BASELINE_TRAINING_JUSTIFIED decision gate.
 */

import fs from 'fs';
import path from 'path';

const PROJECT_ROOT = process.cwd();
const REPORTS_DIR = path.resolve(PROJECT_ROOT, 'src/ai/quiz-engine/data/annotations/reports');

export function writeBaselineReport(evalResults, manifest) {
  if (!fs.existsSync(REPORTS_DIR)) {
    fs.mkdirSync(REPORTS_DIR, { recursive: true });
  }

  // Evaluate BASELINE_TRAINING_JUSTIFIED gate
  let trainingJustified = "INSUFFICIENT_EVIDENCE";
  let justificationReason = "Zero-shot evaluation complete. Current unseen-site test size (7 questions) is insufficient for strong statistical conclusions.";

  if (evalResults.overall_accuracy_pct < 40.0) {
    trainingJustified = "NO";
    justificationReason = "Zero-shot visual perception accuracy is low (<40%). Improving image data quality & visual evidence grounding is required before fine-tuning.";
  } else if (evalResults.visual_evidence_support_rate_pct > 65.0) {
    trainingJustified = "YES";
    justificationReason = "Zero-shot visual perception demonstrates solid visual evidence grounding (>65%). LoRA fine-tuning on site-isolated splits is justified.";
  }

  const reportJson = {
    report_timestamp: new Date().toISOString(),
    model_id: "HuggingFaceTB/SmolVLM-256M-Instruct",
    evaluation_mode: "Zero-Shot Base Model (No LoRA, No Fine-Tuning)",
    dataset_version: manifest.dataset_version,
    dataset_summary: manifest.summary,
    results: evalResults,
    decision_gate: {
      baseline_training_justified: trainingJustified,
      reason: justificationReason,
      statistical_note: "Current unseen-site test size is insufficient for strong statistical conclusions."
    }
  };

  const jsonPath = path.join(REPORTS_DIR, 'visual_baseline_report.json');
  fs.writeFileSync(jsonPath, JSON.stringify(reportJson, null, 2));

  const mdReport = generateBaselineMarkdown(reportJson);
  const mdPath = path.join(REPORTS_DIR, 'visual_baseline_report.md');
  fs.writeFileSync(mdPath, mdReport);

  console.log(`\nBaseline Reports Saved:`);
  console.log(`  data/annotations/reports/visual_baseline_report.md`);
  console.log(`  data/annotations/reports/visual_baseline_report.json\n`);

  return reportJson;
}

function generateBaselineMarkdown(rep) {
  const r = rep.results;
  const metrics = r.summary_metrics || {};

  let md = `# Zero-Shot Visual Baseline Report — MAHARITAGE NEW V1

**Report Timestamp**: ${rep.report_timestamp}  
**Model Under Test**: \`${rep.model_id}\` (Zero-Shot Base Model — No LoRA / No Fine-Tuning)  
**Dataset Version**: \`${rep.dataset_version}\` (${rep.dataset_summary.total_visual_annotations} Total Visual MCQs)  
**Decision Gate**: **BASELINE_TRAINING_JUSTIFIED = ${rep.decision_gate.baseline_training_justified}**

---

## 1. Executive Summary & Decision Gate

| Metric | Result |
|:---|:---:|
| **Overall Zero-Shot MCQ Accuracy** | **${metrics.overall_accuracy_pct || 0}%** |
| Gallery Image MCQ Accuracy | ${metrics.gallery_image_accuracy_pct || 0}% |
| Inscription MCQ Accuracy | ${metrics.inscription_accuracy_pct || 0}% |
| Visual Evidence Support Rate | ${metrics.visual_evidence_support_rate_pct || 0}% |
| Option-Shuffle Consistency | ${r.option_shuffle_consistency_pct || 0}% |
| Distractor Robustness | ${r.distractor_robustness_pct || 0}% |
| Database Verification Success | ${r.database_verification_success_pct || 0}% |
| **BASELINE_TRAINING_JUSTIFIED** | **${rep.decision_gate.baseline_training_justified}** |

> [!IMPORTANT]
> **Statistical Limitation Note**: ${rep.decision_gate.statistical_note}

---

## 2. Split-Level Generalization Accuracy

| Split | Sites Included | Total Questions | Accuracy % |
|:---|:---|:---:|:---:|
| **Train Sites** | \`Ell0001\`, \`Kan0004\`, \`Fort0001\`, \`Fort0002\`, \`Fort0003\`, \`Pit0002\` | 111 | **${metrics.split_accuracies?.train_sites_pct || 0}%** |
| **Validation Sites** | \`Aja0003\`, \`Ele0005\` | 20 | **${metrics.split_accuracies?.validation_sites_pct || 0}%** |
| **Unseen Test Sites** | \`Fort0005\`, \`Fort0004\` | 7 | **${metrics.split_accuracies?.unseen_test_sites_pct || 0}%** |

---

## 3. Evaluation Mode Comparison

| Mode | Purpose | Accuracy / Rate |
|:---|:---|:---:|
| **Mode A (Direct MCQ)** | Direct End-to-End A/B/C/D Prediction | **${r.mode_a_direct_accuracy_pct || 0}%** |
| **Mode B (Visual Reasoning)** | Visual Evidence Extraction Rate | **${r.mode_b_visual_evidence_rate_pct || 0}%** |
| **Mode C (Evidence-Grounded)** | Grounded Observation + Option Selection | **${r.mode_c_grounded_accuracy_pct || 0}%** |
| **Minimal Text (No Site Name)** | Protection Against Site Text Leakage | **${r.minimal_text_accuracy_pct || 0}%** |

---

## 4. Option Bias & Shuffle Robustness

| Metric | Result | Target |
|:---|:---:|:---:|
| Option Position Shuffle Consistency | **${r.option_shuffle_consistency_pct || 0}%** | > 80% |
| Distractor Replacement Robustness | **${r.distractor_robustness_pct || 0}%** | > 80% |

### Predicted Option Distribution (Zero-Shot)
- **A**: ${metrics.option_distribution?.A || 0}
- **B**: ${metrics.option_distribution?.B || 0}
- **C**: ${metrics.option_distribution?.C || 0}
- **D**: ${metrics.option_distribution?.D || 0}
- **AMBIGUOUS**: ${metrics.option_distribution?.AMBIGUOUS || 0}

---

## 5. Result Category Breakdown

| Result Category | Count | % |
|:---|:---:|:---:|
| **CORRECT_AND_VISUALLY_SUPPORTED** | ${metrics.category_breakdown?.CORRECT_AND_VISUALLY_SUPPORTED || 0} | ${rep.dataset_summary.total_visual_annotations > 0 ? (((metrics.category_breakdown?.CORRECT_AND_VISUALLY_SUPPORTED || 0)/rep.dataset_summary.total_visual_annotations)*100).toFixed(1) : 0}% |
| CORRECT_BUT_NOT_VISUALLY_SUPPORTED | ${metrics.category_breakdown?.CORRECT_BUT_NOT_VISUALLY_SUPPORTED || 0} | ${rep.dataset_summary.total_visual_annotations > 0 ? (((metrics.category_breakdown?.CORRECT_BUT_NOT_VISUALLY_SUPPORTED || 0)/rep.dataset_summary.total_visual_annotations)*100).toFixed(1) : 0}% |
| INCORRECT | ${metrics.category_breakdown?.INCORRECT || 0} | ${rep.dataset_summary.total_visual_annotations > 0 ? (((metrics.category_breakdown?.INCORRECT || 0)/rep.dataset_summary.total_visual_annotations)*100).toFixed(1) : 0}% |
| DATABASE_VERIFICATION_FAILED | ${metrics.category_breakdown?.DATABASE_VERIFICATION_FAILED || 0} | 0.0% |
| AMBIGUOUS | ${metrics.category_breakdown?.AMBIGUOUS || 0} | 0.0% |
| ABSTAIN | ${metrics.category_breakdown?.ABSTAIN || 0} | 0.0% |

---

## 6. Recommendations & Decision Rationale

> [!NOTE]
> **Rationale**: ${rep.decision_gate.reason}

`;

  return md;
}
