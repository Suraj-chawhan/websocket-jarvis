const express = require("express");
const socket = require("socket.io");
const { Groq } = require("groq-sdk");
const app = express();
const cors = require("cors");
// Serve static files from the "public" folder
app.use(express.static("public"));
const corsOptions = {
  origin: "*", // Allow only requests from this origin
  methods: "GET,POST", // Allow only these methods
  allowedHeaders: ["Content-Type", "Authorization"], // Allow only these headers
};

// Start the server
const server = app.listen(4000, () => {
  console.log("Server running on http://localhost:4000");
});

// Use CORS middleware with specified options
app.use(cors(corsOptions));

// Initialize Socket.io
const io = socket(server, {
  cors: {
    origin: "http://localhost:3000", // Allow your frontend origin
    methods: ["GET", "POST"], // Allowed methods
    credentials: true, // Allow credentials (e.g., cookies)
  },
});
// Ensure this library is installed and valid

// Serve static files from "public" directory
app.use(express.static("public"));
app.use(express.json());
// For parsing JSON bodies

// Initialize Groq client
const groq = new Groq({
  apiKey: "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",
});

// Function to handle generating chat responses
async function generateChatResponse(prompt) {
  try {
    const chatCompletion = await groq.chat.completions.create({
      messages: [
        {
          role: "user",
          content: `${prompt} "Remember this you are an assitant Answer each question max 50 words if small answer is applicable than answer in less"`,
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

// WebSocket connection handler
io.on("connection", (socket) => {
  console.log("A user connected:", socket.id);

  // Listen for incoming messages from the client
  socket.on("message", async (message) => {
    console.log("Received message from client:", message);

    try {
      const responseText = await generateChatResponse(message);
      socket.emit("response", responseText); // Send the response back to the frontend
    } catch (error) {
      console.error("Error sending response to client:", error.message);
      socket.emit(
        "response",
        "An error occurred while processing your request."
      );
    }
  });

  socket.on("disconnect", () => {
    console.log("User disconnected:", socket.id);
  });
});
