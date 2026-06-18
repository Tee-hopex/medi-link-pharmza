import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'
import AsyncStorage from '@react-native-async-storage/async-storage'
import { storeTokens, clearTokens, api } from '../lib/api'

export type UserRole = 'MEDICAL' | 'NON_MEDICAL' | 'PATIENT'

export interface User {
  id: string
  firstName: string
  lastName: string
  email: string
  phone?: string
  role: UserRole
  profession?: string
  specialty?: string
  verificationLevel: 'UNVERIFIED' | 'PENDING' | 'LEVEL_1' | 'LEVEL_2' | 'LEVEL_3'
  avatar?: string
  facility?: {
    id: string
    name: string
    type: string
    address: string
    city: string
    state: string
    verified: boolean
  }
  wallet?: { balance: number; escrow: number; currency: string }
}

interface AuthState {
  _hasHydrated: boolean
  isOnboarded: boolean
  isAuthenticated: boolean
  user: User | null
  pendingRole: UserRole | null

  setHasHydrated: (v: boolean) => void
  completeOnboarding: () => void
  setPendingRole: (role: UserRole) => void

  // Called after a successful login or register — stores tokens in SecureStore
  login: (accessToken: string, refreshToken: string, user: User) => Promise<void>
  logout: () => Promise<void>
  refreshUser: () => Promise<void>
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      _hasHydrated: false,
      isOnboarded: false,
      isAuthenticated: false,
      user: null,
      pendingRole: null,

      setHasHydrated: (v) => set({ _hasHydrated: v }),
      completeOnboarding: () => set({ isOnboarded: true }),
      setPendingRole: (role) => set({ pendingRole: role }),

      login: async (accessToken, refreshToken, user) => {
        await storeTokens(accessToken, refreshToken)
        set({ isAuthenticated: true, user })
      },

      logout: async () => {
        try {
          const { getRefreshToken } = await import('../lib/api')
          const refreshToken = await getRefreshToken()
          if (refreshToken) {
            await api.post('/auth/logout', { refreshToken }).catch(() => {})
          }
        } catch {}
        await clearTokens()
        set({ isAuthenticated: false, user: null })
      },

      refreshUser: async () => {
        const { data } = await api.get('/users/me')
        set({ user: data.data })
      },
    }),
    {
      name: 'medi-link-auth',
      storage: createJSONStorage(() => AsyncStorage),
      // Tokens live in SecureStore — only persist non-sensitive state here
      partialize: (state) => ({
        isOnboarded: state.isOnboarded,
        isAuthenticated: state.isAuthenticated,
        user: state.user,
        pendingRole: state.pendingRole,
      }),
      onRehydrateStorage: () => (state) => {
        state?.setHasHydrated(true)
      },
    },
  ),
)
