from app.extensions import db


class CategoryModel(db.Model):
    __tablename__ = "categories"
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(100), nullable=False, unique=True)
    slug = db.Column(db.String(100), nullable=False, unique=True)
    description = db.Column(db.String(255), nullable=True)
    icon = db.Column(db.String(50), nullable=True)
    created_at = db.Column(db.DateTime, nullable=False)

    def __repr__(self):
        return f"<CategoryModel {self.name}>"
