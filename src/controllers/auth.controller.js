const User = require("../models/user");
const jwt = require("jsonwebtoken");
const { OAuth2Client } = require("google-auth-library");

const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

// 🔐 GENERATE TOKEN
const generateToken = (userId) => {
  return jwt.sign(
    { id: userId },
    process.env.JWT_SECRET,
    { expiresIn: "30d" }
  );
};

//
// =======================================
// 🔐 GOOGLE LOGIN
// =======================================
exports.googleAuth = async (req, res) => {
  try {
    const { idToken } = req.body;

    if (!idToken) {
      return res.status(400).json({ msg: "No idToken provided" });
    }

    const ticket = await client.verifyIdToken({
      idToken,
      audience: process.env.GOOGLE_CLIENT_ID,
    });

    const payload = ticket.getPayload();

    const email = payload?.email;
    const name = payload?.name || "Player";

    if (!email) {
      return res.status(400).json({ msg: "No email from Google" });
    }

    let user = await User.findOne({ email });

    if (!user) {
      user = await User.create({
        name,
        email,
        coins: 100,
        xp: 0,
        isGuest: false,
        lastLogin: new Date(),
      });
    } else {
      user.lastLogin = new Date();
      user.isGuest = false;
      await user.save();
    }

    const token = generateToken(user._id);

    res.json({
      success: true,
      token,
      user,
    });

  } catch (err) {
    console.error("❌ Google auth error:", err.message);

    res.status(500).json({
      success: false,
      msg: "Google auth failed",
    });
  }
};

//
// =======================================
// 👤 GUEST LOGIN
// =======================================
exports.guestAuth = async (req, res) => {
  try {
    const user = await User.create({
      name: "Guest_" + Date.now(),
      coins: 100,
      xp: 0,
      wins: 0,
      losses: 0,
      rating: 1000,
      isGuest: true,
      lastLogin: new Date(),
    });

    const token = generateToken(user._id);

    res.json({
      success: true,
      token,
      user,
    });

  } catch (err) {
    console.error("❌ Guest auth error:", err.message);

    res.status(500).json({
      success: false,
      msg: "Guest auth failed",
    });
  }
};

//
// =======================================
// 👤 GET CURRENT USER (🔥 FINAL FIX)
// =======================================
exports.getMe = async (req, res) => {
  try {
    // 🔥 ALWAYS FETCH FRESH DATA FROM DB
    const user = await User.findById(req.user.id).lean();

    if (!user) {
      return res.status(404).json({ msg: "User not found" });
    }

    res.json({ user });

  } catch (err) {
    console.error("❌ getMe error:", err.message);
    res.status(500).json({ msg: "Server error" });
  }
};