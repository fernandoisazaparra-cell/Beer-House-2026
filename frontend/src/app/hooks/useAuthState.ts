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

        const currentUser = ("user" in result ? result.user : result) as user;

        if (!currentUser) {
          throw new Error("Usuario no disponible");
        }

        localStorage.setItem(STORAGE_KEY_USER, JSON.stringify(currentUser));

        setToken(storedToken);
        setUser(currentUser);
        setIsAuth(true);
        setNeedsTermsConfirmation(false);
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
      navigate("/auth/confirm-terms");
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
      navigate("/auth/confirm-terms");
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

  // Cierre de sesión.
  const logout = () => {
    localStorage.removeItem(STORAGE_KEY_TOKEN);
    localStorage.removeItem(STORAGE_KEY_USER);

    setToken(null);
    setUser(null);
    setIsAuth(false);
    setIsAuthLoading(false);
    setNeedsTermsConfirmation(false);

    navigate("/");
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

    logout,
    login,
    loginWithGoogle,

    needsTermsConfirmation,
    confirmGoogleTerms,
  };
};
