from datetime import datetime
from app.extensions import db
from features.products.infrastructure.models import ProductModel
from features.suppliers.infrastructure.models import SupplierModel

# Importación de todos los modelos de la característica de inventario (incluyendo LossRecordModel)
from features.inventory.infrastructure.models import (
    InventoryMovementModel,
    PhysicalCountModel,
    LossRecordModel
)

class InventoryService:

    # ---------------------------------------------------------------------
    # Movimientos e Historial de Inventario (RF-023 / RN-021)
    # ---------------------------------------------------------------------
    def register_entry(self, data, user_id=1):
        supplier_id = data.get("supplier_id")
        invoice_number = data.get("invoice_number")
        if not supplier_id or not invoice_number:
            raise ValueError("RN-021: No se pueden registrar entradas de inventario sin información de proveedor o factura de compra.")

        product = ProductModel.query.get(data["product_id"])
        if not product:
            raise ValueError("El producto especificado no existe.")

        quantity = int(data["quantity"])
        if quantity <= 0:
            raise ValueError("La cantidad ingresada debe ser mayor a 0.")

        product.stock += quantity

        movement = InventoryMovementModel(
            product_id=product.id,
            supplier_id=supplier_id,
            user_id=user_id,
            movement_type="ENTRY",
            quantity=quantity,
            invoice_number=invoice_number,
            reason=data.get("reason", "Entrada por compra")
        )
        db.session.add(movement)
        db.session.commit()
        return movement.to_dict()

    def register_adjustment(self, data, user_id=1):
        reason = data.get("reason")
        if not reason or len(reason.strip()) < 5:
            raise ValueError("RN-025: Debe proporcionar un motivo válido para el ajuste de inventario.")

        product = ProductModel.query.get(data["product_id"])
        if not product:
            raise ValueError("El producto especificado no existe.")

        quantity = int(data["quantity"])
        movement_type = data.get("movement_type", "ADJUSTMENT_OUT")

        if movement_type == "ADJUSTMENT_OUT":
            if product.stock < quantity:
                raise ValueError("Stock insuficiente para realizar el ajuste.")
            product.stock -= quantity
        elif movement_type == "ADJUSTMENT_IN":
            product.stock += quantity

        movement = InventoryMovementModel(
            product_id=product.id,
            user_id=user_id,
            movement_type=movement_type,
            quantity=quantity,
            reason=reason
        )
        db.session.add(movement)
        db.session.commit()
        return movement.to_dict()

    def get_history(self, product_id=None):
        query = InventoryMovementModel.query
        if product_id:
            query = query.filter_by(product_id=product_id)
        movements = query.order_by(InventoryMovementModel.created_at.desc()).all()
        return [m.to_dict() for m in movements]

    # ---------------------------------------------------------------------
    # Conteos Físicos y Auditorías (RF-024 a RF-027 / RN-022 a RN-025)
    # ---------------------------------------------------------------------
    def register_physical_count(self, data, user_id=1):
        product_id = data.get("product_id")
        physical_stock = int(data.get("physical_stock", 0))
        signed_act_url = data.get("signed_act_url", "").strip()

        product = ProductModel.query.get(product_id)
        if not product:
            raise ValueError("El producto no existe.")

        system_stock = int(product.stock)
        difference = physical_stock - system_stock

        if system_stock > 0:
            diff_percentage = (abs(difference) / system_stock) * 100
        else:
            diff_percentage = 100.0 if physical_stock > 0 else 0.0

        if diff_percentage > 2.0 and not signed_act_url:
            raise ValueError(
                f"La diferencia es del {diff_percentage:.2f}% (supera el 2%). "
                "Es obligatorio adjuntar o registrar la referencia del acta firmada."
            )

        count_record = PhysicalCountModel(
            product_id=product_id,
            system_stock=system_stock,
            physical_stock=physical_stock,
            difference_percentage=diff_percentage,
            signed_act_url=signed_act_url,
            user_id=user_id,
            count_date=datetime.utcnow()
        )

        db.session.add(count_record)
        db.session.commit()
        return count_record.to_dict()

    def apply_stock_adjustment(self, count_id, user_role="Supervisor", user_name="Usuario", user_id=1):
        if user_role not in ["Administrador", "Supervisor"]:
            raise ValueError("Solo usuarios con rol de Administrador o Supervisor pueden actualizar el stock.")

        count_record = PhysicalCountModel.query.get(count_id)
        if not count_record:
            raise ValueError("El registro de conteo no existe.")

        product = ProductModel.query.get(count_record.product_id)
        if not product:
            raise ValueError("El producto no existe.")

        difference = count_record.physical_stock - count_record.system_stock

        if difference != 0:
            movement_type = "ENTRY" if difference > 0 else "ADJUSTMENT_OUT"
            movement = InventoryMovementModel(
                product_id=product.id,
                user_id=count_record.user_id or user_id,
                quantity=abs(difference),
                movement_type=movement_type,
                reason=f"Ajuste por Conteo Físico #{count_record.id}. Soporte: {count_record.signed_act_url or 'N/A'}"
            )

            product.stock = count_record.physical_stock
            db.session.add(movement)
            db.session.commit()

        return {
            "count": count_record.to_dict(),
            "updated_stock": product.stock
        }

    def get_physical_counts_history(self):
        counts = PhysicalCountModel.query.order_by(PhysicalCountModel.count_date.desc()).all()
        return [c.to_dict() for c in counts]

    # ---------------------------------------------------------------------
    # Alertas y Reabastecimiento Automático (RF-028 / RN-026)
    # ---------------------------------------------------------------------
    def get_stock_alerts(self):
        products = ProductModel.query.filter(
            ProductModel.is_active == True,
            ProductModel.stock <= ProductModel.min_stock
        ).all()

        alerts = []
        for p in products:
            alert_level = "CRITICO" if p.stock == 0 else "ADVERTENCIA"
            target_stock = (p.min_stock * 2) if p.min_stock > 0 else 10
            suggested_quantity = max(target_stock - p.stock, 5)

            supplier_id = getattr(p, "supplier_id", None)
            supplier = SupplierModel.query.get(supplier_id) if supplier_id else None

            alerts.append({
                "product_id": p.id,
                "product_name": p.name,
                "sku": getattr(p, "sku", f"PROD-{p.id}"),
                "current_stock": p.stock,
                "min_stock": p.min_stock,
                "alert_level": alert_level,
                "suggested_quantity": suggested_quantity,
                "supplier_id": supplier.id if supplier else None,
                "supplier_name": supplier.name if supplier else "Sin Proveedor Asignado",
                "unit_cost": float(getattr(p, "cost", 0.0))
            })

        return alerts

    def generate_reorder_suggestion(self, product_ids):
        if not product_ids:
            raise ValueError("Debe seleccionar al menos un producto para generar la sugerencia de compra.")

        products = ProductModel.query.filter(ProductModel.id.in_(product_ids)).all()
        
        grouped_by_supplier = {}
        for p in products:
            supplier_id = getattr(p, 'supplier_id', None) or 0
            supplier = SupplierModel.query.get(supplier_id) if supplier_id else None
            supplier_name = supplier.name if supplier else "Proveedor No Asignado"

            target_stock = (p.min_stock * 2) if p.min_stock > 0 else 10
            quantity = max(target_stock - p.stock, 5)
            unit_cost = float(getattr(p, "cost", 0.0))

            item = {
                "product_id": p.id,
                "product_name": p.name,
                "current_stock": p.stock,
                "min_stock": p.min_stock,
                "suggested_quantity": quantity,
                "unit_cost": unit_cost,
                "total_estimated": round(quantity * unit_cost, 2)
            }

            if supplier_id not in grouped_by_supplier:
                grouped_by_supplier[supplier_id] = {
                    "supplier_id": supplier_id,
                    "supplier_name": supplier_name,
                    "items": [],
                    "total_order_cost": 0.0
                }

            grouped_by_supplier[supplier_id]["items"].append(item)
            grouped_by_supplier[supplier_id]["total_order_cost"] += item["total_estimated"]

        return list(grouped_by_supplier.values())

    # ---------------------------------------------------------------------
    # Mermas, Pérdidas y Bajas de Stock (RF-030 / RN-028)
    # ---------------------------------------------------------------------
    def register_loss_record(self, data, user_id=1):
        product_id = data.get("product_id")
        quantity = int(data.get("quantity", 0))
        reason = data.get("reason", "").strip()

        if quantity <= 0:
            raise ValueError("La cantidad de la merma debe ser mayor a 0.")
        if not reason or len(reason) < 5:
            raise ValueError("RN-028: Debe especificar un motivo detallado para la merma o pérdida.")

        product = ProductModel.query.get(product_id)
        if not product:
            raise ValueError("El producto especificado no existe.")

        loss_record = LossRecordModel(
            product_id=product_id,
            quantity=quantity,
            reason=reason,
            status="Pendiente",
            user_id=user_id
        )
        db.session.add(loss_record)
        db.session.commit()
        return loss_record.to_dict()

    def process_loss_approval(self, loss_id, action, approver_id=1, user_role="Supervisor"):
        if user_role not in ["Administrador", "Supervisor"]:
            raise ValueError("Solo administradores o supervisores pueden aprobar mermas de inventario.")

        loss_record = LossRecordModel.query.get(loss_id)
        if not loss_record:
            raise ValueError("El registro de merma no existe.")

        if loss_record.status != "Pendiente":
            raise ValueError(f"La merma #{loss_id} ya se encuentra en estado '{loss_record.status}'.")

        if action == "APROBAR":
            product = ProductModel.query.get(loss_record.product_id)
            if not product:
                raise ValueError("El producto no existe.")

            if product.stock < loss_record.quantity:
                raise ValueError("Stock insuficiente para aplicar la baja por merma.")

            product.stock -= loss_record.quantity
            movement = InventoryMovementModel(
                product_id=product.id,
                user_id=approver_id,
                movement_type="LOSS",
                quantity=loss_record.quantity,
                reason=f"Baja por Merma Aprobada #{loss_record.id}: {loss_record.reason}"
            )
            db.session.add(movement)
            loss_record.status = "Aprobado"
            loss_record.approved_by = approver_id

        elif action == "RECHAZAR":
            loss_record.status = "Rechazado"
            loss_record.approved_by = approver_id
        else:
            raise ValueError("Acción no válida. Debe ser 'APROBAR' o 'RECHAZAR'.")

        db.session.commit()
        return loss_record.to_dict()

    def get_loss_records_history(self):
        records = LossRecordModel.query.order_by(LossRecordModel.created_at.desc()).all()
        return [r.to_dict() for r in records]

# Alias de compatibilidad
CompleteInventoryService = InventoryService