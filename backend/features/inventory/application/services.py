from datetime import datetime, time
from app.extensions import db
from features.products.infrastructure.models import ProductModel
from features.suppliers.infrastructure.models import SupplierModel
from features.purchases.infrastructure.models import (
    PurchaseOrderModel,
    PurchaseOrderItemModel,
)
from features.inventory.infrastructure.models import (
    InventoryMovementModel,
    PhysicalCountModel,
    LossRecordModel,
)


class InventoryService:

    # ---------------------------------------------------------------------
    # Disparo Automático de Orden de Reabastecimiento (RF-028 / RN-026)
    # ---------------------------------------------------------------------
    def _check_and_trigger_reorder(self, product, user_id=1):
        """
        Cuando product.stock <= product.min_stock, genera automáticamente
        una orden de compra de reabastecimiento en estado 'Pendiente'
        si no existe ya una orden abierta para ese producto.
        """
        if not product or not getattr(product, "is_active", True):
            return None

        if product.stock > product.min_stock:
            return None

        existing_open_item = (
            db.session.query(PurchaseOrderItemModel)
            .join(PurchaseOrderModel)
            .filter(
                PurchaseOrderItemModel.product_id == product.id,
                PurchaseOrderModel.status.in_(["Pendiente", "Borrador", "Enviada"]),
            )
            .first()
        )
        if existing_open_item:
            return existing_open_item.order

        supplier_id = getattr(product, "supplier_id", None)
        if not supplier_id:
            first_supplier = SupplierModel.query.first()
            if not first_supplier:
                return None
            supplier_id = first_supplier.id

        target_stock = (product.min_stock * 2) if product.min_stock > 0 else 10
        suggested_qty = max(target_stock - product.stock, 5)
        unit_cost = float(getattr(product, "cost", None) or getattr(product, "price", 0.0) or 0.0)
        total_amount = round(suggested_qty * unit_cost, 2)

        order_number = f"REAB-{datetime.utcnow().strftime('%Y%m%d%H%M%S')}-{product.id}"

        order = PurchaseOrderModel(
            order_number=order_number,
            supplier_id=supplier_id,
            user_id=user_id,
            status="Pendiente",
            total_amount=total_amount,
            notes=(
                f"Orden de reabastecimiento automática (RF-028 / RN-026) por stock mínimo "
                f"en '{product.name}' (Stock: {product.stock}, Mínimo: {product.min_stock})."
            ),
        )
        db.session.add(order)
        db.session.flush()

        item = PurchaseOrderItemModel(
            purchase_order_id=order.id,
            product_id=product.id,
            quantity=suggested_qty,
            quantity_received=0,
            unit_cost=unit_cost,
        )
        db.session.add(item)
        return order

    # ---------------------------------------------------------------------
    # Movimientos, Historial y Reporte de Periodo (RF-023 / RF-027 / RF-029)
    # ---------------------------------------------------------------------
    def register_entry(self, data, user_id=1):
        supplier_id = data.get("supplier_id")
        invoice_number = data.get("invoice_number")

        if not supplier_id or not invoice_number:
            raise ValueError(
                "RN-021: No se pueden registrar entradas de inventario "
                "sin información de proveedor o factura de compra."
            )

        product = ProductModel.query.get(data["product_id"])
        if not product:
            raise ValueError("El producto especificado no existe.")

        quantity = int(data["quantity"])
        if quantity <= 0:
            raise ValueError("La cantidad ingresada debe ser mayor a 0.")

        previous_stock = product.stock
        product.stock += quantity
        new_stock = product.stock

        movement = InventoryMovementModel(
            product_id=product.id,
            supplier_id=supplier_id,
            user_id=user_id,
            movement_type="ENTRY",
            quantity=quantity,
            previous_stock=previous_stock,
            new_stock=new_stock,
            invoice_number=invoice_number,
            reason=data.get("reason", "Entrada por compra"),
        )

        db.session.add(movement)
        db.session.commit()

        return movement.to_dict()

    def register_adjustment(self, data, user_id=1):
        reason = data.get("reason")

        if not reason or len(reason.strip()) < 5:
            raise ValueError(
                "RN-025: Debe proporcionar un motivo válido "
                "para el ajuste de inventario."
            )

        product = ProductModel.query.get(data["product_id"])
        if not product:
            raise ValueError("El producto especificado no existe.")

        quantity = int(data["quantity"])

        if quantity <= 0:
            raise ValueError(
                "La cantidad del ajuste debe ser mayor a 0."
            )

        movement_type = data.get(
            "movement_type", "ADJUSTMENT_OUT"
        )

        previous_stock = product.stock

        if movement_type == "ADJUSTMENT_OUT":
            if product.stock < quantity:
                raise ValueError(
                    "Stock insuficiente para realizar el ajuste."
                )
            product.stock -= quantity

        elif movement_type == "ADJUSTMENT_IN":
            product.stock += quantity

        else:
            raise ValueError("Tipo de ajuste no válido.")

        new_stock = product.stock

        movement = InventoryMovementModel(
            product_id=product.id,
            user_id=user_id,
            movement_type=movement_type,
            quantity=quantity,
            previous_stock=previous_stock,
            new_stock=new_stock,
            reason=reason.strip(),
        )

        db.session.add(movement)

        auto_order = self._check_and_trigger_reorder(product, user_id=user_id)

        db.session.commit()

        response = movement.to_dict()
        if auto_order:
            response["reorder_order_number"] = auto_order.order_number
            response["reorder_triggered"] = True
        return response

    def get_history(self, product_id=None):
        query = InventoryMovementModel.query

        if product_id:
            query = query.filter_by(product_id=product_id)

        movements = query.order_by(
            InventoryMovementModel.created_at.desc()
        ).all()

        return [movement.to_dict() for movement in movements]

    def generate_inventory_report(self, start_date=None, end_date=None, requested_by="Administrador"):
        """
        RF-029 / RI-029 / RN-027: Genera el reporte consolidado de movimientos por periodo.
        Garantiza: stock_inicial + entradas - salidas = stock_final y retención mínima de 5 años.
        """
        now_utc = datetime.utcnow()
        today_str = now_utc.strftime("%Y-%m-%d")
        start_str = start_date or f"{today_str[:8]}01"
        end_str = end_date or today_str

        try:
            start_dt = datetime.combine(datetime.strptime(start_str, "%Y-%m-%d").date(), time.min)
            end_dt = datetime.combine(datetime.strptime(end_str, "%Y-%m-%d").date(), time.max)
        except ValueError:
            raise ValueError("Formato de fecha inválido. Use YYYY-MM-DD.")

        if start_dt > end_dt:
            raise ValueError("La fecha de inicio no puede ser mayor que la fecha fin.")

        positive_types = {"ENTRY", "ADJUSTMENT_IN", "ADJUSTMENT_AUTO"}
        products = ProductModel.query.order_by(ProductModel.name.asc()).all()
        items = []

        for product in products:
            current_stock = int(product.stock or 0)

            after_movements = InventoryMovementModel.query.filter(
                InventoryMovementModel.product_id == product.id,
                InventoryMovementModel.created_at > end_dt,
            ).all()

            net_after = 0
            for m in after_movements:
                qty = int(m.quantity or 0)
                if m.movement_type in positive_types:
                    net_after += qty
                else:
                    net_after -= qty

            final_stock = current_stock - net_after

            period_movements = (
                InventoryMovementModel.query.filter(
                    InventoryMovementModel.product_id == product.id,
                    InventoryMovementModel.created_at >= start_dt,
                    InventoryMovementModel.created_at <= end_dt,
                )
                .order_by(InventoryMovementModel.created_at.asc())
                .all()
            )

            entries = 0
            exits = 0
            last_responsible = requested_by

            for m in period_movements:
                qty = int(m.quantity or 0)
                if m.movement_type in positive_types:
                    entries += qty
                else:
                    exits += qty

                m_dict = m.to_dict()
                if m_dict.get("user_name"):
                    last_responsible = m_dict["user_name"]

            if period_movements and period_movements[0].previous_stock is not None:
                initial_stock = int(period_movements[0].previous_stock)
            else:
                initial_stock = final_stock - entries + exits

            is_balanced = (initial_stock + entries - exits) == final_stock

            items.append({
                "product_id": product.id,
                "product_name": product.name,
                "initial_stock": initial_stock,
                "entries": entries,
                "exits": exits,
                "final_stock": final_stock,
                "responsible": last_responsible,
                "is_balanced": is_balanced,
            })

        retention_until = now_utc.replace(year=now_utc.year + 5)

        return {
            "period": {
                "start_date": start_str,
                "end_date": end_str,
            },
            "generated_by": requested_by,
            "generated_at": now_utc.isoformat() + "Z",
            "retention_policy": {
                "rule": "RN-027",
                "retention_years": 5,
                "retention_until": retention_until.strftime("%Y-%m-%d"),
                "deletable": False,
            },
            "items": items,
        }

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
            diff_percentage = (
                abs(difference) / system_stock
            ) * 100
        else:
            diff_percentage = (
                100.0 if physical_stock > 0 else 0.0
            )

        # RN-022: todo ajuste debe estar soportado por acta firmada.
        if difference != 0 and not signed_act_url:
            raise ValueError(
                "Es obligatorio adjuntar o registrar la referencia del acta "
                "firmada para soportar el ajuste del conteo."
            )

        count_record = PhysicalCountModel(
            product_id=product_id,
            system_stock=system_stock,
            physical_stock=physical_stock,
            difference_percentage=diff_percentage,
            signed_act_url=signed_act_url,
            user_id=user_id,
            count_date=datetime.utcnow(),
        )

        db.session.add(count_record)
        db.session.commit()

        # RN-023: si la diferencia supera el 2 %, el ajuste se genera automáticamente.
        automatic_adjustment = False
        if diff_percentage > 2.0 and difference != 0:
            self.apply_stock_adjustment(
                count_record.id,
                user_role="Administrador",
                user_name="Ajuste automático por conteo",
                user_id=user_id,
            )
            automatic_adjustment = True

        return {
            **count_record.to_dict(),
            "automatic_adjustment": automatic_adjustment,
        }

    def apply_stock_adjustment(
        self,
        count_id,
        user_role="Supervisor",
        user_name="Usuario",
        user_id=1,
    ):
        if user_role not in ["Administrador", "Supervisor"]:
            raise ValueError(
                "Solo usuarios con rol de Administrador o Supervisor "
                "pueden actualizar el stock."
            )

        count_record = PhysicalCountModel.query.get(count_id)
        if not count_record:
            raise ValueError("El registro de conteo no existe.")

        product = ProductModel.query.get(count_record.product_id)
        if not product:
            raise ValueError("El producto no existe.")

        difference = (
            count_record.physical_stock - count_record.system_stock
        )

        if difference != 0:
            previous_stock = product.stock

            movement_type = (
                "ENTRY" if difference > 0 else "ADJUSTMENT_OUT"
            )

            product.stock = count_record.physical_stock
            new_stock = product.stock

            movement = InventoryMovementModel(
                product_id=product.id,
                user_id=count_record.user_id or user_id,
                quantity=abs(difference),
                previous_stock=previous_stock,
                new_stock=new_stock,
                movement_type=movement_type,
                reason=(
                    f"Ajuste por Conteo Físico #{count_record.id}. "
                    f"Soporte: {count_record.signed_act_url or 'N/A'}"
                ),
            )

            db.session.add(movement)
            self._check_and_trigger_reorder(product, user_id=count_record.user_id or user_id)
            db.session.commit()

        return {
            "count": count_record.to_dict(),
            "updated_stock": product.stock,
        }

    def get_physical_counts_history(self):
        counts = PhysicalCountModel.query.order_by(
            PhysicalCountModel.count_date.desc()
        ).all()

        return [count.to_dict() for count in counts]

    # ---------------------------------------------------------------------
    # Alertas y Reabastecimiento Automático (RF-028 / RN-026)
    # ---------------------------------------------------------------------
    def get_stock_alerts(self):
        products = ProductModel.query.filter(
            ProductModel.is_active == True,
            ProductModel.stock <= ProductModel.min_stock,
        ).all()

        alerts = []

        for product in products:
            alert_level = (
                "CRITICO" if product.stock == 0 else "ADVERTENCIA"
            )

            target_stock = (
                product.min_stock * 2
                if product.min_stock > 0
                else 10
            )

            suggested_quantity = max(
                target_stock - product.stock, 5
            )

            supplier_id = getattr(
                product, "supplier_id", None
            )

            supplier = (
                SupplierModel.query.get(supplier_id)
                if supplier_id
                else None
            )

            alerts.append({
                "product_id": product.id,
                "product_name": product.name,
                "sku": getattr(
                    product, "sku", f"PROD-{product.id}"
                ),
                "current_stock": product.stock,
                "min_stock": product.min_stock,
                "alert_level": alert_level,
                "suggested_quantity": suggested_quantity,
                "supplier_id": supplier.id if supplier else None,
                "supplier_name": (
                    supplier.name
                    if supplier
                    else "Sin Proveedor Asignado"
                ),
                "unit_cost": float(
                    getattr(product, "cost", 0.0)
                ),
            })

        return alerts

    def generate_reorder_suggestion(self, product_ids):
        if not product_ids:
            raise ValueError(
                "Debe seleccionar al menos un producto "
                "para generar la sugerencia de compra."
            )

        products = ProductModel.query.filter(
            ProductModel.id.in_(product_ids)
        ).all()

        grouped_by_supplier = {}

        for product in products:
            supplier_id = (
                getattr(product, "supplier_id", None) or 0
            )

            supplier = (
                SupplierModel.query.get(supplier_id)
                if supplier_id
                else None
            )

            supplier_name = (
                supplier.name
                if supplier
                else "Proveedor No Asignado"
            )

            target_stock = (
                product.min_stock * 2
                if product.min_stock > 0
                else 10
            )

            quantity = max(
                target_stock - product.stock, 5
            )

            unit_cost = float(
                getattr(product, "cost", 0.0)
            )

            item = {
                "product_id": product.id,
                "product_name": product.name,
                "current_stock": product.stock,
                "min_stock": product.min_stock,
                "suggested_quantity": quantity,
                "unit_cost": unit_cost,
                "total_estimated": round(
                    quantity * unit_cost, 2
                ),
            }

            if supplier_id not in grouped_by_supplier:
                grouped_by_supplier[supplier_id] = {
                    "supplier_id": supplier_id,
                    "supplier_name": supplier_name,
                    "items": [],
                    "total_order_cost": 0.0,
                }

            grouped_by_supplier[supplier_id]["items"].append(item)

            grouped_by_supplier[supplier_id][
                "total_order_cost"
            ] += item["total_estimated"]

        return list(grouped_by_supplier.values())

    # ---------------------------------------------------------------------
    # Mermas, Pérdidas y Bajas de Stock (RF-030 / RN-028)
    # ---------------------------------------------------------------------
    def register_loss_record(self, data, user_id=1):
        product_id = data.get("product_id")
        quantity = int(data.get("quantity", 0))
        reason = data.get("reason", "").strip()

        if quantity <= 0:
            raise ValueError(
                "La cantidad de la merma debe ser mayor a 0."
            )

        if not reason or len(reason) < 5:
            raise ValueError(
                "RN-028: Debe especificar un motivo detallado "
                "para la merma o pérdida."
            )

        product = ProductModel.query.get(product_id)
        if not product:
            raise ValueError(
                "El producto especificado no existe."
            )

        loss_record = LossRecordModel(
            product_id=product_id,
            quantity=quantity,
            reason=reason,
            status="Pendiente",
            user_id=user_id,
        )

        db.session.add(loss_record)
        db.session.commit()

        return loss_record.to_dict()

    def process_loss_approval(
        self,
        loss_id,
        action,
        approver_id=1,
        user_role="Supervisor",
    ):
        if user_role not in ["Administrador", "Supervisor"]:
            raise ValueError(
                "Solo administradores o supervisores pueden "
                "aprobar mermas de inventario."
            )

        loss_record = LossRecordModel.query.get(loss_id)
        if not loss_record:
            raise ValueError(
                "El registro de merma no existe."
            )

        if loss_record.status != "Pendiente":
            raise ValueError(
                f"La merma #{loss_id} ya se encuentra "
                f"en estado '{loss_record.status}'."
            )

        if action == "APROBAR":
            product = ProductModel.query.get(
                loss_record.product_id
            )

            if not product:
                raise ValueError("El producto no existe.")

            if product.stock < loss_record.quantity:
                raise ValueError(
                    "Stock insuficiente para aplicar "
                    "la baja por merma."
                )

            previous_stock = product.stock
            product.stock -= loss_record.quantity
            new_stock = product.stock

            movement = InventoryMovementModel(
                product_id=product.id,
                user_id=approver_id,
                movement_type="LOSS",
                quantity=loss_record.quantity,
                previous_stock=previous_stock,
                new_stock=new_stock,
                reason=(
                    f"Baja por Merma Aprobada #{loss_record.id}: "
                    f"{loss_record.reason}"
                ),
            )

            db.session.add(movement)

            self._check_and_trigger_reorder(product, user_id=approver_id)

            loss_record.status = "Aprobado"
            loss_record.approved_by = approver_id

        elif action == "RECHAZAR":
            loss_record.status = "Rechazado"
            loss_record.approved_by = approver_id

        else:
            raise ValueError(
                "Acción no válida. Debe ser 'APROBAR' o 'RECHAZAR'."
            )

        db.session.commit()

        return loss_record.to_dict()

    def get_loss_records_history(self):
        records = LossRecordModel.query.order_by(
            LossRecordModel.created_at.desc()
        ).all()

        return [record.to_dict() for record in records]


# Alias de compatibilidad
CompleteInventoryService = InventoryService
