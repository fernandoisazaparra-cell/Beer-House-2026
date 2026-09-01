import React, { useState } from 'react';
import './CategoriasAdmin.css';

export interface Category {
  id: string;
  name: string;
  description: string;
}

const initialCategories: Category[] = [
  { id: 'CAT-01', name: 'Cerveza', description: 'Cervezas de amargor pronunciado y aroma lupulado' },
  { id: 'CAT-02', name: 'Whisky', description: '' },
];

export const CategoriasAdmin = () => {
  const [categories, setCategories] = useState<Category[]>(initialCategories);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newCategory, setNewCategory] = useState({ name: '', description: '' });

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCategory.name) return;
    setCategories([...categories, { id: `CAT-0${categories.length + 1}`, ...newCategory }]);
    setNewCategory({ name: '', description: '' });
    setIsModalOpen(false);
  };

  return (
    <div className="admin-container">
      <div className="admin-header">
        <h2>Gestión de Categorías</h2>
        <button onClick={() => setIsModalOpen(true)} className="btn-primary">
          + Agregar Categoría
        </button>
      </div>

      <div className="admin-table-container">
        <table className="admin-table">
          <thead>
            <tr>
              <th>Código</th>
              <th>Nombre</th>
              <th>Descripción</th>
              <th>Acción</th>
            </tr>
          </thead>
          <tbody>
            {categories.map((cat) => (
              <tr key={cat.id}>
                <td style={{ fontWeight: 'bold' }}>{cat.id}</td>
                <td>{cat.name}</td>
                <td style={{ color: '#aaa' }}>{cat.description}</td>
                <td>
                  <button onClick={() => setCategories(categories.filter((c) => c.id !== cat.id))} className="btn-danger">
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
            <h3 className="modal-title">Nueva Categoría</h3>
            <form onSubmit={handleAdd} className="form-group">
              <input
                type="text"
                placeholder="Nombre de la categoría"
                value={newCategory.name}
                onChange={(e) => setNewCategory({ ...newCategory, name: e.target.value })}
                required
                className="form-input"
              />
              <textarea
                placeholder="Descripción"
                value={newCategory.description}
                onChange={(e) => setNewCategory({ ...newCategory, description: e.target.value })}
                className="form-input"
              />
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

export default CategoriasAdmin;