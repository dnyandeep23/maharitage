# Generation Pilot Analysis

**GENERATION_PILOT_STATUS**: NEEDS_REVISION
**AVERAGE_ACCEPTED_PER_IMAGE**: 1.8 (Adjusted down from 11.8 due to manual quality failure)
**OVERALL_ACCEPTANCE_RATE**: 15% (Adjusted)
**HIGH_OR_MEDIUM_VISUAL_RATE**: 18.3% (11 out of 60 generated)
**ESTIMATED_IMAGES_FOR_150**: 83 images

---

## 1. Analyze the Pilot

**Aggregate Automated Metrics (Flawed)**
- candidates_generated: 60
- KEEP: 59
- REVISE: 1
- REJECT: 0
- accepted_questions_per_image: 11.8

**True Metrics (Post-Manual Review)**
- UNIQUE: ~9 per image (Many subtle semantic overlaps)
- SAME_FACT / SAME_VISUAL_FEATURE: The automated script completely failed to implement the duplicate detection pipeline.
- *Adjusted KEEP*: ~1-2 per image. The vast majority of generated candidates violate core methodology rules.

## 2. Purpose Analysis (60 Generated Candidates)

**By Purpose:**
- VISUAL: 9 (15%)
- HISTORICAL_CONTEXT: 31 (51.6%)
- CULTURAL_CONTEXT: 9 (15%)
- CHRONOLOGY: 8 (13.3%)
- COMPARATIVE_REASONING: 1 (1.6%)
- ARCHITECTURAL_FEATURES (Hallucinated Category): 2 (3.3%)

**By Visual Dependency:**
- HIGH: 7
- MEDIUM: 4
- LOW: 4
- NONE: 45

*Percentage of IMAGE_MCQ with HIGH/MEDIUM visual dependency*: **18.3%**. 
(This is a massive failure. Over 75% of the generated output was purely text-based trivia with an image pointlessly attached).

## 3. Quality Check & Recurring Failures

Manual inspection of the generated candidates reveals critical failures:

1. **Are questions genuinely distinct?**
   *No.* While worded differently, questions heavily overlap. For example, Image 1 generated "Who expanded Raigad into the capital?" and "What political role did Raigad serve?" (Both test the "capital of Maratha Swarajya" fact).
2. **Are historical questions disguised as visual questions?**
   *Yes.* 45 questions were generated with `visual_dependency: NONE`. The prompt allowed Gemini to aggressively over-index on historical text metadata rather than finding visual features in the image.
3. **Are source_evidence and mongo_evidence sufficient?**
   *Failure.* For visual questions, Gemini explicitly cheated. For example: `source_evidence: "Image URL provides 'Nagarkhana' in the filename."` This violates the strict rule against using filenames/metadata as visual evidence.
4. **Are visual_evidence statements actually visible?**
   *Failure.* Gemini generated meta-questions about photography rather than heritage. For example: *"How is the Nagarkhana gateway presented in the image's composition?"* (Answer: *"From a ground-level, upward-looking perspective"*). This tests visual observation of the photo, not historical visual reasoning.
5. **Are distractors plausible?**
   *Passable.* The distractors are mostly plausible, though some numeric options risk format leakage.
6. **Are Easy/Moderate/Hard labels credible?**
   *Passable.*

## 4. Scaling Decision

**GENERATION_PILOT_STATUS = NEEDS_REVISION**

The current pipeline is absolutely not ready to scale to 150 questions.

**Exactly what must change:**
1. **Deduplication Pipeline**: The script must enforce `duplicate_group` and `duplicate_type` categorizations. Semantic clustering must reject overlapping historical facts.
2. **Blind the URLs**: Image URLs must be hashed or stripped of descriptive text (e.g., `Nagarkhana__Raigad_Fort.jpg`) before being sent to Gemini to prevent the model from cheating on `IMAGE_MCQ` items.
3. **Force Visual Quotas in Prompt**: The prompt must explicitly mandate that at least 50% of the candidates generated for a given image *must* have `HIGH` or `MEDIUM` visual dependency based strictly on pixel evidence.
4. **Ban Photographic Meta-Questions**: Add a strict prompt rule forbidding questions about camera angles, composition, or photography techniques.
5. **Human Acceptance Rate Adjustment**: Relying purely on structural JSON validation yielded a 98% pass rate, but human review drops this to ~15%. The script needs an LLM-as-a-judge step to evaluate reasoning quality, or we must dramatically scale the candidate pool knowing that 85% will be manually rejected.
