
"""crear tablas del modulo de ventas

Revision ID: 37df23f9e763
Revises: 19a8aedf93da
Create Date: 2026-11-12 09:34:06.113155

"""
from alembic import op
import sqlalchemy as sa

# revision identifiers, used by Alembic.
revision = '37df23f9e763'
down_revision = '19a8aedf93da'
branch_labels = None
depends_on = None


def upgrade():
    op.create_table(
        'sales',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('order_number', sa.String(length=50), nullable=False),
        sa.Column('user_id', sa.Integer(), nullable=False),
        sa.Column('status', sa.String(length=20), nullable=False),
        sa.Column('total', sa.Numeric(precision=12, scale=2), nullable=False),
        sa.Column('payment_method', sa.String(length=30), nullable=False),
        sa.Column('gateway', sa.String(length=30), nullable=False),
        sa.Column('payment_status', sa.String(length=30), nullable=True),
        sa.Column('transaction_code', sa.String(length=150), nullable=True),
        sa.Column('failure_reason', sa.String(length=255), nullable=True),
        sa.Column('created_at', sa.DateTime(), nullable=False),
        sa.Column('paid_at', sa.DateTime(), nullable=True),
        sa.ForeignKeyConstraint(['user_id'], ['users.id']),
        sa.PrimaryKeyConstraint('id')
    )

    op.create_index(
        'ix_sales_order_number',
        'sales',
        ['order_number'],
        unique=True
    )
    op.create_index(
        'ix_sales_user_id',
        'sales',
        ['user_id'],
        unique=False
    )

    op.create_table(
        'sale_items',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('sale_id', sa.Integer(), nullable=False),
        sa.Column('product_id', sa.Integer(), nullable=False),
        sa.Column('product_name', sa.String(length=150), nullable=False),
        sa.Column('unit_price', sa.Numeric(precision=12, scale=2), nullable=False),
        sa.Column('quantity', sa.Integer(), nullable=False),
        sa.Column('subtotal', sa.Numeric(precision=12, scale=2), nullable=False),
        sa.ForeignKeyConstraint(['product_id'], ['products.id']),
        sa.ForeignKeyConstraint(['sale_id'], ['sales.id']),
        sa.PrimaryKeyConstraint('id')
    )

    op.create_index(
        'ix_sale_items_sale_id',
        'sale_items',
        ['sale_id'],
        unique=False
    )


def downgrade():
    op.drop_index('ix_sale_items_sale_id', table_name='sale_items')
    op.drop_table('sale_items')

    op.drop_index('ix_sales_user_id', table_name='sales')
    op.drop_index('ix_sales_order_number', table_name='sales')
    op.drop_table('sales')

