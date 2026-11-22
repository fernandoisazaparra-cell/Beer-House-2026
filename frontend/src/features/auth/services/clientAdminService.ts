import { authFetch, getToken } from "@/shared/lib/authFetch";
import { API_URL } from "@/app/api";

export interface ClientUser {
  id: number;
  name: string;
  email: string;
  rol?: string;
  estado?: string;
}

export interface AdminUserPayload {
  name: string;
  email: string;
  password?: string;
  rol?: string;
}

const USERS_URL = `${API_URL.replace(/\/+$/, "")}/users/`;

const request = async <T>(
  url: string,
  init: RequestInit = {}
): Promise<T> => {
  if (!getToken()) {
    throw new Error("No hay una sesión activa.");
  }

  const response = await authFetch(url, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...init.headers,
    },
  });

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(
      data.message ||
        data.error ||
        "Ocurrió un error al procesar la solicitud."
    );
  }

  return data as T;
};

export const getClientsList = async (): Promise<ClientUser[]> => {
  const data = await request<ClientUser[]>(USERS_URL);

  if (!Array.isArray(data)) {
    throw new Error("La respuesta de usuarios tiene un formato inválido.");
  }

  return data;
};

export const createUserAdmin = async (
  payload: AdminUserPayload
): Promise<{ message: string; id: number }> =>
  request<{ message: string; id: number }>(USERS_URL, {
    method: "POST",
    body: JSON.stringify(payload),
  });

export const updateUserAdmin = async (
  userId: number,
  payload: AdminUserPayload
): Promise<{ message: string }> =>
  request<{ message: string }>(`${USERS_URL}${userId}`, {
    method: "PUT",
    body: JSON.stringify(payload),
  });

export const deleteUserAdmin = async (
  userId: number
): Promise<{ message: string }> =>
  request<{ message: string }>(`${USERS_URL}${userId}`, {
    method: "DELETE",
  });

// Mantenido por compatibilidad con pantallas que aún lo importan.
export const toggleUserStatus = async (
  _userId: number,
  _isActive: boolean
): Promise<never> => {
  throw new Error(
    "La activación y desactivación de usuarios todavía no está implementada en el backend."
  );
};
