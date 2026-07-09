const SAVE_KEY = "ridge-age-save-v1";
const ANNOUNCEMENT_KEY = "ridge-age-seen-version";
const GUIDE_KEY = "ridge-age-guide-seen";
const APP_VERSION = "0.9.10";
const TICK_MS = 1000;

const $ = (selector, root = document) => root.querySelector(selector);
const app = $("#app");
const toastRoot = $("#toast-root");

const icons = {
  food: "food",
  wood: "wood",
  stone: "stone",
  ore: "ore",
  tools: "build",
  knowledge: "knowledge",
  faith: "faith",
  gold: "spark",
  people: "people",
  army: "army",
  build: "build",
  spark: "spark",
};

const resources = [
  { id: "food", name: "粮食", icon: "food", cap: 300 },
  { id: "gold", name: "金币", icon: "spark", cap: 600, unlocked: (s) => buildingCount(s, "quarry") >= 1 || buildingCount(s, "orepit") >= 1 || buildingCount(s, "market") >= 1 || (s.resources.gold || 0) > 0 },
  { id: "wood", name: "木材", icon: "wood", cap: 300 },
  { id: "stone", name: "石料", icon: "stone", cap: 300 },
  { id: "tools", name: "工具", icon: "tools", cap: 180, unlocked: (s) => hasTech(s, "craftsmanship") || buildingCount(s, "workshop") >= 1 },
  { id: "ore", name: "矿砂", icon: "ore", cap: 200, unlocked: (s) => buildingCount(s, "orepit") >= 1 },
  { id: "knowledge", name: "学识", icon: "knowledge", cap: 500 },
  { id: "faith", name: "星辉", icon: "faith", cap: 500, unlocked: (s) => buildingCount(s, "shrine") >= 1 },
];

const accentVars = {
  food: "var(--green)",
  wood: "var(--wood)",
  stone: "var(--stone)",
  tools: "var(--gold)",
  ore: "var(--orange)",
  knowledge: "var(--blue)",
  faith: "var(--purple)",
  gold: "var(--gold)",
  people: "var(--green)",
  army: "var(--red)",
  build: "var(--gold)",
  spark: "var(--gold)",
};

const changelog = [
  {
    version: "0.9.10",
    date: "2026-07-09",
    title: "缺口显示缓存修正",
    notes: [
      "成本不足时右侧只保留“缺多少”的数字，不再显示当前/需求数量。",
      "页面资源增加版本标记，减少浏览器缓存导致旧格式继续显示的问题。",
    ],
  },
  {
    version: "0.9.9",
    date: "2026-07-09",
    title: "成本预览精简",
    notes: [
      "资源不足时，悬停预览只显示缺少数量，不再挤入当前数量和等待秒数。",
      "缺口数字仍会随资源生产逐秒减少，方便判断还差多少。",
    ],
  },
  {
    version: "0.9.8",
    date: "2026-07-09",
    title: "金币来源调整",
    notes: [
      "小屋不再凭空产出金币，金币改为主要来自采石、矿坑、矿架和市集。",
      "前期关键建筑去掉或降低金币成本，避免新金币链导致早期卡住。",
      "部分随机事件调整解锁条件和奖励，避免金币资源尚未出现时提前刷出金币选项。",
    ],
  },
  {
    version: "0.9.7",
    date: "2026-07-09",
    title: "先民道路分化",
    notes: [
      "三条先民道路现在拥有实际数值差异，不再只是叙事选择。",
      "梯田氏族偏粮食与人口承压，燧石行会偏石料与建筑成本，观星修会偏学识与研究成本。",
      "开局选择卡片会直接显示具体优势，方便判断适合自己的扩张节奏。",
    ],
  },
  {
    version: "0.9.6",
    date: "2026-07-09",
    title: "村落事件扩展",
    notes: [
      "随机事件改为约 1 到 3 分钟出现一次，困难难度会略偏慢但不会超过 3 分钟。",
      "新增一批轻松的材料馈赠、材料交换和村落小插曲事件。",
      "事件内容会按当前建筑和研究逐步出现，避免早期刷出过多陌生资源。",
    ],
  },
  {
    version: "0.9.5",
    date: "2026-07-09",
    title: "成本预览强化",
    notes: [
      "悬停预览里的成本会按当前资源状态显示够用、缺少或上限不足。",
      "资源不足时会显示缺口和预计等待时间，并随产量刷新逐秒减少。",
    ],
  },
  {
    version: "0.9.4",
    date: "2026-07-09",
    title: "研究树完整度扩展",
    notes: [
      "研究树扩展为多阶段结构，新增定居、生产、文化、信仰、防务和远征相关研究。",
      "新增工具资源、工匠岗位和一批中期建筑，让生产升级与军备升级有更完整承接。",
      "新增兵种、远征与事件内容，整体节奏保持轻量，不提高前期门槛。",
    ],
  },
  {
    version: "0.9.3",
    date: "2026-07-09",
    title: "早期研究与数值校准",
    notes: [
      "补充早期研究链和对应建筑，让定居、生产、文化、防务路线更完整。",
      "采食者产粮调整为 2/秒，并下调困难和地狱难度的成本与口粮压力。",
      "新开局会获得少量粮食、木材、石料和学识，减少纯手动采集时间。",
      "修复军队战力加成只显示不生效的问题。",
    ],
  },
  {
    version: "0.9.2",
    date: "2026-07-09",
    title: "资源状态强化",
    notes: [
      "右侧资源列表在资源已满或为空时会显示更明确的状态标记。",
      "满仓和空仓资源会使用不同底色、边框和数值颜色，方便快速扫一眼判断。",
    ],
  },
  {
    version: "0.9.1",
    date: "2026-07-09",
    title: "研究子标签整理",
    notes: [
      "研究页新增待研究和已完成两个子标签，避免研究项目变多后混在一起。",
      "默认显示待研究内容，已完成项目可单独查看。",
    ],
  },
  {
    version: "0.9.0",
    date: "2026-07-09",
    title: "预览层级修正",
    notes: [
      "修复建筑和研究卡片悬停预览被右侧面板遮挡的问题。",
      "预览打开时会临时提升中间操作区层级，顶部栏和整体布局保持不变。",
    ],
  },
  {
    version: "0.8.9",
    date: "2026-07-09",
    title: "卡片色系统一",
    notes: [
      "建筑和研究卡片主色现在统一跟随所属分组，避免同组项目出现不同主色造成误解。",
      "资源成本、收益和扩容仍在悬停预览里使用资源色，便于区分具体数值来源。",
    ],
  },
  {
    version: "0.8.8",
    date: "2026-07-09",
    title: "导入入口补齐",
    notes: [
      "游戏内顶部增加导入入口，不再只能在未开局时导入存档。",
      "导出和导入现在会同时显示，方便备份和迁移进度。",
    ],
  },
  {
    version: "0.8.7",
    date: "2026-07-09",
    title: "卡片标题强化",
    notes: [
      "增强锁定卡片标题与分类文字可读性。",
      "卡片色彩底纹改为 45 度斜向渐变，分组感更自然。",
    ],
  },
  {
    version: "0.8.6",
    date: "2026-07-09",
    title: "研究分组整理",
    notes: [
      "研究页改为和建筑页一致的分组展示。",
      "研究卡片会显示基础、生产、文化或防务分类，扫描路线更清楚。",
    ],
  },
  {
    version: "0.8.5",
    date: "2026-07-09",
    title: "悬停预览清晰度修复",
    notes: [
      "修复不可用卡片悬停预览被卡片透明度一起压淡的问题。",
      "增强悬停预览背景遮挡和层级，避免和后方卡片文字混在一起。",
    ],
  },
  {
    version: "0.8.4",
    date: "2026-07-09",
    title: "色彩辨识增强",
    notes: [
      "提高资源、分类、标签和卡片状态的颜色强度，让信息分区更清楚。",
      "保持工作面板的低调基调，不恢复重阴影和夸张装饰。",
      "同时增强黑白主题与面板模式下的颜色可读性。",
    ],
  },
  {
    version: "0.8.3",
    date: "2026-07-09",
    title: "低调界面优化",
    notes: [
      "整体界面收敛为更像工作面板的低噪音风格，减少地图感、重阴影和高饱和装饰。",
      "优化黑白主题下的文字、边框、卡片、标签和悬停预览对比度。",
      "统一建筑、职业、公告和指引的色彩表达，保留资源颜色用于识别。",
    ],
  },
  {
    version: "0.8.2",
    date: "2026-07-08",
    title: "文案统一",
    notes: [
      "公告、说明、指引和悬停预览统一为苍岭纪元自己的世界观表达。",
      "清理会破坏沉浸感的开发说明，保留当前数值与玩法节奏不变。",
    ],
  },
  {
    version: "0.8.1",
    date: "2026-07-08",
    title: "预览数值分区",
    notes: [
      "卡片悬停预览改为红绿分区。",
      "成本、收益、扩容提示使用不同色块和右侧数字胶囊，区别更明显。",
    ],
  },
  {
    version: "0.8.0",
    date: "2026-07-08",
    title: "早期经济校准",
    notes: [
      "基础粮食、木材、石料上限调整为 300；金币上限 600；学识上限 500。",
      "小屋、农田、木场、采石场、矿坑和职业产出重新校准，并恢复金币成本链条。",
      "新增农耕、木材切削两项早期研究，优化农田、木场、采石场、矿坑的解锁节奏。",
    ],
  },
  {
    version: "0.7.3",
    date: "2026-07-08",
    title: "悬停预览稳定",
    notes: [
      "修复资源每秒刷新时，中间卡片悬停预览被反复重置的问题。",
      "鼠标停在建筑、研究、军队或远征卡片上时，只刷新左右信息栏，中间内容会在移开后补刷新。",
    ],
  },
  {
    version: "0.7.2",
    date: "2026-07-08",
    title: "早期上限审计",
    notes: [
      "梳理早期资源、人口和存储结构，补强生产建筑的配套存储上限。",
      "基础木材上限提高到 100，基础学识上限提高到 80，避免困难难度把早期研究变成隐形上限题。",
      "山麓木场、露天采石场、赤砂矿坑现在会分别提高木材、石料、矿砂上限。",
      "建筑、研究、训练和远征会在资源上限不足时提示“需扩容”。",
    ],
  },
  {
    version: "0.7.1",
    date: "2026-07-08",
    title: "早期石料修正",
    notes: [
      "基础石料存储上限从 70 提高到 90。",
      "开局石料储备从 25 提高到 35，困难和地狱难度也能支撑第一个干砌石墙的石料需求。",
      "修正早期石料门槛可能卡住第一段扩张的问题。",
    ],
  },
  {
    version: "0.7.0",
    date: "2026-07-08",
    title: "人口口粮制",
    notes: [
      "基础规则改为每 1 人口消耗 1 粮食/秒，困难和地狱难度仍会加压。",
      "采食者调整为每人基础生产 2 粮食/秒。",
      "小屋只增加人口，不再单独额外消耗粮食。",
    ],
  },
  {
    version: "0.6.0",
    date: "2026-07-08",
    title: "新手指引",
    notes: [
      "首次访问会显示简短开局指引。",
      "顶部增加指引入口，可随时重新查看。",
      "早期总览会显示低调的新手目标，帮助判断下一步该做什么。",
    ],
  },
  {
    version: "0.5.0",
    date: "2026-07-08",
    title: "版本公告系统",
    notes: [
      "顶部增加版本号与公告入口。",
      "非隐身视图下，版本更新后首次进入会自动显示更新公告。",
      "隐身视图下不自动弹窗，只保留公告入口提示，避免过于显眼。",
    ],
  },
  {
    version: "0.4.0",
    date: "2026-07-08",
    title: "资源色系区分",
    notes: [
      "建筑、研究、职业、军队、远征和成就增加资源同色系标记。",
      "木材、石料、矿砂、学识、星辉等颜色与右侧资源图标保持一致。",
    ],
  },
  {
    version: "0.3.0",
    date: "2026-07-08",
    title: "三栏布局调整",
    notes: [
      "总览移到左侧信息栏。",
      "中间主区域默认用于建筑、研究、人口等操作。",
    ],
  },
];

const difficulties = [
  {
    id: "easy",
    name: "简单",
    color: "#43b883",
    icon: "food",
    desc: "适合先熟悉节奏。手动采集效率翻倍，其他规则保持基线。",
    notes: ["手动采集 ×2", "建筑/研究/远征成本 ×1", "远征成功率不变"],
    mods: {
      manualGather: 2,
      buildCost: 1,
      techCost: 1,
      trainCost: 1,
      expeditionCost: 1,
      eventCost: 1,
      foodUse: 1,
      eventReward: 1,
      expeditionReward: 1,
      expeditionChance: 0,
      expeditionMin: 0.45,
      expeditionMax: 0.95,
      expeditionLoss: 1,
      eventInterval: 1,
      startResources: 1,
    },
  },
  {
    id: "normal",
    name: "正常",
    color: "#f6c453",
    icon: "spark",
    desc: "标准体验。资源、事件和远征都按基线运作。",
    notes: ["手动采集 ×1", "成本 ×1", "标准远征风险"],
    mods: {
      manualGather: 1,
      buildCost: 1,
      techCost: 1,
      trainCost: 1,
      expeditionCost: 1,
      eventCost: 1,
      foodUse: 1,
      eventReward: 1,
      expeditionReward: 1,
      expeditionChance: 0,
      expeditionMin: 0.45,
      expeditionMax: 0.95,
      expeditionLoss: 1,
      eventInterval: 1,
      startResources: 1,
    },
  },
  {
    id: "hard",
    name: "困难",
    color: "#e8894a",
    icon: "stone",
    desc: "扩张更贵，粮食压力更高，远征和事件收益会缩水。",
    notes: ["建筑 +10%，研究 +8%", "粮食消耗 +15%，事件间隔 +10%", "远征成功率 -8%"],
    mods: {
      manualGather: 1,
      buildCost: 1.1,
      techCost: 1.08,
      trainCost: 1.08,
      expeditionCost: 1.1,
      eventCost: 1.05,
      foodUse: 1.15,
      eventReward: 0.9,
      expeditionReward: 0.92,
      expeditionChance: -0.08,
      expeditionMin: 0.35,
      expeditionMax: 0.88,
      expeditionLoss: 1,
      eventInterval: 1.1,
      startResources: 0.9,
    },
  },
  {
    id: "hell",
    name: "地狱",
    color: "#d85d5d",
    icon: "army",
    desc: "给熟悉系统后的挑战。每次错误扩张都会留下明显代价。",
    notes: ["建筑 +22%，研究 +18%", "粮食消耗 +30%，事件间隔 +25%", "远征成功率 -18%，失败损失更重"],
    mods: {
      manualGather: 1,
      buildCost: 1.22,
      techCost: 1.18,
      trainCost: 1.18,
      expeditionCost: 1.22,
      eventCost: 1.15,
      foodUse: 1.3,
      eventReward: 0.78,
      expeditionReward: 0.82,
      expeditionChance: -0.18,
      expeditionMin: 0.28,
      expeditionMax: 0.82,
      expeditionLoss: 2,
      eventInterval: 1.25,
      startResources: 0.85,
    },
  },
];

const paths = [
  {
    id: "terrace",
    name: "梯田氏族",
    color: "#43b883",
    icon: "food",
    desc: "你的先民修筑山腰水渠，让第一座村落在薄雾中稳定生长。",
    bonuses: ["粮食产量 +12%", "粮食上限 +120", "人口口粮消耗 -8%"],
    effects: { foodRate: 0.12, cap_food: 120 },
    mods: { foodUse: 0.92 },
    start: { food: 40 },
  },
  {
    id: "flint",
    name: "燧石行会",
    color: "#e8894a",
    icon: "stone",
    desc: "你的先民熟悉峭壁与矿脉，懂得把坚硬山岩变成城邦的骨架。",
    bonuses: ["石料产量 +12%", "建筑成本 -6%", "木材/石料上限 +80"],
    effects: { stoneRate: 0.12, cap_wood: 80, cap_stone: 80 },
    mods: { buildCost: 0.94 },
    start: { stone: 35, wood: 15 },
  },
  {
    id: "astral",
    name: "观星修会",
    color: "#5b8def",
    icon: "knowledge",
    desc: "你的先民用星图安排播种、祭仪和远征，最早的文字刻在铜镜背面。",
    bonuses: ["学识产量 +14%", "研究成本 -6%", "学识上限 +100"],
    effects: { knowledgeRate: 0.14, cap_knowledge: 100 },
    mods: { techCost: 0.94 },
    start: { knowledge: 20 },
  },
];

const buildings = [
  {
    id: "hut",
    name: "苔顶小屋",
    tab: "settlement",
    desc: "给族人遮风避雨，提供 1 人口和少量学识产出；粮食消耗由人口口粮统一计算。",
    costs: { wood: 15, stone: 10 },
    costScale: 1.3,
    effects: { population: 1, knowledgeRateFlat: 0.3 },
    unlocked: (s) => hasTech(s, "housing"),
  },
  {
    id: "granary",
    name: "山腰农田",
    tab: "settlement",
    desc: "开垦山腰薄田，提供 1 个粮食岗位，并大幅提高粮食上限。",
    costs: { wood: 24, stone: 6 },
    costScale: 1.4,
    effects: { cap_food: 240, jobCap_forager: 1 },
    unlocked: (s) => hasTech(s, "agriculture"),
  },
  {
    id: "storehouse",
    name: "储粮坑",
    tab: "settlement",
    desc: "用石板和干草隔出储藏空间，提高基础物资上限。",
    costs: { wood: 28, stone: 18 },
    costScale: 1.25,
    effects: { cap_food: 120, cap_wood: 80, cap_stone: 80 },
    unlocked: (s) => hasTech(s, "storage"),
  },
  {
    id: "potter",
    name: "陶工棚",
    tab: "settlement",
    desc: "烧制陶罐和粮瓮，让粮食储备更稳。",
    costs: { wood: 38, stone: 32 },
    costScale: 1.28,
    effects: { cap_food: 180, foodRateFlat: 0.25, jobCap_forager: 1 },
    unlocked: (s) => hasTech(s, "pottery"),
  },
  {
    id: "longhouse",
    name: "长屋",
    tab: "settlement",
    desc: "把几户人家连成共享屋脊，提供更多人口容量。",
    costs: { gold: 30, wood: 120, stone: 45, food: 80 },
    costScale: 1.28,
    effects: { population: 3, cap_food: 80, knowledgeRateFlat: 0.25 },
    unlocked: (s) => hasTech(s, "villagePlanning"),
  },
  {
    id: "well",
    name: "山泉水渠",
    tab: "settlement",
    desc: "把山泉引入梯田和住处，提高粮食产出与储备。",
    costs: { gold: 40, wood: 80, stone: 120, tools: 20 },
    costScale: 1.28,
    effects: { foodRateFlat: 0.55, cap_food: 220, jobCap_forager: 1 },
    unlocked: (s) => hasTech(s, "irrigation"),
  },
  {
    id: "warehouse",
    name: "谷仓库房",
    tab: "settlement",
    desc: "集中保管粮食、木料、石料和工具，显著提高物资上限。",
    costs: { gold: 70, wood: 140, stone: 95, tools: 30 },
    costScale: 1.24,
    effects: { cap_food: 360, cap_wood: 220, cap_stone: 220, cap_tools: 90, cap_gold: 160 },
    unlocked: (s) => hasTech(s, "warehousing"),
  },
  {
    id: "lumberyard",
    name: "山麓木场",
    tab: "production",
    desc: "在杉林边缘设立木料场，提供 1 个伐木岗位，并提高木材上限。",
    costs: { wood: 18, stone: 5 },
    costScale: 1.4,
    effects: { cap_wood: 100, jobCap_woodcutter: 1 },
    unlocked: (s) => hasTech(s, "woodcutting"),
  },
  {
    id: "carpenter",
    name: "木工棚",
    tab: "production",
    desc: "把木料切成可复用构件，提高木材处理效率。",
    costs: { gold: 18, wood: 70, stone: 20 },
    costScale: 1.3,
    effects: { woodRateFlat: 0.35, cap_wood: 160, jobCap_woodcutter: 1 },
    unlocked: (s) => hasTech(s, "carpentry"),
  },
  {
    id: "workshop",
    name: "共用工坊",
    tab: "production",
    desc: "木匠和石匠共用的工棚，开始稳定产出工具。",
    costs: { gold: 55, wood: 110, stone: 85 },
    costScale: 1.28,
    effects: { toolsRateFlat: 0.35, cap_tools: 120, jobCap_artisan: 1 },
    unlocked: (s) => hasTech(s, "craftsmanship"),
  },
  {
    id: "toolmaker",
    name: "工具棚",
    tab: "production",
    desc: "专门打磨木柄、石锤和铜刃，提高工具产出。",
    costs: { gold: 110, wood: 120, stone: 90, ore: 35 },
    costScale: 1.3,
    effects: { toolsRateFlat: 0.65, cap_tools: 160, jobCap_artisan: 1 },
    unlocked: (s) => hasTech(s, "toolmaking"),
  },
  {
    id: "sawmill",
    name: "山涧锯棚",
    tab: "production",
    desc: "借山涧水势带动粗锯，提高木材处理能力。",
    costs: { gold: 130, wood: 180, stone: 110, tools: 45 },
    costScale: 1.28,
    effects: { woodRateFlat: 0.8, cap_wood: 300, jobCap_woodcutter: 1 },
    unlocked: (s) => hasTech(s, "sawing"),
  },
  {
    id: "quarry",
    name: "露天采石场",
    tab: "production",
    desc: "沿山壁开出稳定石源，提供 1 个采石岗位，提高石料上限，并筛出少量可用于交易的矿石。",
    costs: { wood: 24, stone: 8 },
    costScale: 1.4,
    effects: { cap_stone: 100, cap_gold: 80, goldRateFlat: 0.18, jobCap_mason: 1 },
    unlocked: (s) => hasTech(s, "masonry"),
  },
  {
    id: "stonemason",
    name: "石匠棚",
    tab: "production",
    desc: "集中存放石锤和楔子，提高石料处理效率。",
    costs: { gold: 20, wood: 48, stone: 64 },
    costScale: 1.3,
    effects: { stoneRateFlat: 0.3, cap_stone: 160, jobCap_mason: 1 },
    unlocked: (s) => hasTech(s, "stoneTools"),
  },
  {
    id: "stoneworks",
    name: "石作坊",
    tab: "production",
    desc: "用滑轮和楔槽处理大块石料，提高石料产出。",
    costs: { gold: 90, wood: 90, stone: 190, tools: 45 },
    costScale: 1.28,
    effects: { stoneRateFlat: 0.7, cap_stone: 300, jobCap_mason: 1 },
    unlocked: (s) => hasTech(s, "stonecutting"),
  },
  {
    id: "orepit",
    name: "赤砂矿坑",
    tab: "production",
    desc: "顺着赤砂岩脉向下开采，提供 1 个矿工岗位，提高矿砂上限，并带来稳定金币。",
    costs: { gold: 90, wood: 140, stone: 80 },
    costScale: 1.4,
    effects: { cap_ore: 100, cap_gold: 120, goldRateFlat: 0.45, jobCap_miner: 1 },
    unlocked: (s) => hasTech(s, "smelting"),
  },
  {
    id: "mineShaft",
    name: "竖井矿架",
    tab: "production",
    desc: "支起木架深入赤砂矿脉，提高矿砂产出、金币收入与储量。",
    costs: { gold: 120, wood: 170, stone: 140, tools: 70 },
    costScale: 1.3,
    effects: { oreRateFlat: 0.65, goldRateFlat: 0.75, cap_ore: 180, cap_gold: 160, jobCap_miner: 1 },
    unlocked: (s) => hasTech(s, "deepMining"),
  },
  {
    id: "scribe",
    name: "书记棚",
    tab: "culture",
    desc: "会写字的人开始记录季节、账目和传说。",
    costs: { wood: 45, food: 30 },
    costScale: 1.19,
    effects: { knowledgeRateFlat: 0.3, foodRateFlat: -0.35, cap_knowledge: 50, jobCap_scribe: 1 },
    unlocked: (s) => hasTech(s, "records"),
  },
  {
    id: "shrine",
    name: "星火祭坛",
    tab: "culture",
    desc: "夜巡者在这里守灯，村民从星辉中获得安定。",
    costs: { stone: 55, wood: 32, knowledge: 24 },
    costScale: 1.2,
    effects: { faithRateFlat: 0.18, foodRateFlat: -0.25, morale: 0.02, cap_faith: 36, jobCap_acolyte: 1 },
    unlocked: (s) => hasTech(s, "omens"),
  },
  {
    id: "archive",
    name: "档案棚",
    tab: "culture",
    desc: "集中保管木简、陶片和星图，提高学识上限与产出。",
    costs: { gold: 120, wood: 150, stone: 70, knowledge: 120 },
    costScale: 1.24,
    effects: { knowledgeRateFlat: 0.9, cap_knowledge: 260, jobCap_scribe: 1 },
    unlocked: (s) => hasTech(s, "archives"),
  },
  {
    id: "school",
    name: "算筹学堂",
    tab: "culture",
    desc: "让年轻人学习账册、测量和历法，稳定提高学识。",
    costs: { gold: 180, wood: 170, stone: 110, knowledge: 180, tools: 55 },
    costScale: 1.26,
    effects: { knowledgeRateFlat: 1.2, knowledgeRate: 0.08, cap_knowledge: 320 },
    unlocked: (s) => hasTech(s, "education"),
  },
  {
    id: "temple",
    name: "星辉庙",
    tab: "culture",
    desc: "把守灯人的祭仪固定下来，提高星辉产出与士气。",
    costs: { gold: 160, stone: 180, faith: 90, tools: 45 },
    costScale: 1.25,
    effects: { faithRateFlat: 0.65, cap_faith: 180, morale: 0.03, jobCap_acolyte: 1 },
    unlocked: (s) => hasTech(s, "templeRites"),
  },
  {
    id: "barracks",
    name: "木栅营地",
    tab: "war",
    desc: "给猎手和守卫训练的地方，能组织更可靠的战团。",
    costs: { wood: 80, stone: 42, food: 55 },
    costScale: 1.22,
    effects: { armyCap: 4 },
    unlocked: (s) => hasTech(s, "watch"),
  },
  {
    id: "palisade",
    name: "环村栅墙",
    tab: "war",
    desc: "围住住处和粮仓，增加军队容量并稳定民心。",
    costs: { wood: 150, stone: 70, food: 80 },
    costScale: 1.24,
    effects: { armyCap: 4, morale: 0.02 },
    unlocked: (s) => hasTech(s, "fortification"),
  },
  {
    id: "range",
    name: "简易靶场",
    tab: "war",
    desc: "用木桩和草靶训练守卫，扩大早期队伍容量。",
    costs: { wood: 95, stone: 36, food: 70 },
    costScale: 1.24,
    effects: { armyCap: 3 },
    unlocked: (s) => hasTech(s, "archery"),
  },
  {
    id: "signalTower",
    name: "烽火哨塔",
    tab: "war",
    desc: "在山脊立起火台和旗杆，提高远征准备效率。",
    costs: { gold: 130, wood: 120, stone: 160, tools: 40 },
    costScale: 1.25,
    effects: { armyCap: 5, allRate: 0.02 },
    unlocked: (s) => hasTech(s, "signals"),
  },
  {
    id: "armory",
    name: "军械棚",
    tab: "war",
    desc: "统一保养盾牌、箭束和刃口，提升军队战力。",
    costs: { gold: 180, wood: 150, stone: 110, ore: 90, tools: 80 },
    costScale: 1.28,
    effects: { armyCap: 4, toolsRateFlat: -0.15 },
    unlocked: (s) => hasTech(s, "armsWorkshop"),
  },
  {
    id: "market",
    name: "谷口市集",
    tab: "culture",
    desc: "商旅会带来消息和稀缺物资，也会带走过剩粮木。",
    costs: { wood: 110, stone: 80, knowledge: 38 },
    costScale: 1.24,
    effects: { allRate: 0.03, goldRateFlat: 0.4, foodRateFlat: -0.5, cap_food: 60, cap_wood: 60, cap_stone: 50, cap_gold: 120 },
    unlocked: (s) => hasTech(s, "trade"),
  },
  {
    id: "observatory",
    name: "岭顶观星台",
    tab: "culture",
    desc: "用石环与铜尺丈量星路，大幅提升研究与仪式效率。",
    costs: { stone: 180, ore: 75, knowledge: 120, faith: 40 },
    costScale: 1.28,
    effects: { knowledgeRateFlat: 0.75, faithRateFlat: 0.32, foodRateFlat: -0.5, allRate: 0.05 },
    unlocked: (s) => hasTech(s, "astrolabe"),
  },
];

const techs = [
  {
    id: "housing",
    name: "住房",
    tab: "settlement",
    desc: "整理营地住处，解锁苔顶小屋。",
    costs: {},
    effects: {},
    unlocked: () => true,
  },
  {
    id: "agriculture",
    name: "农耕",
    tab: "settlement",
    desc: "掌握山腰耕作，解锁山腰农田。",
    costs: { knowledge: 10 },
    effects: {},
    unlocked: (s) => hasTech(s, "housing"),
  },
  {
    id: "storage",
    name: "储藏",
    tab: "settlement",
    desc: "整理粮坑和木石堆场，解锁储粮坑。",
    costs: { knowledge: 12, wood: 18 },
    effects: { cap_food: 80, cap_wood: 40, cap_stone: 40 },
    unlocked: (s) => hasTech(s, "housing"),
  },
  {
    id: "pottery",
    name: "陶器",
    tab: "settlement",
    desc: "烧制陶罐保存粮食，解锁陶工棚。",
    costs: { knowledge: 35, food: 45, stone: 30 },
    effects: { cap_food: 120 },
    unlocked: (s) => hasTech(s, "storage") && hasTech(s, "agriculture"),
  },
  {
    id: "cropRotation",
    name: "轮作",
    tab: "settlement",
    desc: "安排山腰薄田轮换休耕，提高粮食产出。",
    costs: { knowledge: 70, food: 110 },
    effects: { foodRate: 0.12 },
    unlocked: (s) => hasTech(s, "pottery") && buildingCount(s, "granary") >= 1,
  },
  {
    id: "granaryManagement",
    name: "粮仓管理",
    tab: "settlement",
    desc: "统一记录收储和口粮分配，进一步提高粮食效率。",
    costs: { knowledge: 115, food: 180, wood: 90 },
    effects: { foodRate: 0.08, cap_food: 180 },
    unlocked: (s) => hasTech(s, "cropRotation") && buildingCount(s, "potter") >= 1,
  },
  {
    id: "villagePlanning",
    name: "村落规划",
    tab: "settlement",
    desc: "按道路、屋舍和仓区重新规划村落，解锁长屋。",
    costs: { knowledge: 130, wood: 140, stone: 80 },
    effects: { cap_food: 120, cap_wood: 80, cap_stone: 80 },
    unlocked: (s) => hasTech(s, "pottery") && buildingCount(s, "hut") >= 4,
  },
  {
    id: "irrigation",
    name: "水渠",
    tab: "settlement",
    desc: "把山泉引到梯田和长屋旁，解锁山泉水渠。",
    costs: { knowledge: 170, stone: 150, tools: 35 },
    effects: { foodRate: 0.14 },
    unlocked: (s) => hasTech(s, "granaryManagement") && hasTech(s, "craftsmanship"),
  },
  {
    id: "warehousing",
    name: "库房制度",
    tab: "settlement",
    desc: "把分散堆场整合为库房，解锁谷仓库房。",
    costs: { knowledge: 190, wood: 160, stone: 130, tools: 45 },
    effects: { cap_food: 240, cap_wood: 160, cap_stone: 160, cap_tools: 60 },
    unlocked: (s) => hasTech(s, "villagePlanning") && hasTech(s, "craftsmanship"),
  },
  {
    id: "publicWorks",
    name: "公共工程",
    tab: "settlement",
    desc: "把水渠、道路、库房和工坊纳入统一调度，提高全局效率。",
    costs: { knowledge: 320, gold: 180, wood: 220, stone: 220, tools: 120 },
    effects: { allRate: 0.05, cap_tools: 80, cap_gold: 180 },
    unlocked: (s) => hasTech(s, "warehousing") && hasTech(s, "irrigation"),
  },
  {
    id: "woodcutting",
    name: "木材切削",
    tab: "production",
    desc: "学会切削和堆放木料，解锁山麓木场。",
    costs: { knowledge: 20 },
    effects: {},
    unlocked: (s) => hasTech(s, "housing"),
  },
  {
    id: "carpentry",
    name: "木工",
    tab: "production",
    desc: "制作榫卯和木架，解锁木工棚并提高木材产出。",
    costs: { knowledge: 60, wood: 90 },
    effects: { woodRate: 0.1 },
    unlocked: (s) => hasTech(s, "woodcutting") && buildingCount(s, "lumberyard") >= 1,
  },
  {
    id: "craftsmanship",
    name: "工艺分工",
    tab: "production",
    desc: "让木匠、石匠和修理者分工协作，解锁共用工坊和工匠岗位。",
    costs: { knowledge: 90, wood: 80, stone: 65 },
    effects: { cap_tools: 80, jobCap_artisan: 1 },
    unlocked: (s) => hasTech(s, "carpentry") && hasTech(s, "stoneTools"),
  },
  {
    id: "toolmaking",
    name: "工具制造",
    tab: "production",
    desc: "集中制作石锤、木柄和铜刃，解锁工具棚。",
    costs: { knowledge: 150, wood: 120, stone: 90, ore: 25 },
    effects: { toolsRate: 0.12, cap_tools: 120 },
    unlocked: (s) => hasTech(s, "craftsmanship") && hasTech(s, "smelting") && buildingCount(s, "orepit") >= 1,
  },
  {
    id: "sawing",
    name: "水力锯架",
    tab: "production",
    desc: "用水轮和锯架处理木料，解锁山涧锯棚。",
    costs: { knowledge: 220, wood: 220, stone: 130, tools: 70 },
    effects: { woodRate: 0.16 },
    unlocked: (s) => hasTech(s, "irrigation") && hasTech(s, "toolmaking"),
  },
  {
    id: "masonry",
    name: "干砌石墙",
    tab: "production",
    desc: "学会干砌和取石，解锁露天采石场。",
    costs: { knowledge: 20 },
    effects: {},
    unlocked: (s) => hasTech(s, "housing"),
  },
  {
    id: "stoneTools",
    name: "采石工具",
    tab: "production",
    desc: "改良石锤和楔子，解锁石匠棚并提高石料产出。",
    costs: { knowledge: 65, wood: 55, stone: 80 },
    effects: { stoneRate: 0.1 },
    unlocked: (s) => hasTech(s, "masonry") && buildingCount(s, "quarry") >= 1,
  },
  {
    id: "stonecutting",
    name: "切石",
    tab: "production",
    desc: "用滑轮和楔槽处理大块石料，解锁石作坊。",
    costs: { knowledge: 210, wood: 120, stone: 220, tools: 60 },
    effects: { stoneRate: 0.16 },
    unlocked: (s) => hasTech(s, "craftsmanship") && buildingCount(s, "stonemason") >= 1,
  },
  {
    id: "quarryLifts",
    name: "采石滑车",
    tab: "production",
    desc: "用滑车和绳架搬运大块石料，进一步提高石料效率。",
    costs: { knowledge: 280, wood: 180, stone: 260, tools: 95 },
    effects: { stoneRate: 0.12, toolsRate: 0.04 },
    unlocked: (s) => hasTech(s, "stonecutting") && hasTech(s, "sawing"),
  },
  {
    id: "records",
    name: "结绳账簿",
    tab: "culture",
    desc: "解锁书记棚，并让学识获取提高。",
    costs: { knowledge: 150 },
    effects: { knowledgeRate: 0.15 },
    unlocked: (s) => hasTech(s, "storage"),
  },
  {
    id: "writing",
    name: "书写",
    tab: "culture",
    desc: "把结绳记录改为成体系的符号，进一步提高学识产出。",
    costs: { knowledge: 95, wood: 80, food: 60 },
    effects: { knowledgeRate: 0.12, cap_knowledge: 80 },
    unlocked: (s) => hasTech(s, "records") && buildingCount(s, "scribe") >= 1,
  },
  {
    id: "archives",
    name: "档案",
    tab: "culture",
    desc: "把木简和陶片集中保存，解锁档案棚。",
    costs: { knowledge: 160, wood: 120, stone: 70 },
    effects: { knowledgeRate: 0.1, cap_knowledge: 160 },
    unlocked: (s) => hasTech(s, "writing"),
  },
  {
    id: "education",
    name: "学堂",
    tab: "culture",
    desc: "让年轻人学习账册、测量和历法，解锁算筹学堂。",
    costs: { knowledge: 240, wood: 160, stone: 120, tools: 50 },
    effects: { knowledgeRate: 0.14 },
    unlocked: (s) => hasTech(s, "archives") && hasTech(s, "mathematics") && hasTech(s, "craftsmanship"),
  },
  {
    id: "mathematics",
    name: "算筹",
    tab: "culture",
    desc: "用算筹记录分配和星象，所有基础产量小幅提高。",
    costs: { knowledge: 150, wood: 120, stone: 90 },
    effects: { allRate: 0.04, cap_knowledge: 100 },
    unlocked: (s) => hasTech(s, "writing") && hasTech(s, "carpentry"),
  },
  {
    id: "coinage",
    name: "铸币",
    tab: "culture",
    desc: "用标准重量的金属片结算劳务，提高金币和贸易效率。",
    costs: { knowledge: 230, gold: 180, ore: 80, tools: 45 },
    effects: { goldRate: 0.16, cap_gold: 260 },
    unlocked: (s) => hasTech(s, "mathematics") && hasTech(s, "toolmaking"),
  },
  {
    id: "calendar",
    name: "山历",
    tab: "culture",
    desc: "用星象和气候记录安排农时、远征和祭仪。",
    costs: { knowledge: 260, food: 220, faith: 35 },
    effects: { foodRate: 0.08, faithRate: 0.08, allRate: 0.03 },
    unlocked: (s) => hasTech(s, "omens") && hasTech(s, "mathematics") && buildingCount(s, "shrine") >= 1,
  },
  {
    id: "watch",
    name: "夜哨制度",
    tab: "war",
    desc: "解锁军队、远征、木栅营地和守卫训练。",
    costs: { knowledge: 48, wood: 55 },
    effects: { armyCap: 3 },
    unlocked: (s) => buildingCount(s, "hut") >= 2,
  },
  {
    id: "fortification",
    name: "木栅防线",
    tab: "war",
    desc: "围住住处和粮仓，解锁环村栅墙。",
    costs: { knowledge: 90, wood: 130, stone: 60 },
    effects: { armyCap: 3 },
    unlocked: (s) => hasTech(s, "watch") && hasTech(s, "storage"),
  },
  {
    id: "archery",
    name: "弓术",
    tab: "war",
    desc: "训练猎手使用弓弦与草靶，解锁简易靶场并提高战力。",
    costs: { knowledge: 110, wood: 130, food: 90 },
    effects: { armyPower: 0.08 },
    unlocked: (s) => hasTech(s, "watch") && hasTech(s, "carpentry"),
  },
  {
    id: "shieldDrill",
    name: "盾列训练",
    tab: "war",
    desc: "让守卫学会以盾列推进和撤退，提高战力。",
    costs: { knowledge: 150, wood: 140, stone: 80, tools: 35 },
    effects: { armyPower: 0.1, armyCap: 2 },
    unlocked: (s) => hasTech(s, "fortification") && hasTech(s, "craftsmanship") && buildingCount(s, "barracks") >= 1,
  },
  {
    id: "signals",
    name: "烽火信号",
    tab: "war",
    desc: "用烟火和旗语联系山路队伍，解锁烽火哨塔。",
    costs: { knowledge: 190, wood: 150, stone: 160, tools: 45 },
    effects: { armyCap: 3, allRate: 0.02 },
    unlocked: (s) => hasTech(s, "archery") && hasTech(s, "mathematics") && hasTech(s, "craftsmanship"),
  },
  {
    id: "patrolRoutes",
    name: "巡逻路线",
    tab: "war",
    desc: "固定巡逻山路和林线，提高军队容量与远征准备。",
    costs: { knowledge: 220, food: 170, wood: 130, tools: 55 },
    effects: { armyCap: 4, armyPower: 0.06 },
    unlocked: (s) => hasTech(s, "signals") && hasTech(s, "craftsmanship") && s.expeditionsDone.includes("hillfort"),
  },
  {
    id: "earthworks",
    name: "土垒工事",
    tab: "war",
    desc: "在木栅外加筑土垒和石基，扩大守备空间。",
    costs: { knowledge: 260, wood: 180, stone: 240, tools: 80 },
    effects: { armyCap: 5, morale: 0.02 },
    unlocked: (s) => hasTech(s, "fortification") && hasTech(s, "quarryLifts"),
  },
  {
    id: "armsWorkshop",
    name: "军械保养",
    tab: "war",
    desc: "统一保养盾牌、箭束和刃口，解锁军械棚。",
    costs: { knowledge: 260, wood: 170, ore: 100, tools: 100 },
    effects: { armyPower: 0.12 },
    unlocked: (s) => hasTech(s, "shieldDrill") && hasTech(s, "toolmaking"),
  },
  {
    id: "smelting",
    name: "采矿",
    tab: "production",
    desc: "辨认浅层矿脉，解锁矿砂采集和斧兵训练。",
    costs: { knowledge: 220, stone: 130 },
    effects: { oreRate: 0.1 },
    unlocked: (s) => hasTech(s, "stoneTools") && buildingCount(s, "quarry") >= 2,
  },
  {
    id: "charcoal",
    name: "炭烧",
    tab: "production",
    desc: "用炭火稳定炉温，提高矿砂处理和工具制作效率。",
    costs: { knowledge: 170, wood: 180, stone: 80 },
    effects: { oreRate: 0.08, toolsRate: 0.08 },
    unlocked: (s) => hasTech(s, "smelting") && hasTech(s, "carpentry"),
  },
  {
    id: "deepMining",
    name: "竖井采矿",
    tab: "production",
    desc: "用木架和绳索深入矿脉，解锁竖井矿架。",
    costs: { knowledge: 260, wood: 220, stone: 180, tools: 90 },
    effects: { oreRate: 0.15, cap_ore: 120 },
    unlocked: (s) => hasTech(s, "charcoal") && buildingCount(s, "orepit") >= 2,
  },
  {
    id: "bellows",
    name: "风箱炉",
    tab: "production",
    desc: "改良炉膛和风箱，全面提高矿砂与工具产出。",
    costs: { knowledge: 320, wood: 220, stone: 190, ore: 130, tools: 110 },
    effects: { oreRate: 0.18, toolsRate: 0.18 },
    unlocked: (s) => hasTech(s, "deepMining") && hasTech(s, "toolmaking"),
  },
  {
    id: "omens",
    name: "星象祭仪",
    tab: "culture",
    desc: "解锁星火祭坛，星辉开始成为一种资源。",
    costs: { knowledge: 95, food: 90 },
    effects: { faithRate: 0.08 },
    unlocked: (s) => hasTech(s, "writing"),
  },
  {
    id: "myths",
    name: "山神谱系",
    tab: "culture",
    desc: "把星象、山路和祖灵故事整理成谱系，提高士气。",
    costs: { knowledge: 160, food: 120, faith: 50 },
    effects: { morale: 0.03, cap_faith: 90 },
    unlocked: (s) => hasTech(s, "omens") && buildingCount(s, "shrine") >= 1,
  },
  {
    id: "templeRites",
    name: "庙祝仪轨",
    tab: "culture",
    desc: "把守灯人的祭仪固定下来，解锁星辉庙。",
    costs: { knowledge: 240, stone: 160, faith: 120, tools: 35 },
    effects: { faithRate: 0.14, morale: 0.02 },
    unlocked: (s) => hasTech(s, "myths") && buildingCount(s, "shrine") >= 1,
  },
  {
    id: "starCharts",
    name: "星图校订",
    tab: "culture",
    desc: "校准观星记录，提高学识、星辉与远征准备效率。",
    costs: { knowledge: 360, ore: 120, faith: 160, tools: 80 },
    effects: { knowledgeRate: 0.12, faithRate: 0.12, allRate: 0.04 },
    unlocked: (s) => hasTech(s, "calendar") && hasTech(s, "templeRites") && buildingCount(s, "orepit") >= 1,
  },
  {
    id: "trailMapping",
    name: "山路测绘",
    tab: "culture",
    desc: "把远征队走过的山路绘成图册，开放更远的探索路线。",
    costs: { knowledge: 180, wood: 100, stone: 80 },
    effects: { allRate: 0.02 },
    unlocked: (s) => hasTech(s, "mathematics") && s.expeditionsDone.includes("mistwood"),
  },
  {
    id: "supplyCaravans",
    name: "补给驮队",
    tab: "culture",
    desc: "用驮队和驿点保障远征，减少长途探索压力。",
    costs: { knowledge: 260, food: 240, wood: 150, tools: 55 },
    effects: { cap_food: 180, armyCap: 3 },
    unlocked: (s) => hasTech(s, "trailMapping") && hasTech(s, "warehousing"),
  },
  {
    id: "outpostCharters",
    name: "外勤据点",
    tab: "culture",
    desc: "在远征路线上设立临时据点，扩大探索收益。",
    costs: { knowledge: 340, wood: 220, stone: 180, tools: 90, faith: 60 },
    effects: { allRate: 0.05, cap_gold: 220 },
    unlocked: (s) => hasTech(s, "supplyCaravans") && hasTech(s, "signals") && buildingCount(s, "shrine") >= 1,
  },
  {
    id: "trade",
    name: "谷路契约",
    tab: "culture",
    desc: "解锁市集，所有基础产量提高。",
    costs: { knowledge: 140, wood: 120, stone: 90 },
    effects: { allRate: 0.05 },
    unlocked: (s) => hasTech(s, "mathematics") && buildingCount(s, "granary") >= 2,
  },
  {
    id: "tradeLedgers",
    name: "商旅账册",
    tab: "culture",
    desc: "用统一账册记录商旅契约，提高市集收益。",
    costs: { knowledge: 280, gold: 220, wood: 140, tools: 60 },
    effects: { goldRate: 0.12, allRate: 0.03 },
    unlocked: (s) => hasTech(s, "trade") && hasTech(s, "coinage"),
  },
  {
    id: "iron",
    name: "黑铁刃口",
    tab: "war",
    desc: "士兵战力提高，解锁重装斧兵。",
    costs: { knowledge: 180, ore: 100, faith: 20 },
    effects: { armyPower: 0.2 },
    unlocked: (s) => hasTech(s, "smelting") && hasTech(s, "archery") && buildingCount(s, "orepit") >= 2 && buildingCount(s, "shrine") >= 1,
  },
  {
    id: "steelEdges",
    name: "淬火刃口",
    tab: "war",
    desc: "改良刃口淬火方法，大幅提高重装部队战力。",
    costs: { knowledge: 340, ore: 180, tools: 140, faith: 60 },
    effects: { armyPower: 0.22 },
    unlocked: (s) => hasTech(s, "iron") && hasTech(s, "bellows"),
  },
  {
    id: "fieldTactics",
    name: "山地战术",
    tab: "war",
    desc: "把斥候、守卫和斧兵编入固定小队，提高远征可靠性。",
    costs: { knowledge: 380, food: 240, tools: 120, faith: 80 },
    effects: { armyPower: 0.16, armyCap: 5 },
    unlocked: (s) => hasTech(s, "signals") && hasTech(s, "steelEdges"),
  },
  {
    id: "starNavigation",
    name: "星路导航",
    tab: "war",
    desc: "把星图用于夜间行军，提高高风险远征的成功准备。",
    costs: { knowledge: 460, ore: 160, faith: 180, tools: 120 },
    effects: { armyPower: 0.12, allRate: 0.04 },
    unlocked: (s) => hasTech(s, "fieldTactics") && hasTech(s, "starCharts"),
  },
  {
    id: "astrolabe",
    name: "铜制星盘",
    tab: "culture",
    desc: "解锁观星台，推进苍岭进入星图时代。",
    costs: { knowledge: 260, ore: 150, faith: 90 },
    effects: { allRate: 0.08 },
    unlocked: (s) => hasTech(s, "starCharts") && hasTech(s, "trade"),
  },
];

const jobs = [
  {
    id: "forager",
    name: "采食者",
    desc: "照看农田和野生作物，每人生产 2 粮食/秒。",
    baseCap: 0,
    effects: { foodRateFlat: 2 },
  },
  {
    id: "woodcutter",
    name: "伐木工",
    desc: "砍伐、修枝并堆放可用木料，每人生产 0.7 木材/秒。",
    baseCap: 0,
    effects: { woodRateFlat: 0.7 },
  },
  {
    id: "mason",
    name: "石匠",
    desc: "从露天岩壁取下可用石块，每人生产 0.6 石料/秒。",
    effects: { stoneRateFlat: 0.6 },
    unlocked: (s) => hasTech(s, "masonry"),
  },
  {
    id: "scribe",
    name: "书记",
    desc: "整理账册，研究古老符号。",
    effects: { knowledgeRateFlat: 0.35 },
    unlocked: (s) => hasTech(s, "records"),
  },
  {
    id: "acolyte",
    name: "守灯人",
    desc: "照看祭坛并收集星辉。",
    effects: { faithRateFlat: 0.18 },
    unlocked: (s) => hasTech(s, "omens"),
  },
  {
    id: "miner",
    name: "矿工",
    desc: "在浅层矿脉中筛出可冶炼矿砂，每人生产 0.8 矿砂/秒。",
    effects: { oreRateFlat: 0.8 },
    unlocked: (s) => hasTech(s, "smelting"),
  },
  {
    id: "artisan",
    name: "工匠",
    desc: "制作工具、修理器具并协助工坊生产，每人生产 0.55 工具/秒。",
    effects: { toolsRateFlat: 0.55 },
    unlocked: (s) => hasTech(s, "craftsmanship"),
  },
];

const units = [
  {
    id: "scout",
    name: "岭路斥候",
    desc: "轻装巡行，适合早期远征。",
    costs: { food: 28, wood: 18 },
    power: 1,
    upkeep: {},
    unlocked: (s) => hasTech(s, "watch"),
  },
  {
    id: "guard",
    name: "木盾守卫",
    desc: "防线的基础，用木盾和短矛拖住敌人。",
    costs: { food: 42, wood: 36, stone: 12 },
    power: 2.1,
    upkeep: {},
    unlocked: (s) => hasTech(s, "watch") && buildingCount(s, "barracks") >= 1,
  },
  {
    id: "archer",
    name: "山林弓手",
    desc: "熟悉林间伏击的弓手，适合中期远征。",
    costs: { food: 55, wood: 70 },
    power: 2.8,
    upkeep: {},
    unlocked: (s) => hasTech(s, "archery") && buildingCount(s, "range") >= 1,
  },
  {
    id: "spearman",
    name: "盾矛卫",
    desc: "携带盾牌和长矛的守卫，能稳定推进山路。",
    costs: { food: 75, wood: 55, stone: 35, tools: 18 },
    power: 3.4,
    upkeep: {},
    unlocked: (s) => hasTech(s, "shieldDrill"),
  },
  {
    id: "axeman",
    name: "黑铁斧兵",
    desc: "佩戴粗铁刃口，是山岭战斗的硬拳头。",
    costs: { food: 70, wood: 35, ore: 22 },
    power: 4.5,
    upkeep: {},
    unlocked: (s) => hasTech(s, "iron"),
  },
  {
    id: "starward",
    name: "星辉卫",
    desc: "接受守灯人祝祷的精锐守卫，适合高风险远征。",
    costs: { food: 100, ore: 55, tools: 40, faith: 45 },
    power: 6.2,
    upkeep: { faithRateFlat: -0.03 },
    unlocked: (s) => hasTech(s, "fieldTactics") && buildingCount(s, "temple") >= 1,
  },
];

const expeditions = [
  {
    id: "mistwood",
    name: "雾杉林",
    desc: "林间道路湿滑，但能找到大量木材和失落的标记石。",
    power: 4,
    duration: 40,
    costs: { food: 40 },
    rewards: { wood: 120, stone: 45, knowledge: 16 },
    unlocks: [],
    unlocked: (s) => hasTech(s, "watch"),
  },
  {
    id: "redpass",
    name: "赤砂隘口",
    desc: "废弃矿道仍有守巢野兽，传闻深处藏有早期炉址。",
    power: 12,
    duration: 70,
    costs: { food: 90, wood: 45 },
    rewards: { stone: 120, ore: 70, knowledge: 36 },
    unlocks: ["smelting"],
    unlocked: (s) => hasTech(s, "trailMapping") || hasTech(s, "smelting"),
  },
  {
    id: "hillfort",
    name: "山顶废垒",
    desc: "旧日石垒被藤蔓吞没，里面仍有可用工具和战术刻痕。",
    power: 18,
    duration: 90,
    costs: { food: 130, tools: 25 },
    rewards: { stone: 160, tools: 70, knowledge: 65 },
    unlocks: ["fortification"],
    unlocked: (s) => hasTech(s, "signals"),
  },
  {
    id: "oldroad",
    name: "古道关",
    desc: "山脊古道连接几处废弃驿点，适合建立长期补给线。",
    power: 28,
    duration: 125,
    costs: { food: 190, wood: 90, tools: 55 },
    rewards: { gold: 180, wood: 160, tools: 90, knowledge: 95 },
    unlocks: ["supplyCaravans"],
    unlocked: (s) => hasTech(s, "supplyCaravans"),
  },
  {
    id: "starfall",
    name: "坠星湖",
    desc: "湖底有冷光碎屑，守灯人相信那里能听见远星回声。",
    power: 24,
    duration: 110,
    costs: { food: 160, faith: 30 },
    rewards: { ore: 130, faith: 120, knowledge: 90 },
    unlocks: ["omens"],
    unlocked: (s) => hasTech(s, "templeRites"),
  },
  {
    id: "marketruins",
    name: "旧市遗址",
    desc: "石阶之间还能找到旧秤砣和契约残片。",
    power: 34,
    duration: 150,
    costs: { food: 230, gold: 90, tools: 70 },
    rewards: { gold: 320, ore: 120, knowledge: 140, faith: 70 },
    unlocks: ["trade"],
    unlocked: (s) => hasTech(s, "outpostCharters"),
  },
  {
    id: "starring",
    name: "星陨环",
    desc: "环形石阵在夜里发出冷光，只有精锐队伍能靠近。",
    power: 48,
    duration: 190,
    costs: { food: 320, faith: 130, tools: 110 },
    rewards: { ore: 240, faith: 260, knowledge: 220, gold: 180 },
    unlocks: ["starCharts"],
    unlocked: (s) => hasTech(s, "starCharts"),
  },
];

const achievements = [
  { id: "pop10", name: "十户之村", desc: "人口达到 10。", done: (s) => s.population >= 10 },
  { id: "build10", name: "初具规模", desc: "累计建造 10 座建筑。", done: (s) => totalBuildings(s) >= 10 },
  { id: "tech5", name: "墨迹未干", desc: "完成 5 项研究。", done: (s) => s.techs.length >= 5 },
  { id: "tech20", name: "百工初兴", desc: "完成 20 项研究。", done: (s) => s.techs.length >= 20 },
  { id: "army10", name: "有备无患", desc: "拥有 10 点军力。", done: (s) => armyPower(s) >= 10 },
  { id: "army50", name: "山脊军势", desc: "拥有 50 点军力。", done: (s) => armyPower(s) >= 50 },
  { id: "expedition5", name: "远路成图", desc: "完成 5 条远征路线。", done: (s) => s.expeditionsDone.length >= 5 },
  { id: "starAge", name: "星图时代", desc: "研究铜制星盘。", done: (s) => hasTech(s, "astrolabe") },
];

const randomEvents = [
  {
    id: "merchant",
    title: "谷口商队抵达",
    text: "商队愿意用打磨石片交换粮食，也带来远方消息。",
    options: [
      { label: "换取石料", costs: { food: 45 }, rewards: { stone: 75 }, log: "商队留下了整车石料。" },
      { label: "购买消息", costs: { food: 30 }, rewards: { knowledge: 30 }, log: "书记记录了商队的路线与见闻。" },
      { label: "婉拒", rewards: {}, log: "商队很快消失在山路尽头。" },
    ],
  },
  {
    id: "relaxedCaravan",
    title: "松弛商队靠岸",
    text: "一队商人说今日不赶路，愿意按心情把货匀给村里。",
    options: [
      { label: "买一批木料", costs: { gold: 18 }, rewards: { wood: 90 }, log: "松弛商队把多余木料卸在村口。" },
      { label: "换些口粮", costs: { wood: 45 }, rewards: { food: 85 }, log: "村里的木料换成了耐放口粮。" },
      { label: "只问价格", rewards: { knowledge: 10 }, log: "书记把商队的报价记进账册。" },
    ],
    unlocked: (s) => buildingCount(s, "quarry") >= 1 || buildingCount(s, "market") >= 1,
  },
  {
    id: "rain",
    title: "连夜山雨",
    text: "雨水冲毁一段围栏，也让梯田水渠充满清水。",
    options: [
      { label: "抢修围栏", costs: { wood: 35 }, rewards: { food: 80 }, log: "围栏修好了，水渠也保住了。" },
      { label: "顺势蓄水", rewards: { food: 40 }, log: "村民把雨水引进新开的浅渠。" },
    ],
  },
  {
    id: "officeTaste",
    title: "班味木匠路过",
    text: "木匠说自己只是顺手巡查，结果把松掉的梁柱全标了号。",
    options: [
      { label: "请他修梁", costs: { food: 28 }, rewards: { wood: 58, knowledge: 8 }, log: "梁柱被重新编号，木料损耗也少了些。" },
      { label: "递上账册", rewards: { knowledge: 18 }, log: "木匠留下了一套很会加班的排料法。" },
      { label: "让他早点休息", rewards: { food: 22 }, log: "木匠终于坐下吃饭，还顺手指出一处漏风。" },
    ],
  },
  {
    id: "prebuiltSign",
    title: "预制石碑送达",
    text: "几名石匠抬来一块半成品石碑，说刻什么都行，只要别太长。",
    options: [
      { label: "刻仓储规矩", costs: { stone: 24 }, rewards: { knowledge: 26 }, log: "新的仓储规矩被刻在村口石碑上。" },
      { label: "改成界桩", costs: { wood: 18 }, rewards: { stone: 54 }, log: "石碑被改成界桩，顺便清出一批碎石。" },
      { label: "先放仓边", rewards: { stone: 18 }, log: "石碑暂时靠在仓边，大家路过都会看一眼。" },
    ],
    unlocked: (s) => hasTech(s, "storage") || buildingCount(s, "storehouse") >= 1,
  },
  {
    id: "wateryForager",
    title: "水灵灵的采食队",
    text: "采食队从雾里回来，篮子很满，表情却像什么都没发生。",
    options: [
      { label: "立刻入仓", rewards: { food: 76 }, log: "新鲜野果被分拣入仓，粮食储备充实了不少。" },
      { label: "留样记录", rewards: { food: 36, knowledge: 14 }, log: "书记记录了采食路线和可食植物。" },
    ],
  },
  {
    id: "hardControlMarket",
    title: "集市被硬控片刻",
    text: "一阵铜铃声让集市安静了几息，所有人突然都愿意认真报价。",
    options: [
      { label: "采购石料", costs: { gold: 24 }, rewards: { stone: 82 }, log: "村里用很稳的价格买到一批石料。" },
      { label: "卖出余粮", costs: { food: 46 }, rewards: { gold: 38 }, log: "多余口粮换成了更灵活的金币。" },
      { label: "旁听议价", rewards: { knowledge: 16 }, log: "书记学会了几句很有用的还价话术。" },
    ],
    unlocked: (s) => buildingCount(s, "quarry") >= 1 || buildingCount(s, "market") >= 1,
  },
  {
    id: "workplaceFish",
    title: "巡逻队整理杂物",
    text: "巡逻队说只是换个地方站岗，结果把仓边杂物顺手理了一遍。",
    options: [
      { label: "清点木料", rewards: { wood: 44 }, log: "仓边散落的木料被重新收拢。" },
      { label: "清点石料", rewards: { stone: 40 }, log: "几堆碎石被归入可用库存。" },
      { label: "写成流程", rewards: { knowledge: 12 }, log: "这次整理被书记写成了新的仓边流程。" },
    ],
    unlocked: (s) => hasTech(s, "watch"),
  },
  {
    id: "omen",
    title: "夜空异光",
    text: "一道蓝白光划过岭顶，守灯人请求举行短祭。",
    options: [
      { label: "举行短祭", costs: { food: 25 }, rewards: { faith: 45 }, log: "村民在沉默中看见了同一颗星。" },
      { label: "派人记录", rewards: { knowledge: 22 }, log: "星象被刻在新木板上。" },
    ],
    unlocked: (s) => buildingCount(s, "shrine") >= 1,
  },
  {
    id: "closedDoorFriend",
    title: "道友临时闭关",
    text: "一位过路修行者借用旧棚闭关半夜，出关时留下几句含糊心得。",
    options: [
      { label: "供一顿热饭", costs: { food: 32 }, rewards: { knowledge: 34, faith: 12 }, log: "道友吃完热饭，留下了一段安神口诀。" },
      { label: "请他看星火", costs: { faith: 14 }, rewards: { knowledge: 46 }, log: "星火被重新解释，书记写满了半块木板。" },
      { label: "不打扰", rewards: { faith: 18 }, log: "闭关之处安静了一夜，守灯人说心里踏实些。" },
    ],
    unlocked: (s) => buildingCount(s, "shrine") >= 1,
  },
  {
    id: "againstWindOldMan",
    title: "逆风老者过岭",
    text: "老者背着破竹箱逆风上岭，说世道不顺时更要把路走直。",
    options: [
      { label: "赠他干粮", costs: { food: 36 }, rewards: { tools: 24, knowledge: 18 }, log: "老者收下干粮，给村里留下几枚避雨竹签。" },
      { label: "买下竹箱", costs: { wood: 34 }, rewards: { tools: 26, knowledge: 12 }, log: "竹箱里装着几件能修能改的小工具。" },
      { label: "陪他看风", rewards: { knowledge: 16 }, log: "村民学会了顺着山风判断天气。" },
    ],
    unlocked: (s) => hasTech(s, "craftsmanship") || buildingCount(s, "workshop") >= 1,
  },
  {
    id: "thunderPromise",
    title: "小天劫绕村",
    text: "远处云层滚动，声势很足，落到村边时只剩几道亮闪闪的碎光。",
    options: [
      { label: "收集碎光", costs: { stone: 24 }, rewards: { ore: 48, knowledge: 12 }, log: "守灯人收起碎光，矿工也捡到几块奇硬砂砾。" },
      { label: "记录雷纹", rewards: { knowledge: 34 }, log: "雷纹被刻进档案，之后看云更准了。" },
      { label: "稳住仓门", costs: { wood: 22 }, rewards: { food: 52 }, log: "仓门被加固，受潮口粮保住了。" },
    ],
    unlocked: (s) => buildingCount(s, "orepit") >= 1,
  },
  {
    id: "beltPeddler",
    title: "腰带摊主试货",
    text: "摊主摆出一排会响的小机关，坚持说姿势够稳，木盾也能很有气势。",
    options: [
      { label: "买机关扣", costs: { wood: 30, stone: 18 }, rewards: { tools: 34, knowledge: 12 }, log: "机关扣声音很响，但结构确实巧妙。" },
      { label: "借木盾试试", costs: { wood: 26 }, rewards: { stone: 34, knowledge: 20 }, log: "守卫试了一个姿势，全村安静了两息。" },
      { label: "只看说明", rewards: { knowledge: 14 }, log: "说明书写得很热血，书记删掉三成后才入档。" },
    ],
    unlocked: (s) => hasTech(s, "craftsmanship") || buildingCount(s, "workshop") >= 1,
  },
  {
    id: "poseTraining",
    title: "守卫姿势训练",
    text: "几名守卫练习统一举盾，动作越整齐，路过的孩子越想学。",
    options: [
      { label: "补发木盾", costs: { wood: 34 }, rewards: { knowledge: 24, gold: 18 }, log: "守卫的动作更整齐，村里士气微微上扬。" },
      { label: "改进扣带", costs: { stone: 18 }, rewards: { knowledge: 34 }, log: "盾带被重新加固，训练记录也更可靠。" },
      { label: "围观片刻", rewards: { knowledge: 10 }, log: "围观的人很克制，但大家都看得挺认真。" },
    ],
    unlocked: (s) => hasTech(s, "watch") && buildingCount(s, "barracks") >= 1 && buildingCount(s, "quarry") >= 1,
  },
  {
    id: "hotSearchGate",
    title: "山门热议",
    text: "一则山路传闻传得飞快，越传越离谱，最后变成了村里的临时公告。",
    options: [
      { label: "核对传闻", costs: { knowledge: 18 }, rewards: { gold: 44 }, log: "书记核掉了夸张部分，剩下的信息还能换钱。" },
      { label: "借势募粮", costs: { gold: 18 }, rewards: { food: 86 }, log: "传闻被讲得很稳，村民愿意多交些粮。" },
      { label: "写入简报", rewards: { knowledge: 18 }, log: "热闹被压缩成一条不显眼的简报。" },
    ],
    unlocked: (s) => (buildingCount(s, "quarry") >= 1 || buildingCount(s, "market") >= 1) && (hasTech(s, "records") || buildingCount(s, "scribe") >= 1),
  },
  {
    id: "clipMasterScribe",
    title: "剪辑书记交稿",
    text: "书记说只要把失败段落放进附录，远征记录就会显得很振奋。",
    options: [
      { label: "保留附录", costs: { knowledge: 20 }, rewards: { food: 45, gold: 22 }, log: "诚实的附录让记录更可信，也换来些赞助。" },
      { label: "重排路线图", costs: { food: 30 }, rewards: { knowledge: 42 }, log: "路线图被重排，后续远行少走了些弯路。" },
      { label: "收进档案", rewards: { knowledge: 15 }, log: "书记的剪辑手法被归档，标题被改得低调许多。" },
    ],
    unlocked: (s) => (buildingCount(s, "quarry") >= 1 || buildingCount(s, "market") >= 1) && (hasTech(s, "trailMapping") || s.expeditionsDone.length >= 1),
  },
  {
    id: "stubbornMiner",
    title: "嘴硬矿工归来",
    text: "矿工说这趟一点也不累，只是把矿镐靠在墙上时墙抖了一下。",
    options: [
      { label: "给他热饭", costs: { food: 40 }, rewards: { ore: 64, stone: 32 }, log: "矿工吃完热饭，终于承认背篓里还有矿砂。" },
      { label: "修好矿镐", costs: { wood: 28 }, rewards: { ore: 72 }, log: "矿镐被修好，矿工顺手倒出更多赤砂。" },
      { label: "听他说不累", rewards: { knowledge: 12 }, log: "书记认真记下：嘴硬不计入产量，但能计入故事。" },
    ],
    unlocked: (s) => buildingCount(s, "orepit") >= 1,
  },
  {
    id: "warehouseComedy",
    title: "仓库出现名场面",
    text: "仓库管理员发现两张标签贴反，大家沉默片刻后决定当作演练。",
    options: [
      { label: "重新贴签", rewards: { food: 30, wood: 24, stone: 20 }, log: "标签归位后，仓库多出一小批被遗忘的物资。" },
      { label: "写成制度", costs: { knowledge: 12 }, rewards: { tools: 18, gold: 22 }, log: "新制度写得很短，但大家终于看懂了。" },
    ],
    unlocked: (s) => buildingCount(s, "warehouse") >= 1,
  },
  {
    id: "quietCelebration",
    title: "低调庆功",
    text: "村里有人提议庆祝一下，最后决定只加一道菜，不挂彩旗。",
    options: [
      { label: "加一道热汤", costs: { food: 35 }, rewards: { knowledge: 28 }, log: "热汤没有声势，但大家干活更稳了。" },
      { label: "给工匠加餐", costs: { food: 48 }, rewards: { wood: 52, stone: 34 }, log: "工匠吃完加餐，连夜整理出一批可用材料。" },
      { label: "安静散会", rewards: { gold: 16 }, log: "庆功预算被省下，账册看起来很健康。" },
    ],
    unlocked: (s) => totalBuildings(s) >= 6 && buildingCount(s, "quarry") >= 1,
  },
  {
    id: "starTea",
    title: "守灯人煮茶",
    text: "守灯人煮了一壶很淡的茶，说看星不能急，喝茶也不能急。",
    options: [
      { label: "陪他守夜", costs: { food: 26 }, rewards: { faith: 52, knowledge: 18 }, log: "守夜很安静，星图上的空白少了一角。" },
      { label: "借火烘粮", costs: { faith: 12 }, rewards: { food: 70 }, log: "星火烘干了受潮粮食，仓管松了一口气。" },
      { label: "带走茶渣", rewards: { knowledge: 10 }, log: "书记认真研究茶渣，结论是今晚确实该早点睡。" },
    ],
    unlocked: (s) => buildingCount(s, "shrine") >= 1,
  },
  {
    id: "toolboxLuck",
    title: "工具箱自己好了",
    text: "工匠打开旧工具箱，发现昨晚卡住的铜扣突然能用了，没人敢问太细。",
    options: [
      { label: "全部归档", rewards: { tools: 42 }, log: "旧工具被重新归档，能用的比想象中多。" },
      { label: "拆开研究", costs: { tools: 10 }, rewards: { knowledge: 38 }, log: "工匠拆开铜扣，书记记下了结构。" },
      { label: "感谢一下", costs: { food: 24 }, rewards: { tools: 58 }, log: "工匠很认真地对工具箱点了点头。" },
    ],
    unlocked: (s) => hasTech(s, "craftsmanship") || buildingCount(s, "workshop") >= 1,
  },
];

const defaultResources = () =>
  Object.fromEntries(resources.map((resource) => [resource.id, 0]));

const baseStartResources = {
  food: 90,
  wood: 35,
  stone: 35,
  tools: 0,
  knowledge: 6,
};

const defaultState = () => ({
  started: false,
  path: null,
  difficulty: null,
  tribeName: "",
  stealth: false,
  theme: "dark",
  activeTab: "buildings",
  researchView: "pending",
  createdAt: Date.now(),
  lastSavedAt: Date.now(),
  lastTickAt: Date.now(),
  playTime: 0,
  resources: defaultResources(),
  population: 0,
  popCapBase: 0,
  buildings: {},
  techs: [],
  jobs: {
    forager: 0,
    woodcutter: 0,
    mason: 0,
    scribe: 0,
    acolyte: 0,
    miner: 0,
    artisan: 0,
  },
  army: {},
  expeditionsDone: [],
  currentExpedition: null,
  achievements: [],
  event: null,
  nextEventAt: 150,
  stats: {
    clicks: 0,
    built: 0,
    researched: 0,
    trained: 0,
    expeditions: 0,
    resourcesGained: 0,
  },
  log: ["你的族人在苍岭南麓扎下第一根木桩。"],
});

let state = loadState();
let cached = derive(state);
let autosaveTimer = null;
let announcementCheckQueued = false;
let guideCheckQueued = false;
let currentViewRefreshPending = false;

function icon(id, className = "icon") {
  return `<svg class="${className}" aria-hidden="true"><use href="#icon-${icons[id] || id}"></use></svg>`;
}

function fmt(value, digits = 0) {
  if (!Number.isFinite(value)) return "0";
  if (Math.abs(value) >= 1_000_000) return `${(value / 1_000_000).toFixed(2)}M`;
  if (Math.abs(value) >= 10_000) return `${(value / 1_000).toFixed(1)}K`;
  if (Math.abs(value) >= 1000) return Math.floor(value).toLocaleString("zh-CN");
  if (Math.abs(value) < 10 && digits > 0) return value.toFixed(digits);
  return Math.floor(value).toLocaleString("zh-CN");
}

function signed(value) {
  return `${value >= 0 ? "+" : ""}${fmt(value, Math.abs(value) < 1 ? 2 : 1)}`;
}

function rateClass(value) {
  if (Math.abs(value) < 0.005) return "neutral";
  return value > 0 ? "positive" : "negative";
}

function foodUseMult() {
  return getDifficulty().mods.foodUse || 1;
}

function effectiveRateFlat(id, value) {
  return id === "food" && value < 0 ? value * foodUseMult() : value;
}

function effectiveNegativeRate(id) {
  const raw = cached.negativeRates?.[id] || 0;
  return effectiveRateFlat(id, raw);
}

function effectivePositiveRate(id) {
  return (cached.rates?.[id] || 0) - effectiveNegativeRate(id);
}

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

function addLog(message) {
  state.log.unshift(`${new Date().toLocaleTimeString("zh-CN", { hour: "2-digit", minute: "2-digit" })} ${message}`);
  state.log = state.log.slice(0, 80);
}

function toast(message) {
  const el = document.createElement("div");
  el.className = "toast";
  el.textContent = message;
  toastRoot.appendChild(el);
  setTimeout(() => el.remove(), 2800);
}

function loadState() {
  try {
    const raw = localStorage.getItem(SAVE_KEY);
    if (!raw) return defaultState();
    const parsed = JSON.parse(raw);
    return migrate({ ...defaultState(), ...parsed });
  } catch {
    return defaultState();
  }
}

function migrate(save) {
  if (save.started && !save.difficulty) save.difficulty = "normal";
  if (save.started && !save.tribeName) save.tribeName = "苍岭部落";
  save.resources = { ...defaultResources(), ...(save.resources || {}) };
  if (!["pending", "completed"].includes(save.researchView)) save.researchView = "pending";
  save.popCapBase = defaultState().popCapBase;
  save.buildings = save.buildings || {};
  save.jobs = { ...defaultState().jobs, ...(save.jobs || {}) };
  save.army = save.army || {};
  save.techs = Array.isArray(save.techs) ? save.techs : [];
  save.expeditionsDone = Array.isArray(save.expeditionsDone) ? save.expeditionsDone : [];
  save.achievements = Array.isArray(save.achievements) ? save.achievements : [];
  save.log = Array.isArray(save.log) ? save.log : [];
  save.stats = { ...defaultState().stats, ...(save.stats || {}) };
  let derived = derive(save);
  save.population = clamp(Math.floor(save.population || 0), 0, derived.popCap);
  derived = derive(save);
  const jobCaps = derived.jobCaps;
  Object.keys(save.jobs).forEach((id) => {
    save.jobs[id] = clamp(Math.floor(save.jobs[id] || 0), 0, jobCaps[id] ?? 0);
  });
  Object.keys(save.army).forEach((id) => {
    save.army[id] = Math.max(0, Math.floor(save.army[id] || 0));
    if (save.army[id] <= 0) delete save.army[id];
  });
  normalizeAssignedPeople(save);
  save.lastTickAt = Date.now();
  return save;
}

function normalizeAssignedPeople(save) {
  const assigned = () => totalAssignedJobs(save) + armySize(save);
  const reduceJobs = () => {
    const id = Object.keys(save.jobs).find((jobId) => save.jobs[jobId] > 0);
    if (!id) return false;
    save.jobs[id] -= 1;
    return true;
  };
  const reduceArmy = () => {
    const id = Object.keys(save.army).find((unitId) => save.army[unitId] > 0);
    if (!id) return false;
    save.army[id] -= 1;
    if (save.army[id] <= 0) delete save.army[id];
    return true;
  };
  while (assigned() > save.population) {
    if (!reduceJobs() && !reduceArmy()) break;
  }
}

function saveState(silent = true) {
  state.lastSavedAt = Date.now();
  localStorage.setItem(SAVE_KEY, JSON.stringify(state));
  if (!silent) toast("存档已保存");
}

function scheduleSave() {
  clearTimeout(autosaveTimer);
  autosaveTimer = setTimeout(() => saveState(true), 200);
}

function resetGame() {
  if (!confirm("确定要清除当前村落存档吗？")) return;
  localStorage.removeItem(SAVE_KEY);
  state = defaultState();
  cached = derive(state);
  render();
}

function exportSave() {
  const code = btoa(unescape(encodeURIComponent(JSON.stringify(state))));
  openModal("导出存档", `
    <p class="item-desc">下面这段文本包含当前进度，可保存到任意地方。</p>
    <textarea readonly>${code}</textarea>
  `, [
    { label: "复制", className: "primary-btn", action: () => navigator.clipboard?.writeText(code).then(() => toast("已复制到剪贴板")) },
    { label: "关闭", className: "secondary-btn", action: closeModal },
  ]);
}

function importSave() {
  openModal("导入存档", `
    <p class="item-desc">粘贴之前导出的存档文本。导入后会覆盖当前村落。</p>
    <textarea id="import-text" placeholder="粘贴存档文本"></textarea>
  `, [
    {
      label: "导入",
      className: "primary-btn",
      action: () => {
        try {
          const raw = $("#import-text").value.trim();
          const parsed = JSON.parse(decodeURIComponent(escape(atob(raw))));
          state = migrate({ ...defaultState(), ...parsed });
          cached = derive(state);
          saveState(true);
          closeModal();
          toast("存档已导入");
          render();
        } catch {
          toast("存档文本无法读取");
        }
      },
    },
    { label: "取消", className: "secondary-btn", action: closeModal },
  ]);
}

function renderChangelog() {
  return `
    <div class="announcement-list">
      ${changelog.map((entry, index) => `
        <article class="announcement-card ${index === 0 ? "latest" : ""}">
          <div class="announcement-head">
            <span class="version-chip">v${entry.version}</span>
            <span class="cap">${entry.date}</span>
          </div>
          <h3>${entry.title}</h3>
          <ul>
            ${entry.notes.map((note) => `<li>${note}</li>`).join("")}
          </ul>
        </article>
      `).join("")}
    </div>
  `;
}

function openAnnouncements() {
  try {
    localStorage.setItem(ANNOUNCEMENT_KEY, APP_VERSION);
  } catch {
    // Ignore storage errors; the announcement can still be viewed.
  }
  openModal("版本公告", renderChangelog(), [
    { label: "知道了", className: "primary-btn", action: closeModal },
  ]);
}

function renderGuide() {
  return `
    <div class="guide-list">
      <article class="guide-card" style="--accent:${accentVars.food}">
        <h3>1. 先选难度和部落名</h3>
        <p>第一次玩建议选简单或正常。简单只让手动采集翻倍，适合先熟悉节奏。</p>
      </article>
      <article class="guide-card" style="--accent:${accentVars.wood}">
        <h3>2. 开局先稳资源</h3>
        <p>先完成无成本的住房研究，再手动采集粮食、木材和石料建小屋。学识和金币会由小屋等建筑自动产出。</p>
      </article>
      <article class="guide-card" style="--accent:${accentVars.people}">
        <h3>3. 人口需要口粮</h3>
        <p>每 1 人口消耗 1 粮食/秒；农田提供采食者岗位，采食者每人生产 2 粮食/秒。</p>
      </article>
      <article class="guide-card" style="--accent:${accentVars.knowledge}">
        <h3>4. 研究决定解锁</h3>
        <p>完成研究会解锁采石、文化建筑、军队和远征。夜哨制度完成后才会出现军队与远征。</p>
      </article>
      <article class="guide-card" style="--accent:${accentVars.spark}">
        <h3>5. 信息藏在悬停里</h3>
        <p>建筑和研究的成本、效果会在鼠标放上去时显示。需要低调时，顶部“面板”可以切到工作面板样式。</p>
      </article>
    </div>
  `;
}

function openGuide() {
  try {
    localStorage.setItem(GUIDE_KEY, APP_VERSION);
  } catch {
    // Ignore storage errors; the guide can still be viewed.
  }
  openModal("新手指引", renderGuide(), [
    { label: "知道了", className: "primary-btn", action: closeModal },
  ]);
}

function showGuideIfNeeded() {
  if (state.started || state.stealth || guideCheckQueued) return;
  let seenGuide = "";
  try {
    seenGuide = localStorage.getItem(GUIDE_KEY) || "";
  } catch {
    return;
  }
  if (seenGuide) return;
  guideCheckQueued = true;
  try {
    localStorage.setItem(GUIDE_KEY, APP_VERSION);
  } catch {
    // Ignore storage errors; avoid blocking the page.
  }
  setTimeout(() => {
    guideCheckQueued = false;
    if (!state.started && !state.stealth && !$("#modal-backdrop")) openGuide();
  }, 220);
}

function showAnnouncementIfNeeded() {
  if (!state.started || state.stealth || announcementCheckQueued) return;
  let seenVersion = "";
  try {
    seenVersion = localStorage.getItem(ANNOUNCEMENT_KEY) || "";
  } catch {
    return;
  }
  if (seenVersion === APP_VERSION) return;
  announcementCheckQueued = true;
  try {
    localStorage.setItem(ANNOUNCEMENT_KEY, APP_VERSION);
  } catch {
    // Ignore storage errors; avoid blocking the page.
  }
  setTimeout(() => {
    announcementCheckQueued = false;
    if (!state.stealth && !$("#modal-backdrop")) openAnnouncements();
  }, 250);
}

function openModal(title, body, actions) {
  closeModal();
  const backdrop = document.createElement("div");
  backdrop.className = "modal-backdrop";
  backdrop.id = "modal-backdrop";
  backdrop.innerHTML = `
    <div class="modal" role="dialog" aria-modal="true">
      <div class="panel-head">
        <div class="panel-title">${title}</div>
        <button class="icon-btn" data-action="close-modal" aria-label="关闭">×</button>
      </div>
      <div class="modal-body">${body}</div>
      <div class="modal-actions">
        ${actions.map((action, index) => `<button class="${action.className}" data-modal-action="${index}">${action.label}</button>`).join("")}
      </div>
    </div>
  `;
  document.body.appendChild(backdrop);
  actions.forEach((action, index) => {
    $(`[data-modal-action="${index}"]`, backdrop).addEventListener("click", action.action);
  });
  $("[data-action='close-modal']", backdrop).addEventListener("click", closeModal);
  backdrop.addEventListener("click", (event) => {
    if (event.target === backdrop) closeModal();
  });
}

function closeModal() {
  $("#modal-backdrop")?.remove();
}

function normalizeTribeName(name) {
  return (name || "").trim().replace(/\s+/g, " ").slice(0, 16) || "苍岭部落";
}

function nextEventDelay(s = state) {
  const interval = getDifficulty(s).mods.eventInterval || 1;
  return clamp((60 + Math.random() * 120) * interval, 60, 180);
}

function startPath(pathId) {
  const path = paths.find((item) => item.id === pathId);
  const difficultyId = state.difficulty || "normal";
  const difficulty = getDifficulty({ difficulty: difficultyId });
  const tribeName = normalizeTribeName($("#tribe-name")?.value || state.tribeName);
  state = defaultState();
  state.started = true;
  state.path = pathId;
  state.difficulty = difficultyId;
  state.tribeName = tribeName;
  state.resources = { ...defaultResources(), ...scaleResourceMap(baseStartResources, difficulty.mods.startResources) };
  state.nextEventAt = nextEventDelay(state);
  Object.entries(path.start || {}).forEach(([id, value]) => {
    state.resources[id] += Math.floor(value * difficulty.mods.startResources);
  });
  addLog(`${path.name}的长者宣布：${tribeName}从今夜开始有了名字。`);
  addLog(`难度设定为：${difficulty.name}。`);
  cached = derive(state);
  saveState(true);
  render();
  toast("旅程开始");
}

function getPath(s = state) {
  return paths.find((path) => path.id === s.path) || paths[0];
}

function getDifficulty(s = state) {
  return difficulties.find((difficulty) => difficulty.id === s.difficulty) || difficulties.find((difficulty) => difficulty.id === "normal");
}

function scaleResourceMap(map, scale = 1) {
  return Object.fromEntries(Object.entries(map).map(([id, value]) => [id, Math.floor(value * scale)]));
}

function buildingCount(s, id) {
  return s.buildings[id] || 0;
}

function totalBuildings(s) {
  return Object.values(s.buildings).reduce((sum, value) => sum + value, 0);
}

function hasTech(s, id) {
  return s.techs.includes(id);
}

function totalAssignedJobs(s) {
  return Object.values(s.jobs).reduce((sum, value) => sum + value, 0);
}

function idlePopulation(s = state) {
  return Math.floor(s.population) - totalAssignedJobs(s) - armySize(s);
}

function armySize(s = state) {
  return Object.values(s.army).reduce((sum, value) => sum + value, 0);
}

function armyCap(s = state) {
  return derive(s).armyCap;
}

function armyPower(s = state) {
  const mult = techs.reduce((sum, tech) => sum + (hasTech(s, tech.id) ? tech.effects?.armyPower || 0 : 0), 1);
  return Object.entries(s.army).reduce((sum, [id, count]) => {
    const unit = units.find((item) => item.id === id);
    return sum + (unit ? unit.power * count * mult : 0);
  }, 0);
}

function derive(s) {
  const path = getPath(s);
  const difficulty = getDifficulty(s);
  const mods = path.mods || {};
  const caps = Object.fromEntries(resources.map((resource) => [resource.id, resource.cap]));
  const positiveRates = Object.fromEntries(resources.map((resource) => [resource.id, 0]));
  const negativeRates = Object.fromEntries(resources.map((resource) => [resource.id, 0]));
  const multipliers = Object.fromEntries(resources.map((resource) => [resource.id, 1]));
  const jobCaps = Object.fromEntries(jobs.map((job) => [job.id, job.baseCap || 0]));
  let popCap = s.popCapBase;
  let armyCapValue = 0;
  let morale = 1;
  let allRate = 0;

  const applyEffects = (effects = {}, count = 1) => {
    Object.entries(effects).forEach(([key, value]) => {
      if (key.startsWith("cap_")) caps[key.slice(4)] += value * count;
      else if (key.startsWith("jobCap_")) jobCaps[key.slice(7)] = (jobCaps[key.slice(7)] || 0) + value * count;
      else if (key.endsWith("RateFlat")) {
        const id = key.replace("RateFlat", "");
        const delta = value * count;
        if (delta >= 0) positiveRates[id] += delta;
        else negativeRates[id] += delta;
      }
      else if (key === "popCap") popCap += value * count;
      else if (key === "population") popCap += value * count;
      else if (key === "armyCap") armyCapValue += value * count;
      else if (key === "morale") morale += value * count;
      else if (key === "allRate") allRate += value * count;
      else if (key.endsWith("Rate")) multipliers[key.replace("Rate", "")] += value * count;
    });
  };

  applyEffects(path.effects, 1);
  negativeRates.food -= s.population || 0;
  buildings.forEach((building) => applyEffects(building.effects, buildingCount(s, building.id)));
  techs.filter((tech) => hasTech(s, tech.id)).forEach((tech) => applyEffects(tech.effects, 1));
  jobs.filter((job) => !job.unlocked || job.unlocked(s)).forEach((job) => {
    const assigned = Math.min(s.jobs[job.id] || 0, jobCaps[job.id] ?? Infinity);
    applyEffects(job.effects, assigned);
  });
  units.forEach((unit) => applyEffects(unit.upkeep, s.army[unit.id] || 0));

  Object.entries(mods).forEach(([key, value]) => {
    if (key.endsWith("Rate")) multipliers[key.replace("Rate", "")] *= value;
  });

  const rates = Object.fromEntries(resources.map((resource) => [resource.id, 0]));
  Object.keys(rates).forEach((id) => {
    const upkeepMult = id === "food" ? difficulty.mods.foodUse * (mods.foodUse || 1) : 1;
    rates[id] = positiveRates[id] * multipliers[id] * (1 + allRate) * morale + negativeRates[id] * upkeepMult;
  });
  const starved = (s.resources.food || 0) <= 0;
  if (starved) {
    Object.keys(rates).forEach((id) => {
      if (id !== "food") rates[id] = 0;
    });
  }

  return { caps, rates, positiveRates, negativeRates, jobCaps, popCap, armyCap: armyCapValue, path, allRate, morale, starved };
}

function adjustedCost(costs, kind = "build") {
  const path = getPath();
  const difficulty = getDifficulty();
  const pathMult = kind === "build" ? path.mods?.buildCost || 1 : kind === "tech" ? path.mods?.techCost || 1 : 1;
  const difficultyMult =
    kind === "build"
      ? difficulty.mods.buildCost
      : kind === "tech"
        ? difficulty.mods.techCost
        : kind === "train"
          ? difficulty.mods.trainCost
          : kind === "expedition"
            ? difficulty.mods.expeditionCost
            : kind === "event"
              ? difficulty.mods.eventCost
              : 1;
  const mult = pathMult * difficultyMult;
  return Object.fromEntries(Object.entries(costs).map(([id, value]) => [id, Math.ceil(value * mult)]));
}

function scaledCost(item, count = 0) {
  const base = item.costs || {};
  const scaled = Object.fromEntries(Object.entries(base).map(([id, value]) => [id, Math.ceil(value * Math.pow(item.costScale || 1, count))]));
  return adjustedCost(scaled, "build");
}

function canAfford(costs) {
  return Object.entries(costs || {}).every(([id, value]) => (state.resources[id] || 0) >= value);
}

function capShortfalls(costs = {}, caps = cached.caps) {
  return Object.entries(costs)
    .filter(([id, value]) => Number.isFinite(caps[id]) && value > (caps[id] || 0))
    .map(([id, value]) => `${resourceName(id)}上限需 ${fmt(value)}，当前 ${fmt(caps[id] || 0)}`);
}

function spend(costs) {
  if (!canAfford(costs)) return false;
  Object.entries(costs || {}).forEach(([id, value]) => {
    state.resources[id] -= value;
  });
  return true;
}

function addResources(rewards) {
  const next = derive(state);
  Object.entries(rewards || {}).forEach(([id, value]) => {
    state.resources[id] = clamp((state.resources[id] || 0) + value, 0, next.caps[id] || Infinity);
    if (value > 0) state.stats.resourcesGained += value;
  });
}

function scaledRewards(rewards, scale = 1) {
  return Object.fromEntries(
    Object.entries(rewards || {}).map(([id, value]) => [id, value > 0 ? Math.max(1, Math.floor(value * scale)) : Math.ceil(value * scale)]),
  );
}

function manualGather(id) {
  const gains = { food: 1, wood: 1, stone: 1 };
  addResources({ [id]: (gains[id] || 1) * getDifficulty().mods.manualGather });
  state.stats.clicks += 1;
  scheduleSave();
  render();
}

function buyBuilding(id) {
  const item = buildings.find((building) => building.id === id);
  if (!item || !item.unlocked(state)) return;
  const count = buildingCount(state, id);
  const costs = scaledCost(item, count);
  const shortfalls = capShortfalls(costs);
  if (shortfalls.length) return toast(`需要扩容：${shortfalls[0]}`);
  if (!spend(costs)) return toast("资源不足");
  state.buildings[id] = count + 1;
  if (item.effects?.population) {
    state.population += item.effects.population;
  }
  state.stats.built += 1;
  addLog(`建成了 ${item.name}。`);
  afterMutation();
}

function research(id) {
  const item = techs.find((tech) => tech.id === id);
  if (!item || hasTech(state, id) || !item.unlocked(state)) return;
  const costs = adjustedCost(item.costs, "tech");
  const shortfalls = capShortfalls(costs);
  if (shortfalls.length) return toast(`需要扩容：${shortfalls[0]}`);
  if (!spend(costs)) return toast("资源不足");
  state.techs.push(id);
  state.stats.researched += 1;
  addLog(`完成研究：${item.name}。`);
  toast(`研究完成：${item.name}`);
  afterMutation();
}

function assignJob(id, delta) {
  const job = jobs.find((item) => item.id === id);
  if (!job || (job.unlocked && !job.unlocked(state))) return;
  const current = state.jobs[id] || 0;
  const cap = cached.jobCaps?.[id] ?? 0;
  if (delta > 0 && idlePopulation() <= 0) return toast("没有空闲人口");
  if (delta > 0 && current >= cap) return toast("岗位容量不足");
  state.jobs[id] = clamp(current + delta, 0, cap);
  afterMutation(false);
}

function trainUnit(id) {
  const unit = units.find((item) => item.id === id);
  if (!unit || !unit.unlocked(state)) return;
  if (armySize() >= cached.armyCap) return toast("军队容量不足");
  if (idlePopulation() <= 0) return toast("没有空闲人口");
  const costs = adjustedCost(unit.costs, "train");
  const shortfalls = capShortfalls(costs);
  if (shortfalls.length) return toast(`需要扩容：${shortfalls[0]}`);
  if (!spend(costs)) return toast("资源不足");
  state.army[id] = (state.army[id] || 0) + 1;
  state.stats.trained += 1;
  addLog(`训练了 ${unit.name}。`);
  afterMutation();
}

function disbandUnit(id) {
  if (!state.army[id]) return;
  state.army[id] -= 1;
  if (state.army[id] <= 0) delete state.army[id];
  addLog("一名士兵回到了村落劳作。");
  afterMutation();
}

function startExpedition(id) {
  const item = expeditions.find((expedition) => expedition.id === id);
  if (!item || state.currentExpedition) return;
  if (item.unlocked && !item.unlocked(state)) return;
  if (armyPower() < item.power) return toast("军力不足");
  const costs = adjustedCost(item.costs, "expedition");
  const shortfalls = capShortfalls(costs);
  if (shortfalls.length) return toast(`需要扩容：${shortfalls[0]}`);
  if (!spend(costs)) return toast("资源不足");
  state.currentExpedition = {
    id,
    startedAt: Date.now(),
    duration: item.duration,
    progress: 0,
  };
  addLog(`${item.name}远征队出发了。`);
  afterMutation();
}

function finishExpedition(expeditionState) {
  const item = expeditions.find((expedition) => expedition.id === expeditionState.id);
  if (!item) return;
  const difficulty = getDifficulty();
  const power = armyPower();
  const successChance = clamp(
    0.55 + (power - item.power) / Math.max(item.power * 2, 1) + difficulty.mods.expeditionChance,
    difficulty.mods.expeditionMin,
    difficulty.mods.expeditionMax,
  );
  const success = Math.random() <= successChance;
  if (success) {
    addResources(scaledRewards(item.rewards, difficulty.mods.expeditionReward));
    if (!state.expeditionsDone.includes(item.id)) state.expeditionsDone.push(item.id);
    addLog(`${item.name}远征成功，带回了稀缺物资。`);
    toast(`${item.name}远征成功`);
  } else {
    for (let i = 0; i < difficulty.mods.expeditionLoss; i += 1) {
      const lossId = Object.keys(state.army).find((id) => state.army[id] > 0);
      if (!lossId) break;
      state.army[lossId] -= 1;
      if (state.army[lossId] <= 0) delete state.army[lossId];
    }
    addLog(`${item.name}远征受挫，队伍在风雪中折返。`);
    toast("远征失败，损失了一名士兵");
  }
  state.currentExpedition = null;
  state.stats.expeditions += 1;
}

function chooseEvent(index) {
  if (!state.event) return;
  const event = randomEvents.find((item) => item.id === state.event.id);
  const option = event?.options[index];
  if (!option) return;
  const difficulty = getDifficulty();
  if (!spend(adjustedCost(option.costs || {}, "event"))) return toast("资源不足");
  addResources(scaledRewards(option.rewards || {}, difficulty.mods.eventReward));
  addLog(option.log);
  state.event = null;
  state.nextEventAt = state.playTime + nextEventDelay();
  afterMutation();
}

function afterMutation(fullRender = true) {
  cached = derive(state);
  checkAchievements();
  saveState(true);
  if (fullRender) render();
  else renderSidebarAndCurrent();
}

function checkAchievements() {
  achievements.forEach((achievement) => {
    if (!state.achievements.includes(achievement.id) && achievement.done(state)) {
      state.achievements.push(achievement.id);
      addResources({ knowledge: 10, faith: hasTech(state, "omens") ? 5 : 0 });
      toast(`成就：${achievement.name}`);
      addLog(`成就达成：${achievement.name}。`);
    }
  });
}

function tick() {
  if (!state.started) return;
  const now = Date.now();
  const elapsed = Math.min(8, Math.max(0, (now - state.lastTickAt) / 1000));
  state.lastTickAt = now;
  if (elapsed <= 0) return;
  cached = derive(state);
  const hadFood = state.resources.food > 0;
  Object.entries(cached.rates).forEach(([id, rate]) => {
    if (rate === 0) return;
    const cap = cached.caps[id] || Infinity;
    const before = state.resources[id] || 0;
    state.resources[id] = clamp(before + rate * elapsed, 0, cap);
    if (state.resources[id] > before) state.stats.resourcesGained += state.resources[id] - before;
  });

  if (state.resources.food <= 0 && hadFood) addLog("粮食耗尽，除食物外的生产全部停摆。");

  if (state.currentExpedition) {
    state.currentExpedition.progress += elapsed;
    if (state.currentExpedition.progress >= state.currentExpedition.duration) {
      finishExpedition(state.currentExpedition);
    }
  }

  state.playTime += elapsed;
  if (!state.event && state.playTime >= state.nextEventAt) {
    const choices = randomEvents.filter((event) => !event.unlocked || event.unlocked(state));
    if (choices.length) {
      state.event = { id: choices[Math.floor(Math.random() * choices.length)].id };
      addLog("新的村落事件等待处理。");
    } else {
      state.nextEventAt = state.playTime + nextEventDelay();
    }
  }

  checkAchievements();
  refreshActiveCostPreview();
  renderSidebarAndCurrent({ deferCurrentOnPreview: true });
  scheduleSave();
}

function render() {
  document.documentElement.dataset.theme = state.theme;
  document.documentElement.dataset.stealth = state.stealth ? "true" : "false";
  document.title = state.stealth ? "工作进度面板" : "苍岭纪元";
  app.innerHTML = `
    ${renderTopbar()}
    ${state.started ? renderGame() : renderStart()}
  `;
  bindEvents();
  showGuideIfNeeded();
  showAnnouncementIfNeeded();
}

function renderTopbar() {
  const themeIcon = state.theme === "dark" ? "sun" : "moon";
  const title = state.stealth ? "工作进度" : "苍岭纪元";
  const subtitle = state.stealth ? "任务与资源面板" : "山岭城邦增量策略";
  const stealthLabel = state.stealth ? "标准" : "面板";
  return `
    <header class="topbar">
      <div class="brand">
        <div>
          <div class="brand-title">${title}</div>
          <div class="brand-subtitle">${subtitle}</div>
          <div class="brand-credit">作者：打电动的七彩鲨鱼</div>
        </div>
      </div>
      <div class="top-actions">
        <button class="secondary-btn version-btn" data-action="announcements"><span>v${APP_VERSION}</span><span>公告</span></button>
        <button class="secondary-btn" data-action="guide">${icon("knowledge")}<span>指引</span></button>
        <button class="secondary-btn" data-action="stealth">${icon("spark")}<span>${stealthLabel}</span></button>
        ${state.started ? `<button class="secondary-btn" data-action="save">${icon("spark")}<span>保存</span></button>` : ""}
        ${state.started ? `<button class="secondary-btn" data-action="export">${icon("knowledge")}<span>导出</span></button>` : ""}
        <button class="secondary-btn" data-action="import">${icon("knowledge")}<span>导入</span></button>
        ${state.started ? `<button class="danger-btn" data-action="reset">${icon("army")}<span>重置</span></button>` : ""}
        <button class="icon-btn" data-action="theme" aria-label="切换主题">${icon(themeIcon)}</button>
      </div>
    </header>
  `;
}

function renderStart() {
  const selectingDifficulty = !state.difficulty;
  return `
    <main class="start-page">
      <div class="start-inner">
        <section class="hero">
          <div class="hero-media">
            <img src="./assets/map.svg" alt="苍岭地图" />
          </div>
          <div class="hero-copy">
            <div class="eyebrow">一座城邦，从山雾中醒来</div>
            <h1>苍岭纪元</h1>
            <p>分配人口，积累资源，研究古老技艺，训练远征队。你的村落会从几座苔顶小屋成长为观星城邦。</p>
            <p class="brand-credit">作者：打电动的七彩鲨鱼</p>
          </div>
        </section>
        <section>
          <div class="path-heading">
            <div>
              <h2>${selectingDifficulty ? "选择游玩难度" : "选择先民道路"}</h2>
              <p>${selectingDifficulty ? "难度会影响成本、成长、事件、远征和失败惩罚。简单只提升手动采集效率。" : `当前难度：${getDifficulty().name}。每条道路会改变早期节奏，但不会锁死后续发展。`}</p>
            </div>
            ${selectingDifficulty ? "" : `<button class="secondary-btn" data-action="difficulty-back">${icon("spark")}重选难度</button>`}
          </div>
          ${
            selectingDifficulty
              ? ""
              : `<div class="name-panel">
                  <label for="tribe-name">给部落起名字</label>
                  <input id="tribe-name" type="text" maxlength="16" value="${escapeHtml(state.tribeName || "")}" placeholder="例如：七彩鲨鱼部落" autocomplete="off" />
                  <p>最多 16 个字。留空会使用“苍岭部落”。</p>
                </div>`
          }
          <div class="${selectingDifficulty ? "difficulty-grid" : "path-grid"}">
            ${selectingDifficulty ? difficulties.map(renderDifficultyCard).join("") : paths.map(renderPathCard).join("")}
          </div>
        </section>
      </div>
    </main>
  `;
}

function renderDifficultyCard(difficulty) {
  return `
    <article class="path-card" style="--path:${difficulty.color}">
      <div class="path-card-header">
        <div class="path-icon">${icon(difficulty.icon)}</div>
        <h3>${difficulty.name}</h3>
      </div>
      <div class="path-card-body">
        <p>${difficulty.desc}</p>
        <div class="bonus-list">
          ${difficulty.notes.map((note) => `<div class="bonus">${note}</div>`).join("")}
        </div>
        <button class="primary-btn" data-action="difficulty" data-id="${difficulty.id}">${icon("spark")}选择难度</button>
      </div>
    </article>
  `;
}

function renderPathCard(path) {
  return `
    <article class="path-card" style="--path:${path.color}">
      <div class="path-card-header">
        <div class="path-icon">${icon(path.icon)}</div>
        <h3>${path.name}</h3>
      </div>
      <div class="path-card-body">
        <p>${path.desc}</p>
        <div class="bonus-list">
          ${path.bonuses.map((bonus) => `<div class="bonus">${bonus}</div>`).join("")}
        </div>
        <button class="primary-btn" data-action="start" data-id="${path.id}">${icon("spark")}进入苍岭</button>
      </div>
    </article>
  `;
}

function renderGame() {
  return `
    <main class="game-layout">
      <aside class="overview-column" id="overview-column">${renderOverview()}</aside>
      <section class="main-panel">
        ${renderTabs()}
        <div id="current-view">${renderCurrentView()}</div>
      </section>
      <aside class="sidebar" id="sidebar">${renderSidebar()}</aside>
    </main>
  `;
}

function renderSidebar() {
  const militaryUnlocked = hasTech(state, "watch");
  const difficulty = getDifficulty();
  const foodRate = cached.rates.food || 0;
  const foodPressure = effectiveNegativeRate("food");
  const visibleResources = resources.filter((resource) => !resource.unlocked || resource.unlocked(state));
  return `
    <section class="panel">
      <div class="panel-head">
        <div>
          <div class="panel-title">${icon(getPath().icon)}${state.tribeName || getPath().name}</div>
          <div class="panel-subtitle">第 ${Math.floor(state.playTime / 60) + 1} 季 · ${difficulty.name}</div>
        </div>
      </div>
      <div class="resource-list">
        ${visibleResources.map(renderResourceRow).join("")}
      </div>
    </section>
    <section class="panel">
      <div class="panel-head">
        <div class="panel-title">${icon("people")}村落</div>
      </div>
      <div class="pill-row">
        <span class="pill">人口 ${fmt(state.population)} / ${fmt(cached.popCap)}</span>
        <span class="pill">空闲 ${idlePopulation()}</span>
        <span class="pill ${rateClass(foodRate)}">粮食 ${signed(foodRate)}/秒</span>
        ${foodPressure < 0 ? `<span class="pill negative">负担 ${signed(foodPressure)}/秒</span>` : ""}
        ${
          militaryUnlocked
            ? `<span class="pill">军力 ${fmt(armyPower(), 1)}</span><span class="pill">军队 ${armySize()} / ${cached.armyCap}</span>`
            : `<span class="pill">防务 未解锁</span>`
        }
      </div>
      <div class="progress" title="居住使用率"><span style="width:${clamp((state.population / Math.max(cached.popCap, 1)) * 100, 0, 100)}%"></span></div>
    </section>
    <section class="panel">
      <div class="panel-head">
        <div class="panel-title">${icon("spark")}手动采集</div>
      </div>
      <div class="pill-row">
        <button class="secondary-btn" data-action="gather" data-id="food">${icon("food")}粮食</button>
        <button class="secondary-btn" data-action="gather" data-id="wood">${icon("wood")}木材</button>
        <button class="secondary-btn" data-action="gather" data-id="stone">${icon("stone")}石料</button>
      </div>
    </section>
  `;
}

function renderResourceRow(resource) {
  const value = state.resources[resource.id] || 0;
  const cap = cached.caps[resource.id] || resource.cap;
  const rate = cached.rates[resource.id] || 0;
  const halted = cached.starved && resource.id !== "food";
  const isFull = cap > 0 && value >= cap - 0.005;
  const isEmpty = value <= 0.005;
  const statusClass = isFull ? "full" : isEmpty ? "empty" : "";
  const statusLabel = isFull ? "已满" : isEmpty ? "为空" : "";
  return `
    <div class="resource-row ${halted ? "halted" : ""} ${statusClass}">
      <span style="color:${accentForResource(resource.id)}">${icon(resource.icon, "resource-icon")}</span>
      <div>
        <div class="resource-name">${resource.name}${statusLabel ? `<span class="resource-status">${statusLabel}</span>` : ""}</div>
        <div class="resource-rate ${rateClass(rate)}">${halted ? "停摆" : `${signed(rate)}/秒`}</div>
      </div>
      <div class="resource-value">
        ${fmt(value, 1)}
        <div class="cap">/ ${fmt(cap)}</div>
      </div>
    </div>
  `;
}

function renderTabs() {
  const tabs = visibleTabs();
  if (!tabs.some((tab) => tab.id === state.activeTab)) state.activeTab = "buildings";
  return `<nav class="tabs">${tabs.map((tab) => `<button class="tab-btn ${state.activeTab === tab.id ? "active" : ""}" style="--accent:${accentForTab(tab.id)}" data-action="tab" data-id="${tab.id}">${icon(tab.icon)}${tab.label}</button>`).join("")}</nav>`;
}

function renderCurrentView() {
  if (!isTabAvailable(state.activeTab)) state.activeTab = "buildings";
  const views = {
    buildings: renderBuildings,
    research: renderResearch,
    people: renderPeople,
    army: renderArmy,
    expedition: renderExpeditions,
    achievements: renderAchievements,
  };
  return (views[state.activeTab] || renderOverview)();
}

function tabDefinitions() {
  return [
    { id: "buildings", label: "建筑", icon: "build" },
    { id: "research", label: "研究", icon: "knowledge" },
    { id: "people", label: "人口", icon: "people" },
    { id: "army", label: "军队", icon: "army", unlocked: (s) => hasTech(s, "watch") },
    { id: "expedition", label: "远征", icon: "stone", unlocked: (s) => hasTech(s, "watch") },
    { id: "achievements", label: "成就", icon: "faith" },
  ];
}

function isTabAvailable(id, s = state) {
  const tab = tabDefinitions().find((item) => item.id === id);
  return !tab || !tab.unlocked || tab.unlocked(s);
}

function visibleTabs(s = state) {
  return tabDefinitions().filter((tab) => isTabAvailable(tab.id, s));
}

function renderOverview() {
  const militaryUnlocked = hasTech(state, "watch");
  return `
    <div class="overview-stack">
    <section>
      <div class="section-head">
        <div>
          <h2>城邦总览</h2>
          <p>状态、事件与日志。</p>
        </div>
      </div>
      <div class="stats-grid overview-stats">
        <div class="stat"><div class="stat-label">人口</div><div class="stat-value">${fmt(state.population)} / ${fmt(cached.popCap)}</div></div>
        <div class="stat"><div class="stat-label">建筑</div><div class="stat-value">${fmt(totalBuildings(state))}</div></div>
        <div class="stat"><div class="stat-label">研究</div><div class="stat-value">${fmt(state.techs.length)} / ${techs.length}</div></div>
        <div class="stat"><div class="stat-label">${militaryUnlocked ? "军力" : "防务"}</div><div class="stat-value">${militaryUnlocked ? fmt(armyPower(), 1) : "未解锁"}</div></div>
      </div>
      ${cached.starved ? `<div class="status-note negative">${icon("food")}粮食为 0，除粮食外的自动生产暂时停摆。</div>` : ""}
      ${renderStarterGoals()}
    </section>
    <section class="panel">
      <div class="panel-head">
        <div class="panel-title">${icon("spark")}村落事件</div>
      </div>
      <div class="modal-body">
        ${state.event ? renderEvent() : `<div class="empty">目前没有待处理事件。下一次事件约在 ${fmt(Math.max(0, state.nextEventAt - state.playTime))} 秒后出现。</div>`}
      </div>
    </section>
    <section class="panel">
      <div class="panel-head">
        <div class="panel-title">${icon("knowledge")}日志</div>
      </div>
      <div class="log-list overview-log">${state.log.map((entry) => `<div class="log-entry">${entry}</div>`).join("")}</div>
    </section>
    </div>
  `;
}

function renderStarterGoals() {
  if (!state.started) return "";
  const goals = [
    { text: "完成研究：住房", done: hasTech(state, "housing"), accent: accentVars.food },
    { text: "采集木材和石料，建造 1 座苔顶小屋", done: buildingCount(state, "hut") >= 1, accent: accentVars.food },
    { text: "完成研究：农耕", done: hasTech(state, "agriculture"), accent: accentVars.food },
    { text: "建造 1 座山腰农田", done: buildingCount(state, "granary") >= 1, accent: accentVars.food },
    { text: "完成研究：木材切削", done: hasTech(state, "woodcutting"), accent: accentVars.wood },
    { text: "建造 1 座山麓木场", done: buildingCount(state, "lumberyard") >= 1, accent: accentVars.wood },
    { text: "完成研究：干砌石墙", done: hasTech(state, "masonry"), accent: accentVars.stone },
    { text: "建造 1 座采石场", done: buildingCount(state, "quarry") >= 1, accent: accentVars.stone },
    { text: "建造书记棚，扩大学识上限", done: buildingCount(state, "scribe") >= 1, accent: accentVars.knowledge },
    { text: "完成研究：夜哨制度", done: hasTech(state, "watch"), accent: accentVars.army },
  ];
  if (goals.every((goal) => goal.done)) return "";
  return `
    <div class="starter-goals">
      <div class="starter-title">${icon("spark")}新手目标</div>
      ${goals.map((goal) => `
        <div class="starter-goal ${goal.done ? "done" : ""}" style="--accent:${goal.accent}">
          <span>${goal.done ? "✓" : "·"}</span>
          <p>${goal.text}</p>
        </div>
      `).join("")}
    </div>
  `;
}

function renderEvent() {
  const event = randomEvents.find((item) => item.id === state.event.id);
  if (!event) return `<div class="empty">事件已消散。</div>`;
  return `
    <article class="event-card">
      <h3>${event.title}</h3>
      <p>${event.text}</p>
      <div class="event-options">
        ${event.options.map((option, index) => {
          const afford = canAfford(adjustedCost(option.costs || {}, "event"));
          return `<button class="${afford ? "primary-btn" : "secondary-btn"}" data-action="event" data-id="${index}" ${afford ? "" : "disabled"}>${option.label}</button>`;
        }).join("")}
      </div>
    </article>
  `;
}

function renderBuildings() {
  const categories = projectCategories();
  return `
    <section>
      <div class="section-head">
        <div>
          <h2>建筑</h2>
          <p>建筑会提供上限、自动产量、人口容量和军队容量。</p>
        </div>
      </div>
      ${categories.map(([id, title]) => {
        const items = buildings.filter((building) => building.tab === id && building.unlocked(state));
        if (!items.length) return "";
        return `<div class="section-head category-head" style="--accent:${accentForCategory(id)}"><h3>${title}</h3></div><div class="item-grid">${items.map(renderBuildingCard).join("")}</div>`;
      }).join("")}
    </section>
  `;
}

function renderBuildingCard(item) {
  const count = buildingCount(state, item.id);
  const costs = scaledCost(item, count);
  const shortfalls = capShortfalls(costs);
  const afford = canAfford(costs) && !shortfalls.length;
  const badge = shortfalls.length ? "需扩容" : afford ? "可建造" : `已有 ${count}`;
  const effects = splitTipRows(effectRows(item.effects));
  const tip = renderCardTooltip({
    desc: item.desc,
    positiveTitle: "效果",
    positiveRows: effects.positive,
    negativeTitle: "成本 / 消耗",
    negativeRows: [...costRows(costs), ...effects.negative],
    warningRows: shortfallRows(costs),
  });
  return `
    <article class="item-card compact-card click-card has-tip ${afford ? "" : "unavailable locked"}" style="--accent:${accentForBuilding(item)}" data-action="build" data-id="${item.id}" role="button" tabindex="0" aria-disabled="${afford ? "false" : "true"}">
      <div class="item-title">
        <h3>${item.name}</h3>
        <span class="badge">${badge}</span>
      </div>
      <div class="compact-meta">${buildingCategoryName(item.tab)}</div>
      <div class="card-hint" aria-hidden="true">${afford ? "+" : shortfalls.length ? "!" : "…"}</div>
      ${tip}
    </article>
  `;
}

function renderResearch() {
  const visible = techs.filter((tech) => tech.unlocked(state) || hasTech(state, tech.id));
  const view = state.researchView === "completed" ? "completed" : "pending";
  const pendingCount = visible.filter((tech) => !hasTech(state, tech.id)).length;
  const completedCount = visible.length - pendingCount;
  const filtered = visible.filter((tech) => (view === "completed" ? hasTech(state, tech.id) : !hasTech(state, tech.id)));
  return `
    <section>
      <div class="section-head">
        <div>
          <h2>研究</h2>
          <p>研究会解锁更多建筑、职业、军队和远征路线。</p>
        </div>
      </div>
      <div class="subtabs" role="tablist" aria-label="研究筛选">
        <button class="subtab-btn ${view === "pending" ? "active" : ""}" data-action="research-view" data-id="pending" role="tab" aria-selected="${view === "pending"}">${icon("knowledge")}待研究 <span>${pendingCount}</span></button>
        <button class="subtab-btn ${view === "completed" ? "active" : ""}" data-action="research-view" data-id="completed" role="tab" aria-selected="${view === "completed"}">${icon("spark")}已完成 <span>${completedCount}</span></button>
      </div>
      ${projectCategories().map(([id, title]) => {
        const items = filtered.filter((tech) => (tech.tab || "culture") === id);
        if (!items.length) return "";
        return `<div class="section-head category-head" style="--accent:${accentForCategory(id)}"><h3>${title}</h3></div><div class="item-grid">${items.map(renderTechCard).join("")}</div>`;
      }).join("") || `<div class="empty">${view === "completed" ? "还没有完成的研究。" : "当前没有可研究项目。"}</div>`}
    </section>
  `;
}

function renderTechCard(item) {
  const done = hasTech(state, item.id);
  const costs = adjustedCost(item.costs, "tech");
  const shortfalls = capShortfalls(costs);
  const afford = canAfford(costs) && !shortfalls.length;
  const badge = done ? "已完成" : shortfalls.length ? "需扩容" : afford ? "可研究" : "待资源";
  const effects = splitTipRows(effectRows(item.effects));
  const tip = renderCardTooltip({
    desc: item.desc,
    positiveTitle: "效果",
    positiveRows: [...(done ? [{ label: "状态", value: "已完成" }] : []), ...effects.positive],
    negativeTitle: "成本 / 消耗",
    negativeRows: done ? [] : [...costRows(costs), ...effects.negative],
    warningRows: done ? [] : shortfallRows(costs),
  });
  return `
    <article class="item-card compact-card click-card has-tip ${done || !afford ? "unavailable locked" : ""}" style="--accent:${accentForTech(item)}" data-action="research" data-id="${item.id}" role="button" tabindex="0" aria-disabled="${done || !afford ? "true" : "false"}">
      <div class="item-title">
        <h3>${item.name}</h3>
        <span class="badge">${badge}</span>
      </div>
      <div class="compact-meta">${researchCategoryName(item.tab)}</div>
      <div class="card-hint" aria-hidden="true">${done ? "✓" : afford ? "+" : shortfalls.length ? "!" : "…"}</div>
      ${tip}
    </article>
  `;
}

function renderPeople() {
  const unlockedJobs = jobs.filter((job) => !job.unlocked || job.unlocked(state));
  return `
    <section>
      <div class="section-head">
        <div>
          <h2>人口</h2>
          <p>每 1 人口消耗 1 粮食/秒；采食者 2 粮食/秒，伐木工 0.7 木材/秒，石匠 0.6 石料/秒。</p>
        </div>
      </div>
      <div class="stats-grid compact-stats">
        <div class="stat"><div class="stat-label">总人口</div><div class="stat-value">${fmt(state.population)}</div></div>
        <div class="stat"><div class="stat-label">已分配</div><div class="stat-value">${fmt(totalAssignedJobs(state) + armySize(state))}</div></div>
        <div class="stat"><div class="stat-label">空闲</div><div class="stat-value">${fmt(idlePopulation())}</div></div>
        <div class="stat"><div class="stat-label">口粮消耗</div><div class="stat-value negative">${signed(-state.population * foodUseMult())}/秒</div></div>
        <div class="stat"><div class="stat-label">粮食净变</div><div class="stat-value ${rateClass(cached.rates.food)}">${signed(cached.rates.food || 0)}/秒</div></div>
      </div>
      <div class="panel">
        <div class="panel-head">
          <div class="panel-title">${icon("people")}职业分配</div>
          <div class="panel-subtitle">空闲 ${idlePopulation()}</div>
        </div>
        <div class="modal-body jobs">
          ${unlockedJobs.map(renderJobRow).join("")}
        </div>
      </div>
    </section>
  `;
}

function renderJobRow(job) {
  const value = state.jobs[job.id] || 0;
  const cap = cached.jobCaps?.[job.id] ?? 0;
  const perWorker = effectText(job.effects, 1);
  const totalText = value > 0 ? effectText(job.effects, value) : perWorker;
  const canAdd = idlePopulation() > 0 && value < cap;
  return `
    <div class="job-row" style="--accent:${accentForJob(job)}">
      <div>
        <strong>${job.name}</strong>
        <div class="item-desc">${job.desc}</div>
        <div class="effects">${totalText.map((text) => `<span>${text}</span>`).join(" ")}</div>
        <div class="costs">每人：${perWorker.join(" / ")}</div>
      </div>
      <div class="badge">${value} / ${cap}</div>
      <div class="stepper">
        <button data-action="job" data-id="${job.id}" data-delta="-1" ${value > 0 ? "" : "disabled"}>−</button>
        <span>${value}</span>
        <button data-action="job" data-id="${job.id}" data-delta="1" ${canAdd ? "" : "disabled"}>+</button>
      </div>
    </div>
  `;
}

function renderArmy() {
  const visible = units.filter((unit) => unit.unlocked(state));
  return `
    <section>
      <div class="section-head">
        <div>
          <h2>军队</h2>
          <p>军队会占用人口，远征需要足够军力和补给。</p>
        </div>
      </div>
      ${visible.length ? `<div class="item-grid">${visible.map(renderUnitCard).join("")}</div>` : `<div class="empty">研究夜哨制度后可以训练第一支守卫队。</div>`}
    </section>
  `;
}

function renderUnitCard(unit) {
  const count = state.army[unit.id] || 0;
  const costs = adjustedCost(unit.costs, "train");
  const shortfalls = capShortfalls(costs);
  const afford = canAfford(costs) && !shortfalls.length && armySize() < cached.armyCap && idlePopulation() > 0;
  const upkeep = splitTipRows(effectRows(unit.upkeep || {}));
  const warnings = [
    ...shortfallRows(costs),
    ...(armySize() >= cached.armyCap ? [{ label: "军队容量", value: `${fmt(armySize())} / ${fmt(cached.armyCap)}` }] : []),
    ...(idlePopulation() <= 0 ? [{ label: "空闲人口", value: "0" }] : []),
  ];
  const tip = renderCardTooltip({
    desc: unit.desc,
    positiveTitle: "效果",
    positiveRows: [{ label: "军力", value: `+${fmt(unit.power, 1)}` }, ...upkeep.positive],
    negativeTitle: "成本 / 消耗",
    negativeRows: [...costRows(costs), ...upkeep.negative],
    warningRows: warnings,
  });
  return `
    <article class="item-card compact-card has-tip" style="--accent:${accentForUnit(unit)}">
      <div class="item-title">
        <h3>${unit.name}</h3>
        <span class="badge">${count} 名</span>
      </div>
      <div class="compact-meta">人员配置</div>
      <div class="spacer"></div>
      <div class="card-actions">
        <button class="${afford ? "primary-btn" : "secondary-btn"}" data-action="train" data-id="${unit.id}" ${afford ? "" : "disabled"}>${icon("army")}训练</button>
        <button class="secondary-btn" data-action="disband" data-id="${unit.id}" ${count ? "" : "disabled"}>遣散</button>
      </div>
      ${tip}
    </article>
  `;
}

function renderExpeditions() {
  const visible = expeditions.filter((item) => !item.unlocked || item.unlocked(state) || state.expeditionsDone.includes(item.id));
  return `
    <section>
      <div class="section-head">
        <div>
          <h2>远征</h2>
          <p>远征完成后会带回大量资源，也可能损失士兵。</p>
        </div>
      </div>
      ${state.currentExpedition ? renderCurrentExpedition() : ""}
      <div class="item-grid">${visible.map(renderExpeditionCard).join("") || `<div class="empty">暂无可执行远征。</div>`}</div>
    </section>
  `;
}

function renderCurrentExpedition() {
  const item = expeditions.find((expedition) => expedition.id === state.currentExpedition.id);
  const pct = clamp((state.currentExpedition.progress / state.currentExpedition.duration) * 100, 0, 100);
  return `
    <section class="panel">
      <div class="panel-head">
        <div class="panel-title">${icon("stone")}正在远征：${item.name}</div>
        <div class="panel-subtitle">${fmt(pct)}%</div>
      </div>
      <div class="modal-body">
        <p class="item-desc">${item.desc}</p>
        <div class="progress"><span style="width:${pct}%"></span></div>
      </div>
    </section>
  `;
}

function renderExpeditionCard(item) {
  const done = state.expeditionsDone.includes(item.id);
  const difficulty = getDifficulty();
  const costs = adjustedCost(item.costs, "expedition");
  const shortfalls = capShortfalls(costs);
  const rewards = scaledRewards(item.rewards, difficulty.mods.expeditionReward);
  const chance = clamp(
    0.55 + (armyPower() - item.power) / Math.max(item.power * 2, 1) + difficulty.mods.expeditionChance,
    difficulty.mods.expeditionMin,
    difficulty.mods.expeditionMax,
  );
  const afford = canAfford(costs) && !shortfalls.length && armyPower() >= item.power && !state.currentExpedition;
  const tip = renderCardTooltip({
    desc: item.desc,
    positiveTitle: "奖励",
    positiveRows: resourceRows(rewards, { signedValues: true, emptyLabel: "无奖励" }),
    negativeTitle: "补给",
    negativeRows: costRows(costs),
    warningTitle: "条件",
    warningRows: [
      { label: "需要军力", value: fmt(item.power) },
      { label: "成功率约", value: `${fmt(chance * 100)}%` },
      { label: "耗时", value: `${item.duration} 秒` },
      ...shortfallRows(costs),
      ...(armyPower() < item.power ? [{ label: "当前军力", value: fmt(armyPower()) }] : []),
      ...(state.currentExpedition ? [{ label: "远征队", value: "忙碌" }] : []),
    ],
  });
  return `
    <article class="item-card compact-card has-tip" style="--accent:${accentVars.stone}">
      <div class="item-title">
        <h3>${item.name}</h3>
        <span class="badge">${done ? "已探索" : `军力 ${item.power}`}</span>
      </div>
      <div class="compact-meta">外勤任务</div>
      <div class="spacer"></div>
      <div class="card-actions">
        <button class="${afford ? "primary-btn" : "secondary-btn"}" data-action="expedition" data-id="${item.id}" ${afford ? "" : "disabled"}>${icon("army")}出发</button>
      </div>
      ${tip}
    </article>
  `;
}

function renderAchievements() {
  return `
    <section>
      <div class="section-head">
        <div>
          <h2>成就</h2>
          <p>成就会奖励少量学识和星辉。</p>
        </div>
      </div>
      <div class="item-grid">
        ${achievements.map((achievement) => {
          const done = state.achievements.includes(achievement.id);
          return `
            <article class="item-card ${done ? "" : "locked"}" style="--accent:${accentVars.faith}">
              <div class="item-title">
                <h3>${achievement.name}</h3>
                <span class="badge">${done ? "已达成" : "未达成"}</span>
              </div>
              <p class="item-desc">${achievement.desc}</p>
            </article>
          `;
        }).join("")}
      </div>
    </section>
  `;
}

function effectText(effects = {}, count = 1) {
  const labels = {
    popCap: "人口上限",
    population: "人口",
    growth: "人口成长",
    armyCap: "军队容量",
    morale: "民心",
    allRate: "全部产量",
    armyPower: "军队战力",
  };
  return Object.entries(effects).map(([key, value]) => {
    const total = value * count;
    if (key.startsWith("cap_")) return `${resourceName(key.slice(4))}上限 ${signed(total)}`;
    if (key.startsWith("jobCap_")) return `${jobName(key.slice(7))}岗位 ${signed(total)}`;
    if (key.endsWith("RateFlat")) {
      const id = key.replace("RateFlat", "");
      return `${resourceName(id)} ${signed(effectiveRateFlat(id, total))}/秒`;
    }
    if (key.endsWith("Rate")) return `${resourceName(key.replace("Rate", ""))}产量 ${signed(total * 100)}%`;
    if (key === "growth") return `${labels[key]} ${signed(total * 100)}%/秒`;
    if (key === "morale" || key === "allRate" || key === "armyPower") return `${labels[key]} ${signed(total * 100)}%`;
    return `${labels[key] || key} ${signed(total)}`;
  });
}

function effectRows(effects = {}, count = 1) {
  const labels = {
    popCap: "人口上限",
    population: "人口",
    growth: "人口成长",
    armyCap: "军队容量",
    morale: "民心",
    allRate: "全部产量",
    armyPower: "军队战力",
  };
  return Object.entries(effects).map(([key, value]) => {
    const total = value * count;
    if (key.startsWith("cap_")) {
      const id = key.slice(4);
      return tipRow(`${resourceName(id)}上限`, signed(total), id, total);
    }
    if (key.startsWith("jobCap_")) return tipRow(`${jobName(key.slice(7))}岗位`, signed(total), "people", total);
    if (key.endsWith("RateFlat")) {
      const id = key.replace("RateFlat", "");
      const rate = effectiveRateFlat(id, total);
      return tipRow(resourceName(id), `${signed(rate)}/秒`, id, rate);
    }
    if (key.endsWith("Rate")) {
      const id = key.replace("Rate", "");
      return tipRow(`${resourceName(id)}产量`, `${signed(total * 100)}%`, id, total);
    }
    if (key === "growth") return tipRow(labels[key], `${signed(total * 100)}%/秒`, "people", total);
    if (key === "morale" || key === "allRate" || key === "armyPower") return tipRow(labels[key], `${signed(total * 100)}%`, key === "armyPower" ? "army" : "spark", total);
    return tipRow(labels[key] || key, signed(total), "spark", total);
  });
}

function splitTipRows(rows = []) {
  return rows.reduce(
    (groups, row) => {
      groups[row.tone === "negative" ? "negative" : "positive"].push(row);
      return groups;
    },
    { positive: [], negative: [] },
  );
}

function tipRow(label, value, color = "spark", delta = 1) {
  return {
    label,
    value,
    color,
    tone: Number(delta) < 0 ? "negative" : "positive",
  };
}

function resourceRows(values = {}, options = {}) {
  const { signedValues = false, emptyLabel = "无" } = options;
  const entries = Object.entries(values || {});
  if (!entries.length) return [{ label: emptyLabel, value: "0" }];
  return entries.map(([id, value]) => ({
    label: resourceName(id),
    value: signedValues ? signed(value) : fmt(value),
    color: id,
    tone: signedValues && value < 0 ? "negative" : "positive",
  }));
}

function costRows(costs = {}) {
  if (!Object.keys(costs || {}).length) return [];
  return Object.entries(costs).map(([id, cost]) => {
    const current = state.resources[id] || 0;
    const cap = cached.caps[id] || 0;
    const rate = cached.rates[id] || 0;
    const missing = Math.max(0, cost - current);
    const capBlocked = Number.isFinite(cap) && cost > cap;
    const tone = capBlocked ? "warning" : missing > 0 ? "negative" : "positive";
    const wait = missing > 0 && rate > 0 ? Math.ceil(missing / rate) : null;
    return {
      label: resourceName(id),
      value: formatCostStatus(current, cost, missing, wait, capBlocked),
      color: id,
      tone,
      kind: "cost",
      resource: id,
      cost,
    };
  });
}

function formatCostStatus(current, cost, missing, wait = null, capBlocked = false) {
  if (capBlocked) return `${fmt(current, 1)} / ${fmt(cost)} · 需扩容`;
  if (missing > 0) return `缺${fmt(missing, 1)}`;
  return `${fmt(current, 1)} / ${fmt(cost)}`;
}

function shortfallRows(costs = {}, caps = cached.caps) {
  return Object.entries(costs)
    .filter(([id, value]) => Number.isFinite(caps[id]) && value > (caps[id] || 0))
    .map(([id, value]) => ({
      label: `${resourceName(id)}上限`,
      value: `${fmt(caps[id] || 0)} / ${fmt(value)}`,
      color: id,
      tone: "warning",
    }));
}

function renderCardTooltip(options = {}) {
  const {
    desc,
    positiveTitle = "效果",
    positiveRows = [],
    negativeTitle = "成本",
    negativeRows = [],
    warningTitle = "限制",
    warningRows = [],
  } = options;
  return `
    <div class="tip-panel" role="tooltip">
      ${desc ? `<div class="tip-desc">${escapeHtml(desc)}</div>` : ""}
      ${renderTipSection(negativeTitle, negativeRows, "negative")}
      ${renderTipSection(positiveTitle, positiveRows, "positive")}
      ${renderTipSection(warningTitle, warningRows, "warning")}
    </div>
  `;
}

function renderTipSection(title, rows = [], tone = "positive") {
  if (!rows.length) return "";
  return `
    <div class="tip-section ${tone}">
      <div class="tip-section-title">${escapeHtml(title)}</div>
      ${rows.map(renderTipRow).join("")}
    </div>
  `;
}

function renderTipRow(row) {
  const color = row.color ? accentForResource(row.color) : "var(--accent, var(--gold))";
  const attrs = [
    row.kind ? `data-kind="${escapeHtml(row.kind)}"` : "",
    row.resource ? `data-resource="${escapeHtml(row.resource)}"` : "",
    Number.isFinite(row.cost) ? `data-cost="${row.cost}"` : "",
  ].filter(Boolean).join(" ");
  return `
    <div class="tip-row tip-row-${row.tone || "neutral"}" style="--row-accent:${color}" ${attrs}>
      <span class="tip-label"><span class="tip-dot" aria-hidden="true"></span>${escapeHtml(row.label)}</span>
      <span class="tip-value">${escapeHtml(row.value)}</span>
    </div>
  `;
}

function resourceName(id) {
  const found = resources.find((resource) => resource.id === id);
  return found ? found.name : id;
}

function jobName(id) {
  const found = jobs.find((job) => job.id === id);
  return found ? found.name : id;
}

function accentForResource(id) {
  return accentVars[id] || accentVars.spark;
}

function accentForCategory(id) {
  return {
    settlement: accentVars.food,
    production: accentVars.wood,
    culture: accentVars.knowledge,
    war: accentVars.army,
  }[id] || accentVars.spark;
}

function accentForTab(id) {
  return {
    buildings: accentVars.build,
    research: accentVars.knowledge,
    people: accentVars.people,
    army: accentVars.army,
    expedition: accentVars.stone,
    achievements: accentVars.faith,
  }[id] || accentVars.spark;
}

function accentForEffects(effects = {}, fallback = "spark") {
  const keys = Object.keys(effects);
  const resourceKey = keys.find((key) => key.startsWith("cap_") || key.endsWith("RateFlat") || key.endsWith("Rate"));
  if (!resourceKey) return accentForResource(fallback);
  if (resourceKey.startsWith("cap_")) return accentForResource(resourceKey.slice(4));
  if (resourceKey.endsWith("RateFlat")) return accentForResource(resourceKey.replace("RateFlat", ""));
  if (resourceKey.endsWith("Rate")) return accentForResource(resourceKey.replace("Rate", ""));
  return accentForResource(fallback);
}

function accentForBuilding(item) {
  return accentForCategory(item.tab);
}

function accentForTech(item) {
  return accentForCategory(item.tab || "culture");
}

function accentForJob(job) {
  return accentForEffects(job.effects, "people");
}

function accentForUnit() {
  return accentVars.army;
}

function buildingCategoryName(tab) {
  return {
    settlement: "基础设施",
    production: "生产项目",
    culture: "文档项目",
    war: "安保项目",
  }[tab] || "项目";
}

function projectCategories() {
  return [
    ["settlement", "定居"],
    ["production", "生产"],
    ["culture", "文化"],
    ["war", "防务"],
  ];
}

function researchCategoryName(tab) {
  return {
    settlement: "基础研究",
    production: "生产研究",
    culture: "文档研究",
    war: "安保研究",
  }[tab] || "研究项目";
}

function bindEvents() {
  app.querySelectorAll("#current-view .has-tip").forEach((item) => {
    const flushCurrentView = () => {
      if (!currentViewRefreshPending || isCurrentViewPreviewActive()) return;
      renderSidebarAndCurrent();
    };
    item.onmouseleave = flushCurrentView;
    item.onfocusout = () => setTimeout(flushCurrentView, 0);
  });

  app.querySelectorAll("[data-action]").forEach((button) => {
    if (button.classList.contains("click-card")) {
      button.onkeydown = (event) => {
        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault();
          button.click();
        }
      };
    }
    button.onclick = () => {
      const { action, id, delta } = button.dataset;
      if (action === "theme") {
        state.theme = state.theme === "dark" ? "light" : "dark";
        saveState(true);
        render();
      }
      if (action === "stealth") {
        state.stealth = !state.stealth;
        saveState(true);
        render();
      }
      if (action === "save") saveState(false);
      if (action === "announcements") openAnnouncements();
      if (action === "guide") openGuide();
      if (action === "reset") resetGame();
      if (action === "export") exportSave();
      if (action === "import") importSave();
      if (action === "difficulty") {
        state.difficulty = id;
        state.tribeName = "";
        saveState(true);
        render();
      }
      if (action === "difficulty-back") {
        state.difficulty = null;
        saveState(true);
        render();
      }
      if (action === "start") startPath(id);
      if (action === "tab") {
        state.activeTab = id;
        saveState(true);
        render();
      }
      if (action === "research-view") {
        state.researchView = id === "completed" ? "completed" : "pending";
        saveState(true);
        render();
      }
      if (action === "gather") manualGather(id);
      if (action === "build") {
        if (button.getAttribute("aria-disabled") === "true") return;
        buyBuilding(id);
      }
      if (action === "research") {
        if (button.getAttribute("aria-disabled") === "true") return;
        research(id);
      }
      if (action === "job") assignJob(id, Number(delta));
      if (action === "train") trainUnit(id);
      if (action === "disband") disbandUnit(id);
      if (action === "expedition") startExpedition(id);
      if (action === "event") chooseEvent(Number(id));
    };
  });
}

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

function isCurrentViewPreviewActive() {
  const current = $("#current-view");
  return !!current?.querySelector(".has-tip:hover, .has-tip:focus-within");
}

function refreshActiveCostPreview() {
  const current = $("#current-view");
  current?.querySelectorAll('.tip-row[data-kind="cost"]').forEach((row) => {
    const id = row.dataset.resource;
    const cost = Number(row.dataset.cost);
    if (!id || !Number.isFinite(cost)) return;
    const currentValue = state.resources[id] || 0;
    const cap = cached.caps[id] || 0;
    const rate = cached.rates[id] || 0;
    const missing = Math.max(0, cost - currentValue);
    const capBlocked = Number.isFinite(cap) && cost > cap;
    const wait = missing > 0 && rate > 0 ? Math.ceil(missing / rate) : null;
    const tone = capBlocked ? "warning" : missing > 0 ? "negative" : "positive";
    row.classList.toggle("tip-row-positive", tone === "positive");
    row.classList.toggle("tip-row-negative", tone === "negative");
    row.classList.toggle("tip-row-warning", tone === "warning");
    const value = $(".tip-value", row);
    if (value) value.textContent = formatCostStatus(currentValue, cost, missing, wait, capBlocked);
  });
}

function renderSidebarAndCurrent(options = {}) {
  const { updateCurrent = true, deferCurrentOnPreview = false } = options;
  cached = derive(state);
  document.documentElement.dataset.theme = state.theme;
  const overview = $("#overview-column");
  const sidebar = $("#sidebar");
  const current = $("#current-view");
  if (overview) overview.innerHTML = renderOverview();
  if (sidebar) sidebar.innerHTML = renderSidebar();
  if (current && updateCurrent) {
    if (deferCurrentOnPreview && isCurrentViewPreviewActive()) {
      currentViewRefreshPending = true;
    } else {
      currentViewRefreshPending = false;
      current.innerHTML = renderCurrentView();
    }
  }
  bindEvents();
}

render();
setInterval(tick, TICK_MS);
window.addEventListener("beforeunload", () => saveState(true));
