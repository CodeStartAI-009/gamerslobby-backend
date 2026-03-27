function init(players) {
  // 🔒 SAFETY CHECK
  if (!players || players.length < 2) {
    console.log("❌ Not enough players for chess:", players);
    return null;
  }

  const human = players.find(p => !p.isBot);
  const bot = players.find(p => p.isBot);

  let colors = {};

  // ✅ HANDLE ALL CASES SAFELY
  if (human && bot) {
    colors[human.id] = "white";
    colors[bot.id] = "black";
  } else if (players.length >= 2) {
    colors[players[0].id] = "white";
    colors[players[1].id] = "black";
  } else {
    console.log("❌ Invalid players structure:", players);
    return null;
  }

  const whitePlayerId = Object.keys(colors).find(
    id => colors[id] === "white"
  );

  return {
    type: "chess",
    players,
    board: createInitialBoard(),
    turn: whitePlayerId,
    colors,
    winner: null,
    status: "playing",
    check: false,
    history: [],
    castling: {
      white: { king: true, rookLeft: true, rookRight: true },
      black: { king: true, rookLeft: true, rookRight: true },
    },
    enPassant: null,
  };
}

function move(game, playerId, move) {
  if (!game || game.status !== "playing") return null;
  if (game.turn !== playerId) return null;
  game.history.push(deepClone(game));
  const { from, to, promotion } = move;
  const piece = game.board[from.row][from.col];
  if (!piece) return null;

  const color = game.colors[playerId];
  if (piece.color !== color) return null;

  if (!isValidMove(game, from, to)) return null;

  const clone = deepClone(game);
  applyMove(clone, from, to);

  if (isKingInCheck(clone, color)) return null;

  // ✅ APPLY MOVE
  applyMove(game, from, to);

  // ♜ CASTLING MOVE
  if (piece.type === "king" && Math.abs(to.col - from.col) === 2) {
    handleCastling(game, from, to);
  }

  // 🔥 UPDATE CASTLING RIGHTS
  updateCastlingRights(game, piece, from);

  // ♟ EN PASSANT CAPTURE
  if (
    piece.type === "pawn" &&
    game.enPassant &&
    to.row === game.enPassant.row &&
    to.col === game.enPassant.col
  ) {
    const dir = piece.color === "white" ? 1 : -1;
    game.board[to.row + dir][to.col] = null;
  }

  // 🔥 SET EN PASSANT TARGET
  game.enPassant = null;
  if (
    piece.type === "pawn" &&
    Math.abs(to.row - from.row) === 2
  ) {
    game.enPassant = {
      row: (from.row + to.row) / 2,
      col: from.col,
    };
  }

  // ♟ PROMOTION
  if (piece.type === "pawn" && (to.row === 0 || to.row === 7)) {
    game.board[to.row][to.col] = {
      type: promotion || "queen",
      color: piece.color,
    };
  }

  const nextPlayer = getNextPlayer(game, playerId);
  game.turn = nextPlayer;

  const opponentColor = game.colors[nextPlayer];

  game.check = isKingInCheck(game, opponentColor);

  if (!hasAnyLegalMove(game, nextPlayer)) {
    if (game.check) {
      game.winner = playerId;
      game.status = "finished";
    } else {
      game.status = "stalemate";
    }
  }

  return game;
}
function undoMove(game) {
  if (!game.history || game.history.length === 0) return null;

  const prev = game.history.pop();

  return prev;
}

//
// 🔥 APPLY MOVE
//
function applyMove(game, from, to) {
  game.board[to.row][to.col] =
    game.board[from.row][from.col];
  game.board[from.row][from.col] = null;
}

//
// 🔥 CASTLING HANDLER
//
function handleCastling(game, from, to) {
  const row = from.row;

  if (to.col === 6) {
    game.board[row][5] = game.board[row][7];
    game.board[row][7] = null;
  }

  if (to.col === 2) {
    game.board[row][3] = game.board[row][0];
    game.board[row][0] = null;
  }
}

//
// 🔥 CASTLING RIGHTS UPDATE
//
function updateCastlingRights(game, piece, from) {
  const side = piece.color;

  if (piece.type === "king") {
    game.castling[side].king = false;
  }

  if (piece.type === "rook") {
    if (from.col === 0) game.castling[side].rookLeft = false;
    if (from.col === 7) game.castling[side].rookRight = false;
  }
}

//
// 🧠 VALID MOVE
//
function isValidMove(game, from, to) {
  const piece = game.board[from.row][from.col];
  if (!piece) return false;

  const target = game.board[to.row][to.col];
  if (target && target.color === piece.color) return false;

  switch (piece.type) {
    case "pawn":
      return validatePawn(game, from, to, piece);
    case "rook":
      return validateRook(game, from, to);
    case "bishop":
      return validateBishop(game, from, to);
    case "queen":
      return validateQueen(game, from, to);
    case "knight":
      return validateKnight(from, to);
    case "king":
      return validateKing(game, from, to);
    default:
      return false;
  }
}
function hasAnyLegalMove(game, playerId) {
  const color = game.colors[playerId];

  for (let r = 0; r < 8; r++) {
    for (let c = 0; c < 8; c++) {
      const piece = game.board[r][c];
      if (!piece || piece.color !== color) continue;

      for (let r2 = 0; r2 < 8; r2++) {
        for (let c2 = 0; c2 < 8; c2++) {
          const from = { row: r, col: c };
          const to = { row: r2, col: c2 };

          if (!isValidMove(game, from, to)) continue;

          const clone = deepClone(game);
          applyMove(clone, from, to);

          if (!isKingInCheck(clone, color)) return true;
        }
      }
    }
  }

  return false;
}
//
// ♟ PAWN (EN PASSANT ADDED)
//
function validatePawn(game, from, to, piece) {
  const dir = piece.color === "white" ? -1 : 1;
  const board = game.board;

  if (to.col === from.col) {
    if (board[to.row][to.col]) return false;

    if (to.row === from.row + dir) return true;

    if (
      (piece.color === "white" && from.row === 6) ||
      (piece.color === "black" && from.row === 1)
    ) {
      if (
        to.row === from.row + 2 * dir &&
        !board[from.row + dir][from.col]
      ) return true;
    }
  }

  // normal capture
  if (
    Math.abs(to.col - from.col) === 1 &&
    to.row === from.row + dir
  ) {
    const target = board[to.row][to.col];
    if (target && target.color !== piece.color) return true;

    // 🔥 EN PASSANT
    if (
      game.enPassant &&
      to.row === game.enPassant.row &&
      to.col === game.enPassant.col
    ) {
      return true;
    }
  }

  return false;
}

//
// ♚ KING (FULL CASTLING RULES)
//
function validateKing(game, from, to) {
  const dr = Math.abs(from.row - to.row);
  const dc = Math.abs(from.col - to.col);
  const color = game.board[from.row][from.col].color;

  if (dr <= 1 && dc <= 1) {
    const clone = deepClone(game);
    applyMove(clone, from, to);
    return !isKingInCheck(clone, color);
  }

  // 🔥 CASTLING
  if (dr === 0 && dc === 2) {
    return canCastle(game, from, to, color);
  }

  return false;
}

function canCastle(game, from, to, color) {
  const row = from.row;

  if (!game.castling[color].king) return false;

  // king side
  if (to.col === 6) {
    if (!game.castling[color].rookRight) return false;
    if (game.board[row][5] || game.board[row][6]) return false;

    // ❌ cannot pass through check
    if (isSquareAttacked(game, row, 4, color)) return false;
    if (isSquareAttacked(game, row, 5, color)) return false;
    if (isSquareAttacked(game, row, 6, color)) return false;

    return true;
  }

  // queen side
  if (to.col === 2) {
    if (!game.castling[color].rookLeft) return false;
    if (game.board[row][1] || game.board[row][2] || game.board[row][3]) return false;

    if (isSquareAttacked(game, row, 4, color)) return false;
    if (isSquareAttacked(game, row, 3, color)) return false;
    if (isSquareAttacked(game, row, 2, color)) return false;

    return true;
  }

  return false;
}
function isKingInCheck(game, color) {
  let kingPos = null;

  // 🔍 find king
  for (let r = 0; r < 8; r++) {
    for (let c = 0; c < 8; c++) {
      const piece = game.board[r][c];
      if (piece?.type === "king" && piece.color === color) {
        kingPos = { row: r, col: c };
      }
    }
  }

  if (!kingPos) return true;

  // 🔥 check if attacked
  for (let r = 0; r < 8; r++) {
    for (let c = 0; c < 8; c++) {
      const piece = game.board[r][c];
      if (!piece || piece.color === color) continue;

      if (canAttack(game, { row: r, col: c }, kingPos, piece)) {
        return true;
      }
    }
  }

  return false;
}
function canAttack(game, from, to, piece) {
  switch (piece.type) {
    case "pawn": {
      const dir = piece.color === "white" ? -1 : 1;
      return (
        Math.abs(to.col - from.col) === 1 &&
        to.row === from.row + dir
      );
    }

    case "rook":
      return validateRook(game, from, to);

    case "bishop":
      return validateBishop(game, from, to);

    case "queen":
      return validateQueen(game, from, to);

    case "knight":
      return validateKnight(from, to);

    case "king":
      return (
        Math.abs(from.row - to.row) <= 1 &&
        Math.abs(from.col - to.col) <= 1
      );

    default:
      return false;
  }
}
//
// 🔍 ATTACK CHECK
//
function isSquareAttacked(game, row, col, color) {
  const opponent = color === "white" ? "black" : "white";

  for (let r = 0; r < 8; r++) {
    for (let c = 0; c < 8; c++) {
      const p = game.board[r][c];
      if (!p || p.color !== opponent) continue;

      if (canAttack(game, { row: r, col: c }, { row, col }, p)) {
        return true;
      }
    }
  }

  return false;
}



//
// (rest same: rook, bishop, queen, knight, path, legal moves, etc)
// KEEP YOUR EXISTING IMPLEMENTATION FOR THEM
//

function validateRook(game, from, to) {
  if (from.row !== to.row && from.col !== to.col) return false;
  return isPathClear(game.board, from, to);
}

function validateBishop(game, from, to) {
  if (Math.abs(from.row - to.row) !== Math.abs(from.col - to.col))
    return false;
  return isPathClear(game.board, from, to);
}

function validateQueen(game, from, to) {
  return (
    validateRook(game, from, to) ||
    validateBishop(game, from, to)
  );
}

function validateKnight(from, to) {
  const r = Math.abs(from.row - to.row);
  const c = Math.abs(from.col - to.col);
  return (r === 2 && c === 1) || (r === 1 && c === 2);
}

function isPathClear(board, from, to) {
  const rowStep = Math.sign(to.row - from.row);
  const colStep = Math.sign(to.col - from.col);

  let r = from.row + rowStep;
  let c = from.col + colStep;

  while (r !== to.row || c !== to.col) {
    if (board[r][c]) return false;
    r += rowStep;
    c += colStep;
  }

  return true;
}

function getNextPlayer(game, currentId) {
  const index = game.players.findIndex((p) => p.id === currentId);
  return game.players[(index + 1) % game.players.length].id;
}

function deepClone(obj) {
  return JSON.parse(JSON.stringify(obj));
}
//
// ♟ INITIAL BOARD (MISSING - THIS CAUSED CRASH)
//
function createInitialBoard() {
  const empty = Array(8).fill(null);

  return [
    createBackRow("black"),
    createPawnRow("black"),
    [...empty],
    [...empty],
    [...empty],
    [...empty],
    createPawnRow("white"),
    createBackRow("white"),
  ];
}

function createPawnRow(color) {
  return Array(8).fill(null).map(() => ({
    type: "pawn",
    color,
  }));
}

function createBackRow(color) {
  return [
    { type: "rook", color },
    { type: "knight", color },
    { type: "bishop", color },
    { type: "queen", color },
    { type: "king", color },
    { type: "bishop", color },
    { type: "knight", color },
    { type: "rook", color },
  ];
}
module.exports = {
  init,
  move,
  undoMove, // 🔥 ADD
  isKingInCheck,
  getNextPlayer,
};