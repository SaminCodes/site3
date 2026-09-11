var __create = Object.create;
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getProtoOf = Object.getPrototypeOf;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toESM = (mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(
  // If the importer is in node compatibility mode or this is not an ESM
  // file that has been converted to a CommonJS file using a Babel-
  // compatible transform (i.e. "__esModule" has not been set), then set
  // "default" to the CommonJS "module.exports" for node compatibility.
  isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", { value: mod, enumerable: true }) : target,
  mod
));

// server.ts
var import_express = __toESM(require("express"), 1);
var import_http = __toESM(require("http"), 1);
var import_path = __toESM(require("path"), 1);
var import_fs = __toESM(require("fs"), 1);
var import_vite = require("vite");

// server/multiplayerServer.ts
var import_socket = require("socket.io");
function setupMultiplayerSocket(httpServer) {
  const io = new import_socket.Server(httpServer, {
    cors: {
      origin: "*",
      methods: ["GET", "POST"]
    },
    pingInterval: 1e4,
    pingTimeout: 5e3
  });
  const rooms = /* @__PURE__ */ new Map();
  const matchmakingQueue = [];
  const socketMetadata = /* @__PURE__ */ new Map();
  const getEnrichedRoomsList = () => {
    const list = [];
    const now = Date.now();
    for (const [id, room] of rooms.entries()) {
      if (room.status === "waiting" && now - room.createdAt > 30 * 60 * 1e3) {
        rooms.delete(id);
        continue;
      }
      const socketRoom = io.sockets.adapter.rooms.get(id);
      const onlineCount = socketRoom ? socketRoom.size : 0;
      list.push({
        ...room,
        onlineCount
      });
    }
    return list.sort((a, b) => b.createdAt - a.createdAt);
  };
  const broadcastRoomsList = () => {
    io.emit("rooms_list", getEnrichedRoomsList());
  };
  io.on("connection", (socket) => {
    socket.on("get_rooms_list", () => {
      socket.emit("rooms_list", getEnrichedRoomsList());
    });
    socket.on("create_room", (data) => {
      try {
        const roomId = "room-" + Date.now().toString(36) + "-" + Math.random().toString(36).substring(2, 6);
        const creatorPlayer = {
          ...data.host,
          selectedCharacters: Array.isArray(data.host.selectedCharacters) ? data.host.selectedCharacters.slice(0, 2) : [],
          isReady: false,
          connected: true
        };
        const isCreatingAsSpectator = data.asSpectator || creatorPlayer.role === "admin";
        const newRoom = {
          id: roomId,
          name: data.roomName?.trim() || `\u041A\u0430\u043C\u043F\u0430\u043D\u0438\u044F ${creatorPlayer.name}`,
          status: "waiting",
          host: isCreatingAsSpectator ? null : creatorPlayer,
          guest: null,
          spectator: isCreatingAsSpectator ? creatorPlayer : null,
          spectators: isCreatingAsSpectator ? [creatorPlayer] : [],
          creatorId: creatorPlayer.id,
          creatorName: creatorPlayer.name,
          mapId: data.initialMap?.id || "default_tactical_arena",
          mapName: data.initialMap?.name || "\u0422\u0430\u043A\u0442\u0438\u0447\u0435\u0441\u043A\u0430\u044F \u0410\u0440\u0435\u043D\u0430",
          mapData: data.initialMap || void 0,
          turnNumber: 1,
          roundNumber: 1,
          createdAt: Date.now()
        };
        rooms.set(roomId, newRoom);
        socketMetadata.set(socket.id, { userId: creatorPlayer.id, userName: creatorPlayer.name, roomId });
        socket.join(roomId);
        socket.emit("room_created", newRoom);
        socket.emit("room_updated", newRoom);
        broadcastRoomsList();
      } catch (err) {
        console.error("Error in create_room:", err);
        socket.emit("room_error", { message: "\u041E\u0448\u0438\u0431\u043A\u0430 \u0441\u043E\u0437\u0434\u0430\u043D\u0438\u044F \u043A\u043E\u043C\u043D\u0430\u0442\u044B: " + (err.message || "\u041D\u0435\u0438\u0437\u0432\u0435\u0441\u0442\u043D\u0430\u044F \u043E\u0448\u0438\u0431\u043A\u0430") });
      }
    });
    socket.on("join_room", (data) => {
      try {
        const room = rooms.get(data.roomId);
        if (!room) {
          return socket.emit("room_error", { message: "\u041A\u043E\u043C\u043D\u0430\u0442\u0430 \u043D\u0435 \u043D\u0430\u0439\u0434\u0435\u043D\u0430 \u0438\u043B\u0438 \u0431\u044B\u043B\u0430 \u0443\u0434\u0430\u043B\u0435\u043D\u0430" });
        }
        if (room.status === "in_game" && room.host?.id !== data.guest.id && room.guest?.id !== data.guest.id && room.spectator?.id !== data.guest.id) {
          return socket.emit("room_error", { message: "\u0412 \u044D\u0442\u043E\u0439 \u043A\u043E\u043C\u043D\u0430\u0442\u0435 \u0443\u0436\u0435 \u0438\u0434\u0451\u0442 \u043C\u0430\u0442\u0447" });
        }
        if (room.host && room.host.id === data.guest.id) {
          room.host.connected = true;
          socketMetadata.set(socket.id, { userId: data.guest.id, userName: data.guest.name, roomId: data.roomId });
          socket.join(data.roomId);
          socket.emit("room_joined", room);
          io.to(data.roomId).emit("room_updated", room);
          broadcastRoomsList();
          return;
        }
        if (room.guest && room.guest.id === data.guest.id) {
          room.guest.connected = true;
          socketMetadata.set(socket.id, { userId: data.guest.id, userName: data.guest.name, roomId: data.roomId });
          socket.join(data.roomId);
          socket.emit("room_joined", room);
          io.to(data.roomId).emit("room_updated", room);
          broadcastRoomsList();
          return;
        }
        if (room.spectator && room.spectator.id === data.guest.id) {
          room.spectator = null;
          if (room.spectators) room.spectators = room.spectators.filter((s) => s.id !== data.guest.id);
        }
        const joiningPlayer = {
          ...data.guest,
          selectedCharacters: Array.isArray(data.guest.selectedCharacters) ? data.guest.selectedCharacters.slice(0, 2) : [],
          isReady: false,
          connected: true
        };
        if (!room.host) {
          room.host = joiningPlayer;
          if (room.guest) room.status = "ready";
          socketMetadata.set(socket.id, { userId: data.guest.id, userName: data.guest.name, roomId: data.roomId });
          socket.join(data.roomId);
          socket.emit("room_joined", room);
          io.to(data.roomId).emit("room_updated", room);
          broadcastRoomsList();
          return;
        }
        if (!room.guest) {
          room.guest = joiningPlayer;
          if (room.host) room.status = "ready";
          socketMetadata.set(socket.id, { userId: data.guest.id, userName: data.guest.name, roomId: data.roomId });
          socket.join(data.roomId);
          socket.emit("room_joined", room);
          io.to(data.roomId).emit("room_updated", room);
          broadcastRoomsList();
          return;
        }
        return socket.emit("room_error", { message: "\u0412 \u043A\u043E\u043C\u043D\u0430\u0442\u0435 \u0443\u0436\u0435 \u0435\u0441\u0442\u044C 2 \u0438\u0433\u0440\u043E\u043A\u0430" });
      } catch (err) {
        console.error("Error in join_room:", err);
        socket.emit("room_error", { message: "\u041E\u0448\u0438\u0431\u043A\u0430 \u043F\u0440\u0438\u0441\u043E\u0435\u0434\u0438\u043D\u0435\u043D\u0438\u044F \u043A \u043A\u043E\u043C\u043D\u0430\u0442\u0435" });
      }
    });
    socket.on("join_as_spectator", (data) => {
      try {
        const room = rooms.get(data.roomId);
        if (!room) {
          return socket.emit("room_error", { message: "\u041A\u043E\u043C\u043D\u0430\u0442\u0430 \u043D\u0435 \u043D\u0430\u0439\u0434\u0435\u043D\u0430" });
        }
        const spectatorPlayer = {
          ...data.spectator,
          selectedCharacters: [],
          isReady: true,
          connected: true
        };
        const specId = String(spectatorPlayer.id);
        if (room.host && String(room.host.id) === specId) {
          room.host = null;
          if (room.status === "ready") room.status = "waiting";
        }
        if (room.guest && String(room.guest.id) === specId) {
          room.guest = null;
          if (room.status === "ready") room.status = "waiting";
        }
        room.spectator = spectatorPlayer;
        if (!room.spectators) room.spectators = [];
        room.spectators = room.spectators.filter((s) => String(s.id) !== specId);
        room.spectators.push(spectatorPlayer);
        socketMetadata.set(socket.id, { userId: spectatorPlayer.id, userName: spectatorPlayer.name, roomId: data.roomId });
        socket.join(data.roomId);
        socket.emit("room_joined", room);
        io.to(data.roomId).emit("room_updated", room);
        broadcastRoomsList();
      } catch (err) {
        console.error("Error in join_as_spectator:", err);
        socket.emit("room_error", { message: "\u041E\u0448\u0438\u0431\u043A\u0430 \u0432\u0445\u043E\u0434\u0430 \u0432 \u0441\u043B\u043E\u0442 \u043D\u0430\u0431\u043B\u044E\u0434\u0430\u0442\u0435\u043B\u044F" });
      }
    });
    socket.on("leave_spectator_slot", (data) => {
      const room = rooms.get(data.roomId);
      if (!room) return;
      if (room.spectator && room.spectator.id === data.userId) {
        room.spectator = null;
      }
      if (room.spectators) {
        room.spectators = room.spectators.filter((s) => s.id !== data.userId);
      }
      io.to(data.roomId).emit("room_updated", room);
      broadcastRoomsList();
    });
    socket.on("select_characters", (data) => {
      const room = rooms.get(data.roomId);
      if (!room) return;
      const chosen = Array.isArray(data.characters) ? data.characters.slice(0, 2) : [];
      if (room.host && room.host.id === data.playerId) {
        room.host.selectedCharacters = chosen;
      } else if (room.guest && room.guest.id === data.playerId) {
        room.guest.selectedCharacters = chosen;
      }
      io.to(data.roomId).emit("room_updated", room);
    });
    socket.on("set_ready", (data) => {
      const room = rooms.get(data.roomId);
      if (!room) return;
      if (room.host && room.host.id === data.playerId) {
        room.host.isReady = data.isReady;
      } else if (room.guest && room.guest.id === data.playerId) {
        room.guest.isReady = data.isReady;
      }
      io.to(data.roomId).emit("room_updated", room);
    });
    socket.on("start_match", (data) => {
      const room = rooms.get(data.roomId);
      if (!room) {
        return socket.emit("room_error", { message: "\u041A\u043E\u043C\u043D\u0430\u0442\u0430 \u043D\u0435 \u043D\u0430\u0439\u0434\u0435\u043D\u0430" });
      }
      const hostSelected = room.host?.selectedCharacters || [];
      const guestSelected = room.guest?.selectedCharacters || [];
      if (hostSelected.length === 0 && guestSelected.length === 0) {
        return socket.emit("room_error", { message: "\u0412\u044B\u0431\u0435\u0440\u0438\u0442\u0435 \u0445\u043E\u0442\u044F \u0431\u044B 1-2 \u043F\u0435\u0440\u0441\u043E\u043D\u0430\u0436\u0430 \u0434\u043B\u044F \u0438\u0433\u0440\u044B" });
      }
      const baseMap = data.customMapData || room.mapData || {
        id: "arena_pvp_50x50",
        name: "\u0422\u0430\u043A\u0442\u0438\u0447\u0435\u0441\u043A\u0430\u044F PvP \u0410\u0440\u0435\u043D\u0430",
        width: 50,
        height: 50,
        defaultTile: "stone_ruins",
        tiles: {},
        obstacles: {},
        characters: [],
        createdAt: Date.now(),
        updatedAt: Date.now()
      };
      const hostSpawnedChars = room.host ? room.host.selectedCharacters.map((c, idx) => {
        const spawnX = 14 + idx * 2;
        const spawnY = 24 + idx % 2 * 2;
        return {
          id: `hero_host_${room.host.id}_${c.id}_${idx}`,
          characterId: c.id,
          name: c.name,
          avatarUrl: c.avatarUrl || c.imageUrl,
          spriteUrl: c.spriteUrl,
          characterFolder: c.characterFolder,
          stars: c.stars || 3,
          rarity: c.rarity || "\u0420\u0435\u0434\u043A\u0438\u0439",
          role: c.role || "\u0412\u043E\u0438\u043D",
          faction: "player",
          x: spawnX,
          y: spawnY,
          originX: spawnX,
          originY: spawnY,
          facing: "right",
          currentHp: c.stats?.hp || 120,
          maxHp: c.stats?.hp || 120,
          currentMana: c.stats?.mana || 60,
          maxMana: c.stats?.mana || 60,
          currentAp: c.stats?.ap ?? 3,
          maxAp: c.stats?.ap ?? 3,
          currentMpPoints: c.stats?.speed ?? 5,
          maxMpPoints: c.stats?.speed ?? 5,
          speed: c.stats?.speed ?? 5,
          level: c.level || 1,
          stats: c.stats,
          skills: c.skills || [],
          equippedEquipment: c.equippedEquipment,
          inventory: c.inventory || [],
          ownerId: room.host.id,
          ownerName: room.host.name,
          ownerPlayerNumber: 1
        };
      }) : [];
      const guestSpawnedChars = room.guest ? room.guest.selectedCharacters.map((c, idx) => {
        const spawnX = 18 + idx * 2;
        const spawnY = 24 + idx % 2 * 2;
        return {
          id: `hero_guest_${room.guest.id}_${c.id}_${idx}`,
          characterId: c.id,
          name: c.name,
          avatarUrl: c.avatarUrl || c.imageUrl,
          spriteUrl: c.spriteUrl,
          characterFolder: c.characterFolder,
          stars: c.stars || 3,
          rarity: c.rarity || "\u0420\u0435\u0434\u043A\u0438\u0439",
          role: c.role || "\u0412\u043E\u0438\u043D",
          faction: "player",
          x: spawnX,
          y: spawnY,
          originX: spawnX,
          originY: spawnY,
          facing: "right",
          currentHp: c.stats?.hp || 120,
          maxHp: c.stats?.hp || 120,
          currentMana: c.stats?.mana || 60,
          maxMana: c.stats?.mana || 60,
          currentAp: c.stats?.ap ?? 3,
          maxAp: c.stats?.ap ?? 3,
          currentMpPoints: c.stats?.speed ?? 5,
          maxMpPoints: c.stats?.speed ?? 5,
          speed: c.stats?.speed ?? 5,
          level: c.level || 1,
          stats: c.stats,
          skills: c.skills || [],
          equippedEquipment: c.equippedEquipment,
          inventory: c.inventory || [],
          ownerId: room.guest.id,
          ownerName: room.guest.name,
          ownerPlayerNumber: 2
        };
      }) : [];
      const otherEntities = (baseMap.characters || []).filter(
        (c) => c.entityKind === "mob" || c.entityKind === "npc"
      );
      const finalMapData = {
        ...baseMap,
        characters: [...hostSpawnedChars, ...guestSpawnedChars, ...otherEntities],
        updatedAt: Date.now()
      };
      room.status = "in_game";
      room.mapData = finalMapData;
      room.currentTurnCharacterId = hostSpawnedChars[0]?.id || guestSpawnedChars[0]?.id;
      room.activePlayerId = room.host?.id || room.guest?.id || room.spectator?.id;
      room.turnNumber = 1;
      room.roundNumber = 1;
      room.lastAction = {
        type: "spawn",
        playerId: room.host?.id || room.spectator?.id || "system",
        playerName: room.host?.name || room.spectator?.name || "\u0413\u041C",
        timestamp: Date.now(),
        message: "\u041C\u0430\u0442\u0447 \u043D\u0430\u0447\u0430\u043B\u0441\u044F! \u0413\u0435\u0440\u043E\u0438 \u0437\u0430\u0441\u043F\u0430\u0432\u043D\u0435\u043D\u044B \u043D\u0430 \u0430\u0440\u0435\u043D\u0435."
      };
      io.to(data.roomId).emit("match_started", { room, mapData: finalMapData });
      io.to(data.roomId).emit("room_updated", room);
      io.to(data.roomId).emit("game_sync", {
        room,
        mapData: finalMapData,
        lastAction: room.lastAction
      });
      broadcastRoomsList();
    });
    socket.on("update_game_state", (data) => {
      const room = rooms.get(data.roomId);
      if (!room) return;
      if (data.mapData) {
        room.mapData = {
          ...room.mapData,
          ...data.mapData,
          characters: data.mapData.characters || room.mapData?.characters || [],
          updatedAt: Date.now()
        };
      }
      if (data.action) {
        room.lastAction = data.action;
      }
      if (data.currentTurnCharacterId !== void 0) {
        room.currentTurnCharacterId = data.currentTurnCharacterId;
      }
      if (data.activePlayerId !== void 0) {
        room.activePlayerId = data.activePlayerId;
      }
      if (data.winnerPlayerId) {
        room.status = "finished";
        room.winnerPlayerId = data.winnerPlayerId;
        room.winnerPlayerName = data.winnerPlayerName;
      }
      io.to(data.roomId).emit("game_sync", {
        room,
        mapData: room.mapData,
        lastAction: data.action,
        currentTurnCharacterId: room.currentTurnCharacterId,
        activePlayerId: room.activePlayerId,
        status: room.status,
        winnerPlayerId: room.winnerPlayerId
      });
    });
    socket.on("send_chat", (data) => {
      io.to(data.roomId).emit("chat_received", data.message);
    });
    socket.on("leave_room", (data) => {
      const room = rooms.get(data.roomId);
      if (!room) return;
      socket.leave(data.roomId);
      socketMetadata.delete(socket.id);
      if (room.host && room.host.id === data.playerId) {
        if (room.status === "in_game") {
          room.status = "finished";
          room.winnerPlayerId = room.guest?.id;
          room.winnerPlayerName = room.guest?.name;
          io.to(data.roomId).emit("opponent_surrendered", { winnerId: room.guest?.id, message: "\u0425\u043E\u0441\u0442 \u043F\u043E\u043A\u0438\u043D\u0443\u043B \u043C\u0430\u0442\u0447" });
        } else {
          room.host = null;
          room.status = "waiting";
          io.to(data.roomId).emit("room_updated", room);
        }
      } else if (room.guest && room.guest.id === data.playerId) {
        if (room.status === "in_game") {
          room.status = "finished";
          room.winnerPlayerId = room.host?.id;
          room.winnerPlayerName = room.host?.name;
          io.to(data.roomId).emit("opponent_surrendered", { winnerId: room.host?.id, message: "\u041E\u043F\u043F\u043E\u043D\u0435\u043D\u0442 \u043F\u043E\u043A\u0438\u043D\u0443\u043B \u043C\u0430\u0442\u0447" });
        } else {
          room.guest = null;
          room.status = "waiting";
          io.to(data.roomId).emit("room_updated", room);
        }
      } else if (room.spectator && room.spectator.id === data.playerId) {
        room.spectator = null;
        if (room.spectators) room.spectators = room.spectators.filter((s) => s.id !== data.playerId);
        io.to(data.roomId).emit("room_updated", room);
      }
      if (!room.host && !room.guest && !room.spectator) {
        rooms.delete(data.roomId);
        io.to(data.roomId).emit("room_closed", { message: "\u041A\u043E\u043C\u043D\u0430\u0442\u0430 \u0437\u0430\u043A\u0440\u044B\u0442\u0430" });
      }
      broadcastRoomsList();
    });
    socket.on("join_matchmaking", (player) => {
      const existingIdx = matchmakingQueue.findIndex((p) => p.player.id === player.id || p.socketId === socket.id);
      if (existingIdx >= 0) {
        matchmakingQueue.splice(existingIdx, 1);
      }
      matchmakingQueue.push({ socketId: socket.id, player, timestamp: Date.now() });
      if (matchmakingQueue.length >= 2) {
        const p1 = matchmakingQueue.shift();
        const p2 = matchmakingQueue.shift();
        const roomId = "match-" + Date.now().toString(36);
        const newRoom = {
          id: roomId,
          name: `\u0411\u044B\u0441\u0442\u0440\u044B\u0439 \u043C\u0430\u0442\u0447: ${p1.player.name} vs ${p2.player.name}`,
          status: "ready",
          host: {
            ...p1.player,
            selectedCharacters: p1.player.selectedCharacters.slice(0, 2),
            isReady: false,
            connected: true
          },
          guest: {
            ...p2.player,
            selectedCharacters: p2.player.selectedCharacters.slice(0, 2),
            isReady: false,
            connected: true
          },
          mapId: "arena_pvp_50x50",
          mapName: "\u0422\u0430\u043A\u0442\u0438\u0447\u0435\u0441\u043A\u0430\u044F PvP \u0410\u0440\u0435\u043D\u0430",
          turnNumber: 1,
          roundNumber: 1,
          createdAt: Date.now()
        };
        rooms.set(roomId, newRoom);
        const s1 = io.sockets.sockets.get(p1.socketId);
        const s2 = io.sockets.sockets.get(p2.socketId);
        if (s1) {
          s1.join(roomId);
          socketMetadata.set(p1.socketId, { userId: p1.player.id, userName: p1.player.name, roomId });
          s1.emit("match_found", newRoom);
        }
        if (s2) {
          s2.join(roomId);
          socketMetadata.set(p2.socketId, { userId: p2.player.id, userName: p2.player.name, roomId });
          s2.emit("match_found", newRoom);
        }
        broadcastRoomsList();
      }
    });
    socket.on("leave_matchmaking", () => {
      const idx = matchmakingQueue.findIndex((p) => p.socketId === socket.id);
      if (idx >= 0) {
        matchmakingQueue.splice(idx, 1);
      }
    });
    socket.on("disconnect", () => {
      const qIdx = matchmakingQueue.findIndex((p) => p.socketId === socket.id);
      if (qIdx >= 0) matchmakingQueue.splice(qIdx, 1);
      const meta = socketMetadata.get(socket.id);
      if (meta && meta.roomId) {
        const room = rooms.get(meta.roomId);
        if (room) {
          if (room.host.id === meta.userId) {
            room.host.connected = false;
          } else if (room.guest && room.guest.id === meta.userId) {
            room.guest.connected = false;
          }
          io.to(meta.roomId).emit("room_updated", room);
        }
      }
      socketMetadata.delete(socket.id);
      broadcastRoomsList();
    });
  });
  return io;
}

// server.ts
var app = (0, import_express.default)();
var PORT = 3e3;
var server = import_http.default.createServer(app);
setupMultiplayerSocket(server);
app.use(import_express.default.json({ limit: "15mb" }));
app.use(import_express.default.urlencoded({ extended: true }));
var DB_DIR = import_path.default.join(process.cwd(), "data");
var DB_FILE = import_path.default.join(DB_DIR, "characters.json");
if (!import_fs.default.existsSync(DB_DIR)) {
  import_fs.default.mkdirSync(DB_DIR, { recursive: true });
}
function loadCharacters() {
  try {
    if (import_fs.default.existsSync(DB_FILE)) {
      const data = import_fs.default.readFileSync(DB_FILE, "utf-8");
      const parsed = JSON.parse(data);
      if (Array.isArray(parsed)) {
        return parsed;
      }
    }
  } catch (err) {
    console.error("Error reading DB:", err);
  }
  return [];
}
function saveCharacters(chars) {
  try {
    import_fs.default.writeFileSync(DB_FILE, JSON.stringify(chars, null, 2), "utf-8");
  } catch (err) {
    console.error("Error saving DB:", err);
  }
}
app.get("/api/characters", (req, res) => {
  const { search, role, element } = req.query;
  let list = loadCharacters();
  if (search) {
    const term = String(search).toLowerCase();
    list = list.filter(
      (c) => c.name?.toLowerCase().includes(term) || c.cardDescription?.toLowerCase().includes(term) || c.tags?.some((t) => t.toLowerCase().includes(term))
    );
  }
  if (role && role !== "all") {
    list = list.filter((c) => c.role === role);
  }
  if (element && element !== "all") {
    list = list.filter((c) => c.element === element);
  }
  res.json({
    success: true,
    data: list,
    total: list.length
  });
});
app.get("/api/characters/:id", (req, res) => {
  const { id } = req.params;
  const list = loadCharacters();
  const char = list.find((c) => String(c.id) === String(id));
  if (!char) {
    return res.status(404).json({ success: false, error: "\u041F\u0435\u0440\u0441\u043E\u043D\u0430\u0436 \u043D\u0435 \u043D\u0430\u0439\u0434\u0435\u043D" });
  }
  res.json({
    success: true,
    data: char
  });
});
app.post("/api/characters", (req, res) => {
  const payload = req.body;
  if (!payload.name || typeof payload.name !== "string" || !payload.name.trim()) {
    return res.status(400).json({ success: false, error: "\u0418\u043C\u044F \u043F\u0435\u0440\u0441\u043E\u043D\u0430\u0436\u0430 \u043E\u0431\u044F\u0437\u0430\u0442\u0435\u043B\u044C\u043D\u043E" });
  }
  const list = loadCharacters();
  const newId = payload.id ? String(payload.id) : String(Date.now());
  const newChar = {
    id: newId,
    name: payload.name.trim(),
    title: payload.title?.trim() || "",
    cardDescription: payload.cardDescription?.trim() || "",
    imageUrl: payload.imageUrl?.trim() || "https://images.unsplash.com/photo-1568602471122-7832951cc4c5?w=400&auto=format&fit=crop&q=80",
    tags: Array.isArray(payload.tags) ? payload.tags : [],
    age: Number(payload.age) || 25,
    height: Number(payload.height) || 175,
    role: payload.role || "\u0412\u043E\u0438\u043D",
    element: payload.element || "\u041E\u0433\u043E\u043D\u044C",
    lore: payload.lore?.trim() || "",
    stats: {
      strength: Number(payload.stats?.strength) || 70,
      agility: Number(payload.stats?.agility) || 70,
      intellect: Number(payload.stats?.intellect) || 70,
      defense: Number(payload.stats?.defense) || 70,
      magic: Number(payload.stats?.magic) || 50,
      regeneration: Number(payload.stats?.regeneration) || 60,
      hp: Number(payload.stats?.hp) || 120,
      maxHp: Number(payload.stats?.maxHp) || Number(payload.stats?.hp) || 120,
      mana: Number(payload.stats?.mana) || 60,
      maxMana: Number(payload.stats?.maxMana) || Number(payload.stats?.mana) || 60,
      level: Number(payload.stats?.level) || 1
    },
    skills: Array.isArray(payload.skills) ? payload.skills : [],
    customStats: Array.isArray(payload.customStats) ? payload.customStats : [],
    connections: Array.isArray(payload.connections) ? payload.connections : [],
    createdAt: Date.now(),
    updatedAt: Date.now()
  };
  list.unshift(newChar);
  saveCharacters(list);
  res.status(201).json({
    success: true,
    data: newChar,
    message: `\u041F\u0435\u0440\u0441\u043E\u043D\u0430\u0436 \xAB${newChar.name}\xBB \u0443\u0441\u043F\u0435\u0448\u043D\u043E \u0441\u043E\u0437\u0434\u0430\u043D!`
  });
});
app.patch("/api/characters/:id", (req, res) => {
  const { id } = req.params;
  const list = loadCharacters();
  const index = list.findIndex((c) => String(c.id) === String(id));
  if (index === -1) {
    return res.status(404).json({ success: false, error: "\u041F\u0435\u0440\u0441\u043E\u043D\u0430\u0436 \u043D\u0435 \u043D\u0430\u0439\u0434\u0435\u043D" });
  }
  const existing = list[index];
  const updates = req.body;
  list[index] = {
    ...existing,
    ...updates,
    stats: {
      ...existing.stats,
      ...updates.stats || {}
    },
    updatedAt: Date.now()
  };
  saveCharacters(list);
  res.json({
    success: true,
    data: list[index],
    message: "\u041F\u0435\u0440\u0441\u043E\u043D\u0430\u0436 \u0443\u0441\u043F\u0435\u0448\u043D\u043E \u043E\u0431\u043D\u043E\u0432\u043B\u0435\u043D"
  });
});
app.delete("/api/characters/:id", (req, res) => {
  const { id } = req.params;
  let list = loadCharacters();
  const exists = list.some((c) => String(c.id) === String(id));
  if (!exists) {
    return res.status(404).json({ success: false, error: "\u041F\u0435\u0440\u0441\u043E\u043D\u0430\u0436 \u043D\u0435 \u043D\u0430\u0439\u0434\u0435\u043D" });
  }
  list = list.filter((c) => String(c.id) !== String(id));
  saveCharacters(list);
  res.json({
    success: true,
    message: `\u041F\u0435\u0440\u0441\u043E\u043D\u0430\u0436 \u0443\u0434\u0430\u043B\u0435\u043D`
  });
});
async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await (0, import_vite.createServer)({
      server: { middlewareMode: true },
      appType: "spa"
    });
    app.use(vite.middlewares);
  } else {
    const distPath = import_path.default.join(process.cwd(), "dist");
    app.use(import_express.default.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(import_path.default.join(distPath, "index.html"));
    });
  }
  server.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on port ${PORT}`);
  });
}
startServer();
//# sourceMappingURL=server.cjs.map
