// ==========================================
// 1. TIPOS E INTERFACES
// ==========================================
interface Client {
  id: string;
  name: string;
  email: string;
  phone: string;
  totalOrders: number;
}

const initialClients: Client[] = [
  { id: 'CLI-01', name: 'Carlos Pérez', email: 'carlos@gmail.com', phone: '+57 300 123 4567', totalOrders: 5 },
  { id: 'CLI-02', name: 'Enana', email: 'enana@gmail.com', phone: '+57 310 987 6543', totalOrders: 12 },
];

// ==========================================
// 2. COMPONENTE PRINCIPAL
// ==========================================
export const ClientesAdmin = () => {
  const handleResetPassword = (email: string) => {
    // Aquí conectarías con tu backend para enviar un correo de recuperación
    alert(`Se ha enviado un enlace para restablecer la contraseña a ${email}`);
  };

  return (
    <div style={{ color: '#fff', width: '100%' }}>
      <h2>Gestión de Clientes</h2>
      <div style={{ background: '#181818', borderRadius: '8px', padding: '16px', marginTop: '20px' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
          <thead>
            <tr style={{ borderBottom: '1px solid #333', color: '#aaa' }}>
              <th style={{ padding: '12px' }}>ID</th>
              <th style={{ padding: '12px' }}>Nombre</th>
              <th style={{ padding: '12px' }}>Correo</th>
              <th style={{ padding: '12px' }}>Contraseña</th>
              <th style={{ padding: '12px' }}>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {initialClients.map((cli) => (
              <tr key={cli.id} style={{ borderBottom: '1px solid #282828' }}>
                <td style={{ padding: '12px', fontWeight: 'bold' }}>{cli.id}</td>
                <td style={{ padding: '12px' }}>{cli.name}</td>
                <td style={{ padding: '12px', color: '#d4af37' }}>{cli.email}</td>
                {/* Ocultamos la contraseña por seguridad */}
                <td style={{ padding: '12px', color: '#888' }}>••••••••</td>
                <td style={{ padding: '12px' }}>
                  <button
                    onClick={() => handleResetPassword(cli.email)}
                    style={{
                      background: '#222',
                      color: '#d4af37',
                      border: '1px solid #d4af37',
                      padding: '4px 8px',
                      borderRadius: '4px',
                      cursor: 'pointer',
                      fontSize: '12px'
                    }}
                  >
                    Restablecer Clave
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default ClientesAdmin;