'use client'
import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'
import { api, setTokens, clearTokens } from '@/lib/api'

interface User {
  id: string
  email: string
  firstName: string
  lastName: string
  role: 'MEDICAL' | 'NON_MEDICAL' | 'PATIENT'
  profession?: string
  specialty?: string
  verificationLevel: string
  avatar?: string
  facility?: {
    id: string
    name: string
    type: string
    city: string
    state: string
    verified: boolean
  }
  wallet?: { balance: number; escrow: number; currency: string }
}

interface AuthState {
  user: User | null
  isAuthenticated: boolean
  login: (email: string, password: string) => Promise<void>
  register: (data: RegisterData) => Promise<void>
  logout: () => Promise<void>
  refreshUser: () => Promise<void>
}

interface RegisterData {
  email: string
  password: string
  firstName: string
  lastName: string
  role: 'MEDICAL' | 'NON_MEDICAL' | 'PATIENT'
  profession?: string
  specialty?: string
  facilityName?: string
  facilityType?: string
  facilityAddress?: string
  facilityCity?: string
  facilityState?: string
  licenseNumber?: string
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      isAuthenticated: false,

      login: async (email, password) => {
        const { data } = await api.post('/auth/login', { email, password })
        setTokens(data.data.accessToken, data.data.refreshToken)
        set({ user: data.data.user, isAuthenticated: true })
      },

      register: async (formData) => {
        const { data } = await api.post('/auth/register', formData)
        setTokens(data.data.accessToken, data.data.refreshToken)
        set({ user: data.data.user, isAuthenticated: true })
      },

      logout: async () => {
        const refreshToken = typeof window !== 'undefined' ? localStorage.getItem('ml_refresh_token') : null
        if (refreshToken) {
          try { await api.post('/auth/logout', { refreshToken }) } catch {}
        }
        clearTokens()
        set({ user: null, isAuthenticated: false })
        if (typeof window !== 'undefined') window.location.href = '/login'
      },

      refreshUser: async () => {
        const { data } = await api.get('/users/me')
        set({ user: data.data, isAuthenticated: true })
      },
    }),
    {
      name: 'ml-auth',
      // Use localStorage only on the client — prevents SSR hydration mismatch
      storage: createJSONStorage(() =>
        typeof window !== 'undefined'
          ? localStorage
          : { getItem: () => null, setItem: () => {}, removeItem: () => {} },
      ),
      partialize: (state) => ({ user: state.user, isAuthenticated: state.isAuthenticated }),
      skipHydration: true, // Hydrate manually in Providers to avoid SSR mismatch
    },
  ),
)
