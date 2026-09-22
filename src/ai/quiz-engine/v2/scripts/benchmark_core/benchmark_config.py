from .model_adapters import (
    SmolVLMAdapter,
    LlavaAdapter,
    QwenMLXAdapter,
    Qwen3IsolatedAdapter,
    Qwen2_5_Adapter,
    InternVLIsolatedAdapter,
    GemmaAdapter
)

MODELS = {
    "SmolVLM-256M-Instruct": {"id": "HuggingFaceTB/SmolVLM-256M-Instruct", "precision": "bfloat16", "backend": "transformers", "adapter": SmolVLMAdapter},
    "SmolVLM-500M-Instruct": {"id": "HuggingFaceTB/SmolVLM-500M-Instruct", "precision": "bfloat16", "backend": "transformers", "adapter": SmolVLMAdapter},
    "llava-onevision-qwen2-0.5b": {"id": "llava-hf/llava-onevision-qwen2-0.5b-ov-hf", "precision": "float16", "backend": "transformers", "adapter": LlavaAdapter},
    "Qwen2-VL-2B-Instruct-MLX": {"id": "mlx-community/Qwen2-VL-2B-Instruct-4bit", "precision": "4-bit", "backend": "mlx_vlm", "adapter": QwenMLXAdapter},
    "Qwen3-VL-2B-Instruct": {"id": "Qwen/Qwen3-VL-2B-Instruct", "precision": "bfloat16", "backend": "transformers(isolated)", "adapter": Qwen3IsolatedAdapter},
    "Qwen2.5-VL-3B-Instruct": {"id": "Qwen/Qwen2.5-VL-3B-Instruct", "precision": "bfloat16", "backend": "transformers", "adapter": Qwen2_5_Adapter},
    "Qwen3-VL-4B-Instruct": {"id": "Qwen/Qwen3-VL-4B-Instruct", "precision": "bfloat16", "backend": "transformers(isolated)", "adapter": Qwen3IsolatedAdapter},
    "gemma-3-4b-it": {"id": "google/gemma-3-4b-it", "precision": "bfloat16", "backend": "transformers", "adapter": GemmaAdapter},
}
