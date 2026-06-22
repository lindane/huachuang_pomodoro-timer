import { defineStore } from 'pinia'
import { ref, computed, watch } from 'vue'

export type TimerMode = 'work' | 'break'

const DEFAULT_WORK_MINUTES = 25
const DEFAULT_BREAK_MINUTES = 5
const MIN_MINUTES = 1
const MAX_MINUTES = 60

const STORAGE_KEY_SETTINGS = 'pomodoro:settings'
const STORAGE_KEY_STATS = 'pomodoro:stats'

function getTodayStr(): string {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

function clampMinutes(v: number): number {
  return Math.min(MAX_MINUTES, Math.max(MIN_MINUTES, Math.floor(v)))
}

interface StoredSettings {
  workMinutes: number
  breakMinutes: number
}

interface StoredStats {
  date: string
  completed: number
}

function loadSettings(): StoredSettings {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_SETTINGS)
    if (raw) {
      const parsed = JSON.parse(raw) as StoredSettings
      return {
        workMinutes: clampMinutes(parsed.workMinutes ?? DEFAULT_WORK_MINUTES),
        breakMinutes: clampMinutes(parsed.breakMinutes ?? DEFAULT_BREAK_MINUTES),
      }
    }
  } catch (_) {
    /* ignore */
  }
  return { workMinutes: DEFAULT_WORK_MINUTES, breakMinutes: DEFAULT_BREAK_MINUTES }
}

function loadStats(): StoredStats {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_STATS)
    if (raw) {
      const parsed = JSON.parse(raw) as StoredStats
      if (parsed.date === getTodayStr()) {
        return { date: parsed.date, completed: Math.max(0, parsed.completed ?? 0) }
      }
    }
  } catch (_) {
    /* ignore */
  }
  return { date: getTodayStr(), completed: 0 }
}

export const useTimerStore = defineStore('timer', () => {
  const initialSettings = loadSettings()
  const initialStats = loadStats()

  const workMinutes = ref(initialSettings.workMinutes)
  const breakMinutes = ref(initialSettings.breakMinutes)

  const workDurationSeconds = computed(() => workMinutes.value * 60)
  const breakDurationSeconds = computed(() => breakMinutes.value * 60)

  const mode = ref<TimerMode>('work')
  const remainingSeconds = ref(workDurationSeconds.value)
  const isRunning = ref(false)
  const isFinished = ref(false)

  const statsDate = ref(initialStats.date)
  const todayCompleted = ref(initialStats.completed)

  let intervalId: ReturnType<typeof setInterval> | null = null
  let startTimestamp: number | null = null
  let startRemaining: number = 0

  let audioCtx: AudioContext | null = null

  function getAudioCtx(): AudioContext | null {
    if (typeof window === 'undefined') return null
    if (!audioCtx) {
      try {
        const AC =
          (window as unknown as { AudioContext?: typeof AudioContext; webkitAudioContext?: typeof AudioContext })
            .AudioContext ||
          (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext
        if (AC) audioCtx = new AC()
      } catch (_) {
        return null
      }
    }
    return audioCtx
  }

  function playBeep(startTime: number, freq: number, duration: number, volume: number) {
    const ctx = getAudioCtx()
    if (!ctx) return
    const osc = ctx.createOscillator()
    const gain = ctx.createGain()
    osc.type = 'sine'
    osc.frequency.value = freq
    gain.gain.setValueAtTime(0, startTime)
    gain.gain.linearRampToValueAtTime(volume, startTime + 0.01)
    gain.gain.linearRampToValueAtTime(0, startTime + duration)
    osc.connect(gain)
    gain.connect(ctx.destination)
    osc.start(startTime)
    osc.stop(startTime + duration + 0.02)
  }

  function playFinishSound() {
    const ctx = getAudioCtx()
    if (!ctx) return
    if (ctx.state === 'suspended') {
      try {
        ctx.resume()
      } catch (_) {
        /* ignore */
      }
    }
    const now = ctx.currentTime
    const beepDur = 0.15
    const gap = 0.1
    const freq = 880
    const vol = 0.25
    playBeep(now, freq, beepDur, vol)
    playBeep(now + beepDur + gap, freq, beepDur, vol)
    playBeep(now + (beepDur + gap) * 2, freq, beepDur, vol)
  }

  function ensureTodayStats() {
    const today = getTodayStr()
    if (statsDate.value !== today) {
      statsDate.value = today
      todayCompleted.value = 0
      saveStats()
    }
  }

  function saveSettings() {
    try {
      const data: StoredSettings = {
        workMinutes: workMinutes.value,
        breakMinutes: breakMinutes.value,
      }
      localStorage.setItem(STORAGE_KEY_SETTINGS, JSON.stringify(data))
    } catch (_) {
      /* ignore */
    }
  }

  function saveStats() {
    try {
      const data: StoredStats = {
        date: statsDate.value,
        completed: todayCompleted.value,
      }
      localStorage.setItem(STORAGE_KEY_STATS, JSON.stringify(data))
    } catch (_) {
      /* ignore */
    }
  }

  watch(
    [workMinutes, breakMinutes],
    () => {
      saveSettings()
      if (!isRunning.value && !isFinished.value) {
        if (mode.value === 'work') {
          remainingSeconds.value = workDurationSeconds.value
          startRemaining = workDurationSeconds.value
        } else {
          remainingSeconds.value = breakDurationSeconds.value
          startRemaining = breakDurationSeconds.value
        }
      }
    },
  )

  const formattedTime = computed(() => {
    const minutes = Math.floor(remainingSeconds.value / 60)
    const seconds = remainingSeconds.value % 60
    return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`
  })

  const modeLabel = computed(() => (mode.value === 'work' ? '工作中' : '休息中'))

  function tick() {
    if (startTimestamp === null) return
    const elapsed = Math.floor((Date.now() - startTimestamp) / 1000)
    const newRemaining = Math.max(0, startRemaining - elapsed)
    remainingSeconds.value = newRemaining
    if (newRemaining <= 0) {
      onTimerEnd()
    }
  }

  function start() {
    if (isRunning.value) return
    ensureTodayStats()
    isRunning.value = true
    isFinished.value = false
    startTimestamp = Date.now()
    startRemaining = remainingSeconds.value
    tick()
    intervalId = setInterval(tick, 250)
  }

  function pause() {
    isRunning.value = false
    if (intervalId !== null) {
      clearInterval(intervalId)
      intervalId = null
    }
    startTimestamp = null
  }

  function reset() {
    pause()
    isFinished.value = false
    mode.value = 'work'
    remainingSeconds.value = workDurationSeconds.value
    startRemaining = workDurationSeconds.value
    startTimestamp = null
  }

  function onTimerEnd() {
    pause()
    isFinished.value = true
    playFinishSound()
    if (mode.value === 'work') {
      ensureTodayStats()
      todayCompleted.value += 1
      saveStats()
      mode.value = 'break'
      remainingSeconds.value = breakDurationSeconds.value
      startRemaining = breakDurationSeconds.value
    } else {
      mode.value = 'work'
      remainingSeconds.value = workDurationSeconds.value
      startRemaining = workDurationSeconds.value
    }
  }

  function dismissFinished() {
    isFinished.value = false
  }

  function setWorkMinutes(v: number) {
    workMinutes.value = clampMinutes(v)
  }

  function setBreakMinutes(v: number) {
    breakMinutes.value = clampMinutes(v)
  }

  return {
    mode,
    remainingSeconds,
    isRunning,
    isFinished,
    formattedTime,
    modeLabel,
    workMinutes,
    breakMinutes,
    todayCompleted,
    start,
    pause,
    reset,
    dismissFinished,
    setWorkMinutes,
    setBreakMinutes,
  }
})
