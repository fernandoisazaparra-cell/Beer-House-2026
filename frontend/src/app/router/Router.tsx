import {
    Route,
    Routes,
    BrowserRouter
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
        <BrowserRouter>
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
        </BrowserRouter>
    );
};