# Maharitage V2 QLoRA Smoke Test

## 1. Parameters
- **TRAIN_SAMPLES**: 662
- **VALIDATION_SAMPLES**: 23
- **SMOKE_STEPS**: 150

## 2. Performance Metrics
- **TRAIN_LOSS_START**: None
- **TRAIN_LOSS_END**: None
- **VALIDATION_LOSS**: None
- **PEAK_MEMORY**: None GB
- **AVG_STEP_TIME**: 0.000 s
- **CHECKPOINT_PATH**: `dataset/qlora_data/adapters_smoke/adapters.safetensors`

## 3. Required Pipeline Checks
- **MODEL_LOAD**: FAIL
- **LORA_ATTACHMENTS**: FAIL
- **IMAGE_TRAINING**: FAIL
- **TEXT_TRAINING**: FAIL
- **LOSS_FINITE**: FAIL
- **VALIDATION_FORWARD**: FAIL
- **CHECKPOINT_SAVE**: FAIL
- **CHECKPOINT_RELOAD**: FAIL
- **MEMORY_STABLE**: FAIL
