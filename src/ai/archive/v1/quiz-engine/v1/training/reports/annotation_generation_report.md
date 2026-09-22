# Annotation Generation & Investigation Report

## Pipeline Status

- **Total Discovered Assets**: 147
- **Evaluation-Locked Assets**: 55
- **Clean Training Candidate Assets**: 92
- **Previously Annotated**: 22
- **Successfully Annotated**: 22
- **Rejected Assets**: 70 (Gemini API 429 Rate Limit - Daily Free Tier Quota Exceeded)
- **Failed Assets**: 0

## Root Cause Analysis (Phase 1 Investigation)

1. `generate_clean_annotations.js` loops through all 92 clean assets and makes visual question generation requests to the Gemini VLM API (`gemini-2.5-flash`).
2. The Gemini API free tier enforces a strict daily limit of 20 requests per day per project/model (`generativelanguage.googleapis.com/generate_content_free_tier_requests`, limit: 20).
3. On the 23rd asset request, the API returned an HTTP 429 error (`RESOURCE_EXHAUSTED: Quota exceeded for metric generate_content_free_tier_requests`).
4. The previous generator script lacked rate-limiting delays and exponential backoff retry logic, causing all remaining 70 requests to immediately fail with 429 errors and register as rejections in `annotation_rejection_log.json`.

## Pipeline Improvements Implemented (Phase 2 & 3)

- **Resumable Execution**: Added file existence checks (`fs.existsSync`) to skip Gemini API calls for any asset that already has a valid saved JSON annotation in `src/ai/quiz-engine/v1/training/annotations/`.
- **Rate Limit Retry & Backoff**: Implemented retry logic (up to 5 attempts) reading the `retryDelay` field from Gemini 429 error payloads.
- **Inter-Request Delay**: Added a mandatory 2000ms delay between consecutive VLM API calls.
- **Strict Visual Rules**: Reinforced prompts enforcing `visual_dependency_score = 3` and rejecting non-visual metadata questions.
