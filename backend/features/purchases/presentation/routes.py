"""
Rutas del módulo de compras (backend/features/purchases/presentation/routes.py)

Secciones:
1. Imports y configuración
2. Helpers (manejo de errores, lectura de JSON, CSV)
3. Órdenes de compra a proveedores
4. Facturas de proveedores
5. Resumen de compras
6. Exportación de reportes
7. Historial de compras del cliente
8. Checkout y webhook (deshabilitados)
"""

# ==========================================
# 1. IMPORTS Y CONFIGURACIÓN
# ==========================================

import csv
import io
from functools import wraps

from flask import (
    Blueprint,
    request,
    jsonify,
    send_file,
    current_app,
)

from features.purchases.application.services import PurchaseService

from shared.security.decorators import (
    current_user_id,
    login_required,
    role_required,
)
from shared.security.roles import STAFF_ROLES


purchases_bp = Blueprint(
    "purchases",
    __name__,
    url_prefix="/api/purchases"
)

purchase_service = PurchaseService()


# ==========================================
# 2. HELPERS
# ==========================================

MSG_INVALID_JSON = "Debes enviar un objeto JSON válido."
MSG_INVALID_BODY = "El cuerpo debe ser un objeto JSON válido."


def handle_errors(log_message, error_message, value_error_as_400=True):
    """
    Envuelve una ruta con el manejo de errores estándar.

- ValueError -> 400 con el texto del error (si value_error_as_400).
- Cualquier otra excepción -> se registra en el log y responde 500.

    `log_message` admite formato con los argumentos de la ruta
    (por ejemplo impresora "... orden %s." usa order_id).
    """
    def decorator(func):
        @wraps(func)
        def wrapper(*args, **kwargs):
            try:
                return func(*args, **kwargs)

            except ValueError as error:
                if not value_error_as_400:
                    current_app.logger.exception(
                        log_message, *kwargs.values()
                    )
                    return jsonify({"error": error_message}), 500

                return jsonify({"error": str(error)}), 400

            except Exception:
                current_app.logger.exception(
                    log_message, *kwargs.values()
                )
                return jsonify({"error": error_message}), 500

        return wrapper
    return decorator


def get_json_body(message=MSG_INVALID_JSON):
    """Devuelve el cuerpo JSON como dict o lanza ValueError (-> 400)."""
    data = request.get_json(silent=True)

    if not isinstance(data, dict):
        raise ValueError(message)

    return data


def build_csv_file(headers, rows):
    """Genera un CSV (separador ';', compatible con Excel) en memoria."""
    output = io.StringIO()
    output.write("sep=;\n")

    writer = csv.writer(
        output,
        delimiter=";",
        quoting=csv.QUOTE_MINIMAL
    )
    writer.writerow(headers)
    writer.writerows(rows)

    memory_file = io.BytesIO(output.getvalue().encode("utf-8-sig"))
    memory_file.seek(0)
    return memory_file


def date_only(value):
    """Recorta una fecha/hora a YYYY-MM-DD."""
    return str(value or "")[:10]


def invoices_report_rows():
    return [
        [
            invoice.get("invoice_number", ""),
            f"#{invoice.get('purchase_order_id', '')}",
            invoice.get("amount", 0),
            date_only(invoice.get("invoice_date")),
            date_only(invoice.get("due_date")),
            invoice.get("payment_status", "Pendiente"),
        ]
        for invoice in purchase_service.get_all_invoices()
    ]


def orders_report_rows():
    return [
        [
            order.get("order_number", ""),
            order.get("supplier_name", "Sin proveedor"),
            date_only(order.get("created_at")),
            order.get("total_amount", 0),
            order.get("status", "Pendiente"),
        ]
        for order in purchase_service.get_all_orders()
    ]


# Configuración de cada tipo de reporte exportable
EXPORT_REPORTS = {
    "orders": {
        "filename": "Reporte_Ordenes_Compra.csv",
        "headers": ["N° Orden", "Proveedor", "Fecha", "Monto Total", "Estado"],
        "rows": orders_report_rows,
    },
    "invoices": {
        "filename": "Reporte_Facturas_Proveedores.csv",
        "headers": [
            "N° Factura", "Orden Asociada", "Monto",
            "Fecha Emisión", "Fecha Vencimiento", "Estado Pago",
        ],
        "rows": invoices_report_rows,
    },
}


# ==========================================
# 3. ÓRDENES DE COMPRA A PROVEEDORES
# ==========================================

@purchases_bp.route("/orders", methods=["GET"])
@role_required(*STAFF_ROLES)
@handle_errors(
    "Error al consultar órdenes.",
    "No fue posible consultar las órdenes de compra.",
    value_error_as_400=False,
)
def get_orders():
    return jsonify(purchase_service.get_all_orders()), 200


@purchases_bp.route("/orders", methods=["POST"])
@role_required(*STAFF_ROLES)
@handle_errors(
    "Error al crear orden de compra.",
    "No fue posible crear la orden de compra.",
)
def create_order():
    data = get_json_body(MSG_INVALID_BODY)

    order = purchase_service.create_order(
        data,
        user_id=current_user_id()
    )

    return jsonify({
        "message": "Orden de compra creada exitosamente.",
        "order": order
    }), 201


@purchases_bp.route("/orders/<int:order_id>/receive", methods=["PUT", "POST"])
@role_required(*STAFF_ROLES)
@handle_errors(
    "Error al registrar la recepción de la orden %s.",
    "No fue posible registrar la recepción.",
)
def receive_order(order_id):
    data = get_json_body()

    received_items = data.get("items") or data.get("received_items")

    if not isinstance(received_items, list) or not received_items:
        raise ValueError(
            "Debes indicar los productos y cantidades recibidas."
        )

    result = purchase_service.receive_order(
        order_id=order_id,
        received_items=received_items,
        user_id=current_user_id()
    )

    return jsonify(result), 200


# ==========================================
# 4. FACTURAS DE PROVEEDORES
# ==========================================

@purchases_bp.route("/invoices", methods=["GET"])
@role_required(*STAFF_ROLES)
@handle_errors(
    "Error al consultar facturas.",
    "No fue posible consultar las facturas.",
    value_error_as_400=False,
)
def get_invoices():
    return jsonify(purchase_service.get_all_invoices()), 200


@purchases_bp.route("/invoices", methods=["POST"])
@role_required(*STAFF_ROLES)
@handle_errors(
    "Error al registrar factura.",
    "No fue posible registrar la factura.",
)
def create_invoice():
    result = purchase_service.create_invoice(get_json_body())
    return jsonify(result), 201


@purchases_bp.route("/invoices/<int:invoice_id>/pay", methods=["PUT", "POST"])
@role_required(*STAFF_ROLES)
@handle_errors(
    "Error al actualizar la factura %s.",
    "No fue posible actualizar la factura.",
)
def pay_invoice(invoice_id):
    result = purchase_service.process_invoice_payment(
        invoice_id,
        get_json_body()
    )
    return jsonify(result), 200


# ==========================================
# 5. RESUMEN DE COMPRAS
# ==========================================

@purchases_bp.route("/summary", methods=["GET"])
@role_required(*STAFF_ROLES)
@handle_errors(
    "Error al obtener el resumen de compras.",
    "No fue posible obtener el resumen de compras.",
    value_error_as_400=False,
)
def get_purchases_summary():
    return jsonify(purchase_service.get_purchases_summary()), 200


# ==========================================
# 6. EXPORTACIÓN DE REPORTES
# ==========================================

@purchases_bp.route("/export/excel", methods=["GET"])
@role_required(*STAFF_ROLES)
@handle_errors(
    "Error al exportar reporte de compras.",
    "No fue posible generar el reporte.",
    value_error_as_400=False,
)
def export_purchases_excel():
    report_type = request.args.get("type", "orders").strip().lower()
    report = EXPORT_REPORTS.get(report_type)

    if report is None:
        return jsonify({
            "error": "Tipo de reporte no válido. Usa 'orders' o 'invoices'."
        }), 400

    memory_file = build_csv_file(report["headers"], report["rows"]())

    return send_file(
        memory_file,
        mimetype="text/csv; charset=utf-8",
        as_attachment=True,
        download_name=report["filename"]
    )


# ==========================================
# 7. HISTORIAL DE COMPRAS DEL CLIENTE
# ==========================================

@purchases_bp.route("/history/me", methods=["GET"])
@login_required
@handle_errors(
    "Error al consultar historial de compras.",
    "No fue posible consultar el historial.",
)
def get_purchase_history():
    user_id = current_user_id()

    if not user_id:
        return jsonify({
            "error": "No se pudo identificar al usuario autenticado."
        }), 401

    history = purchase_service.get_client_purchase_history(user_id)

    return jsonify({"sales": history}), 200


@purchases_bp.route("/history/<int:user_id>", methods=["GET"])
@role_required(*STAFF_ROLES)
@handle_errors(
    "Error al consultar historial de compras.",
    "No fue posible consultar el historial.",
)
def get_purchase_history_by_user(user_id):
    """RF-046: Admin/Supervisor pueden consultar el historial de otro cliente."""
    history = purchase_service.get_client_purchase_history(user_id)
    return jsonify({"sales": history}), 200


# ==========================================
# 8. CHECKOUT Y WEBHOOK (DESHABILITADOS)
# ==========================================

@purchases_bp.route("/checkout", methods=["POST"])
def customer_checkout():
    return jsonify({
        "error": "El checkout está deshabilitado en esta versión académica."
    }), 403


@purchases_bp.route("/webhooks/wompi", methods=["POST"])
def wompi_webhook():
    return jsonify({
        "error": "El procesamiento de pagos reales está deshabilitado."
    }), 403