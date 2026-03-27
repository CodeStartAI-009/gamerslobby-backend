const {
  initGame,
  makeMove,
  getGame,
  removeGame,
} = require("../games/gameManager");

const logger = require("../utils/logger");
const { runBotIfNeeded } = require("../games/botManager");
const { applyGameResult } = require("../utils/rewardSystem");

// ⚠️ YOU MISSED THIS IMPORT (used below)
const { getRoom } = require("./roomManager");

//
// ▶️ START GAME
//
function handleStartGame(io, socket, room) {
  try {
    if (!room) {
      logger.warn("StartGame: room not found");
      return;
    }

    // 🔒 Only host
    if (socket.id !== room.hostId) {
      logger.warn("Non-host tried to start game", {
        socketId: socket.id,
        roomId: room.roomId,
      });
      return;
    }

    if (room.status === "playing") return;

    if (!room.players || room.players.length < 2) {
      logger.warn("StartGame: need 2 players", {
        roomId: room.roomId,
        players: room.players?.length,
      });
      return;
    }

    room.status = "playing";

    const gameState = initGame(room);

    if (!gameState) {
      logger.error("Game init failed", {
        roomId: room.roomId,
        game: room.game,
      });
      return;
    }

    logger.info("Game started", {
      roomId: room.roomId,
      game: room.game,
      players: room.players.length,
    });

    io.to(room.roomId).emit("game_started", {
      room,
      game: gameState,
    });

    runBotIfNeeded(io, room.roomId);

  } catch (err) {
    console.error("❌ handleStartGame ERROR:", err.message);

    logger.error("Error in handleStartGame", {
      message: err.message,
      stack: err.stack,
    });
  }
}

//
// 🎮 HANDLE MOVE (FIXED)
//
async function handleMove(io, socket, roomId, move) {
  try {
    const game = getGame(roomId);

    if (!game) {
      logger.warn("Move: game not found", { roomId });
      return null;
    }

    // 🔥 USE REAL USER ID
    const playerId = socket.userId;

    if (!playerId) {
      logger.warn("No userId on socket", { socketId: socket.id });
      return null;
    }

    // 🔒 Prevent bot moves via socket
    const player = game.players.find(p => p.id === playerId);
    if (player?.isBot) {
      logger.warn("Bot tried to send move", {
        roomId,
        playerId,
      });
      return null;
    }

    // 🎮 APPLY MOVE
    const updatedGame = makeMove(roomId, playerId, move);

    if (!updatedGame) {
      logger.warn("Invalid move", {
        roomId,
        playerId,
        move,
      });
      return null;
    }

    // 📡 SEND UPDATE
    io.to(roomId).emit("game_update", updatedGame);

    // 🤖 BOT TURN
    runBotIfNeeded(io, roomId);

    // 🏁 GAME END
    if (updatedGame.status === "finished") {
      const room = getRoom(roomId);
      if (!room) return updatedGame;

      const winnerId = updatedGame.winner;

      for (let p of room.players) {
        if (p.isBot) continue;

        const result = p.id === winnerId ? "win" : "loss";

        await applyGameResult({
          userId: p.id,
          result,
          matchId: roomId,
        });
      }
    }

    return updatedGame;

  } catch (err) {
    console.error("❌ handleMove ERROR:", err.message);

    logger.error("Error in handleMove", {
      message: err.message,
      stack: err.stack,
    });

    return null;
  }
}

//
// 🔴 CLEANUP
//
function handleGameEnd(roomId) {
  try {
    removeGame(roomId);

    logger.info("Game removed", { roomId });

  } catch (err) {
    console.error("❌ handleGameEnd ERROR:", err.message);

    logger.error("Error in handleGameEnd", {
      message: err.message,
      stack: err.stack,
    });
  }
}

module.exports = {
  handleStartGame,
  handleMove,
  handleGameEnd,
};