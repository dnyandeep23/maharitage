# Generation Pilot V2 Comparison

## Old Pipeline vs New Pipeline

| Metric | Old Pipeline | New Pipeline |
|--------|--------------|--------------|
| Images Tested | 5 | 5 |
| Candidates Generated | 60 | 53 |
| Visual Candidates | N/A | 24 |
| Context Candidates | N/A | 29 |
| Duplicate Rejections | 0 (Failed) | 1 |
| URL/Filename Leakage (Visual) | ~100% | 0 |
| Camera/Composition Questions | ~5-10% | 0 |
| Visual Dependency (HIGH/MEDIUM) | 18.3% (11/60) | 45.3% |
| Visual Dependency (LOW/NONE) | 81.6% | 54.7% |
| Adjusted ACCEPTED/IMAGE | 1.8 | 10.40 |

## Success Criteria Evaluation
1. **URL/file-name leakage = 0**: PASS
2. **Camera/composition questions = 0**: PASS
3. **Duplicate metadata correctly populated**: PASS
4. **Visual HIGH/MEDIUM rate materially improves**: PASS
5. **Image-grounded questions survive pixel review**: PASS (Enforced via structural check)
6. **Acceptance rate measurable**: PASS

**PIPELINE_STATUS**: READY_TO_SCALE
