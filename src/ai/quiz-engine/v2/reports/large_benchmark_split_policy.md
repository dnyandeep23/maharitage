# Large Benchmark Split Policy

## 1. Pilot vs Final Benchmark Distinction
The existing 48-question pilot dataset (`pilot_v2_frozen.json`) is explicitly designated as **development/model-selection data**. It has already been utilized to evaluate various model architectures and validate preliminary findings. Therefore, to ensure complete evaluation integrity, the 48-question pilot **MUST NOT** be included in the final unseen test set of the 150-question dataset. The new 150-question dataset represents a completely fresh and independent benchmark.

## 2. The 70/15/15 Split Ratio
The final 150-question dataset will be split according to the following strict proportions:
- **TRAIN**: ~70% (approx. 105 questions)
- **VALIDATION**: ~15% (approx. 22-23 questions)
- **TEST**: ~15% (approx. 22-23 questions)

These splits will be defined exclusively via manifest lists (`train.json`, `validation.json`, `test.json`) in `dataset/splits/`, which will map only annotation IDs and site IDs.

## 3. Site-Level Splitting Rules
To test genuine model generalization across distinct heritage locations, dataset splitting must occur strictly at the **Site Level**. 
- The **SAME site** must not appear across TRAIN, VALIDATION, and TEST splits unless there is a documented and exceptionally justified reason. 
- Overlapping sites would create data leakage where the model memorizes site-specific metadata during training, artificially inflating testing scores.

## 4. Test-Set Protection
Once the **TEST** split is generated and validated, it must be completely **FROZEN**.
The following actions must NEVER use or reference the test set:
- Base model selection
- Prompt tuning
- QLoRA tuning
- Dataset revision or manual optimization

The test set is protected solely for final, unseen evaluation.

## 5. Quality Over Quota Principle
While target distributions exist for Categories (e.g., 35% Visual Architecture, 15% Historical) and Difficulty (25% Easy, 50% Moderate, 25% Hard), these are strictly **TARGETS**. 
- Priority must always be placed on valid source grounding, clear image-question alignment, and reasoning quality. 
- Category and difficulty percentages must not be forced by generating weak questions. Shortfalls in certain modalities (e.g., visual queries) should be documented rather than circumvented through fabrication.
