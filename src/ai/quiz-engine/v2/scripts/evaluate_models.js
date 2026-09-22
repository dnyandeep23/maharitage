const { GoogleGenerativeAI, SchemaType } = require('@google/generative-ai');
const fs = require('fs');
const path = require('path');

const apiKey = process.env.GEMINI_API_KEY;
if (!apiKey) {
  console.error("GEMINI_API_KEY not found in .env.local");
  process.exit(1);
}
const genAI = new GoogleGenerativeAI(apiKey);

const models = [
  'gemini-3.1-flash-lite',
  'gemini-3.5-flash',
  'gemini-3.5-flash-lite',
  'gemini-3.6-flash',
  'gemini-3.7-flash'
];

const imageSchema = {
  type: SchemaType.OBJECT,
  properties: {
    images: {
      type: SchemaType.ARRAY,
      description: "Array containing results mapped by image ID.",
      items: {
        type: SchemaType.OBJECT,
        properties: {
          image_id: { type: SchemaType.STRING, description: "The opaque image label provided in the prompt (e.g., IMAGE_A)" },
          questions: {
            type: SchemaType.ARRAY,
            description: "List of valid MCQs for this image.",
            items: {
              type: SchemaType.OBJECT,
              properties: {
                question_type: { type: SchemaType.STRING, description: "Must be exactly VISUAL_ONLY or IMAGE_CONTEXT" },
                category: { type: SchemaType.STRING, description: "One of the provided valid category strings" },
                question: { type: SchemaType.STRING, description: "The MCQ question text" },
                options: {
                  type: SchemaType.OBJECT,
                  description: "Exactly four distinct options mapped to A, B, C, D",
                  properties: {
                    A: { type: SchemaType.STRING },
                    B: { type: SchemaType.STRING },
                    C: { type: SchemaType.STRING },
                    D: { type: SchemaType.STRING }
                  },
                  required: ["A", "B", "C", "D"]
                },
                correct_option: { type: SchemaType.STRING, description: "Exactly one of A, B, C, or D" },
                visual_evidence: { type: SchemaType.STRING, description: "Precise description of what is seen in the image that proves the answer" }
              },
              required: ["question_type", "category", "question", "options", "correct_option", "visual_evidence"]
            }
          }
        },
        required: ["image_id", "questions"]
      }
    }
  },
  required: ["images"]
};

const imagePath = path.join(__dirname, 'test_image.jpg');
const imageBytes = fs.readFileSync(imagePath).toString("base64");

const prompt = `Generate up to 5 distinct, evidence-backed Maharashtra heritage MCQs for EACH image.
Process IMAGE_A independently.
Questions may be:
- VISUAL_ONLY
- IMAGE_CONTEXT
VISUAL_ONLY must be answerable from pixels alone.
IMAGE_CONTEXT may use the provided verified site context together with the image.
If fewer than 5 strong questions exist for an image, return fewer.
Do not invent or repeat questions.

Context: 
Site: Ellora Caves.
Description: A UNESCO World Heritage site known for its monumental rock-cut cave temples representing Buddhism, Hinduism, and Jainism.
Location: Chhatrapati Sambhajinagar district, Maharashtra.

Targets:
IMAGE_A`;

async function evaluate() {
  console.log("==================================================");
  console.log("MAHARITAGE V2 — FLASH MODEL POOL VERIFICATION");
  console.log("==================================================\n");

  for (const modelName of models) {
    console.log(`\nTesting Model: ${modelName}`);
    let imageSupport = "FAIL";
    let structuredOutput = "FAIL";
    let latencyMs = 0;
    let questionsReturned = 0;
    let questionsAccepted = 0;
    let validationErrors = 0;
    let status = "REJECTED";

    try {
      const model = genAI.getGenerativeModel({
        model: modelName,
        generationConfig: {
          temperature: 0.0,
          responseMimeType: "application/json",
          responseSchema: imageSchema,
        }
      });

      const contentArray = [
        prompt,
        { inlineData: { data: imageBytes, mimeType: 'image/jpeg' } }
      ];

      const start = Date.now();
      const res = await model.generateContent(contentArray);
      latencyMs = Date.now() - start;
      imageSupport = "PASS";

      const text = res.response.text();
      let parsed = null;
      try {
        parsed = JSON.parse(text);
        structuredOutput = "PASS";
      } catch (e) {
        validationErrors++;
      }

      if (parsed && parsed.images && parsed.images[0] && parsed.images[0].questions) {
        questionsReturned = parsed.images[0].questions.length;
        
        for (const q of parsed.images[0].questions) {
          let errs = 0;
          if (!["VISUAL_ONLY", "IMAGE_CONTEXT"].includes(q.question_type)) errs++;
          if (!q.options || !q.options.A || !q.options.B || !q.options.C || !q.options.D) errs++;
          if (!['A', 'B', 'C', 'D'].includes(q.correct_option)) errs++;
          if (!q.visual_evidence) errs++;

          if (errs === 0) {
            questionsAccepted++;
          } else {
            validationErrors += errs;
          }
        }
      }

      if (imageSupport === "PASS" && structuredOutput === "PASS" && questionsAccepted > 0 && validationErrors === 0) {
        status = "APPROVED";
      }

    } catch (e) {
      if (e.message.toLowerCase().includes("image") || e.message.toLowerCase().includes("support")) {
        imageSupport = "FAIL (Not Supported)";
      } else {
        imageSupport = `ERROR: ${e.message}`;
      }
    }

    console.log(`MODEL = ${modelName}`);
    console.log(`IMAGE_SUPPORT = ${imageSupport}`);
    console.log(`STRUCTURED_OUTPUT = ${structuredOutput}`);
    console.log(`LATENCY = ${latencyMs}ms`);
    console.log(`QUESTIONS_RETURNED = ${questionsReturned}`);
    console.log(`QUESTIONS_ACCEPTED = ${questionsAccepted}`);
    console.log(`VALIDATION_ERRORS = ${validationErrors}`);
    console.log(`STATUS = ${status}`);
    console.log("--------------------------------------------------");
  }
}

evaluate();
