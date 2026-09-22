# Maharitage V2 — Full Dataset Model Accuracy Comparison

## Dataset

- **Total questions**: 739
- **Text questions**: 152
- **Image questions**: 587
- **Number of sites**: 8

## Main Results

| Rank | Model | Backend | Questions | Overall Accuracy | Image Accuracy | Text Accuracy | Easy | Moderate | Hard | Invalid | Timeout | Avg Latency | P95 Latency |
|------|-------|---------|-----------|------------------|----------------|---------------|------|----------|------|---------|---------|-------------|-------------|
| 1 | Qwen2-VL-2B-Instruct-4bit | MLX 4-bit | 739 | 464/739 (62.8%) | 64.2% | 57.2% | 69.2% | 62.7% | 50.0% | 25 | 0 | 1.33s | 4.06s |
| 2 | llava-onevision-qwen2-0.5b-ov-hf | Transformers/MPS | 739 | 394/739 (53.3%) | 53.3% | 53.3% | 53.8% | 53.2% | 100.0% | 13 | 0 | 1.57s | 3.53s |
| 3 | SmolVLM-500M-Instruct | Transformers/MPS | 739 | 346/739 (46.8%) | 53.8% | 19.7% | 53.8% | 46.8% | 0.0% | 83 | 0 | 1.24s | 1.84s |
| 4 | SmolVLM-256M-Instruct | Transformers/MPS | 739 | 98/739 (13.3%) | 16.4% | 1.3% | 0.0% | 13.5% | 0.0% | 4 | 0 | 1.08s | 1.79s |
