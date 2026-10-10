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
var import_ws = require("ws");
var app = (0, import_express.default)();
var PORT = 3e3;
app.use(import_express.default.json({ limit: "15mb" }));
app.use(import_express.default.urlencoded({ extended: true }));
var DB_DIR = import_path.default.join(process.cwd(), "data");
var DB_FILE = import_path.default.join(DB_DIR, "characters.json");
var MATCHES_FILE = import_path.default.join(DB_DIR, "pvp_matches.json");
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
function loadMatchHistory() {
  try {
    if (import_fs.default.existsSync(MATCHES_FILE)) {
      const data = import_fs.default.readFileSync(MATCHES_FILE, "utf-8");
      const parsed = JSON.parse(data);
      if (Array.isArray(parsed)) {
        return parsed;
      }
    }
  } catch (err) {
    console.error("Error reading matches DB:", err);
  }
  return [];
}
function saveMatchHistory(matches) {
  try {
    import_fs.default.writeFileSync(MATCHES_FILE, JSON.stringify(matches, null, 2), "utf-8");
  } catch (err) {
    console.error("Error saving matches DB:", err);
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
app.get("/api/pvp/matches", (req, res) => {
  const matches = loadMatchHistory();
  res.json({ success: true, data: matches });
});
var pvpRooms = /* @__PURE__ */ new Map();
function broadcastToRoom(room, message, excludeWs) {
  const raw = JSON.stringify(message);
  for (const p of room.players) {
    if (p.ws && p.ws.readyState === import_ws.WebSocket.OPEN && p.ws !== excludeWs) {
      try {
        p.ws.send(raw);
      } catch (err) {
        console.error("WS send error to player", p.name, err);
      }
    }
  }
}
function broadcastRoomsList(targetWs) {
  const summaries = Array.from(pvpRooms.values()).map((r) => ({
    id: r.id,
    title: r.title,
    mode: r.mode,
    status: r.status,
    playerCount: r.players.length,
    maxPlayers: r.maxPlayers,
    hostName: r.players[0]?.name || "\u0418\u0433\u0440\u043E\u043A",
    hostAvatar: r.players[0]?.avatarUrl || "",
    createdAt: r.createdAt
  }));
  const msg = JSON.stringify({
    type: "ROOMS_LIST",
    payload: { rooms: summaries }
  });
  if (targetWs && targetWs.readyState === import_ws.WebSocket.OPEN) {
    targetWs.send(msg);
  }
}
function serializeRoomForClient(room) {
  return {
    id: room.id,
    title: room.title,
    mode: room.mode,
    status: room.status,
    maxPlayers: room.maxPlayers,
    players: room.players.map((p) => ({
      id: p.id,
      name: p.name,
      avatarUrl: p.avatarUrl,
      title: p.title,
      isHost: p.isHost,
      isReady: p.isReady,
      selectedCharacterIds: p.selectedCharacterIds,
      charactersData: p.charactersData,
      faction: p.faction,
      color: p.color
    })),
    mapId: room.mapId,
    mapData: {
      id: room.mapId,
      name: "\u0411\u043E\u0435\u0432\u0430\u044F \u0410\u0440\u0435\u043D\u0430 \u0420\u0430\u0437\u043B\u043E\u043C\u0430",
      width: room.mapWidth,
      height: room.mapHeight,
      defaultTile: "stone_ruins",
      tiles: room.tiles,
      obstacles: room.obstacles,
      characters: room.characters,
      createdAt: room.createdAt,
      updatedAt: Date.now()
    },
    activeCharacterId: room.activeCharacterId,
    activePlayerId: room.activePlayerId,
    turnNumber: room.turnNumber,
    roundNumber: room.roundNumber,
    turnTimeRemaining: room.turnTimeRemaining,
    turnTimeMax: room.turnTimeMax,
    characters: room.characters,
    winnerPlayerId: room.winnerPlayerId,
    winnerName: room.winnerName,
    createdAt: room.createdAt,
    startedAt: room.startedAt,
    finishedAt: room.finishedAt,
    recentActionLog: room.recentActionLog
  };
}
function createPvpArenaMap(width = 24, height = 24) {
  const tiles = {};
  const obstacles = {};
  for (let x = 0; x < width; x++) {
    for (let y = 0; y < height; y++) {
      if (x === 0 || x === width - 1 || y === 0 || y === height - 1) {
        tiles[`${x},${y}`] = "void";
      } else if (x >= 8 && x <= 15 && y >= 8 && y <= 15 || x === 11 && y === 12 || x === 12 && y === 11) {
        tiles[`${x},${y}`] = "stone_ruins";
      } else if ((x + y) % 2 === 0) {
        tiles[`${x},${y}`] = "cobblestone";
      } else {
        tiles[`${x},${y}`] = "stone_ruins";
      }
    }
  }
  const obstaclePositions = [
    { x: 7, y: 7, type: "torch_pillar" },
    { x: 16, y: 7, type: "torch_pillar" },
    { x: 7, y: 16, type: "torch_pillar" },
    { x: 16, y: 16, type: "torch_pillar" },
    { x: 11, y: 8, type: "rubble" },
    { x: 12, y: 15, type: "rubble" },
    { x: 8, y: 12, type: "barrel" },
    { x: 15, y: 11, type: "barrel" },
    { x: 11, y: 11, type: "chest" },
    { x: 12, y: 12, type: "chest" }
  ];
  for (const obs of obstaclePositions) {
    obstacles[`${obs.x},${obs.y}`] = obs.type;
  }
  return { tiles, obstacles, width, height };
}
function getPvpSpawnCoordinates(playerIndex, slotIndex, mode, mapWidth = 24, mapHeight = 24) {
  if (playerIndex === 0) {
    if (mode === "1vs1") {
      return { x: 5, y: 5, facing: "right" };
    }
    const spawns = [
      { x: 4, y: 5, facing: "right" },
      { x: 5, y: 4, facing: "right" },
      { x: 6, y: 6, facing: "right" }
    ];
    return spawns[slotIndex] || spawns[0];
  } else {
    if (mode === "1vs1") {
      return { x: mapWidth - 6, y: mapHeight - 6, facing: "left" };
    }
    const spawns = [
      { x: mapWidth - 5, y: mapHeight - 6, facing: "left" },
      { x: mapWidth - 6, y: mapHeight - 5, facing: "left" },
      { x: mapWidth - 7, y: mapHeight - 7, facing: "left" }
    ];
    return spawns[slotIndex] || spawns[0];
  }
}
function startTurnTimer(room) {
  if (room.turnTimer) {
    clearInterval(room.turnTimer);
    room.turnTimer = void 0;
  }
  room.turnTimeRemaining = 0;
}
function startMatchInRoom(room) {
  room.status = "in_battle";
  room.startedAt = Date.now();
  room.turnNumber = 1;
  room.roundNumber = 1;
  const hasCustomMap = room.mapData && room.mapData.tiles && Object.keys(room.mapData.tiles).length > 0;
  const arena = hasCustomMap ? room.mapData : createPvpArenaMap(24, 24);
  room.mapWidth = arena.width || 24;
  room.mapHeight = arena.height || 24;
  room.tiles = arena.tiles || {};
  room.obstacles = arena.obstacles || {};
  room.mapData = arena;
  room.characters = [];
  room.players.forEach((player, pIdx) => {
    const charsData = player.charactersData && player.charactersData.length > 0 ? player.charactersData : player.selectedCharacterIds.map((id) => ({ id, name: `\u0413\u0435\u0440\u043E\u0439 ${id}` }));
    charsData.forEach((charTemplate, slotIdx) => {
      let spawnX = 0;
      let spawnY = 0;
      let spawnFacing = pIdx === 0 ? "right" : "left";
      const customTeamSpawns = room.mapData?.teamSpawns;
      const teamKey = pIdx === 0 ? "team1" : "team2";
      const teamList = customTeamSpawns?.[teamKey];
      const customSpawn = teamList && Array.isArray(teamList) ? teamList.find((s) => s.slotIndex === slotIdx) || teamList[slotIdx] : null;
      if (customSpawn && typeof customSpawn.x === "number" && typeof customSpawn.y === "number") {
        spawnX = customSpawn.x;
        spawnY = customSpawn.y;
        spawnFacing = customSpawn.facing || (pIdx === 0 ? "right" : "left");
      } else {
        const fallback = getPvpSpawnCoordinates(pIdx, slotIdx, room.mode, arena.width || 24, arena.height || 24);
        spawnX = fallback.x;
        spawnY = fallback.y;
        spawnFacing = fallback.facing;
      }
      const stats = charTemplate.stats || {};
      const maxHp = Number(stats.hp || stats.maxHp || 120);
      const maxMana = Number(stats.mana || stats.maxMana || 60);
      const speed = Math.max(1, Number(stats.speed || 5));
      const ap = Math.max(1, Number(stats.ap || 3));
      const placedChar = {
        id: `pvp_char_${player.id}_${charTemplate.id || slotIdx}_${Date.now()}`,
        characterId: charTemplate.id,
        name: charTemplate.name || `\u0411\u043E\u0435\u0446 ${player.name}`,
        avatarUrl: charTemplate.imageUrl || charTemplate.avatarUrl || "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=200",
        spriteUrl: charTemplate.spriteUrl || "",
        characterFolder: charTemplate.characterFolder || charTemplate.gitFolderName || "",
        stars: charTemplate.stars || 3,
        rarity: charTemplate.rarity || "\u0420\u0435\u0434\u043A\u0438\u0439",
        role: charTemplate.role || "\u0412\u043E\u0438\u043D",
        faction: pIdx === 0 ? "player" : "enemy",
        ownerId: player.id,
        ownerName: player.name,
        playerColor: player.color,
        x: spawnX,
        y: spawnY,
        facing: spawnFacing,
        currentHp: maxHp,
        maxHp,
        currentMana: maxMana,
        maxMana,
        currentAp: ap,
        maxAp: ap,
        currentMpPoints: speed,
        maxMpPoints: speed,
        speed,
        stats: {
          ...stats,
          baseAttack: Number(stats.baseAttack || 75),
          armor: Number(stats.armor || stats.defense || 50),
          magicArmor: Number(stats.magicArmor || 40),
          critChance: Number(stats.critChance || 5),
          evasion: Number(stats.evasion || 5),
          accuracy: Number(stats.accuracy || 95),
          agility: Number(stats.agility || 50),
          strength: Number(stats.strength || 50),
          intellect: Number(stats.intellect || 50),
          speed,
          ap
        },
        skills: Array.isArray(charTemplate.skills) && charTemplate.skills.length > 0 ? charTemplate.skills : [
          {
            id: "pvp_strike",
            name: "\u041C\u043E\u0449\u043D\u044B\u0439 \u0443\u0434\u0430\u0440",
            type: "active",
            cost: "1 \u041E\u0414",
            description: "\u041D\u0430\u043D\u043E\u0441\u0438\u0442 120% \u0444\u0438\u0437\u0438\u0447\u0435\u0441\u043A\u043E\u0433\u043E \u0443\u0440\u043E\u043D\u0430 \u0432\u0440\u0430\u0433\u0443.",
            formula: "ATK * 1.2",
            targetType: "single_enemy",
            range: 1
          }
        ]
      };
      room.characters.push(placedChar);
    });
  });
  room.characters.sort((a, b) => {
    const initA = Number(a.stats?.initiative ?? a.initiative ?? 0);
    const initB = Number(b.stats?.initiative ?? b.initiative ?? 0);
    if (initB !== initA) return initB - initA;
    const agiA = Number(a.stats?.agility || a.speed || 0);
    const agiB = Number(b.stats?.agility || b.speed || 0);
    if (agiB !== agiA) return agiB - agiA;
    return (a.name || "").localeCompare(b.name || "");
  });
  room.turnOrderQueue = room.characters.map((c) => c.id);
  room.turnIndex = 0;
  room.activeCharacterId = room.turnOrderQueue[0];
  const firstActiveChar = room.characters.find((c) => c.id === room.activeCharacterId);
  room.activePlayerId = firstActiveChar?.ownerId || room.players[0].id;
  room.recentActionLog.push({
    id: `log_${Date.now()}`,
    text: `\u2694\uFE0F \u0411\u0438\u0442\u0432\u0430 \u043D\u0430\u0447\u0430\u043B\u0430\u0441\u044C! \u041F\u0435\u0440\u0432\u044B\u0439 \u0445\u043E\u0434: ${firstActiveChar?.name} (${firstActiveChar?.ownerName})`,
    timestamp: Date.now(),
    color: "#38bdf8"
  });
  startTurnTimer(room);
  broadcastToRoom(room, {
    type: "MATCH_STARTED",
    payload: { room: serializeRoomForClient(room) }
  });
}
function handleServerEndTurn(room, characterId) {
  if (room.status !== "in_battle") return;
  const livingChars = room.characters.filter((c) => c.currentHp > 0);
  if (livingChars.length === 0) return;
  const currentActive = room.characters.find((c) => c.id === room.activeCharacterId);
  if (currentActive) {
    currentActive.currentAp = currentActive.maxAp || 3;
    currentActive.currentMpPoints = currentActive.maxMpPoints || currentActive.speed || 5;
  }
  let nextIdx = (room.turnIndex + 1) % room.turnOrderQueue.length;
  let attempts = 0;
  while (attempts < room.turnOrderQueue.length) {
    const nextCharId = room.turnOrderQueue[nextIdx];
    const nextChar = room.characters.find((c) => c.id === nextCharId && c.currentHp > 0);
    if (nextChar) {
      room.turnIndex = nextIdx;
      room.activeCharacterId = nextChar.id;
      room.activePlayerId = nextChar.ownerId;
      nextChar.currentAp = nextChar.maxAp || 3;
      nextChar.currentMpPoints = nextChar.maxMpPoints || nextChar.speed || 5;
      break;
    }
    nextIdx = (nextIdx + 1) % room.turnOrderQueue.length;
    attempts++;
  }
  if (room.turnIndex === 0) {
    room.roundNumber += 1;
  }
  room.turnNumber += 1;
  startTurnTimer(room);
  const activeChar = room.characters.find((c) => c.id === room.activeCharacterId);
  room.recentActionLog.push({
    id: `log_${Date.now()}`,
    text: `\u23F3 \u0425\u043E\u0434 \u043F\u0435\u0440\u0435\u0445\u043E\u0434\u0438\u0442 \u043A: ${activeChar?.name} (${activeChar?.ownerName})`,
    timestamp: Date.now(),
    color: "#a855f7"
  });
  broadcastToRoom(room, {
    type: "ROOM_UPDATED",
    payload: { room: serializeRoomForClient(room) }
  });
}
function checkMatchWinner(room) {
  if (room.status !== "in_battle") return false;
  const p1 = room.players[0];
  const p2 = room.players[1];
  if (!p1 || !p2) return false;
  const p1Living = room.characters.filter((c) => c.ownerId === p1.id && c.currentHp > 0);
  const p2Living = room.characters.filter((c) => c.ownerId === p2.id && c.currentHp > 0);
  if (p1Living.length === 0 || p2Living.length === 0) {
    room.status = "finished";
    room.finishedAt = Date.now();
    if (room.turnTimer) {
      clearInterval(room.turnTimer);
      room.turnTimer = void 0;
    }
    const winner = p1Living.length > 0 ? p1 : p2;
    room.winnerPlayerId = winner.id;
    room.winnerName = winner.name;
    const rewards = {
      currency: 200,
      spins: 2,
      ratingDelta: 25
    };
    room.recentActionLog.push({
      id: `log_${Date.now()}`,
      text: `\u{1F3C6} \u041F\u043E\u0431\u0435\u0434\u0438\u0442\u0435\u043B\u044C \u043C\u0430\u0442\u0447\u0430: ${winner.name}! \u041D\u0430\u0433\u0440\u0430\u0434\u0430: +200 \u0412\u0430\u043B\u044E\u0442\u044B, +2 \u041A\u0440\u0443\u0442\u043A\u0438!`,
      timestamp: Date.now(),
      color: "#fbbf24"
    });
    const matchRecord = {
      id: `match_${Date.now()}_${room.id}`,
      roomId: room.id,
      title: room.title,
      mode: room.mode,
      winnerId: winner.id,
      winnerName: winner.name,
      players: room.players.map((p) => ({
        id: p.id,
        name: p.name,
        avatarUrl: p.avatarUrl,
        isWinner: p.id === winner.id
      })),
      totalTurns: room.turnNumber,
      totalRounds: room.roundNumber,
      durationMs: (room.finishedAt || Date.now()) - (room.startedAt || room.createdAt),
      createdAt: Date.now()
    };
    const history = loadMatchHistory();
    history.unshift(matchRecord);
    if (history.length > 50) history.pop();
    saveMatchHistory(history);
    broadcastToRoom(room, {
      type: "MATCH_FINISHED",
      payload: {
        room: serializeRoomForClient(room),
        winnerId: winner.id,
        winnerName: winner.name,
        rewards
      }
    });
    return true;
  }
  return false;
}
async function startServer() {
  const server = import_http.default.createServer(app);
  const wss = new import_ws.WebSocketServer({ server });
  wss.on("connection", (ws) => {
    ws.isAlive = true;
    ws.on("pong", () => {
      ws.isAlive = true;
    });
    ws.on("message", (data) => {
      try {
        const msg = JSON.parse(data.toString());
        const { type, payload } = msg;
        if (payload?.user?.id) {
          ws.userId = payload.user.id;
          ws.userName = payload.user.name || ws.userName;
          ws.userAvatar = payload.user.avatarUrl || ws.userAvatar;
        } else if (payload?.userId) {
          ws.userId = payload.userId;
        }
        if (type === "PING") {
          ws.send(JSON.stringify({ type: "PONG" }));
          return;
        }
        if (type === "IDENTIFY") {
          ws.userId = payload.userId;
          ws.userName = payload.userName;
          ws.userAvatar = payload.userAvatar;
          return;
        }
        if (type === "GET_ROOMS") {
          broadcastRoomsList(ws);
          return;
        }
        if (type === "CREATE_ROOM") {
          const { title, mode, characterIds = [], charactersData = [], customMap } = payload;
          const pId = payload.user?.id || ws.userId || `user_${Date.now()}`;
          const pName = payload.user?.name || ws.userName || "\u0418\u0433\u0440\u043E\u043A 1";
          const pAvatar = payload.user?.avatarUrl || ws.userAvatar || "";
          ws.userId = pId;
          ws.userName = pName;
          ws.userAvatar = pAvatar;
          const roomId = `room_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
          const hasCustom = customMap && customMap.tiles && Object.keys(customMap.tiles).length > 0;
          const newRoom = {
            id: roomId,
            title: title?.trim() || `\u0414\u0443\u044D\u043B\u044C \u0420\u0430\u0437\u043B\u043E\u043C\u0430 #${Math.floor(Math.random() * 900 + 100)}`,
            mode: mode === "3vs3" ? "3vs3" : "1vs1",
            status: "waiting",
            maxPlayers: 2,
            players: [
              {
                id: pId,
                name: pName,
                avatarUrl: pAvatar,
                isHost: true,
                isReady: false,
                selectedCharacterIds: characterIds,
                charactersData,
                faction: "player",
                color: "#38bdf8",
                ws
              }
            ],
            mapId: customMap?.id || "pvp_arena_default",
            mapWidth: customMap?.width || 24,
            mapHeight: customMap?.height || 24,
            tiles: customMap?.tiles || {},
            obstacles: customMap?.obstacles || {},
            mapData: hasCustom ? customMap : void 0,
            characters: [],
            turnOrderQueue: [],
            turnIndex: 0,
            turnNumber: 0,
            roundNumber: 0,
            turnTimeRemaining: 0,
            turnTimeMax: 0,
            createdAt: Date.now(),
            recentActionLog: [
              {
                id: `log_${Date.now()}`,
                text: `\u041A\u043E\u043C\u043D\u0430\u0442\u0430 \xAB${title || "\u0414\u0443\u044D\u043B\u044C"}\xBB \u0441\u043E\u0437\u0434\u0430\u043D\u0430. \u041E\u0436\u0438\u0434\u0430\u043D\u0438\u0435 \u0441\u043E\u043F\u0435\u0440\u043D\u0438\u043A\u0430...`,
                timestamp: Date.now(),
                color: "#94a3b8"
              }
            ]
          };
          pvpRooms.set(roomId, newRoom);
          ws.roomId = roomId;
          ws.send(
            JSON.stringify({
              type: "ROOM_JOINED",
              payload: { room: serializeRoomForClient(newRoom), playerId: ws.userId }
            })
          );
          wss.clients.forEach((client) => {
            if (client.readyState === import_ws.WebSocket.OPEN) {
              broadcastRoomsList(client);
            }
          });
          return;
        }
        if (type === "ADMIN_CLOSE_ROOM" || type === "FORCE_CLOSE_ROOM") {
          const { roomId } = payload;
          const room = pvpRooms.get(roomId);
          if (room) {
            if (room.turnTimer) {
              clearInterval(room.turnTimer);
              room.turnTimer = void 0;
            }
            broadcastToRoom(room, {
              type: "ROOM_CLOSED",
              payload: { roomId, reason: "\u041A\u043E\u043C\u043D\u0430\u0442\u0430 \u0431\u044B\u043B\u0430 \u043F\u0440\u0438\u043D\u0443\u0434\u0438\u0442\u0435\u043B\u044C\u043D\u043E \u0437\u0430\u043A\u0440\u044B\u0442\u0430 \u0430\u0434\u043C\u0438\u043D\u0438\u0441\u0442\u0440\u0430\u0442\u043E\u0440\u043E\u043C" }
            });
            pvpRooms.delete(roomId);
            wss.clients.forEach((client) => {
              if (client.readyState === import_ws.WebSocket.OPEN) {
                broadcastRoomsList(client);
              }
            });
          }
          return;
        }
        if (type === "JOIN_ROOM") {
          const { roomId, characterIds = [], charactersData = [] } = payload;
          const pId = payload.user?.id || ws.userId || `user_${Date.now()}`;
          const pName = payload.user?.name || ws.userName || "\u0418\u0433\u0440\u043E\u043A 2";
          const pAvatar = payload.user?.avatarUrl || ws.userAvatar || "";
          ws.userId = pId;
          ws.userName = pName;
          ws.userAvatar = pAvatar;
          const room = pvpRooms.get(roomId);
          if (!room) {
            ws.send(JSON.stringify({ type: "ERROR", payload: { message: "\u041A\u043E\u043C\u043D\u0430\u0442\u0430 \u043D\u0435 \u043D\u0430\u0439\u0434\u0435\u043D\u0430" } }));
            return;
          }
          if (room.players.length >= room.maxPlayers && !room.players.some((p) => p.id === pId || p.ws === ws)) {
            ws.send(JSON.stringify({ type: "ERROR", payload: { message: "\u041A\u043E\u043C\u043D\u0430\u0442\u0430 \u0443\u0436\u0435 \u0437\u0430\u043F\u043E\u043B\u043D\u0435\u043D\u0430" } }));
            return;
          }
          const existingPlayer = room.players.find((p) => p.id === pId || p.ws === ws);
          if (existingPlayer) {
            existingPlayer.id = pId;
            existingPlayer.name = pName;
            existingPlayer.avatarUrl = pAvatar;
            existingPlayer.ws = ws;
            existingPlayer.selectedCharacterIds = characterIds.length > 0 ? characterIds : existingPlayer.selectedCharacterIds;
            existingPlayer.charactersData = charactersData.length > 0 ? charactersData : existingPlayer.charactersData;
          } else {
            room.players.push({
              id: pId,
              name: pName,
              avatarUrl: pAvatar,
              isHost: false,
              isReady: false,
              selectedCharacterIds: characterIds,
              charactersData,
              faction: "enemy",
              color: "#f43f5e",
              ws
            });
          }
          ws.roomId = roomId;
          room.recentActionLog.push({
            id: `log_${Date.now()}`,
            text: `\u0418\u0433\u0440\u043E\u043A ${pName} \u043F\u0440\u0438\u0441\u043E\u0435\u0434\u0438\u043D\u0438\u043B\u0441\u044F \u043A \u043A\u043E\u043C\u043D\u0430\u0442\u0435.`,
            timestamp: Date.now(),
            color: "#34d399"
          });
          broadcastToRoom(room, {
            type: "ROOM_UPDATED",
            payload: { room: serializeRoomForClient(room) }
          });
          ws.send(
            JSON.stringify({
              type: "ROOM_JOINED",
              payload: { room: serializeRoomForClient(room), playerId: ws.userId }
            })
          );
          return;
        }
        if (type === "SELECT_CHARACTERS") {
          const { roomId, characterIds, charactersData } = payload;
          const pId = payload.userId || ws.userId;
          const room = pvpRooms.get(roomId);
          if (!room) return;
          const player = room.players.find((p) => p.id === pId || p.ws === ws);
          if (player) {
            const limitCount = room.mode === "1vs1" ? 1 : 3;
            player.selectedCharacterIds = Array.isArray(characterIds) ? characterIds.slice(0, limitCount) : [];
            player.charactersData = Array.isArray(charactersData) ? charactersData.slice(0, limitCount) : [];
            broadcastToRoom(room, {
              type: "ROOM_UPDATED",
              payload: { room: serializeRoomForClient(room) }
            });
          }
          return;
        }
        if (type === "SET_READY") {
          const { roomId, isReady } = payload;
          const pId = payload.userId || ws.userId;
          const room = pvpRooms.get(roomId);
          if (!room) return;
          const player = room.players.find((p) => p.id === pId || p.ws === ws);
          if (player) {
            player.isReady = Boolean(isReady);
            broadcastToRoom(room, {
              type: "ROOM_UPDATED",
              payload: { room: serializeRoomForClient(room) }
            });
            if (room.players.length === room.maxPlayers && room.players.every((p) => p.isReady && p.selectedCharacterIds.length > 0)) {
              startMatchInRoom(room);
            }
          }
          return;
        }
        if (type === "START_MATCH") {
          const { roomId } = payload;
          const pId = payload.userId || ws.userId;
          const room = pvpRooms.get(roomId);
          if (!room) return;
          const player = room.players.find((p) => p.id === pId || p.ws === ws);
          if (player && player.isHost && room.players.length === room.maxPlayers) {
            startMatchInRoom(room);
          }
          return;
        }
        if (type === "ACTION_MOVE") {
          const { roomId, characterId, targetX, targetY, path: movePath } = payload;
          const room = pvpRooms.get(roomId);
          if (!room || room.status !== "in_battle") return;
          const char = room.characters.find((c) => c.id === characterId);
          if (!char) return;
          if (char.ownerId !== ws.userId) {
            ws.send(JSON.stringify({ type: "ERROR", payload: { message: "\u0412\u044B \u043D\u0435 \u043C\u043E\u0436\u0435\u0442\u0435 \u0443\u043F\u0440\u0430\u0432\u043B\u044F\u0442\u044C \u0447\u0443\u0436\u0438\u043C \u043F\u0435\u0440\u0441\u043E\u043D\u0430\u0436\u0435\u043C!" } }));
            return;
          }
          if (room.activeCharacterId !== char.id) {
            ws.send(JSON.stringify({ type: "ERROR", payload: { message: "\u0421\u0435\u0439\u0447\u0430\u0441 \u043D\u0435 \u0445\u043E\u0434 \u044D\u0442\u043E\u0433\u043E \u043F\u0435\u0440\u0441\u043E\u043D\u0430\u0436\u0430!" } }));
            return;
          }
          const stepsCount = Array.isArray(movePath) ? movePath.length - 1 : Math.abs(targetX - char.x) + Math.abs(targetY - char.y);
          const currentMp = char.currentMpPoints ?? char.speed ?? 5;
          if (stepsCount > currentMp || stepsCount <= 0) {
            ws.send(JSON.stringify({ type: "ERROR", payload: { message: "\u041D\u0435\u0434\u043E\u0441\u0442\u0430\u0442\u043E\u0447\u043D\u043E \u043E\u0447\u043A\u043E\u0432 \u043F\u0435\u0440\u0435\u0434\u0432\u0438\u0436\u0435\u043D\u0438\u044F!" } }));
            return;
          }
          const oldX = char.x;
          const oldY = char.y;
          char.x = targetX;
          char.y = targetY;
          char.facing = targetX > oldX ? "right" : targetX < oldX ? "left" : char.facing;
          char.currentMpPoints = Math.max(0, currentMp - stepsCount);
          broadcastToRoom(room, {
            type: "ANIMATION_EVENT",
            payload: {
              id: `anim_${Date.now()}_${Math.random()}`,
              type: "move",
              sourceCharacterId: char.id,
              targetPos: { x: targetX, y: targetY },
              path: movePath,
              timestamp: Date.now()
            }
          });
          room.recentActionLog.push({
            id: `log_${Date.now()}`,
            text: `\u{1F3C3} ${char.name} \u043F\u0435\u0440\u0435\u043C\u0435\u0441\u0442\u0438\u043B\u0441\u044F \u043D\u0430 \u043A\u043B\u0435\u0442\u043A\u0443 (${targetX}, ${targetY}) [-${stepsCount} \u041E\u041F]`,
            timestamp: Date.now(),
            color: "#60a5fa"
          });
          broadcastToRoom(room, {
            type: "ROOM_UPDATED",
            payload: { room: serializeRoomForClient(room) }
          });
          return;
        }
        if (type === "ACTION_ATTACK") {
          const { roomId, characterId, targetCharacterId } = payload;
          const room = pvpRooms.get(roomId);
          if (!room || room.status !== "in_battle") return;
          const actor = room.characters.find((c) => c.id === characterId);
          const target = room.characters.find((c) => c.id === targetCharacterId);
          if (!actor || !target) return;
          if (actor.ownerId !== ws.userId) {
            ws.send(JSON.stringify({ type: "ERROR", payload: { message: "\u0412\u044B \u043C\u043E\u0436\u0435\u0442\u0435 \u043E\u0442\u0434\u0430\u0432\u0430\u0442\u044C \u043F\u0440\u0438\u043A\u0430\u0437\u044B \u0442\u043E\u043B\u044C\u043A\u043E \u0441\u0432\u043E\u0438\u043C \u0431\u043E\u0439\u0446\u0430\u043C!" } }));
            return;
          }
          if (room.activeCharacterId !== actor.id) {
            ws.send(JSON.stringify({ type: "ERROR", payload: { message: "\u0421\u0435\u0439\u0447\u0430\u0441 \u043D\u0435 \u0445\u043E\u0434 \u0432\u0430\u0448\u0435\u0433\u043E \u043F\u0435\u0440\u0441\u043E\u043D\u0430\u0436\u0430!" } }));
            return;
          }
          const currentAp = actor.currentAp ?? actor.maxAp ?? 3;
          if (currentAp < 1) {
            ws.send(JSON.stringify({ type: "ERROR", payload: { message: "\u041D\u0435\u0434\u043E\u0441\u0442\u0430\u0442\u043E\u0447\u043D\u043E \u043E\u0447\u043A\u043E\u0432 \u0434\u0435\u0439\u0441\u0442\u0432\u0438\u044F (\u041E\u0414)!" } }));
            return;
          }
          const dist = Math.abs(actor.x - target.x) + Math.abs(actor.y - target.y);
          if (dist > 1) {
            ws.send(JSON.stringify({ type: "ERROR", payload: { message: "\u0426\u0435\u043B\u044C \u0432\u043D\u0435 \u0440\u0430\u0434\u0438\u0443\u0441\u0430 \u0431\u043B\u0438\u0436\u043D\u0435\u0439 \u0430\u0442\u0430\u043A\u0438!" } }));
            return;
          }
          actor.currentAp = Math.max(0, currentAp - 1);
          const baseAtk = Number(actor.stats?.baseAttack || 75);
          const targetArmor = Number(target.stats?.armor || target.stats?.defense || 40);
          const critChance = Number(actor.stats?.critChance || 5);
          const isCrit = Math.random() * 100 < critChance;
          const multiplier = isCrit ? 1.5 : 1;
          const mitigation = 100 / (100 + targetArmor);
          const rawDamage = Math.round(baseAtk * multiplier * mitigation);
          const damage = Math.max(5, rawDamage);
          target.currentHp = Math.max(0, target.currentHp - damage);
          broadcastToRoom(room, {
            type: "ANIMATION_EVENT",
            payload: {
              id: `anim_${Date.now()}_${Math.random()}`,
              type: "attack",
              sourceCharacterId: actor.id,
              targetCharacterId: target.id,
              damage,
              isCrit,
              timestamp: Date.now()
            }
          });
          room.recentActionLog.push({
            id: `log_${Date.now()}`,
            text: `\u2694\uFE0F ${actor.name} \u043D\u0430\u043D\u0435\u0441 ${isCrit ? "\u041A\u0420\u0418\u0422\u0418\u0427\u0415\u0421\u041A\u0418\u0419 " : ""}${damage} \u0443\u0440\u043E\u043D\u0430 \u043F\u043E ${target.name}!`,
            timestamp: Date.now(),
            color: isCrit ? "#f59e0b" : "#ef4444"
          });
          if (target.currentHp <= 0) {
            room.recentActionLog.push({
              id: `log_${Date.now()}`,
              text: `\u{1F480} ${target.name} \u043F\u0430\u043B \u0432 \u0431\u043E\u044E!`,
              timestamp: Date.now(),
              color: "#dc2626"
            });
          }
          broadcastToRoom(room, {
            type: "ROOM_UPDATED",
            payload: { room: serializeRoomForClient(room) }
          });
          checkMatchWinner(room);
          return;
        }
        if (type === "ACTION_SKILL") {
          const { roomId, characterId, skillId, targetCharacterId, targetX, targetY } = payload;
          const room = pvpRooms.get(roomId);
          if (!room || room.status !== "in_battle") return;
          const actor = room.characters.find((c) => c.id === characterId);
          if (!actor) return;
          if (actor.ownerId !== ws.userId) {
            ws.send(JSON.stringify({ type: "ERROR", payload: { message: "\u0412\u044B \u043D\u0435 \u0443\u043F\u0440\u0430\u0432\u043B\u044F\u0435\u0442\u0435 \u044D\u0442\u0438\u043C \u043F\u0435\u0440\u0441\u043E\u043D\u0430\u0436\u0435\u043C!" } }));
            return;
          }
          if (room.activeCharacterId !== actor.id) {
            ws.send(JSON.stringify({ type: "ERROR", payload: { message: "\u0421\u0435\u0439\u0447\u0430\u0441 \u043D\u0435 \u0432\u0430\u0448 \u0445\u043E\u0434!" } }));
            return;
          }
          const skill = (actor.skills || []).find((s) => s.id === skillId) || actor.skills?.[0];
          if (!skill) return;
          const apCost = 1;
          const manaCost = Number(skill.manaCost || 10);
          const currentAp = actor.currentAp ?? 3;
          const currentMana = actor.currentMana ?? 60;
          if (currentAp < apCost) {
            ws.send(JSON.stringify({ type: "ERROR", payload: { message: "\u041D\u0435\u0434\u043E\u0441\u0442\u0430\u0442\u043E\u0447\u043D\u043E \u041E\u0414 \u0434\u043B\u044F \u043F\u0440\u0438\u043C\u0435\u043D\u0435\u043D\u0438\u044F \u043D\u0430\u0432\u044B\u043A\u0430!" } }));
            return;
          }
          if (currentMana < manaCost) {
            ws.send(JSON.stringify({ type: "ERROR", payload: { message: "\u041D\u0435\u0434\u043E\u0441\u0442\u0430\u0442\u043E\u0447\u043D\u043E \u043C\u0430\u043D\u044B!" } }));
            return;
          }
          actor.currentAp = Math.max(0, currentAp - apCost);
          actor.currentMana = Math.max(0, currentMana - manaCost);
          const target = targetCharacterId ? room.characters.find((c) => c.id === targetCharacterId) : typeof targetX === "number" && typeof targetY === "number" ? room.characters.find((c) => c.x === targetX && c.y === targetY && c.currentHp > 0 && c.id !== actor.id) : null;
          let damage = 0;
          let heal = 0;
          if (skill.type === "heal" || skill.name?.toLowerCase().includes("\u0438\u0441\u0446\u0435\u043B\u0435\u043D\u0438\u0435") || skill.name?.toLowerCase().includes("\u043B\u0435\u0447\u0435\u043D\u0438\u0435")) {
            const intVal = Number(actor.stats?.intellect || actor.stats?.magic || 50);
            heal = Math.round(intVal * 1.5 + 30);
            if (target) {
              target.currentHp = Math.min(target.maxHp, target.currentHp + heal);
            } else {
              actor.currentHp = Math.min(actor.maxHp, actor.currentHp + heal);
            }
            broadcastToRoom(room, {
              type: "ANIMATION_EVENT",
              payload: {
                id: `anim_${Date.now()}_${Math.random()}`,
                type: "heal",
                sourceCharacterId: actor.id,
                targetCharacterId: target?.id || actor.id,
                heal,
                skillName: skill.name,
                skillEffectColor: "#10b981",
                timestamp: Date.now()
              }
            });
            room.recentActionLog.push({
              id: `log_${Date.now()}`,
              text: `\u2728 ${actor.name} \u0438\u0441\u043F\u043E\u043B\u044C\u0437\u043E\u0432\u0430\u043B \xAB${skill.name}\xBB \u0438 \u0432\u043E\u0441\u0441\u0442\u0430\u043D\u043E\u0432\u0438\u043B ${heal} HP!`,
              timestamp: Date.now(),
              color: "#10b981"
            });
          } else {
            const baseAtk = Number(actor.stats?.baseAttack || actor.stats?.magic || 75);
            const targetArmor = Number(target?.stats?.magicArmor || target?.stats?.armor || 30);
            const rawDmg = Math.round(baseAtk * 1.4 * (100 / (100 + targetArmor)));
            damage = Math.max(10, rawDmg);
            if (target) {
              target.currentHp = Math.max(0, target.currentHp - damage);
            }
            broadcastToRoom(room, {
              type: "ANIMATION_EVENT",
              payload: {
                id: `anim_${Date.now()}_${Math.random()}`,
                type: "skill_impact",
                sourceCharacterId: actor.id,
                targetCharacterId: target?.id,
                targetPos: target ? { x: target.x, y: target.y } : targetX !== void 0 ? { x: targetX, y: targetY || 0 } : void 0,
                damage,
                skillName: skill.name,
                skillEffectColor: "#f97316",
                timestamp: Date.now()
              }
            });
            room.recentActionLog.push({
              id: `log_${Date.now()}`,
              text: `\u{1F525} ${actor.name} \u043E\u0431\u0440\u0443\u0448\u0438\u043B \xAB${skill.name}\xBB \u043D\u0430 ${target?.name || "\u043E\u0431\u043B\u0430\u0441\u0442\u044C"} [${damage} \u0443\u0440\u043E\u043D\u0430]!`,
              timestamp: Date.now(),
              color: "#f97316"
            });
          }
          broadcastToRoom(room, {
            type: "ROOM_UPDATED",
            payload: { room: serializeRoomForClient(room) }
          });
          checkMatchWinner(room);
          return;
        }
        if (type === "ACTION_DEFEND") {
          const { roomId, characterId } = payload;
          const room = pvpRooms.get(roomId);
          if (!room || room.status !== "in_battle") return;
          const actor = room.characters.find((c) => c.id === characterId);
          if (!actor || actor.ownerId !== ws.userId) return;
          actor.currentAp = 0;
          actor.isDefending = true;
          broadcastToRoom(room, {
            type: "ANIMATION_EVENT",
            payload: {
              id: `anim_${Date.now()}_${Math.random()}`,
              type: "defend",
              sourceCharacterId: actor.id,
              timestamp: Date.now()
            }
          });
          room.recentActionLog.push({
            id: `log_${Date.now()}`,
            text: `\u{1F6E1}\uFE0F ${actor.name} \u0432\u0441\u0442\u0430\u043B \u0432 \u0433\u043B\u0443\u0445\u0443\u044E \u043E\u0431\u043E\u0440\u043E\u043D\u0443 (+50% \u0437\u0430\u0449\u0438\u0442\u044B).`,
            timestamp: Date.now(),
            color: "#38bdf8"
          });
          handleServerEndTurn(room, characterId);
          return;
        }
        if (type === "ACTION_END_TURN") {
          const { roomId, characterId } = payload;
          const room = pvpRooms.get(roomId);
          if (!room || room.status !== "in_battle") return;
          const actor = room.characters.find((c) => c.id === characterId);
          if (actor && actor.ownerId === ws.userId) {
            handleServerEndTurn(room, characterId);
          }
          return;
        }
        if (type === "SEND_CHAT") {
          const { roomId, text } = payload;
          const room = pvpRooms.get(roomId);
          if (!room || !text || !text.trim()) return;
          const chatMsg = {
            id: `chat_${Date.now()}_${Math.random()}`,
            senderId: ws.userId || "anon",
            senderName: ws.userName || "\u0411\u043E\u0435\u0446",
            senderAvatar: ws.userAvatar || "",
            text: text.trim(),
            timestamp: Date.now()
          };
          broadcastToRoom(room, {
            type: "CHAT_BROADCAST",
            payload: chatMsg
          });
          return;
        }
        if (type === "SURRENDER") {
          const { roomId } = payload;
          const room = pvpRooms.get(roomId);
          if (!room || room.status !== "in_battle") return;
          const otherPlayer = room.players.find((p) => p.id !== ws.userId);
          if (otherPlayer) {
            room.status = "finished";
            room.finishedAt = Date.now();
            room.winnerPlayerId = otherPlayer.id;
            room.winnerName = otherPlayer.name;
            if (room.turnTimer) {
              clearInterval(room.turnTimer);
              room.turnTimer = void 0;
            }
            broadcastToRoom(room, {
              type: "MATCH_FINISHED",
              payload: {
                room: serializeRoomForClient(room),
                winnerId: otherPlayer.id,
                winnerName: otherPlayer.name,
                rewards: { currency: 150, spins: 1, ratingDelta: 20 }
              }
            });
          }
          return;
        }
        if (type === "LEAVE_ROOM") {
          const { roomId } = payload;
          const pId = payload.userId || ws.userId;
          const room = pvpRooms.get(roomId);
          if (room) {
            room.players = room.players.filter((p) => p.id !== pId && p.ws !== ws);
            if (room.players.length === 0) {
              if (room.turnTimer) clearInterval(room.turnTimer);
              pvpRooms.delete(roomId);
            } else {
              broadcastToRoom(room, {
                type: "ROOM_UPDATED",
                payload: { room: serializeRoomForClient(room) }
              });
            }
          }
          ws.send(JSON.stringify({ type: "ROOM_LEFT", payload: { roomId } }));
          wss.clients.forEach((client) => {
            if (client.readyState === import_ws.WebSocket.OPEN) {
              broadcastRoomsList(client);
            }
          });
          return;
        }
      } catch (err) {
        console.error("Error processing WS message:", err);
      }
    });
    ws.on("close", () => {
      if (ws.roomId) {
        const room = pvpRooms.get(ws.roomId);
        if (room) {
          const player = room.players.find((p) => p.id === ws.userId);
          if (player) {
            player.ws = void 0;
          }
          if (room.players.every((p) => !p.ws)) {
            if (room.turnTimer) clearInterval(room.turnTimer);
            pvpRooms.delete(ws.roomId);
          }
        }
      }
    });
  });
  setInterval(() => {
    wss.clients.forEach((ws) => {
      if (ws.isAlive === false) return ws.terminate();
      ws.isAlive = false;
      ws.ping();
    });
  }, 3e4);
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
    console.log(`Server + WebSocket running on port ${PORT}`);
  });
}
startServer();
//# sourceMappingURL=server.cjs.map
