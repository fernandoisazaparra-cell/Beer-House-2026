import React, { useState, useEffect } from 'react';
import './ProductosAdmin.css';
import { AiOutlineProduct } from '@/ui/icons';
import { authFetch } from "@/shared/lib/authFetch";
import { API_URL } from "@/app/api";
import { useAuth } from "@/app/context/authUse";
import { CreateComboModal } from '../../features/productos/componets/CreateComboModal';
import { DEFAULT_LEGAL_WARNING, resolveLegalWarning } from '../../features/productos/catalog.types';
import type { Combo } from '../../features/productos/combos.types';

const IMAGE_PLACEHOLDER = 'https://via.placeholder.com/100?text=Beer';

type ProductStatus = 'Disponible' | 'Agotado';
type AvailabilityFilter = 'all' | 'available' | 'out_of_stock';

export interface Product {
  id: string | number;
  name: string;
  category: string;
  price: number;
  stock: number;
  imageUrl: string;
  description: string;
  legalWarning: string;
  status: ProductStatus;
  isActive: boolean;
}

export const ProductosAdmin = () => {
  const { user } = useAuth();
  // RF-018 / RN-017: solo admin puede ver la acción de eliminar.
  const canDelete = user?.rol === 'admin';

  const [products, setProducts] = useState<Product[]>([]);
  const [combosList, setCombosList] = useState<Combo[]>([]);
  const [activeTab, setActiveTab] = useState<'products' | 'combos'>('products');
  const [loading, setLoading] = useState<boolean>(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [availabilityFilter, setAvailabilityFilter] = useState<AvailabilityFilter>('all');

  // Estado para controlar el modal de creación/edición de Combos (RF-056)
  const [isComboModalOpen, setIsComboModalOpen] = useState(false);
  const [editingCombo, setEditingCombo] = useState<Combo | null>(null);

  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [imagePreview, setImagePreview] = useState<string>('');

  const [formData, setFormData] = useState({
    name: '',
    category: 'Cerveza',
    price: '',
    stock: '',
    description: '',
    legalWarning: DEFAULT_LEGAL_WARNING,
  });

  const fetchProducts = async () => {
    try {
      setLoading(true);
      // RF-011 / RI-011 / RN-011: incluir agotados (e inactivos) en el listado admin.
      const response = await authFetch(`${API_URL}/products/?include_inactive=true`);
      if (!response.ok) throw new Error('Error al consultar productos');
      const data = await response.json();

      const mappedProducts: Product[] = data.map((p: any) => {
        const stock = Number(p.stock ?? 0);
        const status: ProductStatus =
          p.status === 'Disponible' || p.status === 'Agotado'
            ? p.status
            : stock > 0 ? 'Disponible' : 'Agotado';

        return {
          id: p.id || p.id_producto || 'PROD-000',
          name: p.name || p.nombre || 'Producto sin nombre',
          category: p.category || p.categoria || p.liquor_type || 'Licor',
          price: Number(p.price ?? p.precio ?? 0),
          stock,
          imageUrl: p.imageUrl || p.imagen || p.image_url || '',
          description: p.description || p.descripcion || '',
          legalWarning: resolveLegalWarning(p.legal_warning),
          status,
          isActive: p.is_active !== false,
        };
      });

      setProducts(mappedProducts);
    } catch (error) {
      console.error('Error al cargar productos desde la BD:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchCombos = async () => {
    try {
      const response = await authFetch(`${API_URL}/products/combos`);
      if (response.ok) {
        const data = await response.json();

        const mappedCombos = (Array.isArray(data) ? data : []).map((c: any) => ({
          id: c.id,
          name: c.name || c.nombre,
          description: c.description || c.descripcion,
          price: Number(c.price || c.precio || 0),
          discount: Number(c.discount || c.descuento || 0),
          imageUrl: c.imageUrl || c.image_url || c.imagen || 'https://via.placeholder.com/100?text=Combo',
          stock: Number(c.stock || 0),
          status: c.status || 'active',
          productsIncluded: c.productsIncluded || [],
        }));

        setCombosList(mappedCombos);
      }
    } catch (error) {
      console.error('Error al cargar combos en admin:', error);
    }
  };

  useEffect(() => {
    fetchProducts();
    fetchCombos();
  }, []);

  const visibleProducts = products.filter((product) => {
    if (availabilityFilter === 'available') return product.status === 'Disponible';
    if (availabilityFilter === 'out_of_stock') return product.status === 'Agotado';
    return true;
  });

  const handleOpenAddCombo = () => {
    setEditingCombo(null);
    setIsComboModalOpen(true);
  };

  const handleOpenEditCombo = (combo: Combo) => {
    setEditingCombo(combo);
    setIsComboModalOpen(true);
  };

  const handleSaveCombo = async (comboData: Combo) => {
    try {
      const isEditing = !!editingCombo;
      const url = isEditing
        ? `${API_URL}/products/combos/${editingCombo.id}`
        : `${API_URL}/products/combos`;

      const method = isEditing ? 'PUT' : 'POST';

      const response = await authFetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: comboData.name,
          description: comboData.description,
          price: comboData.price,
          discount: comboData.discount,
          imageUrl: comboData.imageUrl,
          stock: comboData.stock,
          status: comboData.status,
          productsIncluded: comboData.productsIncluded || []
        }),
      });

      const resData = await response.json();

      if (!response.ok) {
        throw new Error(resData.error || resData.details || 'No se pudo guardar el combo');
      }

      alert(isEditing ? '¡Combo actualizado con éxito!' : '¡Combo creado con éxito!');
      setIsComboModalOpen(false);
      setEditingCombo(null);
      fetchCombos();
    } catch (error: any) {
      console.error('Error al guardar combo:', error);
      alert(`Error al guardar el combo: ${error.message}`);
    }
  };

  const handleDeleteCombo = async (id: string | number) => {
    if (!window.confirm('¿Deseas eliminar este combo de la base de datos?')) return;

    try {
      const response = await authFetch(`${API_URL}/products/combos/${id}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const errData = await response.json().catch(() => ({}));
        throw new Error(errData.error || 'Error al eliminar el combo');
      }

      await fetchCombos();
    } catch (error: any) {
      console.error('Error al eliminar combo:', error);
      alert(`No se pudo eliminar el combo: ${error.message}`);
    }
  };

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => setImagePreview(reader.result as string);
      reader.readAsDataURL(file);
    }
  };

  const handleOpenAddModal = () => {
    setEditingProduct(null);
    setFormData({
      name: '',
      category: 'Cerveza',
      price: '',
      stock: '',
      description: '',
      legalWarning: DEFAULT_LEGAL_WARNING,
    });
    setImagePreview('');
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (product: Product) => {
    setEditingProduct(product);
    setFormData({
      name: product.name,
      category: product.category,
      price: product.price.toString(),
      stock: product.stock.toString(),
      description: product.description,
      legalWarning: product.legalWarning,
    });
    setImagePreview(product.imageUrl);
    setIsModalOpen(true);
  };

  const handleSaveProduct = async (e: React.FormEvent) => {
    e.preventDefault();

    const name = formData.name.trim();
    const description = formData.description.trim();
    const legalWarning = resolveLegalWarning(formData.legalWarning);
    const priceNum = Number(formData.price);
    const stockNum = Number(formData.stock);

    if (!name || !formData.category || !description || !imagePreview) {
      alert('Nombre, tipo/licor, imagen y descripción son obligatorios.');
      return;
    }

    if (
      !Number.isFinite(priceNum) || priceNum <= 0 ||
      !Number.isFinite(stockNum) || stockNum < 1 || !Number.isInteger(stockNum)
    ) {
      alert('El precio y la cantidad inicial deben ser mayores a 0.');
      return;
    }

    const payload = {
      name,
      nombre: name,
      liquor_type: formData.category,
      category: formData.category,
      categoria: formData.category,
      price: priceNum,
      precio: priceNum,
      stock: stockNum,
      description,
      descripcion: description,
      image_url: imagePreview,
      imageUrl: imagePreview,
      imagen: imagePreview,
      legal_warning: legalWarning,
    };

    try {
      const cleanBase = `${API_URL}/products`;
      const url = editingProduct
        ? `${cleanBase}/${editingProduct.id}`
        : `${cleanBase}/`;

      const method = editingProduct ? 'PUT' : 'POST';

      const response = await authFetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      const resData = await response.json();

      if (!response.ok) {
        throw new Error(resData.error || resData.details || 'Error procesando producto');
      }

      await fetchProducts();
      setIsModalOpen(false);
    } catch (error: any) {
      console.error('Error al guardar producto:', error);
      alert(`No se pudo guardar el producto: ${error.message}`);
    }
  };

  const handleDeleteProduct = async (id: string | number) => {
    if (!window.confirm('¿Deseas eliminar este producto de la base de datos?')) return;

    try {
      const response = await authFetch(`${API_URL}/products/${id}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const errData = await response.json().catch(() => ({}));
        throw new Error(errData.error || 'Error al eliminar el producto');
      }

      await fetchProducts();
    } catch (error: any) {
      console.error('Error al eliminar:', error);
      alert(`No se pudo eliminar el producto: ${error.message}`);
    }
  };

  return (
    <div className="admin-container">
      <div className="admin-header">
        <h2>
          <AiOutlineProduct style={{ marginRight: '8px', verticalAlign: 'middle' }} />
          Gestión de Productos y Combos
        </h2>
        <div style={{ display: 'flex', gap: '10px' }}>
          <button onClick={handleOpenAddCombo} className="btn-secondary" style={{ borderColor: '#c5a880', color: '#c5a880' }}>
            + Crear Combo / Sugerencia
          </button>
          <button onClick={handleOpenAddModal} className="btn-primary">
            + Agregar producto
          </button>
        </div>
      </div>

      {/* Selector de Pestañas para ver Productos o Combos */}
      <div style={{ display: 'flex', gap: '15px', marginBottom: '15px', borderBottom: '1px solid #333', paddingBottom: '10px' }}>
        <button
          type="button"
          onClick={() => setActiveTab('products')}
          style={{ background: 'none', border: 'none', color: activeTab === 'products' ? '#d0a35c' : '#888', fontWeight: 'bold', cursor: 'pointer', fontSize: '15px' }}
        >
          Productos Individuales ({products.length})
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('combos')}
          style={{ background: 'none', border: 'none', color: activeTab === 'combos' ? '#d0a35c' : '#888', fontWeight: 'bold', cursor: 'pointer', fontSize: '15px' }}
        >
          Combos Registrados ({combosList.length})
        </button>
      </div>

      {activeTab === 'products' && (
        <div className="admin-filter-bar">
          <label htmlFor="availability-filter">Disponibilidad:</label>
          <select
            id="availability-filter"
            className="form-input"
            value={availabilityFilter}
            onChange={(e) => setAvailabilityFilter(e.target.value as AvailabilityFilter)}
          >
            <option value="all">Todos</option>
            <option value="available">Disponibles</option>
            <option value="out_of_stock">Agotados</option>
          </select>
          <span>Mostrando {visibleProducts.length} de {products.length}</span>
        </div>
      )}

      <div className="admin-table-container">
        {loading ? (
          <p style={{ color: '#d0a35c', textAlign: 'center', padding: '20px' }}>
            Cargando información de la base de datos...
          </p>
        ) : activeTab === 'products' ? (
          <table className="admin-table">
            <thead>
              <tr>
                <th>Imagen</th>
                <th>Código</th>
                <th>Nombre</th>
                <th>Descripción</th>
                <th>Categoría</th>
                <th>Precio</th>
                <th>Stock</th>
                <th>Estado</th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {visibleProducts.length === 0 ? (
                <tr>
                  <td colSpan={9} style={{ textAlign: 'center', color: '#888', padding: '20px' }}>
                    {availabilityFilter === 'all'
                      ? 'No hay productos registrados en la base de datos.'
                      : 'No hay productos con la disponibilidad seleccionada.'}
                  </td>
                </tr>
              ) : (
                visibleProducts.map((prod) => (
                  <tr key={prod.id}>
                    <td>
                      <img src={prod.imageUrl || IMAGE_PLACEHOLDER} alt={prod.name} className="product-img-thumb" />
                    </td>
                    <td style={{ fontWeight: 'bold' }}>{prod.id}</td>
                    <td>{prod.name}</td>
                    <td style={{ color: '#aaa', fontSize: '13px', maxWidth: '200px' }}>
                      {prod.description || 'Sin descripción'}
                    </td>
                    <td>{prod.category}</td>
                    <td className="price-text">${prod.price.toLocaleString()}</td>
                    <td>{prod.stock} un.</td>
                    <td>
                      <span className={`status-badge ${prod.status === 'Disponible' ? 'available' : 'out-of-stock'}`}>
                        {prod.status}
                      </span>
                    </td>
                    <td>
                      <div style={{ display: 'flex', gap: '8px' }}>
                        <button onClick={() => handleOpenEditModal(prod)} className="btn-secondary">
                          Editar
                        </button>
                        {canDelete && (
                          <button onClick={() => handleDeleteProduct(prod.id)} className="btn-danger">
                            Eliminar
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        ) : (
          <table className="admin-table">
            <thead>
              <tr>
                <th>Imagen</th>
                <th>ID Combo</th>
                <th>Nombre del Combo</th>
                <th>Descripción</th>
                <th>Descuento</th>
                <th>Precio Final</th>
                <th>Stock</th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {combosList.length === 0 ? (
                <tr>
                  <td colSpan={8} style={{ textAlign: 'center', color: '#888', padding: '20px' }}>
                    No hay combos registrados. Usa el botón "+ Crear Combo / Sugerencia" para agregar uno.
                  </td>
                </tr>
              ) : (
                combosList.map((combo) => (
                  <tr key={combo.id}>
                    <td>
                      <img src={combo.imageUrl} alt={combo.name} className="product-img-thumb" />
                    </td>
                    <td style={{ fontWeight: 'bold' }}>COMBO-{combo.id}</td>
                    <td>{combo.name}</td>
                    <td style={{ color: '#aaa', fontSize: '13px', maxWidth: '200px' }}>
                      {combo.description || 'Sin descripción'}
                    </td>
                    <td><span style={{ color: '#2ecc71', fontWeight: 'bold' }}>{combo.discount}% OFF</span></td>
                    <td className="price-text">${Number(combo.price).toLocaleString()}</td>
                    <td>{combo.stock} un.</td>
                    <td>
                      <div style={{ display: 'flex', gap: '8px' }}>
                        <button onClick={() => handleOpenEditCombo(combo)} className="btn-secondary">
                          Editar
                        </button>
                        {canDelete && (
                          <button onClick={() => handleDeleteCombo(combo.id)} className="btn-danger">
                            Eliminar
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        )}
      </div>

      {/* Modal de Creación / Edición de Combos (RF-056) */}
      {isComboModalOpen && (
        <CreateComboModal
          initialCombo={editingCombo || undefined}
          onSaveCombo={handleSaveCombo}
          onClose={() => {
            setIsComboModalOpen(false);
            setEditingCombo(null);
          }}
        />
      )}

      {/* Modal de Productos */}
      {isModalOpen && (
        <div className="modal-overlay">
          <div className="modal-content">
            <h3 className="modal-title">
              {editingProduct ? 'Editar Producto' : 'Nuevo Producto'}
            </h3>
            <form onSubmit={handleSaveProduct} className="form-group">
              <div className="form-field">
                <label>Nombre</label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  required
                  className="form-input"
                />
              </div>

              <div className="form-field">
                <label>Imagen del Producto</label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleImageChange}
                  required={!imagePreview}
                  className="form-input"
                />
                {imagePreview && (
                  <div style={{ marginTop: '8px', textAlign: 'center' }}>
                    <img src={imagePreview} alt="Vista previa" className="product-img-preview" />
                  </div>
                )}
              </div>

              <div className="form-field">
                <label>Descripción</label>
                <textarea
                  name="description"
                  rows={3}
                  value={formData.description}
                  onChange={handleInputChange}
                  required
                  className="form-input"
                />
              </div>

              <div className="form-row">
                <div className="form-field">
                  <label>Categoría</label>
                  <select
                    name="category"
                    value={formData.category}
                    onChange={handleInputChange}
                    className="form-input"
                    required
                  >
                    <option value="Cerveza">Cerveza</option>
                    <option value="Whisky">Whisky</option>
                    <option value="Ron">Ron</option>
                    <option value="Vinos">Vinos</option>
                    <option value="Aguardientes">Aguardientes</option>
                  </select>
                </div>
                <div className="form-field">
                  <label>Precio ($)</label>
                  <input
                    type="number"
                    name="price"
                    min="0.01"
                    step="0.01"
                    value={formData.price}
                    onChange={handleInputChange}
                    required
                    className="form-input"
                  />
                </div>
              </div>

              <div className="form-field">
                <label>Cantidad inicial</label>
                <input
                  type="number"
                  name="stock"
                  min="1"
                  step="1"
                  value={formData.stock}
                  onChange={handleInputChange}
                  required
                  className="form-input"
                />
              </div>

              <div className="form-field">
                <label>Advertencia legal</label>
                <textarea
                  name="legalWarning"
                  rows={2}
                  value={formData.legalWarning}
                  onChange={handleInputChange}
                  required
                  className="form-input"
                />
              </div>

              <div className="modal-actions">
                <button type="button" onClick={() => setIsModalOpen(false)} className="btn-secondary">
                  Cancelar
                </button>
                <button type="submit" className="btn-primary">
                  Guardar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProductosAdmin;
