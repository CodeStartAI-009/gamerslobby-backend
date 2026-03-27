const router = require("express").Router();
const {
  getGlobalLeaderboard,
  getGameLeaderboard,
  getModeLeaderboard,
  getDifficultyLeaderboard,
} = require("../controllers/leaderboard.controller");

//
// 🏆 GLOBAL LEADERBOARD (by rating)
//
router.get("/", getGlobalLeaderboard);

//
// 🎮 GAME LEADERBOARD (e.g. /leaderboard/game/xox)
//
router.get("/game/:game", getGameLeaderboard);

//
// 🧑‍🤝‍🧑 MODE LEADERBOARD (bot / online / friend)
//
router.get("/mode/:mode", getModeLeaderboard);

//
// 🤖 DIFFICULTY LEADERBOARD (easy / medium / hard)
//
router.get("/difficulty/:level", getDifficultyLeaderboard);

module.exports = router;