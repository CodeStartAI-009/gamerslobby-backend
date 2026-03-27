const { getGame } = require("./gameManager");

//
// 🔍 CHECK BOT TURN
//
function isBotTurn(game) {
  const player = game.players.find(p => p.id === game.turn);
  return player?.isBot;
}

//
// 🎯 MAIN BOT RUNNER (FINAL FIX)
//
function runBotIfNeeded(io, roomId) {
  const game = getGame(roomId);

  if (!game || game.status === "finished") return;
  if (!isBotTurn(game)) return;

  // 🔥 FIX: use game object itself safely
  if (game._botRunning) return;
  game._botRunning = true;

  setTimeout(() => {
    try {
      const freshGame = getGame(roomId);

      if (!freshGame || freshGame.status === "finished") {
        if (freshGame) freshGame._botRunning = false;
        return;
      }

      if (!isBotTurn(freshGame)) {
        freshGame._botRunning = false;
        return;
      }

      //
      // 🎮 MAKE MOVE
      //
      const updatedGame = makeBotMove(freshGame);

      if (!updatedGame) {
        console.log("⚠️ Bot has no moves → ending game");

        freshGame.status = "finished";
        freshGame.winner = null;

        io.to(roomId).emit("game_update", freshGame);
        freshGame._botRunning = false;
        return;
      }

      //
      // 📡 EMIT UPDATE
      //
      io.to(roomId).emit("game_update", updatedGame);

      // 🔥 FIX: reset flag on updatedGame
      updatedGame._botRunning = false;

      //
      // 🔁 CONTINUE LOOP SAFELY
      //
      if (isBotTurn(updatedGame)) {
        setTimeout(() => {
          runBotIfNeeded(io, roomId);
        }, 500); // smoother UX
      }

    } catch (e) {
      console.log("❌ Bot error:", e.message);

      const g = getGame(roomId);
      if (g) g._botRunning = false;
    }
  }, 400);
}

//
// 🎮 BOT MOVE ROUTER
//
function makeBotMove(game) {
  switch (game.type) {
    case "bingo":
      return bingoBot(game);

    case "xox":
      return xoxBot(game);

    case "chess":
      return chessBot(game);

    case "checkers":
      return checkersBot(game);

    default:
      return null;
  }
}

//
// ♟ CHESS BOT
//
function chessBot(game) {
  const playerId = game.turn;
  const engine = require("./chess/chessEngine");

  const moves = engine.getAllValidMoves(game, playerId);

  if (!moves || moves.length === 0) return null;

  const move = moves[Math.floor(Math.random() * moves.length)];

  return engine.move(game, playerId, move);
}

//
// 🎲 BINGO BOT (SMART)
//
function bingoBot(game) {
  const botId = game.turn;

  const board = game.boards[botId];
  const marked = game.marked[botId];

  const scoreMap = {};

  for (let i = 0; i < 5; i++) {
    for (let j = 0; j < 5; j++) {
      const num = board[i][j];

      if (game.calledNumbers.includes(num)) continue;

      let score = 0;

      score += marked[i].filter(v => v).length;
      score += marked.map(r => r[j]).filter(v => v).length;

      if (i === j) {
        for (let k = 0; k < 5; k++) if (marked[k][k]) score++;
      }

      if (i + j === 4) {
        for (let k = 0; k < 5; k++) if (marked[k][4 - k]) score++;
      }

      scoreMap[num] = (scoreMap[num] || 0) + score;
    }
  }

  const best = Object.entries(scoreMap).sort((a, b) => b[1] - a[1]);

  let chosen;

  if (best.length > 0) {
    chosen = Number(best[0][0]);
  } else {
    const available = [];
    for (let i = 1; i <= 25; i++) {
      if (!game.calledNumbers.includes(i)) available.push(i);
    }

    if (!available.length) return null;

    chosen = available[Math.floor(Math.random() * available.length)];
  }

  return require("./bingo/bingoEngine").move(game, botId, {
    type: "call",
    number: chosen,
  });
}

//
// ❌⭕ XOX BOT (SMART WIN)
//
function xoxBot(game) {
  const engine = require("./xox/xoxEngine");

  const moves = engine.getValidMoves(game);

  if (!moves.length) return null;

  // 🧠 try win
  for (let m of moves) {
    const clone = structuredClone(game);
    clone.board[m.index] = game.symbols[game.turn];

    if (engine.move(clone, game.turn, m)?.winner === game.turn) {
      return engine.move(game, game.turn, m);
    }
  }

  // 🎯 fallback
  const move = moves[Math.floor(Math.random() * moves.length)];
  return engine.move(game, game.turn, move);
}

//
// ♟ CHECKERS BOT
//
function checkersBot(game) {
  const engine = require("./checkers/checkersEngine");
  const playerId = game.turn;

  const moves = [];

  for (let i = 0; i < 8; i++) {
    for (let j = 0; j < 8; j++) {
      const piece = game.board[i][j];
      if (!piece) continue;

      if (piece.color !== game.pieces[playerId]) continue;

      for (let dr of [-1, 1]) {
        for (let dc of [-1, 1]) {
          moves.push({
            from: { row: i, col: j },
            to: { row: i + dr, col: j + dc },
          });

          moves.push({
            from: { row: i, col: j },
            to: { row: i + dr * 2, col: j + dc * 2 },
          });
        }
      }
    }
  }

  const validMoves = moves.filter(m =>
    engine.move(structuredClone(game), playerId, m)
  );

  if (!validMoves.length) return null;

  const move = validMoves[Math.floor(Math.random() * validMoves.length)];

  return engine.move(game, playerId, move);
}

module.exports = {
  runBotIfNeeded,
};