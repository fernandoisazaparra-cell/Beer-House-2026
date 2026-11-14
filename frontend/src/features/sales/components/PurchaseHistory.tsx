
import { usePurchaseHistory } from "../hooks/usePurchaseHistory";

const formatCurrency = (value: number | null | undefined) =>
  new Intl.NumberFormat("es-CO", {
    style: "currency",
    currency: "COP",
    maximumFractionDigits: 0,
  }).format(value ?? 0);

const formatDate = (value: string | null) => {
  if (!value) return "Fecha no disponible";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "Fecha no disponible";
  }

  return date.toLocaleString("es-CO", {
    dateStyle: "medium",
    timeStyle: "short",
  });
};

const getStatusLabel = (status: string) => {
  const statuses: Record<string, string> = {
    PAID: "Pagada",
    PENDING: "Pendiente",
    FAILED: "Fallida",
    EXPIRED: "Expirada",
    REVIEW: "En revisión",
    APPROVED: "Aprobada",
    REJECTED: "Rechazada",
    CANCELLED: "Cancelada",
  };

  return statuses[status] || status || "Sin estado";
};

export default function PurchaseHistory() {
  const { sales, loading, error, reload } = usePurchaseHistory();

  if (loading) {
    return <p>Cargando historial de compras...</p>;
  }

  if (error) {
    return (
      <section className="purchase-history">
        <h2>Historial de compras</h2>
        <p role="alert">{error}</p>
        <button type="button" onClick={reload}>
          Intentar nuevamente
        </button>
      </section>
    );
  }

  return (
    <section className="purchase-history">
      <h2>Historial de compras</h2>

      {sales.length === 0 ? (
        <p>Aún no tienes compras registradas.</p>
      ) : (
        <div>
          {sales.map((sale) => (
            <article
              key={sale.id}
              className="purchase-history__card"
            >
              <header>
                <h3>
                  Pedido {sale.order_number || `#${sale.id}`}
                </h3>

                <span>{getStatusLabel(sale.status)}</span>
              </header>

              <p>Fecha: {formatDate(sale.created_at)}</p>

              <p>
                Total: {formatCurrency(
                  sale.total ?? sale.total_amount
                )}
              </p>

              <p>
                Método de pago:{" "}
                {sale.payment_method || "No disponible"}
              </p>

              <div>
                <h4>Productos</h4>

                {sale.items.length === 0 ? (
                  <p>No hay productos asociados a este pedido.</p>
                ) : (
                  sale.items.map((item) => (
                    <div key={item.id}>
                      <p>{item.product_name}</p>

                      <p>
                        Cantidad: {item.quantity} ×{" "}
                        {formatCurrency(item.unit_price)}
                      </p>

                      <p>
                        Subtotal: {formatCurrency(item.subtotal)}
                      </p>
                    </div>
                  ))
                )}
              </div>
            </article>
          ))}
        </div>
      )}
    </section>
  );
}

