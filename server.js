require("dotenv").config({ path: __dirname + "/.env" });
console.log("🔍 OpenAI API Key:", process.env.OPENAI_API_KEY || "Not found");

const http = require("http");
const express = require("express");
const cors = require("cors");
const OpenAI = require("openai");

const app = express();
const port = 3100;

// Enable CORS
app.use(cors());
app.options("*", cors()); // Handle CORS preflight requests globally

// Middleware to parse JSON bodies (increase size limit for large images)
app.use(express.json({ limit: "10mb" }));

// Check if OpenAI API Key is set
if (!process.env.OPENAI_API_KEY) {
  console.error(
    "❌ OpenAI API key is missing. Please set it in your .env file."
  );
  process.exit(1);
}

const shoescategory = ["sandal", "sneaker", "loafer", "boot", "formal"];
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

app.get("/", (req, res) => {
  res.send("Got It");
});

// API endpoint for dress detection
app.post("/", async (req, res) => {
  try {
    const { imageBase64 } = req.body;

    if (!imageBase64) {
      return res.status(400).json({ error: "No base64 image provided" });
    }

    // Send the base64 image to OpenAI Vision API
    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content: "You are an AI that detects clothing in images.",
        },
        {
          role: "user",
          content: [
            {
              type: "text",
              text: `What is the dress in this image and what type of shoes would go with it from ${shoescategory.join(
                ", "
              )}? Suggest me only one category from my suggested list. Ignore if shoes are present in the image.`,
            },
            {
              type: "image_url",
              image_url: { url: `data:image/jpeg;base64,${imageBase64}` },
            },
          ],
        },
      ],
      max_tokens: 500,
    });

    console.log(response.choices?.[0]?.message?.content?.trim());
    res.json({
      shoe: response.choices?.[0]?.message?.content?.trim() || "Not detected",
    });
  } catch (error) {
    console.error("❌ Error:", error.response?.data || error.message);
    res.status(500).json({
      error: "Failed to process the image",
      details: error.response?.data || error.message,
    });
  }
});

// Create HTTP server
const server = http.createServer(app);

// Start the HTTP server
server.listen(port, "0.0.0.0", () => {
  console.log(`✅ Server running on http://0.0.0.0:${port}`);
});

