const router = require("express").Router();
const auth = require("../middleware/auth.middleware");

const {
  googleAuth,
  guestAuth,
  getMe,
} = require("../controllers/auth.controller");

router.post("/google", googleAuth);
router.post("/guest", guestAuth);

// ✅ USE CONTROLLER (IMPORTANT FIX)
router.get("/me", auth, getMe);

module.exports = router;