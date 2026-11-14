import { API_ROUTES, getApiUrl } from "@/app/api";

// =====================================================
// TIPOS
// =====================================================

export interface RegisterData {
  name: string;
  first_name: string;
  last_name: string;
  email: string;
  password: string;
  terms: boolean;
  years: boolean;
}
export interface VerifyEmailData {
  email: string;
  code: string;
}

export interface LoginData {
  email: string;
  password: string;
}

export interface LoginResponse {
  token: string;
  user: {
    id: number;
    first_name?: string;
    last_name?: string;
    name: string;
    email: string;
    rol: string;
  };
  requires_confirmation?: boolean;
}

export type CurrentUserResponse = LoginResponse["user"];

export const getCurrentUser = async (
  token: string,
): Promise<CurrentUserResponse> => {
  return apiRequest<CurrentUserResponse>(getApiUrl(API_ROUTES.Auth.Me), {
    method: "GET",
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
};

export interface RegisterResponse {
  message?: string;
  codigo?: string;
}

export interface ApiErrorResponse {
  message?: string;
  error?: string;
  errors?: Record<string, string[]>;
}

// =====================================================
// ERROR PERSONALIZADO
// =====================================================

export class ApiError extends Error {
  status: number;
  errors?: Record<string, string[]>;

  constructor(
    message: string,
    status: number,
    errors?: Record<string, string[]>,
  ) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.errors = errors;
  }
}

// =====================================================
// FUNCIÓN CENTRAL DE PETICIONES
// =====================================================

const apiRequest = async <T>(url: string, options: RequestInit): Promise<T> => {
  let response: Response;

  try {
    response = await fetch(url, options);
  } catch {
    throw new ApiError("No se pudo conectar con el servidor.", 0);
  }

  const result: ApiErrorResponse | T = await response.json().catch(() => ({}));

  if (!response.ok) {
    const error = result as ApiErrorResponse;

    throw new ApiError(
      error.message ||
        error.error ||
        "Ocurrió un error al procesar la solicitud.",
      response.status,
      error.errors,
    );
  }

  return result as T;
};

// =====================================================
// REGISTRO
// =====================================================

export const registreUser = async (
  data: RegisterData,
): Promise<RegisterResponse> => {
  return apiRequest<RegisterResponse>(getApiUrl(API_ROUTES.Auth.Registre), {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(data),
  });
};

// =====================================================
// LOGIN
// =====================================================

export const loginUser = async (data: LoginData): Promise<LoginResponse> => {
  return apiRequest<LoginResponse>(getApiUrl(API_ROUTES.Auth.Login), {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(data),
  });
};

// =====================================================
// VERIFICACIÓN DE EMAIL
// =====================================================

export const verifyEmail = async (data: VerifyEmailData) => {
  return apiRequest(getApiUrl(API_ROUTES.Auth.VerifyEmail), {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(data),
  });
};

// =====================================================
// REENVÍO DE CÓDIGO
// =====================================================

export const RepeatToken = async (email: string) => {
  return apiRequest(getApiUrl(API_ROUTES.Auth.TokenRepeat), {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ email }),
  });
};

// =====================================================
// LOGIN CON GOOGLE
// =====================================================

export const loginGoogle = async (code: string): Promise<LoginResponse> => {
  return apiRequest<LoginResponse>(getApiUrl(API_ROUTES.Auth.TokenGoogle), {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ code }),
  });
};

// =====================================================
// CONFIRMACIÓN DE TÉRMINOS
// =====================================================

export const confirmTerms = async (token: string, termsVersion = "v1.0") => {
  return apiRequest(getApiUrl(API_ROUTES.Auth.ConfirmTerms), {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({
      terms_version: termsVersion,
    }),
  });
};
