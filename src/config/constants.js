// backend/config/constants.js

module.exports = {
    MAX_PLAYERS: {
      xox: 2,
      checkers: 2,
      chess: 2,
      ludo: 4,
      snake: 4,
      bingo: 4,
    },
  
    GAME_STATUS: {
      WAITING: "waiting",
      PLAYING: "playing",
      FINISHED: "finished",
    },
  
    TURN_TIMEOUT: 30000, // 30 seconds per move
  
    ROOM_LIMITS: {
      MAX_ROOMS: 1000,
    },
  };