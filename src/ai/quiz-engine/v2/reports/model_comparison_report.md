# Maharitage V2 — Model Comparison Report

FINAL_MODEL_COUNT = 8
EVALUATED_MODELS = 8
EXCLUDED_MODELS = 1
INTERNVL3-2B = EXCLUDED_BY_STUDY_SCOPE

## 1. Benchmark Configuration

- **Benchmark Version**: v2.0.1
- **Dataset SHA-256**: `3951af0d0c4de8874e6ef963645ecd0110b359f03c246cc692ec4ee4f3e97b63`
- **Total Questions**: 734 (152 Text, 582 Image)

## 2. Nine-Model Baseline Benchmark

| Model | Backend | Evals | Overall | Text | Image | Easy | Moderate | Hard | Invalid | Avg Latency | P95 |
|------|------|------:|------:|------:|------:|------:|------:|------:|------:|------:|------:|
| SmolVLM-256M-Instruct | transformers | 734 | 6.8% (50) | 2.0% (3) | 8.1% (47) | 0.0% (0) | 7.0% (50) | 0.0% (0) | 301 | 0.97s | 1.54s |
| SmolVLM-500M-Instruct | transformers | 734 | 42.5% (312) | 14.5% (22) | 49.8% (290) | 23.1% (3) | 42.8% (308) | 50.0% (1) | 118 | 1.09s | 1.70s |
| llava-onevision-qwen2-0.5b | transformers | 734 | 57.4% (421) | 45.4% (69) | 60.5% (352) | 69.2% (9) | 57.2% (411) | 50.0% (1) | 24 | 1.96s | 7.36s |
| Qwen2-VL-2B-Instruct-MLX | mlx_vlm | 734 | 59.3% (435) | 39.5% (60) | 64.4% (375) | 53.8% (7) | 59.4% (427) | 50.0% (1) | 56 | 9.35s | 18.01s |
| Qwen3-VL-2B-Instruct | transformers(isolated) | 734 | 65.7% (482) | 59.2% (90) | 67.4% (392) | 84.6% (11) | 65.2% (469) | 100.0% (2) | 0 | 33.64s | 236.78s |
| Qwen2.5-VL-3B-Instruct | transformers | 734 | 74.4% (546) | 65.8% (100) | 76.6% (446) | 92.3% (12) | 74.0% (532) | 100.0% (2) | 2 | 6.91s | 25.34s |
| Qwen3-VL-4B-Instruct | transformers(isolated) | 734 | 65.9% (484) | 63.8% (97) | 66.5% (387) | 76.9% (10) | 65.6% (472) | 100.0% (2) | 0 | 21.06s | 26.66s |
| gemma-3-4b-it | transformers | 734 | 72.6% (533) | 61.2% (93) | 75.6% (440) | 92.3% (12) | 72.2% (519) | 100.0% (2) | 0 | 11.35s | 13.94s |

## 3. Category Breakdown

Valid-Response Accuracy focuses only on questions where the model produced a parseable A/B/C/D answer.

| Model | Overall Accuracy | Valid-Response Accuracy | 95% CI (Bootstrap) |
|-------|------------------|-------------------------|--------------------|
| SmolVLM-256M-Instruct | 6.8% | 11.5% | [5.0%, 8.7%] |
| SmolVLM-500M-Instruct | 42.5% | 50.6% | [39.0%, 46.2%] |
| llava-onevision-qwen2-0.5b | 57.4% | 59.3% | [53.7%, 60.8%] |
| Qwen2-VL-2B-Instruct-MLX | 59.3% | 64.2% | [55.7%, 62.8%] |
| Qwen3-VL-2B-Instruct | 65.7% | 65.7% | [62.3%, 69.1%] |
| Qwen2.5-VL-3B-Instruct | 74.4% | 74.6% | [71.1%, 77.5%] |
| Qwen3-VL-4B-Instruct | 65.9% | 65.9% | [62.4%, 69.2%] |
| gemma-3-4b-it | 72.6% | 72.6% | [69.3%, 75.9%] |

## 4. Site-Level Performance

| Model | Aja0003 | Ele0005 | Fort0001 | Fort0002 | Fort0003 | Fort0004 | Fort0005 | Kan0004 |
|-------|---|---|---|---|---|---|---|---|
| SmolVLM-256M-Instruct | 5.8% (4/69) | 8.7% (2/23) | 10.0% (9/90) | 5.6% (3/54) | 6.8% (5/74) | 5.7% (3/53) | 9.5% (7/74) | 5.7% (17/297) | 
| SmolVLM-500M-Instruct | 31.9% (22/69) | 13.0% (3/23) | 52.2% (47/90) | 40.7% (22/54) | 25.7% (19/74) | 37.7% (20/53) | 50.0% (37/74) | 47.8% (142/297) | 
| llava-onevision-qwen2-0.5b | 62.3% (43/69) | 34.8% (8/23) | 61.1% (55/90) | 63.0% (34/54) | 48.6% (36/74) | 60.4% (32/53) | 54.1% (40/74) | 58.2% (173/297) | 
| Qwen2-VL-2B-Instruct-MLX | 50.7% (35/69) | 21.7% (5/23) | 43.3% (39/90) | 55.6% (30/54) | 58.1% (43/74) | 54.7% (29/53) | 51.4% (38/74) | 72.7% (216/297) | 
| Qwen3-VL-2B-Instruct | 82.6% (57/69) | 69.6% (16/23) | 48.9% (44/90) | 46.3% (25/54) | 70.3% (52/74) | 43.4% (23/53) | 63.5% (47/74) | 73.4% (218/297) | 
| Qwen2.5-VL-3B-Instruct | 76.8% (53/69) | 56.5% (13/23) | 64.4% (58/90) | 74.1% (40/54) | 73.0% (54/74) | 58.5% (31/53) | 71.6% (53/74) | 82.2% (244/297) | 
| Qwen3-VL-4B-Instruct | 75.4% (52/69) | 47.8% (11/23) | 52.2% (47/90) | 64.8% (35/54) | 56.8% (42/74) | 58.5% (31/53) | 62.2% (46/74) | 74.1% (220/297) | 
| gemma-3-4b-it | 76.8% (53/69) | 39.1% (9/23) | 64.4% (58/90) | 59.3% (32/54) | 78.4% (58/74) | 58.5% (31/53) | 67.6% (50/74) | 81.5% (242/297) | 

<!-- ## 5. Statistical Comparison

McNemar's Test for paired accuracy differences:

| Comparison | Chi-Square | p-value | Significance |
|------------|------------|---------|--------------|
| Qwen2-VL-2B-Instruct-MLX vs Qwen3-VL-2B-Instruct | 7.75 | 0.0054 | ** (p<0.01) Model B > Model A |
| Qwen2-VL-2B-Instruct-MLX vs Qwen2.5-VL-3B-Instruct | 60.20 | 0.0000 | *** (p<0.001) Model B > Model A |
| Qwen2-VL-2B-Instruct-MLX vs Qwen3-VL-4B-Instruct | 8.96 | 0.0028 | ** (p<0.01) Model B > Model A |
| Qwen3-VL-2B-Instruct vs Qwen3-VL-4B-Instruct | 0.01 | 0.9415 | n.s.  | -->

## 6. Model Selection

- **Best Overall**: Qwen2.5-VL-3B-Instruct
- **Best Image**: Qwen2.5-VL-3B-Instruct
- **Best Text**: Qwen2.5-VL-3B-Instruct
