<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'
import TimerDisplay from './components/TimerDisplay.vue'
import PomodoroStats from './components/PomodoroStats.vue'
import SettingsPanel from './components/SettingsPanel.vue'
import { useTimerStore } from './stores/timerStore'

const timer = useTimerStore()
const settingsPanelRef = ref<InstanceType<typeof SettingsPanel> | null>(null)

function isInputTarget(e: KeyboardEvent): boolean {
  const target = e.target as HTMLElement | null
  if (!target) return false
  const tag = target.tagName.toLowerCase()
  return tag === 'input' || tag === 'textarea' || target.isContentEditable
}

function handleKeydown(e: KeyboardEvent) {
  if (isInputTarget(e)) return
  if (e.key === 'Escape') {
    if (settingsPanelRef.value?.isOpen) {
      settingsPanelRef.value.close()
      e.preventDefault()
    }
    return
  }
  if (e.code === 'Space' || e.key === ' ') {
    e.preventDefault()
    if (timer.isRunning) {
      timer.pause()
    } else {
      timer.start()
    }
    return
  }
  if (e.key.toLowerCase() === 'r') {
    e.preventDefault()
    timer.reset()
  }
}

onMounted(() => {
  window.addEventListener('keydown', handleKeydown)
})

onUnmounted(() => {
  window.removeEventListener('keydown', handleKeydown)
})
</script>

<template>
  <div class="app">
    <SettingsPanel ref="settingsPanelRef" />
    <h1 class="title">番茄钟</h1>
    <TimerDisplay />
    <div class="controls">
      <button
        v-if="!timer.isRunning"
        class="btn btn-start"
        @click="timer.start()"
      >
        {{ timer.isFinished ? '继续' : '开始' }}
      </button>
      <button
        v-else
        class="btn btn-pause"
        @click="timer.pause()"
      >
        暂停
      </button>
      <button class="btn btn-reset" @click="timer.reset()">
        重置
      </button>
    </div>
    <PomodoroStats />
  </div>
</template>

<style scoped>
.app {
  position: relative;
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 40px;
  padding: 40px 20px;
}

.title {
  font-size: 32px;
  font-weight: 700;
  color: #2c3e50;
  letter-spacing: 4px;
}

.controls {
  display: flex;
  gap: 16px;
}

.btn {
  padding: 12px 32px;
  font-size: 16px;
  font-weight: 600;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.2s ease;
  letter-spacing: 1px;
}

.btn:active {
  transform: scale(0.96);
}

.btn-start {
  background-color: #e74c3c;
  color: #fff;
}

.btn-start:hover {
  background-color: #c0392b;
}

.btn-pause {
  background-color: #f39c12;
  color: #fff;
}

.btn-pause:hover {
  background-color: #d68910;
}

.btn-reset {
  background-color: #ecf0f1;
  color: #7f8c8d;
}

.btn-reset:hover {
  background-color: #d5dbdb;
  color: #2c3e50;
}
</style>
