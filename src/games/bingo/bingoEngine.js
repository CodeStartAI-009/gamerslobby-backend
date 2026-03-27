// backend/games/bingo/bingoEngine.js

function init(players) {
    const boards = {};
    const marked = {};
    const playerLines = {};
  
    players.forEach((p) => {
      boards[p.id] = generateBoard();
  
      marked[p.id] = Array(5)
        .fill(null)
        .map(() => Array(5).fill(false));
  
      playerLines[p.id] = 0;
    });
  
    return {
      type: "bingo",
  
      players,
      boards,
      marked,
  
      playerLines, // 🔥 NEW
  
      calledNumbers: [],
  
      turn: players[0].id,
  
      winner: null,
      status: "playing",
    };
  }
  
  //
  // 🎮 MOVE
  //
  function move(game, playerId, move) {
    if (!game || game.status !== "playing") return null;
  
    if (game.turn !== playerId) return null;
  
    if (move.type === "call") {
      const number = move.number;
  
      // ❌ invalid
      if (!number || number < 1 || number > 25) return null;
  
      // ❌ already called
      if (game.calledNumbers.includes(number)) return null;
  
      // ✅ add number
      game.calledNumbers.push(number);
  
      // mark all boards
      Object.keys(game.boards).forEach((pid) => {
        markNumber(game, pid, number);
  
        // 🔥 calculate lines
        const lines = countCompletedLines(game.marked[pid]);
  
        game.playerLines[pid] = lines;
  
        // 🏆 WIN CONDITION (5 lines)
        if (lines >= 5) {
          game.winner = pid;
          game.status = "finished";
        }
      });
  
      if (game.status === "finished") return game;
  
      // 🔁 next turn
      game.turn = getNextPlayer(game, playerId);
    }
  
    return game;
  }
  
  //
  // 🔁 NEXT PLAYER
  //
  function getNextPlayer(game, currentId) {
    const index = game.players.findIndex(p => p.id === currentId);
    const nextIndex = (index + 1) % game.players.length;
    return game.players[nextIndex].id;
  }
  
  //
  // 🎲 BOARD
  //
  function generateBoard() {
    const numbers = shuffle([...Array(25).keys()].map(n => n + 1));
  
    const board = [];
    let idx = 0;
  
    for (let i = 0; i < 5; i++) {
      const row = [];
      for (let j = 0; j < 5; j++) {
        row.push(numbers[idx++]);
      }
      board.push(row);
    }
  
    return board;
  }
  
  //
  // 🔁 SHUFFLE
  //
  function shuffle(arr) {
    return arr.sort(() => Math.random() - 0.5);
  }
  
  //
  // 📌 MARK NUMBER
  //
  function markNumber(game, playerId, number) {
    const board = game.boards[playerId];
    const marked = game.marked[playerId];
  
    for (let i = 0; i < 5; i++) {
      for (let j = 0; j < 5; j++) {
        if (board[i][j] === number) {
          marked[i][j] = true;
        }
      }
    }
  }
  
  //
  // 🧠 COUNT COMPLETED LINES
  //
  function countCompletedLines(marked) {
    let count = 0;
  
    // rows
    for (let i = 0; i < 5; i++) {
      if (marked[i].every(v => v)) count++;
    }
  
    // cols
    for (let j = 0; j < 5; j++) {
      let full = true;
      for (let i = 0; i < 5; i++) {
        if (!marked[i][j]) full = false;
      }
      if (full) count++;
    }
  
    // diag 1
    let d1 = true;
    for (let i = 0; i < 5; i++) {
      if (!marked[i][i]) d1 = false;
    }
    if (d1) count++;
  
    // diag 2
    let d2 = true;
    for (let i = 0; i < 5; i++) {
      if (!marked[i][4 - i]) d2 = false;
    }
    if (d2) count++;
  
    return count;
  }
  
  module.exports = {
    init,
    move,
  };