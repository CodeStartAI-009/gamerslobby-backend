const mongoose = require("mongoose");

const userSchema = new mongoose.Schema(
  {
    // 👤 BASIC
    name: {
      type: String,
      default: "Player",
      trim: true,
    },

    username: {
      type: String,
      unique: true,
      sparse: true,
      trim: true,
      lowercase: true,
    },

    email: {
      type: String,
      unique: true,
      sparse: true,
      lowercase: true,
      trim: true,
    },

    password: {
      type: String,
      select: false,
    },

    // 🎮 GAME STATS
    coins: {
      type: Number,
      default: 100,
      min: 0,
    },

    xp: {
      type: Number,
      default: 0,
      min: 0,
    },

    wins: {
      type: Number,
      default: 0,
      min: 0,
    },

    losses: {
      type: Number,
      default: 0,
      min: 0,
    },

    rating: {
      type: Number,
      default: 1000,
    },

    level: {
      type: Number,
      default: 1,
    },

    // 👥 SOCIAL
    friends: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      },
    ],

    pendingRequestsCount: {
      type: Number,
      default: 0,
    },

    // 🔗 INVITE
    inviteCode: {
      type: String,
      unique: true,
      sparse: true,
    },

    invitedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },

    // 🟢 PRESENCE
    isOnline: {
      type: Boolean,
      default: false,
    },

    lastSeen: {
      type: Date,
    },

    // 👤 TYPE
    isGuest: {
      type: Boolean,
      default: false,
    },

    mergedGuestIds: {
      type: [String],
      default: [],
    },

    inventory: {
      backgrounds: { type: [String], default: ["default"] },
      dice: { type: [String], default: ["default"] },
      avatars: { type: [String], default: ["default"] },
      chessPieces: { type: [String], default: ["default"] },
    },

    // 🔥 ADS
    unlockProgress: {
      type: Map,
      of: Number,
      default: {},
    },

    // 🕒 META
    lastLogin: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
  }
);

// 🔥 INDEX
userSchema.index({ isOnline: 1 });


// ✅ FIXED PRE-SAVE (NO next)
userSchema.pre("save", function () {
  if (!this.inviteCode) {
    this.inviteCode = Math.random().toString(36).substring(2, 8);
  }
});


// 🔥 LEVEL CALCULATION
userSchema.methods.calculateLevel = function () {
  return Math.floor(this.xp / 100) + 1;
};


module.exports = mongoose.model("User", userSchema);