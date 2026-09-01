import React, { useState } from 'react';
import './ProductosAdmin.css';
import {
  AiOutlineProduct
} from '@/ui/icons'
export interface Product {
  id: string;
  name: string;
  category: string;
  price: number;
  stock: number;
  imageUrl: string;
  description: string;
}

const initialProducts: Product[] = [
  {
    id: 'PROD-001',
    name: 'Cerveza IPA Artesanal',
    category: 'Cerveza',
    price: 12000,
    stock: 45,
    imageUrl: 'https://images.unsplash.com/photo-1608270586620-248524c67de9?w=100&auto=format&fit=crop&q=80',
    description: 'Cerveza intensa con notas cítricas y amargor equilibrado.',
  },
];

export const ProductosAdmin = () => {
  const [products, setProducts] = useState<Product[]>(initialProducts);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [imagePreview, setImagePreview] = useState<string>('');
  
  const [formData, setFormData] = useState({
    name: '',
    category: 'Cerveza',
    price: '',
    stock: '',
    description: '',
  });

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
    setFormData({ name: '', category: 'Cerveza', price: '', stock: '', description: '' });
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
    });
    setImagePreview(product.imageUrl);
    setIsModalOpen(true);
  };

 const handleSaveProduct = (e: React.FormEvent) => {
  e.preventDefault();

  const priceNum = Number(formData.price);
  const stockNum = Number(formData.stock);

  // Validación: Campos obligatorios y valores mayores o iguales a 1
  if (!formData.name || priceNum < 1 || stockNum < 1) {
    alert('El precio y el stock deben ser al menos 1.');
    return;
  }

  if (editingProduct) {
    setProducts(
      products.map((p) =>
        p.id === editingProduct.id
          ? {
              ...p,
              name: formData.name,
              category: formData.category,
              price: priceNum,
              stock: stockNum,
              description: formData.description,
              imageUrl: imagePreview || p.imageUrl,
            }
          : p
      )
    );
  } else {
    const createdProduct: Product = {
      id: `PROD-00${products.length + 1}`,
      name: formData.name,
      category: formData.category,
      price: priceNum,
      stock: stockNum,
      imageUrl: imagePreview || 'https://via.placeholder.com/100?text=Beer',
      description: formData.description,
    };
    setProducts([...products, createdProduct]);
  }

  setIsModalOpen(false);
};

  const handleDeleteProduct = (id: string) => {
    setProducts(products.filter((p) => p.id !== id));
  };

  return (
    <div className="admin-container">
      <div className="admin-header">
        <h2>Gestión de Productos</h2>
        <button onClick={handleOpenAddModal} className="btn-primary">
          + Agregar producto
        </button>
      </div>

      <div className="admin-table-container">
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
              <th>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {products.map((prod) => (
              <tr key={prod.id}>
                <td>
                  <img src={prod.imageUrl} alt={prod.name} className="product-img-thumb" />
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
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <button onClick={() => handleOpenEditModal(prod)} className="btn-secondary">
                      Editar
                    </button>
                    <button onClick={() => handleDeleteProduct(prod.id)} className="btn-danger">
                      Eliminar
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
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
                <label>Imagen del Producto</label>
                <input type="file" accept="image/*" onChange={handleImageChange} className="form-input" />
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
                    min="1"
                    value={formData.price}
                    onChange={handleInputChange}
                    required
                    className="form-input"
                  />
                </div>
              </div>

              <div className="form-field">
                <label>Stock</label>
                <input
                  type="number"
                  name="stock"
                  min="1"
                  value={formData.stock}
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
  <AiOutlineProduct />
};

export default ProductosAdmin;