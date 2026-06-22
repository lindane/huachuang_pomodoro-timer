# 番茄钟 (Pomodoro Timer)

基于 Vue 3 + TypeScript + Pinia 的番茄工作法计时器，支持工作/休息双模式切换、键盘快捷键、提示音效和今日完成统计。

## 技术栈

- **框架**: Vue 3 (Composition API + `<script setup>`)
- **语言**: TypeScript
- **状态管理**: Pinia
- **构建工具**: Vite 8
- **样式**: Scoped CSS

## 项目结构

```
huachuang_pomodoro-timer/
├── index.html                      # 入口 HTML
├── package.json                    # 依赖与脚本
├── tsconfig.json                   # TypeScript 配置
├── vite.config.ts                  # Vite 配置
└── src/
    ├── main.ts                     # 应用入口，挂载 Pinia 与 Vue
    ├── App.vue                     # 根组件，键盘快捷键绑定与布局
    ├── style.css                   # 全局样式（Reset + 背景渐变）
    ├── stores/
    │   └── timerStore.ts           # 核心状态管理（计时器、模式、统计数据）
    └── components/
        ├── TimerDisplay.vue        # 时间展示组件（模式标签、倒计时、完成提示）
        ├── SettingsPanel.vue       # 设置面板（工作时长/休息时长配置）
        └── PomodoroStats.vue       # 统计组件（今日完成番茄数）
```

## 组件架构

```
App.vue
├── SettingsPanel.vue    # 设置面板（右上角齿轮按钮，弹出面板）
├── TimerDisplay.vue     # 时间展示（模式标签 + 倒计时数字 + 完成提示）
└── PomodoroStats.vue     # 今日统计（番茄图标 + 完成数）
```

**数据流**: 所有组件通过 `useTimerStore()` 共享同一个 Pinia Store 实例，组件直接读写 Store 中的响应式状态，无需 props/emit 传递。

## 核心功能

### 1. 工作/休息双模式自动切换

- **工作模式** (`work`): 倒计时结束后自动切换到休息模式，番茄完成数 +1
- **休息模式** (`break`): 倒计时结束后自动切换回工作模式
- 模式标签通过 CSS 类名动态渲染颜色（红色=工作，绿色=休息）

### 2. 精确计时器

计时器使用 `Date.now()` 计算实际经过时间，而非依赖 `setInterval` 的累加：

```typescript
function tick() {
  const elapsed = Math.floor((Date.now() - startTimestamp) / 1000)
  const newRemaining = Math.max(0, startRemaining - elapsed)
  remainingSeconds.value = newRemaining
}
```

- 使用 `setInterval(tick, 250)` 每 250ms 刷新一次，确保显示流畅
- 暂停/恢复时重新记录 `startTimestamp`，保证计时精度

### 3. 键盘快捷键

在 `App.vue` 中通过 `onMounted` 注册全局键盘事件，`onUnmounted` 时移除：

| 快捷键 | 功能 |
|--------|------|
| 空格 | 开始 / 暂停 |
| R | 重置计时器 |
| Esc | 关闭设置面板 |

- 当焦点在 `<input>` 或 `<textarea>` 时自动忽略快捷键，避免干扰正常输入

### 4. 完成提示音效

使用 Web Audio API 生成三段提示音（880Hz 正弦波），无需加载外部音频文件：

```typescript
function playFinishSound() {
  const ctx = getAudioCtx()
  // 播放三声短促的 beep 音
  playBeep(now, 880, 0.15, 0.25)
  playBeep(now + 0.25, 880, 0.15, 0.25)
  playBeep(now + 0.5, 880, 0.15, 0.25)
}
```

- 兼容 `AudioContext` 和 `webkitAudioContext`（Safari 兼容）
- 自动处理浏览器自动播放策略（`ctx.resume()`）

### 5. 设置面板

- 右上角齿轮按钮，点击弹出/收起面板
- 支持工作时长和休息时长的独立配置（1-60 分钟）
- 提供数字输入框和滑块两种调节方式，双向同步
- 点击面板外部或按 Esc 关闭面板
- 修改后实时生效，自动保存到 `localStorage`

### 6. 数据持久化

使用 `localStorage` 持久化用户设置和统计数据：

| 存储键 | 内容 |
|--------|------|
| `pomodoro:settings` | `{ workMinutes, breakMinutes }` |
| `pomodoro:stats` | `{ date, completed }` |

- 统计数据按日期分组，跨天自动重置为 0
- 所有 `localStorage` 读写均包裹 `try/catch`，防止隐私模式下的异常

## 状态管理设计

Pinia Store (`timerStore`) 使用 Composition API 风格（`defineStore` + `setup` 函数），管理以下状态：

| 状态 | 类型 | 说明 |
|------|------|------|
| `mode` | `'work' \| 'break'` | 当前模式 |
| `remainingSeconds` | `number` | 剩余秒数 |
| `isRunning` | `boolean` | 是否正在运行 |
| `isFinished` | `boolean` | 是否已完成（显示提示） |
| `workMinutes` / `breakMinutes` | `number` | 工作时长/休息时长（分钟） |
| `todayCompleted` | `number` | 今日完成番茄数 |

**暴露的方法**:
- `start()` / `pause()` / `reset()` — 计时器控制
- `dismissFinished()` — 关闭完成提示
- `setWorkMinutes(v)` / `setBreakMinutes(v)` — 修改时长（带范围限制）

## 运行方式

```bash
# 安装依赖
npm install

# 启动开发服务器
npm run dev

# 构建生产版本
npm run build

# 预览生产构建
npm run preview
```

## 设计决策

1. **`Date.now()` 计时而非 `setInterval` 累加**: 避免定时器回调延迟导致的累积误差
2. **Web Audio API 而非音频文件**: 无需外部资源，生成简单音效即可，减少构建体积
3. **Pinia 而非 Vuex**: 更简洁的 API，完整的 TypeScript 类型推断
4. **Scoped CSS**: 组件样式隔离，避免全局样式污染
5. **localStorage 持久化**: 用户设置和统计数据无需后端，刷新页面不丢失