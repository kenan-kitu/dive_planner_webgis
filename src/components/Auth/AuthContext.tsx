import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react'
import {
  getCurrentUser,
  loginAccount,
  registerAccount,
  type AuthUser,
  type RegisterInput,
} from '../../services/auth'

const TOKEN_STORAGE_KEY = 'dive-planner-access-token'

export type AuthMode = 'login' | 'register'

interface AuthContextValue {
  user: AuthUser | null
  token: string | null
  authMode: AuthMode | null
  favoritesOpen: boolean
  favoritesRevision: number
  openSignIn: () => void
  openRegister: () => void
  closeAuth: () => void
  openFavorites: () => void
  closeFavorites: () => void
  notifyFavoritesChanged: () => void
  signIn: (email: string, password: string) => Promise<void>
  register: (input: RegisterInput) => Promise<void>
  signOut: () => void
}

const AuthContext = createContext<AuthContextValue | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null)
  const [token, setToken] = useState<string | null>(() =>
    localStorage.getItem(TOKEN_STORAGE_KEY),
  )
  const [authMode, setAuthMode] = useState<AuthMode | null>(null)
  const [favoritesOpen, setFavoritesOpen] = useState(false)
  const [favoritesRevision, setFavoritesRevision] = useState(0)

  useEffect(() => {
    if (!token) {
      setUser(null)
      return
    }
    getCurrentUser(token)
      .then(setUser)
      .catch(() => {
        localStorage.removeItem(TOKEN_STORAGE_KEY)
        setToken(null)
        setUser(null)
      })
  }, [token])

  const storeSession = (accessToken: string, authenticatedUser: AuthUser) => {
    localStorage.setItem(TOKEN_STORAGE_KEY, accessToken)
    setToken(accessToken)
    setUser(authenticatedUser)
    setAuthMode(null)
  }

  const signIn = async (email: string, password: string) => {
    const result = await loginAccount(email, password)
    storeSession(result.access_token, result.user)
  }

  const register = async (input: RegisterInput) => {
    await registerAccount(input)
    await signIn(input.email, input.password)
  }

  const signOut = () => {
    localStorage.removeItem(TOKEN_STORAGE_KEY)
    setToken(null)
    setUser(null)
    setAuthMode(null)
    setFavoritesOpen(false)
  }

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      token,
      authMode,
      favoritesOpen,
      favoritesRevision,
      openSignIn: () => setAuthMode('login'),
      openRegister: () => setAuthMode('register'),
      closeAuth: () => setAuthMode(null),
      openFavorites: () => setFavoritesOpen(true),
      closeFavorites: () => setFavoritesOpen(false),
      notifyFavoritesChanged: () => setFavoritesRevision((value) => value + 1),
      signIn,
      register,
      signOut,
    }),
    [authMode, favoritesOpen, favoritesRevision, token, user],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used inside AuthProvider.')
  }
  return context
}
