const express = require('express');
const dotenv = require('dotenv');
const cookieParser = require('cookie-parser');
const cors = require('cors');
require('./db');
const authRoutes = require('./routes/auth');
const protectedRoutes = require('./routes/protected');
const { registerWebSocketClient } = require("./controller/authController");
const http = require('http');
const WebSocket = require('ws');
const bodyParser = require("body-parser");

dotenv.config();
const app = express();

// middlewares
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(cors({
      origin: [
            'http://localhost:5173',
            /^http:\/\/192\.168\.\d+\.\d+:5173$/, 
            process.env.FRONTEND_URL
      ],
      credentials: true
}));

app.use(express.json());
app.get("/", (req, res) => res.send("API is Running"));
app.use("/api/auth", authRoutes);
app.use("/api", protectedRoutes);

const server = http.createServer(app);
const wss = new WebSocket.Server({ server });

wss.on("connection", (ws) => {
  console.log("WebSocket client connected");

  ws.send(JSON.stringify({ type: "CONNECTED", message: "WebSocket Ready" }));

  ws.on("message", (msg) => {
    try {
      const data = JSON.parse(msg.toString());
      if (data.type === "REGISTER" && data.email){
        registerWebSocketClient(data.email, ws);
      }
    } catch (error) {
      console.error('Invalid message for ws', error);
    }
  });

  ws.on("close", () => {
    console.log("❌ WebSocket client disconnected");
  });
});

const PORT = process.env.PORT || 8000;

server.listen(PORT, () => {
  console.log(`🚀 HTTP + WebSocket running on port ${PORT}`);
});