# Maharitage V2 QLoRA Precheck

## 1. Dataset Manifests & Integrity
- **TRAIN_QUESTIONS**: 662
- **VALIDATION_QUESTIONS**: 23
- **TEST_QUESTIONS**: 54
- **TRAIN_SITES**: 6
- **VALIDATION_SITES**: 1
- **TEST_SITES**: 1
- **SITE_LEAKAGE**: NONE ✅

## 2. Formatting Errors
- **IMAGE_PATH_ERRORS**: 0
- **TEXT_FORMAT_ERRORS**: 0

## 3. Serialized Training Sample
```json
{
  "messages": [
    {
      "role": "user",
      "content": [
        {
          "type": "text",
          "text": "You are answering a multiple-choice Maharashtra heritage question.\n\nChoose exactly one option: A, B, C, or D.\n\nReturn only:\n\nANSWER: <A/B/C/D>\nCONFIDENCE: <0 to 1>\n\nQuestion: Which ruling dynasty is historically associated with the Ajanta Caves during their development around the 5th Century CE?\nA) The Gupta Dynasty\nB) The Vakataka Dynasty\nC) The Maurya Dynasty\nD) The Satavahana Dynasty"
        }
      ]
    },
    {
      "role": "assistant",
      "content": "ANSWER: B"
    }
  ]
}
```

## 4. Hardware & Software Stack
- **QLORA_STACK_STATUS**: READY (mlx-vlm, datasets, peft installed)
- **ESTIMATED_MEMORY**: 10GB-14GB Unified Memory (M1/M2/M3 Max dependent on context length)
- **ESTIMATED_TRAINING_TIME**: ~2-3 Hours per Epoch (approx 15-20 min per 100 steps at batch 1)

## 5. Proposed First-Pass Configuration
- **LoRA Rank**: 16 (captures sufficient attention/FFN adaptation)
- **LoRA Alpha**: 32 (standard x2 scaling)
- **Dropout**: 0.05
- **Learning Rate**: 2e-5 (conservative for vision-language finetuning)
- **Epochs**: 2 (to prevent severe overfitting on a 500-question train set)
- **Batch Size**: 1 (constrained by MPS activation memory)
- **Gradient Accumulation**: 4 (effective batch size = 4)
- **Modules**: `q_proj`, `v_proj`, `k_proj`, `o_proj`, `gate_proj`, `up_proj`, `down_proj` (full LLM backbone targeting, vision encoder frozen)
