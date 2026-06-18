import axios from 'axios'
import * as SecureStore from 'expo-secure-store'

// For Android emulator use 10.0.2.2, iOS simulator use localhost, physical device use your machine's LAN IP
const API_URL = process.env.EXPO_PUBLIC_API_URL ?? 'http://10.0.2.2:4000/api/v1'

export const ACCESS_TOKEN_KEY = 'ml_access_token'
export const REFRESH_TOKEN_KEY = 'ml_refresh_token'

// ── Token helpers ────────────────────────────────────────────────────────────

export const storeTokens = async (accessToken: string, refreshToken: string) => {
  await Promise.all([
    SecureStore.setItemAsync(ACCESS_TOKEN_KEY, accessToken),
    SecureStore.setItemAsync(REFRESH_TOKEN_KEY, refreshToken),
  ])
}

export const clearTokens = async () => {
  await Promise.all([
    SecureStore.deleteItemAsync(ACCESS_TOKEN_KEY),
    SecureStore.deleteItemAsync(REFRESH_TOKEN_KEY),
  ])
}

export const getAccessToken = () => SecureStore.getItemAsync(ACCESS_TOKEN_KEY)
export const getRefreshToken = () => SecureStore.getItemAsync(REFRESH_TOKEN_KEY)

// ── Auth failure callback ─────────────────────────────────────────────────────
// Set this from _layout.tsx so the interceptor can trigger logout without
// creating a circular import with the auth store.

let onAuthFailure: (() => void) | null = null

export const setAuthFailureHandler = (handler: () => void) => {
  onAuthFailure = handler
}

// ── Axios instance ───────────────────────────────────────────────────────────

export const api = axios.create({
  baseURL: API_URL,
  timeout: 15000,
})

// Attach access token from SecureStore on every request
api.interceptors.request.use(async (config) => {
  const token = await getAccessToken()
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

// Handle 401 → refresh → retry, with a queue for concurrent requests
let isRefreshing = false
const failedQueue: Array<{ resolve: (token: string) => void; reject: (err: unknown) => void }> = []

function processQueue(error: unknown, token: string | null) {
  failedQueue.splice(0).forEach((p) => {
    if (error) p.reject(error)
    else p.resolve(token!)
  })
}

api.interceptors.response.use(
  (res) => res,
  async (error) => {
    const original = error.config

    if (error.response?.status !== 401 || original._retry) {
      return Promise.reject(error)
    }

    // Queue concurrent requests while refresh is in-flight
    if (isRefreshing) {
      return new Promise<string>((resolve, reject) => {
        failedQueue.push({ resolve, reject })
      }).then((token) => {
        original.headers.Authorization = `Bearer ${token}`
        return api(original)
      })
    }

    original._retry = true
    isRefreshing = true

    try {
      const refreshToken = await getRefreshToken()
      if (!refreshToken) throw new Error('No refresh token')

      const { data } = await axios.post(`${API_URL}/auth/refresh`, { refreshToken })
      const { accessToken: newAccess, refreshToken: newRefresh } = data.data

      await storeTokens(newAccess, newRefresh)
      processQueue(null, newAccess)

      original.headers.Authorization = `Bearer ${newAccess}`
      return api(original)
    } catch (refreshError) {
      processQueue(refreshError, null)
      await clearTokens()
      onAuthFailure?.()
      return Promise.reject(refreshError)
    } finally {
      isRefreshing = false
    }
  },
)
