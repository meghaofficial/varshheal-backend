const User = require("../models/User");
const Otp = require("../models/Otp");
const jwt = require("jsonwebtoken");
const googleAuth = require("google-auth-library");
const { sendVerificationCode, sendWelcomeEmail } = require("../middleware/email");
const bcrypt = require("bcryptjs");
require("dotenv").config();

const client = new googleAuth.OAuth2Client(process.env.GOOGLE_CLIENT_ID);

const signupWithGoogle = async (req, res) => {
  try {
    const { credential } = req.body;
    if (!credential) {
      return res.status(400).json({
        success: false,
        message: "Missing credentials",
      });
    }

    // verify ID token with google
    const ticket = await client.verifyIdToken({
      idToken: credential,
      audience: process.env.GOOGLE_CLIENT_ID,
    });
    const payload = ticket.getPayload();

    // payload contains sub (google id), email, name, picture, aud, exp, etc.
    const { sub: googleId, email, name, picture } = payload;

    // Check if the same email exists from manual signup
    const existingManualUser = await User.findOne({
      email,
      googleId: { $exists: false },
    });

    if (existingManualUser) {
      return res.status(400).json({
        success: false,
        message: "User already exists. Please sign in using your email and password.",
      });
    }

    // Upsert user in DB
    let user = await User.findOne({ googleId });
    if (!user) {
      user = new User({ googleId, email, name, avatar: picture });
      await user.save();
    } else {
      user.email = email;
      user.name = name;
      user.avatar = picture;
      await user.save();
    }

    // Create our JWT (stateless session)
    const tokenPayload = {
      id: user._id,
      email: user.email,
      name: user.name,
      avatar: user.avatar,
    };
    const token = jwt.sign(tokenPayload, process.env.JWT_SECRET, {
      expiresIn: process.env.JWT_EXPIRES_IN || "7d",
    });

    // Set as httpOnly cookie (recommended)
    res.cookie("token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production", // true on HTTPS
      sameSite: process.env.NODE_ENV === "production" ? "None" : "Lax",
      maxAge: 1000 * 60 * 60 * 24 * 7, // match expiresIn
    });

    // Return user info too
    return res.json({ user: tokenPayload });
  } catch (err) {
    console.error(err);
    return res.status(401).json({ message: "Something went wrong please try again" });
  }
};

const logout = (req, res) => {
  res.clearCookie("token", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: process.env.NODE_ENV === "production" ? "None" : "Lax",
  });
  return res.json({ message: "Logged out successfully" });
};

let connectedClients = new Map();
let wsCleanupTimers = new Map();

const signup = async (req, res) => {
  try {
    const { email } = req.body;
    const user = await User.findOne({ email });
    if (user) {
      return res.status(409).json({
        message: "User already exists",
        success: false,
      });
    }

    const otp = Math.floor(100000 + Math.random() * 900000).toString();

    await sendVerificationCode(email, otp);

    await Otp.findOneAndUpdate(
      { email },
      {
        otp,
        createdAt: Date.now(),
      },
      {
        upsert: true,
        new: true,
      }
    );

    // Send OTP over WebSocket
    const wsClient = connectedClients.get(email);
    if (wsClient?.readyState === 1) {
      wsClient.send(JSON.stringify({ type: "OTP_SENT", otp }));
    }

    res.json({ success: true, message: "OTP sent successfully" });

    if (wsCleanupTimers.has(email)) {
      clearTimeout(wsCleanupTimers.get(email));
    }

    // Set new cleanup timer JUST for this email
    const timerId = setTimeout(() => {
      console.log(`OTP expired for ${email}`);
      wsCleanupTimers.delete(email); // remove timer
      connectedClients.delete(email); // remove websocket ref
    }, 60000);

    wsCleanupTimers.set(email, timerId);
  } catch (error) {
    console.error("Err: ", error);
    res.status(500).json({ message: "Internal Server Error", success: false });
  }
};

const verifyEmail = async (req, res) => {
  const { name, email, password, otp } = req.body;

  const record = await Otp.findOne({ email });
  if (!record) {
    return res
      .status(401)
      .json({
        message: "OTP expired or not sent. Please resend.",
        success: false,
      });
  }

  if (+otp !== +record.otp) {
    return res
      .status(401)
      .json({ message: "Invalid verification code", success: false });
  }

  const hashedPassword = await bcrypt.hash(password, 10);
  await User.create({
    name,
    email,
    password: hashedPassword,
    isVerified: true,
  });

  await sendWelcomeEmail(email, name);

  await Otp.deleteOne({ email });

  if (connectedClients.has(email)) {
    console.log(`Closing websocket for ${email}`);
    connectedClients.get(email).close();
    connectedClients.delete(email);
  }

  if (wsCleanupTimers.has(email)) {
    clearTimeout(wsCleanupTimers.get(email));
    wsCleanupTimers.delete(email);
  }

  return res.status(201).json({ message: "Signup successful", success: true });
};

// Store connected clients when WebSocket connects
function registerWebSocketClient(email, ws) {
  connectedClients.set(email, ws);
  console.log(`Register websocket for ${email}`);
}

const signin = async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(403).json({
        message: "Email has not been registered",
        success: false,
      });
    }
    const isPassEqual = await bcrypt.compare(password, user.password);
    if (!isPassEqual) {
      return res.status(403).json({
        message: "Incorrect password",
        success: false,
      });
    }
    const jwtToken = jwt.sign(
      { email: user.email, _id: user._id, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: "24h" }
    );
    return res.status(200).json({
      message: "Login Successfully",
      success: true,
      jwtToken,
      email,
      name: user?.name,
      _id: user._id,
    });
  } catch (error) {
    console.log(error);
    return res.status(500).json({
      message: "Internal Server Error",
      success: false,
      error,
    });
  }
};

const getDetails = async (req, res) => {
  try {
    const userId = req.user._id;
    const user = await User.findOne({ _id: userId }).select("-password");
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }
    res.status(200).send({
      success: true,
      user,
    });
  } catch (error) {
    console.error(error);
    return res.status(400).json({
      message: "Bad Request",
      success: false,
    });
  }
};

module.exports = {
  signupWithGoogle,
  logout,
  signup,
  verifyEmail,
  registerWebSocketClient,
  signin,
  getDetails
};
