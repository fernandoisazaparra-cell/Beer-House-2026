
// Fetch con sesión: agrega automáticamente el token JWT.

export const TOKEN_KEY = "bh_token";
export const USER_KEY = "bh_user";

export const getToken = (): string | null => {
    if (typeof window === "undefined") return null;
    return localStorage.getItem(TOKEN_KEY);
};


export const authFetch = (
    input: RequestInfo | URL,
    init: RequestInit = {}
): Promise<Response> => {

    const headers = new Headers(init.headers);
    const token = getToken();

    if (token) {
        headers.set("Authorization", `Bearer ${token}`);
    }

    return fetch(input, {
        ...init,
        headers
    });
};


// Descarga archivos de rutas protegidas.
export const downloadWithAuth = async (
    url: string,
    fallbackName: string
): Promise<void> => {

    const res = await authFetch(url);

    if (!res.ok) {
        const err = await res.json().catch(() => ({}));

        throw new Error(
            err.error ||
            err.message ||
            "No se pudo descargar el archivo."
        );
    }

    const disposition =
        res.headers.get("Content-Disposition") || "";

    let fileName = fallbackName;

    // Primero intenta obtener el nombre UTF-8.
   const utf8Match = disposition.match(
    /filename\*\s*=\s*UTF-8''([^;]+)/i
);
    // Si no existe, busca filename convencional.
    const normalMatch = disposition.match(
        /filename\s*=\s*"?([^";]+)"?/i
    );

    if (utf8Match?.[1]) {
        try {
            fileName = decodeURIComponent(
                utf8Match[1].replace(/"/g, "")
            );
        } catch {
            fileName = fallbackName;
        }
    } else if (normalMatch?.[1]) {
        fileName = normalMatch[1].trim();
    }

    const blob = await res.blob();

    if (blob.size === 0) {
        throw new Error("El archivo descargado está vacío.");
    }

    const objectUrl = URL.createObjectURL(blob);

    const link = document.createElement("a");

    link.href = objectUrl;
    link.download = fileName;

    document.body.appendChild(link);
    link.click();
    link.remove();

    setTimeout(() => {
        URL.revokeObjectURL(objectUrl);
    }, 1000);
};
