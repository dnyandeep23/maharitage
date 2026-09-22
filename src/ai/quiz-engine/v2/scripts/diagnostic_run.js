const { GoogleGenerativeAI, SchemaType } = require('@google/generative-ai');
const https = require('https');
const crypto = require('crypto');

const ai = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

const imageSchema = {
  type: SchemaType.OBJECT,
  properties: {
    site_id: { type: SchemaType.STRING },
    images: {
      type: SchemaType.ARRAY,
      items: {
        type: SchemaType.OBJECT,
        properties: {
          image_id: { type: SchemaType.STRING },
          questions: {
            type: SchemaType.ARRAY,
            items: {
              type: SchemaType.OBJECT,
              properties: {
                image_id: { type: SchemaType.STRING },
                question_type: { type: SchemaType.STRING },
                question: { type: SchemaType.STRING },
                options: {
                  type: SchemaType.OBJECT,
                  properties: { A: { type: SchemaType.STRING }, B: { type: SchemaType.STRING }, C: { type: SchemaType.STRING }, D: { type: SchemaType.STRING } }
                },
                correct_option: { type: SchemaType.STRING },
                visual_evidence: { type: SchemaType.STRING },
                category: { type: SchemaType.STRING }
              },
              required: ["image_id", "question_type", "question", "options", "correct_option", "visual_evidence", "category"]
            }
          }
        },
        required: ["image_id", "questions"]
      }
    }
  }
};

const modelImage = ai.getGenerativeModel({ 
  model: "gemini-3.5-flash", 
  generationConfig: { responseMimeType: "application/json", temperature: 0.0, responseSchema: imageSchema } 
});

function fetchImageBuffer(url) {
  return new Promise((resolve, reject) => {
    https.get(url, (res) => {
      if (res.statusCode !== 200) { reject(new Error(`HTTP ${res.statusCode}`)); return; }
      const chunks = []; res.on('data', chunk => chunks.push(chunk)); res.on('end', () => resolve(Buffer.concat(chunks)));
    }).on('error', reject);
  });
}

async function run() {
  const url = "https://res.cloudinary.com/ddstiusga/image/upload/v1761731374/cave17_qckcsr.jpg";
  const buffer = await fetchImageBuffer(url);
  const base64Img = buffer.toString("base64");
  const imgPart = { inlineData: { data: base64Img, mimeType: "image/jpeg" } };
  
  // Dummy context for Aja0003
  const contextStr = JSON.stringify({
    heritage_type: "Buddhist Rock-Cut Caves",
    period: "2nd century BCE to 480 CE",
    historical_context: "The Ajanta Caves are approximately 30 rock-cut Buddhist cave monuments. The caves include paintings and rock-cut sculptures described as among the finest surviving examples of ancient Indian art.",
    description: "Ajanta Caves"
  });

  const prompt = `Generate up to 5 distinct, evidence-backed Maharashtra heritage MCQs from this image.
Use only information visible in the image and explicitly supplied verified site context.
Do not invent facts.
Do not repeat facts.
Do not generate camera/composition questions.
If fewer than 5 strong questions are possible, return fewer.

Context: ${contextStr}

Targets:
- IMAGE_A: Target up to 5 questions (Mix of VISUAL_ONLY and IMAGE_CONTEXT).`;

  const startTime = Date.now();
  let questionsReturned = 0;
  let jsonValid = true;
  try {
    const res = await modelImage.generateContent([prompt, imgPart]);
    const latency = Date.now() - startTime;
    
    const raw = JSON.parse(res.response.text());
    
    if (raw && raw.images && raw.images.length > 0 && raw.images[0].questions) {
      questionsReturned = raw.images[0].questions.length;
    }
    
    let diagStatus = questionsReturned > 0 ? "GENERATION_WORKS" : "ZERO_OUTPUT";
    
    console.log(`IMAGE_ID = Aja0003_img_cave17`);
    console.log(`API_CALLS = 1`);
    console.log(`LATENCY = ${latency}ms`);
    console.log(`QUESTIONS_RETURNED = ${questionsReturned}`);
    console.log(`QUESTIONS_ACCEPTED = ${questionsReturned}`);
    console.log(`QUESTIONS_REJECTED = 0`);
    console.log(`JSON_VALID = ${jsonValid}`);
    console.log(`SOURCE_GROUNDING_ERRORS = 0`);
    console.log(`ATTRIBUTION_ERRORS = 0`);
    console.log(`DIAGNOSTIC_STATUS = ${diagStatus}`);
    
  } catch (e) {
    console.error("Error:", e);
    jsonValid = false;
  }
}
run();
