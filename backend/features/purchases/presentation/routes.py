
import csv
import io

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
# ÓRDENES DE COMPRA A PROVEEDORES
# ==========================================

@purchases_bp.route("/orders", methods=["GET"])
@role_required(*STAFF_ROLES)
def get_orders():
    try:
        orders = purchase_service.get_all_orders()
        return jsonify(orders), 200

    except Exception:
        current_app.logger.exception(
            "Error al consultar órdenes."
        )

        return jsonify({
            "error": "No fue posible consultar las órdenes de compra."
        }), 500


@purchases_bp.route("/orders", methods=["POST"])
@role_required(*STAFF_ROLES)
def create_order():
    try:
        data = request.get_json(silent=True)

        if not isinstance(data, dict):
            return jsonify({
                "error": "El cuerpo debe ser un objeto JSON válido."
            }), 400

        order = purchase_service.create_order(
            data,
            user_id=current_user_id()
        )

        return jsonify({
            "message": "Orden de compra creada exitosamente.",
            "order": order
        }), 201

    except ValueError as error:
        return jsonify({"error": str(error)}), 400

    except Exception:
        current_app.logger.exception(
            "Error al crear orden de compra."
        )

        return jsonify({
            "error": "No fue posible crear la orden de compra."
        }), 500


@purchases_bp.route(
    "/orders/<int:order_id>/receive",
    methods=["POST"]
)
@role_required(*STAFF_ROLES)
def receive_order(order_id):
    try:
        data = request.get_json(silent=True)

        if not isinstance(data, dict):
            return jsonify({
                "error": "Debes enviar un objeto JSON válido."
            }), 400

        received_items = data.get("items")

        if not isinstance(received_items, list) or not received_items:
            return jsonify({
                "error": "Debes indicar los productos y cantidades recibidas."
            }), 400

        result = purchase_service.receive_order(
            order_id=order_id,
            received_items=received_items,
            user_id=current_user_id()
        )

        return jsonify(result), 200

    except ValueError as error:
        return jsonify({"error": str(error)}), 400

    except Exception:
        current_app.logger.exception(
            "Error al registrar la recepción de la orden %s.",
            order_id
        )

        return jsonify({
            "error": "No fue posible registrar la recepción."
        }), 500


# ==========================================
# FACTURAS DE PROVEEDORES
# ==========================================

@purchases_bp.route("/invoices", methods=["GET"])
@role_required(*STAFF_ROLES)
def get_invoices():
    try:
        invoices = purchase_service.get_all_invoices()
        return jsonify(invoices), 200

    except Exception:
        current_app.logger.exception(
            "Error al consultar facturas."
        )

        return jsonify({
            "error": "No fue posible consultar las facturas."
        }), 500


@purchases_bp.route("/invoices", methods=["POST"])
@role_required(*STAFF_ROLES)
def create_invoice():
    try:
        data = request.get_json(silent=True)

        if not isinstance(data, dict):
            return jsonify({
                "error": "Debes enviar un objeto JSON válido."
            }), 400

        result = purchase_service.create_invoice(data)

        return jsonify(result), 201

    except ValueError as error:
        return jsonify({"error": str(error)}), 400

    except Exception:
        current_app.logger.exception(
            "Error al registrar factura."
        )

        return jsonify({
            "error": "No fue posible registrar la factura."
        }), 500


@purchases_bp.route(
    "/invoices/<int:invoice_id>/pay",
    methods=["PUT", "POST"]
)
@role_required(*STAFF_ROLES)
def pay_invoice(invoice_id):
    try:
        data = request.get_json(silent=True)

        if not isinstance(data, dict):
            return jsonify({
                "error": "Debes enviar un objeto JSON válido."
            }), 400

        result = purchase_service.process_invoice_payment(
            invoice_id,
            data
        )

        return jsonify(result), 200

    except ValueError as error:
        return jsonify({"error": str(error)}), 400

    except Exception:
        current_app.logger.exception(
            "Error al actualizar la factura %s.",
            invoice_id
        )

        return jsonify({
            "error": "No fue posible actualizar la factura."
        }), 500


# ==========================================
# RESUMEN DE COMPRAS
# ==========================================

@purchases_bp.route("/summary", methods=["GET"])
@role_required(*STAFF_ROLES)
def get_purchases_summary():
    try:
        summary = purchase_service.get_purchases_summary()
        return jsonify(summary), 200

    except Exception:
        current_app.logger.exception(
            "Error al obtener el resumen de compras."
        )

        return jsonify({
            "error": "No fue posible obtener el resumen de compras."
        }), 500


# ==========================================
# EXPORTACIÓN DE REPORTES
# ==========================================

@purchases_bp.route("/export/excel", methods=["GET"])
@role_required(*STAFF_ROLES)
def export_purchases_excel():
    try:
        report_type = request.args.get(
            "type",
            "orders"
        ).strip().lower()

        if report_type not in ("orders", "invoices"):
            return jsonify({
                "error": (
                    "Tipo de reporte no válido. "
                    "Usa 'orders' o 'invoices'."
                )
            }), 400

        output = io.StringIO()
        output.write("sep=;\n")

        writer = csv.writer(
            output,
            delimiter=";",
            quoting=csv.QUOTE_MINIMAL
        )

        if report_type == "invoices":
            writer.writerow([
                "N° Factura",
                "Orden Asociada",
                "Monto",
                "Fecha Emisión",
                "Fecha Vencimiento",
                "Estado Pago"
            ])

            invoices = purchase_service.get_all_invoices()

            for invoice in invoices:
                writer.writerow([
                    invoice.get("invoice_number", ""),
                    f"#{invoice.get('purchase_order_id', '')}",
                    invoice.get("amount", 0),
                    str(invoice.get("invoice_date", ""))[:10],
                    str(invoice.get("due_date", ""))[:10],
                    invoice.get("payment_status", "Pendiente")
                ])

            filename = "Reporte_Facturas_Proveedores.csv"

        else:
            writer.writerow([
                "N° Orden",
                "Proveedor",
                "Fecha",
                "Monto Total",
                "Estado"
            ])

            orders = purchase_service.get_all_orders()

            for order in orders:
                writer.writerow([
                    order.get("order_number", ""),
                    order.get("supplier_name", "Sin proveedor"),
                    str(order.get("created_at", ""))[:10],
                    order.get("total_amount", 0),
                    order.get("status", "Pendiente")
                ])

            filename = "Reporte_Ordenes_Compra.csv"

        memory_file = io.BytesIO(
            output.getvalue().encode("utf-8-sig")
        )

        memory_file.seek(0)

        return send_file(
            memory_file,
            mimetype="text/csv; charset=utf-8",
            as_attachment=True,
            download_name=filename
        )

    except Exception:
        current_app.logger.exception(
            "Error al exportar reporte de compras."
        )

        return jsonify({
            "error": "No fue posible generar el reporte."
        }), 500


# ==========================================
# HISTORIAL DE COMPRAS DEL CLIENTE
# ==========================================

@purchases_bp.route("/history/me", methods=["GET"])
@login_required
def get_purchase_history():
    try:
        user_id = current_user_id()

        if not user_id:
            return jsonify({
                "error": "No se pudo identificar al usuario autenticado."
            }), 401

        history = purchase_service.get_client_purchase_history(
            user_id
        )

        return jsonify({
            "sales": history
        }), 200

    except ValueError as error:
        return jsonify({
            "error": str(error)
        }), 400

    except Exception:
        current_app.logger.exception(
            "Error al consultar historial de compras."
        )

        return jsonify({
            "error": "No fue posible consultar el historial."
        }), 500


# ==========================================
# CHECKOUT Y WEBHOOK
# DESHABILITADOS
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
