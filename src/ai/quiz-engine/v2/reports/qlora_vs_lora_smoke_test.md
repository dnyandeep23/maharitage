# Maharitage V2 Plain LoRA Smoke Test

## 1. Environment Versions
- **Python**: 3.13.9
- **mlx**: 0.32.0
- **mlx-vlm**: 0.6.13
- **transformers**: 5.14.1

## 2. Test Parameters
- **Model**: `mlx-community/Qwen2-VL-2B-Instruct-bf16`
- **Method**: Plain LoRA (bf16, unquantized)
- **Steps**: 20

## 3. Required Pipeline Checks
- **MODEL_LOAD**: PASS
- **PROCESSOR_LOAD**: PASS
- **IMAGE_FORWARD**: FAIL
- **TEXT_FORWARD**: FAIL
- **LOSS_FINITE**: FAIL
- **BACKWARD**: FAIL
- **LORA_ATTACHMENTS**: PASS
- **OPTIMIZER_STEP**: FAIL
- **CHECKPOINT_SAVE**: FAIL
- **PEAK_MEMORY**: N/A

## 4. Final Result
- **STATUS**: QWEN2_VL_MLXVLM_TRAINING_BLOCKED
