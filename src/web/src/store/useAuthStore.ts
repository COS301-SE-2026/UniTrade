import { create } from 'zustand'

export type UserRole = 'student' | 'admin'
export type ViewMode = 'buyer' | 'seller'

interface User {
  id: string
  name: string
  initials: string
  role: UserRole
  email: string
  university?: string
}

interface AuthStore {
  user: User | null
  pendingEmail: string | null
  viewMode: ViewMode                    
  setUser: (user: User) => void
  clearUser: () => void
  setPendingEmail: (email: string) => void
  clearPendingEmail: () => void
  toggleViewMode: () => void   
}

export const useAuthStore = create<AuthStore>((set, get) => ({
  user: null,
  pendingEmail: null,
  viewMode: 'buyer',                     
  setUser: (user) => set({ user }),
  clearUser: () => set({ user: null, viewMode: 'buyer' }),
  setPendingEmail: (email) => set({ pendingEmail: email }),
  clearPendingEmail: () => set({ pendingEmail: null }),
  toggleViewMode: () => {
    const { user, viewMode } = get()
    
    if (user?.role !== 'student') return
    set({ viewMode: viewMode === 'buyer' ? 'seller' : 'buyer' })
  },
}))