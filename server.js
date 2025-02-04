const express = require("express");
const { Groq } = require("groq-sdk");
const cors = require("cors");
const { Server } = require("socket.io");

const app = express();
app.use(express.static("public"));

// CORS Configuration
app.use(cors({ origin: "*", methods: ["GET", "POST"], credentials: true }));

app.get("/", (req, res) => {
  res.json({ message: "hello suraj" });
});
// Start Server
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

// Function to handle AI chat response (Streaming)
async function generateChatResponse(prompt, socket) {
  try {
    const chatCompletion = await groq.chat.completions.create({
      messages: [{ role: "user", content: `${prompt}` }],
      model: "llama-3.3-70b-versatile",
      temperature: 1,
      max_completion_tokens: 100,
      top_p: 1,
      stream: true,
      stop: null,
    });

    let responseText = "";
    for await (const chunk of chatCompletion) {
      const textChunk = chunk.choices[0]?.delta?.content || "";
      responseText += textChunk;

      // Send each chunk to the frontend
      socket.emit("ans", textChunk);
    }

    return responseText;
  } catch (error) {
    console.error("Groq API Error:", error.message);
    socket.emit("ans", "Sorry, I couldn’t process your request.");
  }
}

// WebSocket Handling
io.on("connection", (socket) => {
  console.log("Client connected");

  socket.on("message", async (data) => {
    await generateChatResponse(data.message, socket);
  });

  socket.on("disconnect", () => {
    console.log("Client disconnected");
  });
});
