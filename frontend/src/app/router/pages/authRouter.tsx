import {
    RegisterPage
} from '@/pages/auth/registerPage';

import {
    Route
} from 'react-router-dom';

import {
    API_ROUTES
} from '@/app/api'

export const AuthRoutesPublic = (
    <>
        <Route path={API_ROUTES.Auth.Registre} element={<RegisterPage />} />
    </>
)
