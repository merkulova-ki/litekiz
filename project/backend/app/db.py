import time
from collections.abc import Iterator

from sqlalchemy import text
from sqlalchemy.exc import OperationalError
from sqlmodel import Session, SQLModel, create_engine

from .config import get_settings

settings = get_settings()

connect_args = {"check_same_thread": False} if settings.database_url.startswith("sqlite") else {}

engine = create_engine(settings.database_url, connect_args=connect_args, pool_pre_ping=True)


def wait_for_db(timeout: int | None = None) -> None:
    if settings.database_url.startswith("sqlite"):
        return

    deadline = time.monotonic() + (timeout or settings.db_wait_seconds)
    last_error: Exception | None = None
    while time.monotonic() < deadline:
        try:
            with engine.connect() as connection:
                connection.execute(text("SELECT 1"))
            return
        except OperationalError as error:
            last_error = error
            time.sleep(1)
    raise RuntimeError(f"База недоступна за {timeout or settings.db_wait_seconds} с: {last_error}")


def init_db() -> None:
    from . import models  # noqa: F401

    wait_for_db()
    SQLModel.metadata.create_all(engine)


def get_session() -> Iterator[Session]:
    with Session(engine) as session:
        yield session
