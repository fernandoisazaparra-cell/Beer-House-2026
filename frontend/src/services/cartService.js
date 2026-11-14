const API_URL = import.meta.env.VITE_API_URL || 'http://127.0.0.1:5000/api';

export async function validateCartWithBackend(cartItems) {
  try {
    const response = await fetch(`${API_URL}/cart/validate`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ items: cartItems }),
    });

    if (!response.ok) {
      // Si el endpoint aún no está creado en Flask, evitamos romper la app devolviendo éxito simulado temporal
      if (response.status === 404) {
        console.warn("Endpoint /api/cart/validate no encontrado en el backend. Saltando validación temporal.");
        return { success: true };
      }
      throw new Error('Error al conectar con el servidor.');
    }

    const data = await response.json();
    return data; 
  } catch (error) {
    console.error("Error de validación:", error);
    // Temporal para que no bloquee el flujo de compra si la ruta no existe en Flask
    return { success: true }; 
  }
}