# Model Selection Analysis

**PRELIMINARY_MODEL_SELECTION**
*Note: Do not claim statistically definitive superiority from this 48-question pilot sample.*

## 1. Overall Ranking
1. **google/gemma-3-12b-it**: 100.0%
2. **qwen/qwen3-vl-8b-instruct**: 97.9%
3. **mlx-community/Qwen2-VL-2B-Instruct-4bit**: 85.4%
4. **HuggingFaceTB/SmolVLM-500M-Instruct**: 56.2%
5. **HuggingFaceTB/SmolVLM-256M-Instruct**: 6.2%

## 2. Text-MCQ Ranking
1. **gemma-3-12b-it**: 100.0%
2. **qwen3-vl-8b-instruct**: 96.0%
3. **Qwen2-VL-2B-Instruct-4bit**: 76.0%
4. **SmolVLM-500M-Instruct**: 32.0%
5. **SmolVLM-256M-Instruct**: 0.0%

## 3. Image-MCQ Ranking
1. **gemma-3-12b-it**: 100.0%
2. **qwen3-vl-8b-instruct**: 100.0%
3. **Qwen2-VL-2B-Instruct-4bit**: 95.7%
4. **SmolVLM-500M-Instruct**: 82.6% (approx)
5. **SmolVLM-256M-Instruct**: 13.0% (approx)

## 4. Difficulty Performance (Easy / Moderate / Hard)
- **gemma-3-12b-it**: 100.0% / 100.0% / 100.0%
- **qwen3-vl-8b-instruct**: 91.7% / 100.0% / 100.0%
- **Qwen2-VL-2B-Instruct-4bit**: 75.0% / 95.7% / 76.9%
- **SmolVLM-500M-Instruct**: 50.0% / 60.9% / 53.8%
- **SmolVLM-256M-Instruct**: 9.1% / 4.3% / 7.7%

## 5. Category Performance
*See `model_comparison_report.md` for the full breakdown. High-level summary:*
- Both Gemma 3 12B and Qwen3-VL 8B achieved near-perfect performance across all historical, architectural, and visual reasoning categories.
- Qwen2-VL-2B-Instruct performed exceptionally well on Visual Architecture (94%) but struggled slightly more on pure Historical/Architectural textual reasoning (62%).
- SmolVLM-500M performed respectably on Visual Architecture (89%) but failed most text-heavy and chronology questions.

## 6. Invalid / Error Rate
- **gemma-3-12b-it**: 0.0% Invalid, 0 Errors
- **qwen3-vl-8b-instruct**: 0.0% Invalid, 0 Errors
- **Qwen2-VL-2B-Instruct-4bit**: 0.0% Invalid, 0 Errors
- **SmolVLM-500M-Instruct**: 2.1% Invalid (1/48), 0 Errors
- **SmolVLM-256M-Instruct**: 2.1% Invalid (1/48), 0 Errors

## 7. Latency (Average)
- **Qwen2-VL-2B-Instruct-4bit (Local MLX)**: ~285ms
- **SmolVLM-256M-Instruct (Local MPS)**: ~654ms
- **SmolVLM-500M-Instruct (Local MPS)**: ~780ms
- **gemma-3-12b-it (Hosted)**: ~815ms
- **qwen3-vl-8b-instruct (Hosted)**: ~957ms

## 8. Confidence Availability
| Model | Confidence Available | Confidence Type | Correct-Answer Confidence | Wrong-Answer Confidence |
|---|---|---|---|---|
| gemma-3-12b-it | No | UNAVAILABLE | N/A | N/A |
| qwen3-vl-8b-instruct | Yes | MODEL_LOGPROB | 0.979 | 0.729 |
| Qwen2-VL-2B-Instruct-4bit | No | UNAVAILABLE | N/A | N/A |
| SmolVLM-500M-Instruct | Yes | MODEL_LOGPROB | 0.442 | 0.297 |
| SmolVLM-256M-Instruct | Yes | MODEL_LOGPROB | 0.699 | 0.710 |

*Note: SmolVLM-256M-Instruct demonstrated severe calibration issues, yielding higher confidence on wrong answers (0.710) than on correct answers (0.699). This represents a distinct overconfidence issue on predictions that are ultimately incorrect.*

---

## FINALIST_SELECTION_STATUS

**PRIMARY_FINALIST** = google/gemma-3-12b-it
**SECONDARY_FINALIST** = mlx-community/Qwen2-VL-2B-Instruct-4bit

**REASON** = 
- **Gemma 3-12B** achieves the highest observed overall accuracy (100%), serving as an excellent high-ceiling capability benchmark. Although **Qwen3-VL-8B** performs similarly (97.9%), Gemma 3 currently acts as the best possible "upper bound" reference.
- **Qwen2-VL-2B-Instruct-4bit** is selected as the secondary finalist because it represents an incredibly efficient local edge deployment strategy. It delivers 85.4% overall accuracy and 95.7% image accuracy natively on Apple Silicon with only ~285ms latency, making it the most practical model for offline or cost-constrained deployment despite the minor accuracy drop-off. 

*(Note: This is a PILOT_FINALIST_SELECTION and is not final for the full research study.)*

---

## Resource / Deployment Comparison

| Model | Params | Backend | Accuracy | Image Accuracy | Latency | Deployment |
|---|---|---|---|---|---|---|
| google/gemma-3-12b-it | 12B | OpenRouter | 100.0% | 100.0% | ~815ms | HOSTED |
| qwen/qwen3-vl-8b-instruct | 8B | OpenRouter | 97.9% | 100.0% | ~957ms | HOSTED |
| mlx-community/Qwen2-VL-2B-Instruct-4bit | 2B | Local MLX | 85.4% | 95.7% | ~285ms | LOCAL |
| HuggingFaceTB/SmolVLM-500M-Instruct | 0.5B | Local MPS | 56.2% | 82.6% | ~780ms | LOCAL |
| HuggingFaceTB/SmolVLM-256M-Instruct | 0.25B | Local MPS | 6.2% | 13.0% | ~654ms | LOCAL |
