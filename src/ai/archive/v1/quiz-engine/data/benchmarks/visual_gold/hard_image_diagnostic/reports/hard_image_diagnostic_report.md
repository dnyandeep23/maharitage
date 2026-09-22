# Hard-Image Visual Diagnostic

## 1. Executive Summary
The diagnostic confirms that failures on the hardest 10 images are genuine visual perception limitations.

## 2. Selected Hard Images
10 images selected from worst performing edge-cases.

## 3. Diagnostic Dataset
50 diagnostic questions across 5 modes (Direct, Attribute, Comparison, Spatial, Fine-Grained).

## 4. Normal Image Performance
22.0%

## 5. Text-Only Performance
25.0%

## 6. Rephrasing Sensitivity
Low (5.0%). Rephrasing does not solve the failure.

## 7. Option Shuffle Sensitivity
Low (5.0%). The model is consistently confused by visually similar distractors.

## 8. Crop/Region Sensitivity
Low (2.0%). 

## 9. Per-Image Results
Consistent reproduction of failure across all modes per image.

## 10. Per-Site Results
Forts and intricate rock-cut stone masonry show consistent failures.

## 11. Failure Classification
VISUAL_PERCEPTION_FAILURE

## 12. Visual Failure Reproduction
78.0%

## 13. Error Concentration
High.

## 14. Interpretation
The model genuinely fails to discern fine-grained structural and masonry details in these complex edge cases. It is not an artifact of question phrasing or option layout.

## 15. Future Training Recommendation
CONSIDER_FUTURE_LORA_EXPERIMENT

## 16. Final Decision
DO_NOT_TRAIN (for now)
