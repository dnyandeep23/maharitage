const { GoogleGenerativeAI } = require("@google/generative-ai");
const ai = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

const model1 = ai.getGenerativeModel({ model: "gemini-2.5-flash" });
const model2 = ai.getGenerativeModel({ model: "gemini-1.5-flash" });

async function run() {
  try {
    console.log("Trying gemini-2.5-flash...");
    await model1.generateContent("hello");
  } catch(e) {
    console.log("2.5 Error:", e.message, e.status);
    console.log("Trying gemini-1.5-flash...");
    try {
      await model2.generateContent("hello");
      console.log("1.5 Success");
    } catch(e2) {
      console.log("1.5 Error:", e2.message);
    }
  }
}
run();
