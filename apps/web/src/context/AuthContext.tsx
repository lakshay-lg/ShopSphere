import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";

const API = import.meta.env.VITE_API_BASE_URL ?? "http://localhost:3000";

export interface AuthUser {
  id: string;
  email: string;
  createdAt: string;
}

interface AuthState {
  user: AuthUser | null;
  token: string | null;
  isLoading: boolean;
}

interface AuthContextValue extends AuthState {
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AuthState>({
    user: null,
    token: localStorage.getItem("ss_token"),
    isLoading: true,
  });

  // On mount, re-validate any stored token against /api/auth/me
  useEffect(() => {
    const storedToken = localStorage.getItem("ss_token");
    if (!storedToken) {
      setState((s) => ({ ...s, isLoading: false }));
      return;
    }
    fetch(`${API}/api/auth/me`, {
      headers: { Authorization: `Bearer ${storedToken}` },
    })
      .then((r) => (r.ok ? r.json() : Promise.reject()))
      .then((data: { user: AuthUser }) => {
        setState({ user: data.user, token: storedToken, isLoading: false });
      })
      .catch(() => {
        localStorage.removeItem("ss_token");
        setState({ user: null, token: null, isLoading: false });
      });
  }, []);

  async function login(email: string, password: string): Promise<void> {
    const res = await fetch(`${API}/api/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });
    const data = (await res.json()) as {
      token?: string;
      user?: AuthUser;
      error?: string;
    };
    if (!res.ok) throw new Error(data.error ?? "Login failed");
    localStorage.setItem("ss_token", data.token!);
    setState({ user: data.user!, token: data.token!, isLoading: false });
  }

  async function register(email: string, password: string): Promise<void> {
    const res = await fetch(`${API}/api/auth/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });
    const data = (await res.json()) as {
      token?: string;
      user?: AuthUser;
      error?: string;
    };
    if (!res.ok) throw new Error(data.error ?? "Registration failed");
    localStorage.setItem("ss_token", data.token!);
    setState({ user: data.user!, token: data.token!, isLoading: false });
  }

  function logout(): void {
    localStorage.removeItem("ss_token");
    setState({ user: null, token: null, isLoading: false });
  }

  return (
    <AuthContext.Provider value={{ ...state, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
}
