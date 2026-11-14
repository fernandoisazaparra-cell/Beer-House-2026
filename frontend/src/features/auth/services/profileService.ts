
import { authFetch, getToken } from "@/shared/lib/authFetch";
import { API_ROUTES, getApiUrl } from "@/app/api";

export interface UpdateProfilePayload {
    first_name: string;
    last_name: string;
    birth_date?: string;
}

export interface ProfileResponse {
    status: string;
    message: string;
    days_registered?: number;
    user?: {
        first_name: string;
        last_name: string;
        email: string;
    };
}

export const updateProfile = async (
    data: UpdateProfilePayload
) => {

    const token = getToken();

    if (!token) {
        throw new Error("No hay una sesión activa.");
    }

    const response = await authFetch(
        getApiUrl(API_ROUTES.Auth.Profile),
        {
            method: "PUT",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify(data)
        }
    );

    const result: ProfileResponse = await response
        .json()
        .catch(() => ({
            status: "error",
            message: "El servidor devolvió una respuesta inválida."
        }));

    if (!response.ok && response.status !== 202) {
        throw new Error(
            result.message || "Error al actualizar el perfil."
        );
    }

    return {
        status: response.status,
        data: result
    };
};
