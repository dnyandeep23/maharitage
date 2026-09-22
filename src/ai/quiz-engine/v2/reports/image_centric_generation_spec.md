# Image-Centric Generation Specification

## 1. Core Requirement: The 10-12 Candidate Policy
For every selected verified heritage image, the generation strategy aims to produce approximately **10-12 DISTINCT question candidates**.
- These candidates must **NOT** be paraphrases of the same fact.
- Each generated question must test a genuinely distinct fact, visual observation, or reasoning path.
- *Crucial*: 10-12 is a candidate **TARGET**, not a guaranteed accepted count. If only 6 questions are genuinely high-quality, only 6 are kept. Weak questions must never be created merely to satisfy this quota.

## 2. Question Mix Targets (Per Image)
The target candidate mix generated per image should approximate:
- 2-3 Visual Architecture
- 1-2 Visual Material/Sculpture
- 1 Visual Inscription (where applicable)
- 2 Historical/contextual
- 1 Cultural/Religious
- 1 Chronology
- 1 Comparative/Reasoning
- 1 Additional site-specific high-quality question

**Rule**: Do not force categories that are unsupported by the image/site. Quality supersedes quota.

## 3. Visual Dependency Classification
Every generated question must explicitly record its `visual_dependency`.
- **HIGH**: The image is absolutely necessary to answer. The correct option relies on observable elements in the image. (Preferred for IMAGE_MCQ).
- **MEDIUM**: The image provides important evidence, but some contextual site knowledge is required.
- **LOW**: The image identifies the referenced object or site, but the answer is primarily contextual. (Must NOT be presented as a purely visual reasoning question).
- **NONE**: The image is decorative or entirely unnecessary. 

## 4. Gemini Generation Prompt
Use Gemini as a **QUESTION CANDIDATE GENERATOR** by supplying the actual image, MongoDB site document, historical/architectural context, inscriptions, chronology, and cultural information.

**Prompt Instruction to Gemini:**
> "Generate 10–12 DISTINCT multiple-choice question candidates from this single heritage image and the provided verified site context.
> 
> Do not invent historical facts.
> 
> Every question must:
> - have exactly four options
> - have exactly one correct answer
> - identify its evidence source
> - identify its category
> - identify difficulty
> - identify visual_dependency
> - be materially different from the other questions
> 
> Do not repeat the same fact with different wording."

## 5. Source Grounding Rules
Every generated candidate must store:
- `source_evidence`
- `source_field`
- `visual_evidence`
- `mongo_evidence`

The correct answer must be supported by verified evidence. **REJECT** any question if Gemini generates a fact that does not exist in MongoDB or the verified image evidence. Gemini's internal knowledge base is strictly disallowed as the source of truth.

## 6. Deduplication Rules
**Within a single image**:
- No duplicate facts.
- No paraphrase duplicates.
- No same-answer-template repetitions.

**Across the entire dataset**:
- No duplicate semantic facts, unless the actual reasoning task and modality are genuinely different.

Each candidate must record:
- `duplicate_group`
- `duplicate_type` (Values: UNIQUE, EXACT_DUPLICATE, SAME_FACT, SAME_VISUAL_FEATURE, REASONING_VARIANT)

## 7. Review and Accepted/Rejected Policy Pipeline
For every selected image, the pipeline is as follows:

1. **MongoDB + Image**
2. **Gemini generates 10-12 candidates**
3. **Structural validation**
4. **Source grounding check** (Reject if unverified by source data)
5. **Semantic deduplication** (Reject if SAME_FACT without differing reasoning)
6. **Pixel-level image validation** (Must download actual Cloudinary image and verify the stated feature is explicitly visible)
7. **Difficulty/category review** (Must be assigned based on true reasoning complexity, not vocabulary length)
8. **Human/external review**
9. **ACCEPT / REVISE / REJECT**

*Final Accepted Policy*: All accepted annotations are centrally registered in `src/ai/quiz-engine/v2/annotation/annotation.json` before being derived into format-specific subsets. Conflicting manual copies must not be maintained.
