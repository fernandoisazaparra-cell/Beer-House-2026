"""add previous_stock and new_stock to inventory_movements

Revision ID: a1b2c3d4e5f6
Revises: 37df23f9e763
"""
from alembic import op
import sqlalchemy as sa

revision = "a1b2c3d4e5f6"
down_revision = "37df23f9e763"
branch_labels = None
depends_on = None


def _columns():
    insp = sa.inspect(op.get_bind())
    return [c["name"] for c in insp.get_columns("inventory_movements")]


def upgrade():
    cols = _columns()
    if "previous_stock" not in cols:
        op.add_column("inventory_movements", sa.Column("previous_stock", sa.Integer(), nullable=True))
    if "new_stock" not in cols:
        op.add_column("inventory_movements", sa.Column("new_stock", sa.Integer(), nullable=True))


def downgrade():
    cols = _columns()
    if "new_stock" in cols:
        op.drop_column("inventory_movements", "new_stock")
    if "previous_stock" in cols:
        op.drop_column("inventory_movements", "previous_stock")