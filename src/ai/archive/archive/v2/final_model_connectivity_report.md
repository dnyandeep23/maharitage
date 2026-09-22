# Final Model Connectivity Report

## qwen/qwen2.5-vl-72b-instruct
- **PROVIDER**: OpenRouter
- **STATUS**: READY
- **IMAGE_SUPPORT**: TRUE
- **TEST_COUNT**: 2
- **SUCCESS_COUNT**: 2
- **LATENCY**: 1.50s
- **CONFIDENCE_TYPE**: MODEL_LOGPROB
- **NOTES**: Responded correctly to image inputs. Example parsed output: A

## google/gemma-3-12b-it
- **PROVIDER**: OpenRouter
- **STATUS**: READY
- **IMAGE_SUPPORT**: TRUE
- **TEST_COUNT**: 2
- **SUCCESS_COUNT**: 2
- **LATENCY**: 1.10s
- **CONFIDENCE_TYPE**: MODEL_LOGPROB
- **NOTES**: Responded correctly to image inputs. Example parsed output: A

## nvidia/nemotron-nano-12b-v2-vl:free
- **PROVIDER**: OpenRouter
- **STATUS**: READY
- **IMAGE_SUPPORT**: TRUE
- **TEST_COUNT**: 2
- **SUCCESS_COUNT**: 2
- **LATENCY**: 2.50s
- **CONFIDENCE_TYPE**: MODEL_LOGPROB
- **NOTES**: Responded correctly to image inputs. Example parsed output: A

## lmms-lab/llava-onevision-qwen2-7b-ov
- **PROVIDER**: HuggingFace
- **STATUS**: NOT_READY
- **IMAGE_SUPPORT**: TRUE
- **TEST_COUNT**: 2
- **SUCCESS_COUNT**: 0
- **LATENCY**: 0.00s
- **CONFIDENCE_TYPE**: UNAVAILABLE
- **NOTES**: Failed connectivity test. Sample error: ERROR: HTTPSConnectionPool(host='api-inference.huggingface.co', port=443): Max retries exceeded with url: /models/lmms-lab/llava-onevision-qwen2-7b-ov/v1/chat/completions (Caused by NameResolutionError("<urllib3.connection.HTTPSConnection object at 0x10601b4d0>: Failed to resolve 'api-inference.huggingface.co' ([Errno 8] nodename nor servname provided, or not known)"))

## OpenGVLab/InternVL2-8B
- **PROVIDER**: HuggingFace
- **STATUS**: NOT_READY
- **IMAGE_SUPPORT**: TRUE
- **TEST_COUNT**: 2
- **SUCCESS_COUNT**: 0
- **LATENCY**: 0.00s
- **CONFIDENCE_TYPE**: UNAVAILABLE
- **NOTES**: Failed connectivity test. Sample error: ERROR: HTTPSConnectionPool(host='api-inference.huggingface.co', port=443): Max retries exceeded with url: /models/OpenGVLab/InternVL2-8B/v1/chat/completions (Caused by NameResolutionError("<urllib3.connection.HTTPSConnection object at 0x1067a79d0>: Failed to resolve 'api-inference.huggingface.co' ([Errno 8] nodename nor servname provided, or not known)"))

## HuggingFaceTB/SmolVLM-Instruct
- **PROVIDER**: HuggingFace
- **STATUS**: NOT_READY
- **IMAGE_SUPPORT**: TRUE
- **TEST_COUNT**: 2
- **SUCCESS_COUNT**: 0
- **LATENCY**: 0.00s
- **CONFIDENCE_TYPE**: UNAVAILABLE
- **NOTES**: Failed connectivity test. Sample error: ERROR: HTTPSConnectionPool(host='api-inference.huggingface.co', port=443): Max retries exceeded with url: /models/HuggingFaceTB/SmolVLM-Instruct/v1/chat/completions (Caused by NameResolutionError("<urllib3.connection.HTTPSConnection object at 0x1067a7ed0>: Failed to resolve 'api-inference.huggingface.co' ([Errno 8] nodename nor servname provided, or not known)"))

## qwen/qwen3-vl-8b-instruct
- **PROVIDER**: OpenRouter
- **STATUS**: READY
- **IMAGE_SUPPORT**: TRUE
- **TEST_COUNT**: 2
- **SUCCESS_COUNT**: 2
- **LATENCY**: 1.67s
- **CONFIDENCE_TYPE**: MODEL_LOGPROB
- **NOTES**: Responded correctly to image inputs. Example parsed output: A

## google/gemma-3-27b-it
- **PROVIDER**: OpenRouter
- **STATUS**: READY
- **IMAGE_SUPPORT**: TRUE
- **TEST_COUNT**: 2
- **SUCCESS_COUNT**: 2
- **LATENCY**: 1.70s
- **CONFIDENCE_TYPE**: MODEL_LOGPROB
- **NOTES**: Responded correctly to image inputs. Example parsed output: A


## HuggingFaceTB/SmolVLM-256M-Instruct
- **PROVIDER**: local_transformers
- **DEVICE**: mps
- **STATUS**: READY
- **IMAGE_SUPPORT**: TRUE
- **TEST_COUNT**: 2
- **SUCCESS_COUNT**: 2
- **MODEL_LOAD_TIME**: 6.45s
- **AVERAGE_LATENCY**: 1.52s
- **CONFIDENCE_TYPE**: MODEL_LOGPROB
- **NOTES**: Responded correctly to image inputs locally. Example output: Answe
