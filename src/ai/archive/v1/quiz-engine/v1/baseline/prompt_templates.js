/**
 * Visual Baseline Prompt Templates
 * 
 * Defines standardized prompts for zero-shot evaluation modes:
 * - Mode A: Direct MCQ (A/B/C/D)
 * - Mode B: Visual Identification / Observation
 * - Mode C: Evidence-Grounded Answer ({ observation, option })
 * - Option Shuffle Test
 * - Distractor Robustness Test
 * - Minimal Text (Visual Leakage Protection)
 */

/**
 * Format options array into labeled A/B/C/D choices.
 */
export function formatOptions(options) {
  const labels = ["A", "B", "C", "D"];
  return options.map((opt, i) => `${labels[i]}) ${opt}`).join("\n");
}

/**
 * Mode A: Direct MCQ Prompt
 */
export function getDirectMcqPrompt(question, options) {
  return `<image>
Look at the image and answer the multiple-choice question.

Question: ${question}

Options:
${formatOptions(options)}

Return only the correct option letter (A, B, C, or D).`;
}

/**
 * Mode B: Visual Identification / Reasoning Prompt
 */
export function getVisualReasoningPrompt(question) {
  return `<image>
Describe the visual evidence in this image that is relevant to answering the following question:
"${question}"

Do not use external historical knowledge.
Do not guess information that cannot be seen in the photograph.
Focus strictly on visually observable features (architecture, pillars, carvings, materials, entrance, shapes).`;
}

/**
 * Mode C: Evidence-Grounded Answer Prompt
 */
export function getEvidenceGroundedPrompt(question, options) {
  return `<image>
Based only on the visible image evidence, identify which option best matches what is visibly shown.

Question: ${question}

Options:
${formatOptions(options)}

Return your answer strictly in the following format:
Observation: [Describe what is visibly seen in the photograph]
Option: [A, B, C, or D]`;
}

/**
 * Minimal Text Prompt (Strips site names/IDs for visual leakage test)
 */
export function getMinimalTextPrompt(question, options, siteName) {
  let cleanQ = question;
  if (siteName) {
    cleanQ = cleanQ.replace(new RegExp(siteName, "gi"), "this heritage site");
  }
  cleanQ = cleanQ.replace(/\(Aja\d+|\(Ell\d+|\(Kan\d+|\(Fort\d+/gi, "");

  return `<image>
Look at the photograph and answer the question based strictly on what is visible:

Question: ${cleanQ}

Options:
${formatOptions(options)}

Return only A, B, C, or D.`;
}
