import React, { useState } from 'react';
import './ProductosAdmin.css';

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
    category: 'IPA',
    price: 12000,
    stock: 45,
    imageUrl: 'https://images.unsplash.com/photo-1608270586620-248524c67de9?w=100&auto=format&fit=crop&q=80',
    description: 'Cerveza intensa con notas cítricas y amargor equilibrado.',
  },
];

export const ProductosAdmin = () => {
  const [products, setProducts] = useState<Product[]>(initialProducts);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [imagePreview, setImagePreview] = useState<string>('');
  const [newProduct, setNewProduct] = useState({
    name: '',
    category: 'IPA',
    price: '',
    stock: '',
    description: '',
  });

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) => {
    setNewProduct({ ...newProduct, [e.target.name]: e.target.value });
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => setImagePreview(reader.result as string);
      reader.readAsDataURL(file);
    }
  };

  const handleAddProduct = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newProduct.name || !newProduct.price || !newProduct.stock) return;

    const createdProduct: Product = {
      id: `PROD-00${products.length + 1}`,
      name: newProduct.name,
      category: newProduct.category,
      price: Number(newProduct.price),
      stock: Number(newProduct.stock),
      imageUrl: imagePreview || 'https://via.placeholder.com/100?text=Beer',
      description: newProduct.description,
    };

    setProducts([...products, createdProduct]);
    setNewProduct({ name: '', category: 'IPA', price: '', stock: '', description: '' });
    setImagePreview('');
    setIsModalOpen(false);
  };

  return (
    <div className="admin-container">
      <div className="admin-header">
        <h2>Gestión de Productos</h2>
        <button onClick={() => setIsModalOpen(true)} className="btn-primary">
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
                <td><img src={prod.imageUrl} alt={prod.name} className="product-img-thumb" /></td>
                <td style={{ fontWeight: 'bold' }}>{prod.id}</td>
                <td>{prod.name}</td>
                <td style={{ color: '#aaa', fontSize: '13px', maxWidth: '200px' }}>{prod.description || 'Sin descripción'}</td>
                <td>{prod.category}</td>
                <td className="price-text">${prod.price.toLocaleString()}</td>
                <td>{prod.stock} un.</td>
                <td>
                  <button onClick={() => setProducts(products.filter(p => p.id !== prod.id))} className="btn-danger">
                    Eliminar
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {isModalOpen && (
        <div className="modal-overlay">
          <div className="modal-content">
            <h3 className="modal-title">Nuevo Producto</h3>
            <form onSubmit={handleAddProduct} className="form-group">
              <div className="form-field">
                <label>Nombre</label>
                <input type="text" name="name" value={newProduct.name} onChange={handleInputChange} required className="form-input" />
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
                <textarea name="description" rows={3} value={newProduct.description} onChange={handleInputChange} className="form-input" />
              </div>

              <div className="form-row">
                <div className="form-field">
                  <label>Categoría</label>
                  <select name="category" value={newProduct.category} onChange={handleInputChange} className="form-input">
                    <option value="Cerveza">Cerveza</option>
                    <option value="Whisky">Whisky</option>
                    <option value="Ron">Ron</option>
                    <option value="Vinos">Vinos</option>
                    <option value="Aguardientes">Aguardientes</option>
                  </select>
                </div>
                <div className="form-field">
                  <label>Precio ($)</label>
                  <input type="number" name="price" value={newProduct.price} onChange={handleInputChange} required className="form-input" />
                </div>
              </div>

              <div className="form-field">
                <label>Stock</label>
                <input type="number" name="stock" value={newProduct.stock} onChange={handleInputChange} required className="form-input" />
              </div>

              <div className="modal-actions">
                <button type="button" onClick={() => setIsModalOpen(false)} className="btn-secondary">Cancelar</button>
                <button type="submit" className="btn-primary">Guardar</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProductosAdmin;