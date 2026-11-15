"""Crear tabla combos

Revision ID: 8c4f2a91d630
Revises: 37df23f9e763
"""

from alembic import op
import sqlalchemy as sa

revision = "8c4f2a91d630"
down_revision = "37df23f9e763"
branch_labels = None
depends_on = None


def upgrade():
    op.create_table(
        "combos",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("name", sa.String(length=150), nullable=False),
        sa.Column("description", sa.Text(), nullable=True),
        sa.Column("price", sa.Numeric(10, 2), nullable=False),
        sa.Column(
            "discount",
            sa.Numeric(5, 2),
            nullable=True,
            server_default=sa.text("0.00"),
        ),
        sa.Column("image_url", sa.Text(), nullable=True),
        sa.Column(
            "stock",
            sa.Integer(),
            nullable=True,
            server_default=sa.text("10"),
        ),
        sa.Column(
            "status",
            sa.String(length=20),
            nullable=True,
            server_default=sa.text("'active'"),
        ),
        sa.PrimaryKeyConstraint("id"),
    )


def downgrade():
    op.drop_table("combos")
