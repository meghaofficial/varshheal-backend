const User = require('../models/User');
const jwt = require("jsonwebtoken");
const googleAuth = require("google-auth-library");
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
}

const logout = (req, res) => {
  res.clearCookie("token", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: process.env.NODE_ENV === "production" ? "None" : "Lax",
  });
  return res.json({ message: "Logged out successfully" });
}

module.exports = {
      signupWithGoogle,
      logout
}