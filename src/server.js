// 🔥 LOAD ENV FIRST
require("dotenv").config();

const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const cors = require("cors");

// ✅ DB
const connectDB = require("./config/db");

// ✅ ROUTES
const authRoutes = require("./routes/auth.routes");
const gameRoutes = require("./routes/game.routes");
const leaderboardRoutes = require("./routes/leaderboard.routes");
const friendRoutes = require("./routes/friends");

// ✅ SOCKET
const setupSocket = require("./socket");

// ================= INIT =================
const app = express();
const server = http.createServer(app);

// ================= DB =================
connectDB();

// ================= MIDDLEWARE =================
app.use(
  cors({
    origin: "*",
    methods: ["GET", "POST", "PUT", "DELETE"],
  })
);

app.use(express.json());

// 🔥 REQUEST LOGGER
app.use((req, res, next) => {
  console.log(`➡️ ${req.method} ${req.url}`);
  next();
});

// ================= ROUTES =================
app.use("/auth", authRoutes);
app.use("/game", gameRoutes);
app.use("/leaderboard", leaderboardRoutes);
app.use("/api/friends", friendRoutes);

// ================= HEALTH =================
app.get("/", (req, res) => {
  res.send("🚀 Server is running");
});

// ================= SOCKET.IO =================
const io = new Server(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"],
  },

  // 🔥 CRITICAL FIX (PING SYSTEM)
  pingTimeout: 60000,   // 60 sec (default is too low)
  pingInterval: 25000,  // send ping every 25 sec

  // 🔥 allow fallback
  transports: ["websocket", "polling"],
});

// 🔥 attach io globally
app.set("io", io);

// 🔌 SOCKET SETUP
setupSocket(io);

// ================= 404 =================
app.use((req, res) => {
  res.status(404).json({ msg: "Route not found" });
});

// ================= ERROR =================
app.use((err, req, res, next) => {
  console.error("❌ Server Error:", err.message);

  res.status(err.status || 500).json({
    msg: err.message || "Internal Server Error",
  });
});

// ================= START =================
const PORT = process.env.PORT || 3000;

// 🔥 IMPORTANT (already correct)
server.listen(PORT, "0.0.0.0", () => {
  console.log(`🔥 Server running on port ${PORT}`);
});