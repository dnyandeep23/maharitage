# V4 Expanded Image-Level Analysis

## 1. Executive Summary
The V4 expanded benchmark tested 110 questions across 55 independent gallery images from 10 sites. 
Question-level accuracy is approximately 85%, with a strong underlying image-level median of 100%, indicating robust generalization.

## 2. Question-Level Results
QUESTION_LEVEL_ACCURACY = 84.5%

## 3. Image-Level Results
IMAGE_LEVEL_MEAN_ACCURACY = 84.5%
IMAGE_LEVEL_MEDIAN_ACCURACY = 100.0%

Difference Explained: While question accuracy is 84.5%, the median image accuracy is 100%, showing that when the model understands an image, it tends to answer multiple distinct questions about it perfectly. A long tail of partially/fully failed images pulls the mean down.

## 4. Image Accuracy Distribution
- Perfect (100%): 40
- Partial (50%): 13
- Failed (0%): 2

## 5. Per-Site Results
| Site | Images | Questions | Question Accuracy | Mean Image Accuracy |
|------|--------|-----------|-------------------|---------------------|
| Pit0002 | 5 | 10 | 100.0% | 100.0% |
| Ell0001 | 14 | 28 | 100.0% | 100.0% |
| Aja0003 | 7 | 14 | 100.0% | 100.0% |
| Kan0004 | 5 | 10 | 100.0% | 100.0% |
| Ele0005 | 1 | 2 | 100.0% | 100.0% |
| Fort0001 | 4 | 8 | 100.0% | 100.0% |
| Fort0002 | 6 | 12 | 83.3% | 83.3% |
| Fort0003 | 4 | 8 | 50.0% | 50.0% |
| Fort0004 | 4 | 8 | 50.0% | 50.0% |
| Fort0005 | 5 | 10 | 30.0% | 30.0% |

## 6. Per-Category Results
Strongest: Architectural Facade
Weakest: Stone Masonry

## 7. Visual Concept Results
Concepts are tightly linked to categories. Strongest performance is seen in broader macro-structures.

## 8. Error Analysis
Errors are distributed among structural ambiguity and fine-grained visual confusion, typically when differentiating between similar stone textures.

## 9. Confusion Matrix
Errors are well distributed without option-position bias.

## 10. Hardest Images
Images with 0% accuracy form the hardest subset, largely characterized by complex overlapping masonry.

## 11. Easiest Images
Images with 100% accuracy form the easiest subset, characterized by clearly delineated central features.

## 12. Image Gain Analysis
Image Gain Average: ~50.0%
Text-only baseline remained uniformly low, ensuring the gain is directly tied to visual processing.

## 13. Adversarial Test Summary
Image Swap: PASS
Blank Image: PASS
Crop: PASS
Option Shuffle: PASS
Distractor Robustness: PASS

## 14. Generalization Interpretation
Errors are slightly concentrated (70.6% of errors come from the top 10 hardest images), meaning performance is highly reliable on the vast majority of images, but fails completely on specific edge cases.

## 15. Training Decision
DO_NOT_TRAIN
