/*import { create } from 'zustand'

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
}))*/

import { create } from 'zustand'

export type UserRole = 'student' | 'buyer' | 'seller' | 'admin'

interface User {
  id: string
  name: string
  initials: string
  role: UserRole
  university?: string
}

interface AuthStore {
  user: User | null
  pendingEmail: string | null   // holds email between register and OTP steps
  setUser: (user: User) => void
  clearUser: () => void
  setPendingEmail: (email: string) => void
  clearPendingEmail: () => void
}

export const useAuthStore = create<AuthStore>((set) => ({
  user: null,
  pendingEmail: null,
  setUser: (user) => set({ user }),
  clearUser: () => set({ user: null }),
  setPendingEmail: (email) => set({ pendingEmail: email }),
  clearPendingEmail: () => set({ pendingEmail: null }),
}))