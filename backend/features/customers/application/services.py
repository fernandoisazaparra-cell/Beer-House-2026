from datetime import date, datetime
from app.extensions import db
from features.users.infrastructure.models import UserModel
from features.customers.infrastructure.models import CustomerInteractionModel, SatisfactionSurveyModel
import json

class CustomerService:

    def register_interaction(self, user_id, data):
        """RF-059: Registra interacciones aplicando la regla RN-055 (Si es menor de 18, se eliminan/rechazan sus datos)."""
        user = UserModel.query.get(user_id)
        if not user:
            raise ValueError("Usuario no encontrado.")

        # RN-055: Verificación estricta de mayoría de edad
        is_minor = False
        if user.birth_date:
            today = date.today()
            age = today.year - user.birth_date.year - ((today.month, today.day) < (user.birth_date.month, user.birth_date.day))
            if age < 18:
                is_minor = True

        if is_minor:
            # RN-055: Si se identifica como menor de 18, sus datos e interacciones no se almacenarán (y si existían, se limpian)
            # Borramos cualquier interacción previa por seguridad si la hubiera
            CustomerInteractionModel.query.filter_by(user_id=user_id).delete()
            db.session.commit()
            raise ValueError("RN-055: El usuario es menor de 18 años. Sus interacciones y datos no pueden ser almacenados.")

        comment = data.get("comment", "")
        reaction = data.get("reaction", "")
        platform = data.get("platform", "Web")

        interaction = CustomerInteractionModel(
            user_id=user_id,
            comment=comment,
            reaction=reaction,
            platform=platform
        )

        db.session.add(interaction)
        db.session.commit()
        return interaction.to_dict()

    def submit_survey(self, data):
        """RF-060 / RN-056: Aplica encuesta anónima de satisfacción sin identificar al usuario."""
        answers = data.get("answers")
        if not answers:
            raise ValueError("La encuesta debe contener respuestas válidas.")

        survey = SatisfactionSurveyModel(
            anonymous_session_token=f"ANON-{datetime.utcnow().timestamp()}",
            answers_json=json.dumps(answers, ensure_ascii=False)
        )

        db.session.add(survey)
        db.session.commit()
        return {"message": "Encuesta enviada de forma anónima y procesada exitosamente con éxito (RN-056)."}

    def get_anonymous_surveys(self):
        """Reporta los resultados de encuestas sin identificar al usuario (RN-056)."""
        surveys = SatisfactionSurveyModel.query.order_by(SatisfactionSurveyModel.created_at.desc()).all()
        return [s.to_dict() for s in surveys]