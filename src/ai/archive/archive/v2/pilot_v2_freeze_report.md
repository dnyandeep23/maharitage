# Maharitage V2: Pilot Freeze Report

This document confirms the freezing of the 48-question pilot dataset as a methodology prototype.

## Overview
- **Original Pilot Size**: 50 questions
- **Rejected Questions**: 2 total (1 textual failure due to missing evidence, 1 visual failure due to mismatched photo).
- **Revised Questions**: Multiple image MCQs were revised to perfectly align the visual evidence strictly with the provided image pixels.
- **Final Size**: 48 questions

## Breakdown by Type
- **IMAGE_MCQ**: 23
- **TEXT_MCQ**: 25

## Breakdown by Category
- **HISTORICAL**: 8
- **CULTURAL_RELIGIOUS**: 2
- **ARCHITECTURAL**: 8
- **INSCRIPTION**: 4
- **CHRONOLOGY**: 2
- **VISUAL_ARCHITECTURE**: 18
- **VISUAL_MATERIAL**: 2
- **VISUAL_SCULPTURE**: 2
- **VISUAL_INSCRIPTION**: 1
- **COMPARATIVE_REASONING**: 1

## Breakdown by Difficulty
- **EASY**: 12
- **MODERATE**: 23
- **HARD**: 13

## Audit Status

### Structural Audit Status
✅ **PASSED**: All items contain precisely 4 options, valid distractors, and correct answer indices.

### Source-Grounding Status
✅ **PASSED**: Every question is rigorously grounded to a direct sentence from the verified knowledge base (for textual questions).

### Pixel-Level Image Audit Status
✅ **PASSED**: A manual, pixel-level review of all 24 initial Cloudinary images was conducted. 1 was rejected and several revised to ensure that the required visual evidence is genuinely and explicitly visible in the actual image pixels.

### Visual-Ablation Limitation
⚠️ **INCOMPLETE**: Empirical automated visual-ablation using foundation models (e.g., OpenRouter, Gemini API) failed to complete fully due to chronic HTTP timeouts and rate limits (429 errors). We do NOT claim that empirical automated visual-ablation validation is complete. 

## Conclusion
The pilot is **CONDITIONALLY FROZEN**. The methodology (strict grounding, rigorous distractor balancing, and pixel-level image review) is finalized and verified, but the final automated empirical visual-ablation metrics are incomplete. This dataset serves as a methodology prototype before generating the final large-scale benchmark.
