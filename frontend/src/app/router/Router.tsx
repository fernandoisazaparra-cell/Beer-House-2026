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

export const AppRoutes = () => {
    return (
        <BrowserRouter>
            <Routes>
                <Route element={<MainLayout />}>
                    <Route index element={<Home/>}/>
                    {/* <Route path='1' element={<Test2/>}/> */}
                </Route>
            </Routes>
        </BrowserRouter>
    )
}