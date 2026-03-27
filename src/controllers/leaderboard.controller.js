const User = require("../models/user");

//
// 🏆 GLOBAL LEADERBOARD
//
exports.getGlobalLeaderboard = async (req, res) => {
  try {
    const users = await User.find()
      .sort({ rating: -1 })
      .limit(50)
      .select("name rating coins xp level");

    res.json(users);
  } catch (err) {
    console.error("❌ Global leaderboard error:", err.message);
    res.status(500).json({ msg: "Server error" });
  }
};


//
// 🎮 GAME LEADERBOARD
//
exports.getGameLeaderboard = async (req, res) => {
  try {
    const { game } = req.params;

    const users = await User.find()
      .sort({ [`games.${game}.wins`]: -1 })
      .limit(50)
      .select(`name games.${game}`);

    res.json(users);
  } catch (err) {
    console.error("❌ Game leaderboard error:", err.message);
    res.status(500).json({ msg: "Server error" });
  }
};


//
// 🧑‍🤝‍🧑 MODE LEADERBOARD
//
exports.getModeLeaderboard = async (req, res) => {
  try {
    const { mode } = req.params;

    const users = await User.find()
      .sort({ [`modes.${mode}.wins`]: -1 })
      .limit(50)
      .select(`name modes.${mode}`);

    res.json(users);
  } catch (err) {
    console.error("❌ Mode leaderboard error:", err.message);
    res.status(500).json({ msg: "Server error" });
  }
};


//
// 🤖 DIFFICULTY LEADERBOARD
//
exports.getDifficultyLeaderboard = async (req, res) => {
  try {
    const { level } = req.params;

    const users = await User.find()
      .sort({ [`difficulty.${level}.wins`]: -1 })
      .limit(50)
      .select(`name difficulty.${level}`);

    res.json(users);
  } catch (err) {
    console.error("❌ Difficulty leaderboard error:", err.message);
    res.status(500).json({ msg: "Server error" });
  }
};