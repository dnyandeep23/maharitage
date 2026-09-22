/**
 * Option Position Balancer
 * 
 * Reorders options to achieve ~25% balance across A(0), B(1), C(2), D(3).
 * NEVER changes the correct answer — only repositions it.
 */

/**
 * Balance option positions across a dataset of annotations.
 * Target: ~25% of correct answers at each position (0, 1, 2, 3).
 * 
 * Returns { dataset, counts }.
 */
export function balanceDatasetOptions(annotations) {
  if (!Array.isArray(annotations) || annotations.length === 0) {
    return { dataset: [], counts: { 0: 0, 1: 0, 2: 0, 3: 0 } };
  }

  const counts = { 0: 0, 1: 0, 2: 0, 3: 0 };
  const total = annotations.length;
  const target = Math.ceil(total / 4);

  const balanced = annotations.map((ann, idx) => {
    if (!Array.isArray(ann.options) || ann.options.length !== 4) return ann;
    if (typeof ann.correct_option_index !== "number") return ann;

    const correctAnswer = ann.options[ann.correct_option_index];
    const distractors = ann.options.filter((_, i) => i !== ann.correct_option_index);

    // Find the position with the fewest assignments
    let targetPos = 0;
    let minCount = Infinity;
    for (let pos = 0; pos < 4; pos++) {
      if (counts[pos] < minCount) {
        minCount = counts[pos];
        targetPos = pos;
      }
    }

    // Build new options array with correct answer at targetPos
    const newOptions = [...distractors];
    newOptions.splice(targetPos, 0, correctAnswer);

    counts[targetPos]++;

    return {
      ...ann,
      options: newOptions,
      correct_option_index: targetPos
    };
  });

  return { dataset: balanced, counts };
}
