import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export type UserRole = 'student' | 'admin'
export type ViewMode = 'buyer' | 'seller'

interface User {
  id: string
  name: string
  initials: string
  role: UserRole
  university?: string
  course?: string
  year?: string
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
  setViewMode: (mode: ViewMode) => void
}
 


export const useAuthStore = create<AuthStore>()(
  persist(
  (set, get) => ({
  user: null, //this will also be removed was just user initially 
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
  setViewMode: (mode) => set({ viewMode: mode}),
}),
{
  name: 'unitrade-auth',
  partialize: (state) => ({ viewMode: state.viewMode}),
}
  )
)