from datetime import datetime
from app.extensions import db

class CustomerInteractionModel(db.Model):
    __tablename__ = "customer_interactions"
    __table_args__ = {'extend_existing': True}

    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey("users.id"), nullable=False, index=True)
    comment = db.Column(db.Text, nullable=True)
    reaction = db.Column(db.String(50), nullable=True) # Like, Love, Share, etc.
    platform = db.Column(db.String(50), default="Web", nullable=False) # Web, Redes Sociales
    created_at = db.Column(db.DateTime, default=datetime.utcnow, nullable=False)

    user = db.relationship("UserModel", backref=db.backref("interactions", cascade="all, delete-orphan", lazy=True))

    def to_dict(self):
        return {
            "id": self.id,
            "user_id": self.user_id,
            "client_name": f"{self.user.first_name} {self.user.last_name}" if self.user else "N/A",
            "comment": self.comment,
            "reaction": self.reaction,
            "platform": self.platform,
            "created_at": self.created_at.strftime("%Y-%m-%d %H:%M:%S") if self.created_at else ""
        }


class SatisfactionSurveyModel(db.Model):
    __tablename__ = "satisfaction_surveys"
    __table_args__ = {'extend_existing': True}

    id = db.Column(db.Integer, primary_key=True)
    # RN-056: Almacenado por separado / Anónimo (no enlazado rígidamente con foreign key directa al usuario para garantizar anonimato)
    anonymous_session_token = db.Column(db.String(100), nullable=False)
    answers_json = db.Column(db.Text, nullable=False) # Preguntas y respuestas en formato JSON
    created_at = db.Column(db.DateTime, default=datetime.utcnow, nullable=False)

    def to_dict(self):
        return {
            "id": self.id,
            "answers": self.answers_json,
            "created_at": self.created_at.strftime("%Y-%m-%d %H:%M:%S") if self.created_at else ""
        }