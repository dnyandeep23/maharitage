# Model Loader Preflight Report

| Model | Repo | Loader | Load | Image Inference | Output | Status |
|------|------|--------|------|-----------------|--------|--------|
| SmolVLM-256M | HuggingFaceTB/SmolVLM-256M-Instruct | SmolVLMAdapter | OK | FAILED | ERROR: 'NoneType' object has no attribute 'read' | RUNTIME_FAILED |
| SmolVLM-500M | HuggingFaceTB/SmolVLM-500M-Instruct | SmolVLMAdapter | OK | FAILED | ERROR: 'NoneType' object has no attribute 'read' | RUNTIME_FAILED |
| llava-onevision-0.5b | llava-hf/llava-onevision-qwen2-0.5b-ov-hf | LlavaAdapter | OK | FAILED | ERROR: 'NoneType' object has no attribute 'read' | RUNTIME_FAILED |
| Qwen2-VL-2B-MLX | mlx-community/Qwen2-VL-2B-Instruct-4bit | QwenMLXAdapter | OK | FAILED | ERROR: Failed to process inputs with error: tuple ... | RUNTIME_FAILED |
| Qwen3-VL-2B | Qwen/Qwen3-VL-2B-Instruct | QwenTransformersAdapter | FAILED | FAILED |  | LOAD_FAILED |
| Qwen2.5-VL-3B | Qwen/Qwen2.5-VL-3B-Instruct | QwenTransformersAdapter | OK | FAILED | ERROR: 'NoneType' object has no attribute 'read' | RUNTIME_FAILED |
| Qwen3-VL-4B | Qwen/Qwen3-VL-4B-Instruct | QwenTransformersAdapter | OK | FAILED | ERROR: 'NoneType' object has no attribute 'read' | RUNTIME_FAILED |
| InternVL3-2B | OpenGVLab/InternVL3-2B | InternVLAdapter | FAILED | FAILED |  | LOAD_FAILED |
| gemma-3-4b-it | google/gemma-3-4b-it | GemmaAdapter | FAILED | FAILED |  | AUTH_REQUIRED |

**READY_MODELS**: 0
**FAILED_MODELS**: 9

**LOADER_ERRORS**:
- SmolVLM-256M: ERROR: 'NoneType' object has no attribute 'read'
- SmolVLM-500M: ERROR: 'NoneType' object has no attribute 'read'
- llava-onevision-0.5b: ERROR: 'NoneType' object has no attribute 'read'
- Qwen2-VL-2B-MLX: ERROR: Failed to process inputs with error: tuple index out of range
- Qwen3-VL-2B: 
- Qwen2.5-VL-3B: ERROR: 'NoneType' object has no attribute 'read'
- Qwen3-VL-4B: ERROR: 'NoneType' object has no attribute 'read'
- InternVL3-2B: 
