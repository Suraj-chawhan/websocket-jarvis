// Load environment variables
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
  apiKey: process.env.groqKey, // Use environment variable
});

async function generateChatResponse(prompt) {
  try {
    const chatCompletion = await groq.chat.completions.create({
      messages: [
        {
          role: "user",
          content: `${prompt} `,
        },
      ],
      model: "llama-3.3-70b-versatile",
      temperature: 1,
      max_completion_tokens: 100,
      top_p: 1,
      stream: true,
      stop: null,
    });

    // Handling the streaming response
    let responseText = "";
    for await (const chunk of chatCompletion) {
      responseText += chunk.choices[0]?.delta?.content || "";
    }
    return responseText;
  } catch (error) {
    console.error("Error generating response from Groq:", error.message);
    return "Sorry, I couldn’t process your request.";
  }
}

// WebSocket Handling
io.on("connection", (socket) => {
  console.log("Client connected");

  socket.on("message", async (data) => {
    console.log(data);
    const response = await generateChatResponse(data);
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
