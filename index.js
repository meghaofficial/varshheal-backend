const express = require("express");
const dotenv = require("dotenv");
dotenv.config();
const cookieParser = require("cookie-parser");
const cors = require("cors");
require("./db");
const authRoutes = require("./routes/auth");
const protectedRoutes = require("./routes/protected");
const { registerWebSocketClient } = require("./controller/authController");
const http = require("http");
const WebSocket = require("ws");
const bodyParser = require("body-parser");
const addressRoutes = require("./routes/address");
const categoryRoutes = require("./routes/category");
const productRoutes = require("./routes/product");
const cartRoutes = require("./routes/cart");

// NEW ROUTES
const newCategory = require("./routes/newCategory");


const app = express();

// middlewares
app.use(
  cors({
    origin: ["http://localhost:5173", "https://varshheal.com", process.env.FRONTEND_URL],
    credentials: true,
  })
);
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(cookieParser());

app.use(express.json());
app.get("/", (req, res) => res.send("API is Running"));
app.use("/api/auth", [
  authRoutes,
  addressRoutes,
  categoryRoutes,
  productRoutes,
  cartRoutes,
  newCategory
]);
app.use("/api", protectedRoutes);

const server = http.createServer(app);
const wss = new WebSocket.Server({ server });

wss.on("connection", (ws) => {
  console.log("WebSocket client connected");

  ws.send(JSON.stringify({ type: "CONNECTED", message: "WebSocket Ready" }));

  ws.on("message", (msg) => {
    try {
      const data = JSON.parse(msg.toString());
      if (data.type === "REGISTER" && data.email) {
        registerWebSocketClient(data.email, ws);
      }
    } catch (error) {
      console.error("Invalid message for ws", error);
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
