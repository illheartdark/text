# 项目计划（plan.md）

本文件是**项目总计划**：记录项目安排、文件夹结构，以及每次项目实现前的详细计划（内容、时间），指导项目发展。
**功能：** 项目总计划：项目安排、文件夹结构、实施计划（内容、时间）
**编号：** 3

## 1. 项目安排

### 项目层级

| 层级 | 名称 | 想要实现的效果 |
|---|---|---|
| 第 1 层 | 主页面 | 选择不同的小游戏、登录个人账户等都在这里完成 |
| 第 2 层 | 游戏详情页 | 展示某一小游戏的详细信息，可选择难度等 |
| 第 3 层 | 游戏页 | 开始游戏 |

### 层级跳转

- 首页 → 点击游戏卡片 → 游戏详情页
- 详情页选择难度后点“开始游戏” → 游戏页
- 游戏页可返回详情页或首页

### 已确定细节

| 日期 | 层级 | 部分 | 确定的细节 |
|---|---|---|---|
| 2026-08-12 | 整体 | 游戏范围 | 第一款小游戏确定为贪吃蛇 |
| 2026-08-13 | 整体 | 部署上线 | 上线方案确认：GitHub Pages，一个网址全设备可玩（https://illheartdark.github.io/text/） |
| 2026-08-13 | 整体 | 登录模块 | 暂不实现登录模块，auth-entry 保持占位 |

### 实施计划

每次项目实现或更新前，必须先在本文件制定完备计划（内容、时间），确认后再开发。

**方案编写标准**（规则 13）：目标 → 问题现状与原因 → 修改文件与精确位置（含代码）→ 不要改动的部分 → 验证步骤 → 验收标准，供其他模型无需追问直接执行。

| 日期 | 计划内容 | 预计时间 | 状态 |
|---|---|---|---|
| 2026-08-13 | v0.1.0：三层网站框架 + 贪吃蛇（首页、详情页、游戏页、核心逻辑与测试） | 2026-08-13 | 已完成 |
| 2026-08-13 | 文档整合：合并网站实现计划（26）入 plan.md，删除 docs 文件夹 | 2026-08-13 | 已完成 |
| 2026-08-13 | 方向键布局修复：修正 play.html 多余闭合标签，方向键并入操作按钮组；悬浮层保留并加中心返回键；打开时操作按钮收起、触控保留；缩放淡入淡出动画 | 2026-08-13 | 已完成 |
| 2026-08-13 | 移动端适配（滑动触控＋可弹出方向键）与 GitHub Pages 部署上线 | 2026-08-13 | 已完成 |
| 2026-08-13 | 上线成功：https://illheartdark.github.io/text/ 三个页面均返回 200 | 2026-08-13 | 已完成 |
| 2026-08-13 | 修复方向键常显 bug：style.css 补回缺失选择器（.dpad:not(.dpad--open)）使默认隐藏生效；play.js 删除重复的旧版 toggleDpad | 2026-08-13 | 待开始 |
| 2026-08-13 | 方向键常显 bug 修复完成：style.css 补回 .dpad:not(.dpad--open) 选择器使默认隐藏生效；play.js 删除旧版 toggleDpad；已部署 | 2026-08-13 | 已完成 |
| 2026-08-13 | 方向键遮挡修复完成：悬浮层保留，弹出时游戏区域上移（play-stage 预留底部空间、画布等比缩小），收起恢复；已部署线上 | 2026-08-13 | 已完成 |
| 2026-08-14 | 方向键与游戏画面同步上移修复完成：.dpad 移出玻璃卡片恢复钉底；弹出时 JS 测量＋margin-top 上移（画布不缩小），收起复位 | 2026-08-14 | 已完成 |
| 2026-08-14 | 修复方向键与游戏画面重合（可执行版）：.play-stage 增加底部预留空间 padding-bottom（calc(226px + env(safe-area-inset-bottom))），卡片自动上移、画布不缩小；删除 play.js 不可靠的 shiftGameUp / margin-top 机制 | 2026-08-14 | 待开始 |

### 当前状态

- v0.1.0 已上线：三层网站框架 + 贪吃蛇，网址 https://illheartdark.github.io/text/（手机 / 电脑均可直接游玩）
- 待办：修复方向键弹出后与游戏画面重合的问题（画面未上移，可执行方案见下）

### 方向键常显 bug 修复记录（已完成）

- **原因**：style.css 中 `.dpad` 之后的隐藏样式块缺少选择器（应为 `.dpad:not(.dpad--open)`），浏览器忽略整段无效 CSS，默认隐藏从未生效，5 个按键始终显示。
- **修改**：
  - `style.css`：补回选择器，使默认隐藏（opacity 0、不可点击）与缩放淡入淡出动画生效。
  - `play.js`：删除重复的旧版 `toggleDpad`（hidden 逻辑）。
- **验证**：12 项测试通过；本地确认 CSS 默认隐藏、JS 仅保留新版开关逻辑；已推送并部署线上。

### 方向键遮挡游戏画面修复方案（已确认 · 已完成）

- **回退**：上版用 transform 移动游戏卡片的方式已回退（transform 与玻璃模糊互相干扰、实测无效），游戏画面已恢复。
- **已确认方案（用户）**：方向键悬浮层保留并弹出；方向键弹出时游戏画面向上移动，两者互不干扰。
  - `play.html`：游戏卡片外包一层 play-stage 弹性区域。
  - `style.css`：play-stage 弹性布局并居中卡片；方向键弹出时给 play-stage 增加底部预留空间，卡片在剩余空间重新居中＝整体上移；画布 max-height 等比缩小，保证完全容纳；0.2s 平滑过渡。
  - `play.js`：开关方向键时同步给 play-shell 切换 dpad-open 状态类（不再测量位置、不用 transform）。
- **验证**：手机端点「方向键」弹出后游戏画面明显上移且画布完整可见；收起后恢复；玻璃效果正常；滑动触控与桌面键盘不受影响。
- **结果**：2026-08-13 已实施并部署线上（提交 7814561），线上 CSS / JS / HTML 已验证生效。

### 方向键与游戏画面重合问题修复方案（可执行 · 待开始）

**目标**：手机端弹出方向键时，游戏画面向上移动（画布不缩小），方向键固定在屏幕底部，两者不重合；收起方向键后画面复位。

**问题现状**

- 提交 f353c2d 已把 `.dpad` 移出玻璃卡片，方向键已能固定屏幕底部；但弹出时游戏画面没有上移，仍与方向键重合。
- 原因：当前上移靠 `play.js` 的 `shiftGameUp()` 给 `#playMain` 设负 `margin-top`。该机制在 `.play-stage` 的弹性居中（`align-items: center`）布局下不可靠，且测量出的位移量接近 0，实际画面不动。

**修改文件 1：`website/src/games/snake/style.css`**

在 `.play-stage` 规则（约第 117–125 行）之后新增一条规则：

```css
/* 方向键弹出时：底部预留空间，卡片在剩余空间内自动上移，画布不缩小 */
.play-shell.dpad-open .play-stage {
  padding-bottom: calc(226px + env(safe-area-inset-bottom));
}
```

- 226px = 方向键面板约 190px + 底部间距 24px + 安全余量 12px。
- `env(safe-area-inset-bottom)` 必须与 `.dpad` 的 `bottom` 一致（当前为 `bottom: calc(24px + env(safe-area-inset-bottom))`）。
- 依赖 `.play-shell` 上有 `dpad-open` 类（由 play.js 切换，当前已存在，勿删除）。

**修改文件 2：`website/src/games/snake/play.js`**

1. 删除函数 `dpadTop()`（约第 186–188 行）。
2. 删除函数 `shiftGameUp()`（约第 190–200 行）。
3. 删除函数 `resetShift()`（约第 202–204 行）。
4. 在生效的 `setDpadOpen(open)`（约第 206–213 行，注意文件中有两个同名声明，后者生效）中删除 `if (open) shiftGameUp(); else resetShift();`，只保留类与属性切换。
5. 删除 `resize` / `orientationchange` 两个监听器（约第 215–220 行）中对 `shiftGameUp()` 的调用（建议整体删除这两个监听器）。
6. 可选清理：删除无效的旧 `setDpadOpen` 声明（约第 178–184 行），保留生效版本；`playMain` 变量在删除 `shiftGameUp` 后不再使用，可一并移除。

**不要改动的部分（已正确）**

- `play.html`：`.dpad` 已与 `.play-stage` 平级、位于 `<main class="play-main glass-card">` 之外。
- `glass.css`：`.glass-card` 的 `backdrop-filter: blur(14px)` 保留。
- `style.css`：`.play-main` / `#board` 的 `max-width: 100%` 保留；不要加回 `max-height: 100%` 压缩链。

**验证步骤（必须逐条执行并确认）**

1. 运行测试：在项目根目录执行 `node --test "website/tests/*.test.js"`，预期 12 项全部通过。
2. 本地预览：在 `website` 目录启动静态服务器（`python -m http.server`），用手机或浏览器设备模拟打开 `play.html?difficulty=normal`。
3. 手机/窄屏验证：点「方向键」→ 方向键从底部弹出，游戏画面平滑上移，两者不重合，画布大小不变；点中心「返回」→ 方向键收起，画面复位；弹出时开始/暂停/重新开始按钮隐藏，收起后恢复；画布滑动触控仍可控制方向。
4. 桌面验证：方向键按钮不显示；键盘 WASD/方向键、空格暂停、R 重新开始正常。
5. 完成后**不要自行提交**，向用户汇报结果，等待用户指示再提交。

**验收标准**

- 弹出方向键：画面向上移动、方向键在屏幕底部、两者零重合、画布像素尺寸不变。
- 收起方向键：画面完全复位。
- 触控滑动、桌面键盘、操作按钮联动正常；玻璃效果正常。

## 2. 文件夹结构

### 约定

- program1 根目录只允许新增**文件夹**，不允许新增文件。
- 每个文件夹包含 `说明.md`（声明本文件夹内容，编号见 agent.md 对照表）与 `修改日记.md`（记录本文件夹内容的修改，编号见 agent.md 对照表）。
- 说明文档只描述本文件夹的内容，修改日记只记录本文件夹的修改。

### 目录结构

```
program1/
└─ website/          网站代码（纯静态，零依赖）
   ├─ index.html     第 1 层首页
   ├─ src/
   │  ├─ styles/     全局样式（base / glass / home）
   │  ├─ components/ 可复用部件（game-card / auth-entry）
   │  ├─ pages/      页面逻辑（home.js）
   │  ├─ games/      小游戏（snake/：index 详情页、play 游戏页、core 核心逻辑）
   │  └─ shared/     公共工具（navigation / storage）
   └─ tests/         自动化测试
```

### 新增游戏流程

1. 在 `src/games/` 下新建游戏文件夹（含 `说明.md` 与 `修改日记.md`）。
2. 参照 `snake/` 的结构写页面、逻辑、样式。
3. 在首页加一张游戏卡片。

## 3. 技术方案与实现记录

### 技术方案（v0.1.0 已确认）

- 纯静态 HTML/CSS/JS，零依赖、无需安装任何包。
- 原方案为 Vite＋原生 JS；鉴于网络受限（无法安装依赖）且项目从简优先，改为纯静态实现；目录结构与代码职责不变，后续如需打包再引入 Vite。
- 页面使用普通 `<script>` 引入（非 ES 模块），双击 index.html 即可打开。
- 贪吃蛇核心逻辑 `core.js` 采用通用格式（同时兼容浏览器与 Node 测试）。

### 接口约定

- `SnakeCore.createGame({ cols, rows, difficulty })` → `{ getState, step, reset }`
  - `state`：`{ snake, direction, food, score, status, speed }`
  - `step()`：前进一格，返回 `{ ate, over }`
  - 方向键取值：`up / down / left / right`；禁止直接反向
  - `difficulty`：`easy / normal / hard`（决定初始速度）
- `storage.getBest(key)` / `storage.setBest(key, score)`：localStorage 封装
- `navigation.go(path)`：页面跳转封装

### 实现约束

- 核心逻辑采用 TDD：先写测试，确认失败，再实现，确认通过。
- 每个任务完成提交一次，提交信息遵循 git.md（4）规范。

### v0.1.0 实施明细（已完成）

- 贪吃蛇核心逻辑（TDD，9 项测试）与公共工具（storage / navigation，3 项测试）
- 全局样式（base / glass / home）与首页（index.html、home.js、game-card.js、auth-entry.js 占位）
- 贪吃蛇详情页（index.html / detail.js：玩法介绍、难度选择、开始游戏）
- 贪吃蛇游戏页（play.html / play.js / style.css：Canvas、键盘控制、计分、最高分）
- 收尾：12 项测试通过、三个页面 200、打 v0.1.0 标签

### 上线方案（已确认）

- 平台：GitHub Pages，网址 https://illheartdark.github.io/text/
- 目标：一个网址，手机 / 电脑等设备直接打开游玩
- 设备适配：① 移动端触控（滑动 / 按钮控制贪吃蛇）② 响应式布局（卡片、详情、画布自适应）
- 登录模块：暂不实现，auth-entry 保持占位
- 后续可选：绑定自定义域名、按参考图美化 UI
