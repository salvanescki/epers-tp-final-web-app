import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { jwtDecode } from "jwt-decode";
import { googleLogout } from "@react-oauth/google";

interface GoogleJwtPayload {
  name?: string;
  picture?: string;
  email?: string;
  exp?: number;
}

interface AuthContextValue {
  credential: string | null;
  profile: GoogleJwtPayload | null;
  isAuthenticated: boolean;
  isExpired: boolean;
  initialized: boolean;

  nightBringerId: number | null;
  setNightBringerId: (id: number | null) => void;

  selectedClass: string | null;
  setSelectedClass: (cls: string | null) => void;

  login: (credential: string) => void;
  logout: () => void;
}

const LOCAL_KEY = "google_credential";
const LOCAL_CLASS_KEY = "selected_player_class";
const LOCAL_NB_ID = "nightbringer_id";

// Funciones helper para gestionar datos específicos por usuario
const getUserClassKey = (email: string) => `${LOCAL_CLASS_KEY}_${email}`;
const getUserNBKey = (email: string) => `${LOCAL_NB_ID}_${email}`;

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [credential, setCredential] = useState<string | null>(null);
  const [profile, setProfile] = useState<GoogleJwtPayload | null>(null);
  const [isExpired, setIsExpired] = useState<boolean>(false);
  const [initialized, setInitialized] = useState(false);

  const [selectedClass, setSelectedClassState] = useState<string | null>(null);
  const [nightBringerId, setNightBringerId] = useState<number | null>(null);

  const timeoutRef = useRef<number | null>(null);

  const clearTimer = () => {
    if (timeoutRef.current) {
      window.clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
  };

  const evaluateExpiration = useCallback((payload: GoogleJwtPayload | null) => {
    if (!payload?.exp) {
      setIsExpired(true);
      return;
    }
    const nowSec = Math.floor(Date.now() / 1000);
    const remaining = payload.exp - nowSec;
    if (remaining <= 0) {
      setIsExpired(true);
      return;
    }
    setIsExpired(false);
    clearTimer();
    timeoutRef.current = window.setTimeout(() => {
      setIsExpired(true);
      logout();
    }, remaining * 1000);
  }, []);

  const logout = useCallback(() => {
    clearTimer();
    googleLogout();

    localStorage.removeItem(LOCAL_KEY);
    // Limpiar claves antiguas sin email (por compatibilidad)
    localStorage.removeItem(LOCAL_CLASS_KEY);
    localStorage.removeItem(LOCAL_NB_ID);

    setCredential(null);
    setProfile(null);
    setSelectedClassState(null);
    setNightBringerId(null);
    setIsExpired(false);
  }, []);

  const login = useCallback(
    (cred: string) => {
      localStorage.setItem(LOCAL_KEY, cred);
      setCredential(cred);

      try {
        const decoded = jwtDecode<GoogleJwtPayload>(cred);
        setProfile(decoded);
        
        // Cargar datos específicos de este usuario
        if (decoded.email) {
          const userClassKey = getUserClassKey(decoded.email);
          const userNBKey = getUserNBKey(decoded.email);
          
          const storedClass = localStorage.getItem(userClassKey);
          if (storedClass) {
            setSelectedClassState(storedClass);
          } else {
            setSelectedClassState(null);
          }
          
          const storedNB = localStorage.getItem(userNBKey);
          if (storedNB) {
            setNightBringerId(Number(storedNB));
          } else {
            setNightBringerId(null);
          }
        }
        
        evaluateExpiration(decoded);
      } catch {
        setProfile(null);
        logout();
      }
    },
    [evaluateExpiration, logout]
  );

  useEffect(() => {
    const stored = localStorage.getItem(LOCAL_KEY);
    if (stored) {
      try {
        const decoded = jwtDecode<GoogleJwtPayload>(stored);
        const nowSec = Math.floor(Date.now() / 1000);

        if (decoded.exp && decoded.exp > nowSec) {
          setCredential(stored);
          setProfile(decoded);
          evaluateExpiration(decoded);
        } else {
          logout();
        }
      } catch {
        logout();
      }
    }

    // Cargar clase y nightBringer del usuario actual si está autenticado
    if (stored) {
      try {
        const decoded = jwtDecode<GoogleJwtPayload>(stored);
        if (decoded.email) {
          const userClassKey = getUserClassKey(decoded.email);
          const userNBKey = getUserNBKey(decoded.email);
          
          const storedClass = localStorage.getItem(userClassKey);
          if (storedClass) {
            setSelectedClassState(storedClass);
          }
          
          const storedNB = localStorage.getItem(userNBKey);
          if (storedNB) {
            setNightBringerId(Number(storedNB));
          }
        }
      } catch {
        // Ignorar error de decodificación
      }
    }

    setInitialized(true);
    return () => clearTimer();
  }, [evaluateExpiration, logout]);

  const setSelectedClass = useCallback((cls: string | null) => {
    setSelectedClassState(cls);
    if (profile?.email) {
      const userClassKey = getUserClassKey(profile.email);
      if (cls) localStorage.setItem(userClassKey, cls);
      else localStorage.removeItem(userClassKey);
    }
  }, [profile]);

  const value = useMemo(
    () => ({
      credential,
      profile,
      isAuthenticated: !!credential && !!profile && !isExpired,
      isExpired,
      initialized,

      nightBringerId,
      setNightBringerId: (id: number | null) => {
        setNightBringerId(id);
        if (profile?.email) {
          const userNBKey = getUserNBKey(profile.email);
          if (id === null) localStorage.removeItem(userNBKey);
          else localStorage.setItem(userNBKey, String(id));
        }
      },

      selectedClass,
      setSelectedClass,

      login,
      logout,
    }),
    [
      credential,
      profile,
      isExpired,
      initialized,
      nightBringerId,
      selectedClass,
      login,
      logout,
      setSelectedClass,
    ]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuthContext = () => {
  const ctx = useContext(AuthContext);
  if (!ctx)
    throw new Error("useAuthContext debe usarse dentro de AuthProvider");
  return ctx;
};
