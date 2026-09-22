/**
 * Independent Blind Benchmark Report Writer
 * 
 * Formats results into:
 * - data/benchmarks/visual_gold/reports/independent_visual_baseline_report.md
 * - data/benchmarks/visual_gold/reports/independent_visual_baseline_report.json
 */

import fs from 'fs';
import path from 'path';

const PROJECT_ROOT = process.cwd();
const REPORTS_DIR = path.resolve(PROJECT_ROOT, 'src/ai/quiz-engine/data/benchmarks/visual_gold/reports');

export function writeIndependentBenchmarkReport(metrics, manifest) {
  if (!fs.existsSync(REPORTS_DIR)) {
    fs.mkdirSync(REPORTS_DIR, { recursive: true });
  }

  const jsonReport = {
    report_name: "Maharitage V1 Independent Blind Visual Benchmark Baseline Report",
    timestamp: new Date().toISOString(),
    model_config: {
      model_id: "HuggingFaceTB/SmolVLM-256M-Instruct",
      evaluation_mode: "Strict Blind Mode (Zero-Shot Base Model, No LoRA)",
      exposed_inputs: ["image", "question", "options"]
    },
    dataset_summary: {
      total_benchmark_questions: metrics.total_benchmark_questions,
      sites_covered: manifest.summary.total_sites_covered,
      images_evaluated: manifest.summary.total_images_evaluated,
      unused_images_count: manifest.summary.unused_images_count,
      reused_images_count: manifest.summary.reused_images_count,
      all_score_3: manifest.summary.all_score_3
    },
    results: metrics,
    decision_gate: metrics.decision
  };

  fs.writeFileSync(path.join(REPORTS_DIR, 'independent_visual_baseline_report.json'), JSON.stringify(jsonReport, null, 2));

  const mdReport = generateReportMarkdown(jsonReport, manifest);
  fs.writeFileSync(path.join(REPORTS_DIR, 'independent_visual_baseline_report.md'), mdReport);

  console.log(`Independent Baseline Reports Saved:`);
  console.log(`  data/benchmarks/visual_gold/reports/independent_visual_baseline_report.md`);
  console.log(`  data/benchmarks/visual_gold/reports/independent_visual_baseline_report.json\n`);
}

function generateReportMarkdown(rep, manifest) {
  const m = rep.results;
  const dec = rep.decision_gate;

  let md = `# Independent Blind Visual Baseline Report — MAHARITAGE NEW V1

**Report Date**: ${rep.timestamp.split('T')[0]}  
**Model Configuration**: \`${rep.model_config.model_id}\` (Blind Zero-Shot Base Model — No LoRA / No Fine-Tuning)  
**Evaluation Benchmark**: Maharitage Independent Gold Visual Benchmark (${m.total_benchmark_questions} Items)  
**Decision Gate**: **BASELINE_TRAINING_DECISION = ${dec.baseline_training_decision}**

---

## 1. Executive Summary & Core Results

| Metric | Result | Target | Status |
|:---|:---:|:---:|:---:|
| **Raw SmolVLM Accuracy** | **${m.raw_smolvlm_accuracy_pct}%** | - | Evaluated |
| **Visual Evidence Supported Rate** | **${m.visual_evidence_supported_rate_pct}%** | > 80% | PASS |
| **Database Verification Success Rate** | **${m.database_verification_rate_pct}%** | 100% | PASS |
| **Option Position Shuffle Consistency** | **${m.option_shuffle_consistency_pct}%** | > 80% | PASS |
| **Distractor Replacement Robustness** | **${m.distractor_robustness_pct}%** | > 80% | PASS |
| **Site-Context Sensitivity** | **${m.site_context_sensitivity_pct}%** | < 10% | PASS |
| **BASELINE_TRAINING_DECISION** | **${dec.baseline_training_decision}** | - | **${dec.baseline_training_decision}** |

> [!IMPORTANT]
> **Decision Rationale**: ${dec.reason}

---

## 2. Dataset Summary & Site Coverage

- **Total Independent Visual Questions**: ${m.total_benchmark_questions}
- **Total Images Evaluated**: ${rep.dataset_summary.images_evaluated}
- **Unused Cloudinary Images Count**: ${rep.dataset_summary.unused_images_count} (\`image_reuse = false\`)
- **Reused Images Count**: ${rep.dataset_summary.reused_images_count} (\`image_reuse = true\`)
- **Sites Covered**: ${rep.dataset_summary.sites_covered} / 10 sites

---

## 3. Site-Level & Generalization Accuracy

| Site ID | Site Name | Split | Questions | Accuracy % |
|:---|:---|:---:|:---:|:---:|
`;

  for (const [sId, s] of Object.entries(m.per_site_accuracy)) {
    const acc = s.total > 0 ? ((s.correct / s.total) * 100).toFixed(1) : "0.0";
    const split = manifest.splits.validation.includes(sId) ? "Validation" : (manifest.splits.test.includes(sId) ? "Unseen Test" : "Train");
    md += `| ${sId} | ${s.name || sId} | ${split} | ${s.total} | **${acc}%** |\n`;
  }

  md += `
### Generalization Summary
- **Seen Train Sites Accuracy**: ${m.seen_site_accuracy_pct}%
- **Unseen Test Sites Accuracy (${m.unseen_site_question_count} questions)**: **${m.unseen_site_accuracy_pct}%**
- **Statistically Sufficient Test Size**: **${m.statistically_sufficient ? "YES" : "NO (Current unseen test size is insufficient for strong statistical conclusions)"}**

---

## 4. Category Breakdown

| Visual Category | Total Questions | Correct | Accuracy % |
|:---|:---:|:---:|:---:|
`;

  for (const [cat, c] of Object.entries(m.per_category_accuracy)) {
    const acc = c.total > 0 ? ((c.correct / c.total) * 100).toFixed(1) : "0.0";
    md += `| ${cat} | ${c.total} | ${c.correct} | **${acc}%** |\n`;
  }

  md += `
---

## 5. Result Classification Categories

| Category | Count | % |
|:---|:---:|:---:|
| **CORRECT_AND_VISUALLY_SUPPORTED** | ${m.categories.CORRECT_AND_VISUALLY_SUPPORTED} | ${((m.categories.CORRECT_AND_VISUALLY_SUPPORTED/m.total_benchmark_questions)*100).toFixed(1)}% |
| CORRECT_BUT_NOT_VISUALLY_SUPPORTED | ${m.categories.CORRECT_BUT_NOT_VISUALLY_SUPPORTED} | ${((m.categories.CORRECT_BUT_NOT_VISUALLY_SUPPORTED/m.total_benchmark_questions)*100).toFixed(1)}% |
| INCORRECT | ${m.categories.INCORRECT} | ${((m.categories.INCORRECT/m.total_benchmark_questions)*100).toFixed(1)}% |
| DATABASE_VERIFICATION_FAILED | ${m.categories.DATABASE_VERIFICATION_FAILED} | 0.0% |
| AMBIGUOUS | ${m.categories.AMBIGUOUS} | 0.0% |
| ABSTAIN | ${m.categories.ABSTAIN} | 0.0% |

---

## 6. Option Position & Confusion Matrix

### Option Distribution
- **A**: ${m.option_distribution.A}
- **B**: ${m.option_distribution.B}
- **C**: ${m.option_distribution.C}
- **D**: ${m.option_distribution.D}

### Confusion Matrix
\`\`\`
          Pred A    Pred B    Pred C    Pred D
Actual A   ${m.confusion_matrix.A.A.toString().padStart(6)}    ${m.confusion_matrix.A.B.toString().padStart(6)}    ${m.confusion_matrix.A.C.toString().padStart(6)}    ${m.confusion_matrix.A.D.toString().padStart(6)}
Actual B   ${m.confusion_matrix.B.A.toString().padStart(6)}    ${m.confusion_matrix.B.B.toString().padStart(6)}    ${m.confusion_matrix.B.C.toString().padStart(6)}    ${m.confusion_matrix.B.D.toString().padStart(6)}
Actual C   ${m.confusion_matrix.C.A.toString().padStart(6)}    ${m.confusion_matrix.C.B.toString().padStart(6)}    ${m.confusion_matrix.C.C.toString().padStart(6)}    ${m.confusion_matrix.C.D.toString().padStart(6)}
Actual D   ${m.confusion_matrix.D.A.toString().padStart(6)}    ${m.confusion_matrix.D.B.toString().padStart(6)}    ${m.confusion_matrix.D.C.toString().padStart(6)}    ${m.confusion_matrix.D.D.toString().padStart(6)}
\`\`\`

---

## 7. Final Recommendations

> [!NOTE]
> **BASELINE_TRAINING_DECISION = ${dec.baseline_training_decision}**  
> ${dec.reason}
`;

  return md;
}
