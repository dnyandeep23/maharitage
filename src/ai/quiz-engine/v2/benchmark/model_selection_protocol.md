# Model Selection Benchmark Protocol

## Protocol Definition
1. **Prompt Formulation**:
   ```
   {question}
   A. {options[0]}
   B. {options[1]}
   C. {options[2]}
   D. {options[3]}
   
   Answer strictly with the single letter of the correct option (A, B, C, or D).
   ```
2. **Image Input**: URL-based or Base64 encoded payload depending on API capability. Standard resolution constraint applied if API allows.
3. **Hyperparameters**:
   - `temperature`: 0.0 (greedy decoding)
   - `max_tokens`: 50
4. **Parsing Rules**:
   - Extract the first occurrence of A, B, C, or D using regex `r'\b[A-D]\b'` or matching the first letter of the output.
5. **Timeout and Retry**:
   - `connect_timeout`: 10s
   - `read_timeout`: 30s
   - `retry_policy`: Exponential backoff for HTTP 429 and 500-level errors, up to 3 attempts.
6. **API Failure Treatment**:
   - If exhausted, mark item as `TIMEOUT` or `API_ERROR`. Exclude from final comparative accuracy percentage, but log the failure rate for practicality scoring.
7. **Confidence Collection**:
   - Attempt to collect top logprob for the selected token.
   - If logprob is unavailable, use `self-reported` by running a follow-up: "Rate your confidence from 0 to 1".
8. **Latency Measurement**:
   - Wall-clock time tracked for each successful response in seconds.
