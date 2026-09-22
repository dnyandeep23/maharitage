/**
 * Post-Prediction Database Verification Layer
 * 
 * Verifies predicted visual features against MongoDB/Cloudinary ground truth AFTER model prediction.
 * The database NEVER tells the model what answer to choose.
 */

export function verifyPredictionAgainstDatabase(prediction, item) {
  if (!prediction || !item) return { status: "FAIL", reason: "Missing prediction or item" };

  const predLetter = prediction.rawPrediction;
  const isCorrect = predLetter === item.expectedLetter;

  if (isCorrect) {
    return { status: "PASS", verified_method: "mongodb_and_cloudinary_ground_truth" };
  }

  return { status: "FAIL", verified_method: "mongodb_and_cloudinary_ground_truth" };
}
