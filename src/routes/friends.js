const express = require("express");
const User = require("../models/user");
const FriendRequest = require("../models/FriendRequest");
const auth = require("../middleware/auth.middleware");

const router = express.Router();


// 🔍 SEARCH USERS
router.get("/search", auth, async (req, res) => {
  try {
    const { username } = req.query;

    const users = await User.find({
      username: { $regex: username, $options: "i" }
    }).select("_id username");

    res.json(users);
  } catch (err) {
    res.status(500).json({ msg: err.message });
  }
});


// ➕ SEND REQUEST
router.post("/request", auth, async (req, res) => {
  try {
    const { toUserId } = req.body;
    const fromUserId = req.user.id;

    if (fromUserId === toUserId) {
      return res.status(400).json({ msg: "Cannot add yourself" });
    }

    const existing = await FriendRequest.findOne({
      from: fromUserId,
      to: toUserId,
      status: "pending"
    });

    if (existing) {
      return res.status(400).json({ msg: "Request already sent" });
    }

    const request = await FriendRequest.create({
      from: fromUserId,
      to: toUserId
    });

    // 🔥 UPDATE COUNTER
    await User.findByIdAndUpdate(toUserId, {
      $inc: { pendingRequestsCount: 1 }
    });

    res.json(request);
  } catch (err) {
    res.status(500).json({ msg: err.message });
  }
});


// 📥 GET REQUESTS
router.get("/requests", auth, async (req, res) => {
  try {
    const requests = await FriendRequest.find({
      to: req.user.id,
      status: "pending"
    }).populate("from", "username");

    res.json(requests);
  } catch (err) {
    res.status(500).json({ msg: err.message });
  }
});


// ✅ ACCEPT / ❌ REJECT
router.post("/respond", auth, async (req, res) => {
  try {
    const { requestId, action } = req.body;

    const request = await FriendRequest.findById(requestId);

    if (!request) {
      return res.status(404).json({ msg: "Request not found" });
    }

    if (action === "accept") {
      request.status = "accepted";

      await User.findByIdAndUpdate(request.from, {
        $addToSet: { friends: request.to }
      });

      await User.findByIdAndUpdate(request.to, {
        $addToSet: { friends: request.from },
        $inc: { pendingRequestsCount: -1 }
      });

    } else {
      request.status = "rejected";

      await User.findByIdAndUpdate(request.to, {
        $inc: { pendingRequestsCount: -1 }
      });
    }

    await request.save();

    res.json({ msg: `Request ${action}ed` });
  } catch (err) {
    res.status(500).json({ msg: err.message });
  }
});


// 👥 GET FRIENDS
router.get("/", auth, async (req, res) => {
  try {
    const user = await User.findById(req.user.id)
      .populate("friends", "username");

    res.json(user.friends);
  } catch (err) {
    res.status(500).json({ msg: err.message });
  }
});

module.exports = router;