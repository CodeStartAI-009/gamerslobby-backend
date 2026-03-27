const User = require("../models/user");
const Game = require("../models/Game");

const REWARDS = {
  win: { coins: 50, xp: 30, rating: 20 },
  loss: { coins: -10, xp: 5, rating: -10 },
  absent: { coins: -25, xp: 0, rating: -20 },
};

function calculateLevel(xp) {
  return Math.floor(xp / 100) + 1;
}

async function applyGameResult({ userId, result, matchId }) {
  try {
    if (!userId || !result || !matchId) {
      console.log("⚠️ Invalid reward input");
      return;
    }

    const reward = REWARDS[result];

    if (!reward) {
      console.log("⚠️ Unknown result:", result);
      return;
    }

    // 🔥 ATOMIC UPDATE (VERY IMPORTANT FIX)
    const user = await User.findOneAndUpdate(
      {
        _id: userId,
        processedMatches: { $ne: matchId },
      },
      {
        $inc: {
          coins: reward.coins,
          xp: reward.xp,
          rating: reward.rating,
          wins: result === "win" ? 1 : 0,
          losses: result !== "win" ? 1 : 0,
        },
        $push: {
          processedMatches: matchId,
        },
      },
      {
        returnDocument: "after", // ✅ FIXED
      }
    );

    if (!user) {
      console.log("⚠️ Duplicate reward prevented:", matchId);
      return;
    }

    // 🔒 Prevent negative coins
    if (user.coins < 0) {
      user.coins = 0;
    }

    // 📈 LEVEL UPDATE
    user.level = calculateLevel(user.xp);
    await user.save();

    // 📝 SAVE GAME (SAFE INSERT)
    try {
      await Game.create({
        userId,
        game: "chess",
        result,
        matchId,
      });
    } catch (err) {
      if (err.code === 11000) {
        console.log("⚠️ Duplicate game record ignored");
      } else {
        throw err;
      }
    }

    console.log("🏆 Reward applied:", userId, result);

  } catch (err) {
    console.log("❌ Reward error:", err.message);
  }
}

module.exports = { applyGameResult };