# =====================================================================
# Rutas de campañas promocionales, tendencias y combos
# ---------------------------------------------------------------------
# GET  /api/campaigns                       personal (admin / supervisor)
# POST /api/campaigns                       planificar (RF-049)
# POST /api/campaigns/<id>/legal-approval   aprobación legal (RF-050)
# POST /api/campaigns/<id>/launch           lanzar (RF-051, RN-046)
# POST /api/campaigns/<id>/close            cerrar y archivar (RF-054, RN-050)
# GET  /api/campaigns/trends                SOLO admin (RF-055, RN-051)
# GET  /api/campaigns/combos                público
# POST /api/campaigns/combos                crear combo (RF-056, RN-052)
# =====================================================================
from flask import Blueprint, current_app, jsonify, request

from features.promotions.application.services import CampaignService
from shared.security.decorators import role_required
from shared.security.roles import STAFF_ROLES

# El frontend llama a /api/... (igual que el resto de módulos)
campaigns_bp = Blueprint("campaigns", __name__, url_prefix="/campaigns")
campaign_service = CampaignService()


def _responder(accion, mensaje=None, clave=None, status=200):
    """Ejecuta un caso de uso y traduce sus errores a respuestas HTTP.

    - ValueError  -> 400 con el mensaje de la regla de negocio
    - Otro error  -> 500 genérico (el detalle queda en el log, no en la respuesta)
    """
    try:
        resultado = accion()
    except ValueError as ve:
        return jsonify({"error": str(ve)}), 400
    except Exception:
        current_app.logger.exception("Error inesperado en campañas")
        return jsonify({"error": "Error interno del servidor"}), 500

    if clave is None:
        return jsonify(resultado), status
    return jsonify({"message": mensaje, clave: resultado}), status


@campaigns_bp.get("")
@campaigns_bp.get("/")
@role_required(*STAFF_ROLES)
def get_campaigns():
    return _responder(campaign_service.get_all_campaigns)


@campaigns_bp.post("")
@campaigns_bp.post("/")
@role_required(*STAFF_ROLES)
def create_campaign():
    data = request.get_json(silent=True) or {}
    return _responder(
        lambda: campaign_service.create_campaign(data),
        "Campaña planificada exitosamente.",
        "campaign",
        201,
    )


@campaigns_bp.post("/<int:campaign_id>/legal-approval")
@role_required(*STAFF_ROLES)
def legal_approval(campaign_id):
    data = request.get_json(silent=True) or {}
    return _responder(
        lambda: campaign_service.register_legal_approval(campaign_id, data),
        "Aprobación legal registrada correctamente.",
        "campaign",
    )


@campaigns_bp.post("/<int:campaign_id>/launch")
@role_required(*STAFF_ROLES)
def launch_campaign(campaign_id):
    return _responder(
        lambda: campaign_service.launch_campaign(campaign_id),
        "Campaña lanzada y en ejecución.",
        "campaign",
    )


@campaigns_bp.post("/<int:campaign_id>/close")
@role_required(*STAFF_ROLES)
def close_campaign(campaign_id):
    data = request.get_json(silent=True) or {}
    return _responder(
        lambda: campaign_service.close_campaign(campaign_id, data),
        "Campaña cerrada y archivada históricamente (RN-050).",
        "campaign",
    )


@campaigns_bp.get("/trends")
@role_required("admin")  # RN-051: solo administradores
def get_trends():
    return _responder(campaign_service.get_consumption_trends)


@campaigns_bp.get("/combos")
def get_combos():
    return _responder(campaign_service.get_all_combos)


@campaigns_bp.post("/combos")
@role_required(*STAFF_ROLES)
def create_combo():
    data = request.get_json(silent=True) or {}
    return _responder(
        lambda: campaign_service.create_combo(data),
        "Combo creado exitosamente respetando stock mínimo (RN-052).",
        "combo",
        201,
    )