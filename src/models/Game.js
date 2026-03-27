const mongoose = require("mongoose");

const gameSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },

  game: {
    type: String,
    required: true,
  },

  result: {
    type: String,
    required: true,
  },

  // 🔥 MATCH ID (NO UNIQUE HERE)
  matchId: {
    type: String,
    required: true,
  },

  createdAt: {
    type: Date,
    default: Date.now,
  },
});


// ✅ PROPER UNIQUE CONTROL (BEST PRACTICE)
// One user can have one record per match
gameSchema.index({ userId: 1, matchId: 1 }, { unique: true });


module.exports = mongoose.model("Game", gameSchema);