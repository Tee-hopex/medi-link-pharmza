import axios from 'axios'

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api/v1'

const isBrowser = typeof window !== 'undefined'

export const api = axios.create({
  baseURL: API_URL,
  withCredentials: true,
})

api.interceptors.request.use((config) => {
  if (isBrowser) {
    const token = localStorage.getItem('ml_access_token')
    if (token) config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

api.interceptors.response.use(
  (res) => res,
  async (error) => {
    const original = error.config
    if (error.response?.status === 401 && !original._retry && isBrowser) {
      original._retry = true
      const refreshToken = localStorage.getItem('ml_refresh_token')
      if (refreshToken) {
        try {
          const { data } = await axios.post(`${API_URL}/auth/refresh`, { refreshToken })
          localStorage.setItem('ml_access_token', data.data.accessToken)
          localStorage.setItem('ml_refresh_token', data.data.refreshToken)
          // Refresh the session cookie too
          document.cookie = `ml_access_token=${data.data.accessToken}; path=/; max-age=${7 * 24 * 60 * 60}`
          original.headers.Authorization = `Bearer ${data.data.accessToken}`
          return api(original)
        } catch {
          clearTokens()
          window.location.href = '/login'
        }
      }
    }
    return Promise.reject(error)
  },
)

export function setTokens(accessToken: string, refreshToken: string) {
  localStorage.setItem('ml_access_token', accessToken)
  localStorage.setItem('ml_refresh_token', refreshToken)
  // Cookie used by Next.js middleware to check auth on server — 7 days so it outlives the access
  // token and lets the client-side interceptor refresh without the middleware blocking first
  document.cookie = `ml_access_token=${accessToken}; path=/; max-age=${7 * 24 * 60 * 60}`
}

export function clearTokens() {
  localStorage.removeItem('ml_access_token')
  localStorage.removeItem('ml_refresh_token')
  document.cookie = 'ml_access_token=; path=/; expires=Thu, 01 Jan 1970 00:00:01 GMT'
}
