const router = require("express").Router();
const auth = require("../middleware/auth.middleware");

const User = require("../models/user");
const Game = require("../models/Game");

router.post("/sync", auth, async (req, res) => {
  try {
    const { actions } = req.body;
    const userId = req.user.id;

    if (!Array.isArray(actions) || actions.length === 0) {
      return res.status(400).json({ msg: "No actions provided" });
    }

    if (actions.length > 100) {
      return res.status(400).json({ msg: "Too many actions" });
    }

    // 🔥 Separate actions
    const gameActions = actions.filter(a => a.game && a.matchId);
    const inventoryActions = actions.filter(a => a.type);

    // =========================
    // 🎮 GAME SYNC (UNCHANGED)
    // =========================

    let syncedGames = 0;

    if (gameActions.length) {
      const matchIds = gameActions.map(g => g.matchId).filter(Boolean);

      const existingGames = await Game.find({
        userId,
        matchId: { $in: matchIds }
      }).select("matchId");

      const existingIds = new Set(existingGames.map(g => g.matchId));

      const newGames = gameActions.filter(
        g => g.matchId && !existingIds.has(g.matchId)
      );

      if (newGames.length) {
        const gameDocs = newGames.map(g => ({
          userId,
          game: g.game,
          result: g.result,
          matchId: g.matchId
        }));

        await Game.insertMany(gameDocs);

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

        await User.updateOne(
          { _id: userId },
          {
            $inc: { coins, xp, wins, losses, rating }
          }
        );

        syncedGames = newGames.length;
      }
    }

    // =========================
    // 🎒 INVENTORY SYNC (FIXED)
    // =========================

    let unlockedItems = 0;

    if (inventoryActions.length) {
      const user = await User.findById(userId);

      // ensure inventory exists
      if (!user.inventory) {
        user.inventory = {
          backgrounds: [],
          avatars: [],
          frames: [],
          pieces: [],
        };
      }

      for (let action of inventoryActions) {
        // 🔓 SINGLE ITEM UNLOCK
        if (action.type === "unlock_item") {
          const { category, itemId } = action;

          if (!category || !itemId) continue;

          if (!user.inventory[category]) {
            user.inventory[category] = [];
          }

          if (!user.inventory[category].includes(itemId)) {
            user.inventory[category].push(itemId);
            unlockedItems++;
          }
        }

        // 🎉 UNLOCK ALL BACKGROUNDS
        if (action.type === "unlock_all_backgrounds") {
          const allBackgrounds = [
            "dessert",
            "fairy",
            "prack",
            "race",
            "ship",
            "snow",
            "space",
            "village",
            "wood",
          ];

          user.inventory.backgrounds = Array.from(
            new Set([
              ...(user.inventory.backgrounds || []),
              ...allBackgrounds,
            ])
          );

          unlockedItems += allBackgrounds.length;
        }
      }

      await user.save();
    }

    console.log("✅ Sync done:", {
      games: syncedGames,
      items: unlockedItems,
    });

    res.json({
      success: true,
      syncedGames,
      unlockedItems,
    });

  } catch (err) {
    console.error("❌ sync error:", err.message);
    res.status(500).json({ msg: "Server error" });
  }
});
 
//
// 🔥 2. MERGE GUEST DATA (UNCHANGED)
//
router.post("/merge", auth, async (req, res) => {
  try {
    const {
      coins = 0,
      xp = 0,
      wins = 0,
      losses = 0,
      rating = 0,
      mergeId,
    } = req.body;

    if (coins < 0 || xp < 0 || wins < 0 || losses < 0) {
      return res.status(400).json({ msg: "Invalid values" });
    }

    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ msg: "User not found" });
    }

    if (!user.mergedGuestIds) {
      user.mergedGuestIds = [];
    }

    if (mergeId && user.mergedGuestIds.includes(mergeId)) {
      return res.json({ msg: "Already merged", user });
    }

    const updatedUser = await User.findByIdAndUpdate(
      req.user.id,
      {
        $inc: { coins, xp, wins, losses, rating },
        ...(mergeId && {
          $push: { mergedGuestIds: mergeId },
        }),
      },
      { new: true }
    );

    res.json({
      msg: "Guest data merged successfully",
      user: updatedUser,
    });

  } catch (e) {
    console.error("❌ Merge error:", e.message);
    res.status(500).json({ msg: "Merge failed" });
  }
});

module.exports = router;