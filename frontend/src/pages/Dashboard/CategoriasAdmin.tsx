import { useEffect, useState } from 'react';
import './AdminShared.css';
import { 
  BiCategory 
} from "@/ui/icons";
import {
  getCategories,
  createCategory,
  updateCategory,
  deleteCategory,
  type Category
} from '@/features/dashboard/services/categoriesService';
import {
  getErrorMessage
} from '@/features/dashboard/services/errorsService';

interface CategoryForm {
  name: string;
  description: string;
  icon: string;
}

const emptyForm: CategoryForm = { name: '', description: '', icon: '' };

export const CategoriasAdmin = () => {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState<CategoryForm>(emptyForm);

  useEffect(() => {
    const loadData = async () => {
      try {
        const data = await getCategories();
        setError('');
        setCategories(data);
      } catch (err) {
        setError(getErrorMessage(err));
      } finally {
        setLoading(false);
      }
    };

    void loadData();
  }, []);

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleOpenAddModal = () => {
    setEditingCategory(null);
    setFormData(emptyForm);
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (category: Category) => {
    setEditingCategory(category);
    setFormData({
      name: category.name,
      description: category.description,
      icon: category.icon,
    });
    setIsModalOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim()) return;

    setSaving(true);
    try {
      const payload = {
        name: formData.name.trim(),
        description: formData.description.trim() || null,
        icon: formData.icon.trim() || null,
      };

      if (editingCategory) {
        const updated = await updateCategory(editingCategory.id, payload);
        setCategories((prev) => prev.map((c) => (c.id === updated.id ? updated : c)));
      } else {
        const created = await createCategory(payload);
        setCategories((prev) => [...prev, created]);
      }

      setIsModalOpen(false);
    } catch (err) {
      alert(getErrorMessage(err));
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (category: Category) => {
    if (!window.confirm(`¿Eliminar la categoría "${category.name}"?`)) return;

    try {
      await deleteCategory(category.id);
      setCategories((prev) => prev.filter((c) => c.id !== category.id));
    } catch (err) {
      alert(getErrorMessage(err));
    }
  };

  return (
    <div className="admin-container">
      <div className="admin-header">
        <h2>Gestión de Categorías</h2>
        <button onClick={handleOpenAddModal} className="btn-primary">
          + Agregar Categoría
        </button>
      </div>

      {error && <p className="admin-error">{error}</p>}

      <div className="admin-table-container">
        {loading ? (
          <p className="admin-loading">Cargando categorías...</p>
        ) : categories.length === 0 ? (
          <p className="admin-empty">No hay categorías registradas.</p>
        ) : (
          <table className="admin-table">
            <thead>
              <tr>
                <th>Código</th>
                <th>Nombre</th>
                <th>Descripción</th>
                <th>Ícono</th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {categories.map((cat) => (
                <tr key={cat.id}>
                  <td style={{ fontWeight: 'bold' }}>#{cat.id}</td>
                  <td>{cat.name}</td>
                  <td style={{ color: '#aaa' }}>{cat.description || '—'}</td>
                  <td style={{ color: '#aaa' }}>{cat.icon || '—'}</td>
                  <td>
                    <div style={{ display: 'flex', gap: '8px' }}>
                      <button onClick={() => handleOpenEditModal(cat)} className="btn-secondary">
                        Editar
                      </button>
                      <button onClick={() => handleDelete(cat)} className="btn-danger">
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
              {editingCategory ? 'Editar Categoría' : 'Nueva Categoría'}
            </h3>
            <form onSubmit={handleSave} className="form-group">
              <div className="form-field">
                <label>Nombre</label>
                <input
                  type="text"
                  name="name"
                  placeholder="Nombre de la categoría"
                  value={formData.name}
                  onChange={handleInputChange}
                  required
                  className="form-input"
                />
              </div>
              <div className="form-field">
                <label>Descripción</label>
                <textarea
                  name="description"
                  placeholder="Descripción"
                  value={formData.description}
                  onChange={handleInputChange}
                  className="form-input"
                />
              </div>
              <div className="form-field">
                <label>Ícono (clase CSS o emoji)</label>
                <input
                  type="text"
                  name="icon"
                  placeholder="Ej: 🍺"
                  value={formData.icon}
                  onChange={handleInputChange}
                  className="form-input"
                />
              </div>
              <div className="modal-actions">
                <button type="button" onClick={() => setIsModalOpen(false)} className="btn-secondary">Cancelar</button>
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
  <BiCategory />
};

export default CategoriasAdmin;