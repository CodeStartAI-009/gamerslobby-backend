const jwt = require("jsonwebtoken");
const generateRoomId = require("../utils/generateRoomId");

const {
  createRoom,
  getRoom,
  addPlayer,
  removePlayer,
  findRandomRoom,
  addBots,
  rooms,
} = require("./roomManager");

const {
  handleStartGame,
  handleMove,
  handleGameEnd,
} = require("./gameHandler");

const { initGame } = require("../games/gameManager");
const { runBotIfNeeded } = require("../games/botManager");

module.exports = function setupSocket(io) {

  io.on("connection", async (socket) => {
    console.log("🟢 Connected:", socket.id);

    //
    // 🔐 AUTH
    //
    try {
      const token = socket.handshake.auth?.token;
      if (token) {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        socket.userId = decoded.id;
      }
    } catch {
      console.log("⚠️ Guest user");
    }

    //
    // 🟢 CREATE ROOM
    //
    socket.on("create_room", ({ user, game }) => {
      const roomId = generateRoomId();
      const maxPlayers = 2; // 🔥 FORCE 1v1

      createRoom({
        roomId,
        game,
        maxPlayers,
        host: socket.id,
      });

      const room = addPlayer(roomId, {
        id: socket.userId || socket.id,
        socketId: socket.id,
        user,
      });

      socket.join(roomId);

      socket.emit("room_created", { roomId, room });
      io.to(roomId).emit("room_update", getRoom(roomId));
    });

    //
    // 🔵 JOIN ROOM
    //
    socket.on("join_room", ({ roomId, user }) => {
      const room = getRoom(roomId);
      if (!room) return socket.emit("error", "Room not found");

      const updated = addPlayer(roomId, {
        id: socket.userId || socket.id,
        socketId: socket.id,
        user,
      });

      if (!updated) return socket.emit("error", "Room full");

      socket.join(roomId);
      io.to(roomId).emit("room_update", getRoom(roomId));
    });

    //
    // 🎲 JOIN RANDOM (FINAL FIX)
    //
    socket.on("join_random", ({ game, user }) => {

      const maxPlayers = 2; // 🔥 ALWAYS 1v1

      let room = findRandomRoom(game, maxPlayers);

      //
      // ✅ JOIN EXISTING ROOM
      //
      if (room) {
        addPlayer(room.roomId, {
          id: socket.userId || socket.id,
          socketId: socket.id,
          user,
        });

        socket.join(room.roomId);
        io.to(room.roomId).emit("room_update", getRoom(room.roomId));

        const updatedRoom = getRoom(room.roomId);

        if (updatedRoom.players.length === maxPlayers) {
          updatedRoom.status = "playing";

          const gameState = initGame(updatedRoom);

          if (gameState) {
            io.to(updatedRoom.roomId).emit("game_started", {
              room: updatedRoom,
              game: gameState,
            });

            runBotIfNeeded(io, updatedRoom.roomId);
          }
        }

        return;
      }

      //
      // 🆕 CREATE NEW ROOM
      //
      const roomId = generateRoomId();

      createRoom({
        roomId,
        game,
        maxPlayers,
        host: socket.id,
      });

      addPlayer(roomId, {
        id: socket.userId || socket.id,
        socketId: socket.id,
        user,
      });

      socket.join(roomId);

      socket.emit("room_created", { roomId, room: getRoom(roomId) });
      io.to(roomId).emit("room_update", getRoom(roomId));

      //
      // 🤖 AUTO ADD BOT AFTER 3s (faster UX)
      //
      const timer = setTimeout(() => {
        const currentRoom = getRoom(roomId);
        if (!currentRoom || currentRoom.status !== "waiting") return;

        console.log("🤖 Adding bot:", roomId);

        addBots(currentRoom); // should add ONLY 1 bot
        currentRoom.status = "playing";

        const gameState = initGame(currentRoom);
        if (!gameState) return;

        io.to(roomId).emit("game_started", {
          room: currentRoom,
          game: gameState,
        });

        runBotIfNeeded(io, roomId);

      }, 3000);

      socket.on("disconnect", () => clearTimeout(timer));
    });

    //
    // ▶️ START GAME (HOST)
    //
    socket.on("start_game", ({ roomId }) => {
      const room = getRoom(roomId);
      if (!room) return;

      handleStartGame(io, socket, room);

      setTimeout(() => {
        runBotIfNeeded(io, roomId);
      }, 100);
    });

    //
    // 🎮 GAME MOVE
    //
    socket.on("game_move", async ({ roomId, move }) => {
      await handleMove(io, socket, roomId, move);
    });

    //
    // 🔴 DISCONNECT
    //
    socket.on("disconnect", async () => {
      console.log("🔴 Disconnected:", socket.id);

      if (!socket.userId) return;

      const { applyGameResult } = require("../utils/rewardSystem");

      for (let roomId in rooms) {
        const room = rooms[roomId];
        if (!room) continue;

        const player = room.players.find(
          p => p.id === socket.userId
        );

        if (player && room.status === "playing") {
          await applyGameResult({
            userId: socket.userId,
            result: "absent",
            matchId: roomId,
          });
        }
      }

      removePlayer(socket.id);

      for (let roomId in rooms) {
        const room = rooms[roomId];
        if (!room) continue;

        if (room.players.length === 0) {
          handleGameEnd(roomId);
          continue;
        }

        if (!room.players.find(p => p.id === room.hostId)) {
          room.hostId = room.players[0]?.id;
        }

        io.to(roomId).emit("room_update", room);
      }
    });

  });
};