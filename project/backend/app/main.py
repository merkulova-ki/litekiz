import logging
from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from sqlmodel import Session, select

from .config import get_settings
from .db import engine, init_db
from .routers import accounts, catalog, credentials, dashboard, demo, reconciliation

logger = logging.getLogger("uvicorn.error")
settings = get_settings()


@asynccontextmanager
async def lifespan(app: FastAPI):
    init_db()
    if settings.demo_seed_on_start:
        _seed_if_empty()
    yield


def _seed_if_empty() -> None:
    from .demo import seed
    from .matching import auto_match
    from .models import Account
    from .reconcile import run_reconciliation

    with Session(engine) as session:
        if session.exec(select(Account)).first() is not None:
            return
        logger.info("База пуста — наполняю демо-данными")
        result = seed(session)
        auto_match(session, result["account_id"])
        run_reconciliation(session, result["account_id"])
        logger.info("Демо-данные загружены")


app = FastAPI(
    title="Сверка склада и «Честного знака»",
    description="MVP: расхождения между кодами маркировки в ГИС МТ и остатками на WB и Ozon",
    version="0.1.0",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins_list,
    allow_methods=["*"],
    allow_headers=["*"],
)

for module in (accounts, credentials, catalog, reconciliation, dashboard, demo):
    app.include_router(module.router)


@app.get("/api/health")
def health():
    return {"status": "ok"}
