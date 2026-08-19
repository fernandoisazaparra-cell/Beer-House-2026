import {
    RegisterPage
} from '@/pages/auth';

import {
    Routes,
    Route
} from 'react-router-dom';

export const Authroute = {
    "registre": "auth/registre"
}

export const AuthRoutesPublic = () => {
    return (
        <Routes>
            <Route path={Authroute.registre} element={<RegisterPage />} />
        </Routes>
    )
}