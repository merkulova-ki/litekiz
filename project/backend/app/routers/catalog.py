from fastapi import APIRouter, Depends, HTTPException
from sqlmodel import Session, select

from ..db import get_session
from ..matching import auto_match, create_product_from_item, link_manually
from ..models import Cis, CisStatus, PlatformItem, Product, SyncRun
from ..reconcile import latest_stock_by_product
from ..schemas import MatchRequest, PlatformItemOut, ProductOut

router = APIRouter(prefix="/api/catalog", tags=["catalog"])


@router.get("/products", response_model=list[ProductOut])
def list_products(account_id: int, search: str = "", session: Session = Depends(get_session)):
    products = session.exec(select(Product).where(Product.account_id == account_id)).all()
    if search:
        needle = search.lower()
        products = [p for p in products if needle in p.name.lower() or needle in p.gtin]

    stock = latest_stock_by_product(session, account_id)
    result = []
    for product in products:
        items = session.exec(select(PlatformItem).where(PlatformItem.product_id == product.id)).all()
        codes = session.exec(select(Cis).where(Cis.account_id == account_id, Cis.gtin == product.gtin)).all()
        result.append(
            ProductOut(
                id=product.id,
                gtin=product.gtin,
                name=product.name,
                cost_price=product.cost_price,
                stock=stock.get(product.id, 0),
                codes_introduced=len([c for c in codes if c.status == CisStatus.introduced]),
                codes_frozen=len([c for c in codes if c.status in (CisStatus.emitted, CisStatus.applied)]),
                platforms=sorted({i.platform for i in items}),
                items=[PlatformItemOut.model_validate(i, from_attributes=True) for i in items],
            )
        )
    return sorted(result, key=lambda p: p.name)


@router.get("/unmatched", response_model=list[PlatformItemOut])
def list_unmatched(account_id: int, session: Session = Depends(get_session)):
    items = session.exec(
        select(PlatformItem).where(
            PlatformItem.account_id == account_id,
            PlatformItem.product_id.is_(None),
        )
    ).all()
    return [PlatformItemOut.model_validate(i, from_attributes=True) for i in items]


@router.post("/auto-match")
def run_auto_match(account_id: int, session: Session = Depends(get_session)):
    stats = auto_match(session, account_id)
    session.add(SyncRun(account_id=account_id, kind="match", message=str(stats)))
    session.commit()
    return stats


@router.post("/match", response_model=PlatformItemOut)
def match_item(payload: MatchRequest, session: Session = Depends(get_session)):
    try:
        item = link_manually(session, payload.item_id, payload.product_id)
    except ValueError as error:
        raise HTTPException(400, str(error))
    return PlatformItemOut.model_validate(item, from_attributes=True)


@router.post("/items/{item_id}/create-product")
def create_product(item_id: int, session: Session = Depends(get_session)):
    try:
        product = create_product_from_item(session, item_id)
    except ValueError as error:
        raise HTTPException(400, str(error))
    return {"product_id": product.id, "name": product.name, "gtin": product.gtin}
