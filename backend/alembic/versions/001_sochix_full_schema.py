"""Sochix full PostgreSQL schema (from schema.sql)

Revision ID: 001
Revises:
Create Date: Initial

This migration runs the full schema.sql. Requires PostgreSQL.
"""
from pathlib import Path

from alembic import op
from sqlalchemy import text

# revision identifiers, used by Alembic.
revision = "001"
down_revision = None
branch_labels = None
depends_on = None


def _split_sql(content: str):
    """Split SQL into statements, respecting $$...$$ blocks."""
    statements = []
    current = []
    in_dollar = False
    i = 0
    n = len(content)
    while i < n:
        if not in_dollar:
            if content[i : i + 2] == "$$":
                current.append(content[i])
                current.append(content[i + 1])
                i += 2
                in_dollar = True
                continue
            if content[i] == ";":
                stmt = "".join(current).strip()
                if stmt and not stmt.startswith("--"):
                    statements.append(stmt)
                current = []
                i += 1
                continue
            # Skip single-line comment
            if content[i : i + 2] == "--":
                while i < n and content[i] != "\n":
                    current.append(content[i])
                    i += 1
                continue
        else:
            if content[i : i + 2] == "$$":
                current.append(content[i])
                current.append(content[i + 1])
                i += 2
                in_dollar = False
                continue
        current.append(content[i])
        i += 1
    stmt = "".join(current).strip()
    if stmt and not stmt.startswith("--"):
        statements.append(stmt)
    return statements


def upgrade() -> None:
    """Run full schema.sql (PostgreSQL only)."""
    # schema.sql at workspace root: from backend/alembic/versions/ -> ../../../schema.sql
    migration_dir = Path(__file__).resolve().parent
    schema_path = (migration_dir / ".." / ".." / ".." / "schema.sql").resolve()
    if not schema_path.exists():
        raise FileNotFoundError(
            f"schema.sql not found at {schema_path}. "
            "Run migrations from repo root or ensure schema.sql exists."
        )
    sql_content = schema_path.read_text()
    statements = _split_sql(sql_content)
    conn = op.get_bind()
    for stmt in statements:
        stmt = stmt.strip()
        if not stmt:
            continue
        try:
            conn.execute(text(stmt))
        except Exception as e:
            # Log and re-raise with context
            raise RuntimeError(f"Failed executing statement:\n{stmt[:200]}...\n\nError: {e}") from e


def downgrade() -> None:
    """No automatic downgrade for full schema. Drop database objects manually if needed."""
    pass
