# Model Loader Preflight V2

| MODEL | REPO | LOADER | IMAGE_PIPELINE | LOAD | INFERENCE | STATUS | ROOT_CAUSE |
|-------|------|--------|----------------|------|-----------|--------|------------|
| SmolVLM-256M | HuggingFaceTB/SmolVLM-256M-Instruct | SmolVLMAdapter | LOCAL_FILE | OK | OK | READY |  |
| SmolVLM-500M | HuggingFaceTB/SmolVLM-500M-Instruct | SmolVLMAdapter | LOCAL_FILE | OK | OK | READY |  |
| llava-onevision-0.5b | llava-hf/llava-onevision-qwen2-0.5b-ov-hf | LlavaAdapter | LOCAL_FILE | OK | OK | READY |  |
| Qwen2-VL-2B-MLX | mlx-community/Qwen2-VL-2B-Instruct-4bit | QwenMLXAdapter | LOCAL_FILE | OK | OK | READY |  |
| Qwen3-VL-2B | Qwen/Qwen3-VL-2B-Instruct | Qwen3_Adapter | LOCAL_FILE | OK | FAILED | RUNTIME_FAILED | 'mlx.core.array' object has no attribute 'device' |
| Qwen2.5-VL-3B | Qwen/Qwen2.5-VL-3B-Instruct | Qwen2_5_Adapter | LOCAL_FILE | OK | OK | READY |  |
| Qwen3-VL-4B | Qwen/Qwen3-VL-4B-Instruct | Qwen3_Adapter | LOCAL_FILE | OK | FAILED | RUNTIME_FAILED | 'mlx.core.array' object has no attribute 'device' |
| InternVL3-2B | OpenGVLab/InternVL3-2B | InternVLAdapter | LOCAL_FILE | FAILED | SKIPPED | LOAD_FAILED | 'InternVLChatModel' object has no attribute 'all_tied_weights_keys' |
| gemma-3-4b-it | google/gemma-3-4b-it | GemmaAdapter | LOCAL_FILE | FAILED | SKIPPED | AUTH_REQUIRED | Gated model, HF token required. |
