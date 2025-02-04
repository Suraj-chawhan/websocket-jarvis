require("dotenv").config(); // Load environment variables
const express = require("express");
const cors = require("cors");
const { Server } = require("socket.io");
const { Groq } = require("groq-sdk");

const app = express();
app.use(express.static("public"));
app.use(cors({ origin: "*", methods: ["GET", "POST"], credentials: true }));
app.use(express.json()); // Middleware for JSON body parsing

const server = app.listen(5000, () => {
  console.log("Server running on http://localhost:5000");
});

// Initialize Socket.io
const io = new Server(server, {
  cors: { origin: "*", methods: ["GET", "POST"], credentials: true },
});

// Initialize Groq API
const groq = new Groq({
  apiKey: "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", // Use environment variable
});

// Function to handle AI chat response
async function generateChatResponse(prompt) {
  try {
    const chatCompletion = await groq.chat.completions.create({
      messages: [{ role: "user", content: `${prompt}` }],
      model: "llama-3.3-70b-versatile",
      temperature: 1,
      max_completion_tokens: 100,
      top_p: 1,
      stream: false, // No streaming support in this version
      stop: null,
    });

    return chatCompletion.choices[0]?.message?.content || "No response.";
  } catch (error) {
    console.error("Groq API Error:", error.message);
    return "Sorry, I couldn’t process your request.";
  }
}

// WebSocket Handling
io.on("connection", (socket) => {
  console.log("Client connected");

  socket.on("message", async (data) => {
    const response = await generateChatResponse(data.message);
    socket.emit("ans", response);
  });

  socket.on("disconnect", () => {
    console.log("Client disconnected");
  });
});

// Root route
app.get("/", (req, res) => {
  res.json({ message: "hello suraj" });
});
