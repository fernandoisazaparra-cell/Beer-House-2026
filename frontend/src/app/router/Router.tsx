import {
    Route,
    Routes
} from 'react-router-dom';

import {
    Home,
    MainLayout
} from '@/pages';

import {
    AuthRoutesPublic
} from './'

export const AppRoutes = () => {
    return (
        <Routes>

            {/* Rutas principales */}
            <Route element={<MainLayout />}>
                <Route
                    index
                    element={<Home />}
                />
                {AuthRoutesPublic}
            </Route>
        </Routes>
    );
};