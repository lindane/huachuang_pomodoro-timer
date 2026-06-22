# 番茄钟计时器（Pomodoro Timer）

一个基于 Vue3 + TypeScript + Vite + Pinia 构建的番茄钟应用，支持工作/休息倒计时自动切换、今日番茄数统计、自定义时长、键盘快捷键、Web Audio API 提示音等功能。

## 技术栈

- **Vue 3** — 组合式 API（Composition API）+ `<script setup>`
- **TypeScript** — 全链路类型安全
- **Vite** — 构建工具与开发服务器
- **Pinia** — 全局状态管理
- **Web Audio API** — 纯代码生成提示音，无需音频文件
- **LocalStorage** — 用户偏好与番茄计数持久化

---

## 项目结构

```
huachuang_pomodoro-timer/
├── src/
│   ├── components/
│   │   ├── TimerDisplay.vue      # 计时器显示组件（大字体时间 + 模式标签 + 闪烁提示）
│   │   ├── SettingsPanel.vue     # 设置面板（自定义工作/休息时长，支持点击外部关闭）
│   │   └── PomodoroStats.vue     # 今日完成番茄数统计展示
│   ├── stores/
│   │   └── timerStore.ts         # Pinia Store：计时器核心逻辑 + 状态 + 持久化 + 音效
│   ├── App.vue                   # 根组件：组装子组件、控制按钮、全局键盘快捷键
│   ├── main.ts                   # 应用入口：挂载 Pinia + 根实例
│   └── style.css                 # 全局样式（CSS reset + 背景渐变）
├── index.html
├── package.json
├── tsconfig.json
├── vite.config.ts
└── README.md
```

---

## 组件架构

项目采用 **单根组件 + 多子组件 + 单一 Store** 的分层结构：

```
                ┌──────────────────────┐
                │    Pinia Store       │
                │  (timerStore.ts)     │  ← 全局唯一状态源
                └──────────┬───────────┘
                           │
        ┌──────────────────┼──────────────────┐
        ▼                  ▼                  ▼
┌──────────────┐  ┌────────────────┐  ┌─────────────────┐
│ TimerDisplay │  │ SettingsPanel  │  │  PomodoroStats  │
│  (纯展示)    │  │ (交互+弹窗)    │  │   (纯展示)      │
└──────┬───────┘  └───────┬────────┘  └────────┬────────┘
       ▲                  ▲                     ▲
       │                  │                     │
       └──────────────────┼─────────────────────┘
                          │
                   ┌──────┴───────┐
                   │   App.vue    │  ← 组装 + 控制按钮 + 键盘监听
                   └──────────────┘
```

### App.vue — 根组件

[App.vue](src/App.vue) 是应用的组装层，职责包括：

1. **组装子组件**：在模板中依次放入 `SettingsPanel`（右上角绝对定位）、标题、`TimerDisplay`、控制按钮组、`PomodoroStats`。
2. **控制按钮绑定**：直接在模板上通过 `@click` 调用 Store 的 `timer.start()` / `timer.pause()` / `timer.reset()`，并根据 `timer.isRunning` 切换「开始 / 暂停」按钮显示。
3. **全局键盘快捷键**：通过 `onMounted` 注册 `window.addEventListener('keydown', handleKeydown)`，详见下方「核心功能实现说明」。
4. **SettingsPanel 通信**：使用 `ref<InstanceType<typeof SettingsPanel>>` 拿到子组件实例，Esc 键按下时调用其暴露的 `close()` 方法。

### TimerDisplay.vue — 计时器显示

[TimerDisplay.vue](src/components/TimerDisplay.vue) 是一个纯展示组件，它**不接收 props**，而是直接在内部调用 `useTimerStore()` 获取状态。

渲染内容分三层：
- **模式标签**：根据 `timer.mode` 渲染红色的「工作中」或绿色的「休息中」徽章。
- **大字体时间**：读取 Store 的计算属性 `timer.formattedTime`（`mm:ss` 格式），使用 `font-variant-numeric: tabular-nums` 保证数字等宽，避免跳秒时文字抖动。
- **结束闪烁提示**：当 `timer.isFinished` 为 `true` 时，渲染"休息一下吧"文字，通过 CSS `@keyframes blink` 实现 0.8s 周期的无限闪烁。

### SettingsPanel.vue — 设置面板

[SettingsPanel.vue](src/components/SettingsPanel.vue) 负责自定义工作/休息时长，内部维护 `isOpen` 状态，通过 `defineExpose` 向父组件暴露方法：

```typescript
defineExpose({ close, isOpen })  // [SettingsPanel.vue#L52-L56](src/components/SettingsPanel.vue#L52-L56)
```

交互能力：
- 点击齿轮按钮切换打开/关闭；
- 监听 `document.click` 判断是否点击了面板外部，自动关闭；
- 内置 Esc 键监听（与 App.vue 的全局 Esc 形成双重保障）；
- 提供「数字输入框 + 滑块」两种控件同时绑定同一个值，调用 Store 的 `timer.setWorkMinutes()` / `timer.setBreakMinutes()` 写入。

### timerStore.ts — Pinia 状态管理中心

[timerStore.ts](src/stores/timerStore.ts) 使用 Pinia 的 Setup 语法（函数式）定义，是整个应用的**唯一状态源**：

- 所有组件通过 `useTimerStore()` 获取同一个 Store 实例，共享状态；
- Store 封装了计时器 tick 逻辑、模式切换、localStorage 持久化、音效播放等全部业务逻辑；
- 组件只负责展示和转发用户操作，不包含业务逻辑。

---

## 状态管理（Pinia Store）

### 核心状态字段

| 字段 | 类型 | 说明 |
|---|---|---|
| `mode` | `'work' \| 'break'` | 当前模式，工作或休息 |
| `remainingSeconds` | `number` | 剩余秒数（当前模式下） |
| `isRunning` | `boolean` | 计时器是否正在运行 |
| `isFinished` | `boolean` | 是否刚结束一轮（用于显示闪烁提示） |
| `workMinutes` | `number` | 用户配置的工作时长（分钟，默认 25） |
| `breakMinutes` | `number` | 用户配置的休息时长（分钟，默认 5） |
| `todayCompleted` | `number` | 今日完成的番茄个数 |
| `statsDate` | `string` | 番茄计数所属的日期（`YYYY-MM-DD`） |

内部私有变量：
- `intervalId` — `setInterval` 返回值，用于清理计时器；
- `startTimestamp` — 本轮开始的 `Date.now()` 时间戳（ms）；
- `startRemaining` — 本轮开始时的剩余秒数基准；
- `audioCtx` — 复用的 `AudioContext` 实例。

### 计算属性（computed）

- **`formattedTime`** [[timerStore.ts#L189-L193](src/stores/timerStore.ts#L189-L193)]：将 `remainingSeconds` 格式化为 `mm:ss`，分钟和秒均补零至两位。
- **`modeLabel`** [[timerStore.ts#L195](src/stores/timerStore.ts#L195)]：根据 `mode` 返回中文标签「工作中」/「休息中」。
- **`workDurationSeconds` / `breakDurationSeconds`** [[timerStore.ts#L71-L72](src/stores/timerStore.ts#L71-L72)]：由分钟换算成秒，供倒计时使用。

### 核心方法

#### `start()` [[timerStore.ts#L207-L216](src/stores/timerStore.ts#L207-L216)]

启动计时器：
1. 若已在运行则直接返回；
2. 调用 `ensureTodayStats()` 确保日期是今天；
3. 记录开始时间戳 `startTimestamp = Date.now()` 和基准剩余秒数 `startRemaining`；
4. **立即执行一次** `tick()` 校准显示；
5. 启动 `setInterval(tick, 250)`，每 250ms 校准一次。

#### `tick()` [[timerStore.ts#L197-L205](src/stores/timerStore.ts#L197-L205)]

时间校准核心函数，**不依赖 setInterval 的调用次数**：
1. 计算从开始到现在实际经过的秒数：`elapsed = floor((Date.now() - startTimestamp) / 1000)`；
2. 计算剩余秒数：`newRemaining = max(0, startRemaining - elapsed)`；
3. 更新 `remainingSeconds`；
4. 如果归 0，调用 `onTimerEnd()` 结束本轮。

#### `pause()` [[timerStore.ts#L218-L225](src/stores/timerStore.ts#L218-L225)]

暂停计时器：清理 `setInterval`，将 `isRunning` 置为 `false`，清空 `startTimestamp`。

#### `reset()` [[timerStore.ts#L227-L234](src/stores/timerStore.ts#L227-L234)]

重置计时器：先 `pause()`，然后将模式切回 `work`、`isFinished` 置 `false`，剩余时间重置为工作时长。

#### `onTimerEnd()` [[timerStore.ts#L236-L252](src/stores/timerStore.ts#L236-L252)]

倒计时归 0 时的处理：
1. 先 `pause()` 停止；
2. 标记 `isFinished = true`（触发闪烁提示）；
3. 播放提示音 `playFinishSound()`；
4. 若当前是工作模式，将 `todayCompleted + 1` 并保存，切换到休息模式；
5. 若当前是休息模式，切回工作模式。

---

## 核心功能实现说明

### 1. Date.now() 时间校准原理

**问题背景**：浏览器将后台标签页的 `setInterval` 节流（最低可能降到 1 次/秒甚至更低），如果单纯用 `remainingSeconds--`，会出现"切到别的标签页几分钟，回来发现时间只走了几十秒"的情况。

**解决方案** [[timerStore.ts#L197-L205](src/stores/timerStore.ts#L197-L205)]：

```typescript
// start() 时记录
startTimestamp = Date.now()    // 开始时间戳（ms）
startRemaining = remainingSeconds.value  // 开始时剩余多少秒

// tick() 时计算
const elapsed = Math.floor((Date.now() - startTimestamp) / 1000)
const newRemaining = Math.max(0, startRemaining - elapsed)
```

原理非常直观：**用墙上时钟（wall-clock）计算真实经过的时间**，而不是依赖 setInterval 触发次数。即使 setInterval 被降频到每 5 秒才触发一次，每次计算的 `elapsed` 仍然是准确的 5 秒，不会丢秒。同时 `setInterval(tick, 250)` 用较小的间隔保证前台显示足够顺滑。

### 2. 工作 / 休息模式自动切换

状态流转逻辑集中在 `onTimerEnd()` [[timerStore.ts#L236-L252](src/stores/timerStore.ts#L236-L252)]：

```
工作倒计时到 0
    │
    ├─▶ todayCompleted += 1（记录一个番茄）
    ├─▶ 播放提示音
    ├─▶ isFinished = true（显示"休息一下吧"）
    └─▶ mode = 'break'，剩余时间设为休息时长 ──▶ 点击"继续"进入休息倒计时
                                                        │
休息倒计时到 0 ◀────────────────────────────────────────┘
    │
    ├─▶ 播放提示音
    ├─▶ isFinished = true
    └─▶ mode = 'work'，剩余时间设为工作时长 ──▶ 点击"继续"进入下一轮
```

### 3. 今日番茄数统计

存储结构（`localStorage` key：`pomodoro:stats`）：

```json
{ "date": "2026-06-22", "completed": 3 }
```

核心机制：
- **按日期存储**：`getTodayStr()` [[timerStore.ts#L14-L17](src/stores/timerStore.ts#L14-L17)] 生成 `YYYY-MM-DD` 格式的日期字符串；
- **自动重置**：每次 `start()` 和工作模式结束时都会调用 `ensureTodayStats()` [[timerStore.ts#L140-L147](src/stores/timerStore.ts#L140-L147)]，如果发现 `statsDate` 不是今天，就把计数清零并写入当前日期；
- **持久化**：每次计数变更后调用 `saveStats()` 写入 localStorage。

### 4. 设置面板与自定义时长持久化

数据流：
```
用户拖动滑块 / 修改输入框
        │
        ▼
SettingsPanel.onWorkInput()  ──▶  timer.setWorkMinutes(value)
                                          │
                                          ▼
                              watch([workMinutes, breakMinutes])
                                          │
                              ┌───────────┼────────────┐
                              ▼                        ▼
                        saveSettings()        如果未运行且未结束，
                     写入 localStorage         同步更新 remainingSeconds
```

- `clampMinutes()` [[timerStore.ts#L19-L21](src/stores/timerStore.ts#L19-L21)] 将输入值限制在 1–60 分钟，避免非法值；
- 读取时通过 `loadSettings()` [[timerStore.ts#L33-L47](src/stores/timerStore.ts#L33-L47)] 做容错：localStorage 不存在、JSON 解析失败、字段缺失或超出范围都会回退到默认值。

### 5. 键盘快捷键

App.vue 中通过 `onMounted` 注册全局 `keydown` 监听 [[App.vue#L18-L48](src/App.vue#L18-L48)]：

| 按键 | 行为 |
|---|---|
| **空格** | 切换开始/暂停 |
| **R** | 重置计时器 |
| **Esc** | 若设置面板打开则关闭面板 |

**防止输入框误触发**：`isInputTarget()` [[App.vue#L11-L16](src/App.vue#L11-L16)] 检查事件目标是否是 `<input>` / `<textarea>` / 可编辑元素，如果是则直接 return，避免用户在设置面板中输入数字时被快捷键打断。

### 6. Web Audio API 三连音提示音

完全使用 `OscillatorNode` 生成，无需任何音频文件 [[timerStore.ts#L104-L138](src/stores/timerStore.ts#L104-L138)]。

**实现步骤**：
1. 创建 `AudioContext`（兼容 `webkitAudioContext`），复用同一个实例避免反复创建；
2. 每次"嘀"由一个 `OscillatorNode` + 一个 `GainNode` 组成：
   - 波形类型 `sine`（正弦波，音色柔和）；
   - 频率 880Hz（标准音高 A5）；
   - 音量通过 GainNode 的 `linearRampToValueAtTime` 做淡入淡出，避免爆破音；
3. 三个"嘀"的开始时间分别为 `now`、`now + 0.25s`、`now + 0.5s`，每声 150ms，间隔 100ms，总时长约 0.65s；
4. 若 AudioContext 处于 `suspended` 状态（浏览器自动挂起以节省资源），调用 `ctx.resume()` 恢复。

---

## 数据持久化方案

项目使用浏览器 `localStorage` 存储两类数据，均做了完整的容错处理（try/catch 包裹、默认值回退）。

### 存储概览

| Key | 结构 | 写入时机 | 读取时机 |
|---|---|---|---|
| `pomodoro:settings` | `{ workMinutes, breakMinutes }` | 工作/休息时长变更时（watch 回调） | 应用启动时 `loadSettings()` |
| `pomodoro:stats` | `{ date, completed }` | 每次工作模式结束 +1、日期变更清零时 | 应用启动时 `loadStats()` |

### 容错处理

- **JSON 解析失败**：`localStorage` 中值被手动篡改或为空时，`JSON.parse` 会抛异常，外层 try/catch 捕获后返回默认值；
- **字段缺失 / 非法值**：使用 `??` 运算符回退到默认值，并用 `clampMinutes()` / `Math.max(0, ...)` 将数值限制在合法范围；
- **按日期自动重置**：番茄统计始终与日期一起存储，应用启动时对比当前日期，不匹配则自动清零。

---

## 运行方式

### 安装依赖

```bash
npm install
```

### 启动开发服务器

```bash
npm run dev
```

默认访问 [http://localhost:5173/](http://localhost:5173/)。

### 构建生产版本

```bash
npm run build
```

构建产物输出到 `dist/` 目录。

### 本地预览生产构建

```bash
npm run preview
```

### 类型检查

```bash
npx vue-tsc --noEmit
```
