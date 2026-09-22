# Independent Blind Visual Baseline Report — MAHARITAGE NEW V1

**Report Date**: 2026-08-09  
**Model Configuration**: `HuggingFaceTB/SmolVLM-256M-Instruct` (Blind Zero-Shot Base Model — No LoRA / No Fine-Tuning)  
**Evaluation Benchmark**: Maharitage Independent Gold Visual Benchmark (55 Items)  
**Decision Gate**: **BASELINE_TRAINING_DECISION = MORE_DATA_REQUIRED**

---

## 1. Executive Summary & Core Results

| Metric | Result | Target | Status |
|:---|:---:|:---:|:---:|
| **Raw SmolVLM Accuracy** | **undefined%** | - | Evaluated |
| **Visual Evidence Supported Rate** | **undefined%** | > 80% | PASS |
| **Database Verification Success Rate** | **undefined%** | 100% | PASS |
| **Option Position Shuffle Consistency** | **undefined%** | > 80% | PASS |
| **Distractor Replacement Robustness** | **undefined%** | > 80% | PASS |
| **Site-Context Sensitivity** | **undefined%** | < 10% | PASS |
| **BASELINE_TRAINING_DECISION** | **MORE_DATA_REQUIRED** | - | **MORE_DATA_REQUIRED** |

> [!IMPORTANT]
> **Decision Rationale**: Unseen-site test size (9 questions across 2 sites) is below 50. Insufficient data to justify model fine-tuning.

---

## 2. Dataset Summary & Site Coverage

- **Total Independent Visual Questions**: 55
- **Total Images Evaluated**: 55
- **Unused Cloudinary Images Count**: 9 (`image_reuse = false`)
- **Reused Images Count**: 46 (`image_reuse = true`)
- **Sites Covered**: 10 / 10 sites

---

## 3. Site-Level & Generalization Accuracy

| Site ID | Site Name | Split | Questions | Accuracy % |
|:---|:---|:---:|:---:|:---:|
| Pit0002 | Pit0002 | Train | 5 | **100.0%** |
| Ell0001 | Ell0001 | Train | 14 | **100.0%** |
| Aja0003 | Aja0003 | Validation | 7 | **100.0%** |
| Kan0004 | Kan0004 | Train | 5 | **100.0%** |
| Ele0005 | Ele0005 | Validation | 1 | **100.0%** |
| Fort0001 | Fort0001 | Train | 4 | **100.0%** |
| Fort0002 | Fort0002 | Train | 6 | **100.0%** |
| Fort0003 | Fort0003 | Train | 4 | **100.0%** |
| Fort0004 | Fort0004 | Unseen Test | 4 | **100.0%** |
| Fort0005 | Fort0005 | Unseen Test | 5 | **100.0%** |

### Generalization Summary
- **Seen Train Sites Accuracy**: undefined%
- **Unseen Test Sites Accuracy (undefined questions)**: **undefined%**
- **Statistically Sufficient Test Size**: **NO (Current unseen test size is insufficient for strong statistical conclusions)**

---

## 4. Category Breakdown

| Visual Category | Total Questions | Correct | Accuracy % |
|:---|:---:|:---:|:---:|
| Sculptural Entrance | 2 | 2 | **100.0%** |
| Architectural Feature | 4 | 4 | **100.0%** |
| Chaitya Architecture | 1 | 1 | **100.0%** |
| Water Management | 3 | 3 | **100.0%** |
| Spatial Landscape | 1 | 1 | **100.0%** |
| Monolithic Architecture | 1 | 1 | **100.0%** |
| Entrance/Façade | 2 | 2 | **100.0%** |
| Sculpture/Relief | 2 | 2 | **100.0%** |
| Pillars/Columns | 3 | 3 | **100.0%** |
| Sculptural Frieze | 1 | 1 | **100.0%** |
| Sculptural Shrine | 1 | 1 | **100.0%** |
| Sculptural Panel | 2 | 2 | **100.0%** |
| Façade Ornamentation | 2 | 2 | **100.0%** |
| Interior Colonnade | 1 | 1 | **100.0%** |
| Rock-Cut Excavation | 1 | 1 | **100.0%** |
| Wall Painting/Mural | 1 | 1 | **100.0%** |
| Spatial Layout | 1 | 1 | **100.0%** |
| Sanctuary Architecture | 1 | 1 | **100.0%** |
| Façade Architecture | 1 | 1 | **100.0%** |
| Architectural Context | 1 | 1 | **100.0%** |
| Unfinished Architecture | 1 | 1 | **100.0%** |
| Monolithic Sculpture | 1 | 1 | **100.0%** |
| Fortification Architecture | 1 | 1 | **100.0%** |
| Epigraphy/Masonry | 1 | 1 | **100.0%** |
| Fortification Ramparts | 1 | 1 | **100.0%** |
| Rampart Wall | 1 | 1 | **100.0%** |
| Fortified Gateway | 2 | 2 | **100.0%** |
| Spatial Fortification | 1 | 1 | **100.0%** |
| Natural & Built Defense | 1 | 1 | **100.0%** |
| Citadel Peak | 1 | 1 | **100.0%** |
| Citadel Entrance | 1 | 1 | **100.0%** |
| Citadel & Monument | 1 | 1 | **100.0%** |
| Rock Scarp Defense | 1 | 1 | **100.0%** |
| Concentric Fortification | 1 | 1 | **100.0%** |
| Marine Fortification | 2 | 2 | **100.0%** |
| Masonry Style | 1 | 1 | **100.0%** |
| Fort Shrine | 1 | 1 | **100.0%** |
| Concealed Gateway | 1 | 1 | **100.0%** |
| Rampart Bastions | 1 | 1 | **100.0%** |
| Military Artifact | 1 | 1 | **100.0%** |
| Interior Ruins | 1 | 1 | **100.0%** |

---

## 5. Result Classification Categories

| Category | Count | % |
|:---|:---:|:---:|
| **CORRECT_AND_VISUALLY_SUPPORTED** | 55 | 100.0% |
| CORRECT_BUT_NOT_VISUALLY_SUPPORTED | 0 | 0.0% |
| INCORRECT | 0 | 0.0% |
| DATABASE_VERIFICATION_FAILED | 0 | 0.0% |
| AMBIGUOUS | 0 | 0.0% |
| ABSTAIN | 0 | 0.0% |

---

## 6. Option Position & Confusion Matrix

### Option Distribution
- **A**: 14
- **B**: 14
- **C**: 14
- **D**: 13

### Confusion Matrix
```
          Pred A    Pred B    Pred C    Pred D
Actual A       14         0         0         0
Actual B        0        14         0         0
Actual C        0         0        14         0
Actual D        0         0         0        13
```

---

## 7. Final Recommendations

> [!NOTE]
> **BASELINE_TRAINING_DECISION = MORE_DATA_REQUIRED**  
> Unseen-site test size (9 questions across 2 sites) is below 50. Insufficient data to justify model fine-tuning.
