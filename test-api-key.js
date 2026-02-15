import { GoogleGenerativeAI } from "@google/generative-ai";
import dotenv from "dotenv";

dotenv.config({ path: ".env.local" });

async function testAPIKey() {
  const apiKey = process.env.GEMINI_API_KEY;

  if (!apiKey) {
    console.error("❌ Error: GEMINI_API_KEY not found in .env.local");
    return;
  }

  console.log("✓ API Key found");
  console.log("✓ Testing API Key with gemini-3-flash-preview...\n");

  try {
    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: "gemini-3-flash-preview" });

    const result = await model.generateContent(
      "Hello! This is a test to check if the API key works.",
    );
    const response = await result.response;

    if (response && response.text()) {
      console.log("✓✓✓ SUCCESS! API key is valid! ✓✓✓");
      console.log("Response (first 200 chars):");
      console.log(response.text().substring(0, 200));
    } else {
      console.warn(
        "⚠️ API key responded but no text returned. Check model access or quota.",
      );
    }
  } catch (err) {
    if (err.message.includes("429")) {
      console.error(
        "⚠️ Too Many Requests: You exceeded your quota. Try again later.",
      );
    } else if (
      err.message.includes("400") ||
      err.message.includes("API key expired")
    ) {
      console.error(
        "❌ Invalid or expired API key. Generate a new one at https://aistudio.google.com/api-keys",
      );
    } else {
      console.error("❌ API key test failed with error:");
      console.error(err.message);
    }
  }
}

testAPIKey();
