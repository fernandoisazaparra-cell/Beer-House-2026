import {
    Route,
    Routes,
    BrowserRouter
} from 'react-router-dom'

import {
    Home
} from '@/pages'

import {
    MainLayout
} from '@/pages'

import {
    AuthRoutesPublic
} from './'

export const AppRoutes = () => {
    return (
        <BrowserRouter>
            <Routes>
                <Route element={<MainLayout />}>
                    <Route index element={<Home/>} />
                    <Route path = "*" element={<AuthRoutesPublic />} />
                </Route>
            </Routes>
        </BrowserRouter>
    )
}