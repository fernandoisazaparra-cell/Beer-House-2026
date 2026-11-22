
export const API_URL =
    import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

// Rutas de la API
export const API_ROUTES = {
    Auth: {
        Registre: '/auth/register',
        Login: '/auth/login',
        Logout: '/auth/logout',
        Me: '/auth/me',
        VerifyEmail: '/auth/verify-email',
        TokenRepeat: '/auth/token-repeat',
        TokenGoogle: '/auth/token-google',
        ConfirmTerms: '/auth/confirm-terms',
        Profile: '/auth/profile',
    },

    Products: {
        List: '/products/',
        Create: '/products/',
        Update: (id: string | number) => `/products/${id}`,
        Delete: (id: string | number) => `/products/${id}`,
    },
};

// Construir URL completa
export const getApiUrl = (endpoint: string): string => {
    const baseUrl = API_URL.replace(/\/+$/, '');
    const path = endpoint.replace(/^\/+/, '');

    return `${baseUrl}/${path}`;
};

