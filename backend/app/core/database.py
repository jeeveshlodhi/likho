from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

from app.core.config import settings
from app.core.base import Base

# Import all models so Base.metadata is populated before create_all
from app.modules.users import models as _users_models  # noqa: F401
from app.modules.workspaces import models as _workspace_models  # noqa: F401
from app.modules.sharing import models as _sharing_models  # noqa: F401
from app.modules.collaboration import models as _collab_models  # noqa: F401
from app.modules.feedback import models as _feedback_models  # noqa: F401
from app.modules.notifications import models as _notifications_models  # noqa: F401

engine = create_engine(
    settings.DATABASE_URL,
    connect_args={"check_same_thread": False} if settings.DATABASE_URL.startswith("sqlite") else {},
)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
