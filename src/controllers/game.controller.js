const User = require("../models/user");
const Game = require("../models/Game");

exports.syncGames = async (req, res) => {
  try {
    const { games } = req.body;
    const userId = req.user.id;

    if (!Array.isArray(games) || games.length === 0) {
      return res.status(400).json({ msg: "No games provided" });
    }

    if (games.length > 50) {
      return res.status(400).json({ msg: "Too many games" });
    }

    // 🔥 Get existing matchIds to avoid duplicates
    const matchIds = games.map(g => g.matchId).filter(Boolean);

    const existingGames = await Game.find({
      userId,
      matchId: { $in: matchIds }
    }).select("matchId");

    const existingIds = new Set(existingGames.map(g => g.matchId));

    // 🔥 Filter only new games
    const newGames = games.filter(g => g.matchId && !existingIds.has(g.matchId));

    if (!newGames.length) {
      return res.json({ success: true, msg: "No new games" });
    }

    // 🔥 Prepare bulk insert
    const gameDocs = newGames.map(g => ({
      userId,
      game: g.game,
      result: g.result,
      matchId: g.matchId
    }));

    await Game.insertMany(gameDocs);

    // 🔥 Aggregate stats
    let coins = 0;
    let xp = 0;
    let wins = 0;
    let losses = 0;
    let rating = 0;

    for (let g of newGames) {
      if (g.result === "win") {
        coins += 10;
        xp += 20;
        wins += 1;
        rating += 10;
      } else {
        xp += 5;
        losses += 1;
        rating -= 5;
      }
    }

    // 🔥 Single update (FAST)
    await User.updateOne(
      { _id: userId },
      {
        $inc: {
          coins,
          xp,
          wins,
          losses,
          rating
        }
      }
    );

    res.json({
      success: true,
      synced: newGames.length
    });

  } catch (err) {
    console.error("❌ syncGames error:", err.message);
    res.status(500).json({ msg: "Server error" });
  }
};