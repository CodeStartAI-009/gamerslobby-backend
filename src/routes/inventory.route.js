const router = require("express").Router();
const auth = require("../middleware/auth.middleware");
const User = require("../models/user");

const REQUIRED_ADS = 3;
router.post("/watch-ad", auth, async (req, res) => {
    try {
      const { itemId, category } = req.body;
  
      const user = await User.findById(req.user.id);
  
      if (!user.unlockProgress) {
        user.unlockProgress = new Map();
      }
  
      const key = `${category}_${itemId}`;
  
      const current = user.unlockProgress.get(key) || 0;
      const updated = current + 1;
  
      user.unlockProgress.set(key, updated);
  
      let unlocked = false;
  
      if (updated >= 3) {
        unlocked = true;
  
        // 🔓 unlock item
        if (!user.inventory[category].includes(itemId)) {
          user.inventory[category].push(itemId);
        }
  
        user.unlockProgress.delete(key);
      }
  
      await user.save();
  
      // ✅ IMPORTANT: ALWAYS SEND PROGRESS
      res.json({
        success: true,
        progress: unlocked ? 3 : updated, // 🔥 FIX
        unlocked,
        inventory: user.inventory,
      });
  
    } catch (e) {
      console.error("❌ Unlock error:", e.message);
      res.status(500).json({ msg: "Error unlocking item" });
    }
  });

module.exports = router;