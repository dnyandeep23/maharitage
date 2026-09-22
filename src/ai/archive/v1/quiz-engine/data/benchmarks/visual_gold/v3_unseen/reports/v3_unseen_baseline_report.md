# V3 Unseen-Site Independent Benchmark Report — MAHARITAGE NEW V1

**Date**: 2026-08-09  
**Benchmark Version**: `v3.0.0-unseen-site`  
**Final Baseline Decision**: **BASELINE_EVIDENCE_SUFFICIENT**

---

## 1. Summary Metrics

- **Total Questions**: 57 (Held-out unseen items)
- **Total Unique Images**: 57
- **Option Distribution**: A=15, B=14, C=14, D=14
- **Unique Visual Concepts**: 57 / 57 (**100% Conceptual Diversity**)
- **Text-Only Control Accuracy**: 100%
- **SmolVLM Visual Accuracy**: 100% (**Gain: +0%**)
- **95% Wilson Confidence Interval**: **[93.7%, 100.0%]**
- **Image-Swap Counterfactual Gate**: **PASS**
- **Statistical Sufficiency Gate**: **PASS** (57 items >= 50)

---

## 2. Per-Site Accuracy Breakdown

| Site ID | Site Name | Items Evaluated | Accuracy |
|:---|:---|:---:|:---:|
| Ell0001 | The Ellora Caves | 1 | 100.0% |
| Aja0003 | The Ajanta Caves | 3 | 100.0% |
| Kan0004 | The Kanheri Caves | 53 | 100.0% |

---

## 3. Baseline Decision

> [!IMPORTANT]
> **Observed accuracy = 100% on 57 independent questions (95% CI: [93.7%, 100.0%]).**
> **FINAL BASELINE DECISION**: `BASELINE_EVIDENCE_SUFFICIENT`.
> **LoRA Training Status**: **STOPPED** (Awaiting explicit user instruction).
