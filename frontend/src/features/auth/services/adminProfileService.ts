
import { authFetch, getToken } from "@/shared/lib/authFetch";
import { API_URL } from "@/app/api";

export interface ProfileRequestItem {
    id: number;
    user_id: number;
    current_name: string;
    user_email: string;
    requested_first_name: string;
    requested_last_name: string;
    requested_birth_date: string | null;
    created_at: string;
}

const PROFILE_REQUESTS_URL =
    `${API_URL.replace(/\/+$/, "")}/auth/admin/profile-requests`;


const request = async <T>(
    url: string,
    options: RequestInit = {}
): Promise<T> => {

    if (!getToken()) {
        throw new Error("No hay una sesión activa.");
    }

    const response = await authFetch(url, options);

    const data = await response.json().catch(() => ({}));

    if (!response.ok) {
        throw new Error(
            data.message ||
            data.error ||
            "No se pudo completar la solicitud."
        );
    }

    return data as T;
};


// Obtener solicitudes pendientes.
export const getPendingProfileRequests = async ():
    Promise<ProfileRequestItem[]> => {

    const data = await request<{
        requests: ProfileRequestItem[]
    }>(PROFILE_REQUESTS_URL);

    return data.requests;
};


// Aprobar solicitud.
export const approveProfileRequest = async (
    requestId: number
) => {

    return request(
        `${PROFILE_REQUESTS_URL}/${requestId}/approve`,
        {
            method: "POST"
        }
    );
};


// Rechazar solicitud.
export const rejectProfileRequest = async (
    requestId: number
) => {

    return request(
        `${PROFILE_REQUESTS_URL}/${requestId}/reject`,
        {
            method: "POST"
        }
    );
};
