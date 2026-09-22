# Local VLM Availability Precheck

| Model | Runtime | Repository | Load | MPS/Backend | Inference | Latency | Status |
|-------|---------|------------|------|-------------|-----------|---------|--------|
| SmolVLM-256M-Instruct | Transformers | HuggingFaceTB/SmolVLM-256M-Instruct | 6.5s | MPS | PASS | 1.6s | READY_TRANSFORMERS |
| SmolVLM-500M-Instruct | Transformers | HuggingFaceTB/SmolVLM-500M-Instruct | 7.0s | MPS | PASS | 1.4s | READY_TRANSFORMERS |
| llava-onevision-0.5b | Transformers | llava-hf/llava-onevision-qwen2-0.5b-ov-hf | 9.5s | MPS | PASS | 1.4s | READY_TRANSFORMERS |
| moondream2 | Transformers | vikhyatk/moondream2 | 7.4s | MPS | PASS | 9.3s | NOT_PRACTICAL |
| Qwen2-VL-2B-Instruct (4bit) | MLX | mlx-community/Qwen2-VL-2B-Instruct-4bit | 1.4s | MLX/MPS | PASS | 1.2s | READY_MLX_4BIT |
