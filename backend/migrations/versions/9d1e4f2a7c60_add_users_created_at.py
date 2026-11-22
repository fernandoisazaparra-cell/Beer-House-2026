"""add users.created_at and merge migration heads

Revision ID: 9d1e4f2a7c60
Revises:
    8c4f2a91d630,
    a1b2c3d4e5f6
Create Date: 2026-11-22

"""
from alembic import op
import sqlalchemy as sa


revision = '9d1e4f2a7c60'
down_revision = ('8c4f2a91d630', 'a1b2c3d4e5f6')
branch_labels = None
depends_on = None


def upgrade():
    with op.batch_alter_table('users', schema=None) as batch_op:
        batch_op.add_column(
            sa.Column(
                'created_at',
                sa.DateTime(),
                server_default=sa.func.now(),
                nullable=False,
            )
        )


def downgrade():
    with op.batch_alter_table('users', schema=None) as batch_op:
        batch_op.drop_column('created_at')
