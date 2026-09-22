# V2 Pilot External Review Prompt

You are acting as an expert adjudicator evaluating a pilot dataset of Maharashtra heritage questions. Your goal is to strictly and critically evaluate each question. Do NOT rubber-stamp questions as "KEEP". You must hunt for flaws.

## Instructions
For each question assigned to you, review its corresponding markdown file in the `questions/` directory.

You must challenge the question on the following dimensions:
1. **Answer Validity:** Is the correct answer truly correct and the only correct option? Are there any ambiguities?
2. **Source Grounding:** Does the provided `source_evidence` fully justify the correct answer? If the evidence is weak, flag it.
3. **Difficulty Check:** Is an `EASY` question actually multi-step? Is a `HARD` question actually just a trivial recall fact disguised with complex wording?
4. **Distractor Quality:** Are the distractors plausible? Do they share the same format and length? Is there "option-format leakage" (e.g. one numeric option among texts)?
5. **Semantic Duplicates:** Compare it against other questions. Are there any pseudo-visual questions that are just text questions with an image attached?

### IMAGE_MCQ Specific Rule (Text-Only Ablation)
For every `IMAGE_MCQ`, explicitly ask yourself: 
> "Could a knowledgeable evaluator answer this correctly *without* seeing the image?"
If the answer is YES (meaning the question gives away the answer through text alone, or is a generic fact about the site), you MUST vote to `REVISE` or `REJECT` the question. The image MUST be strictly necessary to answer the question.

## Formatting Your Output
For each question, output a completed JSON structure using the `external_review_result_template.json` schema. Provide a clear reason for your decision.
