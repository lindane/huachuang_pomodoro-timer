<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'
import { useTimerStore } from '../stores/timerStore'

const timer = useTimerStore()
const panelRef = ref<HTMLElement | null>(null)
const triggerRef = ref<HTMLElement | null>(null)
const isOpen = ref(false)

function togglePanel(e: MouseEvent) {
  e.stopPropagation()
  isOpen.value = !isOpen.value
}

function handleDocClick(e: MouseEvent) {
  if (!isOpen.value) return
  const target = e.target as Node
  if (
    panelRef.value &&
    !panelRef.value.contains(target) &&
    triggerRef.value &&
    !triggerRef.value.contains(target)
  ) {
    isOpen.value = false
  }
}

function handleEsc(e: KeyboardEvent) {
  if (e.key === 'Escape') isOpen.value = false
}

onMounted(() => {
  document.addEventListener('click', handleDocClick)
  document.addEventListener('keydown', handleEsc)
})

onUnmounted(() => {
  document.removeEventListener('click', handleDocClick)
  document.removeEventListener('keydown', handleEsc)
})

function onWorkInput(e: Event) {
  const val = Number((e.target as HTMLInputElement).value)
  if (!Number.isNaN(val)) timer.setWorkMinutes(val)
}

function onBreakInput(e: Event) {
  const val = Number((e.target as HTMLInputElement).value)
  if (!Number.isNaN(val)) timer.setBreakMinutes(val)
}
</script>

<template>
  <div class="settings">
    <button
      ref="triggerRef"
      class="settings-btn"
      type="button"
      :class="{ active: isOpen }"
      @click="togglePanel"
      aria-label="设置"
    >
      <svg
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        stroke-width="2"
        stroke-linecap="round"
        stroke-linejoin="round"
      >
        <circle cx="12" cy="12" r="3" />
        <path
          d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"
        />
      </svg>
    </button>

    <Transition name="panel">
      <div v-if="isOpen" ref="panelRef" class="settings-panel" role="dialog">
        <div class="panel-header">
          <h3>时长设置</h3>
        </div>

        <div class="field">
          <label for="work-minutes">工作时长</label>
          <div class="field-control">
            <input
              id="work-minutes"
              type="number"
              min="1"
              max="60"
              :value="timer.workMinutes"
              @input="onWorkInput"
            />
            <span class="unit">分钟</span>
          </div>
          <input
            type="range"
            min="1"
            max="60"
            :value="timer.workMinutes"
            @input="onWorkInput"
            class="range"
          />
        </div>

        <div class="field">
          <label for="break-minutes">休息时长</label>
          <div class="field-control">
            <input
              id="break-minutes"
              type="number"
              min="1"
              max="60"
              :value="timer.breakMinutes"
              @input="onBreakInput"
            />
            <span class="unit">分钟</span>
          </div>
          <input
            type="range"
            min="1"
            max="60"
            :value="timer.breakMinutes"
            @input="onBreakInput"
            class="range"
          />
        </div>

        <div class="panel-hint">修改后实时生效，自动保存</div>
      </div>
    </Transition>
  </div>
</template>

<style scoped>
.settings {
  position: absolute;
  top: 24px;
  right: 24px;
  z-index: 50;
}

.settings-btn {
  width: 42px;
  height: 42px;
  border: none;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.9);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
  color: #5d6d7e;
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  transition: transform 0.3s ease, background 0.2s ease, color 0.2s ease;
}

.settings-btn svg {
  width: 22px;
  height: 22px;
}

.settings-btn:hover {
  color: #2c3e50;
  background: #fff;
}

.settings-btn.active {
  color: #e74c3c;
  transform: rotate(45deg);
}

.settings-panel {
  position: absolute;
  top: 52px;
  right: 0;
  width: 280px;
  background: #fff;
  border-radius: 12px;
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.12);
  padding: 20px;
  border: 1px solid #ecf0f1;
}

.panel-header h3 {
  margin: 0 0 16px;
  font-size: 16px;
  font-weight: 700;
  color: #2c3e50;
  letter-spacing: 0.5px;
}

.field {
  margin-bottom: 18px;
}

.field:last-of-type {
  margin-bottom: 14px;
}

.field label {
  display: block;
  font-size: 13px;
  font-weight: 600;
  color: #7f8c8d;
  margin-bottom: 8px;
}

.field-control {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 6px;
}

.field-control input[type='number'] {
  width: 72px;
  padding: 6px 10px;
  border: 1px solid #d5dbdb;
  border-radius: 6px;
  font-size: 14px;
  font-weight: 600;
  color: #2c3e50;
  text-align: center;
  outline: none;
  transition: border-color 0.2s ease;
  -moz-appearance: textfield;
}

.field-control input[type='number']::-webkit-outer-spin-button,
.field-control input[type='number']::-webkit-inner-spin-button {
  -webkit-appearance: none;
  margin: 0;
}

.field-control input[type='number']:focus {
  border-color: #e74c3c;
}

.field-control .unit {
  font-size: 13px;
  color: #95a5a6;
}

.range {
  width: 100%;
  height: 4px;
  -webkit-appearance: none;
  appearance: none;
  background: #ecf0f1;
  border-radius: 2px;
  outline: none;
}

.range::-webkit-slider-thumb {
  -webkit-appearance: none;
  appearance: none;
  width: 16px;
  height: 16px;
  border-radius: 50%;
  background: #e74c3c;
  cursor: pointer;
  border: 2px solid #fff;
  box-shadow: 0 1px 4px rgba(0, 0, 0, 0.2);
}

.range::-moz-range-thumb {
  width: 16px;
  height: 16px;
  border-radius: 50%;
  background: #e74c3c;
  cursor: pointer;
  border: 2px solid #fff;
  box-shadow: 0 1px 4px rgba(0, 0, 0, 0.2);
}

.panel-hint {
  margin-top: 4px;
  font-size: 12px;
  color: #aab7b8;
  text-align: center;
}

.panel-enter-active,
.panel-leave-active {
  transition: opacity 0.18s ease, transform 0.18s ease;
}

.panel-enter-from,
.panel-leave-to {
  opacity: 0;
  transform: translateY(-6px);
}
</style>
