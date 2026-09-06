import {
    AuthRoutesPublic
} from './'
import { Route, Routes, BrowserRouter } from 'react-router-dom';
import { Home, ProductsPage, MainLayout, CarritoPage } from '@/pages';

import Dashboard from '@/pages/dashboard/Dashboard';
import PedidosAdmin from '@/pages/dashboard/PedidosAdmin';
import ProductosAdmin from '@/pages/dashboard/ProductosAdmin';
import CategoriasAdmin from '@/pages/dashboard/CategoriasAdmin';
import InventarioAdmin from '@/pages/dashboard/InventarioAdmin';
import ClientesAdmin from '@/pages/dashboard/ClientesAdmin';
import VentasAdmin from '@/pages/dashboard/VentasAdmin';
import PromocionesAdmin from '@/pages/dashboard/PromocionesAdmin';

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

            <Route element={<MainLayout />}>

                {/* Rutas Públicas */}
                <Route index element={<Home />} />
                <Route path="productos" element={<ProductsPage />} />
                <Route path="carrito" element={<CarritoPage />} />

                {/* Dashboard y Subrutas */}
                <Route path="dashboard" element={<Dashboard />}>
                    <Route path="pedidos" element={<PedidosAdmin />} />
                    <Route path="productos" element={<ProductosAdmin />} />
                    <Route path="categorias" element={<CategoriasAdmin />} />
                    <Route path="inventario" element={<InventarioAdmin />} />
                    <Route path="clientes" element={<ClientesAdmin />} />
                    <Route path="ventas" element={<VentasAdmin />} />
                    <Route path="promociones" element={<PromocionesAdmin />} />
                </Route>

            </Route>
        </Routes>
    );
};