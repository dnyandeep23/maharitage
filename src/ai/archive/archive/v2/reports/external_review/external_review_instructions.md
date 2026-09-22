# External Review Instructions

Welcome to the External Review Phase for the Maharitage V2 Pilot Dataset.

Your goal as an external reviewer (Gemini, Claude, or Human) is to independently evaluate the quality, difficulty, formatting, and validity of each generated question. 

## Included Files
- `pilot_annotations.json`: The complete generated dataset.
- `pilot_validation_report.md`: The summary report from the automated validation phase.
- `human_review_queue.md`: The queue listing all 50 questions that require review.
- `image_ablation_cases.json`: The dataset of IMAGE_MCQs with the image stripped to test text-only validity.
- `ANNOTATION_SPECIFICATION.md`: The strict rulebook defining the V2 format and standards.
- `questions/`: A directory containing one markdown file per question for granular review.

## Review Process
For each question in the `questions/` directory, please fill out the review form block at the bottom of the file. You must make a decision to `KEEP`, `REVISE`, or `REJECT` the question, and provide a clear reason for your decision. 

After completing the reviews, please format your responses using the `external_review_result_template.json` schema so that they can be processed by the consensus reconciliation script.
