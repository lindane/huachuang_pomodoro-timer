<script setup lang="ts">
import { useTimerStore } from '../stores/timerStore'

const timer = useTimerStore()
</script>

<template>
  <div class="stats">
    <div class="stats-icon">🍅</div>
    <div class="stats-text">今天已完成 {{ timer.todayCompleted }} 个番茄</div>
  </div>
</template>

<style scoped>
.stats {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 10px 20px;
  background: rgba(255, 255, 255, 0.7);
  border: 1px solid #e0e4ea;
  border-radius: 24px;
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.04);
}

.stats-icon {
  font-size: 20px;
  line-height: 1;
}

.stats-text {
  font-size: 15px;
  font-weight: 600;
  color: #5d6d7e;
  letter-spacing: 0.5px;
}
</style>
