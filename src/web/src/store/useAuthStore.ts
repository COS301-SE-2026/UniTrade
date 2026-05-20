import { create } from 'zustand'

export type UserRole = 'buyer' | 'seller' | 'admin'

interface User {
  id: string
  name: string
  initials: string
  role: UserRole
  university?: string
}

interface AuthStore {
  user: User | null
  setUser: (user: User) => void
  clearUser: () => void
}

export const useAuthStore = create<AuthStore>((set) => ({
  user: null,
  setUser: (user) => set({ user }),
  clearUser: () => set({ user: null }),
}))