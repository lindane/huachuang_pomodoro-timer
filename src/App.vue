<script setup lang="ts">
import TimerDisplay from './components/TimerDisplay.vue'
import { useTimerStore } from './stores/timerStore'

const timer = useTimerStore()
</script>

<template>
  <div class="app">
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
  </div>
</template>

<style scoped>
.app {
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
