// backend/games/gameManager.js

const xoxEngine = require("./xox/xoxEngine");
const bingoEngine = require("./bingo/bingoEngine");
const checkersEngine = require("./checkers/checkersEngine");
const chessEngine = require("./chess/chessEngine");
const snakeEngine = require("./snake/snakeEngine");

// const ludoEngine = require("./ludo/ludoEngine");

const games = {};

//
// ▶️ INIT GAME
//
function initGame(room) {
  let state = null;

  switch (room.game) {

    case "xox":
      state = xoxEngine.init(room.players);
      break;

    case "bingo":
      state = bingoEngine.init(room.players);
      break;

    case "checkers":
      state = checkersEngine.init(room.players);
      break;

    case "chess":
      state = chessEngine.init(room.players);
      break;

    case "snake":
      state = snakeEngine.init(room.players);
      break;

    // case "ludo":
    //   state = ludoEngine.init(room.players);
    //   break;

    default:
      return null;
  }

  if (!state) return null;

  games[room.roomId] = state;

  return state;
}

//
// 🎮 MAKE MOVE
//
function makeMove(roomId, playerId, move) {
  const game = games[roomId];
  if (!game) return null;

  let updated = null;

  switch (game.type) {

    case "xox":
      updated = xoxEngine.move(game, playerId, move);
      break;

    case "bingo":
      updated = bingoEngine.move(game, playerId, move);
      break;

    case "checkers":
      updated = checkersEngine.move(game, playerId, move);
      break;

    case "chess":
      updated = chessEngine.move(game, playerId, move);
      break;

    case "snake":
      updated = snakeEngine.move(game, playerId, move);
      break;

    default:
      return null;
  }

  return updated;
}

//
// 📦 GET GAME
//
function getGame(roomId) {
  return games[roomId] || null;
}

//
// ❌ REMOVE GAME
//
function removeGame(roomId) {
  if (games[roomId]) {
    delete games[roomId];
  }
}

module.exports = {
  initGame,
  makeMove,
  getGame,
  removeGame,
};