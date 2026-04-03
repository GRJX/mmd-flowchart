import { create } from 'zustand'

// ── Types ─────────────────────────────────────────────────────────────────────

export type Theme = 'light' | 'dark'

const THEME_KEY = 'mmd-theme'

function loadTheme(): Theme {
  try {
    const stored = localStorage.getItem(THEME_KEY)
    if (stored === 'light' || stored === 'dark') return stored
  } catch {
    // localStorage not available
  }
  return 'dark'
}

function applyTheme(theme: Theme) {
  if (theme === 'light') {
    document.documentElement.setAttribute('data-theme', 'light')
  } else {
    document.documentElement.removeAttribute('data-theme')
  }
}

// ── Store interface ────────────────────────────────────────────────────────────

interface AppStore {
  theme: Theme
  setTheme: (theme: Theme) => void
  toggleTheme: () => void
}

// ── Store implementation ───────────────────────────────────────────────────────

const initialTheme = loadTheme()
applyTheme(initialTheme)

export const useAppStore = create<AppStore>((set, get) => ({
  theme: initialTheme,

  setTheme: (theme) => {
    applyTheme(theme)
    try {
      localStorage.setItem(THEME_KEY, theme)
    } catch {
      // ignore
    }
    set({ theme })
  },

  toggleTheme: () => {
    const next: Theme = get().theme === 'dark' ? 'light' : 'dark'
    get().setTheme(next)
  },
}))
