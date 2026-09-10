import { create } from 'zustand'
import type { AuthResponse, User } from '../types'

const KEY = 'skill-tree-auth'

interface AuthState {
  token: string | null
  refreshToken: string | null
  user: User | null
  setAuth: (d: AuthResponse) => void
  setToken: (t: string) => void
  logout: () => void
}

function load(): AuthResponse | null {
  try {
    return JSON.parse(localStorage.getItem(KEY) ?? 'null') as AuthResponse | null
  } catch {
    return null
  }
}

const saved = load()

export const useAuthStore = create<AuthState>((set) => ({
  token: saved?.accessToken ?? null,
  refreshToken: saved?.refreshToken ?? null,
  user: saved?.user ?? null,
  setAuth: (d) => {
    localStorage.setItem(KEY, JSON.stringify(d))
    set({ token: d.accessToken, refreshToken: d.refreshToken, user: d.user })
  },
  setToken: (t) => {
    const s = load()
    if (s) {
      s.accessToken = t
      localStorage.setItem(KEY, JSON.stringify(s))
    }
    set({ token: t })
  },
  logout: () => {
    localStorage.removeItem(KEY)
    set({ token: null, refreshToken: null, user: null })
  },
}))
