# QLoRA GPU Export Package

This directory contains everything needed to fine-tune `Qwen2-VL-2B-Instruct` using 4-bit QLoRA on a CUDA-enabled NVIDIA GPU.

## Requirements
```bash
pip install -r requirements.txt
```

## Running the Smoke Test
```bash
python train_qlora.py --smoke-test
```

## Running Full Training
```bash
python train_qlora.py --train
```

## Evaluation
```bash
python evaluate_base_vs_qlora.py
```
