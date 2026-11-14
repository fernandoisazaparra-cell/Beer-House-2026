import React, { useState } from 'react';
import './CategoriasAdmin.css';

export interface Category {
  id: string;
  name: string;
  description: string;
}

const initialCategories: Category[] = [
  { id: 'CAT-01', name: 'Cerveza', description: 'Cervezas de amargor pronunciado y aroma lupulado.' },
  { id: 'CAT-02', name: 'Whisky', description: 'Destilados de malta y grano añejados en barricas de roble, nacionales e importados.' },
  { id: 'CAT-03', name: 'Aguardiente', description: 'Licor tradicional colombiano destilado de caña de azúcar con esencia de anís (con y sin azúcar).' },
  { id: 'CAT-04', name: 'Ron', description: 'Destilados de caña de azúcar añejados, desde blancos suaves hasta reservas de gran cuerpo.' },
  { id: 'CAT-05', name: 'Tequila', description: 'Destilados mexicanos de agave azul en presentaciones blanco, reposado y añejo.' },
  { id: 'CAT-06', name: 'Vodka', description: 'Destilados neutros de alta pureza ideales para tomar solos o preparar coctelería.' },
  { id: 'CAT-07', name: 'Ginebra', description: 'Destilados aromatizados con bayas de enebro y botánicos seleccionados.' },
  { id: 'CAT-08', name: 'Vino', description: 'Selección de vinos tintos, blancos, rosados y espumosos de diversas cepas.' },
  { id: 'CAT-09', name: 'Cocteles', description: 'Mezclas preparadas y bebidas listas para tomar (RTD) con sabores frutales y refrescantes.' },
  { id: 'CAT-10', name: 'Sin Alcohol', description: 'Cervezas sin alcohol, sodas saborizadas, aguas, energizantes y mezcladores.' },
  { id: 'CAT-11', name: 'Snacks y Pasabocas', description: 'Acompañamientos salados, frutos secos y botanas ideales para maridar con bebidas.' },
];

export const CategoriasAdmin = () => {
  const [categories, setCategories] = useState<Category[]>(initialCategories);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newCategory, setNewCategory] = useState({ name: '', description: '' });

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCategory.name.trim()) return;

    const nextCode = `CAT-${String(categories.length + 1).padStart(2, '0')}`;
    setCategories([...categories, { id: nextCode, ...newCategory }]);
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
                  <button
                    onClick={() => setCategories(categories.filter((c) => c.id !== cat.id))}
                    className="btn-danger"
                  >
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

export default CategoriasAdmin;