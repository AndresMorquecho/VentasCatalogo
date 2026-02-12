import { create } from 'zustand'

interface SessionState {
  isAuthenticated: boolean
  user: { name: string; email: string } | null
  login: (user: { name: string; email: string }) => void
  logout: () => void
}

export const useSessionStore = create<SessionState>((set) => ({
  isAuthenticated: false,
  user: null,
  login: (user) => set({ isAuthenticated: true, user }),
  logout: () => set({ isAuthenticated: false, user: null }),
}))
