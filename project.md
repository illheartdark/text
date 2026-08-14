# 项目说明（project.md）

**功能：** 详细介绍项目各部分的技术、用途与应实现的效果；项目约定、接口与实现 / 修复记录。
**编号：** 27

## 1. 项目概览

- 名称：小游戏乐园（贪吃蛇网站）
- 形态：三层小游戏网站（首页 → 游戏详情页 → 游戏页）
- 现状：v0.2.1 已上线（设置与主题 + 层级化返回导航），网址 https://illheartdark.github.io/text/（手机 / 电脑均可直接打开游玩）
- 总体技术：纯静态 HTML / CSS / JavaScript，零依赖、无需安装任何包；页面使用普通 `<script>` 引入，双击 index.html 即可打开
- 计划与进度：见 plan.md（3）；本文件只描述项目本身

## 2. 项目层级与跳转

| 层级 | 名称 | 想要实现的效果 |
|---|---|---|
| 第 1 层 | 主页面 | 选择不同的小游戏、登录个人账户等都在这里完成 |
| 第 2 层 | 游戏详情页 | 展示某一小游戏的详细信息，可选择难度等 |
| 第 3 层 | 游戏页 | 开始游戏 |

- 首页 → 点击游戏卡片 → 游戏详情页
- 详情页选择难度后点「开始游戏」 → 游戏页
- 游戏页可返回详情页或首页

## 3. 已确定细节

| 日期 | 层级 | 部分 | 确定的细节 |
|---|---|---|---|
| 2026-08-12 | 整体 | 游戏范围 | 第一款小游戏确定为贪吃蛇 |
| 2026-08-13 | 整体 | 部署上线 | 上线方案确认：GitHub Pages，一个网址全设备可玩（https://illheartdark.github.io/text/） |
| 2026-08-13 | 整体 | 登录模块 | 暂不实现登录模块，auth-entry 保持占位 |

## 4. 各部分的技术与应实现效果

### 4.1 首页（第 1 层 · 游戏大厅）

- 位置：`website/index.html`、`src/pages/home.js`、`src/components/game-card.js`、`auth-entry.js`、`src/styles/home.css`
- 技术：静态 HTML + 玻璃拟态 CSS + 原生 JS 渲染卡片列表
- 应实现效果：标题「小游戏乐园」；游戏卡片网格（卡片带鼠标跟随倾斜动效）；右上角入口（当前为「登录」占位，规划改为「设置」）；彩色线条光影玻璃背景；手机自适应

### 4.2 游戏详情页（第 2 层 · 贪吃蛇详情）

- 位置：`website/src/games/snake/index.html`、`detail.js`
- 技术：静态页面 + 原生 JS
- 应实现效果：玩法介绍；难度选择（easy / normal / hard）；「开始游戏」按钮（带难度参数跳转游戏页）；返回首页

### 4.3 游戏页（第 3 层 · 贪吃蛇本体）

- 位置：`website/src/games/snake/play.html`、`play.js`、`core.js`、`style.css`
- 技术：Canvas 2D 渲染 + 原生 JS；`core.js` 为纯逻辑（不依赖页面，可在 Node 下测试）
- 应实现效果：20×20 棋盘；蛇移动、吃食物、撞墙 / 撞自身结束；计分与最高分（localStorage）；键盘控制（方向键 / WASD、空格暂停、R 重开）；移动端滑动触控 + 可弹出方向键（中心「返回」键收起，弹出时操作按钮收起、游戏画面整体上移不遮挡）；暂停 / 继续 / 重新开始按钮

### 4.4 公共工具

- `src/shared/storage.js`：localStorage 封装（最高分读写）
- `src/shared/navigation.js`：页面跳转封装（go / goBack / back / home），含层级化返回导航——sessionStorage 维护 nav.path、返回链接弹栈回退、直达兜底 replace

### 4.5 样式系统

- `src/styles/base.css`：全局变量、页面重置、字体
- `src/styles/glass.css`：玻璃拟态——彩色线条光影背景、毛玻璃卡片（`.glass-card` 使用 `backdrop-filter`）
- `src/styles/home.css`：首页布局

### 4.6 自动化测试

- `tests/snake-core.test.js`：贪吃蛇核心逻辑（9 项）
- `tests/shared.test.js`：storage / navigation（含层级化返回导航，11 项）
- 运行：`node --test "website/tests/*.test.js"`（12 项全部通过）

### 4.7 设置与主题（v0.2.0 已实现）

- 位置：`website/settings/settings.js`（UMD 核心）、`settings.css`（面板与预览样式）、`website/themes/`（注册表 + 各主题清单与壁纸）
- 入口：首页右上角「设置」按钮（替换原「登录」占位，auth-entry.js 已删除）；设置入口仅首页，详情 / 游戏页只执行主题应用
- 面板：树形层级导航（设置 → 账户 / 主题 → 主题列表 → 调整画面），左上返回箭头出栈、栈空关闭，Esc / 遮罩可关闭；手机全屏覆盖层、电脑居中弹窗，从右上角缩放 + 淡入展开
- 账户区块：圆形头像 + 昵称（未登录）+ 敬请期待，仅 UI；数据源接口留给登录模块
- 主题协议：`themes/index.json` 注册表 + `<themeId>/theme.json` 清单（id / name / preview / mobile / desktop / cssVars）；新增主题三步接入（建文件夹 + 清单 + 登记）不碰代码；「识别本地文件」运行时重读注册表与清单并校验图片
- 应用与持久化：按设备（触控能力 / 宽度判定 phone 或 desktop）选择对应图片与 cssVars 应用到全站；localStorage 键 `settings.theme`（{id, device}）与 `settings.crop.<主题id>.<设备>`（{x, y, scale}，x/y 限制 ±(scale-1)/2、scale 1-4）
- 调整画面：视框按设备背景比例，电脑拖拽 / 滚轮 / 滑块缩放，手机单指拖动 / 双指缩放；最终效果预览实时刷新；手机全屏预览、电脑弹窗预览
- 示例主题：aurora（程序生成的渐变壁纸，手机 / 电脑分图 + 缩略图）；glass 为默认兜底（无图片，沿用玻璃拟态样式）
- 全站生效：settings.js 在三个层级页面均引用（页面内声明 THEMES_BASE 基准路径：首页 `themes/`，src 下 `../../themes/`）；本地 file:// 打开时 fetch 被浏览器禁止，保持默认玻璃主题

## 5. 文件夹结构

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

## 6. 技术方案与实现记录

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
- `navigation.go(path)` / `goBack()`：前向跳转与浏览器返回；`back(parentUrl)` / `home(homeUrl)`：层级化返回（弹栈回退 / 一次退根，直达兜底 replace）

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

## 7. 修复与变更记录（已完成）

### 方向键常显 bug 修复记录

- **原因**：style.css 中 `.dpad` 之后的隐藏样式块缺少选择器（应为 `.dpad:not(.dpad--open)`），浏览器忽略整段无效 CSS，默认隐藏从未生效，5 个按键始终显示。
- **修改**：
  - `style.css`：补回选择器，使默认隐藏（opacity 0、不可点击）与缩放淡入淡出动画生效。
  - `play.js`：删除重复的旧版 `toggleDpad`（hidden 逻辑）。
- **验证**：12 项测试通过；本地确认 CSS 默认隐藏、JS 仅保留新版开关逻辑；已推送并部署线上。

### 方向键遮挡游戏画面修复记录

- **回退**：上版用 transform 移动游戏卡片的方式已回退（transform 与玻璃模糊互相干扰、实测无效），游戏画面已恢复。
- **已确认方案（用户）**：方向键悬浮层保留并弹出；方向键弹出时游戏画面向上移动，两者互不干扰。
  - `play.html`：游戏卡片外包一层 play-stage 弹性区域。
  - `style.css`：play-stage 弹性布局并居中卡片；方向键弹出时给 play-stage 增加底部预留空间，卡片在剩余空间重新居中＝整体上移；画布 max-height 等比缩小，保证完全容纳；0.2s 平滑过渡。
  - `play.js`：开关方向键时同步给 play-shell 切换 dpad-open 状态类（不再测量位置、不用 transform）。
- **验证**：手机端点「方向键」弹出后游戏画面明显上移且画布完整可见；收起后恢复；玻璃效果正常；滑动触控与桌面键盘不受影响。
- **结果**：2026-08-13 已实施并部署线上（提交 7814561），线上 CSS / JS / HTML 已验证生效。

### 方向键与游戏画面重合问题修复记录

- **问题现状**：提交 f353c2d 已把 `.dpad` 移出玻璃卡片，方向键已能固定屏幕底部；但弹出时游戏画面没有上移，仍与方向键重合。原因：`shiftGameUp()` 给 `#playMain` 设负 `margin-top`，在弹性居中布局下不可靠，位移量接近 0。
- **修改**：`.play-stage` 增加底部预留空间（`padding-bottom: calc(226px + env(safe-area-inset-bottom))`），卡片在剩余空间自动上移、画布不缩小；删除 play.js 的 `dpadTop` / `shiftGameUp` / `resetShift` 与对应监听。
- **结果**：2026-08-14 已实施（提交 3a8334c），本地 12 项测试通过、页面 200，线上已生效；手机实测待用户确认。

### 设置与主题功能实现记录（v0.2.0）

- **目标**：首页设置入口 + 树形面板（账户 UI / 主题）+ 主题按「主题 × 设备」分图与框选调整 + 持久化 + 新主题免代码接入。
- **实现**：新增 website/settings/（settings.js、settings.css）与 website/themes/（index.json、glass 默认主题、aurora 示例主题）；首页「登录」改「设置」入口并删除 auth-entry.js；详情 / 游戏页接入主题应用；主题清单协议、识别本地文件、框选交互与预览、localStorage 持久化。
- **测试**：新增 tests/settings.test.js 6 项（normalizeCrop / cropKey / parseStoredTheme / getSavedTheme），与既有 12 项合计 18 项全部通过。
- **结果**：2026-08-15 本地 16 个页面 / 资源全部 200，已上线 GitHub Pages；提交记录见 git.md（4）。

### 层级化返回导航修复记录（v0.2.1）

- **目标**：任何时刻按返回（页面箭头或设备 / 浏览器返回）只回到上一级或退出站点，历史栈不出现重复站点记录。
- **实现**：navigation.js 扩展——sessionStorage 键 nav.path 保存层级路径；页面加载 track() 自动维护（同源追加 / 截断，直达 / 异源重置，追加时丢弃乱序记录）；back(parentUrl) 弹栈 + history.back()、直达兜底 replace；home(homeUrl) 按路径位置 history.go(-位置) 一次退根、直达兜底 replace；a[data-nav="back|home"] 自动绑定；详情页 / 游戏页三个返回链接接入。
- **测试**：shared.test.js 新增 8 项导航测试（identifyPage / normalizePath / track / back / home），合计 26 项全部通过；plan.md 5 条验证流程 Node 模拟全部符合。
- **结果**：2026-08-15 已上线 GitHub Pages；提交记录见 git.md（4）。
