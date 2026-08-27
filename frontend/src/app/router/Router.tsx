import {
    Route,
    Routes,
    BrowserRouter
} from 'react-router-dom'

import {
    Home,ProductsPage
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
                     <Route path="productos" element={<ProductsPage/>}/>
                </Route>
            </Routes>
        </BrowserRouter>
    )
}