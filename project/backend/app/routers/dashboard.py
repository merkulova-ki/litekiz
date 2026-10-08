from fastapi import APIRouter, Depends
from sqlmodel import Session, select

from ..db import get_session
from ..models import (
    Account,
    Cis,
    CisStatus,
    Credential,
    Discrepancy,
    DiscrepancyStatus,
    PlatformItem,
    Product,
    SyncRun,
)
from ..reconcile import TYPE_TITLES, latest_stock_by_product
from ..schemas import AccountOut, DashboardSummary
from .credentials import to_out as credential_out

router = APIRouter(prefix="/api/dashboard", tags=["dashboard"])


@router.get("/summary", response_model=DashboardSummary)
def summary(account_id: int | None = None, session: Session = Depends(get_session)):
    account = session.get(Account, account_id) if account_id else session.exec(select(Account)).first()
    if account is None:
        return DashboardSummary(
            account=None,
            as_of=None,
            products_total=0,
            items_unmatched=0,
            stock_total=0,
            codes_introduced=0,
            discrepancies_open=0,
            amount_at_risk=0.0,
            by_type=[],
            credentials_expiring=[],
        )

    products = session.exec(select(Product).where(Product.account_id == account.id)).all()
    unmatched = session.exec(
        select(PlatformItem).where(
            PlatformItem.account_id == account.id,
            PlatformItem.product_id.is_(None),
        )
    ).all()
    codes = session.exec(
        select(Cis).where(Cis.account_id == account.id, Cis.status == CisStatus.introduced)
    ).all()
    stock = latest_stock_by_product(session, account.id)

    open_items = session.exec(
        select(Discrepancy).where(
            Discrepancy.account_id == account.id,
            Discrepancy.status.in_([DiscrepancyStatus.new, DiscrepancyStatus.in_progress]),
        )
    ).all()

    by_type = []
    for dtype, title in TYPE_TITLES.items():
        group = [d for d in open_items if d.type == dtype]
        by_type.append(
            {
                "type": dtype.value,
                "title": title,
                "count": len(group),
                "qty": sum(d.qty for d in group),
                "amount": round(sum(d.amount for d in group), 2),
            }
        )

    last_run = session.exec(
        select(SyncRun).where(SyncRun.account_id == account.id, SyncRun.kind == "reconcile")
    ).all()
    as_of = max((r.started_at for r in last_run), default=None)

    credentials = session.exec(select(Credential).where(Credential.account_id == account.id)).all()
    expiring = [credential_out(c) for c in credentials]
    expiring.sort(key=lambda c: (c.days_left is None, c.days_left))

    return DashboardSummary(
        account=AccountOut(id=account.id, name=account.name, inn=account.inn),
        as_of=as_of,
        products_total=len(products),
        items_unmatched=len(unmatched),
        stock_total=sum(stock.values()),
        codes_introduced=len(codes),
        discrepancies_open=len(open_items),
        amount_at_risk=round(sum(d.amount for d in open_items), 2),
        by_type=by_type,
        credentials_expiring=expiring,
    )
