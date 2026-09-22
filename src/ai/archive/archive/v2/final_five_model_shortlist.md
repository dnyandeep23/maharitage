# Maharitage V2 — Final 5-Model Shortlist

This report summarizes the five vision-language models verified and selected for the V2 pilot benchmark evaluation. The models span a spectrum of sizes and inference backends, designed to compare lightweight local inference against larger hosted APIs.

## 1. HuggingFaceTB/SmolVLM-256M-Instruct

- **Exact Model ID**: `HuggingFaceTB/SmolVLM-256M-Instruct`
- **Family**: Idefics3 / SmolVLM
- **Approximate Parameters**: 256 Million
- **Inference Backend**: Local MPS (Transformers)
- **Why Included**: Ultra-lightweight academic baseline. Essential for determining if extremely constrained local models can effectively parse historical and architectural Indian heritage image data.
- **Status**: READY
- **Known Limitations**: Due to its extremely small size, reasoning depth is constrained.

## 2. HuggingFaceTB/SmolVLM-500M-Instruct

- **Exact Model ID**: `HuggingFaceTB/SmolVLM-500M-Instruct`
- **Family**: Idefics3 / SmolVLM
- **Approximate Parameters**: 500 Million
- **Inference Backend**: Local MPS (Transformers)
- **Why Included**: A step up from the 256M model while remaining highly efficient for edge deployment. Tests the capability scaling at the sub-1B parameter threshold.
- **Status**: READY
- **Known Limitations**: Still under 1B parameters; complex visual QA might be brittle.

## 3. mlx-community/Qwen2-VL-2B-Instruct-4bit

- **Exact Model ID**: `mlx-community/Qwen2-VL-2B-Instruct-4bit`
- **Family**: Qwen2-VL
- **Approximate Parameters**: 2 Billion (4-bit quantized)
- **Inference Backend**: Local MLX (Apple Silicon)
- **Why Included**: Strong representation of a state-of-the-art ~2B parameter model running natively and efficiently on Apple Silicon via MLX. Provides a crucial "capable edge" data point.
- **Status**: READY
- **Known Limitations**: Requires MLX framework for efficient execution; quantization may marginally impact nuanced visual parsing.

## 4. qwen/qwen3-vl-8b-instruct

- **Exact Model ID**: `qwen/qwen3-vl-8b-instruct`
- **Family**: Qwen3-VL
- **Approximate Parameters**: 8 Billion
- **Inference Backend**: OpenRouter (Hosted API)
- **Why Included**: Acts as the mid-tier baseline. Validates the performance of modern 8B class models against the extremely small local models, providing a strong point of comparison for general vision-language capabilities.
- **Status**: READY
- **Known Limitations**: Relies on external hosted inference, introducing network latency and preventing fully offline execution.

## 5. google/gemma-3-12b-it

- **Exact Model ID**: `google/gemma-3-12b-it`
- **Family**: Gemma-3
- **Approximate Parameters**: 12 Billion
- **Inference Backend**: OpenRouter (Hosted API)
- **Why Included**: The largest model in the final shortlist. Represents the high-end capability ceiling for this benchmark to establish the "best possible" baseline accuracy across the visual reasoning categories.
- **Status**: READY
- **Known Limitations**: Cloud-dependent, highest latency, and highest cost if run extensively.
