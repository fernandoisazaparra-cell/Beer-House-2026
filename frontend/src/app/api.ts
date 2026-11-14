
export const API_URL =
    import.meta.env.VITE_API_URL || 'http://localhost:5000/api';


export const API_ROUTES = {
    Auth: {
        Registre: '/auth/register',
        Login: '/auth/login',
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

export const getApiUrl = (endpoint: string): string => {
    return `${API_URL.replace(/\/+$/, '')}/${endpoint.replace(/^\/+/, '')}`;
};
