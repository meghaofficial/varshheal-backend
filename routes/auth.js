const router = require("express").Router();
const jwt = require("jsonwebtoken");
const twilio = require("twilio");
const { User, User2 } = require("../models/User");
const googleAuth = require("google-auth-library");
const { generateOTP } = require("../utilities/helper");
require("dotenv").config();

const client = new googleAuth.OAuth2Client(process.env.GOOGLE_CLIENT_ID);

router.post("/google", async (req, res) => {
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
    const tokenPayload = { id: user._id, email: user.email, name: user.name, avatar: user.avatar };
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
    return res.status(401).json({ message: "Invalid Google token" });
  }
});

router.post("/logout", (req, res) => {
  res.clearCookie("token", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: process.env.NODE_ENV === "production" ? "None" : "Lax",
  });
  return res.json({ message: "Logged out successfully" });
});


const client2 = twilio(process.env.TWILIO_SID, process.env.TWILIO_AUTH);

// Step 1: Send OTP
router.post("/send-otp", async (req, res) => {
  const { phone } = req.body;
  const otp = generateOTP();

  let user = await User2.findOne({ phone });
  if (!user) {
    user = new User2({ phone });
  }

  user.otp = otp;
  user.otpExpires = Date.now() + 2 * 60 * 1000; // valid for 2 min
  await user.save();

  await client2.messages.create({
    body: `Your OTP is ${otp}`,
    from: process.env.TWILIO_PHONE,
    to: phone,
  });

  res.json({ success: true, message: "OTP sent" });
});

// Step 2: Verify OTP
router.post("/verify-otp", async (req, res) => {
  const { phone, otp } = req.body;

  const user = await User2.findOne({ phone });
  if (!user || user.otp !== otp || user.otpExpires < Date.now()) {
    return res.status(400).json({ success: false, message: "Invalid or expired OTP" });
  }

  // clear OTP after verification
  user.otp = null;
  user.otpExpires = null;
  await user.save();

  const token = jwt.sign({ id: user._id, phone: user.phone }, process.env.JWT_SECRET, {
    expiresIn: "7d",
  });

  res.json({ success: true, token });
});

module.exports = router;
