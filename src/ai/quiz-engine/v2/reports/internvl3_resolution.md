# InternVL3-2B Resolution Report

PYTHON = 3.12.14 (Dedicated Environment via Homebrew)
TRANSFORMERS = 4.44.2 (Pinned)
TORCH = 2.13.0
EINOPS = 0.8.2
TIMM = 1.0.28
FLASH_ATTENTION = OPTIONAL (Not installed, not required for MPS)
ACCELERATE_VERSION = 1.14.0
MODEL_LOAD = PASS (via MPS with device_map="auto")
IMAGE = PASS (Output: C)
TEXT = PASS (Output: B)
PARSER = PASS
STATUS = READY

## ROOT CAUSE
The model `OpenGVLab/InternVL3-2B` relies on a `trust_remote_code` implementation that directly references `InternVLChatModel.all_tied_weights_keys`. This attribute was completely refactored in `transformers >= 5.0.0` (the version in the main `.venv`). 

Furthermore, `transformers==4.44.2` requires `tokenizers==0.19.1`, which lacks pre-built wheels for Python 3.13+ and relies on an older PyO3 Rust crate that explicitly caps support at Python 3.12, causing fatal compilation errors on newer Python environments.

## FIX
A dedicated, fully isolated environment was created to support the strict requirements:
1. Provisioned a specific Python 3.12 runtime (`/opt/homebrew/bin/python3.12`) via Homebrew.
2. Initialized an isolated `.venv_internvl`.
3. Pinned backward-compatible dependencies: `transformers==4.44.2`, `torch`, `torchvision`, `einops`, `timm`, and `Pillow` (documented in `src/ai/quiz-engine/v2/scripts/internvl_requirements.txt`).
4. Used the official HuggingFace loading path (`AutoTokenizer`, `AutoModel`, `trust_remote_code=True`).
5. Targeted the Apple Silicon `mps` device.

The isolated environment seamlessly executed both `IMAGE_MCQ` and `TEXT_MCQ` inference using the official `model.chat()` endpoint without requiring global monkeypatches or CUDA-only packages like FlashAttention2.
