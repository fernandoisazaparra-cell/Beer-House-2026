import { authFetch } from "@/shared/lib/authFetch";
export const receivePurchaseOrder = async (orderId: number) => {
  const response = await authFetch(`http://localhost:5000/api/purchases/orders/${orderId}/receive`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({}), // el usuario sale del token
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.error || 'Error al recibir la orden de compra');
  }

  return response.json();
};

export const getPurchaseInvoices = async () => {
  const response = await authFetch("http://localhost:5000/api/purchases/invoices");
  if (!response.ok) throw new Error("Error al obtener las facturas de compra.");
  return response.json();
};

export const createPurchaseInvoice = async (invoiceData: any) => {
  const response = await authFetch("http://localhost:5000/api/purchases/invoices", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(invoiceData),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.error || "Error al registrar la factura");
  }

  return response.json();
};
export const payPurchaseInvoice = async (invoiceId: number, paymentData: { payment_method: string; payment_status: string }) => {
  const response = await authFetch(`http://localhost:5000/api/purchases/invoices/${invoiceId}/pay`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(paymentData),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.error || "Error al procesar el pago de la factura.");
  }

  return response.json();
};