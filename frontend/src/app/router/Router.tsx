import { Route, Routes, BrowserRouter } from 'react-router-dom';
import { Home, ProductsPage, MainLayout, CarritoPage } from '@/pages';

import Dashboard from '@/pages/Dashboard/Dashboard';
import PedidosAdmin from '@/pages/Dashboard/PedidosAdmin';
import ProductosAdmin from '@/pages/Dashboard/ProductosAdmin';
import CategoriasAdmin from '@/pages/Dashboard/CategoriasAdmin';
import InventarioAdmin from '@/pages/Dashboard/InventarioAdmin';
import ClientesAdmin from '@/pages/Dashboard/ClientesAdmin';
import VentasAdmin from '@/pages/Dashboard/VentasAdmin';
import PromocionesAdmin from '@/pages/Dashboard/PromocionesAdmin';

export const AppRoutes = () => {
    return (
        <BrowserRouter>
            <Routes>
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
        </BrowserRouter>
    );
};