from collections import defaultdict
from datetime import datetime, timedelta

from sqlmodel import Session, select

from .config import get_settings
from .models import (
    Cis,
    CisStatus,
    Discrepancy,
    DiscrepancyStatus,
    DiscrepancyType,
    OrderRow,
    PlatformItem,
    Product,
    StockSnapshot,
    SyncRun,
)

RETURN_WINDOW_DAYS = 30

TYPE_TITLES = {
    DiscrepancyType.code_without_stock: "Код в обороте, товара на складах нет",
    DiscrepancyType.stock_without_code: "Товар на складе есть, кодов не хватает",
    DiscrepancyType.frozen_codes: "Коды заказаны, но не введены в оборот",
    DiscrepancyType.return_not_reintroduced: "Возврат без повторного ввода в оборот",
}


def latest_stock_by_product(session: Session, account_id: int) -> dict[int, int]:
    items = session.exec(
        select(PlatformItem).where(
            PlatformItem.account_id == account_id,
            PlatformItem.product_id.is_not(None),
        )
    ).all()

    totals: dict[int, int] = defaultdict(int)
    for item in items:
        snapshots = session.exec(
            select(StockSnapshot).where(StockSnapshot.platform_item_id == item.id)
        ).all()
        if not snapshots:
            continue
        last_time = max(s.taken_at for s in snapshots)
        totals[item.product_id] += sum(s.qty for s in snapshots if s.taken_at == last_time)
    return totals


def codes_by_gtin(session: Session, account_id: int) -> dict[str, dict[str, list[Cis]]]:
    codes = session.exec(select(Cis).where(Cis.account_id == account_id)).all()
    grouped: dict[str, dict[str, list[Cis]]] = defaultdict(lambda: defaultdict(list))
    for code in codes:
        grouped[code.gtin][code.status].append(code)
    return grouped


def returns_by_product(session: Session, account_id: int, since: datetime) -> dict[int, int]:
    rows = session.exec(
        select(OrderRow).where(
            OrderRow.account_id == account_id,
            OrderRow.is_return == True,  # noqa: E712
            OrderRow.happened_at >= since,
        )
    ).all()

    totals: dict[int, int] = defaultdict(int)
    for row in rows:
        item = session.get(PlatformItem, row.platform_item_id)
        if item and item.product_id:
            totals[item.product_id] += row.qty
    return totals


def run_reconciliation(session: Session, account_id: int) -> dict:
    started = datetime.utcnow()
    settings = get_settings()
    since = started - timedelta(days=RETURN_WINDOW_DAYS)

    stock = latest_stock_by_product(session, account_id)
    codes = codes_by_gtin(session, account_id)
    returns = returns_by_product(session, account_id, since)

    products = session.exec(select(Product).where(Product.account_id == account_id)).all()

    for old in session.exec(
        select(Discrepancy).where(
            Discrepancy.account_id == account_id,
            Discrepancy.status == DiscrepancyStatus.new,
        )
    ).all():
        session.delete(old)
    session.flush()

    in_progress = {
        (d.type, d.product_id): d
        for d in session.exec(
            select(Discrepancy).where(
                Discrepancy.account_id == account_id,
                Discrepancy.status == DiscrepancyStatus.in_progress,
            )
        ).all()
    }

    found: list[Discrepancy] = []

    def add(product: Product, dtype: DiscrepancyType, qty: int, amount: float, comment: str) -> None:
        if qty <= 0:
            return
        existing = in_progress.get((dtype, product.id))
        if existing is not None:
            existing.qty = qty
            existing.amount = round(amount, 2)
            existing.comment = comment
            existing.detected_at = started
            session.add(existing)
            return
        item = Discrepancy(
            account_id=account_id,
            product_id=product.id,
            type=dtype,
            qty=qty,
            amount=round(amount, 2),
            comment=comment,
            detected_at=started,
        )
        session.add(item)
        found.append(item)

    for product in products:
        by_status = codes.get(product.gtin, {})
        introduced = len(by_status.get(CisStatus.introduced, []))
        frozen = len(by_status.get(CisStatus.emitted, [])) + len(by_status.get(CisStatus.applied, []))
        retired_recent = len(
            [c for c in by_status.get(CisStatus.retired, []) if c.status_changed_at >= since]
        )
        reintroduced_recent = len(
            [c for c in by_status.get(CisStatus.introduced, []) if c.status_changed_at >= since]
        )
        on_stock = stock.get(product.id, 0)
        returned = returns.get(product.id, 0)

        add(
            product,
            DiscrepancyType.code_without_stock,
            introduced - on_stock,
            (introduced - on_stock) * product.cost_price,
            f"В обороте {introduced} кодов, на складах {on_stock} шт. "
            "Вероятна продажа без вывода из оборота — это нарушение.",
        )

        add(
            product,
            DiscrepancyType.stock_without_code,
            on_stock - introduced,
            (on_stock - introduced) * product.cost_price,
            f"На складах {on_stock} шт, в обороте {introduced} кодов. "
            "Часть товара нельзя отгрузить — нужен заказ кодов.",
        )

        add(
            product,
            DiscrepancyType.frozen_codes,
            frozen,
            frozen * settings.code_price,
            f"{frozen} кодов заказано, но не введено в оборот. "
            f"Оценка по цене кода {settings.code_price} ₽.",
        )

        not_back = min(returned, retired_recent) - reintroduced_recent
        add(
            product,
            DiscrepancyType.return_not_reintroduced,
            not_back,
            max(not_back, 0) * product.cost_price,
            f"За {RETURN_WINDOW_DAYS} дней возвратов {returned}, повторно введено в оборот "
            f"{reintroduced_recent}. Товар нельзя продать повторно, пока код не введён.",
        )

    run = SyncRun(
        account_id=account_id,
        kind="reconcile",
        message=f"товаров: {len(products)}, новых расхождений: {len(found)}",
        duration_ms=int((datetime.utcnow() - started).total_seconds() * 1000),
    )
    session.add(run)
    session.commit()

    return {
        "products_checked": len(products),
        "discrepancies_found": len(found),
        "total_amount": round(sum(d.amount for d in found), 2),
        "as_of": started.isoformat(timespec="seconds"),
    }
