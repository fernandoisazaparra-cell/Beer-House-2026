import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

import {
  loginUser,
  type LoginResponse,
  getCurrentUser,
  confirmTerms,
  ApiError,
} from "@/features/auth/services";

import { type userRol } from "@/config";
import { API_ROUTES, getApiUrl } from "@/app/api";
import { authFetch } from "@/shared/lib/authFetch";

export interface user {
  id: number;
  name: string;
  email: string;
  rol: string;
}

const STORAGE_KEY_TOKEN = "bh_token";
const STORAGE_KEY_USER = "bh_user";

const getStoredUser = (): user | null => {
  try {
    const stored = localStorage.getItem(STORAGE_KEY_USER);

    if (!stored) return null;

    const parsed = JSON.parse(stored);

    if (
      !parsed ||
      typeof parsed.id !== "number" ||
      typeof parsed.email !== "string" ||
      typeof parsed.rol !== "string"
    ) {
      localStorage.removeItem(STORAGE_KEY_USER);
      return null;
    }

    return parsed;
  } catch {
    localStorage.removeItem(STORAGE_KEY_USER);
    return null;
  }
};

export const useAuthState = () => {
  const navigate = useNavigate();

  const [token, setToken] = useState<string | null>(() =>
    localStorage.getItem(STORAGE_KEY_TOKEN),
  );

  const [user, setUser] = useState<user | null>(getStoredUser);

  const [isAuth, setIsAuth] = useState(false);

  const [isAuthLoading, setIsAuthLoading] = useState(
    () => !!localStorage.getItem(STORAGE_KEY_TOKEN),
  );

  const [needsTermsConfirmation, setNeedsTermsConfirmation] = useState(false);

  const currentRole: userRol = (user?.rol ?? "guest") as userRol;

  // Recuperar y validar la sesión al iniciar la aplicación.
  useEffect(() => {
    let cancelled = false;

    const restoreSession = async () => {
      const storedToken = localStorage.getItem(STORAGE_KEY_TOKEN);

      if (!storedToken) {
        setToken(null);
        setUser(null);
        setIsAuth(false);
        setNeedsTermsConfirmation(false);
        setIsAuthLoading(false);
        return;
      }

      setIsAuthLoading(true);

      try {
        const result = await getCurrentUser(storedToken);

        if (cancelled) return;

        const currentUser = result.user as user;

        if (!currentUser) {
          throw new Error("Usuario no disponible");
        }

        localStorage.setItem(STORAGE_KEY_USER, JSON.stringify(currentUser));

        setToken(storedToken);
        setUser(currentUser);
        setIsAuth(true);
        // El backend indica en /auth/me si faltan términos o edad (RN-020).
        setNeedsTermsConfirmation(Boolean(result.requires_confirmation));
      } catch (error) {
        if (cancelled) return;

        // Si el servidor rechaza el token,
        // se elimina la sesión inválida.
        if (error instanceof ApiError && error.status === 401) {
          localStorage.removeItem(STORAGE_KEY_TOKEN);
          localStorage.removeItem(STORAGE_KEY_USER);

          setToken(null);
          setUser(null);
          setIsAuth(false);
          setNeedsTermsConfirmation(false);
        } else {
          // No se concede acceso sin validar la sesión.
          setIsAuth(false);
          setUser(null);
        }
      } finally {
        if (!cancelled) {
          setIsAuthLoading(false);
        }
      }
    };

    restoreSession();

    return () => {
      cancelled = true;
    };
  }, []);

  // Un 401 de authFetch (token vencido o revocado) limpia también el estado React.
  useEffect(() => {
    const handleSessionExpired = () => {
      setToken(null);
      setUser(null);
      setIsAuth(false);
      setIsAuthLoading(false);
      setNeedsTermsConfirmation(false);
    };

    window.addEventListener("auth:session-expired", handleSessionExpired);
    return () =>
      window.removeEventListener("auth:session-expired", handleSessionExpired);
  }, []);

  const SetAuth = () => {
    setIsAuth(true);
  };

  const NotAuth = () => {
    setIsAuth(false);
  };

  // Inicio de sesión tradicional.
  const login = async (email: string, password: string) => {
    const result: LoginResponse = await loginUser({
      email,
      password,
    });

    localStorage.setItem(STORAGE_KEY_TOKEN, result.token);
    localStorage.setItem(STORAGE_KEY_USER, JSON.stringify(result.user));

    setToken(result.token);
    setUser(result.user);
    setIsAuth(true);
    setNeedsTermsConfirmation(result.requires_confirmation ?? false);

    if (result.requires_confirmation) {
      navigate("/");
    } else {
      navigate("/");
    }
  };

  // Inicio de sesión con Google.
  const loginWithGoogle = (result: LoginResponse) => {
    localStorage.setItem(STORAGE_KEY_TOKEN, result.token);
    localStorage.setItem(STORAGE_KEY_USER, JSON.stringify(result.user));

    setToken(result.token);
    setUser(result.user);
    setIsAuth(true);

    const requiresConfirmation = result.requires_confirmation ?? false;

    setNeedsTermsConfirmation(requiresConfirmation);

    if (requiresConfirmation) {
      navigate("/");
    } else {
      navigate("/");
    }
  };

  // Confirmación de términos.
  const confirmGoogleTerms = async (termsVersion = "v1.0") => {
    const currentToken = token || localStorage.getItem(STORAGE_KEY_TOKEN);

    if (!currentToken) {
      throw new Error("Token no disponible");
    }

    await confirmTerms(currentToken, termsVersion);

    setNeedsTermsConfirmation(false);
    navigate("/");
  };

  // Cierre de sesión: revoca el token en el servidor (RI-008) y limpia el cliente.
  const logout = async () => {
    try {
      await authFetch(getApiUrl(API_ROUTES.Auth.Logout), {
        method: "POST",
      });
    } catch {
      // Aun si el servidor no responde, la sesión local se cierra.
    }

    localStorage.removeItem(STORAGE_KEY_TOKEN);
    localStorage.removeItem(STORAGE_KEY_USER);

    setToken(null);
    setUser(null);
    setIsAuth(false);
    setIsAuthLoading(false);
    setNeedsTermsConfirmation(false);

    navigate("/");
  };

  // Mantiene el usuario guardado sincronizado tras un cambio de perfil.
  const updateCurrentUser = (changes: Partial<user>) => {
    if (!user) return;

    const updated = { ...user, ...changes };

    localStorage.setItem(STORAGE_KEY_USER, JSON.stringify(updated));
    setUser(updated);
  };

  return {
    isAuth,
    isAuthLoading,
    SetAuth,
    NotAuth,

    token,
    setToken,

    user,
    currentRole,
    setUser,
    updateCurrentUser,

    logout,
    login,
    loginWithGoogle,

    needsTermsConfirmation,
    confirmGoogleTerms,
  };
};
