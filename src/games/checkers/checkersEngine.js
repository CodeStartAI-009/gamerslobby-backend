// backend/games/checkers/checkersEngine.js

function init(players) {
    const board = createInitialBoard();
  
    return {
      type: "checkers",
  
      players, // [{ id, user }]
  
      board, // 8x8
  
      turn: players[0].id,
  
      pieces: {
        [players[0].id]: "red",
        [players[1].id]: "black",
      },
  
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
  
    const { from, to } = move;
  
    const piece = game.board[from.row][from.col];
  
    if (!piece) return null;
  
    const playerColor = game.pieces[playerId];
  
    if (piece.color !== playerColor) return null;
  
    // validate move
    const valid = isValidMove(game, from, to, playerColor);
    if (!valid) return null;
  
    // move piece
    game.board[to.row][to.col] = piece;
    game.board[from.row][from.col] = null;
  
    // capture
    if (Math.abs(to.row - from.row) === 2) {
      const midRow = (from.row + to.row) / 2;
      const midCol = (from.col + to.col) / 2;
      game.board[midRow][midCol] = null;
    }
  
    // king promotion
    if (
      (piece.color === "red" && to.row === 0) ||
      (piece.color === "black" && to.row === 7)
    ) {
      piece.king = true;
    }
  
    // 🔁 next turn
    game.turn = getNextPlayer(game, playerId);
  
    // 🏆 check win
    const opponent = game.players.find(p => p.id !== playerId);
    if (!hasMoves(game, opponent.id)) {
      game.winner = playerId;
      game.status = "finished";
    }
  
    return game;
  }
  
  //
  // ✅ VALID MOVE
  //
  function isValidMove(game, from, to, color) {
    const board = game.board;
  
    // out of bounds
    if (
      to.row < 0 || to.row > 7 ||
      to.col < 0 || to.col > 7
    ) return false;
  
    // destination must be empty
    if (board[to.row][to.col]) return false;
  
    const piece = board[from.row][from.col];
  
    const dir = color === "red" ? -1 : 1;
  
    const rowDiff = to.row - from.row;
    const colDiff = Math.abs(to.col - from.col);
  
    // normal move
    if (!piece.king) {
      if (rowDiff === dir && colDiff === 1) return true;
  
      // capture
      if (rowDiff === dir * 2 && colDiff === 2) {
        const midRow = (from.row + to.row) / 2;
        const midCol = (from.col + to.col) / 2;
        const middle = board[midRow][midCol];
  
        return middle && middle.color !== color;
      }
    }
  
    // king moves
    if (piece.king) {
      if (Math.abs(rowDiff) === 1 && colDiff === 1) return true;
  
      if (Math.abs(rowDiff) === 2 && colDiff === 2) {
        const midRow = (from.row + to.row) / 2;
        const midCol = (from.col + to.col) / 2;
        const middle = board[midRow][midCol];
  
        return middle && middle.color !== color;
      }
    }
  
    return false;
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
  // 🧠 CHECK IF PLAYER HAS MOVES
  //
  function hasMoves(game, playerId) {
    const color = game.pieces[playerId];
  
    for (let i = 0; i < 8; i++) {
      for (let j = 0; j < 8; j++) {
        const piece = game.board[i][j];
  
        if (piece && piece.color === color) {
          const directions = [-1, 1];
  
          for (let d of directions) {
            for (let dc of [-1, 1]) {
              const r = i + d;
              const c = j + dc;
  
              if (isInside(r, c) && !game.board[r][c]) return true;
  
              // capture
              const r2 = i + d * 2;
              const c2 = j + dc * 2;
  
              if (isInside(r2, c2)) {
                const mid = game.board[i + d][j + dc];
                if (mid && mid.color !== color && !game.board[r2][c2]) {
                  return true;
                }
              }
            }
          }
        }
      }
    }
  
    return false;
  }
  
  function isInside(r, c) {
    return r >= 0 && r < 8 && c >= 0 && c < 8;
  }
  
  //
  // 🎲 INITIAL BOARD
  //
  function createInitialBoard() {
    const board = Array(8)
      .fill(null)
      .map(() => Array(8).fill(null));
  
    // black (top)
    for (let i = 0; i < 3; i++) {
      for (let j = 0; j < 8; j++) {
        if ((i + j) % 2 === 1) {
          board[i][j] = { color: "black", king: false };
        }
      }
    }
  
    // red (bottom)
    for (let i = 5; i < 8; i++) {
      for (let j = 0; j < 8; j++) {
        if ((i + j) % 2 === 1) {
          board[i][j] = { color: "red", king: false };
        }
      }
    }
  
    return board;
  }
  
  module.exports = {
    init,
    move,
  };