import json
from datetime import datetime

from sqlalchemy import func

from app.extensions import db
from features.products.infrastructure.models import ProductModel
from features.promotions.infrastructure.models import (
    CampaignLegalApprovalModel,
    CampaignModel,
    ComboItemModel,
    ComboModel,
)
from features.purchases.infrastructure.models import CustomerOrderModel

# Estados de una campaña
PLANNING = "PLANNING"
APPROVED = "APPROVED"
ACTIVE = "ACTIVE"
CLOSED = "CLOSED"


class CampaignService:
    # ==========================================
    # Utilidades internas
    # ==========================================
    def _get_campaign(self, campaign_id):
        campaign = db.session.get(CampaignModel, campaign_id)
        if not campaign:
            raise ValueError("La campaña especificada no existe.")
        return campaign

    def _validar_no_cerrada(self, campaign):
        """RN-050: una campaña cerrada no puede reabrirse ni modificarse."""
        if campaign.status == CLOSED:
            raise ValueError("RN-050: Esta campaña ya se encuentra cerrada y no puede modificarse.")

    def _parse_fecha(self, texto):
        try:
            return datetime.strptime(str(texto), "%Y-%m-%d").date()
        except ValueError:
            raise ValueError("Formato de fecha inválido. Use YYYY-MM-DD.") from None

    # ==========================================
    # CAMPAÑAS (RF-049 a RF-054)
    # ==========================================
    def get_all_campaigns(self):
        campaigns = CampaignModel.query.order_by(CampaignModel.created_at.desc()).all()
        return [c.to_dict() for c in campaigns]

    def create_campaign(self, data):
        """RF-049: Planificar campaña asegurando stock disponible (RN-045)."""
        name = (data.get("name") or "").strip()
        if not name or not data.get("start_date") or not data.get("end_date"):
            raise ValueError("El nombre y las fechas de inicio y fin son obligatorios.")

        start_date = self._parse_fecha(data["start_date"])
        end_date = self._parse_fecha(data["end_date"])
        if end_date < start_date:
            raise ValueError("La fecha de fin no puede ser anterior a la de inicio.")

        try:
            budget = float(data.get("budget"))
        except (TypeError, ValueError):
            raise ValueError("El presupuesto debe ser un número.") from None
        if budget <= 0:
            raise ValueError("El presupuesto debe ser mayor a 0.")

        # RI-049: al menos un canal (se limpian espacios y comas sobrantes)
        canales = [c.strip() for c in str(data.get("channels") or "").split(",") if c.strip()]
        if not canales:
            raise ValueError("Debes indicar al menos un canal.")

        products_list = data.get("included_products") or []
        if not isinstance(products_list, list):
            raise ValueError("included_products debe ser una lista de IDs de productos.")

        # RN-045: los productos incluidos deben existir, estar activos y tener inventario
        for prod_id in dict.fromkeys(products_list):
            product = db.session.get(ProductModel, prod_id)
            if not product or not product.active:
                raise ValueError(f"RN-045: El producto ID {prod_id} no existe o está inactivo.")
            if product.stock <= 0:
                raise ValueError(
                    f"RN-045: No se puede incluir '{product.name}' porque no cuenta con inventario disponible."
                )

        campaign = CampaignModel(
            name=name,
            start_date=start_date,
            end_date=end_date,
            budget=budget,
            channels=", ".join(canales),
            included_products=json.dumps(list(dict.fromkeys(products_list))),
            status=PLANNING,
        )
        db.session.add(campaign)
        db.session.commit()
        return campaign.to_dict()

    def register_legal_approval(self, campaign_id, data):
        """RF-050 / RN-046: Registrar aprobación legal y documentación previa."""
        campaign = self._get_campaign(campaign_id)
        self._validar_no_cerrada(campaign)
        if campaign.status == ACTIVE:
            raise ValueError(
                "La campaña ya está en ejecución; su aprobación legal no puede cambiarse."
            )

        document_url = (data.get("document_url") or "").strip()
        approved_by = data.get("approved_by")
        is_approved = bool(data.get("is_approved", True))

        if not document_url:
            raise ValueError(
                "Debe adjuntar la documentación legal obligatoria (permisos y restricciones)."
            )

        existing_approval = CampaignLegalApprovalModel.query.filter_by(
            campaign_id=campaign.id
        ).first()
        if existing_approval:
            existing_approval.document_url = document_url
            existing_approval.is_approved = is_approved
            existing_approval.approved_by = approved_by
            existing_approval.approval_date = datetime.utcnow()
        else:
            db.session.add(
                CampaignLegalApprovalModel(
                    campaign_id=campaign.id,
                    document_url=document_url,
                    is_approved=is_approved,
                    approved_by=approved_by,
                )
            )

        campaign.status = APPROVED if is_approved else PLANNING
        db.session.commit()
        return campaign.to_dict()

    def launch_campaign(self, campaign_id):
        """RF-051 / RN-046: Ejecutar campaña verificando aprobación legal previa obligatoria."""
        campaign = self._get_campaign(campaign_id)
        self._validar_no_cerrada(campaign)
        if campaign.status == ACTIVE:
            raise ValueError("La campaña ya está en ejecución.")

        if not campaign.legal_approval or not campaign.legal_approval.is_approved:
            raise ValueError(
                "RN-046: No podrá publicarse ninguna campaña sin aprobación legal registrada."
            )

        campaign.status = ACTIVE
        db.session.commit()
        return campaign.to_dict()

    def close_campaign(self, campaign_id, data):
        """RF-054 / RN-050: Cerrar campaña y archivar resultados (inalterable)."""
        campaign = self._get_campaign(campaign_id)
        self._validar_no_cerrada(campaign)

        campaign.status = CLOSED
        campaign.closed_at = datetime.utcnow()
        campaign.final_results = data.get("final_results", "")
        campaign.learnings = data.get("learnings", "")

        db.session.commit()
        return campaign.to_dict()

    # ==========================================
    # TENDENCIAS Y ANÁLISIS (RF-055 / RN-051)
    # ==========================================
    def get_consumption_trends(self):
        """RF-055: Analiza tendencias de consumo por producto basándose en órdenes de clientes."""
        results = (
            db.session.query(
                CustomerOrderModel.product_name,
                func.sum(CustomerOrderModel.quantity).label("total_sold"),
                func.sum(CustomerOrderModel.total_amount).label("total_revenue"),
            )
            .group_by(CustomerOrderModel.product_name)
            .order_by(func.sum(CustomerOrderModel.quantity).desc())
            .all()
        )

        return [
            {
                "product_name": row.product_name,
                "total_sold": int(row.total_sold or 0),
                "total_revenue": float(row.total_revenue or 0.0),
            }
            for row in results
        ]

    # ==========================================
    # CREACIÓN DE COMBOS (RF-056 / RN-052)
    # ==========================================
    def create_combo(self, data):
        """RF-056: Crea combos validando que el stock supere el mínimo establecido (RN-052)."""
        name = (data.get("name") or "").strip()
        description = data.get("description", "")
        total_price = data.get("total_price", 0.0)
        discount = data.get("discount_applied", 0.0)
        items_data = data.get("items") or []

        if not name or not items_data:
            raise ValueError("El combo debe tener un nombre y al menos un producto.")

        # RN-052: el stock de cada producto no puede estar por debajo de su mínimo
        for item in items_data:
            prod_id = item.get("product_id")
            req_qty = int(item.get("quantity", 1))

            product = db.session.get(ProductModel, prod_id)
            if not product or not product.active:
                raise ValueError(f"El producto con ID {prod_id} no existe o está inactivo.")

            min_stock_allowed = product.min_stock
            if product.stock < min_stock_allowed or product.stock < req_qty:
                raise ValueError(
                    f"RN-052: No se puede incluir '{product.name}' en el combo. "
                    f"Stock actual ({product.stock}) es menor al mínimo permitido ({min_stock_allowed})."
                )

        combo = ComboModel(
            name=name,
            description=description,
            price=total_price,
            discount=discount,
            status="Activo",
        )
        db.session.add(combo)
        db.session.flush()

        for item in items_data:
            db.session.add(
                ComboItemModel(
                    combo_id=combo.id,
                    product_id=item.get("product_id"),
                    quantity=int(item.get("quantity", 1)),
                )
            )

        db.session.commit()
        return combo.to_dict()

    def get_all_combos(self):
        return [c.to_dict() for c in ComboModel.query.all()]