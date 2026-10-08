from fastapi import APIRouter, Depends, HTTPException
from sqlmodel import Session, select

from ..db import get_session
from ..models import Discrepancy, DiscrepancyStatus, DiscrepancyType, Product
from ..reconcile import TYPE_TITLES, run_reconciliation
from ..schemas import DiscrepancyOut, DiscrepancyPatch

router = APIRouter(prefix="/api/reconciliation", tags=["reconciliation"])


def to_out(session: Session, item: Discrepancy) -> DiscrepancyOut:
    product = session.get(Product, item.product_id) if item.product_id else None
    return DiscrepancyOut(
        id=item.id,
        type=item.type,
        type_title=TYPE_TITLES[item.type],
        product_id=item.product_id,
        product_name=product.name if product else "—",
        gtin=product.gtin if product else "",
        qty=item.qty,
        amount=item.amount,
        comment=item.comment,
        status=item.status,
        detected_at=item.detected_at,
    )


@router.post("/run")
def run(account_id: int, session: Session = Depends(get_session)):
    return run_reconciliation(session, account_id)


@router.get("/discrepancies", response_model=list[DiscrepancyOut])
def list_discrepancies(
    account_id: int,
    type: DiscrepancyType | None = None,
    status: DiscrepancyStatus | None = None,
    session: Session = Depends(get_session),
):
    query = select(Discrepancy).where(Discrepancy.account_id == account_id)
    if type:
        query = query.where(Discrepancy.type == type)
    if status:
        query = query.where(Discrepancy.status == status)
    items = session.exec(query).all()
    items.sort(key=lambda d: d.amount, reverse=True)
    return [to_out(session, item) for item in items]


@router.patch("/discrepancies/{discrepancy_id}", response_model=DiscrepancyOut)
def update_status(discrepancy_id: int, payload: DiscrepancyPatch, session: Session = Depends(get_session)):
    item = session.get(Discrepancy, discrepancy_id)
    if item is None:
        raise HTTPException(404, "Расхождение не найдено")
    item.status = payload.status
    session.add(item)
    session.commit()
    session.refresh(item)
    return to_out(session, item)
