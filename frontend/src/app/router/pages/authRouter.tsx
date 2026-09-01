import {
    AuthPage
} from '@/pages/auth/authPage';

import {
    Route
} from 'react-router-dom';

import {
    API_ROUTES
} from '@/app/api'

export const AuthRoutesPublic = (
    <>
        <Route path={API_ROUTES.Auth.Registre} element={<AuthPage />} />
        <Route path={API_ROUTES.Auth.Login} element={<AuthPage />} />
    </>
)
