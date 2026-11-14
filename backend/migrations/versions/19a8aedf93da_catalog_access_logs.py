
"""catalog access logs

Revision ID: 19a8aedf93da
Revises: 34937759e876
Create Date: 2026-11-08 17:27:35.617083
"""

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import mysql
from sqlalchemy import inspect


revision = '19a8aedf93da'
down_revision = '34937759e876'
branch_labels = None
depends_on = None


def get_inspector():
    return inspect(op.get_bind())


def table_exists(table_name):
    return get_inspector().has_table(table_name)


def get_columns(table_name):
    return {
        column['name']: column
        for column in get_inspector().get_columns(table_name)
    }


def get_indexes(table_name):
    return {
        index['name']
        for index in get_inspector().get_indexes(table_name)
    }


def get_foreign_keys(table_name):
    return {
        fk['name']: fk
        for fk in get_inspector().get_foreign_keys(table_name)
        if fk.get('name')
    }


def get_foreign_key_name(table_name, column_name):
    for name, fk in get_foreign_keys(table_name).items():
        if column_name in fk.get('constrained_columns', []):
            return name
    return None


def ensure_catalog_access_logs():
    if not table_exists('catalog_access_logs'):
        op.create_table(
            'catalog_access_logs',
            sa.Column('id', sa.Integer(), nullable=False),
            sa.Column('user_id', sa.Integer(), nullable=False),
            sa.Column('action', sa.String(length=20), nullable=False),
            sa.Column('product_id', sa.Integer(), nullable=True),
            sa.Column('detail', sa.Text(), nullable=True),
            sa.Column('results_count', sa.Integer(), nullable=True),
            sa.Column('created_at', sa.DateTime(), nullable=False),
            sa.ForeignKeyConstraint(
                ['product_id'], ['products.id']
            ),
            sa.ForeignKeyConstraint(
                ['user_id'], ['users.id']
            ),
            sa.PrimaryKeyConstraint('id')
        )

    indexes = get_indexes('catalog_access_logs')

    if 'ix_catalog_access_logs_created_at' not in indexes:
        op.create_index(
            'ix_catalog_access_logs_created_at',
            'catalog_access_logs',
            ['created_at'],
            unique=False
        )

    indexes = get_indexes('catalog_access_logs')

    if 'ix_catalog_access_logs_user_id' not in indexes:
        op.create_index(
            'ix_catalog_access_logs_user_id',
            'catalog_access_logs',
            ['user_id'],
            unique=False
        )


def upgrade():

    # 1. Catalog access logs
    ensure_catalog_access_logs()

    # 2. Inventory movements
    if table_exists('inventory_movements'):
        columns = get_columns('inventory_movements')

        if 'user_id' in columns and not columns['user_id']['nullable']:
            op.alter_column(
                'inventory_movements',
                'user_id',
                existing_type=mysql.INTEGER(),
                nullable=True
            )

    # 3. Loss records
    if table_exists('loss_records'):
        columns = get_columns('loss_records')

        if 'user_id' in columns and not columns['user_id']['nullable']:
            op.alter_column(
                'loss_records',
                'user_id',
                existing_type=mysql.INTEGER(),
                nullable=True
            )

    # 4. Pending registrations
    if table_exists('pending_registrations'):
        columns = get_columns('pending_registrations')

        if 'first_name' not in columns:
            op.add_column(
                'pending_registrations',
                sa.Column('first_name', sa.String(100), nullable=True)
            )

        columns = get_columns('pending_registrations')

        if 'last_name' not in columns:
            op.add_column(
                'pending_registrations',
                sa.Column('last_name', sa.String(100), nullable=True)
            )

        columns = get_columns('pending_registrations')

        if 'birth_date' not in columns:
            op.add_column(
                'pending_registrations',
                sa.Column('birth_date', sa.Date(), nullable=True)
            )

        columns = get_columns('pending_registrations')

        if 'name' in columns:
            op.drop_column('pending_registrations', 'name')

    # 5. Physical counts
    if table_exists('physical_counts'):
        columns = get_columns('physical_counts')

        if 'count_date' in columns and not columns['count_date']['nullable']:
            op.alter_column(
                'physical_counts',
                'count_date',
                existing_type=mysql.DATETIME(),
                nullable=True
            )

    # 6. Products
    
    # 7. Profile update requests
    if table_exists('profile_update_requests'):
        fk_name = get_foreign_key_name(
            'profile_update_requests',
            'user_id'
        )

        if fk_name:
            op.drop_constraint(
                fk_name,
                'profile_update_requests',
                type_='foreignkey'
            )

        op.create_foreign_key(
            'fk_profile_update_requests_user',
            'profile_update_requests',
            'users',
            ['user_id'],
            ['id']
        )

    # 8. Purchase order items
    if table_exists('purchase_order_items'):
        columns = get_columns('purchase_order_items')

        if (
            'quantity_received' in columns
            and not columns['quantity_received']['nullable']
        ):
            op.alter_column(
                'purchase_order_items',
                'quantity_received',
                existing_type=mysql.INTEGER(),
                nullable=True
            )

        # Elimina la FK indicada por la migración original.
        foreign_keys = get_foreign_keys('purchase_order_items')

        if 'fk_poi_purchase_order' in foreign_keys:
            op.drop_constraint(
                'fk_poi_purchase_order',
                'purchase_order_items',
                type_='foreignkey'
            )

    # 9. Purchase orders
    if table_exists('purchase_orders'):
        columns = get_columns('purchase_orders')

        if 'status' in columns:
            current_type = str(columns['status']['type']).upper()

            if 'VARCHAR(30)' in current_type:
                op.alter_column(
                    'purchase_orders',
                    'status',
                    existing_type=mysql.VARCHAR(length=30),
                    type_=sa.String(length=20),
                    existing_nullable=False
                )

        columns = get_columns('purchase_orders')

        if 'total_amount' in columns:
            op.alter_column(
                'purchase_orders',
                'total_amount',
                existing_type=mysql.DECIMAL(precision=12, scale=2),
                type_=sa.Numeric(precision=10, scale=2),
                existing_nullable=False,
                nullable=True
            )

        columns = get_columns('purchase_orders')

        if 'created_at' in columns and not columns['created_at']['nullable']:
            op.alter_column(
                'purchase_orders',
                'created_at',
                existing_type=mysql.DATETIME(),
                nullable=True
            )

        for column in (
            'payment_terms',
            'observations',
            'estimated_delivery_date'
        ):
            if column in get_columns('purchase_orders'):
                op.drop_column('purchase_orders', column)

    # 10. Suppliers
    if table_exists('suppliers'):
        columns = get_columns('suppliers')

        if 'nit' in columns:
            op.alter_column(
                'suppliers',
                'nit',
                existing_type=mysql.VARCHAR(length=30),
                type_=sa.String(length=50),
                existing_nullable=False
            )

        columns = get_columns('suppliers')

        if 'representative' in columns:
            op.alter_column(
                'suppliers',
                'representative',
                existing_type=mysql.VARCHAR(length=100),
                type_=sa.String(length=150),
                existing_nullable=True
            )

        columns = get_columns('suppliers')

        if 'email' in columns:
            op.alter_column(
                'suppliers',
                'email',
                existing_type=mysql.VARCHAR(length=150),
                type_=sa.String(length=120),
                existing_nullable=False
            )

        columns = get_columns('suppliers')

        if 'phone' in columns:
            op.alter_column(
                'suppliers',
                'phone',
                existing_type=mysql.VARCHAR(length=30),
                type_=sa.String(length=50),
                existing_nullable=False
            )

        columns = get_columns('suppliers')

        if 'address' in columns:
            op.alter_column(
                'suppliers',
                'address',
                existing_type=mysql.VARCHAR(length=200),
                type_=sa.String(length=255),
                existing_nullable=True
            )

        columns = get_columns('suppliers')

        if 'created_at' in columns and not columns['created_at']['nullable']:
            op.alter_column(
                'suppliers',
                'created_at',
                existing_type=mysql.DATETIME(),
                nullable=True
            )

        columns = get_columns('suppliers')

        if 'updated_at' in columns and not columns['updated_at']['nullable']:
            op.alter_column(
                'suppliers',
                'updated_at',
                existing_type=mysql.DATETIME(),
                nullable=True
            )

        if 'delivery_terms' in get_columns('suppliers'):
            op.drop_column('suppliers', 'delivery_terms')

    # 11. Users
    if table_exists('users'):
        columns = get_columns('users')

        if 'first_name' in columns and columns['first_name']['nullable']:
            op.alter_column(
                'users',
                'first_name',
                existing_type=mysql.VARCHAR(length=100),
                nullable=False
            )

        columns = get_columns('users')

        if 'last_name' in columns and columns['last_name']['nullable']:
            op.alter_column(
                'users',
                'last_name',
                existing_type=mysql.VARCHAR(length=100),
                nullable=False
            )


def downgrade():
    raise NotImplementedError(
        "Esta migración contiene cambios de esquema y eliminación de columnas. "
        "Para revertirla, restaura el respaldo de la base de datos."
    )

