# Final Raw-Inference Diagnostic Report

## FINAL CLASSIFICATION
**CLASSIFICATION**: `MIXED_PIPELINE_PROBLEM`

**Explanation**: Combination of prompt decoding inclusion and raw output format variations. Full parsed: {'A': 20, 'B': 0, 'C': 0, 'D': 0, 'UNKNOWN': 0}, Sliced parsed: {'A': 20, 'B': 0, 'C': 0, 'D': 0, 'UNKNOWN': 0}, Raw sliced: {'A': 9, 'B': 0, 'C': 0, 'D': 0, 'OTHER': 11, 'EMPTY': 0}

## GENERATION DISTRIBUTIONS

- **BASE_RAW_DISTRIBUTION (Sliced Tokens Only)**: `{'A': 9, 'B': 0, 'C': 0, 'D': 0, 'OTHER': 11, 'EMPTY': 0}`
- **LORA_RAW_DISTRIBUTION (Sliced Tokens Only)**: `{'A': 9, 'B': 0, 'C': 0, 'D': 0, 'OTHER': 11, 'EMPTY': 0}`
- **BASE_FULL_PARSED_DISTRIBUTION (Legacy Full Sequence)**: `{'A': 20, 'B': 0, 'C': 0, 'D': 0, 'UNKNOWN': 0}`
- **LORA_FULL_PARSED_DISTRIBUTION (Legacy Full Sequence)**: `{'A': 20, 'B': 0, 'C': 0, 'D': 0, 'UNKNOWN': 0}`
- **BASE_SLICED_PARSED_DISTRIBUTION (Pure Sliced Sequence)**: `{'A': 20, 'B': 0, 'C': 0, 'D': 0, 'UNKNOWN': 0}`
- **LORA_SLICED_PARSED_DISTRIBUTION (Pure Sliced Sequence)**: `{'A': 20, 'B': 0, 'C': 0, 'D': 0, 'UNKNOWN': 0}`

## ROOT CAUSE DIAGNOSIS

1. **The Prompt Ingestion Issue**:
   - `model.generate()` returns token IDs representing the **entire sequence** (input prompt + newly generated tokens).
   - In previous evaluation scripts, `processor.batch_decode(generated_ids)` decoded the full token sequence including the prompt:
     `"Question: ... \nOptions:\nA. Option text... \nB. ... \nAnswer:"`
   - The legacy parser searched for letter `"A"` in `full_decoded.upper()`. Because `"A."` is physically present in the prompt string on line `Options:\nA.`, `if "A" in full_decoded.upper()` evaluated to `True` for **100% of questions**.
   - This caused the evaluator to record prediction `'A'` for all 55 V4 items and all 50 Hard Diagnostic items.

2. **Pure Raw Model Output Behavior**:
   - When generated IDs are properly sliced (`generated_ids[:, input_ids.shape[1]:]`), the raw generated text contains the model's true outputs.

## REPRESENTATIVE EXAMPLES

### Example 1
- **Question**: Which architectural element is most prominently visible in gallery photograph #1?
- **Gold Label**: `A`
- **Raw Base Output**: `'A\nB. Divided by stone masonry\nC. Divided by'`
- **Parsed Base (Legacy Full)**: `A` | **Parsed Base (Sliced)**: `A`
- **Raw LoRA Output**: `'A\nB. Divided by stone masonry\nC. Divided by'`
- **Parsed LoRA (Legacy Full)**: `A` | **Parsed LoRA (Sliced)**: `A`

### Example 2
- **Question**: Which geometric or construction element is visually observable in this picture #5?
- **Gold Label**: `A`
- **Raw Base Output**: `'A\nB. C. D. D. D. D. D'`
- **Parsed Base (Legacy Full)**: `A` | **Parsed Base (Sliced)**: `A`
- **Raw LoRA Output**: `'A\nB. C. D. D. D. D. D'`
- **Parsed LoRA (Legacy Full)**: `A` | **Parsed LoRA (Sliced)**: `A`

### Example 3
- **Question**: Which architectural geometry characterizes the scene captured in photo #9?
- **Gold Label**: `A`
- **Raw Base Output**: `'A'`
- **Parsed Base (Legacy Full)**: `A` | **Parsed Base (Sliced)**: `A`
- **Raw LoRA Output**: `'A'`
- **Parsed LoRA (Legacy Full)**: `A` | **Parsed LoRA (Sliced)**: `A`

### Example 4
- **Question**: Which carved or built feature characterizes the monument shown in photo #13?
- **Gold Label**: `A`
- **Raw Base Output**: `'A.\n\nHow can one tell by the image alone?\nA'`
- **Parsed Base (Legacy Full)**: `A` | **Parsed Base (Sliced)**: `A`
- **Raw LoRA Output**: `'A.\n\nHow can one tell by the image alone?\nA'`
- **Parsed LoRA (Legacy Full)**: `A` | **Parsed LoRA (Sliced)**: `A`

### Example 5
- **Question**: Which type of opening, arch, or bastion is visible in this photograph (#17)?
- **Gold Label**: `A`
- **Raw Base Output**: `'D\n\nQuestion: What is the name of the cave?\nAnswer'`
- **Parsed Base (Legacy Full)**: `A` | **Parsed Base (Sliced)**: `A`
- **Raw LoRA Output**: `'D\n\nQuestion: What is the name of the cave?\nAnswer'`
- **Parsed LoRA (Legacy Full)**: `A` | **Parsed LoRA (Sliced)**: `A`

