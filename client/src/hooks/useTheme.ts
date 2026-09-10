import { useCallback, useSyncExternalStore } from 'react'

type Theme = 'light' | 'dark'

const STORAGE_KEY = 'theme'

function getStoredTheme(): Theme | null {
  try {
    const v = localStorage.getItem(STORAGE_KEY)
    return v === 'dark' || v === 'light' ? v : null
  } catch {
    return null
  }
}

function systemPrefersDark(): boolean {
  return window.matchMedia('(prefers-color-scheme: dark)').matches
}

function applyClass(isDark: boolean) {
  document.documentElement.classList.toggle('dark', isDark)
}

const listeners = new Set<() => void>()

// 模块级单例状态：未手动设置过时跟随系统
let current: boolean = getStoredTheme() ? getStoredTheme() === 'dark' : systemPrefersDark()
applyClass(current)

function setDark(isDark: boolean, persist: boolean) {
  current = isDark
  applyClass(isDark)
  if (persist) {
    try {
      localStorage.setItem(STORAGE_KEY, isDark ? 'dark' : 'light')
    } catch {
      /* ignore */
    }
  }
  listeners.forEach((l) => l())
}

// 用户未手动设置主题时，实时跟随系统深浅色切换
window
  .matchMedia('(prefers-color-scheme: dark)')
  .addEventListener('change', (e) => {
    if (!getStoredTheme()) setDark(e.matches, false)
  })

export function useTheme() {
  const isDark = useSyncExternalStore(
    (onStoreChange) => {
      listeners.add(onStoreChange)
      return () => {
        listeners.delete(onStoreChange)
      }
    },
    () => current,
  )
  const toggle = useCallback(() => setDark(!current, true), [])
  return { isDark, toggle }
}
