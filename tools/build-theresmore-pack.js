const fs = require("fs");
const path = require("path");

const projectRoot = path.resolve(__dirname, "..");
const analysisDir = path.resolve(projectRoot, "..", "..", "theresmore_analysis_2026-07-09", "analysis");
const outFile = path.join(projectRoot, "theresmore-data.generated.js");

function readJson(name) {
  return JSON.parse(fs.readFileSync(path.join(analysisDir, `${name}.json`), "utf8"));
}

function parseCsv(text) {
  const rows = [];
  let row = [];
  let field = "";
  let quoted = false;
  for (let i = 0; i < text.length; i += 1) {
    const ch = text[i];
    const next = text[i + 1];
    if (quoted) {
      if (ch === '"' && next === '"') {
        field += '"';
        i += 1;
      } else if (ch === '"') {
        quoted = false;
      } else {
        field += ch;
      }
      continue;
    }
    if (ch === '"') {
      quoted = true;
    } else if (ch === ",") {
      row.push(field);
      field = "";
    } else if (ch === "\n") {
      row.push(field);
      rows.push(row);
      row = [];
      field = "";
    } else if (ch !== "\r") {
      field += ch;
    }
  }
  if (field || row.length) {
    row.push(field);
    rows.push(row);
  }
  const header = rows.shift() || [];
  return rows.filter((r) => r.length && r.some(Boolean)).map((r) => Object.fromEntries(header.map((h, i) => [h, r[i] || ""])));
}

function readCsv(name) {
  return parseCsv(fs.readFileSync(path.join(analysisDir, `${name}.csv`), "utf8"));
}

const source = {
  rawBundle: "raw/main.480437b3.js",
  analysisDir: "theresmore_analysis_2026-07-09/analysis",
  generatedAt: new Date().toISOString(),
};

const json = {
  resources: readJson("resources"),
  buildings: readJson("buildings"),
  techs: readJson("techs"),
  population: readJson("population"),
  units: readJson("units"),
  enemies: readJson("enemies"),
  ancestors: readJson("ancestors"),
};

const csv = {
  resources: readCsv("resources"),
  buildings: readCsv("buildings"),
  techs: readCsv("techs"),
  population: readCsv("population"),
  units: readCsv("units"),
  enemies: readCsv("enemies_locations"),
  ancestors: readCsv("ancestors"),
};

const nameMaps = Object.fromEntries(Object.entries(csv).map(([key, rows]) => [key, new Map(rows.map((row) => [row.id, row.name || row.id]))]));
const rowMaps = Object.fromEntries(Object.entries(csv).map(([key, rows]) => [key, new Map(rows.map((row) => [row.id, row]))]));

const resourceIcon = {
  research: "knowledge",
  gold: "spark",
  food: "food",
  wood: "wood",
  stone: "stone",
  copper: "ore",
  iron: "ore",
  tools: "build",
  cow: "food",
  horse: "people",
  faith: "faith",
  mana: "spark",
  fame: "spark",
  luck: "spark",
  building_material: "build",
  steel: "ore",
  crystal: "spark",
  supplies: "food",
  saltpetre: "ore",
  natronite: "ore",
  lumix: "spark",
  legacy: "spark",
  relic: "faith",
  tome_wisdom: "knowledge",
  coin: "spark",
  gem: "spark",
  titan_gift: "spark",
  light: "faith",
  offline: "spark",
  queue_slot: "build",
};

const resourceAccent = {
  research: "knowledge",
  gold: "gold",
  food: "food",
  wood: "wood",
  stone: "stone",
  copper: "ore",
  iron: "ore",
  tools: "tools",
  cow: "food",
  horse: "people",
  faith: "faith",
  mana: "purple",
  fame: "gold",
  luck: "purple",
  building_material: "build",
  steel: "ore",
  crystal: "blue",
  supplies: "food",
  saltpetre: "stone",
  natronite: "orange",
  lumix: "purple",
  legacy: "faith",
  relic: "faith",
  tome_wisdom: "knowledge",
  coin: "gold",
  gem: "purple",
  titan_gift: "orange",
  light: "faith",
};

function num(value, fallback = 0) {
  const n = Number(value);
  return Number.isFinite(n) ? n : fallback;
}

function add(map, key, value) {
  if (!key || !Number.isFinite(value) || value === 0) return;
  map[key] = Number(((map[key] || 0) + value).toFixed(6));
}

function reqToParts(req = []) {
  const costs = {};
  const requires = [];
  const costScales = [];
  for (const item of req || []) {
    const type = item.type;
    const id = item.id;
    const value = num(item.value, 1);
    if (type === "resource") {
      add(costs, id, value);
      if (item.multi) costScales.push(num(item.multi, 1));
    } else if (["tech", "building", "legacy", "prayer", "spell", "enemy", "diplomacy_owned", "stat"].includes(type)) {
      requires.push({ type, id, value });
    }
  }
  const costScale = costScales.length ? costScales.reduce((a, b) => a + b, 0) / costScales.length : 1.2;
  return { costs, requires, costScale: Number(costScale.toFixed(3)) };
}

function genToParts(gen = []) {
  const effects = {};
  const grantResources = {};
  const grantsTechs = [];
  const removesTechs = [];
  const notes = [];
  for (const item of gen || []) {
    const type = item.type;
    const id = item.id;
    const value = num(item.value, 0);
    if (type === "resource") {
      if (item.fix) add(grantResources, id, value);
      else if (item.perc) add(effects, `${id}Rate`, value / 100);
      else add(effects, `${id}RateFlat`, value);
    } else if (type === "cap") {
      if (id === "army") add(effects, "armyCap", value);
      else add(effects, `cap_${id}`, value);
    } else if (type === "population") {
      if (id === "unemployed") add(effects, "population", value);
      else add(effects, `jobCap_${id}`, value);
    } else if (type === "modifier") {
      if (item.type_id === "population" && item.type_gen === "resource" && item.gen) {
        add(effects, `${item.gen}Rate`, item.perc ? value / 100 : value / 100);
      } else if (item.type_id === "army" && item.type_gen === "stat") {
        add(effects, "armyPower", item.perc ? value / 100 : value / 100);
      } else {
        notes.push(`未适配修正：${item.type_id || ""}.${item.id || ""}.${item.type_gen || ""}.${item.gen || ""}`);
      }
    } else if (type === "tech") {
      if (value < 0) removesTechs.push(id);
      else grantsTechs.push(id);
    } else if (type === "building" || type === "prayer") {
      if (value < 0) notes.push(`移除${type}:${id}`);
    }
  }
  return { effects, grantResources, grantsTechs, removesTechs, notes };
}

function categoryForBuilding(item) {
  if (["living_quarters"].includes(item.cat)) return "settlement";
  if (["resource", "warehouse", "commercial_area"].includes(item.cat)) return "production";
  if (["defense"].includes(item.cat)) return "war";
  if (["science", "faith", "wonders"].includes(item.cat)) return "culture";
  if (item.tab === 2) return "production";
  if (item.tab === 3) return "war";
  return "culture";
}

function categoryForTech(item) {
  const id = item.id || "";
  const text = `${nameMaps.techs.get(id) || ""} ${id}`.toLowerCase();
  const g = genToParts(item.gen || []).effects;
  if (/war|arch|spear|army|military|combat|weapon|siege|gun|炮|军|兵|弓|矛|战争/.test(text) || g.armyCap || g.armyPower) return "war";
  if (/farm|food|housing|house|grain|population|cow|horse|农业|住房|粮|马|牛/.test(text) || g.population || g.foodRate || g.cap_food) return "settlement";
  if (/wood|stone|mining|copper|iron|tool|steel|resource|warehouse|trade|gold|market|木|石|矿|铁|铜|工具|贸易|市场|黄金/.test(text) || g.woodRate || g.stoneRate || g.copperRate || g.ironRate || g.goldRate) return "production";
  return "culture";
}

function effectSummary(effects = {}) {
  const labelForResource = (id) => nameMaps.resources.get(id) || id;
  const labels = {
    popCap: "人口上限",
    population: "人口",
    armyCap: "军队容量",
    morale: "民心",
    allRate: "全部产量",
    armyPower: "军队战力",
  };
  const signed = (value, digits = 0) => `${value >= 0 ? "+" : ""}${Number(value).toFixed(digits).replace(/\.0+$/, "")}`;
  return Object.entries(effects).slice(0, 3).map(([key, value]) => {
    if (key.startsWith("cap_")) return `${labelForResource(key.slice(4))}上限 ${signed(value)}`;
    if (key.startsWith("jobCap_")) return `${key.slice(7)}岗位 ${signed(value)}`;
    if (key.endsWith("RateFlat")) return `${labelForResource(key.replace("RateFlat", ""))} ${signed(value, Math.abs(value) < 1 ? 2 : 1)}/秒`;
    if (key.endsWith("Rate")) return `${labelForResource(key.replace("Rate", ""))}产量 ${signed(value * 100)}%`;
    if (key === "morale" || key === "allRate" || key === "armyPower") return `${labels[key]} ${signed(value * 100)}%`;
    return `${labels[key] || key} ${signed(value)}`;
  });
}

function convertResources() {
  return json.resources.map((item) => {
    const row = rowMaps.resources.get(item.id) || {};
    const { requires } = reqToParts(parseCompactReq(row.req));
    return {
      id: item.id,
      name: nameMaps.resources.get(item.id) || item.id,
      icon: resourceIcon[item.id] || "spark",
      accent: resourceAccent[item.id] || "spark",
      cap: item.cap == null ? 999999999 : item.cap,
      hidden: row.hidden === "true",
      manual: row.manual === "true",
      requires,
    };
  });
}

function parseCompactReq(text = "") {
  if (!text) return [];
  return text.split(";").map((part) => part.trim()).filter(Boolean).map((part) => {
    const bits = part.split(":");
    const item = { type: bits[0], id: bits[1], value: num(bits[2], 1) };
    for (const bit of bits.slice(3)) {
      if (bit.startsWith("multi=")) item.multi = num(bit.slice(6), 1);
      if (bit === "perc") item.perc = true;
      if (bit === "fix") item.fix = true;
      if (bit === "manual") item.manual = true;
      if (bit === "consume") item.consume = true;
    }
    return item;
  });
}

function convertAncestors() {
  return json.ancestors.map((item) => {
    const gen = genToParts(item.gen || []);
    const name = nameMaps.ancestors.get(item.id) || item.id.replace(/^ancestor_/, "");
    return {
      id: item.id,
      name,
      color: item.color || "#43b883",
      icon: "spark",
      desc: `来自 Theresmore 的祖先路线：${name}`,
      bonuses: effectSummary(gen.effects),
      effects: gen.effects,
      mods: {},
      start: {},
      requires: reqToParts(parseCompactReq((rowMaps.ancestors.get(item.id) || {}).req)).requires,
    };
  });
}

function convertJobs() {
  return json.population.filter((item) => item.id !== "unemployed").map((item) => {
    const gen = genToParts(item.gen || []);
    return {
      id: item.id,
      name: nameMaps.population.get(item.id) || item.id,
      desc: `Theresmore 职业。`,
      baseCap: 0,
      effects: gen.effects,
      requires: reqToParts(item.req || []).requires,
    };
  });
}

function convertBuildings() {
  return json.buildings.map((item) => {
    const req = reqToParts(item.req || []);
    const gen = genToParts(item.gen || []);
    return {
      id: item.id,
      name: nameMaps.buildings.get(item.id) || item.id,
      tab: categoryForBuilding(item),
      sourceCat: item.cat,
      sourceTab: item.tab,
      sourceAge: item.age,
      cap: item.cap == null ? undefined : item.cap,
      desc: `Theresmore 建筑：${nameMaps.buildings.get(item.id) || item.id}`,
      costs: req.costs,
      costScale: req.costScale,
      effects: gen.effects,
      grantResources: gen.grantResources,
      grantsTechs: gen.grantsTechs,
      removesTechs: gen.removesTechs,
      requires: req.requires,
    };
  });
}

function convertTechs() {
  return json.techs.map((item) => {
    const req = reqToParts(item.req || []);
    const gen = genToParts(item.gen || []);
    return {
      id: item.id,
      name: nameMaps.techs.get(item.id) || item.id,
      tab: categoryForTech(item),
      desc: `Theresmore 科技/分支：${nameMaps.techs.get(item.id) || item.id}`,
      costs: req.costs,
      effects: gen.effects,
      grantResources: gen.grantResources,
      grantsTechs: gen.grantsTechs,
      removesTechs: gen.removesTechs,
      requires: req.requires,
      branch: gen.removesTechs.length ? { removes: gen.removesTechs } : undefined,
    };
  });
}

function convertUnits() {
  return json.units.filter((item) => ["army", "recon", "spy"].includes(item.type)).map((item) => {
    const req = reqToParts(item.req || []);
    const gen = genToParts(item.gen || []);
    return {
      id: item.id,
      name: nameMaps.units.get(item.id) || item.id,
      desc: `Theresmore 单位：${nameMaps.units.get(item.id) || item.id}`,
      sourceType: item.type,
      costs: req.costs,
      power: Number(((item.attack || 0) + (item.defense || 0) * 0.75 + (item.splash || 0) * 2).toFixed(2)),
      cap: item.cap == null ? undefined : item.cap,
      upkeep: gen.effects,
      requires: req.requires,
    };
  });
}

const enemyUnitPower = new Map(json.units.filter((unit) => unit.type === "enemy").map((unit) => [unit.id, (unit.attack || 0) + (unit.defense || 0) * 0.75 + (unit.splash || 0) * 2]));
function convertEnemiesToExpeditions() {
  return json.enemies.map((item) => {
    const gen = genToParts(item.gen || []);
    const rewards = { ...gen.grantResources };
    for (const [key, value] of Object.entries(gen.effects)) {
      if (key.endsWith("RateFlat")) add(rewards, key.replace("RateFlat", ""), Math.max(1, Math.ceil(Math.abs(value) * 120)));
      if (key.startsWith("cap_")) add(rewards, key.slice(4), Math.max(1, Math.ceil(Math.abs(value) * 0.05)));
    }
    const enemyPower = (item.army || []).reduce((sum, unit) => sum + (enemyUnitPower.get(unit.id) || item.level || 1) * (unit.value || 1), 0);
    const requires = reqToParts(item.reqFound || []).requires;
    return {
      id: `enemy_${item.id}`,
      name: nameMaps.enemies.get(item.id) || item.id,
      desc: `Theresmore 敌点。等级 ${item.level || 1}，侦察 ${item.esp || 0}。`,
      power: Math.max(1, Math.ceil(enemyPower / 10 || item.level || 1)),
      duration: Math.max(30, Math.min(360, 30 + (item.level || 1) * 18)),
      costs: { food: Math.max(20, (item.level || 1) * 30) },
      rewards,
      unlocks: [],
      requires,
    };
  });
}

const pack = {
  version: "theresmore-main.480437b3-phase1",
  source,
  populationFoodUse: 0,
  startResources: { food: 90, wood: 35, stone: 35, research: 6 },
  resources: convertResources().filter((resource) => !["offline", "queue_slot"].includes(resource.id)),
  paths: convertAncestors(),
  jobs: convertJobs(),
  buildings: convertBuildings(),
  techs: convertTechs(),
  units: convertUnits(),
  expeditions: convertEnemiesToExpeditions(),
};
pack.meta = {
  resources: pack.resources.length,
  paths: pack.paths.length,
  jobs: pack.jobs.length,
  buildings: pack.buildings.length,
  techs: pack.techs.length,
  units: pack.units.length,
  expeditions: pack.expeditions.length,
};

const js = `// Auto-generated by tools/build-theresmore-pack.js.\n// Source: ${source.rawBundle}\nwindow.THERESMORE_PACK = ${JSON.stringify(pack, null, 2)};\n`;
fs.writeFileSync(outFile, js, "utf8");
console.log(`Wrote ${outFile}`);
console.log(JSON.stringify(pack.meta, null, 2));
