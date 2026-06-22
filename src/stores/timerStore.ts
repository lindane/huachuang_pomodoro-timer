import { defineStore } from 'pinia'
import { ref, computed } from 'vue'

export type TimerMode = 'work' | 'break'

export const useTimerStore = defineStore('timer', () => {
  const WORK_DURATION = 25 * 60
  const BREAK_DURATION = 5 * 60

  const mode = ref<TimerMode>('work')
  const remainingSeconds = ref(WORK_DURATION)
  const isRunning = ref(false)
  const isFinished = ref(false)

  let intervalId: ReturnType<typeof setInterval> | null = null

  const formattedTime = computed(() => {
    const minutes = Math.floor(remainingSeconds.value / 60)
    const seconds = remainingSeconds.value % 60
    return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`
  })

  const modeLabel = computed(() => (mode.value === 'work' ? '工作中' : '休息中'))

  function start() {
    if (isRunning.value) return
    isRunning.value = true
    isFinished.value = false
    intervalId = setInterval(() => {
      if (remainingSeconds.value > 0) {
        remainingSeconds.value--
      } else {
        onTimerEnd()
      }
    }, 1000)
  }

  function pause() {
    isRunning.value = false
    if (intervalId !== null) {
      clearInterval(intervalId)
      intervalId = null
    }
  }

  function reset() {
    pause()
    isFinished.value = false
    mode.value = 'work'
    remainingSeconds.value = WORK_DURATION
  }

  function onTimerEnd() {
    pause()
    isFinished.value = true
    if (mode.value === 'work') {
      mode.value = 'break'
      remainingSeconds.value = BREAK_DURATION
    } else {
      mode.value = 'work'
      remainingSeconds.value = WORK_DURATION
    }
  }

  function dismissFinished() {
    isFinished.value = false
  }

  return {
    mode,
    remainingSeconds,
    isRunning,
    isFinished,
    formattedTime,
    modeLabel,
    start,
    pause,
    reset,
    dismissFinished,
  }
})
