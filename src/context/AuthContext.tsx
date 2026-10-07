// context/AuthContext.tsx
"use client";
import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  ReactNode,
} from "react";

interface User {
  id: string;
  name: string;
  username: string;
  email: string;
  whatsapp?: string;
  whatsappLocked?: boolean;
  whatsappUnlockPriceNgn?: number | null;
  bookingRates?: Array<{
    duration: "short_time" | "hourly" | "extended_time" | "overnight" | "weekend" | "full_day" | "travel_trips";
    incall?: number;
    outcall?: number;
  }>;
  isProfileComplete: boolean;
  emailisVerified: boolean;
  isVerified: boolean;
  verificationStatus?:
    | "not_started"
    | "pending"
    | "manual_review_pending"
    | "approved"
    | "rejected";
  onboardingStage?: "path_selection" | "funmate_profile" | "complete";
  adminRole?: "super-admin" | "admin" | null;
  adminPermissions?: string[];
  role?: "seeker" | "funmate";
  referralCode?: string; // ← add
  // profile fields
  age?: number;
  state?: string;
  lga?: string;
  education?: string;
  occupation?: string;
  gender?: string;
  orientation?: string;
  bodyType?: string[];
  height?: string;
  skinTone?: string;
  bustSize?: string;
  experiences?: string[];
  intent?: string[];
  currentWant?: string;
  vibeBio?: string;
  profileMedia?: string[];
  galleryCompleted?: boolean;
  isActivated?: boolean;
  activationStatus?: "none" | "pending" | "activated";
  activationAmount?: number;
  activationCoins?: number;
  boostTier?: "regular" | "fresher" | "elite" | "elite_plus";
  boostStatus?: "none" | "pending";
  pendingBoostTier?: "fresher" | "elite" | "elite_plus" | null;
  signupBonusGranted?: boolean;
  signupBonusSeen?: boolean;
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  setUser: (user: User | null) => void;
  refreshUser: () => Promise<void>;
  logout: () => void;
  loading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);
const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUserState] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const refreshUser = useCallback(async () => {
    const stored = localStorage.getItem("bf_token");
    if (!stored) return;
    try {
      const res = await fetch(`${API}/api/auth/me`, {
        headers: { Authorization: `Bearer ${stored}` },
      });
      if (!res.ok) return;
      const data = await res.json();
      if (data?.user) setUserState(data.user);
    } catch {}
  }, []);

  useEffect(() => {
    const stored = localStorage.getItem("bf_token");
    if (!stored) {
      setLoading(false);
      return;
    }
    setToken(stored);
    fetch(`${API}/api/auth/me`, {
      headers: { Authorization: `Bearer ${stored}` },
    })
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (data?.user) setUserState(data.user);
        else localStorage.removeItem("bf_token");
      })
      .catch(() => localStorage.removeItem("bf_token"))
      .finally(() => setLoading(false));
  }, []);

  function setUser(u: User | null) {
    setUserState(u);
    if (!u) {
      setToken(null);
      localStorage.removeItem("bf_token");
    }
  }
  function logout() {
    setUserState(null);
    setToken(null);
    localStorage.removeItem("bf_token");
  }

  return (
    <AuthContext.Provider
      value={{ user, token, setUser, refreshUser, logout, loading }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
