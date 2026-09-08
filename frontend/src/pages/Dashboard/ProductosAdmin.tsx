import { useEffect, useState } from 'react';
import './AdminShared.css';
import {
  AiOutlineProduct
} from '@/ui/icons'
import {
  getProductsAdmin,
  createProduct,
  updateProduct,
  deleteProduct,
  type Product
} from '@/features/dashboard/services/productsService';
import {
  getCategories,
  type Category
} from '@/features/dashboard/services/categoriesService';
import {
  getErrorMessage
} from '@/features/dashboard/services/errorsService';
import {
  formatCurrency
} from '@/features/dashboard/services/dashboardStatsService';

interface ProductForm {
  name: string;
  imageUrl: string;
  description: string;
  categoryId: string;
  price: string;
  stock: string;
  minStock: string;
  featured: boolean;
  active: boolean;
}

const emptyForm: ProductForm = {
  name: '',
  imageUrl: '',
  description: '',
  categoryId: '',
  price: '',
  stock: '0',
  minStock: '5',
  featured: true,
  active: true,
};

export const ProductosAdmin = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState<ProductForm>(emptyForm);

  useEffect(() => {
    const loadData = async () => {
      try {
        const [productsData, categoriesData] = await Promise.all([
          getProductsAdmin(),
          getCategories(),
        ]);
        setError('');
        setProducts(productsData);
        setCategories(categoriesData);
      } catch (err) {
        setError(getErrorMessage(err));
      } finally {
        setLoading(false);
      }
    };

    void loadData();
  }, []);

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) => {
    const { name, value, type } = e.target;
    const isCheckbox = type === 'checkbox';
    setFormData({
      ...formData,
      [name]: isCheckbox ? (e.target as HTMLInputElement).checked : value,
    });
  };

  const handleOpenAddModal = () => {
    setEditingProduct(null);
    setFormData(emptyForm);
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (product: Product) => {
    setEditingProduct(product);
    setFormData({
      name: product.name,
      imageUrl: product.image_url,
      description: product.description,
      categoryId: product.category_id ? String(product.category_id) : '',
      price: String(product.price),
      stock: String(product.stock),
      minStock: String(product.min_stock),
      featured: product.featured,
      active: product.active,
    });
    setIsModalOpen(true);
  };

  const handleSaveProduct = async (e: React.FormEvent) => {
    e.preventDefault();

    const priceNum = Number(formData.price);
    const stockNum = Number(formData.stock);
    const minStockNum = Number(formData.minStock);

    if (!formData.name.trim() || priceNum < 0 || stockNum < 0 || minStockNum < 0) {
      alert('El nombre es obligatorio y los valores numéricos deben ser mayores o iguales a 0.');
      return;
    }

    setSaving(true);
    try {
      const payload = {
        name: formData.name.trim(),
        image_url: formData.imageUrl.trim() || null,
        description: formData.description.trim() || null,
        category_id: formData.categoryId ? Number(formData.categoryId) : null,
        price: priceNum,
        stock: stockNum,
        min_stock: minStockNum,
        featured: formData.featured,
        active: formData.active,
      };

      if (editingProduct) {
        const updated = await updateProduct(editingProduct.id, payload);
        setProducts((prev) => prev.map((p) => (p.id === updated.id ? updated : p)));
      } else {
        const created = await createProduct(payload);
        setProducts((prev) => [...prev, created]);
      }

      setIsModalOpen(false);
    } catch (err) {
      alert(getErrorMessage(err));
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteProduct = async (product: Product) => {
    if (!window.confirm(`¿Eliminar el producto "${product.name}"?`)) return;

    try {
      await deleteProduct(product.id);
      setProducts((prev) => prev.filter((p) => p.id !== product.id));
    } catch (err) {
      alert(getErrorMessage(err));
    }
  };

  const productCategoryName = (product: Product) =>
    categories.find((c) => c.id === product.category_id)?.name ?? product.category ?? '—';

  return (
    <div className="admin-container">
      <div className="admin-header">
        <h2>Gestión de Productos</h2>
        <button onClick={handleOpenAddModal} className="btn-primary">
          + Agregar producto
        </button>
      </div>

      {error && <p className="admin-error">{error}</p>}

      <div className="admin-table-container">
        {loading ? (
          <p className="admin-loading">Cargando productos...</p>
        ) : products.length === 0 ? (
          <p className="admin-empty">No hay productos registrados.</p>
        ) : (
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
              {products.map((prod) => (
                <tr key={prod.id}>
                  <td>
                    {prod.image_url ? (
                      <img src={prod.image_url} alt={prod.name} className="product-img-thumb" />
                    ) : (
                      <span className="no-image">Sin imagen</span>
                    )}
                  </td>
                  <td style={{ fontWeight: 'bold' }}>#{prod.id}</td>
                  <td>{prod.name}</td>
                  <td style={{ color: '#aaa', fontSize: '13px', maxWidth: '200px' }}>
                    {prod.description || 'Sin descripción'}
                  </td>
                  <td>{productCategoryName(prod)}</td>
                  <td className="price-text">{formatCurrency(prod.price)}</td>
                  <td>{prod.stock} un.</td>
                  <td>
                    <span className={`status-badge ${prod.active ? 'completado' : 'cancelado'}`}>
                      {prod.active ? 'Activo' : 'Inactivo'}
                    </span>
                  </td>
                  <td>
                    <div style={{ display: 'flex', gap: '8px' }}>
                      <button onClick={() => handleOpenEditModal(prod)} className="btn-secondary">
                        Editar
                      </button>
                      <button onClick={() => handleDeleteProduct(prod)} className="btn-danger">
                        Eliminar
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

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
                <label>URL de la Imagen</label>
                <input
                  type="url"
                  name="imageUrl"
                  placeholder="https://..."
                  value={formData.imageUrl}
                  onChange={handleInputChange}
                  className="form-input"
                />
                {formData.imageUrl && (
                  <div style={{ marginTop: '8px', textAlign: 'center' }}>
                    <img src={formData.imageUrl} alt="Vista previa" className="product-img-preview" />
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
                  className="form-input"
                />
              </div>

              <div className="form-row">
                <div className="form-field">
                  <label>Categoría</label>
                  <select
                    name="categoryId"
                    value={formData.categoryId}
                    onChange={handleInputChange}
                    className="form-input"
                  >
                    <option value="">Sin categoría</option>
                    {categories.map((cat) => (
                      <option key={cat.id} value={cat.id}>
                        {cat.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="form-field">
                  <label>Precio ($)</label>
                  <input
                    type="number"
                    name="price"
                    min="0"
                    step="0.01"
                    value={formData.price}
                    onChange={handleInputChange}
                    required
                    className="form-input"
                  />
                </div>
              </div>

              <div className="form-row">
                <div className="form-field">
                  <label>Stock</label>
                  <input
                    type="number"
                    name="stock"
                    min="0"
                    value={formData.stock}
                    onChange={handleInputChange}
                    required
                    className="form-input"
                  />
                </div>
                <div className="form-field">
                  <label>Stock Mínimo</label>
                  <input
                    type="number"
                    name="minStock"
                    min="0"
                    value={formData.minStock}
                    onChange={handleInputChange}
                    className="form-input"
                  />
                </div>
              </div>

              <div className="form-row">
                <label className="form-checkbox">
                  <input
                    type="checkbox"
                    name="featured"
                    checked={formData.featured}
                    onChange={handleInputChange}
                  />
                  Destacado
                </label>
                <label className="form-checkbox">
                  <input
                    type="checkbox"
                    name="active"
                    checked={formData.active}
                    onChange={handleInputChange}
                  />
                  Activo
                </label>
              </div>

              <div className="modal-actions">
                <button type="button" onClick={() => setIsModalOpen(false)} className="btn-secondary">
                  Cancelar
                </button>
                <button type="submit" className="btn-primary" disabled={saving}>
                  {saving ? 'Guardando...' : 'Guardar'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
  <AiOutlineProduct />
};

export default ProductosAdmin;