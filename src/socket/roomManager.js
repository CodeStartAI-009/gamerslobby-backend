// backend/socket/roomManager.js

const rooms = {};

//
// 🟢 CREATE ROOM
//
function createRoom({ roomId, game, maxPlayers, host }) {
  rooms[roomId] = {
    roomId,
    game,
    maxPlayers,
    players: [],
    hostId: host, // ✅ ALWAYS userId
    status: "waiting",
  };
}

//
// 📦 GET ROOM
//
function getRoom(roomId) {
  return rooms[roomId] || null;
}

//
// ➕ ADD PLAYER
//
function addPlayer(roomId, player) {
  const room = rooms[roomId];
  if (!room) return null;

  if (room.players.length >= room.maxPlayers) return null;

  // 🔒 prevent duplicate (based on userId)
  if (room.players.find(p => p.id === player.id)) return room;

  room.players.push({
    id: player.id,              // ✅ userId
    socketId: player.socketId,  // ✅ connection tracking
    user: player.user || {},
    isBot: player.isBot || false,
  });

  return room;
}

//
// ❌ REMOVE PLAYER (FIXED)
//
function removePlayer(socketId) {
  for (let roomId in rooms) {
    const room = rooms[roomId];

    // 🔥 remove by socketId (NOT userId)
    room.players = room.players.filter(p => p.socketId !== socketId);

    // 🔄 reassign host (use userId)
    if (
      room.players.length > 0 &&
      !room.players.find(p => p.id === room.hostId)
    ) {
      room.hostId = room.players[0].id;
    }

    // 🗑 delete empty room
    if (room.players.length === 0) {
      delete rooms[roomId];
    }
  }
}

//
// 🎲 FIND RANDOM ROOM
//
function findRandomRoom(game, maxPlayers) {
  for (let roomId in rooms) {
    const room = rooms[roomId];

    if (
      room.game === game &&
      room.maxPlayers === maxPlayers &&
      room.players.length < room.maxPlayers &&
      room.status === "waiting"
    ) {
      return room;
    }
  }
  return null;
}

//
// 🤖 ADD BOTS (FIXED)
//
function addBots(room) {
  while (room.players.length < room.maxPlayers) {
    room.players.push({
      id: "bot_" + Date.now() + "_" + Math.floor(Math.random() * 1000),
      socketId: null, // ✅ IMPORTANT (bots have no socket)
      user: { name: "Bot 🤖" },
      isBot: true,
    });
  }
  return room;
}

//
// 🔍 CHECK FULL
//
function isRoomFull(room) {
  return room.players.length >= room.maxPlayers;
}

module.exports = {
  rooms,
  createRoom,
  getRoom,
  addPlayer,
  removePlayer,
  findRandomRoom,
  addBots,
  isRoomFull,
};