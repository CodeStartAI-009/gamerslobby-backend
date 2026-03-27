// backend/games/snake/snakeEngine.js

function init(players) {
    const positions = {};
  
    players.forEach(p => {
      positions[p.id] = 0; // start at 0
    });
  
    return {
      type: "snake",
  
      players,
  
      positions, // { playerId: position }
  
      turn: players[0].id,
  
      dice: null,
  
      winner: null,
      status: "playing",
    };
  }
  
  //
  // 🎮 MOVE (ROLL DICE)
  //
  function move(game, playerId, move) {
    if (!game || game.status !== "playing") return null;
  
    if (game.turn !== playerId) return null;
  
    if (move.type === "roll") {
      const dice = rollDice();
      game.dice = dice;
  
      let currentPos = game.positions[playerId];
      let newPos = currentPos + dice;
  
      // 🚫 must land exactly on 100
      if (newPos > 100) {
        newPos = currentPos;
      }
  
      // 🐍 snakes & ladders
      newPos = applySnakesAndLadders(newPos);
  
      game.positions[playerId] = newPos;
  
      // 🏆 WIN
      if (newPos === 100) {
        game.winner = playerId;
        game.status = "finished";
        return game;
      }
  
      // 🔁 extra turn on 6
      if (dice !== 6) {
        game.turn = getNextPlayer(game, playerId);
      }
    }
  
    return game;
  }
  
  //
  // 🎲 DICE
  //
  function rollDice() {
    return Math.floor(Math.random() * 6) + 1;
  }
  
  //
  // 🐍 SNAKES & LADDERS MAP
  //
  const jumps = {
    // ladders
    3: 22,
    5: 8,
    11: 26,
    20: 29,
    27: 56,
    21: 82,
    43: 77,
    50: 91,
    57: 76,
    72: 92,
  
    // snakes
    17: 4,
    19: 7,
    21: 9,
    27: 1,
    54: 34,
    62: 18,
    64: 60,
    87: 24,
    93: 73,
    95: 75,
    99: 78,
  };
  
  function applySnakesAndLadders(pos) {
    return jumps[pos] || pos;
  }
  
  //
  // 🔁 NEXT PLAYER
  //
  function getNextPlayer(game, currentId) {
    const index = game.players.findIndex(p => p.id === currentId);
    return game.players[(index + 1) % game.players.length].id;
  }
  
  module.exports = {
    init,
    move,
  };