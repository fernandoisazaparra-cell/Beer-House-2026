"""add users.token_version and profile_update_requests.requested_email

Revision ID: b7e2c1d94a03
Revises: 9d1e4f2a7c60
Create Date: 2026-11-22

"""
from alembic import op
import sqlalchemy as sa


revision = 'b7e2c1d94a03'
down_revision = '9d1e4f2a7c60'
branch_labels = None
depends_on = None


def upgrade():
    with op.batch_alter_table('users', schema=None) as batch_op:
        batch_op.add_column(
            sa.Column(
                'token_version',
                sa.Integer(),
                server_default='0',
                nullable=False,
            )
        )

    with op.batch_alter_table('profile_update_requests', schema=None) as batch_op:
        batch_op.add_column(sa.Column('requested_email', sa.String(255), nullable=True))


def downgrade():
    with op.batch_alter_table('profile_update_requests', schema=None) as batch_op:
        batch_op.drop_column('requested_email')

    with op.batch_alter_table('users', schema=None) as batch_op:
        batch_op.drop_column('token_version')
