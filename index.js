const express = require('express');
const dotenv = require('dotenv');
const cookieParser = require('cookie-parser');
const cors = require('cors');
require('./db');
const authRoutes = require('./routes/auth');
const protectedRoutes = require('./routes/protected');

dotenv.config();
const app = express();
app.use(cookieParser());
app.use(cors({
      origin: ['http://localhost:5173', process.env.FRONTEND_URL],
      credentials: true
}));

app.use(express.json());
app.get("/", (req, res) => res.send("API is Running"));
app.use("/api/auth", authRoutes);
app.use("/api", protectedRoutes);

const PORT = process.env.PORT || 8000;

app.listen(PORT, () => console.log(`App is running on port - ${PORT}`))