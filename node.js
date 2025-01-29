const fs = require("fs");
const express = require("express");
const { Groq } = require("groq-sdk");
const cors = require("cors");
const { Server } = require("socket.io");
const { v4: uuidv4 } = require("uuid"); // Import uuidv4
const app = express();

app.use(express.static("public"));

// Ensure uploads directory exists
const uploadsDir = "uploads";
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir);
}

const corsOptions = {
  origin: "*", // Allow all origins
  methods: "GET,POST",
  allowedHeaders: ["Content-Type", "Authorization"],
};

// Start the server
const server = app.listen(5000, () => {
  console.log("Server running on http://localhost:5000");
});

// Use CORS middleware
app.use(cors(corsOptions));

// Initialize Socket.io properly
const io = new Server(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"],
    credentials: true,
  },
});

// Initialize Groq API
const groq = new Groq({
  apiKey: "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",
});

// Handle WebSocket Connection
io.on("connection", (socket) => {
  console.log("Client connected");

  let audioBuffer = [];

  socket.on("audio-chunk", (data) => {
    audioBuffer.push(Buffer.from(data));
  });

  socket.on("audio-end", async () => {
    console.log("Received full audio. Buffer length:", audioBuffer.length);

    if (audioBuffer.length === 0) {
      console.log("No audio data received.");
      return;
    }

    // Generate unique file name
    const fileName = `${uploadsDir}/${uuidv4()}.mp3`;
    fs.writeFileSync(fileName, Buffer.concat(audioBuffer));
    console.log("Audio saved:", fileName);

    try {
      // Transcribe Audio
      const transcription = await groq.audio.transcriptions.create({
        file: fs.createReadStream(fileName),
        model: "whisper-large-v3-turbo",
        response_format: "verbose_json",
      });

      console.log("Transcription:", transcription.text);

      // Send transcription to frontend
      socket.emit("transcription", transcription.text);
    } catch (error) {
      console.error("Error transcribing:", error);
      socket.emit("transcription", "Error processing audio.");
    }

    // Cleanup
    audioBuffer = [];
    fs.unlinkSync(fileName); // Delete file after processing
    console.log("Temporary audio file deleted.");
  });

  socket.on("disconnect", () => {
    console.log("Client disconnected");
  });
});
