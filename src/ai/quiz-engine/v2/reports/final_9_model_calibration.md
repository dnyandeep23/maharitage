# Final 9-Model Calibration Report

ENVIRONMENT:
- Python/PyTorch/Transformers/MLX versions logged in main output.
DEPENDENCIES_INSTALLED: None new. Existing einops, timm, mlx, transformers used.

| Model | Backend | Load | Image | Text | Valid | Invalid | Accuracy | Avg Latency | Status |
|-------|---------|------|-------|------|-------|---------|----------|-------------|--------|
| SmolVLM-256M-Instruct | transformers | OK | YES | YES | 3 | 2 | 0.0% | 0.75s | PASS |
| SmolVLM-500M-Instruct | transformers | OK | YES | YES | 3 | 2 | 20.0% | 0.87s | PASS |
| llava-onevision-qwen2-0.5b | transformers | OK | YES | YES | 5 | 0 | 80.0% | 0.79s | PASS |
| Qwen2-VL-2B-Instruct-MLX | mlx_vlm | OK | YES | YES | 3 | 2 | 20.0% | 0.59s | PASS |
| Qwen3-VL-2B-Instruct | transformers(isolated) | OK | YES | YES | 5 | 0 | 80.0% | 17.85s | PASS |
| Qwen2.5-VL-3B-Instruct | transformers | OK | YES | YES | 5 | 0 | 60.0% | 3.35s | PASS |
| Qwen3-VL-4B-Instruct | transformers(isolated) | OK | YES | YES | 5 | 0 | 60.0% | 33.51s | PASS |
| InternVL3-2B | transformers(isolated) | OK | YES | YES | 5 | 0 | 60.0% | 10.04s | PASS |
| gemma-3-4b-it | transformers | OK | YES | YES | 5 | 0 | 60.0% | 5.17s | PASS |


CAN_ALL_9_MODELS_BE_EVALUATED = YES
