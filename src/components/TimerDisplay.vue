<script setup lang="ts">
import { useTimerStore } from '../stores/timerStore'

const timer = useTimerStore()
</script>

<template>
  <div class="timer-display">
    <div class="mode-badge" :class="timer.mode">
      {{ timer.modeLabel }}
    </div>

    <div class="time" :class="{ finished: timer.isFinished }">
      {{ timer.formattedTime }}
    </div>

    <Transition name="flash">
      <div v-if="timer.isFinished" class="finish-hint" @click="timer.dismissFinished()">
        休息一下吧
      </div>
    </Transition>
  </div>
</template>

<style scoped>
.timer-display {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 20px;
}

.mode-badge {
  padding: 6px 20px;
  border-radius: 20px;
  font-size: 14px;
  font-weight: 600;
  letter-spacing: 2px;
  text-transform: uppercase;
}

.mode-badge.work {
  background-color: #ffe0d9;
  color: #e74c3c;
}

.mode-badge.break {
  background-color: #d9f5e0;
  color: #27ae60;
}

.time {
  font-size: 96px;
  font-weight: 700;
  font-variant-numeric: tabular-nums;
  color: #2c3e50;
  line-height: 1;
  transition: color 0.3s ease;
}

.time.finished {
  color: #e74c3c;
}

.finish-hint {
  font-size: 22px;
  font-weight: 600;
  color: #e74c3c;
  cursor: pointer;
  animation: blink 0.8s ease-in-out infinite;
  padding: 8px 24px;
  border-radius: 8px;
  background: rgba(231, 76, 60, 0.08);
}

@keyframes blink {
  0%, 100% {
    opacity: 1;
  }
  50% {
    opacity: 0.2;
  }
}

.flash-enter-active {
  animation: blink 0.8s ease-in-out infinite;
}

.flash-leave-active {
  animation: none;
  transition: opacity 0.3s ease;
}

.flash-leave-to {
  opacity: 0;
}
</style>
