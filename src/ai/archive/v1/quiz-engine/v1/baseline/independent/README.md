# Independent Blind Visual Benchmark Architecture

This directory contains the independent blind evaluation benchmark for the Maharitage NEW V1 Quiz Engine visual pipeline.

## Overview

The benchmark tests:
1. Genuine image understanding
2. Generalization to unseen images and sites
3. Resistance to option-position bias (4-way shuffle test)
4. Resistance to site-name text leakage (Version A vs Version B comparison)
5. Visual evidence grounding (`visual_dependency_score = 3`)
6. Post-prediction database verification layer (`SmolVLM -> Visual Identification -> MongoDB/Cloudinary Verification -> Final Option`)

## File Structure

- `benchmark_builder.js`: Scans MongoDB, prevents data leakage by detecting previously used images, generates independent gold visual questions.
- `benchmark_runner.js`: Executes zero-shot base model (`HuggingFaceTB/SmolVLM-256M-Instruct`) in strict blind mode (exposing ONLY image + question + options).
- `blind_evaluator.js`: Computes raw accuracy, category classification, confusion matrix, and evaluates `BASELINE_TRAINING_DECISION`.
- `evidence_evaluator.js`: Evaluates visual evidence grounding in model observations.
- `db_verifier.js`: Post-prediction verification layer against MongoDB/Cloudinary ground truth metadata.
- `result_writer.js`: Writes markdown and JSON reports to `data/benchmarks/visual_gold/reports/`.

## Execution Commands

```bash
# 1. Build independent benchmark
node src/ai/quiz-engine/v1/baseline/independent/benchmark_builder.js

# 2. Run blind model execution
node src/ai/quiz-engine/v1/baseline/independent/benchmark_runner.js

# 3. Evaluate results & generate report
node src/ai/quiz-engine/v1/baseline/independent/blind_evaluator.js
```
