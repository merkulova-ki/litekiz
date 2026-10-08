from fastapi import APIRouter, Depends
from sqlmodel import Session

from .. import demo
from ..db import get_session
from ..matching import auto_match
from ..reconcile import run_reconciliation

router = APIRouter(prefix="/api/demo", tags=["demo"])


@router.post("/seed")
def seed(products_count: int = 18, run_all: bool = True, session: Session = Depends(get_session)):
    result = demo.seed(session, products_count=products_count)
    if run_all:
        result["match"] = auto_match(session, result["account_id"])
        result["reconcile"] = run_reconciliation(session, result["account_id"])
    return result


@router.post("/reset")
def reset(session: Session = Depends(get_session)):
    demo.reset(session)
    return {"status": "ok"}
