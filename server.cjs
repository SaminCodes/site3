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
var import_path = __toESM(require("path"), 1);
var import_fs = __toESM(require("fs"), 1);
var import_vite = require("vite");
var app = (0, import_express.default)();
var PORT = 3e3;
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
  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on port ${PORT}`);
  });
}
startServer();
//# sourceMappingURL=server.cjs.map
