// backend/games/xox/xoxEngine.js

//
// ▶️ INIT GAME
//
function init(players) {
  if (!players || players.length < 2) return null;

  // 🔥 FIX: always put human first
  players = [...players].sort((a, b) => (a.isBot ? 1 : -1));

  const p1 = players[0];
  const p2 = players[1];

  return {
    type: "xox",

    board: Array(9).fill(null),

    players: [
      { id: p1.id, user: p1.user, isBot: p1.isBot || false },
      { id: p2.id, user: p2.user, isBot: p2.isBot || false },
    ],

    // ✅ symbols fixed mapping
    symbols: {
      [p1.id]: "X",
      [p2.id]: "O",
    },

    turn: p1.id, // ✅ human always starts

    winner: null,
    status: "playing",
  };
}

//
// 🎮 HANDLE MOVE
//
function move(game, playerId, move) {
  if (!game || game.status !== "playing") return null;

  // 🔒 player validation
  const playerExists = game.players.some(p => p.id === playerId);
  if (!playerExists) return null;

  // 🔒 turn validation
  if (game.turn !== playerId) return null;

  const { index } = move || {};

  // 🔒 index validation
  if (typeof index !== "number" || index < 0 || index > 8) return null;

  // 🔒 prevent overwrite
  if (game.board[index] !== null) return null;

  const symbol = game.symbols[playerId];
  if (!symbol) return null;

  //
  // 🎯 APPLY MOVE
  //
  game.board[index] = symbol;

  //
  // 🏆 CHECK WIN
  //
  if (checkWinner(game.board, symbol)) {
    game.winner = playerId;
    game.status = "finished";
    return game;
  }

  //
  // 🤝 DRAW
  //
  if (game.board.every(cell => cell !== null)) {
    game.winner = "draw";
    game.status = "finished";
    return game;
  }

  //
  // 🔁 NEXT TURN
  //
  game.turn = getNextPlayer(game, playerId);

  return game;
}

//
// 🔁 NEXT PLAYER
//
function getNextPlayer(game, currentPlayerId) {
  const index = game.players.findIndex(p => p.id === currentPlayerId);

  if (index === -1) return game.players[0].id;

  return game.players[(index + 1) % game.players.length].id;
}

//
// 🏆 WIN CHECK
//
function checkWinner(board, symbol) {
  const wins = [
    [0,1,2],[3,4,5],[6,7,8],
    [0,3,6],[1,4,7],[2,5,8],
    [0,4,8],[2,4,6],
  ];

  return wins.some(([a, b, c]) =>
    board[a] === symbol &&
    board[b] === symbol &&
    board[c] === symbol
  );
}

//
// 🤖 VALID MOVES (FOR BOT)
//
function getValidMoves(game) {
  if (!game || game.status !== "playing") return [];

  return game.board
    .map((cell, index) => (cell === null ? { index } : null))
    .filter(Boolean);
}

module.exports = {
  init,
  move,
  getValidMoves,
};