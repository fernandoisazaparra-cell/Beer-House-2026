export const API_URL = import.meta.env.VITE_API_URL

export const API_ROUTES = {
    Auth: {
        Registre: '/auth/register',
        Login: '/auth/login',
        VerifyEmail: '/auth/verify-email',
        TokenRepeat: '/auth/token-repeat',
        TokenGoogle: '/auth/token-google',
        ConfirmTerms: '/auth/confirm-terms'
    }
}