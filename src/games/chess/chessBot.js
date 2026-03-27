const { move, getNextPlayer } = require("./chessEngine");

// ♟ PIECE VALUES
const pieceValue = {
  pawn: 100,
  knight: 300,
  bishop: 300,
  rook: 500,
  queen: 900,
  king: 20000,
};

// 🧠 BOARD EVALUATION
function evaluateBoard(game, botColor) {
  let score = 0;

  for (let row of game.board) {
    for (let piece of row) {
      if (!piece) continue;

      const val = pieceValue[piece.type];
      score += piece.color === botColor ? val : -val;
    }
  }

  return score;
}

// ✅ FULL LEGAL MOVE GENERATION (IMPORTANT FIX)
function getAllMoves(game, playerId) {
  const moves = [];
  const color = game.colors[playerId];

  for (let r = 0; r < 8; r++) {
    for (let c = 0; c < 8; c++) {
      const piece = game.board[r][c];
      if (!piece || piece.color !== color) continue;

      for (let r2 = 0; r2 < 8; r2++) {
        for (let c2 = 0; c2 < 8; c2++) {
          const mv = {
            from: { row: r, col: c },
            to: { row: r2, col: c2 },
          };

          const clone = structuredClone(game);
          const res = move(clone, playerId, mv);

          if (res) moves.push(mv);
        }
      }
    }
  }

  return moves;
}

// ⚡ LIMIT MOVES (PERFORMANCE BOOST)
function getTopMoves(game, playerId, limit = 20) {
  const moves = getAllMoves(game, playerId);

  // basic ordering: captures first
  const scored = moves.map((mv) => {
    const target = game.board[mv.to.row][mv.to.col];
    const score = target ? pieceValue[target.type] : 0;
    return { mv, score };
  });

  scored.sort((a, b) => b.score - a.score);

  return scored.slice(0, limit).map((m) => m.mv);
}

// 🧠 MINIMAX
function minimax(game, depth, isMax, botId) {
  const botColor = game.colors[botId];

  if (game.status === "finished") {
    return game.winner === botId ? 999999 : -999999;
  }

  if (depth === 0) {
    return evaluateBoard(game, botColor);
  }

  const playerId = isMax
    ? botId
    : getNextPlayer(game, botId);

  const moves = getTopMoves(game, playerId);

  if (!moves.length) return evaluateBoard(game, botColor);

  if (isMax) {
    let best = -Infinity;

    for (let mv of moves) {
      const clone = structuredClone(game);
      const res = move(clone, playerId, mv);
      if (!res) continue;

      best = Math.max(
        best,
        minimax(clone, depth - 1, false, botId)
      );
    }

    return best;
  } else {
    let best = Infinity;

    for (let mv of moves) {
      const clone = structuredClone(game);
      const res = move(clone, playerId, mv);
      if (!res) continue;

      best = Math.min(
        best,
        minimax(clone, depth - 1, true, botId)
      );
    }

    return best;
  }
}

// 🚀 BEST MOVE
function getBestMove(game, botId) {
  const moves = getTopMoves(game, botId);

  let bestMove = null;
  let bestValue = -Infinity;

  for (let mv of moves) {
    const clone = structuredClone(game);
    const res = move(clone, botId, mv);
    if (!res) continue;

    const val = minimax(clone, 2, false, botId);

    if (val > bestValue) {
      bestValue = val;
      bestMove = mv;
    }
  }

  return bestMove;
}

module.exports = { getBestMove };