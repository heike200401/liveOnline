import axios, { AxiosError, type AxiosRequestConfig } from 'axios'
import { useAuthStore } from '../stores/auth'
import type { AuthResponse } from '../types'

export const API_ORIGIN = 'http://localhost:3000'
export const API_BASE = `${API_ORIGIN}/api`

export const api = axios.create({ baseURL: API_BASE })

api.interceptors.request.use((config) => {
  const token = useAuthStore.getState().token
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

let refreshing: Promise<string | null> | null = null

async function doRefresh(): Promise<string | null> {
  const rt = useAuthStore.getState().refreshToken
  if (!rt) return null
  try {
    const { data } = await axios.post<AuthResponse>(`${API_BASE}/auth/refresh`, {
      refreshToken: rt,
    })
    useAuthStore.getState().setAuth(data)
    return data.accessToken
  } catch {
    return null
  }
}

function forceLogout() {
  useAuthStore.getState().logout()
  if (window.location.pathname !== '/login') {
    window.location.href = '/login'
  }
}

api.interceptors.response.use(
  (res) => res,
  async (error: AxiosError) => {
    const config = error.config as (AxiosRequestConfig & { _retried?: boolean }) | undefined
    if (error.response?.status === 401 && config && !config._retried) {
      config._retried = true
      if (!refreshing) refreshing = doRefresh()
      const token = await refreshing
      refreshing = null
      if (token) {
        config.headers = { ...config.headers, Authorization: `Bearer ${token}` }
        return api(config)
      }
      forceLogout()
    }
    return Promise.reject(error)
  },
)

export function errMsg(e: unknown): string {
  if (axios.isAxiosError(e)) {
    const m = (e.response?.data as { message?: unknown } | undefined)?.message
    if (Array.isArray(m)) return m.join('；')
    if (typeof m === 'string' && m) return m
    return e.message || '请求失败'
  }
  return '请求失败'
}

export async function loginRequest(username: string, password: string): Promise<AuthResponse> {
  const { data } = await axios.post<AuthResponse>(`${API_BASE}/auth/login`, {
    username,
    password,
  })
  return data
}

export async function registerRequest(username: string, password: string): Promise<AuthResponse> {
  const { data } = await axios.post<AuthResponse>(`${API_BASE}/auth/register`, {
    username,
    password,
  })
  return data
}
