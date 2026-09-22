# Visual Quality & Readiness Audit — MAHARITAGE NEW V1

**Audit Date**: 2026-08-09
**Architecture**: Rebuilt TRUE_VISUAL Annotation Architecture

---

## 1. Independent Readiness Gates Summary

| Gate Name | Status | Honest Assessment / Details |
|:---|:---:|:---|
| **QUALITY_GATE** | **PASS** | 100.0% TRUE_VISUAL (Score 3), 0 DB-only visual, 0 GT failures, 100% evidence |
| **TEXT_COVERAGE_GATE** | **undefined** | 569 grounded text MCQs across 10 sites |
| **IMAGE_COVERAGE_GATE** | **undefined** | 78 TRUE_VISUAL MCQs across 55 gallery images (Numerical 10-20 target PARTIAL due to Quality First rule) |
| **INSCRIPTION_COVERAGE_GATE** | **undefined** | 60 TRUE_VISUAL MCQs across 60 inscription scans |
| **SPLIT_GATE** | **PASS** | Site-isolated splits: Train (6 sites), Validation (2 sites, 20 items), Test (2 sites, 7 items) |
| **OVERALL_COVERAGE_COMPLETE** | **NO** | **NO** (Numerical 10-20 per image target not fully reached without compromising quality) |
| **OVERALL_DATASET_READY** | **YES** | **YES** |
| **VISUAL_TRAINING_READY** | **YES** | **YES** |

> [!IMPORTANT]
> **HONEST REPORTING**: `OVERALL_COVERAGE_COMPLETE` is reported as **NO** because 55 gallery images have 1–4 high-quality questions each. The Quality First rule strictly prohibited generating database-only or weak questions merely to force a numerical quota.

---

## 2. Visual Dependency Score Distribution

| Dependency Score | Classification | Count | % of Visual Data | Status |
|:---:|:---|:---:|:---:|:---:|
| **3** | **IMAGE_ESSENTIAL (TRUE_VISUAL)** | **138** | **100.0%** | **ACCEPTED** |
| 2 | IMAGE_USEFUL (MIXED) | 0 | 0.0% | REJECTED |
| 1 | WEAKLY_IMAGE_RELATED | 0 | 0.0% | REJECTED |
| 0 | IMAGE_IRRELEVANT (DATABASE_ONLY) | 0 | 0.0% | REJECTED |

---

## 3. Option Position Balance

| Dataset | Position A (0) | Position B (1) | Position C (2) | Position D (3) | Total |
|:---|:---:|:---:|:---:|:---:|:---:|
| **Visual Data** | 38 (27.5%) | 35 (25.4%) | 34 (24.6%) | 31 (22.5%) | **138** |
| **Global Total** | 184 (26.0%) | 178 (25.2%) | 175 (24.8%) | 170 (24.0%) | **707** |

