
import { authFetch, getToken } from "@/shared/lib/authFetch";
import { API_URL } from "@/app/api";

export interface ClientUser {
    id: number;
    name: string;
    email: string;
}

const USERS_URL =
    `${API_URL.replace(/\/+$/, "")}/users/`;

export const getClientsList = async (): Promise<ClientUser[]> => {

    if (!getToken()) {
        throw new Error("No hay una sesión activa.");
    }

    const response = await authFetch(USERS_URL);

    const data = await response.json().catch(() => ({}));

    if (!response.ok) {
        throw new Error(
            data.message ||
            data.error ||
            "Error al obtener la lista de usuarios."
        );
    }

    // El backend devuelve directamente un array.
    if (!Array.isArray(data)) {
        throw new Error("La respuesta de usuarios tiene un formato inválido.");
    }

    return data as ClientUser[];
};


// Esta operación todavía no está implementada en el backend.
export const toggleUserStatus = async (
    _userId: number,
    _isActive: boolean
): Promise<never> => {
    throw new Error(
        "La activación y desactivación de usuarios todavía no está implementada en el backend."
    );
};

